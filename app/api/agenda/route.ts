import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generarCobroSesion } from '@/lib/generar-cobro-sesion'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type AdminClient = ReturnType<typeof getAdmin>

// Campos que el cliente puede modificar en una sesión (antes se aceptaba cualquier campo).
const CAMPOS_EDITABLES = [
  'fecha', 'hora_inicio', 'hora_fin', 'alumno_id', 'profesional_id', 'plan_id', 'tipo_sesion',
  'modalidad', 'estado', 'observaciones', 'motivo_cancelacion', 'tarifa_id',
] as const

// Aislamiento multi-tenant: paciente, profesional y prestación deben ser de este centro.
async function validarTenant(
  admin: AdminClient, colegioId: string,
  ids: { alumno_id?: string | null; profesional_id?: string | null; tarifa_id?: string | null },
): Promise<string | null> {
  if (ids.alumno_id) {
    const { data } = await admin.from('alumnos').select('id').eq('id', ids.alumno_id).eq('colegio_id', colegioId).maybeSingle()
    if (!data) return 'El paciente no existe en este centro'
  }
  if (ids.profesional_id) {
    const { data } = await admin.from('usuarios').select('id').eq('id', ids.profesional_id).eq('colegio_id', colegioId).maybeSingle()
    if (!data) return 'El profesional no existe en este centro'
  }
  if (ids.tarifa_id) {
    const { data } = await admin.from('tarifas_sesion').select('id').eq('id', ids.tarifa_id).eq('colegio_id', colegioId).maybeSingle()
    if (!data) return 'La prestación no existe en este centro'
  }
  return null
}

// Si la sesión no tiene prestación, se usa la única tarifa activa de ese tipo de sesión
// (si hay 0 o más de 1 no se adivina: el cobro queda para gestión manual).
async function tarifaUnicaPorTipo(admin: AdminClient, colegioId: string, tipoSesion: string): Promise<string | null> {
  const { data } = await admin.from('tarifas_sesion').select('id').eq('colegio_id', colegioId).eq('tipo_sesion', tipoSesion).eq('activo', true)
  return data && data.length === 1 ? (data[0] as { id: string }).id : null
}

