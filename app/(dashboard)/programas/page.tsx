export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import ProgramasClient from '@/components/programas/ProgramasClient'

export const metadata = { title: 'Programas' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function ProgramasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'tutor'].includes(usuario?.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id

  const [{ data: programas }, { data: alumnos }] = await Promise.all([
    admin.from('programas')
      .select(`*, inscripciones:inscripciones_programa(id, alumno_id, estado, fecha_ingreso, alumno:alumnos(id, nombre, apellido, curso))`)
      .eq('colegio_id', colegioId).order('activo', { ascending: false }).order('nombre'),
    admin.from('alumnos').select('id, nombre, apellido, curso').eq('colegio_id', colegioId).eq('activo', true).order('apellido'),
  ])

  return (
    <ProgramasClient
      programas={(programas as any[]) ?? []}
      alumnos={(alumnos as any[]) ?? []}
      rol={usuario.rol}
    />
  )
}
