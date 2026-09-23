-- Aprendizado Growth — Release 3B
-- Operational interaction for governed bets: signal decisions, checklist and timeline commands.

create table public.growth_signal_decisions (
  id uuid primary key default gen_random_uuid(),
  action_candidate_id uuid not null unique references public.report_action_candidates(action_candidate_id) on delete restrict,
  decision_type text not null,
  bet_id uuid references public.growth_bets(id) on delete restrict,
  reason text,
  decided_by uuid not null,
  decided_at timestamptz not null default now(),
  constraint growth_signal_decisions_type_check check (
    decision_type in ('accepted', 'rejected', 'merged')
  ),
  constraint growth_signal_decisions_bet_check check (
    (decision_type = 'rejected' and bet_id is null)
    or (decision_type in ('accepted', 'merged') and bet_id is not null)
  ),
  constraint growth_signal_decisions_reason_check check (
    decision_type <> 'rejected' or nullif(btrim(reason), '') is not null
  )
);

create index growth_signal_decisions_bet_idx
  on public.growth_signal_decisions (bet_id, decided_at desc);

create table public.growth_bet_checklist_items (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.growth_bets(id) on delete cascade,
  label text not null,
  status text not null default 'pending',
  position integer not null,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_bet_checklist_label_check check (nullif(btrim(label), '') is not null),
  constraint growth_bet_checklist_status_check check (status in ('pending', 'completed')),
  constraint growth_bet_checklist_position_check check (position >= 0),
  constraint growth_bet_checklist_completion_check check (
    (status = 'pending' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  ),
  unique (bet_id, position)
);

create index growth_bet_checklist_items_bet_idx
  on public.growth_bet_checklist_items (bet_id, position, id);

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
      'signal_rejected'
    )
  );

alter table public.growth_signal_decisions enable row level security;
alter table public.growth_bet_checklist_items enable row level security;

revoke all on table public.growth_signal_decisions from public, anon, authenticated;
revoke all on table public.growth_bet_checklist_items from public, anon, authenticated;

grant select on table public.growth_signal_decisions to authenticated;
grant select on table public.growth_bet_checklist_items to authenticated;
grant select, insert, update, delete on table public.growth_signal_decisions to service_role;
grant select, insert, update, delete on table public.growth_bet_checklist_items to service_role;

create policy growth_signal_decisions_authenticated_read
  on public.growth_signal_decisions
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_bet_checklist_items_authenticated_read
  on public.growth_bet_checklist_items
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create trigger growth_bet_checklist_items_updated_at
before update on public.growth_bet_checklist_items
for each row execute function public.growth_bets_set_updated_at();

create or replace function public.growth_prevent_signal_decision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'growth_signal_decisions is immutable';
end;
$$;

create trigger growth_signal_decisions_immutable
before update or delete on public.growth_signal_decisions
for each row execute function public.growth_prevent_signal_decision_mutation();

create or replace function public.growth_capture_bet_signal_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_action_candidate_id is not null then
    insert into public.growth_signal_decisions (
      action_candidate_id, decision_type, bet_id, decided_by, decided_at
    ) values (
      new.source_action_candidate_id, 'accepted', new.id, new.created_by, new.created_at
    );
  end if;
  return new;
end;
$$;

create trigger growth_bets_capture_signal_decision
after insert on public.growth_bets
for each row execute function public.growth_capture_bet_signal_decision();

insert into public.growth_signal_decisions (
  action_candidate_id, decision_type, bet_id, decided_by, decided_at
)
select
  bet.source_action_candidate_id,
  'accepted',
  bet.id,
  bet.created_by,
  bet.created_at
from public.growth_bets bet
where bet.source_action_candidate_id is not null
on conflict (action_candidate_id) do nothing;

create or replace function public.growth_reject_signal(
  p_action_candidate_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_candidate public.report_action_candidates%rowtype;
  v_source_event public.growth_feed_events%rowtype;
  v_front text;
  v_event_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'rejection reason is required';
  end if;

  select candidate.* into v_candidate
  from public.report_action_candidates candidate
  where candidate.action_candidate_id = p_action_candidate_id
  for update;

  if not found then
    raise exception 'action candidate not found: %', p_action_candidate_id;
  end if;

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

  v_front := v_source_event.front;

  insert into public.growth_signal_decisions (
    action_candidate_id, decision_type, reason, decided_by, decided_at
  ) values (
    p_action_candidate_id, 'rejected', btrim(p_reason), v_actor, v_now
  );

  update public.report_action_candidates
  set review_status = 'rejected',
      status = 'rejected',
      updated_at = v_now
  where action_candidate_id = p_action_candidate_id;

  insert into public.growth_feed_events (
    id, event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    v_event_id,
    'signal_rejected',
    'action_candidate',
    p_action_candidate_id,
    v_front,
    v_now,
    30,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', 'candidate:' || p_action_candidate_id::text,
      'event_state', 'rejected',
      'confidence_status', v_candidate.confidence_status,
      'source_event_id', v_source_event.id,
      'decided_by', v_actor
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Sinal rejeitado: ' || v_candidate.signal,
      'summary', btrim(p_reason),
      'source_view', v_candidate.source_view,
      'signal_code', v_candidate.signal_code,
      'entity_key', v_candidate.entity_key,
      'evidence_refs', v_candidate.evidence_refs,
      'primary_action', jsonb_build_object('kind', 'open_evidence', 'label', 'Rever decisão')
    )),
    '?view=learning&section=feed&item=' || v_event_id::text,
    'action_candidate:' || p_action_candidate_id::text || ':rejected'
  );

  return v_event_id;
