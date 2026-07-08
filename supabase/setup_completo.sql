-- ============================================================
-- KIVA360 — Setup completo para base de datos nueva
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Ejecutar en ORDEN (copiar todo y pegar de una vez)
-- ============================================================

-- =====================
-- EXTENSIONES
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- TABLA: colegios
-- =====================
CREATE TABLE IF NOT EXISTS public.colegios (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      text NOT NULL,
  rut         text,
  direccion   text,
  telefono    text,
  logo_url    text,
  plan        text NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico','profesional','enterprise')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: usuarios
-- =====================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  colegio_id  uuid REFERENCES public.colegios(id) ON DELETE CASCADE,
  email       text NOT NULL,
  nombre      text NOT NULL,
  apellido    text NOT NULL,
  rol         text NOT NULL DEFAULT 'tutor'
              CHECK (rol IN ('super_admin','admin','tutor','apoderado','alumno')),
  avatar_url  text,
  activo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: alumnos
-- =====================
CREATE TABLE IF NOT EXISTS public.alumnos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id       uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  apellido         text NOT NULL,
  rut              text,
  fecha_nacimiento date,
  curso            text NOT NULL,
  nivel            text NOT NULL,
  foto_url         text,
  activo           boolean NOT NULL DEFAULT true,
  direccion        text,
  nacionalidad     text DEFAULT 'Chilena',
  necesidades_especiales text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: familias
-- =====================
CREATE TABLE IF NOT EXISTS public.familias (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id           uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id            uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  nombre_apoderado     text NOT NULL,
  apellido_apoderado   text NOT NULL,
  email                text NOT NULL,
  telefono             text,
  rut                  text,
  direccion            text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: conceptos_cobro
-- =====================
CREATE TABLE IF NOT EXISTS public.conceptos_cobro (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id     uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  descripcion    text,
  monto          integer NOT NULL,
  periodicidad   text NOT NULL DEFAULT 'mensual' CHECK (periodicidad IN ('mensual','trimestral','anual','unico')),
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: cobros
-- =====================
CREATE TABLE IF NOT EXISTS public.cobros (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id        uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  familia_id        uuid NOT NULL REFERENCES public.familias(id),
  alumno_id         uuid NOT NULL REFERENCES public.alumnos(id),
  concepto_id       uuid NOT NULL REFERENCES public.conceptos_cobro(id),
  monto             integer NOT NULL,
  monto_pagado      integer NOT NULL DEFAULT 0,
  mes               integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio              integer NOT NULL,
  fecha_vencimiento date NOT NULL,
  fecha_pago        date,
  estado            text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','pagado','mora','parcial','anulado')),
  medio_pago        text CHECK (medio_pago IN ('transferencia','webpay','efectivo','cheque','app')),
  observaciones     text,
  factura_url       text,
  link_pago         text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLA: pagos
-- =====================
CREATE TABLE IF NOT EXISTS public.pagos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobro_id         uuid NOT NULL REFERENCES public.cobros(id) ON DELETE CASCADE,
  monto            integer NOT NULL,
  medio_pago       text NOT NULL,
  referencia       text,
  registrado_por   uuid REFERENCES public.usuarios(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLAS PEDAGÓGICAS
-- =====================
CREATE TABLE IF NOT EXISTS public.planificaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  curso text,
  materia text,
  fecha date,
  objetivos text,
  actividades text,
  recursos text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','publicada','archivada')),
  creado_por uuid REFERENCES public.usuarios(id),
  tutor_id uuid REFERENCES public.usuarios(id),
  semana date,
  contenidos text,
  evaluacion_desc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.libro_clases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  curso text NOT NULL,
  materia text,
  fecha date NOT NULL DEFAULT current_date,
  contenido text NOT NULL,
  observaciones text,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asistencias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  estado text NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente','ausente','tardanza','justificado')),
  hora_ingreso time,
  observacion text,
  registrado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alumno_id, fecha)
);

-- =====================
-- TABLAS: evaluaciones y calificaciones
-- =====================
CREATE TABLE IF NOT EXISTS public.unidades_aprendizaje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  materia text NOT NULL,
  curso text NOT NULL,
  periodo text DEFAULT 'semestre_1' CHECK (periodo IN ('semestre_1','semestre_2','trimestre_1','trimestre_2','trimestre_3','anual')),
  activa boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  materia text NOT NULL,
  curso text NOT NULL,
  fecha date NOT NULL DEFAULT current_date,
  ponderacion numeric(5,2) NOT NULL DEFAULT 100,
  unidad_id uuid REFERENCES public.unidades_aprendizaje(id),
  tipo_evaluacion text DEFAULT 'prueba'
    CHECK (tipo_evaluacion IN ('prueba','trabajo','presentacion','participacion','tarea','proyecto','autoevaluacion')),
  peso integer DEFAULT 100 CHECK (peso >= 1 AND peso <= 100),
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calificaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  evaluacion_id uuid NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  nota numeric(5,1) NOT NULL CHECK (nota >= 0 AND nota <= 100),
  observacion text,
  registrado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluacion_id, alumno_id)
);

CREATE TABLE IF NOT EXISTS public.tareas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  curso text NOT NULL,
  titulo text NOT NULL,
  descripcion text,
  materia text,
  fecha_entrega date,
  archivo_url text,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cerrada','revisada')),
  puntaje_max integer,
  tutor_id uuid REFERENCES public.usuarios(id),
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLAS: vinculos usuario-alumno
-- =====================
CREATE TABLE IF NOT EXISTS public.usuario_alumno (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, alumno_id)
);

