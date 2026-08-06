'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Props {
  alumnoId: string
  rol: string
}

interface Documento {
  id: string; nombre: string; tipo: string; archivo_url: string
  solo_director: boolean; visible_familia: boolean; descripcion: string | null
  created_at: string; subido: { nombre: string; apellido: string } | null
}

interface Informe {
  id: string; titulo: string; tipo: string; especialidad: string | null
  contenido: string | null; archivo_url: string | null; fecha: string
  periodo: string | null; visible_familia: boolean
  profesional: { nombre: string; apellido: string }
}

type Tab = 'pedagogica' | 'terapeutica' | 'documentos'

const TIPO_DOC_LABELS: Record<string, string> = {
  carne_identidad: 'Carné de identidad', certificado_nacimiento: 'Cert. nacimiento',
  certificado_domicilio: 'Cert. domicilio', informe_medico: 'Informe médico',
  certificado_discapacidad: 'Cert. discapacidad', evaluacion_diagnostica: 'Eval. diagnóstica', otro: 'Otro',
}

const TIPO_INFORME_LABELS: Record<string, string> = {
  ingreso: 'Ingreso', periodico: 'Periódico', avance: 'Avance',
  alta: 'Alta', derivacion: 'Derivación', otro: 'Otro',
}

const ESPECIALIDAD_COLORS: Record<string, string> = {
  fonoaudiologa: '#5B3E9E', terapeuta_ocupacional: '#E85D3A',
  psicologa: '#3D7A94', psicopedagoga: '#4A9E7A',
  'kinesióloga': '#B86E00', educadora_diferencial: '#2D1B69',
}

