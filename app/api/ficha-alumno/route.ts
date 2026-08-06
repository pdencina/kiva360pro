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

// GET: Obtener ficha completa de un alumno (documentos + informes)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumno_id')
  if (!alumnoId) return NextResponse.json({ error: 'alumno_id requerido' }, { status: 400 })

  const isDirector = ['super_admin', 'admin'].includes(usuario?.rol)

  // Load documents (filter by visibility based on role)
  let docQuery = admin.from('documentos_alumno').select('*, subido:usuarios(nombre, apellido)').eq('alumno_id', alumnoId).order('created_at', { ascending: false })
  if (!isDirector) {
    docQuery = docQuery.eq('solo_director', false)
  }
  const { data: documentos } = await docQuery

  // Load therapeutic reports
  const { data: informes } = await admin
    .from('informes_terapeuticos')
    .select('*, profesional:usuarios(nombre, apellido)')
    .eq('alumno_id', alumnoId)
    .order('fecha', { ascending: false })

  return NextResponse.json({
    documentos: documentos ?? [],
    informes: informes ?? [],
  })
}

// POST: Subir documento o informe
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
  const { accion } = body

  if (accion === 'documento') {
    const { alumno_id, nombre, tipo, archivo_url, solo_director, visible_familia, descripcion } = body
    if (!alumno_id || !nombre || !archivo_url) {
      return NextResponse.json({ error: 'alumno_id, nombre y archivo_url requeridos' }, { status: 400 })
    }
    const { data, error } = await admin.from('documentos_alumno').insert({
      colegio_id: usuario.colegio_id,
      alumno_id, nombre,
      tipo: tipo || 'otro',
      archivo_url,
      solo_director: solo_director !== false,
      visible_familia: visible_familia || false,
      subido_por: user.id,
      descripcion: descripcion || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  if (accion === 'informe') {
    const { alumno_id, titulo, tipo, especialidad, contenido, archivo_url, fecha, periodo, visible_familia, plan_id } = body
    if (!alumno_id || !titulo) {
      return NextResponse.json({ error: 'alumno_id y titulo requeridos' }, { status: 400 })
    }
    const { data, error } = await admin.from('informes_terapeuticos').insert({
      colegio_id: usuario.colegio_id,
      alumno_id, titulo,
      tipo: tipo || 'periodico',
      especialidad: especialidad || null,
      contenido: contenido || null,
      archivo_url: archivo_url || null,
      fecha: fecha || new Date().toISOString().split('T')[0],
      periodo: periodo || null,
      visible_familia: visible_familia || false,
      profesional_id: user.id,
      plan_id: plan_id || null,
    }).select('*, profesional:usuarios(nombre, apellido)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'accion inválida (documento | informe)' }, { status: 400 })
}

// DELETE: Eliminar documento o informe
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
  const tabla = searchParams.get('tabla') // 'documentos_alumno' o 'informes_terapeuticos'
  if (!id || !tabla) return NextResponse.json({ error: 'id y tabla requeridos' }, { status: 400 })

  if (tabla === 'documentos_alumno') {
    await admin.from('documentos_alumno').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  } else if (tabla === 'informes_terapeuticos') {
    await admin.from('informes_terapeuticos').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  }

  return NextResponse.json({ ok: true })
}
