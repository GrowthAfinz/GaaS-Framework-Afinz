import { CalendarData, Activity } from '../types/framework';
import { MetricKey, METRIC_COLUMNS } from '../components/relatorio/reportColumnsConfig';

export type MonthlyDimension = 'segmento' | 'canal';

// Catálogo único: as métricas selecionáveis nos gráficos (Diário/Mensal) são
// exatamente as mesmas 20 da Overview (reportColumnsConfig.METRIC_COLUMNS).
export type MonthlyMetricKey = MetricKey;

export interface MonthlyMetrics {
  baseEnviada: number;
  baseEntregue: number;
  taxaEntrega: number;
  aberturas: number;
  taxaAbertura: number;
  cliques: number;
  taxaClique: number;
  propostas: number;
  taxaProposta: number;
  aprovados: number;
  taxaAprovacao: number;
  emissoes: number;
  emissoesIndependentes: number;
  emissoesAssistidas: number;
  taxaFinalizacao: number;
  taxaConversaoBase: number;
  custoPorCartao: number;
  custoTotal: number;
  cac: number;
  // Participação (% do total de emissões do dia/mês) depende do contexto de
  // quem está agregando (soma entre séries do mesmo dia) — fica em 0 aqui e é
  // preenchida em pós-processamento por aggregateDailyByDimension/aggregateMonthlyByDimension.
  participacaoEmissoes: number;
}

export interface MonthlyTotalRow extends MonthlyMetrics {
  monthKey: string;
  monthLabel: string;
  activitiesCount: number;
}

export interface MonthlyDimensionRow extends MonthlyTotalRow {
  dimension: MonthlyDimension;
  label: string;
}

export const MONTHLY_METRIC_LABELS: Record<MonthlyMetricKey, string> = METRIC_COLUMNS.reduce(
  (acc, def) => {
    acc[def.key as MetricKey] = def.label;
    return acc;
  },
  {} as Record<MonthlyMetricKey, string>
);

// Métricas que não fazem sentido empilhadas (taxas, médias e custos unitários) —
// continuam como barras/linhas independentes mesmo em modo empilhado.
export const NON_STACKABLE_MONTHLY_METRICS = new Set<MonthlyMetricKey>([
  'taxaEntrega',
  'taxaAbertura',
  'taxaClique',
  'taxaProposta',
  'taxaAprovacao',
  'taxaFinalizacao',
  'taxaConversaoBase',
  'custoPorCartao',
  'cac',
  'participacaoEmissoes',
]);

function getActivityMonthKey(activity: Activity, fallbackDateKey: string): string {
  const source = activity.dataDisparo instanceof Date && !Number.isNaN(activity.dataDisparo.getTime())
    ? activity.dataDisparo
    : new Date(`${fallbackDateKey}T00:00:00`);

  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('.', '');
}

export interface MetricVolumes {
  baseEnviada: number;
  baseEntregue: number;
  aberturas: number;
  cliques: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
  emissoesIndependentes: number;
  emissoesAssistidas: number;
  custoTotal: number;
  // CAC não é somável — é a média do CAC por disparo (mesma regra da Overview,
  // ver aggregations.ts computeRow). Guardamos soma+contagem para reconstruir
  // a média corretamente em qualquer nível de agregação (dia, mês, acumulado).
  cacSum: number;
  cacCount: number;
}

export function emptyVolumes(): MetricVolumes {
  return {
    baseEnviada: 0,
    baseEntregue: 0,
    aberturas: 0,
    cliques: 0,
    propostas: 0,
    aprovados: 0,
    emissoes: 0,
    emissoesIndependentes: 0,
    emissoesAssistidas: 0,
    custoTotal: 0,
    cacSum: 0,
    cacCount: 0,
  };
}

/** Deriva todas as taxas a partir de volumes brutos (reutilizado em acumulados). */
export function metricsFromVolumes(v: MetricVolumes): MonthlyMetrics {
  const {
    baseEnviada, baseEntregue, aberturas, cliques, propostas, aprovados,
    emissoes, emissoesIndependentes, emissoesAssistidas, custoTotal, cacSum, cacCount,
  } = v;
  return {
    baseEnviada,
    baseEntregue,
    taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
    aberturas,
    taxaAbertura: baseEntregue > 0 ? aberturas / baseEntregue : 0,
    cliques,
    // Alinhado com a Overview (aggregations.ts): % Clique = cliques / aberturas.
    taxaClique: aberturas > 0 ? cliques / aberturas : 0,
    propostas,
    taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
    aprovados,
    taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
    emissoes,
    emissoesIndependentes,
    emissoesAssistidas,
    taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
    taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
    custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
    custoTotal,
    cac: cacCount > 0 ? cacSum / cacCount : 0,
    participacaoEmissoes: 0,
  };
}

