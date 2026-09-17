'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const centros = [
  {
    nombre: 'Sakura Kids',
    tipo: 'Centro Educativo NEE · Santiago',
    emoji: '🌸',
    bg: '#FDF2F8',
  },
  {
    nombre: 'Jardín Los Aromos',
    tipo: 'Jardín Infantil · Viña del Mar',
    emoji: '🌳',
    bg: '#F0FDF4',
  },
  {
    nombre: 'Colegio Altamira',
    tipo: 'Colegio Particular · Concepción',
    emoji: '🎓',
    bg: '#EFF6FF',
  },
  {
    nombre: 'Centro Aprender+',
    tipo: 'Apoyo Terapéutico NEE · Temuco',
    emoji: '🧩',
    bg: '#FEF3C7',
  },
  {
    nombre: 'Escuela Raíces',
    tipo: 'Escuela de Lenguaje · La Serena',
    emoji: '🌱',
    bg: '#F5F3FF',
  },
]

export default function Trusted() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-16 px-6 border-t border-b border-[#e2dfd9]/60 bg-white" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto text-center"
      >
        <p className="text-[11px] font-semibold text-[#5C5470] uppercase tracking-[0.15em] mb-10">
          Centros que confían en Kiva360
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {centros.map((c, i) => (
            <motion.div
              key={c.nombre}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-[#e2dfd9]/60 bg-white hover:border-[#c9a3d4]/60 hover:shadow-[0_8px_30px_rgba(26,16,53,0.06)] transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-[24px]"
                style={{ backgroundColor: c.bg }}
              >
                {c.emoji}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#1A1035] leading-tight">{c.nombre}</div>
                <div className="text-[11px] text-[#5C5470] mt-1 leading-tight">{c.tipo}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 max-w-xl mx-auto">
          <p className="text-[13px] text-[#5C5470] leading-relaxed italic">
            "Kiva360 nos permitió digitalizar toda la gestión del centro en menos de una semana.
            Ahora las familias reciben reportes diarios y pueden seguir el avance terapéutico de sus hijos."
          </p>
          <p className="text-[11px] font-semibold text-[#1A1035] mt-3">
            Carolina Rojas · Directora, Espacio Integral Sakura Kids
          </p>
        </div>
      </motion.div>
    </section>
  )
}
