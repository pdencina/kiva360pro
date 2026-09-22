import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// GET /api/reservas-publicas/disponibilidad?colegio_id=&profesional_id=&fecha=YYYY-MM-DD
// Público — no requiere sesión. Solo lee horarios/ocupación, nunca escribe.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const colegioId = searchParams.get('colegio_id')
  const profesionalId = searchParams.get('profesional_id')
  const fecha = searchParams.get('fecha')

  if (!colegioId || !profesionalId || !fecha) {
    return NextResponse.json({ error: 'colegio_id, profesional_id y fecha son requeridos' }, { status: 400 })
  }

  // No permitir consultar fechas pasadas
  const hoy = new Date().toISOString().split('T')[0]
  if (fecha < hoy) {
    return NextResponse.json({ slots: [] })
  }

  const admin = getAdmin()

  const jsDay = new Date(fecha + 'T12:00:00').getDay() // 0=domingo..6=sábado
  const diaSemana = (jsDay + 6) % 7 // 0=lunes..6=domingo, según convención de disponibilidad_profesional

  const [{ data: bloques }, { data: ocupadasAgenda }, { data: ocupadasReservas }] = await Promise.all([
    admin.from('disponibilidad_profesional').select('hora_inicio, hora_fin, duracion_sesion')
      .eq('colegio_id', colegioId).eq('profesional_id', profesionalId).eq('dia_semana', diaSemana).eq('activo', true),
    admin.from('agenda_sesiones').select('hora_inicio, hora_fin')
      .eq('colegio_id', colegioId).eq('profesional_id', profesionalId).eq('fecha', fecha)
      .in('estado', ['programada', 'confirmada', 'en_curso', 'completada']),
    admin.from('reservas_publicas').select('hora_solicitada')
      .eq('colegio_id', colegioId).eq('profesional_id', profesionalId).eq('fecha_solicitada', fecha)
      .eq('estado', 'pendiente'),
  ])

  const ocupados = new Set<string>([
    ...((ocupadasAgenda ?? []) as any[]).map(a => a.hora_inicio.slice(0, 5)),
    ...((ocupadasReservas ?? []) as any[]).map(r => r.hora_solicitada.slice(0, 5)),
  ])

  const slots: string[] = []
  for (const bloque of (bloques as any[]) ?? []) {
    let cursor = bloque.hora_inicio.slice(0, 5)
    const fin = bloque.hora_fin.slice(0, 5)
    const duracion = bloque.duracion_sesion || 45
    while (sumarMinutos(cursor, duracion) <= fin) {
      if (!ocupados.has(cursor)) slots.push(cursor)
      cursor = sumarMinutos(cursor, duracion)
    }
  }

  return NextResponse.json({ slots: slots.sort() })
}
