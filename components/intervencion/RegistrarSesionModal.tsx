'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  planId: string
  objetivos: { id: string; area: string; descripcion: string }[]
  onClose: () => void
}

export default function RegistrarSesionModal({ planId, objetivos, onClose }: Props) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    duracion_min: '',
    tipo_sesion: 'individual',
    modalidad: 'presencial',
    objetivos_trabajados: [] as string[],
    actividades: '',
    observaciones: '',
    logros: '',
    dificultades: '',
    estado_ingreso: '',
    estado_egreso: '',
    indicaciones_familia: '',
    proximos_pasos: '',
    asistio: true,
    motivo_inasistencia: '',
  })
  const [saving, setSaving] = useState(false)

  function toggleObjetivo(id: string) {
    setForm(f => ({
      ...f,
      objetivos_trabajados: f.objetivos_trabajados.includes(id)
        ? f.objetivos_trabajados.filter(o => o !== id)
        : [...f.objetivos_trabajados, id]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        plan_id: planId,
        ...form,
        duracion_min: form.duracion_min ? parseInt(form.duracion_min) : null,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        estado_ingreso: form.estado_ingreso || null,
        estado_egreso: form.estado_egreso || null,
      }
      const res = await fetch('/api/intervencion/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Sesión registrada')
      onClose()
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  const ESTADOS_REGULACION = [
    { value: '', label: 'No registrar' },
    { value: 'regulado', label: 'Regulado' },
    { value: 'levemente_desregulado', label: 'Levemente desregulado' },
    { value: 'desregulado', label: 'Desregulado' },
    { value: 'crisis', label: 'Crisis' },
  ]

  const AREA_LABELS: Record<string, string> = {
    comunicacion: 'COM', cognitivo: 'COG', socioemocional: 'SOC',
    motor_grueso: 'MG', motor_fino: 'MF', autonomia: 'AUT',
    conducta: 'CON', academico: 'ACA', sensorial: 'SEN', otro: 'OTR',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)] sticky top-0 bg-white z-10">
          <h3 className="text-[15px] font-bold text-[var(--ar-text)] font-display">Registrar sesión terapéutica</h3>
          <p className="text-[11px] text-[var(--ar-muted)] mt-1">Completa los campos relevantes para esta sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Asistencia toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f9f7f5] border border-[var(--ar-border)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.asistio} onChange={e => setForm({...form, asistio: e.target.checked})} className="w-4 h-4 rounded" />
              <span className="text-[12px] font-medium text-[var(--ar-text)]">El alumno asistió a la sesión</span>
            </label>
          </div>

          {!form.asistio && (
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Motivo de inasistencia</label>
              <input value={form.motivo_inasistencia} onChange={e => setForm({...form, motivo_inasistencia: e.target.value})} className="input-base text-[12px]" placeholder="Enfermedad, viaje, etc." />
            </div>
          )}

          {/* Datos básicos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="input-base text-[12px]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora inicio</label>
              <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} className="input-base text-[12px]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Hora fin</label>
              <input type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} className="input-base text-[12px]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Duración (min)</label>
              <input type="number" value={form.duracion_min} onChange={e => setForm({...form, duracion_min: e.target.value})} className="input-base text-[12px]" placeholder="45" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Tipo de sesión</label>
              <select value={form.tipo_sesion} onChange={e => setForm({...form, tipo_sesion: e.target.value})} className="select-base w-full text-[12px]">
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
                <option value="familiar">Familiar</option>
                <option value="evaluacion">Evaluación</option>
                <option value="coordinacion">Coordinación</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})} className="select-base w-full text-[12px]">
                <option value="presencial">Presencial</option>
                <option value="remota">Remota</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </div>
          </div>

          {/* Objetivos trabajados */}
          {objetivos.length > 0 && form.asistio && (
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-2">Objetivos trabajados</label>
              <div className="flex flex-wrap gap-2">
                {objetivos.map(obj => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleObjetivo(obj.id)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                      form.objetivos_trabajados.includes(obj.id)
                        ? 'bg-[#5B3E9E] text-white border-[#5B3E9E]'
                        : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)] hover:border-[#5B3E9E]/50'
                    }`}
                  >
                    <span className="font-bold mr-1">{AREA_LABELS[obj.area]}</span>
                    {obj.descripcion.slice(0, 40)}{obj.descripcion.length > 40 ? '...' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estado emocional */}
          {form.asistio && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Estado al ingreso</label>
                <select value={form.estado_ingreso} onChange={e => setForm({...form, estado_ingreso: e.target.value})} className="select-base w-full text-[12px]">
                  {ESTADOS_REGULACION.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Estado al egreso</label>
                <select value={form.estado_egreso} onChange={e => setForm({...form, estado_egreso: e.target.value})} className="select-base w-full text-[12px]">
                  {ESTADOS_REGULACION.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Contenido clínico */}
          {form.asistio && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Actividades realizadas</label>
                <textarea value={form.actividades} onChange={e => setForm({...form, actividades: e.target.value})} className="input-base min-h-[60px] text-[12px]" placeholder="Describe las actividades de la sesión..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Logros observados</label>
                  <textarea value={form.logros} onChange={e => setForm({...form, logros: e.target.value})} className="input-base min-h-[50px] text-[12px]" placeholder="Avances o logros en esta sesión..." />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Dificultades</label>
                  <textarea value={form.dificultades} onChange={e => setForm({...form, dificultades: e.target.value})} className="input-base min-h-[50px] text-[12px]" placeholder="Dificultades presentadas..." />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Observaciones clínicas</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className="input-base min-h-[50px] text-[12px]" placeholder="Observaciones relevantes..." />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Indicaciones para la familia</label>
                <textarea value={form.indicaciones_familia} onChange={e => setForm({...form, indicaciones_familia: e.target.value})} className="input-base min-h-[40px] text-[12px]" placeholder="Qué trabajar en casa, recomendaciones..." />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--ar-border)] sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-[12px]">
              {saving ? 'Guardando...' : 'Registrar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
