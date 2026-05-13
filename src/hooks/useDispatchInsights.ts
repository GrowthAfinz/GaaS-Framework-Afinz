/**
 * =============================================================================
 * USE DISPATCH INSIGHTS - Hook Principal
 * =============================================================================
 *
 * Responsabilidades:
 * 1. Coordenar os 3 services (Performance, Alternatives, Insights)
 * 2. Debounce de cálculos (evita recomputação frequente)
 * 3. Caching de resultados
 * 4. Error handling
 * 5. Loading states
 * 6. Refresh manual
 *
 * Entrada: FormData + Activities
 * Saída: Performance + Alternatives + Insights (tudo pronto para UI)
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ActivityRow } from '../types/activity';
import { PerformanceAnalyzer, type PerformanceSnapshot, type ProjectableMetric } from '../services/ml/performanceAnalyzer';
import { AlternativeGenerator, type Alternative, type DispatchFormData } from '../services/ml/alternativeGenerator';
import { InsightGenerator, type Insight } from '../services/ml/insightGenerator';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface UseDispatchInsightsResult {
  /** Análise de performance */
  performance: PerformanceSnapshot | null;

  /** Alternativas geradas */
  alternatives: Alternative[];

  /** Insights recomendados */
  insights: Insight[];

  /** Está carregando? */
  isLoading: boolean;

  /** Erro durante cálculo? */
  error: string | null;

  /** Métrica atualmente exibida */
  currentMetric: ProjectableMetric;

  /** Mudar métrica exibida */
  setCurrentMetric: (metric: ProjectableMetric) => void;

  /** Forçar recálculo */
  refresh: () => Promise<void>;

  /** Data do último cálculo */
  lastCalculatedAt: Date | null;
}

// =============================================================================
// CONFIGURAÇÕES
// =============================================================================

