export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AgendaClient from '@/components/agenda/AgendaClient'

export const metadata = { title: 'Agenda' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AgendaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id

  // Load alumnos and profesionales for the create modal
  const [{ data: alumnos }, { data: profesionales }] = await Promise.all([
    admin.from('alumnos').select('id, nombre, apellido, curso').eq('colegio_id', colegioId).eq('activo', true).order('apellido'),
    admin.from('usuarios').select('id, nombre, apellido, rol').eq('colegio_id', colegioId).eq('activo', true).in('rol', ['tutor', 'admin', 'pastor_campus']).order('apellido'),
  ])

  return (
    <AgendaClient
      alumnos={(alumnos as any[]) ?? []}
      profesionales={(profesionales as any[]) ?? []}
      currentUserId={user.id}
    />
  )
}
