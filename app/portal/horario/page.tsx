export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PortalHorarioClient from '@/components/portal/PortalHorarioClient'

export const metadata = { title: 'Horario' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PortalHorarioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  const rol = (ur as any)?.rol
  if (!['apoderado', 'alumno'].includes(rol)) redirect('/portal')

  let alumnoIds: string[] = []
  if (rol === 'alumno') {
    const { data: va } = await admin.from('usuario_alumno').select('alumno_id').eq('usuario_id', user.id)
    alumnoIds = (va ?? []).map((r: any) => r.alumno_id)
  } else {
    const { data: ta } = await admin.from('tutor_alumnos').select('alumno_id').eq('tutor_id', user.id)
    alumnoIds = (ta ?? []).map((r: any) => r.alumno_id)
  }

  if (alumnoIds.length === 0) {
    return <div className="p-8 text-center"><p className="text-[14px] text-slate-400">No hay alumnos vinculados.</p></div>
  }

  // Get alumnos info
  const { data: alumnos } = await admin.from('alumnos').select('id, nombre, apellido, curso').in('id', alumnoIds)

  // Get all horarios for these alumnos
  const { data: bloques } = await admin
    .from('horario_alumno')
    .select('*, profesional:usuarios(nombre, apellido)')
    .in('alumno_id', alumnoIds)
    .eq('activo', true)
    .order('dia_semana')
    .order('hora_inicio')

  return <PortalHorarioClient alumnos={(alumnos as any[]) ?? []} bloques={(bloques as any[]) ?? []} />
}
