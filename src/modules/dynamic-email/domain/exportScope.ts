/**
 * Escopo do export de CSV: Parceiro → Régua (segmento) → Semana.
 *
 * A seleção é guardada apenas nas folhas (semanas). O estado de parceiro e de
 * régua é derivado — assim não existe estado pai e filho para dessincronizar.
 *
 * Regra de bloqueio: a semana que contém um e-mail com erro bloqueante fica
 * travada; as outras semanas da mesma régua continuam exportáveis.
 */

export const EXPORT_FILENAME_BASE = 'TB_BRIEFING_CAMPANHA_AQUISICAO';
const SEP = '|||';

export type ExportGroupInput = {
  /** campaignGroupId — um e-mail editorial. */
  id: string;
  partner: string;
  segment: string;
  weekKey: string;
  /** Linhas que entram no CSV (assinaturas incluídas). */
  rowCount: number;
  hasErrors: boolean;
};

type Totals = { emails: number; rows: number; blockedEmails: number };

export type ExportWeekNode = Totals & {
  key: string;
  label: string;
  partner: string;
  segment: string;
  weekKey: string;
  blocked: boolean;
};

export type ExportRulerNode = Totals & {
  key: string;
  label: string;
  partner: string;
  segment: string;
  weeks: ExportWeekNode[];
};

export type ExportPartnerNode = Totals & {
  key: string;
  label: string;
  partner: string;
  rulers: ExportRulerNode[];
};

export type ExportNode = ExportPartnerNode | ExportRulerNode | ExportWeekNode;
export type TriState = 'checked' | 'indeterminate' | 'unchecked';

export const weekKeyFor = (partner: string, segment: string, weekKey: string) =>
  [partner, segment, weekKey].join(SEP);

const naturalSort = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });

const emptyTotals = (): Totals => ({ emails: 0, rows: 0, blockedEmails: 0 });

const addTotals = (target: Totals, source: Totals) => {
  target.emails += source.emails;
  target.rows += source.rows;
  target.blockedEmails += source.blockedEmails;
};

/** Monta a árvore a partir dos grupos editoriais ativos. */
export function buildExportTree(groups: ExportGroupInput[]): ExportPartnerNode[] {
  const partners = new Map<string, Map<string, Map<string, ExportWeekNode>>>();

  for (const group of groups) {
    const partner = group.partner || 'Sem parceiro';
    const segment = group.segment || 'Sem segmento';
    const week = group.weekKey || 'Sem semana';

    const rulers = partners.get(partner) ?? new Map<string, Map<string, ExportWeekNode>>();
    partners.set(partner, rulers);
    const weeks = rulers.get(segment) ?? new Map<string, ExportWeekNode>();
    rulers.set(segment, weeks);

    const key = weekKeyFor(partner, segment, week);
    const node = weeks.get(key) ?? {
      key, label: week, partner, segment, weekKey: week, blocked: false, ...emptyTotals(),
    };
    node.emails += 1;
    node.rows += group.rowCount;
    if (group.hasErrors) { node.blockedEmails += 1; node.blocked = true; }
    weeks.set(key, node);
  }

  return [...partners.entries()].map(([partner, rulerMap]) => {
    const rulers = [...rulerMap.entries()].map(([segment, weekMap]) => {
      const weeks = [...weekMap.values()].sort((a, b) => naturalSort(a.label, b.label));
      const ruler: ExportRulerNode = {
        key: [partner, segment].join(SEP), label: segment, partner, segment, weeks, ...emptyTotals(),
      };
      weeks.forEach((week) => addTotals(ruler, week));
      return ruler;
    }).sort((a, b) => naturalSort(a.label, b.label));

    const node: ExportPartnerNode = { key: partner, label: partner, partner, rulers, ...emptyTotals() };
    rulers.forEach((ruler) => addTotals(node, ruler));
    return node;
  }).sort((a, b) => naturalSort(a.label, b.label));
}

const weeksOf = (node: ExportNode): ExportWeekNode[] => {
  if ('weekKey' in node) return [node];
  if ('weeks' in node) return node.weeks;
  return node.rulers.flatMap((ruler) => ruler.weeks);
};

