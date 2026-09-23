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
  const { admin, colegioId, alumnoId, familiaId, cobroId, cobroSesionId, montoTotal, descripcion, receptorNombre, receptorEmail } = input

  if (!cobroId && !cobroSesionId) return

  let dupQuery = admin.from('documentos_tributarios').select('id').neq('estado', 'anulado')
  dupQuery = cobroId ? dupQuery.eq('cobro_id', cobroId) : dupQuery.eq('cobro_sesion_id', cobroSesionId!)
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
    valorNuevo: { tipo: 'boleta', monto_total: montoTotal, origen: cobroId ? 'cobro_mensualidad' : 'cobro_sesion' },
  })
}
