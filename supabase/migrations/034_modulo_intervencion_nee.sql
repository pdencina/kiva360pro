-- ============================================================
-- MIGRACIÓN 034 — Módulo de Intervención Terapéutica (NEE)
-- Plan de Intervención Individual (PII), sesiones multidisciplinarias,
-- objetivos terapéuticos con tracking de avance, bitácora conductual.
-- Diseñado para centros de educación especial y programas NEE.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. PLANES DE INTERVENCIÓN INDIVIDUAL (PII)
-- Un plan por alumno, con período de vigencia y equipo asignado
-- =====================
CREATE TABLE IF NOT EXISTS public.planes_intervencion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  -- Datos del plan
  titulo          text NOT NULL DEFAULT 'Plan de Intervención Individual',
  diagnostico     text, -- CEA, TDAH, Síndrome de Down, TEL, etc.
  diagnostico_detalle text, -- descripción clínica ampliada
  nivel_apoyo     text NOT NULL DEFAULT 'intermedio'
                  CHECK (nivel_apoyo IN ('leve', 'intermedio', 'intensivo')),
  -- Vigencia
  fecha_inicio    date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       date, -- NULL = vigente indefinidamente
  estado          text NOT NULL DEFAULT 'activo'
                  CHECK (estado IN ('borrador', 'activo', 'pausado', 'cerrado')),
  -- Observaciones generales
  antecedentes    text, -- historia clínica relevante
  fortalezas      text, -- fortalezas del alumno
  barreras        text, -- barreras para el aprendizaje
  apoyos_requeridos text, -- tipos de apoyo necesarios
  -- Meta
  created_by      uuid REFERENCES public.usuarios(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planes_intervencion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all planes_intervencion" ON public.planes_intervencion
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.planes_intervencion TO authenticated;
GRANT ALL ON public.planes_intervencion TO service_role;

CREATE INDEX IF NOT EXISTS idx_planes_intervencion_colegio ON public.planes_intervencion(colegio_id);
CREATE INDEX IF NOT EXISTS idx_planes_intervencion_alumno ON public.planes_intervencion(alumno_id);
CREATE INDEX IF NOT EXISTS idx_planes_intervencion_estado ON public.planes_intervencion(colegio_id, estado);

DROP TRIGGER IF EXISTS tr_planes_intervencion_updated_at ON public.planes_intervencion;
CREATE TRIGGER tr_planes_intervencion_updated_at BEFORE UPDATE ON public.planes_intervencion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 2. EQUIPO TERAPÉUTICO DEL PLAN
-- Profesionales asignados a cada PII
-- =====================
CREATE TABLE IF NOT EXISTS public.equipo_intervencion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.planes_intervencion(id) ON DELETE CASCADE,
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  especialidad    text NOT NULL
                  CHECK (especialidad IN (
                    'educadora_diferencial', 'fonoaudiologa', 'terapeuta_ocupacional',
                    'psicologa', 'psicopedagoga', 'kinesióloga', 'trabajadora_social',
                    'neurologo', 'psiquiatra', 'tecnico_parvularia', 'otro'
                  )),
  rol_equipo      text NOT NULL DEFAULT 'terapeuta'
                  CHECK (rol_equipo IN ('coordinador', 'terapeuta', 'apoyo')),
  horas_semanales numeric(4,1), -- horas asignadas por semana
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, profesional_id)
);

ALTER TABLE public.equipo_intervencion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all equipo_intervencion" ON public.equipo_intervencion
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  );

GRANT ALL ON public.equipo_intervencion TO authenticated;
GRANT ALL ON public.equipo_intervencion TO service_role;

CREATE INDEX IF NOT EXISTS idx_equipo_plan ON public.equipo_intervencion(plan_id);
CREATE INDEX IF NOT EXISTS idx_equipo_profesional ON public.equipo_intervencion(profesional_id);

