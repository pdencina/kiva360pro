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

// GET: Listar objetivos de un plan
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

  const { data, error } = await admin
    .from('objetivos_terapeuticos')
    .select(`*, responsable:usuarios(id, nombre, apellido)`)
    .eq('plan_id', planId)
    .order('prioridad', { ascending: true })
    .order('orden', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear objetivo
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
  const { plan_id, area, descripcion, indicadores, estrategias, prioridad, responsable_id } = body

  if (!plan_id || !area || !descripcion) {
    return NextResponse.json({ error: 'plan_id, area y descripcion requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('objetivos_terapeuticos').insert({
    plan_id,
    area,
    descripcion,
    indicadores,
    estrategias,
    prioridad: prioridad || 2,
    responsable_id: responsable_id || user.id,
  }).select(`*, responsable:usuarios(id, nombre, apellido)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Actualizar objetivo (progreso, estado, etc.)
export async function PATCH(request: NextRequest) {
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
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // If marking as logrado, set fecha_logro
  if (updates.estado === 'logrado' && !updates.fecha_logro) {
    updates.fecha_logro = new Date().toISOString().split('T')[0]
    updates.progreso = 100
  }

  const { data, error } = await admin
    .from('objetivos_terapeuticos')
    .update(updates)
    .eq('id', id)
    .select(`*, responsable:usuarios(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar objetivo
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await admin.from('objetivos_terapeuticos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
