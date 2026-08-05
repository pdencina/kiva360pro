'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const plans = [
  {
    name: 'Starter',
    description: 'Para colegios pequeños que quieren organizarse',
    price: '49.990',
    period: '/mes',
    features: [
      'Hasta 150 alumnos',
      'Asistencia y calificaciones',
      'Comunicados básicos',
      'Portal apoderados',
      '1 usuario admin',
    ],
    cta: 'Comenzar',
    highlighted: false,
  },
  {
    name: 'Profesional',
    description: 'Todo lo que necesita un colegio en crecimiento',
    price: '99.990',
    period: '/mes',
    features: [
      'Hasta 500 alumnos',
      'Todo de Starter +',
      'Cobranzas y facturación',
      'Matrícula digital con firma',
      'Fichas pedagógicas',
      'Reportes avanzados',
      'Usuarios ilimitados',
      'Soporte prioritario',
    ],
    cta: 'Solicitar demo',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'Para redes de colegios y fundaciones',
    price: 'A medida',
    period: '',
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
            Precios transparentes,<br />sin letra chica
          </h2>
          <p className="text-[15px] text-[#5C5470]">
            Todos los planes incluyen actualizaciones gratuitas y soporte técnico.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                  MÁS POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-[18px] font-bold text-[#1A1035] mb-1">{plan.name}</h3>
                <p className="text-[12px] text-[#5C5470]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-[32px] font-bold text-[#1A1035]">
                  {plan.price.startsWith('A') ? '' : '$'}{plan.price}
                </span>
                <span className="text-[13px] text-[#5C5470]">{plan.period}</span>
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
      </div>
    </section>
  )
}