CREATE TABLE IF NOT EXISTS public.tutor_alumnos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  parentesco text,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tutor_id, alumno_id)
);

-- =====================
-- TABLAS: comunicaciones
-- =====================
CREATE TABLE IF NOT EXISTS public.comunicados (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  tipo text NOT NULL DEFAULT 'general' CHECK (tipo IN ('general','urgente','evento','cobro','academico')),
  curso text,
  requiere_confirmacion boolean NOT NULL DEFAULT false,
  enviado_at timestamptz NOT NULL DEFAULT now(),
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comunicado_recepciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  familia_id uuid REFERENCES public.familias(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','abierto','confirmado')),
  abierto_at timestamptz,
  confirmado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensaje text,
  tipo text NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','alerta','cobranza','academico','sistema')),
  leida boolean NOT NULL DEFAULT false,
  href text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLAS: planes de cobro, calendario, fichas
-- =====================
CREATE TABLE IF NOT EXISTS public.planes_cobro (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  monto integer NOT NULL CHECK (monto >= 0),
  periodicidad text NOT NULL DEFAULT 'mensual' CHECK (periodicidad IN ('mensual','trimestral','anual','unico')),
  cursos text[],
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendario_eventos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  tipo text NOT NULL DEFAULT 'evento' CHECK (tipo IN ('evaluacion','evento','comunicado','urgente','feriado')),
  curso text,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fichas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id uuid REFERENCES public.colegios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  materia text NOT NULL CHECK (materia IN ('lenguaje','matematicas','ciencias','historia','ingles','artes','educacion_fisica','otro')),
  grado text NOT NULL,
  tipo text NOT NULL DEFAULT 'ejercicio' CHECK (tipo IN ('ejercicio','evaluacion','cuento','manualidad','guia')),
  archivo_url text,
  miniatura_url text,
  es_publica boolean NOT NULL DEFAULT false,
  valoraciones_total integer NOT NULL DEFAULT 0,
  valoraciones_suma integer NOT NULL DEFAULT 0,
  descargas integer NOT NULL DEFAULT 0,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLAS: invitaciones, reportes diarios, chat
-- =====================
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  codigo text NOT NULL UNIQUE,
  parentesco text DEFAULT 'apoderado',
  usado boolean NOT NULL DEFAULT false,
  usado_por uuid REFERENCES public.usuarios(id),
  usado_at timestamptz,
  expira_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reportes_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  desayuno text CHECK (desayuno IN ('todo','casi_todo','poco','nada','no_aplica')),
  almuerzo text CHECK (almuerzo IN ('todo','casi_todo','poco','nada','no_aplica')),
  snack text CHECK (snack IN ('todo','casi_todo','poco','nada','no_aplica')),
  siesta boolean DEFAULT false,
  siesta_minutos integer,
  cambios_panal integer DEFAULT 0,
  deposiciones integer DEFAULT 0,
  idas_bano integer DEFAULT 0,
  estado_animo text CHECK (estado_animo IN ('feliz','tranquilo','irritable','lloron','variable')),
  llego_con_golpe boolean DEFAULT false,
  fiebre boolean DEFAULT false,
  medicamento boolean DEFAULT false,
  medicamento_detalle text,
  actividades text[],
  observaciones text,
  registrado_por uuid REFERENCES public.usuarios(id),
  publicado boolean NOT NULL DEFAULT false,
  publicado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alumno_id, fecha)
);

CREATE TABLE IF NOT EXISTS public.conversaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual','curso')),
  curso text,
  titulo text,
  activa boolean NOT NULL DEFAULT true,
  chat_habilitado boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversacion_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  rol_chat text NOT NULL DEFAULT 'miembro' CHECK (rol_chat IN ('admin','miembro')),
  puede_escribir boolean NOT NULL DEFAULT true,
  silenciado boolean NOT NULL DEFAULT false,
  ultimo_leido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversacion_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS public.mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.usuarios(id),
  contenido text NOT NULL,
  tipo_contenido text NOT NULL DEFAULT 'texto' CHECK (tipo_contenido IN ('texto','imagen','archivo','sistema')),
  archivo_url text,
  archivo_nombre text,
  editado boolean NOT NULL DEFAULT false,
  eliminado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- TABLAS: documentos, recursos, permisos, matrículas
-- =====================
CREATE TABLE IF NOT EXISTS public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  categoria text NOT NULL DEFAULT 'general'
    CHECK (categoria IN ('institucional','planificacion','material','administrativo','protocolo','acta','otro')),
  materia text,
  curso text,
  archivo_url text,
  archivo_nombre text,
  archivo_tipo text,
  archivo_size integer,
  visible_para text[] DEFAULT ARRAY['admin','tutor'],
  subido_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recursos_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  url text NOT NULL,
  descripcion text,
  icono text,
  materia text,
  curso text,
  activo boolean NOT NULL DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permisos_rol (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid REFERENCES public.colegios(id) ON DELETE CASCADE,
  rol text NOT NULL CHECK (rol IN ('admin','tutor','apoderado','alumno')),
  modulo text NOT NULL,
  habilitado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(colegio_id, rol, modulo)
);

CREATE TABLE IF NOT EXISTS public.matriculas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  familia_id uuid REFERENCES public.familias(id),
  anio_escolar integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','pendiente','anulada','egresada')),
  fecha_matricula date NOT NULL DEFAULT CURRENT_DATE,
  monto_matricula integer DEFAULT 0,
  monto_mensual integer DEFAULT 0,
  plan_cobro_id uuid REFERENCES public.planes_cobro(id),
  observaciones text,
  firma_apoderado text,
  firmado_at timestamptz,
  registrado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alumno_id, anio_escolar)
);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.mi_colegio_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT colegio_id FROM public.usuarios WHERE id = auth.uid() AND activo = true LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.mi_rol()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid() AND activo = true LIMIT 1
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'colegios','usuarios','fichas','alumnos','familias','conceptos_cobro','cobros','pagos',
    'planificaciones','libro_clases','asistencias','evaluaciones','calificaciones','tareas',
    'usuario_alumno','tutor_alumnos','comunicados','comunicado_recepciones','notificaciones',
    'planes_cobro','calendario_eventos','invitaciones','reportes_diarios',
    'conversaciones','conversacion_participantes','mensajes',
    'unidades_aprendizaje','documentos','recursos_externos','permisos_rol','matriculas'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- Colegios
