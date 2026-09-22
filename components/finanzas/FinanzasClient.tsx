'use client'

import Link from 'next/link'
import { formatMonto } from '@/lib/utils'

interface Props {
  kpis: {
    facturado: number
    cobrado: number
    pendiente: number
    vencido: number
    facturadoAnterior: number
    cobradoAnterior: number
    documentosPendientes: number
    documentosEmitidos: number
  }
  deuda: any[]
  topConceptos: { nombre: string; monto: number }[]
  mesActual: string
  configTributaria: { proveedor_facturacion: string | null; emision_documentos: string; razon_social: string | null } | null
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', pagado: 'Pagado', parcial: 'Pago parcial', mora: 'Vencido', anulado: 'Anulado', condonado: 'Condonado',
}
const ESTADO_TAG: Record<string, string> = {
  pendiente: 'tag-pend', pagado: 'tag-ok', parcial: 'tag-par', mora: 'tag-mora', anulado: 'tag-gray', condonado: 'tag-gray',
}

function variacion(actual: number, anterior: number): { pct: number; sube: boolean } | null {
  if (anterior <= 0) return null
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  return { pct: Math.abs(pct), sube: pct >= 0 }
}

export default function FinanzasClient({ kpis, deuda, topConceptos, mesActual, configTributaria }: Props) {
  const hoy = new Date().toISOString().split('T')[0]
  const varFacturado = variacion(kpis.facturado, kpis.facturadoAnterior)
  const varCobrado = variacion(kpis.cobrado, kpis.cobradoAnterior)
  const sinProveedor = !configTributaria?.proveedor_facturacion || configTributaria.proveedor_facturacion === 'manual'

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="page-title">Finanzas</h1>
        <p className="page-subtitle">{mesActual} · Cuenta corriente, cobranza y documentos tributarios</p>
      </div>

      {sinProveedor && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <i className="ti ti-file-alert text-amber-600 text-lg mt-0.5" aria-hidden="true"/>
          <div>
            <div className="text-[13px] font-semibold text-amber-800">Sin proveedor de facturación electrónica configurado</div>
            <div className="text-[12px] text-amber-700 mt-0.5">Los documentos tributarios quedarán en estado "pendiente" para emitirlos manualmente en tu portal habitual y registrar el folio acá. Configúralo en Configuración → Datos tributarios cuando esté validado con tu contador.</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-label">Facturado</div>
          <div className="kpi-value">{formatMonto(kpis.facturado)}</div>
          {varFacturado && (
            <div className={`kpi-sub flex items-center gap-1 ${varFacturado.sube ? 'text-[var(--ar-success)]' : 'text-[var(--ar-danger)]'}`}>
              <i className={`ti ${varFacturado.sube ? 'ti-trending-up' : 'ti-trending-down'} text-[11px]`} aria-hidden="true"/>
              {varFacturado.pct}% vs mes anterior
            </div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cobrado</div>
          <div className="kpi-value text-[var(--ar-success)]">{formatMonto(kpis.cobrado)}</div>
          {varCobrado && (
            <div className={`kpi-sub flex items-center gap-1 ${varCobrado.sube ? 'text-[var(--ar-success)]' : 'text-[var(--ar-danger)]'}`}>
              <i className={`ti ${varCobrado.sube ? 'ti-trending-up' : 'ti-trending-down'} text-[11px]`} aria-hidden="true"/>
              {varCobrado.pct}% vs mes anterior
            </div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pendiente del mes</div>
          <div className="kpi-value">{formatMonto(kpis.pendiente)}</div>
          <div className="kpi-sub">Del período actual</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Vencido</div>
          <div className={`kpi-value ${kpis.vencido > 0 ? 'text-[var(--ar-accent)]' : ''}`}>{formatMonto(kpis.vencido)}</div>
          <div className="kpi-sub">{kpis.vencido > 0 ? 'Requiere gestión de cobranza' : 'Sin atrasos'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Documentos tributarios */}
        <div className="card p-4">
          <h3 className="text-[12px] font-semibold text-[var(--ar-text)] mb-3">Documentos tributarios</h3>
          <div className="flex items-center justify-between py-1.5 border-b border-[var(--ar-border)]">
            <span className="text-[12px] text-[var(--ar-muted)]">Emitidos este mes</span>
            <span className="text-[13px] font-bold text-[var(--ar-text)]">{kpis.documentosEmitidos}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[12px] text-[var(--ar-muted)]">Pendientes de emisión</span>
            <span className={`text-[13px] font-bold ${kpis.documentosPendientes > 0 ? 'text-[var(--ar-accent)]' : 'text-[var(--ar-text)]'}`}>{kpis.documentosPendientes}</span>
          </div>
          <Link href="/finanzas/documentos" className="mt-3 block text-center text-[11px] text-[var(--ar-blue)] hover:underline">Ver documentos →</Link>
        </div>

        {/* Principales conceptos */}
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-[12px] font-semibold text-[var(--ar-text)] mb-3">Principales conceptos facturados este mes</h3>
          {topConceptos.length === 0 ? (
            <p className="text-[12px] text-[var(--ar-muted)] py-3">Sin movimientos este mes.</p>
          ) : (
            <div className="space-y-2">
              {topConceptos.map((c, i) => {
                const max = topConceptos[0].monto || 1
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--ar-muted)] w-32 truncate flex-shrink-0">{c.nombre}</span>
                    <div className="flex-1 h-2 bg-[var(--ar-primary-l)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--ar-navy)] rounded-full" style={{ width: `${Math.max((c.monto / max) * 100, 4)}%` }}/>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--ar-text)] w-20 text-right flex-shrink-0">{formatMonto(c.monto)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quiénes deben */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ar-border)]">
          <h3 className="text-[13px] font-semibold text-[var(--ar-text)]">Pacientes con saldo pendiente</h3>
          <span className="text-[11px] text-[var(--ar-muted)]">{deuda.length} ítem{deuda.length !== 1 ? 's' : ''}</span>
        </div>
        {deuda.length === 0 ? (
          <div className="p-8 text-center">
            <i className="ti ti-circle-check text-2xl text-emerald-400 block mb-2" aria-hidden="true"/>
            <p className="text-[var(--ar-muted)] text-xs">No hay saldos pendientes.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th>Paciente</th>
                <th>Concepto</th>
                <th>Vencimiento</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deuda.slice(0, 30).map(d => {
                const vencido = d.fecha_vencimiento && d.fecha_vencimiento < hoy && d.estado !== 'pagado'
                return (
                  <tr key={`${d.origen}-${d.item_id}`} className="table-row">
                    <td>
                      <div className="font-medium text-[var(--ar-text)]">{d.alumno?.nombre} {d.alumno?.apellido}</div>
                      <div className="text-[11px] text-[var(--ar-muted)]">{d.familia?.nombre_apoderado} {d.familia?.apellido_apoderado}</div>
                    </td>
                    <td className="text-[var(--ar-muted)]">{d.descripcion}</td>
                    <td className={vencido ? 'text-[var(--ar-danger)] font-medium' : 'text-[var(--ar-muted)]'}>
                      {d.fecha_vencimiento ? new Date(d.fecha_vencimiento + 'T12:00').toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td className="font-semibold">{formatMonto(d.saldo)}</td>
                    <td><span className={`tag ${ESTADO_TAG[vencido ? 'mora' : d.estado] ?? 'tag-gray'}`}>{ESTADO_LABEL[vencido ? 'mora' : d.estado] ?? d.estado}</span></td>
                    <td>
                      <Link href={d.origen === 'mensualidad' ? '/contable' : '/cobros-sesion'} className="text-[11px] text-[var(--ar-blue)] hover:underline">
                        Gestionar →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
