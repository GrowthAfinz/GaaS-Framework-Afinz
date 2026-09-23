import { describe, expect, it } from "vitest";
import {
  filterGrowthOutcomes,
  isActionableOutcome,
} from "./growthOutcome.logic";
import { GrowthOutcome } from "./growthOutcome.types";

const base = {
  outcome_id: null,
  bet_id: "bet-1",
  front: "crm_acquisition",
  team_scope: "CRM",
  owner: null,
  hypothesis: "Elevar cobertura",
  action_text: "Mapear templates",
  metric_name: "coverage",
  baseline_value: 0.4,
  expected_value: 0.8,
  expected_direction: "maior_melhor",
  expected_unit: "ratio",
  success_criterion: "Cobertura >= 80%",
  outcome_window_start: "2026-09-01",
  outcome_window_end: "2026-09-30",
  verification_view: "VIEW_TEMPLATE_COVERAGE",
  bet_status: "waiting_window",
  source_action_candidate_id: "candidate-1",
  belief_evidence_snapshot_id: "snapshot-1",
  last_execution_status: "completed",
  execution_status: "completed",
  observed_value: null,
  observed_unit: null,
  evaluated_at: null,
  legacy_outcome_status: null,
  system_verdict: null,
  review_status: null,
  reviewed_at: null,
  reviewed_by: null,
  contestation_reason: null,
  resolved_verdict: null,
  conclusion: null,
  verification_reason: null,
  outcome_evidence_snapshot_id: null,
  due_bucket: "overdue",
  attention_rank: 80,
} satisfies GrowthOutcome;

describe("Growth outcome filtering", () => {
  it("keeps due and review states in the actionable queue", () => {
    const reviewed = {
      ...base,
      bet_id: "bet-2",
      due_bucket: "reviewed" as const,
    };
    expect(
      filterGrowthOutcomes([base, reviewed], {
        bucket: "actionable",
        front: "all",
        query: "",
      }),
    ).toEqual([base]);
  });

  it("does not treat not verifiable as a failed verdict", () => {
    const outcome = {
      ...base,
      due_bucket: "not_verifiable" as const,
      system_verdict: "not_verifiable" as const,
      execution_status: "not_started" as const,
    };
    expect(isActionableOutcome(outcome)).toBe(false);
    expect(outcome.system_verdict).not.toBe("not_confirmed");
  });
});
