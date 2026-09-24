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

// GET: planes vendidos del centro (opcionalmente de un paciente), con estado y saldo calculados.
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const alumnoId = new URL(request.url).searchParams.get('alumno_id')

  let query = admin
    .from('paquetes_vendidos')
    .select('*, paquete:paquetes_sesion(nombre), alumno:alumnos(id, nombre, apellido, curso)')
    .eq('colegio_id', usuario.colegio_id)
    .order('created_at', { ascending: false })

  if (alumnoId) query = query.eq('alumno_id', alumnoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(((data ?? []) as unknown as PlanRow[]).map(enriquecerPlan))
}

// POST: vender un plan. Todo (validar paciente/plan del centro, congelar precios, registrar el pago,
// auditar) ocurre en UNA transacción SQL; idempotente con idempotency_key (doble clic).
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { paquete_id, alumno_id, pagar, medio_pago, referencia, fecha_inicio, fecha_vencimiento, idempotency_key } = body

  if (!paquete_id || !alumno_id) {
    return NextResponse.json({ error: 'paquete_id y alumno_id son requeridos' }, { status: 400 })
  }
  if (pagar && !medio_pago) {
    return NextResponse.json({ error: 'Indica el medio de pago' }, { status: 400 })
  }

  const { data, error } = await admin.rpc('vender_plan', {
    p_colegio: usuario.colegio_id,
    p_paquete: paquete_id,
    p_alumno: alumno_id,
    p_user: user.id,
    p_fecha_inicio: fecha_inicio || null,
    p_fecha_vencimiento: fecha_vencimiento || null,
    p_pagar: !!pagar,
    p_medio_pago: medio_pago || null,
    p_referencia: referencia || null,
    p_idempotency_key: idempotency_key || null,
  })

  if (error) {
    const negocio = esErrorNegocioPlan(error.message)
    return NextResponse.json({ error: mensajeErrorPlan(error.message) }, { status: negocio ? 400 : 500 })
  }

  const resultado = data as { plan_id: string; repetido: boolean; pago?: { estado_pago: string } | null }

  if (!resultado.repetido && resultado.pago?.estado_pago === 'pagado') {
    await generarDocumentoPlanPagado(admin, usuario.colegio_id, resultado.plan_id)
  }

  const { data: plan } = await admin.from('paquetes_vendidos')
    .select('*, paquete:paquetes_sesion(nombre), alumno:alumnos(id, nombre, apellido, curso)')
    .eq('id', resultado.plan_id).single()

  return NextResponse.json(enriquecerPlan(plan as unknown as PlanRow), { status: resultado.repetido ? 200 : 201 })
}
