import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL('../supabase/migrations/20260928235051_gaas_vault_library.sql', import.meta.url);
const sql = await readFile(migrationUrl, 'utf8');
const readerMigrationUrl = new URL('../supabase/migrations/20260929003742_optimize_gaas_vault_reader.sql', import.meta.url);
const readerSql = await readFile(readerMigrationUrl, 'utf8');

test('vault tables are RLS-protected and authenticated-only', () => {
  for (const table of ['gaas_vault_sync_runs', 'gaas_vault_notes', 'gaas_vault_note_revisions', 'gaas_vault_links']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on public\\.${table} from anon, authenticated`, 'i'));
  }
  assert.match(sql, /grant select on public\.gaas_vault_notes to authenticated/i);
});

test('sync authority is server-side and tied to governed admin membership', () => {
  assert.match(sql, /from public\.report_live_memberships membership/i);
  assert.match(sql, /membership\.role = 'admin'/i);
  assert.match(sql, /security definer[\s\S]+set search_path = ''/i);
  assert.match(sql, /raise exception 'vault_sync_admin_required'/i);
});

test('search and audit contracts are present', () => {
  assert.match(sql, /search_vector tsvector not null default/i);
  assert.match(sql, /create trigger gaas_vault_notes_search_vector_trigger/i);
  assert.match(sql, /using gin \(search_vector\) where deleted_at is null/i);
  assert.match(sql, /websearch_to_tsquery\('portuguese'/i);
  assert.match(sql, /create table public\.gaas_vault_note_revisions/i);
  assert.match(sql, /create or replace view public\.gaas_vault_backlinks_v[\s\S]+security_invoker = true/i);
});

test('reader search is metadata-only, paginated and RLS-aware', () => {
  assert.match(readerSql, /create or replace function public\.gaas_search_vault_index/i);
  assert.doesNotMatch(readerSql.match(/returns table \([\s\S]+?\)\s*language sql/i)?.[0] || '', /content_markdown/i);
  assert.match(readerSql, /security invoker/i);
  assert.match(readerSql, /limit least\(greatest\(coalesce\(p_limit, 60\), 1\), 100\)/i);
  assert.match(readerSql, /offset greatest\(coalesce\(p_offset, 0\), 0\)/i);
  assert.match(readerSql, /count\(\*\) over \(\)::integer as total_count/i);
  assert.match(readerSql, /grant execute on function public\.gaas_search_vault_index[\s\S]+to authenticated/i);
});

test('folder facets expose compact top-level counts', () => {
  assert.match(readerSql, /create or replace function public\.gaas_vault_folder_facets\(\)/i);
  assert.match(readerSql, /split_part\(note\.folder, '\/', 1\)/i);
  assert.match(readerSql, /count\(\*\)::integer as note_count/i);
});
