/** Pure, testable policies shared by the HTTP entrypoint and the durable worker. */
export const REPORT_MODES = new Set([
  "build", "full", "certify", "publish", "diff", "inspect_contract", "watchdog",
  "cleanup_sheet_tabs", "stage_sheets", "stage_sheet_core", "stage_sheet_source",
  "stage_sheets_commit", "rollback", "resume_structure", "export_pdf", "worker", "publication_worker", "inspect_publication", "inspect_recovery", "inspect_generation",
]);

const AUTHENTICATED_READ_MODES = new Set(["export_pdf"]);

export function requiresReportOperator(mode: unknown): boolean {
  return !AUTHENTICATED_READ_MODES.has(String(mode));
}

export function parseReportRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("JSON deve ser um objeto.");
  const body = value as Record<string, unknown>;
  const mode = body.mode == null ? "full" : String(body.mode);
  if (!REPORT_MODES.has(mode)) throw new Error("Modo desconhecido.");
  for (const key of ["period_start", "period_end"]) {
    if (body[key] == null) continue;
    const date = String(body[key]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
      throw new Error(`${key} inválido.`);
    }
  }
  if (body.period_start && body.period_end && String(body.period_start) > String(body.period_end)) throw new Error("Período invertido.");
  return { ...body, mode };
}
