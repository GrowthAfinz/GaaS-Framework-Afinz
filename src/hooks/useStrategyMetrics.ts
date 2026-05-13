import { useMemo } from 'react';
import { CalendarData } from '../types/framework';
import { StrategyMetrics } from '../types/strategy';

export const useStrategyMetrics = (data: CalendarData, monthYear?: { year: number; month: number }) => {
  const strategies = useMemo(() => {
    try {
      const result: StrategyMetrics = {};

      // Filtra dados do mês se especificado
      let filteredData = data;
      if (monthYear) {
        filteredData = {};
        Object.entries(data).forEach(([dateKey, activities]) => {
          const date = new Date(dateKey);
          if (date.getFullYear() === monthYear.year && date.getMonth() === monthYear.month) {
            filteredData[dateKey] = activities;
          }
        });
      }

      // Agrupa por segmento
      Object.values(filteredData).forEach(activities => {
        activities.forEach(activity => {
          const segmento = activity.segmento || 'Sem Segmento';

          if (!result[segmento]) {
            result[segmento] = {
              nome: segmento,
              totalCartoes: 0,
              taxaEntregaMédia: 0,
              taxaAberturaMédia: 0,
              taxaPropostaMédia: 0,
              cacMédio: 0,
              custoTotal: 0,
              atividades: 0,
              variacao: 0,
              status: 'em-progresso',
              bu: [],
              datas: []
            };
          }

          const strategy = result[segmento];
          const kpis = activity.kpis;

          // Acumula métricas
          strategy.totalCartoes += kpis.cartoes || 0;
          strategy.taxaEntregaMédia += kpis.taxaEntrega || 0;
          strategy.taxaAberturaMédia += kpis.taxaAbertura || 0;
          strategy.taxaPropostaMédia += kpis.taxaPropostas || 0;
          strategy.cacMédio += kpis.cac || 0;
          strategy.custoTotal += kpis.custoTotal || 0;
          strategy.atividades += 1;

          // Rastreia BUs e Datas
          if (!strategy.bu.includes(activity.bu)) {
            strategy.bu.push(activity.bu);
          }

          const dateStr = activity.dataDisparo.toISOString().split('T')[0];
          if (!strategy.datas.includes(dateStr)) {
            strategy.datas.push(dateStr);
          }
        });
      });

      // Calcula médias
      Object.values(result).forEach(strategy => {
        if (strategy.atividades > 0) {
          strategy.taxaEntregaMédia = strategy.taxaEntregaMédia / strategy.atividades;
          strategy.taxaAberturaMédia = strategy.taxaAberturaMédia / strategy.atividades;
          strategy.taxaPropostaMédia = strategy.taxaPropostaMédia / strategy.atividades;
          strategy.cacMédio = strategy.cacMédio / strategy.atividades;
        }

        // Define status baseado em atividade e datas
        const hoje = new Date();
        const ultimaData = new Date(Math.max(...strategy.datas.map(d => new Date(d).getTime())));
        const diasPassados = Math.floor((hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));

        if (diasPassados > 30) {
          strategy.status = 'parado';
        } else if (diasPassados > 7) {
          strategy.status = 'em-progresso';
        } else {
          strategy.status = 'concluido';
        }
      });

      return result;
    } catch (e) {
      console.error('Error calculating strategy metrics:', e);
      return {};
    }
  }, [data, monthYear]);

  return strategies;
};
