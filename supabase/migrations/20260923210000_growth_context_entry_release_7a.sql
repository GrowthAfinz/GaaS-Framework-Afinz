-- Aprendizado Growth — Release 7A
-- Contextual entry from analytic surfaces into the governed bet contract.

alter table public.growth_learning_applications
  alter column action_candidate_id drop not null;

alter table public.growth_learning_applications
  add constraint growth_learning_applications_source_check check (
    action_candidate_id is not null
    or nullif(btrim(context_snapshot ->> 'source_view'), '') is not null
  );

create or replace function public.growth_context_filter_scalar(p_filters jsonb, p_key text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case jsonb_typeof(coalesce(p_filters -> p_key, 'null'::jsonb))
    when 'string' then nullif(btrim(p_filters ->> p_key), '')
    when 'array' then case
      when jsonb_array_length(p_filters -> p_key) = 1
        and jsonb_typeof((p_filters -> p_key) -> 0) = 'string'
      then nullif(btrim((p_filters -> p_key) ->> 0), '')
      else null
    end
    else null
  end;
$$;

create or replace function public.growth_find_applicable_learnings_for_context(
  p_front text,
  p_context_snapshot jsonb
)
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
  if p_front not in ('crm_acquisition', 'paid_media', 'b2c_origin') then
    raise exception 'unsupported growth front: %', coalesce(p_front, '<null>');
  end if;
  if jsonb_typeof(coalesce(p_context_snapshot, 'null'::jsonb)) <> 'object' then
    raise exception 'context snapshot must be a JSON object';
  end if;

  return query
  with candidate as (
    select
      p_front as front,
      jsonb_strip_nulls(p_context_snapshot) as context_snapshot
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
declare
  v_candidate public.report_action_candidates%rowtype;
  v_front text;
  v_context jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select candidate.* into v_candidate
  from public.report_action_candidates candidate
  where candidate.action_candidate_id = p_action_candidate_id;

  if not found then
    raise exception 'action candidate not found: %', p_action_candidate_id;
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
    raise exception 'unsupported candidate domain for memory matching: %', v_candidate.domain;
  end if;

  v_context := jsonb_strip_nulls(jsonb_build_object(
    'domain', lower(v_candidate.domain),
    'metric', nullif(btrim(v_candidate.success_metric), ''),
    'partner', nullif(btrim(v_candidate.partner), ''),
    'entity', nullif(btrim(v_candidate.entity_key), ''),
    'entity_key', nullif(btrim(v_candidate.entity_key), ''),
    'signal_code', nullif(btrim(v_candidate.signal_code), ''),
    'source_view', nullif(btrim(v_candidate.source_view), ''),
    'channel', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'channel')), ''),
    'platform', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'platform')), ''),
    'system', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'system')), ''),
    'artifact', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'artifact')), ''),
    'rule', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'rule')), ''),
    'campaign_family', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'campaign_family')), ''),
    'regime', nullif(btrim(public.growth_evidence_dimension(v_candidate.evidence_refs, 'regime')), '')
  ));

  return query
  select suggestion.*
  from public.growth_find_applicable_learnings_for_context(v_front, v_context) suggestion;
end;
$$;

