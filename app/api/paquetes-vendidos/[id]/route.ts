import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { enriquecerPlan, mensajeErrorPlan, esErrorNegocioPlan, type PlanRow } from '@/lib/planes'
import { generarDocumentoPlanPagado } from '@/lib/generar-documento-pendiente'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function autenticar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) }
  }
  return { admin, user, colegioId: usuario.colegio_id }
}

// GET: detalle del plan = resumen + historial de pagos + historial de consumo + documentos.
// Responde "¿qué sesiones consumieron este plan?".
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await autenticar()
  if ('error' in auth) return auth.error
  const { admin, colegioId } = auth

  const { data: plan } = await admin
    .from('paquetes_vendidos')
    .select('*, paquete:paquetes_sesion(nombre, vigencia_dias, prestaciones:paquete_prestaciones(cantidad, tarifa:tarifas_sesion(id, nombre, monto))), alumno:alumnos(id, nombre, apellido, curso)')
    .eq('id', params.id).eq('colegio_id', colegioId).single()
  if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const [{ data: pagos }, { data: consumos }, { data: documentos }] = await Promise.all([
    admin.from('pagos').select('id, monto, medio_pago, referencia, estado, created_at').eq('paquete_vendido_id', params.id).order('created_at', { ascending: false }),
    admin.from('plan_consumos')
      .select('id, estado, fecha_sesion, unidades, monto_cubierto, created_at, revertido_at, motivo_reverso, agenda_sesion_id, cobro_sesion_id, tarifa:tarifas_sesion(id, nombre), profesional:usuarios!profesional_id(id, nombre, apellido)')
      .eq('paquete_vendido_id', params.id).eq('colegio_id', colegioId)
      .order('fecha_sesion', { ascending: false }).order('created_at', { ascending: false }),
    admin.from('documentos_tributarios').select('id, tipo, folio, estado, monto_total').eq('paquete_vendido_id', params.id).neq('estado', 'anulado'),
  ])

  return NextResponse.json({
    plan: enriquecerPlan(plan as unknown as PlanRow),
    pagos: pagos ?? [],
    consumos: consumos ?? [],
    documentos: documentos ?? [],
  })
}

// PATCH: acciones sobre el plan. Cada una es una función SQL transaccional que valida el tenant,
// bloquea el plan y deja auditoría en la misma transacción.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await autenticar()
  if ('error' in auth) return auth.error
  const { admin, user, colegioId } = auth

  const body = await request.json()
  const accion = body.accion as string

  let rpc: string
  let args: Record<string, unknown>

  if (accion === 'registrar_pago') {
    rpc = 'registrar_pago_plan'
    args = {
      p_colegio: colegioId, p_plan: params.id, p_user: user.id, p_monto: Number(body.monto),
      p_medio_pago: body.medio_pago || null, p_referencia: body.referencia || null, p_idempotency_key: body.idempotency_key || null,
    }
  } else if (accion === 'cancelar') {
    rpc = 'cancelar_plan'
    args = { p_colegio: colegioId, p_plan: params.id, p_user: user.id, p_motivo: body.motivo || null }
  } else if (accion === 'cambiar_vigencia') {
    rpc = 'cambiar_vigencia_plan'
    args = { p_colegio: colegioId, p_plan: params.id, p_user: user.id, p_nueva: body.fecha_vencimiento || null }
  } else if (accion === 'revertir_consumo') {
    if (!body.consumo_id) return NextResponse.json({ error: 'consumo_id requerido' }, { status: 400 })
    // El consumo debe pertenecer a ESTE plan (no basta con que sea del centro).
    const { data: consumo } = await admin.from('plan_consumos').select('id').eq('id', body.consumo_id).eq('paquete_vendido_id', params.id).eq('colegio_id', colegioId).maybeSingle()
    if (!consumo) return NextResponse.json({ error: 'El consumo no pertenece a este plan' }, { status: 404 })
    rpc = 'revertir_consumo_plan'
    args = { p_colegio: colegioId, p_consumo: body.consumo_id, p_user: user.id, p_motivo: body.motivo || null }
  } else {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const { data, error } = await admin.rpc(rpc, args)
  if (error) {
    const negocio = esErrorNegocioPlan(error.message)
    return NextResponse.json({ error: mensajeErrorPlan(error.message) }, { status: negocio ? 400 : 500 })
  }

  if (accion === 'registrar_pago') {
    const r = data as { repetido?: boolean; estado_pago?: string }
    if (!r.repetido && r.estado_pago === 'pagado') await generarDocumentoPlanPagado(admin, colegioId, params.id)
  }

  return NextResponse.json({ ok: true, resultado: data })
}
