import { useMemo } from 'react';
import { CalendarData } from '../types/framework';

/**
 * Árvore de Visualização Filtrada (BU > duas dimensões) para a barra de filtros.
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

export type QuickViewDimension = 'parceiro' | 'segmento';

export interface QuickViewNode {
  /** Valor bruto — é o que vai para o filtro. */
  value: string;
  dimension: QuickViewDimension;
  count: number;
  children: QuickViewNode[];
}

export interface QuickViewBUNode {
  value: string;
  count: number;
  children: QuickViewNode[];
}

interface QuickViewPeriod {
  dataInicio?: string;
  dataFim?: string;
}

// Ordem canônica das BUs (mesma do seletor de BU do header).
const BU_ORDER = ['B2C', 'B2B2C', 'Plurix', 'Seguros'];

/**
 * BUs em que o Parceiro é atributo DO segmento, não o contrário:
 *  - B2C é institucional (base própria da Afinz); o parceiro só faz sentido
 *    dentro de um segmento — ex.: Serasa aparece em Abandonados e Leads_Parceiros.
 *  - Plurix tem parceiro N/A em 100% da base.
 * Nelas a árvore é BU > Segmento > Parceiro. Nas demais (B2B2C, Seguros), onde o
 * parceiro é o próprio dono da base, segue BU > Parceiro > Segmento.
 */
const SEGMENTO_FIRST_BUS = new Set(['B2C', 'Plurix']);

const levelsFor = (bu: string): [QuickViewDimension, QuickViewDimension] =>
  SEGMENTO_FIRST_BUS.has(bu) ? ['segmento', 'parceiro'] : ['parceiro', 'segmento'];

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
const byCountResidualLast = (a: QuickViewNode, b: QuickViewNode) => {
  const aResidual = isResidual(a.value);
  const bResidual = isResidual(b.value);
  if (aResidual !== bResidual) return aResidual ? 1 : -1;
  if (b.count !== a.count) return b.count - a.count;
  return a.value.localeCompare(b.value);
};

/**
 * Remove níveis que não oferecem escolha: um nó com um único filho produz
 * exatamente o mesmo recorte que o filho, então o filho é substituído pelos
 * netos. É lossless e resolve dois casos reais de uma vez:
 *  - B2C > Negados, que só tem Proprietaria: vira folha (um clique a menos);
 *  - Rentabilização, onde o parceiro é N/A em 100% das linhas: o nível de
 *    parceiro some e os segmentos sobem para baixo da BU.
 */
const collapseSingletons = (nodes: QuickViewNode[]): QuickViewNode[] =>
  nodes.map(node => {
    let children = collapseSingletons(node.children);
    while (children.length === 1) {
      children = children[0].children;
    }
    return { ...node, children };
  });

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
    // bu -> nivel1 -> nivel2 -> count (a ordem dos níveis depende da BU)
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

        const [level1] = levelsFor(bu);
        const parceiro = activity.parceiro ?? EMPTY_DIMENSION;
        const segmento = activity.segmento ?? EMPTY_DIMENSION;
        const first = level1 === 'segmento' ? segmento : parceiro;
        const second = level1 === 'segmento' ? parceiro : segmento;

        let firstLevel = buckets.get(bu);
        if (!firstLevel) {
          firstLevel = new Map();
          buckets.set(bu, firstLevel);
        }

        let secondLevel = firstLevel.get(first);
        if (!secondLevel) {
          secondLevel = new Map();
          firstLevel.set(first, secondLevel);
        }

        secondLevel.set(second, (secondLevel.get(second) ?? 0) + 1);
      });
    });

    const tree: QuickViewBUNode[] = Array.from(buckets.entries()).map(([bu, firstLevel]) => {
      const [dim1, dim2] = levelsFor(bu);

      const children: QuickViewNode[] = Array.from(firstLevel.entries()).map(
        ([value, secondLevel]) => {
          const grandChildren: QuickViewNode[] = Array.from(secondLevel.entries())
            .map(([childValue, count]) => ({
              value: childValue,
              dimension: dim2,
              count,
              children: [] as QuickViewNode[]
            }))
            .sort(byCountResidualLast);

          return {
            value,
            dimension: dim1,
            count: grandChildren.reduce((acc, c) => acc + c.count, 0),
            children: grandChildren
          };
        }
      ).sort(byCountResidualLast);

      const count = children.reduce((acc, c) => acc + c.count, 0);

      // O colapso vale também para o primeiro nível: em Rentabilização o parceiro
      // é N/A em 100% das linhas, então a BU teria um único filho inútil.
      let buChildren = collapseSingletons(children);
      while (buChildren.length === 1) {
        buChildren = buChildren[0].children;
      }

      return { value: bu, count, children: buChildren };
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
