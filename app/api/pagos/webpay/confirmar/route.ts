import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js'
import { getWebpayTransaction } from '@/lib/transbank'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Aplica el resultado de Transbank de forma idempotente: si el pago ya estaba
// 'confirmado' (reintento de Transbank, doble carga de la página de retorno, etc.)
// no vuelve a sumar el monto al cobro. La condición .eq('estado','pendiente') en el
// UPDATE actúa como guard atómico — solo la primera confirmación efectivamente
// transiciona el registro; los reintentos posteriores no encuentran fila que actualizar.
async function procesarConfirmacion(admin: SupabaseClient, tokenWs: string, baseUrl: string) {
  const tx = getWebpayTransaction()
  const result = await tx.commit(tokenWs)

  const { data: pago } = await admin
    .from('pagos')
    .select('id, cobro_id, monto, estado')
    .eq('referencia', result.buy_order)
    .single()

  if (result.response_code !== 0) {
    if (pago && (pago as any).estado === 'pendiente') {
      await admin.from('pagos').update({
        estado: 'rechazado',
        metadata: { response_code: result.response_code, motivo: 'Rechazado por emisor' },
      }).eq('id', (pago as any).id).eq('estado', 'pendiente')
    }
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=rechazado`)
  }

  if (!pago) {
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=error`)
  }

  const p = pago as any

  // Guard de idempotencia: solo transiciona pendiente -> confirmado una vez.
  const { data: pagoActualizado } = await admin.from('pagos').update({
    estado: 'confirmado',
    metadata: {
      authorization_code: result.authorization_code,
      transaction_date: result.transaction_date,
      payment_type_code: result.payment_type_code,
      installments_number: result.installments_number,
      card_number: result.card_detail?.card_number,
      response_code: result.response_code,
      vci: result.vci,
    },
  }).eq('id', p.id).eq('estado', 'pendiente').select('id').single()

  if (pagoActualizado) {
    // Esta es la primera vez que se confirma este pago: aplicar el monto al cobro.
    const { data: cobro } = await admin.from('cobros').select('monto, monto_pagado').eq('id', p.cobro_id).single()
    if (cobro) {
      const nuevoMontoPagado = ((cobro as any).monto_pagado ?? 0) + p.monto
      const nuevoEstado = nuevoMontoPagado >= (cobro as any).monto ? 'pagado' : 'parcial'
      await admin.from('cobros').update({
        monto_pagado: nuevoMontoPagado,
        estado: nuevoEstado,
        medio_pago: 'webpay',
        fecha_pago: new Date().toISOString().split('T')[0],
      }).eq('id', p.cobro_id)
    }
  }

  return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=exito&orden=${result.buy_order}`)
}

// POST /api/pagos/webpay/confirmar
// Transbank redirige aquí con token_ws después del pago
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const tokenWs = formData.get('token_ws') as string | null
  const tbkToken = formData.get('TBK_TOKEN') as string | null
  const tbkOrdenCompra = formData.get('TBK_ORDEN_COMPRA') as string | null

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const admin = getAdmin()

  // Si viene TBK_TOKEN en vez de token_ws, el usuario canceló o hubo timeout
  if (!tokenWs && tbkToken) {
    await admin.from('pagos')
      .update({ estado: 'rechazado', metadata: { motivo: 'Anulado por usuario', tbk_token: tbkToken } })
      .eq('referencia', tbkOrdenCompra ?? '')
      .eq('estado', 'pendiente')

    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=cancelado`)
  }

  if (!tokenWs) {
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=error`)
  }

  try {
    return await procesarConfirmacion(admin, tokenWs, baseUrl)
  } catch (error: any) {
    console.error('Error al confirmar Transbank:', error)
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=error`)
  }
}

// GET - Transbank también puede enviar por GET en algunos casos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenWs = searchParams.get('token_ws')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!tokenWs) {
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=error`)
  }

  const admin = getAdmin()
  try {
    return await procesarConfirmacion(admin, tokenWs, baseUrl)
  } catch (error: any) {
    console.error('Error confirmar GET:', error)
    return NextResponse.redirect(`${baseUrl}/portal/pagos?resultado=error`)
  }
}
