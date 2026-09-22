-- ============================================================
-- MIGRACIÓN 047 — Finanzas y Facturación (P0)
-- Base de datos para el nuevo módulo de Finanzas: configuración
-- tributaria del colegio, documentos tributarios (abstraídos de
-- cualquier proveedor DTE), auditoría financiera granular, pagos
-- que cubren varias prestaciones, y una vista de cuenta corriente
-- que unifica cobros (mensualidades) y cobros_sesion (prestaciones)
-- SIN modificar ninguna de esas dos tablas existentes.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- =====================================================================
-- 1. CONFIGURACIÓN TRIBUTARIA DEL COLEGIO
-- Datos necesarios para emitir documentos tributarios a nombre del
-- centro. `proveedor_facturacion` y las credenciales del proveedor NO
-- se guardan en esta tabla en texto plano — solo un identificador de
-- referencia; las credenciales reales viven en variables de entorno /
-- secret manager, nunca en la base de datos ni en el frontend.
-- =====================================================================
ALTER TABLE public.colegios
  ADD COLUMN IF NOT EXISTS razon_social         text,
  ADD COLUMN IF NOT EXISTS giro                 text,
  ADD COLUMN IF NOT EXISTS comuna               text,
  ADD COLUMN IF NOT EXISTS email_tributario     text,
  ADD COLUMN IF NOT EXISTS proveedor_facturacion text, -- identificador del proveedor DTE configurado (ej: 'manual', 'bsale', 'acepta')
  ADD COLUMN IF NOT EXISTS emision_documentos   text NOT NULL DEFAULT 'manual' CHECK (emision_documentos IN ('manual', 'automatica')),
  ADD COLUMN IF NOT EXISTS dias_vencimiento_default integer NOT NULL DEFAULT 5;

COMMENT ON COLUMN public.colegios.proveedor_facturacion IS 'Identificador del BillingProvider configurado. NULL/''manual'' = sin integración DTE activa (documentos quedan en estado pendiente_manual).';
COMMENT ON COLUMN public.colegios.emision_documentos IS 'manual: un administrativo genera el documento a mano en el proveedor y sube el folio. automatica: Kiva360 llama al BillingProvider al confirmarse el pago.';

-- =====================================================================
-- 2. DOCUMENTOS TRIBUTARIOS
-- Representa boletas, facturas y notas de crédito, desacoplado de
-- cualquier proveedor concreto (ver lib/billing/provider.ts).
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.documentos_tributarios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id        uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- A quién se le emite
  alumno_id         uuid REFERENCES public.alumnos(id) ON DELETE SET NULL,
  familia_id        uuid REFERENCES public.familias(id) ON DELETE SET NULL,
  -- Origen del cobro (uno de los dos, según el tipo de prestación)
  cobro_id          uuid REFERENCES public.cobros(id) ON DELETE SET NULL,
  cobro_sesion_id   uuid REFERENCES public.cobros_sesion(id) ON DELETE SET NULL,
  -- Documento
  tipo              text NOT NULL CHECK (tipo IN ('boleta', 'factura', 'nota_credito')),
  folio             text, -- folio asignado por el proveedor/SII; NULL mientras está pendiente
  documento_relacionado_id uuid REFERENCES public.documentos_tributarios(id), -- para notas de crédito: a qué documento anulan
  -- Montos
  monto_neto        integer,
  monto_iva         integer,
  monto_total       integer NOT NULL,
  -- Proveedor
  proveedor         text NOT NULL DEFAULT 'manual', -- 'manual' | identificador del BillingProvider usado
  proveedor_doc_id  text, -- id externo del documento en el proveedor (para consultar estado/PDF)
  -- Estado del ciclo de vida tributario
  estado            text NOT NULL DEFAULT 'pendiente_manual' CHECK (estado IN ('pendiente_manual', 'emitiendo', 'emitido', 'error', 'anulado')),
  error_detalle     text,
  -- Archivo / envío
  pdf_url           text,
  enviado_email_at  timestamptz,
  enviado_a         text,
  -- Meta
  emitido_por       uuid REFERENCES public.usuarios(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documentos_tributarios_origen_check CHECK (
    cobro_id IS NOT NULL OR cobro_sesion_id IS NOT NULL OR tipo = 'nota_credito'
  )
);

