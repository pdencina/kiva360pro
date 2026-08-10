import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'
import { emailCodigoVerificacion, emailPropuestaFirmada } from '@/lib/email-templates'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST: Enviar código de verificación O completar firma
export async function POST(request: NextRequest) {
  const admin = getAdmin()
  const body = await request.json()
  const { accion, slug } = body

  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 })

  const { data: propuesta } = await admin.from('propuestas').select('*').eq('slug', slug).single()
  if (!propuesta) return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
  const p = propuesta as any

  // ═══ ACCIÓN: Enviar código por email ═══
  if (accion === 'enviar_codigo') {
    if (p.estado !== 'enviada') return NextResponse.json({ error: 'Propuesta ya procesada' }, { status: 400 })
    if (!p.email_cliente) return NextResponse.json({ error: 'No hay email configurado' }, { status: 400 })

    // Generate 6-digit code
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

    await admin.from('propuestas').update({
      firma_codigo: codigo,
      firma_codigo_expira: expira,
    }).eq('slug', slug)

    // Send email
    await enviarEmail({
      to: p.email_cliente,
      subject: `Código de verificación — Propuesta Kiva360`,
      html: emailCodigoVerificacion(codigo, p.nombre_cliente),
    })

    return NextResponse.json({ ok: true, email_enviado: p.email_cliente.replace(/(.{2})(.*)(@.*)/, '$1***$3') })
  }

  // ═══ ACCIÓN: Verificar código y firmar ═══
  if (accion === 'firmar') {
    const { codigo, nombre_firma, modalidad } = body

    if (!codigo || !nombre_firma) {
      return NextResponse.json({ error: 'codigo y nombre_firma requeridos' }, { status: 400 })
    }

    if (p.estado !== 'enviada') return NextResponse.json({ error: 'Propuesta ya procesada' }, { status: 400 })

    // Verify code
    if (p.firma_codigo !== codigo) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 403 })
    }

    // Check expiration
    if (p.firma_codigo_expira && new Date(p.firma_codigo_expira) < new Date()) {
      return NextResponse.json({ error: 'Código expirado. Solicita uno nuevo.' }, { status: 410 })
    }

    // Get client IP and user-agent
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Register signature
    const updates: any = {
      estado: 'aceptada',
      aceptada_at: new Date().toISOString(),
      aceptada_por: nombre_firma,
      firma_nombre: nombre_firma,
      firma_ip: ip,
      firma_user_agent: userAgent,
      firma_codigo: null, // Clear code after use
    }
    if (modalidad) updates.modalidad_pago = modalidad

    const { data, error } = await admin.from('propuestas').update(updates).eq('slug', slug).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send confirmation email to client
    if (p.email_cliente) {
      await enviarEmail({
        to: p.email_cliente,
        subject: `Propuesta firmada — ${p.nombre_cliente} · Kiva360`,
        html: emailPropuestaFirmada(p.nombre_cliente, nombre_firma, p.plan, modalidad || p.modalidad_pago, ip, p.monto_mensual),
      })
    }

    // Send notification to Pablo
    await enviarEmail({
      to: 'pablo@kiva360.cl',
      subject: `Propuesta FIRMADA — ${p.nombre_cliente}`,
      html: emailPropuestaFirmada(p.nombre_cliente, nombre_firma, p.plan, modalidad || p.modalidad_pago, ip, p.monto_mensual),
    })

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'accion inválida (enviar_codigo | firmar)' }, { status: 400 })
}
