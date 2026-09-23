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

// GET: paquetes vendidos del colegio (opcionalmente filtrado por alumno)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('colegio_id').eq('id', user.id).single()
  const colegioId = (ur as any)?.colegio_id
  if (!colegioId) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumno_id')

  let query = admin
    .from('paquetes_vendidos')
    .select('*, paquete:paquetes_sesion(nombre, descuento_pct), alumno:alumnos(id, nombre, apellido, curso)')
    .eq('colegio_id', colegioId)
    .order('created_at', { ascending: false })

  if (alumnoId) query = query.eq('alumno_id', alumnoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: vender un paquete a un alumno/familia
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'finanzas'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { paquete_id, alumno_id, marcar_pagado, fecha_vencimiento } = body

  if (!paquete_id || !alumno_id) {
    return NextResponse.json({ error: 'paquete_id y alumno_id son requeridos' }, { status: 400 })
  }

  const { data: paquete } = await admin.from('paquetes_sesion').select('*').eq('id', paquete_id).eq('colegio_id', usuario.colegio_id).single()
  if (!paquete) return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
  const p = paquete as any

  const { data: familia } = await admin.from('familias').select('id').eq('alumno_id', alumno_id).limit(1).single()
  if (!familia) return NextResponse.json({ error: 'El alumno no tiene una familia registrada' }, { status: 400 })

  const { data, error } = await admin.from('paquetes_vendidos').insert({
    colegio_id: usuario.colegio_id,
    paquete_id,
    alumno_id,
    familia_id: (familia as any).id,
    sesiones_total: p.cantidad,
    sesiones_usadas: 0,
    monto_pagado: marcar_pagado ? p.precio_total : 0,
    estado_pago: marcar_pagado ? 'pagado' : 'pendiente',
    fecha_vencimiento: fecha_vencimiento || null,
  }).select('*, paquete:paquetes_sesion(nombre, descuento_pct), alumno:alumnos(id, nombre, apellido, curso)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
