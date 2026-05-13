/**
 * =============================================================================
 * DATA PROCESSOR
 * =============================================================================
 *
 * Processa dados brutos do ActivityRow para formato analisavel
 * - Normalizacao de features
 * - Extracao de metricas
 * - Calculo de pesos temporais
 */

import { ActivityRow } from '../../types/activity';
import {
    ProcessedActivity,
    ProjectableMetric,
    METRIC_FIELD_MAP,
    DIMENSION_FIELD_MAP,
    SimilarityDimension,
    OrchestratorConfig,
    DEFAULT_CONFIG
} from './types';

/**
 * Processa uma lista de activities para analise
 */
export function processActivities(
    activities: ActivityRow[],
    config: OrchestratorConfig = DEFAULT_CONFIG
): ProcessedActivity[] {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.temporalWindow);

    return activities
        .map(activity => processActivity(activity, now, config))
        .filter((pa): pa is ProcessedActivity => pa !== null)
        .filter(pa => pa.dispatchDate >= cutoffDate);
}

/**
 * Processa uma activity individual
 */
function processActivity(
    activity: ActivityRow,
    referenceDate: Date,
    config: OrchestratorConfig
): ProcessedActivity | null {
    // Validar data de disparo
    const dispatchDateStr = activity['Data de Disparo'];
    if (!dispatchDateStr) return null;

    const dispatchDate = parseDate(dispatchDateStr);
    if (!dispatchDate || isNaN(dispatchDate.getTime())) return null;

    // Extrair features
    const features = extractFeatures(activity);

    // Extrair metricas
    const metrics = extractMetrics(activity);

    // Calcular peso temporal
    const temporalWeight = calculateTemporalWeight(
        dispatchDate,
        referenceDate,
        config.temporalDecayFactor,
        config.temporalWindow
    );

    return {
        id: activity.id || activity['Activity name / Taxonomia'],
        raw: activity,
        features,
        metrics,
        temporalWeight,
        dispatchDate
    };
}

/**
 * Extrai features normalizadas de uma activity
 */
function extractFeatures(activity: ActivityRow): Record<string, string | number> {
    const features: Record<string, string | number> = {};

    // Dimensoes categoricas
    const dimensions: SimilarityDimension[] = [
        'BU', 'Segmento', 'Canal', 'Jornada', 'Perfil_Credito',
        'Oferta', 'Promocional', 'Parceiro', 'Subgrupo',
        'Etapa_Aquisicao', 'Produto'
    ];

    dimensions.forEach(dim => {
        const field = DIMENSION_FIELD_MAP[dim];
        const value = activity[field];
        if (value !== undefined && value !== null && value !== '') {
            features[dim] = normalizeString(String(value));
        }
    });

    // Features temporais
    const dispatchDate = parseDate(activity['Data de Disparo']);
    if (dispatchDate) {
        features['DayOfWeek'] = dispatchDate.getDay();
        features['Month'] = dispatchDate.getMonth() + 1;
        features['Quarter'] = Math.floor(dispatchDate.getMonth() / 3) + 1;
    }

    // Horario
    const horario = activity['Horário de Disparo'];
    if (horario) {
        const hour = parseInt(horario.split(':')[0], 10);
        if (!isNaN(hour)) {
            features['Hour'] = hour;
            features['TimeSlot'] = getTimeSlot(hour);
        }
    }

    return features;
}

/**
 * Extrai metricas de uma activity
 */
function extractMetrics(activity: ActivityRow): Record<ProjectableMetric, number> {
    const metrics: Partial<Record<ProjectableMetric, number>> = {};

    const metricKeys = Object.keys(METRIC_FIELD_MAP) as ProjectableMetric[];

    metricKeys.forEach(metric => {
        const field = METRIC_FIELD_MAP[metric];
        const value = activity[field];
        metrics[metric] = parseNumber(value);
    });

    // Calculos derivados
    const baseTotal = metrics.volume || 0;
    const baseAcionavel = metrics.baseAcionavel || 0;

    // Taxa de conversao (se nao existir, calcular)
    if (!metrics.taxaConversao && metrics.cartoesGerados && baseTotal) {
        metrics.taxaConversao = (metrics.cartoesGerados / baseTotal) * 100;
    }

    // CAC (se nao existir, calcular)
    if (!metrics.cac && metrics.cartoesGerados) {
        const custoOferta = parseNumber(activity['Custo Total da Oferta']);
        const custoCanal = parseNumber(activity['Custo total canal']);
        const custoTotal = custoOferta + custoCanal;
        if (custoTotal > 0) {
            metrics.cac = custoTotal / metrics.cartoesGerados;
        }
    }

    // Base acionavel (se nao existir, estimar)
    if (!metrics.baseAcionavel && baseTotal) {
        const taxaEntrega = metrics.taxaEntrega || 0.78;
        metrics.baseAcionavel = baseTotal * taxaEntrega;
    }

    return metrics as Record<ProjectableMetric, number>;
}

