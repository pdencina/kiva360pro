export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PermisosColegioClient from '@/components/configuracion/PermisosColegioClient'

export const metadata = { title: 'Permisos del equipo' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Modules ordered for the UI
const MODULOS = [
  { key: 'alumnos',       label: 'Alumnos',           grupo: 'Académico',   icon: 'ti-users' },
  { key: 'programas',     label: 'Programas',          grupo: 'Académico',   icon: 'ti-category' },
  { key: 'horarios',      label: 'Horario individual', grupo: 'Académico',   icon: 'ti-calendar-time' },
  { key: 'planificacion', label: 'Planificación',       grupo: 'Académico',   icon: 'ti-layout-board' },
  { key: 'asistencias',   label: 'Asistencias',         grupo: 'Académico',   icon: 'ti-clipboard-check' },
  { key: 'evaluaciones',  label: 'Evaluaciones',        grupo: 'Académico',   icon: 'ti-chart-bar' },
  { key: 'libro_clases',  label: 'Libro de clases',     grupo: 'Académico',   icon: 'ti-notebook' },
  { key: 'fichas',        label: 'Fichas pedagógicas',  grupo: 'Académico',   icon: 'ti-books' },
  { key: 'intervencion',  label: 'Intervención NEE',    grupo: 'Terapéutico', icon: 'ti-heart-handshake' },
  { key: 'agenda',        label: 'Agenda',              grupo: 'Terapéutico', icon: 'ti-calendar-event' },
  { key: 'reporte_diario',label: 'Reporte diario',      grupo: 'Terapéutico', icon: 'ti-clipboard-heart' },
  { key: 'tareas',        label: 'Tareas',              grupo: 'Terapéutico', icon: 'ti-checklist' },
  { key: 'comunicados',   label: 'Comunicados',         grupo: 'Comunicación',icon: 'ti-speakerphone' },
  { key: 'mensajes',      label: 'Mensajes',            grupo: 'Comunicación',icon: 'ti-message-2' },
  { key: 'matricula',     label: 'Matrícula',           grupo: 'Gestión',     icon: 'ti-user-plus' },
  { key: 'cobranzas',     label: 'Cobranzas',           grupo: 'Gestión',     icon: 'ti-cash' },
  { key: 'documentos',    label: 'Documentos',          grupo: 'Gestión',     icon: 'ti-folder' },
  { key: 'calendario',    label: 'Calendario',          grupo: 'Gestión',     icon: 'ti-calendar' },
  { key: 'reportes',      label: 'Reportes',            grupo: 'Gestión',     icon: 'ti-file-analytics' },
]

const ROLES_EDITABLES = [
  { key: 'tutor',            label: 'Profesional / Terapeuta', desc: 'Educadoras, fonoaudiólogas, terapeutas' },
  { key: 'gestor_admision',  label: 'Gestor de admisión',      desc: 'Secretaría, recepción' },
  { key: 'pastor_campus',    label: 'Director Campus',         desc: 'Subdirector, jefe de área' },
]

export default async function PermisosColegioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  // Solo admin puede gestionar permisos
  if (!['super_admin', 'admin'].includes(usuario?.rol)) redirect('/configuracion')

  const { data: permisos } = await admin
    .from('permisos_rol')
    .select('*')
    .is('colegio_id', null)
    .in('rol', ['tutor', 'gestor_admision', 'pastor_campus'])
    .order('rol')
    .order('modulo')

  return (
    <PermisosColegioClient
      permisos={(permisos as any[]) ?? []}
      modulos={MODULOS}
      roles={ROLES_EDITABLES}
    />
  )
}
