'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ADMIN = [
  { label: 'Panel Kiva360', href: '/super-admin',                icon: 'ti-dashboard' },
  { label: 'Propuestas',    href: '/super-admin/propuestas/nueva', icon: 'ti-file-invoice' },
  { label: 'Usuarios',      href: '/super-admin/usuarios',        icon: 'ti-users' },
  { label: 'Permisos',      href: '/super-admin/permisos',        icon: 'ti-lock' },
  { label: 'Tabla aportes',  href: '/super-admin/aportes',        icon: 'ti-table' },
]

const NAV_PLATAFORMA = [
  { label: 'Inicio',          href: '/inicio',          icon: 'ti-home' },
  { label: 'Admisión',        href: '/admision',        icon: 'ti-inbox' },
  { label: 'Alumnos',         href: '/alumnos',         icon: 'ti-users' },
  { label: 'Programas',       href: '/programas',       icon: 'ti-category' },
  { label: 'Horario alumno',  href: '/horario-alumno',  icon: 'ti-calendar-time' },
  { label: 'Asistencias',     href: '/asistencias',     icon: 'ti-clipboard-check' },
  { label: 'Intervención NEE',href: '/intervencion',    icon: 'ti-heart-handshake' },
  { label: 'Agenda',          href: '/agenda',          icon: 'ti-calendar-event' },
  { label: 'Reporte diario',  href: '/reporte-diario',  icon: 'ti-clipboard-heart' },
  { label: 'Comunicados',     href: '/comunicados',     icon: 'ti-speakerphone' },
  { label: 'Mensajes',        href: '/mensajes',        icon: 'ti-message-2' },
]

const NAV_GESTION = [
  { label: 'Aportes',       href: '/contable',       icon: 'ti-cash' },
  { label: 'Cobranza',      href: '/cobranza',       icon: 'ti-report-money' },
  { label: 'Cobros sesión', href: '/cobros-sesion',  icon: 'ti-receipt-2' },
  { label: 'Documentos',    href: '/documentos',     icon: 'ti-folder' },
  { label: 'Configuración', href: '/configuracion',  icon: 'ti-settings' },
]

export default function SuperAdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/super-admin') return pathname === '/super-admin'
    return pathname.startsWith(href)
  }

  function renderSection(label: string, items: typeof NAV_ADMIN) {
    return (
      <div className="mb-4">
        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.12em] px-3 py-1.5 mb-0.5">{label}</div>
        {items.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium mb-0.5 transition-all ${
                active
                  ? 'bg-[#0d1b2a] text-white'
                  : 'text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#1a2332]'
              }`}>
              <i className={`ti ${item.icon} text-[14px] ${active ? 'text-[#60a5fa]' : 'text-[#9ca3af]'}`} aria-hidden="true"/>
              {item.label}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <aside className="w-56 bg-white border-r border-[#e8eaed] flex flex-col shrink-0 min-h-[calc(100vh-56px)]">
      <div className="px-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-[#0d1b2a] text-[#60a5fa] border border-[#3b6ea5]/30">
          <i className="ti ti-shield-check text-[10px]" aria-hidden="true"/> Super Admin
        </div>
      </div>
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {renderSection('Kiva360', NAV_ADMIN)}
        {renderSection('Plataforma', NAV_PLATAFORMA)}
        {renderSection('Gestión', NAV_GESTION)}
      </nav>
      <div className="px-4 py-3 border-t border-[#f3f4f6]">
        <div className="text-[10px] text-[#d1d5db] tracking-wide">Kiva360 v1.0</div>
      </div>
    </aside>
  )
}
