import { useMemo } from 'react';
import { CalendarData, ComparationData } from '../types/framework';
import { formatDateKey } from '../utils/formatters';

export const useMonthComparison = (data: CalendarData, compareEnabled: boolean, viewingMonth?: { year: number; month: number }) => {
  const comparisonData = useMemo(() => {
    try {
      if (!compareEnabled || !data) return null;

      const result: {
        [dateKey: string]: ComparationData;
      } = {};

      // Extrai todos os dates do data
      Object.keys(data).forEach(dateKey => {
        try {
          const date = new Date(dateKey);
          
          // Calcula o mês anterior
          const previousMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
          const previousDateKey = formatDateKey(previousMonthDate);

          const currentCount = data[dateKey]?.length || 0;
          const previousCount = data[previousDateKey]?.length || 0;

          // Calcula variação percentual
          let variation = 0;
          if (previousCount > 0) {
            variation = ((currentCount - previousCount) / previousCount) * 100;
          } else if (currentCount > 0) {
            variation = 100; // Se não tinha nada no mês anterior, é 100% de crescimento
          }

          result[dateKey] = {
            current: currentCount,
            previous: previousCount,
            variation: parseFloat(variation.toFixed(1)),
            isGrowth: currentCount >= previousCount
          };
        } catch (e) {
          console.error('Error processing date key:', dateKey, e);
        }
      });

      return result;
    } catch (e) {
      console.error('Error in useMonthComparison comparisonData:', e);
      return null;
    }
  }, [data, compareEnabled]);

  // Calcula agregados de comparação - CORRETO
  const aggregatedComparison = useMemo(() => {
    try {
      if (!data) return null;

      // Usa o mês sendo visualizado, ou data de hoje como fallback
      const displayMonth = viewingMonth?.month ?? new Date().getMonth();
      const displayYear = viewingMonth?.year ?? new Date().getFullYear();
      
      const previousMonth = displayMonth === 0 ? 11 : displayMonth - 1;
      const previousYear = displayMonth === 0 ? displayYear - 1 : displayYear;

      // Métricas do mês ATUAL (sendo visualizado)
      let currentBaseEnviada = 0;
      let currentBaseEntregue = 0;
      let currentPropostas = 0;
      let currentAprovados = 0;
      let currentEmissoes = 0;
      let currentAberturas = 0;
      let currentCartoes = 0;
      let currentCusto = 0;
      let countCurrentActivities = 0;

      // Métricas do mês ANTERIOR
      let previousBaseEnviada = 0;
      let previousBaseEntregue = 0;
      let previousPropostas = 0;
      let previousAprovados = 0;
      let previousEmissoes = 0;
      let previousAberturas = 0;
      let previousCartoes = 0;
      let previousCusto = 0;
      let countPreviousActivities = 0;

      Object.entries(data).forEach(([dateKey, activities]) => {
        try {
          // Valida se é array
          if (!Array.isArray(activities)) {
            console.warn('activities is not an array for dateKey:', dateKey);
            return;
          }

          activities.forEach(activity => {
            try {
              const kpis = activity?.kpis;
              if (!kpis) return;

              // Separa por mês, priorizando Safra quando disponível
              let m: number;
              let y: number;
              if (activity.safraKey) {
                y = Number(activity.safraKey.split('-')[0]);
                m = Number(activity.safraKey.split('-')[1]) - 1;
              } else {
                const d = new Date(dateKey);
                if (isNaN(d.getTime())) return;
                m = d.getMonth();
                y = d.getFullYear();
              }

              if (m === displayMonth && y === displayYear) {
                // MÊS SENDO VISUALIZADO
                if (kpis.baseEnviada) currentBaseEnviada += kpis.baseEnviada;
                if (kpis.baseEntregue) currentBaseEntregue += kpis.baseEntregue;
                if (kpis.propostas) currentPropostas += kpis.propostas;
                if (kpis.aprovados) currentAprovados += kpis.aprovados;
                if (kpis.emissoes) currentEmissoes += kpis.emissoes;
                if (kpis.taxaAbertura) currentAberturas += kpis.taxaAbertura;
                if (kpis.cartoes) currentCartoes += kpis.cartoes;
                if (kpis.custoTotal) currentCusto += kpis.custoTotal;
                countCurrentActivities++;
              } else if (m === previousMonth && y === previousYear) {
                // MÊS ANTERIOR
                if (kpis.baseEnviada) previousBaseEnviada += kpis.baseEnviada;
                if (kpis.baseEntregue) previousBaseEntregue += kpis.baseEntregue;
                if (kpis.propostas) previousPropostas += kpis.propostas;
                if (kpis.aprovados) previousAprovados += kpis.aprovados;
                if (kpis.emissoes) previousEmissoes += kpis.emissoes;
                if (kpis.taxaAbertura) previousAberturas += kpis.taxaAbertura;
                if (kpis.cartoes) previousCartoes += kpis.cartoes;
                if (kpis.custoTotal) previousCusto += kpis.custoTotal;
                countPreviousActivities++;
              }
            } catch (actErr) {
              console.error('Error processing activity:', activity, actErr);
            }
          });
        } catch (e) {
          console.error('Error processing date entry:', dateKey, e);
        }
      });

      // Calcula médias e variações
      const currentAvgAbertura = countCurrentActivities > 0 ? currentAberturas / countCurrentActivities : 0;
      const previousAvgAbertura = countPreviousActivities > 0 ? previousAberturas / countPreviousActivities : 0;

      // Derivados (percentuais e CAC) para current/previous
      const currentPercentEntrega = currentBaseEnviada > 0 ? (currentBaseEntregue / currentBaseEnviada) * 100 : 0;
      const previousPercentEntrega = previousBaseEnviada > 0 ? (previousBaseEntregue / previousBaseEnviada) * 100 : 0;
      const currentPercentPropostas = currentBaseEntregue > 0 ? (currentPropostas / currentBaseEntregue) * 100 : 0;
      const previousPercentPropostas = previousBaseEntregue > 0 ? (previousPropostas / previousBaseEntregue) * 100 : 0;
      const currentPercentAprovados = currentPropostas > 0 ? (currentAprovados / currentPropostas) * 100 : 0;
      const previousPercentAprovados = previousPropostas > 0 ? (previousAprovados / previousPropostas) * 100 : 0;
      const currentPercentFinalizacao = currentPropostas > 0 ? (currentEmissoes / currentPropostas) * 100 : 0;
      const previousPercentFinalizacao = previousPropostas > 0 ? (previousEmissoes / previousPropostas) * 100 : 0;
      const currentPercentConversaoBase = currentBaseEntregue > 0 ? (currentEmissoes / currentBaseEntregue) * 100 : 0;
      const previousPercentConversaoBase = previousBaseEntregue > 0 ? (previousEmissoes / previousBaseEntregue) * 100 : 0;
      const currentCAC = currentEmissoes > 0 ? currentCusto / currentEmissoes : 0;
      const previousCAC = previousEmissoes > 0 ? previousCusto / previousEmissoes : 0;

      // Função auxiliar para calcular variação com validação
      const calcVariation = (current: number, previous: number): number => {
        try {
          if (previous === 0 || isNaN(previous)) {
            return current > 0 ? 100 : 0;
          }
          const variation = ((current - previous) / previous) * 100;
          return isNaN(variation) ? 0 : variation;
        } catch (e) {
          console.error('Error calculating variation:', e);
          return 0;
        }
      };

      const baseEnviadaVar = calcVariation(currentBaseEnviada, previousBaseEnviada);
      const baseEntregueVar = calcVariation(currentBaseEntregue, previousBaseEntregue);
      const propostasVar = calcVariation(currentPropostas, previousPropostas);
      const aprovadosVar = calcVariation(currentAprovados, previousAprovados);
      const emissoesVar = calcVariation(currentEmissoes, previousEmissoes);
      const aberturasVar = calcVariation(currentAvgAbertura, previousAvgAbertura);
      const cartoesVar = calcVariation(currentCartoes, previousCartoes);
      const custoVar = calcVariation(currentCusto, previousCusto);
      const percentEntregaVar = calcVariation(currentPercentEntrega, previousPercentEntrega);
      const percentPropostasVar = calcVariation(currentPercentPropostas, previousPercentPropostas);
      const percentAprovadosVar = calcVariation(currentPercentAprovados, previousPercentAprovados);
      const percentFinalizacaoVar = calcVariation(currentPercentFinalizacao, previousPercentFinalizacao);
      const percentConversaoBaseVar = calcVariation(currentPercentConversaoBase, previousPercentConversaoBase);
      const cacVar = calcVariation(currentCAC, previousCAC);

      return {
        baseEnviadaVariation: parseFloat(baseEnviadaVar.toFixed(1)) || 0,
        baseEntregueVariation: parseFloat(baseEntregueVar.toFixed(1)) || 0,
        propostasVariation: parseFloat(propostasVar.toFixed(1)) || 0,
        aprovadosVariation: parseFloat(aprovadosVar.toFixed(1)) || 0,
        emissoesVariation: parseFloat(emissoesVar.toFixed(1)) || 0,
        aberturasVariation: parseFloat(aberturasVar.toFixed(1)) || 0,
        cartoesVariation: parseFloat(cartoesVar.toFixed(1)) || 0,
        custoVariation: parseFloat(custoVar.toFixed(1)) || 0,
        percentEntregaVariation: parseFloat(percentEntregaVar.toFixed(1)) || 0,
        percentPropostasVariation: parseFloat(percentPropostasVar.toFixed(1)) || 0,
        percentAprovadosVariation: parseFloat(percentAprovadosVar.toFixed(1)) || 0,
        percentFinalizacaoVariation: parseFloat(percentFinalizacaoVar.toFixed(1)) || 0,
        percentConversaoBaseVariation: parseFloat(percentConversaoBaseVar.toFixed(1)) || 0,
        cacVariation: parseFloat(cacVar.toFixed(1)) || 0,
        totalBaseEnviada: currentBaseEnviada || 0,
        totalBaseEntregue: currentBaseEntregue || 0,
        totalPropostas: currentPropostas || 0,
        totalAprovados: currentAprovados || 0,
        totalEmissoes: currentEmissoes || 0,
        totalAbertura: currentAvgAbertura || 0,
        totalCartoes: currentCartoes || 0,
        totalCusto: currentCusto || 0
      };
    } catch (e) {
      console.error('Error in aggregatedComparison:', e);
      return {
        baseEnviadaVariation: 0,
        baseEntregueVariation: 0,
        propostasVariation: 0,
        aprovadosVariation: 0,
        emissoesVariation: 0,
        aberturasVariation: 0,
        cartoesVariation: 0,
        custoVariation: 0,
        totalBaseEnviada: 0,
        totalBaseEntregue: 0,
        totalPropostas: 0,
        totalAprovados: 0,
        totalEmissoes: 0,
        totalAbertura: 0,
        totalCartoes: 0,
        totalCusto: 0
      };
    }
  }, [data, viewingMonth]);

  return {
    comparisonData,
    aggregatedComparison,
    getVariationDisplay: (dateKey: string): string | null => {
      if (!comparisonData) return null;
      const comp = comparisonData[dateKey];
      if (!comp) return null;
      if (comp.variation === 0) return '—';
      const symbol = comp.isGrowth ? '▲' : '▼';
      return `${symbol} ${Math.abs(comp.variation)}%`;
    },
    getVariationColor: (dateKey: string): string => {
      if (!comparisonData) return 'text-slate-400';
      const comp = comparisonData[dateKey];
      if (!comp) return 'text-slate-400';
      if (comp.variation === 0) return 'text-slate-400';
      return comp.isGrowth ? 'text-green-400' : 'text-red-400';
    }
  };
};
