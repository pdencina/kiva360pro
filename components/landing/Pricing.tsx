'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const plans = [
  {
    name: 'Starter',
    description: 'Para centros pequeños que quieren profesionalizarse',
    features: [
      'Hasta 80 alumnos',
      'Asistencia y calificaciones',
      'Comunicados y mensajería',
      'Portal para apoderados',
      'Gestión de programas',
      'Reportes diarios',
      'Usuarios ilimitados',
    ],
    cta: 'Agendar demo',
    highlighted: false,
  },
  {
    name: 'Profesional',
    description: 'Todo lo que necesita un centro NEE o colegio en crecimiento',
    features: [
      'Hasta 300 alumnos',
      'Todo de Starter +',
      'Intervención NEE (PII completo)',
      'Agenda de sesiones terapéuticas',
      'Cobro por sesión individual',
      'Paquetes de sesiones con descuento',
      'Portal de avances para familias',
      'Bitácora conductual (ABC)',
      'Formulario de admisión público',
      'Cobranzas y facturación',
      'Soporte prioritario',
    ],
    cta: 'Agendar demo',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'Para redes de centros y fundaciones educacionales',
    features: [
      'Alumnos ilimitados',
      'Todo de Profesional +',
      'Multi-sede / multi-colegio',
      'API e integraciones',
      'Onboarding personalizado',
      'SLA garantizado',
      'Account manager dedicado',
    ],
    cta: 'Contactar ventas',
    highlighted: false,
  },
]

export default function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="pricing" className="py-24 px-6 bg-[#F9F7F5]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block text-[11px] font-semibold text-[#E85D3A] uppercase tracking-[0.15em] mb-4">
            Planes
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            Un plan que se adapta<br />a tu centro
          </h2>
          <p className="text-[15px] text-[#5C5470]">
            Planes desde $49.990/mes. Conversemos para encontrar el que se ajusta a tu realidad.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className={`relative rounded-2xl p-7 border transition-all ${
                plan.highlighted
                  ? 'bg-white border-[#5B3E9E]/20 shadow-xl scale-[1.02] ring-1 ring-[#5B3E9E]/10'
                  : 'bg-white border-[#e2dfd9]/60 hover:shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#5B3E9E] text-white text-[10px] font-semibold tracking-wide">
                  RECOMENDADO
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-[18px] font-bold text-[#1A1035] mb-1">{plan.name}</h3>
                <p className="text-[12px] text-[#5C5470] leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <circle cx="7" cy="7" r="7" fill={plan.highlighted ? '#5B3E9E' : '#4A9E7A'} opacity="0.12"/>
                      <path d="M4 7l2 2 4-4" stroke={plan.highlighted ? '#5B3E9E' : '#4A9E7A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px] text-[#1A1035]">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block w-full text-center py-3 rounded-lg text-[13px] font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-[#2D1B69] text-white hover:bg-[#221455] shadow-sm'
                    : 'bg-[#F9F7F5] text-[#1A1035] border border-[#e2dfd9] hover:bg-[#f0ede8]'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-[12px] text-[#5C5470] mt-10"
        >
          Sin contratos de permanencia · Actualizaciones incluidas · Soporte técnico en todos los planes
        </motion.p>
      </div>
    </section>
  )
}
