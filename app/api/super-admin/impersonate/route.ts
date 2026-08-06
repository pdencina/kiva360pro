import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Switch super_admin into a specific colegio's view
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })
  }

  const body = await request.json()
  const { colegio_id } = body

  if (!colegio_id) return NextResponse.json({ error: 'colegio_id requerido' }, { status: 400 })

  // Verify colegio exists
  const { data: colegio } = await admin.from('colegios').select('id, nombre').eq('id', colegio_id).single()
  if (!colegio) return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })

  // Update super_admin's colegio_id temporarily
  await admin.from('usuarios').update({ colegio_id }).eq('id', user.id)

  return NextResponse.json({ ok: true, colegio: (colegio as any).nombre })
}

// DELETE: Exit impersonation (go back to super_admin view without colegio)
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })
  }

  // Remove colegio_id to go back to super_admin global view
  await admin.from('usuarios').update({ colegio_id: null }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
