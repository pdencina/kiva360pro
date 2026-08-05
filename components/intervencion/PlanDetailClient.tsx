'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import RegistrarSesionModal from './RegistrarSesionModal'

interface Objetivo {
  id: string; area: string; descripcion: string; estado: string; progreso: number
  prioridad: number; indicadores: string | null; estrategias: string | null
  responsable: { id: string; nombre: string; apellido: string } | null
}

interface Sesion {
  id: string; fecha: string; hora_inicio: string | null; duracion_min: number | null
  tipo_sesion: string; actividades: string | null; observaciones: string | null
  logros: string | null; estado_ingreso: string | null; estado_egreso: string | null
  asistio: boolean; profesional: { id: string; nombre: string; apellido: string }
}

interface BitacoraEntry {
  id: string; fecha: string; hora: string | null; tipo: string
  descripcion: string; intensidad: number | null; estrategia: string | null
  resultado: string | null; registrado: { nombre: string; apellido: string }
}

interface Props {
  plan: any
  sesiones: Sesion[]
  bitacora: BitacoraEntry[]
  evoluciones: any[]
  profesionales: any[]
  currentUserId: string
}

const AREA_LABELS: Record<string, string> = {
  comunicacion: 'Comunicación', cognitivo: 'Cognitivo', socioemocional: 'Socioemocional',
  motor_grueso: 'Motor grueso', motor_fino: 'Motor fino', autonomia: 'Autonomía',
  conducta: 'Conducta', academico: 'Académico', sensorial: 'Sensorial', otro: 'Otro',
}

const AREA_COLORS: Record<string, string> = {
  comunicacion: '#5B3E9E', cognitivo: '#2D1B69', socioemocional: '#E85D3A',
  motor_grueso: '#4A9E7A', motor_fino: '#3D7A94', autonomia: '#B86E00',
  conducta: '#C43B2B', academico: '#2D7A54', sensorial: '#6B4C9A', otro: '#5C5470',
}

const TIPO_BITACORA_ICONS: Record<string, string> = {
  logro: 'ti-trophy', conducta_desafiante: 'ti-alert-triangle', desregulacion: 'ti-mood-sad',
  interaccion_social: 'ti-users', autonomia: 'ti-walk', comunicacion: 'ti-message', otro: 'ti-note',
}

type Tab = 'objetivos' | 'sesiones' | 'bitacora' | 'evoluciones' | 'equipo'

