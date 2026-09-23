import { describe, expect, it } from 'vitest';
import { filterGrowthMemory, summarizeGrowthMemory } from './growthMemory.logic';
import { GrowthLearning } from './growthMemory.types';

const base: GrowthLearning = {
  id: '1', source_kind: 'vault_curated', source_outcome_id: null, source_key: 'vault:test',
  source_title: 'Mudança de regime', source_ref: 'Vault/nota.md', front: 'paid_media',
  classification: 'confirmed', lifecycle_status: 'active', statement: 'Não atravessar o corte.',
  scope: { platform: 'Meta' }, applicability: { cutover: '2026-06-23' }, limitations: {},
  confidence_status: 'confirmed', regime: 'cutover', valid_from: '2026-06-23', review_at: '2026-12-22',
  valid_until: null, supersedes_learning_id: null, current_revision: 1, created_by: 'test',
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', validated_by_loop: false,
  review_due: false, revision_count: 1, last_revision_at: '2026-09-01T00:00:00Z', link_count: 1,
  reused_count: 0, discarded_count: 0, reuse_rate: null,
};

describe('growth memory logic', () => {
  it('filters by provenance and searches structured scope', () => {
    const loop = { ...base, id: '2', source_kind: 'outcome' as const, source_outcome_id: 'outcome', validated_by_loop: true, source_title: 'CRM' };
    expect(filterGrowthMemory([base, loop], { search: 'meta', source: 'vault_curated', front: 'all', classification: 'all' })).toEqual([base]);
  });

  it('prioritizes review due and keeps source counters separate', () => {
    const due = { ...base, id: '3', review_due: true, source_kind: 'outcome' as const, source_outcome_id: 'outcome', validated_by_loop: true };
    expect(filterGrowthMemory([base, due], { search: '', source: 'all', front: 'all', classification: 'all' })[0].id).toBe('3');
    expect(summarizeGrowthMemory([base, due])).toEqual({ total: 2, validated: 1, curated: 1, reviewDue: 1 });
  });
});
