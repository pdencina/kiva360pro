'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const MODULOS_DISPONIBLES = [
  'alumnos', 'programas', 'horarios', 'asistencias', 'intervencion', 'agenda',
  'reporte_diario', 'comunicados', 'cobranzas', 'cobros_sesion', 'admision',
  'documentos', 'portal_familia', 'contratos', 'exportacion',
]

export default function NuevaPropuestaClient() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre_cliente: '', slug: '', representante: '', email_cliente: '',
    telefono_cliente: '', rut_cliente: '', direccion_cliente: '',
    plan: 'Profesional', monto_mensual: '79990',
    descuento_anual: '10', duracion_meses: '12',
    modulos_incluidos: [...MODULOS_DISPONIBLES],
    condiciones_especiales: '',
  })

  function genSlug(nombre: string) {
    return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre_cliente || !form.slug || !form.monto_mensual) {
      toast.error('Completa nombre, slug y monto'); return
    }
    setSaving(true)
    try {
      const monto = parseInt(form.monto_mensual)
      const descuento = parseInt(form.descuento_anual)
      const res = await fetch('/api/propuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto_mensual: monto,
          monto_anual: Math.round(monto * 12 * (1 - descuento / 100)),
          descuento_anual: descuento,
          duracion_meses: parseInt(form.duracion_meses),
          estado: 'enviada',
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Propuesta creada')
      router.push('/super-admin')
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="page-title mb-1">Nueva propuesta comercial</h1>
      <p className="page-subtitle mb-6">Genera una propuesta para enviar a un cliente potencial</p>

      <form onSubmit={handleCrear} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="text-[12px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Datos del cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre del centro *</label>
              <input value={form.nombre_cliente} onChange={e => { setForm({...form, nombre_cliente: e.target.value, slug: genSlug(e.target.value)}) }} className="input-base text-[12px]" placeholder="Espacio Sakura Kids" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Slug (URL) *</label>
              <div className="flex items-center">
                <span className="text-[10px] text-[var(--ar-muted)] mr-1">kiva360.cl/propuesta/</span>
                <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="input-base text-[12px] flex-1" required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Representante</label>
              <input value={form.representante} onChange={e => setForm({...form, representante: e.target.value})} className="input-base text-[12px]" placeholder="Carolina Rojas" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Email *</label>
              <input type="email" value={form.email_cliente} onChange={e => setForm({...form, email_cliente: e.target.value})} className="input-base text-[12px]" placeholder="carolina@email.com" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">RUT empresa</label>
              <input value={form.rut_cliente} onChange={e => setForm({...form, rut_cliente: e.target.value})} className="input-base text-[12px]" placeholder="77.xxx.xxx-x" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Teléfono</label>
              <input value={form.telefono_cliente} onChange={e => setForm({...form, telefono_cliente: e.target.value})} className="input-base text-[12px]" placeholder="+56 9 xxxx xxxx" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Dirección</label>
              <input value={form.direccion_cliente} onChange={e => setForm({...form, direccion_cliente: e.target.value})} className="input-base text-[12px]" placeholder="Calle, comuna, ciudad" />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-[12px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Precio y plan</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Plan</label>
              <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} className="select-base w-full text-[12px]">
                <option value="Starter">Starter</option>
                <option value="Profesional">Profesional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Monto mensual (CLP) *</label>
              <input type="number" value={form.monto_mensual} onChange={e => setForm({...form, monto_mensual: e.target.value})} className="input-base text-[12px]" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Descuento anual (%)</label>
              <input type="number" value={form.descuento_anual} onChange={e => setForm({...form, descuento_anual: e.target.value})} className="input-base text-[12px]" />
            </div>
          </div>
          {form.monto_mensual && (
            <div className="text-[11px] text-[var(--ar-muted)] bg-[#f9f7f5] rounded-lg p-3">
              <strong>Mensual:</strong> ${parseInt(form.monto_mensual || '0').toLocaleString('es-CL')}/mes
              {' · '}
              <strong>Anual:</strong> ${Math.round(parseInt(form.monto_mensual || '0') * 12 * (1 - parseInt(form.descuento_anual || '0') / 100)).toLocaleString('es-CL')}/año
              ({form.descuento_anual}% desc.)
            </div>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-[12px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Condiciones especiales</h2>
          <textarea value={form.condiciones_especiales} onChange={e => setForm({...form, condiciones_especiales: e.target.value})} className="input-base text-[12px] min-h-[60px]" placeholder="Ej: Incluye onboarding gratuito, primer mes sin costo..." />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creando...' : 'Crear y enviar'}</button>
        </div>
      </form>
    </div>
  )
}
