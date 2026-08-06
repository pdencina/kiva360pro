'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const EditorContrato = dynamic(() => import('./EditorContrato'), { ssr: false })

interface Plantilla {
  id: string; nombre: string; descripcion: string | null
  logo_url: string | null; nombre_institucion: string | null
  rut_institucion: string | null; direccion_institucion: string | null
  representante_nombre: string | null; representante_rut: string | null
  contenido: string; activo: boolean; es_default: boolean
  created_at: string; updated_at: string
}

interface Props { plantillas: Plantilla[] }

const PLANTILLA_DEFAULT = `<h1>CONTRATO DE PRESTACIÓN DE SERVICIOS EDUCACIONALES</h1>

<p>En Santiago, a <strong>{{fecha_hoy}}</strong>, entre <strong>{{nombre_institucion}}</strong>, representada por <strong>{{representante_nombre}}</strong>, en adelante "El Centro", y <strong>{{nombre_apoderado}} {{apellido_apoderado}}</strong>, RUT {{rut_apoderado}}, en adelante "El Apoderado".</p>

<div class="clausula">
<p><span class="clausula-title">PRIMERO:</span> El Centro se compromete a brindar servicios educativos y/o terapéuticos al alumno/a <strong>{{nombre_alumno}} {{apellido_alumno}}</strong>, RUT {{rut_alumno}}, en el programa <strong>{{curso_alumno}}</strong>.</p>
</div>

<div class="clausula">
<p><span class="clausula-title">SEGUNDO:</span> El presente contrato tiene vigencia desde la fecha de firma hasta el término del año escolar {{anio}}, renovable por acuerdo mutuo de las partes.</p>
</div>

<div class="clausula">
<p><span class="clausula-title">TERCERO:</span> El Apoderado se compromete a realizar los aportes económicos según el plan acordado, dentro de los primeros 5 días hábiles de cada mes.</p>
</div>

<div class="clausula">
<p><span class="clausula-title">CUARTO:</span> Ambas partes podrán dar término anticipado al contrato con 30 días de aviso escrito previo.</p>
</div>

<div class="firmas">
<div class="firma-box">
<div class="firma-linea"></div>
<div class="firma-nombre">{{representante_nombre}}</div>
<div class="firma-detalle">Representante Legal</div>
</div>
<div class="firma-box">
<div class="firma-linea"></div>
<div class="firma-nombre">{{nombre_apoderado}} {{apellido_apoderado}}</div>
<div class="firma-detalle">Apoderado/a</div>
</div>
</div>`

