import { ResultsDomain } from '../growth-learning/results/results.types';
import { WikiAnalytics } from './wikiAnalytics';
import { normalizeWikiPath } from './wikiNavigation';

// Records written by different surfaces store their scope in different shapes:
// results dossiers use ResultsScope strings, reports use plural Portuguese arrays, learnings use free keys.
const DIMENSION_ALIASES: Record<string, string> = {
  bu: 'bu', bus: 'bu', partner: 'partner', parceiro: 'partner', parceiros: 'partner', parceiro_canonico: 'partner',
  segment: 'segment', segmento: 'segment', segmentos: 'segment', publico: 'segment',
  channel: 'channel', canal: 'channel', canais: 'channel', platform: 'channel', plataforma: 'channel',
  journey: 'journey', jornada: 'journey', jornadas: 'journey', subgroup: 'subgroup', subgrupo: 'subgroup', subgrupos: 'subgroup',
  stage: 'stage', etapa: 'stage', safra: 'safra', campaign: 'campaign', campanha: 'campaign', objective: 'objective', type: 'type',
};
export type ScopeDimensions = Record<string, string[]>;
// "E-mail" and "email", "Aprovados_nao_convertidos" and "Aprovados não convertidos" are the same value.
export const normalizeScopeValue = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const meaningful = (value: string) => Boolean(value) && !['na', 'naoinformado'].includes(normalizeScopeValue(value));

export function normalizeRecordScope(raw: unknown): ScopeDimensions {
  const dims: ScopeDimensions = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return dims;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const dimension = DIMENSION_ALIASES[key.toLowerCase()];
    if (!dimension) continue;
    const values = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string' && meaningful(item));
    if (values.length) dims[dimension] = [...new Set([...(dims[dimension] || []), ...values])];
  }
  return dims;
}

// One candidate scope per `any_of` rule, each combined with the fixed scope.
export function noteScopeCandidates(config: Pick<WikiAnalytics, 'scope' | 'anyOf'>): Record<string, string>[] {
  const pick = (scope: object) => Object.fromEntries(Object.entries(normalizeRecordScope(scope)).map(([key, values]) => [key, values[0]]));
  const fixed = pick(config.scope);
  return config.anyOf.length ? config.anyOf.map(rule => ({ ...fixed, ...pick(rule) })) : [fixed];
}

// 'nota': explicitly tied to this page or its operation.
// 'escopo': the record covers every dimension the page fixes (it may be narrower, e.g. one channel).
// 'relacionado': shares part of the page scope (e.g. a partner learning on a public × partner page).
// 'frente': same front, but says nothing about this page's dimensions. Conflicting records are excluded.
export type ScopeRelation = 'nota' | 'escopo' | 'relacionado' | 'frente';
export const RELATION_RANK: Record<ScopeRelation, number> = { nota: 0, escopo: 1, relacionado: 2, frente: 3 };
export const RELATION_LABELS: Record<ScopeRelation, string> = { nota: 'Ligado a esta página ou variante', escopo: 'Mesmo escopo', relacionado: 'Escopo relacionado', frente: 'Contexto da frente' };

export function classifyRecordScope(record: ScopeDimensions, candidates: Record<string, string>[]): ScopeRelation | null {
  let best: ScopeRelation | null = null;
  for (const candidate of candidates) {
    const keys = Object.keys(candidate);
    if (keys.some(key => record[key] && !record[key].some(value => normalizeScopeValue(value) === normalizeScopeValue(candidate[key])))) continue;
    const matched = keys.filter(key => record[key]).length;
    const relation: ScopeRelation = !keys.length || matched === keys.length ? 'escopo' : matched ? 'relacionado' : 'frente';
    if (!best || RELATION_RANK[relation] < RELATION_RANK[best]) best = relation;
  }
  return best;
}

export const DOMAIN_FRONT: Record<ResultsDomain, 'crm_acquisition' | 'paid_media' | 'b2c_origin'> = { crm: 'crm_acquisition', renta: 'crm_acquisition', media: 'paid_media', b2c: 'b2c_origin' };

// growth_learning_links.target_id stores "Afinz-CRM-Midia-Vault/<path>.md#fragment".
export function linkTargetsNote(targetId: string, relativePath: string) {
  const path = normalizeWikiPath(targetId.split('#')[0].replace(/^Afinz-CRM-Midia-Vault\//i, ''));
  return Boolean(path) && path === normalizeWikiPath(relativePath);
}

export interface ScopedItem<T> { item: T; relation: ScopeRelation; date: string }
export function rankScoped<T>(items: ScopedItem<T>[]) {
  return [...items].sort((a, b) => RELATION_RANK[a.relation] - RELATION_RANK[b.relation] || b.date.localeCompare(a.date));
}
