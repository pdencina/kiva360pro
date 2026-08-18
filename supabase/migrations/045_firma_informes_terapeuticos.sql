-- MIGRACIÓN 045 — Firma digital en informes terapéuticos
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS estado_firma text DEFAULT 'sin_enviar' CHECK (estado_firma IN ('sin_enviar', 'enviado', 'firmado'));
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS enviado_at timestamptz;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS email_enviado_a text;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firma_codigo text;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firma_codigo_expira timestamptz;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firmado_por text;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firmado_at timestamptz;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firma_ip text;
ALTER TABLE public.informes_terapeuticos ADD COLUMN IF NOT EXISTS firma_observacion text;
