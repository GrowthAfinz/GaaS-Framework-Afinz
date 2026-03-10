import { useMemo } from 'react';
import { CalendarData, FilterState, Activity } from '../types/framework';

type FilterKey = 'canais' | 'jornadas' | 'segmentos' | 'parceiros';
const FILTER_KEYS: FilterKey[] = ['canais', 'jornadas', 'segmentos', 'parceiros'];

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

  const matchActivity = (activity: Activity, omit: FilterKey[] = []) => {
    if (!omit.includes('canais') && filters.canais.length > 0 && !filters.canais.includes(activity.canal)) {
      return false;
    }

    if (!omit.includes('jornadas') && filters.jornadas.length > 0 && !filters.jornadas.includes(activity.jornada)) {
      return false;
    }

    if (!omit.includes('segmentos') && filters.segmentos.length > 0 && !filters.segmentos.includes(activity.segmento)) {
      return false;
    }

    if (!omit.includes('parceiros') && filters.parceiros.length > 0 && !filters.parceiros.includes(activity.parceiro)) {
      return false;
    }

    if (filters.bu.length > 0 && !filters.bu.includes(activity.bu)) {
      return false;
    }

    const startDate = parseISODate(filters.dataInicio);
    if (startDate) {
      const activityDate = normalizeDayStart(new Date(activity.dataDisparo));
      if (activityDate < normalizeDayStart(startDate)) return false;
    }

    const endDate = parseISODate(filters.dataFim);
    if (endDate) {
      const activityDate = normalizeDayStart(new Date(activity.dataDisparo));
      if (activityDate > normalizeDayEnd(endDate)) return false;
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

    const available = {
      canais: new Set<string>(),
      jornadas: new Set<string>(),
      segmentos: new Set<string>(),
      parceiros: new Set<string>()
    };

    const staticMatched = allActivities.filter(activity =>
      matchActivity(activity, ['canais', 'jornadas', 'segmentos', 'parceiros'])
    );

    staticMatched.forEach(activity => {
      if (activity.canal) available.canais.add(activity.canal);
      if (activity.jornada) available.jornadas.add(activity.jornada);
      if (activity.segmento) available.segmentos.add(activity.segmento);
      if (activity.parceiro) available.parceiros.add(activity.parceiro);
    });

    const countMaps: Record<FilterKey, Record<string, number>> = {
      canais: countByCanal,
      jornadas: countByJornada,
      segmentos: countBySegmento,
      parceiros: countByParceiro
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
      countByCanal,
      countByJornada,
      countBySegmento,
      countByParceiro,
      totalRemainingDisparos
    };
  }, [allActivities, filters, filteredData]);

  return {
    filteredData,
    availableCanais: orchestrator.availableCanais,
    availableJornadas: orchestrator.availableJornadas,
    availableSegmentos: orchestrator.availableSegmentos,
    availableParceiros: orchestrator.availableParceiros,
    countByCanal: orchestrator.countByCanal,
    countByJornada: orchestrator.countByJornada,
    countBySegmento: orchestrator.countBySegmento,
    countByParceiro: orchestrator.countByParceiro,
    totalRemainingDisparos: orchestrator.totalRemainingDisparos
  };
};
