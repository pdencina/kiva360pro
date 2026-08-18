export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import IncidentesClient from '@/components/incidentes/IncidentesClient'

export const metadata = { title: 'Incidentes' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function IncidentesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  const { data: actas } = await admin
    .from('actas_conducta')
    .select('*, alumno:alumnos(id, nombre, apellido, curso), creador:usuarios!creado_por(nombre, apellido)')
    .eq('colegio_id', usuario.colegio_id)
    .order('fecha_evento', { ascending: false })
    .limit(50)

  const { data: alumnos } = await admin
    .from('alumnos')
    .select('id, nombre, apellido, curso')
    .eq('colegio_id', usuario.colegio_id)
    .eq('activo', true)
    .order('apellido')

  return <IncidentesClient actas={(actas as any[]) ?? []} alumnos={(alumnos as any[]) ?? []} />
}
