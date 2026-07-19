import {
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameMonth,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { aggregate, type AggregatedMetrics, type AggregatableRow } from './aggregateMetrics';
import type {
  ConfidenceLevel,
  DiagnosticSignal,
  MetricComparison,
  MetricProjection,
} from '../types/intelligence';

type MetricRow = AggregatableRow & {
  date: string | Date;
  campaign?: string;
  objective?: string;
  channel?: string;
};

type AdditiveKey = 'spend' | 'impressions' | 'clicks' | 'conversions' | 'reach';

const dateKey = (value: string | Date) => format(new Date(value), 'yyyy-MM-dd');
const number = (value: unknown) => Number(value) || 0;

export function lastClosedDate(now = new Date()): Date {
  return endOfDay(subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1));
}

export function closedRows<T extends { date: string | Date }>(rows: T[], now = new Date()): T[] {
  const cutoff = lastClosedDate(now).getTime();
  return rows.filter((row) => new Date(row.date).getTime() <= cutoff);
}

export function aggregateByDay(rows: MetricRow[]): Array<MetricRow & AggregatedMetrics> {
  const groups = new Map<string, MetricRow[]>();
  rows.forEach((row) => {
    const key = dateKey(row.date);
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows]) => ({ date, ...aggregate(dayRows) }));
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function metricPace(days: Array<MetricRow & AggregatedMetrics>, key: AdditiveKey) {
  const values = days.map((day) => number(day[key]));
  const recentValues = values.slice(-7);
  const overall = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const recent = recentValues.reduce((sum, value) => sum + value, 0) / Math.max(recentValues.length, 1);
  const used = values.length >= 7 ? recent * 0.6 + overall * 0.4 : overall;
  const deviations = recentValues.map((value) => Math.abs(value - median(recentValues)));
  return { overall, recent, used, mad: median(deviations) };
}

function fromVolumes(volumes: Pick<AggregatedMetrics, AdditiveKey>): AggregatedMetrics {
  return {
    ...volumes,
    ctr: volumes.impressions ? (volumes.clicks / volumes.impressions) * 100 : 0,
    cpc: volumes.clicks ? volumes.spend / volumes.clicks : 0,
    cpm: volumes.impressions ? (volumes.spend / volumes.impressions) * 1000 : 0,
    cpa: volumes.conversions ? volumes.spend / volumes.conversions : 0,
    frequency: volumes.reach ? volumes.impressions / volumes.reach : 0,
  };
}

function boundedMetrics(
  lowerVolumes: Pick<AggregatedMetrics, AdditiveKey>,
  upperVolumes: Pick<AggregatedMetrics, AdditiveKey>,
): { lower: AggregatedMetrics; upper: AggregatedMetrics } {
  const lower = fromVolumes(lowerVolumes);
  const upper = fromVolumes(upperVolumes);
  lower.ctr = upperVolumes.impressions ? (lowerVolumes.clicks / upperVolumes.impressions) * 100 : 0;
  upper.ctr = lowerVolumes.impressions ? (upperVolumes.clicks / lowerVolumes.impressions) * 100 : 0;
  lower.cpc = upperVolumes.clicks ? lowerVolumes.spend / upperVolumes.clicks : 0;
  upper.cpc = lowerVolumes.clicks ? upperVolumes.spend / lowerVolumes.clicks : 0;
  lower.cpm = upperVolumes.impressions ? (lowerVolumes.spend / upperVolumes.impressions) * 1000 : 0;
  upper.cpm = lowerVolumes.impressions ? (upperVolumes.spend / lowerVolumes.impressions) * 1000 : 0;
  lower.cpa = upperVolumes.conversions ? lowerVolumes.spend / upperVolumes.conversions : 0;
  upper.cpa = lowerVolumes.conversions ? upperVolumes.spend / lowerVolumes.conversions : 0;
  lower.frequency = upperVolumes.reach ? lowerVolumes.impressions / upperVolumes.reach : 0;
  upper.frequency = lowerVolumes.reach ? upperVolumes.impressions / lowerVolumes.reach : 0;
  return { lower, upper };
}

