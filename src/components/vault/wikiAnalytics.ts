import { cleanScope, matchesScope, validMonth } from '../growth-learning/results/results.logic';
import { ResultRow, ResultsDomain, ResultsScope } from '../growth-learning/results/results.types';

export interface WikiAnalytics {
  domain: ResultsDomain;
  scope: ResultsScope;
  anyOf: ResultsScope[];
}
export const RESULT_SCOPE_KEYS = ['bu','segment','partner','channel','campaign','type','stage','subgroup','journey','safra','operation_id','objective','grain'] as const;

type ScopeFilters = Record<string,string>;
const isScopeFilters = (value: unknown): value is ScopeFilters => Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key,val]) => RESULT_SCOPE_KEYS.includes(key as typeof RESULT_SCOPE_KEYS[number]) && typeof val === 'string' && val.length <= 300));
const compatibleWith = (domain: ResultsDomain) => (value: ScopeFilters) => Object.entries(value).every(([key,val]) => !val || cleanScope(domain,value)[key as keyof ResultsScope] === val);
const isPlainObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

function parseScopeBlock(raw: unknown, domains: readonly ResultsDomain[]): WikiAnalytics | null {
  if (!isPlainObject(raw)) return null;
  const config = raw;
  if (!domains.includes(config.domain as ResultsDomain)) return null;
  const domain = config.domain as ResultsDomain;
  if (!isScopeFilters(config.scope)) return null;
  const anyOf = config.any_of ?? [];
  if (!Array.isArray(anyOf) || anyOf.length > 200 || !anyOf.every(isScopeFilters)) return null;
  const compatible = compatibleWith(domain);
  if (!compatible(config.scope) || !anyOf.every(compatible)) return null;
  return { domain, scope: cleanScope(domain, config.scope), anyOf: anyOf.map(value => cleanScope(domain,value)) };
}

// Notes can select an existing, authenticated contract. They cannot execute SQL or code.
export function readWikiAnalytics(frontmatter: Record<string, unknown>): WikiAnalytics | null {
  return parseScopeBlock(frontmatter.analytics, ['crm','renta','media','b2c']);
}

// Reader refinements (BU, partner, stage...) narrow the note but never replace its fixed scope
// and never leave its `any_of` membership: a value no rule admits is dropped instead of showing an empty page.
export function refineWithinNote(config: Pick<WikiAnalytics,'scope'|'anyOf'>, refinement: Partial<ResultsScope>): Partial<ResultsScope> {
  const scope: Partial<ResultsScope> = {};
  for (const key of RESULT_SCOPE_KEYS) {
    const fixed = config.scope[key];
    if (fixed) { scope[key] = fixed; continue; }
    const value = refinement[key];
    if (!value) continue;
    if (config.anyOf.length && !config.anyOf.some(rule => !rule[key] || rule[key] === value)) continue;
    scope[key] = value;
  }
  return scope;
}

// `variantes` lists the confirmed public × partner operations of a page. It names, it does not filter.
export function readWikiVariants(frontmatter: Record<string, unknown>, domain: ResultsDomain): Partial<ResultsScope>[] {
  const raw = frontmatter.variantes;
  if (!Array.isArray(raw) || raw.length > 200 || !raw.every(isScopeFilters) || !raw.every(compatibleWith(domain))) return [];
  return raw.map(value => Object.fromEntries(Object.entries(value).filter(([,val]) => Boolean(val))) as Partial<ResultsScope>);
}

// Public × partner matrix. `matriz: true` (or the page type default) reuses the result block's scope;
// an object may only narrow it. Without `analytics`, the object must carry its own crm/renta scope.
export function readWikiMatrix(frontmatter: Record<string, unknown>, analytics: WikiAnalytics | null, enabledByDefault = false): WikiAnalytics | null {
  const raw = frontmatter.matriz;
  if (raw === false || (raw === undefined && !enabledByDefault)) return null;
  const matrixDomains = ['crm','renta'] as const;
  if (!analytics) return parseScopeBlock(raw, matrixDomains);
  if (!(matrixDomains as readonly string[]).includes(analytics.domain)) return null;
  if (raw === true || raw === undefined) return analytics;
  if (!isPlainObject(raw)) return null;
  const own = parseScopeBlock({ domain: analytics.domain, scope: {}, ...raw, any_of: [] }, [analytics.domain]);
  if (!own || own.domain !== analytics.domain) return null;
  if (RESULT_SCOPE_KEYS.some(key => analytics.scope[key] && own.scope[key] && analytics.scope[key] !== own.scope[key])) return null;
  return { domain: analytics.domain, scope: cleanScope(analytics.domain, { ...own.scope, ...Object.fromEntries(Object.entries(analytics.scope).filter(([,v]) => Boolean(v))) }), anyOf: analytics.anyOf };
}

// Live lists of bets, learnings, retrospectives and investigations scoped like the page.
export function readWikiLiveLists(frontmatter: Record<string, unknown>, analytics: WikiAnalytics | null, enabledByDefault = false): WikiAnalytics | null {
  const raw = frontmatter.listas_vivas;
  if (raw === false || (raw === undefined && !enabledByDefault)) return null;
  if (isPlainObject(raw)) return parseScopeBlock(raw, ['crm','renta','media','b2c']);
  return analytics;
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
