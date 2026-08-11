'use client'

import { useState, useEffect } from 'react'

interface Propuesta {
  id: string; slug: string; nombre_cliente: string; rut_cliente: string | null
  representante: string | null; email_cliente: string | null
  plan: string; modalidad_pago: string; monto_mensual: number
  monto_anual: number | null; descuento_anual: number
  modulos_incluidos: string[]; fecha_inicio: string | null
  duracion_meses: number; estado: string; aceptada_at: string | null
  aceptada_por: string | null; condiciones_especiales: string | null
  created_at: string
}

interface Props { propuesta: Propuesta }

const MODULO_LABELS: Record<string, string> = {
  alumnos: 'Gestión de alumnos y familias',
  programas: 'Gestión de programas',
  horarios: 'Horario individual por alumno',
  asistencias: 'Control de asistencia',
  intervencion: 'Intervención NEE (PII completo)',
  agenda: 'Agenda de sesiones terapéuticas',
  reporte_diario: 'Reportes diarios',
  comunicados: 'Comunicados y mensajería',
  cobranzas: 'Cobranzas mensuales',
  cobros_sesion: 'Cobro por sesión individual',
  admision: 'Pipeline de admisión online',
  documentos: 'Gestión documental',
  portal_familia: 'Portal de avances para familias',
  contratos: 'Editor de contratos',
  exportacion: 'Exportación de datos',
}

