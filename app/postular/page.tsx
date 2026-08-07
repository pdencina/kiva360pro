import { createClient as createAdminClient } from '@supabase/supabase-js'
import PostularFormClient from '@/components/admision/PostularFormClient'
import PostularError from '@/components/admision/PostularError'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata = {
  title: 'Postulación — Kiva360',
  description: 'Formulario de postulación. Completa tus datos y adjunta los documentos requeridos.',
}

interface Props {
  searchParams: { c?: string }
}

export default async function PostularPage({ searchParams }: Props) {
  const colegioId = searchParams.c

  if (!colegioId) {
    return <PostularError mensaje="Link de postulación inválido. Contacta al centro educativo para obtener el link correcto." />
  }

  // Fetch directo a Supabase REST API (sin depender de createClient)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return <PostularError mensaje="Error de configuración del servidor. Contacta al administrador." />
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/colegios?id=eq.${colegioId}&select=id,nombre,direccion,telefono,logo_url`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/vnd.pgrst.object+json',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('PostularPage fetch error:', res.status, text)
      return <PostularError mensaje="Centro educativo no encontrado. Verifica que el link de postulación sea correcto." />
    }

    const colegio = await res.json()

    if (!colegio || !colegio.id) {
      return <PostularError mensaje="Centro educativo no encontrado. Verifica que el link de postulación sea correcto." />
    }

    return <PostularFormClient colegio={colegio} />
  } catch (err: any) {
    console.error('PostularPage error:', err)
    return <PostularError mensaje="Error al cargar el formulario. Intenta nuevamente." />
  }
}
