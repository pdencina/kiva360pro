import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'
import { generarCobroSesion } from '@/lib/generar-cobro-sesion'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/cron/sesiones — Vercel Cron siempre invoca por GET.
// Ejecutar diariamente.
// 1. Auto-completa sesiones agendadas cuya fecha ya pasó y siguen
//    'programada'/'confirmada' (nadie las marcó manualmente), generando
//    el cobro correspondiente — automatiza el paso "atención" para el
//    caso normal (la sesión ocurrió como estaba agendada). Un
//    administrativo puede corregir después a 'no_asistio'/'cancelada'
//    si no fue así.
// 2. Envía un único recordatorio de pago para cobros_sesion pendientes
//    de más de 3 días.
async function ejecutarCronSesiones(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado en el servidor' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = getAdmin()
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  const resultados = { sesiones_completadas: 0, cobros_generados: 0, recordatorios_enviados: 0 }

  // =====================
  // 1. AUTO-COMPLETAR SESIONES VENCIDAS
  // =====================
  const { data: sesionesVencidas } = await admin
    .from('agenda_sesiones')
    .select('id, colegio_id, tipo_sesion, alumno_id, profesional_id, fecha')
    .in('estado', ['programada', 'confirmada'])
    .lt('fecha', hoyStr)

  for (const sesion of (sesionesVencidas ?? [])) {
    const s = sesion as any

    await admin.from('agenda_sesiones').update({ estado: 'completada' }).eq('id', s.id)
    resultados.sesiones_completadas++

    const { data: yaExiste } = await admin.from('cobros_sesion').select('id').eq('agenda_sesion_id', s.id).maybeSingle()
    if (yaExiste) continue

    const { data: tarifasAplicables } = await admin
      .from('tarifas_sesion')
      .select('id')
      .eq('colegio_id', s.colegio_id)
      .eq('tipo_sesion', s.tipo_sesion)
      .eq('activo', true)

    if (tarifasAplicables && tarifasAplicables.length === 1) {
      try {
        const { cobro } = await generarCobroSesion({
          admin, colegioId: s.colegio_id, alumnoId: s.alumno_id, profesionalId: s.profesional_id,
          fechaSesion: s.fecha, tarifaId: (tarifasAplicables[0] as any).id, agendaSesionId: s.id,
        })
        resultados.cobros_generados++
        await registrarAuditoriaFinanciera({
          admin, colegioId: s.colegio_id, usuarioId: null,
          accion: 'cobro_generado', entidad: 'cobros_sesion', entidadId: cobro.id,
          valorNuevo: { origen: 'cron_auto_completar', agenda_sesion_id: s.id, monto_final: cobro.monto_final },
        })
      } catch (err) {
        console.error('Error generando cobro automático para sesión', s.id, err)
      }
    }
  }

  // =====================
  // 2. RECORDATORIO DE PAGO PARA COBROS_SESION (una vez, a los 3+ días)
  // =====================
  const tresDiasAtras = new Date(hoy)
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
  const tresDiasAtrasStr = tresDiasAtras.toISOString().split('T')[0]

  const { data: sesionesPendientes } = await admin
    .from('cobros_sesion')
    .select('id, descripcion, monto_final, fecha_sesion, familia:familias(email, nombre_apoderado)')
    .eq('estado', 'pendiente')
    .lte('fecha_sesion', tresDiasAtrasStr)
    .is('recordatorio_enviado_at', null)

  for (const cs of (sesionesPendientes ?? [])) {
    const c = cs as any
    const email = c.familia?.email
    if (!email) continue

    try {
      await enviarEmail({
        to: email,
        subject: `Recordatorio de pago — ${c.descripcion}`,
        html: `<p>Hola ${c.familia?.nombre_apoderado ?? ''},</p><p>Tienes un pago pendiente de <strong>$${c.monto_final.toLocaleString('es-CL')}</strong> por: ${c.descripcion}.</p><p>Puedes pagarlo desde el portal de pagos.</p>`,
      })
      await admin.from('cobros_sesion').update({ recordatorio_enviado_at: new Date().toISOString() }).eq('id', c.id)
      resultados.recordatorios_enviados++
    } catch (err) {
      console.error('Error enviando recordatorio de sesión:', err)
    }
  }

  return NextResponse.json({ ok: true, fecha: hoyStr, resultados })
}

export async function GET(request: NextRequest) { return ejecutarCronSesiones(request) }
export async function POST(request: NextRequest) { return ejecutarCronSesiones(request) }
