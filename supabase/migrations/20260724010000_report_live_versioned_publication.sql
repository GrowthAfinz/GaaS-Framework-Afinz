-- Report Live versioned build/certify/publish foundation.
-- The Google Sheet and Google Slides remain single live deployment targets.

alter table public.report_runs
  add column if not exists source_version text not null default '1',
  add column if not exists semantic_version text not null default '1',
  add column if not exists narrative_version text not null default '1',
  add column if not exists renderer_version text not null default '1',
  add column if not exists publication_version bigint,
  add column if not exists source_hash text,
  add column if not exists narrative_hash text,
  add column if not exists blueprint_hash text,
  add column if not exists input_fingerprint text,
  add column if not exists content_hash text,
  add column if not exists idempotency_key text,
  add column if not exists artifact_path text,
  add column if not exists run_mode text not null default 'full',
  add column if not exists active_run boolean not null default false,
  add column if not exists build_status text not null default 'pending',
  add column if not exists certification_status text not null default 'pending',
  add column if not exists publication_status text not null default 'pending',
  add column if not exists built_at timestamptz,
  add column if not exists certified_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists stale_at timestamptz,
  add column if not exists restored_from uuid references public.report_runs(id),
  add column if not exists superseded_by uuid references public.report_runs(id);

create unique index if not exists report_runs_idempotency_key_idx
  on public.report_runs(idempotency_key)
  where idempotency_key is not null;

create index if not exists report_runs_release_lookup_idx
  on public.report_runs(report_profile, period_start, period_end, created_at desc);

create unique index if not exists report_runs_single_active_idx
  on public.report_runs(active_run)
  where active_run = true;

create table if not exists public.report_run_sources (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  source_key text not null,
  source_version text not null,
  native_cutoff date,
  row_count bigint not null default 0,
  field_coverage jsonb not null default '{}'::jsonb,
  source_hash text not null,
  artifact_path text,
  created_at timestamptz not null default now(),
  unique (run_id, source_key)
);

create table if not exists public.report_slide_blueprints (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  slide_instance_id text not null,
  slide_code text not null,
  renderer_version text not null,
  archetype text not null,
  density text not null default 'standard',
  data_hash text not null,
  narrative_hash text not null,
  visual_hash text not null,
  blueprint_hash text not null,
  blueprint jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id, slide_instance_id)
);

create index if not exists report_slide_blueprints_hash_idx
  on public.report_slide_blueprints(slide_instance_id, blueprint_hash);

create table if not exists public.report_validations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  validation_key text not null,
  scope text not null,
  slide_instance_id text,
  severity text not null,
  status text not null,
  message text not null,
  evidence jsonb not null default '{}'::jsonb,
  validator_version text not null default '1',
  created_at timestamptz not null default now(),
  constraint report_validations_severity_check check (
    severity in ('info','warning','error','blocking')
  ),
  constraint report_validations_status_check check (
    status in ('passed','failed','skipped')
  )
);

create unique index if not exists report_validations_run_key_scope_idx
  on public.report_validations (
    run_id,
    validation_key,
    coalesce(slide_instance_id, '')
  );

create table if not exists public.report_publications (
  id uuid primary key default gen_random_uuid(),
  publication_version bigint generated always as identity,
  run_id uuid not null references public.report_runs(id),
  deck_id text not null,
  sheet_id text not null,
  kind text not null default 'release',
  status text not null default 'publishing',
  previous_publication_id uuid references public.report_publications(id),
  rollback_of_publication_id uuid references public.report_publications(id),
  artifact_path text not null,
  blueprint_hash text not null,
  content_hash text,
  diff_summary jsonb not null default '{}'::jsonb,
  pdf_path text,
  slide_count integer,
  pdf_page_count integer,
  deck_structure_hash text,
  qa_status text not null default 'pending',
  reason text,
  published_by uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint report_publications_kind_check check (
    kind in ('release','rollback')
  ),
  constraint report_publications_status_check check (
    status in ('publishing','published','superseded','failed','rolled_back')
  )
);

