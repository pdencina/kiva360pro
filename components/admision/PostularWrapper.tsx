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

export default function PostularWrapper({ colegioId }: { colegioId: string }) {
  const [colegio, setColegio] = useState<Colegio | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    if (!colegioId) {
      setError('Link de postulación inválido. Contacta al centro educativo para obtener el link correcto.')
      setLoading(false)
      return
    }

    // Usar las NEXT_PUBLIC env vars que Next.js inyecta en build time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setDebugInfo(`URL: ${supabaseUrl ? 'OK' : 'MISSING'}, KEY: ${supabaseKey ? 'OK' : 'MISSING'}`)
      setError('Error de configuración del servidor. Contacta al administrador.')
      setLoading(false)
      return
    }

    fetch(
      `${supabaseUrl}/rest/v1/colegios?id=eq.${colegioId}&select=id,nombre,direccion,telefono,logo_url,color_primario,color_acento`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/vnd.pgrst.object+json',
        },
      }
    )
      .then(res => {
        if (!res.ok) {
          return res.text().then(t => { throw new Error(`HTTP ${res.status}: ${t}`) })
        }
        return res.json()
      })
      .then((data: Colegio) => {
        setColegio(data)
        setLoading(false)
      })
      .catch((err) => {
        setDebugInfo(err.message)
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
    return (
      <div>
        <PostularError mensaje={error} />
        {debugInfo && (
          <p className="text-center text-[10px] text-red-400 mt-2 font-mono">{debugInfo}</p>
        )}
      </div>
    )
  }

  if (!colegio) {
    return <PostularError mensaje="Error inesperado. Intenta nuevamente." />
  }

  return <PostularFormClient colegio={colegio} />
}
