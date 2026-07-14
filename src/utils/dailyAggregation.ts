import { CalendarData, Activity } from '../types/framework';
import {
  MetricVolumes,
  MonthlyDimension,
  MonthlyMetrics,
  computeCacAggregate,
  computeMetrics,
  emptyVolumes,
  metricsFromVolumes,
} from './monthlyAggregation';

export type DailyDimension = MonthlyDimension;

export interface DailyTotalRow extends MonthlyMetrics {
  dayKey: string;   // yyyy-MM-dd
  dayLabel: string; // dd/MM
  activitiesCount: number;
  // Bookkeeping bruto de CAC (soma + contagem) — permite reconstruir a média
  // corretamente em accumulate*/totalsFromDimensionRows sem re-varrer activities.
  cacSum: number;
  cacCount: number;
}

export interface DailyDimensionRow extends DailyTotalRow {
  dimension: DailyDimension;
  label: string;
}

function getActivityDayKey(activity: Activity, fallbackDateKey: string): string {
  const source = activity.dataDisparo instanceof Date && !Number.isNaN(activity.dataDisparo.getTime())
    ? activity.dataDisparo
    : new Date(`${fallbackDateKey}T00:00:00`);

  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, '0');
  const day = String(source.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dayKey: string): string {
  const [, month, day] = dayKey.split('-');
  if (!month || !day) return dayKey;
  return `${day}/${month}`;
}

function groupActivitiesByDay(data: CalendarData): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  Object.entries(data).forEach(([dateKey, activities]) => {
    activities.forEach((activity) => {
      const dayKey = getActivityDayKey(activity, dateKey);
      if (!groups.has(dayKey)) groups.set(dayKey, []);
      groups.get(dayKey)!.push(activity);
    });
  });
  return groups;
}

export function aggregateDailyTotals(data: CalendarData): DailyTotalRow[] {
  const groups = groupActivitiesByDay(data);
  const rows = Array.from(groups.entries())
    .map(([dayKey, activities]) => ({
      dayKey,
      dayLabel: formatDayLabel(dayKey),
      activitiesCount: activities.length,
      ...computeMetrics(activities),
      ...computeCacAggregate(activities),
    }));
  rows.forEach((row) => { row.participacaoEmissoes = row.emissoes > 0 ? 1 : 0; });
  return rows.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

export function aggregateDailyByDimension(
  data: CalendarData,
  dimension: DailyDimension,
): DailyDimensionRow[] {
  const dayGroups = groupActivitiesByDay(data);
  const rows: DailyDimensionRow[] = [];

  dayGroups.forEach((activities, dayKey) => {
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
        dayKey,
        dayLabel: formatDayLabel(dayKey),
        activitiesCount: dimensionActivities.length,
        dimension,
        label,
        ...computeMetrics(dimensionActivities),
        ...computeCacAggregate(dimensionActivities),
      });
    });
  });

  return recomputeParticipacaoEmissoes(rows).sort((a, b) => (
    a.dayKey.localeCompare(b.dayKey) || b.emissoes - a.emissoes || a.label.localeCompare(b.label)
  ));
}

/**
 * % Participação = fatia das emissões do dia que cada série (segmento/canal)
 * representa, somando entre TODAS as linhas do mesmo dia — inclusive séries
 * vindas de fora do agrupamento original (ex: mesclar Serasa API depois de
 * aggregateDailyByDimension). Imutável: retorna linhas novas (não muta as
 * recebidas), já que elas podem vir de um useMemo compartilhado por outros
 * consumidores.
 */
export function recomputeParticipacaoEmissoes<T extends { dayKey: string; emissoes: number; participacaoEmissoes: number }>(rows: T[]): T[] {
  const dayEmissoesTotal = new Map<string, number>();
  rows.forEach((row) => {
    dayEmissoesTotal.set(row.dayKey, (dayEmissoesTotal.get(row.dayKey) ?? 0) + row.emissoes);
  });
  return rows.map((row) => {
    const total = dayEmissoesTotal.get(row.dayKey) ?? 0;
    return { ...row, participacaoEmissoes: total > 0 ? row.emissoes / total : 0 };
  });
}

const VOLUME_KEYS: (keyof MetricVolumes)[] = [
  'baseEnviada', 'baseEntregue', 'aberturas', 'cliques', 'propostas', 'aprovados',
  'emissoes', 'emissoesIndependentes', 'emissoesAssistidas', 'custoTotal', 'cacSum', 'cacCount',
];

