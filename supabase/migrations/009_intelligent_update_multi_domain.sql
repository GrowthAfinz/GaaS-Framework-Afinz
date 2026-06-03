-- Audit metadata for the Intelligent Updater domain orchestrator.
-- Non-destructive: keeps the original acquisition activity_id path intact.

ALTER TABLE public.gaas_update_runs
    ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'aquisicao';

ALTER TABLE public.gaas_dinamica_bi_metrics
    ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'aquisicao';

ALTER TABLE public.gaas_update_candidates
    ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'aquisicao',
    ADD COLUMN IF NOT EXISTS target_table TEXT,
    ADD COLUMN IF NOT EXISTS target_record_id TEXT;

UPDATE public.gaas_update_candidates
SET target_table = COALESCE(target_table, 'activities'),
    target_record_id = COALESCE(target_record_id, activity_id::TEXT)
WHERE target_table IS NULL
  AND activity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gaas_update_runs_domain
    ON public.gaas_update_runs (domain);

CREATE INDEX IF NOT EXISTS idx_gaas_dinamica_bi_metrics_domain
    ON public.gaas_dinamica_bi_metrics (domain);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_domain
    ON public.gaas_update_candidates (domain);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_target
    ON public.gaas_update_candidates (target_table, target_record_id);
