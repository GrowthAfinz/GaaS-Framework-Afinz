/**
 * =============================================================================
 * SIMILARITY ENGINE
 * =============================================================================
 *
 * Motor de similaridade multi-dimensional
 * Calcula score de similaridade entre campanhas baseado em 15 dimensoes
 *
 * Match Levels:
 * - Exact (100%): Todas dimensoes identicas
 * - High (80%): BU + Segmento + Canal + Perfil
 * - Medium (60%): BU + Segmento
 * - Low (40%): Apenas BU
 * - Fallback (20%): Sem match
 */

import {
    ProcessedActivity,
    FormDataInput,
    SimilarityMatch,
    SimilarityDimension,
    SimilarityWeights,
    MatchLevel,
    DEFAULT_SIMILARITY_WEIGHTS
} from './types';

/**
 * Encontra activities similares ordenadas por score
 */
export function findSimilarActivities(
    activities: ProcessedActivity[],
    formData: FormDataInput,
    weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS,
    limit: number = 100
): SimilarityMatch[] {
    const matches = activities
        .map(activity => calculateSimilarity(activity, formData, weights))
        .filter(match => match.score > 0)
        .sort((a, b) => b.score - a.score);

    return matches.slice(0, limit);
}

/**
 * Calcula similaridade entre uma activity e os dados do form
 */
function calculateSimilarity(
    activity: ProcessedActivity,
    formData: FormDataInput,
    weights: SimilarityWeights
): SimilarityMatch {
    const dimensionScores: Record<SimilarityDimension, number> = {} as any;
    const matchedDimensions: SimilarityDimension[] = [];

    let totalScore = 0;
    let totalWeight = 0;

    // Dimensoes categoricas
    const dimensionMappings: Array<{
        dimension: SimilarityDimension;
        formField: keyof FormDataInput;
        featureKey: string;
    }> = [
        { dimension: 'BU', formField: 'bu', featureKey: 'BU' },
        { dimension: 'Segmento', formField: 'segmento', featureKey: 'Segmento' },
        { dimension: 'Canal', formField: 'canal', featureKey: 'Canal' },
        { dimension: 'Jornada', formField: 'jornada', featureKey: 'Jornada' },
        { dimension: 'Perfil_Credito', formField: 'perfilCredito', featureKey: 'Perfil_Credito' },
        { dimension: 'Oferta', formField: 'oferta', featureKey: 'Oferta' },
        { dimension: 'Promocional', formField: 'promocional', featureKey: 'Promocional' },
        { dimension: 'Parceiro', formField: 'parceiro', featureKey: 'Parceiro' },
        { dimension: 'Subgrupo', formField: 'subgrupo', featureKey: 'Subgrupo' },
        { dimension: 'Etapa_Aquisicao', formField: 'etapaAquisicao', featureKey: 'Etapa_Aquisicao' },
        { dimension: 'Produto', formField: 'produto', featureKey: 'Produto' },
    ];

    dimensionMappings.forEach(({ dimension, formField, featureKey }) => {
        const formValue = formData[formField];
        const activityValue = activity.features[featureKey];
        const weight = weights[dimension];

        if (formValue && activityValue) {
            const score = compareValues(String(formValue), String(activityValue));
            dimensionScores[dimension] = score;
            totalScore += score * weight;
            totalWeight += weight;

            if (score === 1) {
                matchedDimensions.push(dimension);
            }
        } else if (formValue) {
            // Form tem valor mas activity nao -> penalidade
            dimensionScores[dimension] = 0;
            totalWeight += weight;
        }
    });

    // Score temporal (bonus para activities recentes)
    const temporalWeight = weights.Temporal;
    const temporalScore = activity.temporalWeight; // 0-1
    dimensionScores.Temporal = temporalScore;
    totalScore += temporalScore * temporalWeight;
    totalWeight += temporalWeight;

    // Normalizar score para 0-100
    const normalizedScore = totalWeight > 0
        ? (totalScore / totalWeight) * 100
        : 0;

    // Determinar nivel de match
    const level = determineMatchLevel(matchedDimensions);

    return {
        activity,
        score: Math.round(normalizedScore * 100) / 100,
        level,
        matchedDimensions,
        dimensionScores
    };
}

/**
 * Compara dois valores (match exato ou parcial)
 */
