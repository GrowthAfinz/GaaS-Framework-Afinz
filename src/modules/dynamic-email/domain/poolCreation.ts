import type { EmailStrategy } from "./management";
import type { WorkspaceBriefing } from "./workspace";
import {
  resolveVdvPreview,
  VDV_BRIEFING_COLUMNS,
  type VdvBriefingRow,
  type VdvMovimentoRow,
  type VdvSample,
} from "./vaiDeVisa";

/** Rascunho inativo até o operador preencher e validar o conteúdo comercial. */
export const newPoolOffer = (): VdvBriefingRow => ({
  ...Object.fromEntries(VDV_BRIEFING_COLUMNS.map((column) => [column, ""])),
  ID: "OFERTA_" + crypto.randomUUID().replace(/-/g, "").toUpperCase(),
  TIPO: "OFERTA",
  ATIVA: "False",
  RESGATE: "LINK",
  __dirty: "true",
  __source: "gaas",
});

export const POOL_GROUP_LABELS: Record<string, string> = {
  MODA: "Moda",
  SAUDE_BELEZA: "Saúde e Beleza",
  FAMILIA_PRESENTES: "Família e Presentes",
  GENERICO: "Genérico",
};
export const poolGroupLabel = (group: string) =>
  POOL_GROUP_LABELS[group] ?? group;
export const poolGroups = (movimento: VdvMovimentoRow[], version: string) =>
  [
    ...new Set(
      movimento.filter((m) => m.VERSAO === version).map((m) => m.GRUPO),
    ),
  ].sort(
    (a, b) =>
      Number(a === "GENERICO") - Number(b === "GENERICO") ||
      poolGroupLabel(a).localeCompare(poolGroupLabel(b), "pt-BR"),
  );
export const strategyFront = (strategy: EmailStrategy) =>
  strategy.journeyFamily === "Ciclo de Vida"
    ? "lifecycle"
    : strategy.businessFront === "monetization" ||
        strategy.journeyFamily === "Rentabilização"
      ? "monetization"
      : "acquisition";
export const strategyScope = (
  strategy: EmailStrategy,
  rows: WorkspaceBriefing[],
) => {
  const row = rows.find(
    (r) =>
      r.__meta.campaignGroupId === strategy.campaignGroupId &&
      r.__meta.status !== "archived",
  );
  return row?.__editor?.kind === "vdv"
    ? {
        kind: "campaign" as const,
        label: row.__editor.campaignName,
        key: row.__editor.contentVersion,
      }
    : {
        kind: "week" as const,
        label: strategy.weekKey || "Sem semana",
        key: strategy.weekKey || "",
      };
};
export type ComparisonPair = {
  label: string;
  planned?: string;
  executed?: string;
  executedLabel: string;
};
export function poolComparison(
  strategy: EmailStrategy,
  row: WorkspaceBriefing,
  data: { briefing: VdvBriefingRow[]; movimento: VdvMovimentoRow[] },
  sample: VdvSample,
  today: string,
): ComparisonPair[] {
  const ctx = row.__editor!;
  const preview = resolveVdvPreview({
    ...data,
    sample: { ...sample, ID_VERSAO_OFERTAS: ctx.contentVersion },
    today,
    versaoEmail: ctx.touch,
  });
  const v = preview.vars;
  const cards = preview.cards
    .map(
      (card, i) =>
        `${card.marca}: ${[v[`S${i + 1}Pref`], v[`S${i + 1}Valor`], v[`S${i + 1}Suf`], v[`S${i + 1}Compl`]].filter(Boolean).join(" ")}`,
    )
    .join(" · ");
  return [
    {
      label: "Direção da mensagem",
      planned: strategy.keyMessage,
      executed: v.Assunto,
      executedLabel: "Assunto resolvido do toque",
    },
    {
      label: "Objetivo e abertura",
      planned: strategy.emailObjective,
      executed: v.PreHeader,
      executedLabel: "Pré-cabeçalho resolvido do toque",
    },
    {
      label: "Benefício prioritário",
      planned: strategy.primaryBenefit,
      executed: [v.Intro?.replace(/<[^>]*>/g, ""), cards]
        .filter(Boolean)
        .join(" · "),
      executedLabel: "Abertura e ofertas da amostra",
    },
    {
      label: "Estratégia de CTAs",
      planned: strategy.ctaStrategy,
      executed: preview.cards
        .map((c, i) => `${c.marca}: ${v.CtaCard} → ${v[`S${i + 1}Url`]}`)
        .join(" · "),
      executedLabel: "CTA e links das ofertas resolvidas",
    },
    {
      label: "Hierarquia visual",
      planned: strategy.visualHierarchyStrategy,
      executed: [
        preview.heroUsed,
        v.Hero,
        preview.skipped
          ? preview.diagnostics.join(" · ")
          : `${preview.cards.length} ofertas válidas`,
      ]
        .filter(Boolean)
        .join(" · "),
      executedLabel: "Hero e composição da amostra",
    },
  ];
}
