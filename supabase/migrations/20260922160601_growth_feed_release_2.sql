create table public.growth_feed_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  subject_type text not null,
  subject_id uuid not null,
  front text not null,
  occurred_at timestamptz not null,
  priority_score numeric not null default 0,
  relevance_dimensions jsonb not null default '{}'::jsonb,
  summary_snapshot jsonb not null default '{}'::jsonb,
  route text not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  constraint growth_feed_events_type_check check (
    event_type in (
      'recommendation_created',
      'data_quality_blocked',
      'report_candidate_generated',
      'report_published',
      'report_blocked'
    )
  ),
  constraint growth_feed_events_subject_check check (
    subject_type in ('action_candidate', 'report_run', 'report_publication')
  ),
  constraint growth_feed_events_front_check check (
    front in ('crm_acquisition', 'paid_media', 'b2c_origin', 'report_live')
  ),
  constraint growth_feed_events_priority_check check (
    priority_score >= 0 and priority_score <= 100
  ),
  constraint growth_feed_events_dimensions_object_check check (
    jsonb_typeof(relevance_dimensions) = 'object'
  ),
  constraint growth_feed_events_snapshot_object_check check (
    jsonb_typeof(summary_snapshot) = 'object'
  ),
  constraint growth_feed_events_dedupe_key_unique unique (dedupe_key)
);

create index growth_feed_events_occurred_idx
  on public.growth_feed_events (occurred_at desc, id);

create index growth_feed_events_priority_idx
  on public.growth_feed_events (priority_score desc, occurred_at desc);

create index growth_feed_events_front_idx
  on public.growth_feed_events (front, occurred_at desc);

create index growth_feed_events_type_idx
  on public.growth_feed_events (event_type, occurred_at desc);

create index growth_feed_events_group_idx
  on public.growth_feed_events ((relevance_dimensions ->> 'group_key'), occurred_at desc);

create index growth_feed_events_dimensions_gin_idx
  on public.growth_feed_events using gin (relevance_dimensions jsonb_path_ops);

alter table public.growth_feed_events enable row level security;

revoke all on table public.growth_feed_events from public, anon, authenticated;
grant select on table public.growth_feed_events to authenticated;
grant select, insert on table public.growth_feed_events to service_role;

create policy growth_feed_events_authenticated_read
  on public.growth_feed_events
  for select
  to authenticated
  using (true);

create or replace function public.growth_feed_emit_action_candidate(
  p_candidate public.report_action_candidates
)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
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
      'run_id', p_candidate.run_id,
      'period_start', v_run.period_start,
      'period_end', v_run.period_end
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', p_candidate.signal,
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
$$;

create or replace function public.growth_feed_emit_report_run(
  p_run public.report_runs
)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_confidence text := coalesce(nullif(p_run.quality_status, ''), 'directional');
  v_period_label text := to_char(p_run.period_start, 'MM/YYYY');
