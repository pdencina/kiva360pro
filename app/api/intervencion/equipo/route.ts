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

// GET: Listar equipo de un plan
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
    .from('equipo_intervencion')
    .select(`*, profesional:usuarios(id, nombre, apellido, email)`)
    .eq('plan_id', planId)
    .order('rol_equipo', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Agregar profesional al equipo
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { plan_id, profesional_id, especialidad, rol_equipo, horas_semanales } = body

  if (!plan_id || !profesional_id || !especialidad) {
    return NextResponse.json({ error: 'plan_id, profesional_id y especialidad requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('equipo_intervencion').insert({
    plan_id,
    profesional_id,
    especialidad,
    rol_equipo: rol_equipo || 'terapeuta',
    horas_semanales,
  }).select(`*, profesional:usuarios(id, nombre, apellido, email)`).single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Profesional ya está en el equipo' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

// DELETE: Remover profesional del equipo
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

  const { error } = await admin.from('equipo_intervencion').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