/**
 * Calcula peso temporal com decaimento exponencial
 */
function calculateTemporalWeight(
    dispatchDate: Date,
    referenceDate: Date,
    decayFactor: number,
    windowDays: number
): number {
    const daysDiff = Math.floor(
        (referenceDate.getTime() - dispatchDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0) return 1; // Datas futuras tem peso maximo
    if (daysDiff > windowDays) return 0; // Fora da janela

    // Decaimento exponencial: e^(-lambda * t)
    // lambda = -ln(decayFactor) / windowDays
    const lambda = -Math.log(decayFactor) / windowDays;
    return Math.exp(-lambda * daysDiff);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse de data flexivel (YYYY-MM-DD ou DD/MM/YYYY)
 */
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;

    // Tentar formato ISO
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Tentar formato brasileiro DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        date = new Date(
            parseInt(parts[2], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[0], 10)
        );
        if (!isNaN(date.getTime())) return date;
    }

    return null;
}

/**
 * Parse de numero flexivel
 */
function parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    let str = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

/**
 * Normaliza string para comparacao
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Retorna slot de tempo (manha, tarde, noite)
 */
function getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'manha';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noite';
}

// =============================================================================
// AGREGADORES
// =============================================================================

/**
 * Agrupa activities por uma dimensao
 */
export function groupByDimension(
    activities: ProcessedActivity[],
    dimension: SimilarityDimension
): Map<string, ProcessedActivity[]> {
    const groups = new Map<string, ProcessedActivity[]>();

    activities.forEach(activity => {
        const value = String(activity.features[dimension] || 'undefined');
        const existing = groups.get(value) || [];
        existing.push(activity);
        groups.set(value, existing);
    });

    return groups;
}

/**
 * Calcula estatisticas de uma metrica
 */
export function calculateMetricStats(
    activities: ProcessedActivity[],
    metric: ProjectableMetric
): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    count: number;
    weightedMean: number;
} {
    const values = activities
        .map(a => ({ value: a.metrics[metric], weight: a.temporalWeight }))
        .filter(v => v.value > 0);

    if (values.length === 0) {
        return {
            mean: 0,
            median: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            count: 0,
            weightedMean: 0
        };
    }

    const sorted = [...values].sort((a, b) => a.value - b.value);
    const sum = values.reduce((acc, v) => acc + v.value, 0);
    const mean = sum / values.length;

    // Mediana
    const midIndex = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[midIndex - 1].value + sorted[midIndex].value) / 2
        : sorted[midIndex].value;

    // Desvio padrao
    const squaredDiffs = values.map(v => Math.pow(v.value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Media ponderada
    const weightedSum = values.reduce((acc, v) => acc + v.value * v.weight, 0);
    const totalWeight = values.reduce((acc, v) => acc + v.weight, 0);
    const weightedMean = totalWeight > 0 ? weightedSum / totalWeight : mean;

    return {
        mean,
        median,
        stdDev,
        min: sorted[0].value,
        max: sorted[sorted.length - 1].value,
        count: values.length,
        weightedMean
    };
}

/**
 * Filtra activities por periodo
 */
export function filterByPeriod(
    activities: ProcessedActivity[],
    startDate: Date,
    endDate: Date
): ProcessedActivity[] {
    return activities.filter(a =>
        a.dispatchDate >= startDate && a.dispatchDate <= endDate
    );
}

/**
 * Retorna distribuicao de uma feature
 */
export function getFeatureDistribution(
    activities: ProcessedActivity[],
    feature: string
): Record<string, number> {
    const distribution: Record<string, number> = {};

    activities.forEach(a => {
        const value = String(a.features[feature] || 'undefined');
        distribution[value] = (distribution[value] || 0) + 1;
    });

    return distribution;
}
