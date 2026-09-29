import { load as loadYaml } from 'js-yaml';
import { VaultLinkInput, VaultNoteInput } from './vaultTypes';

const IGNORED_DIRECTORIES = new Set(['.obsidian', '.git', '99-Templates']);
const FRONTMATTER = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
const WIKILINK = /!?\[\[([^\]]+)\]\]/g;

export interface VaultSourceFile {
  relativePath: string;
  text: string;
  lastModified: number;
}

export const normalizeVaultPath = (value: string) => value.replace(/\\/g, '/').replace(/^\.\//, '');

const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,;]/).map((item) => item.trim()).filter(Boolean);
  return [];
};

const scalar = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
};

const noteTitle = (path: string, body: string, frontmatter: Record<string, unknown>) => {
  const configured = scalar(frontmatter.title);
  if (configured) return configured;
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  return path.split('/').pop()?.replace(/\.md$/i, '') || path;
};

const parseLinks = (markdown: string): VaultLinkInput[] => {
  const links: VaultLinkInput[] = [];
  for (const match of markdown.matchAll(WIKILINK)) {
    const raw = match[1].trim();
    const [destination, displayText] = raw.split('|', 2);
    const [target, fragment] = destination.split('#', 2);
    const cleanTarget = normalizeVaultPath(target.trim());
    links.push({
      ordinal: links.length,
      raw_target: raw,
      target_path: cleanTarget || null,
      fragment: fragment?.trim() || null,
      display_text: displayText?.trim() || null,
    });
  }
  return links;
};

const sha256 = async (content: string) => {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const parseVaultMarkdown = async (file: VaultSourceFile): Promise<VaultNoteInput> => {
  const relativePath = normalizeVaultPath(file.relativePath);
  const frontmatterMatch = file.text.match(FRONTMATTER);
  let frontmatter: Record<string, unknown> = {};
  let body = file.text;
  if (frontmatterMatch) {
    const parsed = loadYaml(frontmatterMatch[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) frontmatter = parsed as Record<string, unknown>;
    body = file.text.slice(frontmatterMatch[0].length);
  }
  const slash = relativePath.lastIndexOf('/');
  return {
    relative_path: relativePath,
    title: noteTitle(relativePath, body, frontmatter),
    aliases: stringList(frontmatter.aliases ?? frontmatter.alias),
    folder: slash >= 0 ? relativePath.slice(0, slash) : '',
    content_markdown: file.text,
    frontmatter,
    tags: stringList(frontmatter.tags).map((tag) => tag.replace(/^#/, '')),
    note_type: scalar(frontmatter.type ?? frontmatter.tipo),
    layer: scalar(frontmatter.layer ?? frontmatter.camada),
    status: scalar(frontmatter.status),
    source: scalar(frontmatter.source ?? frontmatter.fonte),
    content_hash: await sha256(file.text),
    source_modified_at: new Date(file.lastModified).toISOString(),
    links: parseLinks(file.text),
  };
};

export const parseVaultFiles = async (files: VaultSourceFile[]) => {
  const markdown = files.filter((file) => {
    const path = normalizeVaultPath(file.relativePath);
    return path.toLowerCase().endsWith('.md') && !path.split('/').some((part) => IGNORED_DIRECTORIES.has(part));
  });
  return Promise.all(markdown.map(parseVaultMarkdown));
};

export const filesFromInput = async (files: FileList): Promise<VaultSourceFile[]> => Promise.all(
  Array.from(files)
    .map((file) => ({
      file,
      relativePath: normalizeVaultPath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
        .replace(/^[^/]+\//, ''),
    }))
    .filter(({ relativePath }) => relativePath.toLowerCase().endsWith('.md') && !relativePath.split('/').some((part) => IGNORED_DIRECTORIES.has(part)))
    .map(async ({ file, relativePath }) => ({
      relativePath,
      text: await file.text(),
      lastModified: file.lastModified,
    })),
);

export const rewriteWikilinksForReader = (markdown: string) => markdown.replace(FRONTMATTER, '').replace(WIKILINK, (_full, raw: string) => {
  const [destination, displayText] = raw.split('|', 2);
  const label = displayText || destination.split('#').pop() || destination;
  return `[${label}](vault:${encodeURIComponent(destination)})`;
});
