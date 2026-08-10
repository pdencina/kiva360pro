'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Props {
  colegios: any[]
  propuestas: any[]
  alumnos: any[]
  usuarios: any[]
  prospectos: any[]
}

export default function SuperAdminDashboard({ colegios, propuestas, alumnos, usuarios, prospectos }: Props) {
  const [tab, setTab] = useState<'overview' | 'colegios' | 'propuestas'>('overview')
  const [editando, setEditando] = useState<any>(null)
  const [editForm, setEditForm] = useState({ nombre_cliente: '', email_cliente: '', plan: '', monto_mensual: '', descuento_anual: '', representante: '', estado: '', condiciones_especiales: '' })
  const [guardando, setGuardando] = useState(false)

  function abrirEditar(p: any) {
    setEditando(p)
    setEditForm({
      nombre_cliente: p.nombre_cliente || '',
      email_cliente: p.email_cliente || '',
      plan: p.plan || 'Profesional',
      monto_mensual: String(p.monto_mensual || ''),
      descuento_anual: String(p.descuento_anual || '10'),
      representante: p.representante || '',
      estado: p.estado || 'enviada',
      condiciones_especiales: p.condiciones_especiales || '',
    })
  }

  async function handleGuardarEdicion() {
    if (!editando) return
    setGuardando(true)
    try {
      const monto = parseInt(editForm.monto_mensual)
      const descuento = parseInt(editForm.descuento_anual)
      const res = await fetch('/api/propuestas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando.id,
          ...editForm,
          monto_mensual: monto,
          monto_anual: Math.round(monto * 12 * (1 - descuento / 100)),
          descuento_anual: descuento,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Propuesta actualizada')
      setEditando(null)
      window.location.reload()
    } catch (err: any) { toast.error(err.message) }
    finally { setGuardando(false) }
  }

  async function handleEliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la propuesta de "${nombre}"?`)) return
    const res = await fetch('/api/propuestas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: 'vencida' }),
    })
    if (res.ok) { toast.success('Propuesta eliminada'); window.location.reload() }
  }

  async function handleReenviar(id: string, slug: string) {
    const res = await fetch('/api/propuestas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: 'enviada', resetear_firma: true }),
    })
    if (res.ok) {
      const link = `${window.location.origin}/propuesta/${slug}`
      navigator.clipboard.writeText(link)
      toast.success('Propuesta reenviada. Link copiado al portapapeles.')
      window.location.reload()
    } else {
      toast.error('Error al reenviar')
    }
  }

  // KPIs
  const totalAlumnos = alumnos.filter(a => a.activo).length
  const totalUsuarios = usuarios.filter(u => u.activo).length
  const propuestasEnviadas = propuestas.filter(p => p.estado === 'enviada').length
  const propuestasAceptadas = propuestas.filter(p => p.estado === 'aceptada').length
  const prospectosPendientes = prospectos.filter(p => p.etapa === 'calificado').length

  // Revenue estimate (based on accepted proposals)
  const mrrEstimado = propuestas
    .filter(p => p.estado === 'aceptada')
    .reduce((acc, p) => acc + (p.modalidad_pago === 'anual' ? Math.round((p.monto_anual || p.monto_mensual * 10.8) / 12) : p.monto_mensual), 0)

  // Per-colegio stats
  const statsPorColegio = colegios.map(c => ({
    ...c,
    alumnos: alumnos.filter(a => a.colegio_id === c.id && a.activo).length,
    usuarios: usuarios.filter(u => u.colegio_id === c.id && u.activo).length,
    prospectos: prospectos.filter(p => p.colegio_id === c.id).length,
  }))

  const tabs = [
    { key: 'overview', label: 'Resumen', icon: 'ti-chart-pie' },
    { key: 'colegios', label: 'Colegios', icon: 'ti-building-school' },
    { key: 'propuestas', label: 'Propuestas', icon: 'ti-file-invoice' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--ar-text)]" style={{ fontFamily: 'Space Grotesk' }}>Panel Kiva360</h1>
          <p className="text-[13px] text-[var(--ar-muted)]">Centro de comando — Super Admin</p>
        </div>
        <div className="flex gap-2">
          <Link href="/super-admin/colegios/nuevo" className="btn-secondary text-[11px]">
            <i className="ti ti-building-school text-[12px]" aria-hidden="true"/> Nuevo colegio
          </Link>
          <Link href="/super-admin/propuestas/nueva" className="btn-primary text-[11px]">
            <i className="ti ti-file-plus text-[12px]" aria-hidden="true"/> Nueva propuesta
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Colegios" value={colegios.length} icon="ti-building-school" color="#3b6ea5" />
        <KPI label="Alumnos" value={totalAlumnos} icon="ti-users" color="#4A9E7A" />
        <KPI label="Usuarios" value={totalUsuarios} icon="ti-user-cog" color="#5B3E9E" />
        <KPI label="Propuestas" value={propuestasEnviadas} sub="pendientes" icon="ti-file-invoice" color="#E85D3A" />
        <KPI label="Firmadas" value={propuestasAceptadas} icon="ti-check" color="#22c55e" />
        <KPI label="MRR estimado" value={`$${Math.round(mrrEstimado / 1000)}K`} icon="ti-currency-dollar" color="#B86E00" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--ar-border)] mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
              tab === t.key ? 'border-[var(--ar-accent)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'
            }`}>
            <i className={`ti ${t.icon} text-[14px]`} aria-hidden="true"/>{t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent activity */}
          <div className="card p-5">
            <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-4">Postulaciones recientes</h3>
            {prospectos.slice(0, 8).map((p: any, i: number) => {
              const colegio = colegios.find(c => c.id === p.colegio_id)
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--ar-border)]/30 last:border-0">
                  <div className="text-[11px]">
                    <span className="font-medium text-[var(--ar-text)]">{colegio?.nombre || '—'}</span>
                    <span className={`ml-2 tag text-[9px] ${p.etapa === 'calificado' ? 'tag-blue' : p.etapa === 'matricula' ? 'tag-ok' : 'tag-pend'}`}>{p.etapa}</span>
                  </div>
                  <span className="text-[10px] text-[var(--ar-muted)]">{new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                </div>
              )
            })}
            {prospectos.length === 0 && <p className="text-[12px] text-[var(--ar-muted)]">Sin postulaciones</p>}
          </div>

          {/* Propuestas pipeline */}
          <div className="card p-5">
            <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-4">Pipeline de propuestas</h3>
            {propuestas.slice(0, 8).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--ar-border)]/30 last:border-0">
                <div>
                  <span className="text-[12px] font-medium text-[var(--ar-text)]">{p.nombre_cliente}</span>
                  <span className={`ml-2 tag text-[9px] ${p.estado === 'aceptada' ? 'tag-ok' : p.estado === 'enviada' ? 'tag-blue' : 'tag-gray'}`}>{p.estado}</span>
                </div>
                <div className="text-[11px] text-[var(--ar-muted)]">
                  ${(p.monto_mensual || 0).toLocaleString('es-CL')}/mes
                </div>
              </div>
            ))}
            {propuestas.length === 0 && <p className="text-[12px] text-[var(--ar-muted)]">Sin propuestas</p>}
          </div>

          {/* Quick links */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-4">Accesos rápidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: '/super-admin/usuarios', label: 'Usuarios globales', icon: 'ti-users-group', color: '#5B3E9E' },
                { href: '/super-admin/permisos', label: 'Permisos por rol', icon: 'ti-lock-open', color: '#E85D3A' },
                { href: '/super-admin/aportes', label: 'Tabla de aportes', icon: 'ti-table', color: '#4A9E7A' },
                { href: '/super-admin/propuestas', label: 'Gestión propuestas', icon: 'ti-file-invoice', color: '#3b6ea5' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--ar-border)] hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: link.color + '15' }}>
                    <i className={`ti ${link.icon} text-[16px]`} style={{ color: link.color }} aria-hidden="true"/>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--ar-text)]">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Colegios (with impersonate) */}
      {tab === 'colegios' && (
        <div className="space-y-3">
          {statsPorColegio.map(c => (
            <div key={c.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#f3f0f9] flex items-center justify-center shrink-0">
                <i className="ti ti-building-school text-[20px] text-[#5B3E9E]" aria-hidden="true"/>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-[var(--ar-text)]">{c.nombre}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[11px] text-[var(--ar-muted)]"><strong className="text-[var(--ar-text)]">{c.alumnos}</strong> alumnos</span>
                  <span className="text-[11px] text-[var(--ar-muted)]"><strong className="text-[var(--ar-text)]">{c.usuarios}</strong> usuarios</span>
                  <span className="text-[11px] text-[var(--ar-muted)]"><strong className="text-[var(--ar-text)]">{c.prospectos}</strong> postulantes</span>
                  <span className="tag text-[9px] tag-blue">{c.plan}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/super-admin/colegios/${c.id}`} className="btn-secondary text-[10px] py-1.5 px-3">
                  <i className="ti ti-settings text-[11px]" aria-hidden="true"/> Configurar
                </Link>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/super-admin/impersonate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ colegio_id: c.id }),
                    })
                    if (res.ok) {
                      toast.success(`Entrando a ${c.nombre}`)
                      window.location.href = '/inicio'
                    }
                  }}
                  className="btn-primary text-[10px] py-1.5 px-3"
                >
                  <i className="ti ti-eye text-[11px]" aria-hidden="true"/> Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Propuestas */}
      {tab === 'propuestas' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[var(--ar-text)]">Todas las propuestas</h3>
            <Link href="/super-admin/propuestas/nueva" className="btn-primary text-[11px]">
              <i className="ti ti-plus text-[12px]" aria-hidden="true"/> Nueva
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="table-head">
                  <th>Cliente</th><th>Plan</th><th>Monto</th><th>Modalidad</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {propuestas.map((p: any) => (
                  <tr key={p.id} className="table-row">
                    <td className="font-medium">{p.nombre_cliente}</td>
                    <td>{p.plan}</td>
                    <td className="font-semibold">${(p.monto_mensual || 0).toLocaleString('es-CL')}/mes</td>
                    <td className="capitalize">{p.modalidad_pago}</td>
                    <td>
                      <span className={`tag text-[9px] ${p.estado === 'aceptada' ? 'tag-ok' : p.estado === 'enviada' ? 'tag-blue' : p.estado === 'rechazada' ? 'tag-mora' : 'tag-gray'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="text-[var(--ar-muted)]">{new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/propuesta/${p.slug}`); toast.success('Link copiado') }}
                          className="text-[10px] text-[var(--ar-accent)] font-medium hover:underline">Copiar</button>
                        {p.estado !== 'enviada' && (
                          <button onClick={() => handleReenviar(p.id, p.slug)}
                            className="text-[10px] text-emerald-600 font-medium hover:underline">Reenviar</button>
                        )}
                        {p.estado === 'aceptada' && (
                          <a href={`/propuesta/${p.slug}`} target="_blank"
                            className="text-[10px] text-[#3D7A94] font-medium hover:underline">Ver contrato</a>
                        )}
                        <button onClick={() => abrirEditar(p)}
                          className="text-[10px] text-[#5B3E9E] font-medium hover:underline">Editar</button>
                        <button onClick={() => handleEliminar(p.id, p.nombre_cliente)}
                          className="text-[10px] text-red-500 font-medium hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Editar Propuesta */}
          {editando && (
            <div className="modal-overlay" onClick={() => setEditando(null)}>
              <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Editar propuesta</h3>
                  <button onClick={() => setEditando(null)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)]"><i className="ti ti-x text-[16px]" aria-hidden="true"/></button>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre cliente</label>
                      <input value={editForm.nombre_cliente} onChange={e => setEditForm({...editForm, nombre_cliente: e.target.value})} className="input-base text-[12px]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Email</label>
                      <input type="email" value={editForm.email_cliente} onChange={e => setEditForm({...editForm, email_cliente: e.target.value})} className="input-base text-[12px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Plan</label>
                      <select value={editForm.plan} onChange={e => setEditForm({...editForm, plan: e.target.value})} className="select-base w-full text-[12px]">
                        <option value="Starter">Starter</option><option value="Profesional">Profesional</option><option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Monto mensual</label>
                      <input type="number" value={editForm.monto_mensual} onChange={e => setEditForm({...editForm, monto_mensual: e.target.value})} className="input-base text-[12px]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Desc. anual %</label>
                      <input type="number" value={editForm.descuento_anual} onChange={e => setEditForm({...editForm, descuento_anual: e.target.value})} className="input-base text-[12px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Representante</label>
                      <input value={editForm.representante} onChange={e => setEditForm({...editForm, representante: e.target.value})} className="input-base text-[12px]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Estado</label>
                      <select value={editForm.estado} onChange={e => setEditForm({...editForm, estado: e.target.value})} className="select-base w-full text-[12px]">
                        <option value="borrador">Borrador</option><option value="enviada">Enviada</option><option value="aceptada">Aceptada</option><option value="rechazada">Rechazada</option><option value="vencida">Vencida</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Condiciones especiales</label>
                    <textarea value={editForm.condiciones_especiales} onChange={e => setEditForm({...editForm, condiciones_especiales: e.target.value})} className="input-base text-[12px] min-h-[60px]" placeholder="Notas o condiciones adicionales..." />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[var(--ar-border)] flex justify-end gap-2">
                  <button onClick={() => setEditando(null)} className="btn-secondary text-[12px]">Cancelar</button>
                  <button onClick={handleGuardarEdicion} disabled={guardando} className="btn-primary text-[12px]">{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
          <i className={`ti ${icon} text-[14px]`} style={{ color }} aria-hidden="true"/>
        </div>
      </div>
      <div className="text-[20px] font-bold text-[var(--ar-text)]" style={{ fontFamily: 'Space Grotesk' }}>{value}</div>
      <div className="text-[10px] text-[var(--ar-muted)] font-medium">{label} {sub && <span className="opacity-60">· {sub}</span>}</div>
    </div>
  )
}
