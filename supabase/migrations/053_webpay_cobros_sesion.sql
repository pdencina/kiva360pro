-- ============================================================
-- MIGRACIÓN 053 — Permitir pagar cobros_sesion vía Webpay
-- Hoy el flujo de pago online (portal del apoderado + Webpay) solo
-- soporta `cobros` (mensualidades). Para un centro de salud/terapia
-- donde la prestación es la sesión individual, esto deja el pago de
-- sesiones siempre dependiente de que un administrativo lo registre
-- a mano. Se agrega la columna que falta para que el apoderado pueda
-- pagar una sesión directamente, sin intervención humana.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cobro_sesion_id uuid REFERENCES public.cobros_sesion(id);

COMMENT ON COLUMN public.pagos.cobro_sesion_id IS 'Cuando el pago corresponde a una prestación individual (cobros_sesion) en vez de una mensualidad (cobros).';

CREATE INDEX IF NOT EXISTS idx_pagos_cobro_sesion ON public.pagos(cobro_sesion_id) WHERE cobro_sesion_id IS NOT NULL;
