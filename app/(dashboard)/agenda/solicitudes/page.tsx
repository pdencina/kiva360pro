export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SolicitudesReservaClient from '@/components/reservas/SolicitudesReservaClient'

export const metadata = { title: 'Solicitudes de reserva — Kiva360' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function SolicitudesReservaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus', 'tutor'].includes(usuario?.rol)) redirect('/agenda')

  let query = admin
    .from('reservas_publicas')
    .select('*, alumno:alumnos(id, nombre, apellido), profesional:usuarios!profesional_id(id, nombre, apellido)')
    .eq('colegio_id', usuario.colegio_id)
    .eq('estado', 'pendiente')
    .order('fecha_solicitada', { ascending: true })

  if (usuario.rol === 'tutor') query = query.eq('profesional_id', user.id)

  const { data: solicitudes } = await query

  const { data: alumnos } = await admin.from('alumnos').select('id, nombre, apellido, curso').eq('colegio_id', usuario.colegio_id).eq('activo', true).order('apellido')

  return <SolicitudesReservaClient solicitudes={(solicitudes as any[]) ?? []} alumnos={(alumnos as any[]) ?? []} />
}
