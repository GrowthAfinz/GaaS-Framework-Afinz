import type { DailyAnalysis, MetricsSummary } from './b2c';
import type { OriginacaoDashboardRow, OriginacaoDashboardSummary } from '../hooks/useOriginacaoDashboard';

export type ReconciliationStatus = 'ok' | 'critical';

export interface ReconciliationDay {
  date: string;
  crmCards: number;
  serasaCards: number;
  otherCards: number;
  totalB2CCards: number;
  varianceCards: number;
  status: ReconciliationStatus;
}

export interface ReconciliationSummary {
  status: ReconciliationStatus;
  consistentDays: number;
  inconsistentDays: number;
  maxNegativeVariance: number;
  days: ReconciliationDay[];
}

export interface IntelligenceVectorSummary {
  totalB2CCards: number;
  crmCards: number;
  serasaCards: number;
  otherCards: number;
  crmSharePct: number;
  serasaSharePct: number;
  otherSharePct: number;
}

export interface IntelligenceOpportunity {
  id: string;
  title: string;
  description: string;
}

export interface B2CIntelligenceResult {
  dashboardSummary: OriginacaoDashboardSummary;
  dashboardRows: OriginacaoDashboardRow[];
  comparisonSummary: MetricsSummary | null;
  previousComparisonSummary: MetricsSummary | null;
  dailyAnalysis: DailyAnalysis[];
  viewMode: 'daily' | 'weekly' | 'monthly';
  setViewMode: (mode: 'daily' | 'weekly' | 'monthly') => void;
  getActivitiesForDate: (dateKey: string) => any[];
  vectors: IntelligenceVectorSummary;
  reconciliation: ReconciliationSummary;
  headline: string;
  opportunities: IntelligenceOpportunity[];
}
