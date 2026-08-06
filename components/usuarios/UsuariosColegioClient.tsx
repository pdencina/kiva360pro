'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props { usuarios: any[]; alumnos: any[]; colegioId: string }

// Human-readable role config — no technical jargon
const TIPO_PERSONA = [
  {
    key: 'tutor',
    label: 'Profesional',
    desc: 'Terapeuta, educadora, fonoaudióloga, etc.',
    icon: 'ti-stethoscope',
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    acceso: 'Ve agenda, sesiones, alumnos asignados y reportes'
  },
  {
    key: 'apoderado',
    label: 'Apoderado / Familia',
    desc: 'Padre, madre o tutor legal',
    icon: 'ti-heart-handshake',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    acceso: 'Ve avances de su hijo, horario, informes y pagos'
  },
  {
    key: 'admin',
    label: 'Administrador',
    desc: 'Secretaría o coordinador con acceso completo',
    icon: 'ti-briefcase',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    acceso: 'Ve y gestiona todo el centro'
  },
]

export default function UsuariosColegioClient({ usuarios, alumnos, colegioId }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showVincular, setShowVincular] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [loading, setLoading] = useState(false)

  // Step-based creation
  const [step, setStep] = useState(1) // 1=tipo, 2=datos, 3=vincular (apoderado only)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol: 'tutor' })
  const [alumnoVinc, setAlumnoVinc] = useState('')
  const [parentesco, setParentesco] = useState('apoderado')

  const filtrados = useMemo(() =>
    usuarios.filter(u => {
      if (filtroRol && u.rol !== filtroRol) return false
      if (busqueda && !`${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase())) return false
      return true
    }),
    [usuarios, filtroRol, busqueda]
  )

  function openCreateModal() {
    setStep(1)
    setForm({ nombre: '', apellido: '', email: '', password: '', rol: 'tutor' })
    setAlumnoVinc('')
    setShowModal(true)
  }

  function selectTipo(rol: string) {
    setForm(p => ({ ...p, rol }))
    setStep(2)
  }

  async function handleCrear() {
    if (!form.nombre || !form.email || !form.password) { toast.error('Completa nombre, email y contraseña'); return }
    if (form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Auto-vincular si es apoderado y seleccionó alumno
      if (form.rol === 'apoderado' && alumnoVinc) {
        await fetch('/api/usuarios/vincular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: data.id, alumno_id: alumnoVinc, tipo: 'apoderado', parentesco }),
        })
      }

      toast.success(`${form.nombre} creado/a exitosamente`)
      setShowModal(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleDesactivar(id: string, nombre: string) {
    if (!confirm(`¿Desactivar a ${nombre}? No podrá ingresar al sistema.`)) return
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Usuario desactivado'); router.refresh() }
    else toast.error('Error')
  }

  async function handleVincular() {
    if (!showVincular || !alumnoVinc) { toast.error('Selecciona un alumno'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: showVincular.id, alumno_id: alumnoVinc, tipo: 'apoderado', parentesco }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Vinculación realizada')
      setShowVincular(null); router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  // Generate random password
  function genPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    let pw = ''
    for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)]
    setForm(p => ({ ...p, password: pw }))
  }

  const tipoConfig = (rol: string) => TIPO_PERSONA.find(t => t.key === rol) || TIPO_PERSONA[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Equipo y familias</h1>
          <p className="page-subtitle">{usuarios.length} personas con acceso al sistema</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <i className="ti ti-user-plus text-[14px]" aria-hidden="true"/> Agregar persona
        </button>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setFiltroRol('')}
          className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${!filtroRol ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]' : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'}`}>
          Todos ({usuarios.length})
        </button>
        {TIPO_PERSONA.map(t => {
          const count = usuarios.filter(u => u.rol === t.key || (t.key === 'admin' && u.rol === 'admin')).length
          return (
            <button key={t.key} onClick={() => setFiltroRol(filtroRol === t.key ? '' : t.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${filtroRol === t.key ? `${t.bg} ${t.color} ${t.border}` : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'}`}>
              <i className={`ti ${t.icon} text-[13px]`} aria-hidden="true"/> {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ar-muted)] text-[14px]" aria-hidden="true"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} className="input-base pl-9 text-[12px]" placeholder="Buscar por nombre o email..."/>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[13px] text-[var(--ar-muted)]">No hay usuarios</p>
          </div>
        ) : filtrados.map((u: any) => {
          const cfg = tipoConfig(u.rol)
          return (
            <div key={u.id} className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <i className={`ti ${cfg.icon} text-[18px] ${cfg.color}`} aria-hidden="true"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[var(--ar-text)]">{u.nombre} {u.apellido}</span>
                  {!u.activo && <span className="tag tag-gray text-[9px]">Inactivo</span>}
                </div>
                <div className="text-[11px] text-[var(--ar-muted)]">{u.email} · {cfg.label}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.rol === 'apoderado' && (
                  <button onClick={() => { setShowVincular(u); setAlumnoVinc('') }} className="btn-secondary text-[10px] py-1.5 px-2.5">
                    <i className="ti ti-link text-[11px]" aria-hidden="true"/> Vincular hijo
                  </button>
                )}
                {u.activo && (
                  <button onClick={() => handleDesactivar(u.id, u.nombre)} className="text-[10px] text-red-500 hover:underline font-medium px-2">
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ MODAL: CREAR USUARIO (wizard steps) ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-scale">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--ar-text)]">Agregar persona</h3>
                <p className="text-[11px] text-[var(--ar-muted)] mt-0.5">
                  {step === 1 && '¿Quién es esta persona?'}
                  {step === 2 && 'Datos de acceso'}
                  {step === 3 && 'Vincular con su hijo/a'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)]">
                <i className="ti ti-x text-[18px]" aria-hidden="true"/>
              </button>
            </div>

            {/* Step 1: Select type */}
            {step === 1 && (
              <div className="p-6 space-y-3">
                {TIPO_PERSONA.map(t => (
                  <button
                    key={t.key}
                    onClick={() => selectTipo(t.key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${t.border} hover:${t.bg}`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
                      <i className={`ti ${t.icon} text-[22px] ${t.color}`} aria-hidden="true"/>
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[var(--ar-text)]">{t.label}</div>
                      <div className="text-[12px] text-[var(--ar-muted)]">{t.desc}</div>
                      <div className="text-[10px] text-[var(--ar-muted)] mt-1 opacity-60">{t.acceso}</div>
                    </div>
                    <i className="ti ti-chevron-right text-[var(--ar-muted)]" aria-hidden="true"/>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: User data */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${tipoConfig(form.rol).bg}`}>
                  <i className={`ti ${tipoConfig(form.rol).icon} text-[16px] ${tipoConfig(form.rol).color}`} aria-hidden="true"/>
                  <span className={`text-[12px] font-semibold ${tipoConfig(form.rol).color}`}>{tipoConfig(form.rol).label}</span>
                  <button onClick={() => setStep(1)} className="ml-auto text-[10px] text-[var(--ar-muted)] hover:underline">Cambiar</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre *</label>
                    <input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} className="input-base text-[12px]" placeholder="Nombre"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Apellido</label>
                    <input value={form.apellido} onChange={e => setForm(p => ({...p, apellido: e.target.value}))} className="input-base text-[12px]" placeholder="Apellido"/>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="input-base text-[12px]" placeholder="correo@email.com"/>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Contraseña *</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} className="input-base text-[12px] flex-1 font-mono" placeholder="Mínimo 6 caracteres"/>
                    <button type="button" onClick={genPassword} className="btn-secondary text-[10px] py-1.5 px-3 shrink-0">
                      <i className="ti ti-refresh text-[11px]" aria-hidden="true"/> Generar
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--ar-muted)] mt-1">Comparte esta contraseña con la persona para que pueda ingresar</p>
                </div>

                {/* For apoderado: show alumno selection inline */}
                {form.rol === 'apoderado' && (
                  <div className="bg-[#f9f7f5] rounded-xl p-4 border border-[var(--ar-border)]">
                    <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-2">¿Quién es su hijo/a?</label>
                    <select value={alumnoVinc} onChange={e => setAlumnoVinc(e.target.value)} className="select-base w-full text-[12px]">
                      <option value="">— Vincular después —</option>
                      {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
                    </select>
                    {alumnoVinc && (
                      <select value={parentesco} onChange={e => setParentesco(e.target.value)} className="select-base w-full text-[12px] mt-2">
                        {['Apoderado','Madre','Padre','Abuelo/a','Tutor legal','Otro'].map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
                      </select>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-[var(--ar-border)]">
                  <button onClick={() => setStep(1)} className="btn-secondary text-[12px]">
                    <i className="ti ti-arrow-left text-[12px]" aria-hidden="true"/> Volver
                  </button>
                  <button onClick={handleCrear} disabled={loading} className="btn-primary text-[12px]">
                    {loading ? 'Creando...' : 'Crear y enviar acceso'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal vincular */}
      {showVincular && (
        <div className="modal-overlay" onClick={() => setShowVincular(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--ar-border)]">
              <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Vincular con hijo/a</h3>
              <p className="text-[11px] text-[var(--ar-muted)] mt-1">{showVincular.nombre} {showVincular.apellido}</p>
            </div>
            <div className="p-6 space-y-3">
              <select value={alumnoVinc} onChange={e => setAlumnoVinc(e.target.value)} className="select-base w-full text-[12px]">
                <option value="">Seleccionar alumno...</option>
                {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
              </select>
              {alumnoVinc && (
                <select value={parentesco} onChange={e => setParentesco(e.target.value)} className="select-base w-full text-[12px]">
                  {['Apoderado','Madre','Padre','Abuelo/a','Tutor legal','Otro'].map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
                </select>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <button onClick={() => setShowVincular(null)} className="btn-secondary text-[12px]">Cancelar</button>
              <button onClick={handleVincular} disabled={loading || !alumnoVinc} className="btn-primary text-[12px]">{loading ? 'Vinculando...' : 'Vincular'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
