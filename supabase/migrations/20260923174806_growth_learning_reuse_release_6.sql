-- Aprendizado Growth — Release 6
-- Deterministic memory retrieval and immutable reuse/discard snapshots.

create table public.growth_learning_applications (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.growth_bets(id) on delete restrict,
  action_candidate_id uuid not null references public.report_action_candidates(action_candidate_id) on delete restrict,
  learning_id uuid not null references public.growth_learnings(id) on delete restrict,
  learning_revision integer not null,
  decision text not null,
  decision_reason text,
  match_score integer not null,
  match_reasons jsonb not null,
  eligibility_snapshot text not null,
  context_snapshot jsonb not null,
  decided_by uuid not null,
  created_at timestamptz not null default now(),
  constraint growth_learning_applications_unique unique (bet_id, learning_id),
  constraint growth_learning_applications_revision_check check (learning_revision >= 1),
  constraint growth_learning_applications_decision_check check (decision in ('reused', 'discarded')),
  constraint growth_learning_applications_reason_check check (
    decision = 'reused' or nullif(btrim(decision_reason), '') is not null
  ),
  constraint growth_learning_applications_score_check check (match_score >= 0),
  constraint growth_learning_applications_reasons_check check (jsonb_typeof(match_reasons) = 'array'),
  constraint growth_learning_applications_context_check check (jsonb_typeof(context_snapshot) = 'object'),
  constraint growth_learning_applications_eligibility_check check (
    eligibility_snapshot in ('reusable', 'needs_review')
  )
);

create index growth_learning_applications_learning_idx
  on public.growth_learning_applications(learning_id, created_at desc);

create index growth_learning_applications_bet_idx
  on public.growth_learning_applications(bet_id, created_at);

alter table public.growth_learning_applications enable row level security;

create policy growth_learning_applications_authenticated_select
on public.growth_learning_applications
for select
to authenticated
using (true);

create policy growth_learning_applications_service_all
on public.growth_learning_applications
for all
to service_role
using (true)
with check (true);

create or replace function public.growth_prevent_learning_application_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'learning application snapshots are append-only';
end;
$$;

create trigger growth_learning_applications_append_only
before update or delete on public.growth_learning_applications
for each row execute function public.growth_prevent_learning_application_mutation();

