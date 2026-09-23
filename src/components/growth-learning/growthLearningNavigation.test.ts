import { describe, expect, it } from 'vitest';
import {
  buildGrowthLearningSearch,
  buildGrowthLearningItemSearch,
  buildGrowthLearningSectionItemSearch,
  buildGrowthBetSourceContextSearch,
  buildCloseGrowthBetSourceContextSearch,
  buildReportsOutputSearch,
  hasGrowthLearningRouteContext,
  isGrowthLearningView,
  readGrowthLearningSection,
  readGrowthLearningItem,
  readGrowthBetSourceContext,
} from './growthLearningNavigation';

describe('growth learning navigation contract', () => {
  it('defaults an absent or invalid section to the system feed', () => {
    expect(readGrowthLearningSection('')).toBe('feed');
    expect(readGrowthLearningSection('?view=learning&section=unknown')).toBe('feed');
  });

  it('recognizes every governed section', () => {
    expect(readGrowthLearningSection('?view=learning&section=bets')).toBe('bets');
    expect(readGrowthLearningSection('?view=learning&section=outcomes')).toBe('outcomes');
    expect(readGrowthLearningSection('?view=learning&section=memory')).toBe('memory');
    expect(readGrowthLearningSection('?view=learning&section=report-live')).toBe('report-live');
  });

  it('preserves unrelated query context and clears a previously opened item', () => {
    const result = buildGrowthLearningSearch('report-live', '?bu=B2C&item=old');
    const params = new URLSearchParams(result);
    expect(params.get('bu')).toBe('B2C');
    expect(params.get('view')).toBe('learning');
    expect(params.get('section')).toBe('report-live');
    expect(params.has('item')).toBe(false);
  });

  it('returns to report consumption without deleting unrelated query context', () => {
    const result = buildReportsOutputSearch('?view=learning&section=memory&item=123&bu=Plurix');
    const params = new URLSearchParams(result);
    expect(params.get('bu')).toBe('Plurix');
    expect(params.has('view')).toBe(false);
    expect(params.has('section')).toBe(false);
    expect(params.has('item')).toBe(false);
  });

  it('only treats view=learning as the Growth workspace', () => {
    expect(isGrowthLearningView('?view=learning&section=feed')).toBe(true);
    expect(isGrowthLearningView('?view=reports')).toBe(false);
  });

  it('does not treat unrelated item or section parameters as Growth navigation state', () => {
    expect(hasGrowthLearningRouteContext('?item=campaign-42')).toBe(false);
    expect(hasGrowthLearningRouteContext('?section=settings')).toBe(false);
    expect(hasGrowthLearningRouteContext('?section=memory')).toBe(true);
  });

  it('opens and closes a feed item without losing filters', () => {
    const opened = buildGrowthLearningItemSearch('event-42', '?view=learning&section=feed&front=paid_media&sort=recent');
    expect(readGrowthLearningItem(opened)).toBe('event-42');
    const closed = buildGrowthLearningItemSearch(null, opened);
    const params = new URLSearchParams(closed);
    expect(params.has('item')).toBe(false);
    expect(params.get('front')).toBe('paid_media');
    expect(params.get('sort')).toBe('recent');
  });

  it('deep-links an operational item in its own section', () => {
    const opened = buildGrowthLearningSectionItemSearch('bets', 'bet-42', '?view=learning&section=feed&bu=B2C');
    const params = new URLSearchParams(opened);
    expect(params.get('section')).toBe('bets');
    expect(params.get('item')).toBe('bet-42');
    expect(params.get('bu')).toBe('B2C');
  });

  it('transports a validated analytic context without losing unrelated query state', () => {
    const context = {
      front: 'crm_acquisition' as const,
      sourceSurface: 'reports_monthly' as const,
      sourceRoute: 'reports:monthly',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      filters: { bu: ['B2C'], canais: ['WhatsApp'] },
      entityKey: 'crm:bu:B2C',
      visualRef: 'reports:monthly:workspace',
      title: 'Relatório mensal de Aquisição',
      verificationView: 'reports:monthly',
    };
    const search = buildGrowthBetSourceContextSearch(context, '?compare=previous');
    const params = new URLSearchParams(search);
    expect(params.get('compare')).toBe('previous');
    expect(params.get('section')).toBe('bets');
    expect(params.get('create')).toBe('contextual-bet');
    expect(readGrowthBetSourceContext(search)).toEqual(context);

    const closed = new URLSearchParams(buildCloseGrowthBetSourceContextSearch(search));
    expect(closed.get('compare')).toBe('previous');
    expect(closed.has('create')).toBe(false);
    expect(closed.has('growth_context')).toBe(false);
  });

  it('rejects malformed, unsupported and inverted contextual deep-links', () => {
    expect(readGrowthBetSourceContext('?create=contextual-bet&growth_context=%7Bbroken')).toBeNull();
    const invalid = buildGrowthBetSourceContextSearch({
      front: 'crm_acquisition',
      sourceSurface: 'reports_overview',
      sourceRoute: 'reports:overview',
      periodStart: '2026-09-30',
      periodEnd: '2026-09-01',
      filters: {},
      title: 'Overview',
      verificationView: 'reports:overview',
    }, '');
    expect(readGrowthBetSourceContext(invalid)).toBeNull();
  });
});
