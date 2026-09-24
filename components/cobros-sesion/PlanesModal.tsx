'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatMonto } from '@/lib/utils'
import {
  ESTADO_PLAN_LABEL, ESTADO_PLAN_TAG, ESTADO_PAGO_PLAN_LABEL, formatFechaCorta,
  calcularValorOriginal, calcularDescuentoPct,
  type PaqueteCatalogo, type PlanVendidoLista,
} from '@/lib/planes'
import PlanDetalle from './PlanDetalle'

interface Tarifa { id: string; nombre: string; monto: number }
interface Alumno { id: string; nombre: string; apellido: string; curso: string }

interface Props {
  paquetes: PaqueteCatalogo[]
  vendidos: PlanVendidoLista[]
  tarifas: Tarifa[]
  alumnos: Alumno[]
  onClose: () => void
}

const MEDIOS_PAGO = [
  { v: 'transferencia', l: 'Transferencia' }, { v: 'efectivo', l: 'Efectivo' },
  { v: 'webpay', l: 'Webpay / tarjeta' }, { v: 'cheque', l: 'Cheque' },
]

export default function PlanesModal({ paquetes, vendidos, tarifas, alumnos, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'vendidos' | 'catalogo'>('vendidos')
  const [guardando, setGuardando] = useState(false)
  const [detalleId, setDetalleId] = useState<string | null>(null)

  // Venta
  const [venta, setVenta] = useState({ paquete_id: '', alumno_id: '', pagar: true, medio_pago: 'transferencia', fecha_vencimiento: '' })
  const claveVenta = useRef<string>(crypto.randomUUID())
  const paqueteVenta = paquetes.find(p => p.id === venta.paquete_id)

  // Catálogo
  const [nuevo, setNuevo] = useState({ nombre: '', cantidad: '10', precio_total: '', vigencia_dias: '' })
  const [prestacionesSel, setPrestacionesSel] = useState<string[]>([])

  const previewCatalogo = useMemo(() => {
    const cantidad = parseInt(nuevo.cantidad) || 0
    const precio = parseInt(nuevo.precio_total) || 0
    const sel = tarifas.filter(t => prestacionesSel.includes(t.id))
    const valor = calcularValorOriginal(sel.map(t => ({ monto: t.monto, cantidad: null })), cantidad)
    return { valor, descuento: valor ? calcularDescuentoPct(valor, precio) : 0, precio }
  }, [nuevo.cantidad, nuevo.precio_total, prestacionesSel, tarifas])

  function togglePrestacion(id: string) {
    setPrestacionesSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function crearPlan(e: React.FormEvent) {
    e.preventDefault()
    if (prestacionesSel.length === 0) { toast.error('Selecciona al menos una prestación'); return }
    setGuardando(true)
    try {
      const res = await fetch('/api/paquetes-sesion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevo.nombre,
          cantidad: parseInt(nuevo.cantidad),
          precio_total: parseInt(nuevo.precio_total),
          vigencia_dias: nuevo.vigencia_dias ? parseInt(nuevo.vigencia_dias) : null,
          prestaciones: prestacionesSel.map(tarifa_id => ({ tarifa_id })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Plan creado en el catálogo')
      setNuevo({ nombre: '', cantidad: '10', precio_total: '', vigencia_dias: '' })
      setPrestacionesSel([])
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el plan')
    } finally {
      setGuardando(false)
    }
  }

  async function archivarPlan(id: string) {
    if (!window.confirm('¿Archivar este plan? Deja de ofrecerse, pero los planes ya vendidos siguen vigentes.')) return
    const res = await fetch(`/api/paquetes-sesion/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: false }) })
    if (res.ok) { toast.success('Plan archivado'); router.refresh() } else toast.error((await res.json()).error ?? 'Error')
  }

  async function venderPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!venta.paquete_id || !venta.alumno_id) { toast.error('Selecciona plan y paciente'); return }
    setGuardando(true)
    try {
      const res = await fetch('/api/paquetes-vendidos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paquete_id: venta.paquete_id, alumno_id: venta.alumno_id, pagar: venta.pagar,
          medio_pago: venta.pagar ? venta.medio_pago : undefined,
          fecha_vencimiento: venta.fecha_vencimiento || undefined,
          idempotency_key: claveVenta.current,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(venta.pagar ? 'Plan vendido y pagado: sesiones habilitadas' : 'Plan vendido: queda pendiente de pago')
      claveVenta.current = crypto.randomUUID()
      setVenta(v => ({ ...v, paquete_id: '', alumno_id: '', fecha_vencimiento: '' }))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al vender el plan')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--ar-border)] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--ar-text)]">Planes prepagados</h3>
            <p className="text-[11px] text-[var(--ar-muted)] mt-1">El ingreso es el pago del plan; cada sesión solo descuenta del saldo del paciente</p>
          </div>
          <button onClick={onClose} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl" aria-label="Cerrar">×</button>
        </div>

        <div className="flex gap-1 px-6 pt-3 border-b border-[var(--ar-border)]">
          {(['vendidos', 'catalogo'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-[var(--ar-navy)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'}`}>
              {t === 'vendidos' ? 'Planes vendidos' : 'Catálogo'}
            </button>
          ))}
        </div>

        {tab === 'vendidos' ? (
          <>
            <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
              {vendidos.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)] text-center py-4">Aún no se ha vendido ningún plan</p>
              ) : (
                <div className="space-y-2">
                  {vendidos.map(pv => {
                    const pct = pv.sesiones_total > 0 ? Math.round((pv.sesiones_usadas / pv.sesiones_total) * 100) : 0
                    return (
                      <button key={pv.id} onClick={() => setDetalleId(pv.id)} className="w-full text-left p-3 rounded-lg bg-[#f9f7f5] hover:bg-[#f3f0ec] transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-[var(--ar-text)] truncate">{pv.alumno?.nombre} {pv.alumno?.apellido} — {pv.paquete?.nombre}</div>
                            <div className="text-[10px] text-[var(--ar-muted)]">
                              {pv.sesiones_total} contratadas · {pv.sesiones_usadas} utilizadas · <strong className="text-[var(--ar-text)]">{pv.disponibles} disponibles</strong>
                              {pv.fecha_vencimiento ? ` · vence ${formatFechaCorta(pv.fecha_vencimiento)}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {pv.estado_pago !== 'pagado' && pv.estado_plan !== 'cancelado' && <span className="tag tag-pend">{ESTADO_PAGO_PLAN_LABEL[pv.estado_pago] ?? pv.estado_pago}</span>}
                            <span className={`tag ${ESTADO_PLAN_TAG[pv.estado_plan]}`}>{ESTADO_PLAN_LABEL[pv.estado_plan]}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#e8e4df] rounded-full overflow-hidden mt-2"><div className="h-full bg-[#5B3E9E]" style={{ width: `${pct}%` }} /></div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <form onSubmit={venderPlan} className="px-6 py-4 border-t border-[var(--ar-border)] space-y-3">
              <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Vender plan</div>
              {paquetes.length === 0 ? (
                <p className="text-[11px] text-[var(--ar-muted)]">Primero crea un plan en el Catálogo.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={venta.paquete_id} onChange={e => setVenta({ ...venta, paquete_id: e.target.value })} className="select-base text-[12px]" required>
                      <option value="">Plan…</option>
                      {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre} — {formatMonto(p.precio_total)}</option>)}
                    </select>
                    <select value={venta.alumno_id} onChange={e => setVenta({ ...venta, alumno_id: e.target.value })} className="select-base text-[12px]" required>
                      <option value="">Paciente…</option>
                      {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre}</option>)}
                    </select>
                  </div>
                  {paqueteVenta && (
                    <p className="text-[11px] text-[var(--ar-muted)]">
                      {paqueteVenta.cantidad} sesiones de {paqueteVenta.prestaciones.map(pr => pr.tarifa?.nombre).filter(Boolean).join(', ') || '—'}
                      {paqueteVenta.valor_original ? ` · valor normal ${formatMonto(paqueteVenta.valor_original)} (${paqueteVenta.descuento_pct}% dcto.)` : ''}
                      {paqueteVenta.vigencia_dias ? ` · vigencia ${paqueteVenta.vigencia_dias} días` : ' · sin vencimiento'}
                      {' · '}<strong className="text-[var(--ar-text)]">precio final {formatMonto(paqueteVenta.precio_total)}</strong>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-[var(--ar-text)]">
                      <input type="checkbox" checked={venta.pagar} onChange={e => setVenta({ ...venta, pagar: e.target.checked })} />
                      Registrar el pago ahora
                    </label>
                    {venta.pagar && (
                      <select value={venta.medio_pago} onChange={e => setVenta({ ...venta, medio_pago: e.target.value })} className="select-base text-[12px] w-44" aria-label="Medio de pago">
                        {MEDIOS_PAGO.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                    )}
                    <label className="flex items-center gap-2 text-[11px] text-[var(--ar-muted)]">
                      Vence
                      <input type="date" value={venta.fecha_vencimiento} onChange={e => setVenta({ ...venta, fecha_vencimiento: e.target.value })} className="input-base text-[12px] w-36" />
                    </label>
                  </div>
                  {!venta.pagar && <p className="text-[10px] text-amber-600">Sin pago registrado, el plan no habilita sesiones hasta que se pague.</p>}
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cerrar</button>
                <button type="submit" disabled={guardando || paquetes.length === 0} className="btn-primary text-[12px] disabled:opacity-50">{guardando ? 'Vendiendo…' : 'Vender plan'}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="px-6 py-4 max-h-[260px] overflow-y-auto">
              {paquetes.length === 0 ? (
                <p className="text-[12px] text-[var(--ar-muted)] text-center py-4">No hay planes en el catálogo</p>
              ) : (
                <div className="space-y-2">
                  {paquetes.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f9f7f5]">
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-[var(--ar-text)]">{p.nombre}</div>
                        <div className="text-[10px] text-[var(--ar-muted)]">
                          {p.cantidad} sesiones · {p.prestaciones.map(pr => pr.tarifa?.nombre).filter(Boolean).join(', ') || <span className="text-[var(--ar-danger)]">sin prestaciones (no vendible)</span>}
                          {p.valor_original ? ` · normal ${formatMonto(p.valor_original)} (${p.descuento_pct}% dcto.)` : ''}
                          {p.vigencia_dias ? ` · ${p.vigencia_dias} días` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-[13px] font-bold text-[var(--ar-text)]">{formatMonto(p.precio_total)}</div>
                        <button onClick={() => archivarPlan(p.id)} className="text-[10px] text-[var(--ar-muted)] hover:text-[var(--ar-danger)]">Archivar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={crearPlan} className="px-6 py-4 border-t border-[var(--ar-border)] space-y-3">
              <div className="text-[10px] font-bold text-[var(--ar-muted)] uppercase tracking-wider">Nuevo plan</div>
              <input value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} className="input-base text-[12px] w-full" placeholder="Nombre (ej: Pack 10 Terapia Ocupacional)" required />
              <div>
                <div className="text-[10px] font-semibold text-[var(--ar-muted)] uppercase mb-1">Prestaciones que puede consumir *</div>
                {tarifas.length === 0 ? (
                  <p className="text-[11px] text-[var(--ar-muted)]">Crea primero las tarifas (prestaciones) desde el botón Tarifas.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tarifas.map(t => {
                      const activa = prestacionesSel.includes(t.id)
                      return (
                        <button type="button" key={t.id} onClick={() => togglePrestacion(t.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activa ? 'bg-[var(--ar-navy)] text-white border-[var(--ar-navy)]' : 'bg-white text-[var(--ar-muted)] border-[var(--ar-border)]'}`}>
                          {activa ? '✓ ' : ''}{t.nombre} · {formatMonto(t.monto)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min={1} value={nuevo.cantidad} onChange={e => setNuevo({ ...nuevo, cantidad: e.target.value })} className="input-base text-[12px]" placeholder="N° de sesiones" required />
                <input type="number" min={0} value={nuevo.precio_total} onChange={e => setNuevo({ ...nuevo, precio_total: e.target.value })} className="input-base text-[12px]" placeholder="Precio final CLP" required />
                <input type="number" min={1} value={nuevo.vigencia_dias} onChange={e => setNuevo({ ...nuevo, vigencia_dias: e.target.value })} className="input-base text-[12px]" placeholder="Vigencia (días)" />
              </div>
              {prestacionesSel.length > 0 && (
                <p className="text-[11px] text-[var(--ar-muted)]">
                  {previewCatalogo.valor
                    ? <>Valor normal {formatMonto(previewCatalogo.valor)} → precio final {formatMonto(previewCatalogo.precio)} = <strong>{previewCatalogo.descuento}% de descuento</strong></>
                    : 'Con varias prestaciones, las sesiones se comparten entre ellas y el valor normal no se calcula.'}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-secondary text-[12px]">Cerrar</button>
                <button type="submit" disabled={guardando} className="btn-primary text-[12px] disabled:opacity-50">{guardando ? 'Creando…' : 'Crear plan'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
    {detalleId && <PlanDetalle planId={detalleId} onClose={() => setDetalleId(null)} onChanged={() => router.refresh()} />}
    </>
  )
}
