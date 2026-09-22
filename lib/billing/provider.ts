/**
 * Abstracción de emisión de documentos tributarios (boleta/factura/nota de
 * crédito). Kiva360 nunca llama directo a la API de un proveedor de
 * facturación electrónica desde la lógica de negocio — siempre pasa por esta
 * interfaz, para poder cambiar de proveedor sin reescribir el módulo de
 * Finanzas.
 *
 * NINGUNA implementación real (SII, Bsale, Acepta, etc.) está conectada
 * todavía — eso requiere validación contable/tributaria previa (ver
 * `colegios.proveedor_facturacion`). Mientras no haya proveedor configurado,
 * se usa `ManualBillingProvider`.
 */

export type TipoDocumentoTributario = 'boleta' | 'factura' | 'nota_credito'
export type EstadoDocumentoTributario = 'pendiente_manual' | 'emitiendo' | 'emitido' | 'error' | 'anulado'

export interface EmitDocumentInput {
  tipo: TipoDocumentoTributario
  colegioId: string
  receptor: {
    rut?: string | null
    razonSocial: string
    email?: string | null
  }
  items: { descripcion: string; monto: number; cantidad?: number }[]
  montoTotal: number
  documentoRelacionadoId?: string // para nota_credito: documento que anula
}

export interface DocumentoTributarioResult {
  proveedorDocId: string
  folio: string | null
  estado: EstadoDocumentoTributario
  pdfUrl: string | null
  montoNeto: number | null
  montoIva: number | null
  montoTotal: number
}

export interface BillingProvider {
  readonly nombre: string
  emitDocument(input: EmitDocumentInput): Promise<DocumentoTributarioResult>
  getDocument(proveedorDocId: string): Promise<DocumentoTributarioResult>
  cancelDocument(proveedorDocId: string, motivo: string): Promise<DocumentoTributarioResult>
  getPDF(proveedorDocId: string): Promise<Buffer | null>
  getStatus(proveedorDocId: string): Promise<EstadoDocumentoTributario>
}

/**
 * Proveedor por defecto mientras no hay una integración DTE real
 * configurada y validada con contabilidad. No emite nada ante el SII:
 * deja el documento en 'pendiente_manual' para que un administrativo lo
 * genere a mano en el portal del proveedor elegido y registre el folio.
 * Esto evita fabricar boletas/facturas falsas.
 */
export class ManualBillingProvider implements BillingProvider {
  readonly nombre = 'manual'

  async emitDocument(input: EmitDocumentInput): Promise<DocumentoTributarioResult> {
    return {
      proveedorDocId: `manual-${Date.now()}`,
      folio: null,
      estado: 'pendiente_manual',
      pdfUrl: null,
      montoNeto: null,
      montoIva: null,
      montoTotal: input.montoTotal,
    }
  }

  async getDocument(proveedorDocId: string): Promise<DocumentoTributarioResult> {
    return {
      proveedorDocId,
      folio: null,
      estado: 'pendiente_manual',
      pdfUrl: null,
      montoNeto: null,
      montoIva: null,
      montoTotal: 0,
    }
  }

  async cancelDocument(proveedorDocId: string): Promise<DocumentoTributarioResult> {
    return {
      proveedorDocId,
      folio: null,
      estado: 'anulado',
      pdfUrl: null,
      montoNeto: null,
      montoIva: null,
      montoTotal: 0,
    }
  }

  async getPDF(): Promise<Buffer | null> {
    return null
  }

  async getStatus(): Promise<EstadoDocumentoTributario> {
    return 'pendiente_manual'
  }
}

/**
 * Resuelve el BillingProvider configurado para un colegio. Hoy siempre
 * devuelve ManualBillingProvider — cuando se valide un proveedor DTE real
 * (Bsale/Acepta/Defontana/etc.), este switch crece con un `case` por
 * proveedor, sin tocar el resto del módulo de Finanzas.
 */
export function getBillingProvider(proveedorFacturacion: string | null): BillingProvider {
  switch (proveedorFacturacion) {
    // case 'bsale': return new BsaleBillingProvider()
    // case 'acepta': return new AceptaBillingProvider()
    default:
      return new ManualBillingProvider()
  }
}
