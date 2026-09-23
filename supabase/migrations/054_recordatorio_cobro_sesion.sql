-- ============================================================
-- MIGRACIÓN 054 — Recordatorio de pago para cobros_sesion
-- El cron de cobranza (recordatorios) solo cubría cobros (mensualidades).
-- Se agrega el campo para poder enviar un recordatorio de pago a las
-- prestaciones individuales sin duplicarlo si el cron corre varias veces.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.cobros_sesion ADD COLUMN IF NOT EXISTS recordatorio_enviado_at timestamptz;

COMMENT ON COLUMN public.cobros_sesion.recordatorio_enviado_at IS 'Fecha del único recordatorio de pago enviado por email a la familia. NULL = aún no se envía.';
