import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FirmaActaClient from '@/components/admision/FirmaActaClient'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: 'Firma de acta — Kiva360' }
}

export default async function FirmaActaPage({ params }: { params: { id: string } }) {
  const admin = getAdmin()
  const { data: acta } = await admin
    .from('actas_conducta')
    .select('*, alumno:alumnos(nombre, apellido, curso), colegio:colegios(nombre)')
    .eq('id', params.id)
    .single()

  if (!acta) notFound()

  return <FirmaActaClient acta={acta as any} />
}
