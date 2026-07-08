import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { consultarPago } from '@/lib/flow'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Flow llama a esta URL (POST) cuando un pago se confirma.
 * Actualiza el cobro como pagado en la BD.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const params = new URLSearchParams(body)
  const token = params.get('token')

  if (!token) return NextResponse.json({ error: 'Sin token' }, { status: 400 })

  const pago = await consultarPago(token)

  // Flow status: 2 = pagado, 3 = rechazado, 4 = anulado
  if (pago.status !== 2) {
    return NextResponse.json({ message: 'Pago no completado', status: pago.status })
  }

  const cobro_id = pago.commerceOrder
  const monto = pago.amount

  const admin = getAdmin()

  // Obtener cobro actual
  const { data: cobro } = await admin.from('cobros').select('monto, monto_pagado').eq('id', cobro_id).single()
  if (!cobro) return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })

  const nuevoMontoPagado = (cobro as any).monto_pagado + monto
  const nuevoEstado = nuevoMontoPagado >= (cobro as any).monto ? 'pagado' : 'parcial'

  // Registrar pago
  await admin.from('pagos').insert({
    cobro_id,
    monto,
    medio_pago: 'webpay',
    referencia: `Flow #${pago.paymentData?.media ?? ''} - ${token}`,
  })

  // Actualizar cobro
  await admin.from('cobros').update({
    monto_pagado: nuevoMontoPagado,
    estado: nuevoEstado,
    medio_pago: 'webpay',
    fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString().split('T')[0] : null,
    link_pago: null,
  }).eq('id', cobro_id)

  return NextResponse.json({ message: 'Pago confirmado', cobro_id })
}