export function computeMetrics(activities: Activity[]): MonthlyMetrics {
  const cacRows = activities.filter(a => (a.kpis.cac ?? 0) > 0);
  return metricsFromVolumes({
    baseEnviada: activities.reduce((sum, activity) => sum + (activity.kpis.baseEnviada ?? 0), 0),
    baseEntregue: activities.reduce((sum, activity) => sum + (activity.kpis.baseEntregue ?? 0), 0),
    aberturas: activities.reduce((sum, activity) => sum + (activity.kpis.aberturas ?? 0), 0),
    cliques: activities.reduce((sum, activity) => sum + (activity.kpis.cliques ?? 0), 0),
    propostas: activities.reduce((sum, activity) => sum + (activity.kpis.propostas ?? 0), 0),
    aprovados: activities.reduce((sum, activity) => sum + (activity.kpis.aprovados ?? 0), 0),
    emissoes: activities.reduce((sum, activity) => sum + ((activity.kpis.emissoes ?? activity.kpis.cartoes) ?? 0), 0),
    emissoesIndependentes: activities.reduce((sum, activity) => sum + (activity.kpis.emissoesIndependentes ?? 0), 0),
    emissoesAssistidas: activities.reduce((sum, activity) => sum + (activity.kpis.emissoesAssistidas ?? 0), 0),
    custoTotal: activities.reduce((sum, activity) => sum + (activity.kpis.custoTotal ?? 0), 0),
    cacSum: cacRows.reduce((sum, activity) => sum + (activity.kpis.cac ?? 0), 0),
    cacCount: cacRows.length,
  });
}

/** Soma bruta de CAC (soma + contagem de disparos com CAC>0) de um grupo de atividades. */
export function computeCacAggregate(activities: Activity[]): { cacSum: number; cacCount: number } {
  const cacRows = activities.filter(a => (a.kpis.cac ?? 0) > 0);
  return {
    cacSum: cacRows.reduce((sum, activity) => sum + (activity.kpis.cac ?? 0), 0),
    cacCount: cacRows.length,
  };
}

function groupActivitiesByMonth(data: CalendarData): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();

  Object.entries(data).forEach(([dateKey, activities]) => {
    activities.forEach((activity) => {
      const monthKey = getActivityMonthKey(activity, dateKey);
      if (!groups.has(monthKey)) groups.set(monthKey, []);
      groups.get(monthKey)!.push(activity);
    });
  });

  return groups;
}

export function aggregateMonthlyTotals(data: CalendarData): MonthlyTotalRow[] {
  const groups = groupActivitiesByMonth(data);
  const rows = Array.from(groups.entries())
    .map(([monthKey, activities]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      activitiesCount: activities.length,
      ...computeMetrics(activities),
    }));
  rows.forEach((row) => { row.participacaoEmissoes = row.emissoes > 0 ? 1 : 0; });
  return rows.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function aggregateMonthlyByDimension(
  data: CalendarData,
  dimension: MonthlyDimension,
): MonthlyDimensionRow[] {
  const monthGroups = groupActivitiesByMonth(data);
  const rows: MonthlyDimensionRow[] = [];

  monthGroups.forEach((activities, monthKey) => {
    const dimensionGroups = new Map<string, Activity[]>();

    activities.forEach((activity) => {
      const label = dimension === 'segmento'
        ? activity.segmento || 'Sem Segmento'
        : activity.canal || 'Sem Canal';
      if (!dimensionGroups.has(label)) dimensionGroups.set(label, []);
      dimensionGroups.get(label)!.push(activity);
    });

    dimensionGroups.forEach((dimensionActivities, label) => {
      rows.push({
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        activitiesCount: dimensionActivities.length,
        dimension,
        label,
        ...computeMetrics(dimensionActivities),
      });
    });
  });

  const monthEmissoesTotal = new Map<string, number>();
  rows.forEach((row) => {
    monthEmissoesTotal.set(row.monthKey, (monthEmissoesTotal.get(row.monthKey) ?? 0) + row.emissoes);
  });
  rows.forEach((row) => {
    const total = monthEmissoesTotal.get(row.monthKey) ?? 0;
    row.participacaoEmissoes = total > 0 ? row.emissoes / total : 0;
  });

  return rows.sort((a, b) => (
    a.monthKey.localeCompare(b.monthKey) || b.emissoes - a.emissoes || a.label.localeCompare(b.label)
  ));
}

export function calculateMonthlyVariation(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getMonthlyMetricValue(row: MonthlyMetrics, metric: MonthlyMetricKey): number {
  return row[metric];
}
