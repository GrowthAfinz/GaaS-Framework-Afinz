-- Timestamp aligned to the migration version recorded by the Supabase MCP.
alter table public.report_action_outcomes
  add column if not exists bet_id uuid references public.growth_bets(id) on delete restrict,
  add column if not exists execution_status text,
  add column if not exists system_verdict text,
  add column if not exists review_status text not null default 'pending_evaluation',
  add column if not exists reviewed_at timestamptz,
  add column if not exists contestation_reason text,
  add column if not exists resolved_verdict text,
  add column if not exists evidence_snapshot_id uuid references public.growth_evidence_snapshots(id) on delete restrict;

alter table public.report_action_outcomes
  add constraint report_action_outcomes_execution_status_check check (
    execution_status is null or execution_status in (
      'not_started', 'partial', 'completed', 'cancelled', 'unknown'
    )
  ),
  add constraint report_action_outcomes_system_verdict_check check (
    system_verdict is null or system_verdict in (
      'confirmed', 'partially_confirmed', 'not_confirmed', 'invalid_premise',
      'execution_diverged', 'data_blocked', 'not_verifiable'
    )
  ),
  add constraint report_action_outcomes_review_status_check check (
    review_status in (
      'pending_evaluation', 'system_evaluated', 'confirmed_by_user', 'contested', 'resolved'
    )
  ),
  add constraint report_action_outcomes_resolved_verdict_check check (
    resolved_verdict is null or resolved_verdict in (
      'confirmed', 'partially_confirmed', 'not_confirmed', 'invalid_premise',
      'execution_diverged', 'data_blocked', 'not_verifiable'
    )
  ),
  add constraint report_action_outcomes_contestation_reason_check check (
    review_status <> 'contested' or nullif(btrim(contestation_reason), '') is not null
  );

create unique index report_action_outcomes_bet_unique_idx
  on public.report_action_outcomes (bet_id)
  where bet_id is not null;

create index report_action_outcomes_review_idx
  on public.report_action_outcomes (review_status, window_end, bet_id);

update public.report_action_outcomes outcome
set bet_id = bet.id,
    evidence_snapshot_id = coalesce(outcome.evidence_snapshot_id, bet.evidence_snapshot_id)
from public.growth_bets bet
where outcome.bet_id is null
  and bet.source_action_candidate_id = outcome.action_candidate_id;

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
      'bet_created',
      'bet_updated',
      'signal_rejected',
      'execution_recorded',
      'outcome_due',
      'outcome_evaluated'
    )
  );

alter table public.growth_feed_events
  drop constraint growth_feed_events_subject_check;

alter table public.growth_feed_events
  add constraint growth_feed_events_subject_check check (
    subject_type in (
      'action_candidate', 'report_run', 'report_publication', 'growth_bet', 'growth_outcome'
    )
  );

create or replace function public.growth_classify_execution_feed_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_type = 'bet_updated'
    and new.subject_type = 'growth_bet'
    and new.summary_snapshot ? 'execution_status'
  then
    new.event_type := 'execution_recorded';
  end if;
  return new;
end;
$$;

create trigger growth_feed_classify_execution
before insert on public.growth_feed_events
for each row execute function public.growth_classify_execution_feed_event();

create or replace function public.growth_prepare_outcome()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bet public.growth_bets%rowtype;
  v_execution_status text;
  v_previous_review_status text;
begin
  if new.bet_id is null then
    select bet.id
    into new.bet_id
    from public.growth_bets bet
    where bet.source_action_candidate_id = new.action_candidate_id
    limit 1;
  end if;

  if new.bet_id is not null then
    select bet.* into strict v_bet
    from public.growth_bets bet
    where bet.id = new.bet_id;

    select update_row.execution_status
    into v_execution_status
    from public.growth_bet_updates update_row
    where update_row.bet_id = new.bet_id
      and update_row.execution_status is not null
    order by update_row.timeline_sequence desc
    limit 1;

    new.execution_status := coalesce(new.execution_status, v_execution_status, 'not_started');
    new.evidence_snapshot_id := coalesce(new.evidence_snapshot_id, v_bet.evidence_snapshot_id);
  end if;

  if new.bet_id is not null and new.execution_status = 'partial' then
    new.system_verdict := 'execution_diverged';
  elsif new.bet_id is not null and new.execution_status <> 'completed' then
    new.system_verdict := 'not_verifiable';
  elsif new.verification_reason in ('regime_changed', 'mudanca_de_regime') then
    new.system_verdict := 'invalid_premise';
  elsif new.observed_value is null then
    new.system_verdict := 'data_blocked';
  elsif new.outcome_status in ('confirmado', 'positive') then
    new.system_verdict := 'confirmed';
  elsif new.outcome_status = 'neutral' then
    new.system_verdict := 'partially_confirmed';
  elsif new.outcome_status in ('nao_confirmado', 'negative') then
    new.system_verdict := 'not_confirmed';
  elsif new.outcome_status = 'premissa_invalida' then
    new.system_verdict := 'invalid_premise';
  elsif new.outcome_status = 'inconclusive' then
    new.system_verdict := 'not_verifiable';
  end if;

  v_previous_review_status := case when tg_op = 'UPDATE' then old.review_status else null end;
  if new.system_verdict is not null
    and coalesce(v_previous_review_status, 'pending_evaluation') = 'pending_evaluation'
  then
    new.review_status := 'system_evaluated';
  end if;

  return new;
