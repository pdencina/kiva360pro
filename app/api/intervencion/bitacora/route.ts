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

// GET: Listar entradas de bitácora de un plan
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario?.colegio_id) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('plan_id')
  if (!planId) return NextResponse.json({ error: 'plan_id requerido' }, { status: 400 })

  const limit = parseInt(searchParams.get('limit') || '50')

  const { data, error } = await admin
    .from('bitacora_conductual')
    .select(`*, registrado:usuarios(id, nombre, apellido)`)
    .eq('plan_id', planId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Registrar entrada en bitácora
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const {
    plan_id, tipo, descripcion, antecedente, consecuencia,
    intensidad, duracion_min, estrategia, resultado, visible_familia
  } = body

  if (!plan_id || !tipo || !descripcion) {
    return NextResponse.json({ error: 'plan_id, tipo y descripcion requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('bitacora_conductual').insert({
    plan_id,
    registrado_por: user.id,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    tipo,
    descripcion,
    antecedente,
    consecuencia,
    intensidad,
    duracion_min,
    estrategia,
    resultado,
    visible_familia: visible_familia || false,
  }).select(`*, registrado:usuarios(id, nombre, apellido)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
