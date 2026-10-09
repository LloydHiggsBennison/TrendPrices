-- Add fields already written by the API; preserve all existing analysis records.
BEGIN;
ALTER TABLE public.analisis_matematico
  ADD COLUMN IF NOT EXISTS proyeccion_7d jsonb,
  ADD COLUMN IF NOT EXISTS confianza_proyeccion numeric,
  ADD COLUMN IF NOT EXISTS factores_externos jsonb;
NOTIFY pgrst, 'reload schema';
COMMIT;
