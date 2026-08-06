'use client'

import { useState } from 'react'

interface Informe {
  id: string; titulo: string; tipo: string; especialidad: string | null
  contenido: string | null; archivo_url: string | null; fecha: string
  periodo: string | null; profesional: { nombre: string; apellido: string }
  alumno: { id: string; nombre: string; apellido: string }
}

interface Documento {
  id: string; nombre: string; tipo: string; archivo_url: string
  created_at: string; alumno: { id: string; nombre: string; apellido: string }
}

interface Props {
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  informes: Informe[]
  documentos: Documento[]
}

const ESPECIALIDAD_COLORS: Record<string, string> = {
  fonoaudiologa: '#5B3E9E', terapeuta_ocupacional: '#E85D3A',
  psicologa: '#3D7A94', psicopedagoga: '#4A9E7A',
  'kinesióloga': '#B86E00', educadora_diferencial: '#2D1B69',
}

const ESPECIALIDAD_LABELS: Record<string, string> = {
  fonoaudiologa: 'Fonoaudiología', terapeuta_ocupacional: 'Terapia Ocupacional',
  psicologa: 'Psicología', psicopedagoga: 'Psicopedagogía',
  'kinesióloga': 'Kinesiología', educadora_diferencial: 'Ed. Diferencial',
}

const TIPO_LABELS: Record<string, string> = {
  ingreso: 'Ingreso', periodico: 'Periódico', avance: 'Avance',
  alta: 'Alta', derivacion: 'Derivación', otro: 'Otro',
}

export default function PortalInformesClient({ alumnos, informes, documentos }: Props) {
  const [tab, setTab] = useState<'informes' | 'documentos'>('informes')
  const [filtroAlumno, setFiltroAlumno] = useState<string>('')

  const informesFiltrados = filtroAlumno ? informes.filter(i => i.alumno.id === filtroAlumno) : informes
  const documentosFiltrados = filtroAlumno ? documentos.filter(d => d.alumno.id === filtroAlumno) : documentos

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Informes y documentos
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">Informes terapéuticos y documentos compartidos por el equipo</p>
        </div>
        {alumnos.length > 1 && (
          <select
            value={filtroAlumno}
            onChange={e => setFiltroAlumno(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] bg-white"
          >
            <option value="">Todos los hijos</option>
            {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('informes')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
            tab === 'informes' ? 'border-[#5B3E9E] text-slate-800' : 'border-transparent text-slate-400'
          }`}
        >
          <i className="ti ti-file-report text-[14px]" aria-hidden="true"/>
          Informes terapéuticos ({informesFiltrados.length})
        </button>
        <button
          onClick={() => setTab('documentos')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
            tab === 'documentos' ? 'border-[#3b6ea5] text-slate-800' : 'border-transparent text-slate-400'
          }`}
        >
          <i className="ti ti-folder text-[14px]" aria-hidden="true"/>
          Documentos ({documentosFiltrados.length})
        </button>
      </div>

      {/* Informes */}
      {tab === 'informes' && (
        informesFiltrados.length === 0 ? (
          <EmptyState
            icon="ti-file-report"
            text="Los informes terapéuticos que el equipo comparta contigo aparecerán aquí. Podrás descargarlos en cualquier momento."
          />
        ) : (
          <div className="space-y-4">
            {informesFiltrados.map(inf => (
              <div
                key={inf.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: ESPECIALIDAD_COLORS[inf.especialidad || ''] || '#5C5470' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Title row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="text-[14px] font-bold text-slate-800">{inf.titulo}</h3>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#f3f0f9] text-[#5B3E9E]">
                        {TIPO_LABELS[inf.tipo] || inf.tipo}
                      </span>
                      {inf.especialidad && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {ESPECIALIDAD_LABELS[inf.especialidad] || inf.especialidad}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] text-slate-400 mb-3">
                      {inf.profesional.nombre} {inf.profesional.apellido}
                      {' · '}
                      {new Date(inf.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {inf.periodo && ` · ${inf.periodo}`}
                      {alumnos.length > 1 && <span className="ml-2 text-slate-300">({inf.alumno.nombre})</span>}
                    </div>

                    {/* Content preview */}
                    {inf.contenido && (
                      <div className="bg-slate-50 rounded-xl p-4 text-[12px] text-slate-600 leading-relaxed">
                        {inf.contenido.length > 400 ? inf.contenido.slice(0, 400) + '...' : inf.contenido}
                      </div>
                    )}
                  </div>

                  {/* Download button */}
                  {inf.archivo_url && (
                    <a
                      href={inf.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1b2a] text-white text-[12px] font-semibold hover:bg-[#1a2d47] transition-all active:scale-[0.97]"
                    >
                      <i className="ti ti-download text-[14px]" aria-hidden="true"/>
                      Descargar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Documentos */}
      {tab === 'documentos' && (
        documentosFiltrados.length === 0 ? (
          <EmptyState
            icon="ti-folder"
            text="Los documentos que el centro comparta contigo aparecerán aquí."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documentosFiltrados.map(doc => (
              <a
                key={doc.id}
                href={doc.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm hover:border-slate-300 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <i className="ti ti-file-filled text-blue-500 text-[18px]" aria-hidden="true"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800 truncate">{doc.nombre}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(doc.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {alumnos.length > 1 && ` · ${doc.alumno.nombre}`}
                  </div>
                </div>
                <i className="ti ti-download text-slate-300 group-hover:text-slate-500 transition-colors" aria-hidden="true"/>
              </a>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <i className={`ti ${icon} text-2xl text-slate-300`} aria-hidden="true"/>
      </div>
      <p className="text-[13px] text-slate-400 max-w-sm mx-auto leading-relaxed">{text}</p>
    </div>
  )
}
