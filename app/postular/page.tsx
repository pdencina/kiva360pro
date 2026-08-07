import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PostularFormClient from '@/components/admision/PostularFormClient'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  searchParams: { c?: string }
}

export async function generateMetadata({ searchParams }: Props) {
  const colegioId = searchParams.c
  if (!colegioId) return { title: 'Postulación — Kiva360' }

  const admin = getAdmin()
  const { data: colegio } = await admin.from('colegios').select('nombre').eq('id', colegioId).single()
  if (!colegio) return { title: 'Postulación — Kiva360' }

  return {
    title: `Postula a ${(colegio as any).nombre} — Kiva360`,
    description: `Formulario de postulación para ${(colegio as any).nombre}. Completa tus datos y adjunta los documentos requeridos.`,
  }
}

export default async function PostularPage({ searchParams }: Props) {
  const colegioId = searchParams.c
  if (!colegioId) notFound()

  const admin = getAdmin()
  const { data: colegio } = await admin
    .from('colegios')
    .select('id, nombre, direccion, telefono, logo_url, color_primario, color_acento')
    .eq('id', colegioId)
    .single()

  if (!colegio) notFound()

  return <PostularFormClient colegio={colegio as any} />
}
