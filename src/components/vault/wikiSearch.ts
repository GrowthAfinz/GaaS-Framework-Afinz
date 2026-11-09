import type { VaultNoteSummary } from './vaultTypes';
import { buildGrowthLearningSectionItemSearch } from '../growth-learning/growthLearningNavigation';

// Wiki search shared by the global header and the Wiki bar.
// Two groups: strategies first, then subjects and notes together. Inside each group the
// newest "atualizado" comes first; relevance only breaks ties (the server does the same).

export type WikiSearchKind = 'estrategia' | 'nota';

export interface WikiSearchGroup {
  kind: WikiSearchKind;
  label: string;
  items: VaultNoteSummary[];
}

export const WIKI_SEARCH_GROUP_LABELS: Record<WikiSearchKind, string> = {
  estrategia: 'Estratégias',
  nota: 'Assuntos e notas',
};

const KIND_ORDER: WikiSearchKind[] = ['estrategia', 'nota'];

export function wikiNoteKind(note: Pick<VaultNoteSummary, 'relative_path'> & { kind?: string | null }): WikiSearchKind {
  if (note.kind === 'estrategia' || note.kind === 'nota') return note.kind;
  return note.relative_path.replace(/\\/g, '/').startsWith('05-Estrategia/') ? 'estrategia' : 'nota';
}

/** Last update as YYYY-MM-DD: the note's curated date, falling back to the file date. */
export function wikiNoteUpdatedOn(note: Pick<VaultNoteSummary, 'source_modified_at'> & { updated_on?: string | null }): string | null {
  const curated = note.updated_on?.slice(0, 10);
  if (curated && /^\d{4}-\d{2}-\d{2}$/.test(curated)) return curated;
  const file = note.source_modified_at?.slice(0, 10);
  return file && /^\d{4}-\d{2}-\d{2}$/.test(file) ? file : null;
}

export function formatWikiUpdatedOn(date: string | null): string {
  if (!date) return 'Sem data de atualização';
  const [year, month, day] = date.split('-');
  return `Atualizada em ${day}/${month}/${year}`;
}

/** Newest first; notes without a date go last; title breaks ties. Does not mutate the input. */
export function sortWikiNotesByRecent<T extends VaultNoteSummary>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    const dateA = wikiNoteUpdatedOn(a) || '';
    const dateB = wikiNoteUpdatedOn(b) || '';
    if (dateA !== dateB) return dateA < dateB ? 1 : -1;
    return (b.rank || 0) - (a.rank || 0) || a.title.localeCompare(b.title, 'pt-BR');
  });
}

/** Splits results into the two groups, keeping strategies first and each group newest first. */
export function groupWikiSearchResults(notes: VaultNoteSummary[]): WikiSearchGroup[] {
  return KIND_ORDER.map(kind => ({
    kind,
    label: WIKI_SEARCH_GROUP_LABELS[kind],
    items: sortWikiNotesByRecent(notes.filter(note => wikiNoteKind(note) === kind)),
  })).filter(group => group.items.length > 0);
}

/** Accent and case-insensitive text used by the local filters (same idea as the server search). */
export function normalizeWikiSearchText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
}

/** Every typed word must start a word of the title or path, so "estrat vis" finds "Estratégia ... Visa". */
export function matchesWikiQuery(note: Pick<VaultNoteSummary, 'title' | 'relative_path'>, query: string): boolean {
  const terms = normalizeWikiSearchText(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!terms.length) return true;
  const words = normalizeWikiSearchText(`${note.title} ${note.relative_path}`).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return terms.every(term => words.some(word => word.startsWith(term)));
}

// Wiki URL for the header: opens a note (or the result list for a query) in the Loop's Wiki,
// dropping any Wiki state from the current page (view, topic, previous query).
export function buildWikiSearchUrl(currentSearch: string, noteId: string | null, query = ''): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of Array.from(params.keys())) if (key.startsWith('wiki_')) params.delete(key);
  const next = new URLSearchParams(buildGrowthLearningSectionItemSearch('vault', noteId, params.toString()).slice(1));
  if (!noteId && query.trim()) { next.set('wiki_q', query.trim()); next.set('wiki_browse', '1'); }
  const serialized = next.toString();
  return serialized ? `?${serialized}` : '';
}
