'use client'

import { useState } from 'react'

interface Objetivo {
  id: string; area: string; descripcion: string; estado: string; progreso: number; prioridad: number
}
interface Sesion {
  id: string; fecha: string; tipo_sesion: string; duracion_min: number | null
  logros: string | null; indicaciones_familia: string | null
  profesional: { nombre: string; apellido: string }
}
interface Evolucion {
  id: string; periodo: string; fecha: string; resumen: string
  avances: string | null; recomendaciones: string | null; valoracion: number | null
  profesional: { nombre: string; apellido: string }
}
interface BitacoraEntry {
  id: string; fecha: string; tipo: string; descripcion: string
  registrado: { nombre: string; apellido: string }
}
interface Plan {
  id: string
  alumno: { id: string; nombre: string; apellido: string; curso: string }
  diagnostico: string | null; nivel_apoyo: string; estado: string
  objetivos: Objetivo[]
  equipo: { especialidad: string; profesional: { nombre: string; apellido: string } }[]
  sesiones: Sesion[]
  evoluciones: Evolucion[]
  bitacora: BitacoraEntry[]
}

interface Props { planes: Plan[] }

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

const TIPO_LABELS: Record<string, string> = {
  logro: 'Logro', conducta_desafiante: 'Conducta', desregulacion: 'Desregulación',
  interaccion_social: 'Interacción social', autonomia: 'Autonomía', comunicacion: 'Comunicación', otro: 'Otro',
}

const ESPECIALIDAD_LABELS: Record<string, string> = {
  educadora_diferencial: 'Ed. Diferencial', fonoaudiologa: 'Fonoaudióloga',
  terapeuta_ocupacional: 'Terapeuta Ocupacional', psicologa: 'Psicóloga',
  psicopedagoga: 'Psicopedagoga', 'kinesióloga': 'Kinesióloga',
  trabajadora_social: 'T. Social', tecnico_parvularia: 'Téc. Parvularia', otro: 'Otro',
}

type Tab = 'progreso' | 'sesiones' | 'evoluciones' | 'bitacora'

