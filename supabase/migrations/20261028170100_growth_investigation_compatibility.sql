-- Preserve legacy report candidates; investigation candidates have their own real origin.
begin;
CREATE OR REPLACE FUNCTION public.growth_accept_signal_as_bet(p_action_candidate_id uuid, p_team_scope text, p_hypothesis text, p_action_text text, p_metric_name text, p_baseline_value numeric, p_expected_value numeric, p_expected_direction text, p_success_criterion text, p_outcome_window_start date, p_outcome_window_end date, p_verification_view text, p_expected_unit text DEFAULT NULL::text, p_execution_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_stop_condition text DEFAULT NULL::text, p_known_alternatives jsonb DEFAULT '[]'::jsonb, p_owner text DEFAULT NULL::text)
 RETURNS growth_bets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  if v_candidate.investigation_id is null then
  select run_row.* into strict v_run
  from public.report_runs run_row
  where run_row.id = v_candidate.run_id;
  else
    if not public.growth_investigation_candidate_access(p_action_candidate_id) then raise exception 'investigation_access_denied'; end if;
    select e.packet->>'period', (e.packet->>'period')::date + interval '1 month' - interval '1 day',
      e.content_hash, e.packet
    into v_run.period_start,v_run.period_end,v_run.source_hash,v_run.run_manifest
    from public.growth_investigation_analyses a join public.growth_investigation_evidence e on e.id=a.evidence_id
    join public.growth_investigations i on i.id=a.investigation_id and i.current_revision=e.revision
    where a.id=v_candidate.analysis_id
      and e.content_hash=encode(sha256(convert_to(public.growth_investigation_packet(i.operation_id,i.period,i.filters)::text,'UTF8')),'hex');
    if v_run.period_start is null then raise exception 'investigation_evidence_stale'; end if;
    if not public.growth_investigation_can_access(v_candidate.entity_key,true) then raise exception 'investigation_access_denied'; end if;
    v_run.quality_status:='directional';
    v_run.run_manifest:=v_run.run_manifest||jsonb_build_object('investigation_id',v_candidate.investigation_id,'analysis_id',v_candidate.analysis_id);
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
      'investigation_id', v_candidate.investigation_id,
      'analysis_id', v_candidate.analysis_id,
      'operation_id', case when v_candidate.investigation_id is not null then v_candidate.entity_key end,
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
$function$;

CREATE OR REPLACE FUNCTION public.growth_feed_emit_action_candidate(p_candidate report_action_candidates)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_run public.report_runs%rowtype;
  v_event_id uuid := gen_random_uuid();
  v_event_type text;
  v_front text;
  v_priority numeric;
  v_priority_reason text;
  v_state text;
begin
  select * into v_run
  from public.report_runs
  where id = p_candidate.run_id;

  if p_candidate.investigation_id is not null then
    select e.packet->>'period', (e.packet->>'period')::date + interval '1 month' - interval '1 day', e.packet||jsonb_build_object('candidate',a.body->'candidate')
    into v_priority_reason, v_run.period_end, v_run.run_manifest
    from public.growth_investigation_analyses a join public.growth_investigation_evidence e on e.id=a.evidence_id
    where a.id=p_candidate.analysis_id;
    v_run.period_start:=v_priority_reason::date;
  end if;
  v_event_type := case
    when p_candidate.confidence_status = 'blocked'
      or p_candidate.source_view ilike '%QUALITY%'
      then 'data_quality_blocked'
    else 'recommendation_created'
  end;

  v_front := case lower(p_candidate.domain)
    when 'crm' then 'crm_acquisition'
    when 'midia' then 'paid_media'
    when 'b2c' then 'b2c_origin'
    else 'crm_acquisition'
  end;

  v_priority := least(100, (
    case p_candidate.bucket
      when 'Agir hoje' then 80
      when 'Investigar' then 62
      when 'Acompanhar' then 42
      else 30
    end
    + case p_candidate.confidence_status
      when 'confirmed' then 8
      when 'directional' then 4
      when 'suspect' then 0
      when 'blocked' then 10
      else 0
    end
    + case when v_event_type = 'data_quality_blocked' then 12 else 0 end
  ));

  v_priority_reason := case
    when v_event_type = 'data_quality_blocked'
      then 'Bloqueio de qualidade que impede decisão segura.'
    when p_candidate.bucket = 'Agir hoje'
      then 'Ação classificada para hoje pelo motor determinístico.'
    when p_candidate.bucket = 'Investigar'
      then 'Sinal material que ainda exige investigação.'
    else 'Sinal relevante para acompanhamento.'
  end;

  v_state := case
    when v_event_type = 'data_quality_blocked' then 'blocked'
    else coalesce(nullif(p_candidate.status, ''), 'new')
  end;

  insert into public.growth_feed_events (
    id,
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
    v_event_id,
    v_event_type,
    'action_candidate',
    p_candidate.action_candidate_id,
    v_front,
    p_candidate.created_at,
    v_priority,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', concat_ws(':', 'candidate', lower(p_candidate.domain), p_candidate.entity_key, p_candidate.signal_code),
      'domain', lower(p_candidate.domain),
      'partner', p_candidate.partner,
      'source_view', p_candidate.source_view,
      'signal_code', p_candidate.signal_code,
      'entity_key', p_candidate.entity_key,
      'bucket', p_candidate.bucket,
      'confidence_status', p_candidate.confidence_status,
      'event_state', v_state,
      'review_status', p_candidate.review_status,
      'investigation_id', p_candidate.investigation_id,
      'analysis_id', p_candidate.analysis_id,
      'run_id', p_candidate.run_id,
      'period_start', v_run.period_start,
      'period_end', v_run.period_end
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', p_candidate.signal,
      'baseline_value', case when p_candidate.investigation_id is not null then
        (select x->'value' from jsonb_array_elements(v_run.run_manifest->'evidence') x
         where x->>'id'=v_run.period_start::text||':'||p_candidate.success_metric) end,
      'metric_name', case when p_candidate.investigation_id is not null then p_candidate.success_metric end,
      'success_criterion', v_run.run_manifest->'candidate'->>'success_criterion',
      'summary', p_candidate.action_text,
      'impact', p_candidate.impact,
      'probable_cause', p_candidate.probable_cause,
      'reading_limit', p_candidate.reading_limit,
      'action_text', p_candidate.action_text,
      'evidence_refs', p_candidate.evidence_refs,
      'source_view', p_candidate.source_view,
      'signal_code', p_candidate.signal_code,
      'entity_key', p_candidate.entity_key,
      'partner', p_candidate.partner,
      'bucket', p_candidate.bucket,
      'confidence_status', p_candidate.confidence_status,
      'review_status', p_candidate.review_status,
      'event_state', v_state,
      'generated_by', p_candidate.generated_by,
      'success_metric', p_candidate.success_metric,
      'expected_value', p_candidate.expected_value,
      'expected_unit', p_candidate.expected_unit,
      'expected_direction', p_candidate.expected_direction,
      'outcome_window_end', p_candidate.outcome_window_end,
      'verification_view', p_candidate.verification_view,
      'run_id', p_candidate.run_id,
      'period_start', v_run.period_start,
      'period_end', v_run.period_end,
      'priority_reason', v_priority_reason,
      'primary_action', jsonb_build_object(
        'kind', 'open_evidence',
        'label', 'Abrir evidências'
      )
    )),
    format('?view=learning&section=feed&item=%s', v_event_id),
    format('action_candidate:%s:created', p_candidate.action_candidate_id)
  )
  on conflict (dedupe_key) do nothing;
end;
$function$;

commit;

