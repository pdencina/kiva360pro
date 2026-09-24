import type { SupabaseClient } from '@supabase/supabase-js'
import { getBillingProvider } from '@/lib/billing/provider'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

interface GenerarDocumentoPendienteInput {
  admin: SupabaseClient
  colegioId: string
  alumnoId: string
  familiaId: string | null
  cobroId?: string | null
  cobroSesionId?: string | null
  paqueteVendidoId?: string | null
  montoTotal: number
  descripcion: string
  receptorNombre: string
  receptorEmail: string | null
}

/**
 * Al confirmarse un pago, deja lista la solicitud del documento tributario
 * (boleta, afecta a IVA por defecto) para que solo falte completarla con el
 * folio real una vez emitida en el proveedor. No decide "factura" ni
 * "exento" automáticamente — esa es una clasificación tributaria que debe
 * quedar a criterio de administración/contador (ver Finanzas > Documentos),
 * esto solo evita el paso de "acordarse de generarla".
 */
export async function generarDocumentoPendiente(input: GenerarDocumentoPendienteInput): Promise<void> {
  const { admin, colegioId, alumnoId, familiaId, cobroId, cobroSesionId, paqueteVendidoId, montoTotal, descripcion, receptorNombre, receptorEmail } = input

  if (!cobroId && !cobroSesionId && !paqueteVendidoId) return
  if (montoTotal <= 0) return

  let dupQuery = admin.from('documentos_tributarios').select('id').neq('estado', 'anulado')
  dupQuery = cobroId
    ? dupQuery.eq('cobro_id', cobroId)
    : cobroSesionId ? dupQuery.eq('cobro_sesion_id', cobroSesionId) : dupQuery.eq('paquete_vendido_id', paqueteVendidoId!)
  const { data: existente } = await dupQuery.maybeSingle()
  if (existente) return

  const { data: colegio } = await admin.from('colegios').select('proveedor_facturacion').eq('id', colegioId).single()
  const provider = getBillingProvider((colegio as any)?.proveedor_facturacion ?? null)

  const resultado = await provider.emitDocument({
    tipo: 'boleta',
    colegioId,
    receptor: { razonSocial: receptorNombre, email: receptorEmail },
    items: [{ descripcion, monto: montoTotal }],
    montoTotal,
  })

  const montoNeto = Math.round(montoTotal / 1.19)
  const montoIva = montoTotal - montoNeto

  const { data: documento, error } = await admin.from('documentos_tributarios').insert({
    colegio_id: colegioId,
    alumno_id: alumnoId,
    familia_id: familiaId,
    cobro_id: cobroId || null,
    cobro_sesion_id: cobroSesionId || null,
    paquete_vendido_id: paqueteVendidoId || null,
    tipo: 'boleta',
    folio: resultado.folio,
    monto_neto: montoNeto,
    monto_iva: montoIva,
    monto_total: montoTotal,
    afecto_iva: true,
    proveedor: provider.nombre,
    proveedor_doc_id: resultado.proveedorDocId,
    estado: resultado.estado,
  }).select('id').single()

  if (error || !documento) return

  await registrarAuditoriaFinanciera({
    admin, colegioId, usuarioId: null,
    accion: 'documento_generado_automatico', entidad: 'documentos_tributarios', entidadId: (documento as any).id,
    valorNuevo: { tipo: 'boleta', monto_total: montoTotal, origen: cobroId ? 'cobro_mensualidad' : cobroSesionId ? 'cobro_sesion' : 'plan' },
  })
}

/**
 * Deja lista la solicitud de documento de un plan cuando queda totalmente pagado.
 * Idempotente (generarDocumentoPendiente no duplica). Nunca lanza: un problema
 * al preparar el documento no debe deshacer un pago ya registrado.
 */
export async function generarDocumentoPlanPagado(admin: SupabaseClient, colegioId: string, planId: string): Promise<void> {
  try {
    const { data } = await admin.from('paquetes_vendidos')
      .select('alumno_id, familia_id, monto_pagado, precio_final, estado_pago, cancelado_at, paquete:paquetes_sesion(nombre), familia:familias(nombre_apoderado, apellido_apoderado, email)')
      .eq('id', planId).eq('colegio_id', colegioId).single()
    const pv = data as unknown as {
      alumno_id: string; familia_id: string | null; monto_pagado: number; estado_pago: string; cancelado_at: string | null
      paquete: { nombre: string } | null
      familia: { nombre_apoderado: string | null; apellido_apoderado: string | null; email: string | null } | null
    } | null
    if (!pv || pv.estado_pago !== 'pagado' || pv.cancelado_at) return

    await generarDocumentoPendiente({
      admin, colegioId, alumnoId: pv.alumno_id, familiaId: pv.familia_id, paqueteVendidoId: planId,
      montoTotal: pv.monto_pagado, descripcion: `Plan: ${pv.paquete?.nombre ?? 'Plan de sesiones'}`,
      receptorNombre: `${pv.familia?.nombre_apoderado ?? ''} ${pv.familia?.apellido_apoderado ?? ''}`.trim() || 'Apoderado',
      receptorEmail: pv.familia?.email ?? null,
    })
  } catch (err) {
    console.error('Error generando documento del plan:', err)
  }
}
