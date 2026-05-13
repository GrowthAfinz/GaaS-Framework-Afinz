/**
 * =============================================================================
 * AI ORCHESTRATOR
 * =============================================================================
 *
 * Orquestrador principal do sistema de IA para projecao de metricas
 *
 * Responsabilidades:
 * - Inicializar e processar dados historicos
 * - Coordenar analise de similaridade e causalidade
 * - Gerar projecoes para campos do formulario
 * - Fornecer sugestoes inteligentes para preenchimento
 *
 * Uso:
 *   const orchestrator = new AIOrchestrator();
 *   orchestrator.initialize(activities);
 *   const projection = orchestrator.projectField('taxaConversao', formData);
 */

import { ActivityRow } from '../../types/activity';
import {
    IAIOrchestrator,
    FormDataInput,
    ProjectableMetric,
    FieldProjection,
    AllProjectionsResult,
    CausalAnalysisResult,
    ProcessedActivity,
    OrchestratorConfig,
    DEFAULT_CONFIG,
    DEFAULT_SIMILARITY_WEIGHTS,
    SimilarityDimension
} from './types';

import { processActivities, getFeatureDistribution } from './dataProcessor';
import { findSimilarActivities, selectBestMatchGroup } from './similarityEngine';
import { performCausalAnalysis } from './causalAnalyzer';
import { projectMetric, projectAllMetrics } from './predictionEngine';

/**
 * Classe principal do orquestrador de IA
 */
export class AIOrchestrator implements IAIOrchestrator {
    private processedActivities: ProcessedActivity[] = [];
    private rawActivities: ActivityRow[] = [];
    private config: OrchestratorConfig;
    private isInitialized: boolean = false;