alter table public.report_publications
  add column if not exists content_hash text,
  add column if not exists slide_count integer,
  add column if not exists pdf_page_count integer,
  add column if not exists deck_structure_hash text,
  add column if not exists qa_status text not null default 'pending';

create unique index if not exists report_publications_single_publishing_idx
  on public.report_publications(deck_id)
  where status = 'publishing';

create index if not exists report_publications_deck_history_idx
  on public.report_publications(deck_id, publication_version desc);

create table if not exists public.report_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  approval_type text not null default 'publication',
  decision text not null,
  decided_by uuid,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint report_approvals_decision_check check (
    decision in ('approved','rejected','needs_changes')
  )
);

create table if not exists public.report_publication_locks (
  lock_key text primary key,
  run_id uuid not null references public.report_runs(id) on delete cascade,
  owner_token uuid not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint report_publication_locks_expiry_check check (expires_at > acquired_at)
);

create table if not exists public.report_run_memory (
  run_id uuid primary key references public.report_runs(id) on delete cascade,
  report_type text not null,
  ciclo text not null,
  narrativa text,
  recomendacoes jsonb not null default '[]'::jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  licoes text,
  created_at timestamptz not null default now()
);

create index if not exists report_run_memory_cycle_idx
  on public.report_run_memory(report_type, ciclo, created_at desc);

insert into public.report_run_memory (
  run_id,
  report_type,
  ciclo,
  narrativa,
  recomendacoes,
  outcomes,
  licoes,
  created_at
)
select
  run_id,
  report_type,
  ciclo,
  narrativa,
  recomendacoes,
  outcomes,
  licoes,
  created_at
from public.report_memory
where run_id is not null
on conflict (run_id) do nothing;

create table if not exists public.report_live_pointer (
  id text primary key default 'live',
  current_run_id uuid not null references public.report_runs(id),
  current_publication_id uuid not null references public.report_publications(id),
  deck_id text not null,
  sheet_id text not null,
  content_hash text not null,
  publication_version bigint not null,
  updated_at timestamptz not null default now(),
  constraint report_live_pointer_singleton_check check (id = 'live')
);

