/**
 * Templates de email para Kiva360
 * Branding: Navy (#0d1b2a), Blue (#3b6ea5), Light blue (#60a5fa)
 * All templates are inline-styled for email client compatibility
 */

const BRAND = {
  navy: '#0d1b2a',
  blue: '#3b6ea5',
  lightBlue: '#60a5fa',
  bg: '#f8f9fb',
  text: '#1a1a2e',
  muted: '#6b7280',
  border: '#e5e7eb',
  success: '#22c55e',
  accent: '#E85D3A',
}

const LOGO_URL = 'https://kiva360.cl/icono-solo/kiva360-icon.svg'

function header(titulo?: string) {
  return `
<div style="background:${BRAND.navy};padding:32px 40px;text-align:center;border-radius:16px 16px 0 0;">
  <img src="${LOGO_URL}" width="40" height="40" style="border-radius:10px;margin-bottom:12px;" alt="Kiva360"/>
  <div style="font-family:-apple-system,sans-serif;font-size:18px;font-weight:700;color:white;letter-spacing:-0.02em;">Kiva360</div>
  ${titulo ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${titulo}</div>` : ''}
</div>`
}

function footer() {
  return `
<div style="padding:24px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
  <p style="font-size:11px;color:${BRAND.muted};margin:0;">
    Flexio Technologies SPA · RUT 78.479.402-4<br/>
    contacto@kiva360.cl · +56 9 3690 2642 · <a href="https://kiva360.cl" style="color:${BRAND.blue};text-decoration:none;">kiva360.cl</a>
  </p>
  <p style="font-size:10px;color:#9ca3af;margin-top:8px;">
    Este es un email automático. Si no reconoces este mensaje, puedes ignorarlo.
  </p>
</div>`
}

function wrapper(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
${content}
</div>
</body>
</html>`
}

