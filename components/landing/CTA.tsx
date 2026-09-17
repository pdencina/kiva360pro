'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

export default function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [form, setForm] = useState({
    nombre: '',
    centro: '',
    email: '',
    telefono: '',
    alumnos: '',
    mensaje: '',
    website: '', // honeypot
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'No se pudo enviar. Intenta por WhatsApp.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('No se pudo enviar. Intenta por WhatsApp.')
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#E85D3A]/60 focus:bg-white/[0.09] transition-all'

  return (
    <section id="contact" className="py-24 px-6 bg-white">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="relative p-8 sm:p-12 rounded-3xl overflow-hidden" style={{ background: 'var(--k-gradient-hero)' }}>
          <div className="absolute inset-0 bg-hero-pattern" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#5B3E9E]/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-[#E85D3A]/10 blur-[60px]" />

          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-white leading-tight mb-4">
                Transforma la gestión de tu centro hoy
              </h2>
              <p className="text-[15px] text-white/50 max-w-lg mx-auto">
                Déjanos tus datos y coordinamos una demo personalizada de 30 minutos. Te mostramos cómo Kiva360 se adapta a tu institución.
              </p>
            </div>

            {status === 'success' ? (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#4A9E7A]/20 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4A9E7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-display text-[20px] font-bold text-white mb-2">¡Solicitud recibida!</h3>
                <p className="text-[14px] text-white/60 mb-6">
                  Te contactaremos dentro de las próximas horas hábiles. Revisa tu correo, te enviamos una confirmación.
                </p>
                <a
                  href="https://wa.me/56949616038?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Kiva360"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[13px] text-white bg-[#4A9E7A] hover:bg-[#3d8567] transition-all"
                >
                  ¿Prefieres hablar ahora? Escríbenos por WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre *"
                    value={form.nombre}
                    onChange={update('nombre')}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Nombre del centro / colegio"
                    value={form.centro}
                    onChange={update('centro')}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={form.email}
                    onChange={update('email')}
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono / WhatsApp"
                    value={form.telefono}
                    onChange={update('telefono')}
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  placeholder="¿Cuántos alumnos tiene tu centro? (aprox.)"
                  value={form.alumnos}
                  onChange={update('alumnos')}
                  className={`${inputClass} mt-4`}
                />
                <textarea
                  placeholder="Cuéntanos brevemente qué necesitas (opcional)"
                  value={form.mensaje}
                  onChange={update('mensaje')}
                  rows={3}
                  className={`${inputClass} mt-4 resize-none`}
                />

                {/* Honeypot: oculto para humanos */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={update('website')}
                  className="absolute left-[-9999px] w-px h-px opacity-0"
                  aria-hidden="true"
                />

                {status === 'error' && (
                  <p className="text-[13px] text-[#ff9b85] mt-4 text-center">{errorMsg}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[14px] text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 w-full sm:w-auto justify-center"
                    style={{ background: 'var(--k-gradient-accent)', boxShadow: 'var(--k-glow-coral)' }}
                  >
                    {status === 'sending' ? 'Enviando...' : 'Agendar demo gratuita'}
                  </button>
                  <a
                    href="https://wa.me/56949616038?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Kiva360"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-[14px] text-white/70 glass hover:text-white transition-all w-full sm:w-auto justify-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
                <p className="text-[11px] text-white/30 text-center mt-4">
                  También puedes escribirnos a{' '}
                  <a href="mailto:pablo@kiva360.cl" className="underline hover:text-white/60">pablo@kiva360.cl</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
