export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PortalIntervencionClient from '@/components/portal/PortalIntervencionClient'

export const metadata = { title: 'Avances terapéuticos' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PortalIntervencionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const rol = (ur as any)?.rol

  if (!rol || !['apoderado', 'alumno'].includes(rol)) redirect('/portal')

  // Get alumno IDs linked to this user
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

  // Load active intervention plans for these alumnos
  const { data: planes } = await admin
    .from('planes_intervencion')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso, foto_url),
      objetivos:objetivos_terapeuticos(id, area, descripcion, estado, progreso, prioridad),
      equipo:equipo_intervencion(id, especialidad, profesional:usuarios(nombre, apellido))
    `)
    .in('alumno_id', alumnoIds)
    .in('estado', ['activo', 'pausado'])
    .order('created_at', { ascending: false })

  // For each plan, load recent sessions (last 10) and visible evoluciones
  const planesConDatos = await Promise.all(
    (planes ?? []).map(async (plan: any) => {
      const [{ data: sesiones }, { data: evoluciones }, { data: bitacora }] = await Promise.all([
        admin
          .from('sesiones_terapeuticas')
          .select('id, fecha, tipo_sesion, duracion_min, logros, indicaciones_familia, asistio, profesional:usuarios(nombre, apellido)')
          .eq('plan_id', plan.id)
          .eq('asistio', true)
          .order('fecha', { ascending: false })
          .limit(10),
        admin
          .from('evoluciones')
          .select('id, periodo, fecha, resumen, avances, recomendaciones, valoracion, profesional:usuarios(nombre, apellido)')
          .eq('plan_id', plan.id)
          .eq('visible_familia', true)
          .order('fecha', { ascending: false })
          .limit(5),
        admin
          .from('bitacora_conductual')
          .select('id, fecha, tipo, descripcion, registrado:usuarios(nombre, apellido)')
          .eq('plan_id', plan.id)
          .eq('visible_familia', true)
          .order('fecha', { ascending: false })
          .limit(10),
      ])

      return {
        ...plan,
        sesiones: sesiones ?? [],
        evoluciones: evoluciones ?? [],
        bitacora: bitacora ?? [],
      }
    })
  )

  return <PortalIntervencionClient planes={planesConDatos} />
}
