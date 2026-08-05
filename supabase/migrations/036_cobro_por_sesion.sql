-- ============================================================
-- MIGRACIÓN 036 — Cobro por Sesión Individual
-- Permite facturar sesiones terapéuticas individuales (fonoaudiología,
-- T.O., psicología, etc.) además de las mensualidades.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. TARIFAS DE SESIÓN
-- Cada colegio define cuánto cobra por tipo de sesión/especialidad
-- =====================
CREATE TABLE IF NOT EXISTS public.tarifas_sesion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Configuración
  nombre          text NOT NULL, -- "Sesión Fonoaudiología", "Sesión T.O. 45min"
  especialidad    text, -- opcional: vincular a una especialidad específica
  tipo_sesion     text DEFAULT 'individual'
                  CHECK (tipo_sesion IN ('individual', 'grupal', 'familiar', 'evaluacion')),
  duracion_min    integer NOT NULL DEFAULT 45,
  -- Precio
  monto           integer NOT NULL, -- CLP
  -- Estado
  activo          boolean NOT NULL DEFAULT true,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tarifas_sesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all tarifas_sesion" ON public.tarifas_sesion
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.tarifas_sesion TO authenticated;
GRANT ALL ON public.tarifas_sesion TO service_role;

CREATE INDEX IF NOT EXISTS idx_tarifas_sesion_colegio ON public.tarifas_sesion(colegio_id, activo);

DROP TRIGGER IF EXISTS tr_tarifas_sesion_updated_at ON public.tarifas_sesion;
CREATE TRIGGER tr_tarifas_sesion_updated_at BEFORE UPDATE ON public.tarifas_sesion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 2. COBROS DE SESIÓN (vincula agenda con facturación)
-- Un cobro generado por cada sesión completada
-- =====================
CREATE TABLE IF NOT EXISTS public.cobros_sesion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Vínculos
  agenda_sesion_id uuid REFERENCES public.agenda_sesiones(id) ON DELETE SET NULL,
  sesion_terapeutica_id uuid REFERENCES public.sesiones_terapeuticas(id) ON DELETE SET NULL,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id),
  familia_id      uuid REFERENCES public.familias(id),
  tarifa_id       uuid REFERENCES public.tarifas_sesion(id),
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id),
  -- Detalle
  fecha_sesion    date NOT NULL,
  descripcion     text NOT NULL, -- "Sesión Fonoaudiología — 15 jul 2026"
  -- Monto
  monto           integer NOT NULL,
  descuento       integer NOT NULL DEFAULT 0, -- descuento aplicado (paquete, beca, etc.)
  monto_final     integer NOT NULL, -- monto - descuento
  -- Estado de pago
  estado          text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'pagado', 'parcial', 'anulado', 'condonado')),
  -- Pago
  fecha_pago      date,
  medio_pago      text CHECK (medio_pago IN ('transferencia', 'efectivo', 'webpay', 'app', NULL)),
  comprobante_url text,
  pagado_por      uuid REFERENCES public.usuarios(id),
  -- Meta
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cobros_sesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all cobros_sesion" ON public.cobros_sesion
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.cobros_sesion TO authenticated;
GRANT ALL ON public.cobros_sesion TO service_role;

CREATE INDEX IF NOT EXISTS idx_cobros_sesion_colegio ON public.cobros_sesion(colegio_id, estado);
CREATE INDEX IF NOT EXISTS idx_cobros_sesion_alumno ON public.cobros_sesion(alumno_id, fecha_sesion DESC);
CREATE INDEX IF NOT EXISTS idx_cobros_sesion_familia ON public.cobros_sesion(familia_id, estado);
CREATE INDEX IF NOT EXISTS idx_cobros_sesion_profesional ON public.cobros_sesion(profesional_id, fecha_sesion DESC);

DROP TRIGGER IF EXISTS tr_cobros_sesion_updated_at ON public.cobros_sesion;
CREATE TRIGGER tr_cobros_sesion_updated_at BEFORE UPDATE ON public.cobros_sesion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 3. PAQUETES DE SESIONES (opcional: vender packs con descuento)
-- =====================
CREATE TABLE IF NOT EXISTS public.paquetes_sesion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Config
  nombre          text NOT NULL, -- "Pack 10 sesiones Fonoaudiología"
  tarifa_id       uuid REFERENCES public.tarifas_sesion(id),
  cantidad        integer NOT NULL, -- número de sesiones incluidas
  precio_total    integer NOT NULL, -- precio del pack completo
  descuento_pct   integer NOT NULL DEFAULT 0, -- % de descuento vs precio unitario
  -- Estado
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paquetes_sesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all paquetes_sesion" ON public.paquetes_sesion
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.paquetes_sesion TO authenticated;
GRANT ALL ON public.paquetes_sesion TO service_role;

-- =====================
-- 4. PAQUETES VENDIDOS (cada venta de un pack a una familia)
-- =====================
CREATE TABLE IF NOT EXISTS public.paquetes_vendidos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  paquete_id      uuid NOT NULL REFERENCES public.paquetes_sesion(id),
  familia_id      uuid NOT NULL REFERENCES public.familias(id),
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id),
  -- Tracking
  sesiones_total  integer NOT NULL,
  sesiones_usadas integer NOT NULL DEFAULT 0,
  -- Pago
  monto_pagado    integer NOT NULL DEFAULT 0,
  estado_pago     text NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial')),
  -- Vigencia
  fecha_inicio    date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date, -- NULL = no vence
  activo          boolean NOT NULL DEFAULT true,
  --
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paquetes_vendidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all paquetes_vendidos" ON public.paquetes_vendidos
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.paquetes_vendidos TO authenticated;
GRANT ALL ON public.paquetes_vendidos TO service_role;

CREATE INDEX IF NOT EXISTS idx_paquetes_vendidos_alumno ON public.paquetes_vendidos(alumno_id, activo);

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.tarifas_sesion IS 'Tarifas configurables por tipo de sesión terapéutica. Cada centro define sus precios.';
COMMENT ON TABLE public.cobros_sesion IS 'Cobros individuales generados por cada sesión completada. Separado de cobros mensuales.';
COMMENT ON TABLE public.paquetes_sesion IS 'Paquetes de sesiones con descuento (ej: 10 sesiones de fono por $X).';
COMMENT ON TABLE public.paquetes_vendidos IS 'Paquetes vendidos a una familia, con tracking de sesiones usadas.';
