'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const ETAPAS = [
  { label: 'Postulación', icon: 'ti-inbox', color: '#60a5fa', count: 3 },
  { label: 'En revisión', icon: 'ti-eye', color: '#a78bfa', count: 2 },
  { label: 'Entrevista', icon: 'ti-calendar', color: '#fbbf24', count: 1 },
  { label: 'Aprobada', icon: 'ti-check', color: '#22c55e', count: 1 },
  { label: 'Matriculado', icon: 'ti-user-check', color: '#0d9488', count: 1 },
]

const CARDS = [
  { name: 'María López', programa: 'Intensivo', etapa: 0 },
  { name: 'Carlos Pérez', programa: 'After School', etapa: 0 },
  { name: 'Ana Muñoz', programa: 'Sesiones', etapa: 0 },
  { name: 'Diego Torres', programa: 'Intensivo', etapa: 1 },
  { name: 'Valentina Soto', programa: 'After School', etapa: 1 },
  { name: 'Lucas Vargas', programa: 'Intensivo', etapa: 2 },
  { name: 'Isidora Ruiz', programa: 'Intensivo', etapa: 3 },
  { name: 'Matías Herrera', programa: 'Sesiones', etapa: 4 },
]

export default function AdmisionPipeline() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeCard, setActiveCard] = useState(0)
  const [cards, setCards] = useState(CARDS)

  // Animación: mover una tarjeta de etapa cada 3 segundos
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setCards(prev => {
        const movable = prev.filter(c => c.etapa < 4)
        if (movable.length === 0) return CARDS // Reset
        const idx = Math.floor(Math.random() * movable.length)
        const cardToMove = movable[idx]
        return prev.map(c =>
          c.name === cardToMove.name ? { ...c, etapa: c.etapa + 1 } : c
        )
      })
      setActiveCard(prev => (prev + 1) % CARDS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <section className="py-24 px-6 bg-white overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block text-[11px] font-semibold text-[#5B3E9E] uppercase tracking-[0.15em] mb-4">
            Admisión inteligente
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            Pipeline de postulaciones{' '}
            <span className="text-gradient-brand">en tiempo real</span>
          </h2>
          <p className="text-[15px] text-[#5C5470] leading-relaxed">
            Las familias postulan online, suben sus documentos, y tú gestionas todo desde un pipeline 
            visual. Cada postulación avanza por etapas hasta la matrícula.
          </p>
        </motion.div>

        {/* Pipeline visual animado */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          {/* Etapas header */}
          <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2">
            {ETAPAS.map((etapa, idx) => {
              const count = cards.filter(c => c.etapa === idx).length
              return (
                <div key={etapa.label} className="flex-1 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: etapa.color }}
                    />
                    <span className="text-[11px] font-bold text-[#1A1035] uppercase tracking-wide">
                      {etapa.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#9ca3af] ml-auto">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cards en columnas */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4">
            {ETAPAS.map((etapa, etapaIdx) => (
              <div key={etapa.label} className="flex-1 min-w-[140px] space-y-2">
                {cards
                  .filter(c => c.etapa === etapaIdx)
                  .map(card => (
                    <motion.div
                      key={card.name}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="bg-white border border-[#e2dfd9] rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#f3f0f9] flex items-center justify-center text-[9px] font-bold text-[#5B3E9E]">
                          {card.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[11px] font-semibold text-[#1A1035] truncate">{card.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f9f7f5] text-[#5C5470] font-medium">
                        {card.programa}
                      </span>
                    </motion.div>
                  ))}
                {cards.filter(c => c.etapa === etapaIdx).length === 0 && (
                  <div className="h-16 border-2 border-dashed border-[#e2dfd9] rounded-xl flex items-center justify-center">
                    <span className="text-[10px] text-[#b0b7c3]">Vacío</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Indicadores del flujo */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            <div className="flex items-center gap-2 text-[11px] text-[#5C5470]">
              <i className="ti ti-world text-[14px] text-[#60a5fa]" aria-hidden="true" />
              Formulario público
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#5C5470]">
              <i className="ti ti-upload text-[14px] text-[#a78bfa]" aria-hidden="true" />
              Upload de documentos
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#5C5470]">
              <i className="ti ti-user text-[14px] text-[#fbbf24]" aria-hidden="true" />
              Portal del postulante
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#5C5470]">
              <i className="ti ti-mail text-[14px] text-[#22c55e]" aria-hidden="true" />
              Notificaciones automáticas
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
