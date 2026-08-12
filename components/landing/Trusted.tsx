'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Trusted() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-16 px-6 border-t border-b border-[#e2dfd9]/60 bg-white" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto text-center"
      >
        <p className="text-[11px] font-semibold text-[#5C5470] uppercase tracking-[0.15em] mb-8">
          Ya confían en Kiva360
        </p>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-[#FDF2F8] flex items-center justify-center text-[20px]">🌸</div>
            <div className="text-left">
              <div className="text-[14px] font-bold text-[#1A1035]">Sakura Kids</div>
              <div className="text-[11px] text-[#5C5470]">Centro Educativo NEE · Santiago</div>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-[#5C5470] mt-8 max-w-md mx-auto leading-relaxed">
          "Kiva360 nos permitió digitalizar toda la gestión del centro en menos de una semana. 
          Ahora las familias reciben reportes diarios y pueden seguir el avance terapéutico de sus hijos."
        </p>
        <p className="text-[11px] font-semibold text-[#1A1035] mt-3">Carolina Rojas · Directora, Espacio Integral Sakura Kids</p>
      </motion.div>
    </section>
  )
}
