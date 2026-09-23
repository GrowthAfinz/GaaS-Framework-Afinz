import { describe, expect, it } from 'vitest';
import { GrowthFeedEvent } from '../feed/growthFeed.types';
import { buildGrowthBetDraft, validateGrowthBetDraft } from './growthBetForm.logic';

const event = {
  id: 'event-1',
  event_type: 'recommendation_created',
  subject_type: 'action_candidate',
  subject_id: 'candidate-1',
  front: 'crm_acquisition',
  occurred_at: '2026-09-22T12:00:00Z',
  priority_score: 80,
  relevance_dimensions: {},
  summary_snapshot: {
    title: 'Recuperar finalização',
    action_text: 'Revisar a sequência',
    success_metric: 'taxa_finalizacao',
    expected_value: 4.5,
    expected_unit: '%',
    expected_direction: 'maior_melhor',
    outcome_window_end: '2026-10-31',
    verification_view: 'VIEW_FINALIZACAO',
  },
  route: '',
  dedupe_key: '',
  created_at: '2026-09-22T12:00:00Z',
  group_key: 'candidate',
  confidence_status: 'confirmed',
  event_state: 'new',
  group_count: 1,
  group_rank: 1,
} satisfies GrowthFeedEvent;

describe('growth bet form contract', () => {
  it('prefills only facts present in the governed signal and keeps baseline/team explicit', () => {
    const draft = buildGrowthBetDraft(event, new Date('2026-09-23T12:00:00Z'));
    expect(draft.hypothesis).toBe('Recuperar finalização');
    expect(draft.actionText).toBe('Revisar a sequência');
    expect(draft.metricName).toBe('taxa_finalizacao');
    expect(draft.expectedValue).toBe('4.5');
    expect(draft.outcomeWindowStart).toBe('2026-09-23');
    expect(draft.baselineValue).toBe('');
    expect(draft.teamScope).toBe('');
  });

  it('blocks incomplete and inverted contracts', () => {
    const draft = buildGrowthBetDraft(event, new Date('2026-11-01T12:00:00Z'));
    const errors = validateGrowthBetDraft(draft);
    expect(errors.teamScope).toBeTruthy();
    expect(errors.baselineValue).toBeTruthy();
    expect(errors.outcomeWindowEnd).toContain('antes');
  });
});