end;
$$;

create trigger report_action_outcomes_prepare_growth
before insert or update on public.report_action_outcomes
for each row execute function public.growth_prepare_outcome();

create or replace function public.growth_emit_outcome_evaluated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bet public.growth_bets%rowtype;
begin
  if new.bet_id is null or new.system_verdict is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.system_verdict is not distinct from new.system_verdict then
    return new;
  end if;

  select bet.* into strict v_bet
  from public.growth_bets bet
  where bet.id = new.bet_id;

  update public.growth_bets
  set status = case
    when new.system_verdict = 'data_blocked' then 'waiting_window'
    when new.system_verdict = 'not_verifiable' then 'not_verifiable'
    else 'ready_for_review'
  end
  where id = new.bet_id;

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'outcome_evaluated', 'growth_outcome', new.id, v_bet.front,
    coalesce(new.evaluated_at, now()),
    case when new.system_verdict in ('data_blocked', 'execution_diverged') then 85 else 75 end,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', 'outcome:' || new.id::text,
      'event_state', new.review_status,
      'bet_id', new.bet_id,
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'system_verdict', new.system_verdict
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Outcome calculado: ' || v_bet.hypothesis,
      'summary', new.conclusion,
      'metric_name', new.metric_name,
      'baseline_value', new.baseline_value,
      'expected_value', new.expected_value,
      'observed_value', new.observed_value,
      'expected_unit', new.unit,
      'execution_status', new.execution_status,
      'system_verdict', new.system_verdict,
      'primary_action', jsonb_build_object('kind', 'open_outcome', 'label', 'Revisar outcome')
    )),
    '?view=learning&section=outcomes&item=' || new.id::text,
    'growth_outcome:' || new.id::text || ':system:' || new.system_verdict
  ) on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

create trigger report_action_outcomes_emit_growth
after insert or update on public.report_action_outcomes
for each row execute function public.growth_emit_outcome_evaluated();

create or replace function public.growth_review_outcome(
  p_outcome_id uuid,
  p_action text,
  p_reason text default null,
  p_resolved_verdict text default null
)
returns public.report_action_outcomes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_outcome public.report_action_outcomes%rowtype;
  v_bet public.growth_bets%rowtype;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_action not in ('confirm', 'contest', 'resolve') then
    raise exception 'invalid outcome review action: %', p_action;
  end if;
  if p_action in ('contest', 'resolve') and nullif(btrim(p_reason), '') is null then
    raise exception '% requires a reason', p_action;
  end if;
  if p_action = 'resolve' and p_resolved_verdict not in (
    'confirmed', 'partially_confirmed', 'not_confirmed', 'invalid_premise',
    'execution_diverged', 'data_blocked', 'not_verifiable'
  ) then
    raise exception 'resolve requires a valid verdict';
  end if;

  select outcome.* into v_outcome
  from public.report_action_outcomes outcome
  where outcome.id = p_outcome_id
  for update;
  if not found then
    raise exception 'outcome not found: %', p_outcome_id;
  end if;
  if v_outcome.bet_id is null or v_outcome.system_verdict is null then
    raise exception 'outcome is not linked to an evaluated Growth bet';
  end if;
  if p_action in ('confirm', 'contest') and v_outcome.review_status <> 'system_evaluated' then
    raise exception 'outcome is not awaiting first review: %', v_outcome.review_status;
  end if;
  if p_action = 'resolve' and v_outcome.review_status <> 'contested' then
    raise exception 'only a contested outcome can be resolved';
  end if;

  update public.report_action_outcomes
  set review_status = case p_action
        when 'confirm' then 'confirmed_by_user'
        when 'contest' then 'contested'
        else 'resolved'
      end,
      reviewed_at = v_now,
      reviewed_by = v_actor,
      contestation_reason = case when p_action in ('contest', 'resolve') then btrim(p_reason) else null end,
      resolved_verdict = case
        when p_action = 'confirm' then system_verdict
        when p_action = 'resolve' then p_resolved_verdict
        else null
      end,
      updated_at = v_now
  where id = p_outcome_id
  returning * into v_outcome;

  select bet.* into strict v_bet
  from public.growth_bets bet
  where bet.id = v_outcome.bet_id;

  update public.growth_bets
  set status = case when p_action in ('confirm', 'resolve') then 'closed' else 'ready_for_review' end
  where id = v_outcome.bet_id;

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'outcome_evaluated', 'growth_outcome', v_outcome.id, v_bet.front, v_now,
    case when p_action = 'contest' then 90 else 65 end,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', 'outcome:' || v_outcome.id::text,
      'event_state', v_outcome.review_status,
      'bet_id', v_outcome.bet_id,
      'system_verdict', v_outcome.system_verdict,
      'resolved_verdict', v_outcome.resolved_verdict,
      'reviewed_by', v_actor
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', case when p_action = 'contest' then 'Outcome contestado' else 'Outcome revisado' end,
      'summary', coalesce(nullif(btrim(p_reason), ''), v_outcome.conclusion),
      'metric_name', v_outcome.metric_name,
      'system_verdict', v_outcome.system_verdict,
      'resolved_verdict', v_outcome.resolved_verdict,
      'primary_action', jsonb_build_object('kind', 'open_outcome', 'label', 'Abrir outcome')
    )),
    '?view=learning&section=outcomes&item=' || v_outcome.id::text,
    'growth_outcome:' || v_outcome.id::text || ':review:' || extract(epoch from v_now)::text
  );

  return v_outcome;
