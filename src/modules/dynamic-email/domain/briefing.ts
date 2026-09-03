import Papa from 'papaparse';

export const BRIEFING_COLUMNS = [
  'DT_INICIO', 'DT_FIM', 'UTM_CAMPANHA', 'TP_CAMPANHA', 'SEQUENCIA', 'ASSUNTO', 'PRE_CABECALHO', 'HEADER',
  'CARTAO_NM_COMERCIAL', 'NM_PRODUTO_INTERNO', 'TITULO_COPY_1_AZUL', 'COR_COPY_1',
  'TAMANHO_DA_FONTE_TITULO_COPY_1', 'TITULO_CTA_1', 'LINK_CTA_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1',
  'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', 'TITULO_COPY_2', 'COR_TITULO_COPY_2',
  'TAMANHO_DA_FONTE_TITULO_COPY_2', 'COPY_2_PRETO', 'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2',
  'TITULO_CTA_2', 'LINK_CTA_2', 'BANNER_1_CORPO', 'LINK_BANNER_1_CORPO', 'BANNER_2_CORPO',
  'LINK_BANNER_2_CORPO', 'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO', 'NOTA_LEGAL', 'COR_NOTA_LEGAL',
  'TAMANHO_DA_FONTE_NOTA_LEGAL', 'RODAPE',
] as const;

export type BriefingColumn = typeof BRIEFING_COLUMNS[number];
export type BriefingRow = Record<BriefingColumn, string> & { __id: string; __journeyConfirmed?: boolean };

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  field?: BriefingColumn;
  message: string;
  fix?: 'personalization' | 'newlines';
}

const PLACEHOLDERS = new Set(['', 'PEGAR NA BASE', 'CRIAR']);
const TEXT_FIELDS = BRIEFING_COLUMNS.filter((c) => !['DT_INICIO', 'DT_FIM'].includes(c));
const PERSONALIZATION_ALIASES = new Set(['FIRST_NAME', 'PRI_NOME', 'LIMITE', 'PRODUTO', 'CARTAO_NM_COMERCIAL']);
export const rowKey = (row: BriefingRow) => [row.NM_PRODUTO_INTERNO, row.TP_CAMPANHA, row.SEQUENCIA].join(' / ');

export function emptyBriefingRow(id = crypto.randomUUID()): BriefingRow {
  const row = { __id: id } as BriefingRow;
  BRIEFING_COLUMNS.forEach((column) => { row[column] = ''; });
  return row;
}

