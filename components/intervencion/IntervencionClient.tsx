'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Plan {
  id: string
  alumno: { id: string; nombre: string; apellido: string; curso: string; foto_url: string | null }
  diagnostico: string | null
  nivel_apoyo: string
  estado: string
  fecha_inicio: string
  objetivos: { id: string; area: string; estado: string; progreso: number }[]
  equipo: { id: string; especialidad: string; profesional: { nombre: string; apellido: string } }[]
}

interface Props {
  planes: Plan[]
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  profesionales: { id: string; nombre: string; apellido: string; email: string; rol: string }[]
}

const NIVEL_COLORS: Record<string, string> = {
  leve: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermedio: 'bg-amber-50 text-amber-700 border-amber-200',
  intensivo: 'bg-red-50 text-red-700 border-red-200',
}

const ESTADO_COLORS: Record<string, string> = {
  activo: 'bg-emerald-50 text-emerald-700',
  borrador: 'bg-slate-100 text-slate-600',
  pausado: 'bg-amber-50 text-amber-700',
  cerrado: 'bg-slate-100 text-slate-500',
}

const ESPECIALIDAD_LABELS: Record<string, string> = {
  educadora_diferencial: 'Ed. Diferencial',
  fonoaudiologa: 'Fonoaudióloga',
  terapeuta_ocupacional: 'T.O.',
  psicologa: 'Psicóloga',
  psicopedagoga: 'Psicopedagoga',
  'kinesióloga': 'Kinesióloga',
  trabajadora_social: 'T. Social',
  neurologo: 'Neurólogo',
  psiquiatra: 'Psiquiatra',
  tecnico_parvularia: 'Téc. Parvularia',
  otro: 'Otro',
}

