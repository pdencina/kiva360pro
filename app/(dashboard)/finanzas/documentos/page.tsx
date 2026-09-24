export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { accesoFinanzas } from '@/lib/permisos'
import DocumentosTributariosClient from '@/components/finanzas/DocumentosTributariosClient'

export const metadata = { title: 'Documentos tributarios — Kiva360' }

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function DocumentosTributariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: ur } = await admin.from('usuarios').select('rol, colegio_id').eq('id', user.id).single()
  const usuario = ur as any
  if (!usuario || !accesoFinanzas(usuario.rol)) redirect('/inicio')

  const colegioId = usuario.colegio_id

  const [{ data: pagados }, { data: documentos }, { data: colegio }] = await Promise.all([
    admin.from('cuenta_corriente_view')
      .select('*, alumno:alumnos(nombre, apellido), familia:familias(nombre_apoderado, apellido_apoderado, email)')
      .eq('colegio_id', colegioId)
      .gt('monto_pagado', 0)
      .order('fecha', { ascending: false })
      .limit(100),
    admin.from('documentos_tributarios')
      .select('*, alumno:alumnos(nombre, apellido)')
      .eq('colegio_id', colegioId)
      .order('created_at', { ascending: false })
      .limit(100),
    admin.from('colegios').select('proveedor_facturacion, emision_documentos').eq('id', colegioId).single(),
  ])

  const conDocumento = new Set(
    ((documentos as any[]) ?? [])
      .filter(d => d.estado !== 'anulado')
      .map(d => d.cobro_id || d.cobro_sesion_id || d.paquete_vendido_id)
  )

  // monto_pagado > 0 excluye las atenciones cubiertas por un plan (no son ingreso: el documento
  // corresponde a la venta del plan, que sí aparece aquí como origen 'plan').
  const pendientesDeEmision = ((pagados as any[]) ?? []).filter(p => !conDocumento.has(p.cobro_id || p.cobro_sesion_id || p.paquete_vendido_id))

  return (
    <DocumentosTributariosClient
      pendientes={pendientesDeEmision}
      documentos={(documentos as any[]) ?? []}
      configTributaria={(colegio as any) ?? null}
    />
  )
}
