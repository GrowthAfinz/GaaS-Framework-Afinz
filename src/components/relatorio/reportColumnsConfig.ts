import { Activity } from '../../types/framework';

export type MetricKey =
  | 'baseEnviada'
  | 'baseEntregue'
  | 'taxaEntrega'
  | 'aberturas'
  | 'taxaAbertura'
  | 'cliques'
  | 'propostas'
  | 'taxaProposta'
  | 'aprovados'
  | 'taxaAprovacao'
  | 'emissoes'
  | 'emissoesIndependentes'
  | 'emissoesAssistidas'
  | 'taxaFinalizacao'
  | 'taxaConversaoBase'
  | 'custoPorCartao'
  | 'custoTotal'
  | 'cac'
  | 'participacaoEmissoes';

export type DimensionKey =
  | 'segmento'
  | 'canal'
  | 'bu'
  | 'jornada'
  | 'parceiro'
  | 'subgrupo'
  | 'oferta'
  | 'oferta2'
  | 'promocional'
  | 'promocional2'
  | 'produto'
  | 'etapaAquisicao'
  | 'perfilCredito'
  | 'safraKey'
  | 'ordemDisparo'
  | 'status'
  | 'descricao';

export type ColumnKey = MetricKey | DimensionKey;

export type ColumnFormat = 'number' | 'percent' | 'percent4' | 'currency' | 'text' | 'date';

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  type: 'metric' | 'dimension';
  format: ColumnFormat;
  highlight?: boolean;
  invertPositive?: boolean;
}

export const METRIC_COLUMNS: ColumnDef[] = [
  { key: 'baseEnviada',          label: 'Base enviada',     type: 'metric', format: 'number' },
  { key: 'baseEntregue',         label: 'Base entregue',    type: 'metric', format: 'number' },
  { key: 'taxaEntrega',          label: '% Entrega',        type: 'metric', format: 'percent' },
  { key: 'aberturas',            label: 'Aberturas',        type: 'metric', format: 'number' },
  { key: 'taxaAbertura',         label: '% Abertura',       type: 'metric', format: 'percent' },
  { key: 'cliques',              label: 'Cliques',          type: 'metric', format: 'number' },
  { key: 'taxaClique',           label: '% Clique',         type: 'metric', format: 'percent' },
  { key: 'propostas',            label: 'Propostas',        type: 'metric', format: 'number',  highlight: true },
  { key: 'taxaProposta',         label: '% Proposta',       type: 'metric', format: 'percent', highlight: true },
  { key: 'aprovados',            label: 'Aprovados',        type: 'metric', format: 'number',  highlight: true },
  { key: 'taxaAprovacao',        label: '% Aprovação',      type: 'metric', format: 'percent', highlight: true },
  { key: 'emissoes',             label: 'Emissões',         type: 'metric', format: 'number',  highlight: true },
  { key: 'emissoesIndependentes',label: 'Emissões Indep.',  type: 'metric', format: 'number' },
  { key: 'emissoesAssistidas',   label: 'Emissões Assist.', type: 'metric', format: 'number' },
  { key: 'taxaFinalizacao',      label: '% Finalização',    type: 'metric', format: 'percent' },
  { key: 'taxaConversaoBase',    label: '% Conv da Base',   type: 'metric', format: 'percent4' },
  { key: 'custoPorCartao',       label: 'Custo / Cartão',   type: 'metric', format: 'currency', invertPositive: true },
  { key: 'custoTotal',           label: 'Custo Total',      type: 'metric', format: 'currency', invertPositive: true },
  { key: 'cac',                  label: 'CAC',              type: 'metric', format: 'currency', invertPositive: true },
  { key: 'participacaoEmissoes', label: '% Participação',   type: 'metric', format: 'percent' },
];

