'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Rol = 'super_admin' | 'admin' | 'pastor_campus' | 'gestor_admision' | 'tutor' | 'apoderado' | 'alumno' | 'postulante' | 'finanzas' | 'recepcion'

interface NavItem {
  label: string; href: string; icon: string; badge?: number; roles: Rol[]; description?: string
}

const NAV_PRINCIPAL: NavItem[] = [
  { label: 'Inicio',          href: '/inicio',          icon: 'ti-home',             roles: ['super_admin','admin','gestor_admision','tutor','finanzas','recepcion'], description: 'Resumen del día: agenda, pendientes y avisos importantes.' },
]

const NAV_PERSONAS: NavItem[] = [
  { label: 'Matrícula',       href: '/matricula',       icon: 'ti-user-plus',        roles: ['super_admin','admin','gestor_admision'], description: 'Postulaciones, matrículas y el estado de cada proceso de ingreso.' },
  { label: 'Admisión',        href: '/admision',        icon: 'ti-inbox',            roles: ['super_admin','admin','gestor_admision'], description: 'Seguimiento de prospectos y familias interesadas en el centro.' },
  { label: 'Mis alumnos',     href: '/alumnos',         icon: 'ti-users',            roles: ['tutor'], description: 'Ficha completa de tus alumnos: datos, historial y documentos.' },
  { label: 'Alumnos',         href: '/alumnos',         icon: 'ti-users',            roles: ['super_admin','admin','gestor_admision','finanzas','recepcion'], description: 'Ficha completa de cada alumno: datos, historial y documentos.' },
]

const NAV_CLINICO: NavItem[] = [
  { label: 'Intervención NEE', href: '/intervencion', icon: 'ti-heart-handshake', roles: ['super_admin','admin','tutor'], description: 'Planes de intervención y seguimiento terapéutico de cada alumno.' },
  { label: 'Agenda',           href: '/agenda',        icon: 'ti-calendar-time',    roles: ['super_admin','admin','tutor','recepcion'], description: 'Sesiones terapéuticas agendadas y horas disponibles por profesional.' },
  { label: 'Reporte diario', href: '/reporte-diario', icon: 'ti-clipboard-heart',  roles: ['super_admin','admin','tutor'], description: 'Bitácora diaria que se envía a las familias sobre el día del alumno.' },
  { label: 'Incidentes',    href: '/incidentes',     icon: 'ti-alert-circle',     roles: ['super_admin','admin','tutor'], description: 'Registra incidentes o situaciones relevantes con firma digital.' },
]

const NAV_ACADEMICO: NavItem[] = [
  { label: 'Planificación',   href: '/planificacion',   icon: 'ti-layout-board',     roles: ['super_admin','admin','tutor'], description: 'Organiza las planificaciones de clases y actividades pedagógicas.' },
  { label: 'Programas',       href: '/programas',       icon: 'ti-category',         roles: ['super_admin','admin','tutor'], description: 'Gestiona los programas y niveles que ofrece el centro.' },
  { label: 'Horario alumno',  href: '/horario-alumno',  icon: 'ti-calendar-time',    roles: ['super_admin','admin','tutor'], description: 'Define y consulta el horario semanal de cada alumno.' },
  { label: 'Asistencias',     href: '/asistencias',     icon: 'ti-clipboard-check',  roles: ['super_admin','admin','tutor'], description: 'Registra y revisa la asistencia diaria de los alumnos.' },
  { label: 'Evaluaciones',   href: '/calificaciones',  icon: 'ti-chart-bar',        roles: ['super_admin','admin','tutor'], description: 'Calificaciones y evaluaciones registradas por curso y alumno.' },
  { label: 'Tareas',         href: '/tareas',         icon: 'ti-checklist',        roles: ['super_admin','admin','tutor'], description: 'Asigna y revisa tareas pendientes para el equipo o los alumnos.' },
]

const NAV_COMUNICACION: NavItem[] = [
  { label: 'Comunicados',     href: '/comunicados',     icon: 'ti-speakerphone',     roles: ['super_admin','admin','gestor_admision','tutor','finanzas','recepcion'], description: 'Envía avisos y comunicados a familias o al equipo.' },
  { label: 'Mensajes',        href: '/mensajes',        icon: 'ti-message-2',        roles: ['super_admin','admin','gestor_admision','tutor','finanzas','recepcion'], description: 'Chat directo con otros usuarios del centro.' },
]

