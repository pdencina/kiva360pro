'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

type Rol = 'super_admin' | 'admin' | 'pastor_campus' | 'gestor_admision' | 'tutor' | 'apoderado' | 'alumno' | 'postulante'

interface NavItem {
  label: string; href: string; icon: string; badge?: number; roles: Rol[]
}

const NAV_PRINCIPAL: NavItem[] = [
  { label: 'Inicio',          href: '/inicio',          icon: 'ti-home',             roles: ['super_admin','admin','gestor_admision','tutor'] },
  { label: 'Matrícula',       href: '/matricula',       icon: 'ti-user-plus',        roles: ['super_admin','admin','gestor_admision'] },
  { label: 'Admisión',        href: '/admision',        icon: 'ti-inbox',            roles: ['super_admin','admin','gestor_admision'] },
  { label: 'Mis alumnos',     href: '/alumnos',         icon: 'ti-users',            roles: ['tutor'] },
  { label: 'Alumnos',         href: '/alumnos',         icon: 'ti-users',            roles: ['super_admin','admin','gestor_admision'] },
  { label: 'Planificación',   href: '/planificacion',   icon: 'ti-layout-board',     roles: ['super_admin','admin','tutor'] },
  { label: 'Programas',       href: '/programas',       icon: 'ti-category',         roles: ['super_admin','admin','tutor'] },
  { label: 'Horario alumno',  href: '/horario-alumno',  icon: 'ti-calendar-time',    roles: ['super_admin','admin','tutor'] },
  { label: 'Asistencias',     href: '/asistencias',     icon: 'ti-clipboard-check',  roles: ['super_admin','admin','tutor'] },
  { label: 'Evaluaciones',   href: '/calificaciones',  icon: 'ti-chart-bar',        roles: ['super_admin','admin','tutor'] },
  { label: 'Comunicados',     href: '/comunicados',     icon: 'ti-speakerphone',     roles: ['super_admin','admin','gestor_admision','tutor'] },
  { label: 'Mensajes',        href: '/mensajes',        icon: 'ti-message-2',        roles: ['super_admin','admin','gestor_admision','tutor'] },
  { label: 'Reporte diario', href: '/reporte-diario', icon: 'ti-clipboard-heart',  roles: ['super_admin','admin','tutor'] },
  { label: 'Incidentes',    href: '/incidentes',     icon: 'ti-alert-circle',     roles: ['super_admin','admin','tutor'] },
  { label: 'Intervención NEE', href: '/intervencion', icon: 'ti-heart-handshake', roles: ['super_admin','admin','tutor'] },
  { label: 'Agenda',           href: '/agenda',        icon: 'ti-calendar-time',    roles: ['super_admin','admin','tutor'] },
  { label: 'Tareas',         href: '/tareas',         icon: 'ti-checklist',        roles: ['super_admin','admin','tutor'] },
]

const NAV_GESTION: NavItem[] = [
  { label: 'Finanzas',           href: '/finanzas',       icon: 'ti-report-analytics', roles: ['super_admin','admin','pastor_campus'] },
  { label: 'Valores Programas',   href: '/contable',       icon: 'ti-cash',             roles: ['super_admin','admin','gestor_admision'] },
  { label: 'Cobranza',           href: '/cobranza',       icon: 'ti-report-money',     roles: ['super_admin','admin'] },
  { label: 'Cobros sesión',      href: '/cobros-sesion',  icon: 'ti-receipt-2',        roles: ['super_admin','admin'] },
  { label: 'Documentos',         href: '/documentos',   icon: 'ti-folder',           roles: ['super_admin','admin','gestor_admision','tutor'] },
  { label: 'Becas',              href: '/becas',          icon: 'ti-school',           roles: ['super_admin','admin','gestor_admision'] },
  { label: 'Calendario',         href: '/calendario',   icon: 'ti-calendar',         roles: ['super_admin','admin','gestor_admision','tutor'] },
  { label: 'Fichas pedagógicas', href: '/fichas',       icon: 'ti-books',            roles: ['super_admin','admin','tutor'] },
  { label: 'Reportes',           href: '/reportes',     icon: 'ti-file-analytics',   roles: ['super_admin','admin'] },
]

