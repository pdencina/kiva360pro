-- ============================================================
-- SEED DE DEMO — Casa Nogal (casanogal.cl)
-- ============================================================
-- Ejecutar COMPLETO en el SQL Editor de Supabase (corre como
-- postgres/service_role, así que bypassa RLS).
--
-- Qué crea:
--   - 1 colegio "Casa Nogal" (centro educativo NEE)
--   - 1 usuario admin/terapeuta de login para la demo
--   - 8 alumnos con sus familias (apoderados de contacto)
--   - Asistencias de la semana
--   - Reportes diarios (jardín / preescolar)
--   - Evaluación cualitativa (áreas, objetivos, descriptores, notas)
--   - Planes de intervención NEE con objetivos, equipo, sesiones y bitácora
--   - Agenda de sesiones terapéuticas
--   - Actas de conducta / incidentes
--   - Cobranza (conceptos + cobros)
--
-- Credenciales de login demo (se crean abajo):
--   email:  demo@casanogal.cl
--   pass:   Demo2026!
--
-- Para RE-EJECUTAR limpio, corre antes el bloque de LIMPIEZA del final.
-- ============================================================

DO $$
DECLARE
  v_colegio   uuid := 'cca50000-0000-0000-0000-000000000001';
  v_admin     uuid;
  -- alumnos
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid; a7 uuid; a8 uuid;
  -- planes intervencion
  p1 uuid; p2 uuid; p3 uuid;
  -- evaluacion cualitativa
  ar_com uuid; ar_soc uuid; ar_aut uuid;
  ob1 uuid; ob2 uuid; ob3 uuid; ob4 uuid;
  d_logrado uuid; d_proceso uuid; d_inicial uuid;
  -- cobranza
  c_arancel uuid; c_matricula uuid;
  fam uuid;
