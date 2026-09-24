import type { SupabaseClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'
import { ERRORES_PLAN_NO_APLICA } from '@/lib/planes'

interface GenerarCobroSesionInput {
  admin: SupabaseClient
  colegioId: string
  alumnoId: string
  profesionalId: string
  fechaSesion: string
  tarifaId?: string | null
  montoOverride?: number | null
  descuentoManual?: number
  agendaSesionId?: string | null
  sesionTerapeuticaId?: string | null
  userId?: string | null
}

export interface CobroSesionGenerado {
  id: string
  monto: number
  monto_final: number
  monto_cubierto_plan: number
  estado: string
  paquete_vendido_id: string | null
  [campo: string]: unknown
}

interface GenerarCobroSesionResult {
  cobro: CobroSesionGenerado
  /** La atención fue cubierta por un plan prepagado (no genera ingreso: el ingreso fue el pago del plan). */
  paqueteAplicado: boolean
  planId: string | null
  /** Ya existía un cobro vigente para esta atención (reintento/doble clic): no se creó otro. */
  repetido: boolean
}

const COBRO_SELECT = '*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios!profesional_id(id, nombre, apellido)'

/**
 * Crea el cobro de una atención. Si el paciente tiene un plan prepagado que incluye
 * esa prestación, vigente, pagado y con sesiones disponibles, la atención CONSUME el plan
 * (función SQL atómica consumir_sesion_plan): el cobro queda con
 *   monto = valor de la prestación, monto_cubierto_plan = ese valor, monto_final = 0.
 * No se registra ningún ingreso por el consumo: el ingreso ocurrió al pagar el plan.
 *
 * Solo se intenta usar un plan cuando la atención tiene una prestación (tarifa) definida:
 * sin prestación no se puede verificar que el plan la incluya.
 */
export async function generarCobroSesion(input: GenerarCobroSesionInput): Promise<GenerarCobroSesionResult> {
  const {
    admin, colegioId, alumnoId, profesionalId, fechaSesion, tarifaId, montoOverride,
    descuentoManual, agendaSesionId, sesionTerapeuticaId, userId,
  } = input

  // Aislamiento multi-tenant: el paciente y el profesional deben ser de este centro.
  const [{ data: alumno }, { data: profesional }] = await Promise.all([
    admin.from('alumnos').select('id').eq('id', alumnoId).eq('colegio_id', colegioId).maybeSingle(),
    admin.from('usuarios').select('id').eq('id', profesionalId).eq('colegio_id', colegioId).maybeSingle(),
  ])
  if (!alumno) throw new Error('El paciente no existe en este centro')
  if (!profesional) throw new Error('El profesional no existe en este centro')

  let monto = montoOverride || 0
  let descripcion = 'Sesión terapéutica'

  if (tarifaId) {
    const { data: tarifa } = await admin.from('tarifas_sesion').select('nombre, monto').eq('id', tarifaId).eq('colegio_id', colegioId).single()
    if (!tarifa) throw new Error('La prestación indicada no existe en este centro')
    const t = tarifa as { nombre: string; monto: number }
    monto = montoOverride || t.monto
    descripcion = `${t.nombre} — ${new Date(fechaSesion + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  if (!monto) throw new Error('Debe indicar monto o tarifa')

  const descuento = Math.min(Math.max(descuentoManual || 0, 0), monto)
  const montoFinal = monto - descuento

  const { data: familia } = await admin.from('familias').select('id, email, nombre_apoderado').eq('alumno_id', alumnoId).eq('colegio_id', colegioId).limit(1).single()

  const { data: creado, error } = await admin.from('cobros_sesion').insert({
    colegio_id: colegioId,
    alumno_id: alumnoId,
    profesional_id: profesionalId,
    tarifa_id: tarifaId || null,
    familia_id: (familia as { id: string } | null)?.id || null,
    agenda_sesion_id: agendaSesionId || null,
    sesion_terapeutica_id: sesionTerapeuticaId || null,
    fecha_sesion: fechaSesion,
    descripcion,
    monto,
    descuento,
    monto_final: montoFinal,
    estado: 'pendiente',
  }).select('id').single()

  if (error) {
    // Índice único parcial: una atención de agenda no puede tener dos cobros vigentes.
    if (error.code === '23505' && agendaSesionId) {
      const { data: existente } = await admin.from('cobros_sesion').select(COBRO_SELECT)
        .eq('agenda_sesion_id', agendaSesionId).neq('estado', 'anulado').maybeSingle()
      if (existente) {
        const e = existente as unknown as CobroSesionGenerado
        return { cobro: e, paqueteAplicado: !!e.paquete_vendido_id, planId: e.paquete_vendido_id, repetido: true }
      }
    }
    throw new Error(error.message)
  }

  const cobroId = (creado as { id: string }).id

  // Intentar consumir un plan (más próximo a vencer primero). Cada intento es atómico y
  // revalida todo bajo bloqueo; si un plan ya no sirve (agotado, vencido...) se prueba el siguiente.
  let planId: string | null = null
  if (tarifaId && montoFinal > 0) {
    const { data: elegibles } = await admin.rpc('planes_elegibles', {
      p_colegio: colegioId, p_alumno: alumnoId, p_tarifa: tarifaId, p_fecha: fechaSesion,
    })
    for (const el of (elegibles ?? []) as { id: string }[]) {
      const { error: rpcError } = await admin.rpc('consumir_sesion_plan', {
        p_colegio: colegioId, p_plan: el.id, p_cobro_sesion: cobroId, p_user: userId ?? null, p_unidades: 1,
      })
      if (!rpcError) { planId = el.id; break }
      if (!ERRORES_PLAN_NO_APLICA.has(rpcError.message)) {
        console.error('Error consumiendo plan (se deja el cobro normal):', rpcError.message)
        break
      }
    }
  }

  const { data: cobro } = await admin.from('cobros_sesion').select(COBRO_SELECT).eq('id', cobroId).single()
  const resultado = cobro as unknown as CobroSesionGenerado

  // Avisar a la familia solo si queda saldo por pagar (si lo cubrió un plan no hay nada que pagar).
  const email = (familia as { email?: string } | null)?.email
  if (!planId && email && resultado.monto_final > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'
    enviarEmail({
      to: email,
      subject: `Cobro pendiente — ${descripcion}`,
      html: `<p>Hola ${(familia as { nombre_apoderado?: string } | null)?.nombre_apoderado ?? ''},</p><p>Se generó un cobro de <strong>$${resultado.monto_final.toLocaleString('es-CL')}</strong> por: ${descripcion}.</p><p><a href="${baseUrl}/portal/pagos">Pagar ahora desde el portal →</a></p>`,
    }).catch(err => console.error('Error enviando aviso de cobro:', err))
  }

  return { cobro: resultado, paqueteAplicado: !!planId, planId, repetido: false }
}
