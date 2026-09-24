'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { formatMonto } from '@/lib/utils'
import {
  ESTADO_PLAN_LABEL, ESTADO_PLAN_TAG, ESTADO_PAGO_PLAN_LABEL, formatFechaCorta,
  type EstadoPlan,
} from '@/lib/planes'

interface DetallePlan {
  plan: {
    id: string
    sesiones_total: number; sesiones_usadas: number; disponibles: number
    estado_plan: EstadoPlan; estado_pago: string
    valor_original: number | null; descuento_pct: number | null; precio_final: number | null
    monto_pagado: number; saldo: number
    fecha_inicio: string; fecha_vencimiento: string | null; created_at: string
    cancelado_at: string | null; motivo_cancelacion: string | null
    paquete: { nombre: string; prestaciones: { cantidad: number | null; tarifa: { id: string; nombre: string } | null }[] } | null
    alumno: { nombre: string; apellido: string; curso: string } | null
  }
  pagos: { id: string; monto: number; medio_pago: string; referencia: string | null; estado: string; created_at: string }[]
  consumos: {
    id: string; estado: 'consumido' | 'revertido'; fecha_sesion: string; unidades: number; monto_cubierto: number
    revertido_at: string | null; motivo_reverso: string | null
    tarifa: { nombre: string } | null; profesional: { nombre: string; apellido: string } | null
  }[]
  documentos: { id: string; tipo: string; folio: string | null; estado: string; monto_total: number }[]
}

interface Props {
  planId: string
  onClose: () => void
  onChanged: () => void
}

const MEDIOS_PAGO = [
  { v: 'transferencia', l: 'Transferencia' }, { v: 'efectivo', l: 'Efectivo' },
  { v: 'webpay', l: 'Webpay / tarjeta' }, { v: 'cheque', l: 'Cheque' },
]