export default function IntervencionClient({ planes, alumnos, profesionales }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<string>('activo')
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [form, setForm] = useState({
    alumno_id: '',
    diagnostico: '',
    nivel_apoyo: 'intermedio',
    antecedentes: '',
    fortalezas: '',
    barreras: '',
  })

  const planesFiltrados = planes.filter(p => {
    if (filtroEstado && filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const matchNombre = `${p.alumno.nombre} ${p.alumno.apellido}`.toLowerCase().includes(q)
      const matchDiag = p.diagnostico?.toLowerCase().includes(q)
      if (!matchNombre && !matchDiag) return false
    }
    return true
  })

  // KPIs
  const planesActivos = planes.filter(p => p.estado === 'activo').length
  const totalObjetivos = planes.reduce((acc, p) => acc + p.objetivos.length, 0)
  const objetivosLogrados = planes.reduce((acc, p) => acc + p.objetivos.filter(o => o.estado === 'logrado').length, 0)
  const progresoGlobal = totalObjetivos > 0
    ? Math.round(planes.reduce((acc, p) => acc + p.objetivos.reduce((a, o) => a + o.progreso, 0), 0) / totalObjetivos)
    : 0

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.alumno_id) { toast.error('Selecciona un alumno'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/intervencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Plan creado exitosamente')
      setShowModal(false)
      setForm({ alumno_id: '', diagnostico: '', nivel_apoyo: 'intermedio', antecedentes: '', fortalezas: '', barreras: '' })
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear plan')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Intervención NEE</h1>
          <p className="page-subtitle">Planes de Intervención Individual · Seguimiento terapéutico</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <i className="ti ti-plus text-[14px]" aria-hidden="true"/>
          Nuevo Plan
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card">
          <div className="kpi-label">Planes activos</div>
          <div className="kpi-value">{planesActivos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Objetivos totales</div>
          <div className="kpi-value">{totalObjetivos}</div>
          <div className="kpi-sub">{objetivosLogrados} logrados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Progreso global</div>
          <div className="kpi-value">{progresoGlobal}%</div>
          <div className="mt-2 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[var(--ar-accent)] transition-all" style={{ width: `${progresoGlobal}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Profesionales</div>
          <div className="kpi-value">{profesionales.length}</div>
          <div className="kpi-sub">en el equipo</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-[var(--ar-border)] overflow-hidden">
          {['activo', 'todos', 'borrador', 'pausado', 'cerrado'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-2 text-[11px] font-medium capitalize transition-all ${
                filtroEstado === e
                  ? 'bg-[var(--ar-navy)] text-white'
                  : 'bg-white text-[var(--ar-muted)] hover:bg-[#f9fafb]'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar alumno o diagnóstico..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="input-base h-9 w-64 text-[12px]"
        />
      </div>

      {/* Plans grid */}
      {planesFiltrados.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="ti ti-heart-handshake text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">No hay planes de intervención {filtroEstado !== 'todos' ? `en estado "${filtroEstado}"` : ''}</p>
          <button onClick={() => setShowModal(true)} className="btn-accent mt-4 text-[12px]">
            <i className="ti ti-plus" aria-hidden="true"/> Crear primer plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {planesFiltrados.map(plan => {
            const progreso = plan.objetivos.length > 0
              ? Math.round(plan.objetivos.reduce((a, o) => a + o.progreso, 0) / plan.objetivos.length)
              : 0

            return (
              <Link
                key={plan.id}
                href={`/intervencion/${plan.id}`}
                className="card p-5 hover:shadow-md hover:border-[var(--ar-accent)]/30 transition-all group"
              >
                {/* Alumno */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B3E9E] to-[#E85D3A] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                    {plan.alumno.nombre[0]}{plan.alumno.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ar-text)] truncate">
                      {plan.alumno.nombre} {plan.alumno.apellido}
                    </div>
                    <div className="text-[11px] text-[var(--ar-muted)]">{plan.alumno.curso}</div>
                  </div>
                  <span className={`tag ${ESTADO_COLORS[plan.estado]}`}>{plan.estado}</span>
                </div>

                {/* Diagnóstico y nivel */}
                <div className="flex items-center gap-2 mb-3">
                  {plan.diagnostico && (
                    <span className="text-[11px] font-medium text-[var(--ar-text)] bg-[#f3f0f9] px-2 py-0.5 rounded">
                      {plan.diagnostico}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${NIVEL_COLORS[plan.nivel_apoyo]}`}>
                    {plan.nivel_apoyo}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[var(--ar-muted)]">{plan.objetivos.length} objetivos</span>
                    <span className="font-semibold text-[var(--ar-text)]">{progreso}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progreso}%`,
                        background: progreso >= 75 ? '#4A9E7A' : progreso >= 40 ? '#E85D3A' : '#5B3E9E'
                      }}
                    />
                  </div>
                </div>

                {/* Equipo */}
                {plan.equipo.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plan.equipo.slice(0, 4).map(e => (
                      <span key={e.id} className="text-[9px] bg-[#f9f7f5] text-[var(--ar-muted)] px-1.5 py-0.5 rounded font-medium">
                        {ESPECIALIDAD_LABELS[e.especialidad] || e.especialidad}
                      </span>
                    ))}
                    {plan.equipo.length > 4 && (
                      <span className="text-[9px] text-[var(--ar-muted)] px-1.5 py-0.5">+{plan.equipo.length - 4}</span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal crear plan */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--ar-border)]">
              <h3 className="text-[16px] font-bold text-[var(--ar-text)] font-display">Nuevo Plan de Intervención</h3>
              <p className="text-[12px] text-[var(--ar-muted)] mt-1">Crea un PII para un alumno con NEE</p>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Alumno *</label>
                <select
                  value={form.alumno_id}
                  onChange={e => setForm({ ...form, alumno_id: e.target.value })}
                  className="select-base w-full"
                  required
                >
                  <option value="">Seleccionar alumno...</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Diagnóstico</label>
                  <input
                    type="text"
                    value={form.diagnostico}
                    onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                    className="input-base"
                    placeholder="CEA, TDAH, TEL..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Nivel de apoyo</label>
                  <select
                    value={form.nivel_apoyo}
                    onChange={e => setForm({ ...form, nivel_apoyo: e.target.value })}
                    className="select-base w-full"
                  >
                    <option value="leve">Leve</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="intensivo">Intensivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Antecedentes</label>
                <textarea
                  value={form.antecedentes}
                  onChange={e => setForm({ ...form, antecedentes: e.target.value })}
                  className="input-base min-h-[60px] resize-y"
                  placeholder="Historia clínica relevante..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Fortalezas</label>
                  <textarea
                    value={form.fortalezas}
                    onChange={e => setForm({ ...form, fortalezas: e.target.value })}
                    className="input-base min-h-[50px] resize-y"
                    placeholder="Fortalezas del alumno..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">Barreras</label>
                  <textarea
                    value={form.barreras}
                    onChange={e => setForm({ ...form, barreras: e.target.value })}
                    className="input-base min-h-[50px] resize-y"
                    placeholder="Barreras para el aprendizaje..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creando...' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
