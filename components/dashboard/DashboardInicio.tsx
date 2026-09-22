'use client'

import { formatMonto } from '@/lib/utils'
import Link from 'next/link'
import CumpleanosWidget from '@/components/dashboard/CumpleanosWidget'

interface Props {
  usuario: any
  rol: string
  stats: {
    totalAlumnos: number
    totalComunicados: number
    recaudado: number
    enMora: number
    pctAsistencia: number | null
    moraCritica: number
  }
  nee?: {
    planesActivos: number
    alumnosConNEE: number
    actasPendientes: number
    proximasSesiones: { id: string; fecha: string; hora: string; tipo: string; alumno: string; profesional: string }[]
  } | null
  notificaciones: any[]
  ultimosComunicados: any[]
  mesActual: string
  pendientes?: { texto: string; href: string; icon: string; tipo: 'warning' | 'info' | 'action' }[]
}

const HORA = new Date().getHours()
const SALUDO = HORA < 12 ? 'Buenos días' : HORA < 19 ? 'Buenas tardes' : 'Buenas noches'

const TIPO_SESION_LABEL: Record<string, string> = {
  individual: 'Individual',
  grupal: 'Grupal',
  familiar: 'Familiar',
  evaluacion: 'Evaluación',
  coordinacion: 'Coordinación',
}

