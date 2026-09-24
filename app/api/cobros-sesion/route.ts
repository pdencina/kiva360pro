import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generarCobroSesion } from '@/lib/generar-cobro-sesion'
import { generarDocumentoPendiente } from '@/lib/generar-documento-pendiente'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: Listar cobros de sesión
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
  const profesionalId = searchParams.get('profesional_id')
  const mes = searchParams.get('mes')
  const anio = searchParams.get('anio')

  let query = admin
    .from('cobros_sesion')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso),
      profesional:usuarios!profesional_id(id, nombre, apellido),
      tarifa:tarifas_sesion(id, nombre, especialidad)
    `)
    .eq('colegio_id', usuario.colegio_id)
    .order('fecha_sesion', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (alumnoId) query = query.eq('alumno_id', alumnoId)
  if (profesionalId) query = query.eq('profesional_id', profesionalId)

  // Tutor solo ve sus propios cobros de sesión
  if (usuario.rol === 'tutor' && !profesionalId) {
    query = query.eq('profesional_id', user.id)
  }
  if (mes && anio) {
    const desde = `${anio}-${mes.padStart(2, '0')}-01`
    const hasta = `${anio}-${mes.padStart(2, '0')}-31`
    query = query.gte('fecha_sesion', desde).lte('fecha_sesion', hasta)
  }

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Generar cobro por sesión (manual o automático al completar sesión)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus', 'finanzas'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const {
    alumno_id, profesional_id, tarifa_id, fecha_sesion,
    agenda_sesion_id, sesion_terapeutica_id, monto_override, descuento
  } = body

  if (!alumno_id || !profesional_id || !fecha_sesion) {
    return NextResponse.json({ error: 'alumno_id, profesional_id y fecha_sesion requeridos' }, { status: 400 })
  }

  try {
    const { cobro, paqueteAplicado, repetido } = await generarCobroSesion({
      admin, colegioId: usuario.colegio_id, alumnoId: alumno_id, profesionalId: profesional_id,
      fechaSesion: fecha_sesion, tarifaId: tarifa_id, montoOverride: monto_override, descuentoManual: descuento,
      agendaSesionId: agenda_sesion_id, sesionTerapeuticaId: sesion_terapeutica_id, userId: user.id,
    })
    return NextResponse.json({ ...cobro, cubierto_por_plan: paqueteAplicado }, { status: repetido ? 200 : 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH: Marcar como pagado
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'finanzas'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { id, estado, medio_pago, comprobante_url } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  if (!['pendiente', 'pagado', 'parcial', 'anulado', 'condonado'].includes(estado)) {
    return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
  }

  // Una atención cubierta por un plan la administra el plan: no se cobra ni se anula a mano
  // (se revierte el consumo desde el detalle del plan, que devuelve la sesión y deja auditoría).
  const { data: actual } = await admin.from('cobros_sesion').select('paquete_vendido_id, estado')
    .eq('id', id).eq('colegio_id', usuario.colegio_id).single()
  if (!actual) return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  if ((actual as { paquete_vendido_id: string | null }).paquete_vendido_id) {
    return NextResponse.json({ error: 'Esta atención está cubierta por un plan. Para corregirla, revierte el consumo desde el detalle del plan.' }, { status: 409 })
  }

  const updates: any = { estado }
  if (estado === 'pagado') {
    updates.fecha_pago = new Date().toISOString().split('T')[0]
    updates.pagado_por = user.id
  }
  if (medio_pago) updates.medio_pago = medio_pago
  if (comprobante_url) updates.comprobante_url = comprobante_url

  const { data, error } = await admin
    .from('cobros_sesion')
    .update(updates)
    .eq('id', id)
    .eq('colegio_id', usuario.colegio_id)
    .select(`*, alumno:alumnos(id, nombre, apellido), familia:familias(nombre_apoderado, apellido_apoderado, email), profesional:usuarios!profesional_id(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (estado === 'pagado' && data) {
    const d = data as any
    await generarDocumentoPendiente({
      admin, colegioId: usuario.colegio_id, alumnoId: d.alumno_id, familiaId: d.familia_id,
      cobroSesionId: d.id, montoTotal: d.monto_final, descripcion: d.descripcion,
      receptorNombre: `${d.familia?.nombre_apoderado ?? ''} ${d.familia?.apellido_apoderado ?? ''}`.trim() || 'Apoderado',
      receptorEmail: d.familia?.email ?? null,
    }).catch(err => console.error('Error generando documento pendiente:', err))
  }

  return NextResponse.json(data)
}
