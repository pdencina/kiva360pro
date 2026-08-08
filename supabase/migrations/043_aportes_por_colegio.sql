-- ============================================================
-- MIGRACIÓN 043 — Tabla de aportes por colegio
-- Permite que cada centro/colegio configure sus propios precios
-- por nivel, modalidad, jornada y año.
-- ============================================================

-- Agregar colegio_id a tabla_aportes (nullable para mantener los globales existentes)
ALTER TABLE public.tabla_aportes ADD COLUMN IF NOT EXISTS colegio_id uuid REFERENCES public.colegios(id) ON DELETE CASCADE;

-- Índice para buscar por colegio
CREATE INDEX IF NOT EXISTS idx_tabla_aportes_colegio ON public.tabla_aportes(colegio_id, anio, tipo);

-- RLS: cada colegio ve solo los suyos (o los globales sin colegio_id)
ALTER TABLE public.tabla_aportes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colegio: select tabla_aportes" ON public.tabla_aportes;
CREATE POLICY "colegio: select tabla_aportes" ON public.tabla_aportes
  FOR SELECT USING (colegio_id = public.mi_colegio_id() OR colegio_id IS NULL);

DROP POLICY IF EXISTS "colegio: insert tabla_aportes" ON public.tabla_aportes;
CREATE POLICY "colegio: insert tabla_aportes" ON public.tabla_aportes
  FOR INSERT WITH CHECK (colegio_id = public.mi_colegio_id());

DROP POLICY IF EXISTS "colegio: update tabla_aportes" ON public.tabla_aportes;
CREATE POLICY "colegio: update tabla_aportes" ON public.tabla_aportes
  FOR UPDATE USING (colegio_id = public.mi_colegio_id());

DROP POLICY IF EXISTS "colegio: delete tabla_aportes" ON public.tabla_aportes;
CREATE POLICY "colegio: delete tabla_aportes" ON public.tabla_aportes
  FOR DELETE USING (colegio_id = public.mi_colegio_id());

-- Super admin ve todo
DROP POLICY IF EXISTS "super_admin: all tabla_aportes" ON public.tabla_aportes;
CREATE POLICY "super_admin: all tabla_aportes" ON public.tabla_aportes
  FOR ALL USING (true);
