import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dockerContainer = process.env.POSTGRES_CONTAINER || '';

function psql(args, input) {
  const command = dockerContainer ? 'docker' : 'psql';
  const commandArgs = dockerContainer
    ? ['exec', '-i', dockerContainer, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', ...args]
    : ['-X', '-v', 'ON_ERROR_STOP=1', ...args];
  return execFileSync(command, commandArgs, { input, encoding: 'utf8' }).trim();
}

function latestMigration(pattern) {
  const migrations = readdirSync(resolve(import.meta.dirname, '../supabase/migrations'))
    .filter((name) => pattern.test(name)).sort();
  assert.ok(migrations.length, `Migration not found: ${pattern}`);
  return readFileSync(resolve(import.meta.dirname, '../supabase/migrations', migrations.at(-1)), 'utf8');
}

test('Release 7C freezes Growth sources and activates the existing C7/C8 contracts', () => {
  psql([], `
    drop schema public cascade;
    create schema public;
    create table public.report_runs (
      id uuid primary key,
      period_start date not null,
      period_end date not null,
      report_profile text not null
    );
    create table public.report_frozen_inputs (
      run_id uuid primary key references public.report_runs(id),
      inputs jsonb not null
    );
    create table public.report_slide_contracts (
      slide_code text primary key,
      source_view text,
      required_fields jsonb not null default '[]'::jsonb,
      optional_fields jsonb not null default '[]'::jsonb,
      implementation_readiness text not null
    );
    insert into public.report_slide_contracts values
      ('C7','VIEW_ACTION_OUTCOMES','["approved_actions","outcomes"]','[]','bloqueado_produtor'),
      ('C8','VIEW_ACTION_QUEUE','["action_candidates"]','["approved_actions"]','bloqueado_produtor');
  `);

  psql([], latestMigration(/^\d+_growth_learning_editorial_release_7c\.sql$/));
  const result = JSON.parse(psql(['-q', '-t', '-A'], `
    select json_build_object(
      'contracts', (
        select json_agg(json_build_object(
          'slide_code', slide_code,
          'source_view', source_view,
          'required_fields', required_fields,
          'readiness', implementation_readiness
        ) order by slide_code)
        from public.report_slide_contracts
      ),
      'capture_has_bets', position('growthBets' in pg_get_functiondef('public.report_live_capture_inputs(uuid)'::regprocedure)) > 0,
      'capture_has_outcomes', position('growthOutcomes' in pg_get_functiondef('public.report_live_capture_inputs(uuid)'::regprocedure)) > 0,
      'capture_has_learnings', position('growthLearnings' in pg_get_functiondef('public.report_live_capture_inputs(uuid)'::regprocedure)) > 0
    );
  `));

  assert.deepEqual(result.contracts, [
    {
      slide_code: 'C7',
      source_view: 'VIEW_GROWTH_LEARNING_RETROSPECTIVE',
      required_fields: ['cycle_records'],
      readiness: 'pronto_dado',
    },
    {
      slide_code: 'C8',
      source_view: 'VIEW_ACTION_QUEUE',
      required_fields: ['action_candidates'],
      readiness: 'pronto_dado',
    },
  ]);
  assert.equal(result.capture_has_bets, true);
  assert.equal(result.capture_has_outcomes, true);
  assert.equal(result.capture_has_learnings, true);
});
