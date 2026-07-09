import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Generar cobros mensuales para todos los alumnos activos
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!['super_admin', 'admin'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const colegioId = usuario.colegio_id
  const { mes, anio, monto, concepto } = await request.json()

  if (!mes || !anio || !monto) {
    return NextResponse.json({ error: 'mes, anio y monto son requeridos' }, { status: 400 })
  }

  // Obtener todos los alumnos activos del colegio
  const { data: alumnos } = await admin
    .from('alumnos')
    .select('id, nombre, apellido')
    .eq('colegio_id', colegioId)
    .eq('activo', true)

  if (!alumnos || alumnos.length === 0) {
    return NextResponse.json({ error: 'No hay alumnos activos en el colegio' }, { status: 404 })
  }

  // Verificar si ya existen cobros para este mes
  const { data: existentes } = await admin
    .from('cobros')
    .select('alumno_id')
    .eq('colegio_id', colegioId)
    .eq('mes', mes)
    .eq('anio', anio)

  const alumnosYaCobrados = new Set((existentes ?? []).map((c: any) => c.alumno_id))
  const alumnosSinCobro = alumnos.filter(a => !alumnosYaCobrados.has(a.id))

  if (alumnosSinCobro.length === 0) {
    return NextResponse.json({ error: `Ya existen cobros para todos los alumnos en ${mes}/${anio}` }, { status: 409 })
  }

  // Obtener familia de cada alumno
  const alumnoIds = alumnosSinCobro.map(a => a.id)
  const { data: familias } = await admin
    .from('familias')
    .select('id, alumno_id')
    .in('alumno_id', alumnoIds)

  const familiaMap = new Map((familias ?? []).map((f: any) => [f.alumno_id, f.id]))

  // Generar cobros
  const vencimiento = `${anio}-${String(mes).padStart(2, '0')}-05`
  const cobrosInsert = alumnosSinCobro.map(alumno => ({
    colegio_id: colegioId,
    familia_id: familiaMap.get(alumno.id) ?? null,
    alumno_id: alumno.id,
    concepto_id: null,
    monto: Number(monto),
    monto_pagado: 0,
    mes: Number(mes),
    anio: Number(anio),
    fecha_vencimiento: vencimiento,
    estado: 'pendiente' as const,
    observaciones: concepto || `Mensualidad ${mes}/${anio}`,
  }))

  const { data: cobrosCreados, error } = await admin
    .from('cobros')
    .insert(cobrosInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    cobros_generados: cobrosCreados?.length ?? 0,
    mes,
    anio,
    monto,
  }, { status: 201 })
}