function confidenceFor(
  observed: number,
  expected: number,
  freshnessGap: number,
  coefficientOfVariation: number,
  hasSpend: boolean,
): { level: ConfidenceLevel; score: number; limitations: string[] } {
  const limitations: string[] = [];
  if (!hasSpend) limitations.push('Sem investimento no período.');
  if (observed < 3) limitations.push('Menos de 3 dias fechados observados.');
  if (freshnessGap > 1) limitations.push(`${freshnessGap} dias de defasagem na última observação.`);
  if (expected > observed) limitations.push(`${expected - observed} dias sem observação no intervalo.`);
  if (coefficientOfVariation > 0.75) limitations.push('Ritmo diário altamente volátil.');

  let score = 100;
  score -= Math.min(45, Math.max(0, expected - observed) * 8);
  score -= Math.min(30, freshnessGap * 10);
  if (observed < 7) score -= 20;
  if (coefficientOfVariation > 0.75) score -= 15;
  if (!hasSpend || observed < 3) score = Math.min(score, 25);
  score = Math.max(0, Math.round(score));
  const level: ConfidenceLevel = !hasSpend || observed < 3
    ? 'blocked'
    : score >= 80 ? 'high' : score >= 55 ? 'medium' : 'low';
  return { level, score, limitations };
}

export function projectMetrics(rows: MetricRow[], referenceDate: Date, now = new Date()): MetricProjection {
  const scoped = closedRows(rows, now).filter((row) => isSameMonth(new Date(row.date), referenceDate));
  const days = aggregateByDay(scoped);
  const current = aggregate(scoped);
  const monthDays = getDaysInMonth(referenceDate);
  const lastObserved = days.length ? new Date(`${days[days.length - 1].date}T12:00:00`) : null;
  const currentMonth = isSameMonth(referenceDate, now);
  const remainingDays = currentMonth && lastObserved
    ? Math.max(0, differenceInCalendarDays(endOfMonth(referenceDate), lastObserved))
    : 0;
  const expectedEnd = currentMonth ? lastClosedDate(now) : endOfMonth(referenceDate);
  const expectedDays = Math.max(0, differenceInCalendarDays(expectedEnd, startOfMonth(referenceDate)) + 1);

  const keys: AdditiveKey[] = ['spend', 'impressions', 'clicks', 'conversions', 'reach'];
  const central = {} as Pick<AggregatedMetrics, AdditiveKey>;
  const lower = {} as Pick<AggregatedMetrics, AdditiveKey>;
  const upper = {} as Pick<AggregatedMetrics, AdditiveKey>;
  const paces = new Map<AdditiveKey, ReturnType<typeof metricPace>>();
  keys.forEach((key) => {
    const pace = metricPace(days, key);
    paces.set(key, pace);
    const base = number(current[key]);
    central[key] = base + pace.used * remainingDays;
    lower[key] = Math.max(base, base + Math.max(0, pace.used - pace.mad) * remainingDays);
    upper[key] = base + (pace.used + pace.mad) * remainingDays;
  });

  const spendPace = paces.get('spend')!;
  const volatility = spendPace.used ? spendPace.mad / spendPace.used : 0;
  const freshnessGap = lastObserved && currentMonth
    ? Math.max(0, differenceInCalendarDays(lastClosedDate(now), lastObserved))
    : 0;
  const confidence = confidenceFor(days.length, expectedDays, freshnessGap, volatility, current.spend > 0);
  const bounds = boundedMetrics(lower, upper);

  return {
    current,
    projected: fromVolumes(central),
    lower: bounds.lower,
    upper: bounds.upper,
    daysInMonth: monthDays,
    remainingDays,
    evidence: {
      observedDays: days.length,
      expectedDays,
      missingDays: Math.max(0, expectedDays - days.length),
      lastClosedDate: lastObserved ? format(lastObserved, 'yyyy-MM-dd') : null,
      recentPace: spendPace.recent,
      overallPace: spendPace.overall,
      volatility,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      limitations: confidence.limitations,
    },
  };
}