create or replace function public.growth_create_contextual_bet_with_memory(
  p_front text,
  p_source_context jsonb,
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
  v_now timestamptz := now();
  v_surface text;
  v_source_route text;
  v_title text;
  v_period_start date;
  v_period_end date;
  v_filters jsonb;
  v_entity_key text;
  v_visual_ref text;
  v_context jsonb;
  v_match_context jsonb;
  v_snapshot public.growth_evidence_snapshots%rowtype;
  v_bet public.growth_bets%rowtype;
  v_belief jsonb;
  v_item jsonb;
  v_learning_id uuid;
  v_decision text;
  v_reason text;
  v_suggestion record;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_front not in ('crm_acquisition', 'paid_media', 'b2c_origin') then
    raise exception 'unsupported growth front: %', coalesce(p_front, '<null>');
  end if;
  if jsonb_typeof(coalesce(p_source_context, 'null'::jsonb)) <> 'object' then
    raise exception 'source context must be a JSON object';
  end if;

  v_surface := nullif(btrim(p_source_context ->> 'source_surface'), '');
  v_source_route := nullif(btrim(p_source_context ->> 'source_route'), '');
  v_title := nullif(btrim(p_source_context ->> 'title'), '');
  v_entity_key := nullif(btrim(p_source_context ->> 'entity_key'), '');
  v_visual_ref := nullif(btrim(p_source_context ->> 'visual_ref'), '');
  v_filters := coalesce(p_source_context -> 'filters', '{}'::jsonb);

  if v_surface not in ('reports_overview', 'reports_daily', 'reports_monthly', 'acquisition_funnel') then
    raise exception 'unsupported analytic source surface: %', coalesce(v_surface, '<null>');
  end if;
  if v_source_route is null or v_title is null then
    raise exception 'source route and title are required';
  end if;
  if v_surface like 'reports_%' and p_front <> 'crm_acquisition' then
    raise exception 'report surfaces only support crm_acquisition in Release 7A';
  end if;
  if v_surface = 'acquisition_funnel' and p_front = 'crm_acquisition' then
    raise exception 'acquisition funnel requires paid_media or b2c_origin';
  end if;
  if jsonb_typeof(v_filters) <> 'object' then
    raise exception 'source filters must be a JSON object';
  end if;
  if coalesce(p_source_context ->> 'period_start', '') !~ '^\d{4}-\d{2}-\d{2}$'
    or coalesce(p_source_context ->> 'period_end', '') !~ '^\d{4}-\d{2}-\d{2}$'
  then
    raise exception 'source period requires ISO dates';
  end if;
  begin
    v_period_start := (p_source_context ->> 'period_start')::date;
    v_period_end := (p_source_context ->> 'period_end')::date;
  exception when datetime_field_overflow then
    raise exception 'source period contains an invalid date';
  end;
  if v_period_start > v_period_end then
    raise exception 'source period start must be on or before its end';
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
  if jsonb_typeof(coalesce(p_learning_decisions, '[]'::jsonb)) <> 'array' then
    raise exception 'learning decisions must be a JSON array';
  end if;

  v_context := jsonb_strip_nulls(p_source_context || jsonb_build_object(
    'front', p_front,
    'source_surface', v_surface,
    'source_route', v_source_route,
    'period_start', v_period_start,
    'period_end', v_period_end,
    'filters', v_filters,
    'entity_key', v_entity_key,
    'visual_ref', v_visual_ref,
    'title', v_title
  ));

  v_match_context := jsonb_strip_nulls(jsonb_build_object(
    'metric', btrim(p_metric_name),
    'entity', v_entity_key,
    'entity_key', v_entity_key,
    'source_view', v_surface,
    'partner', coalesce(
      public.growth_context_filter_scalar(v_filters, 'partner'),
      public.growth_context_filter_scalar(v_filters, 'parceiros')
    ),
    'channel', coalesce(
      public.growth_context_filter_scalar(v_filters, 'channel'),
      public.growth_context_filter_scalar(v_filters, 'canais')
    ),
    'platform', public.growth_context_filter_scalar(v_filters, 'platform'),
    'system', public.growth_context_filter_scalar(v_filters, 'system'),
    'artifact', public.growth_context_filter_scalar(v_filters, 'artifact'),
    'rule', public.growth_context_filter_scalar(v_filters, 'rule'),
    'campaign_family', public.growth_context_filter_scalar(v_filters, 'campaign_family'),
    'regime', public.growth_context_filter_scalar(v_filters, 'regime'),
    'signal_code', public.growth_context_filter_scalar(v_filters, 'signal_code')
  ));

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) decision(item)
    group by decision.item ->> 'learning_id'
    having count(*) > 1
  ) then
    raise exception 'each learning may be decided only once';
  end if;
  if exists (
    select 1
    from public.growth_find_applicable_learnings_for_context(p_front, v_match_context) suggestion
    where suggestion.eligibility in ('reusable', 'needs_review')
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) decision(item)
        where decision.item ->> 'learning_id' = suggestion.learning_id::text
      )
  ) then
    raise exception 'every eligible learning suggestion requires reused or discarded decision';
  end if;

  for v_item in select decision.item from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) decision(item)
  loop
    begin
      v_learning_id := (v_item ->> 'learning_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'invalid learning id in decision';
    end;
    v_decision := v_item ->> 'decision';
    v_reason := nullif(btrim(v_item ->> 'reason'), '');
    select suggestion.* into v_suggestion
    from public.growth_find_applicable_learnings_for_context(p_front, v_match_context) suggestion
    where suggestion.learning_id = v_learning_id;
    if not found or v_suggestion.eligibility not in ('reusable', 'needs_review') then
      raise exception 'learning % is not an eligible suggestion for contextual bet', v_learning_id;
    end if;
    if v_decision not in ('reused', 'discarded') then
      raise exception 'invalid learning decision: %', coalesce(v_decision, '<null>');
    end if;
    if v_decision = 'discarded' and v_reason is null then
      raise exception 'discarded learning requires a reason';
    end if;
  end loop;

  insert into public.growth_evidence_snapshots (
    source_run_id, artifact_path, source_hash, period_start, period_end,
    filters, metrics, quality_state, regime, created_at
  ) values (
    null,
    null,
    md5(v_context::text),
    v_period_start,
    v_period_end,
    v_filters || jsonb_strip_nulls(jsonb_build_object(
      'front', p_front,
      'source_surface', v_surface,
      'source_route', v_source_route,
      'entity_key', v_entity_key,
      'visual_ref', v_visual_ref
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'metric_name', btrim(p_metric_name),
      'baseline_value', p_baseline_value,
      'expected_value', p_expected_value,
      'expected_direction', p_expected_direction,
      'expected_unit', nullif(btrim(p_expected_unit), ''),
      'success_criterion', btrim(p_success_criterion)
    )),
    jsonb_build_object(
      'source_kind', 'interactive_analytic_context',
      'capture_mode', 'user_confirmed_contract',
      'source_values_recomputed', false
    ),
    jsonb_strip_nulls(jsonb_build_object(
      'regime', public.growth_context_filter_scalar(v_filters, 'regime')
    )),
    v_now
  ) returning * into v_snapshot;

  v_belief := jsonb_build_object(
    'contract_version', 'growth-bet-contract-v1',
    'approved_at', v_now,
    'evidence_snapshot_id', v_snapshot.id,
    'source_context', v_context,
    'match_context', v_match_context,
    'contract', jsonb_strip_nulls(jsonb_build_object(
      'front', p_front,
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
    source_action_candidate_id, evidence_snapshot_id, front, team_scope, owner,
    hypothesis, action_text, metric_name, baseline_value, expected_value,
    expected_direction, expected_unit, success_criterion, execution_due_at,
    outcome_window_start, outcome_window_end, verification_view, stop_condition,
    known_alternatives, status, belief_snapshot, contract_version, created_by,
    created_at, updated_at
  ) values (
    null, v_snapshot.id, p_front, btrim(p_team_scope), nullif(btrim(p_owner), ''),
    btrim(p_hypothesis), btrim(p_action_text), btrim(p_metric_name), p_baseline_value,
    p_expected_value, p_expected_direction, nullif(btrim(p_expected_unit), ''),
    btrim(p_success_criterion), p_execution_due_at, p_outcome_window_start,
    p_outcome_window_end, btrim(p_verification_view), nullif(btrim(p_stop_condition), ''),
    coalesce(p_known_alternatives, '[]'::jsonb), 'approved', v_belief,
    'growth-bet-contract-v1', v_actor, v_now, v_now
  ) returning * into v_bet;

  insert into public.growth_bet_updates (
    bet_id, update_type, body, execution_status, metadata, created_by, created_at
  ) values (
    v_bet.id,
    'created',
    'Aposta assumida a partir de contexto analítico.',
    'not_started',
    jsonb_build_object(
      'source_kind', 'analytic_context',
      'source_surface', v_surface,
      'source_route', v_source_route,
      'evidence_snapshot_id', v_snapshot.id,
      'contract_version', v_bet.contract_version
    ),
    v_actor,
    v_now
  );

  for v_item in select decision.item from jsonb_array_elements(coalesce(p_learning_decisions, '[]'::jsonb)) decision(item)
  loop
    v_learning_id := (v_item ->> 'learning_id')::uuid;
    v_decision := v_item ->> 'decision';
    v_reason := nullif(btrim(v_item ->> 'reason'), '');
    select suggestion.* into v_suggestion
    from public.growth_find_applicable_learnings_for_context(p_front, v_match_context) suggestion
    where suggestion.learning_id = v_learning_id;

    insert into public.growth_learning_applications (
      bet_id, action_candidate_id, learning_id, learning_revision, decision,
      decision_reason, match_score, match_reasons, eligibility_snapshot,
      context_snapshot, decided_by
    ) values (
      v_bet.id, null, v_learning_id, v_suggestion.learning_revision, v_decision,
      v_reason, v_suggestion.match_score, v_suggestion.match_reasons,
      v_suggestion.eligibility, v_suggestion.context_snapshot, v_actor
    );

    if v_decision = 'reused' then
      insert into public.growth_learning_links (learning_id, target_type, target_id, relation_type)
      values (v_learning_id, 'bet', v_bet.id::text, 'applies_to')
      on conflict do nothing;
    end if;
  end loop;

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'bet_created',
    'growth_bet',
    v_bet.id,
    p_front,
    v_now,
    70,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', 'bet:' || v_bet.id::text,
      'event_state', 'approved',
      'confidence_status', 'user_confirmed',
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'source_kind', 'analytic_context',
      'source_surface', v_surface,
      'source_route', v_source_route,
      'entity_key', v_entity_key,
      'visual_ref', v_visual_ref,
      'evidence_snapshot_id', v_snapshot.id,
      'period_start', v_period_start,
      'period_end', v_period_end,
      'priority_reason', 'Decisão contextual assumida com contrato de verificação completo.'
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
      'source_view', v_surface,
      'source_context', v_context,
      'primary_action', jsonb_build_object('kind', 'open_bet', 'label', 'Abrir aposta')
    )),
    '?view=learning&section=bets&item=' || v_bet.id::text,
    'growth_bet:' || v_bet.id::text || ':created'
  );

  return v_bet;
