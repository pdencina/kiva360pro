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

// GET: Listar tabla de aportes (filtrable por anio, sede, tipo)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const anio = searchParams.get('anio')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  let query = admin.from('tabla_aportes').select('*').eq('activo', true).order('nivel').order('tipo').order('sede')
  if (anio) query = query.eq('anio', parseInt(anio))

  // Admin del colegio solo ve los suyos
  if (usuario?.rol !== 'super_admin' && usuario?.colegio_id) {
    query = query.or(`colegio_id.eq.${usuario.colegio_id},colegio_id.is.null`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear nuevo registro
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !['super_admin', 'admin'].includes(usuario.rol)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  // Si es admin del colegio, forzar su colegio_id
  if (usuario.rol === 'admin') {
    body.colegio_id = usuario.colegio_id
  }

  const { data, error } = await admin.from('tabla_aportes').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PUT: Actualizar registro
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !['super_admin', 'admin'].includes(usuario.rol)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = admin.from('tabla_aportes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  // Admin solo puede editar los de su colegio
  if (usuario.rol === 'admin') query = query.eq('colegio_id', usuario.colegio_id)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar registro
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !['super_admin', 'admin'].includes(usuario.rol)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = admin.from('tabla_aportes').delete().eq('id', id)
  if (usuario.rol === 'admin') query = query.eq('colegio_id', usuario.colegio_id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