export default function PropuestaClient({ propuesta: p }: Props) {
  const [modalidad, setModalidad] = useState(p.modalidad_pago)
  const [aceptando, setAceptando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [showAceptar, setShowAceptar] = useState(false)
  const [aceptada, setAceptada] = useState(p.estado === 'aceptada')
  const [propData, setPropData] = useState(p)
  const [codigo, setCodigo] = useState('')
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)
  const [emailMasked, setEmailMasked] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [errorFirma, setErrorFirma] = useState('')

  // Verificar estado real desde el servidor al cargar (evita cache)
  useEffect(() => {
    fetch(`/api/propuestas/estado?slug=${p.slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.estado === 'aceptada') {
          setAceptada(true)
          setPropData({ ...p, ...data })
        }
      })
      .catch(() => {})
  }, [p.slug])

  const montoAnual = p.monto_anual || Math.round(p.monto_mensual * 12 * (1 - p.descuento_anual / 100))
  const montoMensualAnual = Math.round(montoAnual / 12)
  const ahorro = p.monto_mensual * 12 - montoAnual

  async function handleEnviarCodigo() {
    setEnviandoCodigo(true)
    setErrorFirma('')
    try {
      const res = await fetch('/api/propuestas/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar_codigo', slug: p.slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmailMasked(data.email_enviado)
      setShowAceptar(true)
    } catch (err: any) { setErrorFirma(err.message) }
    finally { setEnviandoCodigo(false) }
  }

  async function handleFirmar() {
    setAceptando(true)
    setErrorFirma('')
    try {
      const res = await fetch('/api/propuestas/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'firmar', slug: p.slug, codigo, nombre_firma: nombre, modalidad }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAceptada(true)
    } catch (err: any) { setErrorFirma(err.message) }
    finally { setAceptando(false) }
  }

  if (aceptada) {
    const fechaFirma = propData.aceptada_at ? new Date(propData.aceptada_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : '—'
    return (
      <div className="min-h-screen bg-[#F9F7F5]">
        {/* Banner de firma */}
        <div className="bg-emerald-600 text-white py-3 px-6 text-center sticky top-0 z-50">
          <p className="text-[12px] font-semibold">Contrato firmado por <strong>{propData.aceptada_por || propData.firma_nombre || '—'}</strong> el {fechaFirma} (hora Chile)</p>
        </div>

        {/* Renderizar la propuesta completa debajo */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Header propuesta */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-10 h-10 rounded-xl"/>
              <div>
                <div className="text-[16px] font-bold text-[#1A1035]">Kiva360</div>
                <div className="text-[11px] text-[#5C5470]">Propuesta comercial</div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">Firmada</span>
          </div>

          {/* Datos del contrato */}
          <div className="mb-8">
            <p className="text-[11px] text-[#E85D3A] font-semibold uppercase tracking-wider mb-2">Propuesta para</p>
            <h1 className="text-[28px] font-bold text-[#1A1035]" style={{ fontFamily: 'Space Grotesk' }}>{p.nombre_cliente}</h1>
            <p className="text-[13px] text-[#5C5470] mt-1">Generada el {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Plan y precio */}
          <div className="card p-6 mb-6">
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

          {/* Sello de firma */}
          <div className="card p-6 border-emerald-200 bg-emerald-50/30">
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
                  <tr><td className="py-1.5 text-[#5C5470] w-32">Firmada por:</td><td className="font-semibold text-[#1A1035]">{propData.aceptada_por || propData.firma_nombre || '—'}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Fecha y hora:</td><td className="font-semibold text-[#1A1035]">{fechaFirma}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Email:</td><td className="font-semibold text-[#1A1035]">{propData.email_cliente || p.email_cliente || '—'}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">IP:</td><td className="text-[#9ca3af] font-mono text-[11px]">{propData.firma_ip || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#5C5470] mt-3">Este documento tiene validez legal como firma electrónica simple según la Ley 19.799 de Chile.</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#e2dfd9] text-center">
            <p className="text-[11px] text-[#5C5470]">Flexio Technologies SPA · RUT 78.479.402-4</p>
            <p className="text-[10px] text-[#9ca3af] mt-1">pablo@kiva360.cl · +56 9 4961 6038 · kiva360.cl</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      {/* Header */}
      <div className="bg-[#0d1b2a] py-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-10 h-10 rounded-xl" />
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Kiva360</span>
          </div>
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Propuesta comercial</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10">
          <p className="text-[11px] text-[#E85D3A] font-semibold uppercase tracking-wider mb-2">Propuesta para</p>
          <h1 className="text-[32px] font-bold text-[#1A1035] leading-tight" style={{ fontFamily: 'Space Grotesk' }}>{p.nombre_cliente}</h1>
          <p className="text-[14px] text-[#5C5470] mt-2">
            Generada el {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-[#e2dfd9] p-8 mb-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 className="text-[11px] font-bold text-[#5C5470] uppercase tracking-wider mb-5">Plan y precio</h2>

          {/* Toggle mensual/anual */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button onClick={() => setModalidad('mensual')}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${modalidad === 'mensual' ? 'bg-[#0d1b2a] text-white' : 'bg-[#f9f7f5] text-[#5C5470] border border-[#e2dfd9]'}`}>
              Mensual
            </button>
            <button onClick={() => setModalidad('anual')}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${modalidad === 'anual' ? 'bg-[#0d1b2a] text-white' : 'bg-[#f9f7f5] text-[#5C5470] border border-[#e2dfd9]'}`}>
              Anual <span className="text-[10px] ml-1 opacity-70">({p.descuento_anual}% desc.)</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-[42px] font-bold text-[#1A1035]" style={{ fontFamily: 'Space Grotesk' }}>
              ${(modalidad === 'anual' ? montoMensualAnual : p.monto_mensual).toLocaleString('es-CL')}
              <span className="text-[16px] text-[#5C5470] font-normal">/mes</span>
            </div>
            {modalidad === 'anual' && (
              <div className="mt-2">
                <span className="text-[13px] text-emerald-600 font-semibold">Ahorras ${ahorro.toLocaleString('es-CL')} al año</span>
                <span className="text-[12px] text-[#5C5470] ml-2">(total anual: ${montoAnual.toLocaleString('es-CL')})</span>
              </div>
            )}
            <p className="text-[11px] text-[#5C5470] mt-2">+ IVA si corresponde · Plan {p.plan}</p>
          </div>
        </div>

        {/* Modules included */}
        <div className="bg-white rounded-2xl border border-[#e2dfd9] p-8 mb-8">
          <h2 className="text-[11px] font-bold text-[#5C5470] uppercase tracking-wider mb-5">Módulos incluidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(p.modulos_incluidos.length > 0 ? p.modulos_incluidos : Object.keys(MODULO_LABELS)).map(mod => (
              <div key={mod} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-[13px] text-[#1A1035]">{MODULO_LABELS[mod] || mod}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl border border-[#e2dfd9] p-8 mb-8">
          <h2 className="text-[11px] font-bold text-[#5C5470] uppercase tracking-wider mb-5">Condiciones del servicio</h2>
          <div className="space-y-4 text-[13px] text-[#1A1035] leading-relaxed">
            <p><strong>Prestador:</strong> Flexio Technologies SPA, RUT 78.479.402-4, representada por Pablo David Encina Acevedo, RUT 17.339.278-8.</p>
            <p><strong>Duración:</strong> {p.duracion_meses} meses, renovable automáticamente.</p>
            <p><strong>Terminación anticipada por el cliente:</strong> puede dar término con 30 días de aviso escrito, sin multas ni penalidades.</p>
            <p><strong>Terminación por incumplimiento de pago:</strong> en caso de mora superior a 30 días, el Prestador podrá suspender el acceso a la plataforma hasta la regularización del pago. Si la mora supera los 60 días, el Prestador podrá dar término unilateral al contrato.</p>
            <p><strong>Propiedad de datos:</strong> todos los datos son del cliente. Exportación disponible en cualquier momento (JSON/CSV).</p>
            <p><strong>Respaldos:</strong> backups automáticos diarios con retención de 30 días.</p>
            <p><strong>Disponibilidad:</strong> SLA 99.5%. Recuperación ante desastres en máximo 4 horas.</p>
            <p><strong>Soporte:</strong> email y WhatsApp, lunes a viernes 9:00-18:00. Respuesta máxima 4 horas hábiles.</p>
            <p><strong>Desarrollos a medida:</strong> solicitudes de funcionalidades adicionales o personalizaciones serán cotizadas por separado.</p>
            <p><strong>Confidencialidad:</strong> datos protegidos bajo Ley 19.628. No se comparten con terceros.</p>
            <p><strong>Post-contrato:</strong> datos entregados en 5 días hábiles y eliminados en 30 días posteriores al término.</p>
            <p><strong>Facturación:</strong> mensual o anual según modalidad elegida, mediante transferencia bancaria o medio electrónico. El prestador emitirá boleta o factura según corresponda. Los precios pueden ser ajustados anualmente con 60 días de aviso previo.</p>
            <p><strong>Uso aceptable:</strong> el cliente se compromete a no compartir sus credenciales de acceso con terceros no autorizados ni utilizar la plataforma para fines distintos a la gestión educacional de su centro.</p>
            {p.condiciones_especiales && <p><strong>Condiciones especiales:</strong> {p.condiciones_especiales}</p>}
          </div>
        </div>

        {/* Accept */}
        {p.estado === 'enviada' && !aceptada && !showAceptar && (
          <div className="text-center">
            <button onClick={handleEnviarCodigo}
              disabled={enviandoCodigo}
              className="px-8 py-4 rounded-xl text-[15px] font-bold text-white bg-[#0d1b2a] hover:bg-[#1a2d47] transition-all shadow-lg active:scale-[0.98] disabled:opacity-60">
              {enviandoCodigo ? 'Enviando código...' : 'Firmar propuesta'}
            </button>
            <p className="text-[11px] text-[#5C5470] mt-3">Se enviará un código de verificación a tu email para firmar.</p>
          </div>
        )}

        {/* Sello de firma si ya está aceptada */}
        {(p.estado === 'aceptada' || aceptada) && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-[18px] font-bold text-emerald-800 mb-2">Contrato firmado</h3>
            <p className="text-[13px] text-emerald-700 mb-4">
              Firmado por <strong>{propData.aceptada_por || propData.firma_nombre || '—'}</strong> el {propData.aceptada_at ? new Date(propData.aceptada_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : '—'}
            </p>
            <div className="bg-white rounded-xl p-4 border border-emerald-100 text-left max-w-sm mx-auto">
              <table className="text-[12px] w-full">
                <tbody>
                  <tr><td className="py-1.5 text-[#5C5470] w-28">Firmada por:</td><td className="font-semibold text-[#1A1035]">{propData.aceptada_por || propData.firma_nombre || '—'}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Fecha y hora:</td><td className="font-semibold text-[#1A1035]">{propData.aceptada_at ? new Date(propData.aceptada_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : '—'}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">Email:</td><td className="font-semibold text-[#1A1035]">{propData.email_cliente || p.email_cliente || '—'}</td></tr>
                  <tr><td className="py-1.5 text-[#5C5470]">IP:</td><td className="text-[#9ca3af] font-mono text-[11px]">{propData.firma_ip || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-emerald-600 mt-4">Validez legal: Ley 19.799 — Firma Electrónica Simple</p>
          </div>
        )}

        {showAceptar && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6">
            <h3 className="text-[16px] font-bold text-[#1A1035] text-center mb-2">Firma electrónica</h3>
            <p className="text-[12px] text-[#5C5470] text-center mb-5">Ingresa el código enviado a <strong>{emailMasked}</strong> y tu nombre para firmar.</p>

            {/* Código */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-[#5C5470] uppercase tracking-wider mb-2 text-center">Código de verificación</label>
              <input
                value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full max-w-[200px] mx-auto block px-4 py-3 border-2 border-[#e2dfd9] rounded-xl text-center text-[24px] font-mono font-bold tracking-[6px] focus:border-[#0d1b2a] outline-none"
                placeholder="000000" maxLength={6}
              />
            </div>

            {/* Firma (nombre con tipografía) */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-[#5C5470] uppercase tracking-wider mb-2 text-center">Su firma</label>
              <div className="border-2 border-dashed border-[#e2dfd9] rounded-xl p-4 text-center">
                <input
                  value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full text-center text-[28px] font-bold border-none outline-none bg-transparent"
                  style={{ fontFamily: 'cursive, Georgia, serif' }}
                  placeholder="Escriba su nombre"
                />
                {nombre && (
                  <p className="text-[10px] text-[#5C5470] mt-2">Vista previa de su firma electrónica</p>
                )}
              </div>
            </div>

            {/* Modalidad */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[12px] text-[#5C5470]">Modalidad:</span>
              <select value={modalidad} onChange={e => setModalidad(e.target.value)} className="px-3 py-1.5 rounded-lg border border-[#e2dfd9] text-[12px] font-semibold">
                <option value="mensual">Mensual (${p.monto_mensual.toLocaleString('es-CL')}/mes)</option>
                <option value="anual">Anual (${montoAnual.toLocaleString('es-CL')}/año — {p.descuento_anual}% desc.)</option>
              </select>
            </div>

            {/* Legal checkbox */}
            <label className="flex items-start gap-2 mb-5 cursor-pointer max-w-md mx-auto">
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} className="rounded mt-0.5 shrink-0"/>
              <span className="text-[11px] text-[#5C5470] leading-relaxed">
                Al seleccionar "Adoptar y Firmar", acepto que la imagen de la firma anterior será la representación electrónica de mi firma para todos los fines y tendrá el mismo efecto legal que mi firma original en papel.
              </span>
            </label>

            {errorFirma && <p className="text-[12px] text-red-500 text-center mb-3">{errorFirma}</p>}

            <div className="flex justify-center gap-3">
              <button onClick={() => setShowAceptar(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-[#5C5470] border border-[#e2dfd9] hover:bg-[#f9f7f5]">
                Cancelar
              </button>
              <button onClick={handleFirmar} disabled={aceptando || codigo.length !== 6 || !nombre.trim() || !aceptaTerminos}
                className="px-8 py-2.5 rounded-xl text-[14px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2">
                {aceptando ? 'Firmando...' : 'Adoptar y Firmar →'}
              </button>
            </div>

            <p className="text-[10px] text-[#9ca3af] text-center mt-4">
              ¿No recibiste el código? <button onClick={handleEnviarCodigo} className="text-[#0d1b2a] font-medium underline">Reenviar</button>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#e2dfd9] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-5 h-5 rounded" />
            <span className="text-[12px] font-semibold text-[#5C5470]">Kiva360</span>
          </div>
          <p className="text-[11px] text-[#5C5470]">Flexio Technologies SPA · RUT 78.479.402-4</p>
          <p className="text-[10px] text-[#9ca3af] mt-1">pablo@kiva360.cl · +56 9 4961 6038 · kiva360.cl</p>
        </div>
      </div>
    </div>
  )
}