export default function FichaTabsClient({ alumnoId, rol }: Props) {
  const [tab, setTab] = useState<Tab>('terapeutica')
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(true)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showInformeModal, setShowInformeModal] = useState(false)

  const isAdmin = ['super_admin', 'admin'].includes(rol)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const res = await window.fetch(`/api/ficha-alumno?alumno_id=${alumnoId}`)
        if (res.ok) {
          const data = await res.json()
          setDocumentos(data.documentos)
          setInformes(data.informes)
        }
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [alumnoId])

  const tabs: { key: Tab; label: string; icon: string; show: boolean }[] = [
    { key: 'terapeutica', label: 'Terapéutica', icon: 'ti-heart-handshake', show: true },
    { key: 'pedagogica', label: 'Pedagógica', icon: 'ti-book', show: true },
    { key: 'documentos', label: 'Documentos', icon: 'ti-folder', show: isAdmin },
  ]

  return (
    <div className="mt-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[var(--ar-border)] mb-4">
        {tabs.filter(t => t.show).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium border-b-2 transition-all ${
              tab === t.key ? 'border-[var(--ar-accent)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)] hover:text-[var(--ar-text)]'
            }`}>
            <i className={`ti ${t.icon} text-[13px]`} aria-hidden="true"/>{t.label}
            {t.key === 'terapeutica' && <span className="text-[9px] bg-[#f3f0f9] text-[#5B3E9E] px-1.5 rounded-full font-bold">{informes.length}</span>}
            {t.key === 'documentos' && <span className="text-[9px] bg-[#f9f7f5] text-[var(--ar-muted)] px-1.5 rounded-full font-bold">{documentos.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'terapeutica' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-[var(--ar-text)]">Informes terapéuticos</h3>
            <button onClick={() => setShowInformeModal(true)} className="btn-primary text-[10px] py-1.5 px-3">
              <i className="ti ti-plus text-[11px]" aria-hidden="true"/> Subir informe
            </button>
          </div>
          {informes.length === 0 ? (
            <p className="text-[12px] text-[var(--ar-muted)] py-4 text-center">Sin informes terapéuticos</p>
          ) : (
            <div className="space-y-2">
              {informes.map(inf => (
                <div key={inf.id} className="bg-white border border-[var(--ar-border)] rounded-xl p-4 flex items-start gap-3" style={{ borderLeftWidth: 3, borderLeftColor: ESPECIALIDAD_COLORS[inf.especialidad || ''] || '#5C5470' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-[var(--ar-text)]">{inf.titulo}</span>
                      <span className="tag tag-blue text-[9px]">{TIPO_INFORME_LABELS[inf.tipo]}</span>
                      {inf.visible_familia && <span className="text-[9px] text-emerald-600 font-medium">👁 Familia</span>}
                    </div>
                    {inf.contenido && <p className="text-[11px] text-[var(--ar-muted)] line-clamp-2 mb-1">{inf.contenido}</p>}
                    <div className="text-[10px] text-[var(--ar-muted)]">
                      {inf.profesional.nombre} {inf.profesional.apellido} · {new Date(inf.fecha + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {inf.periodo && ` · ${inf.periodo}`}
                    </div>
                  </div>
                  {inf.archivo_url && (
                    <a href={inf.archivo_url} target="_blank" className="btn-secondary text-[10px] py-1 px-2 shrink-0">
                      <i className="ti ti-download text-[11px]" aria-hidden="true"/> PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'pedagogica' && (
        <div>
          <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-3">Evaluaciones pedagógicas</h3>
          <p className="text-[11px] text-[var(--ar-muted)] mb-3">Las evaluaciones pedagógicas se encuentran en el módulo de <a href="/calificaciones" className="text-[var(--ar-accent)] font-medium hover:underline">Calificaciones</a>.</p>
          <div className="bg-[#f9f7f5] rounded-xl p-4 border border-[var(--ar-border)]">
            <p className="text-[11px] text-[var(--ar-muted)]">
              La sección pedagógica incluye notas por asignatura, promedios y el libro de clases. 
              Para ver evaluaciones de este alumno, visita <a href={`/calificaciones?alumno=${alumnoId}`} className="text-[var(--ar-accent)] font-medium hover:underline">Evaluaciones →</a>
            </p>
          </div>
        </div>
      )}

      {tab === 'documentos' && isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-[var(--ar-text)]">Documentos escaneados</h3>
            <button onClick={() => setShowDocModal(true)} className="btn-primary text-[10px] py-1.5 px-3">
              <i className="ti ti-upload text-[11px]" aria-hidden="true"/> Subir documento
            </button>
          </div>
          <p className="text-[10px] text-amber-600 mb-3 flex items-center gap-1">
            <i className="ti ti-lock text-[11px]" aria-hidden="true"/> Solo visible para director/administrador
          </p>
          {documentos.length === 0 ? (
            <p className="text-[12px] text-[var(--ar-muted)] py-4 text-center">Sin documentos subidos</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {documentos.map(doc => (
                <div key={doc.id} className="bg-white border border-[var(--ar-border)] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#f3f0f9] flex items-center justify-center">
                      <i className="ti ti-file text-[14px] text-[#5B3E9E]" aria-hidden="true"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[var(--ar-text)] truncate">{doc.nombre}</div>
                      <div className="text-[9px] text-[var(--ar-muted)]">{TIPO_DOC_LABELS[doc.tipo]}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[var(--ar-muted)]">{new Date(doc.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <a href={doc.archivo_url} target="_blank" className="text-[10px] text-[var(--ar-accent)] font-medium hover:underline">Descargar</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Subir Informe */}
      {showInformeModal && <ModalInforme alumnoId={alumnoId} onClose={() => setShowInformeModal(false)} />}
      {/* Modal: Subir Documento */}
      {showDocModal && <ModalDocumento alumnoId={alumnoId} onClose={() => setShowDocModal(false)} />}
    </div>
  )
}

// ─── MODAL: SUBIR INFORME ───
function ModalInforme({ alumnoId, onClose }: { alumnoId: string; onClose: () => void }) {
  const [form, setForm] = useState({ titulo: '', tipo: 'periodico', especialidad: '', contenido: '', archivo_url: '', periodo: '', visible_familia: false })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/ficha-alumno', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'informe', alumno_id: alumnoId, ...form }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Informe guardado')
      onClose(); window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Subir informe terapéutico</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Título *</label>
            <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Informe Fonoaudiológico Semestre 1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select-base w-full text-[12px]">
                <option value="ingreso">Ingreso</option><option value="periodico">Periódico</option>
                <option value="avance">Avance</option><option value="alta">Alta</option>
                <option value="derivacion">Derivación</option><option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Especialidad</label>
              <select value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} className="select-base w-full text-[12px]">
                <option value="">General</option>
                <option value="fonoaudiologa">Fonoaudiología</option>
                <option value="terapeuta_ocupacional">Terapia Ocupacional</option>
                <option value="psicologa">Psicología</option>
                <option value="psicopedagoga">Psicopedagogía</option>
                <option value="kinesióloga">Kinesiología</option>
                <option value="educadora_diferencial">Ed. Diferencial</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Período</label>
            <input value={form.periodo} onChange={e => setForm({...form, periodo: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Semestre 1 2026, Marzo-Julio 2026" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Resumen / Contenido</label>
            <textarea value={form.contenido} onChange={e => setForm({...form, contenido: e.target.value})} className="input-base text-[12px] min-h-[80px]" placeholder="Resumen del informe (opcional si adjuntas PDF)..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">URL del archivo (PDF)</label>
            <input value={form.archivo_url} onChange={e => setForm({...form, archivo_url: e.target.value})} className="input-base text-[12px]" placeholder="https://... (subir a Supabase Storage)" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.visible_familia} onChange={e => setForm({...form, visible_familia: e.target.checked})} className="rounded"/>
            <span className="text-[12px] text-[var(--ar-text)]">Visible para la familia (pueden descargarlo)</span>
          </label>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Guardando...' : 'Guardar informe'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL: SUBIR DOCUMENTO ───
function ModalDocumento({ alumnoId, onClose }: { alumnoId: string; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'otro', archivo_url: '', solo_director: true, visible_familia: false, descripcion: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/ficha-alumno', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'documento', alumno_id: alumnoId, ...form }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Documento guardado')
      onClose(); window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)]">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Subir documento</h3>
          <p className="text-[10px] text-amber-600 mt-1"><i className="ti ti-lock text-[10px]" aria-hidden="true"/> Solo visible para director</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre del documento *</label>
            <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Carné de identidad" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select-base w-full text-[12px]">
              <option value="carne_identidad">Carné de identidad</option>
              <option value="certificado_nacimiento">Certificado de nacimiento</option>
              <option value="certificado_domicilio">Certificado de domicilio</option>
              <option value="informe_medico">Informe médico</option>
              <option value="certificado_discapacidad">Certificado de discapacidad</option>
              <option value="evaluacion_diagnostica">Evaluación diagnóstica</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">URL del archivo *</label>
            <input value={form.archivo_url} onChange={e => setForm({...form, archivo_url: e.target.value})} className="input-base text-[12px]" placeholder="https://... (subir a Supabase Storage)" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Descripción (opcional)</label>
            <input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="input-base text-[12px]" placeholder="Notas adicionales..." />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ar-border)]">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">{saving ? 'Subiendo...' : 'Guardar documento'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