export default function PlanDetalle({ planId, onClose, onChanged }: Props) {
  const [detalle, setDetalle] = useState<DetallePlan | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)

  const [monto, setMonto] = useState(0)
  const [medioPago, setMedioPago] = useState('transferencia')
  const [nuevaVigencia, setNuevaVigencia] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const claveRef = useRef<string>(crypto.randomUUID())

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/paquetes-vendidos/${planId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDetalle(data)
      setMonto(data.plan.saldo)
      setNuevaVigencia(data.plan.fecha_vencimiento ?? '')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el plan')
    } finally {
      setCargando(false)
    }
  }, [planId])

  useEffect(() => { cargar() }, [cargar])

  async function ejecutar(cuerpo: Record<string, unknown>, exito: string) {
    setProcesando(true)
    try {
      const res = await fetch(`/api/paquetes-vendidos/${planId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(exito)
      claveRef.current = crypto.randomUUID()
      await cargar()
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setProcesando(false)
    }
  }

  const p = detalle?.plan
  const cancelado = p?.estado_plan === 'cancelado'
  const pct = p && p.sesiones_total > 0 ? Math.round((p.sesiones_usadas / p.sesiones_total) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-3xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--ar-text)]">
              {p ? `${p.alumno?.nombre ?? ''} ${p.alumno?.apellido ?? ''} — ${p.paquete?.nombre ?? 'Plan'}` : 'Detalle del plan'}
            </h3>
            {p && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`tag ${ESTADO_PLAN_TAG[p.estado_plan]}`}>{ESTADO_PLAN_LABEL[p.estado_plan]}</span>
                <span className={`tag ${p.estado_pago === 'pagado' ? 'tag-ok' : 'tag-pend'}`}>{ESTADO_PAGO_PLAN_LABEL[p.estado_pago] ?? p.estado_pago}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl" aria-label="Cerrar">×</button>
        </div>

        {cargando && !detalle ? (
          <p className="p-8 text-center text-[12px] text-[var(--ar-muted)]">Cargando…</p>
        ) : error ? (
          <p className="p-8 text-center text-[12px] text-[var(--ar-danger)]">{error}</p>
        ) : p && detalle ? (
          <div className="px-6 py-5 space-y-6">
            {/* Saldo de sesiones */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-[#f9f7f5] rounded-lg p-3 text-center"><div className="text-[10px] uppercase text-[var(--ar-muted)] font-semibold">Contratadas</div><div className="text-[20px] font-bold">{p.sesiones_total}</div></div>
                <div className="bg-[#f9f7f5] rounded-lg p-3 text-center"><div className="text-[10px] uppercase text-[var(--ar-muted)] font-semibold">Utilizadas</div><div className="text-[20px] font-bold">{p.sesiones_usadas}</div></div>
                <div className="bg-[#f9f7f5] rounded-lg p-3 text-center"><div className="text-[10px] uppercase text-[var(--ar-muted)] font-semibold">Disponibles</div><div className="text-[20px] font-bold text-emerald-600">{p.disponibles}</div></div>
              </div>
              <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#5B3E9E]" style={{ width: `${pct}%` }} /></div>
            </div>

            {/* Datos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-[12px]">
              {[
                ['Fecha de compra', formatFechaCorta(p.created_at)],
                ['Inicio', formatFechaCorta(p.fecha_inicio)],
                ['Vencimiento', p.fecha_vencimiento ? formatFechaCorta(p.fecha_vencimiento) : 'Sin vencimiento'],
                ['Valor normal', p.valor_original ? formatMonto(p.valor_original) : '—'],
                ['Descuento', p.descuento_pct ? `${Number(p.descuento_pct)}%` : '—'],
                ['Precio final', p.precio_final !== null ? formatMonto(p.precio_final) : '—'],
                ['Monto pagado', formatMonto(p.monto_pagado)],
                ['Saldo pendiente', formatMonto(p.saldo)],
                ['Forma de pago', detalle.pagos[0] ? (MEDIOS_PAGO.find(m => m.v === detalle.pagos[0].medio_pago)?.l ?? detalle.pagos[0].medio_pago) : '—'],
              ].map(([k, v]) => (
                <div key={k}><div className="text-[10px] uppercase font-semibold text-[var(--ar-muted)]">{k}</div><div className="font-medium text-[var(--ar-text)]">{v}</div></div>
              ))}
            </div>

            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--ar-muted)] mb-1.5">Prestaciones que puede consumir</div>
              <div className="flex flex-wrap gap-1.5">
                {(p.paquete?.prestaciones ?? []).map((pr, i) => (
                  <span key={i} className="tag tag-blue">{pr.tarifa?.nombre ?? 'Prestación'}{pr.cantidad ? ` · ${pr.cantidad}` : ''}</span>
                ))}
                {(p.paquete?.prestaciones ?? []).length === 0 && <span className="text-[12px] text-[var(--ar-danger)]">Sin prestaciones asignadas: no puede consumirse</span>}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--ar-muted)] mb-1.5">Documento tributario</div>
              {detalle.documentos.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)]">Aún no hay documento. Se prepara al completarse el pago y se emite desde Finanzas → Documentos.</p>
              ) : detalle.documentos.map(d => (
                <p key={d.id} className="text-[12px]"><span className="capitalize">{d.tipo}</span> {d.folio ? `N° ${d.folio}` : '(pendiente de emisión)'} · {formatMonto(d.monto_total)} · {d.estado.replace('_', ' ')}</p>
              ))}
            </div>

            {/* Acciones */}
            {!cancelado && (
              <div className="border border-[var(--ar-border)] rounded-xl p-4 space-y-4">
                {p.saldo > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ar-muted)] mb-2">Registrar pago</div>
                    <div className="flex flex-wrap items-end gap-2">
                      <input type="number" min={1} max={p.saldo} value={monto} onChange={e => setMonto(Number(e.target.value))} className="input-base text-[12px] w-32" aria-label="Monto" />
                      <select value={medioPago} onChange={e => setMedioPago(e.target.value)} className="select-base text-[12px] w-44" aria-label="Medio de pago">
                        {MEDIOS_PAGO.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                      <button disabled={procesando || monto <= 0}
                        onClick={() => ejecutar({ accion: 'registrar_pago', monto, medio_pago: medioPago, idempotency_key: claveRef.current }, 'Pago registrado')}
                        className="btn-primary text-[12px] disabled:opacity-50">Registrar pago</button>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ar-muted)] mb-2">Vigencia</div>
                  <div className="flex items-center gap-2">
                    <input type="date" value={nuevaVigencia} onChange={e => setNuevaVigencia(e.target.value)} className="input-base text-[12px] w-44" aria-label="Nueva fecha de vencimiento" />
                    <button disabled={procesando || nuevaVigencia === (p.fecha_vencimiento ?? '')}
                      onClick={() => ejecutar({ accion: 'cambiar_vigencia', fecha_vencimiento: nuevaVigencia || null }, 'Vigencia actualizada')}
                      className="btn-secondary text-[12px] disabled:opacity-50">Guardar vigencia</button>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ar-muted)] mb-2">Cancelar plan</div>
                  <div className="flex items-center gap-2">
                    <input value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} placeholder="Motivo (queda en auditoría)" className="input-base text-[12px] flex-1" />
                    <button disabled={procesando}
                      onClick={() => { if (window.confirm('¿Cancelar este plan? El historial se conserva y no podrá consumir más sesiones.')) ejecutar({ accion: 'cancelar', motivo: motivoCancelacion || null }, 'Plan cancelado') }}
                      className="btn-secondary text-[12px] text-[var(--ar-danger)] disabled:opacity-50">Cancelar plan</button>
                  </div>
                </div>
              </div>
            )}
            {cancelado && <p className="text-[12px] text-[var(--ar-muted)]">Cancelado el {formatFechaCorta(p.cancelado_at)}{p.motivo_cancelacion ? ` — ${p.motivo_cancelacion}` : ''}. El historial se conserva.</p>}

            {/* Historial de pagos */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ar-muted)] mb-2">Historial de pagos</div>
              {detalle.pagos.length === 0 ? <p className="text-[12px] text-[var(--ar-muted)]">Sin pagos registrados.</p> : (
                <table className="w-full text-[12px]"><thead><tr className="table-head"><th>Fecha</th><th>Medio</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>{detalle.pagos.map(pg => (
                    <tr key={pg.id} className="table-row"><td>{formatFechaCorta(pg.created_at)}</td><td>{MEDIOS_PAGO.find(m => m.v === pg.medio_pago)?.l ?? pg.medio_pago}</td><td className="text-right font-semibold">{formatMonto(pg.monto)}</td></tr>
                  ))}</tbody></table>
              )}
            </div>

            {/* Historial de consumo */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ar-muted)] mb-2">Historial de consumo — ¿qué sesiones usaron este plan?</div>
              {detalle.consumos.length === 0 ? <p className="text-[12px] text-[var(--ar-muted)]">Aún no se ha consumido ninguna sesión.</p> : (
                <table className="w-full text-[12px]"><thead><tr className="table-head"><th>Fecha</th><th>Prestación</th><th>Profesional</th><th>Estado</th><th className="text-right">Cubierto</th><th></th></tr></thead>
                  <tbody>{detalle.consumos.map(c => (
                    <tr key={c.id} className="table-row">
                      <td>{formatFechaCorta(c.fecha_sesion)}</td>
                      <td>{c.tarifa?.nombre ?? '—'}</td>
                      <td>{c.profesional ? `${c.profesional.nombre} ${c.profesional.apellido}` : '—'}</td>
                      <td><span className={`tag ${c.estado === 'consumido' ? 'tag-ok' : 'tag-gray'}`}>{c.estado === 'consumido' ? 'Consumida' : 'Revertida'}</span>{c.motivo_reverso && <div className="text-[10px] text-[var(--ar-muted)] mt-0.5">{c.motivo_reverso}</div>}</td>
                      <td className="text-right">{formatMonto(c.monto_cubierto)}</td>
                      <td className="text-right">
                        {c.estado === 'consumido' && (
                          <button disabled={procesando}
                            onClick={() => { const motivo = window.prompt('Motivo del reverso (queda en auditoría):'); if (motivo !== null) ejecutar({ accion: 'revertir_consumo', consumo_id: c.id, motivo: motivo || null }, 'Sesión devuelta al plan') }}
                            className="text-[11px] text-[var(--ar-blue)] hover:underline disabled:opacity-50">Revertir</button>
                        )}
                      </td>
                    </tr>
                  ))}</tbody></table>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
