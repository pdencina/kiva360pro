'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  alumnoId: string
  alumnoNombre: string
}

export default function InvitarApoderadoBtn({ alumnoId, alumnoNombre }: Props) {
  const [loading, setLoading] = useState(false)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function handleGenerar() {
    setLoading(true)
    const res = await fetch('/api/invitaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumno_id: alumnoId, parentesco: 'apoderado' }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error ?? 'Error al generar código')
      return
    }

    setCodigo(data.codigo)
    toast.success('Código generado')
  }

  function copiar() {
    if (codigo) {
      navigator.clipboard.writeText(codigo)
      toast.success('Código copiado')
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-secondary text-xs">
        <i className="ti ti-link text-sm" aria-hidden="true"/> Invitar apoderado
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1a2332] mb-2">Invitar apoderado</h3>
            <p className="text-sm text-[#6b7280] mb-4">
              Genera un código de invitación para que el apoderado de <strong>{alumnoNombre}</strong> pueda vincularse desde su cuenta.
            </p>

            {!codigo ? (
              <button
                onClick={handleGenerar}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60"
              >
                {loading ? 'Generando...' : 'Generar código de invitación'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#f8f9fb] border border-[#eceef1] rounded-lg p-4 text-center">
                  <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Código de invitación</div>
                  <div className="text-2xl font-mono font-bold text-[#1a2332] tracking-[0.2em]">{codigo}</div>
                </div>
                <button onClick={copiar} className="btn-secondary w-full text-sm">
                  <i className="ti ti-copy text-sm" aria-hidden="true"/> Copiar código
                </button>
                <div className="text-[11px] text-[#9ca3af] text-center">
                  El apoderado debe ingresar este código en la sección <strong>"Vincular alumno"</strong> de su portal.
                </div>
              </div>
            )}

            <button onClick={() => { setShowModal(false); setCodigo(null) }} className="mt-4 text-sm text-[#6b7280] hover:text-[#1a2332] w-full text-center">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
