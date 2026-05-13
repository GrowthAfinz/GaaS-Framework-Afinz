/**
 * =============================================================================
 * PERFORMANCE ANALYZER - Motor de Análise de Performance
 * =============================================================================
 *
 * Responsabilidades:
 * 1. Análise de performance histórica (por métrica, período, filtros)
 * 2. Detecção de tendências (trending up/down)
 * 3. Padrões temporais (dia da semana, hora do dia)
 * 4. Estatísticas (média, mediana, desvio padrão, outliers)
 * 5. Comparações (seu setup vs alternativas)
 *
 * Dados de entrada: Array de ActivityRow (histórico de disparos)
 * Dados de saída: Snapshots de performance com insights
 */

import { ActivityRow } from '../../types/activity';
import { ProjectableMetric, METRIC_FIELD_MAP } from './types';

// Re-exportar ProjectableMetric para compatibilidade com imports existentes
export type { ProjectableMetric } from './types';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface PerformanceSnapshot {
  /** Métrica analisada */
  metric: ProjectableMetric;

  /** Filtros aplicados */
  filters: PerformanceFilters;

  /** Valores históricos (array de pontos no tempo) */
  timeseries: TimeSeriesPoint[];

  /** Estatísticas descritivas */
  stats: PerformanceStats;

  /** Análise de tendência */
  trend: TrendAnalysis;

  /** Padrões por dia da semana */
  dayOfWeekPatterns: DayOfWeekPattern[];

  /** Padrões por hora do dia */
  hourOfDayPatterns: HourOfDayPattern[];

  /** Saúde dos dados */
  dataQuality: DataQualityAssessment;

  /** Data/hora da análise */
  computedAt: string;

  /** Número de disparos que contribuíram */
  sampleSize: number;
}

export interface PerformanceFilters {
  /** Business Unit (B2C, B2B2C, etc) */
  bu?: string;

  /** Canal (Email, SMS, WhatsApp, Push) */
  canal?: string;

  /** Segmento (CRM, Abandonados, etc) */
  segmento?: string;

  /** Jornada (Aquisição, Retenção, etc) */
  jornada?: string;

  /** Perfil de Crédito */
  perfilCredito?: string;

  /** Oferta */
  oferta?: string;

  /** Período de análise em dias (ex: 30, 90, 180) */
  windowDays: number;

  /** Apenas disparos com status Realizado? */
  onlyCompleted?: boolean;
}

export interface TimeSeriesPoint {
  /** Data do disparo */
  date: Date;

  /** Valor da métrica nesta data */
  value: number;

  /** Número de disparos agregados nesta data */
  count: number;

  /** ID da atividade (se ponto único) ou 'aggregated' */
  sourceId: string;

  /** Volume (para cálculos ponderados) */
  volume?: number;
}

export interface PerformanceStats {
  /** Média aritmética */
  mean: number;

  /** Valor mediano (mais robusto a outliers) */
  median: number;

  /** Percentil 25 */
  p25: number;

  /** Percentil 75 */
  p75: number;

  /** Desvio padrão */
  stdDev: number;

  /** Intervalo de confiança 95% */
  confidenceInterval: {
    min: number;
    max: number;
  };

  /** Valores mínimo e máximo */
  min: number;
  max: number;

  /** IQR para detecção de outliers */
  iqr: number;

  /** Outliers detectados */
  outliers: number[];

  /** Valor mediano excluindo outliers */
  medianWithoutOutliers: number;

  /** Coeficiente de variação (desvio / média) */
  coefficientOfVariation: number;
}

export interface TrendAnalysis {
  /** Inclinação da linha de regressão (mudança por dia) */
  slope: number;

  /** R-squared (qualidade do fit) */
  rSquared: number;

  /** Significância estatística (é real ou ruído?) */
  isSignificant: boolean;

  /** Direção: 'up', 'down', 'stable' */
  direction: 'up' | 'down' | 'stable';

  /** Descrição em texto */
  description: string;

  /** Projeção para próximos 30 dias se trend continuar */
  projection30days?: number;

  /** Mudança percentual nos últimos 30 dias */
  change30days: number;
}

export interface DayOfWeekPattern {
  /** 0 = Domingo, 1 = Segunda, ..., 6 = Sábado */
  dayOfWeek: number;

  /** Nome do dia */
  dayName: string;

  /** Média de performance neste dia */
  average: number;

  /** Multiplicador relativo à média geral (ex: 1.15 = 15% melhor) */
  multiplier: number;

