import { BRIEFING_COLUMNS, type BriefingColumn } from "./briefing";
import {
  importKeyFor,
  planImport,
  type PlannedBriefing,
  type ImportSourceRecord,
} from "./xlsxImport";
import type { EmailInput, EmailInputResult } from "./emailInput";
import type { WorkspaceBriefing } from "./workspace";
export type ConflictChoices = Record<string, "gaas" | "file">;
/** Migrations antigas gravaram import_source livre (origem, mudança), sem base: não conta como importação. */
const hasBaseline = (source: unknown): boolean =>
  Boolean(source && typeof source === "object" && (source as { baseline?: object }).baseline && Object.keys((source as { baseline: object }).baseline).length);
export function planEmailInput(
  result: EmailInputResult,
  existing: WorkspaceBriefing[],
  choices: ConflictChoices = {},
): PlannedBriefing[] {
  if (!result.payload) return [];
  const ruler = result.payload.ruler;
  const scoped = existing.filter(
    (r) =>
      r.__meta.partner === ruler.partner &&
      r.__meta.segment === ruler.segment &&
      r.__meta.status !== "archived",
  );
  const plan = planImport(
    result.rows,
    scoped.map((row) => ({
      id: row.__id,
      version: row.__meta.version,
      row,
      // Rascunho que nunca veio de arquivo: o estado atual é a base. Sem edição posterior a
      // proteger, a proposta do arquivo vale (o conflito fica para quem editou depois de importar).
      importSource: hasBaseline(row.__meta.importSource) ? row.__meta.importSource! : {
        contract: "gaas-emails-input/1",
        importKey: importKeyFor(
          ruler.segment,
          row.SEQUENCIA,
          row.NM_PRODUTO_INTERNO,
        ),
        file: "GaaS",
        sheet: "",
        importedAt: "",
        baseline: Object.fromEntries(BRIEFING_COLUMNS.map((c) => [c, row[c]])) as Record<BriefingColumn, string>,
        provenance: {},
      },
    })),
  );
  return plan.map((item) => {
    const next = { ...item.next };
    for (const diff of item.diffs)
      if (
        diff.decision === "conflict" &&
        choices[`${item.importKey}.${diff.column}`] === "file"
      )
        next[diff.column] = diff.sheet;
    const current = scoped.find((r) => r.__id === item.existingId);
    return {
      ...item,
      next,
      action: !current
        ? "create"
        : BRIEFING_COLUMNS.some((c) => next[c] !== current[c])
          ? "update"
          : "unchanged",
    };
  });
}
export function emailInputSource(
  payload: EmailInput,
  plan: PlannedBriefing,
  file: string,
  sha256: string,
  approvedBy: string,
  importedAt: string,
): ImportSourceRecord {
  return {
    contract: "gaas-emails-input/1",
    importKey: plan.importKey,
    file,
    sheet: payload.source.kind,
    sha256,
    importedAt,
    generatedBy: payload.generatedBy,
    approvedBy,
    baseline: Object.fromEntries(
      BRIEFING_COLUMNS.map((c) => [c, plan.incoming.row[c]]),
    ) as Record<BriefingColumn, string>,
    provenance: plan.incoming.provenance,
  };
}
