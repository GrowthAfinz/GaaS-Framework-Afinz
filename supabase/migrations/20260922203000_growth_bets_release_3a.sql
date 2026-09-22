-- Aprendizado Growth — Release 3A
-- Contract and transactional persistence for accepting a governed signal as a bet.

create table public.growth_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_run_id uuid references public.report_runs(id) on delete restrict,
  artifact_path text,
  source_hash text not null,
  period_start date not null,
  period_end date not null,
  filters jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  quality_state jsonb not null default '{}'::jsonb,
  regime jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint growth_evidence_snapshots_period_check check (period_start <= period_end),
  constraint growth_evidence_snapshots_filters_object_check check (jsonb_typeof(filters) = 'object'),
  constraint growth_evidence_snapshots_metrics_object_check check (jsonb_typeof(metrics) = 'object'),
  constraint growth_evidence_snapshots_quality_object_check check (jsonb_typeof(quality_state) = 'object'),
  constraint growth_evidence_snapshots_regime_object_check check (jsonb_typeof(regime) = 'object')
);

create table public.growth_bets (
  id uuid primary key default gen_random_uuid(),
  source_action_candidate_id uuid references public.report_action_candidates(action_candidate_id) on delete restrict,
  evidence_snapshot_id uuid not null references public.growth_evidence_snapshots(id) on delete restrict,
  front text not null,
  team_scope text not null,
  owner text,
  hypothesis text not null,
  action_text text not null,
  metric_name text not null,
  baseline_value numeric not null,
  expected_value numeric not null,
  expected_direction text not null,
  expected_unit text,
  success_criterion text not null,
  execution_due_at timestamptz,
  outcome_window_start date not null,
  outcome_window_end date not null,
  verification_view text not null,
  stop_condition text,
  known_alternatives jsonb not null default '[]'::jsonb,
  status text not null default 'approved',
  belief_snapshot jsonb not null,
  contract_version text not null default 'growth-bet-contract-v1',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_bets_front_check check (
    front in ('crm_acquisition', 'paid_media', 'b2c_origin')
  ),
  constraint growth_bets_direction_check check (
    expected_direction in ('maior_melhor', 'menor_melhor', 'atingir_meta')
  ),
  constraint growth_bets_status_check check (
    status in (
      'draft', 'approved', 'in_progress', 'waiting_window',
      'ready_for_review', 'closed', 'cancelled', 'not_verifiable'
    )
  ),
  constraint growth_bets_window_check check (outcome_window_start <= outcome_window_end),
  constraint growth_bets_team_check check (btrim(team_scope) <> ''),
  constraint growth_bets_hypothesis_check check (btrim(hypothesis) <> ''),
  constraint growth_bets_action_check check (btrim(action_text) <> ''),
  constraint growth_bets_metric_check check (btrim(metric_name) <> ''),
  constraint growth_bets_success_check check (btrim(success_criterion) <> ''),
  constraint growth_bets_verification_view_check check (btrim(verification_view) <> ''),
  constraint growth_bets_alternatives_array_check check (jsonb_typeof(known_alternatives) = 'array'),
  constraint growth_bets_belief_object_check check (jsonb_typeof(belief_snapshot) = 'object')
);

create unique index growth_bets_one_open_per_signal_idx
  on public.growth_bets (source_action_candidate_id)
  where source_action_candidate_id is not null and status <> 'cancelled';

create index growth_bets_status_window_idx
  on public.growth_bets (status, outcome_window_end, created_at desc);

create index growth_bets_front_idx
  on public.growth_bets (front, created_at desc);