export default function PlanDetailClient({ plan, sesiones, bitacora, evoluciones, profesionales, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>('objetivos')
  const [showSesionModal, setShowSesionModal] = useState(false)
  const [showObjetivoForm, setShowObjetivoForm] = useState(false)
  const [showBitacoraForm, setShowBitacoraForm] = useState(false)

  const objetivos: Objetivo[] = plan.objetivos ?? []
  const progreso = objetivos.length > 0
    ? Math.round(objetivos.reduce((a: number, o: Objetivo) => a + o.progreso, 0) / objetivos.length)
    : 0

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: 'objetivos', label: 'Objetivos', icon: 'ti-target', count: objetivos.length },
    { key: 'sesiones', label: 'Sesiones', icon: 'ti-calendar-event', count: sesiones.length },
    { key: 'bitacora', label: 'Bitácora', icon: 'ti-notebook', count: bitacora.length },
    { key: 'evoluciones', label: 'Evoluciones', icon: 'ti-chart-line', count: evoluciones.length },
    { key: 'equipo', label: 'Equipo', icon: 'ti-users-group', count: plan.equipo?.length ?? 0 },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-[var(--ar-muted)] mb-5">
        <Link href="/intervencion" className="hover:text-[var(--ar-accent)]">Intervención</Link>
        <span>/</span>
        <span className="text-[var(--ar-text)] font-medium">{plan.alumno.nombre} {plan.alumno.apellido}</span>
      </div>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B3E9E] to-[#E85D3A] flex items-center justify-center text-white text-[18px] font-bold shrink-0">
              {plan.alumno.nombre[0]}{plan.alumno.apellido[0]}
            </div>
            <div>
              <h1 className="page-title">{plan.alumno.nombre} {plan.alumno.apellido}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[12px] text-[var(--ar-muted)]">{plan.alumno.curso}</span>
                {plan.diagnostico && (
                  <span className="text-[11px] font-medium text-[#5B3E9E] bg-[#f3f0f9] px-2 py-0.5 rounded">{plan.diagnostico}</span>
                )}
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  plan.nivel_apoyo === 'leve' ? 'bg-emerald-50 text-emerald-700' :
                  plan.nivel_apoyo === 'intensivo' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}>{plan.nivel_apoyo}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--ar-muted)] uppercase tracking-wider">Progreso</div>
            <div className="text-[28px] font-bold font-display text-[var(--ar-text)]">{progreso}%</div>
            <div className="w-24 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden mt-1">
              <div className="h-full rounded-full bg-[var(--ar-accent)]" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--ar-border)] mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.key
                ? 'border-[var(--ar-accent)] text-[var(--ar-text)]'
                : 'border-transparent text-[var(--ar-muted)] hover:text-[var(--ar-text)]'
            }`}
          >
            <i className={`ti ${t.icon} text-[14px]`} aria-hidden="true"/>
            {t.label}
            {t.count !== undefined && <span className="text-[10px] bg-[#f3f0f9] px-1.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'objetivos' && <TabObjetivos objetivos={objetivos} planId={plan.id} onAddClick={() => setShowObjetivoForm(true)} />}
      {tab === 'sesiones' && <TabSesiones sesiones={sesiones} onAddClick={() => setShowSesionModal(true)} />}
      {tab === 'bitacora' && <TabBitacora entries={bitacora} onAddClick={() => setShowBitacoraForm(true)} />}
      {tab === 'evoluciones' && <TabEvoluciones items={evoluciones} />}
      {tab === 'equipo' && <TabEquipo equipo={plan.equipo ?? []} />}

      {/* Modals */}
      {showSesionModal && (
        <RegistrarSesionModal
          planId={plan.id}
          objetivos={objetivos}
          onClose={() => setShowSesionModal(false)}
        />
      )}
      {showObjetivoForm && <ModalObjetivo planId={plan.id} onClose={() => setShowObjetivoForm(false)} />}
      {showBitacoraForm && <ModalBitacora planId={plan.id} onClose={() => setShowBitacoraForm(false)} />}
    </div>
  )
}

// ─── TAB: OBJETIVOS ───
function TabObjetivos({ objetivos, planId, onAddClick }: { objetivos: Objetivo[]; planId: string; onAddClick: () => void }) {
  async function updateProgress(id: string, progreso: number) {
    const updates: any = { id, progreso }
    if (progreso >= 100) { updates.estado = 'logrado' }
    else if (progreso > 0) { updates.estado = 'en_progreso' }
    const res = await fetch('/api/intervencion/objetivos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (res.ok) { toast.success('Progreso actualizado'); window.location.reload() }
    else toast.error('Error al actualizar')
  }

  const grouped = objetivos.reduce((acc, o) => {
    if (!acc[o.area]) acc[o.area] = []
    acc[o.area].push(o)
    return acc
  }, {} as Record<string, Objetivo[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[var(--ar-text)]">Objetivos terapéuticos</h3>
        <button onClick={onAddClick} className="btn-primary text-[11px] py-1.5 px-3">
          <i className="ti ti-plus text-[12px]" aria-hidden="true"/> Agregar
        </button>
      </div>
      {Object.entries(grouped).map(([area, objs]) => (
        <div key={area} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: AREA_COLORS[area] || '#5C5470' }} />
            <span className="text-[11px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">{AREA_LABELS[area] || area}</span>
          </div>
          <div className="space-y-2">
            {objs.sort((a, b) => a.prioridad - b.prioridad).map(obj => (
              <div key={obj.id} className="card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-white" style={{ background: AREA_COLORS[area] || '#5C5470' }}>
                  {obj.progreso}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--ar-text)]">{obj.descripcion}</div>
                  {obj.indicadores && <div className="text-[10px] text-[var(--ar-muted)] mt-1">{obj.indicadores}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${obj.progreso}%`, background: AREA_COLORS[area] }} />
                    </div>
                    <div className="flex gap-1">
                      {[25, 50, 75, 100].map(v => (
                        <button key={v} onClick={() => updateProgress(obj.id, v)} className={`text-[9px] px-1.5 py-0.5 rounded ${obj.progreso >= v ? 'bg-[var(--ar-accent)] text-white' : 'bg-[#f0f0f0] text-[var(--ar-muted)] hover:bg-[#e0e0e0]'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {objetivos.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[13px] text-[var(--ar-muted)]">No hay objetivos definidos aún</p>
          <button onClick={onAddClick} className="btn-accent mt-3 text-[12px]"><i className="ti ti-plus" aria-hidden="true"/> Crear objetivo</button>
        </div>
      )}
    </div>
  )
}

// ─── TAB: SESIONES ───
function TabSesiones({ sesiones, onAddClick }: { sesiones: Sesion[]; onAddClick: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[var(--ar-text)]">Sesiones terapéuticas</h3>
        <button onClick={onAddClick} className="btn-primary text-[11px] py-1.5 px-3">
          <i className="ti ti-plus text-[12px]" aria-hidden="true"/> Registrar sesión
        </button>
      </div>
      {sesiones.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[13px] text-[var(--ar-muted)]">No hay sesiones registradas</p>
          <button onClick={onAddClick} className="btn-accent mt-3 text-[12px]"><i className="ti ti-plus" aria-hidden="true"/> Primera sesión</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sesiones.map(s => (
            <div key={s.id} className={`card p-4 ${!s.asistio ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[var(--ar-text)]">
                    {new Date(s.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </span>
                  {s.hora_inicio && <span className="text-[10px] text-[var(--ar-muted)]">{s.hora_inicio.slice(0,5)}</span>}
                  {s.duracion_min && <span className="text-[10px] text-[var(--ar-muted)]">· {s.duracion_min} min</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag tag-blue">{s.tipo_sesion}</span>
                  {!s.asistio && <span className="tag tag-mora">Inasistencia</span>}
                </div>
              </div>
              <div className="text-[11px] text-[var(--ar-muted)] mb-1">
                <i className="ti ti-user text-[10px]" aria-hidden="true"/> {s.profesional.nombre} {s.profesional.apellido}
              </div>
              {s.actividades && <p className="text-[12px] text-[var(--ar-text)] mt-2">{s.actividades}</p>}
              {s.logros && <p className="text-[11px] text-[#4A9E7A] mt-1"><i className="ti ti-check text-[10px]" aria-hidden="true"/> {s.logros}</p>}
              {(s.estado_ingreso || s.estado_egreso) && (
                <div className="flex gap-4 mt-2 text-[10px]">
                  {s.estado_ingreso && <span className="text-[var(--ar-muted)]">Ingreso: <strong>{s.estado_ingreso.replace('_', ' ')}</strong></span>}
                  {s.estado_egreso && <span className="text-[var(--ar-muted)]">Egreso: <strong>{s.estado_egreso.replace('_', ' ')}</strong></span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB: BITÁCORA ───
function TabBitacora({ entries, onAddClick }: { entries: BitacoraEntry[]; onAddClick: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[var(--ar-text)]">Bitácora conductual</h3>
        <button onClick={onAddClick} className="btn-primary text-[11px] py-1.5 px-3">
          <i className="ti ti-plus text-[12px]" aria-hidden="true"/> Registrar
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[13px] text-[var(--ar-muted)]">Sin registros en bitácora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="card p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                e.tipo === 'logro' ? 'bg-emerald-50 text-emerald-600' :
                e.tipo === 'conducta_desafiante' || e.tipo === 'desregulacion' ? 'bg-red-50 text-red-600' :
                'bg-[#f3f0f9] text-[#5B3E9E]'
              }`}>
                <i className={`ti ${TIPO_BITACORA_ICONS[e.tipo] || 'ti-note'} text-[14px]`} aria-hidden="true"/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-[var(--ar-text)] capitalize">{e.tipo.replace(/_/g, ' ')}</span>
                  {e.intensidad && (
                    <span className={`text-[9px] font-bold px-1.5 rounded ${e.intensidad >= 4 ? 'bg-red-100 text-red-700' : e.intensidad >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      Int. {e.intensidad}/5
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--ar-muted)] ml-auto">
                    {new Date(e.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    {e.hora && ` · ${e.hora.slice(0,5)}`}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--ar-text)]">{e.descripcion}</p>
                {e.estrategia && <p className="text-[10px] text-[var(--ar-muted)] mt-1">Estrategia: {e.estrategia} {e.resultado && `(${e.resultado})`}</p>}
                <div className="text-[10px] text-[var(--ar-muted)] mt-1">{e.registrado.nombre} {e.registrado.apellido}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB: EVOLUCIONES ───
function TabEvoluciones({ items }: { items: any[] }) {
  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[var(--ar-text)] mb-4">Informes de evolución</h3>
      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[13px] text-[var(--ar-muted)]">No hay informes de evolución</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ev: any) => (
            <div key={ev.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[13px] font-semibold text-[var(--ar-text)]">{ev.periodo}</span>
                  <span className="text-[11px] text-[var(--ar-muted)] ml-2">
                    {new Date(ev.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {ev.valoracion && (
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(v => (
                      <span key={v} className={`text-[12px] ${v <= ev.valoracion ? 'text-amber-400' : 'text-[#e0e0e0]'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[12px] text-[var(--ar-text)] leading-relaxed">{ev.resumen}</p>
              {ev.avances && <p className="text-[11px] text-[#4A9E7A] mt-2"><strong>Avances:</strong> {ev.avances}</p>}
              {ev.recomendaciones && <p className="text-[11px] text-[var(--ar-muted)] mt-1"><strong>Recomendaciones:</strong> {ev.recomendaciones}</p>}
              <div className="text-[10px] text-[var(--ar-muted)] mt-3">{ev.profesional.nombre} {ev.profesional.apellido}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB: EQUIPO ───
function TabEquipo({ equipo }: { equipo: any[] }) {
  const ESPECIALIDAD_LABELS: Record<string, string> = {
    educadora_diferencial: 'Educadora Diferencial', fonoaudiologa: 'Fonoaudióloga',
    terapeuta_ocupacional: 'Terapeuta Ocupacional', psicologa: 'Psicóloga',
    psicopedagoga: 'Psicopedagoga', 'kinesióloga': 'Kinesióloga',
    trabajadora_social: 'Trabajadora Social', neurologo: 'Neurólogo',
    psiquiatra: 'Psiquiatra', tecnico_parvularia: 'Técnica en Párvulos', otro: 'Otro',
  }

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[var(--ar-text)] mb-4">Equipo terapéutico</h3>
      {equipo.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[13px] text-[var(--ar-muted)]">No hay profesionales asignados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipo.map((m: any) => (
            <div key={m.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f3f0f9] flex items-center justify-center text-[#5B3E9E] text-[12px] font-bold">
                {m.profesional.nombre[0]}{m.profesional.apellido[0]}
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-[var(--ar-text)]">{m.profesional.nombre} {m.profesional.apellido}</div>
                <div className="text-[10px] text-[var(--ar-muted)]">{ESPECIALIDAD_LABELS[m.especialidad] || m.especialidad}</div>
              </div>
              <span className={`tag ${m.rol_equipo === 'coordinador' ? 'tag-blue' : 'tag-gray'}`}>{m.rol_equipo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MODAL: NUEVO OBJETIVO ───
function ModalObjetivo({ planId, onClose }: { planId: string; onClose: () => void }) {
  const [form, setForm] = useState({ area: 'comunicacion', descripcion: '', indicadores: '', estrategias: '', prioridad: 2 })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/intervencion/objetivos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, ...form }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Objetivo creado')
      onClose()
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Nuevo objetivo terapéutico</h3>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Área *</label>
              <select value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="select-base w-full text-[12px]">
                {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({...form, prioridad: parseInt(e.target.value)})} className="select-base w-full text-[12px]">
                <option value={1}>Alta</option><option value={2}>Media</option><option value={3}>Baja</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Descripción del objetivo *</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="input-base min-h-[60px] text-[12px]" placeholder="Ej: Lograr contacto visual sostenido por 5 segundos ante solicitud verbal" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Indicadores de logro</label>
            <textarea value={form.indicadores} onChange={e => setForm({...form, indicadores: e.target.value})} className="input-base min-h-[40px] text-[12px]" placeholder="Conductas observables que indican logro..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Estrategias</label>
            <textarea value={form.estrategias} onChange={e => setForm({...form, estrategias: e.target.value})} className="input-base min-h-[40px] text-[12px]" placeholder="Metodologías y estrategias a implementar..." />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Guardando...' : 'Crear objetivo'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL: BITÁCORA RÁPIDA ───
function ModalBitacora({ planId, onClose }: { planId: string; onClose: () => void }) {
  const [form, setForm] = useState({ tipo: 'logro', descripcion: '', antecedente: '', consecuencia: '', intensidad: 2, estrategia: '', resultado: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/intervencion/bitacora', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, ...form, intensidad: form.intensidad || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Registro guardado')
      onClose()
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Registro en bitácora</h3>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select-base w-full text-[12px]">
                <option value="logro">Logro</option>
                <option value="conducta_desafiante">Conducta desafiante</option>
                <option value="desregulacion">Desregulación</option>
                <option value="interaccion_social">Interacción social</option>
                <option value="autonomia">Autonomía</option>
                <option value="comunicacion">Comunicación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Intensidad</label>
              <select value={form.intensidad} onChange={e => setForm({...form, intensidad: parseInt(e.target.value)})} className="select-base w-full text-[12px]">
                <option value={1}>1 - Muy leve</option><option value={2}>2 - Leve</option>
                <option value={3}>3 - Moderada</option><option value={4}>4 - Alta</option><option value={5}>5 - Severa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Descripción *</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="input-base min-h-[60px] text-[12px]" placeholder="¿Qué ocurrió?" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Antecedente (qué pasó antes)</label>
            <input value={form.antecedente} onChange={e => setForm({...form, antecedente: e.target.value})} className="input-base text-[12px]" placeholder="Contexto previo al evento..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Estrategia aplicada</label>
            <input value={form.estrategia} onChange={e => setForm({...form, estrategia: e.target.value})} className="input-base text-[12px]" placeholder="¿Qué se hizo?" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
