-- ============================================================
-- MIGRACIÓN 038 — Horario Individual por Alumno
-- Cada alumno tiene su grilla semanal con bloques pedagógicos
-- y terapéuticos. Imprimible y visible desde el portal.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. BLOQUES DE HORARIO POR ALUMNO
-- Cada fila = un bloque horario en la semana del alumno
-- =====================
CREATE TABLE IF NOT EXISTS public.horario_alumno (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  -- Día y horario
  dia_semana      integer NOT NULL CHECK (dia_semana BETWEEN 1 AND 5), -- 1=lunes...5=viernes
  hora_inicio     time NOT NULL,
  hora_fin        time NOT NULL,
  -- Contenido
  tipo            text NOT NULL CHECK (tipo IN ('pedagogico', 'terapeutico')),
  asignatura      text NOT NULL, -- "Matemática", "Lenguaje", "Fonoaudiología", "Terapia Ocupacional"
  profesional_id  uuid REFERENCES public.usuarios(id), -- quién dicta/atiende
  sala            text, -- "Sala 1", "Box Fono", etc.
  -- Visual
  color           text, -- hex color override (si no, se asigna por tipo)
  -- Estado
  activo          boolean NOT NULL DEFAULT true,
  -- Vigencia (para cambios de semestre)
  vigente_desde   date DEFAULT CURRENT_DATE,
  vigente_hasta   date, -- NULL = vigente indefinidamente
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.horario_alumno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all horario_alumno" ON public.horario_alumno
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.horario_alumno TO authenticated;
GRANT ALL ON public.horario_alumno TO service_role;

CREATE INDEX IF NOT EXISTS idx_horario_alumno_alumno ON public.horario_alumno(alumno_id, activo);
CREATE INDEX IF NOT EXISTS idx_horario_alumno_profesional ON public.horario_alumno(profesional_id);
CREATE INDEX IF NOT EXISTS idx_horario_alumno_colegio ON public.horario_alumno(colegio_id, activo);

DROP TRIGGER IF EXISTS tr_horario_alumno_updated_at ON public.horario_alumno;
CREATE TRIGGER tr_horario_alumno_updated_at BEFORE UPDATE ON public.horario_alumno
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.horario_alumno IS 'Horario semanal individual de cada alumno. Combina bloques pedagógicos y terapéuticos en una sola grilla.';
