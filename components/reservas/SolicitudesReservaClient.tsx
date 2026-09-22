'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Solicitud {
  id: string
  nombre_solicitante: string
  email: string
  telefono: string | null
  fecha_solicitada: string
  hora_solicitada: string
  tipo_sesion: string
  motivo: string | null
  alumno: { id: string; nombre: string; apellido: string } | null
  profesional: { id: string; nombre: string; apellido: string }
}

interface Props {
  solicitudes: Solicitud[]
  alumnos: { id: string; nombre: string; apellido: string; curso: string }[]
}

export default function SolicitudesReservaClient({ solicitudes, alumnos }: Props) {
  const router = useRouter()
  const [activa, setActiva] = useState<Solicitud | null>(null)
  const [modo, setModo] = useState<'confirmar' | 'rechazar' | null>(null)
  const [alumnoId, setAlumnoId] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [esNuevoPaciente, setEsNuevoPaciente] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [procesando, setProcesando] = useState(false)

  function abrir(s: Solicitud, m: 'confirmar' | 'rechazar') {
    setActiva(s)
    setModo(m)
    setAlumnoId(s.alumno?.id ?? '')
    setEsNuevoPaciente(!s.alumno)
    setNuevoNombre(s.nombre_solicitante.split(' ')[0] ?? '')
    setNuevoApellido(s.nombre_solicitante.split(' ').slice(1).join(' ') ?? '')
    setMotivoRechazo('')
  }

  function cerrar() {
    setActiva(null)
    setModo(null)
  }

  async function confirmar() {
    if (!activa) return
    if (!esNuevoPaciente && !alumnoId) { toast.error('Selecciona un paciente'); return }
    if (esNuevoPaciente && (!nuevoNombre || !nuevoApellido)) { toast.error('Ingresa nombre y apellido del paciente'); return }

    setProcesando(true)
    try {
      const res = await fetch(`/api/reservas-publicas/${activa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'confirmar',
          alumno_id: esNuevoPaciente ? undefined : alumnoId,
          nuevo_alumno: esNuevoPaciente ? { nombre: nuevoNombre, apellido: nuevoApellido } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Sesión confirmada y agendada')
      cerrar()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al confirmar')
    } finally {
      setProcesando(false)
    }
  }

  async function rechazar() {
    if (!activa) return
    setProcesando(true)
    try {
      const res = await fetch(`/api/reservas-publicas/${activa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'rechazar', motivo: motivoRechazo || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Solicitud rechazada')
      cerrar()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al rechazar')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/agenda" className="text-[11px] text-[var(--ar-muted)] hover:text-[var(--ar-text)]">← Volver a Agenda</Link>
          <h1 className="page-title mt-1">Solicitudes de reserva</h1>
          <p className="page-subtitle">Pedidos de hora desde el formulario público, pendientes de confirmar</p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="card p-10 text-center">
          <i className="ti ti-calendar-check text-2xl text-emerald-400 block mb-2" aria-hidden="true"/>
          <p className="text-[13px] text-[var(--ar-muted)]">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {solicitudes.map(s => (
            <div key={s.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--ar-text)]">{s.nombre_solicitante} {s.alumno && <span className="text-[11px] font-normal text-[var(--ar-muted)]">· paciente existente: {s.alumno.nombre} {s.alumno.apellido}</span>}</div>
                <div className="text-[11px] text-[var(--ar-muted)]">{s.email}{s.telefono ? ` · ${s.telefono}` : ''}</div>
                <div className="text-[12px] text-[var(--ar-text)] mt-1">
                  {new Date(s.fecha_solicitada + 'T12:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.hora_solicitada.slice(0, 5)} con {s.profesional.nombre} {s.profesional.apellido}
                </div>
                {s.motivo && <div className="text-[11px] text-[var(--ar-muted)] mt-1 italic">"{s.motivo}"</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => abrir(s, 'rechazar')} className="btn-secondary text-[12px] text-[var(--ar-danger)]">Rechazar</button>
                <button onClick={() => abrir(s, 'confirmar')} className="btn-primary text-[12px]">Confirmar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activa && modo && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={cerrar}>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-[var(--ar-border)] w-[90vw] md:w-[26rem]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--ar-border)]">
              <h3 className="font-bold text-[15px] text-[var(--ar-text)]">{modo === 'confirmar' ? 'Confirmar solicitud' : 'Rechazar solicitud'}</h3>
              <button onClick={cerrar} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
            </div>

            {modo === 'confirmar' ? (
              <div className="p-4 space-y-4">
                <p className="text-[12px] text-[var(--ar-muted)]">
                  {activa.nombre_solicitante} · {new Date(activa.fecha_solicitada + 'T12:00').toLocaleDateString('es-CL')} {activa.hora_solicitada.slice(0, 5)}
                </p>
                <div className="flex items-center gap-4 text-[12px]">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={!esNuevoPaciente} onChange={() => setEsNuevoPaciente(false)} /> Paciente existente</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={esNuevoPaciente} onChange={() => setEsNuevoPaciente(true)} /> Paciente nuevo</label>
                </div>
                {!esNuevoPaciente ? (
                  <select value={alumnoId} onChange={e => setAlumnoId(e.target.value)} className="select-base w-full text-[12px]">
                    <option value="">Seleccionar...</option>
                    {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.curso}</option>)}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre" className="input-base text-[12px]" />
                    <input value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} placeholder="Apellido" className="input-base text-[12px]" />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={cerrar} className="btn-secondary text-[12px]">Cancelar</button>
                  <button onClick={confirmar} disabled={procesando} className="btn-primary text-[12px] disabled:opacity-50">{procesando ? 'Confirmando...' : 'Confirmar y agendar'}</button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo (opcional)" rows={3} className="input-base w-full text-[12px] resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={cerrar} className="btn-secondary text-[12px]">Cancelar</button>
                  <button onClick={rechazar} disabled={procesando} className="btn-primary text-[12px] disabled:opacity-50">{procesando ? 'Rechazando...' : 'Rechazar solicitud'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