  /** Número de disparos neste dia */
  sampleCount: number;

  /** Desvio padrão */
  stdDev: number;

  /** Confiança desta estimativa */
  confidence: number; // 0-100%
}

export interface HourOfDayPattern {
  /** 0-23 */
  hour: number;

  /** "06h-12h", "12h-18h", "18h-06h" */
  timeSlot: string;

  /** Média de performance nesta hora */
  average: number;

  /** Multiplicador relativo à média */
  multiplier: number;

  /** Número de disparos */
  sampleCount: number;

  /** Desvio padrão */
  stdDev: number;

  /** Confiança */
  confidence: number; // 0-100%
}

export interface DataQualityAssessment {
  /** 'high' (>50 amostras, baixo desvio), 'medium', 'low' */
  level: 'high' | 'medium' | 'low';

  /** Motivos da classificação */
  reasons: string[];

  /** Porcentagem de valores não-nulos */
  completeness: number;

  /** Número de outliers detectados */
  outlierCount: number;

  /** Recomendações para o usuário */
  recommendation: string;
}

export interface AlternativeComparison {
  /** Alteração realizada */
  change: string;

  /** Campo que foi alterado */
  changedField: string;

  /** Valor anterior */
  previousValue: any;

  /** Novo valor */
  newValue: any;

  /** Performance nesta alternativa */
  performance: PerformanceSnapshot;

  /** Melhoria relativa (ex: +15% melhor) */
  improvementPercent: number;

  /** Confiança nesta projeção */
  confidence: number;

  /** Número de disparos similares */
  sampleCount: number;
}

// =============================================================================
// PERFORMANCE ANALYZER
// =============================================================================

export class PerformanceAnalyzer {
  private activities: ActivityRow[];
  private cache: Map<string, PerformanceSnapshot>;

  constructor() {
    this.activities = [];
    this.cache = new Map();
  }

  /**
   * Inicializa o analisador com histórico de atividades
   */
  public initialize(activities: ActivityRow[]): void {
    this.activities = activities || [];
    this.cache.clear();
  }

  /**
   * Analisa performance de uma métrica com filtros específicos
   *
   * @example
   * const perf = analyzer.analyzePerformance(
   *   { bu: 'B2C', canal: 'SMS', segmento: 'CRM', jornada: 'Retenção' },
   *   'taxaConversao',
   *   90
   * );
   * // Resultado: 23 disparos similares, média 15.1%, tendência -0.3%/mês
   */
  public analyzePerformance(
    filters: PerformanceFilters,
    metric: ProjectableMetric
  ): PerformanceSnapshot {
    // Verificar cache
    const cacheKey = this.getCacheKey(filters, metric);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Filtrar atividades relevantes
    const relevant = this.filterActivities(filters);

    if (relevant.length === 0) {
      return this.createEmptySnapshot(filters, metric);
    }

    // Extrair série temporal
    const timeseries = this.extractTimeSeries(relevant, metric, filters.windowDays);

    if (timeseries.length === 0) {
      return this.createEmptySnapshot(filters, metric);
    }

    // Calcular estatísticas
    const values = timeseries.map((p) => p.value);
    const stats = this.calculateStats(values);

    // Detectar tendências
    const trend = this.detectTrend(timeseries);

    // Padrões por dia da semana
    const dayPatterns = this.analyzeDayOfWeekPatterns(relevant, metric, filters.windowDays);

    // Padrões por hora do dia
    const hourPatterns = this.analyzeHourOfDayPatterns(relevant, metric, filters.windowDays);

    // Qualidade dos dados
    const dataQuality = this.assessDataQuality(relevant, values, stats);

    const snapshot: PerformanceSnapshot = {
      metric,
      filters,
      timeseries,
      stats,
      trend,
      dayOfWeekPatterns: dayPatterns,
      hourOfDayPatterns: hourPatterns,
      dataQuality,
      computedAt: new Date().toISOString(),
      sampleSize: relevant.length,
    };

    // Armazenar em cache (5 minutos)
    this.cache.set(cacheKey, snapshot);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

    return snapshot;
  }

