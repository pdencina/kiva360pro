-- ============================================================
-- MIGRACIÓN 055 — Planes / Packs de sesiones (modelo financiero correcto)
--
-- Objetivos:
--  1. Un plan define QUÉ prestaciones puede consumir (N:M con tarifas_sesion,
--     que es el catálogo de prestaciones existente; no se crea uno paralelo).
--  2. Vigencia y estados reales: ACTIVO / AGOTADO / VENCIDO / CANCELADO.
--  3. Consumo atómico, idempotente y trazable (ledger plan_consumos).
--  4. Sin doble contabilización: el ingreso ocurre al PAGAR el plan
--     (tabla pagos); consumir una sesión NO genera ingreso.
--  5. Venta, pago, consumo y reverso como funciones SQL transaccionales
--     con auditoría en la misma transacción.
--  6. Endurecer RLS de paquetes/cobros_sesion (antes cualquier usuario
--     autenticado del colegio podía modificarlos con su JWT).
--
-- Es ADITIVA: no elimina columnas ni datos. Prerrequisitos: 036, 047, 051, 053.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- ---------------------------------------------------------------
-- 0. Prerrequisitos idempotentes (por si 051/053 no se ejecutaron)
-- ---------------------------------------------------------------
ALTER TABLE public.pagos ALTER COLUMN cobro_id DROP NOT NULL;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS alumno_id uuid REFERENCES public.alumnos(id);
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cobro_sesion_id uuid REFERENCES public.cobros_sesion(id);

-- ---------------------------------------------------------------
-- 1. Catálogo de planes: vigencia y valor normal
-- ---------------------------------------------------------------
ALTER TABLE public.paquetes_sesion ADD COLUMN IF NOT EXISTS vigencia_dias integer CHECK (vigencia_dias IS NULL OR vigencia_dias > 0);
ALTER TABLE public.paquetes_sesion ADD COLUMN IF NOT EXISTS valor_original integer;

COMMENT ON COLUMN public.paquetes_sesion.tarifa_id IS 'DEPRECADO: usar paquete_prestaciones (un plan puede permitir varias prestaciones).';
COMMENT ON COLUMN public.paquetes_sesion.precio_total IS 'Precio final del plan (autoritativo). valor_original y descuento_pct son informativos/derivados.';
COMMENT ON COLUMN public.paquetes_sesion.valor_original IS 'Valor normal del plan (suma de prestaciones a precio de lista). NULL si no es calculable.';

-- ---------------------------------------------------------------
-- 2. Plan <-> prestaciones permitidas
--    cantidad NULL = comparten el total del plan; cantidad N = límite propio
--    de esa prestación (permite planes integrales: 4 TO + 4 Fono + 2 Psico).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.paquete_prestaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id  uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  paquete_id  uuid NOT NULL REFERENCES public.paquetes_sesion(id) ON DELETE CASCADE,
  tarifa_id   uuid NOT NULL REFERENCES public.tarifas_sesion(id),
  cantidad    integer CHECK (cantidad IS NULL OR cantidad > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paquete_id, tarifa_id)
);

CREATE INDEX IF NOT EXISTS idx_paquete_prestaciones_paquete ON public.paquete_prestaciones(paquete_id);
CREATE INDEX IF NOT EXISTS idx_paquete_prestaciones_tarifa ON public.paquete_prestaciones(tarifa_id);

-- Backfill desde la relación antigua (1 tarifa por plan)
INSERT INTO public.paquete_prestaciones (colegio_id, paquete_id, tarifa_id)
SELECT colegio_id, id, tarifa_id FROM public.paquetes_sesion WHERE tarifa_id IS NOT NULL
ON CONFLICT (paquete_id, tarifa_id) DO NOTHING;

UPDATE public.paquetes_sesion ps
SET valor_original = t.monto * ps.cantidad
FROM public.tarifas_sesion t
WHERE t.id = ps.tarifa_id AND ps.valor_original IS NULL;

-- ---------------------------------------------------------------
-- 3. Plan vendido: snapshot de precios, cancelación e idempotencia
-- ---------------------------------------------------------------
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS valor_original integer;
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS descuento_pct numeric(5,2);
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS precio_final integer;
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS cancelado_at timestamptz;
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS cancelado_por uuid REFERENCES public.usuarios(id);
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS motivo_cancelacion text;
ALTER TABLE public.paquetes_vendidos ADD COLUMN IF NOT EXISTS idempotency_key text;

