export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import IntervencionClient from '@/components/intervencion/IntervencionClient'

export const metadata = { title: 'Intervención NEE' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function IntervencionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id

  // Cargar planes con datos relacionados
  const { data: planes } = await admin
    .from('planes_intervencion')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso, foto_url),
      equipo:equipo_intervencion(id, profesional_id, especialidad, rol_equipo, profesional:usuarios(nombre, apellido)),
      objetivos:objetivos_terapeuticos(id, area, descripcion, estado, progreso, prioridad)
    `)
    .eq('colegio_id', colegioId)
    .order('created_at', { ascending: false })

  // Cargar alumnos para el modal de crear plan
  const { data: alumnos } = await admin
    .from('alumnos')
    .select('id, nombre, apellido, curso')
    .eq('colegio_id', colegioId)
    .eq('activo', true)
    .order('apellido')

  // Cargar profesionales (tutores/admins) para asignar
  const { data: profesionales } = await admin
    .from('usuarios')
    .select('id, nombre, apellido, email, rol')
    .eq('colegio_id', colegioId)
    .eq('activo', true)
    .in('rol', ['tutor', 'admin', 'pastor_campus'])
    .order('apellido')

  return (
    <IntervencionClient
      planes={(planes as any[]) ?? []}
      alumnos={(alumnos as any[]) ?? []}
      profesionales={(profesionales as any[]) ?? []}
    />
  )
}
