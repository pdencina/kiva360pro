'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

const REPORTE_EJEMPLO = {
  alumno: 'Emilia',
  fecha: 'Viernes 8 de agosto',
  alimentacion: { desayuno: 'Todo', colacion: 'Mitad', almuerzo: 'Todo' },
  siesta: { durmio: true, duracion: '1h 30min' },
  animo: 'Feliz',
  mudas: 3,
  actividades: [
    { icon: 'ti-palette', label: 'Arte', desc: 'Pintura con dedos — colores primarios' },
    { icon: 'ti-music', label: 'Música', desc: 'Rondas infantiles y percusión' },
    { icon: 'ti-trees', label: 'Exterior', desc: 'Juego libre en patio' },
  ],
  observaciones: 'Emilia tuvo un excelente día. Compartió juguetes con sus compañeros y participó activamente en todas las actividades.',
  fotos: 2,
}

export default function ReporteDiarioShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [vista, setVista] = useState<'educadora' | 'familia'>('educadora')

  // Auto-switch entre vistas
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setVista(v => v === 'educadora' ? 'familia' : 'educadora')
    }, 5000)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <section className="py-24 px-6 bg-[#F9F7F5]" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block text-[11px] font-semibold text-[#4A9E7A] uppercase tracking-[0.15em] mb-4">
            Jardines y salas cuna
          </span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-[#1A1035] leading-tight mb-4">
            La familia sabe cómo estuvo su hijo{' '}
            <span className="text-gradient-brand">cada día</span>
          </h2>
          <p className="text-[15px] text-[#5C5470] leading-relaxed">
            La educadora completa el reporte en minutos. Los apoderados reciben al instante 
            cómo comió, durmió, qué actividades hizo y cómo estuvo de ánimo su hijo/a.
          </p>
        </motion.div>

        {/* Toggle vista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="flex bg-white rounded-xl p-1 border border-[#e2dfd9] shadow-sm">
            <button
              onClick={() => setVista('educadora')}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${vista === 'educadora' ? 'bg-[#0d1b2a] text-white shadow-sm' : 'text-[#5C5470]'}`}
            >
              <i className="ti ti-pencil text-[14px] mr-1.5" aria-hidden="true" />
              Educadora completa
            </button>
            <button
              onClick={() => setVista('familia')}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${vista === 'familia' ? 'bg-[#0d1b2a] text-white shadow-sm' : 'text-[#5C5470]'}`}
            >
              <i className="ti ti-heart text-[14px] mr-1.5" aria-hidden="true" />
              Familia recibe
            </button>
          </div>
        </motion.div>

        {/* Card del reporte */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-white rounded-2xl border border-[#e2dfd9] shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A9E7A] to-[#2D7A54] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-[14px] font-bold">
                    E
                  </div>
                  <div>
                    <div className="text-white font-semibold text-[14px]">{REPORTE_EJEMPLO.alumno}</div>
                    <div className="text-white/60 text-[11px]">{REPORTE_EJEMPLO.fecha}</div>
                  </div>
                </div>
                {vista === 'familia' && (
                  <span className="text-[9px] font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                    Recibido ahora
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {vista === 'educadora' ? (
                <>
                  {/* Vista educadora — formulario rápido */}
                  <div>
                    <div className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-2">Alimentación</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(REPORTE_EJEMPLO.alimentacion).map(([key, val]) => (
                        <div key={key} className="bg-[#f9f7f5] rounded-lg p-2.5 text-center">
                          <div className="text-[9px] text-[#9ca3af] capitalize">{key}</div>
                          <div className="text-[12px] font-semibold text-[#1A1035] mt-0.5">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f0ecf9] rounded-lg p-2.5 text-center">
                      <div className="text-[9px] text-[#5B3E9E]">Siesta</div>
                      <div className="text-[12px] font-semibold text-[#1A1035]">{REPORTE_EJEMPLO.siesta.duracion}</div>
                    </div>
                    <div className="bg-[#fef3e2] rounded-lg p-2.5 text-center">
                      <div className="text-[9px] text-[#B86E00]">Ánimo</div>
                      <div className="text-[12px] font-semibold text-[#1A1035]">{REPORTE_EJEMPLO.animo}</div>
                    </div>
                    <div className="bg-[#edf6fa] rounded-lg p-2.5 text-center">
                      <div className="text-[9px] text-[#3D7A94]">Mudas</div>
                      <div className="text-[12px] font-semibold text-[#1A1035]">{REPORTE_EJEMPLO.mudas}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-2">Actividades</div>
                    <div className="space-y-1.5">
                      {REPORTE_EJEMPLO.actividades.map(a => (
                        <div key={a.label} className="flex items-center gap-2 p-2 rounded-lg bg-[#f9f7f5]">
                          <i className={`ti ${a.icon} text-[14px] text-[#5B3E9E]`} aria-hidden="true" />
                          <span className="text-[11px] font-medium text-[#1A1035]">{a.label}:</span>
                          <span className="text-[11px] text-[#5C5470]">{a.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button className="btn-primary text-[11px] py-2 flex-1">
                      <i className="ti ti-send text-[12px]" aria-hidden="true" /> Publicar reporte
                    </button>
                    <button className="btn-secondary text-[11px] py-2">
                      <i className="ti ti-camera text-[12px]" aria-hidden="true" /> Fotos
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Vista familia — reporte recibido */}
                  <div className="bg-[#edf7f2] rounded-xl p-4 text-center">
                    <div className="text-[24px] mb-1">😊</div>
                    <div className="text-[13px] font-semibold text-[#2D7A54]">Emilia tuvo un excelente día</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-2">Resumen del día</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e2dfd9]">
                        <i className="ti ti-soup text-[16px] text-[#4A9E7A]" aria-hidden="true" />
                        <div>
                          <div className="text-[10px] text-[#9ca3af]">Almuerzo</div>
                          <div className="text-[12px] font-medium text-[#1A1035]">Comió todo</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e2dfd9]">
                        <i className="ti ti-moon text-[16px] text-[#5B3E9E]" aria-hidden="true" />
                        <div>
                          <div className="text-[10px] text-[#9ca3af]">Siesta</div>
                          <div className="text-[12px] font-medium text-[#1A1035]">1h 30min</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e2dfd9]">
                        <i className="ti ti-mood-happy text-[16px] text-[#B86E00]" aria-hidden="true" />
                        <div>
                          <div className="text-[10px] text-[#9ca3af]">Ánimo</div>
                          <div className="text-[12px] font-medium text-[#1A1035]">Feliz</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e2dfd9]">
                        <i className="ti ti-photo text-[16px] text-[#E85D3A]" aria-hidden="true" />
                        <div>
                          <div className="text-[10px] text-[#9ca3af]">Fotos</div>
                          <div className="text-[12px] font-medium text-[#1A1035]">{REPORTE_EJEMPLO.fotos} fotos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#5C5470] uppercase tracking-wider mb-2">Actividades</div>
                    <div className="flex gap-2 flex-wrap">
                      {REPORTE_EJEMPLO.actividades.map(a => (
                        <span key={a.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f3f0f9] text-[10px] font-medium text-[#5B3E9E]">
                          <i className={`ti ${a.icon} text-[11px]`} aria-hidden="true" />{a.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#f9f7f5] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-[#5C5470] mb-1">Observaciones de la educadora</div>
                    <p className="text-[11px] text-[#5C5470] leading-relaxed">{REPORTE_EJEMPLO.observaciones}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Descripción debajo */}
          <div className="mt-8 text-center">
            <p className="text-[13px] text-[#5C5470] max-w-md mx-auto leading-relaxed">
              {vista === 'educadora'
                ? 'La educadora completa el reporte en menos de 2 minutos con selección rápida. Puede adjuntar fotos y publicar al instante.'
                : 'La familia recibe el reporte en su celular al momento de ser publicado. Saben exactamente cómo estuvo su hijo/a durante el día.'
              }
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
