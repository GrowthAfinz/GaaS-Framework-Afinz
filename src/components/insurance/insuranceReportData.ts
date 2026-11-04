import type { InsurancePacket } from './insuranceCore';
import type { ReportDataset } from '../report-data/reportDataContract';

/** Legacy Office adapter. Preserves metric values/states; never recalculates a source metric. */
export function insuranceReportData(packet: InsurancePacket): ReportDataset {
  return {
    schema: 'gaas-report-data/1', query_contract: 'insurance.monthly', query_version: '1',
    snapshot: { id: null, domain: 'insurance', hash: null, status: 'local_review', period_start: packet.periodStart, period_end: packet.periodEnd, semantic_version: packet.version },
    scope: {}, metrics: packet.metrics, issues: packet.issues, coverage: packet.coverage,
    sources: packet.sources.map(({ name, sha256, storage_path }) => ({ name, sha256, storage_path })),
    rows: { dispatches: packet.dispatches, portfolio: packet.portfolio || [] },
  };
}

export function insurancePacketFromReportData(data: ReportDataset): InsurancePacket {
  if (data.query_contract !== 'insurance.monthly' || data.query_version !== '1') throw new Error('UNSUPPORTED_REPORT_CONTRACT');
  return {
    version: 'insurance/1', projection_only: true, sources: data.sources.map(source => ({ ...source, sheets: {} })),
    periodStart: data.snapshot.period_start, periodEnd: data.snapshot.period_end,
    metrics: data.metrics, issues: data.issues, coverage: data.coverage,
    dispatches: data.rows.dispatches, portfolio: data.rows.portfolio as InsurancePacket['portfolio'], records: [], editorial: {},
  };
}
