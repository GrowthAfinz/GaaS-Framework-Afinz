import {
  GrowthBetDirection,
  GrowthBetFront,
  GrowthBetStatus,
  GrowthExecutionStatus,
} from "../bets/growthBet.types";

export type GrowthOutcomeVerdict =
  | "confirmed"
  | "partially_confirmed"
  | "not_confirmed"
  | "invalid_premise"
  | "execution_diverged"
  | "data_blocked"
  | "not_verifiable";

export type GrowthOutcomeReviewStatus =
  | "pending_evaluation"
  | "system_evaluated"
  | "confirmed_by_user"
  | "contested"
  | "resolved";

export type GrowthOutcomeBucket =
  | "due_today"
  | "overdue"
  | "waiting_data"
  | "ready_review"
  | "reviewed"
  | "contested"
  | "not_verifiable"
  | "scheduled";

export interface GrowthOutcome {
  outcome_id: string | null;
  bet_id: string;
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
  outcome_window_start: string;
  outcome_window_end: string;
  verification_view: string;
  bet_status: GrowthBetStatus;
  source_action_candidate_id: string | null;
  belief_evidence_snapshot_id: string;
  last_execution_status: GrowthExecutionStatus | null;
  execution_status: GrowthExecutionStatus;
  observed_value: number | null;
  observed_unit: string | null;
  evaluated_at: string | null;
  legacy_outcome_status: string | null;
  system_verdict: GrowthOutcomeVerdict | null;
  review_status: GrowthOutcomeReviewStatus | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  contestation_reason: string | null;
  resolved_verdict: GrowthOutcomeVerdict | null;
  conclusion: string | null;
  verification_reason: string | null;
  outcome_evidence_snapshot_id: string | null;
  due_bucket: GrowthOutcomeBucket;
  attention_rank: number;
}
