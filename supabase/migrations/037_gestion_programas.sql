-- ============================================================
-- MIGRACIÓN 037 — Gestión de Programas Educativos
-- Cada centro puede definir programas flexibles (educativo intensivo,
-- after school, sesiones individuales, etc.) y asignar alumnos.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. PROGRAMAS (definición de cada programa ofrecido)
-- =====================
CREATE TABLE IF NOT EXISTS public.programas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Datos del programa
  nombre          text NOT NULL, -- "Programa Educativo Intensivo", "After School", etc.
  descripcion     text,
  tipo            text NOT NULL DEFAULT 'educativo'
                  CHECK (tipo IN ('educativo', 'terapeutico', 'after_school', 'sesiones_individuales', 'evaluacion', 'mixto')),
  -- Configuración
  modalidad       text NOT NULL DEFAULT 'presencial'
                  CHECK (modalidad IN ('presencial', 'remota', 'hibrido')),
  jornada         text DEFAULT 'completa'
                  CHECK (jornada IN ('completa', 'media', 'por_horas', 'flexible')),
  -- Horario referencial
  dias_semana     integer[] DEFAULT '{1,2,3,4,5}', -- 1=lunes...5=viernes
  hora_inicio     time,
  hora_fin        time,
  -- Cupos
  cupo_maximo     integer, -- NULL = ilimitado
  -- Costos asociados
  costo_mensual   integer, -- aporte mensual del programa (si aplica)
  costo_matricula integer, -- costo de inscripción al programa
  -- Equipo mínimo requerido (informativo)
  equipo_requerido text, -- "Ed. Diferencial, Fonoaudióloga, T.O."
  -- Estado
  activo          boolean NOT NULL DEFAULT true,
  -- Periodo
  anio_vigencia   integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all programas" ON public.programas
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.programas TO authenticated;
GRANT ALL ON public.programas TO service_role;

CREATE INDEX IF NOT EXISTS idx_programas_colegio ON public.programas(colegio_id, activo);

DROP TRIGGER IF EXISTS tr_programas_updated_at ON public.programas;
CREATE TRIGGER tr_programas_updated_at BEFORE UPDATE ON public.programas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 2. INSCRIPCIONES DE ALUMNOS EN PROGRAMAS
-- Un alumno puede estar en uno o más programas
-- =====================
CREATE TABLE IF NOT EXISTS public.inscripciones_programa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  programa_id     uuid NOT NULL REFERENCES public.programas(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  -- Período
  fecha_ingreso   date NOT NULL DEFAULT CURRENT_DATE,
  fecha_egreso    date, -- NULL = aún activo
  -- Estado
  estado          text NOT NULL DEFAULT 'activo'
                  CHECK (estado IN ('activo', 'suspendido', 'egresado', 'lista_espera')),
  motivo_egreso   text,
  -- Horario personalizado (si difiere del programa)
  horario_personalizado jsonb, -- {lunes: {inicio: "09:00", fin: "13:00"}, ...}
  -- Observaciones
  observaciones   text,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programa_id, alumno_id)
);

ALTER TABLE public.inscripciones_programa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all inscripciones_programa" ON public.inscripciones_programa
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.inscripciones_programa TO authenticated;
GRANT ALL ON public.inscripciones_programa TO service_role;

CREATE INDEX IF NOT EXISTS idx_inscripciones_programa ON public.inscripciones_programa(programa_id, estado);
CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno ON public.inscripciones_programa(alumno_id, estado);

DROP TRIGGER IF EXISTS tr_inscripciones_programa_updated_at ON public.inscripciones_programa;
CREATE TRIGGER tr_inscripciones_programa_updated_at BEFORE UPDATE ON public.inscripciones_programa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.programas IS 'Programas educativos/terapéuticos ofrecidos por cada centro. Ej: Intensivo, After School, Sesiones individuales.';
COMMENT ON TABLE public.inscripciones_programa IS 'Inscripción de un alumno en un programa. Permite múltiples programas simultáneos.';
