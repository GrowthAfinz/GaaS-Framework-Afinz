import { MAP_GROUPS } from './wikiGraph';

/** A category is a selection, never an inverted visibility toggle. */
export function mapCategoryLayers(key: string | null): Record<string, boolean> {
  return Object.fromEntries(MAP_GROUPS.map(group => [group.key, key === null || group.key === key]));
}

export function initialMapLayers(topic: string, saved: Record<string, boolean>) {
  const fromRoute = MAP_GROUPS.find(group => group.topic === topic);
  if (fromRoute) return mapCategoryLayers(fromRoute.key);
  const selected = MAP_GROUPS.filter(group => saved[group.key] === true);
  return mapCategoryLayers(selected.length === 1 ? selected[0].key : null);
}

/** An extract of the actual opening, without YAML or Markdown control syntax. */
export function noteOpening(markdown: string, limit = 560) {
  const text = markdown.replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '').replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '')
    .replace(/^\s*#\s+[^\n]*(?:\n|$)/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '').replace(/\*\*|__|`{1,3}|~~/g, '')
    .replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length <= limit) return text;
  const start = text.slice(0, limit);
  const boundary = start.lastIndexOf(' ');
  return start.slice(0, boundary > limit * 0.7 ? boundary : limit).trimEnd() + '…';
}
