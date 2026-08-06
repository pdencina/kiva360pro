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

// GET: Renderizar contrato con datos de ejemplo o de un alumno real
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  const { searchParams } = new URL(request.url)
  const plantillaId = searchParams.get('plantilla_id')
  const alumnoId = searchParams.get('alumno_id')

  if (!plantillaId) return NextResponse.json({ error: 'plantilla_id requerido' }, { status: 400 })

  const { data: plantilla } = await admin.from('plantillas_contrato').select('*').eq('id', plantillaId).single()
  if (!plantilla) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })

  // Build variables
  let vars: Record<string, string> = {
    fecha_hoy: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    anio: String(new Date().getFullYear()),
    nombre_institucion: (plantilla as any).nombre_institucion || 'Centro Educacional',
    rut_institucion: (plantilla as any).rut_institucion || '',
    direccion_institucion: (plantilla as any).direccion_institucion || '',
    representante_nombre: (plantilla as any).representante_nombre || '',
    representante_rut: (plantilla as any).representante_rut || '',
    // Defaults for preview
    nombre_alumno: 'Juan Ejemplo',
    apellido_alumno: 'Pérez',
    rut_alumno: '12.345.678-9',
    curso_alumno: 'Programa Educativo',
    fecha_nacimiento_alumno: '01/01/2020',
    nombre_apoderado: 'María Ejemplo',
    apellido_apoderado: 'González',
    rut_apoderado: '11.222.333-4',
    email_apoderado: 'maria@ejemplo.com',
    telefono_apoderado: '+56 9 1234 5678',
    direccion_apoderado: 'Calle Ejemplo 123, Santiago',
  }

  // If alumno_id provided, use real data
  if (alumnoId) {
    const { data: alumno } = await admin.from('alumnos').select('*').eq('id', alumnoId).single()
    const { data: familia } = await admin.from('familias').select('*').eq('alumno_id', alumnoId).limit(1).single()
    if (alumno) {
      const al = alumno as any
      vars.nombre_alumno = al.nombre
      vars.apellido_alumno = al.apellido
      vars.rut_alumno = al.rut || ''
      vars.curso_alumno = al.curso || ''
      vars.fecha_nacimiento_alumno = al.fecha_nacimiento ? new Date(al.fecha_nacimiento + 'T12:00').toLocaleDateString('es-CL') : ''
    }
    if (familia) {
      const f = familia as any
      vars.nombre_apoderado = f.nombre_apoderado
      vars.apellido_apoderado = f.apellido_apoderado
      vars.rut_apoderado = f.rut || ''
      vars.email_apoderado = f.email || ''
      vars.telefono_apoderado = f.telefono || ''
      vars.direccion_apoderado = f.direccion || ''
    }
  }

  // Replace all {{variable}} in contenido
  let html = (plantilla as any).contenido as string
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  // Wrap in a full HTML document with print styles
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${(plantilla as any).nombre}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Times New Roman', Georgia, serif; font-size: 13px; line-height: 1.8; color: #1a1a1a; padding: 60px 70px; max-width: 850px; margin: 0 auto; }
h1 { font-size: 16px; text-align: center; margin: 30px 0; text-transform: uppercase; letter-spacing: 0.03em; }
h2 { font-size: 14px; margin: 20px 0 10px; text-transform: uppercase; }
p { margin-bottom: 12px; text-align: justify; }
.header { text-align: center; margin-bottom: 40px; }
.header img { max-height: 60px; margin-bottom: 12px; }
.header .institucion { font-size: 18px; font-weight: bold; }
.header .sub { font-size: 12px; color: #666; }
.clausula { margin: 16px 0; }
.clausula-title { font-weight: bold; }
.firmas { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
.firma-box { text-align: center; }
.firma-linea { border-top: 1px solid #333; margin: 60px auto 10px; width: 200px; }
.firma-nombre { font-size: 12px; font-weight: bold; }
.firma-detalle { font-size: 11px; color: #666; }
.no-print { margin-top: 40px; text-align: center; padding: 20px; border-top: 1px solid #e0e0e0; }
@media print { .no-print { display: none; } body { padding: 40px 50px; } }
</style>
</head>
<body>
${(plantilla as any).logo_url ? `<div class="header"><img src="${(plantilla as any).logo_url}" alt="Logo"/><div class="institucion">${vars.nombre_institucion}</div><div class="sub">${vars.rut_institucion} · ${vars.direccion_institucion}</div></div>` : `<div class="header"><div class="institucion">${vars.nombre_institucion}</div><div class="sub">${vars.rut_institucion} · ${vars.direccion_institucion}</div></div>`}

${html}

<div class="no-print">
<p style="font-size:11px;color:#999;margin-bottom:12px;">Documento generado por Kiva360 · ${vars.fecha_hoy}</p>
<button onclick="window.print()" style="background:#0d1b2a;color:white;border:none;padding:12px 36px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Imprimir / Guardar PDF</button>
</div>
</body>
</html>`

  return new NextResponse(fullHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
