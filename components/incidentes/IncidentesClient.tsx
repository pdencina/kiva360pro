'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Acta { id: string; tipo: string; titulo: string; descripcion: string; fecha_evento: string; estado: string; gravedad?: string; firmada_por?: string; alumno: { id: string; nombre: string; apellido: string; curso: string }; creador: { nombre: string; apellido: string } }
interface Props { actas: Acta[]; alumnos: { id: string; nombre: string; apellido: string; curso: string }[] }

const TIPOS = [
  { key: 'accidente', label: 'Accidente', color: 'bg-red-100 text-red-700' },
  { key: 'epilepsia', label: 'Epilepsia', color: 'bg-purple-100 text-purple-700' },
  { key: 'incidente_entre_ninos', label: 'Entre niños', color: 'bg-orange-100 text-orange-700' },
  { key: 'emergencia_medica', label: 'Emergencia', color: 'bg-rose-100 text-rose-700' },
  { key: 'conducta', label: 'Conducta', color: 'bg-amber-100 text-amber-700' },
  { key: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-700' },
]

export default function IncidentesClient({ actas: initial, alumnos }: Props) {
  const [actas, setActas] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ alumno_id: '', tipo: 'accidente', titulo: '', descripcion: '', fecha_evento: new Date().toISOString().split('T')[0], antecedente: '', medidas: '', compromisos: '', gravedad: 'media' })

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/actas-conducta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      const nueva = await res.json()
      setActas(prev => [nueva, ...prev])
      setShowForm(false)
      setForm({ alumno_id: '', tipo: 'accidente', titulo: '', descripcion: '', fecha_evento: new Date().toISOString().split('T')[0], antecedente: '', medidas: '', compromisos: '', gravedad: 'media' })
      toast.success('Reporte creado')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function enviar(id: string) {
    try {
      const res = await fetch('/api/actas-conducta', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, accion: 'enviar' }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setActas(prev => prev.map(a => a.id === id ? { ...a, estado: 'enviada' } : a))
      toast.success(`Enviado a ${data.email_enviado}`)
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Reportes de Incidentes</h1>
          <p className="page-subtitle">{actas.length} registros · Firma digital obligatoria</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-[12px]"><i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nuevo reporte</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-[14px] font-bold text-[var(--ar-text)] mb-4">Nuevo reporte de incidente</h3>
          <form onSubmit={crear} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Alumno *</label><select value={form.alumno_id} onChange={e => setForm({...form, alumno_id: e.target.value})} required className="select-base w-full text-[12px]"><option value="">Seleccionar...</option>{alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido} — {a.curso}</option>)}</select></div>
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Tipo *</label><select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select-base w-full text-[12px]">{TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Gravedad</label><select value={form.gravedad} onChange={e => setForm({...form, gravedad: e.target.value})} className="select-base w-full text-[12px]"><option value="leve">Leve</option><option value="media">Media</option><option value="grave">Grave</option><option value="critica">Crítica</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Título *</label><input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required className="input-base text-[12px]" placeholder="Ej: Caída en patio"/></div>
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Fecha</label><input type="date" value={form.fecha_evento} onChange={e => setForm({...form, fecha_evento: e.target.value})} className="input-base text-[12px]"/></div>
            </div>
            <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Descripción *</label><textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} required rows={3} className="input-base text-[12px] w-full resize-y" placeholder="Describa lo ocurrido..."/></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Antecedente</label><textarea value={form.antecedente} onChange={e => setForm({...form, antecedente: e.target.value})} rows={2} className="input-base text-[12px] w-full resize-y" placeholder="Qué pasó antes..."/></div>
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Medidas</label><textarea value={form.medidas} onChange={e => setForm({...form, medidas: e.target.value})} rows={2} className="input-base text-[12px] w-full resize-y" placeholder="Qué se hizo..."/></div>
              <div><label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Compromisos</label><textarea value={form.compromisos} onChange={e => setForm({...form, compromisos: e.target.value})} rows={2} className="input-base text-[12px] w-full resize-y" placeholder="Acuerdos..."/></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Guardando...' : 'Crear reporte'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-[12px]">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead><tr className="bg-[#f9f7f5] border-b border-[var(--ar-border)]"><th className="text-left px-4 py-3 font-semibold text-[var(--ar-muted)]">Alumno</th><th className="text-left px-4 py-3 font-semibold text-[var(--ar-muted)]">Tipo</th><th className="text-left px-4 py-3 font-semibold text-[var(--ar-muted)]">Título</th><th className="text-center px-4 py-3 font-semibold text-[var(--ar-muted)]">Fecha</th><th className="text-center px-4 py-3 font-semibold text-[var(--ar-muted)]">Estado</th><th className="text-right px-4 py-3 font-semibold text-[var(--ar-muted)]">Acciones</th></tr></thead>
          <tbody>
            {actas.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ar-muted)]">Sin reportes</td></tr> : actas.map(a => {
              const tipoInfo = TIPOS.find(t => t.key === a.tipo) || TIPOS[5]
              return (
                <tr key={a.id} className="border-b border-[var(--ar-border)] hover:bg-[#faf9f7]">
                  <td className="px-4 py-3 font-medium">{a.alumno?.nombre} {a.alumno?.apellido}<br/><span className="text-[10px] text-[var(--ar-muted)]">{a.alumno?.curso}</span></td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipoInfo.color}`}>{tipoInfo.label}</span></td>
                  <td className="px-4 py-3">{a.titulo}</td>
                  <td className="px-4 py-3 text-center">{new Date(a.fecha_evento).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.estado === 'firmada' ? 'bg-emerald-100 text-emerald-700' : a.estado === 'enviada' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{a.estado === 'firmada' ? 'Firmada' : a.estado === 'enviada' ? 'Enviada' : 'Borrador'}</span></td>
                  <td className="px-4 py-3 text-right">{a.estado === 'borrador' && <button onClick={() => enviar(a.id)} className="text-[10px] text-emerald-600 font-medium hover:underline">Enviar</button>}{a.estado === 'firmada' && <span className="text-[10px] text-emerald-600">✓ {a.firmada_por}</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
