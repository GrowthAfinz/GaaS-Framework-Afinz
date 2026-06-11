import { useMemo } from 'react';
import { CalendarData, FilterState, Activity } from '../types/framework';

type FilterKey = 'canais' | 'jornadas' | 'segmentos' | 'parceiros' | 'subgrupos';
const FILTER_KEYS: FilterKey[] = ['canais', 'jornadas', 'segmentos', 'parceiros', 'subgrupos'];

const getFilterValue = (activity: Activity, key: FilterKey): string => {
  switch (key) {
    case 'canais':
      return activity.canal;
    case 'jornadas':
      return activity.jornada;
    case 'segmentos':
      return activity.segmento;
    case 'parceiros':
      return activity.parceiro;
    case 'subgrupos':
      return activity.subgrupo ?? '';
  }
};

const normalizeDayStart = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const normalizeDayEnd = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const parseISODate = (value?: string) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

interface AdvancedFilterOptions {
  computeFacets?: boolean;
}

const EMPTY_FACETS = {
  availableCanais: [] as string[],
  availableJornadas: [] as string[],
  availableSegmentos: [] as string[],
  availableParceiros: [] as string[],
  availableSubgrupos: [] as string[],
  countByCanal: {} as Record<string, number>,
  countByJornada: {} as Record<string, number>,
  countBySegmento: {} as Record<string, number>,
  countByParceiro: {} as Record<string, number>,
  countBySubgrupo: {} as Record<string, number>,
  totalRemainingDisparos: 0
};