CREATE POLICY "usuarios: ver propio colegio" ON public.colegios FOR SELECT USING (id = public.mi_colegio_id());

-- Usuarios
CREATE POLICY "usuarios: ver del colegio" ON public.usuarios FOR SELECT USING (colegio_id = mi_colegio_id() OR id = auth.uid());

-- Tablas con colegio_id estándar
CREATE POLICY "colegio: all alumnos" ON public.alumnos FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all familias" ON public.familias FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all conceptos" ON public.conceptos_cobro FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all cobros" ON public.cobros FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all fichas" ON public.fichas FOR ALL USING (colegio_id = mi_colegio_id() OR es_publica = true);
CREATE POLICY "colegio: all planificaciones" ON public.planificaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all libro_clases" ON public.libro_clases FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all asistencias" ON public.asistencias FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all evaluaciones" ON public.evaluaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all calificaciones" ON public.calificaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all tareas" ON public.tareas FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all comunicados" ON public.comunicados FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all notificaciones" ON public.notificaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all planes_cobro" ON public.planes_cobro FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all calendario_eventos" ON public.calendario_eventos FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all invitaciones" ON public.invitaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all reportes_diarios" ON public.reportes_diarios FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all unidades" ON public.unidades_aprendizaje FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all documentos" ON public.documentos FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all recursos" ON public.recursos_externos FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "colegio: all matriculas" ON public.matriculas FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "super_admin: all permisos_rol" ON public.permisos_rol FOR ALL USING (true) WITH CHECK (true);

