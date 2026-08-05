'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Matrícula digital',
    description: 'Proceso de matrícula 100% online con firma digital, contratos automáticos y seguimiento en tiempo real.',
    color: '#5B3E9E',
    bgColor: '#f3f0f9',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
    title: 'Asistencia inteligente',
    description: 'Control por bloque horario con alertas automáticas a apoderados y reportes de inasistencia acumulada.',
    color: '#4A9E7A',
    bgColor: '#edf7f2',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Calificaciones y evaluaciones',
    description: 'Libro de clases digital con cálculo automático de promedios, informes por alumno y exportación PDF.',
    color: '#E85D3A',
    bgColor: '#fef0ec',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Cobranzas automatizadas',
    description: 'Emisión de cobros, recordatorios por email, registro de pagos y dashboard de morosidad en tiempo real.',
    color: '#2D1B69',
    bgColor: '#f0ecf9',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Comunicación con familias',
    description: 'Comunicados masivos, mensajería directa y reportes diarios que los apoderados realmente leen.',
    color: '#5B3E9E',
    bgColor: '#f3f0f9',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Fichas pedagógicas',
    description: 'Biblioteca digital filtrable por materia y grado. Comparte material entre docentes de forma organizada.',
    color: '#4A9E7A',
    bgColor: '#edf7f2',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-6 rounded-2xl border border-[#e2dfd9]/60 bg-white hover:border-transparent hover:shadow-xl transition-all duration-300"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--k-gradient-card)' }} />
      
      <div className="relative">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: feature.bgColor, color: feature.color }}
        >
          {feature.icon}
        </div>
        <h3 className="font-display text-[16px] font-bold text-[#1A1035] mb-2">
          {feature.title}
        </h3>
        <p className="text-[13px] text-[#5C5470] leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

export default function Features() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 px-6 bg-[#F9F7F5]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-[11px] font-semibold text-[#E85D3A] uppercase tracking-[0.15em] mb-4">
            Funcionalidades
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            Todo lo que tu colegio necesita,{' '}
            <span className="text-gradient-brand">en un solo lugar</span>
          </h2>
          <p className="text-[15px] text-[#5C5470] leading-relaxed">
            Diseñado por equipos que entienden la realidad de los colegios chilenos. 
            Sin complejidades innecesarias, con resultados inmediatos.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