const DEFAULT_METRIC: ProjectableMetric = 'taxaConversao';
const DEBOUNCE_MS = 500; // Aguardar 500ms após mudança antes de calcular
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache por 5 minutos

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useDispatchInsights(
  formData: DispatchFormData | null,
  activities: ActivityRow[] | null
): UseDispatchInsightsResult {
  // State
  const [performance, setPerformance] = useState<PerformanceSnapshot | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMetric, setCurrentMetric] = useState<ProjectableMetric>(DEFAULT_METRIC);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<Date | null>(null);

  // Refs
  const servicesRef = useRef<{
    analyzer: PerformanceAnalyzer;
    altGen: AlternativeGenerator;
    insightGen: InsightGenerator;
  } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  // ===========================================================================
  // INICIALIZAR SERVICES
  // ===========================================================================

  useEffect(() => {
    console.log('[useDispatchInsights] Inicializando services...', {
      activitiesCount: activities?.length || 0
    });

    if (!activities || activities.length === 0) {
      console.log('[useDispatchInsights] Sem atividades disponíveis');
      setError('Nenhuma atividade disponível para análise');
      servicesRef.current = null;
      return;
    }

    try {
      setError(null);

      const analyzer = new PerformanceAnalyzer();
      analyzer.initialize(activities);

      const altGen = new AlternativeGenerator(analyzer);
      altGen.initialize(activities);

      const insightGen = new InsightGenerator();

      servicesRef.current = { analyzer, altGen, insightGen };
      console.log('[useDispatchInsights] Services inicializados com sucesso');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao inicializar análise';
      console.error('[useDispatchInsights] Erro ao inicializar:', err);
      setError(message);
      servicesRef.current = null;
    }
  }, [activities]);

  // ===========================================================================
  // CALCULAR INSIGHTS
  // ===========================================================================

  const calculateInsights = useCallback(async () => {
    if (!formData || !servicesRef.current) {
      setPerformance(null);
      setAlternatives([]);
      setInsights([]);
      return;
    }

    const cacheKey = generateCacheKey(formData, currentMetric);

    // Verificar cache
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const { perf, alts, inights } = cached.data;
      setPerformance(perf);
      setAlternatives(alts);
      setInsights(inights);
      setLastCalculatedAt(new Date());
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { analyzer, altGen, insightGen } = servicesRef.current;

      // 1. Analisar performance
      const filters = {
        bu: formData.bu,
        canal: formData.canal,
        segmento: formData.segmento,
        jornada: formData.jornada,
        perfilCredito: formData.perfilCredito,
        oferta: formData.oferta,
        windowDays: 90,
        onlyCompleted: true,
      };

      console.log('[useDispatchInsights] Analisando performance com filtros:', filters);
      const perf = analyzer.analyzePerformance(filters, currentMetric);
      console.log('[useDispatchInsights] Performance analisada:', {
        sampleSize: perf.sampleSize,
        timeseriesLength: perf.timeseries?.length || 0,
        dayOfWeekPatternsLength: perf.dayOfWeekPatterns?.length || 0
      });

      // 2. Gerar alternativas
      console.log('[useDispatchInsights] Gerando alternativas...');
      const alts = altGen.generateAlternatives(formData, currentMetric, 5);
      console.log('[useDispatchInsights] Alternativas geradas:', alts.length);

      // 3. Gerar insights
      console.log('[useDispatchInsights] Gerando insights...');
      const inights = insightGen.generateInsights(formData as any, perf, alts, perf.trend);
      console.log('[useDispatchInsights] Insights gerados:', inights.length);

      // Cachear resultados
      cacheRef.current.set(cacheKey, {
        data: { perf, alts, inights },
        timestamp: Date.now(),
      });

      setPerformance(perf);
      setAlternatives(alts);
      setInsights(inights);
      setLastCalculatedAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao calcular insights';
      setError(message);
      console.error('[useDispatchInsights] ERRO ao calcular insights:', err);
      console.error('[useDispatchInsights] Stack:', err instanceof Error ? err.stack : 'N/A');
    } finally {
      setIsLoading(false);
    }
  }, [formData, currentMetric]);

  // ===========================================================================
  // DEBOUNCE AUTOMÁTICO
  // ===========================================================================

  useEffect(() => {
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Usar validação de dados antes de iniciar debounce
    if (!formData || !servicesRef.current) {
      return;
    }

    // Validar que temos dados suficientes
    if (!formData.bu || !formData.canal) {
      return;
    }

    // Iniciar novo timer
    debounceTimerRef.current = setTimeout(() => {
      calculateInsights();
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, currentMetric, calculateInsights]);

  // ===========================================================================
  // REFRESH MANUAL
  // ===========================================================================

  const refresh = useCallback(async () => {
    // Limpar cache para esta combinação
    const cacheKey = generateCacheKey(formData || {}, currentMetric);
    cacheRef.current.delete(cacheKey);

    // Recalcular
    await calculateInsights();
  }, [formData, currentMetric, calculateInsights]);

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ===========================================================================
  // RETORNO
  // ===========================================================================

  return {
    performance,
    alternatives,
    insights,
    isLoading,
    error,
    currentMetric,
    setCurrentMetric,
    refresh,
    lastCalculatedAt,
  };
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Gera chave de cache baseada em formData e métrica
 */
function generateCacheKey(formData: Partial<DispatchFormData>, metric: ProjectableMetric): string {
  return JSON.stringify({
    bu: formData.bu,
    canal: formData.canal,
    segmento: formData.segmento,
    jornada: formData.jornada,
    perfilCredito: formData.perfilCredito,
    oferta: formData.oferta,
    metric,
  });
}

// =============================================================================
// HOOK AUXILIAR: Extrair Dados para Gráfico 1
// =============================================================================

export function usePerformanceTimelineData(
  result: UseDispatchInsightsResult
): {
  performance: PerformanceSnapshot | null;
  metric: ProjectableMetric;
  onMetricChange: (metric: ProjectableMetric) => void;
  isLoading: boolean;
} {
  return {
    performance: result.performance,
    metric: result.currentMetric,
    onMetricChange: result.setCurrentMetric,
    isLoading: result.isLoading,
  };
}

// =============================================================================
// HOOK AUXILIAR: Extrair Dados para Gráfico 2
// =============================================================================

export function useComparativeAnalysisData(
  result: UseDispatchInsightsResult
): {
  currentValue: number;
  alternatives: Alternative[];
  metric: ProjectableMetric;
  isLoading: boolean;
} {
  return {
    currentValue: result.performance?.stats.median ?? 0,
    alternatives: result.alternatives,
    metric: result.currentMetric,
    isLoading: result.isLoading,
  };
}

// =============================================================================
// HOOK AUXILIAR: Extrair Dados para Insight Cards
// =============================================================================

export function useInsightCardsData(
  result: UseDispatchInsightsResult
): {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
} {
  return {
    insights: result.insights,
    isLoading: result.isLoading,
    error: result.error,
  };
}
