'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Sesion {
  id: string; fecha: string; hora_inicio: string; hora_fin: string
  tipo_sesion: string; modalidad: string; estado: string; observaciones: string | null
  alumno: { id: string; nombre: string; apellido: string; curso: string }
  profesional: { id: string; nombre: string; apellido: string }
}

interface Props {
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  profesionales: { id: string; nombre: string; apellido: string; rol: string }[]
  currentUserId: string
}

const ESTADO_COLORS: Record<string, string> = {
  programada: 'bg-blue-100 border-blue-300 text-blue-800',
  confirmada: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  en_curso: 'bg-amber-100 border-amber-300 text-amber-800',
  completada: 'bg-slate-100 border-slate-300 text-slate-600',
  cancelada: 'bg-red-50 border-red-200 text-red-400 line-through opacity-60',
  no_asistio: 'bg-red-50 border-red-200 text-red-500 opacity-60',
}

const PROFESIONAL_COLORS = ['#5B3E9E', '#E85D3A', '#4A9E7A', '#3D7A94', '#B86E00', '#C43B2B', '#2D1B69', '#6B4C9A']

function getWeekDates(baseDate: Date): { dates: Date[]; label: string } {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
  const monthLabel = dates[0].toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  return { dates, label: monthLabel }
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00

export default function AgendaClient({ alumnos, profesionales, currentUserId }: Props) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtroProfesional, setFiltroProfesional] = useState<string>('')

  const { dates, label } = getWeekDates(currentWeek)
  const desde = dates[0].toISOString().split('T')[0]
  const hasta = dates[6].toISOString().split('T')[0]

  const fetchSesiones = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/agenda?desde=${desde}&hasta=${hasta}`
      if (filtroProfesional) url += `&profesional_id=${filtroProfesional}`
      const res = await fetch(url)
      if (res.ok) setSesiones(await res.json())
    } catch {} finally { setLoading(false) }
  }, [desde, hasta, filtroProfesional])

  useEffect(() => { fetchSesiones() }, [fetchSesiones])

  function navigateWeek(dir: number) {
    const next = new Date(currentWeek)
    next.setDate(next.getDate() + dir * 7)
    setCurrentWeek(next)
  }

  function goToday() { setCurrentWeek(new Date()) }

  // Build color map for professionals
  const profColorMap: Record<string, string> = {}
  profesionales.forEach((p, i) => { profColorMap[p.id] = PROFESIONAL_COLORS[i % PROFESIONAL_COLORS.length] })

  async function updateEstado(id: string, estado: string) {
    const res = await fetch('/api/agenda', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    if (res.ok) { toast.success('Estado actualizado'); fetchSesiones() }
    else toast.error('Error al actualizar')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Sesiones terapéuticas programadas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nueva sesión
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek(-1)} className="btn-secondary py-1.5 px-2.5">
            <i className="ti ti-chevron-left text-[14px]" aria-hidden="true"/>
          </button>
          <button onClick={goToday} className="btn-secondary py-1.5 px-3 text-[11px]">Hoy</button>
          <button onClick={() => navigateWeek(1)} className="btn-secondary py-1.5 px-2.5">
            <i className="ti ti-chevron-right text-[14px]" aria-hidden="true"/>
          </button>
          <span className="text-[14px] font-semibold text-[var(--ar-text)] capitalize ml-2">{label}</span>
        </div>
        <select
          value={filtroProfesional}
          onChange={e => setFiltroProfesional(e.target.value)}
          className="select-base text-[12px] w-48"
        >
          <option value="">Todos los profesionales</option>
          {profesionales.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
          ))}
        </select>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--ar-border)]">
              <div className="p-2" />
              {dates.map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const isToday = dateStr === today
                return (
                  <div key={dateStr} className={`p-3 text-center border-l border-[var(--ar-border)] ${isToday ? 'bg-[#f3f0f9]' : ''}`}>
                    <div className="text-[10px] text-[var(--ar-muted)] uppercase font-medium">
                      {date.toLocaleDateString('es-CL', { weekday: 'short' })}
                    </div>
                    <div className={`text-[14px] font-bold mt-0.5 ${isToday ? 'text-[#5B3E9E]' : 'text-[var(--ar-text)]'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time rows */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--ar-border)]/50 min-h-[60px]">
                  <div className="p-2 text-[10px] text-[var(--ar-muted)] font-medium text-right pr-3 pt-1">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {dates.map(date => {
                    const dateStr = date.toISOString().split('T')[0]
                    const hourSesiones = sesiones.filter(s => {
                      if (s.fecha !== dateStr) return false
                      const h = parseInt(s.hora_inicio.split(':')[0])
                      return h === hour
                    })

                    return (
                      <div key={`${dateStr}-${hour}`} className="border-l border-[var(--ar-border)]/50 p-0.5 relative">
                        {hourSesiones.map(s => (
                          <div
                            key={s.id}
                            className={`rounded-md px-2 py-1 mb-0.5 border text-[10px] cursor-pointer transition-all hover:shadow-sm ${ESTADO_COLORS[s.estado]}`}
                            title={`${s.alumno.nombre} ${s.alumno.apellido} — ${s.profesional.nombre} ${s.profesional.apellido}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: profColorMap[s.profesional.id] || '#5C5470' }} />
                              <span className="font-semibold truncate">{s.hora_inicio.slice(0,5)}</span>
                              <span className="truncate">{s.alumno.nombre} {s.alumno.apellido[0]}.</span>
                            </div>
                            <div className="text-[9px] opacity-70 truncate mt-0.5">
                              {s.profesional.nombre} {s.profesional.apellido[0]}. · {s.tipo_sesion}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {profesionales.slice(0, 6).map(p => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: profColorMap[p.id] || '#5C5470' }} />
            <span className="text-[10px] text-[var(--ar-muted)]">{p.nombre} {p.apellido}</span>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showModal && (
        <CrearSesionModal
          alumnos={alumnos}
          profesionales={profesionales}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchSesiones() }}
        />
      )}
    </div>
  )
}

// ─── MODAL: CREAR SESIÓN ───
function CrearSesionModal({ alumnos, profesionales, onClose, onCreated }: {
  alumnos: Props['alumnos']; profesionales: Props['profesionales']; onClose: () => void; onCreated: () => void
}) {
  const [form, setForm] = useState({
    alumno_id: '', profesional_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00', hora_fin: '09:45', tipo_sesion: 'individual', modalidad: 'presencial',
    observaciones: '', recurrencia: '', recurrencia_fin: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.alumno_id || !form.profesional_id) { toast.error('Selecciona alumno y profesional'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        recurrencia: form.recurrencia || null,
        recurrencia_fin: form.recurrencia_fin || null,
      }
      const res = await fetch('/api/agenda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      toast.success(`${Array.isArray(data) ? data.length : 1} sesión(es) agendada(s)`)
      onCreated()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)] font-display">Agendar sesión</h3>
          <p className="text-[11px] text-[var(--ar-muted)] mt-1">Programa una sesión terapéutica</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Alumno *</label>
              <select value={form.alumno_id} onChange={e => setForm({...form, alumno_id: e.target.value})} className="select-base w-full text-[12px]" required>
                <option value="">Seleccionar...</option>
                {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Profesional *</label>
              <select value={form.profesional_id} onChange={e => setForm({...form, profesional_id: e.target.value})} className="select-base w-full text-[12px]" required>
                <option value="">Seleccionar...</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="input-base text-[12px]" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora inicio *</label>
              <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} className="input-base text-[12px]" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora fin *</label>
              <input type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} className="input-base text-[12px]" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo_sesion} onChange={e => setForm({...form, tipo_sesion: e.target.value})} className="select-base w-full text-[12px]">
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
                <option value="familiar">Familiar</option>
                <option value="evaluacion">Evaluación</option>
                <option value="coordinacion">Coordinación</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})} className="select-base w-full text-[12px]">
                <option value="presencial">Presencial</option>
                <option value="remota">Remota</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="p-3 rounded-lg bg-[#f9f7f5] border border-[var(--ar-border)]">
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-2">Repetir (opcional)</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.recurrencia} onChange={e => setForm({...form, recurrencia: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">No repetir</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
              </select>
              {form.recurrencia && (
                <input type="date" value={form.recurrencia_fin} onChange={e => setForm({...form, recurrencia_fin: e.target.value})} className="input-base text-[12px]" placeholder="Hasta..." />
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className="input-base text-[12px] min-h-[40px]" placeholder="Notas opcionales..." />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">
              {saving ? 'Agendando...' : 'Agendar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
