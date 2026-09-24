import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { calcularDescuentoPct } from '@/lib/planes'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH: editar un plan del catálogo (nombre, precio, vigencia) o archivarlo (activo=false).
// Los planes YA vendidos no cambian: su precio/descuento quedaron congelados al venderse.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as { rol: string; colegio_id: string | null } | null
  if (!usuario?.colegio_id || !accesoFinanzas(usuario.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: actualRow } = await admin.from('paquetes_sesion').select('*').eq('id', params.id).eq('colegio_id', usuario.colegio_id).single()
  if (!actualRow) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  const actual = actualRow as { nombre: string; precio_total: number; vigencia_dias: number | null; activo: boolean; valor_original: number | null }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim()
    if (!nombre) return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })
    updates.nombre = nombre
  }
  if (body.precio_total !== undefined) {
    const precio = Number(body.precio_total)
    if (!Number.isInteger(precio) || precio < 0) return NextResponse.json({ error: 'El precio debe ser un entero mayor o igual a 0' }, { status: 400 })
    updates.precio_total = precio
    updates.descuento_pct = Math.round(calcularDescuentoPct(actual.valor_original, precio))
  }
  if (body.vigencia_dias !== undefined) {
    const v = body.vigencia_dias === null || body.vigencia_dias === '' ? null : Number(body.vigencia_dias)
    if (v !== null && (!Number.isInteger(v) || v < 1)) return NextResponse.json({ error: 'La vigencia debe ser un número de días mayor a 0' }, { status: 400 })
    updates.vigencia_dias = v
  }
  if (body.activo !== undefined) updates.activo = !!body.activo

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { data, error } = await admin.from('paquetes_sesion').update(updates).eq('id', params.id).eq('colegio_id', usuario.colegio_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cambioPrecio = updates.precio_total !== undefined && updates.precio_total !== actual.precio_total
  await registrarAuditoriaFinanciera({
    admin, colegioId: usuario.colegio_id, usuarioId: user.id,
    accion: cambioPrecio ? 'plan_precio_modificado' : updates.activo === false ? 'plan_archivado' : 'plan_modificado',
    entidad: 'paquetes_sesion', entidadId: params.id,
    valorAnterior: { nombre: actual.nombre, precio_total: actual.precio_total, vigencia_dias: actual.vigencia_dias, activo: actual.activo },
    valorNuevo: updates,
  })

  return NextResponse.json(data)
}
