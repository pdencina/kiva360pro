import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import crypto from 'crypto'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // Si no hay secret configurado, no validar (dev)

  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) return true // MP no siempre manda firma

  try {
    const parts = xSignature.split(',')
    const ts = parts.find(p => p.trim().startsWith('ts='))?.split('=')[1]
    const hash = parts.find(p => p.trim().startsWith('v1='))?.split('=')[1]

    if (!ts || !hash) return true

    const dataId = JSON.parse(body)?.data?.id || ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    return computed === hash
  } catch {
    return true // Si falla la validación, dejar pasar (para no romper en dev)
  }
}

// POST: Webhook de Mercado Pago para notificaciones de suscripción
export async function POST(request: NextRequest) {
  const admin = getAdmin()
  const bodyText = await request.text()

  if (!verifyWebhookSignature(request, bodyText)) {
    console.error('MP Webhook: firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const body = JSON.parse(bodyText)
    console.log('MP Webhook:', JSON.stringify(body))

    const { type, data } = body

    // Nos interesan las notificaciones de subscription_preapproval
    if (type === 'subscription_preapproval') {
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
      const preApproval = new PreApproval(client)

      // Obtener detalles de la suscripción
      const sub = await preApproval.get({ id: data.id })

      if (!sub || !sub.external_reference) {
        return NextResponse.json({ ok: true })
      }

      const suscripcionId = sub.external_reference
      const mpStatus = sub.status // 'authorized', 'paused', 'cancelled', 'pending'

      // Mapear estado de MP a nuestro estado
      let nuevoEstado = 'activa'
      if (mpStatus === 'authorized') nuevoEstado = 'activa'
      else if (mpStatus === 'paused') nuevoEstado = 'suspendida'
      else if (mpStatus === 'cancelled') nuevoEstado = 'cancelada'
      else if (mpStatus === 'pending') nuevoEstado = 'activa'

      // Actualizar suscripción
      await admin.from('suscripciones').update({
        estado: nuevoEstado,
        tarjeta_inscrita: mpStatus === 'authorized',
        mp_preapproval_id: data.id,
      }).eq('id', suscripcionId)
    }

    // Notificaciones de pago de suscripción
    if (type === 'subscription_authorized_payment') {
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
      const preApproval = new PreApproval(client)

      // Buscar la suscripción vinculada
      const { data: subs } = await admin
        .from('suscripciones')
        .select('*')
        .eq('mp_preapproval_id', data.id)
        .single()

      if (subs) {
        const s = subs as any
        const now = new Date()
        const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // Registrar pago
        await admin.from('pagos_suscripcion').insert({
          suscripcion_id: s.id,
          colegio_id: s.colegio_id,
          monto: s.monto_mensual,
          periodo,
          estado: 'pagado',
          metodo: 'mercadopago',
          referencia: data.id,
          pagado_at: now.toISOString(),
        })

        // Actualizar suscripción
        const nextVenc = new Date(now.getFullYear(), now.getMonth() + 1, 30)
        await admin.from('suscripciones').update({
          estado: 'activa',
          ultimo_pago_at: now.toISOString(),
          meses_pagados: s.meses_pagados + 1,
          fecha_vencimiento: nextVenc.toISOString().split('T')[0],
        }).eq('id', s.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('MP Webhook error:', err)
    return NextResponse.json({ ok: true }) // Siempre responder 200 a MP
  }
}
