'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Suscripcion {
  id: string
  colegio_id: string
  colegio: { id: string; nombre: string }
  plan: string
  monto_mensual: number
  estado: string
  fecha_inicio: string
  fecha_vencimiento: string | null
  dias_gracia: number
  tarjeta_inscrita: boolean
  ultimo_pago_at: string | null
  meses_pagados: number
  created_at: string
}

interface Colegio {
  id: string; nombre: string; plan: string
}

interface Props {
  suscripciones: Suscripcion[]
  colegios: Colegio[]
}

const PLANES = [
  { key: 'basico', label: 'Básico', color: 'bg-slate-100 text-slate-700' },
  { key: 'profesional', label: 'Profesional', color: 'bg-violet-100 text-violet-700' },
  { key: 'enterprise', label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
]

const ESTADOS = [
  { key: 'activa', label: 'Activa', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-700' },
  { key: 'atrasada', label: 'Atrasada', color: 'bg-red-100 text-red-700' },
  { key: 'suspendida', label: 'Suspendida', color: 'bg-orange-100 text-orange-700' },
  { key: 'cancelada', label: 'Cancelada', color: 'bg-slate-100 text-slate-500' },
]

export default function SuscripcionesClient({ suscripciones, colegios }: Props) {
  const [lista, setLista] = useState(suscripciones)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    colegio_id: '', plan: 'profesional', monto_mensual: 0, estado: 'activa', dias_gracia: 5,
  })

  // Colegios que aún no tienen suscripción
  const colegiosSinSub = colegios.filter(c => !lista.some(s => s.colegio_id === c.id))

  // Stats
  const totalActivas = lista.filter(s => s.estado === 'activa').length
  const totalAtrasadas = lista.filter(s => s.estado === 'atrasada').length
  const ingresoMensual = lista.filter(s => ['activa', 'atrasada'].includes(s.estado)).reduce((a, s) => a + s.monto_mensual, 0)

  async function crearSuscripcion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/suscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const nueva = await res.json()
      setLista(prev => [nueva, ...prev])
      setShowForm(false)
      setForm({ colegio_id: '', plan: 'profesional', monto_mensual: 0, estado: 'activa', dias_gracia: 5 })
      toast.success('Suscripción creada')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function registrarPago(suscripcionId: string) {
    const ref = prompt('Referencia del pago (N° transferencia, etc.):')
    if (!ref) return
    try {
      const res = await fetch('/api/suscripciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: suscripcionId, action: 'registrar_pago', referencia: ref }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated = await res.json()
      setLista(prev => prev.map(s => s.id === suscripcionId ? { ...s, ...updated } : s))
      toast.success('Pago registrado')
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Suscripciones</h1>
          <p className="page-subtitle">Billing de colegios · Flexio Technologies Spa</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-[12px]">
          <i className="ti ti-plus text-[14px]" aria-hidden="true" /> Nueva suscripción
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Total clientes</p>
          <p className="text-[24px] font-bold text-[var(--ar-text)]">{lista.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Activas</p>
          <p className="text-[24px] font-bold text-emerald-600">{totalActivas}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Atrasadas</p>
          <p className="text-[24px] font-bold text-red-600">{totalAtrasadas}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Ingreso mensual</p>
          <p className="text-[24px] font-bold text-[var(--ar-text)]">${ingresoMensual.toLocaleString('es-CL')}</p>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="card p-4 mb-6 bg-[#faf9f7] border-dashed">
        <div className="flex items-center gap-3">
          <i className="ti ti-building-bank text-[20px] text-[var(--ar-muted)]" aria-hidden="true" />
          <div className="text-[11px] text-[var(--ar-muted)]">
            <strong className="text-[var(--ar-text)]">Cuenta para recibir pagos:</strong> Flexio Technologies Spa · RUT 78.479.402-4 · Banco Bci · Cta. Cte. 68569265 · pablo@flexio.cl
          </div>
        </div>
      </div>

      {/* Form nueva suscripción */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-4">Nueva suscripción</h3>
          <form onSubmit={crearSuscripcion} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium text-[var(--ar-muted)] mb-1">Colegio</label>
              <select value={form.colegio_id} onChange={e => setForm({ ...form, colegio_id: e.target.value })} required className="select-base w-full text-[12px]">
                <option value="">Seleccionar...</option>
                {colegiosSinSub.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ar-muted)] mb-1">Plan</label>
              <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="select-base w-full text-[12px]">
                {PLANES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ar-muted)] mb-1">Monto mensual (CLP)</label>
              <input type="number" value={form.monto_mensual} onChange={e => setForm({ ...form, monto_mensual: +e.target.value })} required className="input-base w-full text-[12px]" placeholder="150000" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ar-muted)] mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="select-base w-full text-[12px]">
                {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-[12px] h-[38px]">
              {saving ? 'Creando...' : 'Crear'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#f9f7f5] border-b border-[var(--ar-border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--ar-muted)]">Colegio</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--ar-muted)]">Plan</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ar-muted)]">Monto</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ar-muted)]">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ar-muted)]">Vencimiento</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ar-muted)]">Meses pagados</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ar-muted)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--ar-muted)]">No hay suscripciones registradas</td></tr>
            ) : lista.map(s => {
              const planInfo = PLANES.find(p => p.key === s.plan) || PLANES[1]
              const estadoInfo = ESTADOS.find(e => e.key === s.estado) || ESTADOS[0]
              const vencido = s.fecha_vencimiento && new Date(s.fecha_vencimiento) < new Date()
              return (
                <tr key={s.id} className="border-b border-[var(--ar-border)] hover:bg-[#faf9f7] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--ar-text)]">{s.colegio?.nombre || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planInfo.color}`}>{planInfo.label}</span></td>
                  <td className="px-4 py-3 text-right font-semibold">${s.monto_mensual.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoInfo.color}`}>{estadoInfo.label}</span></td>
                  <td className={`px-4 py-3 text-center ${vencido ? 'text-red-600 font-bold' : ''}`}>
                    {s.fecha_vencimiento ? new Date(s.fecha_vencimiento).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">{s.meses_pagados}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => registrarPago(s.id)} className="btn-secondary text-[10px] py-1.5 px-2.5">
                      <i className="ti ti-cash text-[12px]" aria-hidden="true" /> Registrar pago
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
