'use client'

import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const faqs = [
  {
    q: '¿Cuánto demora implementar Kiva360 en mi centro?',
    a: 'La mayoría de los centros quedan operativos en menos de una semana. Nosotros cargamos tus cursos, alumnos y programas, y capacitamos a tu equipo y a las familias.',
  },
  {
    q: '¿Puedo migrar los datos que ya tengo?',
    a: 'Sí. Si tienes tus alumnos y apoderados en Excel o en otro sistema, los importamos por ti durante la configuración inicial, sin que pierdas información.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Completamente. Tanto el equipo del centro como los apoderados pueden usar Kiva360 desde el teléfono: reportes diarios, comunicados, asistencia, pagos y firma de documentos, todo desde el navegador.',
  },
  {
    q: '¿Es seguro el manejo de datos de menores?',
    a: 'La información se aloja en infraestructura cifrada y cada perfil ve solo lo que le corresponde: un apoderado accede únicamente a los datos de su hijo o hija. Las firmas quedan registradas con fecha, hora e IP para respaldo legal.',
  },
  {
    q: '¿Sirve para centros NEE y jardines, no solo colegios?',
    a: 'Sí. Kiva360 es transversal: se usa en jardines infantiles, escuelas de lenguaje, centros de intervención NEE y colegios. Incluye evaluación cualitativa, planes de intervención (PII), agenda de sesiones terapéuticas y reporte diario para familias.',
  },
  {
    q: '¿Tengo que firmar un contrato de permanencia?',
    a: 'No. Trabajamos con planes mensuales sin permanencia, con actualizaciones y soporte incluidos. Puedes empezar con un plan y escalar cuando tu centro lo necesite.',
  },
]

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#e2dfd9]/60 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#FAF9F7] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-semibold text-[#1A1035]">{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full border border-[#e2dfd9] flex items-center justify-center transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="#5B3E9E" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[14px] text-[#5C5470] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 px-6 bg-[#F9F7F5]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] font-semibold text-[#E85D3A] uppercase tracking-[0.15em] mb-4">
            Preguntas frecuentes
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight">
            Resolvemos tus dudas
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
