-- ============================================================
-- MIGRACIÓN 051 — Soporte real para pago que cubre varias prestaciones
-- La tabla pago_aplicaciones ya existía (migración 047) pero pagos.cobro_id
-- era NOT NULL, lo que impedía crear un pago que no estuviera atado a un
-- único cobro. Se relaja esa restricción y se agrega alumno_id para que
-- un pago "general" tenga un dueño claro sin depender de un cobro_id.
-- No afecta el flujo actual de Webpay/ModalPago (siguen llenando cobro_id
-- normalmente); esto es aditivo.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.pagos ALTER COLUMN cobro_id DROP NOT NULL;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS alumno_id uuid REFERENCES public.alumnos(id);

COMMENT ON COLUMN public.pagos.cobro_id IS 'NULL cuando el pago cubre varias prestaciones (ver pago_aplicaciones) en vez de un único cobro.';
COMMENT ON COLUMN public.pagos.alumno_id IS 'Dueño del pago cuando cobro_id es NULL (pago multi-prestación).';

CREATE INDEX IF NOT EXISTS idx_pagos_alumno ON public.pagos(alumno_id) WHERE alumno_id IS NOT NULL;