-- =====================
-- 3. OBJETIVOS TERAPÉUTICOS
-- Cada objetivo tiene un área, indicadores de logro y progreso medible
-- =====================
CREATE TABLE IF NOT EXISTS public.objetivos_terapeuticos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.planes_intervencion(id) ON DELETE CASCADE,
  -- Clasificación
  area            text NOT NULL
                  CHECK (area IN (
                    'comunicacion', 'cognitivo', 'socioemocional', 'motor_grueso',
                    'motor_fino', 'autonomia', 'conducta', 'academico', 'sensorial', 'otro'
                  )),
  -- Contenido
  descripcion     text NOT NULL, -- "Lograr contacto visual sostenido por 5 segundos"
  indicadores     text, -- indicadores de logro observables
  estrategias     text, -- estrategias y metodologías a usar
  -- Prioridad y estado
  prioridad       integer NOT NULL DEFAULT 2 CHECK (prioridad BETWEEN 1 AND 3), -- 1=alta, 2=media, 3=baja
  estado          text NOT NULL DEFAULT 'en_progreso'
                  CHECK (estado IN ('pendiente', 'en_progreso', 'logrado', 'parcial', 'reformulado')),
  -- Progreso (0-100)
  progreso        integer NOT NULL DEFAULT 0 CHECK (progreso BETWEEN 0 AND 100),
  -- Fechas
  fecha_inicio    date DEFAULT CURRENT_DATE,
  fecha_logro     date, -- cuando se marcó como logrado
  -- Responsable principal
  responsable_id  uuid REFERENCES public.usuarios(id),
  --
  orden           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.objetivos_terapeuticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all objetivos_terapeuticos" ON public.objetivos_terapeuticos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  );

GRANT ALL ON public.objetivos_terapeuticos TO authenticated;
GRANT ALL ON public.objetivos_terapeuticos TO service_role;

CREATE INDEX IF NOT EXISTS idx_objetivos_plan ON public.objetivos_terapeuticos(plan_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_area ON public.objetivos_terapeuticos(plan_id, area);

DROP TRIGGER IF EXISTS tr_objetivos_terapeuticos_updated_at ON public.objetivos_terapeuticos;
CREATE TRIGGER tr_objetivos_terapeuticos_updated_at BEFORE UPDATE ON public.objetivos_terapeuticos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 4. SESIONES TERAPÉUTICAS
-- Registro de cada sesión individual o grupal
-- =====================
CREATE TABLE IF NOT EXISTS public.sesiones_terapeuticas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.planes_intervencion(id) ON DELETE CASCADE,
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id),
  -- Datos de la sesión
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio     time,
  hora_fin        time,
  duracion_min    integer, -- calculado o manual
  tipo_sesion     text NOT NULL DEFAULT 'individual'
                  CHECK (tipo_sesion IN ('individual', 'grupal', 'familiar', 'evaluacion', 'coordinacion')),
  modalidad       text NOT NULL DEFAULT 'presencial'
                  CHECK (modalidad IN ('presencial', 'remota', 'domicilio')),
  -- Contenido
  objetivos_trabajados uuid[] DEFAULT '{}', -- IDs de objetivos abordados
  actividades     text, -- descripción de actividades realizadas
  observaciones   text, -- observaciones clínicas
  logros          text, -- logros observados en la sesión
  dificultades    text, -- dificultades presentadas
  -- Estado emocional/conductual al inicio
  estado_ingreso  text CHECK (estado_ingreso IN ('regulado', 'levemente_desregulado', 'desregulado', 'crisis')),
  estado_egreso   text CHECK (estado_egreso IN ('regulado', 'levemente_desregulado', 'desregulado', 'crisis')),
  -- Indicaciones
  indicaciones_familia text, -- para comunicar a la familia
  proximos_pasos  text, -- para la siguiente sesión
  -- Asistencia
  asistio         boolean NOT NULL DEFAULT true,
  motivo_inasistencia text,
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sesiones_terapeuticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all sesiones_terapeuticas" ON public.sesiones_terapeuticas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  );

GRANT ALL ON public.sesiones_terapeuticas TO authenticated;
GRANT ALL ON public.sesiones_terapeuticas TO service_role;

