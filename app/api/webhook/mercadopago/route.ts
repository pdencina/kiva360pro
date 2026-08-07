import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Webhook de Mercado Pago para notificaciones de suscripción
export async function POST(request: NextRequest) {
  const admin = getAdmin()

  try {
    const body = await request.json()
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
