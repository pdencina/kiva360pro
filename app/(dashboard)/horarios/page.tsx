export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import HorarioClient from '@/components/horarios/HorarioClient'

export const metadata = { title: 'Horarios' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function HorariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('colegio_id').eq('id', user.id).single()
  const colegioId = (ur as any)?.colegio_id

  // Obtener cursos únicos del colegio
  const { data: alumnos } = await admin.from('alumnos').select('curso').eq('colegio_id', colegioId).eq('activo', true)
  const cursos = [...new Set((alumnos ?? []).map((a: any) => a.curso))].sort()
  const cursoInicial = cursos[0] ?? ''

  // Horarios del primer curso
  const { data: horarios } = cursoInicial
    ? await admin.from('horarios').select('*').eq('colegio_id', colegioId).eq('curso', cursoInicial).order('dia').order('hora_inicio')
    : { data: [] }

  return (
    <HorarioClient
      horarios={(horarios as any[]) ?? []}
      cursos={cursos}
      cursoInicial={cursoInicial}
    />
  )
}