export const useAdvancedFilters = (
  data: CalendarData,
  filters: Partial<FilterState>,
  options: AdvancedFilterOptions = {}
) => {
  const computeFacets = options.computeFacets ?? true;
  // Pre-computes timestamps once when data changes, avoiding thousands of Date instantiations in loops.
  const allActivities = useMemo(() => {
    return Object.values(data).flat().map(activity => {
      if ((activity as any)._dataDisparoMs !== undefined) return activity;

      const dateObj = activity.dataDisparo instanceof Date 
        ? activity.dataDisparo 
        : new Date(activity.dataDisparo);
      
      const normalized = new Date(dateObj);
      normalized.setHours(0, 0, 0, 0);

      return {
        ...activity,
        _dataDisparoMs: normalized.getTime()
      };
    });
  }, [data]);

  // Pré-computa os filtros selecionados como Sets + limites de período (uma vez
  // por mudança de filtro) — evita array.includes por atividade × dimensão.
  const sel = useMemo(() => {
    const start = parseISODate(filters?.dataInicio);
    const end = parseISODate(filters?.dataFim);
    return {
      canais: new Set(Array.isArray(filters?.canais) ? filters.canais : []),
      jornadas: new Set(Array.isArray(filters?.jornadas) ? filters.jornadas : []),
      segmentos: new Set(Array.isArray(filters?.segmentos) ? filters.segmentos : []),
      parceiros: new Set(Array.isArray(filters?.parceiros) ? filters.parceiros : []),
      subgrupos: new Set(Array.isArray(filters?.subgrupos) ? filters.subgrupos : []),
      bu: new Set(Array.isArray(filters?.bu) ? filters.bu : []),
      startMs: start ? normalizeDayStart(start).getTime() : null,
      endMs: end ? normalizeDayEnd(end).getTime() : null,
    };
  }, [filters]);

  const filteredData = useMemo(() => {
    try {
      const result: CalendarData = {};

      Object.entries(data).forEach(([dateKey, activities]) => {
        const filtered = activities.filter(activity => {
          if (sel.canais.size > 0 && !sel.canais.has(activity.canal)) return false;
          if (sel.jornadas.size > 0 && !sel.jornadas.has(activity.jornada)) return false;
          if (sel.segmentos.size > 0 && !sel.segmentos.has(activity.segmento)) return false;
          if (sel.parceiros.size > 0 && !sel.parceiros.has(activity.parceiro)) return false;
          if (sel.subgrupos.size > 0 && !sel.subgrupos.has(activity.subgrupo ?? '')) return false;
          if (sel.bu.size > 0 && !sel.bu.has(activity.bu)) return false;

          const activityMs = (activity as any)._dataDisparoMs;
          if (sel.startMs !== null && activityMs !== undefined && activityMs < sel.startMs) return false;
          if (sel.endMs !== null && activityMs !== undefined && activityMs > sel.endMs) return false;
          return true;
        });
        if (filtered.length > 0) {
          result[dateKey] = filtered;
        }
      });

      return result;
    } catch (e) {
      console.error('Error in useAdvancedFilters:', e);
      return data;
    }
  }, [data, sel]);

  // Faceted filter orchestrator:
  // Computes remaining possibilities in the chain by dimension (exclude-self semantics)
  // and keeps available options constrained by static context (BU + period).
  const orchestrator = useMemo(() => {
    if (!computeFacets) {
      return {
        ...EMPTY_FACETS,
        totalRemainingDisparos: Object.values(filteredData).reduce((acc, list) => acc + list.length, 0)
      };
    }

    const countByCanal: { [canal: string]: number } = {};
    const countByJornada: { [jornada: string]: number } = {};
    const countBySegmento: { [segmento: string]: number } = {};
    const countByParceiro: { [parceiro: string]: number } = {};
    const countBySubgrupo: { [subgrupo: string]: number } = {};
    const countMaps: Record<FilterKey, Record<string, number>> = {
      canais: countByCanal,
      jornadas: countByJornada,
      segmentos: countBySegmento,
      parceiros: countByParceiro,
      subgrupos: countBySubgrupo
    };

    const available = {
      canais: new Set<string>(),
      jornadas: new Set<string>(),
      segmentos: new Set<string>(),
      parceiros: new Set<string>(),
      subgrupos: new Set<string>()
    };

    let totalRemainingDisparos = 0;

    allActivities.forEach(activity => {
      const activityMs = (activity as any)._dataDisparoMs;
      const matchesStatic =
        (sel.bu.size === 0 || sel.bu.has(activity.bu)) &&
        (sel.startMs === null || activityMs === undefined || activityMs >= sel.startMs) &&
        (sel.endMs === null || activityMs === undefined || activityMs <= sel.endMs);

      if (!matchesStatic) return;

      if (activity.canal) available.canais.add(activity.canal);
      if (activity.jornada) available.jornadas.add(activity.jornada);
      if (activity.segmento) available.segmentos.add(activity.segmento);
      if (activity.parceiro) available.parceiros.add(activity.parceiro);
      if (activity.subgrupo) available.subgrupos.add(activity.subgrupo);

      const matches = {
        canais: sel.canais.size === 0 || sel.canais.has(activity.canal),
        jornadas: sel.jornadas.size === 0 || sel.jornadas.has(activity.jornada),
        segmentos: sel.segmentos.size === 0 || sel.segmentos.has(activity.segmento),
        parceiros: sel.parceiros.size === 0 || sel.parceiros.has(activity.parceiro),
        subgrupos: sel.subgrupos.size === 0 || sel.subgrupos.has(activity.subgrupo ?? '')
      };

      if (Object.values(matches).every(Boolean)) totalRemainingDisparos += 1;

      FILTER_KEYS.forEach(key => {
        const matchesOtherDimensions = FILTER_KEYS.every(otherKey => otherKey === key || matches[otherKey]);
        if (!matchesOtherDimensions) return;

        const value = getFilterValue(activity, key);
        if (value) {
          const countMap = countMaps[key];
          countMap[value] = (countMap[value] || 0) + 1;
        }
      });
    });

    return {
      availableCanais: Array.from(available.canais).sort(),
      availableJornadas: Array.from(available.jornadas).sort(),
      availableSegmentos: Array.from(available.segmentos).sort(),
      availableParceiros: Array.from(available.parceiros).sort(),
      availableSubgrupos: Array.from(available.subgrupos).sort(),
      countByCanal,
      countByJornada,
      countBySegmento,
      countByParceiro,
      countBySubgrupo,
      totalRemainingDisparos
    };
  }, [allActivities, computeFacets, filteredData, sel]);

  return {
    filteredData,
    availableCanais: orchestrator.availableCanais,
    availableJornadas: orchestrator.availableJornadas,
    availableSegmentos: orchestrator.availableSegmentos,
    availableParceiros: orchestrator.availableParceiros,
    availableSubgrupos: orchestrator.availableSubgrupos,
    countByCanal: orchestrator.countByCanal,
    countByJornada: orchestrator.countByJornada,
    countBySegmento: orchestrator.countBySegmento,
    countByParceiro: orchestrator.countByParceiro,
    countBySubgrupo: orchestrator.countBySubgrupo,
    totalRemainingDisparos: orchestrator.totalRemainingDisparos
  };
};