create table public.growth_bet_updates (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.growth_bets(id) on delete cascade,
  update_type text not null,
  body text,
  execution_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint growth_bet_updates_type_check check (
    update_type in ('created', 'status_changed', 'execution', 'comment', 'contract_revised')
  ),
  constraint growth_bet_updates_execution_check check (
    execution_status is null or execution_status in (
      'not_started', 'partial', 'completed', 'cancelled', 'unknown'
    )
  ),
  constraint growth_bet_updates_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index growth_bet_updates_bet_timeline_idx
  on public.growth_bet_updates (bet_id, created_at, id);

alter table public.growth_feed_events
  drop constraint growth_feed_events_type_check;

alter table public.growth_feed_events
  add constraint growth_feed_events_type_check check (
    event_type in (
      'recommendation_created',
      'data_quality_blocked',
      'report_candidate_generated',
      'report_published',
      'report_blocked',
      'bet_created'
    )
  );

alter table public.growth_feed_events
  drop constraint growth_feed_events_subject_check;

alter table public.growth_feed_events
  add constraint growth_feed_events_subject_check check (
    subject_type in ('action_candidate', 'report_run', 'report_publication', 'growth_bet')
  );

alter table public.growth_evidence_snapshots enable row level security;
alter table public.growth_bets enable row level security;
alter table public.growth_bet_updates enable row level security;

revoke all on table public.growth_evidence_snapshots from public, anon, authenticated;
revoke all on table public.growth_bets from public, anon, authenticated;
revoke all on table public.growth_bet_updates from public, anon, authenticated;

grant select on table public.growth_evidence_snapshots to authenticated;
grant select on table public.growth_bets to authenticated;
grant select on table public.growth_bet_updates to authenticated;

grant select, insert, update, delete on table public.growth_evidence_snapshots to service_role;
grant select, insert, update, delete on table public.growth_bets to service_role;
grant select, insert, update, delete on table public.growth_bet_updates to service_role;

create policy growth_evidence_snapshots_authenticated_read
  on public.growth_evidence_snapshots
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_bets_authenticated_read
  on public.growth_bets
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_bet_updates_authenticated_read
  on public.growth_bet_updates
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create or replace function public.growth_bets_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger growth_bets_updated_at
before update on public.growth_bets
for each row execute function public.growth_bets_set_updated_at();

create or replace function public.growth_prevent_evidence_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'growth_evidence_snapshots is immutable';
end;
$$;

create trigger growth_evidence_snapshots_immutable
before update or delete on public.growth_evidence_snapshots
for each row execute function public.growth_prevent_evidence_mutation();

create or replace function public.growth_prevent_bet_update_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'growth_bet_updates is append-only';
end;
$$;

create trigger growth_bet_updates_append_only
before update or delete on public.growth_bet_updates
for each row execute function public.growth_prevent_bet_update_mutation();

create or replace function public.growth_preserve_bet_origin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.source_action_candidate_id is distinct from old.source_action_candidate_id
    or new.evidence_snapshot_id is distinct from old.evidence_snapshot_id
    or new.belief_snapshot is distinct from old.belief_snapshot
    or new.contract_version is distinct from old.contract_version
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'bet origin and belief snapshot are immutable';
  end if;
  return new;
end;
$$;

create trigger growth_bets_preserve_origin
before update on public.growth_bets
for each row execute function public.growth_preserve_bet_origin();

create or replace function public.growth_accept_signal_as_bet(
  p_action_candidate_id uuid,
  p_team_scope text,
  p_hypothesis text,
  p_action_text text,
  p_metric_name text,
  p_baseline_value numeric,
  p_expected_value numeric,
  p_expected_direction text,
  p_success_criterion text,
  p_outcome_window_start date,
  p_outcome_window_end date,
  p_verification_view text,
  p_expected_unit text default null,
  p_execution_due_at timestamptz default null,
  p_stop_condition text default null,
  p_known_alternatives jsonb default '[]'::jsonb,
  p_owner text default null
)
returns public.growth_bets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_candidate public.report_action_candidates%rowtype;
  v_run public.report_runs%rowtype;
  v_source_event public.growth_feed_events%rowtype;
  v_snapshot public.growth_evidence_snapshots%rowtype;
  v_bet public.growth_bets%rowtype;
  v_existing_bet uuid;
  v_front text;
  v_now timestamptz := now();
  v_source_hash text;
  v_belief jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if nullif(btrim(p_team_scope), '') is null
    or nullif(btrim(p_hypothesis), '') is null
    or nullif(btrim(p_action_text), '') is null
    or nullif(btrim(p_metric_name), '') is null
    or p_baseline_value is null
    or p_expected_value is null
    or p_expected_direction is null
    or nullif(btrim(p_success_criterion), '') is null
    or p_outcome_window_start is null
    or p_outcome_window_end is null
    or nullif(btrim(p_verification_view), '') is null
  then
    raise exception 'approved bet requires team, hypothesis, action, metric, baseline, expectation, success criterion, verification window and verification view';
  end if;

  if p_expected_direction not in ('maior_melhor', 'menor_melhor', 'atingir_meta') then
    raise exception 'invalid expected direction: %', p_expected_direction;
  end if;

  if p_outcome_window_start > p_outcome_window_end then
    raise exception 'outcome window start must be on or before its end';
  end if;

  if jsonb_typeof(coalesce(p_known_alternatives, '[]'::jsonb)) <> 'array' then
    raise exception 'known alternatives must be a JSON array';
  end if;

  select candidate.* into v_candidate
  from public.report_action_candidates candidate
  where candidate.action_candidate_id = p_action_candidate_id
  for update;

  if not found then
    raise exception 'action candidate not found: %', p_action_candidate_id;
  end if;

  if v_candidate.confidence_status not in ('confirmed', 'directional')
    or v_candidate.source_view ilike '%QUALITY%'
  then
    raise exception 'candidate % is not eligible for an approved bet (confidence %, source %)',
      p_action_candidate_id, v_candidate.confidence_status, v_candidate.source_view;
  end if;

  select bet.id into v_existing_bet
  from public.growth_bets bet
  where bet.source_action_candidate_id = p_action_candidate_id
    and bet.status <> 'cancelled'
  limit 1;

  if v_existing_bet is not null then
    raise exception 'candidate % already has active bet %', p_action_candidate_id, v_existing_bet;
  end if;

  select run_row.* into strict v_run
  from public.report_runs run_row
  where run_row.id = v_candidate.run_id;

  select event.* into v_source_event
  from public.growth_feed_events event
  where event.subject_type = 'action_candidate'
    and event.subject_id = p_action_candidate_id
    and event.event_type = 'recommendation_created'
  order by event.occurred_at desc, event.id desc
  limit 1;

  if v_source_event.id is null then
    raise exception 'candidate % has no governed recommendation event', p_action_candidate_id;
  end if;

  v_front := case lower(v_candidate.domain)
    when 'crm' then 'crm_acquisition'
    when 'crm_aquisicao' then 'crm_acquisition'
    when 'midia' then 'paid_media'
    when 'mídia' then 'paid_media'
    when 'media' then 'paid_media'
    when 'paid_media' then 'paid_media'
    when 'b2c' then 'b2c_origin'
    when 'originacao_b2c' then 'b2c_origin'
    else null
  end;

  if v_front is null then
    raise exception 'unsupported candidate domain for bet: %', v_candidate.domain;
  end if;

  v_source_hash := coalesce(
    nullif(v_run.source_hash, ''),
    nullif(v_run.content_hash, ''),
    md5(jsonb_build_object(
      'candidate_id', v_candidate.action_candidate_id,
      'run_id', v_candidate.run_id,
      'candidate_created_at', v_candidate.created_at,
      'signal', v_candidate.signal,
      'evidence_refs', v_candidate.evidence_refs
    )::text)
  );

  insert into public.growth_evidence_snapshots (
    source_run_id,
    artifact_path,
    source_hash,
    period_start,
    period_end,
    filters,
    metrics,
    quality_state,
    regime,
    created_at
  ) values (
    v_run.id,
    v_run.artifact_path,
    v_source_hash,
    v_run.period_start,
    v_run.period_end,
    jsonb_strip_nulls(jsonb_build_object(
      'domain', lower(v_candidate.domain),
      'front', v_front,
      'partner', v_candidate.partner,
      'entity_key', v_candidate.entity_key,
      'signal_code', v_candidate.signal_code,
      'source_view', v_candidate.source_view
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'metric_name', btrim(p_metric_name),
      'baseline_value', p_baseline_value,
      'expected_value', p_expected_value,
      'expected_direction', p_expected_direction,
      'expected_unit', nullif(btrim(p_expected_unit), ''),
      'success_criterion', btrim(p_success_criterion),
      'candidate_success_metric', v_candidate.success_metric,
      'candidate_expected_value', v_candidate.expected_value,
      'candidate_expected_direction', v_candidate.expected_direction,
      'candidate_expected_unit', v_candidate.expected_unit
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'candidate_confidence_status', v_candidate.confidence_status,
      'candidate_reading_limit', v_candidate.reading_limit,
      'run_quality_status', v_run.quality_status,
      'source_cutoffs', v_run.source_cutoffs,
      'missing_sources', v_run.run_manifest -> 'missing_sources',
      'integrated_reading_available', v_run.run_manifest -> 'integrated_reading_available'
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'comparability', v_run.run_manifest -> 'comparability',
      'report_profile', v_run.report_profile,
      'spec_version', v_run.spec_version
    )),
    v_now
  ) returning * into v_snapshot;

  v_belief := jsonb_build_object(
    'contract_version', 'growth-bet-contract-v1',
    'approved_at', v_now,
    'evidence_snapshot_id', v_snapshot.id,
    'source_event_id', v_source_event.id,
    'source_candidate', jsonb_strip_nulls(jsonb_build_object(
      'action_candidate_id', v_candidate.action_candidate_id,
      'run_id', v_candidate.run_id,
      'source_view', v_candidate.source_view,
      'entity_key', v_candidate.entity_key,
      'signal_code', v_candidate.signal_code,
      'domain', v_candidate.domain,
      'partner', v_candidate.partner,
      'bucket', v_candidate.bucket,
      'signal', v_candidate.signal,
      'impact', v_candidate.impact,
      'probable_cause', v_candidate.probable_cause,
      'evidence_refs', v_candidate.evidence_refs,
      'reading_limit', v_candidate.reading_limit,
      'action_text', v_candidate.action_text,
      'success_metric', v_candidate.success_metric,
      'confidence_status', v_candidate.confidence_status,
      'review_status', v_candidate.review_status,
      'status', v_candidate.status,
      'created_at', v_candidate.created_at
    )),
    'contract', jsonb_strip_nulls(jsonb_build_object(
      'front', v_front,
      'team_scope', btrim(p_team_scope),
      'owner', nullif(btrim(p_owner), ''),
      'hypothesis', btrim(p_hypothesis),
      'action_text', btrim(p_action_text),
      'metric_name', btrim(p_metric_name),
      'baseline_value', p_baseline_value,
      'expected_value', p_expected_value,
      'expected_direction', p_expected_direction,
      'expected_unit', nullif(btrim(p_expected_unit), ''),
      'success_criterion', btrim(p_success_criterion),
      'execution_due_at', p_execution_due_at,
      'outcome_window_start', p_outcome_window_start,
      'outcome_window_end', p_outcome_window_end,
      'verification_view', btrim(p_verification_view),
      'stop_condition', nullif(btrim(p_stop_condition), ''),
      'known_alternatives', coalesce(p_known_alternatives, '[]'::jsonb)
    )),
    'learning_refs', '[]'::jsonb
  );

  insert into public.growth_bets (
    source_action_candidate_id,
    evidence_snapshot_id,
    front,
    team_scope,
    owner,
    hypothesis,
    action_text,
    metric_name,
    baseline_value,
    expected_value,
    expected_direction,
    expected_unit,
    success_criterion,
    execution_due_at,
    outcome_window_start,
    outcome_window_end,
    verification_view,
    stop_condition,
    known_alternatives,
    status,
    belief_snapshot,
    contract_version,
    created_by,
    created_at,
    updated_at
  ) values (
    v_candidate.action_candidate_id,
    v_snapshot.id,
    v_front,
    btrim(p_team_scope),
    nullif(btrim(p_owner), ''),
    btrim(p_hypothesis),
    btrim(p_action_text),
    btrim(p_metric_name),
    p_baseline_value,
    p_expected_value,
    p_expected_direction,
    nullif(btrim(p_expected_unit), ''),
    btrim(p_success_criterion),
    p_execution_due_at,
    p_outcome_window_start,
    p_outcome_window_end,
    btrim(p_verification_view),
    nullif(btrim(p_stop_condition), ''),
    coalesce(p_known_alternatives, '[]'::jsonb),
    'approved',
    v_belief,
    'growth-bet-contract-v1',
    v_actor,
    v_now,
    v_now
  ) returning * into v_bet;

  insert into public.growth_bet_updates (
    bet_id,
    update_type,
    body,
    execution_status,
    metadata,
    created_by,
    created_at
  ) values (
    v_bet.id,
    'created',
    'Aposta assumida a partir de recomendação governada.',
    'not_started',
    jsonb_build_object(
      'source_action_candidate_id', v_candidate.action_candidate_id,
      'evidence_snapshot_id', v_snapshot.id,
      'contract_version', v_bet.contract_version
    ),
    v_actor,
    v_now
  );

  insert into public.growth_feed_events (
    event_type,
    subject_type,
    subject_id,
    front,
    occurred_at,
    priority_score,
    relevance_dimensions,
    summary_snapshot,
    route,
    dedupe_key
  ) values (
    'bet_created',
    'growth_bet',
    v_bet.id,
    v_front,
    v_now,
    least(100, greatest(60, v_source_event.priority_score + 8)),
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', 'bet:' || v_bet.id::text,
      'event_state', 'approved',
      'confidence_status', v_candidate.confidence_status,
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'source_action_candidate_id', v_candidate.action_candidate_id,
      'source_event_id', v_source_event.id,
      'source_run_id', v_run.id,
      'evidence_snapshot_id', v_snapshot.id,
      'period_start', v_snapshot.period_start,
      'period_end', v_snapshot.period_end,
      'priority_reason', 'Decisão assumida com contrato de verificação completo.'
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Aposta assumida: ' || v_bet.hypothesis,
      'summary', v_bet.action_text,
      'metric_name', v_bet.metric_name,
      'baseline_value', v_bet.baseline_value,
      'expected_value', v_bet.expected_value,
      'expected_direction', v_bet.expected_direction,
      'expected_unit', v_bet.expected_unit,
      'success_criterion', v_bet.success_criterion,
      'outcome_window_start', v_bet.outcome_window_start,
      'outcome_window_end', v_bet.outcome_window_end,
      'verification_view', v_bet.verification_view,
      'action_text', v_bet.action_text,
      'source_view', v_candidate.source_view,
      'evidence_refs', v_candidate.evidence_refs,
      'primary_action', jsonb_build_object(
        'kind', 'open_bet',
        'label', 'Abrir aposta'
      )
    )),
    '?view=learning&section=bets&item=' || v_bet.id::text,
    'growth_bet:' || v_bet.id::text || ':created'
  );

  update public.report_action_candidates
  set review_status = 'approved',
      status = 'accepted',
      updated_at = v_now
  where action_candidate_id = v_candidate.action_candidate_id;

  return v_bet;
