-- ============================================================
-- MIGRACIÓN 013 — Branding por colegio
-- Cada colegio puede tener su propio color y logo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE public.colegios ADD COLUMN IF NOT EXISTS color_primario text DEFAULT '#1a2332';
ALTER TABLE public.colegios ADD COLUMN IF NOT EXISTS color_acento text DEFAULT '#b8860b';
