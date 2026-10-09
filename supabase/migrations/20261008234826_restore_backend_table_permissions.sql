-- PriceTrend: restore only the backend permissions required by the existing API.
-- Target project: oaqwnxdtepynyerjymgk. Run as database owner after review.
-- No data is deleted; no access is granted to anon or authenticated.
BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE
  public.productos, public.tiendas, public.historial_precios TO service_role;
GRANT SELECT, INSERT ON TABLE
  public.analisis_matematico, public.recomendaciones TO service_role;

-- Keep all five tables protected by RLS for non-backend roles.
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_matematico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendaciones ENABLE ROW LEVEL SECURITY;

-- Grant only the identity sequences associated with these five tables.
DO $$
DECLARE
  table_name text;
  identity_sequence text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'productos', 'tiendas', 'historial_precios',
    'analisis_matematico', 'recomendaciones'
  ] LOOP
    identity_sequence := pg_get_serial_sequence(format('public.%I', table_name), 'id');
    IF identity_sequence IS NOT NULL THEN
      EXECUTE format('GRANT USAGE ON SEQUENCE %s TO service_role', identity_sequence);
    END IF;
  END LOOP;
END $$;

COMMIT;