const additiveKeys: Array<keyof AggregatedMetrics> = ['spend', 'impressions', 'clicks', 'conversions', 'reach'];
const rateKeys: Array<keyof AggregatedMetrics> = ['ctr', 'cpc', 'cpm', 'cpa', 'frequency'];

export function compareEquivalentMonth(
  rows: MetricRow[],
  currentFrom: Date,
  currentTo: Date,
  now = new Date(),
): MetricComparison {
  const safeTo = currentTo > lastClosedDate(now) ? lastClosedDate(now) : currentTo;
  const previousFrom = subMonths(currentFrom, 1);
  const previousMonthEnd = endOfMonth(previousFrom);
  const requestedPreviousTo = endOfDay(new Date(previousFrom.getFullYear(), previousFrom.getMonth(), safeTo.getDate()));
  const previousTo = requestedPreviousTo > previousMonthEnd ? previousMonthEnd : requestedPreviousTo;
  const closed = closedRows(rows, now);
  const currentRows = closed.filter((row) => {
    const date = new Date(row.date);
    return date >= currentFrom && date <= safeTo;
  });
  const previousRows = closed.filter((row) => {
    const date = new Date(row.date);
    return date >= previousFrom && date <= previousTo;
  });
  const current = aggregate(currentRows);
  const previous = aggregate(previousRows);
  const absolute = {} as AggregatedMetrics;
  [...additiveKeys, ...rateKeys].forEach((key) => { absolute[key] = current[key] - previous[key]; });
  const percent: MetricComparison['percent'] = {};
  [...additiveKeys, ...rateKeys].forEach((key) => {
    percent[key] = previous[key] ? ((current[key] - previous[key]) / previous[key]) * 100 : null;
  });
  const limitations: string[] = [];
  const currentDays = aggregateByDay(currentRows).length;
  const previousDays = aggregateByDay(previousRows).length;
  if (!previousRows.length) limitations.push('Sem baseline no mês anterior.');
  if (currentDays !== previousDays) limitations.push(`Cobertura diferente: ${currentDays} vs ${previousDays} dias.`);
  return {
    current,
    previous,
    absolute,
    percent,
    currentLabel: `${format(currentFrom, 'dd/MM')}–${format(safeTo, 'dd/MM')}`,
    previousLabel: `${format(previousFrom, 'dd/MM')}–${format(previousTo, 'dd/MM')}`,
    comparable: previousRows.length > 0 && currentDays === previousDays,
    limitations,
  };
}

const pct = (value: number | null | undefined) => value == null ? null : Math.round(value * 10) / 10;

