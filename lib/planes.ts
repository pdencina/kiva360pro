export type EstadoPlan = 'activo' | 'agotado' | 'vencido' | 'cancelado'

export interface PlanCounters {
  sesiones_usadas: number
  sesiones_total: number
  fecha_vencimiento: string | null
  cancelado_at: string | null
}

export const ESTADO_PLAN_LABEL: Record<EstadoPlan, string> = {
  activo: 'Activo', agotado: 'Agotado', vencido: 'Vencido', cancelado: 'Cancelado',
}

export const ESTADO_PLAN_TAG: Record<EstadoPlan, string> = {
  activo: 'tag-ok', agotado: 'tag-blue', vencido: 'tag-mora', cancelado: 'tag-gray',
}

function hoyChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

/**
 * Estado derivado del plan. Misma regla que public.plan_estado en la base de datos:
 * cancelado > agotado > vencido > activo. (Un plan totalmente usado es "agotado"
 * aunque su fecha ya haya pasado.) La validación autoritativa al consumir la hace
 * la función SQL consumir_sesion_plan; esto es solo para mostrar.
 */
export function estadoPlan(p: PlanCounters, hoy: string = hoyChile()): EstadoPlan {
  if (p.cancelado_at) return 'cancelado'
  if (p.sesiones_usadas >= p.sesiones_total) return 'agotado'
  if (p.fecha_vencimiento && p.fecha_vencimiento < hoy) return 'vencido'
  return 'activo'
}

export function sesionesDisponibles(p: Pick<PlanCounters, 'sesiones_usadas' | 'sesiones_total'>): number {
  return Math.max(p.sesiones_total - p.sesiones_usadas, 0)
}

export interface PlanRow extends PlanCounters {
  id: string
  precio_final: number | null
  monto_pagado: number
  [campo: string]: unknown
}

/** Agrega al plan vendido su estado derivado, sesiones disponibles y saldo pendiente. */
export function enriquecerPlan<T extends PlanRow>(p: T) {
  return {
    ...p,
    estado_plan: estadoPlan(p),
    disponibles: sesionesDisponibles(p),
    saldo: p.cancelado_at ? 0 : Math.max((p.precio_final ?? 0) - p.monto_pagado, 0),
  }
}

export interface PrestacionValor {
  monto: number
  cantidad: number | null
}

/**
 * Valor normal del plan a precio de lista. Solo es calculable si se conoce cuántas
 * sesiones de cada prestación incluye el plan: una sola prestación (todas las sesiones
 * son de ella) o todas con cantidad explícita. Si no, devuelve null (no se inventa).
 */
export function calcularValorOriginal(prestaciones: PrestacionValor[], cantidadTotal: number): number | null {
  if (prestaciones.length === 0) return null
  if (prestaciones.length === 1) return prestaciones[0].monto * cantidadTotal
  if (prestaciones.every(p => p.cantidad !== null)) {
    return prestaciones.reduce((a, p) => a + p.monto * (p.cantidad as number), 0)
  }
  return null
}

export function calcularDescuentoPct(valorOriginal: number | null, precioFinal: number): number {
  if (!valorOriginal || valorOriginal <= 0) return 0
  const pct = (1 - precioFinal / valorOriginal) * 100
  return Math.max(0, Math.round(pct * 100) / 100)
}

const MENSAJES_ERROR: Record<string, string> = {
  plan_no_encontrado: 'El plan no existe o no pertenece a este centro.',
  paciente_no_encontrado: 'El paciente no existe o no pertenece a este centro.',
  paciente_sin_familia: 'El paciente no tiene una familia registrada.',
  plan_sin_prestaciones: 'El plan no tiene prestaciones asignadas: edítalo antes de venderlo.',
  medio_pago_requerido: 'Indica el medio de pago.',
  vigencia_invalida: 'La fecha de vencimiento no puede ser anterior al inicio.',
  monto_invalido: 'El monto debe ser mayor a 0.',
  monto_excede_saldo: 'El monto excede el saldo pendiente del plan.',
  plan_cancelado: 'El plan está cancelado.',
  plan_ya_cancelado: 'El plan ya estaba cancelado.',
  plan_no_pagado: 'El plan aún no está pagado: no puede consumir sesiones.',
  plan_vencido: 'La atención es posterior a la vigencia del plan.',
  plan_agotado: 'El plan no tiene sesiones disponibles.',
  plan_de_otro_paciente: 'El plan pertenece a otro paciente.',
  prestacion_no_permitida: 'La prestación no está incluida en este plan.',
  prestacion_agotada: 'Se agotó el cupo de esta prestación dentro del plan.',
  prestacion_desconocida: 'La atención no tiene una prestación definida.',
  atencion_no_encontrada: 'No se encontró la atención.',
  atencion_no_pendiente: 'La atención ya no está pendiente de cobro.',
  sesion_ya_consumida: 'Esta atención ya consumió (o consumió y revirtió) un plan.',
  consumo_no_encontrado: 'No se encontró el consumo.',
  consumo_ya_revertido: 'Este consumo ya fue revertido.',
  unidades_invalidas: 'Las unidades a consumir deben ser al menos 1.',
}

/** Traduce el código de error de las funciones SQL de planes a un mensaje para el usuario. */
export function mensajeErrorPlan(message: string | undefined | null): string {
  if (!message) return 'Error inesperado'
  return MENSAJES_ERROR[message] ?? message
}

/** ¿El error es una regla de negocio conocida (no un fallo técnico)? */
export function esErrorNegocioPlan(message: string | undefined | null): boolean {
  return !!message && message in MENSAJES_ERROR
}

/** Errores que indican "este plan no sirve para esta atención": se prueba el siguiente plan. */
export const ERRORES_PLAN_NO_APLICA = new Set([
  'plan_agotado', 'prestacion_agotada', 'plan_vencido', 'plan_cancelado', 'plan_no_pagado', 'prestacion_no_permitida',
])

// ---- Tipos compartidos por la interfaz de planes ----

export interface PrestacionPlan {
  id: string
  tarifa_id: string
  cantidad: number | null
  tarifa: { id: string; nombre: string; monto: number } | null
}

export interface PaqueteCatalogo {
  id: string
  nombre: string
  cantidad: number
  precio_total: number
  descuento_pct: number
  valor_original: number | null
  vigencia_dias: number | null
  prestaciones: PrestacionPlan[]
}

export interface PlanVendidoLista extends PlanRow {
  alumno: { id: string; nombre: string; apellido: string; curso: string } | null
  paquete: { nombre: string } | null
  estado_plan: EstadoPlan
  disponibles: number
  saldo: number
  estado_pago: string
  fecha_inicio: string
  created_at: string
}

export const ESTADO_PAGO_PLAN_LABEL: Record<string, string> = {
  pendiente: 'Pago pendiente', parcial: 'Pago parcial', pagado: 'Pagado',
}

export function formatFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  return new Date(fecha.length === 10 ? fecha + 'T12:00' : fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
