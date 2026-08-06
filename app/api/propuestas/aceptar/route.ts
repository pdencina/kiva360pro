import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'

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
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:30px;">
          <div style="text-align:center;margin-bottom:30px;">
            <img src="https://kiva360.cl/icono-solo/kiva360-icon.svg" width="48" height="48" style="border-radius:12px;" alt="Kiva360"/>
          </div>
          <h2 style="color:#0d1b2a;font-size:20px;text-align:center;margin-bottom:8px;">Código de verificación</h2>
          <p style="color:#5C5470;font-size:14px;text-align:center;margin-bottom:30px;">
            Usa este código para firmar la propuesta de <strong>${p.nombre_cliente}</strong>
          </p>
          <div style="background:#f9f7f5;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0d1b2a;font-family:monospace;">
              ${codigo}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">
            Este código expira en 30 minutos.<br/>
            Si no solicitaste este código, ignora este email.
          </p>
          <div style="border-top:1px solid #e2dfd9;margin-top:30px;padding-top:16px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;">Kiva360 · Gestión Educacional · kiva360.cl</p>
          </div>
        </div>
      `,
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

    // Send confirmation email
    if (p.email_cliente) {
      await enviarEmail({
        to: p.email_cliente,
        subject: `Propuesta firmada — ${p.nombre_cliente} · Kiva360`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:30px;">
            <div style="text-align:center;margin-bottom:30px;">
              <img src="https://kiva360.cl/icono-solo/kiva360-icon.svg" width="48" height="48" style="border-radius:12px;" alt="Kiva360"/>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#ecfdf5;align-items:center;justify-content:center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>
            <h2 style="color:#0d1b2a;font-size:20px;text-align:center;margin-bottom:12px;">Propuesta firmada exitosamente</h2>
            <p style="color:#5C5470;font-size:14px;text-align:center;margin-bottom:24px;">
              La propuesta de servicios para <strong>${p.nombre_cliente}</strong> ha sido firmada.
            </p>
            <div style="background:#f9f7f5;border-radius:12px;padding:16px;margin-bottom:24px;">
              <table style="width:100%;font-size:13px;color:#1A1035;">
                <tr><td style="padding:4px 0;color:#5C5470;">Firmada por:</td><td style="font-weight:600;">${nombre_firma}</td></tr>
                <tr><td style="padding:4px 0;color:#5C5470;">Fecha:</td><td style="font-weight:600;">${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
                <tr><td style="padding:4px 0;color:#5C5470;">Plan:</td><td style="font-weight:600;">${p.plan}</td></tr>
                <tr><td style="padding:4px 0;color:#5C5470;">Modalidad:</td><td style="font-weight:600;">${modalidad || p.modalidad_pago}</td></tr>
                <tr><td style="padding:4px 0;color:#5C5470;">IP:</td><td style="font-size:11px;color:#9ca3af;">${ip}</td></tr>
              </table>
            </div>
            <p style="color:#5C5470;font-size:13px;text-align:center;">
              Nuestro equipo se pondrá en contacto para iniciar la implementación.
            </p>
            <div style="border-top:1px solid #e2dfd9;margin-top:30px;padding-top:16px;text-align:center;">
              <p style="color:#9ca3af;font-size:11px;">
                Este documento tiene validez legal como firma electrónica simple según la Ley 19.799.<br/>
                Flexio Technologies SPA · RUT 78.479.402-4 · kiva360.cl
              </p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'accion inválida (enviar_codigo | firmar)' }, { status: 400 })
}
