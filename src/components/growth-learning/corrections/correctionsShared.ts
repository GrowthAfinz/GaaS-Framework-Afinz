import { WIKI_TOPICS } from '../../vault/wikiNavigation';

/** Assuntos usam os mesmos nomes do "Explorar por assunto" da Wiki. */
export const SUBJECTS: string[] = Array.from(new Set(WIKI_TOPICS.map(topic => topic.title)));

export type CorrectionsView = 'queue' | 'review' | 'rules' | 'health';
export const VIEW_LABELS: Record<CorrectionsView, string> = {
  queue: 'Fila', review: 'Para revisar', rules: 'Regras aprendidas', health: 'Saúde do acervo',
};

export function readCorrectionsRoute(search: string): { view: CorrectionsView; item: string | null; target: string | null } {
  const params = new URLSearchParams(search);
  const raw = params.get('fix_view');
  const view: CorrectionsView = raw === 'review' || raw === 'rules' || raw === 'health' ? raw : 'queue';
  return { view, item: params.get('fix_item'), target: params.get('fix_target') };
}

export function writeCorrectionsRoute(patch: Partial<Record<'fix_view' | 'fix_item' | 'fix_target', string | null>>): void {
  const params = new URLSearchParams(window.location.search);
  Object.entries(patch).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
  window.history.replaceState({}, '', `${window.location.pathname}?${params}${window.location.hash}`);
}

/** Link para a aba, opcionalmente filtrada por um alvo (ex.: a nota aberta na Wiki). */
export function correctionsSearch(target?: string | null): string {
  const params = new URLSearchParams();
  params.set('view', 'learning');
  params.set('section', 'corrections');
  if (target) params.set('fix_target', target);
  return `?${params}`;
}
