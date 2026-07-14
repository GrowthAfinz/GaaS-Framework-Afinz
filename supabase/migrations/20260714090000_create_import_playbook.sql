CREATE TABLE IF NOT EXISTS public.gaas_import_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  family_pattern text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  decisions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'certified', 'deprecated')),
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  confirmation_count integer NOT NULL DEFAULT 1,
  created_by uuid DEFAULT auth.uid(),
  certified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_key, version)
);

CREATE TABLE IF NOT EXISTS public.gaas_import_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.gaas_update_runs(id) ON DELETE SET NULL,
  candidate_fingerprint text NOT NULL,
  journey_family text NOT NULL,
  field text NOT NULL,
  previous_value text,
  chosen_value text,
  reason text NOT NULL,
  rule_id uuid REFERENCES public.gaas_import_rules(id) ON DELETE SET NULL,
  decision_type text NOT NULL CHECK (decision_type IN ('manual_override', 'journey_rename', 'rule_confirmation')),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gaas_import_rules_family_status
  ON public.gaas_import_rules (family_pattern, status);
CREATE INDEX IF NOT EXISTS idx_gaas_import_decisions_fingerprint
  ON public.gaas_import_decisions (candidate_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gaas_import_decisions_family
  ON public.gaas_import_decisions (journey_family, field, created_at DESC);

ALTER TABLE public.gaas_import_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaas_import_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read import rules"
  ON public.gaas_import_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create import rules"
  ON public.gaas_import_rules FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY "Rule owners can update import rules"
  ON public.gaas_import_rules FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can read import decisions"
  ON public.gaas_import_decisions FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
CREATE POLICY "Authenticated users can create import decisions"
  ON public.gaas_import_decisions FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.gaas_import_rules TO authenticated;
GRANT SELECT, INSERT ON public.gaas_import_decisions TO authenticated;

INSERT INTO public.gaas_import_rules (
  rule_key, version, family_pattern, conditions, decisions, status, confidence, confirmation_count
) VALUES (
  'acquisition.b2c.copa.abandoned_cart',
  1,
  'AQUISICAO_B2C_CARRINHO_*_COPA',
  '{"contains":["CARRINHO","COPA"],"objective":"Aquisicao"}'::jsonb,
  '{"segmento":"Abandonados","etapaAquisicao":"Reativacao","subgrupo":"Copa","canonicalJourneyToken":"CARRINHO_REATIVACAO_COPA"}'::jsonb,
  'certified',
  100,
  2
) ON CONFLICT (rule_key, version) DO NOTHING;
