'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Prospecto {
  id: string; nombre: string; apellido: string | null; email: string | null
  telefono: string | null; nivel_interes: string | null; etapa: string
  origen: string; observaciones: string | null; metadata: any
  created_at: string; fecha_ultima_interaccion: string | null
  motivo_perdida: string | null
}

interface Props { prospectos: Prospecto[]; colegioId: string }

const ETAPAS = [
  { key: 'calificado', label: 'Nuevas', color: '#60a5fa', bg: 'bg-blue-50', text: 'text-blue-700', icon: 'ti-inbox' },
  { key: 'informado', label: 'Contactadas', color: '#a78bfa', bg: 'bg-violet-50', text: 'text-violet-700', icon: 'ti-phone' },
  { key: 'visita', label: 'Visita agendada', color: '#fbbf24', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'ti-calendar' },
  { key: 'negociacion', label: 'En decisión', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', icon: 'ti-clock' },
  { key: 'matricula', label: 'Aprobadas', color: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'ti-check' },
  { key: 'perdido', label: 'Rechazadas', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', icon: 'ti-x' },
]

const NIVEL_LABELS: Record<string, string> = {
  educativo_intensivo: 'Programa Intensivo',
  after_school: 'After School',
  sesiones_individuales: 'Sesiones individuales',
  evaluacion: 'Evaluación',
  otro: 'Otro',
}

export default function AdmisionPipelineClient({ prospectos, colegioId }: Props) {
  const [lista, setLista] = useState(prospectos)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtroEtapa, setFiltroEtapa] = useState('calificado')
  const [showDetail, setShowDetail] = useState(false)
  const [updating, setUpdating] = useState(false)

  const selected = lista.find(p => p.id === selectedId)
  const filtrados = filtroEtapa === 'todos' ? lista : lista.filter(p => p.etapa === filtroEtapa)

  // Count by etapa
  const countByEtapa = ETAPAS.reduce((acc, e) => {
    acc[e.key] = lista.filter(p => p.etapa === e.key).length
    return acc
  }, {} as Record<string, number>)

  async function cambiarEtapa(id: string, etapa: string, extra?: { motivo_perdida?: string }) {
    setUpdating(true)
    try {
      const res = await fetch('/api/admision/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, etapa, ...extra }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated = await res.json()
      setLista(prev => prev.map(p => p.id === id ? updated : p))
      toast.success(`Postulación movida a "${ETAPAS.find(e => e.key === etapa)?.label}"`)
    } catch (err: any) { toast.error(err.message) }
    finally { setUpdating(false) }
  }

  const linkAdmision = `${typeof window !== 'undefined' ? window.location.origin : ''}/admision/${colegioId}`

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Admisión</h1>
          <p className="page-subtitle">{lista.length} postulaciones · Pipeline de admisión</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(linkAdmision); toast.success('Link copiado al portapapeles') }}
            className="btn-secondary text-[11px]"
          >
            <i className="ti ti-link text-[12px]" aria-hidden="true"/> Copiar link admisión
          </button>
          <a href={`/admision/${colegioId}`} target="_blank" className="btn-primary text-[11px]">
            <i className="ti ti-external-link text-[12px]" aria-hidden="true"/> Ver formulario
          </a>
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFiltroEtapa('todos')}
          className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-medium border transition-all ${filtroEtapa === 'todos' ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]' : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'}`}>
          Todas ({lista.length})
        </button>
        {ETAPAS.map(e => (
          <button key={e.key} onClick={() => setFiltroEtapa(e.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border transition-all ${filtroEtapa === e.key ? `${e.bg} ${e.text} border-current` : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'}`}>
            <i className={`ti ${e.icon} text-[12px]`} aria-hidden="true"/>
            {e.label} ({countByEtapa[e.key] || 0})
          </button>
        ))}
      </div>

      {/* List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-3 space-y-2">
          {filtrados.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="ti ti-inbox text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
              <p className="text-[13px] text-[var(--ar-muted)]">No hay postulaciones en esta etapa</p>
            </div>
          ) : filtrados.map(p => {
            const etapaInfo = ETAPAS.find(e => e.key === p.etapa) || ETAPAS[0]
            const isSelected = selectedId === p.id
            return (
              <div
                key={p.id}
                onClick={() => { setSelectedId(p.id); setShowDetail(true) }}
                className={`card p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-[var(--ar-accent)]/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f9f7f5] flex items-center justify-center text-[12px] font-bold text-[var(--ar-text)] shrink-0">
                    {p.nombre[0]}{p.apellido?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--ar-text)] truncate">{p.nombre} {p.apellido || ''}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${etapaInfo.bg} ${etapaInfo.text}`}>{etapaInfo.label}</span>
                    </div>
                    <div className="text-[11px] text-[var(--ar-muted)] truncate">
                      {p.email} {p.telefono && `· ${p.telefono}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {p.nivel_interes && <span className="text-[9px] bg-[#f3f0f9] text-[#5B3E9E] px-1.5 py-0.5 rounded font-medium">{NIVEL_LABELS[p.nivel_interes] || p.nivel_interes}</span>}
                      {p.metadata?.diagnostico && <span className="text-[9px] bg-[#fef0ec] text-[#E85D3A] px-1.5 py-0.5 rounded font-medium">{p.metadata.diagnostico}</span>}
                      <span className="text-[9px] text-[var(--ar-muted)]">{new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card p-8 text-center sticky top-20">
              <i className="ti ti-click text-3xl text-[var(--ar-muted)] opacity-30 mb-2" aria-hidden="true"/>
              <p className="text-[12px] text-[var(--ar-muted)]">Selecciona una postulación para ver el detalle</p>
            </div>
          ) : (
            <div className="card p-5 sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[var(--ar-text)]">{selected.nombre} {selected.apellido || ''}</h3>
                <button onClick={() => setSelectedId(null)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)]">
                  <i className="ti ti-x text-[16px]" aria-hidden="true"/>
                </button>
              </div>

              {/* Info */}
              <div className="space-y-2 text-[12px]">
                {selected.email && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Email</span><span className="text-[var(--ar-text)] font-medium">{selected.email}</span></div>}
                {selected.telefono && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Teléfono</span><a href={`tel:${selected.telefono}`} className="text-[var(--ar-accent)] font-medium">{selected.telefono}</a></div>}
                {selected.nivel_interes && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Programa</span><span className="text-[var(--ar-text)]">{NIVEL_LABELS[selected.nivel_interes] || selected.nivel_interes}</span></div>}
                {selected.metadata?.nombre_alumno && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Alumno</span><span className="text-[var(--ar-text)]">{selected.metadata.nombre_alumno}</span></div>}
                {selected.metadata?.edad_alumno && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Edad</span><span className="text-[var(--ar-text)]">{selected.metadata.edad_alumno}</span></div>}
                {selected.metadata?.diagnostico && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Diagnóstico</span><span className="text-[var(--ar-text)] font-medium">{selected.metadata.diagnostico}</span></div>}
                {selected.observaciones && <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Mensaje</span><span className="text-[var(--ar-text)]">{selected.observaciones}</span></div>}
                <div className="flex gap-2"><span className="text-[var(--ar-muted)] w-20 shrink-0">Fecha</span><span className="text-[var(--ar-text)]">{new Date(selected.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--ar-border)] space-y-2">
                <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider mb-2">Mover a:</div>
                <div className="grid grid-cols-2 gap-2">
                  {ETAPAS.filter(e => e.key !== selected.etapa).map(e => (
                    <button
                      key={e.key}
                      disabled={updating}
                      onClick={() => {
                        if (e.key === 'perdido') {
                          const motivo = prompt('Motivo de rechazo (opcional):')
                          cambiarEtapa(selected.id, e.key, { motivo_perdida: motivo || undefined })
                        } else {
                          cambiarEtapa(selected.id, e.key)
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border transition-all ${e.bg} ${e.text} border-current/20 hover:opacity-80 disabled:opacity-50`}
                    >
                      <i className={`ti ${e.icon} text-[12px]`} aria-hidden="true"/>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              {selected.etapa !== 'matricula' && selected.etapa !== 'perdido' && (
                <div className="pt-3 border-t border-[var(--ar-border)] flex gap-2">
                  <button
                    onClick={() => cambiarEtapa(selected.id, 'matricula')}
                    disabled={updating}
                    className="flex-1 btn-primary text-[12px] py-2.5"
                  >
                    <i className="ti ti-check text-[14px]" aria-hidden="true"/> Aprobar y matricular
                  </button>
                  <button
                    onClick={() => {
                      const motivo = prompt('Motivo:')
                      cambiarEtapa(selected.id, 'perdido', { motivo_perdida: motivo || 'Sin cupo' })
                    }}
                    disabled={updating}
                    className="btn-secondary text-[12px] py-2.5 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <i className="ti ti-x text-[14px]" aria-hidden="true"/> Rechazar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
