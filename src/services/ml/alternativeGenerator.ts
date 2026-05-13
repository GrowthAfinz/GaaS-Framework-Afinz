/**
 * =============================================================================
 * ALTERNATIVE GENERATOR - Gerador de Alternativas
 * =============================================================================
 *
 * Responsabilidades:
 * 1. Gerar 4-5 alternativas alterando um campo por vez
 * 2. Para cada alternativa, projetar performance esperada
 * 3. Ordenar por impacto (melhoria esperada)
 * 4. Calcular confiança e risco
 * 5. Preparar para apresentação (UI-ready format)
 *
 * Output: Lista de alternativas com métricas, confiança e explicações
 */

import { ActivityRow } from '../../types/activity';
import { ProjectableMetric } from './types';
import { PerformanceAnalyzer, PerformanceFilters, AlternativeComparison } from './performanceAnalyzer';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface DispatchFormData {
  /** Business Unit */
  bu?: string;

  /** Canal de comunicação */
  canal?: string;

  /** Segmento */
  segmento?: string;

  /** Jornada */
  jornada?: string;

  /** Perfil de Crédito */
  perfilCredito?: string;

  /** Oferta */
  oferta?: string;

  /** Data de Disparo */
  dataDisparo?: string;

  /** Horário de Disparo */
  horarioDisparo?: string;

  /** Base Total (volume) */
  baseTotal?: number;

  /** Outras... */
  [key: string]: any;
}

export interface Alternative {
  /** ID único para rastreamento */
  id: string;

  /** Tipo de alternativa */
  type: 'timing' | 'channel' | 'offer' | 'journey' | 'segment' | 'combined';

  /** Título em português */
  title: string;

  /** Descrição detalhada */
  description: string;

  /** Qual campo foi mudado */
  changedField: string;

  /** Valor anterior */
  previousValue: any;

  /** Novo valor recomendado */
  newValue: any;

  /** Forma como é exibido ao usuário */
  displayText: string;

  /** Impacto esperado em % */
  improvementPercent: number;

  /** Métrica principal alterada */
  metric: 'conversionRate' | 'cac' | 'cards' | 'roi';

  /** Valor esperado da métrica */
  expectedMetricValue: number;

  /** Confiança (0-100%) */
  confidence: number;

  /** Nível de risco */
  riskLevel: 'low' | 'medium' | 'high';

  /** Número de disparos similares no histórico */
  sampleCount: number;

  /** Dados para aplicar ao formulário */
  appliedChanges: Partial<DispatchFormData>;

  /** Ícone para UI */
  icon: string;

  /** Cor para UI */
  badgeColor: string;

  /** Dados completos de performance (para gráfico) */
  performanceData?: any;

  /** Razão pela qual esta alternativa foi gerada */
  reason: string;

  /** Se já foi aceita/rejeitada pelo usuário */
  userFeedback?: 'accepted' | 'rejected';
}

// =============================================================================
// ALTERNATIVE GENERATOR
// =============================================================================

export class AlternativeGenerator {
  private analyzer: PerformanceAnalyzer;
  private activities: ActivityRow[];

  constructor(analyzer: PerformanceAnalyzer) {
    this.analyzer = analyzer;
    this.activities = [];
  }

  /**
   * Inicializa o gerador com dados históricos
   */
  public initialize(activities: ActivityRow[]): void {
    this.activities = activities || [];
  }

  /**
   * Gera alternativas para o setup atual
   * Altera um campo por vez para mostrar impacto
   *
   * @example
   * const alternatives = generator.generateAlternatives(
   *   {
   *     bu: 'B2C',
   *     canal: 'SMS',
   *     segmento: 'CRM',
   *     jornada: 'Retenção',
   *     dataDisparo: '2026-02-15'
   *   },
   *   'taxaConversao'  // métrica principal
   * );
   */
  public generateAlternatives(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric = 'taxaConversao',
    maxAlternatives: number = 5
  ): Alternative[] {
    const alternatives: Alternative[] = [];

    // Gerar variação 1: Melhor dia da semana
    const timingAlt = this.generateTimingAlternative(currentSetup, primaryMetric);
    if (timingAlt) alternatives.push(timingAlt);

    // Gerar variação 2: Melhor canal
    const channelAlt = this.generateChannelAlternative(currentSetup, primaryMetric);
    if (channelAlt) alternatives.push(channelAlt);

    // Gerar variação 3: Melhor oferta
    const offerAlt = this.generateOfferAlternative(currentSetup, primaryMetric);
    if (offerAlt) alternatives.push(offerAlt);

    // Gerar variação 4: Melhor jornada
    const journeyAlt = this.generateJourneyAlternative(currentSetup, primaryMetric);
    if (journeyAlt) alternatives.push(journeyAlt);

    // Gerar variação 5: Melhor segmento (se aplicável)
    const segmentAlt = this.generateSegmentAlternative(currentSetup, primaryMetric);
    if (segmentAlt) alternatives.push(segmentAlt);

    // Ordenar por impacto (descrescente)
    alternatives.sort((a, b) => b.improvementPercent - a.improvementPercent);

    // Limitar a N alternativas
    return alternatives.slice(0, maxAlternatives);
  }

