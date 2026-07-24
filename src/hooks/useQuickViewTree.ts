import { useMemo } from 'react';
import { CalendarData } from '../types/framework';

/**
 * Árvore BU > Parceiro > Segmento para o seletor de Visões Rápidas.
 *
 * IMPORTANTE — por que este hook não reusa `useAdvancedFilters`:
 * o orquestrador de facetas poda as opções pela seleção corrente (semântica
 * exclude-self). Isso é correto para os dropdowns, mas prenderia a árvore: com
 * B2C aplicado, os nós de B2B2C sumiriam e não haveria como pular de uma visão
 * para outra sem limpar os filtros antes. A árvore respeita apenas o PERÍODO —
 * o resto da seleção é justamente o que ela existe para trocar.
 */

/** Valor bruto usado para filtrar quando a dimensão vem vazia no dado. */
export const EMPTY_DIMENSION = '';

export interface QuickViewSegmentoNode {
  /** Valor bruto — é o que vai para o filtro. */
  value: string;
  count: number;
}

export interface QuickViewParceiroNode {
  value: string;
  count: number;
  segmentos: QuickViewSegmentoNode[];
}

export interface QuickViewBUNode {
  value: string;
  count: number;
  parceiros: QuickViewParceiroNode[];
}

interface QuickViewPeriod {
  dataInicio?: string;
  dataFim?: string;
}

// Ordem canônica das BUs (mesma do seletor de BU do header).
const BU_ORDER = ['B2C', 'B2B2C', 'Plurix', 'Seguros'];

const parseISODate = (value?: string) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/**
 * Valores "vazios" e "N/A" são mantidos como nós SEPARADOS de propósito: o filtro
 * casa por igualdade exata do valor bruto, então fundi-los faria a contagem do nó
 * prometer mais disparos do que o clique entrega.
 */
const isResidual = (value: string) => value === EMPTY_DIMENSION || value.toUpperCase() === 'N/A';

/** Maior volume primeiro; residuais ("sem X" / "N/A") sempre no fim. */
const byCountResidualLast = <T extends { value: string; count: number }>(a: T, b: T) => {
  const aResidual = isResidual(a.value);
  const bResidual = isResidual(b.value);
  if (aResidual !== bResidual) return aResidual ? 1 : -1;
  if (b.count !== a.count) return b.count - a.count;
  return a.value.localeCompare(b.value);
};

export const useQuickViewTree = (
  data: CalendarData,
  period: QuickViewPeriod = {}
): QuickViewBUNode[] => {
  const startMs = useMemo(() => {
    const start = parseISODate(period.dataInicio);
    if (!start) return null;
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }, [period.dataInicio]);

  const endMs = useMemo(() => {
    const end = parseISODate(period.dataFim);
    if (!end) return null;
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  }, [period.dataFim]);

  return useMemo(() => {
    // bu -> parceiro -> segmento -> count
    const buckets = new Map<string, Map<string, Map<string, number>>>();

    Object.values(data).forEach(activities => {
      activities.forEach(activity => {
        const dateObj = activity.dataDisparo instanceof Date
          ? activity.dataDisparo
          : new Date(activity.dataDisparo);
        const ms = dateObj.getTime();

        // Datas inválidas não são excluídas pelo período — mesmo tratamento de
        // `useAdvancedFilters`, senão o total da árvore divergiria do da barra.
        if (!Number.isNaN(ms)) {
          if (startMs !== null && ms < startMs) return;
          if (endMs !== null && ms > endMs) return;
        }

        const bu = activity.bu ?? EMPTY_DIMENSION;
        if (!bu) return; // sem BU não há caminho na árvore

        const parceiro = activity.parceiro ?? EMPTY_DIMENSION;
        const segmento = activity.segmento ?? EMPTY_DIMENSION;

        let parceiros = buckets.get(bu);
        if (!parceiros) {
          parceiros = new Map();
          buckets.set(bu, parceiros);
        }

        let segmentos = parceiros.get(parceiro);
        if (!segmentos) {
          segmentos = new Map();
          parceiros.set(parceiro, segmentos);
        }

        segmentos.set(segmento, (segmentos.get(segmento) ?? 0) + 1);
      });
    });

    const tree: QuickViewBUNode[] = Array.from(buckets.entries()).map(([bu, parceirosMap]) => {
      const parceiros: QuickViewParceiroNode[] = Array.from(parceirosMap.entries()).map(
        ([parceiro, segmentosMap]) => {
          const segmentos: QuickViewSegmentoNode[] = Array.from(segmentosMap.entries())
            .map(([value, count]) => ({ value, count }))
            .sort(byCountResidualLast);

          return {
            value: parceiro,
            count: segmentos.reduce((acc, s) => acc + s.count, 0),
            segmentos
          };
        }
      ).sort(byCountResidualLast);

      return {
        value: bu,
        count: parceiros.reduce((acc, p) => acc + p.count, 0),
        parceiros
      };
    });

    return tree.sort((a, b) => {
      const aIdx = BU_ORDER.indexOf(a.value);
      const bIdx = BU_ORDER.indexOf(b.value);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.value.localeCompare(b.value);
    });
  }, [data, startMs, endMs]);
};
