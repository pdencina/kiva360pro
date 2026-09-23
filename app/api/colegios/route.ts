import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any

  if (!['super_admin', 'admin', 'pastor_campus'].includes(usuario?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { nombre, rut, direccion, telefono, razon_social, giro, comuna, email_tributario, emision_documentos, dias_vencimiento_default } = body

  if (!usuario.colegio_id) {
    return NextResponse.json({ error: 'No hay colegio asociado' }, { status: 400 })
  }

  const { data: colegioAnterior } = await admin.from('colegios').select('*').eq('id', usuario.colegio_id).single()

  const updates: Record<string, any> = {
    nombre: nombre?.trim() || undefined,
    rut: rut?.trim() || undefined,
    direccion: direccion?.trim() || undefined,
    telefono: telefono?.trim() || undefined,
  }

  // Campos tributarios: solo se tocan si vienen en el body (permite guardar
  // este formulario desde la pestaña general sin pisar los tributarios, y viceversa)
  const tocaTributarios = razon_social !== undefined || giro !== undefined || comuna !== undefined || email_tributario !== undefined || emision_documentos !== undefined
  if (tocaTributarios) {
    if (razon_social !== undefined) updates.razon_social = razon_social?.trim() || null
    if (giro !== undefined) updates.giro = giro?.trim() || null
    if (comuna !== undefined) updates.comuna = comuna?.trim() || null
    if (email_tributario !== undefined) updates.email_tributario = email_tributario?.trim() || null
    if (emision_documentos !== undefined) updates.emision_documentos = emision_documentos
    if (dias_vencimiento_default !== undefined) updates.dias_vencimiento_default = dias_vencimiento_default
  }

  const { data, error } = await admin.from('colegios').update(updates).eq('id', usuario.colegio_id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tocaTributarios) {
    await registrarAuditoriaFinanciera({
      admin, colegioId: usuario.colegio_id, usuarioId: user.id,
      accion: 'config_tributaria_modificada', entidad: 'colegios', entidadId: usuario.colegio_id,
      valorAnterior: { razon_social: (colegioAnterior as any)?.razon_social, giro: (colegioAnterior as any)?.giro, comuna: (colegioAnterior as any)?.comuna, email_tributario: (colegioAnterior as any)?.email_tributario, emision_documentos: (colegioAnterior as any)?.emision_documentos },
      valorNuevo: { razon_social: updates.razon_social, giro: updates.giro, comuna: updates.comuna, email_tributario: updates.email_tributario, emision_documentos: updates.emision_documentos },
    })
  }

  return NextResponse.json(data)
}
