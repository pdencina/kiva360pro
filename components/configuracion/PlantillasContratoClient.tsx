'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Plantilla {
  id: string
  nombre: string
  descripcion: string | null
  contenido: string
  activa: boolean
  created_at: string
}

interface Props { plantillas: Plantilla[] }

export default function PlantillasContratoClient({ plantillas }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Plantilla | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', contenido: '' })
  const [saving, setSaving] = useState(false)

  function abrirNueva() {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', contenido: '' })
    setShowModal(true)
  }

  function abrirEditar(p: Plantilla) {
    setEditando(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', contenido: p.contenido })
    setShowModal(true)
  }

  async function handleGuardar() {
    if (!form.nombre) { toast.error('El nombre es requerido'); return }
    if (!form.contenido) { toast.error('El contenido del contrato es requerido'); return }
    setSaving(true)

    const url = '/api/plantillas-contrato'
    const method = editando ? 'PATCH' : 'POST'
    const body = editando ? { id: editando.id, ...form } : form

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.success(editando ? 'Plantilla actualizada' : 'Plantilla creada')
      setShowModal(false)
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Error al guardar')
    }
    setSaving(false)
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta plantilla de contrato?')) return
    const res = await fetch(`/api/plantillas-contrato?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Plantilla eliminada'); router.refresh() }
    else toast.error('Error al eliminar')
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/configuracion" className="text-sm text-slate-400 hover:text-slate-600">
              <i className="ti ti-arrow-left text-xs" aria-hidden="true"/> Configuración
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Plantillas de Contrato</h1>
          <p className="text-sm text-slate-500 mt-0.5">Crea y gestiona los tipos de contrato que ofrece tu establecimiento</p>
        </div>
        <button onClick={abrirNueva} className="btn-primary">
          <i className="ti ti-plus text-sm" aria-hidden="true"/> Nueva plantilla
        </button>
      </div>

      {plantillas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <i className="ti ti-file-text text-5xl text-slate-300 block mb-3" aria-hidden="true"/>
          <h3 className="font-semibold text-slate-700 mb-1">No hay plantillas de contrato</h3>
          <p className="text-sm text-slate-500 mb-4">Crea tu primera plantilla para usarla al matricular alumnos.</p>
          <button onClick={abrirNueva} className="btn-primary">
            <i className="ti ti-plus text-sm" aria-hidden="true"/> Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between hover:border-slate-300 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{p.nombre}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {p.descripcion && <p className="text-sm text-slate-500 mt-1">{p.descripcion}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  {p.contenido.length > 120 ? p.contenido.slice(0, 120) + '...' : p.contenido}
                </p>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button onClick={() => abrirEditar(p)} className="btn-secondary text-xs">
                  <i className="ti ti-edit text-sm" aria-hidden="true"/> Editar
                </button>
                <button onClick={() => handleEliminar(p.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                  <i className="ti ti-trash text-sm" aria-hidden="true"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{editando ? 'Editar plantilla' : 'Nueva plantilla de contrato'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x" aria-hidden="true"/>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nombre del contrato *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
                  className="input-base"
                  placeholder="Ej: Contrato Terapia Integral"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Descripción (interno)</label>
                <input
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
                  className="input-base"
                  placeholder="Ej: Para niños con diagnóstico TEA nivel 1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contenido del contrato *</label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  className="input-base min-h-[200px] resize-y"
                  placeholder="Escriba el texto completo del contrato. Puede usar variables como {{nombre_alumno}}, {{nombre_apoderado}}, {{rut_apoderado}}, {{fecha}}, {{curso}}..."
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Variables disponibles: {'{{nombre_alumno}}'}, {'{{apellido_alumno}}'}, {'{{nombre_apoderado}}'}, {'{{rut_apoderado}}'}, {'{{curso}}'}, {'{{fecha}}'}, {'{{monto_mensual}}'}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleGuardar} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Guardando...' : editando ? 'Actualizar' : 'Crear plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
