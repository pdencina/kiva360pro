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

// GET: Obtener horario de un alumno
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('colegio_id').eq('id', user.id).single()
  const colegioId = (ur as any)?.colegio_id

  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumno_id')
  if (!alumnoId) return NextResponse.json({ error: 'alumno_id requerido' }, { status: 400 })

  let query = admin.from('horario_alumno')
    .select(`*, profesional:usuarios(id, nombre, apellido)`)
    .eq('alumno_id', alumnoId)
    .eq('activo', true)

  if (colegioId) query = query.eq('colegio_id', colegioId)

  const { data, error } = await query.order('dia_semana').order('hora_inicio')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear bloque de horario
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
  const { alumno_id, dia_semana, hora_inicio, hora_fin, tipo, asignatura, profesional_id, sala, color } = body

  if (!alumno_id || !dia_semana || !hora_inicio || !hora_fin || !tipo || !asignatura) {
    return NextResponse.json({ error: 'Campos requeridos: alumno_id, dia_semana, hora_inicio, hora_fin, tipo, asignatura' }, { status: 400 })
  }

  const { data, error } = await admin.from('horario_alumno').insert({
    colegio_id: usuario.colegio_id,
    alumno_id,
    dia_semana,
    hora_inicio,
    hora_fin,
    tipo,
    asignatura,
    profesional_id: profesional_id || null,
    sala: sala || null,
    color: color || null,
  }).select(`*, profesional:usuarios(id, nombre, apellido)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Actualizar bloque
export async function PATCH(request: NextRequest) {
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
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await admin
    .from('horario_alumno')
    .update(updates)
    .eq('id', id)
    .eq('colegio_id', usuario.colegio_id)
    .select(`*, profesional:usuarios(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar bloque
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

  const { error } = await admin.from('horario_alumno').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
