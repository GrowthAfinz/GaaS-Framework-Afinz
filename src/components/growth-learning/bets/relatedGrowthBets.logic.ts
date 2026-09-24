import { GrowthBetSourceContext } from '../growthLearningNavigation';
import { GrowthBetStatus } from './growthBet.types';

export type GrowthBetRelation = 'exact_context' | 'same_source';

export interface GrowthBetSourceLink {
  bet_id: string;
  front: GrowthBetSourceContext['front'];
  status: GrowthBetStatus;
  hypothesis: string;
  action_text: string;
  metric_name: string;
  expected_value: number;
  expected_unit: string | null;
  expected_direction: string;
  outcome_window_start: string;
  outcome_window_end: string;
  verification_view: string;
  team_scope: string;
  owner: string | null;
  source_surface: GrowthBetSourceContext['sourceSurface'];
  source_route: string;
  source_period_start: string;
  source_period_end: string;
  source_filters: Record<string, unknown>;
  entity_key: string | null;
  visual_ref: string | null;
  source_title: string;
  created_at: string;
  updated_at: string;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

function equalJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function classifyGrowthBetRelation(
  link: GrowthBetSourceLink,
  context: GrowthBetSourceContext,
): GrowthBetRelation | null {
  if (link.front !== context.front || link.source_route !== context.sourceRoute) return null;
  if ((link.entity_key || undefined) !== context.entityKey) return null;
  const exact = link.source_period_start === context.periodStart
    && link.source_period_end === context.periodEnd
    && equalJson(link.source_filters, context.filters);
  return exact ? 'exact_context' : 'same_source';
}

export function nextGrowthBetVerification(
  status: GrowthBetStatus,
  windowStart: string,
  windowEnd: string,
  today = new Date().toISOString().slice(0, 10),
): { kind: 'now' | 'starts' | 'due' | 'overdue' | 'closed'; date?: string } {
  if (['closed', 'cancelled', 'not_verifiable'].includes(status)) return { kind: 'closed' };
  if (status === 'ready_for_review') return { kind: 'now' };
  if (today < windowStart) return { kind: 'starts', date: windowStart };
  if (today <= windowEnd) return { kind: 'due', date: windowEnd };
  return { kind: 'overdue', date: windowEnd };
}

export function growthSourceDestination(context: GrowthBetSourceContext):
  | { tab: 'relatorio'; reportMode: 'performance' | 'daily' | 'monthly' }
  | { tab: 'funil-aquisicao'; funnel: 'serasa-marketplace' | 'serasa-bi' | 'paid-media' | 'app-afinz' | 'appsflyer' }
  | null {
  const reportModes = {
    'reports:overview': 'performance',
    'reports:daily': 'daily',
    'reports:monthly': 'monthly',
  } as const;
  const reportMode = reportModes[context.sourceRoute as keyof typeof reportModes];
  if (reportMode) return { tab: 'relatorio', reportMode };

  const funnel = context.sourceRoute.startsWith('funnels:') ? context.sourceRoute.slice('funnels:'.length) : '';
  if (['serasa-marketplace', 'serasa-bi', 'paid-media', 'app-afinz', 'appsflyer'].includes(funnel)) {
    return { tab: 'funil-aquisicao', funnel: funnel as 'serasa-marketplace' | 'serasa-bi' | 'paid-media' | 'app-afinz' | 'appsflyer' };
  }
  return null;
}
