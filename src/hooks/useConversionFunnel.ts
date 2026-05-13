import { useMemo } from 'react';
import { CalendarData } from '../types/framework';

export interface FunnelData {
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
}

export const useConversionFunnel = (data: CalendarData, monthYear?: { year: number; month: number }) => {
  return useMemo(() => {
    let baseEnviada = 0;
    let baseEntregue = 0;
    let propostas = 0;
    let aprovados = 0;
    let emissoes = 0;

    Object.entries(data).forEach(([dateKey, activities]) => {
      activities.forEach((activity) => {
        // Se foi passado um mês específico, filtra por ele (prioriza Safra se existir)
        if (monthYear) {
          if (activity.safraKey) {
            const safraYear = Number(activity.safraKey.split('-')[0]);
            const safraMonth = Number(activity.safraKey.split('-')[1]) - 1;
            if (safraYear !== monthYear.year || safraMonth !== monthYear.month) {
              return; // não soma fora da safra selecionada
            }
          } else {
            const date = new Date(dateKey);
            if (date.getFullYear() !== monthYear.year || date.getMonth() !== monthYear.month) {
              return; // não soma fora do mês de disparo
            }
          }
        }

        baseEnviada += activity.kpis.baseEnviada || 0;
        baseEntregue += activity.kpis.baseEntregue || 0;
        propostas += activity.kpis.propostas || 0;
        aprovados += activity.kpis.aprovados || 0;
        emissoes += activity.kpis.emissoes || 0;
      });
    });

    return {
      baseEnviada,
      baseEntregue,
      propostas,
      aprovados,
      emissoes,
    };
  }, [data, monthYear]);
};
