import { supabase } from "../../../services/supabaseClient";
import { prepareEmailInput } from "../domain/emailInput";
import {
  emailInputSource,
  planEmailInput,
  type ConflictChoices,
} from "../domain/emailInputPlan";
import { validateRows } from "../domain/briefing";
import { withMeta, type WorkspaceBriefing } from "../domain/workspace";
import {
  loadBriefings,
  loadTemplateSlots,
  saveBriefings,
} from "./workspaceService";
import {
  loadEmailStrategies,
  loadProductGovernance,
  saveEmailStrategy,
} from "./managementService";
/** Revalida com dados atuais e a sessão humana; nunca usa chave de serviço. */
export async function saveEmailInputDrafts(
  text: string,
  file: string,
  sha256: string,
  choices: ConflictChoices,
  reviewed: WorkspaceBriefing[],
): Promise<string[]> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    throw new Error("Sessão autenticada necessária para aprovar a importação.");
  const [briefings, governance, templates] = await Promise.all([
    loadBriefings(),
    loadProductGovernance(),
    loadTemplateSlots(),
  ]);
  const result = prepareEmailInput(JSON.parse(text), {
    briefings,
    products: governance.contexts,
    guardrails: governance.guardrails,
  });
  if (!result.payload || result.problems.some((p) => p.severity === "error"))
    throw new Error(
      "O arquivo contém bloqueios. Valide novamente antes de aprovar.",
    );
  if (!templates.some((t) => t.id === result.payload!.ruler.templateSlotId))
    throw new Error("Template do banco indisponível.");
  const payload = result.payload;
  const scope = (rows: WorkspaceBriefing[]) =>
    rows.filter(
      (r) =>
        r.__meta.partner === payload.ruler.partner &&
        r.__meta.segment === payload.ruler.segment &&
        r.__meta.status !== "archived",
    );
  const versions = (rows: WorkspaceBriefing[]) =>
    scope(rows)
      .map((r) => `${r.__id}:${r.__meta.version}`)
      .sort()
      .join("|");
  if (versions(briefings) !== versions(reviewed))
    throw new Error(
      "A régua mudou durante a revisão. Atualize a página e revise as diferenças novamente.",
    );
  const plan = planEmailInput(result, briefings, choices);
  if (
    plan.some((p) =>
      p.diffs.some(
        (d) =>
          d.decision === "conflict" && !choices[`${p.importKey}.${d.column}`],
      ),
    )
  )
    throw new Error("Resolva todos os conflitos antes de aprovar.");
  const validation = validateRows(
    plan.map((p) => ({ ...p.next, __journeyConfirmed: true })),
  );
  const blockers = [...validation.values()]
    .flat()
    .filter((i) => i.severity === "error" && i.code !== "window");
  if (blockers.length)
    throw new Error(blockers.map((i) => i.message).join(" "));
  const groups = new Map<string, string>();
  const now = new Date().toISOString();
  const entries = plan
    .filter((p) => p.action !== "unchanged")
    .map((p) => {
      const existing = briefings.find((r) => r.__id === p.existingId);
      const sibling = scope(briefings).find(
        (r) => r.SEQUENCIA === p.incoming.sequence,
      );
      let group =
        existing?.__meta.campaignGroupId ??
        sibling?.__meta.campaignGroupId ??
        groups.get(p.incoming.sequence);
      if (!group) {
        group = crypto.randomUUID();
        groups.set(p.incoming.sequence, group);
      }
      const row = withMeta(p.next, {
        ...existing?.__meta,
        partner: payload.ruler.partner,
        segment: payload.ruler.segment,
        subgroup: p.incoming.network,
        weekKey: p.incoming.weekKey,
        campaignGroupId: group,
        status: "draft",
        version: (existing?.__meta.version ?? 0) + 1,
        templateSlotId: payload.ruler.templateSlotId,
        importSource: emailInputSource(
          payload,
          p,
          file,
          sha256,
          auth.user!.id,
          now,
        ),
      });
      return {
        row,
        warnings: result.problems
          .filter((i) => i.severity === "warning")
          .map((i) => `${i.where}: ${i.message}`),
        changeSummary: `Importação IA ${file} · ${payload.generatedBy.model} · ${
          p.action === "create"
            ? "Novo rascunho"
            : p.diffs
                .filter((d) => d.sheet !== d.gaas)
                .map((d) => d.column)
                .join(", ")
        }`,
      };
    });
  if (entries.length) {
    await saveBriefings(entries);
    const strategies = await loadEmailStrategies();
    for (const group of new Set(entries.map(e => e.row.__meta.campaignGroupId))) {
      const row = entries.find(e => e.row.__meta.campaignGroupId === group)!.row;
      const strategy = strategies.find(s => s.campaignGroupId === group);
      const rulerId = strategies.find(s => s.partner === payload.ruler.partner && s.segment === payload.ruler.segment)?.rulerStrategyId;
      await saveEmailStrategy({
        ...(strategy ?? {id: crypto.randomUUID(), campaignGroupId: group, partner: payload.ruler.partner, segment: payload.ruler.segment, rulerStrategyId: rulerId, secondaryBenefits: [], fieldProvenance: {}, version: 1, updatedByType: 'human', updateSource: 'gaas'}),
        sequence: row.SEQUENCIA, weekKey: row.__meta.weekKey, subject: row.ASSUNTO, preheader: row.PRE_CABECALHO,
        technicalStatus: 'draft', editorialStatus: 'draft', visualStatus: 'draft', certificationStatus: 'not_tested',
        llmModel: payload.generatedBy.model, changeReason: `Conteúdo de IA aprovado por ${auth.user.id}: ${file}`,
      }, {create: !strategy, fromAiImport: true});
    }
  }
  return plan.map((p) => p.next.__id);
}
