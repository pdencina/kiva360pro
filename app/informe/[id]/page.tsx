'use client'
import { useState } from 'react'

export default function FirmaInformePage({ params }: { params: { id: string } }) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [firmado, setFirmado] = useState(false)
  const [error, setError] = useState('')

  async function handleFirmar(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/informes/firma', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: params.id, accion: 'firmar', codigo, nombre_firma: nombre }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFirmado(true)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (firmado) return (<div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6"><div className="max-w-md text-center"><div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h1 className="text-[22px] font-bold text-[#1A1035] mb-3">Informe recibido</h1><p className="text-[14px] text-[#5C5470]">Gracias por confirmar la recepción.</p></div></div>)

  return (<div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6"><div className="max-w-md w-full"><div className="bg-[#0d1b2a] rounded-t-xl py-4 px-6 text-center"><div className="text-white font-bold">Kiva360</div><div className="text-white/50 text-[11px]">Firma de informe terapéutico</div></div><div className="bg-white border border-[#e2dfd9] rounded-b-xl p-6"><h2 className="text-[16px] font-bold text-[#1A1035] mb-4">Confirmar recepción</h2><form onSubmit={handleFirmar} className="space-y-4"><input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full px-4 py-3 border border-[#e2dfd9] rounded-xl text-[16px] text-center font-mono tracking-[0.3em]" placeholder="000000" maxLength={6} required/><input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-3 border border-[#e2dfd9] rounded-xl text-[14px]" placeholder="Su nombre completo" required/>{error && <p className="text-[12px] text-red-600 bg-red-50 p-2 rounded">{error}</p>}<button type="submit" disabled={loading || codigo.length !== 6 || !nombre.trim()} className="w-full py-3 rounded-xl text-[14px] font-semibold text-white bg-[#0d1b2a] disabled:opacity-50">{loading ? 'Firmando...' : 'Confirmar recepción'}</button></form></div></div></div>)
}