end;
$$;

create or replace function public.growth_merge_signal_into_bet(
  p_action_candidate_id uuid,
  p_bet_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_candidate public.report_action_candidates%rowtype;
  v_bet public.growth_bets%rowtype;
  v_source_event public.growth_feed_events%rowtype;
  v_update_id uuid := gen_random_uuid();
  v_now timestamptz := now();
  v_candidate_front text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select candidate.* into v_candidate
  from public.report_action_candidates candidate
  where candidate.action_candidate_id = p_action_candidate_id
  for update;
  if not found then
    raise exception 'action candidate not found: %', p_action_candidate_id;
  end if;

  select bet.* into v_bet
  from public.growth_bets bet
  where bet.id = p_bet_id
    and bet.status not in ('closed', 'cancelled', 'not_verifiable')
  for update;
  if not found then
    raise exception 'active bet not found: %', p_bet_id;
  end if;

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

  v_candidate_front := v_source_event.front;
  if v_candidate_front <> v_bet.front then
    raise exception 'signal front % does not match bet front %', v_candidate_front, v_bet.front;
  end if;

  insert into public.growth_signal_decisions (
    action_candidate_id, decision_type, bet_id, reason, decided_by, decided_at
  ) values (
    p_action_candidate_id, 'merged', p_bet_id, nullif(btrim(p_reason), ''), v_actor, v_now
  );

  insert into public.growth_bet_updates (
    id, bet_id, update_type, body, metadata, created_by, created_at
  ) values (
    v_update_id,
    p_bet_id,
    'contract_revised',
    coalesce(nullif(btrim(p_reason), ''), 'Sinal relacionado à aposta existente.'),
    jsonb_build_object(
      'change_kind', 'signal_merged',
      'action_candidate_id', p_action_candidate_id,
      'source_event_id', v_source_event.id
    ),
    v_actor,
    v_now
  );

  update public.report_action_candidates
  set review_status = 'approved',
      status = 'merged',
      updated_at = v_now
  where action_candidate_id = p_action_candidate_id;

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'bet_updated',
    'growth_bet',
    p_bet_id,
    v_bet.front,
    v_now,
    55,
    jsonb_build_object(
      'group_key', 'bet:' || p_bet_id::text,
      'event_state', v_bet.status,
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'source_action_candidate_id', p_action_candidate_id,
      'update_id', v_update_id
    ),
    jsonb_build_object(
      'title', 'Novo sinal mesclado à aposta',
      'summary', v_candidate.signal,
      'action_text', coalesce(nullif(btrim(p_reason), ''), v_bet.action_text),
      'primary_action', jsonb_build_object('kind', 'open_bet', 'label', 'Abrir aposta')
    ),
    '?view=learning&section=bets&item=' || p_bet_id::text,
    'growth_bet:' || p_bet_id::text || ':signal_merged:' || p_action_candidate_id::text
  );

  return v_update_id;
end;
$$;

