import { createClient as createAdminClient } from '@supabase/supabase-js'
import PostularFormClient from '@/components/admision/PostularFormClient'
import PostularError from '@/components/admision/PostularError'

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

  try {
    const admin = getAdmin()
    const { data: colegio } = await admin.from('colegios').select('nombre').eq('id', colegioId).single()
    if (!colegio) return { title: 'Postulación — Kiva360' }

    return {
      title: `Postula a ${(colegio as any).nombre} — Kiva360`,
      description: `Formulario de postulación para ${(colegio as any).nombre}. Completa tus datos y adjunta los documentos requeridos.`,
    }
  } catch {
    return { title: 'Postulación — Kiva360' }
  }
}

export default async function PostularPage({ searchParams }: Props) {
  const colegioId = searchParams.c

  if (!colegioId) {
    return <PostularError mensaje="Link de postulación inválido. Contacta al centro educativo para obtener el link correcto." />
  }

  try {
    const admin = getAdmin()
    const { data: colegio, error } = await admin
      .from('colegios')
      .select('id, nombre, direccion, telefono, logo_url, color_primario, color_acento')
      .eq('id', colegioId)
      .single()

    if (error || !colegio) {
      console.error('PostularPage colegio lookup failed:', { colegioId, error })
      return <PostularError mensaje="Centro educativo no encontrado. Verifica que el link de postulación sea correcto." />
    }

    return <PostularFormClient colegio={colegio as any} />
  } catch (err) {
    console.error('PostularPage error:', err)
    return <PostularError mensaje="Error al cargar el formulario. Intenta nuevamente en unos momentos." />
  }
}
