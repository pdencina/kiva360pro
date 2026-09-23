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

// GET: catálogo de paquetes que ofrece el centro
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('colegio_id').eq('id', user.id).single()
  const colegioId = (ur as any)?.colegio_id
  if (!colegioId) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { data, error } = await admin
    .from('paquetes_sesion')
    .select('*, tarifa:tarifas_sesion(id, nombre, monto)')
    .eq('colegio_id', colegioId)
    .eq('activo', true)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: crear un paquete en el catálogo
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
  const { nombre, tarifa_id, cantidad, precio_total, descuento_pct } = body

  if (!nombre || !cantidad || !precio_total) {
    return NextResponse.json({ error: 'nombre, cantidad y precio_total son requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('paquetes_sesion').insert({
    colegio_id: usuario.colegio_id,
    nombre,
    tarifa_id: tarifa_id || null,
    cantidad,
    precio_total,
    descuento_pct: descuento_pct || 0,
  }).select('*, tarifa:tarifas_sesion(id, nombre, monto)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
