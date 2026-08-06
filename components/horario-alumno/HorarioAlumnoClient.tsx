'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

interface Bloque {
  id: string; dia_semana: number; hora_inicio: string; hora_fin: string
  tipo: 'pedagogico' | 'terapeutico'; asignatura: string; sala: string | null
  color: string | null; profesional: { id: string; nombre: string; apellido: string } | null
}

interface Props {
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  profesionales: { id: string; nombre: string; apellido: string; rol: string }[]
  rol: string
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const HORAS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

const COLOR_PEDAGOGICO = '#3b6ea5'
const COLOR_TERAPEUTICO = '#5B3E9E'

export default function HorarioAlumnoClient({ alumnos, profesionales, rol }: Props) {
  const [alumnoId, setAlumnoId] = useState('')
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const isAdmin = ['super_admin', 'admin', 'pastor_campus'].includes(rol)
  const alumnoSeleccionado = alumnos.find(a => a.id === alumnoId)

  const fetchHorario = useCallback(async () => {
    if (!alumnoId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/horario-alumno?alumno_id=${alumnoId}`)
      if (res.ok) setBloques(await res.json())
    } catch {} finally { setLoading(false) }
  }, [alumnoId])

  useEffect(() => { fetchHorario() }, [fetchHorario])

  function handlePrint() {
    window.print()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este bloque?')) return
    const res = await fetch(`/api/horario-alumno?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Bloque eliminado'); fetchHorario() }
    else toast.error('Error al eliminar')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header — no print */}
      <div className="page-header print:hidden">
        <div>
          <h1 className="page-title">Horario Individual</h1>
          <p className="page-subtitle">Horario semanal pedagógico y terapéutico por alumno</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={alumnoId}
            onChange={e => setAlumnoId(e.target.value)}
            className="select-base w-64"
          >
            <option value="">Seleccionar alumno...</option>
            {alumnos.map(a => (
              <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>
            ))}
          </select>
          {alumnoId && (
            <>
              {isAdmin && (
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Agregar bloque
                </button>
              )}
              <button onClick={handlePrint} className="btn-secondary">
                <i className="ti ti-printer text-[14px]" aria-hidden="true"/> Imprimir
              </button>
            </>
          )}
        </div>
      </div>

      {!alumnoId ? (
        <div className="card p-12 text-center print:hidden">
          <i className="ti ti-calendar-time text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">Selecciona un alumno para ver o editar su horario</p>
        </div>
      ) : (
        <div ref={printRef}>
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <div className="flex items-center gap-3 mb-2">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-8 h-8 rounded"/>
              <span className="font-bold text-[16px]" style={{ fontFamily: 'Space Grotesk' }}>Kiva360</span>
            </div>
            <h2 className="text-[20px] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Horario Semanal — {alumnoSeleccionado?.nombre} {alumnoSeleccionado?.apellido}
            </h2>
            <p className="text-[12px] text-[#5C5470]">{alumnoSeleccionado?.curso} · Vigente desde {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mb-4 print:mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: COLOR_PEDAGOGICO }}/>
              <span className="text-[11px] font-medium text-[var(--ar-text)]">Pedagógico</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: COLOR_TERAPEUTICO }}/>
              <span className="text-[11px] font-medium text-[var(--ar-text)]">Terapéutico</span>
            </div>
          </div>

          {/* Grilla semanal */}
          <div className="card overflow-hidden print:border print:border-[#e0e0e0] print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="w-16 px-3 py-3 text-left text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider bg-[#f9fafb] border-b border-[var(--ar-border)]">
                      Hora
                    </th>
                    {DIAS.map((dia, i) => (
                      <th key={dia} className="px-3 py-3 text-center text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider bg-[#f9fafb] border-b border-l border-[var(--ar-border)]">
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.slice(0, -1).map((hora, hi) => {
                    const horaFin = HORAS[hi + 1]
                    return (
                      <tr key={hora} className="border-b border-[var(--ar-border)]/30">
                        <td className="px-3 py-2 text-[10px] text-[var(--ar-muted)] font-medium border-r border-[var(--ar-border)]/30 bg-[#f9fafb]/50">
                          {hora}
                        </td>
                        {DIAS.map((_, di) => {
                          const dia = di + 1
                          const bloque = bloques.find(b => {
                            return b.dia_semana === dia && b.hora_inicio <= hora && b.hora_fin > hora
                          })

                          // Only render on the first row of a multi-row block
                          if (bloque) {
                            const bloqueStart = HORAS.indexOf(bloque.hora_inicio)
                            if (bloqueStart !== hi) return <td key={`${dia}-${hora}`} className="border-l border-[var(--ar-border)]/30" />

                            const bloqueEnd = HORAS.indexOf(bloque.hora_fin)
                            const span = bloqueEnd - bloqueStart
                            const bgColor = bloque.color || (bloque.tipo === 'terapeutico' ? COLOR_TERAPEUTICO : COLOR_PEDAGOGICO)

                            return (
                              <td
                                key={`${dia}-${hora}`}
                                rowSpan={span}
                                className="border-l border-[var(--ar-border)]/30 p-1 align-top relative group"
                              >
                                <div
                                  className="rounded-lg p-2 h-full text-white relative overflow-hidden"
                                  style={{ background: bgColor }}
                                >
                                  <div className="text-[11px] font-bold leading-tight">{bloque.asignatura}</div>
                                  {bloque.profesional && (
                                    <div className="text-[9px] opacity-80 mt-0.5">{bloque.profesional.nombre} {bloque.profesional.apellido[0]}.</div>
                                  )}
                                  {bloque.sala && <div className="text-[9px] opacity-60 mt-0.5">{bloque.sala}</div>}
                                  <div className="text-[9px] opacity-60">{bloque.hora_inicio.slice(0,5)}-{bloque.hora_fin.slice(0,5)}</div>
                                  {/* Delete button (hover, not in print) */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(bloque.id)}
                                      className="absolute top-1 right-1 w-5 h-5 rounded bg-black/20 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex items-center justify-center"
                                    >✕</button>
                                  )}
                                </div>
                              </td>
                            )
                          }

                          // Check if this cell is "consumed" by a rowSpan from above
                          const consumed = bloques.some(b => {
                            return b.dia_semana === dia && b.hora_inicio < hora && b.hora_fin > hora
                          })
                          if (consumed) return null

                          return (
                            <td key={`${dia}-${hora}`} className="border-l border-[var(--ar-border)]/30 p-1 h-8" />
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Print footer */}
          <div className="hidden print:block mt-6 pt-4 border-t border-[#e0e0e0] text-[10px] text-[#9ca3af] text-center">
            Generado por Kiva360 · {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}

      {/* Modal crear bloque */}
      {showModal && (
        <ModalCrearBloque
          alumnoId={alumnoId}
          profesionales={profesionales}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchHorario() }}
        />
      )}
    </div>
  )
}

// ─── MODAL: CREAR BLOQUE ───
function ModalCrearBloque({ alumnoId, profesionales, onClose, onCreated }: {
  alumnoId: string; profesionales: Props['profesionales']; onClose: () => void; onCreated: () => void
}) {
  const [form, setForm] = useState({
    dia_semana: '1', hora_inicio: '09:00', hora_fin: '09:45',
    tipo: 'pedagogico', asignatura: '', profesional_id: '', sala: '',
  })
  const [saving, setSaving] = useState(false)

  const ASIGNATURAS_PEDAGOGICAS = ['Matemática', 'Lenguaje', 'Ciencias', 'Historia', 'Inglés', 'Arte', 'Música', 'Ed. Física', 'Tecnología']
  const ASIGNATURAS_TERAPEUTICAS = ['Fonoaudiología', 'Terapia Ocupacional', 'Psicología', 'Psicopedagogía', 'Kinesiología', 'Musicoterapia', 'Trabajo Social']
  const asignaturas = form.tipo === 'terapeutico' ? ASIGNATURAS_TERAPEUTICAS : ASIGNATURAS_PEDAGOGICAS

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.asignatura) { toast.error('Selecciona una asignatura'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/horario-alumno', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumnoId,
          dia_semana: parseInt(form.dia_semana),
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin,
          tipo: form.tipo,
          asignatura: form.asignatura,
          profesional_id: form.profesional_id || null,
          sala: form.sala || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Bloque agregado')
      onCreated()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Agregar bloque al horario</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-2">Tipo *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({...form, tipo: 'pedagogico', asignatura: ''})}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold border transition-all ${
                  form.tipo === 'pedagogico' ? 'text-white border-transparent' : 'text-[var(--ar-muted)] border-[var(--ar-border)]'
                }`}
                style={form.tipo === 'pedagogico' ? { background: COLOR_PEDAGOGICO } : {}}>
                Pedagógico
              </button>
              <button type="button" onClick={() => setForm({...form, tipo: 'terapeutico', asignatura: ''})}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold border transition-all ${
                  form.tipo === 'terapeutico' ? 'text-white border-transparent' : 'text-[var(--ar-muted)] border-[var(--ar-border)]'
                }`}
                style={form.tipo === 'terapeutico' ? { background: COLOR_TERAPEUTICO } : {}}>
                Terapéutico
              </button>
            </div>
          </div>

          {/* Asignatura */}
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Asignatura / Sesión *</label>
            <select value={form.asignatura} onChange={e => setForm({...form, asignatura: e.target.value})} className="select-base w-full text-[12px]" required>
              <option value="">Seleccionar...</option>
              {asignaturas.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="__custom">Otra (escribir)</option>
            </select>
            {form.asignatura === '__custom' && (
              <input className="input-base text-[12px] mt-2" placeholder="Nombre de la asignatura..."
                onChange={e => setForm({...form, asignatura: e.target.value})} autoFocus />
            )}
          </div>

          {/* Día y horarios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Día *</label>
              <select value={form.dia_semana} onChange={e => setForm({...form, dia_semana: e.target.value})} className="select-base w-full text-[12px]">
                {DIAS.map((d, i) => <option key={d} value={i+1}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Desde *</label>
              <select value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} className="select-base w-full text-[12px]">
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hasta *</label>
              <select value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} className="select-base w-full text-[12px]">
                {HORAS.filter(h => h > form.hora_inicio).map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Profesional y sala */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Profesional</label>
              <select value={form.profesional_id} onChange={e => setForm({...form, profesional_id: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">Sin asignar</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Sala / Espacio</label>
              <input value={form.sala} onChange={e => setForm({...form, sala: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Box Fono" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Guardando...' : 'Agregar bloque'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