create or replace function public.growth_add_bet_checklist_item(
  p_bet_id uuid,
  p_label text
)
returns public.growth_bet_checklist_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item public.growth_bet_checklist_items%rowtype;
  v_position integer;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if nullif(btrim(p_label), '') is null then
    raise exception 'checklist label is required';
  end if;
  if not exists (
    select 1 from public.growth_bets bet
    where bet.id = p_bet_id and bet.status not in ('closed', 'cancelled')
  ) then
    raise exception 'editable bet not found: %', p_bet_id;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_bet_id::text, 0));
  select coalesce(max(item.position) + 1, 0) into v_position
  from public.growth_bet_checklist_items item
  where item.bet_id = p_bet_id;

  insert into public.growth_bet_checklist_items (
    bet_id, label, status, position, created_by
  ) values (
    p_bet_id, btrim(p_label), 'pending', v_position, v_actor
  ) returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.growth_set_bet_checklist_item(
  p_item_id uuid,
  p_status text
)
returns public.growth_bet_checklist_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item public.growth_bet_checklist_items%rowtype;
  v_bet public.growth_bets%rowtype;
  v_update_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_status not in ('pending', 'completed') then
    raise exception 'invalid checklist status: %', p_status;
  end if;

  select item.* into v_item
  from public.growth_bet_checklist_items item
  where item.id = p_item_id
  for update;
  if not found then
    raise exception 'checklist item not found: %', p_item_id;
  end if;

  select bet.* into strict v_bet
  from public.growth_bets bet
  where bet.id = v_item.bet_id;

  update public.growth_bet_checklist_items
  set status = p_status,
      completed_at = case when p_status = 'completed' then v_now else null end
  where id = p_item_id
  returning * into v_item;

  insert into public.growth_bet_updates (
    id, bet_id, update_type, body, metadata, created_by, created_at
  ) values (
    v_update_id,
    v_item.bet_id,
    'status_changed',
    case when p_status = 'completed'
      then 'Checklist concluído: ' || v_item.label
      else 'Checklist reaberto: ' || v_item.label
    end,
    jsonb_build_object('change_kind', 'checklist', 'item_id', v_item.id, 'item_status', p_status),
    v_actor,
    v_now
  );

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'bet_updated', 'growth_bet', v_bet.id, v_bet.front, v_now, 45,
    jsonb_build_object(
      'group_key', 'bet:' || v_bet.id::text,
      'event_state', v_bet.status,
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'update_id', v_update_id
    ),
    jsonb_build_object(
      'title', case when p_status = 'completed' then 'Etapa concluída na aposta' else 'Etapa reaberta na aposta' end,
      'summary', v_item.label,
      'primary_action', jsonb_build_object('kind', 'open_bet', 'label', 'Abrir aposta')
    ),
    '?view=learning&section=bets&item=' || v_bet.id::text,
    'growth_bet:' || v_bet.id::text || ':checklist:' || v_update_id::text
  );

  return v_item;
end;
$$;

create or replace function public.growth_append_bet_update(
  p_bet_id uuid,
  p_update_type text,
  p_body text,
  p_execution_status text default null,
  p_bet_status text default null
)
returns public.growth_bet_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_bet public.growth_bets%rowtype;
  v_update public.growth_bet_updates%rowtype;
  v_now timestamptz := now();
  v_is_material boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_update_type not in ('comment', 'execution', 'status_changed') then
    raise exception 'invalid operational update type: %', p_update_type;
  end if;
  if nullif(btrim(p_body), '') is null then
    raise exception 'update body is required';
  end if;
  if p_execution_status is not null
    and p_execution_status not in ('not_started', 'partial', 'completed', 'cancelled', 'unknown')
  then
    raise exception 'invalid execution status: %', p_execution_status;
  end if;
  if p_bet_status is not null
    and p_bet_status not in (
      'approved', 'in_progress', 'waiting_window', 'ready_for_review',
      'closed', 'cancelled', 'not_verifiable'
    )
  then
    raise exception 'invalid bet status: %', p_bet_status;
  end if;
  if p_update_type = 'status_changed' and p_bet_status is null then
    raise exception 'status_changed requires a bet status';
  end if;
  if p_update_type = 'execution' and p_execution_status is null then
    raise exception 'execution update requires an execution status';
  end if;

  select bet.* into v_bet
  from public.growth_bets bet
  where bet.id = p_bet_id
  for update;
  if not found then
    raise exception 'bet not found: %', p_bet_id;
  end if;

  insert into public.growth_bet_updates (
    bet_id, update_type, body, execution_status, metadata, created_by, created_at
  ) values (
    p_bet_id,
    p_update_type,
    btrim(p_body),
    p_execution_status,
    jsonb_strip_nulls(jsonb_build_object('previous_status', v_bet.status, 'new_status', p_bet_status)),
    v_actor,
    v_now
  ) returning * into v_update;

  if p_bet_status is not null and p_bet_status <> v_bet.status then
    update public.growth_bets
    set status = p_bet_status
    where id = p_bet_id
    returning * into v_bet;
  end if;

  v_is_material := p_update_type in ('execution', 'status_changed');
  if v_is_material then
    insert into public.growth_feed_events (
      event_type, subject_type, subject_id, front, occurred_at, priority_score,
      relevance_dimensions, summary_snapshot, route, dedupe_key
    ) values (
      'bet_updated', 'growth_bet', v_bet.id, v_bet.front, v_now, 50,
      jsonb_strip_nulls(jsonb_build_object(
        'group_key', 'bet:' || v_bet.id::text,
        'event_state', v_bet.status,
        'team_scope', v_bet.team_scope,
        'owner', v_bet.owner,
        'execution_status', p_execution_status,
        'update_id', v_update.id
      )),
      jsonb_strip_nulls(jsonb_build_object(
        'title', case when p_update_type = 'execution' then 'Execução atualizada' else 'Estado da aposta atualizado' end,
        'summary', btrim(p_body),
        'execution_status', p_execution_status,
        'event_state', v_bet.status,
        'primary_action', jsonb_build_object('kind', 'open_bet', 'label', 'Abrir aposta')
      )),
      '?view=learning&section=bets&item=' || v_bet.id::text,
      'growth_bet:' || v_bet.id::text || ':update:' || v_update.id::text
    );
  end if;

  return v_update;
