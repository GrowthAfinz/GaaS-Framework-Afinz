CREATE TABLE IF NOT EXISTS public.gaas_update_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  source_type text NOT NULL DEFAULT 'paste' CHECK (source_type IN ('paste', 'csv', 'xlsx', 'manual')),
  source_label text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'reviewing', 'applied', 'failed', 'cancelled')),
  pasted_row_count integer NOT NULL DEFAULT 0,
  detected_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.gaas_dinamica_bi_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.gaas_update_runs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  source_block text NOT NULL CHECK (source_block IN ('whatsapp', 'email', 'sms', 'push', 'performance')),
  channel text NOT NULL,
  journey text,
  activity_name text NOT NULL,
  metric_date date NOT NULL,
  sent numeric,
  delivered numeric,
  opens numeric,
  clicks numeric,
  proposals numeric,
  approved numeric,
  finalized numeric,
  assisted numeric,
  independent numeric,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  natural_key text
);

CREATE TABLE IF NOT EXISTS public.gaas_update_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.gaas_update_runs(id) ON DELETE CASCADE,
  metric_id uuid REFERENCES public.gaas_dinamica_bi_metrics(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  status text NOT NULL CHECK (status IN ('ready', 'review', 'new', 'duplicate', 'error', 'ignored', 'applied')),
  match_count integer NOT NULL DEFAULT 0,
  field_to_review text,
  suggestion text,
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  previous_dispatches_count integer NOT NULL DEFAULT 0,
  suggested_dispatch_order text,
  dispatch_order_basis text,
  excel_tsv_row text,
  proposed_activity_update jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_gaas_update_runs_created_at
  ON public.gaas_update_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gaas_update_runs_status
  ON public.gaas_update_runs (status);

CREATE INDEX IF NOT EXISTS idx_gaas_dinamica_bi_metrics_run_id
  ON public.gaas_dinamica_bi_metrics (run_id);

CREATE INDEX IF NOT EXISTS idx_gaas_dinamica_bi_metrics_natural_key
  ON public.gaas_dinamica_bi_metrics (natural_key);

CREATE INDEX IF NOT EXISTS idx_gaas_dinamica_bi_metrics_date_channel
  ON public.gaas_dinamica_bi_metrics (metric_date, channel);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_run_id
  ON public.gaas_update_candidates (run_id);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_status
  ON public.gaas_update_candidates (status);

CREATE INDEX IF NOT EXISTS idx_gaas_update_candidates_activity_id
  ON public.gaas_update_candidates (activity_id);

ALTER TABLE public.gaas_update_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaas_dinamica_bi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaas_update_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read update runs"
  ON public.gaas_update_runs
  FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can create update runs"
  ON public.gaas_update_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can update their update runs"
  ON public.gaas_update_runs
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can delete their update runs"
  ON public.gaas_update_runs
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can read pasted metrics"
  ON public.gaas_dinamica_bi_metrics
  FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can create pasted metrics"
  ON public.gaas_dinamica_bi_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can update pasted metrics"
  ON public.gaas_dinamica_bi_metrics
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can delete pasted metrics"
  ON public.gaas_dinamica_bi_metrics
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can read update candidates"
  ON public.gaas_update_candidates
  FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can create update candidates"
  ON public.gaas_update_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can update their update candidates"
  ON public.gaas_update_candidates
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can delete their update candidates"
  ON public.gaas_update_candidates
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_update_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_dinamica_bi_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaas_update_candidates TO authenticated;
