/**
 * =============================================================================
 * CAUSAL ANALYZER
 * =============================================================================
 *
 * Implementa analise de causalidade usando:
 * - Feature Importance com Shapley Values (simplificado)
 * - Deteccao de Confounders
 * - Analise de Intervencao (Do-Calculus simplificado)
 *
 * Objetivo: Identificar quais features CAUSAM mudancas nas metricas,
 * nao apenas quais estao correlacionadas.
 */

import {
    ProcessedActivity,
    ProjectableMetric,
    CausalAnalysisResult,
    CausalFactor,
    InterventionEffect,
    FeatureImportance,
    SimilarityDimension
} from './types';
import { calculateMetricStats, groupByDimension } from './dataProcessor';

// =============================================================================
// FEATURE IMPORTANCE (Shapley Values Simplificado)
// =============================================================================

/**
 * Calcula importancia das features para uma metrica
 * Usa aproximacao de Shapley Values via permutacoes aleatorias
 */
export function calculateFeatureImportance(
    activities: ProcessedActivity[],
    metric: ProjectableMetric,
    features: SimilarityDimension[]
): FeatureImportance[] {
    if (activities.length < 10) {
        return features.map((f, i) => ({
            feature: f,
            importance: 0,
            rank: i + 1
        }));
    }

    const baselineStats = calculateMetricStats(activities, metric);
    const baselineValue = baselineStats.weightedMean;

    if (baselineValue === 0) {
        return features.map((f, i) => ({
            feature: f,
            importance: 0,
            rank: i + 1
        }));
    }

    const importances: { feature: string; importance: number }[] = [];

    features.forEach(feature => {
        // Calcula variancia explicada por esta feature
        const groups = groupByDimension(activities, feature);
        let withinGroupVariance = 0;
        let totalCount = 0;

        groups.forEach((group) => {
            if (group.length > 1) {
                const groupStats = calculateMetricStats(group, metric);
                withinGroupVariance += groupStats.stdDev * groupStats.stdDev * group.length;
                totalCount += group.length;
            }
        });

        const avgWithinVariance = totalCount > 0 ? withinGroupVariance / totalCount : 0;
        const totalVariance = baselineStats.stdDev * baselineStats.stdDev;

        // Importancia = variancia entre grupos / variancia total
        const importance = totalVariance > 0
            ? ((totalVariance - avgWithinVariance) / totalVariance) * 100
            : 0;

        importances.push({
            feature,
            importance: Math.max(0, Math.min(100, importance))
        });
    });

    // Ordenar e rankear
    importances.sort((a, b) => b.importance - a.importance);

    return importances.map((item, index) => ({
        feature: item.feature,
        importance: Math.round(item.importance * 100) / 100,
        rank: index + 1
    }));
}

// =============================================================================
// DETECCAO DE CONFOUNDERS
// =============================================================================

/**
 * Detecta confounders - variaveis que afetam tanto tratamento quanto outcome
 * Ex: Segmento afeta tanto escolha de Canal quanto Taxa de Conversao
 */
export function detectConfounders(
    activities: ProcessedActivity[],
    treatment: SimilarityDimension,
    outcome: ProjectableMetric,
    potentialConfounders: SimilarityDimension[]
): string[] {
    const confounders: string[] = [];
    const treatmentGroups = groupByDimension(activities, treatment);

    potentialConfounders.forEach(confounder => {
        if (confounder === treatment) return;

        // Verifica se confounder afeta o tratamento
        const confGroups = groupByDimension(activities, confounder);
        let affectsTreatment = false;

        confGroups.forEach((group, confValue) => {
            const treatmentDist = getDistribution(group, treatment);
            const overallDist = getDistribution(activities, treatment);

            // Se distribuicao do tratamento muda significativamente por confounder
            const divergence = calculateDistributionDivergence(treatmentDist, overallDist);
            if (divergence > 0.3) {
                affectsTreatment = true;
            }
        });

        if (!affectsTreatment) return;

        // Verifica se confounder afeta o outcome
        const confGroups2 = groupByDimension(activities, confounder);
        let affectsOutcome = false;

        const groupMeans: number[] = [];
        confGroups2.forEach((group) => {
            if (group.length >= 3) {
                const stats = calculateMetricStats(group, outcome);
                groupMeans.push(stats.weightedMean);
            }
        });

        if (groupMeans.length >= 2) {
            const meanVariance = calculateVariance(groupMeans);
            const overallStats = calculateMetricStats(activities, outcome);
            const overallMean = overallStats.weightedMean;

            // Se as medias variam significativamente entre grupos
            if (overallMean > 0 && meanVariance / (overallMean * overallMean) > 0.1) {
                affectsOutcome = true;
            }
        }

        if (affectsTreatment && affectsOutcome) {
            confounders.push(confounder);
        }
    });

    return confounders;
}

