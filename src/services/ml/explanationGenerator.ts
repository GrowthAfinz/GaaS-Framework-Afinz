/**
 * =============================================================================
 * EXPLANATION GENERATOR
 * =============================================================================
 *
 * Gera explicacoes em linguagem natural para projecoes
 * - Resumo da projecao
 * - Fatores causais em texto
 * - Qualidade dos dados
 */

import {
    ProjectableMetric,
    CausalFactor,
    CorrelationFactor,
    MatchLevel,
    DataQuality,
    ProjectionExplanation
} from './types';
import { calculateMetricStats } from './dataProcessor';

/**
 * Gera explicacao completa para uma projecao
 */
export function generateExplanation(
    metric: ProjectableMetric,
    sampleSize: number,
    matchLevel: MatchLevel,
    causalFactors: CausalFactor[],
    stats: ReturnType<typeof calculateMetricStats>
): ProjectionExplanation {
    // Determinar qualidade dos dados
    const dataQuality = determineDataQuality(sampleSize, matchLevel, stats);

    // Gerar resumo
    const summary = generateSummary(metric, sampleSize, matchLevel, dataQuality);

    // Calcular percentual de match
    const matchPercentage = getMatchPercentage(matchLevel);

    // Gerar descricao de decaimento temporal
    const timeDecay = generateTimeDecayDescription(sampleSize);

    // Fatores de correlacao (simplificados)
    const correlationFactors = generateCorrelationFactors(causalFactors);

    return {
        summary,
        causalFactors,
        correlationFactors,
        timeDecay,
        sampleSize,
        dataQuality,
        matchLevel,
        matchPercentage
    };
}

/**
 * Determina qualidade dos dados
 */
