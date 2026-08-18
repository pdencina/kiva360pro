import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() { return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } }) }

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const alumnoId = searchParams.get('alumno_id')
  const periodo = searchParams.get('periodo')

  if (tipo === 'config') {
    const [{ data: d }, { data: a }, { data: o }] = await Promise.all([
      admin.from('descriptores_evaluacion').select('*').eq('colegio_id', usuario.colegio_id).eq('activo', true).order('orden'),
      admin.from('areas_evaluacion').select('*').eq('colegio_id', usuario.colegio_id).eq('activo', true).order('orden'),
      admin.from('objetivos_evaluacion').select('*').eq('colegio_id', usuario.colegio_id).eq('activo', true).order('orden'),
    ])
    return NextResponse.json({ descriptores: d ?? [], areas: a ?? [], objetivos: o ?? [] })
  }
  if (alumnoId) {
    let q = admin.from('evaluaciones_cualitativas').select('*, objetivo:objetivos_evaluacion(id, nombre, area_id), descriptor:descriptores_evaluacion(id, nombre, color)').eq('alumno_id', alumnoId).eq('colegio_id', usuario.colegio_id).order('fecha', { ascending: false })
    if (periodo) q = q.eq('periodo', periodo)
    const { data } = await q.limit(200)
    return NextResponse.json(data ?? [])
  }
  return NextResponse.json({ error: 'Especifique tipo=config o alumno_id' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor'].includes(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  const body = await request.json()
  const { accion } = body

  if (accion === 'crear_descriptor') { const { data, error } = await admin.from('descriptores_evaluacion').insert({ colegio_id: usuario.colegio_id, nombre: body.nombre, abreviatura: body.abreviatura, color: body.color, orden: body.orden ?? 0, descripcion: body.descripcion }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data, { status: 201 }) }
  if (accion === 'crear_area') { const { data, error } = await admin.from('areas_evaluacion').insert({ colegio_id: usuario.colegio_id, nombre: body.nombre, descripcion: body.descripcion, orden: body.orden ?? 0 }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data, { status: 201 }) }
  if (accion === 'crear_objetivo') { const { data, error } = await admin.from('objetivos_evaluacion').insert({ colegio_id: usuario.colegio_id, area_id: body.area_id, nombre: body.nombre, descripcion: body.descripcion, orden: body.orden ?? 0 }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data, { status: 201 }) }
  if (accion === 'evaluar') { const { alumno_id, objetivo_id, descriptor_id, periodo, observacion } = body; if (!alumno_id || !objetivo_id || !descriptor_id || !periodo) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 }); const { data, error } = await admin.from('evaluaciones_cualitativas').upsert({ colegio_id: usuario.colegio_id, alumno_id, objetivo_id, descriptor_id, periodo, fecha: new Date().toISOString().split('T')[0], observacion: observacion || null, evaluado_por: user.id }, { onConflict: 'alumno_id,objetivo_id,periodo' }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data) }
  if (accion === 'evaluar_lote') { const { alumno_id, periodo, evaluaciones } = body; if (!alumno_id || !periodo || !evaluaciones?.length) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 }); const records = evaluaciones.map((e: any) => ({ colegio_id: usuario.colegio_id, alumno_id, objetivo_id: e.objetivo_id, descriptor_id: e.descriptor_id, periodo, fecha: new Date().toISOString().split('T')[0], observacion: e.observacion || null, evaluado_por: user.id })); const { data, error } = await admin.from('evaluaciones_cualitativas').upsert(records, { onConflict: 'alumno_id,objetivo_id,periodo' }).select(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data) }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
