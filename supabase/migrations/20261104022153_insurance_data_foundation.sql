begin;

create schema growth_data;

revoke all on schema growth_data from public, anon, authenticated;

create type growth_data.value_state as enum ('observed','zero_observed','missing','not_applicable');

create function growth_data.valid_measure(v numeric, s growth_data.value_state) returns boolean language sql immutable security invoker set search_path = '' as $$ select case when s = 'observed' then v is not null and v <> 0 and v::text not in ('NaN','Infinity','-Infinity') when s = 'zero_observed' then v = 0 when s in ('missing','not_applicable') then v is null else false end is true $$;

revoke all on function growth_data.valid_measure(numeric, growth_data.value_state) from public, anon, authenticated;

-- phase: foundation
create table growth_data.source_contracts (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  version integer not null check (version > 0),
  domain text not null check (domain in ('insurance','portfolio','media')),
  adapter text not null check (adapter in ('xlsx','sheets','existing_table','api')),
  parser_key text not null,
  grain_contract jsonb not null,
  authority_scope jsonb not null,
  layout_contract jsonb not null,
  status text not null check (status in ('draft','approved','retired')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (source_key, version)
);

alter table growth_data.source_contracts enable row level security;

revoke all on growth_data.source_contracts from public, anon, authenticated;

create index on growth_data.source_contracts (created_by);

-- phase: foundation
create table growth_data.ingest_batches (
  id uuid primary key default gen_random_uuid(),
  source_contract_id uuid not null references growth_data.source_contracts(id) on delete restrict,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  artifact_path text not null,
  parser_version text not null,
  declared_cutoff date null,
  observed_cutoff date null,
  status text not null check (status in ('received','parsing','staged','review','accepted','rejected','failed')),
  previous_batch_id uuid null references growth_data.ingest_batches(id) on delete restrict,
  manifest jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (source_contract_id, source_sha256, parser_version)
);

alter table growth_data.ingest_batches enable row level security;

revoke all on growth_data.ingest_batches from public, anon, authenticated;

create index on growth_data.ingest_batches (source_contract_id);

create index on growth_data.ingest_batches (previous_batch_id);

create index on growth_data.ingest_batches (created_by);

-- phase: foundation
create table growth_data.ingest_records (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references growth_data.ingest_batches(id) on delete restrict,
  record_key text not null,
  source_locator jsonb not null,
  raw_payload jsonb not null,
  normalized_payload jsonb null,
  classification text not null check (classification in ('input','derived','editorial','test_candidate','unresolved')),
  record_hash text not null,
  unique (batch_id, record_key),
  unique (id, batch_id)
);

alter table growth_data.ingest_records enable row level security;

revoke all on growth_data.ingest_records from public, anon, authenticated;

create index on growth_data.ingest_records (batch_id);

-- phase: foundation
create table growth_data.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  kind text not null check (kind in ('commercial_product','report_group')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

alter table growth_data.products enable row level security;

revoke all on growth_data.products from public, anon, authenticated;

create index on growth_data.products (created_by);

-- phase: foundation
create table growth_data.product_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references growth_data.products(id) on delete restrict,
  product_id uuid not null references growth_data.products(id) on delete restrict,
  valid_from date not null,
  valid_to date null,
  evidence_ref text not null,
  check (group_id <> product_id),
  check (valid_to is null or valid_to >= valid_from),
  unique (group_id, product_id, valid_from)
);

alter table growth_data.product_memberships enable row level security;

revoke all on growth_data.product_memberships from public, anon, authenticated;

create index on growth_data.product_memberships (group_id);

create index on growth_data.product_memberships (product_id);

-- phase: foundation
create table growth_data.populations (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null check (version > 0),
  definition text not null,
  dedup_scope text not null,
  time_basis text not null,
  comparability_group text null,
  contract jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (code, version)
);

alter table growth_data.populations enable row level security;

revoke all on growth_data.populations from public, anon, authenticated;

create index on growth_data.populations (created_by);

-- phase: foundation
create table growth_data.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null check (version > 0),
  unit text not null,
  aggregation_rule text not null check (aggregation_rule in ('sum','last_snapshot','ratio_of_sums','distinct_nonadditive','named_mean','scenario')),
  calculation_key text not null,
  calculation_version text not null,
  contract jsonb not null,
  status text not null check (status in ('draft','approved','retired')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (code, version)
);

alter table growth_data.metric_definitions enable row level security;

revoke all on growth_data.metric_definitions from public, anon, authenticated;

create index on growth_data.metric_definitions (created_by);

-- phase: foundation
create table growth_data.fact_revisions (
  id uuid primary key default gen_random_uuid(),
  fact_key text not null,
  family text not null check (family in ('dispatch','outcome','traffic','investment','portfolio')),
  revision integer not null check (revision > 0),
  batch_id uuid not null references growth_data.ingest_batches(id) on delete restrict,
  source_record_id uuid not null,
  supersedes_id uuid null references growth_data.fact_revisions(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  status text not null check (status in ('proposed','accepted','rejected')),
  unique (family, fact_key, revision),
  unique (id, family),
  unique (id, family, fact_key),
  unique (supersedes_id),
  foreign key (source_record_id, batch_id) references growth_data.ingest_records(id, batch_id) on delete restrict,
  check (supersedes_id is null or supersedes_id <> id)
);

alter table growth_data.fact_revisions enable row level security;

revoke all on growth_data.fact_revisions from public, anon, authenticated;

create index on growth_data.fact_revisions (batch_id);

create index on growth_data.fact_revisions (supersedes_id);

-- phase: foundation
create table growth_data.dispatch_facts (
  revision_id uuid primary key,
  family text not null default 'dispatch' check (family = 'dispatch'),
  product_id uuid null references growth_data.products(id) on delete restrict,
  population_id uuid not null references growth_data.populations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  existing_activity_id uuid null references public.rentabilizacao_activities(id) on delete restrict,
  channel_code text not null,
  journey_raw text null,
  activity_raw text null,
  source_dispatch_id text null,
  identity_status text not null check (identity_status in ('source_id','certified_match','provisional')),
  production_status text not null check (production_status in ('production','test','pending_review')),
  tariff_version_ref text null,
  currency text not null default 'BRL',
  sent bigint null check (sent >= 0),
  sent_state growth_data.value_state not null,
  delivered bigint null check (delivered >= 0),
  delivered_state growth_data.value_state not null,
  opens_unique bigint null check (opens_unique >= 0),
  opens_unique_state growth_data.value_state not null,
  reads bigint null check (reads >= 0),
  reads_state growth_data.value_state not null,
  clicks_unique bigint null check (clicks_unique >= 0),
  clicks_unique_state growth_data.value_state not null,
  failed bigint null check (failed >= 0),
  failed_state growth_data.value_state not null,
  undelivered bigint null check (undelivered >= 0),
  undelivered_state growth_data.value_state not null,
  unsubscribes bigint null check (unsubscribes >= 0),
  unsubscribes_state growth_data.value_state not null,
  lp_registrations bigint null check (lp_registrations >= 0),
  lp_registrations_state growth_data.value_state not null,
  unit_cost numeric(20,8) null check (unit_cost >= 0),
  unit_cost_state growth_data.value_state not null,
  communication_cost numeric(24,8) null check (communication_cost >= 0),
  communication_cost_state growth_data.value_state not null,
  foreign key (revision_id, family) references growth_data.fact_revisions(id, family) on delete restrict,
  check (period_end >= period_start),
  check (growth_data.valid_measure(sent, sent_state)),
  check (growth_data.valid_measure(delivered, delivered_state)),
  check (growth_data.valid_measure(opens_unique, opens_unique_state)),
  check (growth_data.valid_measure(reads, reads_state)),
  check (growth_data.valid_measure(clicks_unique, clicks_unique_state)),
  check (growth_data.valid_measure(failed, failed_state)),
  check (growth_data.valid_measure(undelivered, undelivered_state)),
  check (growth_data.valid_measure(unsubscribes, unsubscribes_state)),
  check (growth_data.valid_measure(lp_registrations, lp_registrations_state)),
  check (growth_data.valid_measure(unit_cost, unit_cost_state)),
  check (growth_data.valid_measure(communication_cost, communication_cost_state))
);

alter table growth_data.dispatch_facts enable row level security;

revoke all on growth_data.dispatch_facts from public, anon, authenticated;

create index on growth_data.dispatch_facts (product_id);

create index on growth_data.dispatch_facts (population_id);

create index on growth_data.dispatch_facts (existing_activity_id);

-- phase: foundation
create table growth_data.outcome_facts (
  revision_id uuid primary key,
  family text not null default 'outcome' check (family = 'outcome'),
  product_id uuid null references growth_data.products(id) on delete restrict,
  population_id uuid not null references growth_data.populations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  franchise_raw text null,
  origin_code text not null,
  time_basis text not null,
  attribution_rule_version text not null,
  count_method text not null,
  source_activated_count bigint null check (source_activated_count >= 0),
  source_activated_count_state growth_data.value_state not null,
  delivered_source_count bigint null check (delivered_source_count >= 0),
  delivered_source_count_state growth_data.value_state not null,
  lp_registrations bigint null check (lp_registrations >= 0),
  lp_registrations_state growth_data.value_state not null,
  effective_contracts bigint null check (effective_contracts >= 0),
  effective_contracts_state growth_data.value_state not null,
  company_new_sales bigint null check (company_new_sales >= 0),
  company_new_sales_state growth_data.value_state not null,
  cancelled_contracts bigint null check (cancelled_contracts >= 0),
  cancelled_contracts_state growth_data.value_state not null,
  foreign key (revision_id, family) references growth_data.fact_revisions(id, family) on delete restrict,
  check (period_end >= period_start),
  check (growth_data.valid_measure(source_activated_count, source_activated_count_state)),
  check (growth_data.valid_measure(delivered_source_count, delivered_source_count_state)),
  check (growth_data.valid_measure(lp_registrations, lp_registrations_state)),
  check (growth_data.valid_measure(effective_contracts, effective_contracts_state)),
  check (growth_data.valid_measure(company_new_sales, company_new_sales_state)),
  check (growth_data.valid_measure(cancelled_contracts, cancelled_contracts_state))
);

alter table growth_data.outcome_facts enable row level security;

revoke all on growth_data.outcome_facts from public, anon, authenticated;

create index on growth_data.outcome_facts (product_id);

create index on growth_data.outcome_facts (population_id);

-- phase: foundation
create table growth_data.traffic_facts (
  revision_id uuid primary key,
  family text not null default 'traffic' check (family = 'traffic'),
  product_id uuid null references growth_data.products(id) on delete restrict,
  population_id uuid not null references growth_data.populations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  surface_code text not null,
  origin_code text not null,
  session_definition_version text not null,
  coverage jsonb not null,
  sessions bigint null check (sessions >= 0),
  sessions_state growth_data.value_state not null,
  engaged_sessions bigint null check (engaged_sessions >= 0),
  engaged_sessions_state growth_data.value_state not null,
  registrations bigint null check (registrations >= 0),
  registrations_state growth_data.value_state not null,
  purchase_sessions bigint null check (purchase_sessions >= 0),
  purchase_sessions_state growth_data.value_state not null,
  foreign key (revision_id, family) references growth_data.fact_revisions(id, family) on delete restrict,
  check (period_end >= period_start),
  check (growth_data.valid_measure(sessions, sessions_state)),
  check (growth_data.valid_measure(engaged_sessions, engaged_sessions_state)),
  check (growth_data.valid_measure(registrations, registrations_state)),
  check (growth_data.valid_measure(purchase_sessions, purchase_sessions_state))
);

alter table growth_data.traffic_facts enable row level security;

revoke all on growth_data.traffic_facts from public, anon, authenticated;

create index on growth_data.traffic_facts (product_id);

create index on growth_data.traffic_facts (population_id);

-- phase: foundation
create table growth_data.investment_facts (
  revision_id uuid primary key,
  family text not null default 'investment' check (family = 'investment'),
  product_id uuid null references growth_data.products(id) on delete restrict,
  population_id uuid not null references growth_data.populations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  cost_type text not null,
  origin_code text not null,
  currency text not null default 'BRL',
  authority_status text not null check (authority_status in ('pending','authoritative','reconciliation_only')),
  amount numeric(24,8) null,
  amount_state growth_data.value_state not null,
  foreign key (revision_id, family) references growth_data.fact_revisions(id, family) on delete restrict,
  check (period_end >= period_start),
  check (growth_data.valid_measure(amount, amount_state))
);

alter table growth_data.investment_facts enable row level security;

revoke all on growth_data.investment_facts from public, anon, authenticated;

create index on growth_data.investment_facts (product_id);

create index on growth_data.investment_facts (population_id);

-- phase: portfolio_extension
create table growth_data.portfolio_observations (
  revision_id uuid primary key,
  family text not null default 'portfolio' check (family = 'portfolio'),
  product_id uuid null references growth_data.products(id) on delete restrict,
  population_id uuid not null references growth_data.populations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  metric_definition_id uuid not null references growth_data.metric_definitions(id) on delete restrict,
  branch_code text not null,
  scenario_kind text not null check (scenario_kind in ('actual','budget','forecast')),
  scenario_version_ref text null,
  measurement_regime text not null,
  value numeric(24,8) null,
  value_state growth_data.value_state not null,
  foreign key (revision_id, family) references growth_data.fact_revisions(id, family) on delete restrict,
  check (period_end >= period_start),
  check (growth_data.valid_measure(value, value_state)),
  check (scenario_kind = 'actual' or scenario_version_ref is not null)
);

alter table growth_data.portfolio_observations enable row level security;

revoke all on growth_data.portfolio_observations from public, anon, authenticated;

create index on growth_data.portfolio_observations (product_id);

create index on growth_data.portfolio_observations (population_id);

create index on growth_data.portfolio_observations (metric_definition_id);

-- phase: foundation
create table growth_data.reconciliations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references growth_data.ingest_batches(id) on delete restrict,
  rule_key text not null,
  rule_version text not null,
  scope_key text not null,
  severity text not null check (severity in ('info','warning','blocking')),
  evidence jsonb not null,
  status text not null check (status in ('open','resolved','accepted_limit')),
  reviewed_by uuid null references auth.users(id) on delete restrict,
  reviewed_at timestamptz null,
  resolution text null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

alter table growth_data.reconciliations enable row level security;

revoke all on growth_data.reconciliations from public, anon, authenticated;

create index on growth_data.reconciliations (batch_id);

create index on growth_data.reconciliations (reviewed_by);

create index on growth_data.reconciliations (created_by);

-- phase: foundation
create table growth_data.snapshots (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  period_start date not null,
  period_end date not null,
  semantic_version text not null,
  snapshot_hash text not null unique,
  status text not null check (status in ('building','built','certified','rejected')),
  manifest jsonb not null,
  report_run_id uuid null references public.report_runs(id) on delete restrict,
  certified_by uuid null references auth.users(id) on delete restrict,
  certified_at timestamptz null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  check (period_end >= period_start),
  check (status <> 'certified' or (certified_by is not null and certified_at is not null))
);

alter table growth_data.snapshots enable row level security;

revoke all on growth_data.snapshots from public, anon, authenticated;

create index on growth_data.snapshots (report_run_id);

create index on growth_data.snapshots (certified_by);

create index on growth_data.snapshots (created_by);

-- phase: foundation
create table growth_data.snapshot_revisions (
  snapshot_id uuid not null references growth_data.snapshots(id) on delete restrict,
  revision_id uuid not null,
  family text not null,
  fact_key text not null,
  primary key (snapshot_id, family, fact_key),
  foreign key (revision_id, family, fact_key) references growth_data.fact_revisions(id, family, fact_key) on delete restrict
);

alter table growth_data.snapshot_revisions enable row level security;

revoke all on growth_data.snapshot_revisions from public, anon, authenticated;

create index on growth_data.snapshot_revisions (snapshot_id);

-- phase: foundation
create table growth_data.content_bindings (
  id uuid primary key default gen_random_uuid(),
  binding_key text not null,
  version integer not null check (version > 0),
  target_kind text not null check (target_kind in ('xlsx_range','pptx_text','pptx_table','pptx_chart','app_module','wiki_data_block')),
  template_key text not null,
  template_version text not null,
  template_hash text null,
  target_locator jsonb not null,
  query_contract text not null,
  query_version text not null,
  filter_contract jsonb not null,
  note_id uuid null references public.gaas_vault_notes(id) on delete restrict,
  note_base_hash text null,
  missing_policy text not null,
  status text not null check (status in ('draft','approved','retired')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (binding_key, version),
  check (target_kind <> 'wiki_data_block' or note_id is not null)
);

alter table growth_data.content_bindings enable row level security;

revoke all on growth_data.content_bindings from public, anon, authenticated;

create index on growth_data.content_bindings (note_id);

create index on growth_data.content_bindings (created_by);

-- phase: foundation
create table growth_data.binding_metrics (
  binding_id uuid not null references growth_data.content_bindings(id) on delete restrict,
  metric_definition_id uuid not null references growth_data.metric_definitions(id) on delete restrict,
  primary key (binding_id, metric_definition_id)
);

alter table growth_data.binding_metrics enable row level security;

revoke all on growth_data.binding_metrics from public, anon, authenticated;

create index on growth_data.binding_metrics (binding_id);

create index on growth_data.binding_metrics (metric_definition_id);

-- phase: foundation
create table growth_data.snapshot_metrics (
  snapshot_id uuid not null references growth_data.snapshots(id) on delete restrict,
  metric_definition_id uuid not null references growth_data.metric_definitions(id) on delete restrict,
  primary key (snapshot_id, metric_definition_id)
);

alter table growth_data.snapshot_metrics enable row level security;

revoke all on growth_data.snapshot_metrics from public, anon, authenticated;

create index on growth_data.snapshot_metrics (snapshot_id);

create index on growth_data.snapshot_metrics (metric_definition_id);

-- phase: foundation
create table growth_data.snapshot_bindings (
  snapshot_id uuid not null references growth_data.snapshots(id) on delete restrict,
  binding_id uuid not null references growth_data.content_bindings(id) on delete restrict,
  primary key (snapshot_id, binding_id)
);

alter table growth_data.snapshot_bindings enable row level security;

revoke all on growth_data.snapshot_bindings from public, anon, authenticated;

create index on growth_data.snapshot_bindings (snapshot_id);

create index on growth_data.snapshot_bindings (binding_id);

-- phase: foundation
create table growth_data.note_impacts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references growth_data.snapshots(id) on delete restrict,
  binding_id uuid not null references growth_data.content_bindings(id) on delete restrict,
  note_id uuid not null references public.gaas_vault_notes(id) on delete restrict,
  base_content_hash text not null,
  change_kind text not null check (change_kind in ('data_block','editorial_proposal','historical_append')),
  contribution_id uuid null references public.gaas_knowledge_contributions(id) on delete restrict,
  evidence jsonb not null,
  status text not null check (status in ('identified','ready','conflict','proposed','applied','not_applicable')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (snapshot_id, binding_id, note_id, change_kind)
);

alter table growth_data.note_impacts enable row level security;

revoke all on growth_data.note_impacts from public, anon, authenticated;

create index on growth_data.note_impacts (snapshot_id);

create index on growth_data.note_impacts (binding_id);

create index on growth_data.note_impacts (note_id);

create index on growth_data.note_impacts (contribution_id);

create index on growth_data.note_impacts (created_by);

-- phase: foundation
create table growth_data.output_artifacts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references growth_data.snapshots(id) on delete restrict,
  report_run_id uuid null references public.report_runs(id) on delete restrict,
  report_publication_id uuid null references public.report_publications(id) on delete restrict,
  artifact_kind text not null check (artifact_kind in ('xlsx','pptx','pdf','manifest')),
  template_key text not null,
  template_version text not null,
  renderer_version text not null,
  storage_path text not null,
  sha256 text not null,
  qa_status text not null check (qa_status in ('pending','passed','failed')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (snapshot_id, artifact_kind, template_key, template_version, renderer_version)
);

alter table growth_data.output_artifacts enable row level security;

revoke all on growth_data.output_artifacts from public, anon, authenticated;

create index on growth_data.output_artifacts (snapshot_id);

create index on growth_data.output_artifacts (report_run_id);

create index on growth_data.output_artifacts (report_publication_id);

create index on growth_data.output_artifacts (created_by);

-- phase: foundation
create table growth_data.responsibilities (
  id uuid primary key default gen_random_uuid(),
  source_contract_id uuid null references growth_data.source_contracts(id) on delete restrict,
  metric_definition_id uuid null references growth_data.metric_definitions(id) on delete restrict,
  binding_id uuid null references growth_data.content_bindings(id) on delete restrict,
  principal_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('source_owner','metric_owner','pipeline_owner','publication_reviewer')),
  valid_from date not null,
  valid_to date null,
  check (num_nonnulls(source_contract_id, metric_definition_id, binding_id) = 1),
  check (valid_to is null or valid_to >= valid_from)
);

alter table growth_data.responsibilities enable row level security;

revoke all on growth_data.responsibilities from public, anon, authenticated;

create index on growth_data.responsibilities (source_contract_id);

create index on growth_data.responsibilities (metric_definition_id);

create index on growth_data.responsibilities (binding_id);

create index on growth_data.responsibilities (principal_id);

create index on growth_data.fact_revisions (source_record_id, batch_id);

create index on growth_data.snapshot_revisions (revision_id);

create index on growth_data.dispatch_facts (period_start, product_id, channel_code);

create index on growth_data.outcome_facts (period_start, product_id, population_id);

create index on growth_data.traffic_facts (period_start, product_id);

create index on growth_data.investment_facts (period_start, product_id);

-- No frontend grants, no policies, no service credentials or new publication pointer in this draft.


-- Runtime appended to the generated foundation migration. Private data, public invoker RPCs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('insurance-reports','insurance-reports',false,31457280,array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/zip','application/json']) on conflict(id) do nothing;
create policy insurance_sources_read on storage.objects for select to authenticated using(bucket_id='insurance-reports' and exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active));
create policy insurance_sources_insert on storage.objects for insert to authenticated with check(bucket_id='insurance-reports' and split_part(name,'/',2)=(select auth.uid())::text and split_part(name,'/',1) in ('sources','artifacts') and exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active and m.role in ('analyst','publisher','admin')));
create table growth_data.certification_reviews (
 snapshot_id uuid primary key references growth_data.snapshots(id),
 reviewer_id uuid not null references auth.users(id), reviewed_at timestamptz not null default now(), resolutions jsonb not null
);
alter table growth_data.certification_reviews enable row level security;
revoke all on growth_data.certification_reviews from public,anon,authenticated;
create function growth_data.require_role(write_access boolean default false, certify boolean default false)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.report_live_memberships m where m.user_id=auth.uid() and m.active
 and (not write_access or m.role in ('analyst','publisher','admin')) and (not certify or m.role in ('publisher','admin')))
 then raise exception 'ACCESS_DENIED'; end if;