end;
$$;

create view public.growth_outcomes_due_v
with (security_invoker = true)
as
select
  outcome.id as outcome_id,
  bet.id as bet_id,
  bet.front,
  bet.team_scope,
  bet.owner,
  bet.hypothesis,
  bet.action_text,
  bet.metric_name,
  bet.baseline_value,
  bet.expected_value,
  bet.expected_direction,
  bet.expected_unit,
  bet.success_criterion,
  bet.outcome_window_start,
  bet.outcome_window_end,
  bet.verification_view,
  bet.status as bet_status,
  bet.source_action_candidate_id,
  bet.evidence_snapshot_id as belief_evidence_snapshot_id,
  operational.last_execution_status,
  coalesce(outcome.execution_status, operational.last_execution_status, 'not_started') as execution_status,
  outcome.observed_value,
  outcome.unit as observed_unit,
  outcome.evaluated_at,
  outcome.outcome_status as legacy_outcome_status,
  outcome.system_verdict,
  outcome.review_status,
  outcome.reviewed_at,
  outcome.reviewed_by,
  outcome.contestation_reason,
  outcome.resolved_verdict,
  outcome.conclusion,
  outcome.verification_reason,
  outcome.evidence_snapshot_id as outcome_evidence_snapshot_id,
  case
    when outcome.review_status in ('confirmed_by_user', 'resolved') then 'reviewed'
    when outcome.review_status = 'contested' then 'contested'
    when outcome.system_verdict = 'data_blocked' then 'waiting_data'
    when outcome.system_verdict = 'not_verifiable' then 'not_verifiable'
    when outcome.review_status = 'system_evaluated' then 'ready_review'
    when bet.outcome_window_end = (now() at time zone 'America/Sao_Paulo')::date then 'due_today'
    when bet.outcome_window_end < (now() at time zone 'America/Sao_Paulo')::date then 'overdue'
    else 'scheduled'
  end as due_bucket,
  case
    when outcome.review_status = 'contested' then 100
    when outcome.review_status = 'system_evaluated' then 90
    when outcome.system_verdict = 'data_blocked' then 85
    when bet.outcome_window_end < (now() at time zone 'America/Sao_Paulo')::date then 80
    when bet.outcome_window_end = (now() at time zone 'America/Sao_Paulo')::date then 70
    else 10
  end as attention_rank
from public.growth_bets bet
join public.growth_bets_operational_v operational on operational.id = bet.id
left join public.report_action_outcomes outcome on outcome.bet_id = bet.id;

drop policy if exists report_action_outcomes_authenticated_read
  on public.report_action_outcomes;
create policy report_action_outcomes_authenticated_read
  on public.report_action_outcomes
  for select
  to authenticated
  using ((select auth.uid()) is not null);

revoke all on table public.report_action_outcomes from public, anon, authenticated;
grant select on table public.report_action_outcomes to authenticated;
grant select, insert, update, delete on table public.report_action_outcomes to service_role;

revoke all on table public.growth_outcomes_due_v from public, anon, authenticated;
grant select on table public.growth_outcomes_due_v to authenticated, service_role;

revoke execute on function public.growth_classify_execution_feed_event() from public, anon, authenticated;
revoke execute on function public.growth_prepare_outcome() from public, anon, authenticated;
revoke execute on function public.growth_emit_outcome_evaluated() from public, anon, authenticated;
revoke execute on function public.growth_review_outcome(uuid, text, text, text) from public, anon;

grant execute on function public.growth_classify_execution_feed_event() to service_role;
grant execute on function public.growth_prepare_outcome() to service_role;
grant execute on function public.growth_emit_outcome_evaluated() to service_role;
grant execute on function public.growth_review_outcome(uuid, text, text, text) to authenticated;

comment on column public.report_action_outcomes.system_verdict is
  'Deterministic Growth verdict. Execution not completed can never become not_confirmed.';
comment on view public.growth_outcomes_due_v is
  'Authenticated schedule and review projection for Growth outcomes. Due state is derived from the contracted window and does not depend on a new report build.';
comment on function public.growth_review_outcome(uuid, text, text, text) is
  'Confirms, contests or resolves a deterministic outcome while preserving the system verdict.';
