import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { crearOrdenPago } from '@/lib/flow'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { cobro_id } = await request.json()
  if (!cobro_id) return NextResponse.json({ error: 'cobro_id requerido' }, { status: 400 })

  const admin = getAdmin()
  const { data: cobro } = await admin
    .from('cobros')
    .select('*, concepto:conceptos_cobro(nombre), alumno:alumnos(nombre, apellido)')
    .eq('id', cobro_id)
    .single()

  if (!cobro) return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })

  const saldo = (cobro as any).monto - (cobro as any).monto_pagado
  if (saldo <= 0) return NextResponse.json({ error: 'Este cobro ya está pagado' }, { status: 400 })

  const resultado = await crearOrdenPago({
    cobro_id,
    monto: saldo,
    email: user.email!,
    concepto: (cobro as any).concepto?.nombre ?? 'Mensualidad',
    alumno_nombre: `${(cobro as any).alumno?.nombre} ${(cobro as any).alumno?.apellido}`,
  })

  if ('error' in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: 500 })
  }

  // Guardar token en el cobro para trackeo
  await admin.from('cobros').update({ link_pago: resultado.token }).eq('id', cobro_id)

  return NextResponse.json({ url: resultado.url })
}
