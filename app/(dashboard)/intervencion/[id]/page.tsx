export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PlanDetailClient from '@/components/intervencion/PlanDetailClient'

export const metadata = { title: 'Plan de Intervención' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) redirect('/inicio')

  // Load plan with all related data
  const { data: plan } = await admin
    .from('planes_intervencion')
    .select(`
      *,
      alumno:alumnos(id, nombre, apellido, curso, foto_url, fecha_nacimiento),
      equipo:equipo_intervencion(id, profesional_id, especialidad, rol_equipo, horas_semanales, activo, profesional:usuarios(id, nombre, apellido, email)),
      objetivos:objetivos_terapeuticos(*, responsable:usuarios(id, nombre, apellido))
    `)
    .eq('id', params.id)
    .eq('colegio_id', usuario.colegio_id)
    .single()

  if (!plan) redirect('/intervencion')

  // Load recent sessions
  const { data: sesiones } = await admin
    .from('sesiones_terapeuticas')
    .select(`*, profesional:usuarios(id, nombre, apellido)`)
    .eq('plan_id', params.id)
    .order('fecha', { ascending: false })
    .limit(20)

  // Load bitácora
  const { data: bitacora } = await admin
    .from('bitacora_conductual')
    .select(`*, registrado:usuarios(id, nombre, apellido)`)
    .eq('plan_id', params.id)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(20)

  // Load evoluciones
  const { data: evoluciones } = await admin
    .from('evoluciones')
    .select(`*, profesional:usuarios(id, nombre, apellido)`)
    .eq('plan_id', params.id)
    .order('fecha', { ascending: false })

  // Profesionales disponibles para asignar
  const { data: profesionales } = await admin
    .from('usuarios')
    .select('id, nombre, apellido, email, rol')
    .eq('colegio_id', usuario.colegio_id)
    .eq('activo', true)
    .in('rol', ['tutor', 'admin', 'pastor_campus'])
    .order('apellido')

  return (
    <PlanDetailClient
      plan={plan as any}
      sesiones={(sesiones as any[]) ?? []}
      bitacora={(bitacora as any[]) ?? []}
      evoluciones={(evoluciones as any[]) ?? []}
      profesionales={(profesionales as any[]) ?? []}
      currentUserId={user.id}
    />
  )
}
