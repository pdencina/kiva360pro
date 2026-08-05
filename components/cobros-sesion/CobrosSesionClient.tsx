'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Cobro {
  id: string; fecha_sesion: string; descripcion: string
  monto: number; descuento: number; monto_final: number; estado: string
  fecha_pago: string | null; medio_pago: string | null
  alumno: { id: string; nombre: string; apellido: string; curso: string }
  profesional: { id: string; nombre: string; apellido: string }
  tarifa: { id: string; nombre: string } | null
}

interface Tarifa {
  id: string; nombre: string; especialidad: string | null
  tipo_sesion: string; duracion_min: number; monto: number
}

interface Props {
  cobros: Cobro[]
  tarifas: Tarifa[]
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  profesionales: { id: string; nombre: string; apellido: string }[]
}

const ESTADO_LABELS: Record<string, { label: string; class: string }> = {
  pendiente: { label: 'Pendiente', class: 'tag-pend' },
  pagado: { label: 'Pagado', class: 'tag-ok' },
  parcial: { label: 'Parcial', class: 'tag-par' },
  anulado: { label: 'Anulado', class: 'tag-gray' },
  condonado: { label: 'Condonado', class: 'tag-blue' },
}

export default function CobrosSesionClient({ cobros, tarifas, alumnos, profesionales }: Props) {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showCobro, setShowCobro] = useState(false)
  const [showTarifa, setShowTarifa] = useState(false)

  const filtrados = filtroEstado === 'todos' ? cobros : cobros.filter(c => c.estado === filtroEstado)

  // KPIs
  const totalPendiente = cobros.filter(c => c.estado === 'pendiente').reduce((a, c) => a + c.monto_final, 0)
  const totalRecaudado = cobros.filter(c => c.estado === 'pagado').reduce((a, c) => a + c.monto_final, 0)
  const totalSesiones = cobros.length

  async function marcarPagado(id: string) {
    const res = await fetch('/api/cobros-sesion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: 'pagado', medio_pago: 'transferencia' }),
    })
    if (res.ok) { toast.success('Marcado como pagado'); window.location.reload() }
    else toast.error('Error al actualizar')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cobros por sesión</h1>
          <p className="page-subtitle">Facturación de sesiones terapéuticas individuales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTarifa(true)} className="btn-secondary">
            <i className="ti ti-receipt text-[14px]" aria-hidden="true"/> Tarifas
          </button>
          <button onClick={() => setShowCobro(true)} className="btn-primary">
            <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nuevo cobro
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-label">Pendiente de cobro</div>
          <div className="kpi-value text-amber-600">${totalPendiente.toLocaleString('es-CL')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Recaudado</div>
          <div className="kpi-value text-emerald-600">${totalRecaudado.toLocaleString('es-CL')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Sesiones facturadas</div>
          <div className="kpi-value">{totalSesiones}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {['todos', 'pendiente', 'pagado', 'anulado'].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize border transition-all ${
              filtroEstado === e ? 'bg-[var(--ar-navy)] text-white border-[var(--ar-navy)]' : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'
            }`}
          >{e}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-head">
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Profesional</th>
              <th>Descripción</th>
              <th className="text-right">Monto</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[13px] text-[var(--ar-muted)]">Sin cobros</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} className="table-row">
                <td className="text-[12px]">{new Date(c.fecha_sesion + 'T12:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</td>
                <td className="text-[12px] font-medium">{c.alumno.nombre} {c.alumno.apellido}</td>
                <td className="text-[12px] text-[var(--ar-muted)]">{c.profesional.nombre} {c.profesional.apellido[0]}.</td>
                <td className="text-[12px]">{c.descripcion}</td>
                <td className="text-[12px] font-semibold text-right">
                  ${c.monto_final.toLocaleString('es-CL')}
                  {c.descuento > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-${c.descuento.toLocaleString('es-CL')})</span>}
                </td>
                <td><span className={`tag ${ESTADO_LABELS[c.estado]?.class ?? 'tag-gray'}`}>{ESTADO_LABELS[c.estado]?.label ?? c.estado}</span></td>
                <td className="text-center">
                  {c.estado === 'pendiente' && (
                    <button onClick={() => marcarPagado(c.id)} className="text-[10px] text-emerald-600 font-semibold hover:underline">
                      Marcar pagado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCobro && <ModalNuevoCobro tarifas={tarifas} alumnos={alumnos} profesionales={profesionales} onClose={() => setShowCobro(false)} />}
      {showTarifa && <ModalTarifas tarifas={tarifas} onClose={() => setShowTarifa(false)} />}
    </div>
  )
}

// ─── MODAL: NUEVO COBRO ───
function ModalNuevoCobro({ tarifas, alumnos, profesionales, onClose }: {
  tarifas: Tarifa[]; alumnos: Props['alumnos']; profesionales: Props['profesionales']; onClose: () => void
}) {
  const [form, setForm] = useState({ alumno_id: '', profesional_id: '', tarifa_id: '', fecha_sesion: new Date().toISOString().split('T')[0], monto_override: '' })
  const [saving, setSaving] = useState(false)

  const tarifaSeleccionada = tarifas.find(t => t.id === form.tarifa_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/cobros-sesion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tarifa_id: form.tarifa_id || null,
          monto_override: form.monto_override ? parseInt(form.monto_override) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Cobro generado')
      onClose()
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Generar cobro de sesión</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Alumno *</label>
            <select value={form.alumno_id} onChange={e => setForm({...form, alumno_id: e.target.value})} className="select-base w-full text-[12px]" required>
              <option value="">Seleccionar...</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Profesional *</label>
            <select value={form.profesional_id} onChange={e => setForm({...form, profesional_id: e.target.value})} className="select-base w-full text-[12px]" required>
              <option value="">Seleccionar...</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tarifa</label>
            <select value={form.tarifa_id} onChange={e => setForm({...form, tarifa_id: e.target.value})} className="select-base w-full text-[12px]">
              <option value="">Sin tarifa (monto manual)</option>
              {tarifas.map(t => <option key={t.id} value={t.id}>{t.nombre} — ${t.monto.toLocaleString('es-CL')}</option>)}
            </select>
            {tarifaSeleccionada && <p className="text-[10px] text-[var(--ar-muted)] mt-1">{tarifaSeleccionada.duracion_min} min · ${tarifaSeleccionada.monto.toLocaleString('es-CL')}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Fecha sesión *</label>
              <input type="date" value={form.fecha_sesion} onChange={e => setForm({...form, fecha_sesion: e.target.value})} className="input-base text-[12px]" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Monto manual</label>
              <input type="number" value={form.monto_override} onChange={e => setForm({...form, monto_override: e.target.value})} className="input-base text-[12px]" placeholder={tarifaSeleccionada ? `${tarifaSeleccionada.monto}` : 'CLP'} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Generando...' : 'Generar cobro'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL: TARIFAS ───
function ModalTarifas({ tarifas, onClose }: { tarifas: Tarifa[]; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: '', especialidad: '', duracion_min: '45', monto: '' })
  const [saving, setSaving] = useState(false)

  async function crearTarifa(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/tarifas-sesion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duracion_min: parseInt(form.duracion_min), monto: parseInt(form.monto) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Tarifa creada')
      setForm({ nombre: '', especialidad: '', duracion_min: '45', monto: '' })
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Tarifas de sesión</h3>
          <p className="text-[11px] text-[var(--ar-muted)] mt-1">Define cuánto cobras por cada tipo de sesión</p>
        </div>
        <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
          {tarifas.length === 0 ? (
            <p className="text-[12px] text-[var(--ar-muted)] text-center py-4">No hay tarifas configuradas</p>
          ) : (
            <div className="space-y-2">
              {tarifas.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f9f7f5]">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--ar-text)]">{t.nombre}</div>
                    <div className="text-[10px] text-[var(--ar-muted)]">{t.duracion_min} min · {t.especialidad || t.tipo_sesion}</div>
                  </div>
                  <div className="text-[13px] font-bold text-[var(--ar-text)]">${t.monto.toLocaleString('es-CL')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={crearTarifa} className="px-6 py-4 border-t border-[var(--ar-border)] space-y-3">
          <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Agregar tarifa</div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-base text-[12px]" placeholder="Nombre (ej: Sesión Fono)" required />
            <input value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} className="input-base text-[12px]" placeholder="Especialidad (opcional)" />
            <input type="number" value={form.duracion_min} onChange={e => setForm({...form, duracion_min: e.target.value})} className="input-base text-[12px]" placeholder="Duración (min)" />
            <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} className="input-base text-[12px]" placeholder="Monto CLP" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cerrar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Creando...' : 'Crear tarifa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