// =============================================================================
// ANALISE DE INTERVENCAO
// =============================================================================

/**
 * Calcula efeito de intervencao (mudar valor de uma feature)
 * Controlando por confounders
 */
export function calculateInterventionEffect(
    activities: ProcessedActivity[],
    feature: SimilarityDimension,
    fromValue: string,
    toValue: string,
    outcome: ProjectableMetric,
    confounders: SimilarityDimension[]
): InterventionEffect | null {
    // Filtrar activities com os valores desejados
    const fromActivities = activities.filter(a =>
        normalizeValue(String(a.features[feature] || '')) === normalizeValue(fromValue)
    );

    const toActivities = activities.filter(a =>
        normalizeValue(String(a.features[feature] || '')) === normalizeValue(toValue)
    );

    if (fromActivities.length < 3 || toActivities.length < 3) {
        return null;
    }

    // Calcular efeito bruto
    const fromStats = calculateMetricStats(fromActivities, outcome);
    const toStats = calculateMetricStats(toActivities, outcome);

    const rawEffect = fromStats.weightedMean > 0
        ? ((toStats.weightedMean - fromStats.weightedMean) / fromStats.weightedMean) * 100
        : 0;

    // Ajustar por confounders usando estratificacao
    let adjustedEffect = rawEffect;
    let confidence = 0.5;

    if (confounders.length > 0) {
        const stratifiedEffects: number[] = [];

        // Estratificar pelo primeiro confounder (simplificacao)
        const confounder = confounders[0];
        const confGroups = groupByDimension(activities, confounder);

        confGroups.forEach((group) => {
            const fromStrat = group.filter(a =>
                normalizeValue(String(a.features[feature] || '')) === normalizeValue(fromValue)
            );
            const toStrat = group.filter(a =>
                normalizeValue(String(a.features[feature] || '')) === normalizeValue(toValue)
            );

            if (fromStrat.length >= 2 && toStrat.length >= 2) {
                const fromStats = calculateMetricStats(fromStrat, outcome);
                const toStats = calculateMetricStats(toStrat, outcome);

                if (fromStats.weightedMean > 0) {
                    const stratEffect = ((toStats.weightedMean - fromStats.weightedMean) / fromStats.weightedMean) * 100;
                    stratifiedEffects.push(stratEffect);
                }
            }
        });

        if (stratifiedEffects.length >= 2) {
            adjustedEffect = stratifiedEffects.reduce((a, b) => a + b, 0) / stratifiedEffects.length;
            confidence = 0.7 + (0.3 * Math.min(1, stratifiedEffects.length / 5));
        }
    } else {
        // Sem confounders, confianca baseada no tamanho da amostra
        const totalSamples = fromActivities.length + toActivities.length;
        confidence = Math.min(0.9, 0.4 + (totalSamples / 100) * 0.5);
    }

    return {
        fromFeature: feature,
        fromValue,
        toValue,
        expectedChange: Math.round(adjustedEffect * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        sampleSizeFrom: fromActivities.length,
        sampleSizeTo: toActivities.length
    };
}

// =============================================================================
// GERACAO DE FATORES CAUSAIS
// =============================================================================

/**
 * Gera lista de fatores causais para explicacao
 */
export function generateCausalFactors(
    activities: ProcessedActivity[],
    metric: ProjectableMetric,
    currentValues: Record<string, string>
): CausalFactor[] {
    const factors: CausalFactor[] = [];
    const features: SimilarityDimension[] = [
        'BU', 'Segmento', 'Canal', 'Jornada', 'Perfil_Credito',
        'Oferta', 'Parceiro', 'Etapa_Aquisicao'
    ];

    // Calcular importancia de features
    const importance = calculateFeatureImportance(activities, metric, features);
    const topFeatures = importance.filter(f => f.importance > 10).slice(0, 5);

    // Para cada feature importante, analisar impacto do valor atual
    topFeatures.forEach(({ feature, importance }) => {
        const currentValue = currentValues[feature.toLowerCase()] ||
            currentValues[feature] ||
            '';

        if (!currentValue) return;

        const groups = groupByDimension(activities, feature as SimilarityDimension);
        const currentGroup = groups.get(normalizeValue(currentValue)) ||
            groups.get(currentValue);

        if (!currentGroup || currentGroup.length < 3) return;

        const overallStats = calculateMetricStats(activities, metric);
        const currentStats = calculateMetricStats(currentGroup, metric);

        if (overallStats.weightedMean === 0) return;

        const impact = ((currentStats.weightedMean - overallStats.weightedMean) / overallStats.weightedMean) * 100;

        if (Math.abs(impact) > 5) {
            factors.push({
                feature,
                value: currentValue,
                impact: Math.round(impact * 10) / 10,
                direction: impact > 0 ? 'positive' : 'negative',
                explanation: generateFactorExplanation(feature, currentValue, impact, metric),
                shapleyValue: importance / 100,
                isConfounder: false
            });
        }
    });

    // Ordenar por impacto absoluto
    factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return factors.slice(0, 5);
}

/**
 * Gera texto explicativo para um fator
 */
function generateFactorExplanation(
    feature: string,
    value: string,
    impact: number,
    metric: ProjectableMetric
): string {
    const metricNames: Record<string, string> = {
        volume: 'volume',
        taxaConversao: 'taxa de conversao',
        baseAcionavel: 'base acionavel',
        cac: 'CAC',
        taxaEntrega: 'taxa de entrega',
        taxaAbertura: 'taxa de abertura',
        propostas: 'propostas',
        aprovados: 'aprovados',
        cartoesGerados: 'cartoes gerados'
    };

    const metricName = metricNames[metric] || metric;
    const direction = impact > 0 ? 'aumenta' : 'diminui';
    const absImpact = Math.abs(impact).toFixed(1);

    return `${feature} "${value}" ${direction} ${metricName} em ${absImpact}%`;
}

// =============================================================================
// ANALISE CAUSAL COMPLETA
// =============================================================================

/**
 * Executa analise causal completa para uma metrica
 */
export function performCausalAnalysis(
    activities: ProcessedActivity[],
    metric: ProjectableMetric,
    currentValues: Record<string, string>
): CausalAnalysisResult {
    const features: SimilarityDimension[] = [
        'BU', 'Segmento', 'Canal', 'Jornada', 'Perfil_Credito',
        'Oferta', 'Promocional', 'Parceiro', 'Subgrupo',
        'Etapa_Aquisicao', 'Produto'
    ];

    // 1. Feature Importance (Shapley Values aproximados)
    const importance = calculateFeatureImportance(activities, metric, features);
    const shapleyValues: Record<string, number> = {};
    importance.forEach(({ feature, importance }) => {
        shapleyValues[feature] = importance / 100;
    });

    // 2. Detectar confounders para a feature principal
    const topFeature = importance[0]?.feature as SimilarityDimension;
    const confounders = topFeature
        ? detectConfounders(activities, topFeature, metric, features.filter(f => f !== topFeature))
        : [];

    // 3. Calcular efeitos de intervencao
    const interventionEffects: InterventionEffect[] = [];

    // Analisar intervencao na feature principal
    if (topFeature) {
        const currentValue = currentValues[topFeature.toLowerCase()] || currentValues[topFeature];
        const groups = groupByDimension(activities, topFeature);

        groups.forEach((_, value) => {
            if (value !== currentValue && value !== 'undefined') {
                const effect = calculateInterventionEffect(
                    activities,
                    topFeature,
                    currentValue || '',
                    value,
                    metric,
                    confounders as SimilarityDimension[]
                );
                if (effect && Math.abs(effect.expectedChange) > 5) {
                    interventionEffects.push(effect);
                }
            }
        });
    }

    // Ordenar por impacto esperado
    interventionEffects.sort((a, b) => Math.abs(b.expectedChange) - Math.abs(a.expectedChange));

    return {
        targetMetric: metric,
        shapleyValues,
        confounders,
        interventionEffects: interventionEffects.slice(0, 5),
        featureImportance: importance
    };
}

// =============================================================================
// HELPERS
// =============================================================================

function normalizeValue(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function getDistribution(
    activities: ProcessedActivity[],
    feature: SimilarityDimension
): Record<string, number> {
    const dist: Record<string, number> = {};
    activities.forEach(a => {
        const value = String(a.features[feature] || 'undefined');
        dist[value] = (dist[value] || 0) + 1;
    });

    // Normalizar
    const total = activities.length;
    Object.keys(dist).forEach(k => {
        dist[k] = dist[k] / total;
    });

    return dist;
}

function calculateDistributionDivergence(
    dist1: Record<string, number>,
    dist2: Record<string, number>
): number {
    const allKeys = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
    let divergence = 0;

    allKeys.forEach(key => {
        const p1 = dist1[key] || 0;
        const p2 = dist2[key] || 0;
        divergence += Math.abs(p1 - p2);
    });

    return divergence / 2;
}

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}
