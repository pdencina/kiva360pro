'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Módulos', href: '#modules' },
  { label: 'Planes', href: '#pricing' },
  { label: 'Contacto', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-[#e2dfd9]/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-9 h-9 rounded-[10px] group-hover:scale-105 transition-transform" />
          <span className={`font-display font-bold text-lg tracking-tight transition-colors ${
            scrolled ? 'text-[#1A1035]' : 'text-white'
          }`}>
            Kiva360
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium transition-colors hover:text-[#E85D3A] ${
                scrolled ? 'text-[#5C5470]' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-[13px] font-medium px-4 py-2 rounded-lg transition-all ${
              scrolled
                ? 'text-[#2D1B69] hover:bg-[#f3f0f9]'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Iniciar sesión
          </Link>
          <Link
            href="#contact"
            className="text-[13px] font-semibold px-5 py-2.5 rounded-lg bg-[#E85D3A] text-white hover:bg-[#D94A27] transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
          >
            Solicitar demo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center"
          aria-label="Menú"
        >
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 rounded transition-all ${scrolled ? 'bg-[#1A1035]' : 'bg-white'} ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${scrolled ? 'bg-[#1A1035]' : 'bg-white'} ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${scrolled ? 'bg-[#1A1035]' : 'bg-white'} ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[#e2dfd9] overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[14px] text-[#1A1035] font-medium py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-[#e2dfd9] flex flex-col gap-2">
                <Link href="/login" className="text-[14px] text-[#2D1B69] font-medium py-2">
                  Iniciar sesión
                </Link>
                <Link
                  href="#contact"
                  className="text-center text-[13px] font-semibold px-5 py-2.5 rounded-lg bg-[#E85D3A] text-white"
                >
                  Solicitar demo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