create or replace function public.report_live_acquire_publication_lock(
  p_lock_key text,
  p_run_id uuid,
  p_owner_token uuid,
  p_ttl_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  acquired boolean := false;
begin
  if p_ttl_seconds < 60 or p_ttl_seconds > 3600 then
    raise exception 'lock ttl must be between 60 and 3600 seconds';
  end if;

  delete from public.report_publication_locks
  where lock_key = p_lock_key
    and expires_at <= now();

  insert into public.report_publication_locks (
    lock_key,
    run_id,
    owner_token,
    expires_at
  )
  values (
    p_lock_key,
    p_run_id,
    p_owner_token,
    now() + make_interval(secs => p_ttl_seconds)
  )
  on conflict (lock_key) do nothing;

  select exists (
    select 1
    from public.report_publication_locks
    where lock_key = p_lock_key
      and run_id = p_run_id
      and owner_token = p_owner_token
      and expires_at > now()
  ) into acquired;

  return acquired;
end;
$$;

create or replace function public.report_live_release_publication_lock(
  p_lock_key text,
  p_owner_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.report_publication_locks
  where lock_key = p_lock_key
    and owner_token = p_owner_token;
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

create or replace function public.report_live_renew_publication_lock(
  p_lock_key text,
  p_owner_token uuid,
  p_ttl_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_ttl_seconds < 60 or p_ttl_seconds > 3600 then
    raise exception 'lock ttl must be between 60 and 3600 seconds';
  end if;
  update public.report_publication_locks
  set expires_at = now() + make_interval(secs => p_ttl_seconds)
  where lock_key = p_lock_key
    and owner_token = p_owner_token
    and expires_at > now();
  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function public.report_live_commit_publication(
  p_publication_id uuid,
  p_run_id uuid,
  p_kind text,
  p_pdf_path text,
  p_slide_count integer,
  p_pdf_page_count integer,
  p_deck_structure_hash text,
  p_rows_inserted integer,
  p_sheet_url text,
  p_slides_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  publication_row public.report_publications%rowtype;
  previous_run_id uuid;
begin
  select *
  into publication_row
  from public.report_publications
  where id = p_publication_id
    and run_id = p_run_id
    and status = 'publishing'
  for update;

  if not found then
    raise exception 'publication % is not publishing for run %', p_publication_id, p_run_id;
  end if;
  if p_kind not in ('release','rollback') or publication_row.kind <> p_kind then
    raise exception 'publication kind mismatch';
  end if;
  if p_pdf_page_count is distinct from p_slide_count then
    raise exception 'pdf page count % differs from slide count %', p_pdf_page_count, p_slide_count;
  end if;

  if publication_row.previous_publication_id is not null then
    select run_id
    into previous_run_id
    from public.report_publications
    where id = publication_row.previous_publication_id;

    update public.report_publications
    set status = case when p_kind = 'rollback' then 'rolled_back' else 'superseded' end
    where id = publication_row.previous_publication_id
      and status = 'published';

    update public.report_runs
    set superseded_by = p_run_id
    where id = previous_run_id
      and id <> p_run_id;
  end if;

  update public.report_publications
  set status = 'published',
      pdf_path = p_pdf_path,
      slide_count = p_slide_count,
      pdf_page_count = p_pdf_page_count,
      deck_structure_hash = p_deck_structure_hash,
      qa_status = 'passed',
      completed_at = now()
  where id = p_publication_id;

  insert into public.report_live_pointer (
    id,
    current_run_id,
    current_publication_id,
    deck_id,
    sheet_id,
    content_hash,
    publication_version,
    updated_at
  )
  values (
    'live',
    p_run_id,
    p_publication_id,
    publication_row.deck_id,
    publication_row.sheet_id,
    coalesce(publication_row.content_hash, publication_row.blueprint_hash),
    publication_row.publication_version,
    now()
  )
  on conflict (id) do update
  set current_run_id = excluded.current_run_id,
      current_publication_id = excluded.current_publication_id,
      deck_id = excluded.deck_id,
      sheet_id = excluded.sheet_id,
      content_hash = excluded.content_hash,
      publication_version = excluded.publication_version,
      updated_at = excluded.updated_at;

  update public.report_runs
  set status = 'done',
      active_run = false,
      publication_version = publication_row.publication_version,
      publication_status = 'published',
      published_at = now(),
      sheet_url = p_sheet_url,
      slides_url = p_slides_url,
      rows_inserted = p_rows_inserted,
      llm_provider = 'manual_or_numeric_only',
      publication_valid = true,
      error_detail = null
  where id = p_run_id;

  return true;
end;
$$;

create or replace function public.report_live_mark_stale_runs(
  p_timeout_minutes integer default 15
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  stale_count integer := 0;
begin
  if p_timeout_minutes < 5 or p_timeout_minutes > 120 then
    raise exception 'watchdog timeout must be between 5 and 120 minutes';
  end if;

  with stale as (
    update public.report_runs
    set status = 'stale',
        active_run = false,
        stale_at = now(),
        publication_valid = false,
        build_status = case when build_status in ('pending','building') then 'stale' else build_status end,
        certification_status = case when certification_status = 'pending' then 'stale' else certification_status end,
        publication_status = case when publication_status in ('pending','publishing') then 'failed' else publication_status end,
        error_detail = 'Watchdog encerrou execução sem heartbeat dentro do limite.'
    where active_run = true
      and updated_at < now() - make_interval(mins => p_timeout_minutes)
    returning id
  )
  select count(*) into stale_count from stale;

  update public.report_publications p
  set status = 'failed',
      qa_status = 'failed',
      reason = coalesce(p.reason, 'Watchdog encerrou publicação stale.'),
      completed_at = now()
  where p.status = 'publishing'
    and exists (
      select 1
      from public.report_runs r
      where r.id = p.run_id
        and r.status = 'stale'
    );

  delete from public.report_publication_locks
  where expires_at <= now();

  return stale_count;
end;
$$;

insert into public.report_live_config (key, value, description)
values
(
  'materiality',
  '{"card_share_full":0.05,"min_segments_for_variety":2,"min_channels_for_variety":2,"strategic_partners":[],"excluded_partners":["N/A","n/a",""]}'::jsonb,
  'Configuração calibrável do router de parceiros.'
),
(
  'quality',
  '{"max_cutoff_gap_days":2,"minimum_execution_rows":3,"minimum_field_coverage":0.8}'::jsonb,
  'Thresholds do manifesto, confiança e elegibilidade.'
),
(
  'b2c_comparability',
  '{"crm_equivalence_certified":false,"crm_equivalence_note":"Aguardando confirmação operacional."}'::jsonb,
  'Contrato de comparabilidade CRM versus B2C.'
),
(
  'media_attribution',
  '{"policy_certified":false,"display_rule":"Exibir janela nativa por evento; não fundir eventos ou janelas por similaridade."}'::jsonb,
  'Política oficial de atribuição de mídia.'
),
(
  'release_engineering',
  '{"watchdog_timeout_minutes":15,"regression_max_drop":0.3,"pdf_page_match_required":true,"create_before_delete":true}'::jsonb,
  'Guardrails de build, certificação, publicação e rollback do único Report Live vivo.'
)
on conflict (key) do update
set value = excluded.value || public.report_live_config.value,
    description = excluded.description;

do $$
declare
  existing_job bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    select jobid into existing_job
    from cron.job
    where jobname = 'report-live-watchdog'
    order by jobid desc
    limit 1;
    if existing_job is not null then
      perform cron.unschedule(existing_job);
    end if;
    perform cron.schedule(
      'report-live-watchdog',
      '*/5 * * * *',
      'select public.report_live_mark_stale_runs(15);'
    );
  end if;
end;
$$;

alter table public.report_run_sources enable row level security;
alter table public.report_slide_blueprints enable row level security;
alter table public.report_validations enable row level security;
alter table public.report_publications enable row level security;
alter table public.report_approvals enable row level security;
alter table public.report_publication_locks enable row level security;
alter table public.report_run_memory enable row level security;
alter table public.report_live_pointer enable row level security;

revoke all on function public.report_live_acquire_publication_lock(text, uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.report_live_release_publication_lock(text, uuid)
  from public, anon, authenticated;
revoke all on function public.report_live_renew_publication_lock(text, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.report_live_commit_publication(
  uuid, uuid, text, text, integer, integer, text, integer, text, text
) from public, anon, authenticated;
revoke all on function public.report_live_mark_stale_runs(integer)
  from public, anon, authenticated;
grant execute on function public.report_live_acquire_publication_lock(text, uuid, uuid, integer)
  to service_role;
grant execute on function public.report_live_release_publication_lock(text, uuid)
  to service_role;
grant execute on function public.report_live_renew_publication_lock(text, uuid, integer)
  to service_role;
grant execute on function public.report_live_commit_publication(
  uuid, uuid, text, text, integer, integer, text, integer, text, text
) to service_role;
grant execute on function public.report_live_mark_stale_runs(integer)
  to service_role;

comment on table public.report_slide_blueprints is
  'Immutable per-slide build artifacts. The live Google Slides deck is a deployment target, never the source of truth.';
comment on table public.report_publications is
  'Release and rollback history for the single live Report Live deck.';
comment on table public.report_live_pointer is
  'Singleton pointer to the run and publication currently committed to the live Sheet and Slides targets.';
comment on table public.report_run_memory is
  'Immutable narrative and recommendation memory by run; report_memory remains only a latest-cycle projection.';
