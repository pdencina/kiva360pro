export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PostulacionTracker from '@/components/admision/PostulacionTracker'

export const metadata = { title: 'Mi Postulación' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PostulacionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()

  // Obtener datos del usuario
  const { data: usuario } = await admin.from('usuarios').select('rol, colegio_id, nombre').eq('id', user.id).single()
  if (!(usuario as any) || (usuario as any).rol !== 'postulante') redirect('/portal')

  // Obtener postulación vinculada al usuario
  const { data: prospecto } = await admin
    .from('prospectos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Obtener nombre del colegio
  const { data: colegio } = await admin
    .from('colegios')
    .select('nombre, logo_url')
    .eq('id', (usuario as any).colegio_id)
    .single()

  return (
    <PostulacionTracker
      prospecto={prospecto as any}
      colegio={colegio as any}
      usuario={usuario as any}
    />
  )
}
