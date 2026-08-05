'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Inscripcion {
  id: string; alumno_id: string; estado: string; fecha_ingreso: string
  alumno: { id: string; nombre: string; apellido: string; curso: string }
}

interface Programa {
  id: string; nombre: string; descripcion: string | null; tipo: string
  modalidad: string; jornada: string; hora_inicio: string | null; hora_fin: string | null
  cupo_maximo: number | null; costo_mensual: number | null; costo_matricula: number | null
  equipo_requerido: string | null; activo: boolean
  inscripciones: Inscripcion[]
}

interface Props {
  programas: Programa[]
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  rol: string
}

const TIPO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  educativo: { label: 'Educativo', color: '#2D1B69', bg: '#f3f0f9' },
  terapeutico: { label: 'Terapéutico', color: '#5B3E9E', bg: '#f3f0f9' },
  after_school: { label: 'After School', color: '#E85D3A', bg: '#fef0ec' },
  sesiones_individuales: { label: 'Sesiones individuales', color: '#3D7A94', bg: '#edf6fa' },
  evaluacion: { label: 'Evaluación', color: '#B86E00', bg: '#fef3e2' },
  mixto: { label: 'Mixto', color: '#4A9E7A', bg: '#edf7f2' },
}

const JORNADA_LABELS: Record<string, string> = {
  completa: 'Jornada completa', media: 'Media jornada', por_horas: 'Por horas', flexible: 'Flexible',
}

