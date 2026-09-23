-- ============================================================
-- MIGRACIÓN 050 — Vincular usuarios reales creados a mano en Supabase Auth
-- Estos usuarios ya existen en auth.users (creados desde el Dashboard)
-- pero no tienen su fila espejo en public.usuarios, así que hoy no
-- pueden operar en la app aunque puedan iniciar sesión.
--
-- - carolina.rojas@sakurakids.cl -> admin de Sakura Kids
-- - javiera.reinoso@sakurakids.cl -> tutor (profesional) de Sakura Kids
-- - pablo@kiva360.cl / encinaacevedo.pablo@gmail.com -> super_admin
-- - demo@casanogal.cl -> NO se toca, ya existe su fila
--
-- Si Sakura Kids no existe como colegio, este script lo crea.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_sakura_id uuid;
BEGIN
  -- 1. Buscar o crear el colegio Sakura Kids
  SELECT id INTO v_sakura_id FROM public.colegios WHERE nombre ILIKE '%sakura%' LIMIT 1;

  IF v_sakura_id IS NULL THEN
    v_sakura_id := gen_random_uuid();
    INSERT INTO public.colegios (id, nombre, plan, tipo_evaluacion)
    VALUES (v_sakura_id, 'Sakura Kids', 'profesional', 'cualitativa');
    RAISE NOTICE 'Colegio Sakura Kids creado con id: %', v_sakura_id;
  ELSE
    RAISE NOTICE 'Colegio Sakura Kids ya existía con id: %', v_sakura_id;
  END IF;

  -- 2. Carolina Rojas -> admin de Sakura Kids
  INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
  VALUES ('b29c4775-4606-4668-8c4b-185825e4fbae', v_sakura_id, 'carolina.rojas@sakurakids.cl', 'Carolina', 'Rojas', 'admin')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Javiera Reinoso -> tutor (profesional) de Sakura Kids
  INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
  VALUES ('debcb92a-ae98-4b44-bedb-9daf8ae7ac6c', v_sakura_id, 'javiera.reinoso@sakurakids.cl', 'Javiera', 'Reinoso', 'tutor')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Pablo (dos correos) -> super_admin, sin colegio fijo
  INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
  VALUES ('74ef44dc-4550-4bcb-93f9-362f15cd5e63', NULL, 'encinaacevedo.pablo@gmail.com', 'Pablo', 'Encina', 'super_admin')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
  VALUES ('29e99dc9-31d3-4190-b798-7ae450c9e226', NULL, 'pablo@kiva360.cl', 'Pablo', 'Encina', 'super_admin')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- Verificación:
-- select id, email, nombre, apellido, rol, colegio_id from public.usuarios
-- where email in ('carolina.rojas@sakurakids.cl','javiera.reinoso@sakurakids.cl','encinaacevedo.pablo@gmail.com','pablo@kiva360.cl','demo@casanogal.cl');