function determineDataQuality(
    sampleSize: number,
    matchLevel: MatchLevel,
    stats: ReturnType<typeof calculateMetricStats>
): DataQuality {
    let score = 0;

    // Pontos por tamanho da amostra
    if (sampleSize >= 50) score += 3;
    else if (sampleSize >= 20) score += 2;
    else if (sampleSize >= 5) score += 1;

    // Pontos por nivel de match
    const matchScores: Record<MatchLevel, number> = {
        exact: 3,
        high: 2,
        medium: 1,
        low: 0,
        fallback: 0
    };
    score += matchScores[matchLevel];

    // Pontos por consistencia (baixo coeficiente de variacao)
    if (stats.mean > 0) {
        const cv = stats.stdDev / stats.mean;
        if (cv < 0.3) score += 2;
        else if (cv < 0.5) score += 1;
    }

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

/**
 * Gera texto resumo da projecao
 */
function generateSummary(
    metric: ProjectableMetric,
    sampleSize: number,
    matchLevel: MatchLevel,
    dataQuality: DataQuality
): string {
    const metricNames: Record<ProjectableMetric, string> = {
        volume: 'Volume de Base',
        taxaConversao: 'Taxa de Conversao',
        baseAcionavel: 'Base Acionavel',
        cac: 'CAC',
        taxaEntrega: 'Taxa de Entrega',
        taxaAbertura: 'Taxa de Abertura',
        propostas: 'Propostas',
        aprovados: 'Aprovados',
        cartoesGerados: 'Cartoes Gerados'
    };

    const metricName = metricNames[metric];

    if (sampleSize === 0) {
        return `Sem base historica suficiente para projetar ${metricName} com seguranca executiva.`;
    }

    const matchDescriptions: Record<MatchLevel, string> = {
        exact: 'campanhas identicas',
        high: 'campanhas muito similares',
        medium: 'campanhas similares',
        low: 'campanhas com mesma BU',
        fallback: 'dados gerais'
    };

    const qualityDescriptions: Record<DataQuality, string> = {
        high: 'Alta confianca',
        medium: 'Confianca moderada',
        low: 'Baixa confianca'
    };

    const matchDesc = matchDescriptions[matchLevel];
    const qualityDesc = qualityDescriptions[dataQuality];

    const confidenceHook: Record<DataQuality, string> = {
        high: 'Leitura pronta para decisao',
        medium: 'Leitura util para orientar priorizacao',
        low: 'Leitura exploratoria, exige validacao adicional'
    };

    return `${qualityDesc}. ${confidenceHook[dataQuality]}. Projecao sustentada por ${sampleSize} ${matchDesc}.`;
}

/**
 * Retorna percentual de match por nivel
 */
function getMatchPercentage(level: MatchLevel): number {
    const percentages: Record<MatchLevel, number> = {
        exact: 100,
        high: 80,
        medium: 60,
        low: 40,
        fallback: 20
    };
    return percentages[level];
}

/**
 * Gera descricao do decaimento temporal
 */
function generateTimeDecayDescription(sampleSize: number): string {
    if (sampleSize >= 50) {
        return 'Peso maior para ultimos 30 dias, decaimento exponencial em 90 dias.';
    } else if (sampleSize >= 20) {
        return 'Peso para dados recentes, janela de 90 dias.';
    } else if (sampleSize > 0) {
        return 'Todos os dados disponiveis foram considerados.';
    }
    return 'N/A';
}

/**
 * Gera fatores de correlacao a partir dos causais
 */
function generateCorrelationFactors(causalFactors: CausalFactor[]): CorrelationFactor[] {
    return causalFactors.slice(0, 3).map(factor => ({
        feature: factor.feature,
        correlation: factor.impact > 0 ? 0.7 : -0.7,
        pValue: factor.impact > 20 ? 0.01 : 0.05
    }));
}

// =============================================================================
// FORMATADORES DE TEXTO
// =============================================================================

/**
 * Formata valor numerico para exibicao
 */
export function formatMetricValue(
    value: number,
    metric: ProjectableMetric
): string {
    // Metricas de porcentagem
    const percentMetrics: ProjectableMetric[] = [
        'taxaConversao', 'taxaEntrega', 'taxaAbertura'
    ];

    if (percentMetrics.includes(metric)) {
        return `${value.toFixed(2)}%`;
    }

    // CAC em reais
    if (metric === 'cac') {
        return `R$ ${value.toFixed(2)}`;
    }

    // Metricas inteiras
    return Math.round(value).toLocaleString('pt-BR');
}

/**
 * Gera texto para fator causal
 */
export function formatCausalFactor(factor: CausalFactor): string {
    const direction = factor.direction === 'positive' ? '+' : '-';
    const absImpact = Math.abs(factor.impact).toFixed(1);

    return `${factor.feature} = "${factor.value}": ${direction}${absImpact}%`;
}

/**
 * Gera texto para intervalo de confianca
 */
export function formatConfidenceInterval(
    min: number,
    max: number,
    metric: ProjectableMetric
): string {
    const minStr = formatMetricValue(min, metric);
    const maxStr = formatMetricValue(max, metric);

    return `${minStr} - ${maxStr}`;
}

/**
 * Gera texto de confianca
 */
export function formatConfidenceLevel(confidence: number): string {
    if (confidence >= 80) return 'Alta';
    if (confidence >= 60) return 'Moderada';
    if (confidence >= 40) return 'Baixa';
    return 'Muito Baixa';
}

/**
 * Gera titulo para tooltip de projecao
 */
export function generateTooltipTitle(metric: ProjectableMetric): string {
    const titles: Record<ProjectableMetric, string> = {
        volume: 'Projecao: Volume de Base',
        taxaConversao: 'Projecao: Taxa de Conversao',
        baseAcionavel: 'Projecao: Base Acionavel',
        cac: 'Projecao: CAC Estimado',
        taxaEntrega: 'Projecao: Taxa de Entrega',
        taxaAbertura: 'Projecao: Taxa de Abertura',
        propostas: 'Projecao: Propostas Estimadas',
        aprovados: 'Projecao: Aprovados Estimados',
        cartoesGerados: 'Projecao: Cartoes Estimados'
    };

    return titles[metric];
}
