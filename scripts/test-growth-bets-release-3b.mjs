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

function latestMigration(pattern) {
  const migrations = readdirSync(resolve(import.meta.dirname, '../supabase/migrations'))
    .filter((name) => pattern.test(name))
    .sort();
  assert.ok(migrations.length, `Migration not found: ${pattern}`);
  return readFileSync(resolve(import.meta.dirname, '../supabase/migrations', migrations.at(-1)), 'utf8');
}

const fixtureSql = `
  drop schema public cascade;
  drop schema if exists auth cascade;
  create schema public;
  create schema auth;

  do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

  create or replace function auth.uid()
  returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create table public.report_runs (
    id uuid primary key default gen_random_uuid(),
    report_type text not null default 'midia_paga_crm_mensal',
    period_start date not null,
    period_end date not null,
    status text not null default 'created',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    report_profile text not null default 'monthly_report',
    spec_version text not null default '1.0',
    quality_status text,
    publication_valid boolean not null default false,
    source_cutoffs jsonb not null default '{}',
    slide_counts jsonb not null default '{}',
    run_manifest jsonb not null default '{}',
    publication_status text not null default 'pending',
    build_status text not null default 'pending',
    certification_status text not null default 'pending',
    certified_at timestamptz,
    stale_at timestamptz,
    error_detail text,
    source_hash text,
    content_hash text,
    artifact_path text
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

test('Release 3B operates governed bets while preserving the Release 3A belief contract', () => {
  const feedMigrationSql = latestMigration(/^\d+_growth_feed_release_2\.sql$/);
  const betMigrationSql = latestMigration(/^\d+_growth_bets_release_3a\.sql$/);
  const operationsMigrationSql = latestMigration(/^\d+_growth_bets_release_3b\.sql$/);
  const timelineMigrationSql = latestMigration(/^\d+_growth_bet_timeline_sequence\.sql$/);

  psql([], fixtureSql);
  psql([], feedMigrationSql);
  psql([], betMigrationSql);
  psql([], operationsMigrationSql);
  psql([], timelineMigrationSql);

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      actor_id constant uuid := '11111111-1111-4111-8111-111111111111';
      run_id constant uuid := '22222222-2222-4222-8222-222222222222';
      eligible_id constant uuid := '33333333-3333-4333-8333-333333333333';
      suspect_id constant uuid := '44444444-4444-4444-8444-444444444444';
      quality_id constant uuid := '55555555-5555-4555-8555-555555555555';
      reject_id constant uuid := '66666666-6666-4666-8666-666666666666';
      merge_id constant uuid := '77777777-7777-4777-8777-777777777777';
      created_bet public.growth_bets%rowtype;
      checklist_item public.growth_bet_checklist_items%rowtype;
      before_counts jsonb;
      after_counts jsonb;
      failure_seen boolean;
    begin
      perform set_config('request.jwt.claim.sub', actor_id::text, false);

      insert into public.report_runs(
        id, period_start, period_end, status, quality_status, source_hash,
        artifact_path, source_cutoffs, run_manifest
      ) values (
        run_id, date '2026-08-01', date '2026-08-31', 'done', 'suspect', 'source-hash-aug',
        'runs/aug/report-build.json',
        '{"crm":"2026-08-31","media":"2026-08-31","b2c":null}',
        '{"missing_sources":["b2c"],"integrated_reading_available":false,"comparability":{"crm_vs_b2c_rule":"directional_not_reconciled"}}'
      );

      insert into public.report_action_candidates(
        action_candidate_id, run_id, source_view, entity_key, signal_code, domain,
        partner, bucket, signal, impact, probable_cause, evidence_refs, reading_limit,
        action_text, success_metric, confidence_status, generated_by, expected_value,
        expected_unit, expected_direction, outcome_window_end, verification_view
      ) values
        (
          eligible_id, run_id, 'VIEW_TEMPLATE_COVERAGE', 'crm:template_mapping',
          'TEMPLATE_COVERAGE_LT_80', 'crm', null, 'Acompanhar',
          'Cobertura de template abaixo do contrato.', 'Limita a leitura de CRM.',
          'Mapeamento incompleto.', '[{"view":"VIEW_TEMPLATE_COVERAGE","field":"activities_template_coverage"}]',
          'Campanhas podem ser lidas por Activity Name.', 'Priorizar o mapeamento.',
          'activities_template_coverage >= 80%', 'confirmed', 'test', 0.8, 'ratio',
          'maior_melhor', date '2026-10-31', 'VIEW_TEMPLATE_COVERAGE'
        ),
        (
          suspect_id, run_id, 'VIEW_MEDIA_CAMPAIGNS', 'media:campaign:test',
          'MEDIA_SIGNAL', 'midia', null, 'Investigar', 'Sinal ainda suspeito.', null, null,
          '[{"view":"VIEW_MEDIA_CAMPAIGNS","field":"spend"}]', 'Exige revisão.',
          'Investigar campanha.', 'CPA', 'suspect', 'test', null, null, null, null, null
        ),
        (
          quality_id, run_id, 'VIEW_MEDIA_QUALITY', 'media:quality:test',
          'MEDIA_QUALITY_GAP', 'midia', null, 'Investigar', 'Falha de qualidade.', null, null,
          '[{"view":"VIEW_MEDIA_QUALITY","field":"coverage"}]', 'Não decidir.',
          'Auditar tracking.', 'coverage', 'confirmed', 'test', 0.9, 'ratio',
          'maior_melhor', date '2026-10-31', 'VIEW_MEDIA_QUALITY'
        ),
        (
          reject_id, run_id, 'VIEW_TEMPLATE_COVERAGE', 'crm:template:reject',
          'REJECT_SIGNAL', 'crm', null, 'Acompanhar', 'Sinal sem prioridade.', null, null,
          '[{"view":"VIEW_TEMPLATE_COVERAGE","field":"coverage"}]', null,
          'Avaliar prioridade.', 'coverage', 'directional', 'test', 0.7, 'ratio',
          'maior_melhor', date '2026-10-31', 'VIEW_TEMPLATE_COVERAGE'
        ),
        (
          merge_id, run_id, 'VIEW_TEMPLATE_COVERAGE', 'crm:template:merge',
          'MERGE_SIGNAL', 'crm', null, 'Acompanhar', 'Sinal reforça a mesma hipótese.', null, null,
          '[{"view":"VIEW_TEMPLATE_COVERAGE","field":"coverage"}]', null,
          'Completar o mapeamento.', 'coverage', 'confirmed', 'test', 0.8, 'ratio',
          'maior_melhor', date '2026-10-31', 'VIEW_TEMPLATE_COVERAGE'
        );

      created_bet := public.growth_accept_signal_as_bet(
        eligible_id,
        'CRM Aquisição',
        'Completar o mapeamento das atividades de maior volume aumenta a cobertura governada.',
        'Mapear as atividades BAU que concentram maior volume.',
        'activities_template_coverage',
        0.075,
        0.8,
        'maior_melhor',
        'Cobertura governada igual ou superior a 80%.',
        date '2026-09-23',
        date '2026-10-31',
        'VIEW_TEMPLATE_COVERAGE',
        'ratio',
        timestamptz '2026-09-30 23:59:59+00',
        'Interromper se o mapeamento alterar o grão das atividades.',
        '["Manter leitura apenas por Activity Name"]',
        null
      );

      if created_bet.status <> 'approved' or created_bet.created_by <> actor_id then
        raise exception 'created bet did not preserve approval and actor';
      end if;

      select jsonb_build_object(
        'bets', count(*) filter (where object_name = 'bet'),
        'snapshots', count(*) filter (where object_name = 'snapshot'),
        'updates', count(*) filter (where object_name = 'update'),
        'events', count(*) filter (where object_name = 'event')
      ) into before_counts
      from (
        select 'bet' object_name from public.growth_bets
        union all select 'snapshot' from public.growth_evidence_snapshots
        union all select 'update' from public.growth_bet_updates
        union all select 'event' from public.growth_feed_events where event_type = 'bet_created'
      ) objects;

      failure_seen := false;
      begin
        perform public.growth_accept_signal_as_bet(
          eligible_id, 'CRM Aquisição', 'Duplicada', 'Duplicada', 'coverage', 0.075, 0.8,
          'maior_melhor', 'Cobertura >= 80%', date '2026-09-23', date '2026-10-31',
          'VIEW_TEMPLATE_COVERAGE'
        );
      exception when raise_exception or unique_violation then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'duplicate source was accepted'; end if;

      failure_seen := false;
      begin
        perform public.growth_accept_signal_as_bet(
          suspect_id, 'Mídia Paga', 'Hipótese', 'Ação', 'CPA', 10, 8,
          'menor_melhor', 'CPA <= 8', date '2026-09-23', date '2026-10-31',
          'VIEW_MEDIA_CAMPAIGNS'
        );
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'suspect source was accepted'; end if;

      failure_seen := false;
      begin
        perform public.growth_accept_signal_as_bet(
          quality_id, 'Mídia Paga', 'Hipótese', 'Ação', 'coverage', 0.5, 0.9,
          'maior_melhor', 'coverage >= 90%', date '2026-09-23', date '2026-10-31',
          'VIEW_MEDIA_QUALITY'
        );
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'quality source was accepted'; end if;

      select jsonb_build_object(
        'bets', count(*) filter (where object_name = 'bet'),
        'snapshots', count(*) filter (where object_name = 'snapshot'),
        'updates', count(*) filter (where object_name = 'update'),
        'events', count(*) filter (where object_name = 'event')
      ) into after_counts
      from (
        select 'bet' object_name from public.growth_bets
        union all select 'snapshot' from public.growth_evidence_snapshots
        union all select 'update' from public.growth_bet_updates
        union all select 'event' from public.growth_feed_events where event_type = 'bet_created'
      ) objects;

      if before_counts <> after_counts then
        raise exception 'failed commands left orphan rows: % -> %', before_counts, after_counts;
      end if;

      failure_seen := false;
      begin
        update public.growth_evidence_snapshots set source_hash = 'changed';
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'evidence mutation was accepted'; end if;

      failure_seen := false;
      begin
        update public.growth_bets set belief_snapshot = '{}'::jsonb;
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'belief mutation was accepted'; end if;

      failure_seen := false;
      begin
        delete from public.growth_bet_updates;
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'bet timeline deletion was accepted'; end if;

      perform public.growth_reject_signal(reject_id, 'Sinal sem impacto material neste ciclo.');
      perform public.growth_merge_signal_into_bet(
        merge_id,
        created_bet.id,
        'Mesma frente, métrica e hipótese operacional.'
      );

      checklist_item := public.growth_add_bet_checklist_item(created_bet.id, 'Mapear atividades prioritárias');
      checklist_item := public.growth_set_bet_checklist_item(checklist_item.id, 'completed');
      if checklist_item.status <> 'completed' or checklist_item.completed_at is null then
        raise exception 'checklist completion was not persisted';
      end if;

      perform public.growth_append_bet_update(
        created_bet.id, 'comment', 'Dependência alinhada com CRM.', null, null
      );
      perform public.growth_append_bet_update(
        created_bet.id, 'execution', 'Metade das atividades foi mapeada.', 'partial', null
      );
      perform public.growth_append_bet_update(
        created_bet.id, 'status_changed', 'Execução iniciada.', null, 'in_progress'
      );

      failure_seen := false;
      begin
        update public.growth_signal_decisions set reason = 'rewritten';
      exception when raise_exception then
        failure_seen := true;
      end;
      if not failure_seen then raise exception 'signal decision mutation was accepted'; end if;
    end $$;

    select json_build_object(
      'bets', (select count(*) from public.growth_bets),
      'snapshots', (select count(*) from public.growth_evidence_snapshots),
      'updates', (select count(*) from public.growth_bet_updates),
      'bet_events', (select count(*) from public.growth_feed_events where event_type = 'bet_created'),
      'bet_update_events', (select count(*) from public.growth_feed_events where event_type = 'bet_updated'),
      'rejected_events', (select count(*) from public.growth_feed_events where event_type = 'signal_rejected'),
      'decisions', (select count(*) from public.growth_signal_decisions),
      'operational_projection', (
        select json_build_object(
          'checklist_total', checklist_total,
          'checklist_completed', checklist_completed,
          'update_count', update_count,
          'last_execution_status', last_execution_status
        )
        from public.growth_bets_operational_v
      ),
      'bet_in_progress', (select status = 'in_progress' from public.growth_bets),
      'candidate_accepted', (
        select review_status = 'approved' and status = 'accepted'
        from public.report_action_candidates
        where action_candidate_id = '33333333-3333-4333-8333-333333333333'
      ),
      'belief_preserved', (
        select belief_snapshot #>> '{source_candidate,review_status}' = 'pending'
          and belief_snapshot #>> '{source_candidate,status}' = 'candidate'
        from public.growth_bets
      ),
      'snapshot_provenance', (
        select source_hash = 'source-hash-aug'
          and artifact_path = 'runs/aug/report-build.json'
          and quality_state ->> 'run_quality_status' = 'suspect'
        from public.growth_evidence_snapshots
      ),
      'event_route_resolves', (
        select bool_and((regexp_match(route, 'item=([0-9a-f-]+)'))[1]::uuid = subject_id)
        from public.growth_feed_events
        where event_type = 'bet_created'
      ),
      'authenticated_rpc', has_function_privilege(
        'authenticated',
        'public.growth_accept_signal_as_bet(uuid,text,text,text,text,numeric,numeric,text,text,date,date,text,text,timestamp with time zone,text,jsonb,text)',
        'EXECUTE'
      ),
      'anon_rpc', has_function_privilege(
        'anon',
        'public.growth_accept_signal_as_bet(uuid,text,text,text,text,numeric,numeric,text,text,date,date,text,text,timestamp with time zone,text,jsonb,text)',
        'EXECUTE'
      ),
      'authenticated_direct_insert', has_table_privilege('authenticated', 'public.growth_bets', 'INSERT'),
      'authenticated_view', has_table_privilege('authenticated', 'public.growth_bets_operational_v', 'SELECT'),
      'authenticated_checklist_insert', has_table_privilege('authenticated', 'public.growth_bet_checklist_items', 'INSERT'),
      'authenticated_operations_rpc', has_function_privilege(
        'authenticated', 'public.growth_append_bet_update(uuid,text,text,text,text)', 'EXECUTE'
      ),
      'anon_operations_rpc', has_function_privilege(
        'anon', 'public.growth_append_bet_update(uuid,text,text,text,text)', 'EXECUTE'
      ),
      'anon_view', has_table_privilege('anon', 'public.growth_bets_operational_v', 'SELECT'),
      'security_invoker', (
        select coalesce(reloptions @> array['security_invoker=true'], false)
        from pg_class where oid = 'public.growth_bets_operational_v'::regclass
      )
    );
  `);

  const actual = JSON.parse(result);
  assert.deepEqual(actual, {
    bets: 1,
    snapshots: 1,
    updates: 6,
    bet_events: 1,
    bet_update_events: 4,
    rejected_events: 1,
    decisions: 3,
    operational_projection: {
      checklist_total: 1,
      checklist_completed: 1,
      update_count: 6,
      last_execution_status: 'partial',
    },
    bet_in_progress: true,
    candidate_accepted: true,
    belief_preserved: true,
    snapshot_provenance: true,
    event_route_resolves: true,
    authenticated_rpc: true,
    anon_rpc: false,
    authenticated_direct_insert: false,
    authenticated_view: true,
    authenticated_checklist_insert: false,
    authenticated_operations_rpc: true,
    anon_operations_rpc: false,
    anon_view: false,
    security_invoker: true,
  });
});
