import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Recibir postulación pública con documentos (sin autenticación)
export async function POST(request: NextRequest) {
  const admin = getAdmin()

  try {
    const formData = await request.formData()

    const colegio_id = formData.get('colegio_id') as string
    const nombre = formData.get('nombre') as string
    const apellido = formData.get('apellido') as string | null
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string | null
    const nombre_alumno = formData.get('nombre_alumno') as string | null
    const edad_alumno = formData.get('edad_alumno') as string | null
    const diagnostico = formData.get('diagnostico') as string | null
    const nivel_interes = formData.get('nivel_interes') as string | null
    const mensaje = formData.get('mensaje') as string | null

    // Validación básica
    if (!nombre || !email || !colegio_id) {
      return NextResponse.json({ error: 'Nombre, email y colegio son requeridos' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Verificar que el colegio existe
    const { data: colegio } = await admin.from('colegios').select('id, nombre').eq('id', colegio_id).single()
    if (!colegio) {
      return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })
    }

    // Subir documentos a Supabase Storage
    const DOCUMENT_FIELDS = [
      'ci_alumno_frente',
      'ci_alumno_reverso',
      'foto_alumno',
      'ci_apoderado_frente',
      'ci_apoderado_reverso',
      'certificado_nacimiento',
      'cuenta_servicio_basico',
      'certificado_medico',
    ]

    const documentosUrls: Record<string, string> = {}
    const timestamp = Date.now()
    const folderPath = `postulaciones/${colegio_id}/${timestamp}`

    for (const field of DOCUMENT_FIELDS) {
      const file = formData.get(field) as File | null
      if (!file || file.size === 0) continue

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: `El archivo ${field} excede 5MB` }, { status: 400 })
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Tipo de archivo no permitido para ${field}` }, { status: 400 })
      }

      const extension = file.name.split('.').pop() || 'jpg'
      const fileName = `${folderPath}/${field}.${extension}`

      const buffer = Buffer.from(await file.arrayBuffer())
      const { data: uploadData, error: uploadError } = await admin.storage
        .from('documentos')
        .upload(fileName, buffer, { contentType: file.type, upsert: true })

      if (uploadError) {
        console.error(`Error uploading ${field}:`, uploadError)
        continue
      }

      if (uploadData) {
        const { data: urlData } = admin.storage.from('documentos').getPublicUrl(uploadData.path)
        documentosUrls[field] = urlData.publicUrl
      }
    }

    // Build metadata
    const metadata: Record<string, any> = {}
    if (nombre_alumno) metadata.nombre_alumno = nombre_alumno
    if (edad_alumno) metadata.edad_alumno = edad_alumno
    if (diagnostico) metadata.diagnostico = diagnostico
    if (mensaje) metadata.mensaje = mensaje
    if (Object.keys(documentosUrls).length > 0) metadata.documentos = documentosUrls

    // Insertar prospecto
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
  } catch (err: any) {
    console.error('Postular error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
