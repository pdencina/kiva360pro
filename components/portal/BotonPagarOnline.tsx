'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  cobroId: string
  estado: string
}

export default function BotonPagarOnline({ cobroId, estado }: Props) {
  const [loading, setLoading] = useState(false)

  if (estado === 'pagado' || estado === 'anulado') return null

  async function handlePagar() {
    setLoading(true)
    try {
      const res = await fetch('/api/pagos/flow/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cobro_id: cobroId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al iniciar pago')
        setLoading(false)
        return
      }
      // Redirigir a Flow
      window.location.href = data.url
    } catch {
      toast.error('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePagar}
      disabled={loading}
      className="text-[11px] font-semibold px-3 py-1.5 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3342] transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '💳 Pagar'}
    </button>
  )
}