-- Pagos via cobros
CREATE POLICY "pagos: ver via cobros" ON public.pagos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cobros c WHERE c.id = cobro_id AND c.colegio_id = mi_colegio_id())
);
CREATE POLICY "pagos: insertar" ON public.pagos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cobros c WHERE c.id = cobro_id AND c.colegio_id = mi_colegio_id())
);

-- Portal: apoderados ven datos de sus alumnos
CREATE POLICY "portal: select tutor_alumnos" ON public.tutor_alumnos FOR SELECT USING (tutor_id = auth.uid());
CREATE POLICY "portal: select usuario_alumno" ON public.usuario_alumno FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "portal: select reportes_diarios" ON public.reportes_diarios FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tutor_alumnos ta WHERE ta.tutor_id = auth.uid() AND ta.alumno_id = reportes_diarios.alumno_id)
  OR EXISTS (SELECT 1 FROM public.usuario_alumno ua WHERE ua.usuario_id = auth.uid() AND ua.alumno_id = reportes_diarios.alumno_id)
);
CREATE POLICY "portal: select comunicado_recepciones" ON public.comunicado_recepciones FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "portal: update comunicado_recepciones" ON public.comunicado_recepciones FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (true);
CREATE POLICY "public: select invitacion por codigo" ON public.invitaciones FOR SELECT USING (true);

-- Chat
CREATE POLICY "participante: select conversaciones" ON public.conversaciones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversacion_participantes cp WHERE cp.conversacion_id = id AND cp.usuario_id = auth.uid())
  OR colegio_id = public.mi_colegio_id()
);
CREATE POLICY "staff: manage conversaciones" ON public.conversaciones FOR ALL USING (colegio_id = mi_colegio_id()) WITH CHECK (colegio_id = mi_colegio_id());
CREATE POLICY "participante: select participantes" ON public.conversacion_participantes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversacion_participantes cp2 WHERE cp2.conversacion_id = conversacion_id AND cp2.usuario_id = auth.uid())
);
CREATE POLICY "staff: manage participantes" ON public.conversacion_participantes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conversaciones c WHERE c.id = conversacion_id AND c.colegio_id = mi_colegio_id())
);
CREATE POLICY "participante: select mensajes" ON public.mensajes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversacion_participantes cp WHERE cp.conversacion_id = conversacion_id AND cp.usuario_id = auth.uid())
);
CREATE POLICY "participante: insert mensajes" ON public.mensajes FOR INSERT WITH CHECK (
  autor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversacion_participantes cp
    JOIN public.conversaciones c ON c.id = cp.conversacion_id
    WHERE cp.conversacion_id = mensajes.conversacion_id AND cp.usuario_id = auth.uid() AND cp.puede_escribir = true AND c.chat_habilitado = true
  )
);

