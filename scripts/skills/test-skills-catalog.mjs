import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
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

test('archives normalize text across Windows and Linux without changing binary bytes',()=>{
  assert.deepEqual(normalizeFile(Buffer.from([0xe1,13,10]),'agents/openai.yaml'),Buffer.from([0xe1,10]));
  assert.equal(normalizeFile(Buffer.from('a\r\nb'),'template.ampscript').toString(),'a\nb');
  assert.deepEqual(normalizeFile(Buffer.from([13,10,0,255]),'deck.pptx'),Buffer.from([13,10,0,255]));
});

test('vault export removes generated third-party references and preserves authored notes',async()=>{
  const vault = await mkdtemp(path.join(tmpdir(),'gaas-skills-export-'));
  try {
    const folder = path.join(vault,'09-Inteligencia-IA/Skills'); await mkdir(folder,{recursive:true});
    const reference = '---\nfonte: catalogo-versionado-github\nskill_id: "OpenAI:example"\n---\n# Referência antiga\n';
    await writeFile(path.join(folder,'Skill-OpenAI-example.md'),reference);
    await writeFile(path.join(folder,'Nota-do-time.md'),'# Nota autoral\nPreservar.');
    execFileSync(process.execPath,['scripts/skills/export-skills-vault.mjs','--vault',vault]);
    const files = await readdir(folder);
    assert.ok(!files.includes('Skill-OpenAI-example.md'));
    assert.equal(await readFile(path.join(folder,'Nota-do-time.md'),'utf8'),'# Nota autoral\nPreservar.');
    const index = await readFile(path.join(folder,'Catalogo-de-Skills.md'),'utf8');
    assert.ok(!index.includes('fichas externas') && !index.includes('tipo de acervo'));
  } finally {
    if (path.dirname(path.resolve(vault)) !== path.resolve(tmpdir())) throw new Error('Destino de limpeza inválido');
    await rm(vault,{recursive:true,force:true});
  }
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
  assert.ok(catalog.skills.every(s => s.kind === 'owned' && s.archive), 'O catálogo deve conter somente pacotes próprios.');
});