export function parseBriefingCsv(csv: string): { rows: BriefingRow[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ''), {
    header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const missing = BRIEFING_COLUMNS.filter((c) => !headers.includes(c));
  const extra = headers.filter((h) => !BRIEFING_COLUMNS.includes(h as BriefingColumn));
  const errors = parsed.errors.map((e) => `Linha ${e.row != null ? e.row + 2 : '?'}: ${e.message}`);
  if (missing.length) errors.unshift(`Colunas ausentes: ${missing.join(', ')}`);
  if (extra.length) errors.push(`Colunas extras ignoradas: ${extra.join(', ')}`);
  if (missing.length) return { rows: [], errors };
  const rows = parsed.data.map((source, index) => {
    const row = emptyBriefingRow(`${Date.now()}-${index}`);
    BRIEFING_COLUMNS.forEach((column) => { row[column] = String(source[column] ?? ''); });
    return row;
  });
  return { rows, errors };
}

function safeDate(year: number, month: number, day: number, hour: number, minute: number, second: number): Date | null {
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function parseBriefingDate(value: string): Date | null {
  const raw = value.trim();
  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) return safeDate(+match[1], +match[2], +match[3], +(match[4] ?? 0), +(match[5] ?? 0), +(match[6] ?? 0));
  match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const a = +match[1]; const b = +match[2];
  // Exports downloaded from this SFMC BU use DD/MM/YYYY. Keep accepting legacy
  // MM/DD values only when the second component makes that order unambiguous.
  const month = b > 12 ? a : b;
  const day = b > 12 ? b : a;
  return safeDate(+match[3], month, day, +(match[4] ?? 0), +(match[5] ?? 0), +(match[6] ?? 0));
}

export function toDateInput(value: string): string {
  const date = parseBriefingDate(value); if (!date) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function toSfmcDate(value: string): string {
  const date = parseBriefingDate(value); if (!date) return value;
  const p = (n: number) => String(n).padStart(2, '0');
  // The SFMC import wizard used by this BU validates incoming dates as MM/DD/YYYY,
  // even though CSVs downloaded from the DE are localized as DD/MM/YYYY.
  return `${p(date.getMonth() + 1)}/${p(date.getDate())}/${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function validateRows(rows: BriefingRow[], today = new Date()): Map<string, ValidationIssue[]> {
  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(rowKey(row), (counts.get(rowKey(row)) ?? 0) + 1));
  const result = new Map<string, ValidationIssue[]>();
  rows.forEach((row) => {
    const issues: ValidationIssue[] = [];
    if ((counts.get(rowKey(row)) ?? 0) > 1) issues.push({ severity: 'error', code: 'duplicate-key', message: `Chave composta duplicada: ${rowKey(row)}` });
    (['NM_PRODUTO_INTERNO', 'UTM_CAMPANHA'] as BriefingColumn[]).forEach((field) => {
      if (PLACEHOLDERS.has(row[field].trim().toUpperCase())) issues.push({ severity: 'error', code: 'placeholder', field, message: `${field} precisa de um valor definitivo.` });
    });
    TEXT_FIELDS.forEach((field) => {
      const value = row[field];
      const invalidTokens = [...value.matchAll(/%%(?![=\[])([A-Z_]+)%%/gi)];
      if (invalidTokens.length) issues.push({ severity: 'error', code: 'personalization', field, ...(invalidTokens.every((token) => PERSONALIZATION_ALIASES.has(token[1].toUpperCase())) ? { fix: 'personalization' as const } : {}), message: `${field} contém personalização incompatível com TreatAsContent.` });
      if (/\r|\n/.test(value)) issues.push({ severity: 'warning', code: 'newline', field, fix: 'newlines', message: `${field} contém quebra de linha crua; converta para <br>.` });
    });
    (['HEADER', 'BANNER_1_CORPO', 'BANNER_2_CORPO', 'BANNER_3_CORPO'] as BriefingColumn[]).forEach((field) => {
      const value = row[field].trim();
      if (value) {
        try {
          if (new URL(value).protocol !== 'https:') throw new Error('protocol');
        } catch {
          issues.push({ severity: 'error', code: 'image-url', field, message: `${field} precisa ser uma URL pública HTTPS válida.` });
        }
      }
    });
    const start = parseBriefingDate(row.DT_INICIO); const end = parseBriefingDate(row.DT_FIM);
    if (!start) issues.push({ severity: 'error', code: 'date', field: 'DT_INICIO', message: 'DT_INICIO inválida.' });
    if (!end) issues.push({ severity: 'error', code: 'date', field: 'DT_FIM', message: 'DT_FIM inválida.' });
    if (start && end && start > end) issues.push({ severity: 'error', code: 'date-order', message: 'DT_INICIO é posterior a DT_FIM.' });
    if (start && end && (today < start || today > end)) issues.push({ severity: 'warning', code: 'window', message: 'Campanha fora da janela de vigência hoje.' });
    if (!row.__journeyConfirmed) issues.push({ severity: 'warning', code: 'journey', message: 'Confirme manualmente a jornada ativa para TP_CAMPANHA + SEQUENCIA.' });
    result.set(row.__id, issues);
  });
  return result;
}

const ALIASES: Record<string, string> = {
  FIRST_NAME: '%%=v(@FirstName)=%%', PRI_NOME: '%%=v(@FirstName)=%%', LIMITE: '%%=v(@LimiteNovo)=%%',
  PRODUTO: '%%=v(@Produto)=%%', CARTAO_NM_COMERCIAL: '%%=v(@CartaoNmComercial)=%%',
};

export function applyFix(row: BriefingRow, issue: ValidationIssue): BriefingRow {
  if (!issue.field) return row;
  if (issue.fix === 'newlines') return { ...row, [issue.field]: row[issue.field].replace(/\r?\n/g, '<br>') };
  if (issue.fix === 'personalization') return { ...row, [issue.field]: row[issue.field].replace(/%%([A-Z_]+)%%/gi, (full, name: string) => ALIASES[name.toUpperCase()] ?? full) };
  return row;
}

// Colunas do briefing que o template atual realmente consome no corpo do HTML.
// Serve para "blindar" no editor os campos que ficam fixos dentro do AMPscript
// (ex.: rodapé CAN-SPAM) e que o operador não consegue mudar por aqui.
export function templateActiveColumns(templateSource: string): Set<BriefingColumn> {
  const varToColumn = new Map<string, string>();
  for (const match of templateSource.matchAll(/SET\s+@(\w+)\s*=\s*(?:Trim\s*\(\s*)?Field\s*\(\s*@Row\s*,\s*["']([^"']+)["']\s*\)/gi)) {
    varToColumn.set(match[1].toLowerCase(), match[2]);
  }
  const setupEnd = templateSource.indexOf(']%%');
  const body = setupEnd >= 0 ? templateSource.slice(setupEnd + 3) : templateSource;
  const active = new Set<BriefingColumn>();
  for (const [variable, column] of varToColumn) {
    if (new RegExp(`@${variable}\\b`, 'i').test(body) && (BRIEFING_COLUMNS as readonly string[]).includes(column)) {
      active.add(column as BriefingColumn);
    }
  }
  return active;
}

export function exportBriefingCsv(rows: BriefingRow[]): string {
  const data = rows.map((row) => Object.fromEntries(BRIEFING_COLUMNS.map((column) => [column,
    column === 'DT_INICIO' || column === 'DT_FIM' ? toSfmcDate(row[column]) : row[column].replace(/\r?\n/g, '<br>'),
  ])));
  return Papa.unparse(data, { columns: [...BRIEFING_COLUMNS], delimiter: ',', newline: '\r\n', quotes: false, escapeFormulae: false });
}
