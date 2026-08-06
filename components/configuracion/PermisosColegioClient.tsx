'use client'

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'

interface Modulo { key: string; label: string; grupo: string; icon: string }
interface Rol { key: string; label: string; desc: string }
interface Permiso { id: string; rol: string; modulo: string; habilitado: boolean }

interface Props {
  permisos: Permiso[]
  modulos: Modulo[]
  roles: Rol[]
}

export default function PermisosColegioClient({ permisos, modulos, roles }: Props) {
  const [map, setMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    for (const p of permisos) {
      m[`${p.rol}::${p.modulo}`] = p.habilitado
    }
    // Default: all enabled for roles with no permisos entry
    return m
  })
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)
  const [activeRol, setActiveRol] = useState(roles[0].key)

  function toggle(rol: string, modulo: string) {
    const key = `${rol}::${modulo}`
    setMap(prev => ({ ...prev, [key]: !prev[key] }))
    setChanged(true)
  }

  function isEnabled(rol: string, modulo: string): boolean {
    const key = `${rol}::${modulo}`
    // If not in map, default to true (enabled)
    return key in map ? map[key] : true
  }

  function enableAll(rol: string) {
    setMap(prev => {
      const next = { ...prev }
      modulos.forEach(m => { next[`${rol}::${m.key}`] = true })
      return next
    })
    setChanged(true)
  }

  function disableAll(rol: string) {
    setMap(prev => {
      const next = { ...prev }
      modulos.forEach(m => { next[`${rol}::${m.key}`] = false })
      return next
    })
    setChanged(true)
  }

  async function handleGuardar() {
    setSaving(true)
    try {
      // Build upserts for all permisos
      const upserts = roles.flatMap(r =>
        modulos.map(m => ({
          colegio_id: null,
          rol: r.key,
          modulo: m.key,
          habilitado: isEnabled(r.key, m.key),
        }))
      )

      const res = await fetch('/api/permisos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisos: upserts }),
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Permisos guardados')
      setChanged(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const grupos = [...new Set(modulos.map(m => m.grupo))]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Permisos del equipo</h1>
          <p className="page-subtitle">Define qué puede ver y hacer cada rol en tu centro</p>
        </div>
        <div className="flex items-center gap-3">
          {changed && <span className="text-[11px] text-amber-600 font-medium">Cambios sin guardar</span>}
          <button onClick={handleGuardar} disabled={saving || !changed} className="btn-primary disabled:opacity-60">
            <i className="ti ti-device-floppy text-[14px]" aria-hidden="true"/>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <i className="ti ti-info-circle text-blue-500 text-[18px] mt-0.5 shrink-0" aria-hidden="true"/>
        <div>
          <p className="text-[12px] text-blue-800 font-medium mb-1">El rol Administrador (Director) siempre tiene acceso total</p>
          <p className="text-[11px] text-blue-700">Aquí configuras lo que pueden ver los profesionales, terapeutas y personal administrativo. Los apoderados siempre ven solo el portal de su hijo.</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {roles.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveRol(r.key)}
            className={`shrink-0 px-4 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
              activeRol === r.key
                ? 'bg-[#2D1B69] text-white border-[#2D1B69]'
                : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)] hover:border-[#2D1B69]/30'
            }`}
          >
            <div className="font-semibold">{r.label}</div>
            <div className="text-[9px] opacity-70 mt-0.5">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Active role config */}
      {roles.filter(r => r.key === activeRol).map(rol => (
        <div key={rol.key}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[var(--ar-text)]">{rol.label}</h2>
            <div className="flex gap-2">
              <button onClick={() => enableAll(rol.key)} className="text-[11px] text-emerald-600 font-medium hover:underline">Activar todo</button>
              <span className="text-[var(--ar-muted)]">·</span>
              <button onClick={() => disableAll(rol.key)} className="text-[11px] text-red-500 font-medium hover:underline">Desactivar todo</button>
            </div>
          </div>

          {grupos.map(grupo => {
            const modsGrupo = modulos.filter(m => m.grupo === grupo)
            const allOn = modsGrupo.every(m => isEnabled(rol.key, m.key))
            const anyOn = modsGrupo.some(m => isEnabled(rol.key, m.key))

            return (
              <div key={grupo} className="card p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#5B3E9E]" />
                    <h3 className="text-[12px] font-bold text-[var(--ar-text)] uppercase tracking-wider">{grupo}</h3>
                  </div>
                  {/* Group toggle */}
                  <button
                    onClick={() => {
                      setMap(prev => {
                        const next = { ...prev }
                        modsGrupo.forEach(m => { next[`${rol.key}::${m.key}`] = !allOn })
                        return next
                      })
                      setChanged(true)
                    }}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                      allOn ? 'bg-emerald-100 text-emerald-700' : anyOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {allOn ? 'Todo activo' : anyOn ? 'Parcial' : 'Todo inactivo'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {modsGrupo.map(mod => {
                    const enabled = isEnabled(rol.key, mod.key)
                    return (
                      <button
                        key={mod.key}
                        onClick={() => toggle(rol.key, mod.key)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                          enabled
                            ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                            : 'border-[var(--ar-border)] bg-white hover:bg-[#f9f7f5] opacity-50'
                        }`}
                      >
                        {/* Toggle circle */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          enabled ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}>
                          <i className={`ti ${mod.icon} text-[14px] ${enabled ? 'text-white' : 'text-slate-400'}`} aria-hidden="true"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[12px] font-medium truncate ${enabled ? 'text-emerald-800' : 'text-slate-500'}`}>
                            {mod.label}
                          </div>
                          <div className="text-[9px] mt-0.5">
                            {enabled
                              ? <span className="text-emerald-600 font-medium">✓ Tiene acceso</span>
                              : <span className="text-slate-400">Sin acceso</span>
                            }
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