const NAV_FINANZAS: NavItem[] = [
  { label: 'Finanzas',           href: '/finanzas',       icon: 'ti-report-analytics', roles: ['super_admin','admin','pastor_campus','finanzas'], description: 'Dashboard financiero: facturación, cobros y documentos tributarios.' },
  { label: 'Valores Programas',   href: '/contable',       icon: 'ti-cash',             roles: ['super_admin','admin','gestor_admision','finanzas'], description: 'Define los precios de aranceles, matrículas y mensualidades.' },
  { label: 'Cobranza',           href: '/cobranza',       icon: 'ti-report-money',     roles: ['super_admin','admin','finanzas'], description: 'Seguimiento de pagos pendientes y morosidad de las familias.' },
  { label: 'Cobros sesión',      href: '/cobros-sesion',  icon: 'ti-receipt-2',        roles: ['super_admin','admin','finanzas'], description: 'Cobro individual por sesión terapéutica y planes prepagados.' },
]

const NAV_RECURSOS: NavItem[] = [
  { label: 'Documentos',         href: '/documentos',   icon: 'ti-folder',           roles: ['super_admin','admin','gestor_admision','tutor'], description: 'Documentos oficiales y archivos compartidos con las familias.' },
  { label: 'Becas',              href: '/becas',          icon: 'ti-school',           roles: ['super_admin','admin','gestor_admision'], description: 'Postulación y administración de becas y descuentos.' },
  { label: 'Calendario',         href: '/calendario',   icon: 'ti-calendar',         roles: ['super_admin','admin','gestor_admision','tutor'], description: 'Calendario general de actividades y fechas importantes del centro.' },
  { label: 'Fichas pedagógicas', href: '/fichas',       icon: 'ti-books',            roles: ['super_admin','admin','tutor'], description: 'Material y fichas de apoyo para el trabajo pedagógico.' },
  { label: 'Reportes',           href: '/reportes',     icon: 'ti-file-analytics',   roles: ['super_admin','admin','finanzas'], description: 'Reportes y estadísticas generales del centro.' },
]

const NAV_CUENTA: NavItem[] = [
  { label: 'Panel Kiva360',   href: '/super-admin',          icon: 'ti-dashboard', roles: ['super_admin'], description: 'Panel general para administrar todos los colegios de la plataforma.' },
  { label: 'Suscripciones',  href: '/super-admin/suscripciones', icon: 'ti-credit-card', roles: ['super_admin'], description: 'Estado de las suscripciones de cada colegio a Kiva360.' },
  { label: 'Propuestas',      href: '/super-admin/propuestas/nueva', icon: 'ti-file-invoice', roles: ['super_admin'], description: 'Crea propuestas comerciales para nuevos centros.' },
  { label: 'Usuarios',        href: '/usuarios',             icon: 'ti-user-cog',        roles: ['admin'], description: 'Administra los usuarios y roles de tu equipo.' },
  { label: 'Usuarios',        href: '/super-admin/usuarios', icon: 'ti-user-cog',        roles: ['super_admin'], description: 'Administra los usuarios de todos los colegios.' },
  { label: 'Tabla de aportes', href: '/super-admin/aportes', icon: 'ti-table',           roles: ['super_admin'], description: 'Configura los montos de aportes por nivel y sede.' },
  { label: 'Configuración',   href: '/configuracion',        icon: 'ti-settings',        roles: ['super_admin','admin'], description: 'Datos del colegio, permisos y configuración tributaria.' },
]

const NAV_APODERADO: NavItem[] = [
  { label: 'Inicio',          href: '/portal',                icon: 'ti-home',            roles: ['apoderado'], description: 'Resumen de la actividad de tu hijo/a en el centro.' },
  { label: 'Avances',         href: '/portal/intervencion',   icon: 'ti-heart-handshake', roles: ['apoderado'], description: 'Seguimiento de los avances de su plan de intervención.' },
  { label: 'Informes',        href: '/portal/informes',       icon: 'ti-file-report',     roles: ['apoderado'], description: 'Informes terapéuticos y pedagógicos compartidos contigo.' },
  { label: 'Agenda',          href: '/portal/agenda',         icon: 'ti-calendar-time',   roles: ['apoderado'], description: 'Próximas sesiones y horas agendadas.' },
  { label: 'Horario',         href: '/portal/horario',        icon: 'ti-table',           roles: ['apoderado'], description: 'Horario semanal de tu hijo/a.' },
  { label: 'Reporte del día', href: '/portal/reporte-diario', icon: 'ti-clipboard-heart', roles: ['apoderado'], description: 'Cómo le fue hoy a tu hijo/a en el centro.' },
  { label: 'Mensajes',        href: '/portal/mensajes',       icon: 'ti-message-2',       roles: ['apoderado'], description: 'Chat directo con el equipo del centro.' },
  { label: 'Comunicados',     href: '/portal/comunicados',    icon: 'ti-speakerphone',    roles: ['apoderado'], description: 'Avisos y comunicados enviados por el centro.' },
  { label: 'Documentos',      href: '/portal/documentos',     icon: 'ti-file-certificate', roles: ['apoderado'], description: 'Documentos y certificados disponibles para descargar.' },
  { label: 'Asistencias',     href: '/portal/asistencias',    icon: 'ti-clipboard-check', roles: ['apoderado'], description: 'Historial de asistencia de tu hijo/a.' },
  { label: 'Evaluaciones',   href: '/portal/calificaciones', icon: 'ti-chart-bar',       roles: ['apoderado'], description: 'Calificaciones y evaluaciones de tu hijo/a.' },
  { label: 'Estado de pagos', href: '/portal/pagos',          icon: 'ti-cash',            roles: ['apoderado'], description: 'Aportes pendientes, boletas y progreso de paquetes de sesiones.' },
  { label: 'Mi perfil',       href: '/portal/perfil',         icon: 'ti-user',            roles: ['apoderado'], description: 'Tus datos de contacto y preferencias de cuenta.' },
]

