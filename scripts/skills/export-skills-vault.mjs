import { readFile, mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { load } from 'js-yaml';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { noteName, skillNote, catalogNote } from './skill-documentation.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const index = process.argv.indexOf('--vault');
if (index < 0 || !process.argv[index+1]) throw new Error('Use --vault <pasta do vault>');
const vault = path.resolve(process.argv[index+1]);
const target = path.join(vault, '09-Inteligencia-IA/Skills');
const catalog = JSON.parse(await readFile(path.join(root,'public/skills/catalog.json'),'utf8'));
await mkdir(target,{recursive:true});
let removed = 0;
for (const entry of await readdir(target,{withFileTypes:true})) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const absolute = path.join(target,entry.name);
  const text = await readFile(absolute,'utf8');
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const fm = load(match[1]);
  if (fm?.fonte === 'catalogo-versionado-github' && typeof fm.skill_id === 'string' && /^(OpenAI|Anthropic):/.test(fm.skill_id) && entry.name === `${noteName({id:fm.skill_id})}.md`) {
    await unlink(absolute); removed++;
  }
}
for(const skill of catalog.skills) await writeFile(path.join(target,`${noteName(skill)}.md`),skillNote(skill));
await writeFile(path.join(target,'Catalogo-de-Skills.md'),catalogNote(catalog));
console.log(`${catalog.skills.length} fichas e índice exportados para ${target}; ${removed} referências antigas removidas. Notas autorais preservadas.`);
