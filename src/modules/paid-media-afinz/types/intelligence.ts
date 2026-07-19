import type { AggregatedMetrics } from '../utils/aggregateMetrics';

export type IntelligenceViewMode =
  | 'performance'
  | 'goals'
  | 'comparison'
  | 'diagnosis'
  | 'opportunities'
  | 'simulation';

export type IntelligenceMetric = 'spend' | 'cpm' | 'ctr' | 'cpc' | 'cpa';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'blocked';

export interface ProjectionEvidence {
  observedDays: number;
  expectedDays: number;
  missingDays: number;
  lastClosedDate: string | null;
  recentPace: number;
  overallPace: number;
  volatility: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  limitations: string[];
}

export interface MetricProjection {
  current: AggregatedMetrics;
  projected: AggregatedMetrics;
  lower: AggregatedMetrics;
  upper: AggregatedMetrics;
  evidence: ProjectionEvidence;
  daysInMonth: number;
  remainingDays: number;
}

export interface MetricComparison {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  absolute: AggregatedMetrics;
  percent: Partial<Record<keyof AggregatedMetrics, number | null>>;
  currentLabel: string;
  previousLabel: string;
  comparable: boolean;
  limitations: string[];
}

export interface IntelligenceEntity {
  key: string;
  label: string;
  level: 'objective' | 'campaign';
  objective: string;
  channel?: string;
  rows: any[];
  previousRows: any[];
  projection: MetricProjection;
  comparison: MetricComparison;
}

export interface DiagnosticSignal {
  id: string;
  entityKey: string;
  entityLabel: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'info';
  signal: string;
  impact: string;
  probableCause: string;
  evidence: string[];
  action: string;
  confidence: ConfidenceLevel;
  priorityScore: number;
  bucket: 'act' | 'monitor' | 'investigate';
}
