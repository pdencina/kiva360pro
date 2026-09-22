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

interface Paquete {
  id: string; nombre: string; cantidad: number; precio_total: number; descuento_pct: number
  tarifa: { id: string; nombre: string; monto: number } | null
}

interface PaqueteVendido {
  id: string; sesiones_total: number; sesiones_usadas: number; monto_pagado: number
  estado_pago: string; fecha_vencimiento: string | null
  paquete: { nombre: string; descuento_pct: number } | null
  alumno: { id: string; nombre: string; apellido: string; curso: string }
}

interface Props {
  cobros: Cobro[]
  tarifas: Tarifa[]
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
  profesionales: { id: string; nombre: string; apellido: string }[]
  paquetes: Paquete[]
  paquetesVendidos: PaqueteVendido[]
}

const ESTADO_LABELS: Record<string, { label: string; class: string }> = {
  pendiente: { label: 'Pendiente', class: 'tag-pend' },
  pagado: { label: 'Pagado', class: 'tag-ok' },
  parcial: { label: 'Parcial', class: 'tag-par' },
  anulado: { label: 'Anulado', class: 'tag-gray' },
  condonado: { label: 'Condonado', class: 'tag-blue' },
}

export default function CobrosSesionClient({ cobros, tarifas, alumnos, profesionales, paquetes, paquetesVendidos }: Props) {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showCobro, setShowCobro] = useState(false)
  const [showTarifa, setShowTarifa] = useState(false)
  const [showPaquetes, setShowPaquetes] = useState(false)

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
          <button onClick={() => setShowPaquetes(true)} className="btn-secondary">
            <i className="ti ti-package text-[14px]" aria-hidden="true"/> Paquetes
          </button>
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
      {showPaquetes && <ModalPaquetes paquetes={paquetes} paquetesVendidos={paquetesVendidos} tarifas={tarifas} alumnos={alumnos} onClose={() => setShowPaquetes(false)} />}
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