// Devuelve a su plan las unidades consumidas por una atención de agenda (auditado, sin borrar nada).
async function revertirConsumosDeAgenda(admin: AdminClient, colegioId: string, agendaSesionId: string, userId: string, motivo: string): Promise<{ revertidos: number; errores: number }> {
  const { data: consumos } = await admin.from('plan_consumos').select('id')
    .eq('colegio_id', colegioId).eq('agenda_sesion_id', agendaSesionId).eq('estado', 'consumido')
  let revertidos = 0
  let errores = 0
  for (const c of (consumos ?? []) as { id: string }[]) {
    const { error } = await admin.rpc('revertir_consumo_plan', { p_colegio: colegioId, p_consumo: c.id, p_user: userId, p_motivo: motivo })
    if (error) { errores++; console.error('Error revirtiendo consumo de plan:', error.message) } else revertidos++
  }
  return { revertidos, errores }
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
      profesional:usuarios!profesional_id(id, nombre, apellido)
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
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus', 'recepcion'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const {
    alumno_id, profesional_id, plan_id, fecha, hora_inicio, hora_fin,
    tipo_sesion, modalidad, observaciones, recurrencia, recurrencia_fin, tarifa_id
  } = body

  if (!alumno_id || !profesional_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'Campos requeridos: alumno_id, profesional_id, fecha, hora_inicio, hora_fin' }, { status: 400 })
  }

  const errorTenant = await validarTenant(admin, usuario.colegio_id, { alumno_id, profesional_id, tarifa_id })
  if (errorTenant) return NextResponse.json({ error: errorTenant }, { status: 400 })

  // Generate recurring sessions if needed
  const sesiones: any[] = []
  const grupoId = recurrencia ? crypto.randomUUID() : null

  const addSession = (sessionDate: string) => {
    sesiones.push({
      colegio_id: usuario.colegio_id,
      alumno_id,
      profesional_id,
      plan_id: plan_id || null,
      tarifa_id: tarifa_id || null,
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
    .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios!profesional_id(id, nombre, apellido)`)

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
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus', 'recepcion'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const id = body.id as string | undefined
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in body) updates[campo] = body[campo]
  }

  const errorTenant = await validarTenant(admin, usuario.colegio_id, {
    alumno_id: updates.alumno_id as string | undefined,
    profesional_id: updates.profesional_id as string | undefined,
    tarifa_id: updates.tarifa_id as string | null | undefined,
  })
  if (errorTenant) return NextResponse.json({ error: errorTenant }, { status: 400 })

  const { data: sesionAnterior } = await admin.from('agenda_sesiones').select('estado').eq('id', id).eq('colegio_id', usuario.colegio_id).single()
  if (!sesionAnterior) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  const estadoAnterior = (sesionAnterior as { estado: string }).estado

  const { data, error } = await admin
    .from('agenda_sesiones')
    .update(updates)
    .eq('id', id)
    .eq('colegio_id', usuario.colegio_id)
    .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios!profesional_id(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const sesion = data as {
    tipo_sesion: string; alumno_id: string; profesional_id: string; fecha: string; tarifa_id: string | null
  }

  // Automatización 1: al completarse la atención se genera su cobro. Si el paciente tiene un plan
  // vigente que incluya la prestación, la atención CONSUME el plan (sin generar ingreso nuevo).
  // Solo se usa la prestación de la sesión, o la única tarifa activa de ese tipo (no se adivina).
  let cobroGenerado: unknown = null
  if (updates.estado === 'completada' && estadoAnterior !== 'completada') {
    const { data: yaExiste } = await admin.from('cobros_sesion').select('id').eq('agenda_sesion_id', id).neq('estado', 'anulado').maybeSingle()

    if (!yaExiste) {
      const tarifaId = sesion.tarifa_id ?? await tarifaUnicaPorTipo(admin, usuario.colegio_id, sesion.tipo_sesion)
      if (tarifaId) {
        try {
          const { cobro, paqueteAplicado, repetido } = await generarCobroSesion({
            admin, colegioId: usuario.colegio_id,
            alumnoId: sesion.alumno_id, profesionalId: sesion.profesional_id,
            fechaSesion: sesion.fecha, tarifaId, agendaSesionId: id, userId: user.id,
          })
          if (!repetido) {
            cobroGenerado = { ...cobro, cubierto_por_plan: paqueteAplicado }
            await registrarAuditoriaFinanciera({
              admin, colegioId: usuario.colegio_id, usuarioId: user.id,
              accion: 'cobro_generado', entidad: 'cobros_sesion', entidadId: cobro.id,
              valorNuevo: { origen: 'agenda_completada', agenda_sesion_id: id, monto: cobro.monto, monto_final: cobro.monto_final, cubierto_plan: cobro.monto_cubierto_plan },
            })
          }
        } catch {
          // Sin tarifa válida o error al generar: se deja para gestión manual
        }
      }
    }
  }

  // Automatización 2 (reverso): si la atención deja de estar "completada" (no asistió, cancelada,
  // corregida), la sesión vuelve al plan y el cobro queda anulado. No se borra nada.
  let planRevertido = false
  let planReversoError = false
  if (estadoAnterior === 'completada' && typeof updates.estado === 'string' && updates.estado !== 'completada') {
    const r = await revertirConsumosDeAgenda(admin, usuario.colegio_id, id, user.id, `Atención cambiada a "${updates.estado}" en la agenda`)
    planRevertido = r.revertidos > 0
    planReversoError = r.errores > 0
  }

  return NextResponse.json({ ...data, cobro_generado: cobroGenerado, plan_revertido: planRevertido, plan_reverso_error: planReversoError })
}

// DELETE: Eliminar sesión o serie
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'recepcion'].includes(usuario?.rol)) {
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
    // Si la atención había consumido un plan, la sesión vuelve al plan antes de eliminarla.
    await revertirConsumosDeAgenda(admin, usuario.colegio_id, id, user.id, 'Atención eliminada de la agenda')
    await admin.from('agenda_sesiones').delete().eq('id', id).eq('colegio_id', usuario.colegio_id)
  }

  return NextResponse.json({ ok: true })
}
