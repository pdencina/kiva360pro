import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET: Listar actas de conducta
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumno_id')

  let query = admin
    .from('actas_conducta')
    .select('*, alumno:alumnos(id, nombre, apellido, curso), creador:usuarios!creado_por(nombre, apellido)')
    .eq('colegio_id', usuario.colegio_id)
    .order('fecha_evento', { ascending: false })

  if (alumnoId) query = query.eq('alumno_id', alumnoId)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: Crear acta de conducta
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { alumno_id, tipo, titulo, descripcion, fecha_evento, antecedente, medidas, compromisos, observaciones } = body

  if (!alumno_id || !titulo || !descripcion) {
    return NextResponse.json({ error: 'alumno_id, titulo y descripcion son requeridos' }, { status: 400 })
  }

  const { data, error } = await admin.from('actas_conducta').insert({
    colegio_id: usuario.colegio_id,
    alumno_id,
    tipo: tipo || 'conducta',
    titulo,
    descripcion,
    fecha_evento: fecha_evento || new Date().toISOString().split('T')[0],
    antecedente: antecedente || null,
    medidas: medidas || null,
    compromisos: compromisos || null,
    observaciones: observaciones || null,
    creado_por: user.id,
    estado: 'borrador',
  }).select('*, alumno:alumnos(id, nombre, apellido, curso), creador:usuarios!creado_por(nombre, apellido)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Enviar acta al apoderado / Registrar firma
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = getAdmin()
  const body = await request.json()
  const { id, accion } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  // ═══ ENVIAR ACTA AL APODERADO ═══
  if (accion === 'enviar') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
    const usuario = ur as any
    if (!['super_admin', 'admin', 'tutor', 'pastor_campus'].includes(usuario?.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Obtener acta
    const { data: acta } = await admin.from('actas_conducta').select('*, alumno:alumnos(id, nombre, apellido)').eq('id', id).single()
    if (!acta) return NextResponse.json({ error: 'Acta no encontrada' }, { status: 404 })
    const a = acta as any

    // Obtener email del apoderado
    const { data: vinculo } = await admin.from('tutor_alumnos').select('tutor_id').eq('alumno_id', a.alumno_id).eq('principal', true).single()
    let emailApoderado = body.email_alternativo || null

    if (vinculo && !emailApoderado) {
      const { data: apoderado } = await admin.from('usuarios').select('email').eq('id', (vinculo as any).tutor_id).single()
      emailApoderado = (apoderado as any)?.email
    }

    if (!emailApoderado) {
      // Intentar desde familias
      const { data: familia } = await admin.from('familias').select('email').eq('alumno_id', a.alumno_id).limit(1).single()
      emailApoderado = (familia as any)?.email
    }

    if (!emailApoderado) {
      return NextResponse.json({ error: 'No se encontró email del apoderado. Ingrese un email alternativo.' }, { status: 400 })
    }

    // Generar código de verificación
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 horas

    // Actualizar acta
    await admin.from('actas_conducta').update({
      estado: 'enviada',
      enviada_at: new Date().toISOString(),
      email_enviado_a: emailApoderado,
      firma_codigo: codigo,
      firma_codigo_expira: expira,
    }).eq('id', id)

    // Obtener nombre del colegio
    const { data: colegio } = await admin.from('colegios').select('nombre').eq('id', usuario.colegio_id).single()
    const nombreColegio = (colegio as any)?.nombre || 'Centro Educativo'

    // Enviar email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'
    const linkFirma = `${siteUrl}/acta/${id}`

    await enviarEmail({
      to: emailApoderado,
      subject: `Acta de conducta — ${a.alumno?.nombre} ${a.alumno?.apellido} · ${nombreColegio}`,
      html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="background:#0d1b2a;padding:32px 40px;text-align:center;border-radius:16px 16px 0 0;">
    <div style="font-size:18px;font-weight:700;color:white;">Kiva360</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Acta de conducta</div>
  </div>
  <div style="padding:40px;">
    <h2 style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 4px;">${a.titulo}</h2>
    <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">${a.alumno?.nombre} ${a.alumno?.apellido} · ${new Date(a.fecha_evento).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div style="background:#f8f9fb;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="font-size:13px;color:#4b5563;line-height:1.7;margin:0;">${a.descripcion}</p>
    </div>
    ${a.medidas ? `<div style="margin-bottom:16px;"><p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;margin:0 0 4px;">Medidas tomadas</p><p style="font-size:13px;color:#4b5563;line-height:1.6;margin:0;">${a.medidas}</p></div>` : ''}
    ${a.compromisos ? `<div style="margin-bottom:16px;"><p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;margin:0 0 4px;">Compromisos</p><p style="font-size:13px;color:#4b5563;line-height:1.6;margin:0;">${a.compromisos}</p></div>` : ''}
    <div style="text-align:center;margin-top:28px;">
      <a href="${linkFirma}" style="display:inline-block;background:#0d1b2a;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Firmar acta
      </a>
      <p style="font-size:11px;color:#9ca3af;margin-top:12px;">Ingresa tu código de verificación: <strong style="color:#1a1a2e;">${codigo}</strong></p>
    </div>
  </div>
  <div style="padding:16px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:10px;color:#9ca3af;margin:0;">${nombreColegio} · Powered by Kiva360</p>
  </div>
</div>
</body></html>`,
    })

    return NextResponse.json({ ok: true, email_enviado: emailApoderado })
  }

  // ═══ FIRMAR ACTA (público, sin auth) ═══
  if (accion === 'firmar') {
    const { codigo, nombre_firma, observacion } = body

    if (!codigo || !nombre_firma) {
      return NextResponse.json({ error: 'Código y nombre son requeridos' }, { status: 400 })
    }

    const { data: acta } = await admin.from('actas_conducta').select('*').eq('id', id).single()
    if (!acta) return NextResponse.json({ error: 'Acta no encontrada' }, { status: 404 })
    const a = acta as any

    if (a.estado === 'firmada') return NextResponse.json({ error: 'Esta acta ya fue firmada' }, { status: 400 })
    if (a.firma_codigo !== codigo) return NextResponse.json({ error: 'Código incorrecto' }, { status: 403 })
    if (a.firma_codigo_expira && new Date(a.firma_codigo_expira) < new Date()) {
      return NextResponse.json({ error: 'El código ha expirado. Solicita un reenvío.' }, { status: 410 })
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const { data: updated, error } = await admin.from('actas_conducta').update({
      estado: 'firmada',
      firmada_por: nombre_firma,
      firmada_at: new Date().toISOString(),
      firma_ip: ip,
      firma_observacion: observacion || null,
      firma_codigo: null,
    }).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notificar al creador del acta
    const { data: creador } = await admin.from('usuarios').select('email').eq('id', a.creado_por).single()
    if (creador) {
      await enviarEmail({
        to: (creador as any).email,
        subject: `Acta firmada — ${nombre_firma}`,
        html: `<p>El apoderado <strong>${nombre_firma}</strong> ha firmado el acta "${a.titulo}".</p>`,
      })
    }

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
