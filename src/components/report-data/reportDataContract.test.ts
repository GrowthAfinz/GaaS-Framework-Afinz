import { describe, expect, it } from 'vitest';
import { formatReportMetric, selectReportMetrics, upsertManagedDataBlock, type ReportMetric } from './reportDataContract';
import { insurancePacketFromReportData, insuranceReportData } from '../insurance/insuranceReportData';
import type { InsurancePacket } from '../insurance/insuranceCore';

const metric: ReportMetric = { product: 'mulher', code: 'contracts_digital', period: '2026-10', value: 0, state: 'zero_observed', unit: 'count', source: 'fixture' };
describe('shared report data', () => {
  it('keeps missing, zero and not applicable distinct in display and scoped data', () => {
    const metrics = [metric, { ...metric, product: 'residencial', value: null, state: 'missing' as const }];
    expect(formatReportMetric(metrics[0])).toBe('0');
    expect(formatReportMetric(metrics[1])).toBe('Não disponível');
    expect(formatReportMetric({ ...metrics[1], state: 'not_applicable' })).toBe('Não se aplica');
    expect(selectReportMetrics(metrics, { products: ['mulher'], periods: ['2026-10'] })).toEqual([metric]);
    expect(selectReportMetrics(metrics, { periods: ['2026-09'] })).toEqual([]);
  });
  it('replaces only a managed block and never appends repeated copies or changes historical prose', () => {
    const source = '# Seguros\n\n## Setembro\nConclusão revisada em setembro.\n';
    const first = upsertManagedDataBlock(source, 'insurance-summary', 'Outubro: primeira versão');
    const second = upsertManagedDataBlock(first, 'insurance-summary', 'Outubro: versão revisada');
    expect(second).toContain('Conclusão revisada em setembro.');
    expect(second).not.toContain('primeira versão');
    expect(second.match(/:start -->/g)).toHaveLength(1);
    expect(upsertManagedDataBlock(second, 'insurance-summary', 'Outubro: versão revisada')).toBe(second);
    expect(() => upsertManagedDataBlock(first.replace(':end -->', ':broken -->'), 'insurance-summary', 'new')).toThrow('DATA_BLOCK_MARKERS_CONFLICT');
  });
  it('Office and lightweight BI adapters preserve the same metric values, units and quality', () => {
    const packet: InsurancePacket = { version: 'insurance/1', sources: [{ name: 'fixture.xlsx', sha256: 'a'.repeat(64), sheets: { Raw: { A1: { value: 999 } } } }], metrics: [metric], issues: [], periodStart: '2026-10-01', periodEnd: '2026-10-31', coverage: { dispatches: 0 }, dispatches: [], records: [], editorial: {} };
    const dataset = insuranceReportData(packet), light = insurancePacketFromReportData(dataset);
    expect(dataset.metrics).toEqual(light.metrics);
    expect(light.metrics).toEqual(packet.metrics);
    expect(light.sources[0].sheets).toEqual({});
    expect(JSON.stringify(dataset)).not.toContain('A1');
    expect(light.projection_only).toBe(true);
    expect(packet.sources[0].sheets.Raw.A1.value).toBe(999);
  });
});
