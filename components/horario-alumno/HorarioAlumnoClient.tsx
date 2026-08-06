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
const HORAS: string[] = []
for (let h = 8; h <= 17; h++) {
  HORAS.push(`${h.toString().padStart(2, '0')}:00`)
  HORAS.push(`${h.toString().padStart(2, '0')}:30`)
}

const HOUR_HEIGHT = 48 // px per 30min slot
const START_HOUR = 8
const COLOR_PED = '#3b6ea5'
const COLOR_TER = '#5B3E9E'

const ASIGNATURAS_PED = ['Matemática', 'Lenguaje', 'Ciencias', 'Historia', 'Inglés', 'Arte', 'Música', 'Ed. Física', 'Tecnología']
const ASIGNATURAS_TER = ['Fonoaudiología', 'Terapia Ocupacional', 'Psicología', 'Psicopedagogía', 'Kinesiología', 'Musicoterapia']

export default function HorarioAlumnoClient({ alumnos, profesionales, rol }: Props) {
  const [alumnoId, setAlumnoId] = useState('')
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [loading, setLoading] = useState(false)

  // Drag-to-create state
  const [dragging, setDragging] = useState(false)
  const [dragDia, setDragDia] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragEndY, setDragEndY] = useState(0)

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [popupData, setPopupData] = useState({ dia: 0, startTime: '', endTime: '' })
  const [popupForm, setPopupForm] = useState({ tipo: 'pedagogico', asignatura: '', profesional_id: '', sala: '' })
  const [creating, setCreating] = useState(false)

  // Drop indicator
  const [dropIndicator, setDropIndicator] = useState<{ dia: number; y: number } | null>(null)

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

  // Y position → time string
  const yToTime = (y: number): string => {
    const totalSlots = Math.round(y / HOUR_HEIGHT)
    const totalMinutes = START_HOUR * 60 + totalSlots * 30
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Time string → Y position
  const timeToY = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    const totalMinutes = h * 60 + m
    return ((totalMinutes - START_HOUR * 60) / 30) * HOUR_HEIGHT
  }

  // Mouse handlers for drag-to-create
  const handleMouseDown = (e: React.MouseEvent, dia: number) => {
    if ((e.target as HTMLElement).closest('[data-bloque]')) return
    if (e.button !== 0 || !isAdmin) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    setDragging(true)
    setDragDia(dia)
    setDragStartY(y)
    setDragEndY(y)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragEndY(Math.max(0, e.clientY - rect.top))
  }

  const handleMouseUp = () => {
    if (!dragging) { setDragging(false); return }
    const minY = Math.min(dragStartY, dragEndY)
    const maxY = Math.max(dragStartY, dragEndY)
    if (maxY - minY < 20) { setDragging(false); return }

    const startTime = yToTime(minY)
    const endTime = yToTime(maxY)

    setPopupData({ dia: dragDia, startTime, endTime })
    setPopupForm({ tipo: 'pedagogico', asignatura: '', profesional_id: '', sala: '' })
    setShowPopup(true)
    setDragging(false)
  }

  // Create block from popup
  const handleCreate = async () => {
    if (!popupForm.asignatura) { toast.error('Selecciona una asignatura'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/horario-alumno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumnoId,
          dia_semana: popupData.dia,
          hora_inicio: popupData.startTime,
          hora_fin: popupData.endTime,
          tipo: popupForm.tipo,
          asignatura: popupForm.asignatura,
          profesional_id: popupForm.profesional_id || null,
          sala: popupForm.sala || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Bloque creado')
      setShowPopup(false)
      fetchHorario()
    } catch (err: any) { toast.error(err.message) } finally { setCreating(false) }
  }

  // Delete block
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/horario-alumno?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Eliminado'); fetchHorario() }
  }

  // Drag-to-move block
  const handleDrop = async (e: React.DragEvent, dia: number) => {
    e.preventDefault()
    setDropIndicator(null)
    const bloqueId = e.dataTransfer.getData('bloqueId')
    if (!bloqueId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newStart = yToTime(Math.round(y / HOUR_HEIGHT) * HOUR_HEIGHT)
    // Keep same duration
    const bloque = bloques.find(b => b.id === bloqueId)
    if (!bloque) return
    const [sh, sm] = bloque.hora_inicio.split(':').map(Number)
    const [eh, em] = bloque.hora_fin.split(':').map(Number)
    const durMin = (eh * 60 + em) - (sh * 60 + sm)
    const [nh, nm] = newStart.split(':').map(Number)
    const endMin = nh * 60 + nm + durMin
    const newEnd = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`

    const res = await fetch('/api/horario-alumno', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bloqueId, dia_semana: dia, hora_inicio: newStart, hora_fin: newEnd }),
    })
    if (res.ok) { toast.success('Bloque movido'); fetchHorario() }
  }

  const asignaturas = popupForm.tipo === 'terapeutico' ? ASIGNATURAS_TER : ASIGNATURAS_PED

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="page-title">Horario Individual</h1>
          <p className="page-subtitle">Horario semanal pedagógico y terapéutico por alumno</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={alumnoId} onChange={e => setAlumnoId(e.target.value)} className="select-base w-72">
            <option value="">Seleccionar alumno...</option>
            {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
          </select>
          {alumnoId && (
            <button onClick={() => window.print()} className="btn-secondary">
              <i className="ti ti-printer text-[14px]" aria-hidden="true"/> Imprimir
            </button>
          )}
        </div>
      </div>

      {!alumnoId ? (
        <div className="card p-12 text-center">
          <i className="ti ti-calendar-time text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">Selecciona un alumno para ver o editar su horario</p>
        </div>
      ) : (
        <>
          {/* Print header */}
          <div className="hidden print:block mb-4">
            <h2 className="text-[18px] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Horario — {alumnoSeleccionado?.nombre} {alumnoSeleccionado?.apellido}
            </h2>
            <p className="text-[11px] text-[#5C5470]">{alumnoSeleccionado?.curso}</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: COLOR_PED }}/><span className="text-[11px] font-medium">Pedagógico</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: COLOR_TER }}/><span className="text-[11px] font-medium">Terapéutico</span></div>
            {isAdmin && <span className="text-[10px] text-[var(--ar-muted)] ml-4">Click y arrastra para crear · Arrastra bloques para mover</span>}
          </div>

          {/* Calendar grid */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Day headers */}
                <div className="flex border-b border-[var(--ar-border)] sticky top-0 bg-white z-10">
                  <div className="w-14 flex-shrink-0 border-r border-[var(--ar-border)] px-2 py-3">
                    <span className="text-[9px] font-bold text-[var(--ar-muted)] uppercase">Hora</span>
                  </div>
                  {DIAS.map((dia, i) => (
                    <div key={dia} className="flex-1 p-3 text-center border-r border-[var(--ar-border)]/50 min-w-[130px]">
                      <span className="text-[11px] font-bold text-[var(--ar-text)] uppercase tracking-wider">{dia}</span>
                    </div>
                  ))}
                </div>

                {/* Time grid */}
                <div className="relative flex">
                  {/* Time labels */}
                  <div className="w-14 flex-shrink-0 border-r border-[var(--ar-border)]">
                    {HORAS.map(h => (
                      <div key={h} className="flex items-start justify-end pr-2" style={{ height: HOUR_HEIGHT }}>
                        <span className="text-[9px] text-[var(--ar-muted)] -mt-1.5">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DIAS.map((_, di) => {
                    const dia = di + 1
                    const diaBloques = bloques.filter(b => b.dia_semana === dia)
                    const isDragTarget = dragging && dragDia === dia

                    return (
                      <div
                        key={dia}
                        className="flex-1 relative border-r border-[var(--ar-border)]/30 min-w-[130px] select-none"
                        onMouseDown={e => handleMouseDown(e, dia)}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={() => { if (dragging) handleMouseUp() }}
                        onDragOver={e => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          const rect = e.currentTarget.getBoundingClientRect()
                          setDropIndicator({ dia, y: e.clientY - rect.top })
                        }}
                        onDragLeave={() => setDropIndicator(null)}
                        onDrop={e => handleDrop(e, dia)}
                      >
                        {/* Grid lines */}
                        {HORAS.map(h => (
                          <div key={h} className="border-b border-[var(--ar-border)]/20 hover:bg-[#f9f7f5]/50" style={{ height: HOUR_HEIGHT }} />
                        ))}

                        {/* Drop indicator */}
                        {dropIndicator && dropIndicator.dia === dia && (
                          <div
                            className="absolute left-1 right-1 h-10 bg-blue-500/20 border-2 border-blue-500 rounded-md pointer-events-none z-30 flex items-center justify-center"
                            style={{ top: `${Math.round(dropIndicator.y / HOUR_HEIGHT) * HOUR_HEIGHT}px` }}
                          >
                            <span className="text-[9px] text-blue-600 font-bold">{yToTime(Math.round(dropIndicator.y / HOUR_HEIGHT) * HOUR_HEIGHT)}</span>
                          </div>
                        )}

                        {/* Drag selection preview */}
                        {isDragTarget && !showPopup && (
                          <div
                            className="absolute left-1 right-1 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-md pointer-events-none z-20"
                            style={{ top: `${Math.min(dragStartY, dragEndY)}px`, height: `${Math.abs(dragEndY - dragStartY)}px` }}
                          >
                            <span className="text-[9px] text-blue-600 font-medium p-1">
                              {yToTime(Math.min(dragStartY, dragEndY))} – {yToTime(Math.max(dragStartY, dragEndY))}
                            </span>
                          </div>
                        )}

                        {/* Bloque cards */}
                        {diaBloques.map(bloque => {
                          const top = timeToY(bloque.hora_inicio)
                          const height = timeToY(bloque.hora_fin) - top
                          const bg = bloque.color || (bloque.tipo === 'terapeutico' ? COLOR_TER : COLOR_PED)

                          return (
                            <div
                              key={bloque.id}
                              data-bloque="true"
                              draggable={isAdmin}
                              onDragStart={e => {
                                e.stopPropagation()
                                e.dataTransfer.setData('bloqueId', bloque.id)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md hover:brightness-95 transition-all z-10 group"
                              style={{ top: `${top}px`, height: `${Math.max(height, 24)}px`, background: bg }}
                            >
                              <p className="text-[11px] font-bold text-white truncate">{bloque.asignatura}</p>
                              {bloque.profesional && <p className="text-[9px] text-white/80 truncate">{bloque.profesional.nombre} {bloque.profesional.apellido[0]}.</p>}
                              {bloque.sala && <p className="text-[9px] text-white/60 truncate">{bloque.sala}</p>}
                              <p className="text-[8px] text-white/50">{bloque.hora_inicio.slice(0,5)}-{bloque.hora_fin.slice(0,5)}</p>
                              {/* Delete button */}
                              {isAdmin && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleDelete(bloque.id) }}
                                  className="absolute top-1 right-1 w-4 h-4 rounded bg-black/20 text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex items-center justify-center"
                                >✕</button>
                              )}
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
        </>
      )}

      {/* Popup for creating block */}
      {showPopup && (
        <div className="fixed inset-0 z-50" onClick={() => setShowPopup(false)}>
          <div
            className="fixed top-20 right-4 md:right-8 bg-white rounded-2xl shadow-2xl border border-[var(--ar-border)] w-[90vw] md:w-96 animate-fade-in-scale max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--ar-border)]">
              <h3 className="font-bold text-[15px] text-[var(--ar-text)]">Nuevo bloque</h3>
              <button onClick={() => setShowPopup(false)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Time display */}
              <div className="flex items-center gap-3 text-[12px] text-[var(--ar-muted)]">
                <i className="ti ti-clock text-[14px]" aria-hidden="true"/>
                <span className="font-medium text-[var(--ar-text)]">{DIAS[popupData.dia - 1]}</span>
                <input type="time" value={popupData.startTime}
                  onChange={e => setPopupData({...popupData, startTime: e.target.value})}
                  className="border border-[var(--ar-border)] rounded-lg px-2 py-1 text-[12px] font-bold w-24" />
                <span>–</span>
                <input type="time" value={popupData.endTime}
                  onChange={e => setPopupData({...popupData, endTime: e.target.value})}
                  className="border border-[var(--ar-border)] rounded-lg px-2 py-1 text-[12px] font-bold w-24" />
              </div>

              {/* Tipo */}
              <div className="flex gap-2">
                <button onClick={() => setPopupForm({...popupForm, tipo: 'pedagogico', asignatura: ''})}
                  className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold border transition-all ${popupForm.tipo === 'pedagogico' ? 'text-white border-transparent' : 'text-[var(--ar-muted)] border-[var(--ar-border)]'}`}
                  style={popupForm.tipo === 'pedagogico' ? { background: COLOR_PED } : {}}>
                  Pedagógico
                </button>
                <button onClick={() => setPopupForm({...popupForm, tipo: 'terapeutico', asignatura: ''})}
                  className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold border transition-all ${popupForm.tipo === 'terapeutico' ? 'text-white border-transparent' : 'text-[var(--ar-muted)] border-[var(--ar-border)]'}`}
                  style={popupForm.tipo === 'terapeutico' ? { background: COLOR_TER } : {}}>
                  Terapéutico
                </button>
              </div>

              {/* Asignatura */}
              <select value={popupForm.asignatura} onChange={e => setPopupForm({...popupForm, asignatura: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">Seleccionar asignatura/sesión...</option>
                {asignaturas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* Profesional */}
              <select value={popupForm.profesional_id} onChange={e => setPopupForm({...popupForm, profesional_id: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">Profesional (opcional)</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>

              {/* Sala */}
              <input value={popupForm.sala} onChange={e => setPopupForm({...popupForm, sala: e.target.value})} className="input-base text-[12px]" placeholder="Sala / espacio (opcional)" />
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-[var(--ar-border)]">
              <button onClick={handleCreate} disabled={creating || !popupForm.asignatura}
                className="btn-primary text-[12px] disabled:opacity-50">
                {creating ? 'Creando...' : 'Crear bloque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
