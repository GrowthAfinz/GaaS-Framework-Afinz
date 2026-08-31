-- Fábrica de E-mails: camada semântica gerencial, guardrails e revisões externas.
-- O contrato técnico de dynamic_email_briefings.briefing_data permanece intocado.

create table public.dynamic_email_product_contexts (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  partner text,
  value_proposition text,
  differentiators text[] not null default '{}',
  eligible_audience text,
  tone_of_voice text,
  brand_context text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  valid_from date,
  valid_to date,
  version integer not null default 1 check (version > 0),
  provenance text,
  source_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table public.dynamic_email_product_guardrails (
  id uuid primary key default gen_random_uuid(),
  product_context_id uuid not null references public.dynamic_email_product_contexts(id) on delete cascade,
  guardrail_type text not null check (guardrail_type in ('benefit','claim','eligibility','legal','visual','tone','deeplink','prohibited')),
  title text not null,
  description text,
  rule_text text not null,
  severity text not null check (severity in ('hard_block','requires_review','advisory')),
  allowed_status text not null default 'allowed' check (allowed_status in ('allowed','conditional','blocked')),
  evidence text,
  source_url text,
  confidence numeric check (confidence is null or confidence between 0 and 1),
  valid_from date,
  valid_to date,
  applies_to jsonb not null default '{}'::jsonb,
  locked_for_ai boolean not null default true,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  version integer not null default 1 check (version > 0),
  owner_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table public.dynamic_email_ruler_strategies (
  id uuid primary key default gen_random_uuid(),
  partner text not null,
  product text,
  segment text not null,
  objective text,
  audience text,
  journey_stage text,
  narrative_transformation text,
  objections text[] not null default '{}',
  commercial_intensity text,
  success_criteria text,
  editorial_status text not null default 'needs_enrichment' check (editorial_status in ('needs_enrichment','draft','needs_review','ready','archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner, segment, product, version)
);

create table public.dynamic_email_email_strategies (
  id uuid primary key default gen_random_uuid(),
  ruler_strategy_id uuid references public.dynamic_email_ruler_strategies(id) on delete set null,
  campaign_group_id uuid not null,
  partner text not null,
  segment text not null,
  week_key text,
  sequence text,
  subject text,
  preheader text,
  role_in_ruler text,
  email_objective text,
  key_message text,
  expected_action text,
  value_proposition text,
  primary_benefit text,
  secondary_benefits jsonb not null default '[]'::jsonb,
  objection_addressed text,
  proof text,
  visual_hierarchy_strategy text,
  cta_strategy text,
  technical_status text not null default 'needs_review' check (technical_status in ('draft','needs_review','ready','blocked')),
  editorial_status text not null default 'needs_enrichment' check (editorial_status in ('needs_enrichment','draft','needs_review','ready','blocked')),
  visual_status text not null default 'needs_review' check (visual_status in ('draft','needs_review','ready','blocked')),
  certification_status text not null default 'not_tested' check (certification_status in ('not_tested','test_pending','certified','failed')),
  field_provenance jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_group_id)
);

create table public.dynamic_email_semantic_blocks (
  id uuid primary key default gen_random_uuid(),
  email_strategy_id uuid not null references public.dynamic_email_email_strategies(id) on delete cascade,
  position integer not null check (position > 0),
  block_type text not null check (block_type in ('opening','value_proposition','benefit','proof','comparison','conversion','trust','legal')),
  visual_priority text,
  intent text,
  technical_fields text[] not null default '{}',
  asset_id uuid references public.dynamic_email_assets(id) on delete set null,
  review_status text not null default 'needs_review' check (review_status in ('empty','draft','needs_review','approved')),
  origin text not null default 'derived' check (origin in ('human','ai','imported','derived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_strategy_id, position)
);

create table public.dynamic_email_cta_occurrences (
  id uuid primary key default gen_random_uuid(),
  email_strategy_id uuid not null references public.dynamic_email_email_strategies(id) on delete cascade,
  position integer not null check (position > 0),
  label text,
  destination text,
  intended_action text,
  role text,
  path_kind text not null default 'same_conversion' check (path_kind in ('same_conversion','alternate_path','unknown')),
  technical_field text not null,
  tracking_data jsonb not null default '{}'::jsonb,
  origin text not null default 'derived' check (origin in ('human','ai','imported','derived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_strategy_id, position, technical_field)
);

-- A aplicação não chama provedor de IA. Estes registros são criados por solicitação
-- humana e processados por um agente externo autorizado com acesso ao Supabase.
create table public.dynamic_email_ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('email','week','ruler','adaptation')),
  scope_id text not null,
  analysis_type text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled','conflict')),
  executor text not null default 'external_chat_agent',
  model_provider text,
  model_name text,
  prompt_version text,
  context_snapshot jsonb not null default '{}'::jsonb,
  guardrail_version jsonb not null default '{}'::jsonb,
  briefing_version integer,
  requested_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  safe_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dynamic_email_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.dynamic_email_ai_analysis_runs(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  field_name text not null,
  previous_value jsonb,
  suggested_value jsonb,
  justification text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence numeric check (confidence is null or confidence between 0 and 1),
  severity text not null default 'advisory' check (severity in ('hard_block','requires_review','advisory')),
  status text not null default 'suggested' check (status in ('suggested','accepted','edited','rejected','auto_applied')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dynamic_email_ruler_adaptations (
  id uuid primary key default gen_random_uuid(),
  source_ruler_strategy_id uuid references public.dynamic_email_ruler_strategies(id) on delete set null,
  target_partner text not null,
  target_product text,
  target_segment text not null,
  objective text,
  period_start date,
  period_end date,
  status text not null default 'planning' check (status in ('planning','drafting','review','approved','materialized','archived')),
  preservation_plan jsonb not null default '{}'::jsonb,
  required_changes jsonb not null default '{}'::jsonb,
  guardrail_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dynamic_email_management_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('product_context','guardrail','ruler_strategy','email_strategy','adaptation')),
  entity_id uuid not null,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  change_reason text,
  saved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);

create index dynamic_email_guardrails_context_idx on public.dynamic_email_product_guardrails(product_context_id, guardrail_type, severity, status);
create index dynamic_email_strategies_week_idx on public.dynamic_email_email_strategies(partner, segment, week_key, sequence);
create index dynamic_email_ai_runs_queue_idx on public.dynamic_email_ai_analysis_runs(status, created_at);
create index dynamic_email_suggestions_run_idx on public.dynamic_email_ai_suggestions(run_id, status);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'dynamic_email_product_contexts','dynamic_email_product_guardrails','dynamic_email_ruler_strategies',
    'dynamic_email_email_strategies','dynamic_email_semantic_blocks','dynamic_email_cta_occurrences',
    'dynamic_email_ai_analysis_runs','dynamic_email_ai_suggestions','dynamic_email_ruler_adaptations',
    'dynamic_email_management_versions'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'authenticated read ' || table_name, table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) is not null)', 'authenticated create ' || table_name, table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null)', 'authenticated update ' || table_name, table_name);
  end loop;
end $$;

-- Backfill seguro: uma estratégia gerencial por e-mail editorial. Campos interpretativos
-- permanecem vazios e o status deixa explícita a necessidade de enriquecimento humano.
insert into public.dynamic_email_email_strategies (
  campaign_group_id, partner, segment, week_key, sequence, subject, preheader,
  technical_status, editorial_status, visual_status, certification_status, field_provenance
)
select
  b.campaign_group_id,
  min(coalesce(b.partner, '')),
  min(coalesce(b.segment, '')),
  min(b.week_key),
  min(b.briefing_data->>'SEQUENCIA'),
  min(b.briefing_data->>'ASSUNTO'),
  min(b.briefing_data->>'PRE_CABECALHO'),
  case when bool_and(b.status in ('ready','exported','test_pending','certified')) then 'ready' else 'needs_review' end,
  'needs_enrichment',
  case when bool_and(coalesce(b.briefing_data->>'HEADER','') <> '') then 'needs_review' else 'blocked' end,
  case when bool_or(b.status = 'certified') then 'certified' when bool_or(b.status in ('exported','test_pending')) then 'test_pending' else 'not_tested' end,
  jsonb_build_object(
    'partner','derived:dynamic_email_briefings.partner',
    'segment','derived:dynamic_email_briefings.segment',
    'week_key','derived:dynamic_email_briefings.week_key',
    'sequence','derived:briefing_data.SEQUENCIA',
    'subject','derived:briefing_data.ASSUNTO',
    'preheader','derived:briefing_data.PRE_CABECALHO'
  )
from public.dynamic_email_briefings b
where b.campaign_group_id is not null
group by b.campaign_group_id
on conflict (campaign_group_id) do nothing;

insert into public.dynamic_email_semantic_blocks (email_strategy_id, position, block_type, visual_priority, intent, technical_fields, review_status, origin)
select s.id, v.position, v.block_type, v.visual_priority, null, v.technical_fields,
  case when v.has_content then 'needs_review' else 'empty' end, 'derived'
from public.dynamic_email_email_strategies s
join lateral (
  select b.briefing_data
  from public.dynamic_email_briefings b
  where b.campaign_group_id = s.campaign_group_id
  order by b.updated_at desc
  limit 1
) source on true
join lateral (
  select 1 position, 'opening' block_type, 'high' visual_priority, array['ASSUNTO','PRE_CABECALHO','HEADER']::text[] technical_fields,
    coalesce(s.subject,'') <> '' or coalesce(source.briefing_data->>'HEADER','') <> '' has_content
  union all select 2, 'value_proposition', 'high', array['TITULO_COPY_1_AZUL','COPY_1_PRETO']::text[],
    coalesce(source.briefing_data->>'TITULO_COPY_1_AZUL','') <> '' or coalesce(source.briefing_data->>'COPY_1_PRETO','') <> ''
  union all select 3, 'benefit', 'medium', array['TITULO_COPY_2','COPY_2_PRETO','BANNER_1_CORPO','BANNER_2_CORPO']::text[],
    coalesce(source.briefing_data->>'TITULO_COPY_2','') <> '' or coalesce(source.briefing_data->>'COPY_2_PRETO','') <> '' or coalesce(source.briefing_data->>'BANNER_1_CORPO','') <> '' or coalesce(source.briefing_data->>'BANNER_2_CORPO','') <> ''
  union all select 4, 'conversion', 'high', array['TITULO_CTA_1','LINK_CTA_1','TITULO_CTA_2','LINK_CTA_2']::text[],
    coalesce(source.briefing_data->>'TITULO_CTA_1','') <> '' or coalesce(source.briefing_data->>'TITULO_CTA_2','') <> ''
  union all select 5, 'trust', 'medium', array['BANNER_3_CORPO','NOTA_LEGAL','RODAPE']::text[],
    coalesce(source.briefing_data->>'BANNER_3_CORPO','') <> '' or coalesce(source.briefing_data->>'NOTA_LEGAL','') <> '' or coalesce(source.briefing_data->>'RODAPE','') <> ''
) v on true
on conflict (email_strategy_id, position) do nothing;

insert into public.dynamic_email_cta_occurrences (email_strategy_id, position, label, destination, technical_field, origin)
select distinct on (s.id, c.position)
  s.id, c.position, nullif(b.briefing_data->>c.label_field,''), nullif(b.briefing_data->>c.link_field,''), c.label_field, 'derived'
from public.dynamic_email_email_strategies s
join public.dynamic_email_briefings b on b.campaign_group_id = s.campaign_group_id
cross join (values (1,'TITULO_CTA_1','LINK_CTA_1'),(2,'TITULO_CTA_2','LINK_CTA_2')) c(position,label_field,link_field)
where coalesce(b.briefing_data->>c.label_field,'') <> '' or coalesce(b.briefing_data->>c.link_field,'') <> ''
order by s.id, c.position, b.updated_at desc
on conflict (email_strategy_id, position, technical_field) do nothing;

comment on table public.dynamic_email_ai_analysis_runs is 'Fila auditável de revisões solicitadas pelo operador e processadas fora do app por agente autorizado. Não executa IA automaticamente.';
comment on table public.dynamic_email_email_strategies is 'Camada gerencial versionada por campaign_group_id; não substitui o contrato SFMC de 36 colunas.';
comment on table public.dynamic_email_management_versions is 'Snapshots imutáveis das entidades gerenciais; alterações nunca sobrescrevem o histórico.';
