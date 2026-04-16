import { useMemo } from 'react';
import { useB2CAnalysis } from './useB2CAnalysis';
import { useOriginacaoDashboard } from './useOriginacaoDashboard';
import { B2CIntelligenceResult, IntelligenceOpportunity, ReconciliationDay, ReconciliationSummary } from '../types/intelligence';

const formatSignedPp = (value: number) => {
  const signal = value > 0 ? '+' : '';
  return `${signal}${value.toFixed(1)}pp`;
};

const buildHeadline = (
  shareCRM: number,
  shareDelta: number | null,
  paceStatus: 'ahead' | 'on_track' | 'risk',
  reconciliation: ReconciliationSummary
) => {
  const paceCopy = {
    ahead: 'acima do ritmo mensal',
    on_track: 'em linha com o ritmo mensal',
    risk: 'abaixo do ritmo mensal'
  } as const;

  const shareCopy = shareDelta === null
    ? `CRM representa ${shareCRM.toFixed(1)}% do Total B2C no período.`
    : `CRM representa ${shareCRM.toFixed(1)}% do Total B2C, ${formatSignedPp(shareDelta)} versus a janela anterior.`;

  const reconciliationCopy = reconciliation.inconsistentDays > 0
    ? `Existem ${reconciliation.inconsistentDays} dias com divergência entre a soma das partes e o Total B2C.`
    : 'A reconciliação entre CRM, Serasa, Outros e Total B2C está consistente no período.';

  return `${shareCopy} A aba está ${paceCopy[paceStatus]}. ${reconciliationCopy}`;
};

const buildOpportunities = (
  shareDelta: number | null,
  comparisonSummaryCards: number,
  dashboardSerasaShare: number,
  comparisonSummaryConvCRM: number,
  comparisonSummaryConvB2C: number,
  reconciliation: ReconciliationSummary
): IntelligenceOpportunity[] => {
  const opportunities: IntelligenceOpportunity[] = [];

  if (shareDelta !== null && shareDelta < 0) {
    opportunities.push({
      id: 'recover-share',
      title: 'Recuperar share do CRM',
      description: `O share do CRM caiu ${Math.abs(shareDelta).toFixed(1)}pp. Priorizar jornadas e campanhas com maior impacto em cartões para recuperar participação sobre o Total B2C.`
    });
  }

  if (comparisonSummaryConvCRM < comparisonSummaryConvB2C) {
    opportunities.push({
      id: 'crm-conversion',
      title: 'Revisar eficiência do CRM',
      description: `A conversão do CRM está abaixo do Total B2C (${comparisonSummaryConvCRM.toFixed(1)}% vs ${comparisonSummaryConvB2C.toFixed(1)}%). Validar gargalo entre entrega, proposta e emissão.`
    });
  }

  if (dashboardSerasaShare > 60) {
    opportunities.push({
      id: 'reduce-serasa-dependence',
      title: 'Reduzir dependência da Serasa',
      description: `A Serasa responde por ${dashboardSerasaShare.toFixed(1)}% do fechamento. Reforçar CRM e mapear “Outros” para diversificar a composição do resultado.`
    });
  }

  if (reconciliation.inconsistentDays > 0) {
    opportunities.push({
      id: 'fix-reconciliation',
      title: 'Corrigir divergências de reconciliação',
      description: `Há ${reconciliation.inconsistentDays} dias em que CRM + Serasa supera o Total B2C. Tratar isso como problema de qualidade de dado antes de decisões mais finas.`
    });
  }

  if (opportunities.length === 0) {
    opportunities.push({
      id: 'preserve-momentum',
      title: 'Preservar composição saudável',
      description: `CRM gerou ${comparisonSummaryCards.toLocaleString('pt-BR')} cartões no período sem sinais críticos de reconciliação. O próximo passo é aprofundar leitura por canal, jornada e segmento.`
    });
  }

  return opportunities.slice(0, 3);
};

export const useB2CIntelligence = (): B2CIntelligenceResult => {
  const {
    summary: dashboardSummary,
    analysisRows: dashboardRows,
    getActivitiesForDate
  } = useOriginacaoDashboard();
  const {
    dailyAnalysis,
    summary: comparisonSummary,
    previousSummary: previousComparisonSummary,
    viewMode,
    setViewMode
  } = useB2CAnalysis();

  const vectors = useMemo(() => {
    const totalB2CCards = dashboardSummary.realizedCards;
    const crmCards = dashboardSummary.crmCards;
    const serasaCards = dashboardSummary.serasaCards;
    const otherCards = Math.max(0, totalB2CCards - crmCards - serasaCards);

    return {
      totalB2CCards,
      crmCards,
      serasaCards,
      otherCards,
      crmSharePct: totalB2CCards > 0 ? (crmCards / totalB2CCards) * 100 : 0,
      serasaSharePct: totalB2CCards > 0 ? (serasaCards / totalB2CCards) * 100 : 0,
      otherSharePct: totalB2CCards > 0 ? (otherCards / totalB2CCards) * 100 : 0
    };
  }, [dashboardSummary.crmCards, dashboardSummary.realizedCards, dashboardSummary.serasaCards]);

  const reconciliation = useMemo<ReconciliationSummary>(() => {
    const days: ReconciliationDay[] = dashboardRows.map((row) => {
      const varianceCards = row.totalCards - row.crmCards - row.serasaCards;
      return {
        date: row.date,
        crmCards: row.crmCards,
        serasaCards: row.serasaCards,
        otherCards: Math.max(0, varianceCards),
        totalB2CCards: row.totalCards,
        varianceCards,
        status: varianceCards < 0 ? 'critical' : 'ok'
      };
    });

    const inconsistentDays = days.filter((day) => day.status === 'critical').length;
    const maxNegativeVariance = days.reduce((worst, day) => (
      day.varianceCards < worst ? day.varianceCards : worst
    ), 0);

    return {
      status: inconsistentDays > 0 ? 'critical' : 'ok',
      consistentDays: days.length - inconsistentDays,
      inconsistentDays,
      maxNegativeVariance,
      days
    };
  }, [dashboardRows]);

  const shareDelta = useMemo(() => {
    if (!comparisonSummary || !previousComparisonSummary) return null;
    return comparisonSummary.share_crm_media - previousComparisonSummary.share_crm_media;
  }, [comparisonSummary, previousComparisonSummary]);

  const headline = useMemo(
    () => buildHeadline(vectors.crmSharePct, shareDelta, dashboardSummary.paceStatus, reconciliation),
    [vectors.crmSharePct, shareDelta, dashboardSummary.paceStatus, reconciliation]
  );

  const opportunities = useMemo(
    () => buildOpportunities(
      shareDelta,
      comparisonSummary?.emissoes_crm_total || 0,
      vectors.serasaSharePct,
      comparisonSummary?.taxa_conversao_crm_media || 0,
      comparisonSummary?.taxa_conversao_b2c_media || 0,
      reconciliation
    ),
    [shareDelta, comparisonSummary, vectors.serasaSharePct, reconciliation]
  );

  return {
    dashboardSummary,
    dashboardRows,
    comparisonSummary,
    previousComparisonSummary,
    dailyAnalysis,
    viewMode,
    setViewMode,
    getActivitiesForDate,
    vectors,
    reconciliation,
    headline,
    opportunities
  };
};