ALTER TABLE public.documentos_tributarios ENABLE ROW LEVEL SECURITY;

-- Finanzas/administración del colegio: acceso completo a sus documentos
CREATE POLICY "colegio admin: all documentos_tributarios" ON public.documentos_tributarios
  FOR ALL
  USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus'))
  WITH CHECK (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus'));

-- Apoderado: solo lectura de los documentos de sus propios hijos
CREATE POLICY "apoderado: select own documentos_tributarios" ON public.documentos_tributarios
  FOR SELECT
  USING (
    public.mi_rol() = 'apoderado'
    AND alumno_id IN (SELECT alumno_id FROM public.tutor_alumnos WHERE tutor_id = auth.uid())
  );

GRANT ALL ON public.documentos_tributarios TO authenticated;
GRANT ALL ON public.documentos_tributarios TO service_role;

CREATE INDEX IF NOT EXISTS idx_doctrib_colegio ON public.documentos_tributarios(colegio_id, estado);
CREATE INDEX IF NOT EXISTS idx_doctrib_alumno ON public.documentos_tributarios(alumno_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctrib_cobro ON public.documentos_tributarios(cobro_id);
CREATE INDEX IF NOT EXISTS idx_doctrib_cobro_sesion ON public.documentos_tributarios(cobro_sesion_id);

DROP TRIGGER IF EXISTS tr_documentos_tributarios_updated_at ON public.documentos_tributarios;
CREATE TRIGGER tr_documentos_tributarios_updated_at BEFORE UPDATE ON public.documentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 3. AUDITORÍA FINANCIERA
-- Generaliza log_cobranza (que se mantiene intacto para sus eventos de
-- recordatorios) con un registro de valor anterior/nuevo para cualquier
-- cambio sensible: montos, anulaciones, descuentos, emisión de
-- documentos, notas de crédito, cambios de configuración tributaria.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.log_auditoria_financiera (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  usuario_id      uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  accion          text NOT NULL, -- 'monto_modificado', 'cobro_anulado', 'descuento_aplicado', 'documento_emitido', 'nota_credito_emitida', 'config_tributaria_modificada', etc.
  entidad         text NOT NULL, -- 'cobros' | 'cobros_sesion' | 'documentos_tributarios' | 'colegios' | ...
  entidad_id      uuid,
  valor_anterior  jsonb,
  valor_nuevo     jsonb,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.log_auditoria_financiera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finanzas: select log_auditoria_financiera" ON public.log_auditoria_financiera
  FOR SELECT
  USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus'));

-- Solo el backend (service_role) inserta auditoría; nunca se edita/borra desde el cliente.
GRANT SELECT ON public.log_auditoria_financiera TO authenticated;
GRANT ALL ON public.log_auditoria_financiera TO service_role;

CREATE INDEX IF NOT EXISTS idx_audit_fin_colegio_fecha ON public.log_auditoria_financiera(colegio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_fin_entidad ON public.log_auditoria_financiera(entidad, entidad_id);

COMMENT ON TABLE public.log_auditoria_financiera IS 'Auditoría inmutable de operaciones financieras sensibles. Solo INSERT desde el backend, nunca UPDATE/DELETE.';

-- =====================================================================
-- 4. APLICACIONES DE PAGO (un pago puede cubrir varias prestaciones)
-- No reemplaza el flujo actual de `pagos.cobro_id` (1 pago -> 1 cobro),
-- que se mantiene intacto para no romper Webpay/ModalPago. Esta tabla
-- es aditiva: se usa desde el nuevo módulo de Finanzas cuando un pago
-- registrado debe repartirse entre varios cobros y/o cobros_sesion.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pago_aplicaciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  pago_id         uuid NOT NULL REFERENCES public.pagos(id) ON DELETE CASCADE,
  cobro_id        uuid REFERENCES public.cobros(id) ON DELETE CASCADE,
  cobro_sesion_id uuid REFERENCES public.cobros_sesion(id) ON DELETE CASCADE,
  monto_aplicado  integer NOT NULL CHECK (monto_aplicado > 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pago_aplicaciones_destino_check CHECK (
    (cobro_id IS NOT NULL AND cobro_sesion_id IS NULL) OR
    (cobro_id IS NULL AND cobro_sesion_id IS NOT NULL)
  )
);

ALTER TABLE public.pago_aplicaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all pago_aplicaciones" ON public.pago_aplicaciones
  FOR ALL
  USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus'))
  WITH CHECK (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus'));

GRANT ALL ON public.pago_aplicaciones TO authenticated;
GRANT ALL ON public.pago_aplicaciones TO service_role;

CREATE INDEX IF NOT EXISTS idx_pago_aplicaciones_pago ON public.pago_aplicaciones(pago_id);
CREATE INDEX IF NOT EXISTS idx_pago_aplicaciones_cobro ON public.pago_aplicaciones(cobro_id);
CREATE INDEX IF NOT EXISTS idx_pago_aplicaciones_cobro_sesion ON public.pago_aplicaciones(cobro_sesion_id);

-- =====================================================================
-- 5. CUENTA CORRIENTE UNIFICADA (vista de solo lectura)
-- Une `cobros` (mensualidades/aportes) y `cobros_sesion` (prestaciones
-- individuales) en una sola lista normalizada por paciente, sin
-- duplicar ni migrar datos de ninguna de las dos tablas.
-- =====================================================================
CREATE OR REPLACE VIEW public.cuenta_corriente_view AS
SELECT
  'mensualidad'::text                    AS origen,
  c.id                                    AS item_id,
  c.colegio_id,
  c.alumno_id,
  c.familia_id,
  co.nombre                               AS descripcion,
  make_date(c.anio, c.mes, 1)              AS fecha,
  c.fecha_vencimiento,
  c.monto                                 AS monto,
  0                                       AS descuento,
  c.monto_pagado                          AS monto_pagado,
  (c.monto - c.monto_pagado)              AS saldo,
  c.estado,
  c.medio_pago,
  NULL::uuid                              AS profesional_id,
  c.id                                    AS cobro_id,
  NULL::uuid                              AS cobro_sesion_id
FROM public.cobros c
LEFT JOIN public.conceptos_cobro co ON co.id = c.concepto_id

UNION ALL

SELECT
  'prestacion'::text                      AS origen,
  cs.id                                    AS item_id,
  cs.colegio_id,
  cs.alumno_id,
  cs.familia_id,
  cs.descripcion,
  cs.fecha_sesion                          AS fecha,
  cs.fecha_sesion                          AS fecha_vencimiento, -- las sesiones no tienen vencimiento propio; se cobran al día
  cs.monto                                 AS monto,
  cs.descuento                             AS descuento,
  CASE WHEN cs.estado = 'pagado' THEN cs.monto_final ELSE 0 END AS monto_pagado,
  CASE WHEN cs.estado IN ('pagado', 'condonado', 'anulado') THEN 0 ELSE cs.monto_final END AS saldo,
  cs.estado,
  cs.medio_pago,
  cs.profesional_id,
  NULL::uuid                              AS cobro_id,
  cs.id                                    AS cobro_sesion_id
FROM public.cobros_sesion cs;

COMMENT ON VIEW public.cuenta_corriente_view IS 'Vista unificada de solo lectura de cobros (mensualidades) + cobros_sesion (prestaciones) para mostrar la cuenta corriente de un paciente. No es una tabla: no persiste datos propios.';

GRANT SELECT ON public.cuenta_corriente_view TO authenticated;
GRANT SELECT ON public.cuenta_corriente_view TO service_role;
