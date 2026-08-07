export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import MiSuscripcionClient from '@/components/admin/MiSuscripcionClient'

export const metadata = { title: 'Mi Suscripción' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function SuscripcionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !['admin', 'super_admin'].includes(usuario.rol)) redirect('/inicio')

  const { data: suscripcion } = await admin.from('suscripciones').select('*').eq('colegio_id', usuario.colegio_id).single()
  const { data: pagos } = await admin.from('pagos_suscripcion').select('*').eq('colegio_id', usuario.colegio_id).order('created_at', { ascending: false }).limit(12)

  return <MiSuscripcionClient suscripcion={suscripcion as any} pagos={(pagos as any[]) ?? []} />
}