const NAV_CUENTA: NavItem[] = [
  { label: 'Panel Kiva360',   href: '/super-admin',          icon: 'ti-dashboard', roles: ['super_admin'] },
  { label: 'Suscripciones',  href: '/super-admin/suscripciones', icon: 'ti-credit-card', roles: ['super_admin'] },
  { label: 'Propuestas',      href: '/super-admin/propuestas/nueva', icon: 'ti-file-invoice', roles: ['super_admin'] },
  { label: 'Usuarios',        href: '/usuarios',             icon: 'ti-user-cog',        roles: ['admin'] },
  { label: 'Usuarios',        href: '/super-admin/usuarios', icon: 'ti-user-cog',        roles: ['super_admin'] },
  { label: 'Tabla de aportes', href: '/super-admin/aportes', icon: 'ti-table',           roles: ['super_admin'] },
  { label: 'Configuración',   href: '/configuracion',        icon: 'ti-settings',        roles: ['super_admin','admin'] },
]

const NAV_APODERADO: NavItem[] = [
  { label: 'Inicio',          href: '/portal',                icon: 'ti-home',            roles: ['apoderado'] },
  { label: 'Avances',         href: '/portal/intervencion',   icon: 'ti-heart-handshake', roles: ['apoderado'] },
  { label: 'Informes',        href: '/portal/informes',       icon: 'ti-file-report',     roles: ['apoderado'] },
  { label: 'Agenda',          href: '/portal/agenda',         icon: 'ti-calendar-time',   roles: ['apoderado'] },
  { label: 'Horario',         href: '/portal/horario',        icon: 'ti-table',           roles: ['apoderado'] },
  { label: 'Reporte del día', href: '/portal/reporte-diario', icon: 'ti-clipboard-heart', roles: ['apoderado'] },
  { label: 'Mensajes',        href: '/portal/mensajes',       icon: 'ti-message-2',       roles: ['apoderado'] },
  { label: 'Comunicados',     href: '/portal/comunicados',    icon: 'ti-speakerphone',    roles: ['apoderado'] },
  { label: 'Documentos',      href: '/portal/documentos',     icon: 'ti-file-certificate', roles: ['apoderado'] },
  { label: 'Asistencias',     href: '/portal/asistencias',    icon: 'ti-clipboard-check', roles: ['apoderado'] },
  { label: 'Evaluaciones',   href: '/portal/calificaciones', icon: 'ti-chart-bar',       roles: ['apoderado'] },
  { label: 'Estado de pagos', href: '/portal/pagos',          icon: 'ti-cash',            roles: ['apoderado'] },
  { label: 'Mi perfil',       href: '/portal/perfil',         icon: 'ti-user',            roles: ['apoderado'] },
]

const NAV_ALUMNO: NavItem[] = [
  { label: 'Inicio',          href: '/portal',                icon: 'ti-home',            roles: ['alumno'] },
  { label: 'Mis evaluaciones', href: '/portal/calificaciones', icon: 'ti-chart-bar',       roles: ['alumno'] },
  { label: 'Asistencias',     href: '/portal/asistencias',    icon: 'ti-clipboard-check', roles: ['alumno'] },
  { label: 'Tareas',          href: '/portal/tareas',         icon: 'ti-checklist',       roles: ['alumno'] },
  { label: 'Comunicados',     href: '/portal/comunicados',    icon: 'ti-speakerphone',    roles: ['alumno'] },
  { label: 'Mi perfil',       href: '/portal/perfil',         icon: 'ti-user',            roles: ['alumno'] },
]

const NAV_POSTULANTE: NavItem[] = [
  { label: 'Mi postulación',  href: '/portal/postulacion',    icon: 'ti-file-search',     roles: ['postulante'] },
]

