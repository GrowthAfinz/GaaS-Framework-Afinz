import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

function psql(args, input) {
  const dockerContainer = process.env.GROWTH_FEED_DOCKER_CONTAINER;
  const command = dockerContainer ? 'docker' : 'psql';
  const commandArgs = dockerContainer
    ? ['exec', '-i', dockerContainer, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', ...args]
    : ['-X', '-v', 'ON_ERROR_STOP=1', ...args];
  const result = spawnSync(command, commandArgs, {
    cwd: resolve(import.meta.dirname, '..'),
    env: process.env,
    input,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${command} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

const fixtureSql = `
  drop schema public cascade;
  create schema public;

  do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

  create table public.report_runs (
    id uuid primary key default gen_random_uuid(),
    report_type text not null default 'midia_paga_crm_mensal',
    period_start date not null,
    period_end date not null,
    status text not null default 'created',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    report_profile text not null default 'monthly_report',
    quality_status text,
    publication_valid boolean not null default false,
    source_cutoffs jsonb not null default '{}',
    slide_counts jsonb not null default '{}',
    publication_status text not null default 'pending',
    build_status text not null default 'pending',
    certification_status text not null default 'pending',
    certified_at timestamptz,
    stale_at timestamptz,
    error_detail text,
    source_hash text,
    content_hash text
  );

  create table public.report_action_candidates (
    action_candidate_id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.report_runs(id),
    source_view text not null,
    entity_key text not null,
    signal_code text not null,
    domain text not null,
    partner text,
    bucket text not null,
    signal text not null,
    impact text,
    probable_cause text,
    evidence_refs jsonb not null default '[]',
    reading_limit text,
    action_text text,
    owner text,
    due_date date,
    success_metric text,
    confidence_status text not null,
    generated_by text not null,
    review_status text not null default 'pending',
    status text not null default 'candidate',
    posterior_result text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    expected_value numeric,
    expected_unit text,
    expected_direction text,
    outcome_window_end date,
    verification_view text
  );

  create table public.report_publications (
    id uuid primary key default gen_random_uuid(),
    publication_version bigint not null,
    run_id uuid not null references public.report_runs(id),
    deck_id text not null,
    kind text not null default 'release',
    status text not null,
    blueprint_hash text not null,
    content_hash text,
    slide_count integer,
    pdf_page_count integer,
    qa_status text not null,
    google_state text not null,
    activated_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
  );
`;

test('Growth feed migration is idempotent, grouped, append-only and readable only by authenticated users', () => {
  const migrations = readdirSync(resolve(import.meta.dirname, '../supabase/migrations'))
    .filter((name) => /^\d+_growth_feed_release_2\.sql$/.test(name))
    .sort();
  assert.ok(migrations.length, 'Growth feed migration not found');
  const migrationSql = readFileSync(resolve(import.meta.dirname, '../supabase/migrations', migrations.at(-1)), 'utf8');

  psql([], fixtureSql);
  psql([], migrationSql);

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      crm_run uuid := gen_random_uuid();
      media_run uuid := gen_random_uuid();
      publication_run uuid := gen_random_uuid();
      first_candidate uuid := gen_random_uuid();
      second_candidate uuid := gen_random_uuid();
      quality_candidate uuid := gen_random_uuid();
      publication_id uuid := gen_random_uuid();
      before_duplicate bigint;
      after_duplicate bigint;
      update_blocked boolean := false;
    begin
      insert into public.report_runs(id, period_start, period_end, status, quality_status)
      values (crm_run, date '2026-09-01', date '2026-09-30', 'created', 'confirmed');

      insert into public.report_action_candidates(
        action_candidate_id, run_id, source_view, entity_key, signal_code, domain,
        bucket, signal, impact, evidence_refs, action_text, success_metric,
        confidence_status, generated_by, created_at
      ) values
        (first_candidate, crm_run, 'VIEW_TEMPLATE_COVERAGE', 'crm:template_mapping', 'TEMPLATE_COVERAGE_LT_80', 'crm',
          'Acompanhar', 'Cobertura abaixo do contrato.', 'Análise perde profundidade.', '[{"view":"VIEW_TEMPLATE_COVERAGE","field":"coverage"}]',
          'Revisar mapeamento.', 'coverage >= 80%', 'confirmed', 'test', timestamptz '2026-09-10 10:00:00+00'),
        (second_candidate, crm_run, 'VIEW_TEMPLATE_COVERAGE', 'crm:template_mapping', 'TEMPLATE_COVERAGE_LT_80', 'crm',
          'Acompanhar', 'Cobertura segue abaixo do contrato.', 'Análise perde profundidade.', '[{"view":"VIEW_TEMPLATE_COVERAGE","field":"coverage"}]',
          'Revisar mapeamento.', 'coverage >= 80%', 'confirmed', 'test', timestamptz '2026-09-11 10:00:00+00');

      insert into public.report_runs(id, period_start, period_end, status, quality_status)
      values (media_run, date '2026-09-01', date '2026-09-30', 'created', 'suspect');

      insert into public.report_action_candidates(
        action_candidate_id, run_id, source_view, entity_key, signal_code, domain,
        bucket, signal, evidence_refs, reading_limit, action_text,
        confidence_status, generated_by
      ) values (
        quality_candidate, media_run, 'VIEW_MEDIA_QUALITY', 'media:google:conversion',
        'MEDIA_ZERO_CONVERSION_WITH_CLICKS', 'midia', 'Investigar',
        'Cliques sem conversão observada.', '[{"view":"VIEW_MEDIA_QUALITY","field":"conversions"}]',
        'Não recomendar corte ou escala.', 'Auditar tracking.', 'suspect', 'test'
      );

      update public.report_runs
      set status = 'certified', certification_status = 'certified',
          certified_at = timestamptz '2026-09-12 10:00:00+00'
      where id = crm_run;

      update public.report_runs
      set status = 'error', publication_status = 'failed', error_detail = 'Falha sintética.'
      where id = crm_run;

      update public.report_runs set updated_at = now() where id = crm_run;

      insert into public.report_runs(
        id, period_start, period_end, status, quality_status, publication_valid,
        publication_status, build_status, certification_status, certified_at
      ) values (
        publication_run, date '2026-08-01', date '2026-08-31', 'done', 'confirmed', true,
        'published', 'built', 'certified', timestamptz '2026-09-13 09:00:00+00'
      );

      insert into public.report_publications(
        id, publication_version, run_id, deck_id, status, blueprint_hash,
        slide_count, pdf_page_count, qa_status, google_state, activated_at
      ) values (
        publication_id, 8, publication_run, 'deck', 'published', 'blueprint',
        57, 57, 'passed', 'active', timestamptz '2026-09-13 12:35:00+00'
      );

      select count(*) into before_duplicate from public.growth_feed_events;
      perform public.growth_feed_emit_action_candidate(candidate)
      from public.report_action_candidates candidate
      where candidate.action_candidate_id = first_candidate;
      select count(*) into after_duplicate from public.growth_feed_events;
      if before_duplicate <> after_duplicate then
        raise exception 'dedupe failed: % -> %', before_duplicate, after_duplicate;
      end if;

      begin
        update public.growth_feed_events set priority_score = 0 where id = (
          select id from public.growth_feed_events limit 1
        );
      exception when raise_exception then
        update_blocked := true;
      end;
      if not update_blocked then
        raise exception 'append-only update was not blocked';
      end if;
    end $$;

    select json_build_object(
      'events', (select count(*) from public.growth_feed_events),
      'candidate_group_count', (
        select max(group_count) from public.growth_feed_v
        where group_key = 'candidate:crm:crm:template_mapping:TEMPLATE_COVERAGE_LT_80'
      ),
      'candidate_group_latest', (
        select count(*) from public.growth_feed_v
        where group_key = 'candidate:crm:crm:template_mapping:TEMPLATE_COVERAGE_LT_80'
          and group_rank = 1
      ),
      'quality_blocked', (
        select count(*) from public.growth_feed_events where event_type = 'data_quality_blocked'
      ),
      'report_blocked', (
        select count(*) from public.growth_feed_events where event_type = 'report_blocked'
      ),
      'report_published', (
        select count(*) from public.growth_feed_events where event_type = 'report_published'
      ),
      'authenticated_select', has_table_privilege('authenticated', 'public.growth_feed_v', 'SELECT'),
      'authenticated_insert', has_table_privilege('authenticated', 'public.growth_feed_events', 'INSERT'),
      'anon_select', has_table_privilege('anon', 'public.growth_feed_v', 'SELECT'),
      'security_invoker', (
        select coalesce(reloptions @> array['security_invoker=true'], false)
        from pg_class where oid = 'public.growth_feed_v'::regclass
      ),
      'candidate_route_resolves', (
        select bool_and((regexp_match(route, 'item=([0-9a-f-]+)'))[1]::uuid = id)
        from public.growth_feed_events where subject_type = 'action_candidate'
      )
    );
  `);

  const actual = JSON.parse(result);
  assert.deepEqual(actual, {
    events: 7,
    candidate_group_count: 2,
    candidate_group_latest: 1,
    quality_blocked: 1,
    report_blocked: 1,
    report_published: 1,
    authenticated_select: true,
    authenticated_insert: false,
    anon_select: false,
    security_invoker: true,
    candidate_route_resolves: true,
  });
});
