import type { FrameworkActivity } from "./communicationOrchestrator";
import { facetsFromRecords, sumCovered } from "./contentPerformanceModel";
import { normalizeJourney } from "../modules/sfmc-package/parsePackage";
import { canalToId, parseSeq, formatSeq } from "./taxonomy";
export function activityFacets(rows: FrameworkActivity[]) {
  return facetsFromRecords(
    rows,
    rows.map((r) => {
      const seq = parseSeq(r["Activity name / Taxonomia"]);
      return seq ? formatSeq(seq) : null;
    }),
  );
}

/** Activity identity is independent of content, moment and execution date. */
export const activityIdentity = (r: FrameworkActivity) =>
  JSON.stringify([
    r.BU,
    normalizeJourney(r.jornada || ""),
    (r["Activity name / Taxonomia"] || "").trim(),
    canalToId(r.Canal) || r.Canal,
  ]);
export function uniqueExecutions(rows: FrameworkActivity[]) {
  return [...new Map(rows.map((r) => [r.id, r])).values()];
}
export function groupActivityPerformance(rows: FrameworkActivity[]) {
  const groups = new Map<string, FrameworkActivity[]>();
  for (const r of uniqueExecutions(rows)) {
    const key = activityIdentity(r);
    groups.set(key, [...(groups.get(key) || []), r]);
  }
  return [...groups].map(([id, records]) => ({
    id,
    records,
    name:
      records[0]["Activity name / Taxonomia"] || "Activity Name não informado",
    journey: records[0].jornada || "Jornada não informada",
    templates: [
      ...new Set(
        records.map((r) => r.template_id).filter((id): id is string => !!id),
      ),
    ],
    pending: records.filter((r) => !r.template_id).length,
    facets: activityFacets(records),
  }));
}
export function completeValue(rows: FrameworkActivity[], key: string) {
  const v = sumCovered(rows, key);
  return rows.length && v.covered === rows.length ? v.value : null;
}
/** Numerator and denominator must cover exactly the same complete scope. */
export function observedRatio(
  rows: FrameworkActivity[],
  numerator: string,
  denominator: string,
) {
  const a = completeValue(rows, numerator),
    b = completeValue(rows, denominator);
  return a !== null && b !== null && b > 0 ? a / b : null;
}
export function recordedCac(rows: FrameworkActivity[]) {
  return observedRatio(rows, "Custo Total Campanha", "Cartões Gerados");
}
