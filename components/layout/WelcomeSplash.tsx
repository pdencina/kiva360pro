'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  nombre: string
  colegio?: string
}

export default function WelcomeSplash({ nombre, colegio }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show splash only once per session (per browser tab)
    const key = 'kiva360_welcome_shown'
    const alreadyShown = sessionStorage.getItem(key)
    if (!alreadyShown) {
      setVisible(true)
      sessionStorage.setItem(key, '1')
      // Auto-dismiss after 3.5 seconds
      const timer = setTimeout(() => setVisible(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [])

  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setVisible(false)}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-[#0d1b2a]/80 backdrop-blur-xl" />

          {/* Animated particles / orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#60a5fa]"
              style={{ filter: 'blur(120px)' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#4a86d6]"
              style={{ filter: 'blur(100px)' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.08 }}
              transition={{ duration: 2, delay: 0.4, ease: 'easeOut' }}
              className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-[#3b6ea5]"
              style={{ filter: 'blur(80px)' }}
            />
          </div>

          {/* Content */}
          <div className="relative text-center px-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <img
                src="/icono-solo/kiva360-icon.svg"
                alt="Kiva360"
                className="w-20 h-20 mx-auto rounded-2xl"
                style={{ boxShadow: '0 0 60px rgba(96,165,250,0.3)' }}
              />
            </motion.div>

            {/* Greeting */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[14px] text-white/40 font-medium tracking-wide uppercase mb-2">
                {saludo}
              </p>
              <h1
                className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white leading-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em' }}
              >
                {nombre}
              </h1>
            </motion.div>

            {/* Colegio */}
            {colegio && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-[15px] text-white/30 mt-4"
              >
                {colegio}
              </motion.p>
            )}

            {/* Subtle loading indicator */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '120px' }}
              transition={{ duration: 2.8, delay: 0.5, ease: 'linear' }}
              className="h-[2px] bg-gradient-to-r from-transparent via-[#60a5fa]/50 to-transparent mx-auto mt-8 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
