import { describe, expect, it } from 'vitest';
import { countConfiguredStrategyFields, STRATEGY_FIELD_COUNT, strategyReadiness, type EmailStrategy } from './management';

const strategy = (overrides: Partial<EmailStrategy> = {}): EmailStrategy => ({
  id: 'strategy-1', campaignGroupId: 'group-1', partner: 'Plurix', segment: 'CRM', secondaryBenefits: [],
  technicalStatus: 'needs_review', editorialStatus: 'needs_enrichment', visualStatus: 'needs_review',
  certificationStatus: 'not_tested', fieldProvenance: {}, version: 1, updatedByType: 'system', updateSource: 'system', ...overrides,
});

describe('dynamic email management readiness', () => {
  it('keeps imported technical content explicitly pending semantic enrichment', () => {
    expect(strategyReadiness(strategy())).toEqual({ label: 'Enriquecer estratégia', tone: 'warning' });
  });

  it('does not call an email certified before the SFMC certification state', () => {
    expect(strategyReadiness(strategy({ technicalStatus: 'ready', editorialStatus: 'ready', visualStatus: 'ready' }))).toEqual({ label: 'Pronto para teste', tone: 'success' });
    expect(strategyReadiness(strategy({ technicalStatus: 'ready', editorialStatus: 'ready', visualStatus: 'ready', certificationStatus: 'certified' }))).toEqual({ label: 'Certificado', tone: 'success' });
  });

  it('counts only the explicit strategic fields and never infers missing meaning', () => {
    expect(countConfiguredStrategyFields(strategy({ roleInRuler: 'Apresentar proposta', emailObjective: 'Gerar consideração', keyMessage: '' }))).toBe(2);
    expect(countConfiguredStrategyFields(strategy({ secondaryBenefits: ['Cashback', ''] }))).toBe(1);
    expect(STRATEGY_FIELD_COUNT).toBe(11);
  });
});

