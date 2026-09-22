import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { getBillingProvider } from '@/lib/billing/provider'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: listar documentos tributarios del colegio (opcionalmente filtrado por estado)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!accesoFinanzas(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')

  let query = admin
    .from('documentos_tributarios')
    .select('*, alumno:alumnos(nombre, apellido), familia:familias(nombre_apoderado, apellido_apoderado, email)')
    .eq('colegio_id', usuario.colegio_id)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: generar un documento tributario a partir de un cobro pagado (mensualidad o sesión)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!accesoFinanzas(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { cobro_id, cobro_sesion_id, tipo, afecto_iva } = body

  if (!cobro_id && !cobro_sesion_id) {
    return NextResponse.json({ error: 'Debes indicar cobro_id o cobro_sesion_id' }, { status: 400 })
  }
  if (!['boleta', 'factura'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo debe ser boleta o factura' }, { status: 400 })
  }

  // Evitar duplicar: si ya existe un documento vigente (no anulado) para este origen, no crear otro
  let dupQuery = admin.from('documentos_tributarios').select('id').neq('estado', 'anulado')
  dupQuery = cobro_id ? dupQuery.eq('cobro_id', cobro_id) : dupQuery.eq('cobro_sesion_id', cobro_sesion_id)
  const { data: existente } = await dupQuery.maybeSingle()
  if (existente) {
    return NextResponse.json({ error: 'Ya existe un documento para este cobro' }, { status: 409 })
  }

  // Cargar el origen (cobro o cobro_sesion) con datos del receptor
  let alumnoId: string, familiaId: string | null, montoTotal: number, descripcion: string, receptorNombre: string, receptorEmail: string | null

  if (cobro_id) {
    const { data } = await admin.from('cobros').select('*, alumno:alumnos(nombre, apellido), familia:familias(nombre_apoderado, apellido_apoderado, email, rut), concepto:conceptos_cobro(nombre)').eq('id', cobro_id).eq('colegio_id', usuario.colegio_id).single()
    if (!data) return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    const c = data as any
    alumnoId = c.alumno_id
    familiaId = c.familia_id
    montoTotal = c.monto_pagado > 0 ? c.monto_pagado : c.monto
    descripcion = c.concepto?.nombre ?? 'Mensualidad'
    receptorNombre = `${c.familia?.nombre_apoderado ?? ''} ${c.familia?.apellido_apoderado ?? ''}`.trim() || 'Apoderado'
    receptorEmail = c.familia?.email ?? null
  } else {
    const { data } = await admin.from('cobros_sesion').select('*, alumno:alumnos(nombre, apellido), familia:familias(nombre_apoderado, apellido_apoderado, email, rut)').eq('id', cobro_sesion_id).eq('colegio_id', usuario.colegio_id).single()
    if (!data) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    const cs = data as any
    alumnoId = cs.alumno_id
    familiaId = cs.familia_id
    montoTotal = cs.monto_final
    descripcion = cs.descripcion
    receptorNombre = `${cs.familia?.nombre_apoderado ?? ''} ${cs.familia?.apellido_apoderado ?? ''}`.trim() || 'Apoderado'
    receptorEmail = cs.familia?.email ?? null
  }

  const { data: colegio } = await admin.from('colegios').select('proveedor_facturacion').eq('id', usuario.colegio_id).single()
  const provider = getBillingProvider((colegio as any)?.proveedor_facturacion ?? null)

  const resultado = await provider.emitDocument({
    tipo,
    colegioId: usuario.colegio_id,
    receptor: { razonSocial: receptorNombre, email: receptorEmail },
    items: [{ descripcion, monto: montoTotal }],
    montoTotal,
  })

  const esExento = afecto_iva === false
  const montoNeto = esExento ? montoTotal : Math.round(montoTotal / 1.19)
  const montoIva = esExento ? 0 : montoTotal - montoNeto

  const { data: documento, error } = await admin.from('documentos_tributarios').insert({
    colegio_id: usuario.colegio_id,
    alumno_id: alumnoId,
    familia_id: familiaId,
    cobro_id: cobro_id || null,
    cobro_sesion_id: cobro_sesion_id || null,
    tipo,
    folio: resultado.folio,
    monto_neto: montoNeto,
    monto_iva: montoIva,
    monto_total: montoTotal,
    afecto_iva: !esExento,
    proveedor: provider.nombre,
    proveedor_doc_id: resultado.proveedorDocId,
    estado: resultado.estado,
    emitido_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await registrarAuditoriaFinanciera({
    admin, colegioId: usuario.colegio_id, usuarioId: user.id,
    accion: 'documento_emitido', entidad: 'documentos_tributarios', entidadId: (documento as any).id,
    valorNuevo: { tipo, monto_total: montoTotal, estado: resultado.estado, cobro_id, cobro_sesion_id },
  })

  return NextResponse.json(documento, { status: 201 })
}
