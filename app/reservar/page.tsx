import { createClient as createAdminClient } from '@supabase/supabase-js'
import ReservarFormClient from '@/components/reservas/ReservarFormClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Reservar hora — Kiva360' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function ErrorScreen({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ar-bg)] p-6">
      <div className="max-w-md text-center">
        <i className="ti ti-calendar-off text-4xl text-[var(--ar-muted)] block mb-3" aria-hidden="true"/>
        <p className="text-[14px] text-[var(--ar-text)]">{mensaje}</p>
      </div>
    </div>
  )
}

export default async function ReservarPage({ searchParams }: { searchParams: { c?: string } }) {
  const colegioId = searchParams.c
  if (!colegioId) return <ErrorScreen mensaje="Link de reserva inválido. Contacta al centro para obtener el link correcto." />

  const admin = getAdmin()
  const { data: colegio } = await admin.from('colegios').select('id, nombre, logo_url, modulos_activos').eq('id', colegioId).single()

  if (!colegio) return <ErrorScreen mensaje="No encontramos este centro." />

  const modulos: string[] = (colegio as any).modulos_activos ?? []
  if (!modulos.includes('salud')) {
    return <ErrorScreen mensaje="Este centro no tiene habilitada la reserva de horas en línea. Contáctalos directamente." />
  }

  const { data: profesionales } = await admin
    .from('usuarios')
    .select('id, nombre, apellido')
    .eq('colegio_id', colegioId)
    .eq('activo', true)
    .in('rol', ['admin', 'tutor', 'pastor_campus'])
    .order('apellido')

  return (
    <ReservarFormClient
      colegio={colegio as any}
      profesionales={(profesionales as any[]) ?? []}
    />
  )
}