create or replace function public.growth_normalize_match_text(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      translate(lower(coalesce(p_value, '')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
      '[^a-z0-9]+', '', 'g'
    ),
    ''
  );
$$;

create or replace function public.growth_evidence_dimension(p_evidence jsonb, p_key text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case jsonb_typeof(coalesce(p_evidence, 'null'::jsonb))
    when 'object' then p_evidence ->> p_key
    when 'array' then (
      select evidence.item ->> p_key
      from jsonb_array_elements(p_evidence) as evidence(item)
      where jsonb_typeof(evidence.item) = 'object' and evidence.item ? p_key
      limit 1
    )
    else null
  end;
$$;

create or replace function public.growth_find_applicable_learnings(p_action_candidate_id uuid)
returns table (
  learning_id uuid,
  learning_revision integer,
  source_kind text,
  source_title text,
  source_ref text,
  statement text,
  classification text,
  lifecycle_status text,
  confidence_status text,
  eligibility text,
  review_due boolean,
  match_score integer,
  match_reasons jsonb,
  limitations jsonb,
  scope jsonb,
  applicability jsonb,
  context_snapshot jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.report_action_candidates candidate
    where candidate.action_candidate_id = p_action_candidate_id
  ) then
    raise exception 'action candidate not found: %', p_action_candidate_id;
  end if;

  return query
  with candidate as (
    select
      source.action_candidate_id,
      case lower(source.domain)
        when 'crm' then 'crm_acquisition'
        when 'crm_aquisicao' then 'crm_acquisition'
        when 'midia' then 'paid_media'
        when 'mídia' then 'paid_media'
        when 'media' then 'paid_media'
        when 'paid_media' then 'paid_media'
        when 'b2c' then 'b2c_origin'
        when 'originacao_b2c' then 'b2c_origin'
        else null
      end as front,
      jsonb_strip_nulls(jsonb_build_object(
        'domain', lower(source.domain),
        'metric', nullif(btrim(source.success_metric), ''),
        'partner', nullif(btrim(source.partner), ''),
        'entity', nullif(btrim(source.entity_key), ''),
        'entity_key', nullif(btrim(source.entity_key), ''),
        'signal_code', nullif(btrim(source.signal_code), ''),
        'source_view', nullif(btrim(source.source_view), ''),
        'channel', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'channel')), ''),
        'platform', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'platform')), ''),
        'system', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'system')), ''),
        'artifact', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'artifact')), ''),
        'rule', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'rule')), ''),
        'campaign_family', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'campaign_family')), ''),
        'regime', nullif(btrim(public.growth_evidence_dimension(source.evidence_refs, 'regime')), '')
      )) as context_snapshot
    from public.report_action_candidates source
    where source.action_candidate_id = p_action_candidate_id
  ), ranked as (
    select
      learning.*,
      candidate.context_snapshot,
      coalesce(matches.match_score, 0)::integer
        + case when learning.source_kind = 'outcome' then 10 else 0 end
        + case when learning.classification = 'confirmed' then 5 else 0 end
        + case when learning.confidence_status = 'confirmed' then 5 else 0 end
        - case when learning.review_at <= current_date then 10 else 0 end as total_score,
      coalesce(matches.match_reasons, '[]'::jsonb) as calculated_reasons,
      case
        when learning.lifecycle_status = 'superseded' then 'superseded'
        when learning.lifecycle_status = 'expired'
          or (learning.valid_until is not null and learning.valid_until < current_date) then 'expired'
        when learning.lifecycle_status = 'contested'
          or learning.classification = 'contradictory' then 'contested'
        when learning.classification = 'invalidated'
          or learning.confidence_status = 'blocked' then 'blocked'
        when learning.review_at <= current_date then 'needs_review'
        else 'reusable'
      end as calculated_eligibility
    from candidate
    join public.growth_learnings learning on learning.front = candidate.front
    cross join lateral (
      select
        count(*)::integer as matched_count,
        coalesce(sum(dimension.weight), 0)::integer as match_score,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'dimension', dimension.dimension,
              'value', dimension.candidate_value,
              'weight', dimension.weight
            ) order by dimension.weight desc, dimension.dimension
          ) filter (
            where public.growth_normalize_match_text(dimension.learning_value)
              = public.growth_normalize_match_text(dimension.candidate_value)
          ),
          '[]'::jsonb
        ) as match_reasons,
        count(*) filter (
          where public.growth_normalize_match_text(dimension.learning_value)
            <> public.growth_normalize_match_text(dimension.candidate_value)
        )::integer as conflict_count
      from (values
        ('metric', 40, learning.scope ->> 'metric', candidate.context_snapshot ->> 'metric'),
        ('signal_code', 30, learning.scope ->> 'signal_code', candidate.context_snapshot ->> 'signal_code'),
        ('partner', 25, learning.scope ->> 'partner', candidate.context_snapshot ->> 'partner'),
        ('regime', 25, coalesce(learning.scope ->> 'regime', learning.regime), candidate.context_snapshot ->> 'regime'),
        ('entity', 20, learning.scope ->> 'entity', candidate.context_snapshot ->> 'entity'),
        ('entity_key', 20, learning.scope ->> 'entity_key', candidate.context_snapshot ->> 'entity_key'),
        ('source_view', 20, learning.scope ->> 'source_view', candidate.context_snapshot ->> 'source_view'),
        ('channel', 15, learning.scope ->> 'channel', candidate.context_snapshot ->> 'channel'),
        ('platform', 10, learning.scope ->> 'platform', candidate.context_snapshot ->> 'platform'),
        ('system', 10, learning.scope ->> 'system', candidate.context_snapshot ->> 'system'),
        ('artifact', 10, learning.scope ->> 'artifact', candidate.context_snapshot ->> 'artifact'),
        ('rule', 10, learning.scope ->> 'rule', candidate.context_snapshot ->> 'rule'),
        ('campaign_family', 10, learning.scope ->> 'campaign_family', candidate.context_snapshot ->> 'campaign_family')
      ) as dimension(dimension, weight, learning_value, candidate_value)
      where public.growth_normalize_match_text(dimension.learning_value) is not null
        and public.growth_normalize_match_text(dimension.candidate_value) is not null
    ) matches
    where matches.matched_count > 0
      and matches.conflict_count = 0
  )
  select
    ranked.id,
    ranked.current_revision,
    ranked.source_kind,
    ranked.source_title,
    ranked.source_ref,
    ranked.statement,
    ranked.classification,
    ranked.lifecycle_status,
    ranked.confidence_status,
    ranked.calculated_eligibility,
    ranked.review_at <= current_date,
    greatest(0, ranked.total_score),
    ranked.calculated_reasons,
    ranked.limitations,
    ranked.scope,
    ranked.applicability,
    ranked.context_snapshot
  from ranked
  order by ranked.total_score desc, ranked.updated_at desc, ranked.id
  limit 5;
