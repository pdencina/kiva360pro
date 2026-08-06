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

// POST: Bulk upsert permissions
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Solo el director puede gestionar permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { permisos } = body

  if (!Array.isArray(permisos) || permisos.length === 0) {
    return NextResponse.json({ error: 'permisos array requerido' }, { status: 400 })
  }

  // Delete existing permisos for the roles being updated
  const rolesActualizados = [...new Set(permisos.map((p: any) => p.rol))]
  await admin
    .from('permisos_rol')
    .delete()
    .is('colegio_id', null)
    .in('rol', rolesActualizados)

  // Insert all new permisos
  const inserts = permisos.map((p: any) => ({
    colegio_id: null,
    rol: p.rol,
    modulo: p.modulo,
    habilitado: p.habilitado,
  }))

  const { error } = await admin.from('permisos_rol').insert(inserts)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: inserts.length })
}
