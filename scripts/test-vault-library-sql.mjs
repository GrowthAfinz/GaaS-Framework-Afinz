import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL('../supabase/migrations/20260928235051_gaas_vault_library.sql', import.meta.url);
const sql = await readFile(migrationUrl, 'utf8');

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
