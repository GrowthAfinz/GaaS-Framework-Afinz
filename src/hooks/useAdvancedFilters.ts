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

export const useAdvancedFilters = (data: CalendarData, filters: FilterState) => {
  const allActivities = useMemo(() => Object.values(data).flat(), [data]);

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

  const matchActivity = (activity: Activity, omit: FilterKey[] = []) => {
    if (!omit.includes('canais') && sel.canais.size > 0 && !sel.canais.has(activity.canal)) return false;
    if (!omit.includes('jornadas') && sel.jornadas.size > 0 && !sel.jornadas.has(activity.jornada)) return false;
    if (!omit.includes('segmentos') && sel.segmentos.size > 0 && !sel.segmentos.has(activity.segmento)) return false;
    if (!omit.includes('parceiros') && sel.parceiros.size > 0 && !sel.parceiros.has(activity.parceiro)) return false;
    if (!omit.includes('subgrupos') && sel.subgrupos.size > 0 && !sel.subgrupos.has(activity.subgrupo ?? '')) return false;
    if (sel.bu.size > 0 && !sel.bu.has(activity.bu)) return false;

    if (sel.startMs !== null || sel.endMs !== null) {
      const activityMs = normalizeDayStart(new Date(activity.dataDisparo)).getTime();
      if (sel.startMs !== null && activityMs < sel.startMs) return false;
      if (sel.endMs !== null && activityMs > sel.endMs) return false;
    }

    return true;
  };

  const filteredData = useMemo(() => {
    try {
      const result: CalendarData = {};

      Object.entries(data).forEach(([dateKey, activities]) => {
        const filtered = activities.filter(activity => matchActivity(activity));
        if (filtered.length > 0) {
          result[dateKey] = filtered;
        }
      });

      return result;
    } catch (e) {
      console.error('Error in useAdvancedFilters:', e);
      return data;
    }
  }, [data, filters]);

  // Faceted filter orchestrator:
  // Computes remaining possibilities in the chain by dimension (exclude-self semantics)
  // and keeps available options constrained by static context (BU + period).
  const orchestrator = useMemo(() => {
    const countByCanal: { [canal: string]: number } = {};
    const countByJornada: { [jornada: string]: number } = {};
    const countBySegmento: { [segmento: string]: number } = {};
    const countByParceiro: { [parceiro: string]: number } = {};
    const countBySubgrupo: { [subgrupo: string]: number } = {};

    const available = {
      canais: new Set<string>(),
      jornadas: new Set<string>(),
      segmentos: new Set<string>(),
      parceiros: new Set<string>(),
      subgrupos: new Set<string>()
    };

    const staticMatched = allActivities.filter(activity =>
      matchActivity(activity, ['canais', 'jornadas', 'segmentos', 'parceiros', 'subgrupos'])
    );

    staticMatched.forEach(activity => {
      if (activity.canal) available.canais.add(activity.canal);
      if (activity.jornada) available.jornadas.add(activity.jornada);
      if (activity.segmento) available.segmentos.add(activity.segmento);
      if (activity.parceiro) available.parceiros.add(activity.parceiro);
      if (activity.subgrupo) available.subgrupos.add(activity.subgrupo);
    });

    const countMaps: Record<FilterKey, Record<string, number>> = {
      canais: countByCanal,
      jornadas: countByJornada,
      segmentos: countBySegmento,
      parceiros: countByParceiro,
      subgrupos: countBySubgrupo
    };

    const otherKeys = (key: FilterKey) => FILTER_KEYS.filter(k => k !== key);

    staticMatched.forEach(activity => {
      FILTER_KEYS.forEach(key => {
        if (matchActivity(activity, otherKeys(key))) {
          const value = getFilterValue(activity, key);
          if (value) {
            countMaps[key][value] = (countMaps[key][value] || 0) + 1;
          }
        }
      });
    });

    const totalRemainingDisparos = Object.values(filteredData).reduce((acc, list) => acc + list.length, 0);

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
  }, [allActivities, filters, filteredData]);

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