end $$;

create function growth_data.immutable_snapshot_child() returns trigger language plpgsql security invoker set search_path='' as $$
declare sid uuid;
begin
 sid:=case when TG_OP='DELETE' then OLD.snapshot_id else NEW.snapshot_id end;
 perform 1 from growth_data.snapshots where id=sid for update;
 if exists(select 1 from growth_data.snapshots where id=sid and status='certified') then raise exception 'SNAPSHOT_IMMUTABLE';end if;
 if TG_OP='UPDATE' and OLD.snapshot_id<>NEW.snapshot_id then raise exception 'SNAPSHOT_VERSION_CONFLICT';end if;
 if TG_OP='DELETE' then return OLD;end if;return NEW;
end $$;
create trigger snapshot_revisions_immutable before insert or update or delete on growth_data.snapshot_revisions for each row execute function growth_data.immutable_snapshot_child();
create trigger snapshot_metrics_immutable before insert or update or delete on growth_data.snapshot_metrics for each row execute function growth_data.immutable_snapshot_child();
create trigger snapshot_bindings_immutable before insert or update or delete on growth_data.snapshot_bindings for each row execute function growth_data.immutable_snapshot_child();

create function growth_data.snapshot_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if OLD.status='certified' then raise exception 'SNAPSHOT_IMMUTABLE';end if;
 if TG_OP='DELETE' then return OLD;end if;
 if NEW.manifest<>OLD.manifest or NEW.snapshot_hash<>OLD.snapshot_hash or NEW.period_start<>OLD.period_start or NEW.period_end<>OLD.period_end then raise exception 'SNAPSHOT_VERSION_CONFLICT';end if;
 return NEW;
