-- ============================================================
-- MIGRACIÓN 048 — Permiso del módulo "finanzas"
-- El nuevo ítem de menú Finanzas (/finanzas) se mapeó al módulo
-- 'finanzas' en permisos_rol, pero nunca se insertó la fila que lo
-- habilita — por eso quedaba oculto en el sidebar pese a ser
-- accesible navegando directo a la URL.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'admin', 'finanzas', true),
  (NULL, 'pastor_campus', 'finanzas', true),
  (NULL, 'tutor', 'finanzas', false),
  (NULL, 'gestor_admision', 'finanzas', false)
ON CONFLICT DO NOTHING;

-- Nota: super_admin nunca se filtra por permisos_rol (ve todo siempre).
