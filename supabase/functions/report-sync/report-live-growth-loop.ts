export type GrowthLoopRow = Record<string, unknown>;

const ACTIVE_BET_STATUSES = new Set([
  "approved",
  "in_progress",
  "waiting_window",
  "ready_for_review",
]);

const text = (value: unknown): string => String(value ?? "").trim();

const isoDay = (value: unknown): string => {
  const raw = text(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : "";
};

const overlaps = (
  startValue: unknown,
  endValue: unknown,
  periodStart: string,
  periodEnd: string,
): boolean => {
  const start = isoDay(startValue);
  const end = isoDay(endValue);
  if (!start && !end) return true;
  return (!start || start <= periodEnd) && (!end || end >= periodStart);
};

const frontDomain = (front: unknown): string => ({
  crm_acquisition: "crm",
  paid_media: "midia",
  b2c_origination: "b2c",
})[text(front)] ?? (text(front) || "growth");

const confidence = (value: unknown): string => {
  const normalized = text(value).toLowerCase();
  if (["confirmed", "alta", "high"].includes(normalized)) return "confirmed";
  if (["suspect", "baixa", "low"].includes(normalized)) return "suspect";
  if (["blocked", "indisponivel", "indisponível"].includes(normalized)) return "blocked";
  return "directional";
};

const betRank = (row: GrowthLoopRow, periodEnd: string): number => {
  const status = text(row.status);
  const statusRank: Record<string, number> = {
    ready_for_review: 400,
    waiting_window: 300,
    in_progress: 200,
    approved: 100,
  };
  const executionDue = isoDay(row.execution_due_at);
  const executionStatus = text(row.last_execution_status);
  const overdue = executionDue && executionDue <= periodEnd &&
    !["completed", "done", "executed"].includes(executionStatus);
  const blocked = ["blocked", "failed"].includes(executionStatus);
  return (statusRank[status] ?? 0) + (overdue ? 20 : 0) + (blocked ? 15 : 0);
};

const outcomeRank = (row: GrowthLoopRow): number => {
  const dueRank: Record<string, number> = {
    contested: 120,
    ready_review: 110,
    waiting_data: 100,
    not_verifiable: 95,
    reviewed: 90,
  };
  return dueRank[text(row.due_bucket)] ?? Number(row.attention_rank ?? 0);
};

const learningRank = (row: GrowthLoopRow): number => {
  const source = text(row.source_kind) === "outcome" ? 100 : 0;
  const contested = text(row.lifecycle_status) === "contested" ? 30 : 0;
  const due = row.review_due === true ? 20 : 0;
  const reused = Math.min(10, Number(row.reused_count ?? 0));
  return source + contested + due + reused;
};

export function selectEditorialGrowthBets(
  rows: GrowthLoopRow[],
  periodStart: string,
  periodEnd: string,
  limit = 6,
): GrowthLoopRow[] {
  return rows
    .filter((row) => ACTIVE_BET_STATUSES.has(text(row.status)))
    .filter((row) =>
      overlaps(row.evidence_period_start, row.evidence_period_end, periodStart, periodEnd) ||
      overlaps(row.outcome_window_start, row.outcome_window_end, periodStart, periodEnd)
    )
    .sort((a, b) =>
      betRank(b, periodEnd) - betRank(a, periodEnd) ||
      isoDay(a.execution_due_at).localeCompare(isoDay(b.execution_due_at)) ||
      text(b.updated_at).localeCompare(text(a.updated_at)) ||
      text(a.id).localeCompare(text(b.id))
    )
    .slice(0, limit);
}

export function freezeEditorialGrowthSources(input: {
  bets: GrowthLoopRow[];
  outcomes: GrowthLoopRow[];
  learnings: GrowthLoopRow[];
}): { bets: GrowthLoopRow[]; outcomes: GrowthLoopRow[]; learnings: GrowthLoopRow[] } {
  return {
    bets: input.bets
      .filter((row) => ACTIVE_BET_STATUSES.has(text(row.status)))
      .map(({ created_by: _createdBy, ...row }) => row),
    outcomes: input.outcomes
      .filter((row) => Boolean(text(row.outcome_id)))
      .map(({ reviewed_by: _reviewedBy, ...row }) => row),
    learnings: input.learnings
      .map(({ created_by: _createdBy, ...row }) => row),
  };
}

export function selectEditorialGrowthOutcomes(
  rows: GrowthLoopRow[],
  periodStart: string,
  periodEnd: string,
  limit = 6,
): GrowthLoopRow[] {
  return rows
    .filter((row) => Boolean(text(row.outcome_id)))
    .filter((row) =>
      overlaps(row.outcome_window_start, row.outcome_window_end, periodStart, periodEnd) ||
      overlaps(row.evaluated_at, row.reviewed_at, periodStart, periodEnd)
    )
    .sort((a, b) =>
      outcomeRank(b) - outcomeRank(a) ||
      text(b.reviewed_at ?? b.evaluated_at).localeCompare(text(a.reviewed_at ?? a.evaluated_at)) ||
      text(a.outcome_id).localeCompare(text(b.outcome_id))
    )
    .slice(0, limit);
}

export function selectEditorialGrowthLearnings(
  rows: GrowthLoopRow[],
  periodStart: string,
  periodEnd: string,
  limit = 3,
): GrowthLoopRow[] {
  return rows
    .filter((row) => ["active", "contested"].includes(text(row.lifecycle_status)))
    .filter((row) => overlaps(row.valid_from, row.valid_until, periodStart, periodEnd))
    .sort((a, b) =>
      learningRank(b) - learningRank(a) ||
      text(b.updated_at).localeCompare(text(a.updated_at)) ||
      text(a.id).localeCompare(text(b.id))
    )
    .slice(0, limit);
}

export function growthBetQueueRow(row: GrowthLoopRow, periodEnd: string): GrowthLoopRow {
  const executionDue = isoDay(row.execution_due_at);
  const executionStatus = text(row.last_execution_status) || "not_started";
  const overdue = executionDue && executionDue <= periodEnd &&
    !["completed", "done", "executed"].includes(executionStatus);
  const sourceRef = row.source_run_id
    ? { run_id: row.source_run_id, artifact_path: row.artifact_path ?? null }
    : { source_view: row.source_view ?? row.verification_view ?? null, entity_key: row.entity_key ?? null };
  return {
    bucket: overdue ? "Agir hoje" : "Acompanhar",
    domain: frontDomain(row.front),
    partner: null,
    signal: row.hypothesis,
    impact: row.success_criterion,
    probable_cause: row.source_probable_cause ?? null,
    evidence_refs: [sourceRef],
    reading_limit: [
      text(row.source_reading_limit),
      "Aposta assumida; ainda não constitui prova causal nem outcome verificado.",
    ].filter(Boolean).join(" "),
    action_text: row.action_text,
    owner: row.owner ?? row.team_scope ?? null,
    due_date: executionDue || row.outcome_window_end || null,
    success_metric: row.metric_name,
    confidence_status: confidence(row.source_confidence_status),
    review_status: row.status,
    editorial_origin: "growth_bet",
    bet_id: row.id,
    contract_status: row.status,
    outcome_window_end: row.outcome_window_end,
  };
}

export function growthOutcomeRetrospectiveRow(row: GrowthLoopRow): GrowthLoopRow {
  const status = row.resolved_verdict ?? row.system_verdict ?? row.due_bucket;
  const observed = row.observed_value === null || row.observed_value === undefined
    ? "observado indisponível"
    : `observado ${row.observed_value}${row.observed_unit ? ` ${row.observed_unit}` : ""}`;
  return {
    record_type: "outcome",
    status,
    front: row.front,
    title: row.hypothesis,
    evidence: row.conclusion ?? `${observed}; esperado ${row.expected_value ?? "—"}.`,
    decision: row.contestation_reason ?? row.success_criterion,
    origin: "growth_loop",
    period_or_validity: `${isoDay(row.outcome_window_start)}–${isoDay(row.outcome_window_end)}`,
    confidence_status: row.due_bucket === "contested" ? "contested" : "verified",
    reference_id: row.outcome_id,
  };
}

export function growthLearningRetrospectiveRow(row: GrowthLoopRow): GrowthLoopRow {
  const outcomeLearning = text(row.source_kind) === "outcome";
  return {
    record_type: outcomeLearning ? "aprendizado_do_loop" : "memoria_curada",
    status: row.classification,
    front: row.front,
    title: row.source_title,
    evidence: row.statement,
    decision: outcomeLearning
      ? "Resultado revisado e materializado pelo loop."
      : "Contexto curado; não equivale a validação causal pelo loop.",
    origin: row.source_kind,
    period_or_validity: `revisar ${isoDay(row.review_at) || "—"}`,
    confidence_status: row.confidence_status,
    reference_id: row.id,
  };
}