-- Grants
GRANT ALL ON public.matriculas TO authenticated;
GRANT ALL ON public.matriculas TO service_role;

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER tr_colegios_updated_at BEFORE UPDATE ON public.colegios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_alumnos_updated_at BEFORE UPDATE ON public.alumnos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_familias_updated_at BEFORE UPDATE ON public.familias FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_cobros_updated_at BEFORE UPDATE ON public.cobros FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_fichas_updated_at BEFORE UPDATE ON public.fichas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_planificaciones_updated_at BEFORE UPDATE ON public.planificaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_libro_clases_updated_at BEFORE UPDATE ON public.libro_clases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_asistencias_updated_at BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_evaluaciones_updated_at BEFORE UPDATE ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_calificaciones_updated_at BEFORE UPDATE ON public.calificaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_comunicados_updated_at BEFORE UPDATE ON public.comunicados FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_planes_cobro_updated_at BEFORE UPDATE ON public.planes_cobro FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_reportes_diarios_updated_at BEFORE UPDATE ON public.reportes_diarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_conversaciones_updated_at BEFORE UPDATE ON public.conversaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_mensajes_updated_at BEFORE UPDATE ON public.mensajes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_unidades_updated_at BEFORE UPDATE ON public.unidades_aprendizaje FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_permisos_updated_at BEFORE UPDATE ON public.permisos_rol FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_matriculas_updated_at BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_asistencias_colegio_fecha ON public.asistencias(colegio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno_fecha ON public.asistencias(alumno_id, fecha);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_colegio_fecha ON public.evaluaciones(colegio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_calificaciones_alumno ON public.calificaciones(alumno_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_colegio_fecha ON public.comunicados(colegio_id, enviado_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_tutor_alumnos_tutor ON public.tutor_alumnos(tutor_id);
CREATE INDEX IF NOT EXISTS idx_usuario_alumno_usuario ON public.usuario_alumno(usuario_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_codigo ON public.invitaciones(codigo);
CREATE INDEX IF NOT EXISTS idx_reportes_diarios_alumno ON public.reportes_diarios(alumno_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_diarios_colegio ON public.reportes_diarios(colegio_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON public.mensajes(conversacion_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participantes_usuario ON public.conversacion_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_colegio ON public.conversaciones(colegio_id);
CREATE INDEX IF NOT EXISTS idx_calendario_colegio_fecha ON public.calendario_eventos(colegio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_unidades_colegio ON public.unidades_aprendizaje(colegio_id, materia, curso);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_unidad ON public.evaluaciones(unidad_id);
CREATE INDEX IF NOT EXISTS idx_documentos_colegio ON public.documentos(colegio_id, categoria);
CREATE INDEX IF NOT EXISTS idx_matriculas_colegio ON public.matriculas(colegio_id, anio_escolar);
CREATE INDEX IF NOT EXISTS idx_matriculas_alumno ON public.matriculas(alumno_id);

-- ============================================================
-- PERMISOS POR DEFECTO
-- ============================================================
INSERT INTO public.permisos_rol (colegio_id, rol, modulo, habilitado) VALUES
  (NULL, 'admin', 'inicio', true), (NULL, 'admin', 'alumnos', true),
  (NULL, 'admin', 'asistencias', true), (NULL, 'admin', 'evaluaciones', true),
  (NULL, 'admin', 'comunicados', true), (NULL, 'admin', 'mensajes', true),
  (NULL, 'admin', 'reporte_diario', true), (NULL, 'admin', 'cobranzas', true),
  (NULL, 'admin', 'documentos', true), (NULL, 'admin', 'calendario', true),
  (NULL, 'admin', 'fichas', true), (NULL, 'admin', 'reportes', true),
  (NULL, 'tutor', 'inicio', true), (NULL, 'tutor', 'alumnos', true),
  (NULL, 'tutor', 'planificacion', true), (NULL, 'tutor', 'asistencias', true),
  (NULL, 'tutor', 'evaluaciones', true), (NULL, 'tutor', 'comunicados', true),
  (NULL, 'tutor', 'mensajes', true), (NULL, 'tutor', 'libro_clases', true),
  (NULL, 'tutor', 'reporte_diario', true), (NULL, 'tutor', 'documentos', true),
  (NULL, 'tutor', 'calendario', true), (NULL, 'tutor', 'fichas', true),
  (NULL, 'tutor', 'reportes', false), (NULL, 'tutor', 'cobranzas', false),
  (NULL, 'apoderado', 'inicio', true), (NULL, 'apoderado', 'reporte_diario', true),
  (NULL, 'apoderado', 'mensajes', true), (NULL, 'apoderado', 'comunicados', true),
  (NULL, 'apoderado', 'asistencias', true), (NULL, 'apoderado', 'evaluaciones', true),
  (NULL, 'apoderado', 'pagos', true), (NULL, 'apoderado', 'perfil', true),
  (NULL, 'alumno', 'inicio', true), (NULL, 'alumno', 'evaluaciones', true),
  (NULL, 'alumno', 'asistencias', true), (NULL, 'alumno', 'tareas', true),
  (NULL, 'alumno', 'comunicados', true), (NULL, 'alumno', 'perfil', true)
ON CONFLICT (colegio_id, rol, modulo) DO NOTHING;

-- ============================================================
-- VISTA: resumen de cobros por mes
-- ============================================================
CREATE OR REPLACE VIEW public.resumen_cobros_mes AS
SELECT
  colegio_id, mes, anio,
  count(*) AS total_cobros,
  sum(monto_pagado) AS total_recaudado,
  sum(CASE WHEN estado = 'mora' THEN monto ELSE 0 END) AS total_mora,
  count(CASE WHEN estado = 'pagado' THEN 1 END) AS familias_al_dia,
  count(CASE WHEN estado = 'mora' THEN 1 END) AS familias_mora
FROM public.cobros
GROUP BY colegio_id, mes, anio;

-- ============================================================
-- FUNCIÓN: crear usuario en un paso (usar con service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.crear_usuario_sistema(
  p_email text, p_password text, p_nombre text, p_apellido text,
  p_rol text, p_colegio_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_user_id uuid;
BEGIN
  IF p_rol NOT IN ('super_admin','admin','tutor','apoderado','alumno') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  VALUES (v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nombre', p_nombre, 'apellido', p_apellido), now(), now(), 'authenticated', 'authenticated');
  INSERT INTO public.usuarios (id, colegio_id, email, nombre, apellido, rol)
  VALUES (v_user_id, p_colegio_id, p_email, p_nombre, p_apellido, p_rol);
  RETURN v_user_id;
END; $$;

-- ============================================================
-- SETUP INICIAL: CREAR SUPER ADMIN + COLEGIO DEMO
-- ============================================================
-- 
-- PASO 1: Ejecutar todo lo anterior primero.
--
-- PASO 2: Crear tu super admin (reemplaza email y password):
--
--   SELECT public.crear_usuario_sistema(
--     'tu-email@gmail.com',
--     'TuPassword123!',
--     'Tu Nombre',
--     'Tu Apellido',
--     'super_admin',
--     NULL
--   );
--
-- PASO 3: Crear un colegio de demo:
--
--   INSERT INTO public.colegios (nombre, direccion, plan) VALUES
--     ('Mi Colegio Demo', 'Dirección 123, Ciudad', 'profesional');
--
-- PASO 4: Crear un admin para ese colegio:
--
--   SELECT public.crear_usuario_sistema(
--     'admin@demo.cl',
--     'Admin123!',
--     'Admin',
--     'Demo',
--     'admin',
--     (SELECT id FROM public.colegios WHERE nombre = 'Mi Colegio Demo')
--   );
--
-- ============================================================
-- FIN DEL SETUP
-- ============================================================
