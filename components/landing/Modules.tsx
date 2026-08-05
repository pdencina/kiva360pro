'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const modules = [
  {
    id: 'academico',
    title: 'Gestión académica',
    subtitle: 'El corazón de tu colegio, digitalizado',
    points: [
      'Libro de clases digital con registro por bloque',
      'Planificación curricular por asignatura y semestre',
      'Calificaciones con cálculo automático y ponderaciones',
      'Reportes de rendimiento por alumno y curso',
      'Horarios configurables con distribución de bloques',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#f3f0f9] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B3E9E" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#1A1035]">Libro de clases — 3°B</div>
            <div className="text-[10px] text-[#5C5470]">Matemáticas · Julio 2026</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {['Sofía Contreras', 'Matías Rojas', 'Valentina Torres'].map((n, i) => (
            <div key={n} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-[#F9F7F5]">
              <span className="text-[11px] text-[#1A1035] font-medium">{n}</span>
              <div className="flex gap-1">
                {[6.5, 5.8, 7.0][i] && <span className="text-[10px] font-bold text-[#5B3E9E]">{[6.5, 5.8, 7.0][i]}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'financiero',
    title: 'Control financiero',
    subtitle: 'Cobranzas claras, morosidad bajo control',
    points: [
      'Planes de cobro configurables (mensual, trimestral, anual)',
      'Emisión automática de cobros con fecha de vencimiento',
      'Recordatorios por email antes y después del vencimiento',
      'Dashboard de KPIs: recaudación, mora, familias al día',
      'Registro de pagos con múltiples medios (transferencia, Webpay, efectivo)',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-[#edf7f2] p-3">
            <div className="text-[9px] text-[#5C5470] uppercase tracking-wider">Recaudado</div>
            <div className="text-[18px] font-bold text-[#4A9E7A] font-display">$8.2M</div>
          </div>
          <div className="rounded-lg bg-[#fef0ec] p-3">
            <div className="text-[9px] text-[#5C5470] uppercase tracking-wider">Mora</div>
            <div className="text-[18px] font-bold text-[#E85D3A] font-display">4.1%</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-14">
          {[30, 45, 38, 62, 55, 70, 68, 82, 78, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i >= 8 ? '#4A9E7A' : '#5B3E9E', opacity: 0.2 + i * 0.08 }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'comunidad',
    title: 'Comunidad escolar',
    subtitle: 'Conecta con familias de forma profesional',
    points: [
      'Comunicados masivos por curso, nivel o toda la comunidad',
      'Reportes diarios con fotos y actividades del día',
      'Portal para apoderados con acceso a notas y asistencia',
      'Mensajería directa entre docentes y familias',
      'Admisión online con formulario y proceso de postulación',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f3f0f9]/50 border border-[#5B3E9E]/10">
            <div className="w-7 h-7 rounded-full bg-[#5B3E9E] flex items-center justify-center shrink-0">
              <span className="text-[9px] text-white font-bold">Dir</span>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#1A1035]">Reunión de apoderados</div>
              <div className="text-[10px] text-[#5C5470]">Estimadas familias, les recordamos la reunión del...</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#edf7f2]/50 border border-[#4A9E7A]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A9E7A]" />
            <span className="text-[10px] text-[#4A9E7A] font-medium">Leído por 87% de las familias</span>
          </div>
        </div>
      </div>
    ),
  },
]

export default function Modules() {
  const [active, setActive] = useState('academico')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const current = modules.find(m => m.id === active)!

  return (
    <section id="modules" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block text-[11px] font-semibold text-[#5B3E9E] uppercase tracking-[0.15em] mb-4">
            Módulos
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            Tres pilares, una plataforma
          </h2>
          <p className="text-[15px] text-[#5C5470]">
            Cada módulo funciona de forma independiente pero se potencian juntos.
          </p>
        </motion.div>

        {/* Tab selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-[#F9F7F5] border border-[#e2dfd9]/60 p-1.5 gap-1">
            {modules.map(m => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active === m.id
                    ? 'bg-white text-[#1A1035] shadow-sm font-semibold'
                    : 'text-[#5C5470] hover:text-[#1A1035]'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="font-display text-[24px] font-bold text-[#1A1035] mb-2">{current.title}</h3>
            <p className="text-[14px] text-[#5C5470] mb-6">{current.subtitle}</p>
            <ul className="space-y-3">
              {current.points.map((point, i) => (
                <motion.li
                  key={point}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-[#edf7f2] flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 5-5" stroke="#4A9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[13px] text-[#1A1035]">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            {current.visual}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