end;
$$;

drop view public.growth_bets_operational_v;

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
  coalesce(checklist.total_count, 0)::integer as checklist_total,
  coalesce(checklist.completed_count, 0)::integer as checklist_completed,
  timeline.last_update_at,
  timeline.last_execution_status,
  coalesce(timeline.update_count, 0)::integer as update_count,
  coalesce(merged.merged_signal_count, 0)::integer as merged_signal_count
from public.growth_bets bet
join public.growth_evidence_snapshots evidence
  on evidence.id = bet.evidence_snapshot_id
left join lateral (
  select
    count(*) as total_count,
    count(*) filter (where item.status = 'completed') as completed_count
  from public.growth_bet_checklist_items item
  where item.bet_id = bet.id
) checklist on true
left join lateral (
  select
    max(update_row.created_at) as last_update_at,
    (array_agg(update_row.execution_status order by update_row.created_at desc, update_row.id desc)
      filter (where update_row.execution_status is not null))[1] as last_execution_status,
    count(*) as update_count
  from public.growth_bet_updates update_row
  where update_row.bet_id = bet.id
) timeline on true
left join lateral (
  select count(*) as merged_signal_count
  from public.growth_signal_decisions decision
  where decision.bet_id = bet.id and decision.decision_type = 'merged'
) merged on true;

revoke all on table public.growth_bets_operational_v from public, anon, authenticated;
grant select on table public.growth_bets_operational_v to authenticated, service_role;

create view public.growth_signal_decisions_v
with (security_invoker = true)
as
select
  decision.id,
  decision.action_candidate_id,
  decision.decision_type,
  decision.bet_id,
  decision.reason,
  decision.decided_by,
  decision.decided_at
from public.growth_signal_decisions decision;

revoke all on table public.growth_signal_decisions_v from public, anon, authenticated;
grant select on table public.growth_signal_decisions_v to authenticated, service_role;

revoke execute on function public.growth_capture_bet_signal_decision() from public, anon, authenticated;
revoke execute on function public.growth_prevent_signal_decision_mutation() from public, anon, authenticated;
revoke execute on function public.growth_reject_signal(uuid, text) from public, anon;
revoke execute on function public.growth_merge_signal_into_bet(uuid, uuid, text) from public, anon;
revoke execute on function public.growth_add_bet_checklist_item(uuid, text) from public, anon;
revoke execute on function public.growth_set_bet_checklist_item(uuid, text) from public, anon;
revoke execute on function public.growth_append_bet_update(uuid, text, text, text, text) from public, anon;

grant execute on function public.growth_capture_bet_signal_decision() to service_role;
grant execute on function public.growth_prevent_signal_decision_mutation() to service_role;
grant execute on function public.growth_reject_signal(uuid, text) to authenticated;
grant execute on function public.growth_merge_signal_into_bet(uuid, uuid, text) to authenticated;
grant execute on function public.growth_add_bet_checklist_item(uuid, text) to authenticated;
grant execute on function public.growth_set_bet_checklist_item(uuid, text) to authenticated;
grant execute on function public.growth_append_bet_update(uuid, text, text, text, text) to authenticated;

comment on table public.growth_signal_decisions is
  'Immutable operator decision for each governed recommendation: accepted, rejected or merged into an existing bet.';

comment on table public.growth_bet_checklist_items is
  'Operational checklist for a Growth bet. State changes are audited in the append-only bet timeline.';

comment on function public.growth_reject_signal(uuid, text) is
  'Rejects a governed recommendation with a mandatory reason and emits an immutable decision event.';

comment on function public.growth_merge_signal_into_bet(uuid, uuid, text) is
  'Associates a governed recommendation with an active bet in the same front and emits a material bet update.';

comment on function public.growth_append_bet_update(uuid, text, text, text, text) is
  'Appends comments or operational updates; only execution and status changes produce feed events.';

comment on view public.growth_bets_operational_v is
  'Authenticated operational projection for the Apostas workspace with checklist and timeline aggregates; no outcome semantics are inferred.';
