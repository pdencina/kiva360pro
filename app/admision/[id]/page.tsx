import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import AdmisionFormClient from '@/components/admision/AdmisionFormClient'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const admin = getAdmin()
  const { data: colegio } = await admin.from('colegios').select('nombre').eq('id', params.id).single()
  if (!colegio) return { title: 'Admisión' }
  return {
    title: `Postula a ${(colegio as any).nombre} — Kiva360`,
    description: `Formulario de admisión para ${(colegio as any).nombre}. Completa tus datos y nos pondremos en contacto.`,
  }
}

export default async function AdmisionPage({ params }: { params: { id: string } }) {
  const admin = getAdmin()
  const { data: colegio } = await admin
    .from('colegios')
    .select('id, nombre, direccion, telefono, logo_url, color_primario, color_acento')
    .eq('id', params.id)
    .single()

  if (!colegio) notFound()

  return <AdmisionFormClient colegio={colegio as any} />
}
