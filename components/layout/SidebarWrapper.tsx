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

  // Escuchar evento global para abrir desde el Topbar
  useEffect(() => {
    function handleToggle() {
      setMobileOpen(prev => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

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
          <div className="relative w-[270px] max-w-[80vw] animate-slide-in safe-bottom">
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
