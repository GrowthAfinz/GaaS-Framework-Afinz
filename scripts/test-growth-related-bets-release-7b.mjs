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

test('Release 7B exposes contextual source links without bypassing RLS', () => {
  const baseline = spawnSync(process.execPath, ['--test', 'scripts/test-growth-context-entry-release-7a.mjs'], {
    cwd: repoRoot, env: process.env, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  psql([], latestMigration(/^\d+_growth_related_bets_release_7b\.sql$/));

  const result = psql(['-q', '-t', '-A'], `
    select json_build_object(
      'link_count', (select count(*) from public.growth_bet_source_links_v),
      'paid_media_link', (
        select json_build_object(
          'front', link.front,
          'surface', link.source_surface,
          'route', link.source_route,
          'entity', link.entity_key,
          'period_start', link.source_period_start,
          'period_end', link.source_period_end,
          'filters', link.source_filters,
          'status', link.status
        )
        from public.growth_bet_source_links_v link
        where link.source_route = 'funnels:paid-media'
        limit 1
      ),
      'candidate_bets_excluded', not exists (
        select 1
        from public.growth_bet_source_links_v link
        join public.growth_bets bet on bet.id = link.bet_id
        where bet.source_action_candidate_id is not null
      ),
      'security_invoker', coalesce((
        select 'security_invoker=true' = any(reloptions)
        from pg_class
        where oid = 'public.growth_bet_source_links_v'::regclass
      ), false),
      'auth_select', has_table_privilege('authenticated', 'public.growth_bet_source_links_v', 'SELECT'),
      'anon_select', has_table_privilege('anon', 'public.growth_bet_source_links_v', 'SELECT'),
      'lookup_index', to_regclass('public.growth_bets_context_source_idx') is not null
    );
  `);

  const summary = JSON.parse(result);
  assert.equal(summary.link_count, 1);
  assert.equal(summary.paid_media_link.front, 'paid_media');
  assert.equal(summary.paid_media_link.surface, 'acquisition_funnel');
  assert.equal(summary.paid_media_link.route, 'funnels:paid-media');
  assert.equal(summary.paid_media_link.entity, 'media:plurix:installs');
  assert.equal(summary.paid_media_link.period_start, '2026-08-01');
  assert.equal(summary.paid_media_link.period_end, '2026-08-31');
  assert.equal(summary.paid_media_link.filters.partner, 'Plurix');
  assert.equal(summary.paid_media_link.status, 'approved');
  assert.equal(summary.candidate_bets_excluded, true);
  assert.equal(summary.security_invoker, true);
  assert.equal(summary.auth_select, true);
  assert.equal(summary.anon_select, false);
  assert.equal(summary.lookup_index, true);
});
