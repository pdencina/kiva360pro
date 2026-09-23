-- ============================================================
-- MIGRACIÓN 052 — Roles FINANZAS y RECEPCIÓN
-- Sigue el mismo patrón usado para agregar gestor_admision,
-- pastor_campus y postulante en migraciones anteriores.
--
-- FINANZAS: acceso completo al módulo financiero (Finanzas, Cobranza,
--   Cobros por sesión, Documentos tributarios), sin acceso a fichas
--   clínicas ni intervención NEE.
-- RECEPCIÓN: agenda, solicitudes de reserva y comunicados. Sin acceso
--   a datos clínicos ni facturación completa.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- 1. Ampliar el constraint de rol en usuarios
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'pastor_campus', 'gestor_admision', 'tutor', 'apoderado', 'alumno', 'postulante', 'finanzas', 'recepcion'));

-- 2. Ampliar el constraint de rol en permisos_rol
ALTER TABLE public.permisos_rol DROP CONSTRAINT IF EXISTS permisos_rol_rol_check;
ALTER TABLE public.permisos_rol ADD CONSTRAINT permisos_rol_rol_check
  CHECK (rol IN ('admin', 'pastor_campus', 'gestor_admision', 'tutor', 'apoderado', 'alumno', 'postulante', 'finanzas', 'recepcion'));

-- 3. Permisos por defecto — FINANZAS
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'finanzas', 'inicio', true),
  (NULL, 'finanzas', 'alumnos', true),
  (NULL, 'finanzas', 'matricula', true),
  (NULL, 'finanzas', 'cobranzas', true),
  (NULL, 'finanzas', 'finanzas', true),
  (NULL, 'finanzas', 'reportes', true),
  (NULL, 'finanzas', 'comunicados', true),
  (NULL, 'finanzas', 'mensajes', true),
  -- Sin acceso a lo clínico/pedagógico
  (NULL, 'finanzas', 'intervencion', false),
  (NULL, 'finanzas', 'evaluaciones', false),
  (NULL, 'finanzas', 'fichas', false),
  (NULL, 'finanzas', 'reporte_diario', false),
  (NULL, 'finanzas', 'agenda', false),
  (NULL, 'finanzas', 'documentos', false)
ON CONFLICT DO NOTHING;

-- 4. Permisos por defecto — RECEPCIÓN
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'recepcion', 'inicio', true),
  (NULL, 'recepcion', 'agenda', true),
  (NULL, 'recepcion', 'comunicados', true),
  (NULL, 'recepcion', 'mensajes', true),
  (NULL, 'recepcion', 'alumnos', true),
  -- Sin acceso a lo clínico ni a facturación completa
  (NULL, 'recepcion', 'intervencion', false),
  (NULL, 'recepcion', 'evaluaciones', false),
  (NULL, 'recepcion', 'fichas', false),
  (NULL, 'recepcion', 'reporte_diario', false),
  (NULL, 'recepcion', 'cobranzas', false),
  (NULL, 'recepcion', 'finanzas', false),
  (NULL, 'recepcion', 'documentos', false),
  (NULL, 'recepcion', 'matricula', false)
ON CONFLICT DO NOTHING;
