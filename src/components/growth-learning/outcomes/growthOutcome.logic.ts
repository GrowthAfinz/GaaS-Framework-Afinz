import {
  GrowthOutcome,
  GrowthOutcomeBucket,
  GrowthOutcomeVerdict,
} from "./growthOutcome.types";

export const OUTCOME_BUCKET_LABELS: Record<GrowthOutcomeBucket, string> = {
  due_today: "Vence hoje",
  overdue: "Atrasado",
  waiting_data: "Aguardando dados",
  ready_review: "Pronto para revisão",
  reviewed: "Revisado",
  contested: "Contestado",
  not_verifiable: "Não verificável",
  scheduled: "Agendado",
};

export const OUTCOME_VERDICT_LABELS: Record<GrowthOutcomeVerdict, string> = {
  confirmed: "Confirmado",
  partially_confirmed: "Parcialmente confirmado",
  not_confirmed: "Não confirmado",
  invalid_premise: "Premissa inválida",
  execution_diverged: "Execução divergente",
  data_blocked: "Bloqueado por dados",
  not_verifiable: "Não verificável",
};

export function isActionableOutcome(outcome: GrowthOutcome): boolean {
  return [
    "due_today",
    "overdue",
    "waiting_data",
    "ready_review",
    "contested",
  ].includes(outcome.due_bucket);
}

export function filterGrowthOutcomes(
  outcomes: GrowthOutcome[],
  options: {
    bucket: GrowthOutcomeBucket | "actionable" | "all";
    front: string;
    query: string;
  },
): GrowthOutcome[] {
  const query = options.query.trim().toLocaleLowerCase("pt-BR");
  return outcomes.filter((outcome) => {
    if (options.bucket === "actionable" && !isActionableOutcome(outcome))
      return false;
    if (
      options.bucket !== "all" &&
      options.bucket !== "actionable" &&
      outcome.due_bucket !== options.bucket
    )
      return false;
    if (options.front !== "all" && outcome.front !== options.front)
      return false;
    if (!query) return true;
    return `${outcome.hypothesis} ${outcome.metric_name} ${outcome.team_scope} ${outcome.owner || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(query);
  });
}
