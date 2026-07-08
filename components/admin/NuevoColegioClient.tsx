'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NuevoColegioClient() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '', rut: '', direccion: '', telefono: '', plan: 'profesional',
    logo_url: '', color_primario: '#1a2332', color_acento: '#b8860b',
    admin_nombre: '', admin_apellido: '', admin_email: '', admin_password: '',
  })

  function setF(k: string, v: string) { setForm(p => ({...p, [k]: v})) }

  async function handleGuardar() {
    if (!form.nombre || !form.admin_email || !form.admin_password) {
      toast.error('Nombre del colegio, email y contraseña del admin son requeridos')
      return
    }
    setSaving(true)
    try {
      // 1. Crear colegio
      const resColegio = await fetch('/api/admin/colegios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, rut: form.rut, direccion: form.direccion, telefono: form.telefono, plan: form.plan, logo_url: form.logo_url || null, color_primario: form.color_primario, color_acento: form.color_acento }),
      })
      const colegio = await resColegio.json()
      if (!resColegio.ok) throw new Error(colegio.error ?? 'Error al crear colegio')

      // 2. Crear admin del colegio
      const resUser = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.admin_nombre || 'Admin',
          apellido: form.admin_apellido || '',
          email: form.admin_email,
          password: form.admin_password,
          rol: 'admin',
          colegio_id: colegio.id,
        }),
      })
      const usuario = await resUser.json()
      if (!resUser.ok) throw new Error(usuario.error ?? 'Error al crear admin')

      toast.success(`Colegio "${form.nombre}" creado correctamente`)
      router.push('/super-admin')
    } catch (e: any) {
      toast.error(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/super-admin" className="text-slate-400 hover:text-slate-600 transition-colors">
          <i className="ti ti-arrow-left text-lg" aria-hidden="true"/>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Nuevo colegio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registrar un nuevo establecimiento</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Datos del colegio */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="ti ti-building-school text-blue-500" aria-hidden="true"/> Datos del colegio
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre *</label>
              <input value={form.nombre} onChange={e => setF('nombre', e.target.value)} className="input-base" placeholder="Nombre del establecimiento"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">RUT</label>
              <input value={form.rut} onChange={e => setF('rut', e.target.value)} className="input-base" placeholder="76.543.210-1"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={e => setF('telefono', e.target.value)} className="input-base" placeholder="+56 2 2345 6789"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dirección</label>
              <input value={form.direccion} onChange={e => setF('direccion', e.target.value)} className="input-base" placeholder="Av. Principal 1234, Ciudad"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Plan</label>
              <select value={form.plan} onChange={e => setF('plan', e.target.value)} className="select-base w-full">
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="ti ti-palette text-blue-500" aria-hidden="true"/> Personalización visual
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL del logo</label>
              <input value={form.logo_url} onChange={e => setF('logo_url', e.target.value)} className="input-base" placeholder="https://ejemplo.com/logo.png"/>
              <p className="text-[11px] text-slate-400 mt-1">Imagen cuadrada recomendada (PNG/SVG, mínimo 100x100px)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color primario</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color_primario} onChange={e => setF('color_primario', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"/>
                <input value={form.color_primario} onChange={e => setF('color_primario', e.target.value)} className="input-base flex-1 font-mono text-sm" placeholder="#1a2332"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color acento</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color_acento} onChange={e => setF('color_acento', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"/>
                <input value={form.color_acento} onChange={e => setF('color_acento', e.target.value)} className="input-base flex-1 font-mono text-sm" placeholder="#b8860b"/>
              </div>
            </div>
            {(form.logo_url || form.color_primario !== '#1a2332') && (
              <div className="col-span-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Vista previa</p>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: form.color_primario }}>
                  {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-8 h-8 rounded"/>}
                  <span className="text-white text-sm font-semibold">{form.nombre || 'Nombre del colegio'}</span>
                  <span className="ml-auto text-xs px-2 py-1 rounded font-semibold" style={{ backgroundColor: form.color_acento, color: 'white' }}>Acento</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin del colegio */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="ti ti-user-cog text-blue-500" aria-hidden="true"/> Administrador del colegio
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
              <input value={form.admin_nombre} onChange={e => setF('admin_nombre', e.target.value)} className="input-base" placeholder="Nombre"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Apellido</label>
              <input value={form.admin_apellido} onChange={e => setF('admin_apellido', e.target.value)} className="input-base" placeholder="Apellido"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" value={form.admin_email} onChange={e => setF('admin_email', e.target.value)} className="input-base" placeholder="admin@institucion.cl"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña *</label>
              <input type="password" value={form.admin_password} onChange={e => setF('admin_password', e.target.value)} className="input-base" placeholder="Mínimo 8 caracteres"/>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Se creará automáticamente una cuenta de administrador para este colegio.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <a href="/super-admin" className="btn-secondary">Cancelar</a>
          <button onClick={handleGuardar} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Creando...' : 'Crear colegio'}
          </button>
        </div>
      </div>
    </div>
  )
}