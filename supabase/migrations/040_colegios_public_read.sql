-- ============================================================
-- MIGRACIÓN 040 — Permitir lectura pública de colegios
-- Necesario para el formulario de postulación pública (/postular)
-- que necesita obtener nombre, logo y colores del colegio sin autenticación.
-- ============================================================

-- Policy de SELECT público (campos filtrados en la query, no aquí)
CREATE POLICY "public: select colegios" ON public.colegios
  FOR SELECT
  USING (true);

-- También permitir al service_role y authenticated
GRANT SELECT ON public.colegios TO anon;
GRANT ALL ON public.colegios TO authenticated;
GRANT ALL ON public.colegios TO service_role;