export default function PortalIntervencionClient({ planes }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<string>(planes[0]?.id ?? '')
  const [tab, setTab] = useState<Tab>('progreso')

  const plan = planes.find(p => p.id === selectedPlan)

  if (!planes.length) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f3f0f9] flex items-center justify-center">
          <i className="ti ti-heart-handshake text-2xl text-[#5B3E9E]" aria-hidden="true"/>
        </div>
        <h2 className="text-[16px] font-bold text-slate-800 mb-2">Sin plan de intervención activo</h2>
        <p className="text-[13px] text-slate-400">Cuando el equipo terapéutico active un plan, podrás ver los avances aquí.</p>
      </div>
    )
  }

  if (!plan) return null

  const objetivos = plan.objetivos ?? []
  const progresoGlobal = objetivos.length > 0
    ? Math.round(objetivos.reduce((a, o) => a + o.progreso, 0) / objetivos.length)
    : 0
  const logrados = objetivos.filter(o => o.estado === 'logrado').length

  // Latest indicaciones from sessions
  const ultimaIndicacion = plan.sesiones.find(s => s.indicaciones_familia)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'progreso', label: 'Objetivos', icon: 'ti-target' },
    { key: 'sesiones', label: 'Sesiones', icon: 'ti-calendar-event' },
    { key: 'evoluciones', label: 'Informes', icon: 'ti-chart-line' },
    { key: 'bitacora', label: 'Bitácora', icon: 'ti-notebook' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Avances terapéuticos
        </h1>
        <p className="text-[13px] text-slate-400 mt-1">Seguimiento del plan de intervención</p>
      </div>

      {/* Plan selector if multiple */}
      {planes.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {planes.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlan(p.id); setTab('progreso') }}
              className={`shrink-0 px-4 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                selectedPlan === p.id
                  ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {p.alumno.nombre} {p.alumno.apellido}
            </button>
          ))}
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#3b6ea5] flex items-center justify-center text-white text-[14px] font-bold">
              {plan.alumno.nombre[0]}{plan.alumno.apellido[0]}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">{plan.alumno.nombre} {plan.alumno.apellido}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-400">{plan.alumno.curso}</span>
                {plan.diagnostico && (
                  <span className="text-[10px] font-medium text-[#5B3E9E] bg-[#f3f0f9] px-2 py-0.5 rounded">{plan.diagnostico}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Progreso global</div>
            <div className="text-[28px] font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{progresoGlobal}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progresoGlobal}%`,
              background: `linear-gradient(90deg, #3b6ea5 0%, #60a5fa 100%)`
            }}
          />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <div className="text-[18px] font-bold text-slate-800">{objetivos.length}</div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Objetivos</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50">
            <div className="text-[18px] font-bold text-emerald-700">{logrados}</div>
            <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Logrados</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <div className="text-[18px] font-bold text-blue-700">{plan.sesiones.length}</div>
            <div className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Sesiones</div>
          </div>
        </div>

        {/* Equipo */}
        {plan.equipo.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Equipo terapéutico</div>
            <div className="flex flex-wrap gap-2">
              {plan.equipo.map((e, i) => (
                <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {e.profesional.nombre} {e.profesional.apellido} · <span className="text-slate-400">{ESPECIALIDAD_LABELS[e.especialidad] || e.especialidad}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indicaciones para la familia (destacado) */}
      {ultimaIndicacion?.indicaciones_familia && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <i className="ti ti-home-heart text-amber-600 text-[16px]" aria-hidden="true"/>
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Para trabajar en casa</div>
            <p className="text-[12px] text-amber-900 leading-relaxed">{ultimaIndicacion.indicaciones_familia}</p>
            <p className="text-[10px] text-amber-600 mt-2">
              {ultimaIndicacion.profesional.nombre} {ultimaIndicacion.profesional.apellido} · {new Date(ultimaIndicacion.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.key
                ? 'border-[#3b6ea5] text-[#0d1b2a]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className={`ti ${t.icon} text-[14px]`} aria-hidden="true"/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'progreso' && <TabProgreso objetivos={objetivos} />}
      {tab === 'sesiones' && <TabSesiones sesiones={plan.sesiones} />}
      {tab === 'evoluciones' && <TabEvoluciones items={plan.evoluciones} />}
      {tab === 'bitacora' && <TabBitacora entries={plan.bitacora} />}
    </div>
  )
}

// ─── TAB: PROGRESO (Objetivos) ───
function TabProgreso({ objetivos }: { objetivos: Objetivo[] }) {
  const grouped = objetivos.reduce((acc, o) => {
    if (!acc[o.area]) acc[o.area] = []
    acc[o.area].push(o)
    return acc
  }, {} as Record<string, Objetivo[]>)

  if (objetivos.length === 0) {
    return <EmptyState icon="ti-target" text="Los objetivos terapéuticos aparecerán aquí cuando el equipo los defina." />
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([area, objs]) => (
        <div key={area}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: AREA_COLORS[area] || '#5C5470' }} />
            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
              {AREA_LABELS[area] || area}
            </span>
          </div>
          <div className="space-y-2.5">
            {objs.sort((a, b) => a.prioridad - b.prioridad).map(obj => (
              <div key={obj.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[13px] text-slate-800 leading-relaxed flex-1">{obj.descripcion}</p>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                    obj.estado === 'logrado' ? 'bg-emerald-100 text-emerald-700' :
                    obj.estado === 'en_progreso' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {obj.estado === 'logrado' ? 'Logrado' : obj.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${obj.progreso}%`, background: AREA_COLORS[area] || '#5C5470' }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 w-10 text-right">{obj.progreso}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TAB: SESIONES ───
function TabSesiones({ sesiones }: { sesiones: Sesion[] }) {
  if (sesiones.length === 0) {
    return <EmptyState icon="ti-calendar-event" text="Las sesiones terapéuticas aparecerán aquí a medida que se registren." />
  }

  return (
    <div className="space-y-3">
      {sesiones.map(s => (
        <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-800">
                {new Date(s.fecha + 'T12:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {s.duracion_min && <span className="text-[10px] text-slate-400">· {s.duracion_min} min</span>}
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium capitalize">{s.tipo_sesion}</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-2">
            {s.profesional.nombre} {s.profesional.apellido}
          </div>
          {s.logros && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-emerald-50/50">
              <i className="ti ti-check text-emerald-600 text-[12px] mt-0.5 shrink-0" aria-hidden="true"/>
              <p className="text-[12px] text-emerald-800 leading-relaxed">{s.logros}</p>
            </div>
          )}
          {s.indicaciones_familia && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-50/50">
              <i className="ti ti-home text-amber-600 text-[12px] mt-0.5 shrink-0" aria-hidden="true"/>
              <p className="text-[12px] text-amber-800 leading-relaxed">{s.indicaciones_familia}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── TAB: EVOLUCIONES ───
function TabEvoluciones({ items }: { items: Evolucion[] }) {
  if (items.length === 0) {
    return <EmptyState icon="ti-chart-line" text="Los informes de evolución que el equipo comparta contigo aparecerán aquí." />
  }

  return (
    <div className="space-y-4">
      {items.map(ev => (
        <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[14px] font-bold text-slate-800">{ev.periodo}</h3>
              <span className="text-[11px] text-slate-400">
                {new Date(ev.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}{ev.profesional.nombre} {ev.profesional.apellido}
              </span>
            </div>
            {ev.valoracion && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(v => (
                  <span key={v} className={`text-[14px] ${v <= ev.valoracion! ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
            )}
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed mb-3">{ev.resumen}</p>
          {ev.avances && (
            <div className="p-3 rounded-lg bg-emerald-50 mb-2">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Avances destacados</div>
              <p className="text-[12px] text-emerald-800 leading-relaxed">{ev.avances}</p>
            </div>
          )}
          {ev.recomendaciones && (
            <div className="p-3 rounded-lg bg-blue-50">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Recomendaciones</div>
              <p className="text-[12px] text-blue-800 leading-relaxed">{ev.recomendaciones}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── TAB: BITÁCORA ───
function TabBitacora({ entries }: { entries: BitacoraEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon="ti-notebook" text="Los registros de bitácora que el equipo comparta contigo aparecerán aquí." />
  }

  return (
    <div className="space-y-2.5">
      {entries.map(e => (
        <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            e.tipo === 'logro' ? 'bg-emerald-50 text-emerald-600' :
            e.tipo === 'conducta_desafiante' || e.tipo === 'desregulacion' ? 'bg-red-50 text-red-500' :
            'bg-blue-50 text-blue-600'
          }`}>
            <i className={`ti ${
              e.tipo === 'logro' ? 'ti-trophy' :
              e.tipo === 'conducta_desafiante' ? 'ti-alert-triangle' :
              e.tipo === 'desregulacion' ? 'ti-mood-sad' :
              e.tipo === 'interaccion_social' ? 'ti-users' :
              'ti-note'
            } text-[14px]`} aria-hidden="true"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-700">{TIPO_LABELS[e.tipo] || e.tipo}</span>
              <span className="text-[10px] text-slate-400">
                {new Date(e.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">{e.descripcion}</p>
            <p className="text-[10px] text-slate-400 mt-1">{e.registrado.nombre} {e.registrado.apellido}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── EMPTY STATE ───
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
        <i className={`ti ${icon} text-xl text-slate-300`} aria-hidden="true"/>
      </div>
      <p className="text-[13px] text-slate-400 max-w-xs mx-auto">{text}</p>
    </div>
  )
}
