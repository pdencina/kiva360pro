import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PropuestaClient from '@/components/propuestas/PropuestaClient'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const admin = getAdmin()
  const { data } = await admin.from('propuestas').select('nombre_cliente').eq('slug', params.slug).single()
  if (!data) return { title: 'Propuesta — Kiva360' }
  return { title: `Propuesta para ${(data as any).nombre_cliente} — Kiva360` }
}

export default async function PropuestaPage({ params }: { params: { slug: string } }) {
  const admin = getAdmin()
  const { data: propuesta } = await admin.from('propuestas').select('*').eq('slug', params.slug).single()
  if (!propuesta) notFound()
  return <PropuestaClient propuesta={propuesta as any} />
}
