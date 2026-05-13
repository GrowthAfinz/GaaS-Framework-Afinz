export type BU = 'B2C' | 'B2B2C' | 'Plurix' | string;

export interface KPIs {
  baseEnviada: number | null;
  baseEntregue: number | null;
  aberturas: number | null;
  cliques: number | null;
  taxaEntrega: number | null;
  propostas: number | null;
  taxaPropostas: number | null;
  aprovados: number | null;
  taxaAprovacao: number | null;
  emissoes: number | null;
  emissoesIndependentes: number | null;
  emissoesAssistidas: number | null;
  taxaFinalizacao: number | null;
  taxaConversao: number | null;
  taxaAbertura: number | null;
  cartoes: number | null;
  cac: number | null;
  custoTotal: number | null;
}

export interface Activity {
  id: string; // Taxonomy name or UUID (see raw.id for DB primary key)
  dataDisparo: Date;
  canal: string;
  bu: BU;
  segmento: string;
  parceiro: string;
  jornada: string; // Dimensão Jornada
  subgrupo?: string;
  ordemDisparo?: number; // ordem de disparo dentro da jornada
  oferta?: string; // tipo de oferta
  promocional?: string; // variável promocional
  // Safra/coorte do registro (normalizada como YYYY-MM)
  safraKey?: string;
  status?: 'Rascunho' | 'Scheduled' | 'Enviado' | 'Realizado'; // Adicionado para controle visual no calendário
  kpis: KPIs;
  // Raw row data for reference/editing
  raw: FrameworkRow;
}

export interface DayData {
  date: Date;
  activities: Activity[];
}

export interface CalendarData {
  [dateKey: string]: Activity[]; // Key format: "2025-11-03"
}

export interface FilterState {
  bu: string[];
  canais: string[];
  jornadas: string[];
  segmentos: string[];
  parceiros: string[];
  subgrupos: string[];
  ofertas: string[];
  disparado: 'Sim' | 'Não' | 'Todos';
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string;    // YYYY-MM-DD
}

export interface ComparationData {
  current: number;
  previous: number;
  variation: number; // percentual de mudança
  isGrowth: boolean; // true se cresceu
}

export interface MetaMensal {
  id: string;
  mes: string;           // "2025-11"
  bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';
  cartoes_meta: number;
  pedidos_meta: number;
  cac_max: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  mes: string;           // "2025-11"
  cartoes_meta?: number; // Meta CRM (Launch Planner)
  b2c_meta?: number;     // Meta B2C Total (CRM + Direct)
  aprovacoes_meta?: number;
  cac_max?: number;
  plurix_meta?: number;
  b2b2c_meta?: number;
  bus?: Record<string, { cartoes: number; aprovacoes: number; cac: number }>;
}

export interface JournalEntry {
  id: string;
  data: string;
  autor: string;
  titulo: string;
  descricao: string;
  testeAB: boolean;
  campanhasRelacionadas: string[];
  statusExperimento?: "hipotese" | "rodando" | "concluido" | "aprendizado";
  hipotese?: string;
  conclusao?: string;
}

export interface ViewSettings {
  periodo: { inicio: string; fim: string };
  abaAtual: "launch" | "resultados" | "jornada" | "framework" | "diario" | "orientador" | "configuracoes" | "originacao-b2c" | "midia-paga" | "explorador" | "relatorio";
  filtrosGlobais: FilterState;
  modoTempoJornada: "diario" | "semanal";
  perspective: "total" | "crm" | "b2c";
}

export type AnomalyType = 'pending' | 'no_sent' | 'no_delivered' | 'no_open';

// Full 41 columns from Specification
export interface FrameworkRow {
  'Disparado?'?: string;
  'Jornada'?: string;
  'Activity name / Taxonomia': string;
  'Canal': string;
  'Data de Disparo': string;
  'Data Fim': string;
  'Safra': string;
  'BU': string;
  'Parceiro': string;
  'SIGLA': string;
  'Segmento': string;
  'SIGLA.1': string;
  'Subgrupos': string;
  'Base Total': string | number;
  'Base Acionável': string | number;
  'Abertura': string | number;
  'Cliques': string | number;
  '% Otimização de base': string | number;
  'Etapa de aquisição': string;
  'Ordem de disparo': string | number;
  'Perfil de Crédito': string;
  'Produto': string;
  'Oferta': string;
  'Promocional': string;
  'SIGLA.2': string;
  'Oferta 2': string;
  'Promocional 2': string;
  'Custo Unitário Oferta': string | number;
  'Custo Total da Oferta': string | number;
  'Custo unitário do canal': string | number;
  'Custo total canal': string | number;
  'Taxa de Entrega': string | number;
  'Taxa de Abertura': string | number;
  'Taxa de Clique': string | number;
  'Taxa de Proposta': string | number;
  'Taxa de Aprovação': string | number;
  'Taxa de Finalização': string | number;
  'Taxa de Conversão': string | number;
  'Custo Total Campanha': string | number;
  'CAC': string | number;
  'Cartões Gerados': string | number;
  'Aprovados': string | number;
  'Propostas': string | number;
  [key: string]: any; // Allow extra columns
}

export interface FrameworkVersion {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  rowCount: number;
  editCount: number;
  data: FrameworkRow[];
}

export interface VersionStorage {
  currentVersionId: string | null;
  versions: FrameworkVersion[];
}