  /**
   * Gera comparação entre setup atual e alternativas
   */
  public compareAlternatives(
    baselineFilters: PerformanceFilters,
    metric: ProjectableMetric,
    alternatives: Array<{ field: string; value: any }>
  ): AlternativeComparison[] {
    const baseline = this.analyzePerformance(baselineFilters, metric);
    const baselineValue = baseline.stats.median;

    const results: AlternativeComparison[] = [];

    for (const alt of alternatives) {
      const altFilters: PerformanceFilters = {
        ...baselineFilters,
        [alt.field]: alt.value,
      };

      const altPerf = this.analyzePerformance(altFilters, metric);
      const altValue = altPerf.stats.median;

      const improvementPercent = ((altValue - baselineValue) / baselineValue) * 100;

      results.push({
        change: `${alt.field}: ${alt.value}`,
        changedField: alt.field,
        previousValue: baselineFilters[alt.field as keyof PerformanceFilters],
        newValue: alt.value,
        performance: altPerf,
        improvementPercent,
        confidence: this.calculateComparisonConfidence(
          baseline.sampleSize,
          altPerf.sampleSize,
          baseline.stats.stdDev,
          altPerf.stats.stdDev
        ),
        sampleCount: altPerf.sampleSize,
      });
    }

    // Ordenar por melhoria (melhor primeiro)
    results.sort((a, b) => b.improvementPercent - a.improvementPercent);

    return results;
  }

  /**
   * Retorna padrões específicos por dia da semana
   */
  public getTemporalMultipliers(
    filters: Omit<PerformanceFilters, 'windowDays'>,
    metric: ProjectableMetric
  ): DayOfWeekPattern[] {
    const fullFilters: PerformanceFilters = {
      ...filters,
      windowDays: 90,
      onlyCompleted: true,
    };

    const relevant = this.filterActivities(fullFilters);

    if (relevant.length < 5) {
      return []; // Dados insuficientes
    }

    return this.analyzeDayOfWeekPatterns(relevant, metric, 90);
  }

