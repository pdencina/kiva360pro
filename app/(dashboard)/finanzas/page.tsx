export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import { getMesNombre } from '@/lib/utils'
import FinanzasClient from '@/components/finanzas/FinanzasClient'

export const metadata = { title: 'Finanzas — Kiva360' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function FinanzasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !accesoFinanzas(usuario.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id
  const ahora = new Date()
  const mesActual = ahora.getMonth() + 1
  const anioActual = ahora.getFullYear()
  const hoy = ahora.toISOString().split('T')[0]

  const inicioMes = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`
  const finMes = new Date(anioActual, mesActual, 0).toISOString().split('T')[0]

  // Mes anterior para comparación
  const mesAnteriorDate = new Date(anioActual, mesActual - 2, 1)
  const inicioMesAnterior = mesAnteriorDate.toISOString().split('T')[0]
  const finMesAnterior = new Date(mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: itemsMes },
    { data: itemsMesAnterior },
    { count: documentosPendientes },
    { count: documentosEmitidos },
    { data: colegio },
  ] = await Promise.all([
    admin.from('cuenta_corriente_view').select('*').eq('colegio_id', colegioId).gte('fecha', inicioMes).lte('fecha', finMes),
    admin.from('cuenta_corriente_view').select('monto, monto_pagado, saldo').eq('colegio_id', colegioId).gte('fecha', inicioMesAnterior).lte('fecha', finMesAnterior),
    admin.from('documentos_tributarios').select('*', { count: 'exact', head: true }).eq('colegio_id', colegioId).eq('estado', 'pendiente_manual'),
    admin.from('documentos_tributarios').select('*', { count: 'exact', head: true }).eq('colegio_id', colegioId).eq('estado', 'emitido').gte('created_at', inicioMes),
    admin.from('colegios').select('proveedor_facturacion, emision_documentos, razon_social').eq('id', colegioId).single(),
  ])

  // Deuda total vigente (no solo del mes): todo item con saldo > 0, sin límite de fecha
  const { data: itemsConDeuda } = await admin
    .from('cuenta_corriente_view')
    .select('*, alumno:alumnos(nombre, apellido, curso), familia:familias(nombre_apoderado, apellido_apoderado, email, telefono)')
    .eq('colegio_id', colegioId)
    .gt('saldo', 0)
    .not('estado', 'in', '(anulado,condonado)')
    .order('fecha_vencimiento', { ascending: true })

  const items = (itemsMes as any[]) ?? []
  const itemsAnt = (itemsMesAnterior as any[]) ?? []
  const deuda = (itemsConDeuda as any[]) ?? []

  const facturado = items.reduce((a, i) => a + (i.monto ?? 0), 0)
  const cobrado = items.reduce((a, i) => a + (i.monto_pagado ?? 0), 0)
  const pendiente = items.reduce((a, i) => a + (i.saldo ?? 0), 0)
  const vencido = deuda.filter(i => i.fecha_vencimiento && i.fecha_vencimiento < hoy).reduce((a, i) => a + (i.saldo ?? 0), 0)

  const facturadoAnterior = itemsAnt.reduce((a, i) => a + (i.monto ?? 0), 0)
  const cobradoAnterior = itemsAnt.reduce((a, i) => a + (i.monto_pagado ?? 0), 0)

  // Principales conceptos/prestaciones del mes
  const porConcepto = new Map<string, number>()
  for (const i of items) {
    const key = i.descripcion ?? 'Otro'
    porConcepto.set(key, (porConcepto.get(key) ?? 0) + (i.monto ?? 0))
  }
  const topConceptos = Array.from(porConcepto.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([nombre, monto]) => ({ nombre, monto }))

  return (
    <FinanzasClient
      kpis={{
        facturado, cobrado, pendiente, vencido,
        facturadoAnterior, cobradoAnterior,
        documentosPendientes: documentosPendientes ?? 0,
        documentosEmitidos: documentosEmitidos ?? 0,
      }}
      deuda={deuda}
      topConceptos={topConceptos}
      mesActual={`${getMesNombre(mesActual)} ${anioActual}`}
      configTributaria={(colegio as any) ?? null}
    />
  )
}
