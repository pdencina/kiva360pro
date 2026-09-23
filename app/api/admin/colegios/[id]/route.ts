import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'
import type { ModuloAddOn } from '@/lib/modulos'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function checkSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: ur } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  return (ur as any)?.rol === 'super_admin' ? user : null
}

const MODULOS_VALIDOS: ModuloAddOn[] = ['finanzas', 'salud']

// PATCH: activar/desactivar un add-on comercial (finanzas, salud) para un colegio
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { modulo, activo } = body

  if (!MODULOS_VALIDOS.includes(modulo)) {
    return NextResponse.json({ error: `modulo debe ser uno de: ${MODULOS_VALIDOS.join(', ')}` }, { status: 400 })
  }

  const admin = getAdminClient()
  const { data: colegio } = await admin.from('colegios').select('modulos_activos').eq('id', params.id).single()
  if (!colegio) return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })

  const actuales: string[] = (colegio as any).modulos_activos ?? []
  const nuevos = activo
    ? Array.from(new Set([...actuales, modulo]))
    : actuales.filter(m => m !== modulo)

  const { data, error } = await admin.from('colegios').update({ modulos_activos: nuevos }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await registrarAuditoriaFinanciera({
    admin, colegioId: params.id, usuarioId: user.id,
    accion: activo ? 'modulo_activado' : 'modulo_desactivado', entidad: 'colegios', entidadId: params.id,
    valorAnterior: { modulos_activos: actuales },
    valorNuevo: { modulos_activos: nuevos },
  })

  return NextResponse.json(data)
}
