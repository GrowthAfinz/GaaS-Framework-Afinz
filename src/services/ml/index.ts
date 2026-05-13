/**
 * =============================================================================
 * AI ORCHESTRATOR - BARREL EXPORTS
 * =============================================================================
 *
 * Sistema de IA Avancado para projecao de metricas de campanhas CRM
 *
 * Uso basico:
 *   import { getAIOrchestrator } from '@/services/ml';
 *
 *   const orchestrator = getAIOrchestrator();
 *   orchestrator.initialize(activities);
 *
 *   const projection = orchestrator.projectField('taxaConversao', formData);
 *   const allProjections = orchestrator.projectAllFields(formData);
 */

// Classe principal
export { AIOrchestrator, getAIOrchestrator, resetAIOrchestrator } from './AIOrchestrator';

// Tipos e interfaces
export type {
    // Tipos base
    SimilarityDimension,
    ProjectableMetric,
    ProjectionMethod,
    MatchLevel,
    DataQuality,

    // Configuracao
    SimilarityWeights,
    OrchestratorConfig,
    FormDataInput,

    // Saida - Projecoes
    CausalFactor,
    CorrelationFactor,
    CampaignReference,
    ProjectionExplanation,
    FieldProjection,
    AllProjectionsResult,

    // Interno
    ProcessedActivity,
    SimilarityMatch,
    CausalAnalysisResult,
    InterventionEffect,
    FeatureImportance,

    // Interface principal
    IAIOrchestrator,
} from './types';

// Constantes
export {
    DEFAULT_SIMILARITY_WEIGHTS,
    DEFAULT_CONFIG,
    METRIC_FIELD_MAP,
    DIMENSION_FIELD_MAP,
    CHANNEL_UNIT_COSTS,
    OFFER_UNIT_COSTS,
} from './types';

// Utilitarios de processamento
export {
    processActivities,
    groupByDimension,
    calculateMetricStats,
    filterByPeriod,
    getFeatureDistribution,
} from './dataProcessor';

// Motor de similaridade
export {
    findSimilarActivities,
    filterByMatchLevel,
    groupByMatchLevel,
    selectBestMatchGroup,
    calculateConfidenceScore,
} from './similarityEngine';

// Analisador causal
export {
    calculateFeatureImportance,
    detectConfounders,
    calculateInterventionEffect,
    generateCausalFactors,
    performCausalAnalysis,
} from './causalAnalyzer';

// Motor de predicao
export {
    projectMetric,
    projectAllMetrics,
} from './predictionEngine';

// Gerador de explicacoes
export {
    generateExplanation,
    formatMetricValue,
    formatCausalFactor,
    formatConfidenceInterval,
    formatConfidenceLevel,
    generateTooltipTitle,
} from './explanationGenerator';

// ============================================================================
// NOVOS SERVIÇOS - ANALYTICS AVANÇADO
// ============================================================================

// Performance Analyzer - Análise de performance histórica
export { PerformanceAnalyzer } from './performanceAnalyzer';
export type {
    PerformanceSnapshot,
    PerformanceFilters,
    TimeSeriesPoint,
    PerformanceStats,
    TrendAnalysis,
    DayOfWeekPattern,
    HourOfDayPattern,
    DataQualityAssessment,
    AlternativeComparison,
} from './performanceAnalyzer';

// Alternative Generator - Gerador de alternativas
export { AlternativeGenerator } from './alternativeGenerator';
export type { DispatchFormData, Alternative } from './alternativeGenerator';

// Insight Generator - Gerador de insights
export { InsightGenerator } from './insightGenerator';
export type { InsightType, SeverityLevel, Insight } from './insightGenerator';
