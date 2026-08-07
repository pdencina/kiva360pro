-- ============================================================
-- MIGRACIÓN 042 — Billing SaaS: Suscripciones de colegios a Kiva360
-- Cada colegio tiene una suscripción mensual que paga a Flexio Technologies Spa.
-- ============================================================

-- 1. TABLA: suscripciones (una por colegio)
CREATE TABLE IF NOT EXISTS public.suscripciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Plan
  plan            text NOT NULL DEFAULT 'profesional'
                  CHECK (plan IN ('basico', 'profesional', 'enterprise')),
  monto_mensual   integer NOT NULL DEFAULT 0, -- en CLP
  -- Estado
  estado          text NOT NULL DEFAULT 'activa'
                  CHECK (estado IN ('activa', 'atrasada', 'suspendida', 'cancelada', 'trial')),
  -- Fechas
  fecha_inicio    date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date, -- próximo vencimiento (día 30 del mes actual/siguiente)
  dias_gracia     integer NOT NULL DEFAULT 5, -- días después del vencimiento antes de marcar como atrasada
  -- Pago automático
  tarjeta_inscrita boolean NOT NULL DEFAULT false,
  tbk_user        text, -- token oneclick si inscribieron tarjeta
  tbk_token       text,
  -- Historial
  ultimo_pago_at  timestamptz,
  meses_pagados   integer NOT NULL DEFAULT 0,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

-- Super admin ve todo, admin del colegio ve la suya
CREATE POLICY "super_admin: all suscripciones" ON public.suscripciones
  FOR ALL USING (true);

GRANT ALL ON public.suscripciones TO authenticated;
GRANT ALL ON public.suscripciones TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suscripciones_colegio ON public.suscripciones(colegio_id);

-- 2. TABLA: pagos_suscripcion (historial de pagos mensuales)
CREATE TABLE IF NOT EXISTS public.pagos_suscripcion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suscripcion_id  uuid NOT NULL REFERENCES public.suscripciones(id) ON DELETE CASCADE,
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Datos del pago
  monto           integer NOT NULL,
  periodo         text NOT NULL, -- "2026-08", "2026-09"
  estado          text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'pagado', 'atrasado', 'fallido')),
  metodo          text, -- 'transferencia', 'oneclick', 'webpay'
  referencia      text, -- número de transferencia o ID de transacción
  --
  pagado_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos_suscripcion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin: all pagos_suscripcion" ON public.pagos_suscripcion
  FOR ALL USING (true);

GRANT ALL ON public.pagos_suscripcion TO authenticated;
GRANT ALL ON public.pagos_suscripcion TO service_role;

CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion_colegio ON public.pagos_suscripcion(colegio_id, periodo);

-- Trigger updated_at
DROP TRIGGER IF EXISTS tr_suscripciones_updated_at ON public.suscripciones;
CREATE TRIGGER tr_suscripciones_updated_at BEFORE UPDATE ON public.suscripciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMMENTS
COMMENT ON TABLE public.suscripciones IS 'Suscripción mensual de cada colegio al servicio Kiva360. Pagos a Flexio Technologies Spa.';
COMMENT ON TABLE public.pagos_suscripcion IS 'Historial de pagos mensuales de suscripción de cada colegio.';
