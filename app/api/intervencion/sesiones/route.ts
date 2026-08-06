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

// GET: Listar sesiones de un plan
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

  // Verify the plan belongs to the colegio
  const { data: plan } = await admin.from('planes_intervencion').select('id').eq('id', planId).eq('colegio_id', usuario.colegio_id).single()
  if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const { data, error } = await admin
    .from('sesiones_terapeuticas')
    .select(`*, profesional:usuarios(id, nombre, apellido)`)
    .eq('plan_id', planId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })

  // Tutor solo ve sus propias sesiones
  let resultado = data ?? []
  if (usuario.rol === 'tutor') {
    resultado = resultado.filter((s: any) => s.profesional_id === user.id)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(resultado)
}

// POST: Registrar una sesión terapéutica
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
    plan_id, fecha, hora_inicio, hora_fin, duracion_min,
    tipo_sesion, modalidad, objetivos_trabajados,
    actividades, observaciones, logros, dificultades,
    estado_ingreso, estado_egreso, indicaciones_familia,
    proximos_pasos, asistio, motivo_inasistencia
  } = body

  if (!plan_id) return NextResponse.json({ error: 'plan_id requerido' }, { status: 400 })

  // Verify plan belongs to colegio
  const { data: plan } = await admin.from('planes_intervencion').select('id').eq('id', plan_id).eq('colegio_id', usuario.colegio_id).single()
  if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const { data, error } = await admin.from('sesiones_terapeuticas').insert({
    plan_id,
    profesional_id: user.id,
    fecha: fecha || new Date().toISOString().split('T')[0],
    hora_inicio,
    hora_fin,
    duracion_min,
    tipo_sesion: tipo_sesion || 'individual',
    modalidad: modalidad || 'presencial',
    objetivos_trabajados: objetivos_trabajados || [],
    actividades,
    observaciones,
    logros,
    dificultades,
    estado_ingreso,
    estado_egreso,
    indicaciones_familia,
    proximos_pasos,
    asistio: asistio !== false,
    motivo_inasistencia,
  }).select(`*, profesional:usuarios(id, nombre, apellido)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update progress on objectives worked if provided
  if (objetivos_trabajados?.length && asistio !== false) {
    // Just mark them as in_progress if they were pending
    await admin
      .from('objetivos_terapeuticos')
      .update({ estado: 'en_progreso' })
      .in('id', objetivos_trabajados)
      .eq('estado', 'pendiente')
  }

  return NextResponse.json(data, { status: 201 })
}
