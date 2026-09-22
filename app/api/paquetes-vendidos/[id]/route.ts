import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH: marcar un paquete vendido como pagado
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: vendidoRow } = await admin.from('paquetes_vendidos').select('*, paquete:paquetes_sesion(precio_total)').eq('id', params.id).eq('colegio_id', usuario.colegio_id).single()
  if (!vendidoRow) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const vendido = vendidoRow as any

  const body = await request.json()

  if (body.accion === 'marcar_pagado') {
    const { data, error } = await admin.from('paquetes_vendidos').update({
      estado_pago: 'pagado',
      monto_pagado: vendido.paquete?.precio_total ?? vendido.monto_pagado,
    }).eq('id', params.id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
