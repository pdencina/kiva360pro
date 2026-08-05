'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  colegio: {
    id: string; nombre: string; direccion: string | null
    telefono: string | null; logo_url: string | null
    color_primario: string | null; color_acento: string | null
  }
}

export default function AdmisionFormClient({ colegio }: Props) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    nombre_alumno: '', edad_alumno: '', diagnostico: '',
    nivel_interes: '', mensaje: '',
  })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const primaryColor = colegio.color_primario || '#0d1b2a'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colegio_id: colegio.id, ...form }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al enviar')
      }
      setEnviado(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: primaryColor + '15' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-[#1A1035] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            ¡Postulación recibida!
          </h1>
          <p className="text-[14px] text-[#5C5470] leading-relaxed mb-6">
            Gracias por tu interés en <strong>{colegio.nombre}</strong>. 
            Nos pondremos en contacto contigo a la brevedad.
          </p>
          <Link href="/" className="text-[13px] font-medium hover:underline" style={{ color: primaryColor }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      {/* Header */}
      <div className="border-b border-[#e2dfd9]" style={{ background: primaryColor }}>
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-4">
          {colegio.logo_url ? (
            <img src={colegio.logo_url} alt={colegio.nombre} className="w-12 h-12 rounded-xl object-cover bg-white" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-[18px] font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {colegio.nombre}
            </h1>
            <p className="text-[12px] text-white/60">Formulario de admisión</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#1A1035]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Postula a nuestro centro
          </h2>
          <p className="text-[14px] text-[#5C5470] mt-2 leading-relaxed">
            Completa el siguiente formulario y nuestro equipo se pondrá en contacto contigo 
            para coordinar una entrevista y conocer las necesidades de tu hijo/a.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del apoderado */}
          <fieldset>
            <legend className="text-[11px] font-bold text-[#5C5470] uppercase tracking-[0.1em] mb-3">
              Datos del apoderado
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Nombre *</label>
                <input
                  type="text" value={form.nombre} required
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ '--tw-ring-color': primaryColor + '30' } as any}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Apellido</label>
                <input
                  type="text" value={form.apellido}
                  onChange={e => setForm({...form, apellido: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Tu apellido"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Email *</label>
                <input
                  type="email" value={form.email} required
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Teléfono</label>
                <input
                  type="tel" value={form.telefono}
                  onChange={e => setForm({...form, telefono: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </fieldset>

          {/* Datos del alumno */}
          <fieldset>
            <legend className="text-[11px] font-bold text-[#5C5470] uppercase tracking-[0.1em] mb-3">
              Datos del alumno/a
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Nombre del alumno/a</label>
                <input
                  type="text" value={form.nombre_alumno}
                  onChange={e => setForm({...form, nombre_alumno: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Nombre del niño/a"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Edad</label>
                <input
                  type="text" value={form.edad_alumno}
                  onChange={e => setForm({...form, edad_alumno: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: 5 años"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Diagnóstico o condición (si aplica)</label>
                <input
                  type="text" value={form.diagnostico}
                  onChange={e => setForm({...form, diagnostico: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: CEA, TDAH, Síndrome de Down, TEL..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Programa de interés</label>
                <select
                  value={form.nivel_interes}
                  onChange={e => setForm({...form, nivel_interes: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] focus:ring-2 focus:border-transparent transition-all outline-none cursor-pointer"
                >
                  <option value="">Seleccionar programa...</option>
                  <option value="educativo_intensivo">Programa Educativo Intensivo</option>
                  <option value="after_school">After School (refuerzo y recreación)</option>
                  <option value="sesiones_individuales">Sesiones individuales (fonoaudiología, T.O., psicología)</option>
                  <option value="evaluacion">Evaluación diagnóstica</option>
                  <option value="otro">Otro / No estoy seguro</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Mensaje */}
          <div>
            <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Mensaje o consulta adicional</label>
            <textarea
              value={form.mensaje}
              onChange={e => setForm({...form, mensaje: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none resize-y"
              placeholder="Cuéntanos sobre las necesidades de tu hijo/a o cualquier consulta que tengas..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ background: primaryColor }}
          >
            {loading ? 'Enviando...' : 'Enviar postulación'}
          </button>

          <p className="text-[11px] text-[#5C5470] text-center">
            Al enviar este formulario, aceptas que tus datos sean utilizados para contactarte 
            sobre el proceso de admisión.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e2dfd9] py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-5 h-5 rounded" />
          <span className="text-[11px] text-[#5C5470]">Powered by <strong>Kiva360</strong></span>
        </div>
      </div>
    </div>
  )
}
