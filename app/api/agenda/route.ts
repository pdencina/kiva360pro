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

// GET: Listar sesiones agendadas (filtradas por semana/fecha/profesional)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario?.colegio_id) return NextResponse.json({ error: 'Sin colegio' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde') // YYYY-MM-DD
  const hasta = searchParams.get('hasta') // YYYY-MM-DD
  const profesionalId = searchParams.get('profesional_id')
  const alumnoId = searchParams.get('alumno_id')

  let query = admin
    .from('agenda_sesiones')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso),
      profesional:usuarios(id, nombre, apellido)
    `)
    .eq('colegio_id', usuario.colegio_id)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)
  if (profesionalId) query = query.eq('profesional_id', profesionalId)
  if (alumnoId) query = query.eq('alumno_id', alumnoId)

  // Tutor solo ve sus propias sesiones agendadas
  if (usuario.rol === 'tutor' && !profesionalId) {
    query = query.eq('profesional_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear sesión agendada (con soporte de recurrencia)
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
    alumno_id, profesional_id, plan_id, fecha, hora_inicio, hora_fin,
    tipo_sesion, modalidad, observaciones, recurrencia, recurrencia_fin
  } = body

  if (!alumno_id || !profesional_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'Campos requeridos: alumno_id, profesional_id, fecha, hora_inicio, hora_fin' }, { status: 400 })
  }

  // Generate recurring sessions if needed
  const sesiones: any[] = []
  const grupoId = recurrencia ? crypto.randomUUID() : null

  const addSession = (sessionDate: string) => {
    sesiones.push({
      colegio_id: usuario.colegio_id,
      alumno_id,
      profesional_id,
      plan_id: plan_id || null,
      fecha: sessionDate,
      hora_inicio,
      hora_fin,
      tipo_sesion: tipo_sesion || 'individual',
      modalidad: modalidad || 'presencial',
      observaciones,
      recurrencia: recurrencia || null,
      recurrencia_fin: recurrencia_fin || null,
      grupo_recurrencia: grupoId,
      creado_por: user.id,
    })
  }

  addSession(fecha)

  if (recurrencia && recurrencia_fin) {
    const intervalo = recurrencia === 'semanal' ? 7 : 14
    let current = new Date(fecha + 'T12:00:00')
    const fin = new Date(recurrencia_fin + 'T12:00:00')

    while (true) {
      current.setDate(current.getDate() + intervalo)
      if (current > fin) break
      addSession(current.toISOString().split('T')[0])
    }
  }

  const { data, error } = await admin
    .from('agenda_sesiones')
    .insert(sesiones)
    .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios(id, nombre, apellido)`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Actualizar sesión (cambiar estado, reprogramar)
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
    .from('agenda_sesiones')
    .update(updates)
    .eq('id', id)
    .eq('colegio_id', usuario.colegio_id)
    .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar sesión o serie
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
  const serie = searchParams.get('serie') // if 'true', delete entire recurring series

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  if (serie === 'true') {
    // Get grupo_recurrencia from this session
    const { data: sesion } = await admin.from('agenda_sesiones').select('grupo_recurrencia').eq('id', id).single()
    if ((sesion as any)?.grupo_recurrencia) {
      await admin.from('agenda_sesiones').delete()
        .eq('grupo_recurrencia', (sesion as any).grupo_recurrencia)
        .eq('colegio_id', usuario.colegio_id)
        .in('estado', ['programada', 'confirmada'])
    }
  } else {
    await admin.from('agenda_sesiones').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  }

  return NextResponse.json({ ok: true })
}
