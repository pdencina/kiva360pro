-- ============================================================
-- MIGRACIÓN 039 — Documentos del Alumno + Informes Terapéuticos
-- Permite subir documentos escaneados (carné, certificados) y
-- informes terapéuticos periódicos separados de las evaluaciones pedagógicas.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. DOCUMENTOS DEL ALUMNO (escaneados)
-- Solo visibles para director/admin
-- =====================
CREATE TABLE IF NOT EXISTS public.documentos_alumno (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  -- Datos
  nombre          text NOT NULL, -- "Carné de identidad", "Certificado de nacimiento"
  tipo            text NOT NULL DEFAULT 'otro'
                  CHECK (tipo IN ('carne_identidad', 'certificado_nacimiento', 'certificado_domicilio', 'informe_medico', 'certificado_discapacidad', 'evaluacion_diagnostica', 'otro')),
  archivo_url     text NOT NULL, -- URL del archivo en Supabase Storage
  -- Visibilidad
  solo_director   boolean NOT NULL DEFAULT true, -- si true, solo admin/director ve
  visible_familia boolean NOT NULL DEFAULT false, -- si true, familia puede descargar
  -- Meta
  subido_por      uuid REFERENCES public.usuarios(id),
  descripcion     text,
  --
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_alumno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all documentos_alumno" ON public.documentos_alumno
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.documentos_alumno TO authenticated;
GRANT ALL ON public.documentos_alumno TO service_role;

CREATE INDEX IF NOT EXISTS idx_documentos_alumno ON public.documentos_alumno(alumno_id);

-- =====================
-- 2. INFORMES TERAPÉUTICOS (separados de evaluaciones pedagógicas)
-- Subidos por profesionales del equipo terapéutico
-- =====================
CREATE TABLE IF NOT EXISTS public.informes_terapeuticos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  plan_id         uuid REFERENCES public.planes_intervencion(id) ON DELETE SET NULL,
  -- Datos
  titulo          text NOT NULL, -- "Informe Fonoaudiológico Semestre 1"
  tipo            text NOT NULL DEFAULT 'periodico'
                  CHECK (tipo IN ('ingreso', 'periodico', 'avance', 'alta', 'derivacion', 'otro')),
  especialidad    text, -- fonoaudiologa, psicologa, terapeuta_ocupacional, etc.
  -- Contenido
  contenido       text, -- texto del informe (puede ser resumen)
  archivo_url     text, -- PDF adjunto (si lo suben como archivo)
  -- Período
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  periodo         text, -- "Semestre 1 2026", "Marzo-Junio 2026"
  -- Visibilidad
  visible_familia boolean NOT NULL DEFAULT false, -- true = familia puede verlo y descargarlo
  -- Meta
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id),
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.informes_terapeuticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all informes_terapeuticos" ON public.informes_terapeuticos
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.informes_terapeuticos TO authenticated;
GRANT ALL ON public.informes_terapeuticos TO service_role;

CREATE INDEX IF NOT EXISTS idx_informes_alumno ON public.informes_terapeuticos(alumno_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_informes_profesional ON public.informes_terapeuticos(profesional_id);

DROP TRIGGER IF EXISTS tr_informes_terapeuticos_updated_at ON public.informes_terapeuticos;
CREATE TRIGGER tr_informes_terapeuticos_updated_at BEFORE UPDATE ON public.informes_terapeuticos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.documentos_alumno IS 'Documentos escaneados del alumno (carné, certificados). Visibilidad controlada por rol.';
COMMENT ON TABLE public.informes_terapeuticos IS 'Informes terapéuticos periódicos subidos por profesionales. Separados de evaluaciones pedagógicas.';
