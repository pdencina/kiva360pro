'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Props {
  colegio: {
    id: string; nombre: string; direccion: string | null
    telefono: string | null; logo_url: string | null
    color_primario?: string | null; color_acento?: string | null
  }
  userId?: string
}

interface DocumentFile {
  file: File | null
  preview: string | null
}

const DOCUMENTOS_CONFIG = [
  { key: 'ci_alumno_frente', label: 'CI Alumno (frente)', required: true, icon: 'ti-id' },
  { key: 'ci_alumno_reverso', label: 'CI Alumno (reverso)', required: true, icon: 'ti-id' },
  { key: 'foto_alumno', label: 'Foto del alumno/a', required: true, icon: 'ti-photo' },
  { key: 'ci_apoderado_frente', label: 'CI Apoderado (frente)', required: true, icon: 'ti-id-badge-2' },
  { key: 'ci_apoderado_reverso', label: 'CI Apoderado (reverso)', required: true, icon: 'ti-id-badge-2' },
  { key: 'certificado_nacimiento', label: 'Certificado de nacimiento', required: true, icon: 'ti-file-certificate' },
  { key: 'cuenta_servicio_basico', label: 'Cuenta de servicio básico', required: false, icon: 'ti-home' },
  { key: 'certificado_medico', label: 'Certificado médico', required: false, icon: 'ti-stethoscope' },
]

