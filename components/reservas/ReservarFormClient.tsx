'use client'

import { useState, useEffect } from 'react'

interface Props {
  colegio: { id: string; nombre: string; logo_url: string | null }
  profesionales: { id: string; nombre: string; apellido: string }[]
}

export default function ReservarFormClient({ colegio, profesionales }: Props) {
  const [profesionalId, setProfesionalId] = useState('')
  const [tipoSesion, setTipoSesion] = useState<'individual' | 'evaluacion'>('individual')
  const [fecha, setFecha] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [hora, setHora] = useState('')

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [motivo, setMotivo] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profesionalId || !fecha) { setSlots([]); setHora(''); return }
    setLoadingSlots(true)
    setHora('')
    fetch(`/api/reservas-publicas/disponibilidad?colegio_id=${colegio.id}&profesional_id=${profesionalId}&fecha=${fecha}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [profesionalId, fecha, colegio.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!profesionalId || !fecha || !hora || !nombre || !email) {
      setError('Completa todos los campos requeridos.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/reservas-publicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colegio_id: colegio.id,
          nombre_solicitante: nombre,
          email,
          telefono: telefono || undefined,
          profesional_id: profesionalId,
          tipo_sesion: tipoSesion,
          fecha_solicitada: fecha,
          hora_solicitada: hora,
          motivo: motivo || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud')
      setExito(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ar-bg)] p-6">
        <div className="max-w-md text-center bg-white border border-[var(--ar-border)] rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          <i className="ti ti-circle-check text-4xl text-emerald-500 block mb-3" aria-hidden="true"/>
          <h1 className="text-[16px] font-bold text-[var(--ar-text)] mb-1">Solicitud enviada</h1>
          <p className="text-[13px] text-[var(--ar-muted)]">
            {colegio.nombre} confirmará tu hora del {new Date(fecha + 'T12:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora} y te avisaremos a <strong>{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ar-bg)] py-10 px-4">
      <div className="max-w-md mx-auto bg-white border border-[var(--ar-border)] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="px-6 py-5 border-b border-[var(--ar-border)]">
          <h1 className="text-[16px] font-bold text-[var(--ar-text)]">Reservar hora</h1>
          <p className="text-[12px] text-[var(--ar-muted)]">{colegio.nombre}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Profesional</label>
            <select value={profesionalId} onChange={e => setProfesionalId(e.target.value)} className="select-base w-full" required>
              <option value="">Selecciona...</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Tipo de sesión</label>
            <select value={tipoSesion} onChange={e => setTipoSesion(e.target.value as any)} className="select-base w-full">
              <option value="individual">Sesión individual</option>
              <option value="evaluacion">Evaluación</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Fecha</label>
            <input type="date" min={hoy} value={fecha} onChange={e => setFecha(e.target.value)} className="input-base w-full" required disabled={!profesionalId} />
          </div>

          {fecha && profesionalId && (
            <div>
              <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Horario disponible</label>
              {loadingSlots ? (
                <p className="text-[12px] text-[var(--ar-muted)]">Buscando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)]">Sin horarios disponibles ese día. Prueba otra fecha.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(s => (
                    <button type="button" key={s} onClick={() => setHora(s)}
                      className={`text-[12px] py-2 rounded-lg border transition-colors ${hora === s ? 'bg-[var(--ar-navy)] text-white border-[var(--ar-navy)]' : 'border-[var(--ar-border)] text-[var(--ar-text)] hover:border-[var(--ar-navy)]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-[var(--ar-border)] pt-4 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Tu nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} className="input-base w-full" required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base w-full" required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Teléfono (opcional)</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} className="input-base w-full" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Motivo de consulta (opcional)</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2} className="input-base w-full resize-none" />
            </div>
          </div>

          {error && <p className="text-[12px] text-[var(--ar-danger)]">{error}</p>}

          <button type="submit" disabled={enviando || !hora} className="btn-primary w-full disabled:opacity-50">
            {enviando ? 'Enviando...' : 'Solicitar hora'}
          </button>
        </form>
      </div>
    </div>
  )
}
