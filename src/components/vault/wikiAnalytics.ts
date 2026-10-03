import { cleanScope, matchesScope, validMonth } from '../growth-learning/results/results.logic';
import { ResultRow, ResultsDomain, ResultsScope } from '../growth-learning/results/results.types';

export interface WikiAnalytics {
  domain: ResultsDomain;
  scope: ResultsScope;
  anyOf: ResultsScope[];
}
export const RESULT_SCOPE_KEYS = ['bu','segment','partner','channel','campaign','type','stage','subgroup','journey','safra','operation_id','objective','grain'] as const;

// Notes can select an existing, authenticated contract. They cannot execute SQL or code.
export function readWikiAnalytics(frontmatter: Record<string, unknown>): WikiAnalytics | null {
  const raw = frontmatter.analytics;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const config = raw as Record<string, unknown>;
  if (!['crm','renta','media','b2c'].includes(String(config.domain))) return null;
  const domain = config.domain as ResultsDomain;
  if (!config.scope || typeof config.scope !== 'object' || Array.isArray(config.scope)) return null;
  const filters = (value: unknown): value is Record<string,string> => Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key,val]) => RESULT_SCOPE_KEYS.includes(key as typeof RESULT_SCOPE_KEYS[number]) && typeof val === 'string' && val.length <= 300));
  if (!filters(config.scope)) return null;
  const anyOf = config.any_of ?? [];
  if (!Array.isArray(anyOf) || anyOf.length > 200 || !anyOf.every(filters)) return null;
  const compatible = (value: Record<string,string>) => Object.entries(value).every(([key,val]) => !val || cleanScope(domain,value)[key as keyof ResultsScope] === val);
  if (!compatible(config.scope) || !anyOf.every(compatible)) return null;
  return { domain, scope: cleanScope(domain, config.scope), anyOf: anyOf.map(value => cleanScope(domain,value)) };
}
export function matchesWikiAnalytics(row: ResultRow, config: WikiAnalytics) {
  return matchesScope(row,config.scope) && (!config.anyOf.length || config.anyOf.some(scope => matchesScope(row,scope)));
}
export function wikiResultsSearch(noteId: string, domain: ResultsDomain, month: string, scope: ResultsScope, current = '') {
  const params = new URLSearchParams(current);
  for (const key of [...params.keys()]) if (key.startsWith('result_') || ['create','growth_context','wiki_topic'].includes(key)) params.delete(key);
  params.set('view','learning'); params.set('section','vault'); params.set('item',noteId);
  params.set('result_domain',domain);
  if (validMonth(month)) params.set('result_month',month);
  for (const key of RESULT_SCOPE_KEYS) if (scope[key]) params.set('result_'+key,scope[key]!);
  return '?'+params.toString();
}