const NAV_ALUMNO: NavItem[] = [
  { label: 'Inicio',          href: '/portal',                icon: 'ti-home',            roles: ['alumno'], description: 'Resumen de tu actividad en el centro.' },
  { label: 'Mis evaluaciones', href: '/portal/calificaciones', icon: 'ti-chart-bar',       roles: ['alumno'], description: 'Tus calificaciones y evaluaciones.' },
  { label: 'Asistencias',     href: '/portal/asistencias',    icon: 'ti-clipboard-check', roles: ['alumno'], description: 'Tu historial de asistencia.' },
  { label: 'Tareas',          href: '/portal/tareas',         icon: 'ti-checklist',       roles: ['alumno'], description: 'Tareas pendientes asignadas por tus profesores.' },
  { label: 'Comunicados',     href: '/portal/comunicados',    icon: 'ti-speakerphone',    roles: ['alumno'], description: 'Avisos del centro para ti.' },
  { label: 'Mi perfil',       href: '/portal/perfil',         icon: 'ti-user',            roles: ['alumno'], description: 'Tus datos de cuenta.' },
]

const NAV_POSTULANTE: NavItem[] = [
  { label: 'Mi postulación',  href: '/portal/postulacion',    icon: 'ti-file-search',     roles: ['postulante'], description: 'Estado de tu proceso de postulación al centro.' },
]

