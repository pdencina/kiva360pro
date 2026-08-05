import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Recibir postulación pública (sin autenticación)
export async function POST(request: NextRequest) {
  const admin = getAdmin()
  const body = await request.json()

  const {
    colegio_id, nombre, apellido, email, telefono,
    nivel_interes, mensaje, nombre_alumno, edad_alumno, diagnostico
  } = body

  // Validación básica
  if (!nombre || !email || !colegio_id) {
    return NextResponse.json({ error: 'Nombre, email y colegio son requeridos' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Verify colegio exists
  const { data: colegio } = await admin.from('colegios').select('id, nombre').eq('id', colegio_id).single()
  if (!colegio) {
    return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })
  }

  // Build metadata with extra fields
  const metadata: Record<string, any> = {}
  if (nombre_alumno) metadata.nombre_alumno = nombre_alumno
  if (edad_alumno) metadata.edad_alumno = edad_alumno
  if (diagnostico) metadata.diagnostico = diagnostico
  if (mensaje) metadata.mensaje = mensaje

  // Insert prospecto
  const { data, error } = await admin.from('prospectos').insert({
    colegio_id,
    nombre,
    apellido: apellido || null,
    email,
    telefono: telefono || null,
    nivel_interes: nivel_interes || null,
    etapa: 'calificado',
    origen: 'web',
    fecha_primer_contacto: new Date().toISOString(),
    observaciones: mensaje || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  }).select('id').single()

  if (error) {
    console.error('Error inserting prospecto:', error)
    return NextResponse.json({ error: 'Error al enviar postulación' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: (data as any).id }, { status: 201 })
}
