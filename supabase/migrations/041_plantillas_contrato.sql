-- ============================================================
-- MIGRACIÓN 041 — Plantillas de Contrato Editables
-- Permite al admin crear/editar plantillas de contrato con logo,
-- variables dinámicas y formato para visualización tipo documento.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plantillas_contrato (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Config
  nombre          text NOT NULL, -- "Contrato Matrícula 2026", "Contrato Sesiones Individuales"
  descripcion     text,
  -- Branding
  logo_url        text, -- URL del logo para el contrato (puede diferir del logo del colegio)
  nombre_institucion text, -- nombre que aparece en el contrato
  rut_institucion text,
  direccion_institucion text,
  representante_nombre text,
  representante_rut text,
  -- Contenido (HTML con variables)
  contenido       text NOT NULL, -- HTML del contrato con placeholders {{nombre_alumno}}, {{nombre_apoderado}}, etc.
  -- Estado
  activo          boolean NOT NULL DEFAULT true,
  es_default      boolean NOT NULL DEFAULT false,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plantillas_contrato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all plantillas_contrato" ON public.plantillas_contrato
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.plantillas_contrato TO authenticated;
GRANT ALL ON public.plantillas_contrato TO service_role;

CREATE INDEX IF NOT EXISTS idx_plantillas_contrato_colegio ON public.plantillas_contrato(colegio_id, activo);

DROP TRIGGER IF EXISTS tr_plantillas_contrato_updated_at ON public.plantillas_contrato;
CREATE TRIGGER tr_plantillas_contrato_updated_at BEFORE UPDATE ON public.plantillas_contrato
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.plantillas_contrato IS 'Plantillas de contrato editables por el admin. Soporta variables dinámicas y logo personalizado.';
