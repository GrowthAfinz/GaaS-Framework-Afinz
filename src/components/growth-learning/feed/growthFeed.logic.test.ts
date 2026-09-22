import { describe, expect, it } from 'vitest';
import { buildGrowthFeedFilterSearch, filterAndGroupGrowthFeed, readGrowthFeedFilters } from './growthFeed.logic';
import { GrowthFeedEvent } from './growthFeed.types';

const event = (overrides: Partial<GrowthFeedEvent>): GrowthFeedEvent => ({
  id: crypto.randomUUID(),
  event_type: 'recommendation_created',
  subject_type: 'action_candidate',
  subject_id: crypto.randomUUID(),
  front: 'crm_acquisition',
  occurred_at: '2026-09-20T12:00:00Z',
  priority_score: 50,
  relevance_dimensions: {},
  summary_snapshot: { title: 'Sinal' },
  route: '?view=learning&section=feed',
  dedupe_key: crypto.randomUUID(),
  created_at: '2026-09-20T12:00:00Z',
  group_key: 'crm:signal',
  confidence_status: 'confirmed',
  event_state: 'candidate',
  group_count: 1,
  group_rank: 1,
  ...overrides,
});

describe('Growth feed deterministic list contract', () => {
  it('reads only governed filters and preserves them in the URL', () => {
    const filters = readGrowthFeedFilters('?front=paid_media&confidence=suspect&state=blocked&sort=recent');
    expect(filters).toEqual({ front: 'paid_media', confidence: 'suspect', state: 'blocked', sort: 'recent' });
    const next = buildGrowthFeedFilterSearch(filters, '?view=learning&section=feed&item=123');
    expect(new URLSearchParams(next).get('item')).toBe('123');
    expect(new URLSearchParams(next).get('front')).toBe('paid_media');
  });

  it('groups repeated signals and keeps the latest event as representative', () => {
    const older = event({ id: 'older', occurred_at: '2026-09-18T12:00:00Z' });
    const latest = event({ id: 'latest', occurred_at: '2026-09-20T12:00:00Z' });
    const groups = filterAndGroupGrowthFeed([older, latest], readGrowthFeedFilters(''), new Date('2026-09-22'));
    expect(groups).toHaveLength(1);
    expect(groups[0].representative.id).toBe('latest');
    expect(groups[0].events.map((item) => item.id)).toEqual(['latest', 'older']);
  });

  it('orders by priority without hiding a lower-priority newer item', () => {
    const high = event({ id: 'high', priority_score: 95, occurred_at: '2026-09-18T12:00:00Z', group_key: 'high' });
    const recent = event({ id: 'recent', priority_score: 45, occurred_at: '2026-09-21T12:00:00Z', group_key: 'recent' });
    const groups = filterAndGroupGrowthFeed([recent, high], readGrowthFeedFilters(''), new Date('2026-09-22'));
    expect(groups.map((group) => group.representative.id)).toEqual(['high', 'recent']);
  });

  it('filters B2C to an honest empty state when no producer exists', () => {
    const filters = readGrowthFeedFilters('?front=b2c_origin');
    expect(filterAndGroupGrowthFeed([event({})], filters)).toEqual([]);
  });
});
