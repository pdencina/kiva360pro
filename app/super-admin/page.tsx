export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SuperAdminDashboard from '@/components/super-admin/SuperAdminDashboard'

export const metadata = { title: 'Panel Kiva360 — Super Admin' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function SuperAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  if ((ur as any)?.rol !== 'super_admin') redirect('/inicio')

  // Load all data for dashboard
  const [
    { data: colegios },
    { data: propuestas },
    { data: alumnos },
    { data: usuarios },
    { data: prospectos },
  ] = await Promise.all([
    admin.from('colegios').select('*').order('nombre'),
    admin.from('propuestas').select('*').order('created_at', { ascending: false }),
    admin.from('alumnos').select('colegio_id, activo'),
    admin.from('usuarios').select('colegio_id, rol, activo, created_at'),
    admin.from('prospectos').select('colegio_id, etapa, created_at'),
  ])

  return (
    <SuperAdminDashboard
      colegios={(colegios as any[]) ?? []}
      propuestas={(propuestas as any[]) ?? []}
      alumnos={(alumnos as any[]) ?? []}
      usuarios={(usuarios as any[]) ?? []}
      prospectos={(prospectos as any[]) ?? []}
    />
  )
}