export default function PostularFormClient({ colegio, userId }: Props) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    nombre_alumno: '', edad_alumno: '', diagnostico: '',
    nivel_interes: '', mensaje: '',
  })
  const [documentos, setDocumentos] = useState<Record<string, DocumentFile>>({})
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const primaryColor = colegio.color_primario || '#0d1b2a'

  function handleFileSelect(key: string, file: File | null) {
    if (!file) {
      setDocumentos(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`El archivo "${file.name}" excede el límite de 5MB`)
      return
    }

    // Validar tipo
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG, WebP o PDF')
      return
    }

    setError('')
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    setDocumentos(prev => ({ ...prev, [key]: { file, preview } }))
  }

  function removeFile(key: string) {
    setDocumentos(prev => {
      const copy = { ...prev }
      if (copy[key]?.preview) URL.revokeObjectURL(copy[key].preview!)
      delete copy[key]
      return copy
    })
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validar documentos requeridos
    const missing = DOCUMENTOS_CONFIG
      .filter(d => d.required && !documentos[d.key]?.file)
      .map(d => d.label)

    if (missing.length > 0) {
      setError(`Faltan documentos requeridos: ${missing.join(', ')}`)
      return
    }

    setLoading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('colegio_id', colegio.id)
      if (userId) formData.append('user_id', userId)
      formData.append('nombre', form.nombre)
      formData.append('apellido', form.apellido)
      formData.append('email', form.email)
      formData.append('telefono', form.telefono)
      formData.append('nombre_alumno', form.nombre_alumno)
      formData.append('edad_alumno', form.edad_alumno)
      formData.append('diagnostico', form.diagnostico)
      formData.append('nivel_interes', form.nivel_interes)
      formData.append('mensaje', form.mensaje)

      // Adjuntar archivos
      for (const [key, doc] of Object.entries(documentos)) {
        if (doc.file) {
          formData.append(key, doc.file)
        }
      }

      setProgress(30)

      const res = await fetch('/api/postular', {
        method: 'POST',
        body: formData,
      })

      setProgress(90)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al enviar la postulación')
      }

      setProgress(100)
      setEnviado(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de éxito
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
            ¡Postulación enviada!
          </h1>
          <p className="text-[14px] text-[#5C5470] leading-relaxed mb-6">
            Gracias por tu interés en <strong>{colegio.nombre}</strong>.
            Hemos recibido tu postulación y documentos correctamente.
            Nos pondremos en contacto contigo a la brevedad.
          </p>
          {userId ? (
            <a href="/portal/postulacion" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#0d1b2a] hover:opacity-90 transition-all">
              <i className="ti ti-eye text-[14px]" aria-hidden="true" />
              Ver estado de mi postulación
            </a>
          ) : (
            <Link href="/" className="text-[13px] font-medium hover:underline" style={{ color: primaryColor }}>
              Volver al inicio
            </Link>
          )}
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
            <p className="text-[12px] text-white/60">Formulario de postulación</p>
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
            Completa el siguiente formulario y adjunta los documentos solicitados.
            Nuestro equipo revisará la postulación y se pondrá en contacto contigo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ '--tw-ring-color': primaryColor + '30' } as any}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Apellido</label>
                <input
                  type="text" value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Tu apellido"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Email *</label>
                <input
                  type="email" value={form.email} required
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Teléfono</label>
                <input
                  type="tel" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
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
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Nombre del alumno/a *</label>
                <input
                  type="text" value={form.nombre_alumno} required
                  onChange={e => setForm({ ...form, nombre_alumno: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Nombre del niño/a"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Edad</label>
                <input
                  type="text" value={form.edad_alumno}
                  onChange={e => setForm({ ...form, edad_alumno: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: 5 años"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Diagnóstico o condición (si aplica)</label>
                <input
                  type="text" value={form.diagnostico}
                  onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: CEA, TDAH, Síndrome de Down, TEL..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Programa de interés</label>
                <select
                  value={form.nivel_interes}
                  onChange={e => setForm({ ...form, nivel_interes: e.target.value })}
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

          {/* Documentos */}
          <fieldset>
            <legend className="text-[11px] font-bold text-[#5C5470] uppercase tracking-[0.1em] mb-2">
              Documentos requeridos
            </legend>
            <p className="text-[12px] text-[#5C5470] mb-4">
              Formatos aceptados: JPG, PNG, WebP o PDF. Máximo 5MB por archivo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENTOS_CONFIG.map(doc => {
                const uploaded = documentos[doc.key]
                return (
                  <div key={doc.key} className="relative">
                    <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">
                      {doc.label} {doc.required && <span className="text-red-400">*</span>}
                    </label>
                    {uploaded?.file ? (
                      <div className="flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-xl">
                        {uploaded.preview ? (
                          <img src={uploaded.preview} alt={doc.label} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <i className="ti ti-file-type-pdf text-blue-500 text-[18px]" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1A1035] truncate">{uploaded.file.name}</p>
                          <p className="text-[11px] text-[#5C5470]">{(uploaded.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                          aria-label={`Eliminar ${doc.label}`}
                        >
                          <i className="ti ti-x text-red-500 text-[14px]" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className="flex items-center gap-3 p-3 bg-white border border-dashed border-[#d1cdc7] rounded-xl cursor-pointer hover:border-[#999] hover:bg-[#faf9f7] transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#f4f2ef] flex items-center justify-center flex-shrink-0">
                          <i className={`ti ${doc.icon} text-[#5C5470] text-[18px]`} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#5C5470]">Seleccionar archivo</p>
                          <p className="text-[11px] text-[#9a9a9a]">JPG, PNG, WebP o PDF</p>
                        </div>
                        <i className="ti ti-upload text-[#b0b7c3] text-[16px] flex-shrink-0" aria-hidden="true" />
                        <input
                          ref={el => { fileInputRefs.current[doc.key] = el }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="sr-only"
                          onChange={e => handleFileSelect(doc.key, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          {/* Mensaje */}
          <div>
            <label className="block text-[12px] font-medium text-[#1A1035] mb-1.5">Mensaje o consulta adicional</label>
            <textarea
              value={form.mensaje}
              onChange={e => setForm({ ...form, mensaje: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[#e2dfd9] rounded-xl text-[14px] text-[#1A1035] placeholder-[#b0b7c3] focus:ring-2 focus:border-transparent transition-all outline-none resize-y"
              placeholder="Cuéntanos sobre las necesidades de tu hijo/a o cualquier consulta..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
              {error}
            </div>
          )}

          {/* Progress bar durante envío */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#5C5470]">
                <span>Subiendo documentos...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e2dfd9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%`, background: primaryColor }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ background: primaryColor }}
          >
            {loading ? 'Enviando postulación...' : 'Enviar postulación'}
          </button>

          <p className="text-center text-[11px] text-[#9a9a9a]">
            Al enviar este formulario aceptas que tus datos sean procesados para el proceso de admisión.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e2dfd9] py-6">
        <p className="text-center text-[11px] text-[#9a9a9a]">
          Potenciado por <a href="https://kiva360.com" className="font-medium hover:underline" style={{ color: primaryColor }}>Kiva360</a>
        </p>
      </div>
    </div>
  )
}
