/**
 * =============================================================================
 * PREDICTION ENGINE
 * =============================================================================
 *
 * Motor de predicoes para metricas de campanhas
 * - Calcula valores projetados baseados em similaridade
 * - Aplica decaimento temporal
 * - Gera intervalos de confianca
 */

import {
    ProcessedActivity,
    ProjectableMetric,
    FieldProjection,
    SimilarityMatch,
    MatchLevel,
    CampaignReference,
    ProjectionMethod,
    FormDataInput,
    CHANNEL_UNIT_COSTS,
    OFFER_UNIT_COSTS
} from './types';
import { calculateMetricStats } from './dataProcessor';
import { calculateConfidenceScore } from './similarityEngine';
import { generateCausalFactors } from './causalAnalyzer';
import { generateExplanation } from './explanationGenerator';

/**
 * Projeta uma metrica baseada em matches similares
 */
export function projectMetric(
    metric: ProjectableMetric,
    matches: SimilarityMatch[],
    matchLevel: MatchLevel,
    formData: FormDataInput,
    allActivities: ProcessedActivity[]
): FieldProjection {
    const activities = matches.map(m => m.activity);

    // Se nao ha matches, retorna projecao vazia
    if (activities.length === 0) {
        console.warn(`[PredictionEngine] ${metric}: sem matches disponíveis`);
        return createEmptyProjection(metric);
    }

    // Calcular estatisticas da metrica
    const stats = calculateMetricStats(activities, metric);

    // Determinar metodo de projecao
    const method = determineProjectionMethod(metric, matches, formData);

    // Calcular valor projetado
    let projectedValue = calculateProjectedValue(metric, stats, formData, method);

    // Calcular intervalo de confianca
    const interval = calculateConfidenceInterval(stats, projectedValue);

    // Calcular confianca
    const confidence = calculateConfidenceScore(matches, matchLevel);

    // Gerar fatores causais
    const currentValues = formDataToCurrentValues(formData);
    const causalFactors = generateCausalFactors(allActivities, metric, currentValues);

    // Gerar campanhas similares de referencia
    const similarCampaigns = extractSimilarCampaigns(matches, metric);

    // Gerar explicacao
    const explanation = generateExplanation(
        metric,
        matches.length,
        matchLevel,
        causalFactors,
        stats
    );

    // LOG de diagnóstico
    console.log(`  → ${metric}:`, {
        matchLevel,
        matchCount: matches.length,
        method,
        stats: {
            mean: stats.mean.toFixed(2),
            median: stats.median.toFixed(2),
            weightedMean: stats.weightedMean.toFixed(2),
            stdDev: stats.stdDev.toFixed(2)
        },
        projectedValue: roundValue(projectedValue, metric),
        confidence
    });

    return {
        field: metric,
        projectedValue: roundValue(projectedValue, metric),
        confidence,
        interval: {
            min: roundValue(interval.min, metric),
            max: roundValue(interval.max, metric)
        },
        method,
        explanation,
        similarCampaigns,
        metadata: {
            computedAt: new Date().toISOString(),
            version: '2.0'
        }
    };
}

/**
 * Projeta todas as metricas
 */
export function projectAllMetrics(
    matches: SimilarityMatch[],
    matchLevel: MatchLevel,
    formData: FormDataInput,
    allActivities: ProcessedActivity[]
): Record<ProjectableMetric, FieldProjection> {
    // IMPORTANTE: Volume é INPUT do usuário, não deve ser projetado!
    const metrics: ProjectableMetric[] = [
        // 'volume', ← REMOVIDO: usar formData.baseVolume diretamente
        'taxaConversao',
        'baseAcionavel',
        'cac',
        'taxaEntrega',
        'taxaAbertura',
        'propostas',
        'aprovados',
        'cartoesGerados'
    ];

    const projections: Partial<Record<ProjectableMetric, FieldProjection>> = {};

    // Adicionar volume como projeção com valor do input do usuário
    // IMPORTANTE: Sempre adicionar, mesmo que volume seja 0 ou undefined
    // (evita crash em applyFunnelCalculations)
    const volumeValue = formData.baseVolume || 0;
    projections['volume'] = {
        field: 'volume',
        projectedValue: volumeValue,
        confidence: volumeValue > 0 ? 100 : 0, // 100% só se houver volume
        method: 'fallback',
        interval: { min: volumeValue, max: volumeValue },
        explanation: {
            summary: volumeValue > 0
                ? 'Volume definido pelo usuário'
                : 'Nenhum volume informado',
            causalFactors: [],
            correlationFactors: [],
            timeDecay: 'N/A',
            sampleSize: 0,
            dataQuality: volumeValue > 0 ? 'high' : 'low',
            matchLevel: 'fallback',
            matchPercentage: 0
        },
        similarCampaigns: [],
        metadata: {
            computedAt: new Date().toISOString(),
            version: '2.0'
        }
    };

    metrics.forEach(metric => {
        projections[metric] = projectMetric(
            metric,
            matches,
            matchLevel,
            formData,
            allActivities
        );
    });

    // Aplicar calculos de funil interdependentes
    applyFunnelCalculations(projections as Record<ProjectableMetric, FieldProjection>, formData);

    return projections as Record<ProjectableMetric, FieldProjection>;
}

