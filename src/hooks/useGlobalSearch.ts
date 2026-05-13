import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export type GlobalSearchResultType = 'segmento' | 'jornada' | 'activity';

export interface GlobalSearchResult {
  type: GlobalSearchResultType;
  label: string;
  bu?: string;
  segmento?: string;
  count?: number;
}

export function useGlobalSearch(query: string): GlobalSearchResult[] {
  const activities = useAppStore((state) => state.activities);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const segmentos = new Map<string, { count: number; bu: string }>();
    const jornadas = new Map<string, number>();
    const activityResults: GlobalSearchResult[] = [];

    for (const a of activities) {
      if (a.segmento) {
        const seg = a.segmento;
        if (seg.toLowerCase().includes(q)) {
          const prev = segmentos.get(seg) ?? { count: 0, bu: a.bu };
          segmentos.set(seg, { count: prev.count + 1, bu: a.bu });
        }
      }

      if (a.jornada) {
        const jor = a.jornada;
        if (jor.toLowerCase().includes(q)) {
          jornadas.set(jor, (jornadas.get(jor) ?? 0) + 1);
        }
      }

      if (activityResults.length < 5) {
        const actName = a.id || (a.raw?.['Activity name / Taxonomia'] as string | undefined);
        if (actName && actName.toLowerCase().includes(q)) {
          activityResults.push({
            type: 'activity',
            label: actName,
            bu: a.bu,
            segmento: a.segmento,
          });
        }
      }
    }

    const segmentoResults: GlobalSearchResult[] = Array.from(segmentos.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([label, { count, bu }]) => ({ type: 'segmento', label, bu, count }));

    const jornadaResults: GlobalSearchResult[] = Array.from(jornadas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ type: 'jornada', label, count }));

    return [...segmentoResults, ...jornadaResults, ...activityResults];
  }, [activities, query]);
}