end $$;
create trigger snapshot_guard before update or delete on growth_data.snapshots for each row execute function growth_data.snapshot_guard();

create function growth_data.revision_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare previous growth_data.fact_revisions;
begin
 if TG_OP<>'INSERT' and OLD.status='accepted' then raise exception 'FACT_IMMUTABLE';end if;
 if TG_OP='DELETE' then return OLD;end if;
 if NEW.supersedes_id is not null then
 select * into strict previous from growth_data.fact_revisions where id=NEW.supersedes_id for update;
 if previous.family<>NEW.family or previous.fact_key<>NEW.fact_key or previous.revision+1<>NEW.revision then raise exception 'FACT_REVISION_CONFLICT';end if;
 elsif NEW.revision<>1 then raise exception 'FACT_REVISION_CONFLICT';end if;
 return NEW;
end $$;
create trigger revision_guard before insert or update or delete on growth_data.fact_revisions for each row execute function growth_data.revision_guard();
create function growth_data.fact_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from growth_data.fact_revisions where id=OLD.revision_id and status='accepted') then raise exception 'FACT_IMMUTABLE';end if;
 if TG_OP='DELETE' then return OLD;end if;return NEW;
end $$;
create trigger outcome_immutable before update or delete on growth_data.outcome_facts for each row execute function growth_data.fact_guard();
create trigger dispatch_immutable before update or delete on growth_data.dispatch_facts for each row execute function growth_data.fact_guard();
create trigger traffic_immutable before update or delete on growth_data.traffic_facts for each row execute function growth_data.fact_guard();
create trigger investment_immutable before update or delete on growth_data.investment_facts for each row execute function growth_data.fact_guard();
create trigger portfolio_immutable before update or delete on growth_data.portfolio_observations for each row execute function growth_data.fact_guard();
create function growth_data.registry_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_TABLE_NAME='metric_definitions' then
 if exists(select 1 from growth_data.snapshot_metrics sm join growth_data.snapshots s on s.id=sm.snapshot_id where sm.metric_definition_id=OLD.id and s.status='certified') then raise exception 'SNAPSHOT_IMMUTABLE';end if;
 elsif TG_TABLE_NAME='content_bindings' then
 if exists(select 1 from growth_data.snapshot_bindings sb join growth_data.snapshots s on s.id=sb.snapshot_id where sb.binding_id=OLD.id and s.status='certified') then raise exception 'SNAPSHOT_IMMUTABLE';end if;
 elsif TG_TABLE_NAME='source_contracts' then
 if exists(select 1 from growth_data.ingest_batches b where b.source_contract_id=OLD.id) then raise exception 'SOURCE_CONTRACT_IMMUTABLE';end if;
 end if;
 if TG_OP='DELETE' then return OLD;end if;return NEW;