BEGIN
  -- ---------- 1. COLEGIO ----------
  INSERT INTO public.colegios (id, nombre, rut, direccion, telefono, plan, tipo_evaluacion)
  VALUES (v_colegio, 'Casa Nogal', '77.123.456-7', 'Av. Los Nogales 2450, Santiago', '+56 2 2345 6789', 'profesional', 'cualitativa')
  ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

  -- ---------- 2. USUARIO DEMO (login) ----------
  -- Se crea directo en auth.users con gen_random_uuid() (pgcrypto),
  -- evitando la dependencia de uuid_generate_v4() / uuid-ossp.
  SELECT id INTO v_admin FROM public.usuarios WHERE email = 'demo@casanogal.cl';
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_admin,
      '00000000-0000-0000-0000-000000000000',
      'demo@casanogal.cl',
      crypt('Demo2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nombre', 'Trinidad', 'apellido', 'Cerveró'),
      now(), now(), 'authenticated', 'authenticated'
    );
    INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
    VALUES (v_admin, v_colegio, 'demo@casanogal.cl', 'Trinidad', 'Cerveró', 'admin');
  END IF;

  -- ---------- 3. ALUMNOS ----------
  a1 := gen_random_uuid(); a2 := gen_random_uuid(); a3 := gen_random_uuid(); a4 := gen_random_uuid();
  a5 := gen_random_uuid(); a6 := gen_random_uuid(); a7 := gen_random_uuid(); a8 := gen_random_uuid();

  INSERT INTO public.alumnos (id, colegio_id, nombre, apellido, rut, fecha_nacimiento, curso, nivel, necesidades_especiales) VALUES
    (a1, v_colegio, 'Martina',   'Reyes Soto',      '25.111.222-3', '2019-03-14', 'Nivel Medio Mayor', 'Preescolar', 'TEA nivel 1'),
    (a2, v_colegio, 'Vicente',   'Cáceres Lagos',   '25.222.333-4', '2018-07-02', 'Nivel Medio Mayor', 'Preescolar', 'TEL mixto'),
    (a3, v_colegio, 'Isidora',   'Fuentes Vera',    '25.333.444-5', '2019-11-20', 'Nivel Medio Menor', 'Preescolar', NULL),
    (a4, v_colegio, 'Agustín',   'Núñez Rojas',     '25.444.555-6', '2018-01-09', 'Nivel Medio Mayor', 'Preescolar', 'TDAH'),
    (a5, v_colegio, 'Emilia',    'Torres Pino',     '25.555.666-7', '2019-05-27', 'Nivel Medio Menor', 'Preescolar', NULL),
    (a6, v_colegio, 'Benjamín',  'Salas Díaz',      '25.666.777-8', '2018-09-15', 'Nivel Medio Mayor', 'Preescolar', 'Síndrome de Down'),
    (a7, v_colegio, 'Florencia', 'Muñoz Herrera',   '25.777.888-9', '2019-02-11', 'Nivel Medio Menor', 'Preescolar', NULL),
    (a8, v_colegio, 'Tomás',     'Araya Contreras', '25.888.999-0', '2018-12-03', 'Nivel Medio Mayor', 'Preescolar', 'TEA nivel 2');

  -- ---------- 4. FAMILIAS (apoderados de contacto) ----------
  INSERT INTO public.familias (colegio_id, alumno_id, nombre_apoderado, apellido_apoderado, email, telefono, rut) VALUES
    (v_colegio, a1, 'Carolina', 'Soto',      'carolina.soto@example.cl',   '+56 9 5111 2223', '15.111.222-3'),
    (v_colegio, a2, 'Rodrigo',  'Cáceres',   'rodrigo.caceres@example.cl', '+56 9 5222 3334', '15.222.333-4'),
    (v_colegio, a3, 'Paula',    'Vera',      'paula.vera@example.cl',      '+56 9 5333 4445', '15.333.444-5'),
    (v_colegio, a4, 'Andrés',   'Núñez',     'andres.nunez@example.cl',    '+56 9 5444 5556', '15.444.555-6'),
    (v_colegio, a5, 'Daniela',  'Pino',      'daniela.pino@example.cl',    '+56 9 5555 6667', '15.555.666-7'),
    (v_colegio, a6, 'Marcela',  'Díaz',      'marcela.diaz@example.cl',    '+56 9 5666 7778', '15.666.777-8'),
    (v_colegio, a7, 'Cristián', 'Herrera',   'cristian.herrera@example.cl','+56 9 5777 8889', '15.777.888-9'),
    (v_colegio, a8, 'Verónica', 'Contreras', 'veronica.contreras@example.cl','+56 9 5888 9990','15.888.999-0');

  -- ---------- 5. ASISTENCIAS (últimos 5 días hábiles) ----------
  INSERT INTO public.asistencias (colegio_id, alumno_id, fecha, estado, registrado_por)
  SELECT v_colegio, al.id, d.fecha,
    CASE WHEN random() < 0.85 THEN 'presente'
         WHEN random() < 0.5 THEN 'tardanza'
         ELSE 'ausente' END,
    v_admin
  FROM (VALUES (a1),(a2),(a3),(a4),(a5),(a6),(a7),(a8)) AS al(id)
  CROSS JOIN (
    SELECT (CURRENT_DATE - g)::date AS fecha
    FROM generate_series(0,6) g
    WHERE EXTRACT(dow FROM CURRENT_DATE - g) BETWEEN 1 AND 5
  ) d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.asistencias x WHERE x.alumno_id = al.id AND x.fecha = d.fecha
  );

  -- ---------- 6. REPORTES DIARIOS (hoy, publicados) ----------
  INSERT INTO public.reportes_diarios (colegio_id, alumno_id, fecha, desayuno, almuerzo, snack, siesta, siesta_minutos, estado_animo, actividades, observaciones, registrado_por, publicado, publicado_at)
  SELECT v.colegio_id, v.alumno_id, v.fecha, v.desayuno, v.almuerzo, v.snack, v.siesta, v.siesta_minutos, v.estado_animo, v.actividades, v.observaciones, v.registrado_por, v.publicado, v.publicado_at
  FROM (VALUES
    (v_colegio, a1, CURRENT_DATE, 'todo','casi_todo','todo', true, 45, 'feliz', ARRAY['musica','motricidad','juego_libre'], 'Participó muy bien en el círculo de la mañana. Comió solita.', v_admin, true, now()),
    (v_colegio, a2, CURRENT_DATE, 'casi_todo','todo','poco', true, 30, 'tranquilo', ARRAY['lectura','arte'], 'Trabajó en su tablero de comunicación con apoyo. Buen día.', v_admin, true, now()),
    (v_colegio, a3, CURRENT_DATE, 'todo','todo','todo', false, NULL, 'feliz', ARRAY['motricidad','juego_libre','musica'], 'Muy activa e integrada con sus compañeros.', v_admin, true, now()),
    (v_colegio, a6, CURRENT_DATE, 'poco','casi_todo','todo', true, 60, 'variable', ARRAY['arte','musica'], 'Necesitó apoyo para regularse tras el recreo, luego se calmó.', v_admin, true, now())
  ) AS v(colegio_id, alumno_id, fecha, desayuno, almuerzo, snack, siesta, siesta_minutos, estado_animo, actividades, observaciones, registrado_por, publicado, publicado_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.reportes_diarios x WHERE x.alumno_id = v.alumno_id AND x.fecha = v.fecha
  );

  -- ---------- 7. EVALUACIÓN CUALITATIVA ----------
  -- Descriptores
  d_logrado := gen_random_uuid(); d_proceso := gen_random_uuid(); d_inicial := gen_random_uuid();
  INSERT INTO public.descriptores_evaluacion (id, colegio_id, nombre, abreviatura, color, orden) VALUES
    (d_logrado, v_colegio, 'Logrado',      'L',  '#4A9E7A', 1),
    (d_proceso, v_colegio, 'En proceso',   'EP', '#E8A33A', 2),
    (d_inicial, v_colegio, 'Por iniciar',  'PI', '#C05A4D', 3);

  -- Áreas
  ar_com := gen_random_uuid(); ar_soc := gen_random_uuid(); ar_aut := gen_random_uuid();
  INSERT INTO public.areas_evaluacion (id, colegio_id, nombre, descripcion, orden) VALUES
    (ar_com, v_colegio, 'Comunicación y Lenguaje', 'Expresión, comprensión y lenguaje', 1),
    (ar_soc, v_colegio, 'Socioemocional',          'Interacción social y regulación',   2),
    (ar_aut, v_colegio, 'Autonomía',               'Hábitos y autovalencia',            3);

  -- Objetivos
  ob1 := gen_random_uuid(); ob2 := gen_random_uuid(); ob3 := gen_random_uuid(); ob4 := gen_random_uuid();
  INSERT INTO public.objetivos_evaluacion (id, area_id, colegio_id, nombre, orden) VALUES
    (ob1, ar_com, v_colegio, 'Se comunica con frases de 2-3 palabras', 1),
    (ob2, ar_com, v_colegio, 'Comprende instrucciones simples',         2),
    (ob3, ar_soc, v_colegio, 'Comparte materiales con sus pares',       1),
    (ob4, ar_aut, v_colegio, 'Realiza su rutina de higiene con apoyo',  1);

  -- Evaluaciones cualitativas (periodo actual)
  INSERT INTO public.evaluaciones_cualitativas (colegio_id, alumno_id, objetivo_id, descriptor_id, periodo, observacion, evaluado_por)
  SELECT v.colegio_id, v.alumno_id, v.objetivo_id, v.descriptor_id, v.periodo, v.observacion, v.evaluado_por
  FROM (VALUES
    (v_colegio, a1, ob1, d_proceso, '1er Semestre 2026', 'Ha aumentado su vocabulario funcional.', v_admin),
    (v_colegio, a1, ob2, d_logrado, '1er Semestre 2026', 'Sigue instrucciones de un paso sin apoyo.', v_admin),
    (v_colegio, a1, ob3, d_proceso, '1er Semestre 2026', 'Comparte con mediación del adulto.', v_admin),
    (v_colegio, a2, ob1, d_inicial, '1er Semestre 2026', 'Uso emergente de tablero de comunicación.', v_admin),
    (v_colegio, a2, ob2, d_proceso, '1er Semestre 2026', NULL, v_admin),
    (v_colegio, a6, ob4, d_proceso, '1er Semestre 2026', 'Avanza en autonomía con rutina visual.', v_admin)
  ) AS v(colegio_id, alumno_id, objetivo_id, descriptor_id, periodo, observacion, evaluado_por)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.evaluaciones_cualitativas x
    WHERE x.alumno_id = v.alumno_id AND x.objetivo_id = v.objetivo_id AND x.periodo = v.periodo
  );

  -- ---------- 8. INTERVENCIÓN NEE ----------
  p1 := gen_random_uuid(); p2 := gen_random_uuid(); p3 := gen_random_uuid();
  INSERT INTO public.planes_intervencion (id, colegio_id, alumno_id, titulo, diagnostico, nivel_apoyo, fortalezas, barreras, apoyos_requeridos, created_by) VALUES
    (p1, v_colegio, a1, 'PII Martina Reyes', 'TEA nivel 1', 'intermedio', 'Memoria visual, interés por la música', 'Comunicación expresiva', 'Apoyo fonoaudiológico y CAA', v_admin),
    (p2, v_colegio, a6, 'PII Benjamín Salas', 'Síndrome de Down', 'intensivo', 'Sociable, afectuoso', 'Motricidad fina, lenguaje', 'Terapia ocupacional y fonoaudiología', v_admin),
    (p3, v_colegio, a8, 'PII Tomás Araya', 'TEA nivel 2', 'intensivo', 'Buen reconocimiento de rutinas', 'Regulación sensorial y social', 'Terapia ocupacional, anticipación visual', v_admin);

  -- Equipo (el usuario demo como coordinador/terapeuta)
  INSERT INTO public.equipo_intervencion (plan_id, profesional_id, especialidad, rol_equipo, horas_semanales)
  SELECT v.plan_id, v.profesional_id, v.especialidad, v.rol_equipo, v.horas_semanales
  FROM (VALUES
    (p1, v_admin, 'educadora_diferencial', 'coordinador', 4),
    (p2, v_admin, 'educadora_diferencial', 'coordinador', 5),
    (p3, v_admin, 'educadora_diferencial', 'coordinador', 5)
  ) AS v(plan_id, profesional_id, especialidad, rol_equipo, horas_semanales)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.equipo_intervencion x WHERE x.plan_id = v.plan_id AND x.profesional_id = v.profesional_id
  );

  -- Objetivos terapéuticos
  INSERT INTO public.objetivos_terapeuticos (plan_id, area, descripcion, indicadores, estrategias, prioridad, estado, progreso, responsable_id) VALUES
    (p1, 'comunicacion',  'Aumentar frases funcionales de 2 a 3 palabras', 'Usa 5 frases nuevas en contexto', 'Modelado y PECS', 1, 'en_progreso', 60, v_admin),
    (p1, 'socioemocional','Iniciar juego con un par por 5 minutos',        'Inicia contacto 3 veces/día',     'Historias sociales', 2, 'en_progreso', 40, v_admin),
    (p2, 'motor_fino',    'Tomar el lápiz con pinza trípode',              'Realiza trazos guiados',          'Ejercicios de prensión', 1, 'en_progreso', 50, v_admin),
    (p2, 'comunicacion',  'Ampliar vocabulario receptivo',                 'Identifica 20 objetos nuevos',    'Loto fonético', 2, 'logrado', 100, v_admin),
    (p3, 'sensorial',     'Tolerar transiciones sin desregularse',         'Completa 4 transiciones/día',     'Anticipación con pictogramas', 1, 'en_progreso', 45, v_admin);

  -- Sesiones terapéuticas recientes
  INSERT INTO public.sesiones_terapeuticas (plan_id, profesional_id, fecha, hora_inicio, hora_fin, duracion_min, tipo_sesion, actividades, logros, estado_ingreso, estado_egreso, indicaciones_familia) VALUES
    (p1, v_admin, CURRENT_DATE - 2, '09:30', '10:15', 45, 'individual', 'Trabajo con tablero de comunicación y turnos', 'Usó 3 frases nuevas espontáneamente', 'regulado', 'regulado', 'Reforzar en casa pedir con frase completa'),
    (p1, v_admin, CURRENT_DATE - 5, '09:30', '10:15', 45, 'individual', 'Juego simbólico guiado', 'Mantuvo atención por 10 minutos', 'levemente_desregulado', 'regulado', NULL),
    (p2, v_admin, CURRENT_DATE - 1, '11:00', '11:45', 45, 'individual', 'Motricidad fina con plasticina y encaje', 'Logró pinza en 4 de 6 intentos', 'regulado', 'regulado', 'Practicar abrochar botones'),
    (p3, v_admin, CURRENT_DATE - 3, '10:30', '11:15', 45, 'individual', 'Rutina de anticipación y regulación sensorial', 'Completó 3 transiciones con apoyo visual', 'desregulado', 'levemente_desregulado', 'Mantener rutina visual en casa');

  -- Bitácora conductual
  INSERT INTO public.bitacora_conductual (plan_id, registrado_por, fecha, tipo, descripcion, antecedente, consecuencia, intensidad, estrategia, resultado, visible_familia) VALUES
    (p1, v_admin, CURRENT_DATE, 'logro', 'Pidió agua con frase completa "quiero agua por favor"', 'Actividad de colación', 'Se reforzó verbalmente', 1, 'Refuerzo positivo', 'efectiva', true),
    (p3, v_admin, CURRENT_DATE - 1, 'desregulacion', 'Llanto al cambiar de actividad sin anticipación', 'Cambio brusco de rutina', 'Se usó rincón de calma', 3, 'Anticipación visual + rincón de calma', 'parcial', true);

  -- ---------- 9. AGENDA DE SESIONES (próximos días) ----------
  INSERT INTO public.agenda_sesiones (colegio_id, alumno_id, profesional_id, plan_id, fecha, hora_inicio, hora_fin, tipo_sesion, estado, creado_por) VALUES
    (v_colegio, a1, v_admin, p1, CURRENT_DATE + 1, '09:30', '10:15', 'individual', 'programada', v_admin),
    (v_colegio, a6, v_admin, p2, CURRENT_DATE + 1, '11:00', '11:45', 'individual', 'programada', v_admin),
    (v_colegio, a8, v_admin, p3, CURRENT_DATE + 2, '10:30', '11:15', 'individual', 'programada', v_admin),
    (v_colegio, a1, v_admin, p1, CURRENT_DATE + 3, '09:30', '10:15', 'individual', 'programada', v_admin);

  -- ---------- 10. ACTAS DE CONDUCTA / INCIDENTES ----------
  INSERT INTO public.actas_conducta (colegio_id, alumno_id, tipo, titulo, descripcion, fecha_evento, gravedad, requiere_firma, creado_por, estado) VALUES
    (v_colegio, a4, 'accidente', 'Caída leve en patio', 'Durante el recreo, Agustín tropezó y se raspó la rodilla. Se aplicaron primeros auxilios, sin mayor consecuencia.', CURRENT_DATE - 1, 'leve', true, v_admin, 'enviada'),
    (v_colegio, a8, 'epilepsia', 'Episodio de crisis', 'Tomás presentó una crisis de ausencia de breve duración. Se siguió el protocolo y se contactó a la familia de inmediato.', CURRENT_DATE - 2, 'grave', true, v_admin, 'firmada'),
    (v_colegio, a1, 'logro', 'Avance comunicativo destacado', 'Martina utilizó frases completas de forma espontánea durante toda la jornada.', CURRENT_DATE, 'leve', false, v_admin, 'borrador');

  -- ---------- 11. COBRANZA ----------
  c_matricula := gen_random_uuid(); c_arancel := gen_random_uuid();
  INSERT INTO public.conceptos_cobro (id, colegio_id, nombre, descripcion, monto, periodicidad) VALUES
    (c_matricula, v_colegio, 'Matrícula 2026', 'Matrícula anual', 180000, 'anual'),
    (c_arancel,   v_colegio, 'Arancel mensual', 'Colegiatura mensual', 320000, 'mensual');

  -- Cobros del mes actual para cada familia
  INSERT INTO public.cobros (colegio_id, familia_id, alumno_id, concepto_id, monto, monto_pagado, mes, anio, fecha_vencimiento, estado, medio_pago, fecha_pago)
  SELECT v_colegio, f.id, f.alumno_id, c_arancel, 320000,
    CASE WHEN random() < 0.7 THEN 320000 ELSE 0 END,
    EXTRACT(MONTH FROM CURRENT_DATE)::int,
    EXTRACT(YEAR FROM CURRENT_DATE)::int,
    date_trunc('month', CURRENT_DATE)::date + 4,
    CASE WHEN random() < 0.7 THEN 'pagado' ELSE 'pendiente' END,
    CASE WHEN random() < 0.7 THEN 'transferencia' ELSE NULL END,
    CASE WHEN random() < 0.7 THEN CURRENT_DATE - 1 ELSE NULL END
  FROM public.familias f
  WHERE f.colegio_id = v_colegio;

  RAISE NOTICE 'Seed Casa Nogal completado. Colegio: %, Admin demo: %', v_colegio, v_admin;
END $$;

-- ============================================================
-- LIMPIEZA (opcional) — ejecutar para borrar la demo y re-sembrar
-- ============================================================
-- Descomenta y ejecuta este bloque ANTES de volver a correr el seed:
--
-- DO $$
-- DECLARE v_colegio uuid := 'cca50000-0000-0000-0000-000000000001'; v_uid uuid;
-- BEGIN
--   DELETE FROM public.colegios WHERE id = v_colegio;  -- cascada borra alumnos, cobros, planes, etc.
--   SELECT id INTO v_uid FROM public.usuarios WHERE email = 'demo@casanogal.cl';
--   IF v_uid IS NOT NULL THEN
--     DELETE FROM public.usuarios WHERE id = v_uid;
--     DELETE FROM auth.users WHERE id = v_uid;
--   END IF;
-- END $$;