export default function ProgramasClient({ programas, alumnos, rol }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPrograma, setSelectedPrograma] = useState<string | null>(null)
  const [showInscribir, setShowInscribir] = useState(false)

  const isAdmin = ['super_admin', 'admin'].includes(rol)
  const selected = programas.find(p => p.id === selectedPrograma)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Programas</h1>
          <p className="page-subtitle">Programas educativos y terapéuticos del centro</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nuevo programa
          </button>
        )}
      </div>

      {/* Programs grid */}
      {programas.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="ti ti-category text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">No hay programas creados</p>
          {isAdmin && <button onClick={() => setShowCreate(true)} className="btn-accent mt-4 text-[12px]"><i className="ti ti-plus" aria-hidden="true"/> Crear programa</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {programas.map(prog => {
            const tipoInfo = TIPO_LABELS[prog.tipo] || TIPO_LABELS.educativo
            const activos = prog.inscripciones.filter(i => i.estado === 'activo').length

            return (
              <div
                key={prog.id}
                onClick={() => setSelectedPrograma(prog.id)}
                className={`card p-5 cursor-pointer transition-all hover:shadow-md ${
                  !prog.activo ? 'opacity-50' : ''
                } ${selectedPrograma === prog.id ? 'ring-2 ring-[var(--ar-accent)]/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: tipoInfo.color, background: tipoInfo.bg }}>
                    {tipoInfo.label}
                  </span>
                  {!prog.activo && <span className="tag tag-gray">Inactivo</span>}
                </div>
                <h3 className="text-[14px] font-bold text-[var(--ar-text)] mb-1">{prog.nombre}</h3>
                {prog.descripcion && <p className="text-[11px] text-[var(--ar-muted)] line-clamp-2 mb-3">{prog.descripcion}</p>}

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] bg-[#f9f7f5] text-[var(--ar-muted)] px-2 py-0.5 rounded">{prog.modalidad}</span>
                  <span className="text-[10px] bg-[#f9f7f5] text-[var(--ar-muted)] px-2 py-0.5 rounded">{JORNADA_LABELS[prog.jornada]}</span>
                  {prog.hora_inicio && <span className="text-[10px] bg-[#f9f7f5] text-[var(--ar-muted)] px-2 py-0.5 rounded">{prog.hora_inicio.slice(0,5)} - {prog.hora_fin?.slice(0,5)}</span>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--ar-border)]/50">
                  <div className="flex items-center gap-1.5">
                    <i className="ti ti-users text-[12px] text-[var(--ar-muted)]" aria-hidden="true"/>
                    <span className="text-[11px] font-semibold text-[var(--ar-text)]">{activos}</span>
                    {prog.cupo_maximo && <span className="text-[10px] text-[var(--ar-muted)]">/ {prog.cupo_maximo}</span>}
                  </div>
                  {prog.costo_mensual && (
                    <span className="text-[11px] font-semibold text-[var(--ar-text)]">${prog.costo_mensual.toLocaleString('es-CL')}/mes</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-[var(--ar-text)]">{selected.nombre} — Alumnos inscritos</h3>
            {isAdmin && (
              <button onClick={() => setShowInscribir(true)} className="btn-primary text-[11px] py-1.5 px-3">
                <i className="ti ti-user-plus text-[12px]" aria-hidden="true"/> Inscribir alumno
              </button>
            )}
          </div>
          {selected.equipo_requerido && (
            <p className="text-[11px] text-[var(--ar-muted)] mb-4"><strong>Equipo:</strong> {selected.equipo_requerido}</p>
          )}

          {selected.inscripciones.filter(i => i.estado === 'activo').length === 0 ? (
            <p className="text-[12px] text-[var(--ar-muted)] text-center py-6">Sin alumnos inscritos</p>
          ) : (
            <div className="space-y-2">
              {selected.inscripciones.filter(i => i.estado === 'activo').map(ins => (
                <div key={ins.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f9f7f5]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B3E9E] to-[#E85D3A] flex items-center justify-center text-white text-[10px] font-bold">
                      {ins.alumno.nombre[0]}{ins.alumno.apellido[0]}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-[var(--ar-text)]">{ins.alumno.nombre} {ins.alumno.apellido}</div>
                      <div className="text-[10px] text-[var(--ar-muted)]">{ins.alumno.curso} · Desde {new Date(ins.fecha_ingreso + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        if (!confirm('¿Egresar a este alumno del programa?')) return
                        const res = await fetch('/api/programas/inscripciones', {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: ins.id, estado: 'egresado' }),
                        })
                        if (res.ok) { toast.success('Alumno egresado'); window.location.reload() }
                      }}
                      className="text-[10px] text-red-500 font-medium hover:underline"
                    >Egresar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Crear programa */}
      {showCreate && <ModalCrearPrograma onClose={() => setShowCreate(false)} />}

      {/* Modal: Inscribir alumno */}
      {showInscribir && selected && (
        <ModalInscribir programaId={selected.id} alumnos={alumnos} inscritos={selected.inscripciones.map(i => i.alumno_id)} onClose={() => setShowInscribir(false)} />
      )}
    </div>
  )
}

// ─── MODAL: CREAR PROGRAMA ───
function ModalCrearPrograma({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', tipo: 'educativo', modalidad: 'presencial',
    jornada: 'completa', hora_inicio: '08:30', hora_fin: '13:00',
    cupo_maximo: '', costo_mensual: '', costo_matricula: '', equipo_requerido: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/programas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cupo_maximo: form.cupo_maximo ? parseInt(form.cupo_maximo) : null,
          costo_mensual: form.costo_mensual ? parseInt(form.costo_mensual) : null,
          costo_matricula: form.costo_matricula ? parseInt(form.costo_matricula) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Programa creado')
      onClose(); window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Nuevo programa</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Programa Educativo Intensivo" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="input-base text-[12px] min-h-[50px]" placeholder="Descripción del programa..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select-base w-full text-[12px]">
                <option value="educativo">Educativo</option>
                <option value="terapeutico">Terapéutico</option>
                <option value="after_school">After School</option>
                <option value="sesiones_individuales">Sesiones individuales</option>
                <option value="evaluacion">Evaluación</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})} className="select-base w-full text-[12px]">
                <option value="presencial">Presencial</option><option value="remota">Remota</option><option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Jornada</label>
              <select value={form.jornada} onChange={e => setForm({...form, jornada: e.target.value})} className="select-base w-full text-[12px]">
                <option value="completa">Completa</option><option value="media">Media</option><option value="por_horas">Por horas</option><option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora inicio</label>
              <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} className="input-base text-[12px]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora fin</label>
              <input type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} className="input-base text-[12px]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Cupo máximo</label>
              <input type="number" value={form.cupo_maximo} onChange={e => setForm({...form, cupo_maximo: e.target.value})} className="input-base text-[12px]" placeholder="Ilimitado" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Costo mensual</label>
              <input type="number" value={form.costo_mensual} onChange={e => setForm({...form, costo_mensual: e.target.value})} className="input-base text-[12px]" placeholder="CLP (opcional)" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Matrícula</label>
              <input type="number" value={form.costo_matricula} onChange={e => setForm({...form, costo_matricula: e.target.value})} className="input-base text-[12px]" placeholder="CLP (opcional)" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Equipo requerido</label>
            <input value={form.equipo_requerido} onChange={e => setForm({...form, equipo_requerido: e.target.value})} className="input-base text-[12px]" placeholder="Ed. Diferencial, Fonoaudióloga, T.O..." />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Creando...' : 'Crear programa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL: INSCRIBIR ALUMNO ───
function ModalInscribir({ programaId, alumnos, inscritos, onClose }: {
  programaId: string; alumnos: Props['alumnos']; inscritos: string[]; onClose: () => void
}) {
  const [alumnoId, setAlumnoId] = useState('')
  const [saving, setSaving] = useState(false)

  const disponibles = alumnos.filter(a => !inscritos.includes(a.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alumnoId) return
    setSaving(true)
    try {
      const res = await fetch('/api/programas/inscripciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa_id: programaId, alumno_id: alumnoId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Alumno inscrito')
      onClose(); window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Inscribir alumno</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Alumno</label>
            <select value={alumnoId} onChange={e => setAlumnoId(e.target.value)} className="select-base w-full text-[12px]" required>
              <option value="">Seleccionar...</option>
              {disponibles.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
            </select>
            {disponibles.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Todos los alumnos ya están inscritos</p>}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving || !alumnoId} className="btn-primary text-[12px]">{saving ? 'Inscribiendo...' : 'Inscribir'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