export const DIMENSION_COLUMNS: ColumnDef[] = [
  { key: 'segmento',       label: 'Segmento',        type: 'dimension', format: 'text' },
  { key: 'canal',          label: 'Canal',           type: 'dimension', format: 'text' },
  { key: 'bu',             label: 'BU',              type: 'dimension', format: 'text' },
  { key: 'jornada',        label: 'Jornada',         type: 'dimension', format: 'text' },
  { key: 'parceiro',       label: 'Parceiro',        type: 'dimension', format: 'text' },
  { key: 'subgrupo',       label: 'Subgrupo',        type: 'dimension', format: 'text' },
  { key: 'oferta',         label: 'Oferta',          type: 'dimension', format: 'text' },
  { key: 'oferta2',        label: 'Oferta 2',        type: 'dimension', format: 'text' },
  { key: 'promocional',    label: 'Promocional',     type: 'dimension', format: 'text' },
  { key: 'promocional2',   label: 'Promocional 2',   type: 'dimension', format: 'text' },
  { key: 'produto',        label: 'Produto',         type: 'dimension', format: 'text' },
  { key: 'etapaAquisicao', label: 'Etapa Funil',     type: 'dimension', format: 'text' },
  { key: 'perfilCredito',  label: 'Perfil Crédito',  type: 'dimension', format: 'text' },
  { key: 'safraKey',       label: 'Safra',           type: 'dimension', format: 'text' },
  { key: 'ordemDisparo',   label: 'Ordem',           type: 'dimension', format: 'number' },
  { key: 'status',         label: 'Status',          type: 'dimension', format: 'text' },
  { key: 'descricao',      label: 'Descrição',       type: 'dimension', format: 'text' },
];

export const COLUMN_CATALOG: ColumnDef[] = [...METRIC_COLUMNS, ...DIMENSION_COLUMNS];

export const COLUMN_BY_KEY: Record<ColumnKey, ColumnDef> = COLUMN_CATALOG.reduce(
  (acc, def) => {
    acc[def.key] = def;
    return acc;
  },
  {} as Record<ColumnKey, ColumnDef>
);

// Dimensões úteis para agrupar (Performance campanhas / canais)
export const GROUPABLE_DIMENSIONS: DimensionKey[] = [
  'segmento', 'canal', 'bu', 'jornada', 'parceiro', 'subgrupo',
  'oferta', 'produto', 'etapaAquisicao', 'perfilCredito', 'safraKey',
];

// Colunas padrão de cada bloco (devem refletir o que existia antes da personalização)
export const DEFAULT_AGGREGATE_COLUMNS: MetricKey[] = [
  'baseEnviada', 'baseEntregue', 'taxaEntrega',
  'propostas', 'taxaProposta',
  'aprovados', 'taxaAprovacao',
  'emissoes',
  'taxaFinalizacao', 'custoPorCartao', 'custoTotal', 'taxaConversaoBase',
];

export const DEFAULT_CANAL_EXTRA_COLUMNS: MetricKey[] = ['participacaoEmissoes'];

export const DEFAULT_DETAIL_DIMENSIONS: DimensionKey[] = [
  'segmento', 'parceiro', 'canal', 'descricao',
];

export const DEFAULT_DETAIL_METRICS: MetricKey[] = [
  'baseEntregue',
  'propostas', 'taxaProposta',
  'aprovados', 'taxaAprovacao',
  'emissoes',
  'taxaFinalizacao', 'custoPorCartao', 'custoTotal', 'taxaConversaoBase',
];

// Acesso seguro a um campo dimensional de um Activity (fallback strings vazias)
export function getDimensionValue(activity: Activity, dim: DimensionKey): string {
  const raw = (activity.raw ?? {}) as Record<string, unknown>;
  switch (dim) {
    case 'segmento':       return activity.segmento || '';
    case 'canal':          return activity.canal || '';
    case 'bu':             return activity.bu || '';
    case 'jornada':        return activity.jornada || '';
    case 'parceiro': {
      const p = activity.parceiro ?? '';
      if (activity.bu?.toLowerCase() === 'plurix') return 'Plurix';
      return (!p || p.toLowerCase() === 'n/a') ? 'Afinz' : p;
    }
    case 'subgrupo':       return activity.subgrupo || '';
    case 'oferta':         return activity.oferta || '';
    case 'oferta2':        return (raw['Oferta 2'] as string) || '';
    case 'promocional':    return activity.promocional || '';
    case 'promocional2':   return (raw['Promocional 2'] as string) || '';
    case 'produto':        return activity.produto || (raw['Produto'] as string) || '';
    case 'etapaAquisicao': return activity.etapaAquisicao || (raw['Etapa de aquisição'] as string) || '';
    case 'perfilCredito':  return activity.perfilCredito || (raw['Perfil de Crédito'] as string) || '';
    case 'safraKey':       return activity.safraKey || '';
    case 'ordemDisparo':   return activity.ordemDisparo != null ? String(activity.ordemDisparo) : '';
    case 'status':         return activity.status || '';
    case 'descricao':      return '';
    default:               return '';
  }
}

export function getGroupableDimensionLabel(dim: DimensionKey): string {
  return COLUMN_BY_KEY[dim]?.label ?? dim;
}