end;
$$;

create or replace view public.growth_bets_operational_v
with (security_invoker = true)
as
select
  bet.*,
  coalesce(
    bet.belief_snapshot #>> '{source_candidate,signal}',
    bet.belief_snapshot #>> '{source_context,title}'
  ) as source_signal,
  bet.belief_snapshot #>> '{source_candidate,impact}' as source_impact,
  bet.belief_snapshot #>> '{source_candidate,probable_cause}' as source_probable_cause,
  coalesce(
    bet.belief_snapshot #>> '{source_candidate,confidence_status}',
    case when bet.belief_snapshot ? 'source_context' then 'user_confirmed' end
  ) as source_confidence_status,
  bet.belief_snapshot #>> '{source_candidate,reading_limit}' as source_reading_limit,
  coalesce(
    bet.belief_snapshot #>> '{source_candidate,source_view}',
    bet.belief_snapshot #>> '{source_context,source_surface}'
  ) as source_view,
  coalesce(
    bet.belief_snapshot #>> '{source_candidate,entity_key}',
    bet.belief_snapshot #>> '{source_context,entity_key}'
  ) as entity_key,
  coalesce(
    bet.belief_snapshot #>> '{source_candidate,signal_code}',
    bet.belief_snapshot #>> '{match_context,signal_code}'
  ) as signal_code,
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
    (array_agg(update_row.execution_status order by update_row.timeline_sequence desc)
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

revoke execute on function public.growth_context_filter_scalar(jsonb, text) from public, anon, authenticated;
revoke execute on function public.growth_find_applicable_learnings_for_context(text, jsonb) from public, anon;
revoke execute on function public.growth_create_contextual_bet_with_memory(
  text, jsonb, text, text, text, text, numeric, numeric, text, text, date, date,
  text, jsonb, text, timestamptz, text, jsonb, text
) from public, anon;

grant execute on function public.growth_context_filter_scalar(jsonb, text) to service_role;
grant execute on function public.growth_find_applicable_learnings_for_context(text, jsonb) to authenticated, service_role;
grant execute on function public.growth_create_contextual_bet_with_memory(
  text, jsonb, text, text, text, text, numeric, numeric, text, text, date, date,
  text, jsonb, text, timestamptz, text, jsonb, text
) to authenticated, service_role;

comment on function public.growth_find_applicable_learnings_for_context(text, jsonb) is
  'Release 7A deterministic memory matcher shared by signal and analytic-context bet entry.';

comment on function public.growth_create_contextual_bet_with_memory(
  text, jsonb, text, text, text, text, numeric, numeric, text, text, date, date,
  text, jsonb, text, timestamptz, text, jsonb, text
) is
  'Release 7A atomic command that freezes analytic context, creates a governed bet and records memory decisions.';