end;
$$;

create or replace function public.growth_accept_signal_as_bet_with_memory(
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
  p_learning_decisions jsonb default '[]'::jsonb,
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
  v_bet public.growth_bets%rowtype;
  v_item jsonb;
  v_learning_id uuid;
  v_decision text;
  v_reason text;
  v_suggestion record;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(coalesce(p_learning_decisions, '[]'::jsonb)) <> 'array' then
    raise exception 'learning decisions must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) as decision(item)
    group by decision.item ->> 'learning_id'
    having count(*) > 1
  ) then
    raise exception 'each learning may be decided only once';
  end if;

  if exists (
    select 1
    from public.growth_find_applicable_learnings(p_action_candidate_id) suggestion
    where suggestion.eligibility in ('reusable', 'needs_review')
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) as decision(item)
        where decision.item ->> 'learning_id' = suggestion.learning_id::text
      )
  ) then
    raise exception 'every eligible learning suggestion requires reused or discarded decision';
  end if;

  for v_item in
    select decision.item
    from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) as decision(item)
  loop
    begin
      v_learning_id := (v_item ->> 'learning_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'invalid learning id in decision';
    end;
    v_decision := v_item ->> 'decision';
    v_reason := nullif(btrim(v_item ->> 'reason'), '');

    select suggestion.* into v_suggestion
    from public.growth_find_applicable_learnings(p_action_candidate_id) suggestion
    where suggestion.learning_id = v_learning_id;

    if not found or v_suggestion.eligibility not in ('reusable', 'needs_review') then
      raise exception 'learning % is not an eligible suggestion for candidate %', v_learning_id, p_action_candidate_id;
    end if;
    if v_decision not in ('reused', 'discarded') then
      raise exception 'invalid learning decision: %', coalesce(v_decision, '<null>');
    end if;
    if v_decision = 'discarded' and v_reason is null then
      raise exception 'discarded learning requires a reason';
    end if;
  end loop;

  select * into v_bet
  from public.growth_accept_signal_as_bet(
    p_action_candidate_id,
    p_team_scope,
    p_hypothesis,
    p_action_text,
    p_metric_name,
    p_baseline_value,
    p_expected_value,
    p_expected_direction,
    p_success_criterion,
    p_outcome_window_start,
    p_outcome_window_end,
    p_verification_view,
    p_expected_unit,
    p_execution_due_at,
    p_stop_condition,
    p_known_alternatives,
    p_owner
  );

  for v_item in
    select decision.item
    from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) as decision(item)
  loop
    v_learning_id := (v_item ->> 'learning_id')::uuid;
    v_decision := v_item ->> 'decision';
    v_reason := nullif(btrim(v_item ->> 'reason'), '');

    select suggestion.* into v_suggestion
    from public.growth_find_applicable_learnings(p_action_candidate_id) suggestion
    where suggestion.learning_id = v_learning_id;

    insert into public.growth_learning_applications (
      bet_id,
      action_candidate_id,
      learning_id,
      learning_revision,
      decision,
      decision_reason,
      match_score,
      match_reasons,
      eligibility_snapshot,
      context_snapshot,
      decided_by
    ) values (
      v_bet.id,
      p_action_candidate_id,
      v_learning_id,
      v_suggestion.learning_revision,
      v_decision,
      v_reason,
      v_suggestion.match_score,
      v_suggestion.match_reasons,
      v_suggestion.eligibility,
      v_suggestion.context_snapshot,
      v_actor
    );

    if v_decision = 'reused' then
      insert into public.growth_learning_links (learning_id, target_type, target_id, relation_type)
      values (v_learning_id, 'bet', v_bet.id::text, 'applies_to')
      on conflict do nothing;
    end if;
  end loop;

  return v_bet;
