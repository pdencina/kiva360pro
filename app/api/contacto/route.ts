import { NextResponse } from 'next/server'
import { enviarEmail } from '@/lib/email'

const DESTINO = 'pablo@kiva360.cl'

function esEmailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escape(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const nombre = (body.nombre || '').toString().trim()
    const centro = (body.centro || '').toString().trim()
    const email = (body.email || '').toString().trim()
    const telefono = (body.telefono || '').toString().trim()
    const alumnos = (body.alumnos || '').toString().trim()
    const mensaje = (body.mensaje || '').toString().trim()

    // Validación
    if (!nombre || !email) {
      return NextResponse.json(
        { ok: false, error: 'Nombre y email son obligatorios.' },
        { status: 400 }
      )
    }
    if (!esEmailValido(email)) {
      return NextResponse.json(
        { ok: false, error: 'El email no es válido.' },
        { status: 400 }
      )
    }

    // Honeypot anti-spam: si viene lleno, fingimos éxito y descartamos
    if ((body.website || '').toString().trim()) {
      return NextResponse.json({ ok: true })
    }

    const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })

    // 1. Correo al equipo Kiva360 (el lead)
    const htmlEquipo = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-bottom: 2px solid #2D1B69; padding-bottom: 16px; margin-bottom: 24px;">
          <strong style="font-size: 16px; color: #2D1B69;">Kiva360</strong>
          <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">Nuevo lead desde la web</span>
        </div>
        <h2 style="color: #1A1035; font-size: 18px; margin: 0 0 16px;">Solicitud de demo</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
          <tr><td style="padding: 8px 0; color: #9ca3af; width: 140px;">Nombre</td><td style="padding: 8px 0;"><strong>${escape(nombre)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af;">Centro / colegio</td><td style="padding: 8px 0;">${escape(centro) || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af;">Teléfono</td><td style="padding: 8px 0;">${escape(telefono) || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af;">Nº de alumnos</td><td style="padding: 8px 0;">${escape(alumnos) || '—'}</td></tr>
        </table>
        ${mensaje ? `<div style="background: #f8f9fb; border-radius: 8px; padding: 16px; margin-top: 16px; color: #4b5563; font-size: 14px; line-height: 1.6;">${escape(mensaje).replace(/\n/g, '<br/>')}</div>` : ''}
        <div style="margin-top: 24px;">
          <a href="https://wa.me/${escape(telefono).replace(/[^0-9]/g, '') || '56949616038'}" style="background: #4A9E7A; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">Responder por WhatsApp</a>
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8eaed; color: #9ca3af; font-size: 11px;">
          Recibido el ${fecha} vía formulario de kiva360.cl
        </div>
      </div>
    `

    const resEquipo = await enviarEmail({
      to: DESTINO,
      subject: `Nuevo lead: ${nombre}${centro ? ` — ${centro}` : ''}`,
      html: htmlEquipo,
    })

    // 2. Acuse de recibo al prospecto
    const htmlProspecto = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-bottom: 2px solid #2D1B69; padding-bottom: 16px; margin-bottom: 24px;">
          <strong style="font-size: 16px; color: #2D1B69;">Kiva360</strong>
        </div>
        <h2 style="color: #1A1035; font-size: 18px; margin: 0 0 12px;">¡Gracias por tu interés, ${escape(nombre)}!</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Recibimos tu solicitud de demo de Kiva360. Nuestro equipo te contactará dentro de las próximas horas hábiles para coordinar una demostración personalizada de 30 minutos.</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Si prefieres conversar de inmediato, escríbenos por WhatsApp:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://wa.me/56949616038" style="background: #4A9E7A; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">Escribir por WhatsApp</a>
        </div>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8eaed; color: #9ca3af; font-size: 11px;">
          Kiva360 · Gestión Educacional Integral · kiva360.cl
        </div>
      </div>
    `

    // El acuse es best-effort; no bloquea si falla
    await enviarEmail({
      to: email,
      subject: 'Recibimos tu solicitud — Kiva360',
      html: htmlProspecto,
    })

    if (!resEquipo.ok) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo enviar el mensaje. Intenta por WhatsApp.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error en /api/contacto:', e)
    return NextResponse.json(
      { ok: false, error: 'Error inesperado. Intenta por WhatsApp.' },
      { status: 500 }
    )
  }
}