// =============================================================================
// CALCULOS DE PROJECAO
// =============================================================================

/**
 * Determina metodo de projecao mais apropriado
 */
function determineProjectionMethod(
    metric: ProjectableMetric,
    matches: SimilarityMatch[],
    formData: FormDataInput
): ProjectionMethod {
    // Metricas que se beneficiam de analise causal
    const causalMetrics: ProjectableMetric[] = ['taxaConversao', 'cac', 'taxaAbertura'];

    if (causalMetrics.includes(metric) && matches.length >= 30) {
        return 'causal';
    }

    // Se temos matches exatos ou high
    if (matches.some(m => m.level === 'exact' || m.level === 'high')) {
        return 'correlation';
    }

    // Se temos poucos matches
    if (matches.length < 10) {
        return 'fallback';
    }

    return 'frequency';
}

/**
 * Calcula valor projetado baseado no metodo
 */
function calculateProjectedValue(
    metric: ProjectableMetric,
    stats: ReturnType<typeof calculateMetricStats>,
    formData: FormDataInput,
    method: ProjectionMethod
): number {
    // Metodo base: media ponderada
    let value = stats.weightedMean;

    // Ajustes por metodo
    switch (method) {
        case 'causal':
            // Para metodo causal, usar mediana para maior robustez
            value = stats.median;
            break;

        case 'correlation':
            // Media ponderada com ajuste de recencia
            value = stats.weightedMean;
            break;

        case 'frequency':
            // Usar mediana
            value = stats.median;
            break;

        case 'fallback':
            // Usar media simples com penalidade
            value = stats.mean * 0.8;
            break;
    }

    // Ajustes especificos por metrica
    value = applyMetricSpecificAdjustments(metric, value, formData, stats);

    return Math.max(0, value);
}

/**
 * Aplica ajustes especificos para cada metrica
 */
function applyMetricSpecificAdjustments(
    metric: ProjectableMetric,
    value: number,
    formData: FormDataInput,
    stats: ReturnType<typeof calculateMetricStats>
): number {
    switch (metric) {
        case 'volume':
            // Se o usuario ja informou volume, usar esse
            if (formData.baseVolume && formData.baseVolume > 0) {
                return formData.baseVolume;
            }
            return value;

        case 'baseAcionavel':
            // Base acionavel e proporcional ao volume
            const volume = formData.baseVolume || value;
            const taxaEntregaEstimada = 0.78; // 78% padrao
            return volume * taxaEntregaEstimada;

        case 'cac':
            // CAC nao pode ser zero se temos custo
            if (value === 0 && formData.canal) {
                const custoCanal = CHANNEL_UNIT_COSTS[formData.canal] || 0.01;
                const volume = formData.baseVolume || 10000;
                const cartoesEstimados = volume * 0.02; // 2% conversao
                return (custoCanal * volume) / Math.max(1, cartoesEstimados);
            }
            return value;

        case 'taxaEntrega':
            // Taxa de entrega tem limites logicos
            return Math.min(100, Math.max(0, value));

        case 'taxaAbertura':
            // Taxa de abertura tem limites e depende do canal
            let maxAbertura = 100;
            if (formData.canal === 'E-mail') maxAbertura = 50;
            if (formData.canal === 'SMS') maxAbertura = 80;
            if (formData.canal === 'WhatsApp') maxAbertura = 90;
            return Math.min(maxAbertura, Math.max(0, value));

        case 'taxaConversao':
            // Taxa de conversao raramente passa de 10%
            return Math.min(20, Math.max(0, value));

        default:
            return value;
    }
}