end;
$$;

create view public.growth_learning_applications_v
with (security_invoker = true)
as
select
  application.*,
  learning.source_kind,
  learning.source_title,
  learning.source_ref,
  revision.statement,
  revision.classification,
  revision.confidence_status,
  revision.limitations,
  bet.hypothesis as bet_hypothesis
from public.growth_learning_applications application
join public.growth_learnings learning on learning.id = application.learning_id
join public.growth_learning_revisions revision
  on revision.learning_id = application.learning_id
 and revision.revision = application.learning_revision
join public.growth_bets bet on bet.id = application.bet_id;

create or replace view public.growth_memory_active_v
with (security_invoker = true)
as
select
  learning.*,
  learning.source_kind = 'outcome' as validated_by_loop,
  learning.review_at <= current_date as review_due,
  coalesce(revisions.revision_count, 0)::integer as revision_count,
  revisions.last_revision_at,
  coalesce(links.link_count, 0)::integer as link_count,
  coalesce(applications.reused_count, 0)::integer as reused_count,
  coalesce(applications.discarded_count, 0)::integer as discarded_count,
  case
    when coalesce(applications.decision_count, 0) = 0 then null
    else round(applications.reused_count::numeric / applications.decision_count, 4)
  end as reuse_rate
from public.growth_learnings learning
left join lateral (
  select count(*) as revision_count, max(revision.created_at) as last_revision_at
  from public.growth_learning_revisions revision
  where revision.learning_id = learning.id
) revisions on true
left join lateral (
  select count(*) as link_count
  from public.growth_learning_links link
  where link.learning_id = learning.id
) links on true
left join lateral (
  select
    count(*) as decision_count,
    count(*) filter (where application.decision = 'reused') as reused_count,
    count(*) filter (where application.decision = 'discarded') as discarded_count
  from public.growth_learning_applications application
  where application.learning_id = learning.id
) applications on true
where learning.lifecycle_status in ('active', 'contested');

revoke all on table public.growth_learning_applications from public, anon, authenticated;
grant select on table public.growth_learning_applications to authenticated, service_role;

revoke all on table public.growth_learning_applications_v from public, anon, authenticated;
grant select on table public.growth_learning_applications_v to authenticated, service_role;

revoke all on table public.growth_memory_active_v from public, anon, authenticated;
grant select on table public.growth_memory_active_v to authenticated, service_role;

revoke execute on function public.growth_prevent_learning_application_mutation() from public, anon, authenticated;
revoke execute on function public.growth_normalize_match_text(text) from public, anon, authenticated;
revoke execute on function public.growth_evidence_dimension(jsonb, text) from public, anon, authenticated;
revoke execute on function public.growth_find_applicable_learnings(uuid) from public, anon;
revoke execute on function public.growth_accept_signal_as_bet_with_memory(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  jsonb, text, timestamptz, text, jsonb, text
) from public, anon;

grant execute on function public.growth_prevent_learning_application_mutation() to service_role;
grant execute on function public.growth_normalize_match_text(text) to service_role;
grant execute on function public.growth_evidence_dimension(jsonb, text) to service_role;
grant execute on function public.growth_find_applicable_learnings(uuid) to authenticated, service_role;
grant execute on function public.growth_accept_signal_as_bet_with_memory(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  jsonb, text, timestamptz, text, jsonb, text
) to authenticated, service_role;

comment on table public.growth_learning_applications is
  'Immutable server-calculated snapshot of a learning explicitly reused or discarded when a new Growth bet is created.';

comment on function public.growth_find_applicable_learnings(uuid) is
  'Returns at most five deterministic memory matches. Same-front alone never qualifies; explicit dimension conflicts exclude the match.';

comment on function public.growth_accept_signal_as_bet_with_memory(
  uuid, text, text, text, text, numeric, numeric, text, text, date, date, text,
  jsonb, text, timestamptz, text, jsonb, text
) is
  'Atomically creates a bet through the Release 3 contract and freezes every eligible memory suggestion as reused or discarded.';

comment on view public.growth_learning_applications_v is
  'Authenticated read model of the exact learning revision and decision frozen for each Growth bet.';