    constructor(config: Partial<OrchestratorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Inicializa o orquestrador com dados historicos
     */
    initialize(activities: ActivityRow[]): void {
        console.log(`[AIOrchestrator] Inicializando com ${activities.length} atividades...`);

        this.rawActivities = activities;

        // Processar activities
        this.processedActivities = processActivities(activities, this.config);

        console.log(`[AIOrchestrator] ${this.processedActivities.length} atividades processadas na janela de ${this.config.temporalWindow} dias.`);

        this.isInitialized = true;
    }

    /**
     * Verifica se o orquestrador esta pronto
     */
    isReady(): boolean {
        return this.isInitialized && this.processedActivities.length > 0;
    }

    /**
     * Projeta um campo especifico
     */
    projectField(fieldName: ProjectableMetric, formData: FormDataInput): FieldProjection {
        if (!this.isReady()) {
            console.warn('[AIOrchestrator] Orquestrador nao inicializado.');
            return this.createEmptyProjection(fieldName);
        }

        // Encontrar activities similares
        const weights = {
            ...DEFAULT_SIMILARITY_WEIGHTS,
            ...this.config.similarityWeights
        };

        const matches = findSimilarActivities(
            this.processedActivities,
            formData,
            weights
        );

        // Selecionar melhor grupo de matches
        const { matches: selectedMatches, level } = selectBestMatchGroup(
            matches,
            this.config.minSampleSize
        );

        // Projetar metrica
        return projectMetric(
            fieldName,
            selectedMatches,
            level,
            formData,
            this.processedActivities
        );
    }

    /**
     * Projeta todos os campos de uma vez
     */
    projectAllFields(formData: FormDataInput): AllProjectionsResult {
        if (!this.isReady()) {
            console.warn('[AIOrchestrator] Orquestrador nao inicializado.');
            return this.createEmptyAllProjections();
        }

        // Encontrar activities similares
        const weights = {
            ...DEFAULT_SIMILARITY_WEIGHTS,
            ...this.config.similarityWeights
        };

        const matches = findSimilarActivities(
            this.processedActivities,
            formData,
            weights
        );

        // Selecionar melhor grupo de matches
        const { matches: selectedMatches, level } = selectBestMatchGroup(
            matches,
            this.config.minSampleSize
        );

        // LOG: Detalhamento de matches por nível
        const groupedByLevel: Record<string, number> = {
            exact: 0,
            high: 0,
            medium: 0,
            low: 0,
            fallback: 0
        };
        matches.forEach(m => {
            groupedByLevel[m.level]++;
        });

        console.log('%c[AIOrchestrator] Matching Results', 'color: #3B82F6; font-weight: bold;', {
            totalMatches: matches.length,
            selectedLevel: level,
            selectedMatches: selectedMatches.length,
            byLevel: groupedByLevel,
            topMatches: selectedMatches.slice(0, 3).map(m => ({
                score: m.score,
                level: m.level,
                matched: m.matchedDimensions.join(', ')
            }))
        });

        // Projetar todas as metricas
        const projections = projectAllMetrics(
            selectedMatches,
            level,
            formData,
            this.processedActivities
        );

        // Calcular confianca geral
        const confidences = Object.values(projections).map(p => p.confidence);
        const overallConfidence = confidences.length > 0
            ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
            : 0;

        return {
            projections,
            overallConfidence,
            totalSampleSize: selectedMatches.length,
            computedAt: new Date().toISOString()
        };
    }

    /**
     * Sugere valor para um campo
     */
    suggestFieldValue(
        fieldName: string,
        formData: FormDataInput
    ): { value: string; confidence: number; source: string }[] {
        if (!this.isReady()) {
            return [];
        }

        const suggestions: { value: string; confidence: number; source: string }[] = [];

        // Encontrar activities similares
        const matches = findSimilarActivities(
            this.processedActivities,
            formData,
            DEFAULT_SIMILARITY_WEIGHTS,
            50
        );

        if (matches.length === 0) {
            return suggestions;
        }

        // Mapear campo para feature
        const fieldToFeature: Record<string, SimilarityDimension> = {
            jornada: 'Jornada',
            canal: 'Canal',
            oferta: 'Oferta',
            promocional: 'Promocional',
            parceiro: 'Parceiro',
            subgrupo: 'Subgrupo',
            etapaAquisicao: 'Etapa_Aquisicao',
            perfilCredito: 'Perfil_Credito',
            produto: 'Produto'
        };

        const featureName = fieldToFeature[fieldName];
        if (!featureName) {
            return suggestions;
        }

        // Contar frequencia de valores
        const valueCounts: Record<string, number> = {};
        matches.forEach(m => {
            const value = m.activity.features[featureName];
            if (value && typeof value === 'string') {
                valueCounts[value] = (valueCounts[value] || 0) + m.score;
            }
        });

        // Ordenar por frequencia ponderada
        const sortedValues = Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const totalWeight = sortedValues.reduce((sum, [, weight]) => sum + weight, 0);

        sortedValues.forEach(([value, weight]) => {
            suggestions.push({
                value,
                confidence: Math.round((weight / totalWeight) * 100),
                source: `${matches.length} campanhas similares`
            });
        });

        return suggestions;
    }

    /**
     * Retorna analise causal para uma metrica
     */
    getCausalAnalysis(
        metric: ProjectableMetric,
        formData: FormDataInput
    ): CausalAnalysisResult {
        if (!this.isReady()) {
            return {
                targetMetric: metric,
                shapleyValues: {},
                confounders: [],
                interventionEffects: [],
                featureImportance: []
            };
        }

        const currentValues: Record<string, string> = {};
        if (formData.bu) currentValues['BU'] = formData.bu;
        if (formData.segmento) currentValues['Segmento'] = formData.segmento;
        if (formData.canal) currentValues['Canal'] = formData.canal;
        if (formData.jornada) currentValues['Jornada'] = formData.jornada;
        if (formData.perfilCredito) currentValues['Perfil_Credito'] = formData.perfilCredito;
        if (formData.oferta) currentValues['Oferta'] = formData.oferta;
        if (formData.parceiro) currentValues['Parceiro'] = formData.parceiro;
        if (formData.etapaAquisicao) currentValues['Etapa_Aquisicao'] = formData.etapaAquisicao;

        return performCausalAnalysis(this.processedActivities, metric, currentValues);
    }

    /**
     * Retorna estatisticas do dataset
     */
    getDatasetStats(): {
        totalActivities: number;
        dateRange: { from: Date; to: Date };
        buDistribution: Record<string, number>;
        segmentoDistribution: Record<string, number>;
    } {
        if (!this.isReady()) {
            return {
                totalActivities: 0,
                dateRange: { from: new Date(), to: new Date() },
                buDistribution: {},
                segmentoDistribution: {}
            };
        }

        const dates = this.processedActivities.map(a => a.dispatchDate);
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

        return {
            totalActivities: this.processedActivities.length,
            dateRange: {
                from: sortedDates[0] || new Date(),
                to: sortedDates[sortedDates.length - 1] || new Date()
            },
            buDistribution: getFeatureDistribution(this.processedActivities, 'BU'),
            segmentoDistribution: getFeatureDistribution(this.processedActivities, 'Segmento')
        };
    }

    // ==========================================================================
    // HELPERS PRIVADOS
    // ==========================================================================

    private createEmptyProjection(metric: ProjectableMetric): FieldProjection {
        return {
            field: metric,
            projectedValue: 0,
            confidence: 0,
            interval: { min: 0, max: 0 },
            method: 'fallback',
            explanation: {
                summary: 'Orquestrador nao inicializado ou sem dados.',
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

    private createEmptyAllProjections(): AllProjectionsResult {
        const metrics: ProjectableMetric[] = [
            'volume', 'taxaConversao', 'baseAcionavel', 'cac',
            'taxaEntrega', 'taxaAbertura', 'propostas', 'aprovados', 'cartoesGerados'
        ];

        const projections: Partial<Record<ProjectableMetric, FieldProjection>> = {};
        metrics.forEach(m => {
            projections[m] = this.createEmptyProjection(m);
        });

        return {
            projections: projections as Record<ProjectableMetric, FieldProjection>,
            overallConfidence: 0,
            totalSampleSize: 0,
            computedAt: new Date().toISOString()
        };
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let orchestratorInstance: AIOrchestrator | null = null;

/**
 * Retorna instancia singleton do orquestrador
 */
export function getAIOrchestrator(config?: Partial<OrchestratorConfig>): AIOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new AIOrchestrator(config);
    }
    return orchestratorInstance;
}

/**
 * Reseta a instancia do orquestrador (util para testes)
 */
export function resetAIOrchestrator(): void {
    orchestratorInstance = null;
}

export default AIOrchestrator;