export function diagnoseEntity(
  entityKey: string,
  entityLabel: string,
  comparison: MetricComparison,
  projection: MetricProjection,
): DiagnosticSignal[] {
  const signals: DiagnosticSignal[] = [];
  const delta = comparison.percent;
  const confidence = projection.evidence.confidence;
  const add = (signal: Omit<DiagnosticSignal, 'id' | 'entityKey' | 'entityLabel' | 'confidence'>) => {
    signals.push({ ...signal, id: `${entityKey}-${signal.severity}-${signals.length}`, entityKey, entityLabel, confidence });
  };

  if (confidence === 'blocked') {
    add({
      severity: 'warning', signal: 'Leitura bloqueada por cobertura insuficiente',
      impact: 'Não há base segura para escala ou corte de investimento.',
      probableCause: 'Poucos dias fechados, ausência de spend ou lacuna de coleta.',
      evidence: projection.evidence.limitations,
      action: 'Validar coleta e aguardar ao menos três dias fechados.', priorityScore: 95, bucket: 'investigate',
    });
    return signals;
  }

  if ((delta.cpm ?? 0) > 15 && (delta.ctr ?? 0) > -5) add({
    severity: 'warning', signal: `CPM subiu ${pct(delta.cpm)}%`,
    impact: 'A entrega ficou mais cara mesmo sem perda relevante de CTR.',
    probableCause: 'Pressão de leilão, audiência ou posicionamento.',
    evidence: [`CPM ${pct(delta.cpm)}%`, `CTR ${pct(delta.ctr)}%`, comparison.previousLabel],
    action: 'Revisar grupos com CPM mais alto e distribuição por canal.', priorityScore: 72, bucket: 'monitor',
  });

  if ((delta.ctr ?? 0) < -12) add({
    severity: 'critical', signal: `CTR caiu ${Math.abs(pct(delta.ctr) || 0)}%`,
    impact: 'Menos cliques por impressão pressionam CPC e escala.',
    probableCause: projection.current.frequency > 3.5 ? 'Possível fadiga criativa.' : 'Perda de aderência entre criativo, oferta e audiência.',
    evidence: [`CTR ${pct(delta.ctr)}%`, `Frequência ${projection.current.frequency.toFixed(1)}`],
    action: 'Abrir anúncios e priorizar renovação dos criativos com pior CTR.', priorityScore: 88, bucket: 'act',
  });

  if ((delta.cpc ?? 0) < -10 && (delta.ctr ?? 0) > 10) add({
    severity: 'opportunity', signal: `CPC melhorou ${Math.abs(pct(delta.cpc) || 0)}%`,
    impact: 'A campanha gera mais tráfego com o mesmo investimento.',
    probableCause: 'Ganho de CTR compensou o custo de entrega.',
    evidence: [`CTR ${pct(delta.ctr)}%`, `CPC ${pct(delta.cpc)}%`, `CPM ${pct(delta.cpm)}%`],
    action: 'Verificar capacidade de orçamento antes de simular escala.', priorityScore: 80, bucket: 'act',
  });

  if (projection.current.spend > 100 && projection.current.conversions === 0) add({
    severity: 'critical', signal: 'Investimento sem conversão de plataforma',
    impact: 'Há gasto material sem evento atribuído no período.',
    probableCause: 'Ineficiência pós-clique ou falha de mensuração.',
    evidence: [`Spend R$ ${projection.current.spend.toFixed(2)}`, '0 conversões de plataforma'],
    action: 'Auditar evento antes de reduzir ou escalar verba.', priorityScore: 92, bucket: 'investigate',
  });

  if (projection.current.frequency > 3.5 && (delta.ctr ?? 0) < 0) add({
    severity: 'warning', signal: 'Frequência alta com CTR em queda',
    impact: 'A audiência pode estar saturando e encarecendo o clique.',
    probableCause: 'Fadiga de criativo ou público restrito.',
    evidence: [`Frequência ${projection.current.frequency.toFixed(1)}`, `CTR ${pct(delta.ctr)}%`],
    action: 'Rotacionar criativos e revisar expansão de audiência.', priorityScore: 84, bucket: 'act',
  });

  if (!signals.length) add({
    severity: 'info', signal: 'Sem desvio material detectado',
    impact: 'O comportamento está dentro das regras de variação atuais.',
    probableCause: 'Estabilidade entre custo de entrega e resposta.',
    evidence: [`${comparison.currentLabel} vs ${comparison.previousLabel}`],
    action: 'Manter acompanhamento; nenhuma ação imediata.', priorityScore: 25, bucket: 'monitor',
  });
  return signals;
}

export function simulateIncrementalSpend(
  projection: MetricProjection,
  amount: number,
): { impressions: [number, number]; clicks: [number, number]; conversions: [number, number] | null } {
  const metrics = projection.current;
  const volatility = Math.min(0.5, Math.max(0.1, projection.evidence.volatility));
  const impressions = metrics.cpm > 0 ? (amount / metrics.cpm) * 1000 : 0;
  const clicks = metrics.cpc > 0 ? amount / metrics.cpc : 0;
  const conversions = metrics.cpa > 0 ? amount / metrics.cpa : 0;
  const range = (value: number): [number, number] => [Math.max(0, value * (1 - volatility)), value * (1 + volatility)];
  return { impressions: range(impressions), clicks: range(clicks), conversions: metrics.cpa > 0 ? range(conversions) : null };
}

export function previousMonthRange(from: Date, to: Date) {
  return { from: subMonths(from, 1), to: subMonths(to, 1), next: addMonths(from, 1) };
}
