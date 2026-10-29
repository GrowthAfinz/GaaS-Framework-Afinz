import { comparisonWindow } from './results.logic';
import { summarizeCrmCompatible } from './crmAnalysis';
import { ResultRow, ResultsScope, ResultSummary } from './results.types';

export interface MatrixMeasure {
  summary: ResultSummary;
  previous: ResultSummary;
  // Card variation against the same calendar cut of the previous month; null when not comparable.
  variation: number | null;
  variationNote: string;
}
export interface AudiencePartnerMatrix {
  month: string;
  window: ReturnType<typeof comparisonWindow>;
  segments: string[];
  partners: string[];
  cells: Map<string, MatrixMeasure>;
  segmentTotals: Map<string, MatrixMeasure>;
  partnerTotals: Map<string, MatrixMeasure>;
  total: MatrixMeasure;
}
export const matrixKey = (segment: string, partner: string) => JSON.stringify([segment, partner]);

function complete(summary: ResultSummary) {
  return summary.usable > 0 && summary.primary !== null && summary.primaryKnown === summary.usable;
}
export function matrixMeasure(current: ResultRow[], previous: ResultRow[], duplicates: Set<string>): MatrixMeasure {
  const summary = summarizeCrmCompatible(current, duplicates), prior = summarizeCrmCompatible(previous, duplicates);
  if (!previous.length) return { summary, previous: prior, variation: null, variationNote: 'Sem registros no mês anterior' };
  if (!complete(summary) || !complete(prior)) return { summary, previous: prior, variation: null, variationNote: 'Comparação incompleta' };
  if (prior.primary === 0) return { summary, previous: prior, variation: null, variationNote: summary.primary === 0 ? 'Sem variação · base anterior 0' : 'Base anterior 0' };
  return { summary, previous: prior, variation: 100 * (summary.primary! / prior.primary! - 1), variationNote: '' };
}

// Rows must already be restricted to closed days and to the page scope. Duplicates are detected
// on the full source before narrowing, exactly like the result block.
export function buildAudiencePartnerMatrix(rows: ResultRow[], duplicates: Set<string>, month: string, fallbackLast: string, partnerOrder: string[] = []): AudiencePartnerMatrix {
  const last = rows.reduce((max, row) => row.date > max ? row.date : max, '');
  const window = comparisonWindow(month, last || fallbackLast);
  const current = rows.filter(row => row.date.startsWith(month) && row.date <= window.end);
  const previous = rows.filter(row => row.date.startsWith(window.previous) && row.date <= window.previousEnd);
  // Only combinations that coexisted in the records become cells; no cross product is invented.
  const cells = new Map<string, MatrixMeasure>();
  const keys = new Set([...current, ...previous].map(row => matrixKey(row.segment, row.partner)));
  for (const key of keys) {
    const [segment, partner] = JSON.parse(key) as [string, string];
    const inCell = (row: ResultRow) => row.segment === segment && row.partner === partner;
    cells.set(key, matrixMeasure(current.filter(inCell), previous.filter(inCell), duplicates));
  }
  const cards = (measure?: MatrixMeasure) => measure?.summary.primary ?? -1;
  const segmentTotals = new Map<string, MatrixMeasure>(), partnerTotals = new Map<string, MatrixMeasure>();
  for (const segment of new Set([...current, ...previous].map(row => row.segment))) {
    segmentTotals.set(segment, matrixMeasure(current.filter(row => row.segment === segment), previous.filter(row => row.segment === segment), duplicates));
  }
  for (const partner of new Set([...current, ...previous].map(row => row.partner))) {
    partnerTotals.set(partner, matrixMeasure(current.filter(row => row.partner === partner), previous.filter(row => row.partner === partner), duplicates));
  }
  const order = (value: string) => { const index = partnerOrder.indexOf(value); return index === -1 ? Infinity : index; };
  const segments = [...segmentTotals.keys()].sort((a, b) => cards(segmentTotals.get(b)) - cards(segmentTotals.get(a)) || a.localeCompare(b, 'pt-BR'));
  const partners = [...new Set([...partnerTotals.keys(), ...partnerOrder])]
    .sort((a, b) => order(a) - order(b) || cards(partnerTotals.get(b)) - cards(partnerTotals.get(a)) || a.localeCompare(b, 'pt-BR'));
  return { month, window, segments, partners, cells, segmentTotals, partnerTotals, total: matrixMeasure(current, previous, duplicates) };
}

// A cell inherits a declared operation only when every observed row of the cell belongs to that variant,
// so opening it never narrows the numbers the reader just saw.
export function cellScope(segment: string, partner: string, cellRows: ResultRow[], variants: Partial<ResultsScope>[]): Partial<ResultsScope> {
  const scope: Partial<ResultsScope> = { segment, partner };
  const candidates = variants.filter(variant => variant.partner === partner && (!variant.segment || variant.segment === segment));
  if (candidates.length !== 1) return scope;
  const variant = candidates[0];
  const bus = new Set(cellRows.map(row => row.bu));
  if (variant.bu && (bus.size !== 1 || !bus.has(variant.bu))) return scope;
  return { ...scope, ...(variant.bu ? { bu: variant.bu } : {}), ...(variant.operation_id ? { operation_id: variant.operation_id } : {}) };
}