/**
 * Reconstrói o total diário (somando todas as séries/labels do dia) a partir
 * de linhas por dimensão — usado pelo modo multi-métrica do gráfico, que
 * sobrepõe métricas sem quebra por segmento/canal. Funciona também sobre
 * linhas já acumuladas (accumulateDailyDimensionRows), pois soma os volumes
 * brutos já cumulativos e recalcula as taxas a partir deles.
 */
export function totalsFromDimensionRows(rows: DailyDimensionRow[]): DailyTotalRow[] {
  const byDay = new Map<string, MetricVolumes & { dayLabel: string; activitiesCount: number }>();

  rows.forEach((row) => {
    const acc = byDay.get(row.dayKey) ?? { ...emptyVolumes(), dayLabel: row.dayLabel, activitiesCount: 0 };
    VOLUME_KEYS.forEach((k) => { acc[k] += row[k]; });
    acc.activitiesCount += row.activitiesCount;
    byDay.set(row.dayKey, acc);
  });

  const result: DailyTotalRow[] = Array.from(byDay.entries()).map(([dayKey, acc]) => {
    const metrics = metricsFromVolumes(acc);
    metrics.participacaoEmissoes = metrics.emissoes > 0 ? 1 : 0;
    return {
      dayKey,
      dayLabel: acc.dayLabel,
      activitiesCount: acc.activitiesCount,
      ...metrics,
      cacSum: acc.cacSum,
      cacCount: acc.cacCount,
    };
  });

  return result.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

/**
 * Transforma totais diários em série acumulada: cada dia carrega a soma de
 * volumes dos dias anteriores + o próprio, e as taxas são recalculadas sobre
 * os volumes acumulados.
 */
export function accumulateDailyTotals(rows: DailyTotalRow[]): DailyTotalRow[] {
  const running = emptyVolumes();
  let runningCount = 0;
  const accumulated = [...rows]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .map((row) => {
      VOLUME_KEYS.forEach((k) => { running[k] += row[k]; });
      runningCount += row.activitiesCount;
      return {
        dayKey: row.dayKey,
        dayLabel: row.dayLabel,
        activitiesCount: runningCount,
        ...metricsFromVolumes(running),
        cacSum: running.cacSum,
        cacCount: running.cacCount,
      };
    });
  accumulated.forEach((row) => { row.participacaoEmissoes = row.emissoes > 0 ? 1 : 0; });
  return accumulated;
}

/**
 * Versão acumulada por dimensão: cada série acumula seus próprios volumes ao
 * longo dos dias (mantém um total corrente por label).
 */
export function accumulateDailyDimensionRows(rows: DailyDimensionRow[]): DailyDimensionRow[] {
  const runningByLabel = new Map<string, MetricVolumes>();
  const countByLabel = new Map<string, number>();
  const dimension = rows[0]?.dimension ?? 'segmento';

  const accumulated = [...rows]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.label.localeCompare(b.label))
    .map((row) => {
      const running = runningByLabel.get(row.label) ?? emptyVolumes();
      VOLUME_KEYS.forEach((k) => { running[k] += row[k]; });
      runningByLabel.set(row.label, running);
      const count = (countByLabel.get(row.label) ?? 0) + row.activitiesCount;
      countByLabel.set(row.label, count);
      return {
        dayKey: row.dayKey,
        dayLabel: row.dayLabel,
        activitiesCount: count,
        dimension,
        label: row.label,
        ...metricsFromVolumes({ ...running }),
        cacSum: running.cacSum,
        cacCount: running.cacCount,
      };
    });

  return recomputeParticipacaoEmissoes(accumulated);
}

/**
 * Preenche dias faltantes no intervalo com zeros para totais diários.
 * Se um dia está no período mas sem atividades, adiciona uma linha com todos os metrics = 0.
 */
export function fillMissingDays(rows: DailyTotalRow[], startDate: Date, endDate: Date): DailyTotalRow[] {
  const allDays = new Map<string, DailyTotalRow>(rows.map(r => [r.dayKey, r]));
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;

    if (!allDays.has(dayKey)) {
      allDays.set(dayKey, {
        dayKey,
        dayLabel: formatDayLabel(dayKey),
        activitiesCount: 0,
        ...metricsFromVolumes(emptyVolumes()),
        cacSum: 0,
        cacCount: 0,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return Array.from(allDays.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}
