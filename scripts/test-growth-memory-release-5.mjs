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

test('Release 5 separates curated history from loop-validated memory and versions every revision', () => {
  const baseline = spawnSync(process.execPath, ['--test', 'scripts/test-growth-outcomes-release-4.mjs'], {
    cwd: repoRoot, env: process.env, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  psql([], latestMigration(/^\d+_growth_memory_release_5\.sql$/));
  psql([], latestMigration(/^\d+_growth_memory_revision_guard_reset\.sql$/));

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      actor_id constant uuid := '11111111-1111-4111-8111-111111111111';
      contested_outcome_id uuid;
      curated_learning_id uuid;
      direct_update_blocked boolean := false;
      revision_update_blocked boolean := false;
    begin
      perform set_config('request.jwt.claim.sub', actor_id::text, false);

      select outcome.id into strict contested_outcome_id
      from public.report_action_outcomes outcome
      where outcome.review_status = 'contested';

      perform public.growth_review_outcome(
        contested_outcome_id,
        'resolve',
        'A execução parcial não permite concluir a hipótese.',
        'not_verifiable'
      );

      select learning.id into strict curated_learning_id
      from public.growth_learnings learning
      where learning.source_key = 'vault:sfmc-preview:test-send-certification';

      perform public.growth_revise_learning(
        curated_learning_id,
        'A prévia local acelera edição, mas somente o Test Send do SFMC certifica lookup, personalização, tracking e cliente de e-mail.',
        '{"domain":"crm","channel":"email","system":"SFMC"}',
        '{"use_when":["dynamic_email_release","ampscript_change","new_campaign"]}',
        '{"preview_limit":"O navegador não reproduz todo o ambiente do SFMC nem todos os clientes de e-mail."}',
        'confirmed', 'active', 'confirmed', date '2026-08-10', date '2026-12-22',
        'Texto condensado sem alterar a regra operacional.', 'sql-contract-test',
        'dynamic_email_release', null
      );

      begin
        update public.growth_learnings
        set statement = 'Mutação sem revisão'
        where id = curated_learning_id;
      exception when raise_exception then
        direct_update_blocked := true;
      end;
      if not direct_update_blocked then
        raise exception 'direct learning mutation was not blocked';
      end if;

      begin
        update public.growth_learning_revisions
        set change_reason = 'Mutação de histórico'
        where learning_id = curated_learning_id and revision = 1;
      exception when raise_exception then
        revision_update_blocked := true;
      end;
      if not revision_update_blocked then
        raise exception 'revision history mutation was not blocked';
      end if;

      perform public.growth_materialize_learning(contested_outcome_id);
    end $$;

    select json_build_object(
      'curated', (select count(*) from public.growth_learnings where source_kind = 'vault_curated'),
      'validated', (select count(*) from public.growth_learnings where source_kind = 'outcome'),
      'active_view', (select count(*) from public.growth_memory_active_v),
      'proposals', (select count(*) from public.growth_curated_proposals),
      'proposal_events', (select count(*) from public.growth_feed_events where event_type = 'curated_proposal_created'),
      'learning_events', (select count(*) from public.growth_feed_events where event_type = 'learning_created'),
      'revision_events', (select count(*) from public.growth_feed_events where event_type = 'learning_revised'),
      'revision_rows', (select count(*) from public.growth_learning_revisions),
      'loop_classifications', (select json_agg(classification order by classification) from public.growth_learnings where source_kind = 'outcome'),
      'source_labels_distinct', (select count(distinct source_kind) from public.growth_memory_active_v),
      'auth_view', has_table_privilege('authenticated', 'public.growth_memory_active_v', 'SELECT'),
      'anon_view', has_table_privilege('anon', 'public.growth_memory_active_v', 'SELECT'),
      'auth_direct_insert', has_table_privilege('authenticated', 'public.growth_learnings', 'INSERT'),
      'auth_revise_rpc', has_function_privilege('authenticated', 'public.growth_revise_learning(uuid,text,jsonb,jsonb,jsonb,text,text,text,date,date,text,text,text,date)', 'EXECUTE'),
      'service_revise_rpc', has_function_privilege('service_role', 'public.growth_revise_learning(uuid,text,jsonb,jsonb,jsonb,text,text,text,date,date,text,text,text,date)', 'EXECUTE'),
      'security_invoker', (select coalesce(reloptions @> array['security_invoker=true'], false) from pg_class where oid = 'public.growth_memory_active_v'::regclass)
    );
  `);

  assert.deepEqual(JSON.parse(result), {
    curated: 5,
    validated: 2,
    active_view: 7,
    proposals: 2,
    proposal_events: 2,
    learning_events: 7,
    revision_events: 1,
    revision_rows: 8,
    loop_classifications: ['contradictory', 'inconclusive'],
    source_labels_distinct: 2,
    auth_view: true,
    anon_view: false,
    auth_direct_insert: false,
    auth_revise_rpc: false,
    service_revise_rpc: true,
    security_invoker: true,
  });
});
