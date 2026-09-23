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

test('Release 6 retrieves deterministic memory and freezes explicit reuse decisions', () => {
  const baseline = spawnSync(process.execPath, ['--test', 'scripts/test-growth-memory-release-5.mjs'], {
    cwd: repoRoot, env: process.env, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  psql([], latestMigration(/^\d+_growth_learning_reuse_release_6\.sql$/));

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      actor_id constant uuid := '11111111-1111-4111-8111-111111111111';
      candidate_id constant uuid := 'a1111111-1111-4111-8111-111111111111';
      run_id uuid;
      reused_learning_id constant uuid := 'b1111111-1111-4111-8111-111111111111';
      second_learning_id constant uuid := 'b2222222-2222-4222-8222-222222222222';
      expired_learning_id constant uuid := 'b3333333-3333-4333-8333-333333333333';
      contested_learning_id constant uuid := 'b4444444-4444-4444-8444-444444444444';
      front_only_learning_id constant uuid := 'b5555555-5555-4555-8555-555555555555';
      conflict_learning_id constant uuid := 'b6666666-6666-4666-8666-666666666666';
      created_bet public.growth_bets%rowtype;
      decisions jsonb;
      mutation_blocked boolean := false;
    begin
      perform set_config('request.jwt.claim.sub', actor_id::text, false);
      select id into strict run_id from public.report_runs order by created_at limit 1;

      insert into public.report_action_candidates(
        action_candidate_id, run_id, source_view, entity_key, signal_code, domain,
        partner, bucket, signal, impact, probable_cause, evidence_refs, reading_limit,
        action_text, success_metric, confidence_status, generated_by, expected_value,
        expected_unit, expected_direction, outcome_window_end, verification_view
      ) values (
        candidate_id, run_id, 'VIEW_MEDIA_CAMPAIGNS', 'media:plurix:installs',
        'INSTALLS_EFFICIENCY', 'midia', 'Plurix', 'Agir hoje',
        'Instalações Plurix abaixo do patamar.', 'Reduz originação.',
        'Eficiência de campanha.', '[{"channel":"Meta","platform":"Meta"}]',
        'Não prova causalidade.', 'Revisar criativos e audiência.', 'installs',
        'confirmed', 'release-6-test', 100, 'installs', 'maior_melhor',
        date '2026-10-31', 'VIEW_MEDIA_CAMPAIGNS'
      );

      insert into public.growth_learnings(
        id, source_kind, source_key, source_title, source_ref, front, classification,
        lifecycle_status, statement, scope, applicability, limitations, confidence_status,
        regime, valid_from, review_at, valid_until, created_by
      ) values
        (reused_learning_id, 'vault_curated', 'test:r6:reused', 'Meta Plurix installs', 'test:r6',
         'paid_media', 'confirmed', 'active', 'Reutilizar o padrão de instalações Meta para Plurix.',
         '{"metric":"installs","partner":"Plurix","channel":"Meta"}', '{}', '{}', 'confirmed',
         null, date '2026-09-01', date '2026-12-01', null, 'sql-contract-test'),
        (second_learning_id, 'vault_curated', 'test:r6:discarded', 'Outra leitura de installs', 'test:r6',
         'paid_media', 'directional', 'active', 'Leitura direcional para instalações.',
         '{"metric":"installs","partner":"Plurix"}', '{}', '{"limit":"validar criativo"}', 'directional',
         null, date '2026-09-01', date '2026-12-01', null, 'sql-contract-test'),
        (expired_learning_id, 'vault_curated', 'test:r6:expired', 'Regra vencida', 'test:r6',
         'paid_media', 'confirmed', 'expired', 'Regra antiga de instalações.',
         '{"metric":"installs","partner":"Plurix"}', '{}', '{}', 'confirmed',
         null, date '2026-01-01', date '2026-03-01', date '2026-03-31', 'sql-contract-test'),
        (contested_learning_id, 'vault_curated', 'test:r6:contested', 'Regra contestada', 'test:r6',
         'paid_media', 'contradictory', 'contested', 'Esta regra possui evidência contraditória.',
         '{"metric":"installs","partner":"Plurix"}', '{}', '{}', 'suspect',
         null, date '2026-09-01', date '2026-12-01', null, 'sql-contract-test'),
        (front_only_learning_id, 'vault_curated', 'test:r6:front-only', 'Apenas mesma frente', 'test:r6',
         'paid_media', 'confirmed', 'active', 'Não deve aparecer apenas por pertencer a mídia.',
         '{"domain":"paid_media"}', '{}', '{}', 'confirmed',
         null, date '2026-09-01', date '2026-12-01', null, 'sql-contract-test'),
        (conflict_learning_id, 'vault_curated', 'test:r6:conflict', 'Parceiro conflitante', 'test:r6',
         'paid_media', 'confirmed', 'active', 'Métrica coincide, mas o parceiro conflita.',
         '{"metric":"installs","partner":"Serasa"}', '{}', '{}', 'confirmed',
         null, date '2026-09-01', date '2026-12-01', null, 'sql-contract-test');

      insert into public.growth_learning_revisions(
        learning_id, revision, statement, scope, applicability, limitations,
        classification, lifecycle_status, confidence_status, regime, valid_from,
        review_at, valid_until, change_reason, changed_by
      )
      select id, 1, statement, scope, applicability, limitations, classification,
        lifecycle_status, confidence_status, regime, valid_from, review_at, valid_until,
        'Revisão inicial do teste.', 'sql-contract-test'
      from public.growth_learnings
      where id in (
        reused_learning_id, second_learning_id, expired_learning_id,
        contested_learning_id, front_only_learning_id, conflict_learning_id
      );

      if exists (
        select 1 from public.growth_find_applicable_learnings(candidate_id)
        where learning_id in (front_only_learning_id, conflict_learning_id)
      ) then
        raise exception 'front-only or conflicting memory was suggested';
      end if;
      if not exists (
        select 1 from public.growth_find_applicable_learnings(candidate_id)
        where learning_id = expired_learning_id and eligibility = 'expired'
      ) then
        raise exception 'expired matching memory was not returned as warning';
      end if;
      if not exists (
        select 1 from public.growth_find_applicable_learnings(candidate_id)
        where learning_id = contested_learning_id and eligibility = 'contested'
      ) then
        raise exception 'contested matching memory was not returned as warning';
      end if;

      select jsonb_agg(jsonb_build_object(
        'learning_id', suggestion.learning_id,
        'decision', case when suggestion.learning_id = reused_learning_id then 'reused' else 'discarded' end,
        'reason', case when suggestion.learning_id = reused_learning_id then null else 'Escopo menos específico para esta aposta.' end
      )) into decisions
      from public.growth_find_applicable_learnings(candidate_id) suggestion
      where suggestion.eligibility in ('reusable', 'needs_review');

      created_bet := public.growth_accept_signal_as_bet_with_memory(
        candidate_id, 'Mídia Paga', 'Ajustar criativos aumenta instalações Plurix.',
        'Revisar criativos e audiência.', 'installs', 80, 100, 'maior_melhor',
        'Atingir ao menos 100 instalações.', date '2026-09-24', date '2026-10-31',
        'VIEW_MEDIA_CAMPAIGNS', decisions, 'installs'
      );

      if not exists (
        select 1 from public.growth_learning_applications
        where bet_id = created_bet.id and learning_id = reused_learning_id
          and decision = 'reused' and learning_revision = 1
      ) then
        raise exception 'reused learning snapshot was not frozen';
      end if;
      if not exists (
        select 1 from public.growth_learning_links
        where learning_id = reused_learning_id and target_type = 'bet'
          and target_id = created_bet.id::text and relation_type = 'applies_to'
      ) then
        raise exception 'reused learning was not linked to bet';
      end if;

      begin
        update public.growth_learning_applications
        set match_score = match_score + 1
        where bet_id = created_bet.id;
      exception when raise_exception then
        mutation_blocked := true;
      end;
      if not mutation_blocked then
        raise exception 'learning application mutation was accepted';
      end if;
    end $$;

    select json_build_object(
      'suggestions', (select count(*) from public.growth_find_applicable_learnings('a1111111-1111-4111-8111-111111111111')),
      'eligible', (select count(*) from public.growth_find_applicable_learnings('a1111111-1111-4111-8111-111111111111') where eligibility in ('reusable','needs_review')),
      'warnings', (select count(*) from public.growth_find_applicable_learnings('a1111111-1111-4111-8111-111111111111') where eligibility in ('expired','contested','superseded','blocked')),
      'applications', (select count(*) from public.growth_learning_applications),
      'reused', (select count(*) from public.growth_learning_applications where decision = 'reused'),
      'discarded', (select count(*) from public.growth_learning_applications where decision = 'discarded'),
      'app_view', (select count(*) from public.growth_learning_applications_v),
      'reuse_rate', (select reuse_rate from public.growth_memory_active_v where id = 'b1111111-1111-4111-8111-111111111111'),
      'auth_matcher', has_function_privilege('authenticated', 'public.growth_find_applicable_learnings(uuid)', 'EXECUTE'),
      'anon_matcher', has_function_privilege('anon', 'public.growth_find_applicable_learnings(uuid)', 'EXECUTE'),
      'auth_app_view', has_table_privilege('authenticated', 'public.growth_learning_applications_v', 'SELECT'),
      'anon_app_view', has_table_privilege('anon', 'public.growth_learning_applications_v', 'SELECT'),
      'security_invoker', (select coalesce(reloptions @> array['security_invoker=true'], false) from pg_class where oid = 'public.growth_learning_applications_v'::regclass)
    );
  `);

  const summary = JSON.parse(result);
  assert.ok(summary.suggestions >= 4, result);
  assert.ok(summary.eligible >= 2, result);
  assert.ok(summary.warnings >= 2, result);
  assert.equal(summary.applications, summary.eligible);
  assert.equal(summary.reused, 1);
  assert.equal(summary.discarded, summary.eligible - 1);
  assert.equal(summary.app_view, summary.applications);
  assert.equal(summary.reuse_rate, 1);
  assert.equal(summary.auth_matcher, true);
  assert.equal(summary.anon_matcher, false);
  assert.equal(summary.auth_app_view, true);
  assert.equal(summary.anon_app_view, false);
  assert.equal(summary.security_invoker, true);
});
