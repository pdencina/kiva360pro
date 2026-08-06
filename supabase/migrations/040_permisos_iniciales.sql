-- ============================================================
-- MIGRACIÓN 040 — Permisos Iniciales por Rol
-- Seed de permisos granulares para que el sistema funcione
-- con acceso controlado desde el primer día.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- =====================
-- ADMIN: Acceso completo al colegio
-- =====================
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'admin', 'inicio', true),
  (NULL, 'admin', 'matricula', true),
  (NULL, 'admin', 'alumnos', true),
  (NULL, 'admin', 'programas', true),
  (NULL, 'admin', 'horarios', true),
  (NULL, 'admin', 'planificacion', true),
  (NULL, 'admin', 'asistencias', true),
  (NULL, 'admin', 'evaluaciones', true),
  (NULL, 'admin', 'comunicados', true),
  (NULL, 'admin', 'mensajes', true),
  (NULL, 'admin', 'libro_clases', true),
  (NULL, 'admin', 'intervencion', true),
  (NULL, 'admin', 'agenda', true),
  (NULL, 'admin', 'reporte_diario', true),
  (NULL, 'admin', 'tareas', true),
  (NULL, 'admin', 'cobranzas', true),
  (NULL, 'admin', 'documentos', true),
  (NULL, 'admin', 'calendario', true),
  (NULL, 'admin', 'fichas', true),
  (NULL, 'admin', 'reportes', true)
ON CONFLICT DO NOTHING;

-- =====================
-- PASTOR_CAMPUS: Similar a admin
-- =====================
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'pastor_campus', 'inicio', true),
  (NULL, 'pastor_campus', 'matricula', true),
  (NULL, 'pastor_campus', 'alumnos', true),
  (NULL, 'pastor_campus', 'programas', true),
  (NULL, 'pastor_campus', 'horarios', true),
  (NULL, 'pastor_campus', 'planificacion', true),
  (NULL, 'pastor_campus', 'asistencias', true),
  (NULL, 'pastor_campus', 'evaluaciones', true),
  (NULL, 'pastor_campus', 'comunicados', true),
  (NULL, 'pastor_campus', 'mensajes', true),
  (NULL, 'pastor_campus', 'libro_clases', true),
  (NULL, 'pastor_campus', 'intervencion', true),
  (NULL, 'pastor_campus', 'agenda', true),
  (NULL, 'pastor_campus', 'reporte_diario', true),
  (NULL, 'pastor_campus', 'tareas', true),
  (NULL, 'pastor_campus', 'cobranzas', true),
  (NULL, 'pastor_campus', 'documentos', true),
  (NULL, 'pastor_campus', 'calendario', true),
  (NULL, 'pastor_campus', 'fichas', true),
  (NULL, 'pastor_campus', 'reportes', true)
ON CONFLICT DO NOTHING;

-- =====================
-- TUTOR/PROFESIONAL: Acceso limitado (no ve cobros, no ve documentos confidenciales)
-- =====================
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'tutor', 'inicio', true),
  (NULL, 'tutor', 'alumnos', true),
  (NULL, 'tutor', 'programas', true),
  (NULL, 'tutor', 'horarios', true),
  (NULL, 'tutor', 'planificacion', true),
  (NULL, 'tutor', 'asistencias', true),
  (NULL, 'tutor', 'evaluaciones', true),
  (NULL, 'tutor', 'comunicados', true),
  (NULL, 'tutor', 'mensajes', true),
  (NULL, 'tutor', 'libro_clases', true),
  (NULL, 'tutor', 'intervencion', true),
  (NULL, 'tutor', 'agenda', true),
  (NULL, 'tutor', 'reporte_diario', true),
  (NULL, 'tutor', 'tareas', true),
  (NULL, 'tutor', 'fichas', true),
  -- Tutor NO ve: matricula, cobranzas, reportes financieros, documentos confidenciales
  (NULL, 'tutor', 'matricula', false),
  (NULL, 'tutor', 'cobranzas', false),
  (NULL, 'tutor', 'reportes', false),
  (NULL, 'tutor', 'documentos', false),
  (NULL, 'tutor', 'calendario', true)
ON CONFLICT DO NOTHING;

-- =====================
-- Nota: super_admin nunca se filtra (retorna null = ve todo)
-- apoderado y alumno usan el portal con sus propias rutas
-- =====================
