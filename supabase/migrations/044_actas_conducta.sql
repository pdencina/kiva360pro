-- ============================================================
-- MIGRACIÓN 044 — Actas de Conducta (Bitácora Digital)
-- Reemplaza las actas en papel. El profesional genera el acta,
-- se envía por email al apoderado, y el apoderado firma en línea.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.actas_conducta (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id      uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  -- Contenido del acta
  tipo            text NOT NULL DEFAULT 'conducta'
                  CHECK (tipo IN ('conducta', 'logro', 'compromiso', 'citacion', 'otro')),
  titulo          text NOT NULL, -- "Acta de conducta - Agresión física"
  descripcion     text NOT NULL, -- Descripción detallada del evento
  fecha_evento    date NOT NULL DEFAULT CURRENT_DATE,
  antecedente     text, -- Qué pasó antes
  medidas         text, -- Medidas tomadas / acuerdos
  compromisos     text, -- Compromisos del apoderado/alumno
  observaciones   text, -- Observaciones adicionales
  -- Quién la crea
  creado_por      uuid NOT NULL REFERENCES public.usuarios(id),
  -- Estado del acta
  estado          text NOT NULL DEFAULT 'borrador'
                  CHECK (estado IN ('borrador', 'enviada', 'vista', 'firmada')),
  -- Envío y firma
  enviada_at      timestamptz,
  email_enviado_a text, -- Email al que se envió
  -- Firma del apoderado
  firma_codigo    text, -- Código de verificación (6 dígitos)
  firma_codigo_expira timestamptz,
  firmada_por     text, -- Nombre del firmante
  firmada_at      timestamptz,
  firma_ip        text,
  firma_observacion text, -- Observación del apoderado al firmar (opcional)
  --
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.actas_conducta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colegio: all actas_conducta" ON public.actas_conducta
  FOR ALL USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.actas_conducta TO authenticated;
GRANT ALL ON public.actas_conducta TO service_role;

CREATE INDEX IF NOT EXISTS idx_actas_conducta_alumno ON public.actas_conducta(alumno_id, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_actas_conducta_colegio ON public.actas_conducta(colegio_id, estado);

DROP TRIGGER IF EXISTS tr_actas_conducta_updated_at ON public.actas_conducta;
CREATE TRIGGER tr_actas_conducta_updated_at BEFORE UPDATE ON public.actas_conducta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.actas_conducta IS 'Actas de conducta digitales. Se envían por email al apoderado para firma en línea.';
