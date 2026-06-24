-- Operational audit detail for the Intelligent Updater.
-- Non-destructive: adds explainability for what was inserted, updated, skipped or blocked.

ALTER TABLE public.gaas_update_candidates
    ADD COLUMN IF NOT EXISTS operation_type TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS before_payload JSONB,
    ADD COLUMN IF NOT EXISTS after_payload JSONB,
    ADD COLUMN IF NOT EXISTS validation_after_save JSONB;

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_operation_type
    ON public.gaas_update_candidates (operation_type);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_idempotency_key
    ON public.gaas_update_candidates (idempotency_key);