// ═══════════════════════════════════════
// TEMPLATE: Código de verificación (firma)
// ═══════════════════════════════════════
export function emailCodigoVerificacion(codigo: string, nombreCliente: string) {
  return wrapper(`
${header('Verificación de firma')}
<div style="padding:40px;">
  <h2 style="font-size:20px;font-weight:700;color:${BRAND.text};margin:0 0 8px;text-align:center;">Código de verificación</h2>
  <p style="font-size:14px;color:${BRAND.muted};text-align:center;margin:0 0 32px;">
    Usa este código para firmar la propuesta de <strong style="color:${BRAND.text};">${nombreCliente}</strong>
  </p>
  <div style="background:${BRAND.bg};border:2px dashed ${BRAND.border};border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
    <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:${BRAND.navy};font-family:monospace;">
      ${codigo}
    </div>
  </div>
  <p style="font-size:12px;color:${BRAND.muted};text-align:center;">
    Este código expira en <strong>30 minutos</strong>.<br/>
    Si no solicitaste este código, puedes ignorar este email.
  </p>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Propuesta firmada (confirmación)
// ═══════════════════════════════════════
export function emailPropuestaFirmada(nombreCliente: string, nombreFirma: string, plan: string, modalidad: string, ip: string) {
  const fecha = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return wrapper(`
${header('Propuesta firmada')}
<div style="padding:40px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:#ecfdf5;line-height:56px;text-align:center;">
      <span style="font-size:28px;">✓</span>
    </div>
  </div>
  <h2 style="font-size:20px;font-weight:700;color:${BRAND.text};margin:0 0 8px;text-align:center;">Propuesta firmada exitosamente</h2>
  <p style="font-size:14px;color:${BRAND.muted};text-align:center;margin:0 0 28px;">
    La propuesta de servicios para <strong style="color:${BRAND.text};">${nombreCliente}</strong> ha sido firmada.
  </p>
  <div style="background:${BRAND.bg};border-radius:12px;padding:20px;margin-bottom:24px;">
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:${BRAND.muted};width:120px;">Firmada por:</td><td style="font-weight:600;color:${BRAND.text};">${nombreFirma}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Fecha:</td><td style="font-weight:600;color:${BRAND.text};">${fecha}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Plan:</td><td style="font-weight:600;color:${BRAND.text};">${plan}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Modalidad:</td><td style="font-weight:600;color:${BRAND.text};text-transform:capitalize;">${modalidad}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">IP:</td><td style="font-size:11px;color:#9ca3af;">${ip}</td></tr>
    </table>
  </div>
  <p style="font-size:13px;color:${BRAND.muted};text-align:center;">
    Nuestro equipo se pondrá en contacto para iniciar la implementación.
  </p>
  <p style="font-size:10px;color:#9ca3af;text-align:center;margin-top:20px;">
    Este documento tiene validez legal como firma electrónica simple según la Ley 19.799 de Chile.
  </p>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Comunicado del colegio
// ═══════════════════════════════════════
export function emailComunicado(titulo: string, contenido: string, colegio: string) {
  return wrapper(`
${header(colegio)}
<div style="padding:40px;">
  <h2 style="font-size:18px;font-weight:700;color:${BRAND.text};margin:0 0 16px;">${titulo}</h2>
  <div style="font-size:14px;color:#4b5563;line-height:1.7;">
    ${contenido.replace(/\n/g, '<br/>')}
  </div>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Invitación a plataforma (apoderado)
// ═══════════════════════════════════════
export function emailInvitacion(nombreApoderado: string, alumno: string, colegio: string, linkAcceso: string) {
  return wrapper(`
${header('Bienvenido/a')}
<div style="padding:40px;">
  <h2 style="font-size:20px;font-weight:700;color:${BRAND.text};margin:0 0 12px;">¡Bienvenido/a a Kiva360!</h2>
  <p style="font-size:14px;color:#4b5563;line-height:1.7;">Estimado/a <strong>${nombreApoderado}</strong>,</p>
  <p style="font-size:14px;color:#4b5563;line-height:1.7;">
    <strong>${colegio}</strong> le informa que <strong>${alumno}</strong> ha sido inscrito exitosamente. 
    Se ha creado una cuenta en nuestra plataforma para que pueda hacer seguimiento del proceso educativo y terapéutico.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${linkAcceso}" style="display:inline-block;background:${BRAND.navy};color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:600;">
      Activar mi cuenta
    </a>
  </div>
  <div style="background:${BRAND.bg};border-radius:12px;padding:16px;margin-top:24px;">
    <p style="font-size:13px;color:#4b5563;margin:0 0 8px;font-weight:600;">¿Qué puede hacer en la plataforma?</p>
    <ul style="font-size:13px;color:${BRAND.muted};line-height:2;margin:0;padding-left:16px;">
      <li>Ver avances terapéuticos de su hijo/a</li>
      <li>Revisar horario semanal y próximas sesiones</li>
      <li>Descargar informes del equipo</li>
      <li>Comunicarse con los profesionales</li>
      <li>Consultar estado de pagos</li>
    </ul>
  </div>
  <p style="font-size:11px;color:#9ca3af;margin-top:20px;">
    Si el botón no funciona, copie este enlace: <span style="color:${BRAND.blue};word-break:break-all;">${linkAcceso}</span>
  </p>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Recordatorio de pago
// ═══════════════════════════════════════
export function emailRecordatorioPago(apoderado: string, monto: string, vencimiento: string, colegio: string) {
  return wrapper(`
${header('Recordatorio de pago')}
<div style="padding:40px;">
  <p style="font-size:14px;color:#4b5563;">Estimado/a <strong>${apoderado}</strong>,</p>
  <p style="font-size:14px;color:#4b5563;line-height:1.7;">
    Le recordamos que su aporte de <strong style="color:${BRAND.text};font-size:18px;">$${monto}</strong> 
    vence el <strong>${vencimiento}</strong>.
  </p>
  <div style="background:${BRAND.bg};border-radius:12px;padding:16px;margin:20px 0;">
    <p style="font-size:12px;color:${BRAND.muted};margin:0;">
      Puede realizar el pago mediante transferencia bancaria o a través de la plataforma.
    </p>
  </div>
  <p style="font-size:12px;color:#9ca3af;">
    Este es un recordatorio automático de ${colegio} vía Kiva360.
  </p>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Cumpleaños
// ═══════════════════════════════════════
export function emailCumpleanos(nombreAlumno: string, apellido: string, edad: number, apoderado: string, colegio: string) {
  return wrapper(`
${header()}
<div style="padding:40px;text-align:center;">
  <div style="font-size:56px;margin-bottom:12px;">🎂</div>
  <h1 style="font-size:22px;font-weight:700;color:${BRAND.navy};margin:0 0 4px;">¡Feliz cumpleaños, ${nombreAlumno}!</h1>
  <p style="font-size:16px;font-weight:600;color:${BRAND.accent};margin:0 0 24px;">¡Hoy cumple ${edad} años!</p>
  <div style="background:#fef0ec;border-radius:12px;padding:20px;text-align:left;">
    <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0;">
      Estimado/a <strong>${apoderado}</strong>,<br/><br/>
      Queremos enviar un cariñoso saludo a <strong>${nombreAlumno} ${apellido}</strong> en este día tan especial. 
      Que este nuevo año de vida esté lleno de aprendizajes, aventuras y mucho amor.
    </p>
  </div>
  <p style="font-size:14px;color:#4b5563;margin-top:20px;">
    Con cariño,<br/><strong style="color:${BRAND.navy};">Equipo ${colegio}</strong>
  </p>
</div>
${footer()}
  `)
}

// ═══════════════════════════════════════
// TEMPLATE: Reporte diario publicado
// ═══════════════════════════════════════
export function emailReporteDiario(alumno: string, curso: string, fecha: string, resumen: string, colegio: string) {
  return wrapper(`
${header('Reporte del día')}
<div style="padding:40px;">
  <h2 style="font-size:18px;font-weight:700;color:${BRAND.text};margin:0 0 4px;">Reporte de ${alumno}</h2>
  <p style="font-size:13px;color:${BRAND.muted};margin:0 0 24px;">${curso} · ${fecha}</p>
  <div style="background:${BRAND.bg};border-radius:12px;padding:20px;font-size:14px;color:#4b5563;line-height:1.7;">
    ${resumen}
  </div>
  <div style="text-align:center;margin-top:24px;">
    <a href="https://kiva360.cl/portal/reporte-diario" style="display:inline-block;background:${BRAND.navy};color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:13px;font-weight:600;">
      Ver reporte completo
    </a>
  </div>
</div>
${footer()}
  `)
}
