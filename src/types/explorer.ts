/**
 * Explorador de Disparos - Type Definitions
 */

import { ActivityRow } from './activity';

export type NodeType = 'bu' | 'segmento' | 'jornada' | 'canal' | 'disparo';

export type ExplorerMetric = 'volume' | 'cartoes' | 'cac' | 'custo' | 'disparos' | 'aberturas' | 'cliques' | 'taxaClique';
export type DistributionLevel = 'bu' | 'segmento' | 'jornada' | 'canal' | 'disparo';
export type TemporalViewMode = 'simple' | 'stacked';

export interface NodeMetrics {
  baseTotal: number;
  aberturas: number;
  cliques: number;
  taxaClique: number;
  cartoes: number;
  propostas: number;
  aprovados: number;
  custoTotal: number;
  cac: number;          // weighted average
  taxaConversao: number; // weighted average
}

export interface TreeNode {
  id: string;                   // Unique: "b2c", "b2c-crm", "b2c-crm-jornada_ativa"
  label: string;                // Display name
  type: NodeType;
  count: number;                // Number of activities in this node
  parentId: string | null;
  metrics: NodeMetrics;
  children: TreeNode[];
  activityIds: string[];        // IDs of leaf ActivityRow records
  color: string;                // BU color inherited through hierarchy
}

export interface ExplorerFilters {
  periodo: {
    inicio: string;  // YYYY-MM-DD
    fim: string;     // YYYY-MM-DD
  };
  bus: string[];
  segmentos: string[];
  jornadas: string[];
  canais: string[];
  status: ('Rascunho' | 'Scheduled' | 'Enviado' | 'Realizado')[];
}

export interface BarChartDataPoint {
  id: string;
  label: string;
  value: number;
  prevValue?: number;
  color: string;
  count: number;
  nodeType: NodeType;
  nextFocusId?: string | null;
}

export interface HeatmapCell {
  rowId: string;
  rowLabel: string;
  columnLabel: string; // "S1", "S2", "S3", "S4"
  weekIndex: number;
  value: number;
  intensity: number;   // 0-1 for gradient
  count: number;
}

export interface DailyTowerPoint {
  date: string;        // YYYY-MM-DD
  label: string;       // dd/MM
  total: number;
  [key: string]: string | number;
}

export interface SearchResult {
  node: TreeNode;
  path: string[];      // ["B2C", "CRM", "Jornada Ativa"]
  matchType: 'exact' | 'partial';
  score: number;       // 0-100
}

export interface ChannelDistributionItem {
  canal: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopOfferItem {
  oferta: string;
  cartoes: number;
  count: number; // number of activities
}

export interface TopPromocionalItem {
  promocional: string;
  cartoes: number;
  count: number;
}

export interface TopDimensionItem {
  label: string;
  cartoes: number;
  count: number;
}

export interface FunnelSummary {
  propostas: number;
  aprovados: number;
  cartoes: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
}

export interface BaseSummary {
  baseTotal: number;
  baseAcionavel: number;
  taxaAcionavel: number;
  otimBaseMedia: number;
}

export interface DetailsPaneData {
  node: TreeNode;
  period: string;
  channelDistribution: ChannelDistributionItem[];
  topOffers: TopOfferItem[];
  topPromocionais: TopPromocionalItem[];
  topParceiros: TopDimensionItem[];
  topSubgrupos: TopDimensionItem[];
  topPerfisCredito: TopDimensionItem[];
  topEtapasAquisicao: TopDimensionItem[];
  topOrdensDisparo: TopDimensionItem[];
  funnelSummary: FunnelSummary;
  baseSummary: BaseSummary;
  activities: ActivityRow[];
  prevMetrics?: NodeMetrics;
}
