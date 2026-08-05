'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  { value: '+15', label: 'Colegios activos', suffix: '' },
  { value: '+2,500', label: 'Alumnos gestionados', suffix: '' },
  { value: '94%', label: 'Tasa de asistencia promedio', suffix: '' },
  { value: '<3min', label: 'Para registrar asistencia de un curso', suffix: '' },
]

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'var(--k-gradient-hero)' }}>
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#5B3E9E]/10 blur-[100px]" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center"
            >
              <div className="font-display text-[clamp(1.5rem,4vw,3rem)] font-bold text-white mb-1">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-[12px] text-white/50 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
