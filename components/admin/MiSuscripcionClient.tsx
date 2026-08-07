'use client'

interface Suscripcion {
  id: string; plan: string; monto_mensual: number; estado: string
  fecha_inicio: string; fecha_vencimiento: string | null
  ultimo_pago_at: string | null; meses_pagados: number
}

interface Pago {
  id: string; monto: number; periodo: string; estado: string
  metodo: string | null; pagado_at: string | null
}

interface Props {
  suscripcion: Suscripcion | null
  pagos: Pago[]
}

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico', profesional: 'Profesional', enterprise: 'Enterprise',
}

const ESTADO_STYLES: Record<string, string> = {
  activa: 'bg-emerald-100 text-emerald-700',
  trial: 'bg-blue-100 text-blue-700',
  atrasada: 'bg-red-100 text-red-700',
  suspendida: 'bg-orange-100 text-orange-700',
  cancelada: 'bg-slate-100 text-slate-500',
}

export default function MiSuscripcionClient({ suscripcion, pagos }: Props) {
  if (!suscripcion) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="page-title">Mi Suscripción</h1>
        <div className="card p-10 text-center mt-6">
          <i className="ti ti-credit-card-off text-4xl text-[var(--ar-muted)] opacity-40 mb-3" aria-hidden="true" />
          <p className="text-[14px] text-[var(--ar-muted)]">No tienes una suscripción activa.</p>
          <p className="text-[12px] text-[var(--ar-muted)] mt-1">Contacta a Kiva360 para activar tu plan.</p>
        </div>
      </div>
    )
  }

  const vencido = suscripcion.fecha_vencimiento && new Date(suscripcion.fecha_vencimiento) < new Date()
  const diasRestantes = suscripcion.fecha_vencimiento
    ? Math.ceil((new Date(suscripcion.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="page-title">Mi Suscripción</h1>
      <p className="page-subtitle mb-6">Plan y estado de pago de tu cuenta Kiva360</p>

      {/* Plan card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <i className="ti ti-diamond text-violet-600 text-[20px]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[var(--ar-text)]">Plan {PLAN_LABELS[suscripcion.plan] || suscripcion.plan}</h2>
              <p className="text-[12px] text-[var(--ar-muted)]">Desde {new Date(suscripcion.fecha_inicio).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ESTADO_STYLES[suscripcion.estado] || ''}`}>
            {suscripcion.estado.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--ar-border)]">
          <div>
            <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Monto mensual</p>
            <p className="text-[18px] font-bold text-[var(--ar-text)]">${suscripcion.monto_mensual.toLocaleString('es-CL')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Próximo pago</p>
            <p className={`text-[14px] font-bold ${vencido ? 'text-red-600' : 'text-[var(--ar-text)]'}`}>
              {suscripcion.fecha_vencimiento
                ? new Date(suscripcion.fecha_vencimiento).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                : '—'}
            </p>
            {diasRestantes !== null && !vencido && (
              <p className="text-[10px] text-[var(--ar-muted)]">en {diasRestantes} días</p>
            )}
            {vencido && <p className="text-[10px] text-red-500 font-medium">Vencido</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--ar-muted)] uppercase">Meses pagados</p>
            <p className="text-[18px] font-bold text-[var(--ar-text)]">{suscripcion.meses_pagados}</p>
          </div>
        </div>
      </div>

      {/* Datos para pagar */}
      <div className="card p-5 mb-6 bg-[#faf9f7]">
        <h3 className="text-[12px] font-bold text-[var(--ar-text)] mb-3 flex items-center gap-2">
          <i className="ti ti-building-bank text-[16px] text-[var(--ar-muted)]" aria-hidden="true" />
          Datos para realizar tu pago
        </h3>
        <div className="text-[12px] text-[var(--ar-text)] space-y-1 pl-6">
          <div><strong>Nombre:</strong> Flexio Technologies Spa</div>
          <div><strong>RUT:</strong> 78.479.402-4</div>
          <div><strong>Banco:</strong> Bci</div>
          <div><strong>Cuenta Corriente:</strong> 68569265</div>
          <div><strong>Email:</strong> pablo@flexio.cl</div>
        </div>
        <p className="text-[10px] text-[var(--ar-muted)] mt-3 pl-6">
          Realiza la transferencia antes del día 30 de cada mes. Envía el comprobante a pablo@flexio.cl.
        </p>
      </div>

      {/* Historial de pagos */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--ar-border)]">
          <h3 className="text-[12px] font-bold text-[var(--ar-text)]">Historial de pagos</h3>
        </div>
        {pagos.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-[var(--ar-muted)]">
            No hay pagos registrados aún.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-[#f9f7f5]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--ar-muted)]">Período</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--ar-muted)]">Monto</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[var(--ar-muted)]">Estado</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--ar-muted)]">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} className="border-b border-[var(--ar-border)]">
                  <td className="px-4 py-2.5 font-medium">{p.periodo}</td>
                  <td className="px-4 py-2.5 text-right">${p.monto.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--ar-muted)]">
                    {p.pagado_at ? new Date(p.pagado_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