  /**
   * Retorna os melhores e piores dias/horas para disparo
   */
  public getOptimalTiming(
    filters: Omit<PerformanceFilters, 'windowDays'>,
    metric: ProjectableMetric
  ): {
    bestDayOfWeek: DayOfWeekPattern | null;
    worstDayOfWeek: DayOfWeekPattern | null;
    bestHour: HourOfDayPattern | null;
    worstHour: HourOfDayPattern | null;
  } {
    const fullFilters: PerformanceFilters = {
      ...filters,
      windowDays: 90,
      onlyCompleted: true,
    };

    const relevant = this.filterActivities(fullFilters);

    const dayPatterns = this.analyzeDayOfWeekPatterns(relevant, metric, 90);
    const hourPatterns = this.analyzeHourOfDayPatterns(relevant, metric, 90);

    return {
      bestDayOfWeek:
        dayPatterns.length > 0
          ? dayPatterns.reduce((a, b) => (a.average > b.average ? a : b))
          : null,
      worstDayOfWeek:
        dayPatterns.length > 0
          ? dayPatterns.reduce((a, b) => (a.average < b.average ? a : b))
          : null,
      bestHour:
        hourPatterns.length > 0
          ? hourPatterns.reduce((a, b) => (a.average > b.average ? a : b))
          : null,
      worstHour:
        hourPatterns.length > 0
          ? hourPatterns.reduce((a, b) => (a.average < b.average ? a : b))
          : null,
    };
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - FILTRAGEM
  // ===========================================================================

  private filterActivities(filters: PerformanceFilters): ActivityRow[] {
    let result = [...this.activities];

    // Filtrar por status
    if (filters.onlyCompleted !== false) {
      result = result.filter((a) => a.status === 'Realizado');
    }

    // Filtrar por janela temporal
    const now = new Date();
    const windowStart = new Date(now.getTime() - filters.windowDays * 24 * 60 * 60 * 1000);

    result = result.filter((a) => {
      const date = this.parseDate(a['Data de Disparo']);
      if (!date) return false; // Excluir se data inválida/undefined
      return date >= windowStart && date <= now;
    });

    // Filtrar por dimensões
    if (filters.bu) {
      result = result.filter((a) => this.normalizeString(a.BU) === this.normalizeString(filters.bu!));
    }

    if (filters.canal) {
      result = result.filter((a) => this.normalizeString(a.Canal) === this.normalizeString(filters.canal!));
    }

    if (filters.segmento) {
      result = result.filter((a) => this.normalizeString(a.Segmento) === this.normalizeString(filters.segmento!));
    }

    if (filters.jornada) {
      result = result.filter((a) => this.normalizeString(a.jornada) === this.normalizeString(filters.jornada!));
    }

    if (filters.perfilCredito) {
      result = result.filter(
        (a) =>
          a['Perfil de Crédito'] && this.normalizeString(a['Perfil de Crédito']) === this.normalizeString(filters.perfilCredito!)
      );
    }

    if (filters.oferta) {
      result = result.filter((a) => a.Oferta && this.normalizeString(a.Oferta) === this.normalizeString(filters.oferta!));
    }

    return result;
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - SÉRIE TEMPORAL
  // ===========================================================================

  private extractTimeSeries(
    activities: ActivityRow[],
    metric: ProjectableMetric,
    windowDays: number
  ): TimeSeriesPoint[] {
    const metricField = METRIC_FIELD_MAP[metric] as keyof ActivityRow;

    // Agrupar por data
    const byDate = new Map<string, { values: number[]; ids: string[]; volumes: number[] }>();

    for (const activity of activities) {
      const date = this.parseDate(activity['Data de Disparo']);
      if (!date) continue; // Pular se data inválida/undefined

      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const value = this.extractMetricValue(activity, metricField);
      if (value === null) continue;

      const volume = (activity['Base Total'] as number) || 1;

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, { values: [], ids: [], volumes: [] });
      }

      byDate.get(dateKey)!.values.push(value);
      byDate.get(dateKey)!.ids.push(activity.id);
      byDate.get(dateKey)!.volumes.push(volume);
    }

    // Converter para TimeSeriesPoints
    const points: TimeSeriesPoint[] = [];

    for (const [dateKey, { values, ids, volumes }] of byDate.entries()) {
      const date = new Date(dateKey);

      // Se múltiplos disparos no mesmo dia, usar média ponderada
      const totalVolume = volumes.reduce((a, b) => a + b, 0);
      const weightedAvg = values.reduce((sum, v, i) => sum + v * (volumes[i] / totalVolume), 0);

      points.push({
        date,
        value: weightedAvg,
        count: values.length,
        sourceId: ids.length === 1 ? ids[0] : 'aggregated',
        volume: totalVolume,
      });
    }

    // Ordenar por data
    points.sort((a, b) => a.date.getTime() - b.date.getTime());

    return points;
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - ESTATÍSTICAS
  // ===========================================================================

  private calculateStats(values: number[]): PerformanceStats {
    if (values.length === 0) {
      return this.createEmptyStats();
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Mediana
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    // Percentis
    const p25Index = Math.floor(n * 0.25);
    const p75Index = Math.floor(n * 0.75);
    const p25 = sorted[p25Index];
    const p75 = sorted[p75Index];
    const iqr = p75 - p25;

    // Desvio padrão
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Outliers (método IQR)
    const lowerBound = p25 - 1.5 * iqr;
    const upperBound = p75 + 1.5 * iqr;
    const outliers = values.filter((v) => v < lowerBound || v > upperBound);

    // Mediana sem outliers
    const cleanValues = values.filter((v) => v >= lowerBound && v <= upperBound);
    const medianWithoutOutliers =
      cleanValues.length === 0
        ? median
        : cleanValues.length % 2 === 0
        ? (cleanValues[cleanValues.length / 2 - 1] + cleanValues[cleanValues.length / 2]) / 2
        : cleanValues[Math.floor(cleanValues.length / 2)];

    // Intervalo de confiança 95%
    const se = stdDev / Math.sqrt(n);
    const ci = 1.96 * se;

    return {
      mean,
      median,
      p25,
      p75,
      stdDev,
      confidenceInterval: {
        min: Math.max(0, mean - ci),
        max: mean + ci,
      },
      min: sorted[0],
      max: sorted[n - 1],
      iqr,
      outliers,
      medianWithoutOutliers,
      coefficientOfVariation: mean !== 0 ? stdDev / mean : 0,
    };
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - TENDÊNCIAS
  // ===========================================================================

  private detectTrend(timeseries: TimeSeriesPoint[]): TrendAnalysis {
    if (timeseries.length < 2) {
      return this.createEmptyTrend();
    }

    // Regressão linear simples
    const n = timeseries.length;
    const xValues = timeseries.map((_, i) => i);
    const yValues = timeseries.map((p) => p.value);

    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

    const slope = numerator / denominator;

    // R-squared
    const ssRes = yValues.reduce((sum, y, i) => {
      const predicted = slope * (i - xMean) + yMean;
      return sum + Math.pow(y - predicted, 2);
    }, 0);

    const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // Determinar significância (R² > 0.3 é considerado significativo)
    const isSignificant = rSquared > 0.3 && Math.abs(slope) > yMean * 0.01; // >1% mudança ao dia

    // Direção
    let direction: 'up' | 'down' | 'stable';
    if (isSignificant) {
      direction = slope > 0 ? 'up' : 'down';
    } else {
      direction = 'stable';
    }

    // Mudança percentual nos últimos 30 dias
    const recentDays = Math.min(30, timeseries.length);
    const firstValue = timeseries[timeseries.length - recentDays].value;
    const lastValue = timeseries[timeseries.length - 1].value;
    const change30days = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Projeção 30 dias
    const projection30days = slope * 30 + timeseries[timeseries.length - 1].value;

    return {
      slope,
      rSquared,
      isSignificant,
      direction,
      description: this.generateTrendDescription(slope, rSquared, yMean, isSignificant),
      change30days,
      projection30days: projection30days > 0 ? projection30days : 0,
    };
  }

  private generateTrendDescription(slope: number, rSquared: number, mean: number, isSignificant: boolean): string {
    if (!isSignificant) {
      return 'Performance estável (sem tendência clara)';
    }

    const dailyChangePercent = (slope / mean) * 100;
    const monthlyChangePercent = dailyChangePercent * 30;

    if (slope > 0) {
      return `Performance em alta: +${Math.abs(monthlyChangePercent).toFixed(1)}%/mês`;
    } else {
      return `Performance em queda: ${monthlyChangePercent.toFixed(1)}%/mês`;
    }
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - PADRÕES TEMPORAIS
  // ===========================================================================

  private analyzeDayOfWeekPatterns(
    activities: ActivityRow[],
    metric: ProjectableMetric,
    windowDays: number
  ): DayOfWeekPattern[] {
    const metricField = METRIC_FIELD_MAP[metric] as keyof ActivityRow;
    const patterns: DayOfWeekPattern[] = [];

    // Agrupar por dia da semana
    const byDay = new Map<number, number[]>();
    for (let i = 0; i < 7; i++) {
      byDay.set(i, []);
    }

    for (const activity of activities) {
      const date = this.parseDate(activity['Data de Disparo']);
      if (!date) continue; // Pular se data inválida/undefined

      const dayOfWeek = date.getDay();

      const value = this.extractMetricValue(activity, metricField);
      if (value !== null) {
        byDay.get(dayOfWeek)!.push(value);
      }
    }

    // Calcular média geral
    const allValues = Array.from(byDay.values()).flat();
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    // Gerar padrão para cada dia
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const values = byDay.get(dayOfWeek)!;

      if (values.length === 0) continue;

      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      patterns.push({
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        average,
        multiplier: overallMean !== 0 ? average / overallMean : 1,
        sampleCount: values.length,
        stdDev,
        confidence: Math.min(100, 40 + Math.log(values.length) * 15), // Aumenta com amostras
      });
    }

    return patterns;
  }

  private analyzeHourOfDayPatterns(
    activities: ActivityRow[],
    metric: ProjectableMetric,
    windowDays: number
  ): HourOfDayPattern[] {
    const metricField = METRIC_FIELD_MAP[metric] as keyof ActivityRow;
    const patterns: HourOfDayPattern[] = [];

    // Agrupar por time slot (3 períodos: manhã, tarde, noite)
    const bySlot = new Map<string, { hour: number; values: number[] }>();

    for (const activity of activities) {
      const horario = activity['Horário de Disparo'];
      if (!horario) continue; // Só processa se tem horário

      const hour = parseInt(horario.split(':')[0], 10);
      let slot = '';

      if (hour >= 6 && hour < 12) {
        slot = '06h-12h';
      } else if (hour >= 12 && hour < 18) {
        slot = '12h-18h';
      } else {
        slot = '18h-06h';
      }

      const value = this.extractMetricValue(activity, metricField);
      if (value === null) continue;

      if (!bySlot.has(slot)) {
        bySlot.set(slot, { hour, values: [] });
      }

      bySlot.get(slot)!.values.push(value);
    }

    // Se não há dados de horário, retornar vazio
    if (bySlot.size === 0) {
      return [];
    }

    // Calcular média geral
    const allValues = Array.from(bySlot.values())
      .map((s) => s.values)
      .flat();
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    // Gerar padrão para cada slot
    for (const [slot, { hour, values }] of bySlot.entries()) {
      if (values.length === 0) continue;

      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      patterns.push({
        hour,
        timeSlot: slot,
        average,
        multiplier: overallMean !== 0 ? average / overallMean : 1,
        sampleCount: values.length,
        stdDev,
        confidence: Math.min(100, 40 + Math.log(values.length) * 15),
      });
    }

    // Ordenar por hora
    patterns.sort((a, b) => a.hour - b.hour);

    return patterns;
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - QUALIDADE DE DADOS
  // ===========================================================================

  private assessDataQuality(
    activities: ActivityRow[],
    values: number[],
    stats: PerformanceStats
  ): DataQualityAssessment {
    const reasons: string[] = [];
    let level: 'high' | 'medium' | 'low' = 'high';

    // Critério 1: Quantidade de amostras
    if (activities.length < 5) {
      reasons.push('Poucas amostras (< 5)');
      level = 'low';
    } else if (activities.length < 15) {
      reasons.push('Amostra limitada (< 15)');
      level = 'medium';
    }

    // Critério 2: Completude de dados
    const completeness = (values.length / activities.length) * 100;
    if (completeness < 0.7) {
      reasons.push(`Dados incompletos (${completeness.toFixed(0)}% preenchidos)`);
      if (level !== 'low') level = 'medium';
    }

    // Critério 3: Variabilidade
    if (stats.coefficientOfVariation > 0.5) {
      reasons.push('Alta variabilidade (dados barulhentos)');
      if (level !== 'low') level = 'medium';
    }

    // Critério 4: Outliers
    if (stats.outliers.length > 0 && stats.outliers.length / values.length > 0.2) {
      reasons.push(`Muitos outliers (${stats.outliers.length} detectados)`);
      if (level !== 'low') level = 'medium';
    }

    // Recomendação
    let recommendation = 'Dados confiáveis para tomada de decisão.';
    if (level === 'low') {
      recommendation = 'Cuidado: dados limitados. Considere aguardar mais disparos similares.';
    } else if (level === 'medium') {
      recommendation = 'Dados moderadamente confiáveis. Use como orientação, não como certeza.';
    }

    return {
      level,
      reasons,
      completeness,
      outlierCount: stats.outliers.length,
      recommendation,
    };
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS - UTILITÁRIOS
  // ===========================================================================

  private extractMetricValue(activity: ActivityRow, field: keyof ActivityRow): number | null {
    const value = activity[field];

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value < 0 ? null : value;
    }

    if (typeof value === 'string') {
      // Remover símbolos de percentual, R$, etc
      const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) || num < 0 ? null : num;
    }

    return null;
  }

  private parseDate(dateStr: string | undefined | null): Date | null {
    // Guard contra undefined/null
    if (!dateStr) {
      return null;
    }

    // Tentar DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }

    // Tentar YYYY-MM-DD
    return new Date(dateStr);
  }

  private normalizeString(str: string): string {
    return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private calculateComparisonConfidence(
    sizeA: number,
    sizeB: number,
    stdDevA: number,
    stdDevB: number
  ): number {
    // Fórmula heurística: maior confiança com mais amostras e menos variação
    const sizeConfidence = Math.min(100, (Math.min(sizeA, sizeB) / 10) * 40);
    const varianceConfidence = Math.min(100, 100 - (Math.max(stdDevA, stdDevB) * 100));

    return (sizeConfidence + varianceConfidence) / 2;
  }

  private getCacheKey(filters: PerformanceFilters, metric: ProjectableMetric): string {
    return JSON.stringify({ filters, metric });
  }

  private createEmptySnapshot(filters: PerformanceFilters, metric: ProjectableMetric): PerformanceSnapshot {
    return {
      metric,
      filters,
      timeseries: [],
      stats: this.createEmptyStats(),
      trend: this.createEmptyTrend(),
      dayOfWeekPatterns: [],
      hourOfDayPatterns: [],
      dataQuality: {
        level: 'low',
        reasons: ['Nenhum dado encontrado para estes filtros'],
        completeness: 0,
        outlierCount: 0,
        recommendation: 'Ajuste os filtros ou aguarde mais disparos similares.',
      },
      computedAt: new Date().toISOString(),
      sampleSize: 0,
    };
  }

  private createEmptyStats(): PerformanceStats {
    return {
      mean: 0,
      median: 0,
      p25: 0,
      p75: 0,
      stdDev: 0,
      confidenceInterval: { min: 0, max: 0 },
      min: 0,
      max: 0,
      iqr: 0,
      outliers: [],
      medianWithoutOutliers: 0,
      coefficientOfVariation: 0,
    };
  }

  private createEmptyTrend(): TrendAnalysis {
    return {
      slope: 0,
      rSquared: 0,
      isSignificant: false,
      direction: 'stable',
      description: 'Dados insuficientes para análise de tendência',
      change30days: 0,
    };
  }
}
