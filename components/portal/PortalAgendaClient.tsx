'use client'

import { useState } from 'react'

interface Sesion {
  id: string; fecha: string; hora_inicio: string; hora_fin: string
  tipo_sesion: string; modalidad: string; estado: string
  alumno: { id: string; nombre: string; apellido: string; curso?: string }
  profesional: { id: string; nombre: string; apellido: string }
}

interface Props {
  proximas: Sesion[]
  pasadas: Sesion[]
}

export default function PortalAgendaClient({ proximas, pasadas }: Props) {
  const [tab, setTab] = useState<'proximas' | 'historial'>('proximas')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Sesiones programadas
        </h1>
        <p className="text-[13px] text-slate-400 mt-1">Próximas citas terapéuticas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('proximas')}
          className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
            tab === 'proximas' ? 'border-[#3b6ea5] text-slate-800' : 'border-transparent text-slate-400'
          }`}
        >
          Próximas ({proximas.length})
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
            tab === 'historial' ? 'border-[#3b6ea5] text-slate-800' : 'border-transparent text-slate-400'
          }`}
        >
          Historial
        </button>
      </div>

      {tab === 'proximas' && (
        proximas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <i className="ti ti-calendar-event text-xl text-slate-300" aria-hidden="true"/>
            </div>
            <p className="text-[13px] text-slate-400">No hay sesiones programadas próximamente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximas.map(s => (
              <SesionCard key={s.id} sesion={s} />
            ))}
          </div>
        )
      )}

      {tab === 'historial' && (
        pasadas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[13px] text-slate-400">Sin sesiones anteriores.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pasadas.map(s => (
              <div key={s.id} className={`bg-white border border-slate-200 rounded-xl p-4 ${s.estado === 'no_asistio' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-slate-600">
                      {new Date(s.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-slate-400">{s.hora_inicio.slice(0,5)} - {s.hora_fin.slice(0,5)}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    s.estado === 'completada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {s.estado === 'completada' ? 'Completada' : 'No asistió'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{s.profesional.nombre} {s.profesional.apellido} · {s.tipo_sesion}</div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function SesionCard({ sesion: s }: { sesion: Sesion }) {
  const fecha = new Date(s.fecha + 'T12:00')
  const isThisWeek = (() => {
    const now = new Date()
    const diff = (fecha.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && diff >= 0
  })()

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all ${isThisWeek ? 'border-[#3b6ea5]/30 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Date badge */}
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isThisWeek ? 'bg-[#0d1b2a] text-white' : 'bg-slate-100 text-slate-700'}`}>
            <span className="text-[10px] font-medium uppercase leading-none">
              {fecha.toLocaleDateString('es-CL', { weekday: 'short' })}
            </span>
            <span className="text-[20px] font-bold leading-none mt-0.5">{fecha.getDate()}</span>
            <span className="text-[9px] opacity-60 leading-none mt-0.5">
              {fecha.toLocaleDateString('es-CL', { month: 'short' })}
            </span>
          </div>
          <div>
            <div className="text-[14px] font-semibold text-slate-800">
              {s.hora_inicio.slice(0,5)} — {s.hora_fin.slice(0,5)}
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {s.profesional.nombre} {s.profesional.apellido}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium capitalize">{s.tipo_sesion}</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded capitalize">{s.modalidad}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${
          s.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {s.estado === 'confirmada' ? 'Confirmada' : 'Programada'}
        </span>
      </div>
    </div>
  )
}