function compareValues(value1: string | undefined | null, value2: string | undefined | null): number {
    // Guard: se algum valor é undefined/null, retorna 0
    if (!value1 || !value2) return 0;

    const normalized1 = normalizeValue(value1);
    const normalized2 = normalizeValue(value2);

    // Guard: se normalização resultou vazio, retorna 0
    if (!normalized1 || !normalized2) return 0;

    // Match exato
    if (normalized1 === normalized2) return 1;

    // Match parcial (um contem o outro)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.7;
    }

    // Similaridade de Levenshtein para strings parecidas
    const similarity = calculateStringSimilarity(normalized1, normalized2);
    if (similarity > 0.8) return 0.5;

    return 0;
}

/**
 * Normaliza valor para comparacao
 */
function normalizeValue(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Calcula similaridade entre duas strings (0-1)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    if (str1.length === 0 && str2.length === 0) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const maxLen = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);

    return 1 - distance / maxLen;
}

/**
 * Calcula distancia de Levenshtein
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Otimizacao para strings pequenas
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array(m + 1).fill(null)
        .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // Delecao
                dp[i][j - 1] + 1,      // Insercao
                dp[i - 1][j - 1] + cost // Substituicao
            );
        }
    }

    return dp[m][n];
}

/**
 * Determina nivel de match baseado nas dimensoes matchadas
 */
function determineMatchLevel(matchedDimensions: SimilarityDimension[]): MatchLevel {
    const hasAll = (dims: SimilarityDimension[]) =>
        dims.every(d => matchedDimensions.includes(d));

    // Exact: Todas as principais
    const mainDims: SimilarityDimension[] = [
        'BU', 'Segmento', 'Canal', 'Jornada', 'Perfil_Credito',
        'Oferta', 'Parceiro', 'Subgrupo', 'Etapa_Aquisicao', 'Produto'
    ];
    if (hasAll(mainDims)) return 'exact';

    // High: BU + Segmento + Canal + Perfil
    if (hasAll(['BU', 'Segmento', 'Canal', 'Perfil_Credito'])) return 'high';

    // Medium: BU + Segmento
    if (hasAll(['BU', 'Segmento'])) return 'medium';

    // Low: Apenas BU
    if (matchedDimensions.includes('BU')) return 'low';

    // Fallback
    return 'fallback';
}

/**
 * Filtra matches por nivel minimo
 */
export function filterByMatchLevel(
    matches: SimilarityMatch[],
    minLevel: MatchLevel
): SimilarityMatch[] {
    const levelOrder: MatchLevel[] = ['exact', 'high', 'medium', 'low', 'fallback'];
    const minIndex = levelOrder.indexOf(minLevel);

    return matches.filter(m => {
        const matchIndex = levelOrder.indexOf(m.level);
        return matchIndex <= minIndex;
    });
}

/**
 * Agrupa matches por nivel
 */
export function groupByMatchLevel(
    matches: SimilarityMatch[]
): Record<MatchLevel, SimilarityMatch[]> {
    const groups: Record<MatchLevel, SimilarityMatch[]> = {
        exact: [],
        high: [],
        medium: [],
        low: [],
        fallback: []
    };

    matches.forEach(m => {
        groups[m.level].push(m);
    });

    return groups;
}

/**
 * Seleciona melhor grupo de matches para projecao
 */
export function selectBestMatchGroup(
    matches: SimilarityMatch[],
    minSampleSize: number = 5
): { matches: SimilarityMatch[]; level: MatchLevel } {
    const groups = groupByMatchLevel(matches);

    const levels: MatchLevel[] = ['exact', 'high', 'medium', 'low', 'fallback'];

    for (const level of levels) {
        if (groups[level].length >= minSampleSize) {
            return { matches: groups[level], level };
        }
    }

    // Fallback: retorna todos os matches disponiveis
    return {
        matches: matches.length > 0 ? matches : [],
        level: 'fallback'
    };
}

/**
 * Calcula score de confianca baseado nos matches
 */
export function calculateConfidenceScore(
    matches: SimilarityMatch[],
    level: MatchLevel
): number {
    if (matches.length === 0) return 0;

    // Base score por nivel
    const levelScores: Record<MatchLevel, number> = {
        exact: 95,
        high: 80,
        medium: 65,
        low: 45,
        fallback: 25
    };

    const baseScore = levelScores[level];

    // Bonus por quantidade de amostras (max +15)
    const sampleBonus = Math.min(15, Math.log10(matches.length + 1) * 10);

    // Bonus por score medio dos matches (max +10)
    const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
    const scoreBonus = (avgScore / 100) * 10;

    return Math.min(100, Math.round(baseScore + sampleBonus + scoreBonus));
}
