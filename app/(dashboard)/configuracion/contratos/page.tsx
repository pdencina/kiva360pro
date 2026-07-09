export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PlantillasContratoClient from '@/components/configuracion/PlantillasContratoClient'

export const metadata = { title: 'Plantillas de Contrato' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PlantillasContratoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!['super_admin', 'admin'].includes(usuario?.rol)) redirect('/inicio')

  const { data: plantillas } = await admin
    .from('plantillas_contrato')
    .select('*')
    .eq('colegio_id', usuario.colegio_id)
    .order('nombre')

  return <PlantillasContratoClient plantillas={(plantillas as any[]) ?? []} />
}
