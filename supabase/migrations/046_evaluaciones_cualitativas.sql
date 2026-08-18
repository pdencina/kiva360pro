-- MIGRACIÓN 046 — Evaluaciones Cualitativas
CREATE TABLE IF NOT EXISTS public.descriptores_evaluacion (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE, nombre text NOT NULL, abreviatura text, color text, orden integer NOT NULL DEFAULT 0, descripcion text, activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.descriptores_evaluacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all descriptores_evaluacion" ON public.descriptores_evaluacion FOR ALL USING (colegio_id = public.mi_colegio_id()) WITH CHECK (colegio_id = public.mi_colegio_id());
GRANT ALL ON public.descriptores_evaluacion TO authenticated;
GRANT ALL ON public.descriptores_evaluacion TO service_role;

CREATE TABLE IF NOT EXISTS public.areas_evaluacion (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE, nombre text NOT NULL, descripcion text, orden integer NOT NULL DEFAULT 0, activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.areas_evaluacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all areas_evaluacion" ON public.areas_evaluacion FOR ALL USING (colegio_id = public.mi_colegio_id()) WITH CHECK (colegio_id = public.mi_colegio_id());
GRANT ALL ON public.areas_evaluacion TO authenticated;
GRANT ALL ON public.areas_evaluacion TO service_role;

CREATE TABLE IF NOT EXISTS public.objetivos_evaluacion (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), area_id uuid NOT NULL REFERENCES public.areas_evaluacion(id) ON DELETE CASCADE, colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE, nombre text NOT NULL, descripcion text, orden integer NOT NULL DEFAULT 0, activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.objetivos_evaluacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all objetivos_evaluacion" ON public.objetivos_evaluacion FOR ALL USING (colegio_id = public.mi_colegio_id()) WITH CHECK (colegio_id = public.mi_colegio_id());
GRANT ALL ON public.objetivos_evaluacion TO authenticated;
GRANT ALL ON public.objetivos_evaluacion TO service_role;

CREATE TABLE IF NOT EXISTS public.evaluaciones_cualitativas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE, alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE, objetivo_id uuid NOT NULL REFERENCES public.objetivos_evaluacion(id) ON DELETE CASCADE, descriptor_id uuid NOT NULL REFERENCES public.descriptores_evaluacion(id), periodo text NOT NULL, fecha date NOT NULL DEFAULT CURRENT_DATE, observacion text, evaluado_por uuid NOT NULL REFERENCES public.usuarios(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(alumno_id, objetivo_id, periodo));
ALTER TABLE public.evaluaciones_cualitativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all evaluaciones_cualitativas" ON public.evaluaciones_cualitativas FOR ALL USING (colegio_id = public.mi_colegio_id()) WITH CHECK (colegio_id = public.mi_colegio_id());
GRANT ALL ON public.evaluaciones_cualitativas TO authenticated;
GRANT ALL ON public.evaluaciones_cualitativas TO service_role;

ALTER TABLE public.colegios ADD COLUMN IF NOT EXISTS tipo_evaluacion text DEFAULT 'cualitativa' CHECK (tipo_evaluacion IN ('numerica', 'cualitativa', 'mixta'));
