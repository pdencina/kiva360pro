import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { calcularValorOriginal, calcularDescuentoPct } from '@/lib/planes'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SELECT_CATALOGO = '*, prestaciones:paquete_prestaciones(id, tarifa_id, cantidad, tarifa:tarifas_sesion(id, nombre, monto))'

// GET: catálogo de planes del centro (con las prestaciones que cada plan permite)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data, error } = await admin
    .from('paquetes_sesion')
    .select(SELECT_CATALOGO)
    .eq('colegio_id', usuario.colegio_id)
    .eq('activo', true)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

interface PrestacionInput { tarifa_id: string; cantidad?: number | null }

// POST: crear un plan en el catálogo. Un plan DEBE indicar qué prestaciones puede consumir.
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
  const cantidad = Number(body.cantidad)
  const precioTotal = Number(body.precio_total)
  const vigenciaDias = body.vigencia_dias === null || body.vigencia_dias === undefined || body.vigencia_dias === '' ? null : Number(body.vigencia_dias)
  const prestacionesIn: PrestacionInput[] = Array.isArray(body.prestaciones) ? body.prestaciones : []

  if (!nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!Number.isInteger(cantidad) || cantidad < 1) return NextResponse.json({ error: 'La cantidad de sesiones debe ser un entero mayor a 0' }, { status: 400 })
  if (!Number.isInteger(precioTotal) || precioTotal < 0) return NextResponse.json({ error: 'El precio debe ser un entero mayor o igual a 0' }, { status: 400 })
  if (vigenciaDias !== null && (!Number.isInteger(vigenciaDias) || vigenciaDias < 1)) return NextResponse.json({ error: 'La vigencia debe ser un número de días mayor a 0' }, { status: 400 })
  if (prestacionesIn.length === 0) return NextResponse.json({ error: 'Selecciona al menos una prestación que el plan pueda consumir' }, { status: 400 })

  const ids = prestacionesIn.map(p => p.tarifa_id)
  if (new Set(ids).size !== ids.length) return NextResponse.json({ error: 'Hay prestaciones repetidas' }, { status: 400 })
  for (const p of prestacionesIn) {
    if (p.cantidad !== null && p.cantidad !== undefined && (!Number.isInteger(p.cantidad) || p.cantidad < 1)) {
      return NextResponse.json({ error: 'La cantidad por prestación debe ser un entero mayor a 0' }, { status: 400 })
    }
  }
  const sumaCantidades = prestacionesIn.reduce((a, p) => a + (p.cantidad ?? 0), 0)
  if (sumaCantidades > cantidad) return NextResponse.json({ error: 'La suma de sesiones por prestación excede el total del plan' }, { status: 400 })

  // Las prestaciones deben ser de este centro (aislamiento multi-tenant)
  const { data: tarifas } = await admin.from('tarifas_sesion').select('id, monto').eq('colegio_id', usuario.colegio_id).eq('activo', true).in('id', ids)
  if (!tarifas || tarifas.length !== ids.length) return NextResponse.json({ error: 'Alguna prestación no existe o está inactiva' }, { status: 400 })
  const montoPorTarifa = new Map((tarifas as { id: string; monto: number }[]).map(t => [t.id, t.monto]))

  const valorOriginal = calcularValorOriginal(
    prestacionesIn.map(p => ({ monto: montoPorTarifa.get(p.tarifa_id) as number, cantidad: p.cantidad ?? null })),
    cantidad,
  )
  const descuentoPct = valorOriginal ? calcularDescuentoPct(valorOriginal, precioTotal) : 0

  const { data: paquete, error } = await admin.from('paquetes_sesion').insert({
    colegio_id: usuario.colegio_id, nombre, cantidad, precio_total: precioTotal,
    vigencia_dias: vigenciaDias, valor_original: valorOriginal, descuento_pct: Math.round(descuentoPct),
  }).select('id').single()
  if (error || !paquete) return NextResponse.json({ error: error?.message ?? 'No se pudo crear el plan' }, { status: 500 })
  const paqueteId = (paquete as { id: string }).id

  const { error: errPrest } = await admin.from('paquete_prestaciones').insert(
    prestacionesIn.map(p => ({ colegio_id: usuario.colegio_id, paquete_id: paqueteId, tarifa_id: p.tarifa_id, cantidad: p.cantidad ?? null }))
  )
  if (errPrest) {
    await admin.from('paquetes_sesion').delete().eq('id', paqueteId)
    return NextResponse.json({ error: errPrest.message }, { status: 500 })
  }

  await registrarAuditoriaFinanciera({
    admin, colegioId: usuario.colegio_id, usuarioId: user.id,
    accion: 'plan_creado', entidad: 'paquetes_sesion', entidadId: paqueteId,
    valorNuevo: { nombre, cantidad, precio_total: precioTotal, vigencia_dias: vigenciaDias, valor_original: valorOriginal, prestaciones: prestacionesIn },
  })

  const { data: completo } = await admin.from('paquetes_sesion').select(SELECT_CATALOGO).eq('id', paqueteId).single()
  return NextResponse.json(completo, { status: 201 })
}
