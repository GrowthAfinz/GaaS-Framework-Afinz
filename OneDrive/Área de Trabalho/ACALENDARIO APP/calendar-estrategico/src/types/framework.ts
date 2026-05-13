// Core domain types
export type BU = 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';

export interface KPIs {
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  cartoes: number;
  custoTotal: number;
  taxaAbertura?: number;
  taxaEntrega?: number;
  taxaConversao?: number;
}

export interface Activity {
  id: string;
  bu: BU;
  canal: string;
  segmento: string;
  parceiro: string;
  kpis: KPIs;
  raw: Record<string, any>;
}

export type CalendarData = Record<string, Activity[]>; // YYYY-MM-DD -> Activity[]

// Comparison types
export interface MoMComparison {
  currentValue: number;
  previousValue: number;
  absoluteDifference: number;
  percentDifference: number; // percentage change
}

export interface MoMMetrics {
  conversao: MoMComparison;
  cac: MoMComparison;
  entrega: MoMComparison;
  abertura: MoMComparison;
}

export interface AggregatedData {
  date: string;
  label: string;
  timestamp: number;
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  cartoes: number;
  custo: number;
  count: number;
}

export interface ComparisonData extends AggregatedData {
  previousData?: AggregatedData;
  momMetrics?: MoMMetrics;
}

// Anomaly types for performance monitoring
export type AnomalyType = 'pending' | 'no_sent' | 'no_delivered' | 'no_open';

// Period selection types
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PeriodComparison {
  current: DateRange;
  isMoMEnabled: boolean;
  previous?: DateRange;
}
