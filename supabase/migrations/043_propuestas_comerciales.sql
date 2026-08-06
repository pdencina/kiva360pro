-- ============================================================
-- MIGRACIÓN 043 — Propuestas Comerciales
-- Permite al super_admin crear propuestas para clientes potenciales,
-- con precios, planes, y aceptación online.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.propuestas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador único para URL pública
  slug            text UNIQUE NOT NULL, -- "sakura-kids", "colegio-aurora"
  -- Datos del cliente
  nombre_cliente  text NOT NULL,
  rut_cliente     text,
  representante   text,
  email_cliente   text,
  telefono_cliente text,
  -- Plan y precio
  plan            text NOT NULL DEFAULT 'profesional',
  modalidad_pago  text NOT NULL DEFAULT 'mensual' CHECK (modalidad_pago IN ('mensual', 'anual')),
  monto_mensual   integer NOT NULL, -- CLP
  monto_anual     integer, -- CLP (con descuento si aplica)
  descuento_anual integer DEFAULT 10, -- % descuento por pago anual
  -- Módulos incluidos
  modulos_incluidos text[] DEFAULT '{}',
  -- Fechas
  fecha_inicio    date,
  duracion_meses  integer DEFAULT 12,
  -- Estado
  estado          text NOT NULL DEFAULT 'enviada' CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida')),
  aceptada_at     timestamptz,
  aceptada_por    text, -- nombre de quien aceptó
  -- Notas
  notas_internas  text,
  condiciones_especiales text,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;
-- Solo super_admin gestiona propuestas
CREATE POLICY "service: all propuestas" ON public.propuestas FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.propuestas TO authenticated;
GRANT ALL ON public.propuestas TO service_role;

CREATE INDEX IF NOT EXISTS idx_propuestas_slug ON public.propuestas(slug);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado ON public.propuestas(estado);

DROP TRIGGER IF EXISTS tr_propuestas_updated_at ON public.propuestas;
CREATE TRIGGER tr_propuestas_updated_at BEFORE UPDATE ON public.propuestas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.propuestas IS 'Propuestas comerciales enviadas a clientes potenciales de Kiva360.';
