import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { reservaPublicaLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: listar solicitudes pendientes (uso interno, requiere sesión con acceso a finanzas/agenda)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'tutor'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? 'pendiente'

  let query = admin
    .from('reservas_publicas')
    .select('*, alumno:alumnos(id, nombre, apellido), profesional:usuarios!profesional_id(id, nombre, apellido)')
    .eq('colegio_id', usuario.colegio_id)
    .eq('estado', estado)
    .order('fecha_solicitada', { ascending: true })

  // Tutor solo ve sus propias solicitudes
  if (usuario.rol === 'tutor') query = query.eq('profesional_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: crear una solicitud de reserva — PÚBLICO, sin autenticación.
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rl = reservaPublicaLimiter.check(identifier)
  if (!rl.success) return rateLimitResponse(rl)

  const body = await request.json()
  const {
    colegio_id, nombre_solicitante, email, telefono, alumno_id,
    profesional_id, tipo_sesion, fecha_solicitada, hora_solicitada, motivo,
  } = body

  if (!colegio_id || !nombre_solicitante || !email || !profesional_id || !fecha_solicitada || !hora_solicitada) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const admin = getAdmin()

  // Verificar que el colegio tenga el módulo de salud/reserva contratado
  const { data: colegio } = await admin.from('colegios').select('modulos_activos').eq('id', colegio_id).single()
  const modulos: string[] = (colegio as any)?.modulos_activos ?? []
  if (!modulos.includes('salud')) {
    return NextResponse.json({ error: 'Este centro no tiene habilitada la reserva online' }, { status: 403 })
  }

  // Verificar que el slot siga disponible (evita condiciones de carrera básicas)
  const { data: yaOcupado } = await admin
    .from('reservas_publicas')
    .select('id')
    .eq('colegio_id', colegio_id)
    .eq('profesional_id', profesional_id)
    .eq('fecha_solicitada', fecha_solicitada)
    .eq('hora_solicitada', hora_solicitada)
    .eq('estado', 'pendiente')
    .maybeSingle()

  if (yaOcupado) {
    return NextResponse.json({ error: 'Ese horario ya fue solicitado por otra persona. Elige otro.' }, { status: 409 })
  }

  const { data, error } = await admin.from('reservas_publicas').insert({
    colegio_id,
    nombre_solicitante,
    email,
    telefono: telefono || null,
    alumno_id: alumno_id || null,
    profesional_id,
    tipo_sesion: tipo_sesion || 'individual',
    fecha_solicitada,
    hora_solicitada,
    motivo: motivo || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Avisar al centro por email si está configurado un correo tributario/de contacto
  try {
    const { data: colegioInfo } = await admin.from('colegios').select('email_tributario, nombre').eq('id', colegio_id).single()
    const destinatario = (colegioInfo as any)?.email_tributario
    if (destinatario) {
      const { enviarEmail } = await import('@/lib/email')
      await enviarEmail({
        to: destinatario,
        subject: `Nueva solicitud de reserva — ${nombre_solicitante}`,
        html: `<p>${nombre_solicitante} (${email}${telefono ? ', ' + telefono : ''}) solicitó hora para el ${fecha_solicitada} a las ${hora_solicitada}.</p><p>Revísala en Kiva360 → Agenda → Solicitudes.</p>`,
      })
    }
  } catch (e) {
    console.error('No se pudo enviar aviso de nueva reserva:', e)
  }

  return NextResponse.json(data, { status: 201 })
}
