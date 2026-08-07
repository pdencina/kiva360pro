export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SuscripcionesClient from '@/components/admin/SuscripcionesClient'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export const metadata = { title: 'Suscripciones' }

export default async function SuscripcionesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') redirect('/inicio')

  // Obtener suscripciones con datos del colegio
  const { data: suscripciones } = await admin
    .from('suscripciones')
    .select('*, colegio:colegios(id, nombre)')
    .order('created_at', { ascending: false })

  // Obtener colegios sin suscripción
  const { data: colegios } = await admin.from('colegios').select('id, nombre, plan')

  return (
    <SuscripcionesClient
      suscripciones={(suscripciones as any[]) ?? []}
      colegios={(colegios as any[]) ?? []}
    />
  )
}
