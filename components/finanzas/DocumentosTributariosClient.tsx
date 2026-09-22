'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatMonto } from '@/lib/utils'

interface Props {
  pendientes: any[]
  documentos: any[]
  configTributaria: { proveedor_facturacion: string | null; emision_documentos: string } | null
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente_manual: 'Pendiente de emisión', emitiendo: 'Emitiendo', emitido: 'Emitido', error: 'Error', anulado: 'Anulado',
}
const ESTADO_TAG: Record<string, string> = {
  pendiente_manual: 'tag-pend', emitiendo: 'tag-blue', emitido: 'tag-ok', error: 'tag-mora', anulado: 'tag-gray',
}

export default function DocumentosTributariosClient({ pendientes, documentos, configTributaria }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'pendientes' | 'documentos'>('pendientes')

  // Modal: emitir
  const [emitiendo, setEmitiendo] = useState<any | null>(null)
  const [tipoDoc, setTipoDoc] = useState<'boleta' | 'factura'>('boleta')
  const [afecto, setAfecto] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // Modal: completar folio
  const [completando, setCompletando] = useState<any | null>(null)
  const [folio, setFolio] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')

  async function handleEmitir() {
    if (!emitiendo) return
    setProcesando(true)
    try {
      const origen = emitiendo.origen === 'mensualidad' ? { cobro_id: emitiendo.cobro_id } : { cobro_sesion_id: emitiendo.cobro_sesion_id }
      const res = await fetch('/api/documentos-tributarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...origen, tipo: tipoDoc, afecto_iva: afecto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Documento generado — complétalo con el folio cuando lo emitas en tu sistema habitual')
      setEmitiendo(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el documento')
    } finally {
      setProcesando(false)
    }
  }

  async function handleCompletar() {
    if (!completando || !folio) { toast.error('Ingresa el folio'); return }
    setProcesando(true)
    try {
      const res = await fetch(`/api/documentos-tributarios/${completando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'completar', folio, pdf_url: pdfUrl || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Documento marcado como emitido')
      setCompletando(null); setFolio(''); setPdfUrl('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al completar')
    } finally {
      setProcesando(false)
    }
  }

  async function handleAnular(doc: any) {
    if (!window.confirm(`¿Anular el documento ${doc.folio ? `folio ${doc.folio}` : 'pendiente'}?`)) return
    const res = await fetch(`/api/documentos-tributarios/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'anular' }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Documento anulado')
    router.refresh()
  }

  async function handleEnviarEmail(doc: any) {
    const res = await fetch(`/api/documentos-tributarios/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'enviar_email' }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Enviado por correo')
    router.refresh()
  }

  const sinProveedor = !configTributaria?.proveedor_facturacion || configTributaria.proveedor_facturacion === 'manual'

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">Documentos tributarios</h1>
        <p className="page-subtitle">Boletas y facturas emitidas, y prestaciones pagadas que aún necesitan una</p>
      </div>

      {sinProveedor && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <i className="ti ti-info-circle text-amber-600 text-lg mt-0.5" aria-hidden="true"/>
          <div className="text-[12px] text-amber-700">
            Sin proveedor de facturación conectado: al generar un documento aquí, queda <strong>pendiente de emisión</strong>. Emítelo en tu sistema habitual (portal SII u otro) y luego vuelve a completarlo con el folio.
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-[var(--ar-border)]">
        <button onClick={() => setTab('pendientes')} className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${tab === 'pendientes' ? 'border-[var(--ar-navy)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'}`}>
          Pendientes de emisión ({pendientes.length})
        </button>
        <button onClick={() => setTab('documentos')} className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${tab === 'documentos' ? 'border-[var(--ar-navy)] text-[var(--ar-text)]' : 'border-transparent text-[var(--ar-muted)]'}`}>
          Documentos ({documentos.length})
        </button>
      </div>

      {tab === 'pendientes' ? (
        pendientes.length === 0 ? (
          <div className="card p-10 text-center">
            <i className="ti ti-circle-check text-2xl text-emerald-400 block mb-2" aria-hidden="true"/>
            <p className="text-[13px] text-[var(--ar-muted)]">No hay pagos sin documento asociado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendientes.map(p => (
              <div key={`${p.origen}-${p.item_id}`} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--ar-text)]">{p.alumno?.nombre} {p.alumno?.apellido}</div>
                  <div className="text-[11px] text-[var(--ar-muted)]">{p.descripcion} · {p.familia?.nombre_apoderado} {p.familia?.apellido_apoderado}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[13px] font-bold text-[var(--ar-text)]">{formatMonto(p.monto_pagado)}</span>
                  <button onClick={() => { setEmitiendo(p); setTipoDoc('boleta'); setAfecto(true) }} className="btn-primary text-[12px]">Emitir documento</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        documentos.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-[13px] text-[var(--ar-muted)]">Aún no se ha generado ningún documento.</p>
          </div>
        ) : (
          <table className="w-full card overflow-hidden">
            <thead className="table-head">
              <tr><th>Paciente</th><th>Tipo</th><th>Folio</th><th>Monto</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {documentos.map(d => (
                <tr key={d.id} className="table-row">
                  <td>{d.alumno?.nombre} {d.alumno?.apellido}</td>
                  <td className="capitalize">{d.tipo.replace('_', ' ')}</td>
                  <td>{d.folio ?? '—'}</td>
                  <td className="font-semibold">{formatMonto(d.monto_total)}</td>
                  <td><span className={`tag ${ESTADO_TAG[d.estado] ?? 'tag-gray'}`}>{ESTADO_LABEL[d.estado] ?? d.estado}</span></td>
                  <td className="text-right whitespace-nowrap">
                    {d.estado === 'pendiente_manual' && (
                      <button onClick={() => { setCompletando(d); setFolio(''); setPdfUrl('') }} className="text-[11px] text-[var(--ar-blue)] hover:underline mr-3">Completar</button>
                    )}
                    {d.estado === 'emitido' && (
                      <button onClick={() => handleEnviarEmail(d)} className="text-[11px] text-[var(--ar-blue)] hover:underline mr-3">Enviar por correo</button>
                    )}
                    {d.estado !== 'anulado' && (
                      <button onClick={() => handleAnular(d)} className="text-[11px] text-[var(--ar-danger)] hover:underline">Anular</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {/* Modal: emitir */}
      {emitiendo && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setEmitiendo(null)}>
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-[var(--ar-border)] w-[90vw] md:w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--ar-border)]">
              <h3 className="font-bold text-[15px] text-[var(--ar-text)]">Emitir documento</h3>
              <button onClick={() => setEmitiendo(null)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[12px] text-[var(--ar-muted)]">{emitiendo.alumno?.nombre} {emitiendo.alumno?.apellido} · {emitiendo.descripcion} · {formatMonto(emitiendo.monto_pagado)}</p>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Tipo de documento</label>
                <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value as any)} className="select-base w-full text-[12px]">
                  <option value="boleta">Boleta</option>
                  <option value="factura">Factura</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-[var(--ar-text)]">
                <input type="checkbox" checked={!afecto} onChange={e => setAfecto(!e.target.checked)} />
                Exento de IVA (validar con tu contador)
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--ar-border)]">
              <button onClick={() => setEmitiendo(null)} className="btn-secondary text-[12px]">Cancelar</button>
              <button onClick={handleEmitir} disabled={procesando} className="btn-primary text-[12px] disabled:opacity-50">{procesando ? 'Generando...' : 'Generar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: completar folio */}
      {completando && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setCompletando(null)}>
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-[var(--ar-border)] w-[90vw] md:w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--ar-border)]">
              <h3 className="font-bold text-[15px] text-[var(--ar-text)]">Completar documento</h3>
              <button onClick={() => setCompletando(null)} className="text-[var(--ar-muted)] hover:text-[var(--ar-text)] text-xl">×</button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[12px] text-[var(--ar-muted)]">Ingresa el folio que te asignó tu sistema de facturación al emitirlo.</p>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Folio *</label>
                <input value={folio} onChange={e => setFolio(e.target.value)} className="input-base w-full text-[12px]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ar-muted)] uppercase tracking-wide block mb-1.5">Link al PDF (opcional)</label>
                <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} className="input-base w-full text-[12px]" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--ar-border)]">
              <button onClick={() => setCompletando(null)} className="btn-secondary text-[12px]">Cancelar</button>
              <button onClick={handleCompletar} disabled={procesando} className="btn-primary text-[12px] disabled:opacity-50">{procesando ? 'Guardando...' : 'Marcar como emitido'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
