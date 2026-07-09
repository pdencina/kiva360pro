// ============================================================
// Integración con Flow.cl — Pasarela de pagos chilena
// Documentación: https://www.flow.cl/docs/api.html
// ============================================================

import crypto from 'crypto'

const FLOW_API_URL = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api'
const FLOW_API_KEY = process.env.FLOW_API_KEY || ''
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY || ''

interface CrearPagoParams {
  cobro_id: string
  monto: number
  email: string
  concepto: string
  alumno_nombre: string
}

/**
 * Firma los parámetros según el protocolo de Flow
 */
function firmarParams(params: Record<string, string>): string {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', FLOW_SECRET_KEY).update(toSign).digest('hex')
}

/**
 * Crea una orden de pago en Flow y retorna la URL de redirección
 */
export async function crearOrdenPago({
  cobro_id,
  monto,
  email,
  concepto,
  alumno_nombre,
}: CrearPagoParams): Promise<{ url: string; token: string } | { error: string }> {
  if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
    return { error: 'El pago online requiere integración bancaria. Contacte al administrador para configurar su medio de pago.' }
  }

  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: cobro_id,
    subject: `${concepto} — ${alumno_nombre}`,
    currency: 'CLP',
    amount: String(monto),
    email,
    urlConfirmation: `${process.env.NEXT_PUBLIC_SITE_URL}/api/pagos/flow/confirmar`,
    urlReturn: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/pagos?resultado=ok`,
  }

  params.s = firmarParams(params)

  try {
    const res = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })

    const data = await res.json()

    if (data.url && data.token) {
      return { url: `${data.url}?token=${data.token}`, token: data.token }
    }

    return { error: data.message || 'Error al crear orden de pago' }
  } catch (e: any) {
    return { error: e.message || 'Error de conexión con Flow' }
  }
}

/**
 * Consulta el estado de un pago en Flow
 */
export async function consultarPago(token: string): Promise<any> {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  }
  params.s = firmarParams(params)

  const res = await fetch(`${FLOW_API_URL}/payment/getStatus?${new URLSearchParams(params).toString()}`)
  return res.json()
}
