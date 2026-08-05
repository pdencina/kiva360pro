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
      profesional:usuarios(id, nombre, apellido),
      tarifa:tarifas_sesion(id, nombre, especialidad)
    `)
    .eq('colegio_id', usuario.colegio_id)
    .order('fecha_sesion', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (alumnoId) query = query.eq('alumno_id', alumnoId)
  if (profesionalId) query = query.eq('profesional_id', profesionalId)
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
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) {
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

  // Get tarifa if provided
  let monto = monto_override || 0
  let descripcion = 'Sesión terapéutica'

  if (tarifa_id) {
    const { data: tarifa } = await admin.from('tarifas_sesion').select('*').eq('id', tarifa_id).single()
    if (tarifa) {
      monto = monto_override || (tarifa as any).monto
      descripcion = `${(tarifa as any).nombre} — ${new Date(fecha_sesion + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
  }

  if (!monto) return NextResponse.json({ error: 'Debe indicar monto o tarifa' }, { status: 400 })

  // Check if alumno has an active pack for discount
  let descuentoFinal = descuento || 0
  let paqueteVendidoId: string | null = null

  const { data: packActivo } = await admin
    .from('paquetes_vendidos')
    .select('id, sesiones_total, sesiones_usadas, paquete:paquetes_sesion(descuento_pct)')
    .eq('alumno_id', alumno_id)
    .eq('activo', true)
    .eq('estado_pago', 'pagado')
    .lt('sesiones_usadas', admin.rpc ? 999 : 999) // will filter in code
    .order('created_at', { ascending: true })
    .limit(1)

  if (packActivo && (packActivo as any[]).length > 0) {
    const pack = (packActivo as any[])[0]
    if (pack.sesiones_usadas < pack.sesiones_total) {
      descuentoFinal = Math.round(monto * ((pack.paquete?.descuento_pct || 100) / 100))
      paqueteVendidoId = pack.id
    }
  }

  const montoFinal = Math.max(0, monto - descuentoFinal)

  // Get familia_id for this alumno
  const { data: familia } = await admin.from('familias').select('id').eq('alumno_id', alumno_id).limit(1).single()

  const { data, error } = await admin.from('cobros_sesion').insert({
    colegio_id: usuario.colegio_id,
    alumno_id,
    profesional_id,
    tarifa_id: tarifa_id || null,
    familia_id: (familia as any)?.id || null,
    agenda_sesion_id: agenda_sesion_id || null,
    sesion_terapeutica_id: sesion_terapeutica_id || null,
    fecha_sesion,
    descripcion,
    monto,
    descuento: descuentoFinal,
    monto_final: montoFinal,
    estado: paqueteVendidoId ? 'pagado' : 'pendiente', // If from pack, mark as paid
  }).select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios(id, nombre, apellido)`).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If pack was used, increment sesiones_usadas
  if (paqueteVendidoId) {
    await admin.rpc('increment_pack_usage', { pack_id: paqueteVendidoId })
      .catch(() => {
        // Fallback: direct update
        admin.from('paquetes_vendidos')
          .update({ sesiones_usadas: admin.rpc ? 1 : 1 }) // will handle with raw SQL
          .eq('id', paqueteVendidoId)
      })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH: Marcar como pagado
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
  const { id, estado, medio_pago, comprobante_url } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

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
    .select(`*, alumno:alumnos(id, nombre, apellido), profesional:usuarios(id, nombre, apellido)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
