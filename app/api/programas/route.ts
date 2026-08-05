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

// GET: Listar programas del colegio
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario?.colegio_id) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { data, error } = await admin
    .from('programas')
    .select(`
      *,
      inscripciones:inscripciones_programa(id, alumno_id, estado, fecha_ingreso, alumno:alumnos(id, nombre, apellido, curso))
    `)
    .eq('colegio_id', usuario.colegio_id)
    .order('activo', { ascending: false })
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear programa
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const {
    nombre, descripcion, tipo, modalidad, jornada,
    dias_semana, hora_inicio, hora_fin, cupo_maximo,
    costo_mensual, costo_matricula, equipo_requerido
  } = body

  if (!nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })

  const { data, error } = await admin.from('programas').insert({
    colegio_id: usuario.colegio_id,
    nombre,
    descripcion: descripcion || null,
    tipo: tipo || 'educativo',
    modalidad: modalidad || 'presencial',
    jornada: jornada || 'completa',
    dias_semana: dias_semana || [1,2,3,4,5],
    hora_inicio: hora_inicio || null,
    hora_fin: hora_fin || null,
    cupo_maximo: cupo_maximo || null,
    costo_mensual: costo_mensual || null,
    costo_matricula: costo_matricula || null,
    equipo_requerido: equipo_requerido || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Actualizar programa
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await admin
    .from('programas').update(updates).eq('id', id).eq('colegio_id', usuario.colegio_id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
