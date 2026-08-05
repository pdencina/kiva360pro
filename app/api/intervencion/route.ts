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

// GET: Listar planes de intervención del colegio
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario?.colegio_id) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')
  const alumnoId = searchParams.get('alumno_id')

  let query = admin
    .from('planes_intervencion')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso, foto_url),
      equipo:equipo_intervencion(id, profesional_id, especialidad, rol_equipo, profesional:usuarios(nombre, apellido)),
      objetivos:objetivos_terapeuticos(id, area, descripcion, estado, progreso, prioridad)
    `)
    .eq('colegio_id', usuario.colegio_id)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (alumnoId) query = query.eq('alumno_id', alumnoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

// POST: Crear un nuevo plan de intervención
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
  const { alumno_id, titulo, diagnostico, diagnostico_detalle, nivel_apoyo, fecha_inicio, fecha_fin, antecedentes, fortalezas, barreras, apoyos_requeridos } = body

  if (!alumno_id) return NextResponse.json({ error: 'alumno_id requerido' }, { status: 400 })

  const { data, error } = await admin.from('planes_intervencion').insert({
    colegio_id: usuario.colegio_id,
    alumno_id,
    titulo: titulo || 'Plan de Intervención Individual',
    diagnostico,
    diagnostico_detalle,
    nivel_apoyo: nivel_apoyo || 'intermedio',
    fecha_inicio: fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin,
    antecedentes,
    fortalezas,
    barreras,
    apoyos_requeridos,
    created_by: user.id,
  }).select(`*, alumno:alumnos(id, nombre, apellido, curso)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Actualizar plan
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

  const { data, error } = await admin
    .from('planes_intervencion')
    .update(updates)
    .eq('id', id)
    .eq('colegio_id', usuario.colegio_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
