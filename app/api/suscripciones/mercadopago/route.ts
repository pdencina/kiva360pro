import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getMercadoPago() {
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
}

// POST: Crear suscripción en Mercado Pago y redirigir al cliente
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id, email, nombre').eq('id', user.id).single()
  const usuario = ur as any

  if (!usuario || !['admin', 'super_admin'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Obtener suscripción del colegio
  const { data: sub } = await admin.from('suscripciones').select('*').eq('colegio_id', usuario.colegio_id).single()
  if (!sub) {
    return NextResponse.json({ error: 'No tienes una suscripción configurada. Contacta a Kiva360.' }, { status: 404 })
  }

  const suscripcion = sub as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'

  try {
    const client = getMercadoPago()
    const preApproval = new PreApproval(client)

    // Crear suscripción recurrente en Mercado Pago
    const result = await preApproval.create({
      body: {
        reason: `Kiva360 - Plan ${suscripcion.plan} (Suscripción mensual)`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: suscripcion.monto_mensual,
          currency_id: 'CLP',
        },
        payer_email: usuario.email,
        back_url: `${siteUrl}/configuracion/suscripcion`,
        external_reference: suscripcion.id,
      },
    })

    // Guardar el ID de la preapproval en la suscripción
    if (result.id) {
      await admin.from('suscripciones').update({
        mp_preapproval_id: result.id,
      }).eq('id', suscripcion.id)
    }

    return NextResponse.json({
      init_point: result.init_point,
      id: result.id,
    })
  } catch (err: any) {
    console.error('MercadoPago PreApproval error:', err)
    return NextResponse.json({ error: 'Error al crear suscripción en Mercado Pago' }, { status: 500 })
  }
}
