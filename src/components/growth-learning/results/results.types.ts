export type ResultsDomain = 'crm' | 'renta' | 'media' | 'b2c';
export type ResultsScope = { bu: string; segment: string; partner: string; channel: string; campaign: string; type: string;
  stage?: string; subgroup?: string; journey?: string; safra?: string; operation_id?: string; objective?: string; grain?: string };
export type ResultRow = {
  id: string; date: string; domain: ResultsDomain; bu: string; segment: string; partner: string;
  channel: string; campaign: string; campaignLabel: string; type: string; title: string;
  primary: number | null; secondary: number | null; spend: number | null; conversions: number | null;
  duplicateKey: string; mapped: boolean;
  stage?: string; subgroup?: string; journey?: string; safra?: string; objective?: string; grain?: string;
};
export interface ResultsSnapshot { rows: ResultRow[]; fetchedAt: string; source: string }
export interface ResultSummary {
  rows: number; usable: number; excluded: number; days: number;
  primary: number | null; secondary: number | null; spend: number | null;
  primaryKnown: number; secondaryKnown: number; spendKnown: number;
  ratio: number | null; ratioRows: number; conversions: number | null; conversionsKnown: number;
  cac: number | null;
}
export interface ResultRetrospective {
  id: string; domain: ResultsDomain; scope: ResultsScope; period: string; revision: number;
  observation: string; interpretation: string; learning: string; next_action: string; evidence: string;
  created_at: string;
}
export const EMPTY_SCOPE: ResultsScope = { bu: '', segment: '', partner: '', channel: '', campaign: '', type: '' };

