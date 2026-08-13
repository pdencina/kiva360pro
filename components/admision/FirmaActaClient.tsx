'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  acta: {
    id: string; titulo: string; descripcion: string; fecha_evento: string
    tipo: string; antecedente: string | null; medidas: string | null
    compromisos: string | null; observaciones: string | null; estado: string
    firmada_por: string | null; firmada_at: string | null
    alumno: { nombre: string; apellido: string; curso: string }
    colegio: { nombre: string }
  }
}

export default function FirmaActaClient({ acta }: Props) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [observacion, setObservacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [firmada, setFirmada] = useState(acta.estado === 'firmada')
  const [error, setError] = useState('')

  async function handleFirmar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/actas-conducta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acta.id, accion: 'firmar', codigo, nombre_firma: nombre, observacion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFirmada(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (firmada) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#1A1035] mb-3">Acta firmada</h1>
          <p className="text-[14px] text-[#5C5470] mb-4">
            Gracias por firmar. El acta quedó registrada correctamente.
            {acta.firmada_por && <><br/>Firmada por: <strong>{acta.firmada_por}</strong></>}
          </p>
          <p className="text-[11px] text-[#9ca3af]">Puede cerrar esta ventana.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      <div className="bg-[#0d1b2a] py-4 px-6 text-center">
        <div className="text-white font-bold text-[16px]">{acta.colegio?.nombre || 'Centro Educativo'}</div>
        <div className="text-white/50 text-[11px]">Acta de conducta — Firma electrónica</div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Detalle del acta */}
        <div className="bg-white border border-[#e2dfd9] rounded-xl p-6 mb-6">
          <h2 className="text-[18px] font-bold text-[#1A1035] mb-1">{acta.titulo}</h2>
          <p className="text-[12px] text-[#5C5470] mb-4">
            {acta.alumno?.nombre} {acta.alumno?.apellido} · {acta.alumno?.curso} · {new Date(acta.fecha_evento).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="space-y-4 text-[13px] text-[#3A3A4A] leading-relaxed">
            <div>
              <p className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-1">Descripción</p>
              <p>{acta.descripcion}</p>
            </div>
            {acta.antecedente && (
              <div>
                <p className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-1">Antecedente</p>
                <p>{acta.antecedente}</p>
              </div>
            )}
            {acta.medidas && (
              <div>
                <p className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-1">Medidas tomadas</p>
                <p>{acta.medidas}</p>
              </div>
            )}
            {acta.compromisos && (
              <div>
                <p className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-1">Compromisos</p>
                <p>{acta.compromisos}</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de firma */}
        <div className="bg-white border border-[#e2dfd9] rounded-xl p-6">
          <h3 className="text-[15px] font-bold text-[#1A1035] mb-1">Firmar acta</h3>
          <p className="text-[12px] text-[#5C5470] mb-5">Ingrese el código que recibió en su correo y su nombre completo.</p>

          <form onSubmit={handleFirmar} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C5470] uppercase tracking-wider mb-1.5">Código de verificación</label>
              <input
                type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[16px] text-center font-mono tracking-[0.3em] text-[#1A1035] focus:ring-2 focus:ring-[#0d1b2a]/20 focus:border-transparent outline-none"
                placeholder="000000" maxLength={6} required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C5470] uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] focus:ring-2 focus:ring-[#0d1b2a]/20 focus:border-transparent outline-none"
                placeholder="Su nombre como apoderado" required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C5470] uppercase tracking-wider mb-1.5">Observación (opcional)</label>
              <textarea
                value={observacion} onChange={e => setObservacion(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[13px] text-[#1A1035] focus:ring-2 focus:ring-[#0d1b2a]/20 focus:border-transparent outline-none resize-y"
                rows={2} placeholder="Si desea agregar algún comentario..."
              />
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">{error}</div>}

            <button
              type="submit" disabled={loading || codigo.length !== 6 || !nombre.trim()}
              className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white bg-[#0d1b2a] hover:bg-[#1a2d47] transition-all disabled:opacity-50"
            >
              {loading ? 'Firmando...' : 'Firmar y confirmar'}
            </button>
          </form>

          <p className="text-[10px] text-[#9ca3af] text-center mt-4">
            Al firmar confirma que ha leído el acta y acepta los compromisos indicados. Esta firma tiene validez como firma electrónica simple (Ley 19.799).
          </p>
        </div>
      </div>
    </div>
  )
}
