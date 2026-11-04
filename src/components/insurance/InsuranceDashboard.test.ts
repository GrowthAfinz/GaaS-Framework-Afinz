import { describe, it, expect } from 'vitest';
import { insuranceScorecard } from './insuranceReportModel';
import type { InsuranceMetric } from './insuranceCore';

const metric = (product: string, code: string, value: number | null, period = 'window_total'): InsuranceMetric => ({ product, code, value, period, state: value === null ? 'missing' : value === 0 ? 'zero_observed' : 'observed', unit: code === 'digital_cost' ? 'BRL' : 'count', source: 'fixture' });
describe('insurance BI business outcome', () => {
  it('uses contracts instead of submitted forms; cost is SUM/SUM across products', () => {
    const rows = [metric('mulher', 'registrations_digital', 100), metric('residencial', 'registrations_digital', 200), metric('mulher', 'contracts_digital', 2), metric('residencial', 'contracts_digital', 8), metric('mulher', 'digital_cost', 100), metric('residencial', 'digital_cost', 200)];
    expect(insuranceScorecard(rows, 'all', 'window_total')).toEqual({ registrations: 300, contracts: 10, spend: 300, costPerContract: 30 });
    expect(insuranceScorecard(rows, 'mulher', 'window_total').costPerContract).toBe(50);
    expect(insuranceScorecard(rows, 'all', '2026-11').contracts).toBeNull();
  });
  it('preserves observed zero, blocks incomplete totals and never divides by zero', () => {
    const rows = [metric('mulher', 'contracts_digital', 0), metric('mulher', 'digital_cost', 100), metric('residencial', 'contracts_digital', null)];
    expect(insuranceScorecard(rows, 'mulher', 'window_total')).toMatchObject({ contracts: 0, costPerContract: null });
    expect(insuranceScorecard(rows, 'all', 'window_total').contracts).toBeNull();
  });
});
