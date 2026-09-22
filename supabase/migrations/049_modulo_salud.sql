-- ============================================================
-- MIGRACIÓN 049 — Módulo "Kiva360 Salud" (add-on vendible aparte)
-- Empaquetamiento comercial de módulos por colegio, extensión de
-- ficha clínica, soporte de documentos exentos de IVA, y la base de
-- datos para reserva online pública de sesiones.
--
-- FUERA DE ALCANCE DE ESTA MIGRACIÓN (a propósito): receta médica
-- electrónica y licencia médica electrónica. Ambas requieren
-- integración con sistemas del Estado (SNRE/MINSAL vía HL7 FHIR, y
-- SUSESO exigiendo un convenio como "Operador" del sistema LME) que
-- no se pueden construir por cuenta propia sin ese proceso de
-- certificación. Se dejan explícitamente para una fase posterior.
-- ============================================================

-- =====================================================================
-- 1. MÓDULOS CONTRATADOS POR COLEGIO
-- Permite vender "Finanzas y Facturación" y "Kiva360 Salud" como
-- add-ons independientes del plan base, sin crear un esquema de
-- billing paralelo. Reutiliza el mismo patrón simple que `colegios.plan`.
-- =====================================================================
ALTER TABLE public.colegios
  ADD COLUMN IF NOT EXISTS modulos_activos text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.colegios.modulos_activos IS 'Add-ons contratados: ''finanzas'', ''salud''. Gating comercial, independiente de permisos_rol (que gatea por rol, no por contrato).';

-- =====================================================================
-- 2. FICHA CLÍNICA — ampliar tipos de documento existentes
-- documentos_alumno ya soporta informe_medico / certificado_discapacidad /
-- evaluacion_diagnostica. Se agregan los tipos que pidió explícitamente
-- el prospecto (consentimiento informado, pautas clínicas).
-- =====================================================================
ALTER TABLE public.documentos_alumno DROP CONSTRAINT IF EXISTS documentos_alumno_tipo_check;
ALTER TABLE public.documentos_alumno ADD CONSTRAINT documentos_alumno_tipo_check
  CHECK (tipo IN (
    'carne_identidad', 'certificado_nacimiento', 'certificado_domicilio',
    'informe_medico', 'certificado_discapacidad', 'evaluacion_diagnostica',
    'consentimiento_informado', 'pauta_clinica', 'otro'
  ));

-- =====================================================================
-- 3. DOCUMENTOS TRIBUTARIOS EXENTOS
-- Algunas prestaciones de salud están exentas de IVA (ej: prestadores
-- individuales de salud habilitados); otras no. No se asume un
-- tratamiento único — queda marcado explícitamente por documento y
-- debe configurarse con el contador de cada centro.
-- =====================================================================
ALTER TABLE public.documentos_tributarios
  ADD COLUMN IF NOT EXISTS afecto_iva boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.documentos_tributarios.afecto_iva IS 'false = documento exento de IVA (ej: boleta/factura de prestador de salud habilitado). Requiere validación contable por centro, no se asume automáticamente.';

-- =====================================================================
-- 4. RESERVA ONLINE — solicitudes públicas
-- No escribe directo en agenda_sesiones: un visitante anónimo no debe
-- poder crear una sesión confirmada sin revisión. Un administrativo
-- confirma y ahí sí se crea la fila real en agenda_sesiones (y el
-- alumno/familia si aún no existen como registro).
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.reservas_publicas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id        uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  -- Datos de contacto (puede o no ser un alumno/familia ya registrado)
  nombre_solicitante text NOT NULL,
  email             text NOT NULL,
  telefono          text,
  alumno_id         uuid REFERENCES public.alumnos(id) ON DELETE SET NULL, -- si ya es paciente
  -- Solicitud
  profesional_id    uuid NOT NULL REFERENCES public.usuarios(id),
  tipo_sesion       text NOT NULL DEFAULT 'individual'
                    CHECK (tipo_sesion IN ('individual', 'evaluacion')),
  fecha_solicitada  date NOT NULL,
  hora_solicitada   time NOT NULL,
  motivo            text,
  -- Estado
  estado            text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'confirmada', 'rechazada', 'expirada')),
  agenda_sesion_id  uuid REFERENCES public.agenda_sesiones(id) ON DELETE SET NULL, -- se completa al confirmar
  motivo_rechazo    text,
  gestionado_por    uuid REFERENCES public.usuarios(id),
  gestionado_at     timestamptz,
  --
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reservas_publicas ENABLE ROW LEVEL SECURITY;

-- El formulario público inserta sin sesión autenticada (vía service_role
-- desde el API route, nunca directo desde el cliente con anon key).
CREATE POLICY "colegio: all reservas_publicas" ON public.reservas_publicas
  FOR ALL
  USING (colegio_id = public.mi_colegio_id())
  WITH CHECK (colegio_id = public.mi_colegio_id());

GRANT ALL ON public.reservas_publicas TO authenticated;
GRANT ALL ON public.reservas_publicas TO service_role;

CREATE INDEX IF NOT EXISTS idx_reservas_publicas_colegio ON public.reservas_publicas(colegio_id, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_publicas_profesional_fecha ON public.reservas_publicas(profesional_id, fecha_solicitada);

COMMENT ON TABLE public.reservas_publicas IS 'Solicitudes de hora desde el formulario público de reserva online. Quedan pendientes hasta que un administrativo las confirma (creando la fila real en agenda_sesiones) o las rechaza.';