begin
  if p_run.certification_status = 'certified' then
    insert into public.growth_feed_events (
      event_type, subject_type, subject_id, front, occurred_at, priority_score,
      relevance_dimensions, summary_snapshot, route, dedupe_key
    ) values (
      'report_candidate_generated',
      'report_run',
      p_run.id,
      'report_live',
      coalesce(p_run.certified_at, p_run.updated_at, p_run.created_at),
      60,
      jsonb_strip_nulls(jsonb_build_object(
        'group_key', concat_ws(':', 'report_candidate', p_run.report_type, p_run.report_profile, p_run.period_start, p_run.period_end),
        'report_type', p_run.report_type,
        'report_profile', p_run.report_profile,
        'confidence_status', v_confidence,
        'event_state', 'certified',
        'period_start', p_run.period_start,
        'period_end', p_run.period_end,
        'run_id', p_run.id
      )),
      jsonb_strip_nulls(jsonb_build_object(
        'title', format('Candidata %s certificada para %s', p_run.report_profile, v_period_label),
        'summary', 'A candidata passou pela certificação e está pronta para inspeção editorial.',
        'impact', 'A publicação ativa não muda até o commit explícito da candidata.',
        'reading_limit', case when v_confidence in ('suspect', 'blocked')
          then 'A qualidade do run possui ressalvas; revise os bloqueios antes de publicar.'
          else null end,
        'confidence_status', v_confidence,
        'event_state', 'certified',
        'report_type', p_run.report_type,
        'report_profile', p_run.report_profile,
        'period_start', p_run.period_start,
        'period_end', p_run.period_end,
        'run_id', p_run.id,
        'source_hash', p_run.source_hash,
        'content_hash', p_run.content_hash,
        'source_cutoffs', p_run.source_cutoffs,
        'slide_counts', p_run.slide_counts,
        'priority_reason', 'Candidata certificada aguardando decisão editorial.',
        'primary_action', jsonb_build_object(
          'kind', 'open_report_live',
          'label', 'Abrir candidata'
        )
      )),
      format('?view=learning&section=report-live&item=%s', p_run.id),
      format('report_run:%s:certified', p_run.id)
    )
    on conflict (dedupe_key) do nothing;
  end if;

  if p_run.status in ('error', 'rejected', 'stale', 'publication_failed', 'rollback_failed')
    or p_run.certification_status in ('rejected', 'stale')
    or p_run.publication_status = 'failed'
  then
    insert into public.growth_feed_events (
      event_type, subject_type, subject_id, front, occurred_at, priority_score,
      relevance_dimensions, summary_snapshot, route, dedupe_key
    ) values (
      'report_blocked',
      'report_run',
      p_run.id,
      'report_live',
      coalesce(p_run.stale_at, p_run.updated_at, p_run.created_at),
      95,
      jsonb_strip_nulls(jsonb_build_object(
        'group_key', concat_ws(':', 'report_blocked', p_run.report_type, p_run.report_profile, p_run.period_start, p_run.period_end),
        'report_type', p_run.report_type,
        'report_profile', p_run.report_profile,
        'confidence_status', 'blocked',
        'event_state', 'blocked',
        'period_start', p_run.period_start,
        'period_end', p_run.period_end,
        'run_id', p_run.id
      )),
      jsonb_strip_nulls(jsonb_build_object(
        'title', format('Report Live bloqueado para %s', v_period_label),
        'summary', 'O pipeline não concluiu uma candidata publicável.',
        'impact', 'A publicação ativa foi preservada e continua sendo a versão oficial.',
        'reading_limit', p_run.error_detail,
        'confidence_status', 'blocked',
        'event_state', 'blocked',
        'status', p_run.status,
        'build_status', p_run.build_status,
        'certification_status', p_run.certification_status,
        'publication_status', p_run.publication_status,
        'quality_status', p_run.quality_status,
        'report_type', p_run.report_type,
        'report_profile', p_run.report_profile,
        'period_start', p_run.period_start,
        'period_end', p_run.period_end,
        'run_id', p_run.id,
        'source_cutoffs', p_run.source_cutoffs,
        'priority_reason', 'Bloqueio de pipeline que exige diagnóstico antes de nova publicação.',
        'primary_action', jsonb_build_object(
          'kind', 'open_report_live',
          'label', 'Abrir diagnóstico'
        )
      )),
      format('?view=learning&section=report-live&item=%s', p_run.id),
      format('report_run:%s:blocked', p_run.id)
    )
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;

create or replace function public.growth_feed_emit_publication(
  p_publication public.report_publications
)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_run public.report_runs%rowtype;
  v_period_label text;
begin
  if p_publication.status <> 'published'
    or p_publication.google_state <> 'active'
    or p_publication.qa_status <> 'passed'
  then
    return;
  end if;

  select * into v_run
  from public.report_runs
  where id = p_publication.run_id;

  v_period_label := to_char(v_run.period_start, 'MM/YYYY');

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'report_published',
    'report_publication',
    p_publication.id,
    'report_live',
    coalesce(p_publication.activated_at, p_publication.completed_at, p_publication.created_at),
    45,
    jsonb_strip_nulls(jsonb_build_object(
      'group_key', concat_ws(':', 'report_published', p_publication.deck_id),
      'report_type', v_run.report_type,
      'report_profile', v_run.report_profile,
      'confidence_status', 'confirmed',
      'event_state', 'published',
      'period_start', v_run.period_start,
      'period_end', v_run.period_end,
      'run_id', p_publication.run_id,
      'publication_version', p_publication.publication_version
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'title', format('Report Live v%s publicado para %s', p_publication.publication_version, v_period_label),
      'summary', 'A candidata certificada foi ativada como publicação oficial.',
      'impact', 'Planilha, Slides e PDF passam a representar esta versão publicada.',
      'confidence_status', 'confirmed',
      'event_state', 'published',
      'report_type', v_run.report_type,
      'report_profile', v_run.report_profile,
      'period_start', v_run.period_start,
      'period_end', v_run.period_end,
      'run_id', p_publication.run_id,
      'publication_id', p_publication.id,
      'publication_version', p_publication.publication_version,
      'publication_kind', p_publication.kind,
      'qa_status', p_publication.qa_status,
      'google_state', p_publication.google_state,
      'slide_count', p_publication.slide_count,
      'pdf_page_count', p_publication.pdf_page_count,
      'blueprint_hash', p_publication.blueprint_hash,
      'content_hash', p_publication.content_hash,
      'priority_reason', 'Publicação concluída; evento informativo para consulta e auditoria.',
      'primary_action', jsonb_build_object(
        'kind', 'open_report_live',
        'label', 'Abrir Report Live'
      )
    )),
    format('?view=learning&section=report-live&item=%s', p_publication.run_id),
    format('report_publication:%s:published', p_publication.id)
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

