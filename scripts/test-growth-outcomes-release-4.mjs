import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

function psql(args, input) {
  const dockerContainer = process.env.GROWTH_FEED_DOCKER_CONTAINER;
  const command = dockerContainer ? 'docker' : 'psql';
  const commandArgs = dockerContainer
    ? ['exec', '-i', dockerContainer, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', ...args]
    : ['-X', '-v', 'ON_ERROR_STOP=1', ...args];
  const result = spawnSync(command, commandArgs, { cwd: repoRoot, env: process.env, input, encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function latestMigration(pattern) {
  const migration = readdirSync(resolve(repoRoot, 'supabase/migrations')).filter((name) => pattern.test(name)).sort().at(-1);
  assert.ok(migration, `Migration not found: ${pattern}`);
  return readFileSync(resolve(repoRoot, 'supabase/migrations', migration), 'utf8');
}

test('Release 4 schedules, evaluates and reviews outcomes without calling missing execution a failure', () => {
  const baseline = spawnSync(process.execPath, ['--test', 'scripts/test-growth-bets-release-3b.mjs'], {
    cwd: repoRoot, env: process.env, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);
  psql([], `
    create table public.report_action_outcomes (
      id uuid primary key default gen_random_uuid(),
      action_candidate_id uuid not null references public.report_action_candidates(action_candidate_id) on delete cascade,
      metric_name text not null,
      baseline_value numeric,
      expected_value numeric,
      observed_value numeric,
      unit text,
      window_start date not null,
      window_end date not null,
      evaluated_at timestamptz,
      outcome_status text not null default 'window_open',
      conclusion text,
      reviewed_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      verification_view text,
      verification_reason text,
      constraint report_action_outcomes_status_check check (
        outcome_status in (
          'window_open', 'confirmado', 'nao_confirmado', 'premissa_invalida',
          'positive', 'neutral', 'negative', 'inconclusive'
        )
      )
    );
    create unique index report_action_outcomes_candidate_unique_idx
      on public.report_action_outcomes(action_candidate_id);
    alter table public.report_action_outcomes enable row level security;
    grant select, insert, update, delete on public.report_action_outcomes to anon, authenticated, service_role;
  `);
  psql([], latestMigration(/^\d+_growth_outcomes_release_4\.sql$/));

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      actor_id constant uuid := '11111111-1111-4111-8111-111111111111';
      run_id constant uuid := '22222222-2222-4222-8222-222222222222';
      no_execution_id constant uuid := '81000000-0000-4000-8000-000000000001';
      partial_id constant uuid := '81000000-0000-4000-8000-000000000002';
      completed_id constant uuid := '81000000-0000-4000-8000-000000000003';
      due_id constant uuid := '81000000-0000-4000-8000-000000000004';
      bet_no_execution public.growth_bets%rowtype;
      bet_partial public.growth_bets%rowtype;
      bet_completed public.growth_bets%rowtype;
      bet_due public.growth_bets%rowtype;
      completed_outcome public.report_action_outcomes%rowtype;
      partial_outcome public.report_action_outcomes%rowtype;
    begin
      perform set_config('request.jwt.claim.sub', actor_id::text, false);

      insert into public.report_action_candidates(
        action_candidate_id, run_id, source_view, entity_key, signal_code, domain,
        bucket, signal, evidence_refs, action_text, success_metric, confidence_status,
        generated_by, expected_value, expected_unit, expected_direction,
        outcome_window_end, verification_view
      ) values
        (no_execution_id, run_id, 'VIEW_TEST', 'crm:no-execution', 'NO_EXECUTION', 'crm', 'Acompanhar', 'Sem execução', '[]', 'Executar ação', 'metric', 'confirmed', 'test', 10, 'count', 'maior_melhor', current_date - 1, 'VIEW_TEST'),
        (partial_id, run_id, 'VIEW_TEST', 'crm:partial', 'PARTIAL_EXECUTION', 'crm', 'Acompanhar', 'Execução parcial', '[]', 'Executar ação', 'metric', 'confirmed', 'test', 10, 'count', 'maior_melhor', current_date - 1, 'VIEW_TEST'),
        (completed_id, run_id, 'VIEW_TEST', 'crm:completed', 'COMPLETED_EXECUTION', 'crm', 'Acompanhar', 'Execução completa', '[]', 'Executar ação', 'metric', 'confirmed', 'test', 10, 'count', 'maior_melhor', current_date - 1, 'VIEW_TEST'),
        (due_id, run_id, 'VIEW_TEST', 'crm:due', 'DUE_WITHOUT_RESULT', 'crm', 'Acompanhar', 'Vencida sem medição', '[]', 'Executar ação', 'metric', 'confirmed', 'test', 10, 'count', 'maior_melhor', current_date - 1, 'VIEW_TEST');

      insert into public.growth_feed_events(
        event_type, subject_type, subject_id, front, occurred_at, priority_score,
        relevance_dimensions, summary_snapshot, route, dedupe_key
      )
      select 'recommendation_created', 'action_candidate', candidate_id, 'crm_acquisition', now(), 50,
        jsonb_build_object('group_key', 'candidate:' || candidate_id::text, 'confidence_status', 'confirmed'),
        jsonb_build_object('title', 'Teste', 'primary_action', jsonb_build_object('kind', 'open_evidence', 'label', 'Abrir')),
        '?view=learning&section=feed&item=' || candidate_id::text,
        'test-candidate:' || candidate_id::text
      from unnest(array[no_execution_id, partial_id, completed_id, due_id]) candidate_id;

      bet_no_execution := public.growth_accept_signal_as_bet(no_execution_id, 'CRM', 'Hipótese sem execução', 'Executar ação', 'metric', 5, 10, 'maior_melhor', 'metric >= 10', current_date - 10, current_date - 1, 'VIEW_TEST');
      bet_partial := public.growth_accept_signal_as_bet(partial_id, 'CRM', 'Hipótese parcial', 'Executar ação', 'metric', 5, 10, 'maior_melhor', 'metric >= 10', current_date - 10, current_date - 1, 'VIEW_TEST');
      bet_completed := public.growth_accept_signal_as_bet(completed_id, 'CRM', 'Hipótese completa', 'Executar ação', 'metric', 5, 10, 'maior_melhor', 'metric >= 10', current_date - 10, current_date - 1, 'VIEW_TEST');
      bet_due := public.growth_accept_signal_as_bet(due_id, 'CRM', 'Hipótese vencida', 'Executar ação', 'metric', 5, 10, 'maior_melhor', 'metric >= 10', current_date - 10, current_date - 1, 'VIEW_TEST');

      perform public.growth_append_bet_update(bet_partial.id, 'execution', 'Ação executada parcialmente.', 'partial', null);
      perform public.growth_append_bet_update(bet_completed.id, 'execution', 'Ação concluída no escopo contratado.', 'completed', null);

      insert into public.report_action_outcomes(
        action_candidate_id, metric_name, baseline_value, expected_value, observed_value,
        unit, window_start, window_end, evaluated_at, outcome_status, conclusion,
        verification_view, verification_reason
      ) values
        (no_execution_id, 'metric', 5, 10, 4, 'count', current_date - 10, current_date - 1, now(), 'nao_confirmado', 'Abaixo da expectativa.', 'VIEW_TEST', 'linha_de_metrica'),
        (partial_id, 'metric', 5, 10, 4, 'count', current_date - 10, current_date - 1, now(), 'nao_confirmado', 'Abaixo da expectativa.', 'VIEW_TEST', 'linha_de_metrica'),
        (completed_id, 'metric', 5, 10, 4, 'count', current_date - 10, current_date - 1, now(), 'nao_confirmado', 'Abaixo da expectativa.', 'VIEW_TEST', 'linha_de_metrica');

      select * into partial_outcome from public.report_action_outcomes where bet_id = bet_partial.id;
      select * into completed_outcome from public.report_action_outcomes where bet_id = bet_completed.id;

      perform public.growth_review_outcome(completed_outcome.id, 'confirm', null, null);
      perform public.growth_review_outcome(partial_outcome.id, 'contest', 'O escopo executado divergiu do contrato.', null);
    end $$;

    select json_build_object(
      'no_execution_verdict', (select system_verdict from public.report_action_outcomes where action_candidate_id = '81000000-0000-4000-8000-000000000001'),
      'partial_verdict', (select system_verdict from public.report_action_outcomes where action_candidate_id = '81000000-0000-4000-8000-000000000002'),
      'completed_verdict', (select system_verdict from public.report_action_outcomes where action_candidate_id = '81000000-0000-4000-8000-000000000003'),
      'due_without_result', (select due_bucket from public.growth_outcomes_due_v where source_action_candidate_id = '81000000-0000-4000-8000-000000000004'),
      'completed_review', (select json_build_object('status', review_status, 'resolved', resolved_verdict) from public.report_action_outcomes where action_candidate_id = '81000000-0000-4000-8000-000000000003'),
      'partial_review', (select json_build_object('status', review_status, 'reason', contestation_reason) from public.report_action_outcomes where action_candidate_id = '81000000-0000-4000-8000-000000000002'),
      'execution_events', (select count(*) from public.growth_feed_events where event_type = 'execution_recorded'),
      'outcome_events', (select count(*) from public.growth_feed_events where event_type = 'outcome_evaluated'),
      'auth_review_rpc', has_function_privilege('authenticated', 'public.growth_review_outcome(uuid,text,text,text)', 'EXECUTE'),
      'anon_review_rpc', has_function_privilege('anon', 'public.growth_review_outcome(uuid,text,text,text)', 'EXECUTE'),
      'auth_view', has_table_privilege('authenticated', 'public.growth_outcomes_due_v', 'SELECT'),
      'anon_view', has_table_privilege('anon', 'public.growth_outcomes_due_v', 'SELECT'),
      'security_invoker', (select coalesce(reloptions @> array['security_invoker=true'], false) from pg_class where oid = 'public.growth_outcomes_due_v'::regclass)
    );
  `);

  assert.deepEqual(JSON.parse(result), {
    no_execution_verdict: 'not_verifiable',
    partial_verdict: 'execution_diverged',
    completed_verdict: 'not_confirmed',
    due_without_result: 'overdue',
    completed_review: { status: 'confirmed_by_user', resolved: 'not_confirmed' },
    partial_review: { status: 'contested', reason: 'O escopo executado divergiu do contrato.' },
    execution_events: 2,
    outcome_events: 5,
    auth_review_rpc: true,
    anon_review_rpc: false,
    auth_view: true,
    anon_view: false,
    security_invoker: true,
  });
});