/** Semanas que podem ser marcadas — as bloqueadas nunca entram na seleção. */
export const selectableWeeks = (nodes: ExportPartnerNode[]): ExportWeekNode[] =>
  nodes.flatMap((partner) => weeksOf(partner)).filter((week) => !week.blocked);

export const allSelectableKeys = (nodes: ExportPartnerNode[]): Set<string> =>
  new Set(selectableWeeks(nodes).map((week) => week.key));

export function nodeState(node: ExportNode, selection: ReadonlySet<string>): TriState {
  const candidates = weeksOf(node).filter((week) => !week.blocked);
  if (!candidates.length) return 'unchecked';
  const picked = candidates.filter((week) => selection.has(week.key)).length;
  if (picked === 0) return 'unchecked';
  return picked === candidates.length ? 'checked' : 'indeterminate';
}

/** Marca ou desmarca um nó inteiro, ignorando semanas bloqueadas. */
export function toggleNode(node: ExportNode, selection: ReadonlySet<string>, checked: boolean): Set<string> {
  const next = new Set(selection);
  for (const week of weeksOf(node)) {
    if (week.blocked) continue;
    if (checked) next.add(week.key); else next.delete(week.key);
  }
  return next;
}

/** Remove da seleção qualquer chave que deixou de existir ou passou a estar bloqueada. */
export const pruneSelection = (nodes: ExportPartnerNode[], selection: ReadonlySet<string>): Set<string> => {
  const valid = allSelectableKeys(nodes);
  return new Set([...selection].filter((key) => valid.has(key)));
};

export type ExportTotals = { emails: number; rows: number; weeks: number; partners: number };

export function selectionTotals(nodes: ExportPartnerNode[], selection: ReadonlySet<string>): ExportTotals {
  const chosen = selectableWeeks(nodes).filter((week) => selection.has(week.key));
  return {
    emails: chosen.reduce((sum, week) => sum + week.emails, 0),
    rows: chosen.reduce((sum, week) => sum + week.rows, 0),
    weeks: chosen.length,
    partners: new Set(chosen.map((week) => week.partner)).size,
  };
}

/**
 * A seleção é parcial quando alguma semana exportável de um parceiro escolhido
 * ficou de fora. Importar um arquivo parcial em modo Overwrite apaga o resto.
 */
export function isPartialSelection(nodes: ExportPartnerNode[], selection: ReadonlySet<string>): boolean {
  const selectable = selectableWeeks(nodes);
  const chosenPartners = new Set(selectable.filter((week) => selection.has(week.key)).map((week) => week.partner));
  if (!chosenPartners.size) return false;
  return selectable.filter((week) => chosenPartners.has(week.partner)).some((week) => !selection.has(week.key));
}

export const slugify = (value: string): string => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

/** Nome sugerido a partir do escopo: prefixo fixo, parceiro e semanas quando ajudam. */
export function suggestExportFilename(
  nodes: ExportPartnerNode[],
  selection: ReadonlySet<string>,
  today: string,
): string {
  const chosen = selectableWeeks(nodes).filter((week) => selection.has(week.key));
  const parts = [EXPORT_FILENAME_BASE];

  const partners = [...new Set(chosen.map((week) => week.partner))];
  if (partners.length === 1) {
    parts.push(slugify(partners[0]));
    const total = selectableWeeks(nodes).filter((week) => week.partner === partners[0]).length;
    if (chosen.length && chosen.length < total) {
      const labels = [...new Set(chosen.map((week) => week.weekKey.replace(/^Semana\s*/i, 'S').replace(/\s+/g, '')))];
      parts.push(labels.sort(naturalSort).join('-'));
    }
  }

  parts.push(today);
  return `${parts.join('_')}.csv`;
}

/** Nunca vazio, sem caractere inválido de sistema de arquivo, sempre .csv. */
export function sanitizeExportFilename(value: string): string {
  const cleaned = value
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\.csv$/i, '')
    .trim()
    .slice(0, 120);
  return `${cleaned || EXPORT_FILENAME_BASE}.csv`;
}
