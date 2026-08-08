'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

interface Props {
  rol: string
  modulosHabilitadosInicial: string[] | null
}

export default function SidebarWrapper({ rol, modulosHabilitadosInicial }: Props) {
  const [modulos, setModulos] = useState<string[] | null>(modulosHabilitadosInicial)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar sidebar al navegar (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Bloquear scroll del body cuando drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    if (rol === 'super_admin') return

    const fetchPermisos = async () => {
      try {
        const res = await fetch(`/api/permisos/me`)
        if (res.ok) {
          const data = await res.json()
          setModulos(data)
        }
      } catch {}
    }

    const interval = setInterval(fetchPermisos, 30000)
    const handleFocus = () => fetchPermisos()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [rol])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 w-12 h-12 bg-[var(--ar-navy)] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Abrir menú"
      >
        <i className="ti ti-menu-2 text-[20px]" aria-hidden="true" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar rol={rol} modulosHabilitados={modulos} />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-[260px] max-w-[80vw] animate-slide-in">
            <Sidebar rol={rol} modulosHabilitados={modulos} />
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--ar-bg)] flex items-center justify-center"
              aria-label="Cerrar menú"
            >
              <i className="ti ti-x text-[16px] text-[var(--ar-muted)]" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