const ROL_BADGE: Record<string, { label: string; color: string; icon: string; accent: string; activeBg: string; activeIndicator: string }> = {
  super_admin:     { label: 'Super Admin',     color: 'bg-[#FEF3EC] text-[#C45A1A] border border-[#C45A1A]/20', icon: 'ti-shield-check',      accent: '#C45A1A', activeBg: 'bg-[#C45A1A]', activeIndicator: '#C45A1A' },
  admin:           { label: 'Administrador',   color: 'bg-[#FEF3EC] text-[#C45A1A] border border-[#C45A1A]/20', icon: 'ti-briefcase',         accent: '#C45A1A', activeBg: 'bg-[#C45A1A]', activeIndicator: '#C45A1A' },
  gestor_admision: { label: 'Gestión Admisión', color: 'bg-[#EDF6FA] text-[#1B3A5C] border border-[#1B3A5C]/15', icon: 'ti-user-plus',        accent: '#1B3A5C', activeBg: 'bg-[#1B3A5C]', activeIndicator: '#1B3A5C' },
  tutor:           { label: 'Profesional',     color: 'bg-[#EDF5F0] text-[#2D5A3F] border border-[#2D5A3F]/20', icon: 'ti-stethoscope',       accent: '#2D5A3F', activeBg: 'bg-[#2D5A3F]', activeIndicator: '#2D5A3F' },
  apoderado:       { label: 'Apoderado',       color: 'bg-[#EDF6FA] text-[#3D7A94] border border-[#3D7A94]/15', icon: 'ti-heart-handshake',   accent: '#3D7A94', activeBg: 'bg-[#3D7A94]', activeIndicator: '#3D7A94' },
  alumno:          { label: 'Alumno',          color: 'bg-[#F3EFFE] text-[#6B4C9A] border border-[#6B4C9A]/20', icon: 'ti-backpack',          accent: '#6B4C9A', activeBg: 'bg-[#6B4C9A]', activeIndicator: '#6B4C9A' },
  postulante:      { label: 'Postulante',      color: 'bg-[#FEF9EC] text-[#8B6914] border border-[#8B6914]/20', icon: 'ti-file-search',       accent: '#8B6914', activeBg: 'bg-[#8B6914]', activeIndicator: '#8B6914' },
}

interface Props { rol?: string; modulosHabilitados?: string[] | null; collapsed?: boolean; onToggleCollapse?: () => void }

// Mapeo: href del sidebar → key del módulo en BD
const HREF_TO_MODULO: Record<string, string> = {
  '/inicio': 'inicio',
  '/matricula': 'matricula',
  '/admision': 'matricula',
  '/alumnos': 'alumnos',
  '/planificacion': 'planificacion',
  '/programas': 'programas',
  '/horario-alumno': 'horarios',
  '/asistencias': 'asistencias',
  '/calificaciones': 'evaluaciones',
  '/comunicados': 'comunicados',
  '/mensajes': 'mensajes',
  '/libro-clases': 'libro_clases',
  '/intervencion': 'intervencion',
  '/agenda': 'agenda',
  '/reporte-diario': 'reporte_diario',
  '/tareas': 'tareas',
  '/contable': 'cobranzas',
  '/cobranza': 'cobranzas',
  '/cobros-sesion': 'cobranzas',
  '/finanzas': 'finanzas',
  '/becas': 'becas',
  '/documentos': 'documentos',
  '/calendario': 'calendario',
  '/fichas': 'fichas',
  '/reportes': 'reportes',
  '/portal': 'inicio',
  '/portal/intervencion': 'intervencion',
  '/portal/informes': 'documentos',
  '/portal/agenda': 'agenda',
  '/portal/reporte-diario': 'reporte_diario',
  '/portal/mensajes': 'mensajes',
  '/portal/comunicados': 'comunicados',
  '/portal/asistencias': 'asistencias',
  '/portal/calificaciones': 'evaluaciones',
  '/portal/pagos': 'pagos',
  '/portal/documentos': 'documentos',
  '/portal/perfil': 'perfil',
  '/portal/tareas': 'tareas',
}

