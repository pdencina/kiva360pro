'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const modules = [
  {
    id: 'nee',
    title: 'Intervención NEE',
    subtitle: 'El corazón de los centros de educación especial',
    points: [
      'Plan de Intervención Individual (PII) por alumno',
      'Objetivos terapéuticos medibles con progreso 0-100%',
      'Sesiones multidisciplinarias con registro clínico completo',
      'Bitácora conductual con modelo ABC (antecedente-conducta-consecuencia)',
      'Evoluciones periódicas compartibles con familias',
      'Portal de avances: los papás ven el progreso en tiempo real',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#f3f0f9] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B3E9E" strokeWidth="2"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#1A1035]">Matías Rojas — PII</div>
            <div className="text-[10px] text-[#5C5470]">CEA · Nivel intermedio</div>
          </div>
          <span className="ml-auto text-[18px] font-bold text-[#5B3E9E]">67%</span>
        </div>
        <div className="space-y-2">
          {[{area: 'Comunicación', p: 80}, {area: 'Socioemocional', p: 55}, {area: 'Autonomía', p: 65}].map(o => (
            <div key={o.area}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#5C5470]">{o.area}</span><span className="font-bold text-[#1A1035]">{o.p}%</span>
              </div>
              <div className="h-1.5 bg-[#f0f0f0] rounded-full"><div className="h-full rounded-full bg-[#5B3E9E]" style={{width:`${o.p}%`}}/></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'agenda',
    title: 'Agenda y sesiones',
    subtitle: 'Organiza la operación diaria de tu equipo',
    points: [
      'Calendario semanal con vista por profesional',
      'Agendamiento con recurrencia (semanal/quincenal)',
      'Estado: programada → confirmada → completada',
      'Cobro automático al completar sesión',
      'Tarifas configurables por especialidad',
      'Paquetes de sesiones con descuento',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-3">Lunes 21 jul</div>
        <div className="space-y-2">
          {[
            {hora:'09:00', alumno:'Sofía C.', prof:'Dra. Morales', color:'#5B3E9E', tipo:'Fono'},
            {hora:'10:00', alumno:'Matías R.', prof:'Lic. Torres', color:'#E85D3A', tipo:'T.O.'},
            {hora:'11:00', alumno:'Valentina T.', prof:'Ps. López', color:'#4A9E7A', tipo:'Psico'},
          ].map(s => (
            <div key={s.hora} className="flex items-center gap-2 p-2 rounded-lg bg-[#f9f7f5]">
              <div className="w-1.5 h-8 rounded-full" style={{background: s.color}} />
              <div className="flex-1">
                <div className="text-[11px] font-medium text-[#1A1035]">{s.hora} — {s.alumno}</div>
                <div className="text-[9px] text-[#5C5470]">{s.prof} · {s.tipo}</div>
              </div>
              <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Confirmada</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'financiero',
    title: 'Gestión financiera',
    subtitle: 'Cobranzas mensuales + cobro por sesión',
    points: [
      'Cobros mensuales con recordatorios automáticos',
      'Cobro individual por sesión terapéutica',
      'Paquetes de sesiones con descuento (ej: 10 sesiones)',
      'Dashboard de morosidad y recaudación en tiempo real',
      'Registro de pagos: transferencia, Webpay, efectivo',
      'Portal de pagos para apoderados',
    ],
    visual: (
      <div className="bg-white rounded-xl p-5 border border-[#e2dfd9]/60 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-[#edf7f2] p-3">
            <div className="text-[9px] text-[#5C5470] uppercase tracking-wider">Recaudado</div>
            <div className="text-[18px] font-bold text-[#4A9E7A]" style={{fontFamily:'Space Grotesk'}}>$4.2M</div>
          </div>
          <div className="rounded-lg bg-[#fef0ec] p-3">
            <div className="text-[9px] text-[#5C5470] uppercase tracking-wider">Pendiente</div>
            <div className="text-[18px] font-bold text-[#E85D3A]" style={{fontFamily:'Space Grotesk'}}>$680K</div>
          </div>
        </div>
        <div className="space-y-1.5 text-[10px]">
          {[{n:'Pack 10 Fono — Fam. Contreras',s:'pagado'},{n:'Sesión T.O. 15/jul — Fam. Rojas',s:'pendiente'},{n:'Mensualidad Jul — Fam. Torres',s:'pagado'}].map(c=>(
            <div key={c.n} className="flex items-center justify-between py-1.5 px-2 rounded bg-[#f9f7f5]">
              <span className="text-[#1A1035]">{c.n}</span>
              <span className={`font-bold ${c.s==='pagado'?'text-emerald-600':'text-amber-600'}`}>{c.s}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function Modules() {
  const [active, setActive] = useState('nee')
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
            Todo integrado, sin herramientas dispersas
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
