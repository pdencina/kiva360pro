export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import CobrosSesionClient from '@/components/cobros-sesion/CobrosSesionClient'

export const metadata = { title: 'Cobros por sesión' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function CobrosSesionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!['super_admin', 'admin', 'pastor_campus'].includes(usuario?.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id

  const [{ data: cobros }, { data: tarifas }, { data: alumnos }, { data: profesionales }] = await Promise.all([
    admin.from('cobros_sesion')
      .select(`*, alumno:alumnos(id, nombre, apellido, curso), profesional:usuarios(id, nombre, apellido), tarifa:tarifas_sesion(id, nombre)`)
      .eq('colegio_id', colegioId).order('fecha_sesion', { ascending: false }).limit(50),
    admin.from('tarifas_sesion').select('*').eq('colegio_id', colegioId).eq('activo', true).order('nombre'),
    admin.from('alumnos').select('id, nombre, apellido, curso').eq('colegio_id', colegioId).eq('activo', true).order('apellido'),
    admin.from('usuarios').select('id, nombre, apellido').eq('colegio_id', colegioId).eq('activo', true).in('rol', ['tutor', 'admin', 'pastor_campus']).order('apellido'),
  ])

  return (
    <CobrosSesionClient
      cobros={(cobros as any[]) ?? []}
      tarifas={(tarifas as any[]) ?? []}
      alumnos={(alumnos as any[]) ?? []}
      profesionales={(profesionales as any[]) ?? []}
    />
  )
}