create or replace function public.growth_feed_action_candidate_trigger()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform public.growth_feed_emit_action_candidate(new);
  return new;
end;
$$;

create or replace function public.growth_feed_report_run_trigger()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform public.growth_feed_emit_report_run(new);
  return new;
end;
$$;

create or replace function public.growth_feed_publication_trigger()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform public.growth_feed_emit_publication(new);
  return new;
end;
$$;

drop trigger if exists growth_feed_action_candidate_insert on public.report_action_candidates;
create trigger growth_feed_action_candidate_insert
after insert on public.report_action_candidates
for each row execute function public.growth_feed_action_candidate_trigger();

drop trigger if exists growth_feed_report_run_change on public.report_runs;
create trigger growth_feed_report_run_change
after insert or update of status, certification_status, publication_status, quality_status,
  certified_at, stale_at, error_detail
on public.report_runs
for each row execute function public.growth_feed_report_run_trigger();

drop trigger if exists growth_feed_publication_change on public.report_publications;
create trigger growth_feed_publication_change
after insert or update of status, qa_status, google_state, activated_at, completed_at
on public.report_publications
for each row execute function public.growth_feed_publication_trigger();

select public.growth_feed_emit_action_candidate(candidate)
from public.report_action_candidates candidate;

select public.growth_feed_emit_report_run(run_row)
from public.report_runs run_row;

select public.growth_feed_emit_publication(publication_row)
from public.report_publications publication_row;

create or replace function public.growth_feed_prevent_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'growth_feed_events is append-only; emit a new event instead';
end;
$$;

create trigger growth_feed_events_append_only
before update or delete on public.growth_feed_events
for each row execute function public.growth_feed_prevent_mutation();

create view public.growth_feed_v
with (security_invoker = true)
as
with enriched as (
  select
    event.*,
    coalesce(
      event.relevance_dimensions ->> 'group_key',
      concat_ws(':', event.subject_type, event.subject_id::text)
    ) as group_key,
    event.relevance_dimensions ->> 'confidence_status' as confidence_status,
    event.relevance_dimensions ->> 'event_state' as event_state
  from public.growth_feed_events event
)
select
  enriched.*,
  count(*) over (partition by enriched.group_key) as group_count,
  row_number() over (
    partition by enriched.group_key
    order by enriched.occurred_at desc, enriched.id desc
  ) as group_rank
from enriched;

revoke all on table public.growth_feed_v from public, anon, authenticated;
grant select on table public.growth_feed_v to authenticated, service_role;

revoke execute on function public.growth_feed_emit_action_candidate(public.report_action_candidates)
  from public, anon, authenticated;
revoke execute on function public.growth_feed_emit_report_run(public.report_runs)
  from public, anon, authenticated;
revoke execute on function public.growth_feed_emit_publication(public.report_publications)
  from public, anon, authenticated;
revoke execute on function public.growth_feed_action_candidate_trigger()
  from public, anon, authenticated;
revoke execute on function public.growth_feed_report_run_trigger()
  from public, anon, authenticated;
revoke execute on function public.growth_feed_publication_trigger()
  from public, anon, authenticated;
revoke execute on function public.growth_feed_prevent_mutation()
  from public, anon, authenticated;

grant execute on function public.growth_feed_emit_action_candidate(public.report_action_candidates)
  to service_role;
grant execute on function public.growth_feed_emit_report_run(public.report_runs)
  to service_role;
grant execute on function public.growth_feed_emit_publication(public.report_publications)
  to service_role;
grant execute on function public.growth_feed_action_candidate_trigger()
  to service_role;
grant execute on function public.growth_feed_report_run_trigger()
  to service_role;
grant execute on function public.growth_feed_publication_trigger()
  to service_role;
grant execute on function public.growth_feed_prevent_mutation()
  to service_role;

comment on table public.growth_feed_events is
  'Append-only system feed for Aprendizado Growth. Every number is a deterministic snapshot with source provenance.';

comment on view public.growth_feed_v is
  'Authenticated read projection for the Growth learning feed, including deterministic grouping metadata.';
