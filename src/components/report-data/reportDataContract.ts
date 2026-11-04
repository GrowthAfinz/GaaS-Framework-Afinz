/** Data contract shared by BI, Wiki and Office. No parser, React or database dependency. */
export type ReportMetricState = 'observed' | 'zero_observed' | 'missing' | 'not_applicable';
export interface ReportMetric {
  product: string;
  code: string;
  period: string;
  value: number | null;
  state: ReportMetricState;
  source: string;
  unit: string;
}
export interface ReportScope { products?: string[]; metrics?: string[]; periods?: string[] }
export interface ReportDataset {
  schema: 'gaas-report-data/1';
  query_contract: string;
  query_version: string;
  snapshot: { id: string | null; domain: string; hash: string | null; status: string; period_start: string; period_end: string; semantic_version: string; certified_at?: string | null };
  scope: ReportScope;
  metrics: ReportMetric[];
  issues: { code: string; severity: 'warning' | 'blocking'; message: string; source: string }[];
  coverage: Record<string, number>;
  sources: { name: string; sha256: string; storage_path?: string }[];
  rows: { dispatches: Record<string, unknown>[]; portfolio: Record<string, unknown>[] };
}
export interface NoteDataBinding { id: string; note_id: string; label: string; query_contract: string; query_version: string; scope: ReportScope; missing_policy: string }
export interface NoteDataBlock { binding: NoteDataBinding; data: ReportDataset | null }

export function selectReportMetrics(metrics: ReportMetric[], scope: ReportScope = {}): ReportMetric[] {
  return metrics.filter(m => (!scope.products || scope.products.includes(m.product)) && (!scope.metrics || scope.metrics.includes(m.code)) && (!scope.periods || scope.periods.includes(m.period)));
}

export function formatReportMetric(metric: ReportMetric): string {
  if (metric.state === 'not_applicable') return 'Não se aplica';
  if (metric.value === null) return 'Não disponível';
  if (metric.unit === 'ratio') return (metric.value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
  return metric.value.toLocaleString('pt-BR', metric.unit === 'BRL' ? { style: 'currency', currency: 'BRL' } : { maximumFractionDigits: 2 });
}

export const REPORT_METRIC_LABELS: Record<string, string> = {
  contracts_digital: 'Contratações confirmadas', registrations_digital: 'Cadastros na LP',
  cost_per_contract: 'Custo por contratação', digital_cost: 'Investimento digital',
  sessions: 'Sessões', media_spend: 'Investimento em mídia', crm_cost: 'Custo de CRM',
};
export const reportProductLabel = (product: string) => ({ mulher: 'Mulher', residencial: 'Residencial' })[product] || product;

/** Replaces one explicitly managed block; preserves all editorial text and history outside it. */
export function upsertManagedDataBlock(markdown: string, key: string, block: string): string {
  if (!/^[a-z0-9._-]+$/.test(key)) throw new Error('INVALID_DATA_BLOCK_KEY');
  const start = `<!-- gaas-data:${key}:start -->`, end = `<!-- gaas-data:${key}:end -->`;
  const from = markdown.indexOf(start), to = markdown.indexOf(end);
  if ((from < 0) !== (to < 0) || (from >= 0 && (to < from || markdown.indexOf(start, from + start.length) >= 0 || markdown.indexOf(end, to + end.length) >= 0))) throw new Error('DATA_BLOCK_MARKERS_CONFLICT');
  const managed = `${start}\n${block}\n${end}`;
  return from < 0 ? `${markdown.trimEnd()}\n\n${managed}\n` : markdown.slice(0, from) + managed + markdown.slice(to + end.length);
}
