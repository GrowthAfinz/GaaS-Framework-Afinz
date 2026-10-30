import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { assertNoSecrets, normalizeFile } from './build-skills-catalog.mjs';

test('publication blocks secrets without logging their value', () => {
  for (const secret of ['sb_secret_' + 'a'.repeat(30), 'ghp_' + 'b'.repeat(40), '-----BEGIN PRIVATE KEY-----']) {
    assert.throws(() => assertNoSecrets(Buffer.from(secret), 'fixture'), /Credencial/);
  }
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  assert.throws(() => assertNoSecrets(Buffer.from(`eyJhbGciOiJIUzI1NiJ9.${payload}.signature`), 'fixture'), /privilegiada/);
  assert.doesNotThrow(() => assertNoSecrets(Buffer.from('SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")'), 'reference'));
});

test('all owned skills are downloadable, intact and safe to extract', async () => {
  const catalog = JSON.parse(await readFile('public/skills/catalog.json', 'utf8'));
  const owned = catalog.skills.filter(s => s.kind === 'owned');
  const folders = (await readdir('.claude/skills', { withFileTypes: true })).filter(d => d.isDirectory());
  assert.ok(owned.length > 0);
  assert.deepEqual(new Set(owned.map(s => s.id)), new Set(folders.map(d => d.name)));
  assert.equal(new Set(catalog.skills.map(s => s.id)).size, catalog.skills.length);
  for (const skill of owned) {
    const bytes = await readFile(`public/skills/${skill.archive}`);
    assert.equal(bytes.length, skill.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), skill.sha256);
    const files = unzipSync(bytes);
    assert.equal(Object.keys(files).length, skill.file_count);
    for (const [name, data] of Object.entries(files)) {
      assert.ok(name.startsWith(`${skill.id}/`) && !name.split('/').some(p => p === '..' || p.startsWith('.env') || p === '__pycache__' || p === 'node_modules'));
      assert.deepEqual(Buffer.from(data), normalizeFile(await readFile(`.claude/skills/${name}`),name));
    }
    assert.ok(files[`${skill.id}/SKILL.md`]);
    assert.ok(files[`${skill.id}/CHANGELOG.md`]);
    assert.ok('last_validated' in skill);
    assert.ok(skill.entry_tokens > 0);
    assert.ok(skill.suggested_context_tokens >= skill.entry_tokens);
  }
  for (const third of catalog.skills.filter(s => s.kind === 'external')) assert.equal(third.archive, undefined);
});
