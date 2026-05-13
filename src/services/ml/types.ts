/**
 * =============================================================================
 * AI ORCHESTRATOR - TIPOS E INTERFACES
 * =============================================================================
 *
 * Sistema de IA Avancado para projecao de metricas de campanhas
 * Utiliza algoritmos de causalidade (Shapley Values, Confounders)
 *
 * Arquitetura:
 * - AIOrchestrator: Cerebro principal
 * - CausalAnalyzer: Analise de causalidade
 * - SimilarityEngine: Match multi-dimensional
 * - PredictionEngine: Motor de predicoes
 * - ExplanationGenerator: Explicacoes em texto
 */

import { ActivityRow } from '../../types/activity';

// =============================================================================
// TIPOS BASE
// =============================================================================

/**
 * Dimensoes usadas para calculo de similaridade
 */
export type SimilarityDimension =
    | 'BU'
    | 'Segmento'
    | 'Canal'
    | 'Jornada'
    | 'Perfil_Credito'
    | 'Oferta'
    | 'Promocional'
    | 'Parceiro'
    | 'Subgrupo'
    | 'Etapa_Aquisicao'
    | 'Produto'
    | 'Temporal';

/**
 * Metricas projetaveis pelo sistema
 */
export type ProjectableMetric =
    | 'volume'
    | 'taxaConversao'
    | 'baseAcionavel'
    | 'cac'
    | 'taxaEntrega'
    | 'taxaAbertura'
    | 'propostas'
    | 'aprovados'
    | 'cartoesGerados';

/**
 * Metodo usado para projecao
 */
export type ProjectionMethod =
    | 'causal'      // Shapley Values + Intervention
    | 'correlation' // Correlacao estatistica
    | 'frequency'   // Frequencia de ocorrencia
    | 'fallback';   // Sem dados suficientes

/**
 * Nivel de match de similaridade
 */
export type MatchLevel =
    | 'exact'    // 100% - Todas dimensoes identicas
    | 'high'     // 80% - BU + Seg + Canal + Perfil
    | 'medium'   // 60% - BU + Segmento
    | 'low'      // 40% - Apenas BU
    | 'fallback'; // 20% - Sem match

/**
 * Qualidade dos dados para projecao
 */
export type DataQuality = 'high' | 'medium' | 'low';

// =============================================================================
// CONFIGURACAO DE PESOS
// =============================================================================

/**
 * Pesos para calculo de similaridade multi-dimensional
 * Total: 100%
 */
export interface SimilarityWeights {
    BU: number;              // 15%
    Segmento: number;        // 15%
    Canal: number;           // 12%
    Jornada: number;         // 10%
    Perfil_Credito: number;  // 10%
    Oferta: number;          // 8%
    Promocional: number;     // 5%
    Parceiro: number;        // 5%
    Subgrupo: number;        // 5%
    Etapa_Aquisicao: number; // 5%
    Produto: number;         // 5%
    Temporal: number;        // 5%
}

/**
 * Pesos padrao
 */
export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
    BU: 15,
    Segmento: 15,
    Canal: 12,
    Jornada: 10,
    Perfil_Credito: 10,
    Oferta: 8,
    Promocional: 5,
    Parceiro: 5,
    Subgrupo: 5,
    Etapa_Aquisicao: 5,
    Produto: 5,
    Temporal: 5,
};

// =============================================================================
// INTERFACES DE ENTRADA
// =============================================================================

/**
 * Dados do formulario para projecao
 */
export interface FormDataInput {
    bu?: string;
    segmento?: string;
    canal?: string;
    jornada?: string;
    perfilCredito?: string;
    oferta?: string;
    promocional?: string;
    parceiro?: string;
    subgrupo?: string;
    etapaAquisicao?: string;
    produto?: string;
    baseVolume?: number;
    dataDisparo?: string;
    horarioDisparo?: string;
}

/**
 * Opcoes de configuracao do orquestrador
 */
export interface OrchestratorConfig {
    // Janela temporal (dias)
    temporalWindow: number;

    // Minimo de amostras para projecao confiavel
    minSampleSize: number;

    // Pesos de similaridade personalizados
    similarityWeights?: Partial<SimilarityWeights>;

    // Fator de decaimento temporal (0-1)
    temporalDecayFactor: number;

    // Habilitar analise causal (mais lento, mais preciso)
    enableCausalAnalysis: boolean;
}

/**
 * Configuracao padrao
 */
export const DEFAULT_CONFIG: OrchestratorConfig = {
    temporalWindow: 90,
    minSampleSize: 5,
    temporalDecayFactor: 0.5,
    enableCausalAnalysis: true,
};

// =============================================================================
// INTERFACES DE SAIDA - PROJECOES
// =============================================================================

/**
 * Fator causal identificado
 */
export interface CausalFactor {
    feature: string;                    // Nome da feature (ex: "Canal")
    value: string;                      // Valor da feature (ex: "WhatsApp")
    impact: number;                     // Impacto em % (-100 a +100)
    direction: 'positive' | 'negative'; // Direcao do impacto
    explanation: string;                // Explicacao em texto
    shapleyValue?: number;              // Contribuicao Shapley
    isConfounder?: boolean;             // Se e um confounder
}

/**
 * Fator de correlacao
 */
export interface CorrelationFactor {
    feature: string;
    correlation: number; // -1 a +1
    pValue: number;      // Significancia estatistica
}

/**
 * Referencia a campanha similar
 */
export interface CampaignReference {
    id: string;
    activityName: string;
    dataDisparo: string;
    metricValue: number;
    similarityScore: number;
}

/**
 * Explicacao da projecao
 */