const ROL_BADGE: Record<string, { label: string; color: string; icon: string; accent: string; activeBg: string; activeIndicator: string }> = {
  super_admin:     { label: 'Super Admin',     color: 'bg-[#FEF3EC] text-[#C45A1A] border border-[#C45A1A]/20', icon: 'ti-shield-check',      accent: '#C45A1A', activeBg: 'bg-[#C45A1A]', activeIndicator: '#C45A1A' },
  admin:           { label: 'Administrador',   color: 'bg-[#FEF3EC] text-[#C45A1A] border border-[#C45A1A]/20', icon: 'ti-briefcase',         accent: '#C45A1A', activeBg: 'bg-[#C45A1A]', activeIndicator: '#C45A1A' },
  gestor_admision: { label: 'Gestión Admisión', color: 'bg-[#EDF6FA] text-[#1B3A5C] border border-[#1B3A5C]/15', icon: 'ti-user-plus',        accent: '#1B3A5C', activeBg: 'bg-[#1B3A5C]', activeIndicator: '#1B3A5C' },
  tutor:           { label: 'Profesional',     color: 'bg-[#EDF5F0] text-[#2D5A3F] border border-[#2D5A3F]/20', icon: 'ti-stethoscope',       accent: '#2D5A3F', activeBg: 'bg-[#2D5A3F]', activeIndicator: '#2D5A3F' },
  apoderado:       { label: 'Apoderado',       color: 'bg-[#EDF6FA] text-[#3D7A94] border border-[#3D7A94]/15', icon: 'ti-heart-handshake',   accent: '#3D7A94', activeBg: 'bg-[#3D7A94]', activeIndicator: '#3D7A94' },
  alumno:          { label: 'Alumno',          color: 'bg-[#F3EFFE] text-[#6B4C9A] border border-[#6B4C9A]/20', icon: 'ti-backpack',          accent: '#6B4C9A', activeBg: 'bg-[#6B4C9A]', activeIndicator: '#6B4C9A' },
  postulante:      { label: 'Postulante',      color: 'bg-[#FEF9EC] text-[#8B6914] border border-[#8B6914]/20', icon: 'ti-file-search',       accent: '#8B6914', activeBg: 'bg-[#8B6914]', activeIndicator: '#8B6914' },
  finanzas:        { label: 'Finanzas',        color: 'bg-[#EDF7F2] text-[#2D7A54] border border-[#2D7A54]/20', icon: 'ti-report-analytics',  accent: '#2D7A54', activeBg: 'bg-[#2D7A54]', activeIndicator: '#2D7A54' },
  recepcion:       { label: 'Recepción',       color: 'bg-[#F3F0F9] text-[#5B3E9E] border border-[#5B3E9E]/20', icon: 'ti-headset',           accent: '#5B3E9E', activeBg: 'bg-[#5B3E9E]', activeIndicator: '#5B3E9E' },
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

const SECTION_META: Record<string, { icon: string }> = {
  'Principal':     { icon: 'ti-layout-dashboard' },
  'Personas':      { icon: 'ti-users' },
  'Clínico':       { icon: 'ti-heart-handshake' },
  'Académico':     { icon: 'ti-book-2' },
  'Comunicación':  { icon: 'ti-message-2' },
  'Finanzas':      { icon: 'ti-report-analytics' },
  'Recursos':      { icon: 'ti-folder' },
  'Cuenta':        { icon: 'ti-settings' },
  'Mi espacio':    { icon: 'ti-home' },
  'Mi postulación': { icon: 'ti-file-search' },
}

const SIDEBAR_COLLAPSED_SECTIONS_KEY = 'kiva360_sidebar_collapsed_sections'

export default function Sidebar({ rol = 'admin', modulosHabilitados = null, collapsed = false, onToggleCollapse }: Props) {
  const pathname  = usePathname()
  const rolTyped  = rol as Rol
  const badge     = ROL_BADGE[rolTyped]
  const isPortal  = rolTyped === 'apoderado' || rolTyped === 'alumno'

  // Mensajes no leídos
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Secciones del menú colapsadas (acordeón), persistido por navegador.
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_COLLAPSED_SECTIONS_KEY)
      if (raw) setCollapsedSections(new Set(JSON.parse(raw)))
    } catch { /* localStorage no disponible */ }
  }, [])

  function toggleSection(section: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      try { localStorage.setItem(SIDEBAR_COLLAPSED_SECTIONS_KEY, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
      return next
    })
  }

  // Tooltip descriptivo al pasar el mouse por un ítem del menú.
  // Se renderiza vía portal en document.body porque el <nav> tiene
  // overflow-x-hidden (para el scroll vertical de la lista) y eso
  // recortaría un tooltip posicionado con CSS normal.
  const [hovered, setHovered] = useState<{ item: NavItem; rect: DOMRect } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setHovered(null) }, [pathname])

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
    const containsActive = visibles.some(item =>
      pathname === item.href || (item.href !== '/inicio' && item.href !== '/portal' && pathname.startsWith(item.href))
    )
    const isOpen = collapsed || containsActive || !collapsedSections.has(section)
    const meta = SECTION_META[section]

    return (
      <div className="mb-2">
        {!collapsed && (
          <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center gap-1.5 px-3 py-[7px] mb-0.5 rounded-md text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-[0.08em] hover:bg-[#f4f5f7] hover:text-[var(--ar-text)] transition-colors"
            aria-expanded={isOpen}
          >
            {meta && <i className={`ti ${meta.icon} text-[12px]`} aria-hidden="true"/>}
            <span className="flex-1 text-left">{section}</span>
            <i className={`ti ti-chevron-down text-[11px] transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} aria-hidden="true"/>
          </button>
        )}
        <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
          <div className="overflow-hidden">
        {visibles.map(item => {
          const active = pathname === item.href || (item.href !== '/inicio' && item.href !== '/portal' && pathname.startsWith(item.href))
          return (
            <Link key={item.href + item.label} href={item.href}
              title={item.description ? undefined : (collapsed ? item.label : undefined)}
              onMouseEnter={e => item.description && setHovered({ item, rect: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setHovered(null)}
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
        </div>
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
            {renderGroup(NAV_PRINCIPAL,    'Principal')}
            {renderGroup(NAV_PERSONAS,     'Personas')}
            {renderGroup(NAV_CLINICO,      'Clínico')}
            {renderGroup(NAV_ACADEMICO,    'Académico')}
            {renderGroup(NAV_COMUNICACION, 'Comunicación')}
            {renderGroup(NAV_FINANZAS,     'Finanzas')}
            {renderGroup(NAV_RECURSOS,     'Recursos')}
            {renderGroup(NAV_CUENTA,       'Cuenta')}
          </>
        )}
      </nav>
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#f3f4f6]">
          <div className="text-[10px] text-[var(--ar-muted)] tracking-wide">Kiva360 v1.0</div>
        </div>
      )}

      {mounted && hovered && createPortal(
        <div
          className="pointer-events-none fixed z-[100] w-56 rounded-lg bg-[#1a2332] px-3 py-2 text-[11px] leading-snug text-white shadow-lg"
          style={{ top: hovered.rect.top + hovered.rect.height / 2, left: hovered.rect.right + 10, transform: 'translateY(-50%)' }}
        >
          {collapsed && <div className="mb-0.5 font-semibold">{hovered.item.label}</div>}
          {hovered.item.description}
        </div>,
        document.body
      )}
    </aside>
  )
}