end $$;
create trigger metric_registry_immutable before update or delete on growth_data.metric_definitions for each row execute function growth_data.registry_guard();
create trigger binding_registry_immutable before update or delete on growth_data.content_bindings for each row execute function growth_data.registry_guard();
create trigger source_registry_immutable before update or delete on growth_data.source_contracts for each row execute function growth_data.registry_guard();

create function growth_data.packet_number(packet jsonb,product text,period text,code text) returns numeric language sql immutable security invoker set search_path='' as $$
 select (m->>'value')::numeric from jsonb_array_elements(packet->'metrics') m where m->>'product'=product and m->>'period'=period and m->>'code'=code
$$;
create function growth_data.put_dispatches(packet jsonb,sid uuid,batch uuid,record_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare d jsonb; payload jsonb;popid uuid;pid uuid;rev uuid;previous growth_data.fact_revisions;k text;field text;v numeric;day date;
begin
 perform growth_data.require_role(true,false);
 insert into growth_data.populations(code,version,definition,dedup_scope,time_basis,contract,created_by)
 values('insurance:dispatch_exposures',1,'Ocorrências de comunicação; não pessoas únicas','per_source_occurrence','send_date','{}',auth.uid()) on conflict(code,version) do nothing;
 select id into popid from growth_data.populations where code='insurance:dispatch_exposures' and version=1;
 for d in select value from jsonb_array_elements(packet->'dispatches') loop
 day:=(d->>'date')::date;k:='source_block:'||batch::text||':'||(d->>'block')||':'||(d->>'row');
 perform pg_advisory_xact_lock(hashtextextended('dispatch:'||k,0));
 previous:=null;select * into previous from growth_data.fact_revisions where family='dispatch' and fact_key=k order by revision desc limit 1;
 insert into growth_data.fact_revisions(fact_key,family,revision,batch_id,source_record_id,supersedes_id,status)
 values(k,'dispatch',coalesce(previous.revision,0)+1,batch,record_id,previous.id,'proposed') returning id into rev;
 pid:=null;select id into pid from growth_data.products where code=case when upper(d->>'journey') like '%MULHER%' then 'mulher' when upper(d->>'journey') like '%RESID%' then 'residencial' end;
 payload:=jsonb_build_object('revision_id',rev,'family','dispatch','product_id',pid,'population_id',popid,'period_start',day,'period_end',day,'channel_code',d->>'block','journey_raw',d->>'journey','identity_status','provisional','production_status',case when (d->>'test')::boolean then 'test' else 'pending_review' end,'currency','BRL');
 foreach field in array array['sent','delivered','opens_unique','reads','clicks_unique','failed','undelivered','unsubscribes','lp_registrations','unit_cost','communication_cost'] loop
 v:=(d->>field)::numeric;payload:=payload||jsonb_build_object(field,v,field||'_state',case when v is null and ((field in ('opens_unique','clicks_unique','unsubscribes') and d->>'block'<>'email') or (field in ('reads','failed') and d->>'block'<>'whatsapp') or (field='undelivered' and d->>'block'<>'sms')) then 'not_applicable' when v is null then 'missing' when v=0 then 'zero_observed' else 'observed' end);
 end loop;
 insert into growth_data.dispatch_facts select (jsonb_populate_record(null::growth_data.dispatch_facts,payload)).*;
 insert into growth_data.snapshot_revisions(snapshot_id,revision_id,family,fact_key) values(sid,rev,'dispatch',k);
 end loop;
end $$;
create function growth_data.put_outcomes(packet jsonb,sid uuid,batch uuid,record_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare prod text; per text; pop text; pid uuid; popid uuid; rev uuid; previous growth_data.fact_revisions; k text;
 a numeric;b numeric;c numeric;d numeric;
begin
 perform growth_data.require_role(true,false);
 for prod in select distinct m->>'product' from jsonb_array_elements(packet->'metrics') m loop
 insert into growth_data.products(code,display_name,kind,created_by) values(prod,prod,'report_group',auth.uid()) on conflict(code) do nothing;
 select id into pid from growth_data.products where code=prod;
 for per in select distinct m->>'period' from jsonb_array_elements(packet->'metrics') m where m->>'period'<>'window_total' order by 1 loop
 for pop in select unnest(array['activated','digital','company']) loop
 insert into growth_data.populations(code,version,definition,dedup_scope,time_basis,contract,created_by)
 values('insurance:'||pop,1,'Universo '||pop||' da fonte recebida','source_scope_requires_review','launch_month','{"review_required":true}',auth.uid()) on conflict(code,version) do nothing;
 select id into popid from growth_data.populations where code='insurance:'||pop and version=1;
 k:=prod||':'||per||':'||pop;perform pg_advisory_xact_lock(hashtextextended('outcome:'||k,0));
 previous:=null;select * into previous from growth_data.fact_revisions where family='outcome' and fact_key=k order by revision desc limit 1;
 insert into growth_data.fact_revisions(fact_key,family,revision,batch_id,source_record_id,supersedes_id,status)
 values(k,'outcome',coalesce(previous.revision,0)+1,batch,record_id,previous.id,'proposed') returning id into rev;
 a:=case when pop='activated' then growth_data.packet_number(packet,prod,per,'source_activated_count') end;
 b:=case when pop='activated' then growth_data.packet_number(packet,prod,per,'registrations_activated') when pop='digital' then growth_data.packet_number(packet,prod,per,'registrations_digital') end;
 c:=case when pop='activated' then growth_data.packet_number(packet,prod,per,'contracts_activated') when pop='digital' then growth_data.packet_number(packet,prod,per,'contracts_digital') end;
 d:=case when pop='company' then growth_data.packet_number(packet,prod,per,'company_new_sales') end;
 insert into growth_data.outcome_facts(revision_id,product_id,population_id,period_start,period_end,origin_code,time_basis,attribution_rule_version,count_method,
 source_activated_count,source_activated_count_state,delivered_source_count,delivered_source_count_state,lp_registrations,lp_registrations_state,effective_contracts,effective_contracts_state,company_new_sales,company_new_sales_state,cancelled_contracts,cancelled_contracts_state)
 values(rev,pid,popid,(per||'-01')::date,((per||'-01')::date+interval '1 month - 1 day')::date,pop,'launch_month','source/1','source_aggregate',
 a,case when a is null then 'missing' when a=0 then 'zero_observed' else 'observed' end::growth_data.value_state,null,'missing',
 b,case when b is null then 'missing' when b=0 then 'zero_observed' else 'observed' end::growth_data.value_state,
 c,case when c is null then 'missing' when c=0 then 'zero_observed' else 'observed' end::growth_data.value_state,
 d,case when d is null then 'missing' when d=0 then 'zero_observed' else 'observed' end::growth_data.value_state,null,'missing');
 insert into growth_data.snapshot_revisions(snapshot_id,revision_id,family,fact_key) values(sid,rev,'outcome',k);
 end loop;end loop;end loop;
end $$;
create function growth_data.number_state(v numeric) returns growth_data.value_state language sql immutable security invoker set search_path='' as $$select case when v is null then 'missing' when v=0 then 'zero_observed' else 'observed' end::growth_data.value_state$$;
create function growth_data.put_period_measures(packet jsonb,sid uuid,batch uuid,record_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare prod text;per text;fam text;cost text;pid uuid;popid uuid;rev uuid;k text;previous growth_data.fact_revisions;v numeric;body jsonb;
begin
 perform growth_data.require_role(true,false);
 for prod in select distinct m->>'product' from jsonb_array_elements(packet->'metrics') m loop
 select id into pid from growth_data.products where code=prod;
 for per in select distinct m->>'period' from jsonb_array_elements(packet->'metrics') m where m->>'period'<>'window_total' order by 1 loop
 foreach fam in array array['traffic','investment'] loop
 insert into growth_data.populations(code,version,definition,dedup_scope,time_basis,contract,created_by)
 values('insurance:'||fam,1,'Universo da fonte de '||fam,'source_scope','calendar_month','{"definition_review_required":true}',auth.uid()) on conflict(code,version) do nothing;
 select id into popid from growth_data.populations where code='insurance:'||fam and version=1;
 for cost in select unnest(case when fam='traffic' then array['sessions'] else array['crm_cost','media_spend'] end) loop
 k:=prod||':'||per||':'||cost;perform pg_advisory_xact_lock(hashtextextended(fam||':'||k,0));
 previous:=null;select * into previous from growth_data.fact_revisions where family=fam and fact_key=k order by revision desc limit 1;
 insert into growth_data.fact_revisions(fact_key,family,revision,batch_id,source_record_id,supersedes_id,status)
 values(k,fam,coalesce(previous.revision,0)+1,batch,record_id,previous.id,'proposed') returning id into rev;
 v:=growth_data.packet_number(packet,prod,per,cost);
 body:=jsonb_build_object('revision_id',rev,'family',fam,'product_id',pid,'population_id',popid,'period_start',(per||'-01')::date,'period_end',((per||'-01')::date+interval '1 month - 1 day')::date);
 if fam='traffic' then
 body:=body||jsonb_build_object('surface_code','insurance_lp','origin_code','all_reported','session_definition_version','source/1','coverage',packet->'issues','sessions',v,'sessions_state',growth_data.number_state(v),'engaged_sessions_state','missing','registrations_state','not_applicable','purchase_sessions_state','missing');
 insert into growth_data.traffic_facts select (jsonb_populate_record(null::growth_data.traffic_facts,body)).*;
 else
 body:=body||jsonb_build_object('cost_type',cost,'origin_code',cost,'currency','BRL','authority_status','pending','amount',v,'amount_state',growth_data.number_state(v));
 insert into growth_data.investment_facts select (jsonb_populate_record(null::growth_data.investment_facts,body)).*;
 end if;
 insert into growth_data.snapshot_revisions(snapshot_id,revision_id,family,fact_key) values(sid,rev,fam,k);
 end loop;end loop;end loop;end loop;
end $$;
create function growth_data.put_portfolio(packet jsonb,sid uuid,batch uuid,record_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare obs jsonb;mid uuid;popid uuid;rev uuid;previous growth_data.fact_revisions;k text;
begin
 perform growth_data.require_role(true,false);
 insert into growth_data.populations(code,version,definition,dedup_scope,time_basis,contract,created_by)
 values('insurance:portfolio_total',1,'Estoques de seguros e contas vivas da companhia; não se limitam aos produtos digitais','source_company_total','calendar_month','{}',auth.uid()) on conflict(code,version) do nothing;
 select id into popid from growth_data.populations where code='insurance:portfolio_total' and version=1;
 for obs in select value from jsonb_array_elements(coalesce(packet->'portfolio','[]')) loop
 insert into growth_data.metric_definitions(code,version,unit,aggregation_rule,calculation_key,calculation_version,contract,status,created_by)
 values('portfolio:'||(obs->>'code'),1,obs->>'unit',obs->>'aggregation','insurance:portfolio:'||(obs->>'code'),'1','{"scope":"company_total","source":"Base Seguros"}','draft',auth.uid()) on conflict(code,version) do nothing;
 select id into mid from growth_data.metric_definitions where code='portfolio:'||(obs->>'code') and version=1;
 insert into growth_data.snapshot_metrics(snapshot_id,metric_definition_id) values(sid,mid) on conflict do nothing;
 k:='company:'||(obs->>'code')||':'||(obs->>'period');perform pg_advisory_xact_lock(hashtextextended('portfolio:'||k,0));
 previous:=null;select * into previous from growth_data.fact_revisions where family='portfolio' and fact_key=k order by revision desc limit 1;
 insert into growth_data.fact_revisions(fact_key,family,revision,batch_id,source_record_id,supersedes_id,status)
 values(k,'portfolio',coalesce(previous.revision,0)+1,batch,record_id,previous.id,'proposed') returning id into rev;
 insert into growth_data.portfolio_observations(revision_id,population_id,period_start,period_end,metric_definition_id,branch_code,scenario_kind,measurement_regime,value,value_state)
 values(rev,popid,((obs->>'period')||'-01')::date,(((obs->>'period')||'-01')::date+interval '1 month - 1 day')::date,mid,'company_total','actual','source:base_seguros/1',(obs->>'value')::numeric,(obs->>'state')::growth_data.value_state);
 insert into growth_data.snapshot_revisions(snapshot_id,revision_id,family,fact_key) values(sid,rev,'portfolio',k);
 end loop;
end $$;

create function growth_data.save_snapshot(packet jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid; digest text; src jsonb; rec jsonb; contract_id uuid; batch uuid; rid uuid; mid uuid; m jsonb; metric_code text; seen text[]:='{}'; insurance_batch uuid; insurance_record uuid; dispatch_record uuid; source_identity text; bid uuid; bindingcode text; note_row record; reportid uuid;
begin
 perform growth_data.require_role(true,false);
 if packet->>'version'<>'insurance/1' or jsonb_typeof(packet->'sources')<>'array' or jsonb_array_length(packet->'sources') not between 1 and 4
 or jsonb_typeof(packet->'metrics')<>'array' or jsonb_array_length(packet->'metrics') not between 1 and 10000
 or octet_length(packet::text)>15000000 then raise exception 'INVALID_PACKET';end if;
 if not exists(select 1 from jsonb_array_elements(packet->'sources') s where s->'sheets'?'Resumo Comitê' and s->'sheets'?'Base de disparos') then raise exception 'SOURCE_LAYOUT_CHANGED';end if;
 if exists(select 1 from jsonb_array_elements(packet->'metrics') x where x->>'state' not in ('observed','zero_observed','missing','not_applicable')
 or not growth_data.valid_measure((x->>'value')::numeric,(x->>'state')::growth_data.value_state)) then raise exception 'INVALID_METRIC_STATE';end if;
 if (select count(*) from jsonb_array_elements(packet->'metrics'))<>(select count(distinct (x->>'product',x->>'period',x->>'code')) from jsonb_array_elements(packet->'metrics') x) then raise exception 'DUPLICATE_METRIC';end if;
 if exists(select 1 from jsonb_array_elements(packet->'metrics') x where coalesce(x->>'product','') not in ('mulher','residencial') or coalesce(x->>'unit','') not in ('count','ratio','BRL') or coalesce(x->>'period','')!~'^(window_total|[0-9]{4}-(0[1-9]|1[0-2]))$') then raise exception 'INVALID_METRIC_SCOPE';end if;
 if not exists(select 1 from jsonb_array_elements(packet->'issues') i where i->>'code'='SOURCE_SCOPE_REVIEW' and i->>'severity'='blocking')
 or not exists(select 1 from jsonb_array_elements(packet->'issues') i where i->>'code'='CACHED_INPUTS_REVIEW' and i->>'severity'='blocking') then raise exception 'REVIEW_CONTRACT_MISSING';end if;
 if exists(select 1 from jsonb_array_elements(packet->'metrics') x where x->>'unit'='count' and ((x->>'value')::numeric<0 or mod((x->>'value')::numeric,1)<>0)) then raise exception 'INVALID_COUNT';end if;
 digest:=encode(sha256(convert_to(((packet-'sources')||jsonb_build_object('sources',(select jsonb_agg(s-'storage_path') from jsonb_array_elements(packet->'sources') s)))::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended('insurance:'||digest,0));
 select id into sid from growth_data.snapshots where snapshot_hash=digest;
 if sid is not null then return jsonb_build_object('id',sid,'reused',true);end if;
 insert into public.report_runs(report_type,report_profile,period_start,period_end,status,run_mode,build_status,certification_status,publication_status,requested_by,publication_valid,run_manifest)
 values('insurance_committee','insurance_summary',(packet->>'periodStart')::date,(packet->>'periodEnd')::date,'built','build','built','pending','pending',auth.uid(),false,jsonb_build_object('domain','insurance','snapshot_hash',digest)) returning id into reportid;
 insert into public.report_frozen_inputs(run_id,inputs) values(reportid,packet);
 insert into growth_data.snapshots(domain,period_start,period_end,semantic_version,snapshot_hash,status,manifest,created_by)
 values('insurance',(packet->>'periodStart')::date,(packet->>'periodEnd')::date,'insurance/1',digest,'building',packet,auth.uid()) returning id into sid;
 update growth_data.snapshots set report_run_id=reportid where id=sid;
 for src in select value from jsonb_array_elements(packet->'sources') loop
 if coalesce(src->>'sha256','')!~'^[0-9a-f]{64}$' or length(coalesce(src->>'name',''))=0 then raise exception 'INVALID_SOURCE_HASH';end if;
 if src->>'storage_path' is distinct from 'sources/'||auth.uid()||'/'||(src->>'sha256')||'.xlsx'
 or not exists(select 1 from storage.objects where bucket_id='insurance-reports' and name=src->>'storage_path') then raise exception 'SOURCE_ORIGINAL_NOT_STORED';end if;
 source_identity:=case when src->'sheets'?'Resumo Comitê' then 'insurance_performance' else 'portfolio_radar' end;
 insert into growth_data.source_contracts(source_key,version,domain,adapter,parser_key,grain_contract,authority_scope,layout_contract,status,created_by)
 values(source_identity,1,case when source_identity='portfolio_radar' then 'portfolio' else 'insurance' end,'xlsx','insurance/1','{"mode":"source_review"}','{"status":"pending_review"}',jsonb_build_object('sheets',(select jsonb_agg(k) from jsonb_object_keys(src->'sheets') k)),'draft',auth.uid())
 on conflict(source_key,version) do nothing;
 select id into contract_id from growth_data.source_contracts c where c.source_key=source_identity and version=1;
 insert into growth_data.ingest_batches(source_contract_id,source_sha256,artifact_path,parser_version,status,manifest,created_by)
 values(contract_id,src->>'sha256','insurance-reports/'||(src->>'storage_path'),'insurance/1','staged',jsonb_build_object('name',src->>'name'),auth.uid())
 on conflict(source_contract_id,source_sha256,parser_version) do nothing;
 select id into batch from growth_data.ingest_batches where source_contract_id=contract_id and source_sha256=src->>'sha256' and parser_version='insurance/1';
 for rec in select jsonb_build_object('sheet',key,'cells',value) from jsonb_each(src->'sheets') loop
 insert into growth_data.ingest_records(batch_id,record_key,source_locator,raw_payload,classification,record_hash)
 values(batch,rec->>'sheet',jsonb_build_object('sheet',rec->>'sheet'),rec,'input',encode(sha256(convert_to(rec::text,'UTF8')),'hex')) on conflict(batch_id,record_key) do nothing;
 end loop;
 if src->'sheets'?'Resumo Comitê' then insurance_batch:=batch;select id into insurance_record from growth_data.ingest_records where batch_id=batch and record_key='Resumo Comitê';end if;
 if src->'sheets'?'Base Seguros' then
 select id into rid from growth_data.ingest_records where batch_id=batch and record_key='Base Seguros';
 perform growth_data.put_portfolio(packet,sid,batch,rid);
 end if;
 insert into public.report_run_sources(run_id,source_key,source_version,row_count,field_coverage,source_hash,artifact_path)
 values(reportid,source_identity,'insurance-parser/1',(select count(*) from growth_data.ingest_records where batch_id=batch),jsonb_build_object('row_count_grain','sheet_records','cutoff_status','source_review_required'),src->>'sha256','insurance-reports/'||(src->>'storage_path'));
 end loop;
 perform growth_data.put_outcomes(packet,sid,insurance_batch,insurance_record);
 perform growth_data.put_period_measures(packet,sid,insurance_batch,insurance_record);
 select id into dispatch_record from growth_data.ingest_records where batch_id=insurance_batch and record_key='Base de disparos';
 perform growth_data.put_dispatches(packet,sid,insurance_batch,dispatch_record);
 for m in select value from jsonb_array_elements(packet->'metrics') loop
 metric_code:=m->>'code';
 if not metric_code=any(seen) then
 insert into growth_data.metric_definitions(code,version,unit,aggregation_rule,calculation_key,calculation_version,contract,status,created_by)
 values(metric_code,1,coalesce(m->>'unit','count'),case when m->>'unit'='ratio' or metric_code like '%cost_per%' then 'ratio_of_sums' when metric_code='source_activated_count' then 'distinct_nonadditive' else 'sum' end,'insurance:'||metric_code,'1','{"source":"reviewed_workbook","cache_review_required":true}','draft',auth.uid()) on conflict(code,version) do nothing;
 select id into mid from growth_data.metric_definitions where code=metric_code and version=1;
 insert into growth_data.snapshot_metrics(snapshot_id,metric_definition_id) values(sid,mid);
 seen:=array_append(seen,metric_code);
 end if;
 select id into mid from growth_data.metric_definitions where code=metric_code and version=1;
 bindingcode:='insurance.'||(m->>'product')||'.'||(m->>'code')||'.'||coalesce(m->>'source','derived');
 insert into growth_data.content_bindings(binding_key,version,target_kind,template_key,template_version,target_locator,query_contract,query_version,filter_contract,missing_policy,status,created_by)
 values(bindingcode,1,case when m->>'source' like 'Resumo Comitê!%' then 'xlsx_range' else 'app_module' end,'insurance_performance','1',jsonb_build_object('source',m->>'source'),'insurance.metric','1',jsonb_build_object('product',m->>'product','metric',m->>'code'),'preserve_missing','approved',auth.uid()) on conflict(binding_key,version) do nothing;
 select id into bid from growth_data.content_bindings where binding_key=bindingcode and version=1;
 insert into growth_data.binding_metrics(binding_id,metric_definition_id) values(bid,mid) on conflict do nothing;
 insert into growth_data.snapshot_bindings(snapshot_id,binding_id) values(sid,bid) on conflict do nothing;
 end loop;
 for note_row in select id,content_hash from public.gaas_vault_notes where relative_path='10-Resultados/Mecanicas/Seguros.md' and deleted_at is null loop
 bindingcode:='insurance.wiki.'||note_row.id;
 insert into growth_data.content_bindings(binding_key,version,target_kind,template_key,template_version,target_locator,query_contract,query_version,filter_contract,note_id,missing_policy,status,created_by)
 values(bindingcode,1,'wiki_data_block','wiki','1','{"block":"insurance-certified-results"}','insurance.monthly','1','{}',note_row.id,'show_unavailable','approved',auth.uid()) on conflict(binding_key,version) do nothing;
 end loop;
 for note_row in select b.id,b.note_id,n.content_hash from growth_data.content_bindings b join public.gaas_vault_notes n on n.id=b.note_id where b.target_kind='wiki_data_block' and b.query_contract like 'insurance.%' and b.status='approved' and n.deleted_at is null loop
 insert into growth_data.snapshot_bindings(snapshot_id,binding_id) values(sid,note_row.id) on conflict do nothing;
 insert into growth_data.note_impacts(snapshot_id,binding_id,note_id,base_content_hash,change_kind,evidence,status,created_by)
 values(sid,note_row.id,note_row.note_id,note_row.content_hash,'data_block',jsonb_build_object('snapshot_hash',digest),'identified',auth.uid());
 end loop;
 update growth_data.snapshots set status='built' where id=sid;
 return jsonb_build_object('id',sid,'reused',false);
end $$;

create function growth_data.list_snapshots() returns jsonb language plpgsql security definer set search_path='' as $$
declare writer boolean;
begin
 perform growth_data.require_role();
 select role in ('analyst','publisher','admin') into writer from public.report_live_memberships where user_id=auth.uid() and active;
 return coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from
 (select id,status,period_start,period_end,snapshot_hash,created_at,certified_at from growth_data.snapshots where domain='insurance' and (writer or status='certified') order by created_at desc limit 100) q),'[]');
end $$;
create function growth_data.read_snapshot(sid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s growth_data.snapshots;writer boolean;
begin
 perform growth_data.require_role();
 select * into strict s from growth_data.snapshots where id=sid and domain='insurance';
 select role in ('analyst','publisher','admin') into writer from public.report_live_memberships where user_id=auth.uid() and active;
 if s.status<>'certified' and not writer then raise exception 'ACCESS_DENIED';end if;
 return to_jsonb(s)||jsonb_build_object('artifacts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'artifact_kind',a.artifact_kind,'storage_path',a.storage_path,'qa_status',a.qa_status)) from growth_data.output_artifacts a where a.snapshot_id=sid),'[]'));
end $$;
create function growth_data.certify_snapshot(sid uuid,expected_hash text,resolutions jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s growth_data.snapshots;issue jsonb;reason text;
begin
 perform growth_data.require_role(true,true);
 select * into strict s from growth_data.snapshots where id=sid and domain='insurance' for update;
 if s.snapshot_hash<>expected_hash then raise exception 'SNAPSHOT_VERSION_CONFLICT';end if;
 if s.status='certified' then return jsonb_build_object('id',sid,'status','certified','reused',true);end if;
 if s.status<>'built' or jsonb_typeof(resolutions)<>'object' then raise exception 'SNAPSHOT_NOT_READY';end if;
 if (select count(*) from jsonb_array_elements(s.manifest->'metrics') m where m->>'code' in ('contracts_digital','registrations_digital') and m->>'period'='window_total' and m->>'value' is not null)<>4 then raise exception 'METRIC_NOT_ELIGIBLE';end if;
 for issue in select value from jsonb_array_elements(s.manifest->'issues') where value->>'severity'='blocking' loop
 if issue->>'code' in ('FORMULA_CACHE_MISSING','SOURCE_FORMULA_ERROR') then raise exception 'FORMULA_CACHE_MISSING';end if;
 reason:=resolutions->>(issue->>'code');
 if length(trim(coalesce(reason,'')))<20 then raise exception 'UNRESOLVED_SOURCE_ISSUE: %',issue->>'code';end if;
 end loop;
 -- Approval is source certification with explicit limits, not evidence of causal incrementality.
 insert into growth_data.certification_reviews(snapshot_id,reviewer_id,resolutions) values(sid,auth.uid(),resolutions);
 update growth_data.fact_revisions f set status='accepted' where f.status='proposed' and exists(select 1 from growth_data.snapshot_revisions r where r.snapshot_id=sid and r.revision_id=f.id);
 update growth_data.snapshots set status='certified',certified_by=auth.uid(),certified_at=clock_timestamp() where id=sid;
 update public.report_runs set status='certified',certification_status='certified',certified_at=clock_timestamp() where id=s.report_run_id;
 return jsonb_build_object('id',sid,'status','certified');
end $$;

create function growth_data.register_artifact(sid uuid,path text,hash text,kind text,template text) returns uuid language plpgsql security definer set search_path='' as $$
declare s growth_data.snapshots;result uuid;
begin
 perform growth_data.require_role(true,false);
 select * into strict s from growth_data.snapshots where id=sid and domain='insurance';
 if kind not in ('xlsx','pptx','manifest') or hash!~'^[0-9a-f]{64}$' or split_part(path,'/',1)<>'artifacts' or split_part(path,'/',2)<>auth.uid()::text then raise exception 'INVALID_ARTIFACT';end if;
 if not exists(select 1 from storage.objects where bucket_id='insurance-reports' and name=path) then raise exception 'ARTIFACT_NOT_STORED';end if;
 insert into growth_data.output_artifacts(snapshot_id,report_run_id,artifact_kind,template_key,template_version,renderer_version,storage_path,sha256,qa_status,created_by)
 values(sid,s.report_run_id,kind,template,'reference/1','ooxml/1',path,hash,'pending',auth.uid())
 on conflict(snapshot_id,artifact_kind,template_key,template_version,renderer_version) do nothing;
 select id into result from growth_data.output_artifacts where snapshot_id=sid and artifact_kind=kind and template_key=template and template_version='reference/1' and renderer_version='ooxml/1' and sha256=hash;
 if result is null then raise exception 'ARTIFACT_VERSION_CONFLICT';end if;
 return result;
end $$;
create function growth_data.reject_snapshot(sid uuid,expected_hash text,reason text) returns void language plpgsql security definer set search_path='' as $$
declare s growth_data.snapshots;
begin
 perform growth_data.require_role(true,true);
 select * into strict s from growth_data.snapshots where id=sid and domain='insurance' for update;
 if s.snapshot_hash<>expected_hash or s.status<>'built' then raise exception 'SNAPSHOT_VERSION_CONFLICT';end if;
 if length(trim(reason))<20 then raise exception 'REJECTION_REASON_REQUIRED';end if;
 insert into growth_data.certification_reviews(snapshot_id,reviewer_id,resolutions) values(sid,auth.uid(),jsonb_build_object('rejected_reason',reason));
 update growth_data.snapshots set status='rejected' where id=sid;
 update public.report_runs set status='rejected',certification_status='rejected' where id=s.report_run_id;
end $$;
create function growth_data.note_snapshot(note uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 perform growth_data.require_role();
 select s.id into sid from growth_data.snapshots s join growth_data.snapshot_bindings sb on sb.snapshot_id=s.id join growth_data.content_bindings b on b.id=sb.binding_id
 where b.note_id=note and b.target_kind='wiki_data_block' and s.status='certified' and s.domain='insurance' order by s.certified_at desc limit 1;
 if sid is null then return null;end if;
 return growth_data.read_snapshot(sid);
end $$;
create function growth_data.bind_note(note uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform growth_data.require_role(true,true);
 if not exists(select 1 from public.gaas_vault_notes where id=note and deleted_at is null) then raise exception 'NOTE_NOT_FOUND';end if;
 insert into growth_data.content_bindings(binding_key,version,target_kind,template_key,template_version,target_locator,query_contract,query_version,filter_contract,note_id,missing_policy,status,created_by)
 values('insurance.wiki.'||note,1,'wiki_data_block','wiki','1','{"block":"insurance-certified-results"}','insurance.monthly','1','{}',note,'show_unavailable','approved',auth.uid()) on conflict(binding_key,version) do nothing;
 select id into result from growth_data.content_bindings where binding_key='insurance.wiki.'||note and version=1;
 return result;
end $$;

-- Access is through small invoker wrappers; raw tables remain private.
grant usage on schema growth_data to authenticated;
revoke all on all functions in schema growth_data from public,anon,authenticated;
grant execute on function growth_data.save_snapshot(jsonb),growth_data.list_snapshots(),growth_data.read_snapshot(uuid),growth_data.certify_snapshot(uuid,text,jsonb) to authenticated;
grant execute on function growth_data.register_artifact(uuid,text,text,text,text) to authenticated;
grant execute on function growth_data.reject_snapshot(uuid,text,text) to authenticated;
grant execute on function growth_data.note_snapshot(uuid) to authenticated;
grant execute on function growth_data.bind_note(uuid) to authenticated;
create function public.insurance_save_snapshot(p_packet jsonb) returns jsonb language sql security invoker set search_path='' as $$select growth_data.save_snapshot(p_packet)$$;
create function public.insurance_list_snapshots() returns jsonb language sql security invoker set search_path='' as $$select growth_data.list_snapshots()$$;
create function public.insurance_read_snapshot(p_id uuid) returns jsonb language sql security invoker set search_path='' as $$select growth_data.read_snapshot(p_id)$$;
create function public.insurance_certify_snapshot(p_id uuid,p_hash text,p_resolutions jsonb) returns jsonb language sql security invoker set search_path='' as $$select growth_data.certify_snapshot(p_id,p_hash,p_resolutions)$$;
create function public.insurance_register_artifact(p_id uuid,p_path text,p_hash text,p_kind text,p_template text) returns uuid language sql security invoker set search_path='' as $$select growth_data.register_artifact(p_id,p_path,p_hash,p_kind,p_template)$$;
revoke all on function public.insurance_register_artifact(uuid,text,text,text,text) from public,anon;
grant execute on function public.insurance_register_artifact(uuid,text,text,text,text) to authenticated;
create function public.insurance_reject_snapshot(p_id uuid,p_hash text,p_reason text) returns void language sql security invoker set search_path='' as $$select growth_data.reject_snapshot(p_id,p_hash,p_reason)$$;
revoke all on function public.insurance_reject_snapshot(uuid,text,text) from public,anon;
grant execute on function public.insurance_reject_snapshot(uuid,text,text) to authenticated;
create function public.insurance_note_snapshot(p_note_id uuid) returns jsonb language sql security invoker set search_path='' as $$select growth_data.note_snapshot(p_note_id)$$;
revoke all on function public.insurance_note_snapshot(uuid) from public,anon;
grant execute on function public.insurance_note_snapshot(uuid) to authenticated;
create function public.insurance_bind_note(p_note_id uuid) returns uuid language sql security invoker set search_path='' as $$select growth_data.bind_note(p_note_id)$$;
revoke all on function public.insurance_bind_note(uuid) from public,anon;
grant execute on function public.insurance_bind_note(uuid) to authenticated;
revoke all on function public.insurance_save_snapshot(jsonb),public.insurance_list_snapshots(),public.insurance_read_snapshot(uuid),public.insurance_certify_snapshot(uuid,text,jsonb) from public,anon;
grant execute on function public.insurance_save_snapshot(jsonb),public.insurance_list_snapshots(),public.insurance_read_snapshot(uuid),public.insurance_certify_snapshot(uuid,text,jsonb) to authenticated;

commit;
