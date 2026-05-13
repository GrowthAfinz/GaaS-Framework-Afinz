import { useMemo } from 'react';
import { CalendarData } from '../types/framework';
import { StrategyMetrics } from '../types/strategy';

export const useResultadosMetrics = (data: CalendarData, monthYear?: { year: number; month: number }) => {
  const resultados = useMemo(() => {
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

      // Agrupa por parceiro
      Object.values(filteredData).forEach(activities => {
        activities.forEach(activity => {
          const parceiro = activity.parceiro || 'Sem Parceiro';

          if (!result[parceiro]) {
            result[parceiro] = {
              nome: parceiro,
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

          const resultado = result[parceiro];
          const kpis = activity.kpis;

          // Acumula métricas
          resultado.totalCartoes += kpis.cartoes || 0;
          resultado.taxaEntregaMédia += kpis.taxaEntrega || 0;
          resultado.taxaAberturaMédia += kpis.taxaAbertura || 0;
          resultado.taxaPropostaMédia += kpis.taxaPropostas || 0;
          resultado.cacMédio += kpis.cac || 0;
          resultado.custoTotal += kpis.custoTotal || 0;
          resultado.atividades += 1;

          // Rastreia BUs e Datas
          if (!resultado.bu.includes(activity.bu)) {
            resultado.bu.push(activity.bu);
          }

          let dateStr = '';
          if (activity.dataDisparo instanceof Date) {
            dateStr = activity.dataDisparo.toISOString().split('T')[0];
          } else if (typeof activity.dataDisparo === 'string') {
            // Basic fallback for string dates
            dateStr = String(activity.dataDisparo).split('T')[0];
          }

          if (dateStr && !resultado.datas.includes(dateStr)) {
            resultado.datas.push(dateStr);
          }
        });
      });

      // Calcula médias
      Object.values(result).forEach(resultado => {
        if (resultado.atividades > 0) {
          resultado.taxaEntregaMédia = resultado.taxaEntregaMédia / resultado.atividades;
          resultado.taxaAberturaMédia = resultado.taxaAberturaMédia / resultado.atividades;
          resultado.taxaPropostaMédia = resultado.taxaPropostaMédia / resultado.atividades;
          resultado.cacMédio = resultado.cacMédio / resultado.atividades;
        }

        // Define status baseado em atividade e datas
        const hoje = new Date();
        const ultimaData = new Date(Math.max(...resultado.datas.map(d => new Date(d).getTime())));
        const diasPassados = Math.floor((hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));

        if (diasPassados > 30) {
          resultado.status = 'parado';
        } else if (diasPassados > 7) {
          resultado.status = 'em-progresso';
        } else {
          resultado.status = 'concluido';
        }
      });

      return result;
    } catch (e) {
      console.error('Error calculating resultados metrics:', e);
      return {};
    }
  }, [data, monthYear]);

  return resultados;
};
