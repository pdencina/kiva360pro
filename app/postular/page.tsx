'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
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

function PostularContent() {
  const searchParams = useSearchParams()
  const colegioId = searchParams.get('c')
  const [colegio, setColegio] = useState<Colegio | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!colegioId) {
      setError('Link de postulación inválido. Contacta al centro educativo para obtener el link correcto.')
      setLoading(false)
      return
    }

    fetch(`/api/postular/colegio?id=${colegioId}`)
      .then(res => {
        if (!res.ok) throw new Error('Colegio no encontrado')
        return res.json()
      })
      .then(data => {
        setColegio(data)
        setLoading(false)
      })
      .catch(() => {
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

export default function PostularPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#e2dfd9] border-t-[#0d1b2a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#5C5470]">Cargando...</p>
        </div>
      </div>
    }>
      <PostularContent />
    </Suspense>
  )
}
