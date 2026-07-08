-- ============================================================
-- MIGRACIÓN 014 — Módulo de Horarios
-- Permite configurar el horario semanal por curso
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.horarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id  uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  curso       text NOT NULL,
  dia         integer NOT NULL CHECK (dia BETWEEN 1 AND 5), -- 1=Lunes, 5=Viernes
  hora_inicio time NOT NULL,
  hora_fin    time NOT NULL,
  materia     text NOT NULL,
  profesor    text,
  sala        text,
  color       text DEFAULT '#3b82f6',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colegio: all horarios" ON public.horarios
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

CREATE INDEX IF NOT EXISTS idx_horarios_colegio_curso ON public.horarios(colegio_id, curso);

DROP TRIGGER IF EXISTS tr_horarios_updated_at ON public.horarios;
CREATE TRIGGER tr_horarios_updated_at BEFORE UPDATE ON public.horarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
