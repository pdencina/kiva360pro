export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdmisionPipelineClient from '@/components/admision/AdmisionPipelineClient'

export const metadata = { title: 'Admisión' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AdmisionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'gestor_admision'].includes(usuario?.rol)) redirect('/inicio')

  const { data: prospectos } = await admin
    .from('prospectos')
    .select('*')
    .eq('colegio_id', usuario.colegio_id)
    .order('created_at', { ascending: false })

  const colegioId = usuario.colegio_id

  return <AdmisionPipelineClient prospectos={(prospectos as any[]) ?? []} colegioId={colegioId} />
}
