'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  programada: 'bg-blue-100 border-l-blue-500 text-blue-800',
  confirmada: 'bg-emerald-100 border-l-emerald-500 text-emerald-800',
  en_curso: 'bg-amber-100 border-l-amber-500 text-amber-800',
  completada: 'bg-slate-100 border-l-slate-400 text-slate-600',
  cancelada: 'bg-red-50 border-l-red-300 text-red-400 opacity-60',
  no_asistio: 'bg-red-50 border-l-red-300 text-red-500 opacity-60',
}

const PROF_COLORS = ['#5B3E9E', '#E85D3A', '#4A9E7A', '#3D7A94', '#B86E00', '#C43B2B', '#2D1B69', '#6B4C9A']
const HOUR_HEIGHT = 60 // px per hour
const START_HOUR = 8
const END_HOUR = 20

function getWeekDates(baseDate: Date) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
  return { dates, label: dates[0].toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) }
}

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

function yToTime(y: number): string {
  const totalMinutes = START_HOUR * 60 + Math.round((y / HOUR_HEIGHT) * 60 / 15) * 15
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h * 60 + m) - START_HOUR * 60) / 60 * HOUR_HEIGHT
}

export default function AgendaClient({ alumnos, profesionales, currentUserId }: Props) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroProfesional, setFiltroProfesional] = useState('')

  // Drag-to-create
  const [dragging, setDragging] = useState(false)
  const [dragDate, setDragDate] = useState('')
  const [dragStartY, setDragStartY] = useState(0)
  const [dragEndY, setDragEndY] = useState(0)

  // Popup
  const [showPopup, setShowPopup] = useState(false)
  const [popupData, setPopupData] = useState({ fecha: '', startTime: '', endTime: '' })
  const [popupForm, setPopupForm] = useState({ alumno_id: '', profesional_id: '', tipo_sesion: 'individual', modalidad: 'presencial' })
  const [creating, setCreating] = useState(false)

  // Drop indicator
  const [dropIndicator, setDropIndicator] = useState<{ date: string; y: number } | null>(null)

  const { dates, label } = getWeekDates(currentWeek)
  const desde = dates[0].toISOString().split('T')[0]
  const hasta = dates[6].toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const profColorMap: Record<string, string> = {}
  profesionales.forEach((p, i) => { profColorMap[p.id] = PROF_COLORS[i % PROF_COLORS.length] })

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

  // ═══ DRAG-TO-CREATE ═══
  function handleMouseDown(e: React.MouseEvent, dateStr: string) {
    if ((e.target as HTMLElement).closest('[data-appointment]')) return
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    setDragging(true)
    setDragDate(dateStr)
    setDragStartY(y)
    setDragEndY(y)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragEndY(Math.max(0, e.clientY - rect.top))
  }

  function handleMouseUp() {
    if (!dragging) { setDragging(false); return }
    const minY = Math.min(dragStartY, dragEndY)
    const maxY = Math.max(dragStartY, dragEndY)
    if (maxY - minY < 15) { setDragging(false); return }

    const startTime = yToTime(minY)
    const endTime = yToTime(maxY)

    setPopupData({ fecha: dragDate, startTime, endTime })
    setPopupForm({ alumno_id: '', profesional_id: '', tipo_sesion: 'individual', modalidad: 'presencial' })
    setShowPopup(true)
    setDragging(false)
  }

  // ═══ DRAG-TO-MOVE ═══
  async function handleDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault()
    setDropIndicator(null)
    const appointmentId = e.dataTransfer.getData('appointmentId')
    const duration = parseInt(e.dataTransfer.getData('duration') || '45')
    if (!appointmentId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newStart = yToTime(Math.round(y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4))
    const [h, m] = newStart.split(':').map(Number)
    const endMin = h * 60 + m + duration
    const newEnd = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`

    const res = await fetch('/api/agenda', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appointmentId, fecha: dateStr, hora_inicio: newStart, hora_fin: newEnd }),
    })
    if (res.ok) { toast.success('Sesión movida'); fetchSesiones() }
    else toast.error('Error al mover')
  }

  // ═══ CREATE FROM POPUP ═══
  async function handleCreate() {
    if (!popupForm.alumno_id || !popupForm.profesional_id) { toast.error('Selecciona alumno y profesional'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: popupForm.alumno_id,
          profesional_id: popupForm.profesional_id,
          fecha: popupData.fecha,
          hora_inicio: popupData.startTime,
          hora_fin: popupData.endTime,
          tipo_sesion: popupForm.tipo_sesion,
          modalidad: popupForm.modalidad,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Sesión agendada')
      setShowPopup(false)
      fetchSesiones()
    } catch (err: any) { toast.error(err.message) } finally { setCreating(false) }
  }

  // ═══ RESIZE ═══
  function handleResizeStart(e: React.MouseEvent, appt: Sesion) {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const blockEl = (e.currentTarget as HTMLElement).parentElement!
    const origH = blockEl.offsetHeight
    const [eH, eM] = appt.hora_fin.split(':').map(Number)
    const [sH, sM] = appt.hora_inicio.split(':').map(Number)

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY
      blockEl.style.height = `${Math.max(15, origH + delta)}px`
    }
    const onUp = async (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const delta = ev.clientY - startY
      const addMin = Math.round((delta / HOUR_HEIGHT) * 60 / 15) * 15
      const newEnd = eH * 60 + eM + addMin
      if (newEnd <= sH * 60 + sM || newEnd > END_HOUR * 60) { fetchSesiones(); return }
      const nH = Math.floor(newEnd / 60), nM = newEnd % 60
      const newEndStr = `${nH.toString().padStart(2, '0')}:${nM.toString().padStart(2, '0')}`
      await fetch('/api/agenda', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appt.id, hora_fin: newEndStr }),
      })
      toast.success('Duración actualizada')
      fetchSesiones()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Sesiones terapéuticas · Click y arrastra para agendar</p>
        </div>
        <button onClick={() => { setPopupData({ fecha: today, startTime: '09:00', endTime: '09:45' }); setPopupForm({ alumno_id: '', profesional_id: '', tipo_sesion: 'individual', modalidad: 'presencial' }); setShowPopup(true) }} className="btn-primary">
          <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nueva sesión
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek(-1)} className="btn-secondary py-1.5 px-2.5"><i className="ti ti-chevron-left text-[14px]" aria-hidden="true"/></button>
          <button onClick={() => setCurrentWeek(new Date())} className="btn-secondary py-1.5 px-3 text-[11px]">Hoy</button>
          <button onClick={() => navigateWeek(1)} className="btn-secondary py-1.5 px-2.5"><i className="ti ti-chevron-right text-[14px]" aria-hidden="true"/></button>
          <span className="text-[14px] font-semibold text-[var(--ar-text)] capitalize ml-2">{label}</span>
        </div>
        <select value={filtroProfesional} onChange={e => setFiltroProfesional(e.target.value)} className="select-base text-[12px] w-48">
          <option value="">Todos los profesionales</option>
          {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
        </select>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="flex border-b border-[var(--ar-border)] sticky top-0 bg-white z-10">
              <div className="w-14 shrink-0 border-r border-[var(--ar-border)]" />
              {dates.map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const isToday = dateStr === today
                return (
                  <div key={dateStr} className={`flex-1 p-2 text-center border-r border-[var(--ar-border)]/50 min-w-[100px] ${isToday ? 'bg-[#f3f0f9]' : ''}`}>
                    <div className="text-[10px] text-[var(--ar-muted)] uppercase font-medium">{date.toLocaleDateString('es-CL', { weekday: 'short' })}</div>
                    <div className={`text-[14px] font-bold mt-0.5 ${isToday ? 'text-[#5B3E9E]' : 'text-[var(--ar-text)]'}`}>{date.getDate()}</div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="relative flex">
              {/* Time labels */}
              <div className="w-14 shrink-0 border-r border-[var(--ar-border)]">
                {HOURS.map(h => (
                  <div key={h} className="flex items-start justify-end pr-2" style={{ height: HOUR_HEIGHT }}>
                    <span className="text-[9px] text-[var(--ar-muted)] -mt-1.5">{h.toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dates.map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const daySesiones = sesiones.filter(s => s.fecha === dateStr)
                const isDragTarget = dragging && dragDate === dateStr

                return (
                  <div
                    key={dateStr}
                    className="flex-1 relative border-r border-[var(--ar-border)]/30 min-w-[100px] select-none"
                    onMouseDown={e => handleMouseDown(e, dateStr)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { if (dragging) handleMouseUp() }}
                    onDragOver={e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      const rect = e.currentTarget.getBoundingClientRect()
                      setDropIndicator({ date: dateStr, y: e.clientY - rect.top })
                    }}
                    onDragLeave={() => setDropIndicator(null)}
                    onDrop={e => handleDrop(e, dateStr)}
                  >
                    {/* Grid lines */}
                    {HOURS.map(h => (
                      <div key={h} className="border-b border-[var(--ar-border)]/20 hover:bg-[#f9f7f5]/50" style={{ height: HOUR_HEIGHT }} />
                    ))}

                    {/* Drop indicator */}
                    {dropIndicator && dropIndicator.date === dateStr && (
                      <div className="absolute left-1 right-1 h-11 bg-blue-500/20 border-2 border-blue-500 rounded-md pointer-events-none z-30 flex items-center justify-center"
                        style={{ top: `${Math.round(dropIndicator.y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4)}px` }}>
                        <span className="text-[9px] text-blue-600 font-bold">{yToTime(Math.round(dropIndicator.y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4))}</span>
                      </div>
                    )}

                    {/* Drag selection preview */}
                    {isDragTarget && !showPopup && (
                      <div className="absolute left-1 right-1 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-md pointer-events-none z-20"
                        style={{ top: `${Math.min(dragStartY, dragEndY)}px`, height: `${Math.abs(dragEndY - dragStartY)}px` }}>
                        <span className="text-[9px] text-blue-600 font-medium p-1">
                          {yToTime(Math.min(dragStartY, dragEndY))} – {yToTime(Math.max(dragStartY, dragEndY))}
                        </span>
                      </div>
                    )}

                    {/* Solid block while popup open */}
                    {showPopup && popupData.fecha === dateStr && (
                      <div className="absolute left-1 right-1 bg-blue-500 rounded-md z-20 shadow-lg shadow-blue-500/30"
                        style={{ top: `${timeToY(popupData.startTime)}px`, height: `${timeToY(popupData.endTime) - timeToY(popupData.startTime)}px` }}>
                        <div className="p-1.5 text-white">
                          <p className="text-[10px] font-bold">Nueva sesión</p>
                          <p className="text-[9px] opacity-80">{popupData.startTime} – {popupData.endTime}</p>
                        </div>
                      </div>
                    )}

                    {/* Appointment blocks */}
                    {daySesiones.map(s => {
                      const top = timeToY(s.hora_inicio)
                      const height = timeToY(s.hora_fin) - top
                      const [sH, sM] = s.hora_inicio.split(':').map(Number)
                      const [eH, eM] = s.hora_fin.split(':').map(Number)
                      const duration = (eH * 60 + eM) - (sH * 60 + sM)
                      const color = profColorMap[s.profesional.id] || '#5C5470'

                      return (
                        <div
                          key={s.id}
                          data-appointment="true"
                          draggable
                          onDragStart={e => {
                            e.stopPropagation()
                            e.dataTransfer.setData('appointmentId', s.id)
                            e.dataTransfer.setData('duration', String(duration))
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          className="absolute left-1 right-1 rounded-md border-l-[3px] px-1.5 py-1 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md hover:brightness-95 transition-all z-10 group"
                          style={{ top: `${top}px`, height: `${Math.max(height, 20)}px`, borderLeftColor: color, background: color + '18' }}
                        >
                          <p className="text-[10px] font-bold truncate" style={{ color }}>{s.alumno.nombre} {s.alumno.apellido[0]}.</p>
                          <p className="text-[9px] truncate opacity-70" style={{ color }}>{s.profesional.nombre} {s.profesional.apellido[0]}.</p>
                          <p className="text-[8px] opacity-50" style={{ color }}>{s.hora_inicio.slice(0,5)} – {s.hora_fin.slice(0,5)}</p>
                          {/* Resize handle */}
                          <div
                            onMouseDown={e => handleResizeStart(e, s)}
                            className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          ><div className="w-8 h-1 rounded-full opacity-40" style={{ background: color }} /></div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {profesionales.slice(0, 8).map(p => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: profColorMap[p.id] || '#5C5470' }} />
            <span className="text-[10px] text-[var(--ar-muted)]">{p.nombre} {p.apellido}</span>
          </div>
        ))}
      </div>

      {/* ═══ POPUP: CREAR SESIÓN (Google Calendar style) ═══ */}
      {showPopup && (
        <div className="fixed inset-0 z-50" onClick={() => setShowPopup(false)}>
          <div className="fixed top-20 right-4 md:right-8 bg-white rounded-2xl shadow-2xl border border-[var(--ar-border)] w-[90vw] md:w-96 animate-fade-in-scale max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--ar-border)]">
              <h3 className="font-bold text-[15px] text-[var(--ar-text)]">Agendar sesión</h3>
              <button onClick={() => setShowPopup(false)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Time */}
              <div className="flex items-center gap-3 text-[12px] text-[var(--ar-muted)]">
                <i className="ti ti-clock text-[14px]" aria-hidden="true"/>
                <span className="font-medium text-[var(--ar-text)]">
                  {new Date(popupData.fecha + 'T12:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <input type="time" value={popupData.startTime} onChange={e => setPopupData({...popupData, startTime: e.target.value})} className="border border-[var(--ar-border)] rounded-lg px-2 py-1 text-[12px] font-bold w-24" />
                <span>–</span>
                <input type="time" value={popupData.endTime} onChange={e => setPopupData({...popupData, endTime: e.target.value})} className="border border-[var(--ar-border)] rounded-lg px-2 py-1 text-[12px] font-bold w-24" />
              </div>
              {/* Alumno */}
              <select value={popupForm.alumno_id} onChange={e => setPopupForm({...popupForm, alumno_id: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">Seleccionar alumno...</option>
                {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
              </select>
              {/* Profesional */}
              <select value={popupForm.profesional_id} onChange={e => setPopupForm({...popupForm, profesional_id: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">Seleccionar profesional...</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
              {/* Tipo + Modalidad */}
              <div className="grid grid-cols-2 gap-2">
                <select value={popupForm.tipo_sesion} onChange={e => setPopupForm({...popupForm, tipo_sesion: e.target.value})} className="select-base w-full text-[12px]">
                  <option value="individual">Individual</option><option value="grupal">Grupal</option>
                  <option value="familiar">Familiar</option><option value="evaluacion">Evaluación</option>
                </select>
                <select value={popupForm.modalidad} onChange={e => setPopupForm({...popupForm, modalidad: e.target.value})} className="select-base w-full text-[12px]">
                  <option value="presencial">Presencial</option><option value="remota">Remota</option><option value="domicilio">Domicilio</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-[var(--ar-border)]">
              <button onClick={handleCreate} disabled={creating || !popupForm.alumno_id || !popupForm.profesional_id}
                className="btn-primary text-[12px] disabled:opacity-50">
                {creating ? 'Creando...' : 'Agendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