CREATE INDEX IF NOT EXISTS idx_sesiones_plan ON public.sesiones_terapeuticas(plan_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_profesional ON public.sesiones_terapeuticas(profesional_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON public.sesiones_terapeuticas(plan_id, fecha DESC);

DROP TRIGGER IF EXISTS tr_sesiones_terapeuticas_updated_at ON public.sesiones_terapeuticas;
CREATE TRIGGER tr_sesiones_terapeuticas_updated_at BEFORE UPDATE ON public.sesiones_terapeuticas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- 5. EVOLUCIONES / INFORMES DE AVANCE
-- Resúmenes periódicos del progreso general del alumno
-- =====================
CREATE TABLE IF NOT EXISTS public.evoluciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.planes_intervencion(id) ON DELETE CASCADE,
  profesional_id  uuid NOT NULL REFERENCES public.usuarios(id),
  -- Período
  periodo         text NOT NULL, -- "Marzo 2026", "Semestre 1 2026", "Semana 12"
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  -- Contenido
  resumen         text NOT NULL, -- resumen general del período
  avances         text, -- avances significativos
  areas_pendientes text, -- áreas que requieren más trabajo
  recomendaciones text, -- recomendaciones para el equipo y familia
  -- Valoración global del período (1-5)
  valoracion      integer CHECK (valoracion BETWEEN 1 AND 5),
  -- Visible para familia
  visible_familia boolean NOT NULL DEFAULT false,
  --
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evoluciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all evoluciones" ON public.evoluciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  );

GRANT ALL ON public.evoluciones TO authenticated;
GRANT ALL ON public.evoluciones TO service_role;

CREATE INDEX IF NOT EXISTS idx_evoluciones_plan ON public.evoluciones(plan_id, fecha DESC);

-- =====================
-- 6. BITÁCORA CONDUCTUAL
-- Registro rápido de conductas relevantes durante el día
-- =====================
CREATE TABLE IF NOT EXISTS public.bitacora_conductual (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.planes_intervencion(id) ON DELETE CASCADE,
  registrado_por  uuid NOT NULL REFERENCES public.usuarios(id),
  -- Evento
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  hora            time DEFAULT CURRENT_TIME,
  tipo            text NOT NULL
                  CHECK (tipo IN ('logro', 'conducta_desafiante', 'desregulacion', 'interaccion_social', 'autonomia', 'comunicacion', 'otro')),
  -- Contenido
  descripcion     text NOT NULL,
  antecedente     text, -- qué pasó antes (ABC conductual)
  consecuencia    text, -- qué se hizo después
  intensidad      integer CHECK (intensidad BETWEEN 1 AND 5), -- 1=leve, 5=severo
  duracion_min    integer, -- duración del episodio
  -- Estrategia aplicada
  estrategia      text,
  resultado       text CHECK (resultado IN ('efectiva', 'parcial', 'inefectiva')),
  -- Visible para familia
  visible_familia boolean NOT NULL DEFAULT false,
  --
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bitacora_conductual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colegio: all bitacora_conductual" ON public.bitacora_conductual
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planes_intervencion p WHERE p.id = plan_id AND p.colegio_id = public.mi_colegio_id())
  );

GRANT ALL ON public.bitacora_conductual TO authenticated;
GRANT ALL ON public.bitacora_conductual TO service_role;

CREATE INDEX IF NOT EXISTS idx_bitacora_plan_fecha ON public.bitacora_conductual(plan_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_tipo ON public.bitacora_conductual(plan_id, tipo);

-- =====================
-- 7. VISTA RESUMEN: Dashboard de intervención por colegio
-- =====================
CREATE OR REPLACE VIEW public.resumen_intervencion AS
SELECT
  p.colegio_id,
  p.id AS plan_id,
  p.alumno_id,
  a.nombre || ' ' || a.apellido AS alumno_nombre,
  a.curso,
  p.diagnostico,
  p.nivel_apoyo,
  p.estado,
  p.fecha_inicio,
  -- Conteos
  (SELECT count(*) FROM public.objetivos_terapeuticos o WHERE o.plan_id = p.id) AS total_objetivos,
  (SELECT count(*) FROM public.objetivos_terapeuticos o WHERE o.plan_id = p.id AND o.estado = 'logrado') AS objetivos_logrados,
  (SELECT avg(o.progreso) FROM public.objetivos_terapeuticos o WHERE o.plan_id = p.id)::integer AS progreso_promedio,
  (SELECT count(*) FROM public.sesiones_terapeuticas s WHERE s.plan_id = p.id AND s.asistio = true) AS total_sesiones,
  (SELECT max(s.fecha) FROM public.sesiones_terapeuticas s WHERE s.plan_id = p.id) AS ultima_sesion,
  -- Equipo
  (SELECT count(*) FROM public.equipo_intervencion e WHERE e.plan_id = p.id AND e.activo = true) AS profesionales_activos
FROM public.planes_intervencion p
JOIN public.alumnos a ON a.id = p.alumno_id;

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE public.planes_intervencion IS 'Plan de Intervención Individual (PII) para alumnos con NEE. Contiene diagnóstico, nivel de apoyo y período de vigencia.';
COMMENT ON TABLE public.equipo_intervencion IS 'Equipo multidisciplinario asignado a cada PII. Un profesional puede estar en varios planes.';
COMMENT ON TABLE public.objetivos_terapeuticos IS 'Objetivos específicos y medibles dentro de un PII, categorizados por área de desarrollo.';
COMMENT ON TABLE public.sesiones_terapeuticas IS 'Registro de sesiones terapéuticas individuales o grupales con observaciones clínicas.';
COMMENT ON TABLE public.evoluciones IS 'Informes de avance periódicos que resumen el progreso del alumno en su PII.';
COMMENT ON TABLE public.bitacora_conductual IS 'Registro rápido de conductas relevantes usando el modelo ABC conductual.';
