import { describe, expect, it } from 'vitest';
import { GrowthBetSourceContext } from '../growthLearningNavigation';
import {
  classifyGrowthBetRelation,
  growthSourceDestination,
  GrowthBetSourceLink,
  nextGrowthBetVerification,
} from './relatedGrowthBets.logic';

const context: GrowthBetSourceContext = {
  front: 'crm_acquisition',
  sourceSurface: 'reports_monthly',
  sourceRoute: 'reports:monthly',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  filters: { bu: ['B2C', 'Plurix'], canais: ['WhatsApp'] },
  entityKey: 'crm:acquisition',
  title: 'Relatório Mensal',
  verificationView: 'reports:monthly',
};

const link: GrowthBetSourceLink = {
  bet_id: '00000000-0000-4000-8000-000000000001',
  front: 'crm_acquisition',
  status: 'in_progress',
  hypothesis: 'Hipótese',
  action_text: 'Ação',
  metric_name: 'Aprovados',
  expected_value: 100,
  expected_unit: null,
  expected_direction: 'maior_melhor',
  outcome_window_start: '2026-09-20',
  outcome_window_end: '2026-09-30',
  verification_view: 'reports:monthly',
  team_scope: 'CRM',
  owner: null,
  source_surface: 'reports_monthly',
  source_route: 'reports:monthly',
  source_period_start: '2026-08-01',
  source_period_end: '2026-08-31',
  source_filters: { canais: ['WhatsApp'], bu: ['Plurix', 'B2C'] },
  entity_key: 'crm:acquisition',
  visual_ref: null,
  source_title: 'Relatório Mensal',
  created_at: '2026-09-23T12:00:00Z',
  updated_at: '2026-09-23T12:00:00Z',
};

describe('related Growth bets contract', () => {
  it('distinguishes the same reading from the same source without textual inference', () => {
    expect(classifyGrowthBetRelation(link, context)).toBe('exact_context');
    expect(classifyGrowthBetRelation({ ...link, source_period_start: '2026-07-01' }, context)).toBe('same_source');
    expect(classifyGrowthBetRelation({ ...link, source_route: 'reports:daily' }, context)).toBeNull();
    expect(classifyGrowthBetRelation({ ...link, entity_key: 'crm:bu:B2C' }, context)).toBeNull();
  });

  it('derives the next verification from status and window only', () => {
    expect(nextGrowthBetVerification('waiting_window', '2026-09-25', '2026-10-10', '2026-09-23')).toEqual({ kind: 'starts', date: '2026-09-25' });
    expect(nextGrowthBetVerification('in_progress', '2026-09-20', '2026-09-30', '2026-09-23')).toEqual({ kind: 'due', date: '2026-09-30' });
    expect(nextGrowthBetVerification('ready_for_review', '2026-09-01', '2026-09-22', '2026-09-23')).toEqual({ kind: 'now' });
    expect(nextGrowthBetVerification('approved', '2026-09-01', '2026-09-22', '2026-09-23')).toEqual({ kind: 'overdue', date: '2026-09-22' });
    expect(nextGrowthBetVerification('closed', '2026-09-01', '2026-09-22', '2026-09-23')).toEqual({ kind: 'closed' });
  });

  it('maps only governed analytic routes back to their destination', () => {
    expect(growthSourceDestination(context)).toEqual({ tab: 'relatorio', reportMode: 'monthly' });
    expect(growthSourceDestination({ ...context, sourceSurface: 'acquisition_funnel', sourceRoute: 'funnels:appsflyer' })).toEqual({ tab: 'funil-aquisicao', funnel: 'appsflyer' });
    expect(growthSourceDestination({ ...context, sourceRoute: 'reports:unknown' })).toBeNull();
  });
});
