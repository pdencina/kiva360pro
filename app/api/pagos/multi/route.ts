import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { registrarAuditoriaFinanciera } from '@/lib/auditoria-financiera'
import { generarDocumentoPendiente } from '@/lib/generar-documento-pendiente'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface ItemInput { origen: 'mensualidad' | 'prestacion'; item_id: string }

// POST: registrar un pago que se reparte entre varias prestaciones (cobros y/o cobros_sesion)
// del MISMO alumno. Distribuye el monto en orden (más antiguo primero) hasta agotarlo.
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!accesoFinanzas(usuario?.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { alumno_id, items, monto, medio_pago, observaciones } = body as {
    alumno_id: string; items: ItemInput[]; monto: number; medio_pago: string; observaciones?: string
  }

  if (!alumno_id || !Array.isArray(items) || items.length === 0 || !monto || monto <= 0) {
    return NextResponse.json({ error: 'alumno_id, items y monto son requeridos' }, { status: 400 })
  }

  // Cargar los items reales y validar que pertenecen al alumno y al colegio del usuario
  const cobroIds = items.filter(i => i.origen === 'mensualidad').map(i => i.item_id)
  const cobroSesionIds = items.filter(i => i.origen === 'prestacion').map(i => i.item_id)

  const [{ data: cobros }, { data: cobrosSesion }] = await Promise.all([
    cobroIds.length > 0
      ? admin.from('cobros').select('id, monto, monto_pagado, fecha_vencimiento, alumno_id, colegio_id').in('id', cobroIds)
      : Promise.resolve({ data: [] as any[] }),
    cobroSesionIds.length > 0
      ? admin.from('cobros_sesion').select('id, monto_final, estado, fecha_sesion, alumno_id, colegio_id').in('id', cobroSesionIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const itemsValidos = [
    ...((cobros as any[]) ?? []).map(c => ({ origen: 'mensualidad' as const, id: c.id, saldo: c.monto - c.monto_pagado, fecha: c.fecha_vencimiento, alumnoId: c.alumno_id, colegioId: c.colegio_id })),
    ...((cobrosSesion as any[]) ?? []).map(c => ({ origen: 'prestacion' as const, id: c.id, saldo: ['pagado', 'anulado', 'condonado'].includes(c.estado) ? 0 : c.monto_final, fecha: c.fecha_sesion, alumnoId: c.alumno_id, colegioId: c.colegio_id })),
  ].filter(i => i.saldo > 0)

  if (itemsValidos.some(i => i.alumnoId !== alumno_id)) {
    return NextResponse.json({ error: 'Todos los ítems deben pertenecer al mismo paciente' }, { status: 400 })
  }
  if (itemsValidos.some(i => i.colegioId !== usuario.colegio_id)) {
    return NextResponse.json({ error: 'Ítem no encontrado en tu colegio' }, { status: 404 })
  }
  if (itemsValidos.length === 0) {
    return NextResponse.json({ error: 'No hay saldo pendiente en los ítems seleccionados' }, { status: 400 })
  }

  // Distribuir el monto: más antiguo primero, hasta agotar
  itemsValidos.sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
  let restante = monto
  const aplicaciones: { origen: 'mensualidad' | 'prestacion'; id: string; montoAplicado: number }[] = []
  for (const item of itemsValidos) {
    if (restante <= 0) break
    const aplicado = Math.min(item.saldo, restante)
    if (aplicado > 0) {
      aplicaciones.push({ origen: item.origen, id: item.id, montoAplicado: aplicado })
      restante -= aplicado
    }
  }

  // Crear el pago "ancla" (sin cobro_id único: cubre varios)
  const { data: pago, error: pagoError } = await admin.from('pagos').insert({
    cobro_id: null,
    alumno_id,
    monto,
    medio_pago,
    referencia: observaciones || null,
    registrado_por: user.id,
    estado: 'confirmado',
  }).select('id').single()

  if (pagoError || !pago) return NextResponse.json({ error: pagoError?.message || 'No se pudo registrar el pago' }, { status: 500 })
  const pagoId = (pago as any).id

  const { data: familiaAlumno } = await admin.from('familias').select('nombre_apoderado, apellido_apoderado, email').eq('alumno_id', alumno_id).limit(1).single()
  const receptorNombre = `${(familiaAlumno as any)?.nombre_apoderado ?? ''} ${(familiaAlumno as any)?.apellido_apoderado ?? ''}`.trim() || 'Apoderado'
  const receptorEmail = (familiaAlumno as any)?.email ?? null

  // Registrar cada aplicación y actualizar el cobro/cobro_sesion correspondiente
  for (const ap of aplicaciones) {
    await admin.from('pago_aplicaciones').insert({
      colegio_id: usuario.colegio_id,
      pago_id: pagoId,
      cobro_id: ap.origen === 'mensualidad' ? ap.id : null,
      cobro_sesion_id: ap.origen === 'prestacion' ? ap.id : null,
      monto_aplicado: ap.montoAplicado,
    })

    if (ap.origen === 'mensualidad') {
      const { data: cobro } = await admin.from('cobros').select('monto, monto_pagado, familia_id, concepto:conceptos_cobro(nombre)').eq('id', ap.id).single()
      const c = cobro as any
      const nuevoMontoPagado = (c?.monto_pagado ?? 0) + ap.montoAplicado
      const nuevoEstado = nuevoMontoPagado >= c?.monto ? 'pagado' : 'parcial'
      await admin.from('cobros').update({
        monto_pagado: nuevoMontoPagado, estado: nuevoEstado, medio_pago,
        fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString().split('T')[0] : null,
      }).eq('id', ap.id)

      if (nuevoEstado === 'pagado') {
        await generarDocumentoPendiente({
          admin, colegioId: usuario.colegio_id, alumnoId: alumno_id, familiaId: c?.familia_id ?? null,
          cobroId: ap.id, montoTotal: c?.monto, descripcion: c?.concepto?.nombre ?? 'Mensualidad',
          receptorNombre, receptorEmail,
        }).catch(err => console.error('Error generando documento pendiente:', err))
      }
    } else {
      const { data: cobroSesion } = await admin.from('cobros_sesion').select('monto_final, descripcion, familia_id').eq('id', ap.id).single()
      const cs = cobroSesion as any
      await admin.from('cobros_sesion').update({
        estado: 'pagado', medio_pago, fecha_pago: new Date().toISOString().split('T')[0], pagado_por: user.id,
      }).eq('id', ap.id)

      await generarDocumentoPendiente({
        admin, colegioId: usuario.colegio_id, alumnoId: alumno_id, familiaId: cs?.familia_id ?? null,
        cobroSesionId: ap.id, montoTotal: cs?.monto_final, descripcion: cs?.descripcion ?? 'Sesión terapéutica',
        receptorNombre, receptorEmail,
      }).catch(err => console.error('Error generando documento pendiente:', err))
    }
  }

  await registrarAuditoriaFinanciera({
    admin, colegioId: usuario.colegio_id, usuarioId: user.id,
    accion: 'pago_multi_prestacion', entidad: 'pagos', entidadId: pagoId,
    valorNuevo: { alumno_id, monto, aplicaciones },
  })

  return NextResponse.json({
    pago_id: pagoId,
    aplicado: aplicaciones.reduce((a, x) => a + x.montoAplicado, 0),
    sobrante: restante,
    items_cubiertos: aplicaciones.length,
  }, { status: 201 })
}