UPDATE public.paquetes_vendidos pv
SET precio_final = ps.precio_total, valor_original = ps.valor_original, descuento_pct = ps.descuento_pct
FROM public.paquetes_sesion ps
WHERE ps.id = pv.paquete_id AND pv.precio_final IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_paquetes_vendidos_idem ON public.paquetes_vendidos(colegio_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_paquetes_vendidos_alumno_estado ON public.paquetes_vendidos(colegio_id, alumno_id, estado_pago);

COMMENT ON COLUMN public.paquetes_vendidos.precio_final IS 'Precio congelado al momento de la venta (no cambia si el catálogo cambia).';

-- ---------------------------------------------------------------
-- 4. Vínculos con pagos, documentos, cobros y agenda
-- ---------------------------------------------------------------
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS paquete_vendido_id uuid REFERENCES public.paquetes_vendidos(id);
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE INDEX IF NOT EXISTS idx_pagos_paquete ON public.pagos(paquete_vendido_id) WHERE paquete_vendido_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_plan_idem ON public.pagos(paquete_vendido_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.documentos_tributarios ADD COLUMN IF NOT EXISTS paquete_vendido_id uuid REFERENCES public.paquetes_vendidos(id);
ALTER TABLE public.documentos_tributarios DROP CONSTRAINT IF EXISTS documentos_tributarios_origen_check;
ALTER TABLE public.documentos_tributarios ADD CONSTRAINT documentos_tributarios_origen_check CHECK (cobro_id IS NOT NULL OR cobro_sesion_id IS NOT NULL OR paquete_vendido_id IS NOT NULL OR tipo = 'nota_credito');
CREATE INDEX IF NOT EXISTS idx_doctrib_paquete ON public.documentos_tributarios(paquete_vendido_id);

ALTER TABLE public.cobros_sesion ADD COLUMN IF NOT EXISTS paquete_vendido_id uuid REFERENCES public.paquetes_vendidos(id);
ALTER TABLE public.cobros_sesion ADD COLUMN IF NOT EXISTS monto_cubierto_plan integer NOT NULL DEFAULT 0 CHECK (monto_cubierto_plan >= 0);
CREATE INDEX IF NOT EXISTS idx_cobros_sesion_paquete ON public.cobros_sesion(paquete_vendido_id) WHERE paquete_vendido_id IS NOT NULL;

COMMENT ON COLUMN public.cobros_sesion.monto IS 'Valor de la prestación (precio de lista).';
COMMENT ON COLUMN public.cobros_sesion.monto_cubierto_plan IS 'Parte cubierta por un plan prepagado. No es ingreso: el ingreso fue el pago del plan.';
COMMENT ON COLUMN public.cobros_sesion.monto_final IS 'Saldo a pagar por el paciente por esta atención (0 si la cubrió un plan).';

ALTER TABLE public.agenda_sesiones ADD COLUMN IF NOT EXISTS tarifa_id uuid REFERENCES public.tarifas_sesion(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_tarifa ON public.agenda_sesiones(tarifa_id) WHERE tarifa_id IS NOT NULL;
-- Una atención de agenda no puede tener dos cobros vigentes (protege de doble clic / cron simultáneo).
-- Si ya existieran duplicados históricos el índice no se crea (se avisa) y la app igualmente
-- verifica antes de insertar.
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_cobros_sesion_agenda_vigente ON public.cobros_sesion(agenda_sesion_id)
    WHERE agenda_sesion_id IS NOT NULL AND estado <> 'anulado';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Hay cobros_sesion duplicados por agenda_sesion_id: depurar y volver a crear uq_cobros_sesion_agenda_vigente';
END $$;

COMMENT ON COLUMN public.agenda_sesiones.tarifa_id IS 'Prestación (tarifas_sesion) de la atención. Permite validar contra qué plan puede consumirse.';

-- ---------------------------------------------------------------
-- 5. Ledger de consumos (trazabilidad + idempotencia)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_consumos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id          uuid NOT NULL REFERENCES public.colegios(id) ON DELETE CASCADE,
  paquete_vendido_id  uuid NOT NULL REFERENCES public.paquetes_vendidos(id),
  cobro_sesion_id     uuid NOT NULL REFERENCES public.cobros_sesion(id),
  agenda_sesion_id    uuid REFERENCES public.agenda_sesiones(id) ON DELETE SET NULL,
  alumno_id           uuid NOT NULL REFERENCES public.alumnos(id),
  tarifa_id           uuid REFERENCES public.tarifas_sesion(id),
  profesional_id      uuid REFERENCES public.usuarios(id),
  fecha_sesion        date NOT NULL,
  unidades            integer NOT NULL DEFAULT 1 CHECK (unidades > 0),
  monto_cubierto      integer NOT NULL CHECK (monto_cubierto >= 0),
  estado              text NOT NULL DEFAULT 'consumido' CHECK (estado IN ('consumido', 'revertido')),
  consumido_por       uuid REFERENCES public.usuarios(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  revertido_at        timestamptz,
  revertido_por       uuid REFERENCES public.usuarios(id),
  motivo_reverso      text,
  UNIQUE (cobro_sesion_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_consumos_agenda ON public.plan_consumos(agenda_sesion_id) WHERE agenda_sesion_id IS NOT NULL AND estado = 'consumido';
CREATE INDEX IF NOT EXISTS idx_plan_consumos_plan ON public.plan_consumos(paquete_vendido_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_consumos_alumno ON public.plan_consumos(colegio_id, alumno_id);

-- ---------------------------------------------------------------
-- 6. Estado derivado del plan
--    Prioridad: cancelado > agotado > vencido > activo.
--    (Un plan totalmente usado es "agotado" aunque su fecha haya pasado.)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_estado(p_usadas integer, p_total integer, p_vencimiento date, p_cancelado_at timestamptz)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN p_cancelado_at IS NOT NULL THEN 'cancelado'
    WHEN p_usadas >= p_total THEN 'agotado'
    WHEN p_vencimiento IS NOT NULL AND p_vencimiento < current_date THEN 'vencido'
    ELSE 'activo'
  END
$$;

-- ---------------------------------------------------------------
-- 7. Funciones transaccionales
-- ---------------------------------------------------------------

-- 7.1 Registrar pago de un plan (bloquea el plan; idempotente por clave)
CREATE OR REPLACE FUNCTION public.registrar_pago_plan(
  p_colegio uuid, p_plan uuid, p_user uuid, p_monto integer, p_medio_pago text,
  p_referencia text DEFAULT NULL, p_idempotency_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_plan public.paquetes_vendidos%ROWTYPE;
  v_pago uuid;
  v_nuevo integer;
  v_estado text;
BEGIN
  SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE id = p_plan AND colegio_id = p_colegio FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_no_encontrado'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_pago FROM public.pagos WHERE paquete_vendido_id = p_plan AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('pago_id', v_pago, 'repetido', true, 'estado_pago', v_plan.estado_pago, 'monto_pagado', v_plan.monto_pagado);
    END IF;
  END IF;

  IF v_plan.cancelado_at IS NOT NULL THEN RAISE EXCEPTION 'plan_cancelado'; END IF;
  IF p_monto IS NULL OR p_monto <= 0 THEN RAISE EXCEPTION 'monto_invalido'; END IF;
  IF p_medio_pago IS NULL OR p_medio_pago = '' THEN RAISE EXCEPTION 'medio_pago_requerido'; END IF;
  IF p_monto > COALESCE(v_plan.precio_final, 0) - v_plan.monto_pagado THEN RAISE EXCEPTION 'monto_excede_saldo'; END IF;

  INSERT INTO public.pagos (cobro_id, cobro_sesion_id, paquete_vendido_id, alumno_id, monto, medio_pago, referencia, estado, registrado_por, idempotency_key)
  VALUES (NULL, NULL, p_plan, v_plan.alumno_id, p_monto, p_medio_pago, p_referencia, 'confirmado', p_user, p_idempotency_key)
  RETURNING id INTO v_pago;

  v_nuevo := v_plan.monto_pagado + p_monto;
  v_estado := CASE WHEN v_nuevo >= v_plan.precio_final THEN 'pagado' ELSE 'parcial' END;

  UPDATE public.paquetes_vendidos SET monto_pagado = v_nuevo, estado_pago = v_estado WHERE id = p_plan;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo)
  VALUES (p_colegio, p_user, 'plan_pago_registrado', 'paquetes_vendidos', p_plan,
          jsonb_build_object('monto_pagado', v_plan.monto_pagado, 'estado_pago', v_plan.estado_pago),
          jsonb_build_object('monto_pagado', v_nuevo, 'estado_pago', v_estado, 'pago_id', v_pago, 'monto', p_monto, 'medio_pago', p_medio_pago));

  IF v_estado = 'pagado' AND v_plan.estado_pago <> 'pagado' THEN
    INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_nuevo)
    VALUES (p_colegio, p_user, 'plan_activado', 'paquetes_vendidos', p_plan,
            jsonb_build_object('sesiones_total', v_plan.sesiones_total, 'fecha_vencimiento', v_plan.fecha_vencimiento));
  END IF;

  RETURN jsonb_build_object('pago_id', v_pago, 'repetido', false, 'estado_pago', v_estado, 'monto_pagado', v_nuevo,
                            'saldo', v_plan.precio_final - v_nuevo);
END;
$$;

-- 7.2 Vender un plan (valida tenant del paciente; congela precios; pago opcional)
CREATE OR REPLACE FUNCTION public.vender_plan(
  p_colegio uuid, p_paquete uuid, p_alumno uuid, p_user uuid,
  p_fecha_inicio date DEFAULT NULL, p_fecha_vencimiento date DEFAULT NULL,
  p_pagar boolean DEFAULT false, p_medio_pago text DEFAULT NULL,
  p_referencia text DEFAULT NULL, p_idempotency_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_pkg public.paquetes_sesion%ROWTYPE;
  v_plan public.paquetes_vendidos%ROWTYPE;
  v_fam uuid;
  v_inicio date;
  v_venc date;
  v_pago jsonb;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE colegio_id = p_colegio AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('plan_id', v_plan.id, 'repetido', true); END IF;
  END IF;

  SELECT * INTO v_pkg FROM public.paquetes_sesion WHERE id = p_paquete AND colegio_id = p_colegio AND activo;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_no_encontrado'; END IF;

  PERFORM 1 FROM public.alumnos WHERE id = p_alumno AND colegio_id = p_colegio;
  IF NOT FOUND THEN RAISE EXCEPTION 'paciente_no_encontrado'; END IF;

  SELECT id INTO v_fam FROM public.familias WHERE alumno_id = p_alumno AND colegio_id = p_colegio LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'paciente_sin_familia'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.paquete_prestaciones WHERE paquete_id = p_paquete) THEN
    RAISE EXCEPTION 'plan_sin_prestaciones';
  END IF;
  IF p_pagar AND (p_medio_pago IS NULL OR p_medio_pago = '') THEN RAISE EXCEPTION 'medio_pago_requerido'; END IF;

  v_inicio := COALESCE(p_fecha_inicio, current_date);
  v_venc := COALESCE(p_fecha_vencimiento, CASE WHEN v_pkg.vigencia_dias IS NOT NULL THEN v_inicio + v_pkg.vigencia_dias END);
  IF v_venc IS NOT NULL AND v_venc < v_inicio THEN RAISE EXCEPTION 'vigencia_invalida'; END IF;

  BEGIN
    INSERT INTO public.paquetes_vendidos (colegio_id, paquete_id, familia_id, alumno_id, sesiones_total, sesiones_usadas,
      monto_pagado, estado_pago, fecha_inicio, fecha_vencimiento, valor_original, descuento_pct, precio_final, idempotency_key)
    VALUES (p_colegio, p_paquete, v_fam, p_alumno, v_pkg.cantidad, 0,
      0, 'pendiente', v_inicio, v_venc, v_pkg.valor_original, v_pkg.descuento_pct, v_pkg.precio_total, p_idempotency_key)
    RETURNING * INTO v_plan;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE colegio_id = p_colegio AND idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object('plan_id', v_plan.id, 'repetido', true);
  END;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_nuevo)
  VALUES (p_colegio, p_user, 'plan_vendido', 'paquetes_vendidos', v_plan.id,
          jsonb_build_object('paquete_id', p_paquete, 'alumno_id', p_alumno, 'sesiones_total', v_plan.sesiones_total,
                             'valor_original', v_plan.valor_original, 'descuento_pct', v_plan.descuento_pct,
                             'precio_final', v_plan.precio_final, 'fecha_vencimiento', v_venc));

  IF p_pagar AND v_plan.precio_final > 0 THEN
    v_pago := public.registrar_pago_plan(p_colegio, v_plan.id, p_user, v_plan.precio_final, p_medio_pago, p_referencia,
                                         CASE WHEN p_idempotency_key IS NULL THEN NULL ELSE p_idempotency_key || ':pago' END);
  END IF;

  RETURN jsonb_build_object('plan_id', v_plan.id, 'repetido', false, 'pago', v_pago);
END;
$$;

-- 7.3 Planes elegibles para una prestación (más próximo a vencer primero)
CREATE OR REPLACE FUNCTION public.planes_elegibles(p_colegio uuid, p_alumno uuid, p_tarifa uuid, p_fecha date)
RETURNS TABLE (id uuid) LANGUAGE sql STABLE AS $$
  SELECT pv.id
  FROM public.paquetes_vendidos pv
  JOIN public.paquete_prestaciones pp ON pp.paquete_id = pv.paquete_id AND pp.tarifa_id = p_tarifa
  WHERE pv.colegio_id = p_colegio AND pv.alumno_id = p_alumno
    AND pv.cancelado_at IS NULL AND pv.estado_pago = 'pagado'
    AND pv.sesiones_usadas < pv.sesiones_total
    AND (pv.fecha_vencimiento IS NULL OR p_fecha <= pv.fecha_vencimiento)
  ORDER BY pv.fecha_vencimiento NULLS LAST, pv.created_at
$$;

-- 7.4 Consumir una sesión de un plan. Valida y actualiza TODO en una transacción.
--     Bloquea primero el plan (FOR UPDATE) => serializa consumos simultáneos.
CREATE OR REPLACE FUNCTION public.consumir_sesion_plan(
  p_colegio uuid, p_plan uuid, p_cobro_sesion uuid, p_user uuid, p_unidades integer DEFAULT 1
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_plan public.paquetes_vendidos%ROWTYPE;
  v_cobro public.cobros_sesion%ROWTYPE;
  v_consumo public.plan_consumos%ROWTYPE;
  v_lim integer;
  v_usadas_prest integer;
  v_id uuid;
  v_cubierto integer;
BEGIN
  IF p_unidades IS NULL OR p_unidades < 1 THEN RAISE EXCEPTION 'unidades_invalidas'; END IF;

  SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE id = p_plan AND colegio_id = p_colegio FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_no_encontrado'; END IF;

  -- Idempotencia (después del lock: un reintento concurrente ve el consumo ya hecho)
  SELECT * INTO v_consumo FROM public.plan_consumos WHERE cobro_sesion_id = p_cobro_sesion;
  IF FOUND THEN
    IF v_consumo.estado = 'consumido' AND v_consumo.paquete_vendido_id = p_plan THEN
      RETURN jsonb_build_object('consumo_id', v_consumo.id, 'repetido', true);
    END IF;
    RAISE EXCEPTION 'sesion_ya_consumida';
  END IF;

  SELECT * INTO v_cobro FROM public.cobros_sesion WHERE id = p_cobro_sesion AND colegio_id = p_colegio FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'atencion_no_encontrada'; END IF;

  IF v_cobro.alumno_id <> v_plan.alumno_id THEN RAISE EXCEPTION 'plan_de_otro_paciente'; END IF;
  IF v_cobro.estado <> 'pendiente' THEN RAISE EXCEPTION 'atencion_no_pendiente'; END IF;
  IF v_cobro.tarifa_id IS NULL THEN RAISE EXCEPTION 'prestacion_desconocida'; END IF;
  IF v_plan.cancelado_at IS NOT NULL THEN RAISE EXCEPTION 'plan_cancelado'; END IF;
  IF v_plan.estado_pago <> 'pagado' THEN RAISE EXCEPTION 'plan_no_pagado'; END IF;
  IF v_plan.fecha_vencimiento IS NOT NULL AND v_cobro.fecha_sesion > v_plan.fecha_vencimiento THEN RAISE EXCEPTION 'plan_vencido'; END IF;
  IF v_plan.sesiones_usadas + p_unidades > v_plan.sesiones_total THEN RAISE EXCEPTION 'plan_agotado'; END IF;

  SELECT cantidad INTO v_lim FROM public.paquete_prestaciones WHERE paquete_id = v_plan.paquete_id AND tarifa_id = v_cobro.tarifa_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'prestacion_no_permitida'; END IF;
  IF v_lim IS NOT NULL THEN
    SELECT COALESCE(SUM(unidades), 0) INTO v_usadas_prest
    FROM public.plan_consumos WHERE paquete_vendido_id = p_plan AND tarifa_id = v_cobro.tarifa_id AND estado = 'consumido';
    IF v_usadas_prest + p_unidades > v_lim THEN RAISE EXCEPTION 'prestacion_agotada'; END IF;
  END IF;

  v_cubierto := v_cobro.monto_final;

  BEGIN
    INSERT INTO public.plan_consumos (colegio_id, paquete_vendido_id, cobro_sesion_id, agenda_sesion_id, alumno_id, tarifa_id,
      profesional_id, fecha_sesion, unidades, monto_cubierto, consumido_por)
    VALUES (p_colegio, p_plan, p_cobro_sesion, v_cobro.agenda_sesion_id, v_cobro.alumno_id, v_cobro.tarifa_id,
      v_cobro.profesional_id, v_cobro.fecha_sesion, p_unidades, v_cubierto, p_user)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'sesion_ya_consumida';
  END;

  UPDATE public.paquetes_vendidos SET sesiones_usadas = sesiones_usadas + p_unidades WHERE id = p_plan;

  UPDATE public.cobros_sesion
  SET paquete_vendido_id = p_plan, monto_cubierto_plan = v_cubierto, monto_final = 0,
      estado = 'pagado', fecha_pago = current_date, pagado_por = p_user
  WHERE id = p_cobro_sesion;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_nuevo)
  VALUES (p_colegio, p_user, 'plan_sesion_consumida', 'plan_consumos', v_id,
          jsonb_build_object('paquete_vendido_id', p_plan, 'cobro_sesion_id', p_cobro_sesion, 'monto_cubierto', v_cubierto,
                             'sesiones_usadas', v_plan.sesiones_usadas + p_unidades, 'sesiones_total', v_plan.sesiones_total));

  RETURN jsonb_build_object('consumo_id', v_id, 'repetido', false, 'monto_cubierto', v_cubierto,
                            'sesiones_usadas', v_plan.sesiones_usadas + p_unidades,
                            'disponibles', v_plan.sesiones_total - v_plan.sesiones_usadas - p_unidades);
END;
$$;

-- 7.5 Revertir un consumo (devuelve la sesión al plan; anula la atención; no borra nada)
CREATE OR REPLACE FUNCTION public.revertir_consumo_plan(
  p_colegio uuid, p_consumo uuid, p_user uuid, p_motivo text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_plan_id uuid;
  v_plan public.paquetes_vendidos%ROWTYPE;
  v_consumo public.plan_consumos%ROWTYPE;
BEGIN
  SELECT paquete_vendido_id INTO v_plan_id FROM public.plan_consumos WHERE id = p_consumo AND colegio_id = p_colegio;
  IF NOT FOUND THEN RAISE EXCEPTION 'consumo_no_encontrado'; END IF;

  -- Mismo orden de bloqueo que consumir_sesion_plan (plan primero) para evitar deadlocks
  SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE id = v_plan_id FOR UPDATE;
  SELECT * INTO v_consumo FROM public.plan_consumos WHERE id = p_consumo FOR UPDATE;
  IF v_consumo.estado <> 'consumido' THEN RAISE EXCEPTION 'consumo_ya_revertido'; END IF;

  UPDATE public.plan_consumos
  SET estado = 'revertido', revertido_at = now(), revertido_por = p_user, motivo_reverso = p_motivo
  WHERE id = p_consumo;

  UPDATE public.paquetes_vendidos SET sesiones_usadas = GREATEST(sesiones_usadas - v_consumo.unidades, 0) WHERE id = v_plan_id;

  UPDATE public.cobros_sesion SET estado = 'anulado' WHERE id = v_consumo.cobro_sesion_id AND colegio_id = p_colegio;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, metadata)
  VALUES (p_colegio, p_user, 'plan_consumo_revertido', 'plan_consumos', p_consumo,
          jsonb_build_object('estado', 'consumido', 'sesiones_usadas', v_plan.sesiones_usadas),
          jsonb_build_object('estado', 'revertido', 'sesiones_usadas', GREATEST(v_plan.sesiones_usadas - v_consumo.unidades, 0)),
          jsonb_build_object('motivo', p_motivo, 'cobro_sesion_id', v_consumo.cobro_sesion_id));

  RETURN jsonb_build_object('consumo_id', p_consumo, 'sesiones_usadas', GREATEST(v_plan.sesiones_usadas - v_consumo.unidades, 0));
END;
$$;

-- 7.6 Cancelar un plan (el historial se conserva; no revierte consumos ya realizados)
CREATE OR REPLACE FUNCTION public.cancelar_plan(p_colegio uuid, p_plan uuid, p_user uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_plan public.paquetes_vendidos%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE id = p_plan AND colegio_id = p_colegio FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_no_encontrado'; END IF;
  IF v_plan.cancelado_at IS NOT NULL THEN RAISE EXCEPTION 'plan_ya_cancelado'; END IF;

  UPDATE public.paquetes_vendidos SET cancelado_at = now(), cancelado_por = p_user, motivo_cancelacion = p_motivo WHERE id = p_plan;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo)
  VALUES (p_colegio, p_user, 'plan_cancelado', 'paquetes_vendidos', p_plan,
          jsonb_build_object('estado', public.plan_estado(v_plan.sesiones_usadas, v_plan.sesiones_total, v_plan.fecha_vencimiento, NULL)),
          jsonb_build_object('estado', 'cancelado', 'motivo', p_motivo, 'monto_pagado', v_plan.monto_pagado));

  RETURN jsonb_build_object('plan_id', p_plan);
END;
$$;

-- 7.7 Cambiar vigencia (auditable)
CREATE OR REPLACE FUNCTION public.cambiar_vigencia_plan(p_colegio uuid, p_plan uuid, p_user uuid, p_nueva date)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_plan public.paquetes_vendidos%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.paquetes_vendidos WHERE id = p_plan AND colegio_id = p_colegio FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_no_encontrado'; END IF;
  IF v_plan.cancelado_at IS NOT NULL THEN RAISE EXCEPTION 'plan_cancelado'; END IF;
  IF p_nueva IS NOT NULL AND p_nueva < v_plan.fecha_inicio THEN RAISE EXCEPTION 'vigencia_invalida'; END IF;

  UPDATE public.paquetes_vendidos SET fecha_vencimiento = p_nueva WHERE id = p_plan;

  INSERT INTO public.log_auditoria_financiera (colegio_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo)
  VALUES (p_colegio, p_user, 'plan_vigencia_modificada', 'paquetes_vendidos', p_plan,
          jsonb_build_object('fecha_vencimiento', v_plan.fecha_vencimiento), jsonb_build_object('fecha_vencimiento', p_nueva));

  RETURN jsonb_build_object('plan_id', p_plan, 'fecha_vencimiento', p_nueva);
END;
$$;

-- Solo el backend (service_role) puede ejecutar estas funciones: reciben el colegio
-- como parámetro, por lo que nunca deben ser invocables con el JWT de un usuario.
REVOKE ALL ON FUNCTION public.registrar_pago_plan(uuid, uuid, uuid, integer, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vender_plan(uuid, uuid, uuid, uuid, date, date, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.planes_elegibles(uuid, uuid, uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consumir_sesion_plan(uuid, uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revertir_consumo_plan(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancelar_plan(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cambiar_vigencia_plan(uuid, uuid, uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pago_plan(uuid, uuid, uuid, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vender_plan(uuid, uuid, uuid, uuid, date, date, boolean, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.planes_elegibles(uuid, uuid, uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.consumir_sesion_plan(uuid, uuid, uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.revertir_consumo_plan(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_plan(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cambiar_vigencia_plan(uuid, uuid, uuid, date) TO service_role;

-- ---------------------------------------------------------------
-- 8. Cuenta corriente sin doble contabilización
--    - prestacion: monto = saldo a pagar por el paciente (monto_final). Lo cubierto
--      por un plan NO es facturación ni cobro (queda visible en cubierto_plan).
--    - plan: la venta del plan es el evento financiero (facturado / cobrado).
--    Solo se AGREGAN columnas al final (compatible con consumidores existentes).
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW public.cuenta_corriente_view AS
SELECT
  'mensualidad'::text                    AS origen,
  c.id                                    AS item_id,
  c.colegio_id,
  c.alumno_id,
  c.familia_id,
  co.nombre                               AS descripcion,
  make_date(c.anio, c.mes, 1)              AS fecha,
  c.fecha_vencimiento,
  c.monto                                 AS monto,
  0                                       AS descuento,
  c.monto_pagado                          AS monto_pagado,
  (c.monto - c.monto_pagado)              AS saldo,
  c.estado,
  c.medio_pago,
  NULL::uuid                              AS profesional_id,
  c.id                                    AS cobro_id,
  NULL::uuid                              AS cobro_sesion_id,
  NULL::uuid                              AS paquete_vendido_id,
  0                                       AS cubierto_plan
FROM public.cobros c
LEFT JOIN public.conceptos_cobro co ON co.id = c.concepto_id

UNION ALL

SELECT
  'prestacion'::text                      AS origen,
  cs.id                                    AS item_id,
  cs.colegio_id,
  cs.alumno_id,
  cs.familia_id,
  cs.descripcion,
  cs.fecha_sesion                          AS fecha,
  cs.fecha_sesion                          AS fecha_vencimiento,
  cs.monto_final                           AS monto,
  cs.descuento                             AS descuento,
  CASE WHEN cs.estado = 'pagado' THEN cs.monto_final ELSE 0 END AS monto_pagado,
  CASE WHEN cs.estado IN ('pagado', 'condonado', 'anulado') THEN 0 ELSE cs.monto_final END AS saldo,
  cs.estado,
  cs.medio_pago,
  cs.profesional_id,
  NULL::uuid                              AS cobro_id,
  cs.id                                    AS cobro_sesion_id,
  cs.paquete_vendido_id                    AS paquete_vendido_id,
  cs.monto_cubierto_plan                   AS cubierto_plan
FROM public.cobros_sesion cs

UNION ALL

SELECT
  'plan'::text                            AS origen,
  pv.id                                    AS item_id,
  pv.colegio_id,
  pv.alumno_id,
  pv.familia_id,
  ('Plan: ' || COALESCE(ps.nombre, 'Plan'))::text AS descripcion,
  pv.created_at::date                      AS fecha,
  NULL::date                              AS fecha_vencimiento,
  COALESCE(pv.precio_final, ps.precio_total) AS monto,
  GREATEST(COALESCE(pv.valor_original, 0) - COALESCE(pv.precio_final, 0), 0) AS descuento,
  pv.monto_pagado                          AS monto_pagado,
  CASE WHEN pv.cancelado_at IS NOT NULL THEN 0
       ELSE GREATEST(COALESCE(pv.precio_final, ps.precio_total) - pv.monto_pagado, 0) END AS saldo,
  (CASE WHEN pv.cancelado_at IS NOT NULL THEN 'anulado'
        WHEN pv.estado_pago = 'pagado' THEN 'pagado'
        WHEN pv.estado_pago = 'parcial' THEN 'parcial'
        ELSE 'pendiente' END)::text        AS estado,
  NULL::text                              AS medio_pago,
  NULL::uuid                              AS profesional_id,
  NULL::uuid                              AS cobro_id,
  NULL::uuid                              AS cobro_sesion_id,
  pv.id                                    AS paquete_vendido_id,
  0                                       AS cubierto_plan
FROM public.paquetes_vendidos pv
JOIN public.paquetes_sesion ps ON ps.id = pv.paquete_id;

GRANT SELECT ON public.cuenta_corriente_view TO authenticated;
GRANT SELECT ON public.cuenta_corriente_view TO service_role;

-- ---------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------
ALTER TABLE public.paquete_prestaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colegio: select paquete_prestaciones" ON public.paquete_prestaciones;
CREATE POLICY "colegio: select paquete_prestaciones" ON public.paquete_prestaciones
  FOR SELECT USING (colegio_id = public.mi_colegio_id());
GRANT SELECT ON public.paquete_prestaciones TO authenticated;
GRANT ALL ON public.paquete_prestaciones TO service_role;

ALTER TABLE public.plan_consumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finanzas: select plan_consumos" ON public.plan_consumos;
CREATE POLICY "finanzas: select plan_consumos" ON public.plan_consumos
  FOR SELECT USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus', 'finanzas'));
DROP POLICY IF EXISTS "apoderado: select own plan_consumos" ON public.plan_consumos;
CREATE POLICY "apoderado: select own plan_consumos" ON public.plan_consumos
  FOR SELECT USING (public.mi_rol() = 'apoderado' AND alumno_id IN (SELECT alumno_id FROM public.tutor_alumnos WHERE tutor_id = auth.uid()));
GRANT SELECT ON public.plan_consumos TO authenticated;
GRANT ALL ON public.plan_consumos TO service_role;

-- Endurecimiento: las políticas de 036 eran FOR ALL para cualquier usuario del colegio.
-- Toda escritura pasa por el backend (service_role), que valida rol y tenant.
DROP POLICY IF EXISTS "colegio: all paquetes_vendidos" ON public.paquetes_vendidos;
DROP POLICY IF EXISTS "finanzas: select paquetes_vendidos" ON public.paquetes_vendidos;
CREATE POLICY "finanzas: select paquetes_vendidos" ON public.paquetes_vendidos
  FOR SELECT USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus', 'finanzas'));
DROP POLICY IF EXISTS "apoderado: select own paquetes_vendidos" ON public.paquetes_vendidos;
CREATE POLICY "apoderado: select own paquetes_vendidos" ON public.paquetes_vendidos
  FOR SELECT USING (public.mi_rol() = 'apoderado' AND alumno_id IN (SELECT alumno_id FROM public.tutor_alumnos WHERE tutor_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.paquetes_vendidos FROM authenticated;

DROP POLICY IF EXISTS "colegio: all paquetes_sesion" ON public.paquetes_sesion;
DROP POLICY IF EXISTS "colegio: select paquetes_sesion" ON public.paquetes_sesion;
CREATE POLICY "colegio: select paquetes_sesion" ON public.paquetes_sesion
  FOR SELECT USING (colegio_id = public.mi_colegio_id());
REVOKE INSERT, UPDATE, DELETE ON public.paquetes_sesion FROM authenticated;

DROP POLICY IF EXISTS "colegio: all cobros_sesion" ON public.cobros_sesion;
DROP POLICY IF EXISTS "finanzas: select cobros_sesion" ON public.cobros_sesion;
CREATE POLICY "finanzas: select cobros_sesion" ON public.cobros_sesion
  FOR SELECT USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() IN ('super_admin', 'admin', 'pastor_campus', 'finanzas'));
DROP POLICY IF EXISTS "profesional: select own cobros_sesion" ON public.cobros_sesion;
CREATE POLICY "profesional: select own cobros_sesion" ON public.cobros_sesion
  FOR SELECT USING (colegio_id = public.mi_colegio_id() AND public.mi_rol() = 'tutor' AND profesional_id = auth.uid());
DROP POLICY IF EXISTS "apoderado: select own cobros_sesion" ON public.cobros_sesion;
CREATE POLICY "apoderado: select own cobros_sesion" ON public.cobros_sesion
  FOR SELECT USING (public.mi_rol() = 'apoderado' AND alumno_id IN (SELECT alumno_id FROM public.tutor_alumnos WHERE tutor_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.cobros_sesion FROM authenticated;