end;
$$;

create view public.growth_bets_operational_v
with (security_invoker = true)
as
select
  bet.*,
  bet.belief_snapshot #>> '{source_candidate,signal}' as source_signal,
  bet.belief_snapshot #>> '{source_candidate,impact}' as source_impact,
  bet.belief_snapshot #>> '{source_candidate,probable_cause}' as source_probable_cause,
  bet.belief_snapshot #>> '{source_candidate,confidence_status}' as source_confidence_status,
  bet.belief_snapshot #>> '{source_candidate,reading_limit}' as source_reading_limit,
  bet.belief_snapshot #>> '{source_candidate,source_view}' as source_view,
  bet.belief_snapshot #>> '{source_candidate,entity_key}' as entity_key,
  bet.belief_snapshot #>> '{source_candidate,signal_code}' as signal_code,
  evidence.source_run_id,
  evidence.artifact_path,
  evidence.source_hash,
  evidence.period_start as evidence_period_start,
  evidence.period_end as evidence_period_end,
  evidence.quality_state,
  evidence.regime,
  (
    select max(update_row.created_at)
    from public.growth_bet_updates update_row
    where update_row.bet_id = bet.id
  ) as last_update_at
from public.growth_bets bet
join public.growth_evidence_snapshots evidence
  on evidence.id = bet.evidence_snapshot_id;

