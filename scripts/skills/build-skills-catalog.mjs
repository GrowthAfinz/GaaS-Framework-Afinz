import { noteName, skillNote, catalogNote } from './skill-documentation.mjs';
import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'js-yaml';
import { zipSync, unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(root, '.claude/skills');
const output = path.join(root, 'public/skills');
const check = process.argv.includes('--check');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ignored = name => ['.git', 'node_modules', '__pycache__'].includes(name) || name.startsWith('.env') || /\.py[co]$/.test(name);
export const normalizeFile = (bytes, name) => {
  if (!/\.(md|txt|json|py|sql|csv|js|mjs|mts|ts|tsx|yaml|yml|toml|html|css|svg|xml|sh|ps1|ampscript)$/i.test(name)) return bytes;
  // Normalize byte-level CRLF even in legacy encodings; never touch binary assets.
  return Buffer.from(Buffer.from(bytes).toString('latin1').replaceAll('\r\n','\n'),'latin1');
};
export function assertNoSecrets(bytes, label) {
  const text = Buffer.from(bytes).toString('utf8');
  const patterns = [/sb_secret_[A-Za-z0-9_-]{12,}/, /\b(?:sk-(?:proj-|svcacct-)?|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bAIza[0-9A-Za-z_-]{30,}/];
  if (patterns.some(pattern => pattern.test(text))) throw new Error(`Credencial detectada: ${label} (valor omitido)`);
  for (const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try { if (JSON.parse(Buffer.from(token[0].split('.')[1], 'base64url')).role === 'service_role') throw new Error(`Credencial privilegiada: ${label}`); }
    catch (error) { if (error.message.startsWith('Credencial')) throw error; }
  }
}
async function collect(folder, prefix) {
  const files = {};
  for (const item of (await readdir(folder, { withFileTypes: true })).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (ignored(item.name)) continue;
    if (item.isSymbolicLink()) throw new Error(`Link simbólico não permitido: ${prefix}/${item.name}`);
    const key = `${prefix}/${item.name}`;
    if (item.isDirectory()) Object.assign(files, await collect(path.join(folder, item.name), key));
    else {
      const bytes = normalizeFile(await readFile(path.join(folder, item.name)),item.name);
      assertNoSecrets(bytes, key);
      if (/\.(pptx|xlsx|docx|zip)$/i.test(item.name)) {
        for (const [nested, data] of Object.entries(unzipSync(bytes))) assertNoSecrets(data, `${key}/${nested}`);
      }
      // Fixed timestamp and order make archives reproducible across machines.
      files[key] = [bytes, { mtime: new Date(2026, 9, 30, 12, 0, 0) }];
    }
  }
  return files;
}
export async function buildCatalog() {
  const skills = [];
  if (!check) {
    if (path.relative(root, output).replaceAll('\\', '/') !== 'public/skills') throw new Error('Destino de geração inválido');
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });
  }
  for (const item of (await readdir(source, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    if (!item.isDirectory()) continue;
    const text = await readFile(path.join(source, item.name, 'SKILL.md'), 'utf8');
    const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    if (!match) throw new Error(`Frontmatter ausente: ${item.name}`);
    const fm = load(match[1]);
    // Queue contracts hash SKILL.md: keep their existing bytes unchanged.
    const m = fm.metadata || JSON.parse(await readFile(path.join(source,item.name,'catalog.metadata.json'),'utf8'));
    if (fm.name !== item.name || !fm.description || !m?.version || !m.origin || !m.process?.length || !m.agents?.length || !m.owner || !m.license) throw new Error(`Metadados incompletos: ${item.name}`);
    const files = await collect(path.join(source, item.name), item.name);
    const archive = zipSync(files, { level: 6 });
    const filename = `${item.name}-${m.version}.zip`;
    const changelog = await readFile(path.join(source, item.name, 'CHANGELOG.md'), 'utf8');
    const entryTokens = Math.ceil(text.length / 4);
    const referenceTokens = Math.ceil(Object.entries(files).filter(([key]) => /\.md$/i.test(key) && !key.endsWith('/SKILL.md') && !key.endsWith('/CHANGELOG.md')).reduce((n,[,value]) => n + Buffer.from(value[0]).toString('utf8').length,0) / 4);
    const notePath = `09-Inteligencia-IA/Skills/Skill-${item.name}.md`;
    if (!check) {
      await writeFile(path.join(output, filename), archive);
    }
    skills.push({ id: item.name, name: item.name, description: fm.description, kind: 'owned', ...m,
      source_url: `https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/${item.name}`,
      archive: filename, bytes: archive.length, sha256: digest(archive), file_count: Object.keys(files).length,
      note: `${item.name}.md`, wiki_path: notePath, changelog, entry_tokens: entryTokens, reference_tokens: referenceTokens,
      suggested_context_tokens: entryTokens + referenceTokens, token_method: 'Estimativa: caracteres / 4; ler referências conforme a tarefa. Binários e scripts excluídos.' });
  }
  for (const skill of skills) {
    skill.note = `${noteName(skill)}.md`;
    skill.wiki_path = `09-Inteligencia-IA/Skills/${noteName(skill)}.md`;
    if (!check) await writeFile(path.join(output,skill.note),skillNote(skill));
  }
  const catalog = { schema: 'gaas-skills/1', published_at: '2026-10-30', skills };
  if (!check) {
    await writeFile(path.join(output, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
    await writeFile(path.join(output, 'Catalogo-de-Skills.md'),catalogNote(catalog));
  }
  console.log(`${skills.length} pacotes próprios; ${Math.round(skills.reduce((n,s)=>n+s.bytes,0)/1024/1024)} MB de downloads. ${check ? 'Validação concluída.' : 'Catálogo gerado.'}`);
  return catalog;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildCatalog();
