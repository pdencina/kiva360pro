-- ============================================================
-- MIGRACIÓN 041 — Rol Postulante + vínculo usuario-prospecto
-- Permite que apoderados se registren públicamente, postulen,
-- y luego hagan seguimiento de su postulación desde el portal.
-- ============================================================

-- 1. Agregar rol 'postulante' al constraint de usuarios
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'pastor_campus', 'gestor_admision', 'tutor', 'apoderado', 'alumno', 'postulante'));

-- 2. Agregar campo user_id a prospectos para vincular postulación con usuario registrado
ALTER TABLE public.prospectos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_prospectos_user_id ON public.prospectos(user_id);

-- 3. Policy para que el postulante pueda leer su propia postulación
CREATE POLICY "postulante: select own prospectos" ON public.prospectos
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Permitir al postulante leer datos básicos de su colegio
-- (ya existe policy pública de SELECT en colegios de migración 040)

-- 5. Actualizar constraint de permisos_rol para incluir postulante
ALTER TABLE public.permisos_rol DROP CONSTRAINT IF EXISTS permisos_rol_rol_check;
ALTER TABLE public.permisos_rol ADD CONSTRAINT permisos_rol_rol_check
  CHECK (rol IN ('admin', 'pastor_campus', 'gestor_admision', 'tutor', 'apoderado', 'alumno', 'postulante'));