function formatFechaCorta(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy.getTime() + 86400000)
  const target = new Date(y, m - 1, d)
  if (target.getTime() === hoy.getTime()) return 'Hoy'
  if (target.getTime() === manana.getTime()) return 'Mañana'
  return target.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function DashboardInicio({ usuario, rol, stats, nee, notificaciones, ultimosComunicados, mesActual, pendientes = [] }: Props) {
  const notifsNoLeidas = notificaciones.filter(n => !n.leida).length

  const kpisAdmin = [
    { label: 'Alumnos activos', val: stats.totalAlumnos.toString(), sub: mesActual, href: '/alumnos', icon: 'ti-users', color: 'indigo' as const },
    { label: 'Asistencia hoy', val: stats.pctAsistencia != null ? `${stats.pctAsistencia}%` : '—', sub: mesActual, href: '/asistencias', icon: 'ti-clipboard-check', color: 'sage' as const },
    { label: 'Recaudado', val: formatMonto(stats.recaudado), sub: mesActual, href: '/contable', icon: 'ti-cash-banknote', color: 'violet' as const },
    { label: 'En mora', val: formatMonto(stats.enMora), sub: stats.enMora > 0 ? 'Requiere atención' : 'Sin pendientes', href: '/contable', icon: 'ti-alert-triangle', color: stats.enMora > 0 ? 'coral' as const : 'sage' as const },
  ]

  const kpisTutor = [
    { label: 'Mis alumnos', val: stats.totalAlumnos.toString(), sub: 'activos en mi curso', href: '/alumnos', icon: 'ti-users', color: 'indigo' as const },
    { label: 'Asistencia hoy', val: stats.pctAsistencia != null ? `${stats.pctAsistencia}%` : '—', sub: 'de mi curso', href: '/asistencias', icon: 'ti-clipboard-check', color: 'sage' as const },
    { label: 'Comunicados', val: stats.totalComunicados.toString(), sub: 'enviados', href: '/comunicados', icon: 'ti-speakerphone', color: 'violet' as const },
  ]

  const colorMap: Record<string, { bg: string; fg: string }> = {
    indigo: { bg: 'bg-[var(--ar-primary-l)]', fg: 'text-[var(--ar-navy)]' },
    sage:   { bg: 'bg-[#eaf5ee]',              fg: 'text-[var(--ar-success)]' },
    violet: { bg: 'bg-[#f1edfa]',              fg: 'text-[var(--ar-blue)]' },
    coral:  { bg: 'bg-[var(--ar-accent-l)]',   fg: 'text-[var(--ar-accent)]' },
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Saludo */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ar-text)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {SALUDO}, {usuario?.nombre}
          </h1>
          <p className="text-[var(--ar-muted)] text-sm mt-1">
            {rol === 'super_admin' ? 'Panel de gestión Kiva360' :
             rol === 'tutor'       ? `Docente · ${usuario?.colegio?.nombre ?? ''}` :
             `${usuario?.colegio?.nombre ?? ''} · Panel de administración`}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider">{new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      {/* KPIs — Admin */}
      {(rol === 'admin' || rol === 'super_admin') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {kpisAdmin.map((k, i) => (
            <Link key={i} href={k.href} className="kpi-card group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[k.color].bg}`}>
                <i className={`ti ${k.icon} text-[17px] ${colorMap[k.color].fg}`} aria-hidden="true"/>
              </div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value group-hover:text-[var(--ar-navy)] transition-colors">{k.val}</div>
              <div className="kpi-sub">{k.sub}</div>
            </Link>
          ))}
        </div>
      )}

      {/* KPIs — Tutor (pedagógicos) */}
      {rol === 'tutor' && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpisTutor.map((k, i) => (
            <Link key={i} href={k.href} className="kpi-card group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[k.color].bg}`}>
                <i className={`ti ${k.icon} text-[17px] ${colorMap[k.color].fg}`} aria-hidden="true"/>
              </div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value group-hover:text-[var(--ar-navy)] transition-colors">{k.val}</div>
              <div className="kpi-sub">{k.sub}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Intervención NEE — Admin/Super admin */}
      {nee && (nee.planesActivos > 0 || nee.alumnosConNEE > 0 || nee.proximasSesiones.length > 0) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-heart-handshake text-[var(--ar-blue)]" aria-hidden="true"/>
            <h2 className="font-semibold text-[var(--ar-text)] text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>Intervención NEE</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mini stats NEE */}
            <div className="lg:col-span-1 grid grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="card p-4">
                <div className="text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Planes activos</div>
                <div className="text-xl font-bold text-[var(--ar-navy)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{nee.planesActivos}</div>
              </div>
              <div className="card p-4">
                <div className="text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Alumnos con NEE</div>
                <div className="text-xl font-bold text-[var(--ar-navy)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{nee.alumnosConNEE}</div>
              </div>
              <Link href="/incidentes" className="card p-4 hover:border-[var(--ar-accent)]/30 transition-colors">
                <div className="text-[10px] font-semibold text-[var(--ar-muted)] uppercase tracking-wider mb-1">Actas por firmar</div>
                <div className={`text-xl font-bold ${nee.actasPendientes > 0 ? 'text-[var(--ar-accent)]' : 'text-[var(--ar-navy)]'}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>{nee.actasPendientes}</div>
              </Link>
            </div>

            {/* Próximas sesiones */}
            <div className="lg:col-span-2 card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-semibold text-[var(--ar-text)]">Próximas sesiones terapéuticas</h3>
                <Link href="/agenda" className="text-[11px] text-[var(--ar-muted)] hover:text-[var(--ar-text)] transition-colors">Ver agenda →</Link>
              </div>
              {nee.proximasSesiones.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)] py-3">Sin sesiones agendadas en los próximos 7 días.</p>
              ) : (
                <div className="space-y-1.5">
                  {nee.proximasSesiones.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-[var(--ar-border)] last:border-0">
                      <div className="w-16 flex-shrink-0 text-[11px] font-semibold text-[var(--ar-navy)]">{formatFechaCorta(s.fecha)}</div>
                      <div className="w-12 flex-shrink-0 text-[11px] text-[var(--ar-muted)]">{s.hora}</div>
                      <div className="flex-1 min-w-0 text-[12px] font-medium text-[var(--ar-text)] truncate">{s.alumno}</div>
                      <div className="hidden sm:block text-[11px] text-[var(--ar-muted)] truncate">{s.profesional}</div>
                      <span className="tag tag-blue flex-shrink-0">{TIPO_SESION_LABEL[s.tipo] ?? s.tipo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Acciones pendientes */}
        {pendientes.length > 0 && (
          <div className="col-span-3 mb-2">
            <h2 className="font-semibold text-[var(--ar-text)] text-sm mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              <i className="ti ti-alert-circle text-amber-500 mr-1.5" aria-hidden="true"/>
              Acciones pendientes
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {pendientes.map((p, i) => (
                <Link key={i} href={p.href} className={`flex items-center gap-3 rounded-xl p-3 border transition-all hover:scale-[1.01] ${
                  p.tipo === 'warning' ? 'bg-amber-50 border-amber-200 hover:border-amber-300' :
                  p.tipo === 'action'  ? 'bg-blue-50 border-blue-200 hover:border-blue-300' :
                  'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    p.tipo === 'warning' ? 'bg-amber-100' :
                    p.tipo === 'action'  ? 'bg-blue-100' :
                    'bg-slate-100'
                  }`}>
                    <i className={`ti ${p.icon} text-sm ${
                      p.tipo === 'warning' ? 'text-amber-700' :
                      p.tipo === 'action'  ? 'text-blue-700' :
                      'text-slate-600'
                    }`} aria-hidden="true"/>
                  </div>
                  <span className={`text-[12px] font-medium ${
                    p.tipo === 'warning' ? 'text-amber-800' :
                    p.tipo === 'action'  ? 'text-blue-800' :
                    'text-slate-700'
                  }`}>{p.texto}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Últimos comunicados */}
        <div className="col-span-2">
          {ultimosComunicados.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[var(--ar-text)] text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>Últimos comunicados</h2>
                <Link href="/comunicados" className="text-[11px] text-[var(--ar-muted)] hover:text-[var(--ar-text)] transition-colors">Ver todos →</Link>
              </div>
              <div className="space-y-2">
                {ultimosComunicados.map((c: any) => (
                  <div key={c.id} className="bg-white border border-[var(--ar-border)] rounded-lg p-3 flex items-center gap-3 hover:border-[#dfe1e6] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      c.tipo === 'urgente' ? 'bg-[var(--ar-accent-l)]' : c.tipo === 'cobro' ? 'bg-amber-50' : 'bg-[var(--ar-primary-l)]'
                    }`}>
                      <i className={`ti ${c.tipo === 'urgente' ? 'ti-alert-triangle text-[var(--ar-accent)]' : c.tipo === 'cobro' ? 'ti-cash text-[#b7791f]' : 'ti-mail text-[var(--ar-navy)]'} text-sm`} aria-hidden="true"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--ar-text)] text-[13px] truncate">{c.titulo}</div>
                      <div className="text-[11px] text-[var(--ar-muted)]">{c.enviado_at ? new Date(c.enviado_at).toLocaleDateString('es-CL') : 'Borrador'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--ar-text)] text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>Notificaciones</h2>
            {notifsNoLeidas > 0 && (
              <span className="bg-[var(--ar-danger)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{notifsNoLeidas}</span>
            )}
          </div>
          <div className="space-y-2">
            {notificaciones.length === 0 ? (
              <div className="card p-8 text-center">
                <i className="ti ti-bell-off text-2xl text-[#d1d5db] block mb-2" aria-hidden="true"/>
                <p className="text-[var(--ar-muted)] text-xs">Sin notificaciones pendientes</p>
              </div>
            ) : notificaciones.map((n: any) => (
              <div key={n.id} className={`rounded-lg p-3 border transition-colors ${n.leida ? 'bg-white border-[var(--ar-border)]' : 'bg-[var(--ar-primary-l)] border-[var(--ar-blue)]/20'}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--ar-text)]">{n.titulo}</div>
                    {n.mensaje && <div className="text-[11px] text-[var(--ar-muted)] mt-0.5 line-clamp-2">{n.mensaje}</div>}
                    <div className="text-[10px] text-[var(--ar-muted)] mt-1">{new Date(n.created_at).toLocaleDateString('es-CL')}</div>
                  </div>
                  {!n.leida && <div className="w-2 h-2 bg-[var(--ar-accent)] rounded-full flex-shrink-0 mt-1"/>}
                </div>
              </div>
            ))}
          </div>

          {/* Alerta mora crítica */}
          {stats.moraCritica > 0 && (rol === 'admin' || rol === 'super_admin') && (
            <Link href="/contable" className="mt-3 block bg-[var(--ar-accent-l)] border border-[var(--ar-accent)]/20 rounded-lg p-3 hover:border-[var(--ar-accent)]/40 transition-colors">
              <div className="flex items-center gap-2">
                <i className="ti ti-alert-circle text-[var(--ar-accent)] text-sm" aria-hidden="true"/>
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ar-accent)]">{stats.moraCritica} familia{stats.moraCritica > 1 ? 's' : ''} en mora crítica</div>
                  <div className="text-[10px] text-[var(--ar-accent)]/70">+2 meses sin pagar</div>
                </div>
              </div>
            </Link>
          )}

          {/* Widget cumpleaños */}
          <div className="mt-3">
            <CumpleanosWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
