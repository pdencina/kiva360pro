import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH: completar folio/PDF de un documento pendiente_manual (marcarlo emitido),
// anularlo, o reenviarlo por correo.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!accesoFinanzas(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: docRow } = await admin.from('documentos_tributarios').select('*').eq('id', params.id).eq('colegio_id', usuario.colegio_id).single()
  if (!docRow) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  const documento = docRow as any

  const body = await request.json()
  const { accion } = body

  if (accion === 'completar') {
    const { folio, pdf_url } = body
    if (!folio) return NextResponse.json({ error: 'El folio es requerido' }, { status: 400 })

    const { data, error } = await admin.from('documentos_tributarios').update({
      folio,
      pdf_url: pdf_url || null,
      estado: 'emitido',
    }).eq('id', params.id).eq('colegio_id', usuario.colegio_id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await registrarAuditoriaFinanciera({
      admin, colegioId: usuario.colegio_id, usuarioId: user.id,
      accion: 'documento_completado', entidad: 'documentos_tributarios', entidadId: params.id,
      valorAnterior: { estado: documento.estado, folio: documento.folio },
      valorNuevo: { estado: 'emitido', folio },
    })

    return NextResponse.json(data)
  }

  if (accion === 'anular') {
    if (documento.estado === 'anulado') return NextResponse.json({ error: 'Ya está anulado' }, { status: 400 })

    const { data, error } = await admin.from('documentos_tributarios').update({
      estado: 'anulado',
      error_detalle: body.motivo || null,
    }).eq('id', params.id).eq('colegio_id', usuario.colegio_id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await registrarAuditoriaFinanciera({
      admin, colegioId: usuario.colegio_id, usuarioId: user.id,
      accion: 'documento_anulado', entidad: 'documentos_tributarios', entidadId: params.id,
      valorAnterior: { estado: documento.estado },
      valorNuevo: { estado: 'anulado', motivo: body.motivo },
    })

    return NextResponse.json(data)
  }

  if (accion === 'enviar_email') {
    if (documento.estado !== 'emitido') return NextResponse.json({ error: 'Solo se puede enviar un documento emitido' }, { status: 400 })

    const { data: familia } = await admin.from('familias').select('email, nombre_apoderado').eq('id', documento.familia_id).single()
    const email = (familia as any)?.email
    if (!email) return NextResponse.json({ error: 'La familia no tiene email registrado' }, { status: 400 })

    try {
      const { enviarEmail } = await import('@/lib/email')
      await enviarEmail({
        to: email,
        subject: `Tu ${documento.tipo === 'factura' ? 'factura' : 'boleta'} — folio ${documento.folio}`,
        html: `<p>Hola ${(familia as any)?.nombre_apoderado ?? ''},</p><p>Adjuntamos tu ${documento.tipo} por ${documento.monto_total?.toLocaleString('es-CL')}.</p>${documento.pdf_url ? `<p><a href="${documento.pdf_url}">Descargar PDF</a></p>` : ''}`,
      })
    } catch (e: any) {
      return NextResponse.json({ error: 'No se pudo enviar el correo: ' + e.message }, { status: 500 })
    }

    const { data, error } = await admin.from('documentos_tributarios').update({
      enviado_email_at: new Date().toISOString(),
      enviado_a: email,
    }).eq('id', params.id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