/**
 * Calcula intervalo de confianca (95%)
 */
function calculateConfidenceInterval(
    stats: ReturnType<typeof calculateMetricStats>,
    projectedValue: number
): { min: number; max: number } {
    // Margem de erro baseada no desvio padrao
    const marginOfError = stats.stdDev * 1.96; // 95% CI

    // Se nao temos desvio padrao, usar 20% do valor
    const margin = marginOfError > 0 ? marginOfError : projectedValue * 0.2;

    return {
        min: Math.max(0, projectedValue - margin),
        max: projectedValue + margin
    };
}

/**
 * Aplica calculos de funil interdependentes usando taxas projetadas pela IA
 * 
 * O funil usa TAXAS derivadas de campanhas similares (via AIOrchestrator):
 * - Taxa de Conversão: projetada pela IA
 * - Taxa de Aprovação: derivada de aprovados/propostas das campanhas similares
 * - Taxa de Finalização: derivada de cartoes/aprovados das campanhas similares
 * 
 * Estas taxas são aplicadas ao VOLUME informado pelo usuário.
 */
function applyFunnelCalculations(
    projections: Record<ProjectableMetric, FieldProjection>,
    formData: FormDataInput
): void {
    // GUARDS: Verificar que todos os campos necessários existem
    if (!projections.volume || !projections.taxaConversao || !projections.taxaEntrega ||
        !projections.baseAcionavel || !projections.propostas || !projections.aprovados ||
        !projections.cartoesGerados || !projections.cac) {
        console.warn('[applyFunnelCalculations] Projeções incompletas, pulando cálculos');
        return;
    }

    // ============================================================
    // VOLUME DO USUÁRIO - ponto de partida do funil
    // ============================================================
    const volume = formData.baseVolume || 0;
    if (volume <= 0) return;

    // ============================================================
    // TAXAS PROJETADAS PELA IA (baseadas em campanhas similares)
    // ============================================================

    // Taxa de Entrega (projetada)
    const taxaEntrega = (projections.taxaEntrega.projectedValue || 78) / 100;

    // Taxa de Conversão (projetada pela IA)
    const taxaConversao = (projections.taxaConversao.projectedValue || 0) / 100;

    // Taxa de Aprovação: derivada das projeções de propostas e aprovados
    // Se a IA projetou propostas=100 e aprovados=65 do histórico, taxa=65%
    const propostasProj = projections.propostas.projectedValue || 0;
    const aprovadosProj = projections.aprovados.projectedValue || 0;
    const taxaAprovacao = propostasProj > 0
        ? Math.min(1, aprovadosProj / propostasProj)
        : 0.65; // fallback se não há dados

    // Taxa de Finalização: derivada das projeções de aprovados e cartões
    const cartoesProj = projections.cartoesGerados.projectedValue || 0;
    const taxaFinalizacao = aprovadosProj > 0
        ? Math.min(1, cartoesProj / aprovadosProj)
        : 0.85; // fallback se não há dados

    // ============================================================
    // APLICAR FUNIL AO VOLUME DO USUÁRIO
    // ============================================================

    // 1. Base Acionável = Volume × Taxa de Entrega
    const baseAcionavel = Math.round(volume * taxaEntrega);
    projections.baseAcionavel.projectedValue = baseAcionavel;

    // 2. Propostas = Volume × Taxa de Conversão (projetada pela IA)
    const propostas = Math.round(volume * taxaConversao);
    projections.propostas.projectedValue = propostas;

    // 3. Aprovados = Propostas × Taxa de Aprovação (derivada do histórico)
    const aprovados = Math.round(propostas * taxaAprovacao);
    projections.aprovados.projectedValue = aprovados;

    // 4. Cartões = Aprovados × Taxa de Finalização (derivada do histórico)
    const cartoes = Math.round(aprovados * taxaFinalizacao);
    projections.cartoesGerados.projectedValue = cartoes;

    // ============================================================
    // CAC - baseado em custos e cartões projetados
    // ============================================================
    if (formData.canal) {
        const custoCanal = CHANNEL_UNIT_COSTS[formData.canal] || 0.01;
        const custoOferta = formData.oferta ? (OFFER_UNIT_COSTS[formData.oferta] || 0) : 0;
        const custoTotal = volume * (custoCanal + custoOferta);

        if (cartoes > 0) {
            projections.cac.projectedValue = Math.round((custoTotal / cartoes) * 100) / 100;
        } else if (custoTotal > 0) {
            // Se não há cartões projetados, mostrar custo por proposta como referência
            projections.cac.projectedValue = propostas > 0
                ? Math.round((custoTotal / propostas) * 100) / 100
                : custoTotal;
        }
    }

    // LOG de diagnóstico
    console.log('%c[Funnel IA] Taxas projetadas aplicadas ao volume', 'color: #22C55E; font-weight: bold;', {
        volumeUsuario: volume,
        taxas: {
            entrega: (taxaEntrega * 100).toFixed(1) + '%',
            conversao: (taxaConversao * 100).toFixed(2) + '% (IA)',
            aprovacao: (taxaAprovacao * 100).toFixed(1) + '% (derivada)',
            finalizacao: (taxaFinalizacao * 100).toFixed(1) + '% (derivada)'
        },
        funil: {
            baseAcionavel,
            propostas,
            aprovados,
            cartoes
        },
        cac: projections.cac.projectedValue
    });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Cria projecao vazia
 */
function createEmptyProjection(metric: ProjectableMetric): FieldProjection {
    return {
        field: metric,
        projectedValue: 0,
        confidence: 0,
        interval: { min: 0, max: 0 },
        method: 'fallback',
        explanation: {
            summary: 'Sem dados historicos suficientes para projecao',
            causalFactors: [],
            correlationFactors: [],
            timeDecay: 'N/A',
            sampleSize: 0,
            dataQuality: 'low',
            matchLevel: 'fallback',
            matchPercentage: 0
        },
        similarCampaigns: [],
        metadata: {
            computedAt: new Date().toISOString(),
            version: '2.0'
        }
    };
}

/**
 * Extrai campanhas similares para referencia
 */
function extractSimilarCampaigns(
    matches: SimilarityMatch[],
    metric: ProjectableMetric
): CampaignReference[] {
    return matches
        .slice(0, 5)
        .map(match => ({
            id: match.activity.id,
            activityName: match.activity.raw['Activity name / Taxonomia'] || match.activity.id,
            dataDisparo: match.activity.dispatchDate.toISOString().split('T')[0],
            metricValue: match.activity.metrics[metric],
            similarityScore: match.score
        }));
}

/**
 * Converte FormData para mapa de valores atuais
 */
function formDataToCurrentValues(formData: FormDataInput): Record<string, string> {
    const values: Record<string, string> = {};

    if (formData.bu) values['BU'] = formData.bu;
    if (formData.segmento) values['Segmento'] = formData.segmento;
    if (formData.canal) values['Canal'] = formData.canal;
    if (formData.jornada) values['Jornada'] = formData.jornada;
    if (formData.perfilCredito) values['Perfil_Credito'] = formData.perfilCredito;
    if (formData.oferta) values['Oferta'] = formData.oferta;
    if (formData.parceiro) values['Parceiro'] = formData.parceiro;
    if (formData.etapaAquisicao) values['Etapa_Aquisicao'] = formData.etapaAquisicao;

    return values;
}

/**
 * Arredonda valor conforme o tipo de metrica
 */
function roundValue(value: number, metric: ProjectableMetric): number {
    // Metricas inteiras
    const intMetrics: ProjectableMetric[] = [
        'volume', 'baseAcionavel', 'propostas', 'aprovados', 'cartoesGerados'
    ];

    if (intMetrics.includes(metric)) {
        return Math.round(value);
    }

    // CAC com 2 casas decimais
    if (metric === 'cac') {
        return Math.round(value * 100) / 100;
    }

    // Taxas com 2 casas decimais
    return Math.round(value * 100) / 100;
}
