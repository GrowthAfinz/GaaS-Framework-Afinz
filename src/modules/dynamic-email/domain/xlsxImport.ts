import { z } from 'zod';
import { BRIEFING_COLUMNS, emptyBriefingRow, validateRows, type BriefingColumn, type BriefingRow } from './briefing';
import { PLURIX_SIGNATURES } from './workspace';

/**
 * Contrato de importação de briefings a partir do XLSX editorial (aba "Briefing Fábrica").
 *
 * A IA (Claude, Codex ou outra) lê a planilha por rótulos, completa o que vier de cadastros
 * governados e entrega um payload neste formato. Ele é independente do modelo: o GaaS só
 * confia no que este módulo valida. Toda importação entra como rascunho enriquecido.
 *
 * Fluxo: XLSX → payload (IA) → validateImportPayload → planImport (diff com o GaaS) → aplicar.
 */

export const IMPORT_CONTRACT = 'fabrica-xlsx-import/1';

const columnSchema = z.enum(BRIEFING_COLUMNS);

/** De onde veio cada valor. "missing" é explícito: nada é inventado. */
export const FIELD_ORIGINS = ['xlsx', 'governed', 'inferred', 'missing'] as const;
export type FieldOrigin = typeof FIELD_ORIGINS[number];

const fieldSchema = z.object({
  value: z.string(),
  origin: z.enum(FIELD_ORIGINS),
  /** xlsx: "Aba!Célula"; governed: tabela + id + versão; inferred: regra aplicada. */
  source: z.string().min(1),
  justification: z.string().optional(),
}).superRefine((field, ctx) => {
  if (field.origin === 'inferred' && !field.justification?.trim()) ctx.addIssue({ code: 'custom', message: 'Campo inferido precisa de justificativa.' });
  if (field.origin === 'missing' && field.value.trim()) ctx.addIssue({ code: 'custom', message: 'Campo marcado como ausente não pode ter valor.' });
});

// Zod 4: record com chave enum exige todas as chaves; partialRecord aceita só as presentes.
const fieldMapSchema = z.partialRecord(columnSchema, fieldSchema);

const networkKeys = PLURIX_SIGNATURES.map(({ key }) => key) as [string, ...string[]];

