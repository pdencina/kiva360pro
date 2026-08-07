'use client'

import { useEffect, useState } from 'react'
import PostularFormClient from '@/components/admision/PostularFormClient'
import PostularError from '@/components/admision/PostularError'

interface Colegio {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  logo_url: string | null
  color_primario: string | null
  color_acento: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function PostularWrapper({ colegioId }: { colegioId: string }) {
  const [colegio, setColegio] = useState<Colegio | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!colegioId) {
      setError('Link de postulación inválido. Contacta al centro educativo para obtener el link correcto.')
      setLoading(false)
      return
    }

    // Fetch directo a Supabase REST API (sin SDK)
    fetch(
      `${SUPABASE_URL}/rest/v1/colegios?id=eq.${colegioId}&select=id,nombre,direccion,telefono,logo_url,color_primario,color_acento`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/vnd.pgrst.object+json',
        },
      }
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Colegio) => {
        setColegio(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('PostularWrapper fetch error:', err)
        setError('Centro educativo no encontrado. Verifica que el link de postulación sea correcto.')
        setLoading(false)
      })
  }, [colegioId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#e2dfd9] border-t-[#0d1b2a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#5C5470]">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <PostularError mensaje={error} />
  }

  if (!colegio) {
    return <PostularError mensaje="Error inesperado. Intenta nuevamente." />
  }

  return <PostularFormClient colegio={colegio} />
}
