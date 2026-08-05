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

// POST: Inscribir alumno en programa
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
  const { programa_id, alumno_id, observaciones } = body

  if (!programa_id || !alumno_id) {
    return NextResponse.json({ error: 'programa_id y alumno_id requeridos' }, { status: 400 })
  }

  // Check cupo
  const { data: programa } = await admin.from('programas').select('cupo_maximo').eq('id', programa_id).single()
  if ((programa as any)?.cupo_maximo) {
    const { count } = await admin
      .from('inscripciones_programa')
      .select('id', { count: 'exact', head: true })
      .eq('programa_id', programa_id)
      .eq('estado', 'activo')
    if (count !== null && count >= (programa as any).cupo_maximo) {
      return NextResponse.json({ error: 'Programa sin cupos disponibles' }, { status: 409 })
    }
  }

  const { data, error } = await admin.from('inscripciones_programa').insert({
    colegio_id: usuario.colegio_id,
    programa_id,
    alumno_id,
    observaciones: observaciones || null,
  }).select(`*, alumno:alumnos(id, nombre, apellido, curso)`).single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'El alumno ya está inscrito en este programa' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Cambiar estado de inscripción (suspender, egresar)
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
  const { id, estado, motivo_egreso } = body
  if (!id || !estado) return NextResponse.json({ error: 'id y estado requeridos' }, { status: 400 })

  const updates: any = { estado }
  if (estado === 'egresado') {
    updates.fecha_egreso = new Date().toISOString().split('T')[0]
    if (motivo_egreso) updates.motivo_egreso = motivo_egreso
  }

  const { data, error } = await admin
    .from('inscripciones_programa').update(updates).eq('id', id).eq('colegio_id', usuario.colegio_id)
    .select(`*, alumno:alumnos(id, nombre, apellido, curso)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar inscripción
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await admin.from('inscripciones_programa').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
