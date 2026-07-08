'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Bloque {
  id: string
  dia: number
  hora_inicio: string
  hora_fin: string
  materia: string
  profesor?: string
  sala?: string
  color?: string
}

interface Props {
  horarios: Bloque[]
  cursos: string[]
  cursoInicial: string
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const HORAS = ['08:00','08:45','09:30','10:15','11:00','11:45','12:30','13:15','14:00','14:45','15:30','16:15']

const COLORES = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4','#84cc16']

export default function HorarioClient({ horarios: inicial, cursos, cursoInicial }: Props) {
  const [curso, setCurso] = useState(cursoInicial)
  const [horarios, setHorarios] = useState<Bloque[]>(inicial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ dia: 1, hora_inicio: '08:00', hora_fin: '08:45', materia: '', profesor: '', sala: '', color: '#3b82f6' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function cambiarCurso(nuevoCurso: string) {
    setCurso(nuevoCurso)
    const res = await fetch(`/api/horarios?curso=${encodeURIComponent(nuevoCurso)}`)
    const data = await res.json()
    setHorarios(data)
  }

  async function agregarBloque() {
    if (!form.materia) { toast.error('Ingresa la materia'); return }
    setLoading(true)
    const res = await fetch('/api/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, curso }),
    })
    if (res.ok) {
      const nuevo = await res.json()
      setHorarios(prev => [...prev, nuevo])
      setShowForm(false)
      setForm({ dia: 1, hora_inicio: '08:00', hora_fin: '08:45', materia: '', profesor: '', sala: '', color: '#3b82f6' })
      toast.success('Bloque agregado')
    } else {
      toast.error('Error al agregar')
    }
    setLoading(false)
  }

  async function eliminarBloque(id: string) {
    const res = await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setHorarios(prev => prev.filter(h => h.id !== id))
      toast.success('Bloque eliminado')
    }
  }

  function getBloquesParaDiaHora(dia: number, hora: string) {
    return horarios.filter(h => h.dia === dia && h.hora_inicio === hora)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Horarios</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Horario semanal por curso</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={curso} onChange={e => cambiarCurso(e.target.value)} className="select-base">
            {cursos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <i className="ti ti-plus text-sm" aria-hidden="true"/> Agregar
          </button>
        </div>
      </div>

      {/* Grilla semanal */}
      <div className="bg-white border border-[var(--ar-border)] rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 text-center">
          <div className="p-3 bg-[#f7f8fa] border-b border-r border-[var(--ar-border)] text-[11px] font-semibold text-[#6b7280] uppercase">Hora</div>
          {DIAS.map((d, i) => (
            <div key={d} className="p-3 bg-[#f7f8fa] border-b border-r border-[var(--ar-border)] text-[11px] font-semibold text-[#6b7280] uppercase">{d}</div>
          ))}
        </div>
        {HORAS.map(hora => (
          <div key={hora} className="grid grid-cols-6 min-h-[52px]">
            <div className="p-2 border-b border-r border-[#f3f4f6] text-[11px] text-[#9ca3af] font-mono flex items-center justify-center">{hora}</div>
            {[1,2,3,4,5].map(dia => {
              const bloques = getBloquesParaDiaHora(dia, hora)
              return (
                <div key={dia} className="p-1 border-b border-r border-[#f3f4f6] flex flex-col gap-1">
                  {bloques.map(b => (
                    <div key={b.id} className="relative group px-2 py-1.5 rounded text-[10px] text-white font-medium leading-tight" style={{ backgroundColor: b.color || '#3b82f6' }}>
                      <div className="font-semibold">{b.materia}</div>
                      {b.profesor && <div className="opacity-80">{b.profesor}</div>}
                      {b.sala && <div className="opacity-60">{b.sala}</div>}
                      <button onClick={() => eliminarBloque(b.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white transition-opacity">
                        <i className="ti ti-x text-[10px]" aria-hidden="true"/>
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Modal agregar */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
              <h3 className="font-semibold text-[#1a2332]">Agregar bloque — {curso}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#9ca3af] hover:text-[#1a2332]"><i className="ti ti-x" aria-hidden="true"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Día</label>
                  <select value={form.dia} onChange={e => setForm(p => ({...p, dia: Number(e.target.value)}))} className="select-base w-full">
                    {DIAS.map((d, i) => <option key={i} value={i+1}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Materia *</label>
                  <input value={form.materia} onChange={e => setForm(p => ({...p, materia: e.target.value}))} className="input-base" placeholder="Matemáticas"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Hora inicio</label>
                  <select value={form.hora_inicio} onChange={e => setForm(p => ({...p, hora_inicio: e.target.value}))} className="select-base w-full">
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Hora fin</label>
                  <select value={form.hora_fin} onChange={e => setForm(p => ({...p, hora_fin: e.target.value}))} className="select-base w-full">
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Profesor</label>
                  <input value={form.profesor} onChange={e => setForm(p => ({...p, profesor: e.target.value}))} className="input-base" placeholder="Opcional"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Sala</label>
                  <input value={form.sala} onChange={e => setForm(p => ({...p, sala: e.target.value}))} className="input-base" placeholder="Opcional"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORES.map(c => (
                    <button key={c} onClick={() => setForm(p => ({...p, color: c}))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-[#1a2332] scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}/>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={agregarBloque} disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
