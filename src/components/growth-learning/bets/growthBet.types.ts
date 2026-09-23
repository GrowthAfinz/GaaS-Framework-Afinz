export const GROWTH_BET_FRONTS = ['crm_acquisition', 'paid_media', 'b2c_origin'] as const;
export type GrowthBetFront = typeof GROWTH_BET_FRONTS[number];

export const GROWTH_BET_STATUSES = [
  'approved',
  'in_progress',
  'waiting_window',
  'ready_for_review',
  'closed',
  'cancelled',
  'not_verifiable',
] as const;
export type GrowthBetStatus = typeof GROWTH_BET_STATUSES[number];

export type GrowthBetDirection = 'maior_melhor' | 'menor_melhor' | 'atingir_meta';
export type GrowthExecutionStatus = 'not_started' | 'partial' | 'completed' | 'cancelled' | 'unknown';

export interface GrowthBet {
  id: string;
  source_action_candidate_id: string | null;
  evidence_snapshot_id: string;
  front: GrowthBetFront;
  team_scope: string;
  owner: string | null;
  hypothesis: string;
  action_text: string;
  metric_name: string;
  baseline_value: number;
  expected_value: number;
  expected_direction: GrowthBetDirection;
  expected_unit: string | null;
  success_criterion: string;
  execution_due_at: string | null;
  outcome_window_start: string;
  outcome_window_end: string;
  verification_view: string;
  stop_condition: string | null;
  known_alternatives: unknown[];
  status: GrowthBetStatus;
  belief_snapshot: Record<string, unknown>;
  contract_version: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_signal: string | null;
  source_impact: string | null;
  source_probable_cause: string | null;
  source_confidence_status: string | null;
  source_reading_limit: string | null;
  source_view: string | null;
  entity_key: string | null;
  signal_code: string | null;
  source_run_id: string | null;
  artifact_path: string | null;
  source_hash: string;
  evidence_period_start: string;
  evidence_period_end: string;
  quality_state: Record<string, unknown>;
  regime: Record<string, unknown>;
  checklist_total: number;
  checklist_completed: number;
  last_update_at: string | null;
  last_execution_status: GrowthExecutionStatus | null;
  update_count: number;
  merged_signal_count: number;
}

export interface GrowthBetChecklistItem {
  id: string;
  bet_id: string;
  label: string;
  status: 'pending' | 'completed';
  position: number;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GrowthBetUpdate {
  id: string;
  timeline_sequence: number;
  bet_id: string;
  update_type: 'created' | 'status_changed' | 'execution' | 'comment' | 'contract_revised';
  body: string | null;
  execution_status: GrowthExecutionStatus | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface GrowthSignalDecision {
  id: string;
  action_candidate_id: string;
  decision_type: 'accepted' | 'rejected' | 'merged';
  bet_id: string | null;
  reason: string | null;
  decided_by: string;
  decided_at: string;
}

export interface GrowthBetDraft {
  teamScope: string;
  owner: string;
  hypothesis: string;
  actionText: string;
  metricName: string;
  baselineValue: string;
  expectedValue: string;
  expectedDirection: GrowthBetDirection;
  expectedUnit: string;
  successCriterion: string;
  executionDueAt: string;
  outcomeWindowStart: string;
  outcomeWindowEnd: string;
  verificationView: string;
  stopCondition: string;
  knownAlternatives: string;
}

export type GrowthLearningEligibility = 'reusable' | 'needs_review' | 'expired' | 'contested' | 'superseded' | 'blocked';
export type GrowthLearningDecisionKind = 'reused' | 'discarded';

export interface GrowthLearningMatchReason {
  dimension: string;
  value: string;
  weight: number;
}

export interface GrowthLearningSuggestion {
  learning_id: string;
  learning_revision: number;
  source_kind: 'outcome' | 'vault_curated';
  source_title: string;
  source_ref: string;
  statement: string;
  classification: string;
  lifecycle_status: string;
  confidence_status: string;
  eligibility: GrowthLearningEligibility;
  review_due: boolean;
  match_score: number;
  match_reasons: GrowthLearningMatchReason[];
  limitations: Record<string, unknown>;
  scope: Record<string, unknown>;
  applicability: Record<string, unknown>;
  context_snapshot: Record<string, unknown>;
}

export interface GrowthLearningDecisionInput {
  learningId: string;
  decision: GrowthLearningDecisionKind;
  reason?: string;
}

export interface GrowthLearningApplication {
  id: string;
  bet_id: string;
  action_candidate_id: string | null;
  learning_id: string;
  learning_revision: number;
  decision: GrowthLearningDecisionKind;
  decision_reason: string | null;
  match_score: number;
  match_reasons: GrowthLearningMatchReason[];
  eligibility_snapshot: 'reusable' | 'needs_review';
  context_snapshot: Record<string, unknown>;
  decided_by: string;
  created_at: string;
  source_kind: 'outcome' | 'vault_curated';
  source_title: string;
  source_ref: string;
  statement: string;
  classification: string;
  confidence_status: string;
  limitations: Record<string, unknown>;
  bet_hypothesis: string;
}

export interface AcceptGrowthBetInput extends GrowthBetDraft {
  actionCandidateId: string;
  learningDecisions: GrowthLearningDecisionInput[];
}

export interface CreateContextualGrowthBetInput extends GrowthBetDraft {
  sourceContext: GrowthBetSourceContext;
  learningDecisions: GrowthLearningDecisionInput[];
}
import type { GrowthBetSourceContext } from '../growthLearningNavigation';