export const importPayloadSchema = z.object({
  contract: z.literal(IMPORT_CONTRACT),
  /** Toda importação é rascunho. Nunca "ready" nem "certified". */
  status: z.literal('draft'),
  source: z.object({
    file: z.string().min(1),
    sheet: z.string().min(1),
    sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
    readAt: z.string().min(1),
    reader: z.string().min(1),
  }),
  ruler: z.object({
    /** Nome visual da régua no GaaS. */
    name: z.string().min(1),
    partner: z.string().min(1),
    /** Agrupamento da régua no GaaS (segmento editorial). Isola a régua dentro do GaaS. */
    segment: z.string().min(1),
    /** Valor técnico que vai no CSV e no lookup do SFMC (TP_CAMPANHA). */
    tpCampanha: z.string().min(1),
    /** Classificação de negócio; não precisa coincidir com tpCampanha. */
    businessClassification: z.string().min(1),
    product: z.string().min(1),
    templateSlotId: z.string().min(1),
  }),
  touches: z.array(z.object({
    sequence: z.string().regex(/^E-mail \d+(\.\d+)?$/),
    weekKey: z.string().min(1),
    /** Conteúdo comum às redes do toque (o que o marketing escreve uma vez). */
    shared: fieldMapSchema,
    variants: z.array(z.object({
      network: z.enum(networkKeys),
      /** Só o que muda nessa rede (assinatura, links, UTM, assunto específico). */
      fields: fieldMapSchema,
    })).min(1),
  })).min(1),
  pendencies: z.array(z.object({
    severity: z.enum(['blocker', 'review']),
    scope: z.string().min(1),
    field: columnSchema.optional(),
    message: z.string().min(1),
  })),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
export type ImportedField = z.infer<typeof fieldSchema>;
export type FieldProvenance = Omit<ImportedField, 'value'>;

export type ExpandedImportRow = {
  /** Chave estável da reimportação: régua do GaaS + sequência + rede. */
  importKey: string;
  sequence: string;
  weekKey: string;
  network: string;
  row: BriefingRow;
  provenance: Partial<Record<BriefingColumn, FieldProvenance>>;
};

export const importKeyFor = (segment: string, sequence: string, network: string) =>
  [segment.trim().toUpperCase(), sequence.trim(), network.trim().toUpperCase()].join('|');

export function expandImportPayload(payload: ImportPayload): ExpandedImportRow[] {
  return payload.touches.flatMap((touch) => touch.variants.map((variant) => {
    const row = emptyBriefingRow();
    const provenance: ExpandedImportRow['provenance'] = {};
    const merged = { ...touch.shared, ...variant.fields } as Partial<Record<BriefingColumn, ImportedField>>;
    (Object.entries(merged) as [BriefingColumn, ImportedField][]).forEach(([column, field]) => {
      row[column] = field.value;
      provenance[column] = { origin: field.origin, source: field.source, ...(field.justification ? { justification: field.justification } : {}) };
    });
    // Identidade técnica sempre derivada da régua e do toque, nunca de texto livre.
    row.TP_CAMPANHA = payload.ruler.tpCampanha;
    row.SEQUENCIA = touch.sequence;
    row.NM_PRODUTO_INTERNO = variant.network;
    return { importKey: importKeyFor(payload.ruler.segment, touch.sequence, variant.network), sequence: touch.sequence, weekKey: touch.weekKey, network: variant.network, row, provenance };
  }));
}

export type ImportProblem = { severity: 'error' | 'warning'; where: string; message: string };

const REQUIRED: BriefingColumn[] = ['DT_INICIO', 'DT_FIM', 'UTM_CAMPANHA', 'ASSUNTO', 'LINK_CTA_1', 'NOTA_LEGAL'];

/** Valida forma e conteúdo. Erros bloqueiam a gravação; avisos viram pendência no GaaS. */
export function validateImportPayload(input: unknown): { payload?: ImportPayload; rows: ExpandedImportRow[]; problems: ImportProblem[] } {
  const parsed = importPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { rows: [], problems: parsed.error.issues.map((issue) => ({ severity: 'error', where: issue.path.join('.') || 'payload', message: issue.message })) };
  }
  const payload = parsed.data;
  const problems: ImportProblem[] = [];
  const rows = expandImportPayload(payload);
  const seen = new Set<string>();
  rows.forEach(({ importKey }) => {
    if (seen.has(importKey)) problems.push({ severity: 'error', where: importKey, message: 'Toque e rede repetidos no mesmo payload.' });
    seen.add(importKey);
  });
  rows.forEach(({ importKey, row, provenance }) => {
    REQUIRED.forEach((column) => {
      if (!row[column].trim()) problems.push({ severity: provenance[column]?.origin === 'missing' ? 'warning' : 'error', where: `${importKey}.${column}`, message: provenance[column]?.origin === 'missing' ? 'Valor ausente declarado; precisa ser completado antes do envio.' : 'Campo obrigatório vazio sem declaração de ausência.' });
    });
  });
  // Mesma validação do editor: marcadores da faixa, URLs, datas, chave única dentro da régua.
  const issues = validateRows(rows.map(({ row }) => Object.assign(row, { __journeyConfirmed: true })));
  rows.forEach(({ importKey, row }) => (issues.get(row.__id) ?? []).forEach((issue) => {
    if (issue.code === 'window') return;
    problems.push({ severity: issue.severity, where: `${importKey}${issue.field ? `.${issue.field}` : ''}`, message: issue.message });
  }));
  payload.pendencies.forEach((pendency) => problems.push({ severity: pendency.severity === 'blocker' ? 'error' : 'warning', where: `${pendency.scope}${pendency.field ? `.${pendency.field}` : ''}`, message: `Pendência declarada: ${pendency.message}` }));
  return { payload, rows, problems };
}

// ------------------------------------------------------------------ reimportação

/** O que o GaaS guarda da última importação para comparar a próxima (coluna import_source). */
export type ImportSourceRecord = {
  contract: typeof IMPORT_CONTRACT;
  importKey: string;
  file: string;
  sheet: string;
  sha256?: string;
  importedAt: string;
  /** Valores da planilha na última importação: base para detectar edição feita no GaaS. */
  baseline: Partial<Record<BriefingColumn, string>>;
  provenance: Partial<Record<BriefingColumn, FieldProvenance>>;
};

export type ExistingImportedBriefing = { id: string; version: number; row: BriefingRow; importSource?: ImportSourceRecord | null };

export type FieldDecision =
  | 'same'          // planilha e GaaS já iguais
  | 'apply'         // planilha mudou e o GaaS não tinha sido editado: atualiza
  | 'keep-gaas'     // só o GaaS mudou: preserva a edição operacional
  | 'conflict';     // os dois mudaram de formas diferentes: não aplica sem decisão humana

export type FieldDiff = { column: BriefingColumn; decision: FieldDecision; sheet: string; gaas: string; baseline?: string };

export type PlannedBriefing = {
  importKey: string;
  action: 'create' | 'update' | 'unchanged';
  existingId?: string;
  existingVersion?: number;
  next: BriefingRow;
  diffs: FieldDiff[];
  incoming: ExpandedImportRow;
};

/**
 * Compara a planilha com o GaaS sem sobrescrever em silêncio. Para cada campo:
 * - sem base anterior (briefing não veio de importação): diferença vira conflito;
 * - GaaS igual à base: a planilha manda;
 * - planilha igual à base: o GaaS manda (edição operacional preservada);
 * - os dois mudaram: conflito, mantém o valor do GaaS até alguém decidir.
 */
export function planImport(incoming: ExpandedImportRow[], existing: ExistingImportedBriefing[], options: { resolveConflictsWith?: 'sheet' | 'gaas' } = {}): PlannedBriefing[] {
  const byKey = new Map(existing.flatMap((item) => item.importSource?.importKey ? [[item.importSource.importKey, item] as const] : []));
  return incoming.map((item) => {
    const current = byKey.get(item.importKey);
    if (!current) return { importKey: item.importKey, action: 'create', next: item.row, diffs: [], incoming: item };
    const next = { ...current.row };
    const diffs: FieldDiff[] = [];
    BRIEFING_COLUMNS.forEach((column) => {
      const sheet = item.row[column] ?? '';
      const gaas = current.row[column] ?? '';
      const baseline = current.importSource?.baseline[column];
      if (sheet === gaas) return;
      let decision: FieldDecision;
      if (baseline === undefined) decision = 'conflict';
      else if (gaas === baseline) decision = 'apply';
      else if (sheet === baseline) decision = 'keep-gaas';
      else decision = 'conflict';
      if (decision === 'apply' || (decision === 'conflict' && options.resolveConflictsWith === 'sheet')) next[column] = sheet;
      diffs.push({ column, decision, sheet, gaas, ...(baseline !== undefined ? { baseline } : {}) });
    });
    const changed = BRIEFING_COLUMNS.some((column) => next[column] !== current.row[column]);
    return { importKey: item.importKey, action: changed ? 'update' : 'unchanged', existingId: current.id, existingVersion: current.version, next: { ...next, __id: current.id }, diffs, incoming: item };
  });
}

export function importSourceFor(payload: ImportPayload, item: ExpandedImportRow, importedAt: string): ImportSourceRecord {
  return {
    contract: IMPORT_CONTRACT,
    importKey: item.importKey,
    file: payload.source.file,
    sheet: payload.source.sheet,
    ...(payload.source.sha256 ? { sha256: payload.source.sha256 } : {}),
    importedAt,
    baseline: Object.fromEntries(BRIEFING_COLUMNS.map((column) => [column, item.row[column] ?? ''])),
    provenance: item.provenance,
  };
}

/** Resumo legível para a IA mostrar no chat antes de gravar. */
export function describePlan(plan: PlannedBriefing[]): string {
  const lines = plan.map((item) => {
    if (item.action === 'create') return `+ ${item.importKey}: novo rascunho`;
    if (item.action === 'unchanged' && !item.diffs.length) return `= ${item.importKey}: sem diferenças`;
    const detail = item.diffs.map((diff) => `${diff.column} [${diff.decision}]`).join(', ');
    return `${item.action === 'update' ? '~' : '='} ${item.importKey}: ${detail}`;
  });
  const conflicts = plan.flatMap((item) => item.diffs.filter((diff) => diff.decision === 'conflict')).length;
  return [...lines, conflicts ? `${conflicts} conflito(s) mantidos com o valor do GaaS até decisão.` : 'Nenhum conflito.'].join('\n');
}