export default function Sidebar({ rol = 'admin', modulosHabilitados = null, collapsed = false, onToggleCollapse }: Props) {
  const pathname  = usePathname()
  const rolTyped  = rol as Rol
  const badge     = ROL_BADGE[rolTyped]
  const isPortal  = rolTyped === 'apoderado' || rolTyped === 'alumno'

  // Mensajes no leídos
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    let mounted = true

    async function fetchUnread() {
      try {
        const res = await fetch('/api/chat')
        if (res.ok) {
          const convs = await res.json()
          const total = (convs as any[]).reduce((acc: number, c: any) => acc + (c.no_leidos ?? 0), 0)
          if (mounted) setUnreadMessages(total)
        }
      } catch { /* silently fail */ }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000) // Cada 30s

    return () => { mounted = false; clearInterval(interval) }
  }, [])

  function renderGroup(items: NavItem[], section: string) {
    let visibles = items.filter(i => i.roles.includes(rolTyped))
    // Filtrar por permisos de BD si existen
    if (modulosHabilitados) {
      visibles = visibles.filter(i => {
        const modKey = HREF_TO_MODULO[i.href]
        if (!modKey) return true // Si no tiene mapeo, mostrar siempre
        return modulosHabilitados.includes(modKey)
      })
    }
    // Inyectar badge de mensajes no leídos
    visibles = visibles.map(i => {
      if ((i.href === '/mensajes' || i.href === '/portal/mensajes') && unreadMessages > 0) {
        return { ...i, badge: unreadMessages }
      }
      return i
    })
    if (!visibles.length) return null

    const roleAccent = badge?.accent || '#1B3A5C'

    return (
      <div className="mb-6">
        {!collapsed && <div className="px-3 py-1 text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-[0.1em] mb-2">{section}</div>}
        {visibles.map(item => {
          const active = pathname === item.href || (item.href !== '/inicio' && item.href !== '/portal' && pathname.startsWith(item.href))
          return (
            <Link key={item.href + item.label} href={item.href} title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-2.5 rounded-lg text-[13px] font-medium mb-[2px] transition-all duration-150 ${collapsed ? 'justify-center px-2 py-[9px]' : 'px-3 py-[9px]'} ${
                active
                  ? 'text-white'
                  : 'text-[#5f6876] hover:bg-[#f4f5f7] hover:text-[var(--ar-text)]'
              }`}
              style={active ? { backgroundColor: roleAccent, boxShadow: '0 1px 3px rgba(26,35,50,0.15)' } : undefined}>
              {active && !collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white/60 rounded-r-full"/>}
              <span className="relative flex-shrink-0">
                <i className={`ti ${item.icon} text-[15px] transition-colors duration-150 ${active ? 'text-white/90' : 'text-[var(--ar-muted)] group-hover:text-[#7c8390]'}`} aria-hidden="true"/>
                {collapsed && !!item.badge && <span className="absolute -top-1 -right-1 w-[7px] h-[7px] rounded-full bg-[var(--ar-danger)] border border-white"/>}
              </span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">{item.badge}</span>}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <aside className={`${collapsed ? 'w-[64px]' : 'w-[220px]'} bg-white border-r border-[var(--ar-border)] flex flex-col shrink-0 h-full lg:h-[calc(100vh-56px)] relative transition-[width] duration-200`}>
      {/* Role accent strip at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-sm" style={{ backgroundColor: badge?.accent || '#1B3A5C' }}/>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-[var(--ar-border)] items-center justify-center hover:bg-[#f4f5f7] transition-colors z-10"
          style={{ boxShadow: 'var(--shadow-sm)' }}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-expanded={!collapsed}
        >
          <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'} text-[13px] text-[var(--ar-muted)]`} aria-hidden="true"/>
        </button>
      )}

      <div className={`px-4 pt-5 pb-3 ${collapsed ? 'flex justify-center px-2' : ''}`}>
        {badge && (
          collapsed ? (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badge.color}`} title={badge.label}>
              <i className={`ti ${badge.icon} text-[13px]`} aria-hidden="true"/>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-[6px] rounded-lg text-[10px] font-semibold ${badge.color}`}>
              <i className={`ti ${badge.icon} text-[11px]`} aria-hidden="true"/> {badge.label}
            </div>
          )
        )}
      </div>
      <nav className="flex-1 py-2 px-3 overflow-y-auto overflow-x-hidden" aria-label="Navegación principal">
        {rolTyped === 'apoderado' && renderGroup(NAV_APODERADO, 'Mi espacio')}
        {rolTyped === 'alumno'    && renderGroup(NAV_ALUMNO,    'Mi espacio')}
        {rolTyped === 'postulante' && renderGroup(NAV_POSTULANTE, 'Mi postulación')}
        {!isPortal && (
          <>
            {renderGroup(NAV_PRINCIPAL, 'Principal')}
            {renderGroup(NAV_GESTION,   'Gestión')}
            {renderGroup(NAV_CUENTA,    'Cuenta')}
          </>
        )}
      </nav>
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#f3f4f6]">
          <div className="text-[10px] text-[var(--ar-muted)] tracking-wide">Kiva360 v1.0</div>
        </div>
      )}
    </aside>
  )
}