  /**
   * Gera alternativa de timing (melhor dia/hora)
   */
  private generateTimingAlternative(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric
  ): Alternative | null {
    try {
      const baselineFilters = this.setupToFilters(currentSetup);
      const baseline = this.analyzer['analyzePerformance'](baselineFilters, primaryMetric);

      if (baseline.sampleSize < 3) {
        return null;
      }

      // Verificar se há padrões de dia da semana
      if (!baseline.dayOfWeekPatterns || baseline.dayOfWeekPatterns.length === 0) {
        console.log('[AlternativeGenerator] Sem padrões de dia da semana disponíveis');
        return null;
      }

      // Encontrar melhor dia
      const bestDay = baseline.dayOfWeekPatterns.reduce(
        (best, day) => (day.average > best.average ? day : best),
        baseline.dayOfWeekPatterns[0]
      );

      if (!bestDay || bestDay.multiplier <= 1.02) {
        // < 2% melhoria não é significativo
        return null;
      }

      // Calcular nova data para o melhor dia
      const currentDate = currentSetup.dataDisparo ? new Date(currentSetup.dataDisparo) : new Date();
      const targetDayOfWeek = bestDay.dayOfWeek;
      const daysUntilTarget = (targetDayOfWeek - currentDate.getDay() + 7) % 7;
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));

      const improvement = (bestDay.multiplier - 1) * 100;