export interface ProjectionExplanation {
    summary: string;                      // Ex: "Baseado em 47 disparos similares"
    causalFactors: CausalFactor[];        // Fatores que CAUSAM o resultado
    correlationFactors: CorrelationFactor[]; // Fatores correlacionados
    timeDecay: string;                    // Ex: "Peso maior para ultimos 30 dias"
    sampleSize: number;
    dataQuality: DataQuality;
    matchLevel: MatchLevel;
    matchPercentage: number;
}

/**
 * Resultado de projecao para um campo
 */
export interface FieldProjection {
    field: ProjectableMetric;
    projectedValue: number;
    confidence: number;                   // 0-100
    interval: {
        min: number;
        max: number;
    };
    method: ProjectionMethod;
    explanation: ProjectionExplanation;
    similarCampaigns: CampaignReference[];
    metadata: {
        computedAt: string;
        version: string;
    };
}

/**
 * Resultado completo de todas as projecoes
 */
export interface AllProjectionsResult {
    projections: Record<ProjectableMetric, FieldProjection>;
    overallConfidence: number;
    totalSampleSize: number;
    computedAt: string;
}

// =============================================================================
// INTERFACES INTERNAS - PROCESSAMENTO
// =============================================================================

/**
 * Activity processada para analise
 */
export interface ProcessedActivity {
    id: string;
    raw: ActivityRow;

    // Features normalizadas
    features: Record<string, string | number>;

    // Metricas extraidas
    metrics: Record<ProjectableMetric, number>;

    // Peso temporal (0-1)
    temporalWeight: number;

    // Data de disparo como Date
    dispatchDate: Date;
}

/**
 * Match de similaridade
 */
export interface SimilarityMatch {
    activity: ProcessedActivity;
    score: number;              // 0-100
    level: MatchLevel;
    matchedDimensions: SimilarityDimension[];
    dimensionScores: Record<SimilarityDimension, number>;
}

/**
 * Resultado de analise causal
 */
export interface CausalAnalysisResult {
    targetMetric: ProjectableMetric;
    shapleyValues: Record<string, number>;
    confounders: string[];
    interventionEffects: InterventionEffect[];
    featureImportance: FeatureImportance[];
}

/**
 * Efeito de intervencao
 */
export interface InterventionEffect {
    fromFeature: string;
    fromValue: string;
    toValue: string;
    expectedChange: number;
    confidence: number;
    sampleSizeFrom: number;
    sampleSizeTo: number;
}

/**
 * Importancia de feature
 */
export interface FeatureImportance {
    feature: string;
    importance: number;    // 0-100
    rank: number;          // 1 = mais importante
}

// =============================================================================
// INTERFACES DO ORQUESTRADOR
// =============================================================================

/**
 * Interface principal do AIOrchestrator
 */
export interface IAIOrchestrator {
    /**
     * Inicializa o orquestrador com dados historicos
     */
    initialize(activities: ActivityRow[]): void;

    /**
     * Projeta um campo especifico
     */
    projectField(
        fieldName: ProjectableMetric,
        formData: FormDataInput
    ): FieldProjection;

    /**
     * Projeta todos os campos de uma vez
     */
    projectAllFields(formData: FormDataInput): AllProjectionsResult;

    /**
     * Sugere valor para um campo
     */
    suggestFieldValue(
        fieldName: string,
        formData: FormDataInput
    ): { value: string; confidence: number; source: string }[];

    /**
     * Retorna analise causal para uma metrica
     */
    getCausalAnalysis(
        metric: ProjectableMetric,
        formData: FormDataInput
    ): CausalAnalysisResult;

    /**
     * Verifica se o orquestrador esta pronto
     */
    isReady(): boolean;

    /**
     * Retorna estatisticas do dataset
     */
    getDatasetStats(): {
        totalActivities: number;
        dateRange: { from: Date; to: Date };
        buDistribution: Record<string, number>;
        segmentoDistribution: Record<string, number>;
    };
}

// =============================================================================
// CONSTANTES DE MAPEAMENTO
// =============================================================================

/**
 * Mapeamento de metricas para campos do ActivityRow
 */
export const METRIC_FIELD_MAP: Record<ProjectableMetric, keyof ActivityRow> = {
    volume: 'Base Total',
    taxaConversao: 'Taxa de Conversão',
    baseAcionavel: 'Base Acionável',
    cac: 'CAC',
    taxaEntrega: 'Taxa de Entrega',
    taxaAbertura: 'Taxa de Abertura',
    propostas: 'Propostas',
    aprovados: 'Aprovados',
    cartoesGerados: 'Cartões Gerados',
};

/**
 * Mapeamento de dimensoes para campos do ActivityRow
 */
export const DIMENSION_FIELD_MAP: Record<SimilarityDimension, keyof ActivityRow> = {
    BU: 'BU',
    Segmento: 'Segmento',
    Canal: 'Canal',
    Jornada: 'jornada',
    Perfil_Credito: 'Perfil de Crédito',
    Oferta: 'Oferta',
    Promocional: 'Promocional',
    Parceiro: 'Parceiro',
    Subgrupo: 'Subgrupos',
    Etapa_Aquisicao: 'Etapa de aquisição',
    Produto: 'Produto',
    Temporal: 'Data de Disparo',
};

/**
 * Custos unitarios por canal
 */
export const CHANNEL_UNIT_COSTS: Record<string, number> = {
    'E-mail': 0.001,
    'Push': 0.001,
    'SMS': 0.064,
    'WhatsApp': 0.420,
};

/**
 * Custos unitarios por oferta
 */
export const OFFER_UNIT_COSTS: Record<string, number> = {
    'Padrão': 0.00,
    'Limite': 1.00,
    'Vibe': 2.00,
    'Anuidade': 76.50,
};
