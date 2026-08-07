'use client'

import Link from 'next/link'

interface Prospecto {
  id: string; nombre: string; apellido: string | null; email: string | null
  etapa: string; observaciones: string | null; metadata: any
  created_at: string; motivo_perdida: string | null
}

interface Props {
  prospecto: Prospecto | null
  colegio: { nombre: string; logo_url: string | null } | null
  usuario: { nombre: string; colegio_id: string }
}

const ETAPAS_POSTULANTE = [
  { key: 'calificado', label: 'Recibida', desc: 'Tu postulación fue recibida y está en cola de revisión.', icon: 'ti-inbox', color: '#60a5fa' },
  { key: 'informado', label: 'En revisión', desc: 'El equipo está revisando tu documentación.', icon: 'ti-eye', color: '#a78bfa' },
  { key: 'visita', label: 'Entrevista', desc: 'Se coordinará una entrevista o visita presencial.', icon: 'ti-calendar', color: '#fbbf24' },
  { key: 'negociacion', label: 'En decisión', desc: 'Tu postulación está siendo evaluada por el comité.', icon: 'ti-clock', color: '#f97316' },
  { key: 'matricula', label: 'Aprobada', desc: '¡Felicidades! Tu postulación fue aprobada. Pronto te contactaremos para la matrícula.', icon: 'ti-check', color: '#22c55e' },
  { key: 'perdido', label: 'No seleccionado', desc: 'Lamentablemente tu postulación no fue seleccionada en esta oportunidad.', icon: 'ti-x', color: '#ef4444' },
]

export default function PostulacionTracker({ prospecto, colegio, usuario }: Props) {
  if (!prospecto) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="page-title">Mi Postulación</h1>
        <div className="card p-10 text-center mt-6">
          <i className="ti ti-file-search text-4xl text-[var(--ar-muted)] opacity-40 mb-3" aria-hidden="true" />
          <p className="text-[14px] text-[var(--ar-muted)] mb-4">Aún no has enviado tu postulación.</p>
          <Link
            href={`/postular?c=${usuario.colegio_id}`}
            className="btn-primary inline-flex items-center gap-2 text-[12px]"
          >
            <i className="ti ti-plus text-[14px]" aria-hidden="true" />
            Completar postulación
          </Link>
        </div>
      </div>
    )
  }

  const currentEtapaIdx = ETAPAS_POSTULANTE.findIndex(e => e.key === prospecto.etapa)
  const currentEtapa = ETAPAS_POSTULANTE[currentEtapaIdx] || ETAPAS_POSTULANTE[0]
  const isAprobada = prospecto.etapa === 'matricula'
  const isRechazada = prospecto.etapa === 'perdido'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Mi Postulación</h1>
          <p className="page-subtitle">
            {colegio?.nombre || 'Centro educativo'} · Enviada el {new Date(prospecto.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: currentEtapa.color + '15' }}
          >
            <i className={`ti ${currentEtapa.icon} text-[22px]`} style={{ color: currentEtapa.color }} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[var(--ar-text)]">{currentEtapa.label}</span>
              {isAprobada && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">APROBADA</span>}
              {isRechazada && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">NO SELECCIONADA</span>}
            </div>
            <p className="text-[13px] text-[var(--ar-muted)] mt-0.5">{currentEtapa.desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        {!isRechazada && (
          <div className="flex gap-1.5">
            {ETAPAS_POSTULANTE.filter(e => e.key !== 'perdido').map((e, idx) => {
              const isActive = idx <= currentEtapaIdx
              return (
                <div key={e.key} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full h-2 rounded-full transition-all"
                    style={{ background: isActive ? currentEtapa.color : '#e2dfd9' }}
                  />
                  <span className={`text-[9px] font-medium ${isActive ? 'text-[var(--ar-text)]' : 'text-[var(--ar-muted)]'}`}>
                    {e.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Motivo de rechazo */}
        {isRechazada && prospecto.motivo_perdida && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-[12px] text-red-700"><strong>Motivo:</strong> {prospecto.motivo_perdida}</p>
          </div>
        )}
      </div>

      {/* Datos de la postulación */}
      <div className="card p-5 mb-6">
        <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-3">Datos de la postulación</h3>
        <div className="space-y-2 text-[12px]">
          <div className="flex gap-3"><span className="text-[var(--ar-muted)] w-28 shrink-0">Nombre</span><span className="text-[var(--ar-text)]">{prospecto.nombre} {prospecto.apellido || ''}</span></div>
          {prospecto.email && <div className="flex gap-3"><span className="text-[var(--ar-muted)] w-28 shrink-0">Email</span><span className="text-[var(--ar-text)]">{prospecto.email}</span></div>}
          {prospecto.metadata?.nombre_alumno && <div className="flex gap-3"><span className="text-[var(--ar-muted)] w-28 shrink-0">Alumno/a</span><span className="text-[var(--ar-text)]">{prospecto.metadata.nombre_alumno}</span></div>}
          {prospecto.metadata?.edad_alumno && <div className="flex gap-3"><span className="text-[var(--ar-muted)] w-28 shrink-0">Edad</span><span className="text-[var(--ar-text)]">{prospecto.metadata.edad_alumno}</span></div>}
          {prospecto.metadata?.diagnostico && <div className="flex gap-3"><span className="text-[var(--ar-muted)] w-28 shrink-0">Diagnóstico</span><span className="text-[var(--ar-text)]">{prospecto.metadata.diagnostico}</span></div>}
        </div>
      </div>

      {/* Documentos */}
      {prospecto.metadata?.documentos && Object.keys(prospecto.metadata.documentos).length > 0 && (
        <div className="card p-5">
          <h3 className="text-[13px] font-bold text-[var(--ar-text)] mb-3">Documentos enviados</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(prospecto.metadata.documentos as Record<string, string>).map(([key, url]) => {
              const labels: Record<string, string> = {
                ci_alumno_frente: 'CI Alumno (frente)',
                ci_alumno_reverso: 'CI Alumno (reverso)',
                foto_alumno: 'Foto alumno',
                ci_apoderado_frente: 'CI Apoderado (frente)',
                ci_apoderado_reverso: 'CI Apoderado (reverso)',
                certificado_nacimiento: 'Cert. nacimiento',
                cuenta_servicio_basico: 'Cuenta serv. básico',
                certificado_medico: 'Cert. médico',
              }
              const isPdf = url.toLowerCase().endsWith('.pdf')
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--ar-border)] hover:bg-[#f9f7f5] transition-colors"
                >
                  {isPdf ? (
                    <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center shrink-0">
                      <i className="ti ti-file-type-pdf text-red-500 text-[14px]" aria-hidden="true" />
                    </div>
                  ) : (
                    <img src={url} alt={labels[key] || key} className="w-8 h-8 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[var(--ar-text)] truncate">{labels[key] || key}</p>
                    <p className="text-[9px] text-emerald-600">Enviado ✓</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
