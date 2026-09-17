'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const pasos = [
  {
    numero: '01',
    titulo: 'Agenda tu demo',
    descripcion:
      'Coordinamos una llamada de 30 minutos donde conocemos tu centro y te mostramos la plataforma funcionando con casos reales.',
    icon: (
      <path d="M8 2v3M16 2v3M3.5 9h17M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    numero: '02',
    titulo: 'Configuramos tu centro',
    descripcion:
      'Cargamos tus cursos, alumnos y programas, y adaptamos evaluaciones, reportes y permisos a la realidad de tu institución.',
    icon: (
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    numero: '03',
    titulo: 'Tu equipo operando en una semana',
    descripcion:
      'Capacitamos a tu equipo y a las familias. En días dejas atrás el papel, los correos sueltos y las carpetas: todo queda en un solo lugar.',
    icon: (
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
]

export default function ComoFunciona() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="como-funciona" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-[11px] font-semibold text-[#E85D3A] uppercase tracking-[0.15em] mb-4">
            Cómo funciona
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            De la primera llamada<br />a operar en una semana
          </h2>
          <p className="text-[15px] text-[#5C5470]">
            Sin proyectos eternos ni migraciones interminables. Te acompañamos en cada paso.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Línea conectora en desktop */}
          <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-px bg-gradient-to-r from-[#e2dfd9] via-[#c9a3d4]/50 to-[#e2dfd9]" />

          {pasos.map((paso, i) => (
            <motion.div
              key={paso.numero}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="relative text-center px-4"
            >
              <div className="relative z-10 w-[88px] h-[88px] mx-auto mb-6 rounded-2xl bg-white border border-[#e2dfd9] shadow-[0_8px_30px_rgba(26,16,53,0.06)] flex items-center justify-center text-[#5B3E9E]">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  {paso.icon}
                </svg>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#E85D3A] text-white text-[11px] font-bold flex items-center justify-center">
                  {paso.numero}
                </span>
              </div>
              <h3 className="font-display text-[17px] font-bold text-[#1A1035] mb-2">{paso.titulo}</h3>
              <p className="text-[13px] text-[#5C5470] leading-relaxed">{paso.descripcion}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
