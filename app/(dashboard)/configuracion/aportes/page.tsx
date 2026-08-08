export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import TablaAportesClient from '@/components/admin/TablaAportesClient'

export const metadata = { title: 'Tabla de Aportes' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AportesColegioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !['admin', 'super_admin'].includes(usuario.rol)) redirect('/inicio')

  // Obtener aportes del colegio (o globales si no tiene propios)
  const { data: aportes } = await admin
    .from('tabla_aportes')
    .select('*')
    .eq('activo', true)
    .eq('colegio_id', usuario.colegio_id)
    .order('anio', { ascending: false })
    .order('nivel')
    .order('tipo')

  return <TablaAportesClient aportes={(aportes as any[]) ?? []} />
}
