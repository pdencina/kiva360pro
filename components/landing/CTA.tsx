'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="contact" className="py-24 px-6 bg-white">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="relative p-12 rounded-3xl overflow-hidden" style={{ background: 'var(--k-gradient-hero)' }}>
          <div className="absolute inset-0 bg-hero-pattern" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#5B3E9E]/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-[#E85D3A]/10 blur-[60px]" />

          <div className="relative">
            <h2 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-white leading-tight mb-4">
              Transforma la gestión de tu colegio hoy
            </h2>
            <p className="text-[15px] text-white/50 mb-8 max-w-lg mx-auto">
              Agenda una demo personalizada de 30 minutos. Te mostramos cómo Kiva360 se adapta a la realidad de tu institución.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="https://wa.me/56936902642?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Kiva360"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[14px] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--k-gradient-accent)', boxShadow: 'var(--k-glow-coral)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Agendar por WhatsApp
              </a>
              <a
                href="mailto:contacto@kiva360.cl"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-[14px] text-white/70 glass hover:text-white transition-all"
              >
                contacto@kiva360.cl
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