revoke all on table public.growth_bets_operational_v from public, anon, authenticated;
grant select on table public.growth_bets_operational_v to authenticated, service_role;

revoke execute on function public.growth_bets_set_updated_at() from public, anon, authenticated;
revoke execute on function public.growth_prevent_evidence_mutation() from public, anon, authenticated;
revoke execute on function public.growth_prevent_bet_update_mutation() from public, anon, authenticated;
revoke execute on function public.growth_preserve_bet_origin() from public, anon, authenticated;
revoke execute on function public.growth_accept_signal_as_bet(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  text, timestamptz, text, jsonb, text
) from public, anon;

grant execute on function public.growth_bets_set_updated_at() to service_role;
grant execute on function public.growth_prevent_evidence_mutation() to service_role;
grant execute on function public.growth_prevent_bet_update_mutation() to service_role;
grant execute on function public.growth_preserve_bet_origin() to service_role;
grant execute on function public.growth_accept_signal_as_bet(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  text, timestamptz, text, jsonb, text
) to authenticated;

comment on table public.growth_evidence_snapshots is
  'Immutable evidence and measurement context frozen when a governed Growth bet is approved.';

comment on table public.growth_bets is
  'Contracted Growth decisions. Original belief remains frozen in belief_snapshot.';

comment on table public.growth_bet_updates is
  'Append-only timeline for Growth bet creation and future execution/status updates.';

comment on function public.growth_accept_signal_as_bet(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  text, timestamptz, text, jsonb, text
) is
  'Atomically validates a confirmed/directional signal, freezes evidence and belief, creates an approved bet, records history, emits bet_created and marks the source candidate accepted.';

comment on view public.growth_bets_operational_v is
  'Authenticated operational projection for the Apostas workspace; no outcome or memory semantics are inferred in Release 3A.';
