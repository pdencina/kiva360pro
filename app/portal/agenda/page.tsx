export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PortalAgendaClient from '@/components/portal/PortalAgendaClient'

export const metadata = { title: 'Próximas sesiones' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PortalAgendaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const rol = (ur as any)?.rol
  if (!rol || !['apoderado', 'alumno'].includes(rol)) redirect('/portal')

  // Get alumno IDs
  let alumnoIds: string[] = []
  if (rol === 'alumno') {
    const { data: va } = await admin.from('usuario_alumno').select('alumno_id').eq('usuario_id', user.id)
    alumnoIds = (va ?? []).map((r: any) => r.alumno_id)
  } else {
    const { data: ta } = await admin.from('tutor_alumnos').select('alumno_id').eq('tutor_id', user.id)
    alumnoIds = (ta ?? []).map((r: any) => r.alumno_id)
  }

  if (alumnoIds.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-[14px] text-slate-400">No hay alumnos vinculados a tu cuenta.</p>
      </div>
    )
  }

  // Load upcoming sessions (from today forward)
  const today = new Date().toISOString().split('T')[0]
  const { data: sesiones } = await admin
    .from('agenda_sesiones')
    .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios(id, nombre, apellido)`)
    .in('alumno_id', alumnoIds)
    .gte('fecha', today)
    .in('estado', ['programada', 'confirmada'])
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(20)

  // Load past sessions (last 10)
  const { data: pasadas } = await admin
    .from('agenda_sesiones')
    .select(`*, alumno:alumnos(id, nombre, apellido), profesional:usuarios(id, nombre, apellido)`)
    .in('alumno_id', alumnoIds)
    .lt('fecha', today)
    .in('estado', ['completada', 'no_asistio'])
    .order('fecha', { ascending: false })
    .limit(10)

  return <PortalAgendaClient proximas={(sesiones as any[]) ?? []} pasadas={(pasadas as any[]) ?? []} />
}
