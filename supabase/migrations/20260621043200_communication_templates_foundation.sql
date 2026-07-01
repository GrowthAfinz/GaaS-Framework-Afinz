-- Foundation for CRM communication identity, visual assets and AppsFlyer links.
-- This migration is intentionally backward-compatible: historical activities
-- remain valid while template coverage is built incrementally.

CREATE TABLE public.communication_templates (
  template_id text PRIMARY KEY,
  title text,
  channel text NOT NULL,
  family text,
  version_label text NOT NULL DEFAULT 'v001',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'superseded', 'archived')),
  source_system text NOT NULL DEFAULT 'manual',
  storage_bucket text NOT NULL DEFAULT 'crm-communications',
  original_path text,
  preview_path text,
  thumbnail_path text,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  content_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_templates_id_format
    CHECK (template_id ~ '^[A-Z0-9][A-Z0-9_-]{2,79}$')
);

COMMENT ON TABLE public.communication_templates IS
  'Reusable CRM communication content. Identity is stable across executions.';
COMMENT ON COLUMN public.communication_templates.template_id IS
  'Stable content identity, e.g. WPP-CARRINHO-01A. Excludes execution context.';
COMMENT ON COLUMN public.communication_templates.version_label IS
  'Human-readable asset/content version. Visible content changes create a new version.';

CREATE TABLE public.communication_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_name text NOT NULL,
  activity_name text NOT NULL,
  channel text NOT NULL,
  lifecycle_status text NOT NULL DEFAULT 'candidate'
    CHECK (lifecycle_status IN ('candidate', 'active', 'paused', 'retired')),
  coverage_status text NOT NULL DEFAULT 'unmapped'
    CHECK (coverage_status IN ('unmapped', 'partial', 'ready', 'blocked')),
  current_template_id text
    REFERENCES public.communication_templates(template_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  owner_id uuid,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'recent_activity', 'import')),
  first_seen_on date,
  last_seen_on date,
  effective_from date,
  effective_to date,
  last_reviewed_at timestamptz,
  review_due_on date,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_slots_identity_unique
    UNIQUE (journey_name, activity_name, channel),
  CONSTRAINT communication_slots_ready_requires_template
    CHECK (coverage_status <> 'ready' OR current_template_id IS NOT NULL),
  CONSTRAINT communication_slots_effective_period_valid
    CHECK (
      effective_to IS NULL
      OR effective_from IS NULL
      OR effective_to >= effective_from
    )
);

COMMENT ON TABLE public.communication_slots IS
  'Governed logical positions in CRM journeys. Active slots require operational coverage; historical activities remain optional.';
COMMENT ON COLUMN public.communication_slots.current_template_id IS
  'Template expected for the next execution. Executed activities preserve their own template_id.';
COMMENT ON COLUMN public.communication_slots.lifecycle_status IS
  'Explicit business decision; recurrence in activities only creates a candidate and never activates a slot automatically.';

ALTER TABLE public.activities
  ADD COLUMN template_id text;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.communication_templates(template_id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

COMMENT ON COLUMN public.activities.template_id IS
  'Reusable communication content used by this execution; distinct from Activity Name.';

CREATE TABLE public.attribution_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL
    REFERENCES public.activities(id) ON DELETE CASCADE,
  template_id text NOT NULL
    REFERENCES public.communication_templates(template_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'appsflyer'
    CHECK (provider IN ('appsflyer')),
  onelink_template_id text,
  base_url text NOT NULL,
  deep_link_value text NOT NULL DEFAULT 'pedido_cartao',
  generated_url text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  link_version integer NOT NULL DEFAULT 1 CHECK (link_version > 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'revoked', 'invalid')),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attribution_links_usage_version_unique
    UNIQUE (activity_id, template_id, deep_link_value, link_version)
);

COMMENT ON TABLE public.attribution_links IS
  'Versioned attribution link generated for one template used in one activity.';
COMMENT ON COLUMN public.attribution_links.onelink_template_id IS
  'AppsFlyer OneLink infrastructure template, distinct from CRM template_id.';

CREATE INDEX idx_communication_templates_channel_status
  ON public.communication_templates (channel, status);
CREATE INDEX idx_communication_templates_content_hash
  ON public.communication_templates (content_hash)
  WHERE content_hash IS NOT NULL;
CREATE INDEX idx_communication_slots_management
  ON public.communication_slots (lifecycle_status, coverage_status, review_due_on);
CREATE INDEX idx_communication_slots_current_template
  ON public.communication_slots (current_template_id)
  WHERE current_template_id IS NOT NULL;
CREATE INDEX idx_activities_template_id
  ON public.activities (template_id)
  WHERE template_id IS NOT NULL;
CREATE INDEX idx_attribution_links_activity_id
  ON public.attribution_links (activity_id);
CREATE INDEX idx_attribution_links_template_id
  ON public.attribution_links (template_id);
CREATE INDEX idx_attribution_links_status
  ON public.attribution_links (status);

ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read communication templates"
  ON public.communication_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create communication templates"
  ON public.communication_templates
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update communication templates"
  ON public.communication_templates
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete communication templates"
  ON public.communication_templates
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read communication slots"
  ON public.communication_slots
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create communication slots"
  ON public.communication_slots
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update communication slots"
  ON public.communication_slots
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete communication slots"
  ON public.communication_slots
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read attribution links"
  ON public.attribution_links
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create attribution links"
  ON public.attribution_links
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update attribution links"
  ON public.attribution_links
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attribution links"
  ON public.attribution_links
  FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.communication_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.communication_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.attribution_links TO authenticated;
REVOKE ALL ON public.communication_templates FROM anon;
REVOKE ALL ON public.communication_slots FROM anon;
REVOKE ALL ON public.attribution_links FROM anon;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-communications',
  'crm-communications',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/html'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Authenticated users can read CRM communication assets"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crm-communications');

CREATE POLICY "Authenticated users can upload CRM communication assets"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-communications');

CREATE POLICY "Authenticated users can update CRM communication assets"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-communications')
  WITH CHECK (bucket_id = 'crm-communications');

CREATE POLICY "Authenticated users can delete CRM communication assets"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-communications');
