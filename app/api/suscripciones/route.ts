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

// POST: Crear nueva suscripción
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { colegio_id, plan, monto_mensual, estado, dias_gracia } = body

  if (!colegio_id || !monto_mensual) {
    return NextResponse.json({ error: 'Colegio y monto son requeridos' }, { status: 400 })
  }

  // Calcular próximo vencimiento (día 30 del mes siguiente)
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 30)
  const fecha_vencimiento = nextMonth.toISOString().split('T')[0]

  const { data, error } = await admin.from('suscripciones').insert({
    colegio_id,
    plan: plan || 'profesional',
    monto_mensual,
    estado: estado || 'activa',
    dias_gracia: dias_gracia || 5,
    fecha_vencimiento,
  }).select('*, colegio:colegios(id, nombre)').single()

  if (error) {
    console.error('Error creating suscripcion:', error)
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH: Registrar pago o actualizar estado
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { id, action, referencia } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (action === 'registrar_pago') {
    // Obtener suscripción
    const { data: sub } = await admin.from('suscripciones').select('*').eq('id', id).single()
    if (!sub) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })

    const s = sub as any
    const now = new Date()
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Registrar pago en historial
    await admin.from('pagos_suscripcion').insert({
      suscripcion_id: id,
      colegio_id: s.colegio_id,
      monto: s.monto_mensual,
      periodo,
      estado: 'pagado',
      metodo: 'transferencia',
      referencia: referencia || null,
      pagado_at: now.toISOString(),
    })

    // Actualizar suscripción
    const nextVenc = new Date(now.getFullYear(), now.getMonth() + 1, 30)
    const { data: updated } = await admin.from('suscripciones').update({
      estado: 'activa',
      ultimo_pago_at: now.toISOString(),
      meses_pagados: s.meses_pagados + 1,
      fecha_vencimiento: nextVenc.toISOString().split('T')[0],
    }).eq('id', id).select('*').single()

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}

// GET: Obtener suscripción del colegio actual (para admins)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (usuario.rol === 'super_admin') {
    const { data } = await admin.from('suscripciones').select('*, colegio:colegios(id, nombre)').order('created_at', { ascending: false })
    return NextResponse.json(data ?? [])
  }

  // Admin del colegio — solo su suscripción
  const { data: sub } = await admin.from('suscripciones').select('*').eq('colegio_id', usuario.colegio_id).single()
  const { data: pagos } = await admin.from('pagos_suscripcion').select('*').eq('colegio_id', usuario.colegio_id).order('created_at', { ascending: false }).limit(12)

  return NextResponse.json({ suscripcion: sub, pagos: pagos ?? [] })
}
