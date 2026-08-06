export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PortalInformesClient from '@/components/portal/PortalInformesClient'

export const metadata = { title: 'Informes terapéuticos' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PortalInformesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol').eq('id', user.id).single()
  const rol = (ur as any)?.rol
  if (!['apoderado', 'alumno'].includes(rol)) redirect('/portal')

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
    return <div className="p-8 text-center"><p className="text-[14px] text-slate-400">No hay alumnos vinculados a tu cuenta.</p></div>
  }

  // Get alumnos info
  const { data: alumnos } = await admin.from('alumnos').select('id, nombre, apellido, curso').in('id', alumnoIds)

  // Get informes marked as visible_familia
  const { data: informes } = await admin
    .from('informes_terapeuticos')
    .select('*, profesional:usuarios(nombre, apellido), alumno:alumnos(id, nombre, apellido)')
    .in('alumno_id', alumnoIds)
    .eq('visible_familia', true)
    .order('fecha', { ascending: false })

  // Get documentos marked as visible_familia
  const { data: documentos } = await admin
    .from('documentos_alumno')
    .select('*, alumno:alumnos(id, nombre, apellido)')
    .in('alumno_id', alumnoIds)
    .eq('visible_familia', true)
    .order('created_at', { ascending: false })

  return (
    <PortalInformesClient
      alumnos={(alumnos as any[]) ?? []}
      informes={(informes as any[]) ?? []}
      documentos={(documentos as any[]) ?? []}
    />
  )
}
