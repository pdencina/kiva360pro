import type { SupabaseClient } from '@supabase/supabase-js'

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
}

interface GenerarCobroSesionResult {
  cobro: any
  paqueteAplicado: boolean
}

/**
 * Crea un cobro_sesion, aplicando automáticamente el descuento del paquete
 * prepagado vigente del alumno (si tiene uno con cupo disponible) e
 * incrementando su contador de sesiones usadas. Se usa tanto desde el
 * registro manual (Cobros por sesión → Nuevo cobro) como desde la
 * automatización de Agenda al marcar una sesión como completada.
 */
export async function generarCobroSesion(input: GenerarCobroSesionInput): Promise<GenerarCobroSesionResult> {
  const { admin, colegioId, alumnoId, profesionalId, fechaSesion, tarifaId, montoOverride, descuentoManual, agendaSesionId, sesionTerapeuticaId } = input

  let monto = montoOverride || 0
  let descripcion = 'Sesión terapéutica'

  if (tarifaId) {
    const { data: tarifa } = await admin.from('tarifas_sesion').select('*').eq('id', tarifaId).single()
    if (tarifa) {
      monto = montoOverride || (tarifa as any).monto
      descripcion = `${(tarifa as any).nombre} — ${new Date(fechaSesion + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
  }

  if (!monto) {
    throw new Error('Debe indicar monto o tarifa')
  }

  // Descuento por paquete prepagado vigente (más antiguo primero, el que tenga cupo)
  let descuentoFinal = descuentoManual || 0
  let paqueteVendidoId: string | null = null
  let sesionesUsadasActuales = 0

  const { data: packsActivos } = await admin
    .from('paquetes_vendidos')
    .select('id, sesiones_total, sesiones_usadas, paquete:paquetes_sesion(descuento_pct)')
    .eq('alumno_id', alumnoId)
    .eq('activo', true)
    .eq('estado_pago', 'pagado')
    .order('created_at', { ascending: true })

  const packConCupo = ((packsActivos as any[]) ?? []).find(p => p.sesiones_usadas < p.sesiones_total)
  if (packConCupo) {
    descuentoFinal = Math.round(monto * ((packConCupo.paquete?.descuento_pct || 100) / 100))
    paqueteVendidoId = packConCupo.id
    sesionesUsadasActuales = packConCupo.sesiones_usadas
  }

  const montoFinal = Math.max(0, monto - descuentoFinal)

  const { data: familia } = await admin.from('familias').select('id').eq('alumno_id', alumnoId).limit(1).single()

  const { data: cobro, error } = await admin.from('cobros_sesion').insert({
    colegio_id: colegioId,
    alumno_id: alumnoId,
    profesional_id: profesionalId,
    tarifa_id: tarifaId || null,
    familia_id: (familia as any)?.id || null,
    agenda_sesion_id: agendaSesionId || null,
    sesion_terapeutica_id: sesionTerapeuticaId || null,
    fecha_sesion: fechaSesion,
    descripcion,
    monto,
    descuento: descuentoFinal,
    monto_final: montoFinal,
    estado: paqueteVendidoId ? 'pagado' : 'pendiente',
  }).select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios!profesional_id(id, nombre, apellido)`).single()

  if (error) throw new Error(error.message)

  if (paqueteVendidoId) {
    await admin.from('paquetes_vendidos')
      .update({ sesiones_usadas: sesionesUsadasActuales + 1 })
      .eq('id', paqueteVendidoId)
  }

  return { cobro, paqueteAplicado: !!paqueteVendidoId }
}