      return {
        id: `timing-${bestDay.dayName}`,
        type: 'timing',
        title: `📅 Mudar para ${bestDay.dayName}`,
        description: `O padrão histórico mostra que ${bestDay.dayName} tem ${improvement.toFixed(0)}% melhor performance`,
        changedField: 'dataDisparo',
        previousValue: currentSetup.dataDisparo,
        newValue: newDate.toISOString().split('T')[0],
        displayText: `${bestDay.dayName} (${improvement.toFixed(0)}% melhor)`,
        improvementPercent: improvement,
        metric: 'conversionRate',
        expectedMetricValue: baseline.stats.median * bestDay.multiplier,
        confidence: Math.min(bestDay.confidence, 85),
        riskLevel: bestDay.confidence < 50 ? 'high' : bestDay.confidence < 70 ? 'medium' : 'low',
        sampleCount: bestDay.sampleCount,
        appliedChanges: {
          dataDisparo: newDate.toISOString().split('T')[0],
        },
        icon: '📅',
        badgeColor: 'bg-blue-500/20 text-blue-400',
        reason: `${bestDay.dayName} teve média de ${bestDay.average.toFixed(2)}% em ${bestDay.sampleCount} disparos similares`,
      };
    } catch (error) {
      console.error('Erro ao gerar alternativa de timing:', error);
      return null;
    }
  }

  /**
   * Gera alternativa de canal (melhor canal)
   */
  private generateChannelAlternative(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric
  ): Alternative | null {
    try {
      if (!currentSetup.bu || !currentSetup.segmento) {
        return null;
      }

      // Testar todos os canais
      const channels = ['E-mail', 'SMS', 'WhatsApp', 'Push'];
      const results: Array<{ channel: string; performance: any; comparison: any }> = [];

      for (const channel of channels) {
        if (channel === currentSetup.canal) continue; // Pular canal atual

        const filters = this.setupToFilters({ ...currentSetup, canal: channel });
        const performance = this.analyzer['analyzePerformance'](filters, primaryMetric);

        if (performance.sampleSize < 3) continue;

        results.push({
          channel,
          performance,
          comparison: null, // Preencheremos depois
        });
      }

      if (results.length === 0) {
        return null;
      }

      // Ordenar pelo melhor e pegar o primeiro
      results.sort((a, b) => b.performance.stats.median - a.performance.stats.median);

      const bestChannel = results[0];
      const currentFilters = this.setupToFilters(currentSetup);
      const currentPerformance = this.analyzer['analyzePerformance'](currentFilters, primaryMetric);

      const improvement =
        ((bestChannel.performance.stats.median - currentPerformance.stats.median) / currentPerformance.stats.median) * 100;

      if (improvement <= 2) {
        // < 2% melhoria não é significativo
        return null;
      }

      return {
        id: `channel-${bestChannel.channel}`,
        type: 'channel',
        title: `📱 Trocar para ${bestChannel.channel}`,
        description: `${bestChannel.channel} tem ${improvement.toFixed(0)}% melhor taxa de conversão`,
        changedField: 'canal',
        previousValue: currentSetup.canal,
        newValue: bestChannel.channel,
        displayText: `${bestChannel.channel} (${improvement.toFixed(0)}% melhor)`,
        improvementPercent: improvement,
        metric: 'conversionRate',
        expectedMetricValue: bestChannel.performance.stats.median,
        confidence: Math.min(bestChannel.performance.dataQuality.level === 'high' ? 85 : 65),
        riskLevel:
          bestChannel.performance.sampleSize < 5
            ? 'high'
            : bestChannel.performance.sampleSize < 10
            ? 'medium'
            : 'low',
        sampleCount: bestChannel.performance.sampleSize,
        appliedChanges: {
          canal: bestChannel.channel,
        },
        icon: '📱',
        badgeColor: 'bg-purple-500/20 text-purple-400',
        reason: `${bestChannel.channel} teve média ${bestChannel.performance.stats.median.toFixed(2)}% vs ${currentPerformance.stats.median.toFixed(2)}% com ${bestChannel.performance.sampleSize} disparos`,
      };
    } catch (error) {
      console.error('Erro ao gerar alternativa de canal:', error);
      return null;
    }
  }

  /**
   * Gera alternativa de oferta (melhor oferta)
   */
  private generateOfferAlternative(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric
  ): Alternative | null {
    try {
      if (!currentSetup.bu || !currentSetup.segmento) {
        return null;
      }

      const offers = ['Padrão', 'Limite', 'Vibe', 'Anuidade'];
      const results: Array<{ offer: string; performance: any }> = [];

      for (const offer of offers) {
        if (offer === currentSetup.oferta) continue;

        const filters = this.setupToFilters({ ...currentSetup, oferta: offer });
        const performance = this.analyzer['analyzePerformance'](filters, primaryMetric);

        if (performance.sampleSize < 3) continue;

        results.push({ offer, performance });
      }

      if (results.length === 0) {
        return null;
      }

      results.sort((a, b) => b.performance.stats.median - a.performance.stats.median);

      const bestOffer = results[0];
      const currentFilters = this.setupToFilters(currentSetup);
      const currentPerformance = this.analyzer['analyzePerformance'](currentFilters, primaryMetric);

      const improvement =
        ((bestOffer.performance.stats.median - currentPerformance.stats.median) / currentPerformance.stats.median) * 100;

      if (improvement <= 3) {
        // < 3% melhoria não é significativo para oferta
        return null;
      }

      return {
        id: `offer-${bestOffer.offer}`,
        type: 'offer',
        title: `🎁 Upgrade para ${bestOffer.offer}`,
        description: `Oferta ${bestOffer.offer} tem ${improvement.toFixed(0)}% melhor taxa de aceitação`,
        changedField: 'oferta',
        previousValue: currentSetup.oferta,
        newValue: bestOffer.offer,
        displayText: `${bestOffer.offer} (${improvement.toFixed(0)}% melhor)`,
        improvementPercent: improvement,
        metric: 'conversionRate',
        expectedMetricValue: bestOffer.performance.stats.median,
        confidence: 75,
        riskLevel: bestOffer.performance.sampleSize < 5 ? 'high' : 'medium',
        sampleCount: bestOffer.performance.sampleSize,
        appliedChanges: {
          oferta: bestOffer.offer,
        },
        icon: '🎁',
        badgeColor: 'bg-green-500/20 text-green-400',
        reason: `${bestOffer.offer} teve média ${bestOffer.performance.stats.median.toFixed(2)}% em ${bestOffer.performance.sampleSize} disparos`,
      };
    } catch (error) {
      console.error('Erro ao gerar alternativa de oferta:', error);
      return null;
    }
  }

  /**
   * Gera alternativa de jornada (melhor jornada)
   */
  private generateJourneyAlternative(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric
  ): Alternative | null {
    try {
      if (!currentSetup.bu || !currentSetup.segmento) {
        return null;
      }

      const journeys = ['Aquisição', 'Retenção', 'Upsell', 'Cross-sell'];
      const results: Array<{ journey: string; performance: any }> = [];

      for (const journey of journeys) {
        if (journey === currentSetup.jornada) continue;

        const filters = this.setupToFilters({ ...currentSetup, jornada: journey });
        const performance = this.analyzer['analyzePerformance'](filters, primaryMetric);

        if (performance.sampleSize < 3) continue;

        results.push({ journey, performance });
      }

      if (results.length === 0) {
        return null;
      }

      results.sort((a, b) => b.performance.stats.median - a.performance.stats.median);

      const bestJourney = results[0];
      const currentFilters = this.setupToFilters(currentSetup);
      const currentPerformance = this.analyzer['analyzePerformance'](currentFilters, primaryMetric);

      const improvement =
        ((bestJourney.performance.stats.median - currentPerformance.stats.median) / currentPerformance.stats.median) * 100;

      if (improvement <= 5) {
        return null; // < 5% é muito pouco para jornada
      }

      const journeyEmojis: Record<string, string> = {
        Aquisição: '🚀',
        Retenção: '❤️',
        Upsell: '📈',
        'Cross-sell': '🔀',
      };

      return {
        id: `journey-${bestJourney.journey}`,
        type: 'journey',
        title: `${journeyEmojis[bestJourney.journey] || '🎯'} Mudar para ${bestJourney.journey}`,
        description: `Jornada ${bestJourney.journey} tem ${improvement.toFixed(0)}% melhor conversão`,
        changedField: 'jornada',
        previousValue: currentSetup.jornada,
        newValue: bestJourney.journey,
        displayText: `${bestJourney.journey} (${improvement.toFixed(0)}% melhor)`,
        improvementPercent: improvement,
        metric: 'conversionRate',
        expectedMetricValue: bestJourney.performance.stats.median,
        confidence: 70,
        riskLevel: bestJourney.performance.sampleSize < 5 ? 'high' : 'medium',
        sampleCount: bestJourney.performance.sampleSize,
        appliedChanges: {
          jornada: bestJourney.journey,
        },
        icon: journeyEmojis[bestJourney.journey] || '🎯',
        badgeColor: 'bg-orange-500/20 text-orange-400',
        reason: `${bestJourney.journey} teve média ${bestJourney.performance.stats.median.toFixed(2)}% em ${bestJourney.performance.sampleSize} disparos`,
      };
    } catch (error) {
      console.error('Erro ao gerar alternativa de jornada:', error);
      return null;
    }
  }

  /**
   * Gera alternativa de segmento (melhor segmento)
   */
  private generateSegmentAlternative(
    currentSetup: DispatchFormData,
    primaryMetric: ProjectableMetric
  ): Alternative | null {
    try {
      if (!currentSetup.bu) {
        return null;
      }

      // Extrair segmentos únicos do histórico
      const segments = new Set<string>();
      for (const activity of this.activities) {
        if (activity.BU === currentSetup.bu && activity.Segmento) {
          segments.add(activity.Segmento);
        }
      }

      // Testar cada segmento
      const results: Array<{ segment: string; performance: any }> = [];

      for (const segment of segments) {
        if (segment === currentSetup.segmento) continue;

        const filters = this.setupToFilters({ ...currentSetup, segmento: segment });
        const performance = this.analyzer['analyzePerformance'](filters, primaryMetric);

        if (performance.sampleSize < 3) continue;

        results.push({ segment, performance });
      }

      if (results.length === 0) {
        return null;
      }

      results.sort((a, b) => b.performance.stats.median - a.performance.stats.median);

      const bestSegment = results[0];
      const currentFilters = this.setupToFilters(currentSetup);
      const currentPerformance = this.analyzer['analyzePerformance'](currentFilters, primaryMetric);

      const improvement =
        ((bestSegment.performance.stats.median - currentPerformance.stats.median) / currentPerformance.stats.median) * 100;

      if (improvement <= 3) {
        return null;
      }

      return {
        id: `segment-${bestSegment.segment}`,
        type: 'segment',
        title: `🎯 Mudar para Segmento ${bestSegment.segment}`,
        description: `Segmento ${bestSegment.segment} tem ${improvement.toFixed(0)}% melhor performance`,
        changedField: 'segmento',
        previousValue: currentSetup.segmento,
        newValue: bestSegment.segment,
        displayText: `${bestSegment.segment} (${improvement.toFixed(0)}% melhor)`,
        improvementPercent: improvement,
        metric: 'conversionRate',
        expectedMetricValue: bestSegment.performance.stats.median,
        confidence: 65,
        riskLevel: 'medium',
        sampleCount: bestSegment.performance.sampleSize,
        appliedChanges: {
          segmento: bestSegment.segment,
        },
        icon: '🎯',
        badgeColor: 'bg-pink-500/20 text-pink-400',
        reason: `${bestSegment.segment} teve média ${bestSegment.performance.stats.median.toFixed(2)}% em ${bestSegment.performance.sampleSize} disparos`,
      };
    } catch (error) {
      console.error('Erro ao gerar alternativa de segmento:', error);
      return null;
    }
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS
  // ===========================================================================

  private setupToFilters(setup: DispatchFormData): PerformanceFilters {
    return {
      bu: setup.bu,
      canal: setup.canal,
      segmento: setup.segmento,
      jornada: setup.jornada,
      perfilCredito: setup.perfilCredito,
      oferta: setup.oferta,
      windowDays: 90,
      onlyCompleted: true,
    };
  }
}
