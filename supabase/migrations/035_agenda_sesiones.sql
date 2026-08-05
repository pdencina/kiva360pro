-- ============================================================
-- MIGRACIÓN 035 — Agenda de Sesiones Terapéuticas
-- Programación de citas futuras, disponibilidad de profesionales,
-- confirmación/cancelación, y vista para familias.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. AGENDA DE SESIONES (citas programadas)
-- =====================
CREATE TABLE IF NOT EXISTS public.agenda_sesiones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Participantes
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id),
  plan_id         uuid REFERENCES public.planes_intervencion(id) ON DELETE SET NULL,
  -- Programación
  fecha           date NOT NULL,
  hora_inicio     time NOT NULL,
  hora_fin        time NOT NULL,
  -- Tipo
  tipo_sesion     text NOT NULL DEFAULT 'individual'
                  CHECK (tipo_sesion IN ('individual', 'grupal', 'familiar', 'evaluacion', 'coordinacion')),
  modalidad       text NOT NULL DEFAULT 'presencial'
                  CHECK (modalidad IN ('presencial', 'remota', 'domicilio')),
  -- Estado
  estado          text NOT NULL DEFAULT 'programada'
                  CHECK (estado IN ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')),
  -- Recurrencia (opcional)
  recurrencia     text CHECK (recurrencia IN ('semanal', 'quincenal', NULL)),
  recurrencia_fin date, -- hasta cuándo repetir
  grupo_recurrencia uuid, -- agrupar sesiones de la misma serie
  -- Notas
  observaciones   text,
  motivo_cancelacion text,
  -- Notificación
  notificado      boolean NOT NULL DEFAULT false,
  -- Meta
  creado_por      uuid REFERENCES public.usuarios(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all agenda_sesiones" ON public.agenda_sesiones
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.agenda_sesiones TO authenticated;
GRANT ALL ON public.agenda_sesiones TO service_role;

CREATE INDEX IF NOT EXISTS idx_agenda_colegio_fecha ON public.agenda_sesiones(colegio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_agenda_profesional_fecha ON public.agenda_sesiones(profesional_id, fecha);
CREATE INDEX IF NOT EXISTS idx_agenda_alumno_fecha ON public.agenda_sesiones(alumno_id, fecha);
CREATE INDEX IF NOT EXISTS idx_agenda_estado ON public.agenda_sesiones(colegio_id, estado, fecha);
CREATE INDEX IF NOT EXISTS idx_agenda_recurrencia ON public.agenda_sesiones(grupo_recurrencia);

DROP TRIGGER IF EXISTS tr_agenda_sesiones_updated_at ON public.agenda_sesiones;
CREATE TRIGGER tr_agenda_sesiones_updated_at BEFORE UPDATE ON public.agenda_sesiones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 2. DISPONIBILIDAD SEMANAL DE PROFESIONALES
-- Bloques horarios en que cada profesional atiende
-- =====================
CREATE TABLE IF NOT EXISTS public.disponibilidad_profesional (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  -- Día y horario
  dia_semana      integer NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=lunes, 6=domingo
  hora_inicio     time NOT NULL,
  hora_fin        time NOT NULL,
  -- Configuración
  duracion_sesion integer NOT NULL DEFAULT 45, -- minutos por sesión
  max_sesiones    integer, -- máximo de sesiones en ese bloque
  activo          boolean NOT NULL DEFAULT true,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profesional_id, dia_semana, hora_inicio)
);

ALTER TABLE public.disponibilidad_profesional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all disponibilidad" ON public.disponibilidad_profesional
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.disponibilidad_profesional TO authenticated;
GRANT ALL ON public.disponibilidad_profesional TO service_role;

CREATE INDEX IF NOT EXISTS idx_disponibilidad_profesional ON public.disponibilidad_profesional(profesional_id, dia_semana);

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.agenda_sesiones IS 'Sesiones terapéuticas programadas (futuras). Al completarse, se registran en sesiones_terapeuticas.';
COMMENT ON TABLE public.disponibilidad_profesional IS 'Horarios semanales de atención de cada profesional para el agendamiento.';
