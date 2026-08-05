'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden" style={{ background: 'var(--k-gradient-hero)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#5B3E9E]/[0.07] blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#E85D3A]/[0.04] blur-[100px]" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[11px] font-medium text-white/70 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A9E7A] animate-pulse" />
              Plataforma educacional chilena
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white leading-[1.05] mb-6"
          >
            Gestión escolar{' '}
            <span className="text-gradient-brand">sin fricción</span>
            <br />
            para colegios que crecen
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-[17px] text-white/50 leading-relaxed max-w-xl mb-10"
          >
            Intervención terapéutica, agenda de sesiones, cobro por sesión, programas flexibles
            y portal de avances para familias. Todo en una plataforma que tu equipo realmente quiere usar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[14px] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--k-gradient-accent)', boxShadow: 'var(--k-glow-coral)' }}
            >
              Agendar demo gratuita
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
                <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-[14px] text-white/70 glass hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Ver funcionalidades
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-16 flex items-center gap-6"
          >
            <div className="flex -space-x-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B3E9E] to-[#E85D3A] border-2 border-[#1A1035] flex items-center justify-center text-[10px] text-white font-bold">
                  {['M','C','J','R'][i]}
                </div>
              ))}
            </div>
            <div className="text-[12px] text-white/40">
              <span className="text-white/70 font-medium">+15 colegios</span> ya gestionan con Kiva360
            </div>
          </motion.div>
        </div>

        {/* Floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -5 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden xl:block absolute right-6 top-1/2 -translate-y-1/2 w-[480px]"
        >
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ boxShadow: 'var(--k-glow-violet)' }}>
            <div className="bg-[#1A1035] p-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 text-center text-[10px] text-white/30 font-mono">kiva360.cl/inicio</div>
            </div>
            <div className="bg-[#F9F7F5] p-6">
              {/* Mock dashboard */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] font-bold text-[#1A1035] font-display">Dashboard</div>
                <div className="text-[10px] text-[#5C5470]">Julio 2026</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Alumnos', value: '847', color: '#5B3E9E' },
                  { label: 'Asistencia', value: '94.2%', color: '#4A9E7A' },
                  { label: 'Recaudación', value: '$12.4M', color: '#E85D3A' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-lg p-3 border border-[#e2dfd9]/60">
                    <div className="text-[9px] text-[#5C5470] uppercase tracking-wider mb-1">{kpi.label}</div>
                    <div className="text-[16px] font-bold font-display" style={{ color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              {/* Mini chart bars */}
              <div className="bg-white rounded-lg p-3 border border-[#e2dfd9]/60">
                <div className="text-[9px] text-[#5C5470] uppercase tracking-wider mb-3">Recaudación mensual</div>
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 92].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 11 ? '#E85D3A' : '#5B3E9E', opacity: i === 11 ? 1 : 0.15 + (i * 0.07) }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
