'use client'

import { useState } from 'react'

interface Bloque {
  id: string; alumno_id: string; dia_semana: number
  hora_inicio: string; hora_fin: string; tipo: string
  asignatura: string; sala: string | null
  profesional: { nombre: string; apellido: string } | null
}

interface Props {
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  bloques: Bloque[]
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const COLOR_PED = '#3b6ea5'
const COLOR_TER = '#5B3E9E'

export default function PortalHorarioClient({ alumnos, bloques }: Props) {
  const [alumnoId, setAlumnoId] = useState(alumnos[0]?.id ?? '')
  const bloquesAlumno = bloques.filter(b => b.alumno_id === alumnoId)
  const alumno = alumnos.find(a => a.id === alumnoId)

  // Get unique hours from bloques
  const horas = [...new Set(bloquesAlumno.flatMap(b => [b.hora_inicio, b.hora_fin]))].sort()
  const horaInicio = horas[0] || '08:00'
  const horaFin = horas[horas.length - 1] || '17:00'

  // Generate hour slots
  const slots: string[] = []
  let current = horaInicio
  while (current < horaFin) {
    slots.push(current)
    const [h, m] = current.split(':').map(Number)
    const next = m === 30 ? `${String(h + 1).padStart(2, '0')}:00` : `${String(h).padStart(2, '0')}:30`
    current = next
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk' }}>Horario semanal</h1>
          {alumno && <p className="text-[13px] text-slate-400 mt-1">{alumno.nombre} {alumno.apellido} · {alumno.curso}</p>}
        </div>
        <div className="flex items-center gap-3">
          {alumnos.length > 1 && (
            <select value={alumnoId} onChange={e => setAlumnoId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] bg-white">
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
            </select>
          )}
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
            Imprimir
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: COLOR_PED }}/><span className="text-[11px] text-slate-600">Pedagógico</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: COLOR_TER }}/><span className="text-[11px] text-slate-600">Terapéutico</span></div>
      </div>

      {bloquesAlumno.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-[13px] text-slate-400">El horario aún no ha sido configurado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="w-16 px-3 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase bg-slate-50 border-b border-slate-200">Hora</th>
                  {DIAS.map(dia => (
                    <th key={dia} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-400 uppercase bg-slate-50 border-b border-l border-slate-200">{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((hora, hi) => (
                  <tr key={hora} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-[10px] text-slate-400 font-medium border-r border-slate-100 bg-slate-50/30">{hora}</td>
                    {DIAS.map((_, di) => {
                      const dia = di + 1
                      const bloque = bloquesAlumno.find(b => b.dia_semana === dia && b.hora_inicio <= hora && b.hora_fin > hora)

                      if (bloque) {
                        const startIdx = slots.indexOf(bloque.hora_inicio)
                        if (startIdx !== hi) return <td key={`${dia}-${hora}`} className="border-l border-slate-100" />

                        const endIdx = slots.indexOf(bloque.hora_fin)
                        const span = endIdx - startIdx
                        const bg = bloque.tipo === 'terapeutico' ? COLOR_TER : COLOR_PED

                        return (
                          <td key={`${dia}-${hora}`} rowSpan={span} className="border-l border-slate-100 p-1 align-top">
                            <div className="rounded-lg p-2 h-full text-white" style={{ background: bg }}>
                              <div className="text-[11px] font-bold">{bloque.asignatura}</div>
                              {bloque.profesional && <div className="text-[9px] opacity-75 mt-0.5">{bloque.profesional.nombre} {bloque.profesional.apellido[0]}.</div>}
                              {bloque.sala && <div className="text-[9px] opacity-60">{bloque.sala}</div>}
                              <div className="text-[9px] opacity-60">{bloque.hora_inicio.slice(0,5)}-{bloque.hora_fin.slice(0,5)}</div>
                            </div>
                          </td>
                        )
                      }

                      const consumed = bloquesAlumno.some(b => b.dia_semana === dia && b.hora_inicio < hora && b.hora_fin > hora)
                      if (consumed) return null
                      return <td key={`${dia}-${hora}`} className="border-l border-slate-100 h-8" />
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print footer */}
      <div className="hidden print:block mt-6 text-[10px] text-slate-400 text-center">
        Generado por Kiva360 · {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}
