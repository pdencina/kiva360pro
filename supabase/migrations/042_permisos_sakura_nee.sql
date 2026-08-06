-- ============================================================
-- MIGRACIÓN 042 — Permisos para Sakura Kids (Centro NEE)
-- Oculta módulos de colegio formal que no aplican.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Eliminar permisos existentes del admin para re-insertar limpios
DELETE FROM public.permisos_rol WHERE colegio_id IS NULL AND rol = 'admin';

-- Admin de centro NEE: solo módulos relevantes
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  -- Activos
  (NULL, 'admin', 'inicio', true),
  (NULL, 'admin', 'matricula', true),
  (NULL, 'admin', 'alumnos', true),
  (NULL, 'admin', 'programas', true),
  (NULL, 'admin', 'horarios', true),
  (NULL, 'admin', 'asistencias', true),
  (NULL, 'admin', 'intervencion', true),
  (NULL, 'admin', 'agenda', true),
  (NULL, 'admin', 'reporte_diario', true),
  (NULL, 'admin', 'comunicados', true),
  (NULL, 'admin', 'mensajes', true),
  (NULL, 'admin', 'cobranzas', true),
  (NULL, 'admin', 'documentos', true),
  -- Desactivados (colegio formal — no aplica para centro NEE)
  (NULL, 'admin', 'planificacion', false),
  (NULL, 'admin', 'evaluaciones', false),
  (NULL, 'admin', 'libro_clases', false),
  (NULL, 'admin', 'tareas', false),
  (NULL, 'admin', 'fichas', false),
  (NULL, 'admin', 'calendario', false),
  (NULL, 'admin', 'reportes', false),
  (NULL, 'admin', 'becas', false)
ON CONFLICT DO NOTHING;

-- También limpiar tutor
DELETE FROM public.permisos_rol WHERE colegio_id IS NULL AND rol = 'tutor';

INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'tutor', 'inicio', true),
  (NULL, 'tutor', 'alumnos', true),
  (NULL, 'tutor', 'programas', true),
  (NULL, 'tutor', 'horarios', true),
  (NULL, 'tutor', 'asistencias', true),
  (NULL, 'tutor', 'intervencion', true),
  (NULL, 'tutor', 'agenda', true),
  (NULL, 'tutor', 'reporte_diario', true),
  (NULL, 'tutor', 'comunicados', true),
  (NULL, 'tutor', 'mensajes', true),
  -- Desactivados para tutor
  (NULL, 'tutor', 'planificacion', false),
  (NULL, 'tutor', 'evaluaciones', false),
  (NULL, 'tutor', 'libro_clases', false),
  (NULL, 'tutor', 'tareas', false),
  (NULL, 'tutor', 'fichas', false),
  (NULL, 'tutor', 'calendario', false),
  (NULL, 'tutor', 'reportes', false),
  (NULL, 'tutor', 'matricula', false),
  (NULL, 'tutor', 'cobranzas', false),
  (NULL, 'tutor', 'documentos', false)
ON CONFLICT DO NOTHING;
