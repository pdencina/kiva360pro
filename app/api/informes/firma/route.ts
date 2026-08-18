import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmail } from '@/lib/email'

function getAdmin() { return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } }) }

export async function PATCH(request: NextRequest) {
  const admin = getAdmin()
  const body = await request.json()
  const { id, accion } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (accion === 'enviar') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
    const usuario = ur as any
    if (!['super_admin', 'admin', 'tutor'].includes(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { data: informe } = await admin.from('informes_terapeuticos').select('*, alumno:alumnos(id, nombre, apellido), profesional:usuarios!profesional_id(nombre, apellido)').eq('id', id).single()
    if (!informe) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const inf = informe as any

    const { data: vinculo } = await admin.from('tutor_alumnos').select('tutor_id').eq('alumno_id', inf.alumno_id).eq('principal', true).single()
    let email = body.email_alternativo || null
    if (vinculo && !email) { const { data: ap } = await admin.from('usuarios').select('email').eq('id', (vinculo as any).tutor_id).single(); email = (ap as any)?.email }
    if (!email) { const { data: fam } = await admin.from('familias').select('email').eq('alumno_id', inf.alumno_id).limit(1).single(); email = (fam as any)?.email }
    if (!email) return NextResponse.json({ error: 'No se encontró email del apoderado.' }, { status: 400 })

    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    await admin.from('informes_terapeuticos').update({ estado_firma: 'enviado', enviado_at: new Date().toISOString(), email_enviado_a: email, firma_codigo: codigo, firma_codigo_expira: new Date(Date.now() + 72*60*60*1000).toISOString(), visible_familia: true }).eq('id', id)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kiva360.cl'
    await enviarEmail({ to: email, subject: `Informe terapéutico — ${inf.alumno?.nombre} ${inf.alumno?.apellido}`, html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;"><h2>Informe: ${inf.titulo}</h2><p>${inf.alumno?.nombre} ${inf.alumno?.apellido}</p><p>Para confirmar recepción: <a href="${siteUrl}/informe/${id}">${siteUrl}/informe/${id}</a></p><p>Código: <strong>${codigo}</strong></p></div>` })
    return NextResponse.json({ ok: true, email_enviado: email })
  }

  if (accion === 'firmar') {
    const { codigo, nombre_firma, observacion } = body
    if (!codigo || !nombre_firma) return NextResponse.json({ error: 'Código y nombre requeridos' }, { status: 400 })
    const { data: inf } = await admin.from('informes_terapeuticos').select('*').eq('id', id).single()
    if (!inf) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const i = inf as any
    if (i.estado_firma === 'firmado') return NextResponse.json({ error: 'Ya firmado' }, { status: 400 })
    if (i.firma_codigo !== codigo) return NextResponse.json({ error: 'Código incorrecto' }, { status: 403 })
    if (i.firma_codigo_expira && new Date(i.firma_codigo_expira) < new Date()) return NextResponse.json({ error: 'Código expirado' }, { status: 410 })
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    await admin.from('informes_terapeuticos').update({ estado_firma: 'firmado', firmado_por: nombre_firma, firmado_at: new Date().toISOString(), firma_ip: ip, firma_observacion: observacion || null, firma_codigo: null }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
