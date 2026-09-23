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

test('Release 7A creates contextual bets atomically and shares the Release 6 matcher', () => {
  const baseline = spawnSync(process.execPath, ['--test', 'scripts/test-growth-learning-reuse-release-6.mjs'], {
    cwd: repoRoot, env: process.env, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  psql([], latestMigration(/^\d+_growth_context_entry_release_7a\.sql$/));

  const result = psql(['-q', '-t', '-A'], `
    do $$
    declare
      actor_id constant uuid := '11111111-1111-4111-8111-111111111111';
      candidate_id constant uuid := 'a1111111-1111-4111-8111-111111111111';
      context_snapshot jsonb := '{
        "metric":"installs",
        "partner":"Plurix",
        "entity":"media:plurix:installs",
        "entity_key":"media:plurix:installs",
        "signal_code":"INSTALLS_EFFICIENCY",
        "source_view":"VIEW_MEDIA_CAMPAIGNS",
        "channel":"Meta",
        "platform":"Meta"
      }';
      source_context jsonb := '{
        "source_surface":"acquisition_funnel",
        "source_route":"funnels:paid-media",
        "period_start":"2026-08-01",
        "period_end":"2026-08-31",
        "filters":{"partner":"Plurix","channel":"Meta","platform":"Meta","signal_code":"INSTALLS_EFFICIENCY"},
        "entity_key":"media:plurix:installs",
        "visual_ref":"funnels:paid-media:workspace",
        "title":"Funil de Aquisição App Install",
        "verification_view":"funnels:paid-media"
      }';
      decisions jsonb;
      created_bet public.growth_bets%rowtype;
      invalid_blocked boolean := false;
    begin
      perform set_config('request.jwt.claim.sub', actor_id::text, false);

      if (select jsonb_agg(to_jsonb(signal_match) - 'context_snapshot' order by signal_match.match_score desc, signal_match.learning_id)
          from public.growth_find_applicable_learnings(candidate_id) signal_match)
        is distinct from
         (select jsonb_agg(to_jsonb(context_match) - 'context_snapshot' order by context_match.match_score desc, context_match.learning_id)
          from public.growth_find_applicable_learnings_for_context('paid_media', context_snapshot) context_match)
      then
        raise exception 'signal and contextual matchers diverged for equivalent context';
      end if;

      select jsonb_agg(jsonb_build_object(
        'learning_id', suggestion.learning_id,
        'decision', 'reused'
      )) into decisions
      from public.growth_find_applicable_learnings_for_context(
        'paid_media',
        jsonb_build_object(
          'metric', 'installs',
          'partner', 'Plurix',
          'entity', 'media:plurix:installs',
          'entity_key', 'media:plurix:installs',
          'source_view', 'acquisition_funnel',
          'channel', 'Meta',
          'platform', 'Meta',
          'signal_code', 'INSTALLS_EFFICIENCY'
        )
      ) suggestion
      where suggestion.eligibility in ('reusable', 'needs_review');

      created_bet := public.growth_create_contextual_bet_with_memory(
        'paid_media', source_context, 'Mídia Paga',
        'Ajustar criativos aumenta instalações Plurix.',
        'Revisar criativos e audiência.', 'installs', 80, 100,
        'maior_melhor', 'Atingir ao menos 100 instalações.',
        date '2026-09-24', date '2026-10-31', 'funnels:paid-media',
        coalesce(decisions, '[]'::jsonb), 'installs'
      );

      if created_bet.source_action_candidate_id is not null then
        raise exception 'contextual bet incorrectly references an action candidate';
      end if;
      if created_bet.belief_snapshot #>> '{source_context,source_surface}' <> 'acquisition_funnel' then
        raise exception 'analytic source context was not frozen';
      end if;
      if not exists (
        select 1 from public.growth_evidence_snapshots evidence
        where evidence.id = created_bet.evidence_snapshot_id
          and evidence.source_run_id is null
          and evidence.period_start = date '2026-08-01'
          and evidence.period_end = date '2026-08-31'
          and evidence.quality_state ->> 'source_kind' = 'interactive_analytic_context'
      ) then
        raise exception 'contextual evidence snapshot is incomplete';
      end if;
      if exists (
        select 1 from public.growth_learning_applications application
        where application.bet_id = created_bet.id
          and application.action_candidate_id is not null
      ) then
        raise exception 'contextual memory application retained a candidate id';
      end if;
      if not exists (
        select 1 from public.growth_bet_updates update_row
        where update_row.bet_id = created_bet.id
          and update_row.metadata ->> 'source_kind' = 'analytic_context'
      ) then
        raise exception 'contextual bet timeline origin is missing';
      end if;
      if not exists (
        select 1 from public.growth_feed_events event
        where event.subject_id = created_bet.id
          and event.event_type = 'bet_created'
          and event.relevance_dimensions ->> 'source_kind' = 'analytic_context'
      ) then
        raise exception 'contextual bet feed event is missing';
      end if;

      begin
        perform public.growth_create_contextual_bet_with_memory(
          'paid_media', source_context || '{"source_surface":"unknown"}'::jsonb,
          'Mídia Paga', 'Hipótese inválida', 'Ação inválida', 'installs',
          80, 100, 'maior_melhor', 'Critério', date '2026-09-24',
          date '2026-10-31', 'funnels:paid-media', '[]'::jsonb, 'installs'
        );
      exception when raise_exception then
        invalid_blocked := true;
      end;
      if not invalid_blocked then
        raise exception 'unsupported contextual source was accepted';
      end if;
    end $$;

    select json_build_object(
      'contextual_bets', (select count(*) from public.growth_bets where source_action_candidate_id is null),
      'contextual_applications', (select count(*) from public.growth_learning_applications where action_candidate_id is null),
      'contextual_feed_events', (select count(*) from public.growth_feed_events where relevance_dimensions ->> 'source_kind' = 'analytic_context'),
      'draft_table', to_regclass('public.growth_context_drafts') is not null,
      'auth_matcher', has_function_privilege('authenticated', 'public.growth_find_applicable_learnings_for_context(text,jsonb)', 'EXECUTE'),
      'anon_matcher', has_function_privilege('anon', 'public.growth_find_applicable_learnings_for_context(text,jsonb)', 'EXECUTE'),
      'auth_command', has_function_privilege('authenticated', 'public.growth_create_contextual_bet_with_memory(text,jsonb,text,text,text,text,numeric,numeric,text,text,date,date,text,jsonb,text,timestamptz,text,jsonb,text)', 'EXECUTE'),
      'anon_command', has_function_privilege('anon', 'public.growth_create_contextual_bet_with_memory(text,jsonb,text,text,text,text,numeric,numeric,text,text,date,date,text,jsonb,text,timestamptz,text,jsonb,text)', 'EXECUTE')
    );
  `);

  const summary = JSON.parse(result);
  assert.equal(summary.contextual_bets, 1);
  assert.ok(summary.contextual_applications >= 1, result);
  assert.equal(summary.contextual_feed_events, 1);
  assert.equal(summary.draft_table, false);
  assert.equal(summary.auth_matcher, true);
  assert.equal(summary.anon_matcher, false);
  assert.equal(summary.auth_command, true);
  assert.equal(summary.anon_command, false);
});
