'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const antes = [
  'Reportes en papel que se pierden o no llegan a las familias',
  'Correos sueltos y grupos de WhatsApp desordenados',
  'Carpetas físicas con fichas, contratos e informes',
  'Asistencia y notas en cuadernos o planillas Excel',
  'Cobranzas manuales y difíciles de seguir',
  'Cada persona ve todos los archivos, sin control por perfil',
]

const despues = [
  'Reporte diario digital que las familias reciben al instante',
  'Comunicación centralizada: comunicados, mensajes y avisos en un lugar',
  'Fichas, contratos e informes firmados digitalmente y siempre disponibles',
  'Asistencia, evaluaciones y planes de intervención en línea',
  'Cobranza automatizada con recordatorios y pago en línea',
  'Cada perfil ve solo lo que le corresponde, con datos protegidos',
]

export default function AntesDespues() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 px-6 bg-[#F9F7F5]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block text-[11px] font-semibold text-[#E85D3A] uppercase tracking-[0.15em] mb-4">
            El cambio
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            Del papel al orden digital
          </h2>
          <p className="text-[15px] text-[#5C5470]">
            Así se transforma el día a día de un centro cuando deja atrás lo manual.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ANTES */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-[#e2dfd9] bg-white p-7"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-8 h-8 rounded-lg bg-[#f3f0ed] flex items-center justify-center text-[16px]">📋</span>
              <h3 className="font-display text-[16px] font-bold text-[#8a8577]">Antes, sin Kiva360</h3>
            </div>
            <ul className="space-y-3.5">
              {antes.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                    <circle cx="10" cy="10" r="9" fill="#94a3b8" opacity="0.15" />
                    <path d="M7 7l6 6M13 7l-6 6" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span className="text-[13.5px] text-[#5C5470] leading-relaxed line-through decoration-[#cbd5e1]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CON KIVA360 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-2xl border-2 border-[#5B3E9E]/20 bg-white p-7 shadow-[0_12px_40px_rgba(91,62,158,0.08)] relative"
          >
            <div className="absolute -top-3 left-7 px-3 py-1 rounded-full bg-[#5B3E9E] text-white text-[10px] font-semibold tracking-wide">
              CON KIVA360
            </div>
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-8 h-8 rounded-lg bg-[#f3f0f9] flex items-center justify-center text-[16px]">✨</span>
              <h3 className="font-display text-[16px] font-bold text-[#1A1035]">Todo en una plataforma</h3>
            </div>
            <ul className="space-y-3.5">
              {despues.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                    <circle cx="10" cy="10" r="9" fill="#4A9E7A" opacity="0.15" />
                    <path d="M6 10l2.5 2.5L14 7" stroke="#4A9E7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13.5px] text-[#1A1035] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