export default function PlantillasContratoClient({ plantillas }: Props) {
  const [lista, setLista] = useState<Plantilla[]>(plantillas)
  const [editando, setEditando] = useState<Plantilla | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nombre: '', descripcion: '', logo_url: '',
    nombre_institucion: '', rut_institucion: '',
    direccion_institucion: '', representante_nombre: '',
    representante_rut: '', contenido: PLANTILLA_DEFAULT,
  })

  function abrirEditor(plantilla?: Plantilla) {
    if (plantilla) {
      setEditando(plantilla)
      setForm({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        logo_url: plantilla.logo_url || '',
        nombre_institucion: plantilla.nombre_institucion || '',
        rut_institucion: plantilla.rut_institucion || '',
        direccion_institucion: plantilla.direccion_institucion || '',
        representante_nombre: plantilla.representante_nombre || '',
        representante_rut: plantilla.representante_rut || '',
        contenido: plantilla.contenido,
      })
    } else {
      setEditando(null)
      setForm({ nombre: '', descripcion: '', logo_url: '', nombre_institucion: '', rut_institucion: '', direccion_institucion: '', representante_nombre: '', representante_rut: '', contenido: PLANTILLA_DEFAULT })
    }
    setShowEditor(true)
  }

  async function handleGuardar() {
    if (!form.nombre || !form.contenido) { toast.error('Nombre y contenido requeridos'); return }
    setSaving(true)
    try {
      const method = editando ? 'PATCH' : 'POST'
      const body = editando ? { id: editando.id, ...form } : form
      const res = await fetch('/api/plantillas-contrato', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editando ? 'Plantilla actualizada' : 'Plantilla creada')
      setShowEditor(false)
      window.location.reload()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const res = await fetch(`/api/plantillas-contrato?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Eliminada'); window.location.reload() }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Plantillas de contrato</h1>
          <p className="page-subtitle">Crea y edita los contratos que firman los apoderados</p>
        </div>
        <button onClick={() => abrirEditor()} className="btn-primary">
          <i className="ti ti-plus text-[14px]" aria-hidden="true"/> Nueva plantilla
        </button>
      </div>

      {/* Lista de plantillas */}
      {lista.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="ti ti-file-text text-4xl text-[var(--ar-muted)] opacity-30 mb-3" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">No hay plantillas de contrato</p>
          <button onClick={() => abrirEditor()} className="btn-accent mt-4 text-[12px]"><i className="ti ti-plus" aria-hidden="true"/> Crear plantilla</button>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(p => (
            <div key={p.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3f0f9] flex items-center justify-center">
                  <i className="ti ti-file-certificate text-[18px] text-[#5B3E9E]" aria-hidden="true"/>
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-[var(--ar-text)]">{p.nombre}</h3>
                  <div className="text-[11px] text-[var(--ar-muted)]">
                    {p.nombre_institucion || 'Sin institución'} · Actualizado {new Date(p.updated_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/api/plantillas-contrato/preview?plantilla_id=${p.id}`} target="_blank" className="btn-secondary text-[10px] py-1.5 px-3">
                  <i className="ti ti-eye text-[11px]" aria-hidden="true"/> Vista previa
                </a>
                <button onClick={() => abrirEditor(p)} className="btn-secondary text-[10px] py-1.5 px-3">
                  <i className="ti ti-pencil text-[11px]" aria-hidden="true"/> Editar
                </button>
                <button onClick={() => handleEliminar(p.id)} className="text-[10px] text-red-500 font-medium hover:underline px-2">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowEditor(false)} />

          {/* Editor panel */}
          <div className="relative ml-auto w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full animate-fade-in-scale">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-center justify-between shrink-0">
              <h3 className="text-[15px] font-bold text-[var(--ar-text)]">{editando ? 'Editar plantilla' : 'Nueva plantilla'}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEditor(false)} className="btn-secondary text-[11px]">Cancelar</button>
                <button onClick={handleGuardar} disabled={saving} className="btn-primary text-[11px]">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Branding */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre de la plantilla *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-base text-[12px]" placeholder="Ej: Contrato Matrícula 2026" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">URL del logo</label>
                  <input value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} className="input-base text-[12px]" placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Nombre institución</label>
                  <input value={form.nombre_institucion} onChange={e => setForm({...form, nombre_institucion: e.target.value})} className="input-base text-[12px]" placeholder="Espacio Integral Sakura Kids" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">RUT institución</label>
                  <input value={form.rut_institucion} onChange={e => setForm({...form, rut_institucion: e.target.value})} className="input-base text-[12px]" placeholder="76.xxx.xxx-x" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Representante legal</label>
                  <input value={form.representante_nombre} onChange={e => setForm({...form, representante_nombre: e.target.value})} className="input-base text-[12px]" placeholder="Carolina Rojas" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">RUT representante</label>
                  <input value={form.representante_rut} onChange={e => setForm({...form, representante_rut: e.target.value})} className="input-base text-[12px]" placeholder="12.345.678-9" />
                </div>
              </div>

              {/* Content editor - WYSIWYG */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-2">Contenido del contrato *</label>
                <EditorContrato
                  contenido={form.contenido}
                  onChange={(html) => setForm({...form, contenido: html})}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
