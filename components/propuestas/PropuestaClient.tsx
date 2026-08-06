'use client'

import { useState } from 'react'

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

  const montoAnual = p.monto_anual || Math.round(p.monto_mensual * 12 * (1 - p.descuento_anual / 100))
  const montoMensualAnual = Math.round(montoAnual / 12)
  const ahorro = p.monto_mensual * 12 - montoAnual

  async function handleAceptar() {
    if (!nombre.trim()) return
    setAceptando(true)
    try {
      const res = await fetch('/api/propuestas/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: p.slug, nombre_aceptante: nombre, modalidad }),
      })
      if (res.ok) setAceptada(true)
    } catch {} finally { setAceptando(false) }
  }

  if (aceptada) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-[24px] font-bold text-[#1A1035] mb-3" style={{ fontFamily: 'Space Grotesk' }}>Propuesta aceptada</h1>
          <p className="text-[14px] text-[#5C5470] mb-4">Gracias por confiar en Kiva360. Nos pondremos en contacto para iniciar la implementación.</p>
          <p className="text-[12px] text-[#5C5470]">Aceptada por: <strong>{p.aceptada_por || nombre}</strong></p>
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
            <p><strong>Duración:</strong> {p.duracion_meses} meses, renovable automáticamente.</p>
            <p><strong>Sin permanencia obligatoria:</strong> puede dar término con 30 días de aviso, sin multas.</p>
            <p><strong>Propiedad de datos:</strong> todos los datos son del cliente. Exportación disponible en cualquier momento (JSON/CSV).</p>
            <p><strong>Respaldos:</strong> backups automáticos diarios con retención de 30 días.</p>
            <p><strong>Disponibilidad:</strong> SLA 99.5%. Recuperación ante desastres en máximo 4 horas.</p>
            <p><strong>Soporte:</strong> email y WhatsApp, lunes a viernes 9:00-18:00. Respuesta máxima 4 horas hábiles.</p>
            <p><strong>Actualizaciones:</strong> incluidas sin costo adicional.</p>
            <p><strong>Confidencialidad:</strong> datos protegidos bajo Ley 19.628. No se comparten con terceros.</p>
            <p><strong>Post-contrato:</strong> datos entregados en 5 días hábiles y eliminados en 30 días.</p>
            {p.condiciones_especiales && <p><strong>Condiciones especiales:</strong> {p.condiciones_especiales}</p>}
          </div>
        </div>

        {/* Accept */}
        {p.estado === 'enviada' && !showAceptar && (
          <div className="text-center">
            <button onClick={() => setShowAceptar(true)}
              className="px-8 py-4 rounded-xl text-[15px] font-bold text-white bg-[#0d1b2a] hover:bg-[#1a2d47] transition-all shadow-lg active:scale-[0.98]">
              Aceptar propuesta
            </button>
            <p className="text-[11px] text-[#5C5470] mt-3">Al aceptar, confirmas que estás de acuerdo con las condiciones descritas.</p>
          </div>
        )}

        {showAceptar && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 text-center">
            <h3 className="text-[15px] font-bold text-[#1A1035] mb-4">Confirmar aceptación</h3>
            <p className="text-[12px] text-[#5C5470] mb-4">Ingresa tu nombre completo para confirmar:</p>
            <input
              value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full max-w-xs mx-auto px-4 py-3 border border-[#e2dfd9] rounded-xl text-center text-[14px] mb-4"
              placeholder="Nombre completo"
            />
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[12px] text-[#5C5470]">Modalidad:</span>
              <span className="text-[12px] font-bold text-[#1A1035] capitalize">{modalidad}</span>
              <span className="text-[12px] text-[#5C5470]">·</span>
              <span className="text-[12px] font-bold text-[#1A1035]">
                ${(modalidad === 'anual' ? montoAnual : p.monto_mensual).toLocaleString('es-CL')}/{modalidad === 'anual' ? 'año' : 'mes'}
              </span>
            </div>
            <button onClick={handleAceptar} disabled={aceptando || !nombre.trim()}
              className="px-8 py-3 rounded-xl text-[14px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50">
              {aceptando ? 'Procesando...' : 'Confirmo y acepto'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#e2dfd9] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icono-solo/kiva360-icon.svg" alt="Kiva360" className="w-5 h-5 rounded" />
            <span className="text-[12px] font-semibold text-[#5C5470]">Kiva360</span>
          </div>
          <p className="text-[11px] text-[#5C5470]">contacto@kiva360.cl · +56 9 3690 2642 · kiva360.cl</p>
        </div>
      </div>
    </div>
  )
}