// ─── MODAL: PAQUETES (catálogo + venta) ───
function ModalPaquetes({ paquetes, paquetesVendidos, tarifas, alumnos, onClose }: {
  paquetes: Paquete[]; paquetesVendidos: PaqueteVendido[]; tarifas: Tarifa[]
  alumnos: Props['alumnos']; onClose: () => void
}) {
  const [tab, setTab] = useState<'vender' | 'catalogo'>('vender')
  const [saving, setSaving] = useState(false)

  const [nuevoForm, setNuevoForm] = useState({ nombre: '', tarifa_id: '', cantidad: '10', precio_total: '', descuento_pct: '0' })
  const [ventaForm, setVentaForm] = useState({ paquete_id: '', alumno_id: '', marcar_pagado: true })

  async function crearPaquete(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/paquetes-sesion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoForm,
          tarifa_id: nuevoForm.tarifa_id || null,
          cantidad: parseInt(nuevoForm.cantidad),
          precio_total: parseInt(nuevoForm.precio_total),
          descuento_pct: parseInt(nuevoForm.descuento_pct),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Paquete creado en el catálogo')
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function venderPaquete(e: React.FormEvent) {
    e.preventDefault()
    if (!ventaForm.paquete_id || !ventaForm.alumno_id) { toast.error('Selecciona paquete y alumno'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/paquetes-vendidos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Paquete vendido')
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function marcarPagado(id: string) {
    const res = await fetch(`/api/paquetes-vendidos/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'marcar_pagado' }),
    })
    if (res.ok) { toast.success('Marcado como pagado'); window.location.reload() }
    else toast.error('Error al actualizar')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Planes prepagados</h3>
            <p className="text-[11px] text-[var(--ar-muted)] mt-1">Vende packs de sesiones con descuento y sigue su uso</p>
          </div>
          <button onClick={onClose} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
        </div>

        <div className="flex gap-1 px-6 pt-3 border-b border-[var(--ar-border)]">
          <button onClick={() => setTab('vender')} className={`px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${tab === 'vender' ? 'border-[var(--ar-navy)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'}`}>Vendidos</button>
          <button onClick={() => setTab('catalogo')} className={`px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${tab === 'catalogo' ? 'border-[var(--ar-navy)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'}`}>Catálogo</button>
        </div>

        {tab === 'vender' ? (
          <>
            <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
              {paquetesVendidos.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)] text-center py-4">Aún no se ha vendido ningún paquete</p>
              ) : (
                <div className="space-y-2">
                  {paquetesVendidos.map(pv => (
                    <div key={pv.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f9f7f5]">
                      <div>
                        <div className="text-[12px] font-medium text-[var(--ar-text)]">{pv.alumno.nombre} {pv.alumno.apellido} — {pv.paquete?.nombre}</div>
                        <div className="text-[10px] text-[var(--ar-muted)]">{pv.sesiones_usadas}/{pv.sesiones_total} sesiones usadas</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag ${pv.estado_pago === 'pagado' ? 'tag-ok' : 'tag-pend'}`}>{pv.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}</span>
                        {pv.estado_pago !== 'pagado' && (
                          <button onClick={() => marcarPagado(pv.id)} className="text-[10px] text-emerald-600 font-semibold hover:underline">Marcar pagado</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={venderPaquete} className="px-6 py-4 border-t border-[var(--ar-border)] space-y-3">
              <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Vender paquete</div>
              {paquetes.length === 0 ? (
                <p className="text-[11px] text-[var(--ar-muted)]">Primero crea un paquete en el Catálogo.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <select value={ventaForm.paquete_id} onChange={e => setVentaForm({...ventaForm, paquete_id: e.target.value})} className="select-base text-[12px]" required>
                    <option value="">Paquete...</option>
                    {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_total.toLocaleString('es-CL')}</option>)}
                  </select>
                  <select value={ventaForm.alumno_id} onChange={e => setVentaForm({...ventaForm, alumno_id: e.target.value})} className="select-base text-[12px]" required>
                    <option value="">Alumno...</option>
                    {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-[11px] text-[var(--ar-text)]">
                <input type="checkbox" checked={ventaForm.marcar_pagado} onChange={e => setVentaForm({...ventaForm, marcar_pagado: e.target.checked})} />
                Ya se pagó (si no, queda pendiente de cobro)
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cerrar</button>
                <button type="submit" disabled={saving || paquetes.length === 0} className="btn-primary text-[12px] disabled:opacity-50">{saving ? 'Vendiendo...' : 'Vender paquete'}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
              {paquetes.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)] text-center py-4">No hay paquetes en el catálogo</p>
              ) : (
                <div className="space-y-2">
                  {paquetes.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f9f7f5]">
                      <div>
                        <div className="text-[12px] font-medium text-[var(--ar-text)]">{p.nombre}</div>
                        <div className="text-[10px] text-[var(--ar-muted)]">{p.cantidad} sesiones{p.tarifa ? ` · ${p.tarifa.nombre}` : ''}{p.descuento_pct > 0 ? ` · ${p.descuento_pct}% desc.` : ''}</div>
                      </div>
                      <div className="text-[13px] font-bold text-[var(--ar-text)]">${p.precio_total.toLocaleString('es-CL')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={crearPaquete} className="px-6 py-4 border-t border-[var(--ar-border)] space-y-3">
              <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Agregar paquete</div>
              <div className="grid grid-cols-2 gap-3">
                <input value={nuevoForm.nombre} onChange={e => setNuevoForm({...nuevoForm, nombre: e.target.value})} className="input-base text-[12px]" placeholder="Nombre (ej: Pack 10 Fono)" required />
                <select value={nuevoForm.tarifa_id} onChange={e => setNuevoForm({...nuevoForm, tarifa_id: e.target.value})} className="select-base text-[12px]">
                  <option value="">Sin tarifa asociada</option>
                  {tarifas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <input type="number" value={nuevoForm.cantidad} onChange={e => setNuevoForm({...nuevoForm, cantidad: e.target.value})} className="input-base text-[12px]" placeholder="N° de sesiones" required />
                <input type="number" value={nuevoForm.precio_total} onChange={e => setNuevoForm({...nuevoForm, precio_total: e.target.value})} className="input-base text-[12px]" placeholder="Precio total CLP" required />
                <input type="number" value={nuevoForm.descuento_pct} onChange={e => setNuevoForm({...nuevoForm, descuento_pct: e.target.value})} className="input-base text-[12px]" placeholder="% descuento vs. tarifa normal" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cerrar</button>
                <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Creando...' : 'Crear paquete'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
