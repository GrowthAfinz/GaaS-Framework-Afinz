/** Pure, testable policies shared by the HTTP entrypoint and the durable worker. */
export const REPORT_MODES = new Set([
  "build", "full", "certify", "publish", "diff", "inspect_contract", "watchdog", "export_artifact",
  "cleanup_sheet_tabs", "stage_sheets", "stage_sheet_core", "stage_sheet_source",
  "stage_sheets_commit", "rollback", "resume_structure", "export_pdf", "worker", "publication_worker", "inspect_publication", "inspect_recovery", "inspect_generation",
  "access", "members", "set_member",
]);

export type ReportLiveRole = "viewer" | "analyst" | "publisher" | "admin";

const ROLE_RANK: Record<ReportLiveRole, number> = {
  viewer: 0,
  analyst: 1,
  publisher: 2,
  admin: 3,
};

const ANALYST_MODES = new Set(["build", "certify", "diff", "inspect_contract"]);
const PUBLISHER_MODES = new Set([
  "full", "publish", "rollback", "resume_structure", "cleanup_sheet_tabs",
  "stage_sheets", "stage_sheet_core", "stage_sheet_source", "stage_sheets_commit",
]);
const ADMIN_MODES = new Set([
  "members", "set_member", "watchdog", "worker", "publication_worker",
  "inspect_publication", "inspect_recovery", "inspect_generation", "export_artifact",
]);

export function requiredReportRole(mode: unknown): ReportLiveRole {
  const normalized = String(mode);
  if (normalized === "access" || normalized === "export_pdf") return "viewer";
  if (ANALYST_MODES.has(normalized)) return "analyst";
  if (PUBLISHER_MODES.has(normalized)) return "publisher";
  if (ADMIN_MODES.has(normalized)) return "admin";
  return "admin";
}

export function reportRoleAllows(role: ReportLiveRole | null, mode: unknown): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[requiredReportRole(mode)];
}

export function requiresReportOperator(mode: unknown): boolean {
  return requiredReportRole(mode) !== "viewer";
}

export type WorkerCredentialVerification = "valid" | "invalid" | "unavailable";

export function selectReportWorkerCredential(customHeader: string | null, bearer: string): string | null {
  const custom = customHeader?.trim();
  if (custom) return custom;
  return /^[0-9a-f]{64}$/i.test(bearer) ? bearer : null;
}

export async function verifyReportWorkerCredential(
  credential: string,
  verify: (value: string) => Promise<{ data: boolean | null; error: unknown | null }>,
  attempts = 3,
  pause: (delayMs: number) => Promise<void> = (delayMs) =>
    new Promise((resolve) => setTimeout(resolve, delayMs)),
): Promise<WorkerCredentialVerification> {
  const maximumAttempts = Math.max(1, attempts);
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const result = await verify(credential);
    if (!result.error) return result.data === true ? "valid" : "invalid";
    if (attempt < maximumAttempts - 1) await pause(100 * 2 ** attempt);
  }
  return "unavailable";
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
