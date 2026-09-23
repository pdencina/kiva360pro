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

// PATCH: confirmar o rechazar una solicitud de reserva pública
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'tutor', 'recepcion'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: reservaRow } = await admin.from('reservas_publicas').select('*').eq('id', params.id).eq('colegio_id', usuario.colegio_id).single()
  if (!reservaRow) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  const reserva = reservaRow as any

  if (reserva.estado !== 'pendiente') {
    return NextResponse.json({ error: 'Esta solicitud ya fue gestionada' }, { status: 400 })
  }

  const body = await request.json()
  const { accion } = body // 'confirmar' | 'rechazar'

  if (accion === 'rechazar') {
    const { data, error } = await admin.from('reservas_publicas').update({
      estado: 'rechazada',
      motivo_rechazo: body.motivo || null,
      gestionado_por: user.id,
      gestionado_at: new Date().toISOString(),
    }).eq('id', params.id).eq('estado', 'pendiente').select().single()

    if (error || !data) return NextResponse.json({ error: error?.message || 'No se pudo rechazar' }, { status: 500 })
    return NextResponse.json(data)
  }

  if (accion === 'confirmar') {
    let alumnoId: string = reserva.alumno_id
    const { nuevo_alumno } = body

    if (!alumnoId && nuevo_alumno?.nombre && nuevo_alumno?.apellido) {
      const { data: alumnoCreado, error: alumnoError } = await admin.from('alumnos').insert({
        colegio_id: usuario.colegio_id,
        nombre: nuevo_alumno.nombre,
        apellido: nuevo_alumno.apellido,
        curso: nuevo_alumno.curso || 'Sin asignar',
        nivel: nuevo_alumno.nivel || 'Sin asignar',
        activo: true,
      }).select('id').single()
      if (alumnoError || !alumnoCreado) return NextResponse.json({ error: alumnoError?.message || 'No se pudo crear el paciente' }, { status: 500 })
      alumnoId = (alumnoCreado as any).id
    }

    if (!alumnoId) {
      return NextResponse.json({ error: 'Debes seleccionar un paciente existente o ingresar los datos de uno nuevo' }, { status: 400 })
    }

    const duracionMin = 45
    const [h, m] = reserva.hora_solicitada.split(':').map(Number)
    const finMin = h * 60 + m + duracionMin
    const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`

    const { data: sesionCreada, error: sesionError } = await admin.from('agenda_sesiones').insert({
      colegio_id: usuario.colegio_id,
      alumno_id: alumnoId,
      profesional_id: reserva.profesional_id,
      fecha: reserva.fecha_solicitada,
      hora_inicio: reserva.hora_solicitada,
      hora_fin: horaFin,
      tipo_sesion: reserva.tipo_sesion,
      estado: 'programada',
      observaciones: `Reserva online — ${reserva.nombre_solicitante} (${reserva.email}). ${reserva.motivo ?? ''}`.trim(),
      creado_por: user.id,
    }).select('id').single()

    if (sesionError || !sesionCreada) return NextResponse.json({ error: sesionError?.message || 'No se pudo crear la sesión' }, { status: 500 })

    const { data, error } = await admin.from('reservas_publicas').update({
      estado: 'confirmada',
      alumno_id: alumnoId,
      agenda_sesion_id: (sesionCreada as any).id,
      gestionado_por: user.id,
      gestionado_at: new Date().toISOString(),
    }).eq('id', params.id).eq('estado', 'pendiente').select().single()

    if (error || !data) return NextResponse.json({ error: error?.message || 'No se pudo confirmar' }, { status: 500 })

    try {
      const { enviarEmail } = await import('@/lib/email')
      await enviarEmail({
        to: reserva.email,
        subject: 'Tu hora fue confirmada',
        html: `<p>Hola ${reserva.nombre_solicitante},</p><p>Tu sesión quedó confirmada para el ${reserva.fecha_solicitada} a las ${reserva.hora_solicitada.slice(0, 5)}.</p>`,
      })
    } catch (e) {
      console.error('No se pudo enviar email de confirmación:', e)
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
