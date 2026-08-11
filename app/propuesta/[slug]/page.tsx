import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PropuestaClient from '@/components/propuestas/PropuestaClient'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const admin = getAdmin()
  const { data } = await admin.from('propuestas').select('nombre_cliente').eq('slug', params.slug).single()
  if (!data) return { title: 'Propuesta — Kiva360' }
  return { title: `Propuesta para ${(data as any).nombre_cliente} — Kiva360` }
}

export default async function PropuestaPage({ params }: { params: { slug: string } }) {
  const admin = getAdmin()
  const { data: propuesta } = await admin.from('propuestas').select('*').eq('slug', params.slug).single()
  if (!propuesta) notFound()

  const p = propuesta as any

  // Si está aceptada, mostrar versión firmada directamente (server-side)
  if (p.estado === 'aceptada') {
    const fechaFirma = p.aceptada_at ? new Date(p.aceptada_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : '—'
    return (
      <div className="min-h-screen bg-[#F9F7F5]" data-firmada="true">
        <div className="bg-emerald-600 text-white py-3 px-6 text-center sticky top-0 z-50">
          <p className="text-[12px] font-semibold">Propuesta firmada por <strong>{p.aceptada_por || p.firma_nombre}</strong> el {fechaFirma} (hora Chile)</p>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-10 h-10 rounded-xl"/>
              <div>
                <div className="text-[16px] font-bold text-[#1A1035]">Kiva360</div>
                <div className="text-[11px] text-[#5C5470]">Contrato de servicios</div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">Firmada</span>
          </div>
          <div className="mb-8">
            <p className="text-[11px] text-[#E85D3A] font-semibold uppercase tracking-wider mb-2">Contrato de</p>
            <h1 className="text-[28px] font-bold text-[#1A1035]">{p.nombre_cliente}</h1>
            <p className="text-[13px] text-[#5C5470] mt-1">Generada el {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="bg-white border border-[#e2dfd9] rounded-xl p-6 mb-6">
            <h3 className="text-[11px] font-bold text-[#5C5470] uppercase tracking-wider mb-4">Plan contratado</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-[32px] font-bold text-[#1A1035]">${(p.monto_mensual || 0).toLocaleString('es-CL')}</span>
              <span className="text-[14px] text-[#5C5470] mb-1">/mes</span>
            </div>
            <div className="flex gap-3 text-[12px] text-[#5C5470]">
              <span>Plan: <strong className="text-[#1A1035]">{p.plan}</strong></span>
              <span>Modalidad: <strong className="text-[#1A1035] capitalize">{p.modalidad_pago}</strong></span>
            </div>
          </div>
          <div className="bg-white border border-emerald-200 rounded-xl p-6 bg-emerald-50/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#1A1035]">Firma electrónica verificada</h3>
                <p className="text-[11px] text-[#5C5470]">Ley 19.799 — Firma Electrónica Simple</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <table className="text-[12px] w-full">
                <tbody>
                  <tr><td className="py-1.5 text-[#5C5470] w-32">Firmada por:</td><td className="font-semibold text-[#1A1035]">{p.aceptada_por || p.firma_nombre}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Fecha y hora:</td><td className="font-semibold text-[#1A1035]">{fechaFirma}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Email:</td><td className="font-semibold text-[#1A1035]">{p.email_cliente}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">IP:</td><td className="text-[#9ca3af] font-mono text-[11px]">{p.firma_ip || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#5C5470] mt-3">Este documento tiene validez legal como firma electrónica simple según la Ley 19.799 de Chile.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-[#e2dfd9] text-center">
            <p className="text-[11px] text-[#5C5470]">Flexio Technologies SPA · RUT 78.479.402-4</p>
            <p className="text-[10px] text-[#9ca3af] mt-1">pablo@kiva360.cl · +56 9 4961 6038 · kiva360.cl</p>
          </div>
        </div>
      </div>
    )
  }

  return <PropuestaClient propuesta={p} />
}
