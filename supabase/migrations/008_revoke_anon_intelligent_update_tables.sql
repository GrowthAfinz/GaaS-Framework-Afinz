REVOKE ALL ON public.gaas_update_runs FROM anon;
REVOKE ALL ON public.gaas_dinamica_bi_metrics FROM anon;
REVOKE ALL ON public.gaas_update_candidates FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_update_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_dinamica_bi_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_update_candidates TO authenticated;
