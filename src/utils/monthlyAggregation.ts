import { CalendarData, Activity } from '../types/framework';

export type MonthlyDimension = 'segmento' | 'canal';

export type MonthlyMetricKey =
  | 'baseEnviada'
  | 'baseEntregue'
  | 'propostas'
  | 'aprovados'
  | 'emissoes'
  | 'custoTotal'
  | 'custoPorCartao'
  | 'taxaConversaoBase';

export interface MonthlyMetrics {
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
  custoTotal: number;
  taxaEntrega: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
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

export const MONTHLY_METRIC_LABELS: Record<MonthlyMetricKey, string> = {
  baseEnviada: 'Base enviada',
  baseEntregue: 'Base entregue',
  propostas: 'Propostas',
  aprovados: 'Aprovados',
  emissoes: 'Emissões',
  custoTotal: 'Custo Total',
  custoPorCartao: 'Custo/Cartão',
  taxaConversaoBase: '% Conv da Base',
};

export const NON_STACKABLE_MONTHLY_METRICS = new Set<MonthlyMetricKey>([
  'custoPorCartao',
  'taxaConversaoBase',
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

function computeMetrics(activities: Activity[]): MonthlyMetrics {
  const baseEnviada = activities.reduce((sum, activity) => sum + (activity.kpis.baseEnviada ?? 0), 0);
  const baseEntregue = activities.reduce((sum, activity) => sum + (activity.kpis.baseEntregue ?? 0), 0);
  const propostas = activities.reduce((sum, activity) => sum + (activity.kpis.propostas ?? 0), 0);
  const aprovados = activities.reduce((sum, activity) => sum + (activity.kpis.aprovados ?? 0), 0);
  const emissoes = activities.reduce((sum, activity) => sum + ((activity.kpis.emissoes ?? activity.kpis.cartoes) ?? 0), 0);
  const custoTotal = activities.reduce((sum, activity) => sum + (activity.kpis.custoTotal ?? 0), 0);

  return {
    baseEnviada,
    baseEntregue,
    propostas,
    aprovados,
    emissoes,
    custoTotal,
    taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
    taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
    taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
    taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
    custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
    taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
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
  return Array.from(groups.entries())
    .map(([monthKey, activities]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      activitiesCount: activities.length,
      ...computeMetrics(activities),
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
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
