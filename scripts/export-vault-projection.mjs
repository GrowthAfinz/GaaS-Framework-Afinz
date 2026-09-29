import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));
if (!args.vault) throw new Error('Use --vault <absolute-path>');
const batchSize = Number(args['batch-size'] || 25);
const batchIndex = Number(args['batch-index'] || 0);
const ignored = new Set(['.obsidian', '.git', '99-Templates']);
const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
const wikiPattern = /!?\[\[([^\]]+)\]\]/g;

const listMarkdown = async (root, relative = '') => {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await listMarkdown(root, child));
    else if (entry.name.toLowerCase().endsWith('.md')) files.push(child.replaceAll('\\', '/'));
  }
  return files;
};

const list = (value) => Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(/[,;]/).map((item) => item.trim()).filter(Boolean) : [];
const scalar = (value) => value === undefined || value === null || value === '' ? null : String(value);
const files = (await listMarkdown(args.vault)).sort();
const projected = [];
for (const relativePath of files) {
  const absolute = path.join(args.vault, ...relativePath.split('/'));
  const [text, details] = await Promise.all([readFile(absolute, 'utf8'), stat(absolute)]);
  const match = text.match(frontmatterPattern);
  const frontmatter = match ? (loadYaml(match[1]) || {}) : {};
  const body = match ? text.slice(match[0].length) : text;
  const title = scalar(frontmatter.title) || body.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(relativePath, '.md');
  const links = [];
  for (const wiki of text.matchAll(wikiPattern)) {
    const raw = wiki[1].trim();
    const [destination, display] = raw.split('|', 2);
    const [target, fragment] = destination.split('#', 2);
    links.push({ ordinal: links.length, raw_target: raw, target_path: target.trim().replaceAll('\\', '/') || null, fragment: fragment?.trim() || null, display_text: display?.trim() || null });
  }
  projected.push({
    relative_path: relativePath,
    title,
    aliases: list(frontmatter.aliases ?? frontmatter.alias),
    folder: path.posix.dirname(relativePath) === '.' ? '' : path.posix.dirname(relativePath),
    content_markdown: text,
    frontmatter,
    tags: list(frontmatter.tags).map((tag) => tag.replace(/^#/, '')),
    note_type: scalar(frontmatter.type ?? frontmatter.tipo),
    layer: scalar(frontmatter.layer ?? frontmatter.camada),
    status: scalar(frontmatter.status),
    source: scalar(frontmatter.source ?? frontmatter.fonte),
    content_hash: createHash('sha256').update(text).digest('hex'),
    source_modified_at: details.mtime.toISOString(),
    links,
  });
}
const start = batchIndex * batchSize;
process.stdout.write(JSON.stringify({ total: projected.length, batchIndex, batchSize, notes: projected.slice(start, start + batchSize) }));
