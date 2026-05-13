import { Activity } from '../types/framework';
import { parseDate } from './formatters';

/**
 * =====================================================
 * ENGINE 1:  SUGESTÃO INTELIGENTE BASEADA EM HISTÓRICO
 * =====================================================
 * 
 * Analisa todo o FRAMEWORK histórico e sugere valores para TODOS os campos
 * baseado em probabilidade e frequência de uso.
 */

interface FieldSuggestion {
    value: string | number;
    confidence: number; // 0-100
    frequency: number; // Quantas vezes apareceu no histórico
    label?: string; // Label descritivo
}

interface SuggestionResult {
    field: string;
    suggestions: FieldSuggestion[];
    method: 'exact_match' | 'partial_match' | 'frequency';
}

/**
 * Engine 1: Sugere valores para campos baseado no histórico completo
 * 
 * @param activities - Histórico completo de atividades
 * @param currentFormData - Campos já preenchidos pelo usuário
 * @returns Mapa de sugestões por campo
 */
export function suggestFieldsBasedOnHistory(
    activities: Activity[],
    currentFormData: Record<string, any>
): Record<string, FieldSuggestion[]> {
    const suggestions: Record<string, FieldSuggestion[]> = {};

    // Lista de campos "sugeríveis"
    const suggestibleFields = [
        'parceiro',
        'subgrupo',
        'perfilCredito',
        'oferta',
        'promocional',
        'oferta2',
        'promocional2',
        'produto',
        'etapaAquisicao'
    ];

    suggestibleFields.forEach(field => {
        suggestions[field] = generateSuggestionsForField(
            field,
            activities,
            currentFormData
        );
    });

    return suggestions;
}

function generateSuggestionsForField(
    field: string,
    activities: Activity[],
    currentFormData: Record<string, any>
): FieldSuggestion[] {
    // Mapear campo do form para campo do Activity
    const fieldMap: Record<string, string> = {
        'parceiro': 'Parceiro',
        'subgrupo': 'Subgrupos',
        'perfilCredito': 'Perfil de Crédito',
        'oferta': 'Oferta',
        'promocional': 'Promocional',
        'oferta2': 'Oferta 2',
        'promocional2': 'Promocional 2',
        'produto': 'Produto',
        'etapaAquisicao': 'Etapa de aquisição'
    };

    const activityField = fieldMap[field];
    if (!activityField) return [];

    // Contar frequência de valores
    const valueCounts = new Map<string, number>();
    const contextualMatches = new Map<string, number>();

    activities.forEach(activity => {
        let value = activity[activityField] || (activity as any).raw?.[activityField];
        if (!value) return;

        value = String(value);

        // Contagem geral
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);

        // Contagem contextual (match parcial com campos preenchidos)
        const hasContextMatch =
            (!currentFormData.bu || activity.bu === currentFormData.bu) &&
            (!currentFormData.segmento || activity.segmento === currentFormData.segmento) &&
            (!currentFormData.jornada || activity.jornada === currentFormData.jornada);

        if (hasContextMatch) {
            contextualMatches.set(value, (contextualMatches.get(value) || 0) + 1);
        }
    });

    // Criar sugestões priorizando matches contextuais
    const allValues = Array.from(new Set([
        ...Array.from(contextualMatches.keys()),
        ...Array.from(valueCounts.keys())
    ]));

    const suggestions: FieldSuggestion[] = allValues
        .map(value => {
            const contextFreq = contextualMatches.get(value) || 0;
            const globalFreq = valueCounts.get(value) || 0;

            // Confidence based em:
            // - Context match peso 70%
            // - Global frequency peso 30%
            const totalContextual = Array.from(contextualMatches.values()).reduce((a, b) => a + b, 0);
            const totalGlobal = valueCounts.size || 1;

            const contextScore = totalContextual > 0 ? (contextFreq / totalContextual) * 70 : 0;
            const globalScore = (globalFreq / totalGlobal) * 30;

            return {
                value,
                confidence: Math.min(100, Math.round(contextScore + globalScore)),
                frequency: globalFreq,
                label: `${value} (usado ${globalFreq}x)`
            };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Top 5 sugestões

    return suggestions;
}

/**
 * NOTE: ENGINE 2 (Projection Engine) has been removed.
 *
 * Use AIOrchestrator from src/services/ml/AIOrchestrator.ts instead.
 * It provides sophisticated projections using:
 * - SimilarityEngine (11 dimensions)
 * - PredictionEngine (causal/correlation/frequency methods)
 * - CausalAnalyzer (Shapley Values)
 * - PerformanceAnalyzer (temporal analysis)
 * - ExplanationGenerator (humanized insights)
 */
