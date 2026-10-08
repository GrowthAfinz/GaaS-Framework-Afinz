import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import type { CommunicationTemplate } from '../types/communication';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';
import type { FrameworkActivity } from '../utils/communicationOrchestrator';
import { buildTemplatePerformance, previousTotals, type PerformancePrevTotals, type TemplatePerformance } from '../utils/contentPerformanceModel';
import { previousPeriod, saoPauloPeriodBounds } from '../utils/saoPauloPeriod';

export type { TemplatePerformance, TemplateTimelinePoint, PerformancePrevTotals } from '../utils/contentPerformanceModel';

type GlobalFilters = ReturnType<typeof useAppStore.getState>['viewSettings']['filtrosGlobais'];

/**
 * Execuções VINCULADAS (template_id preenchido) do período, paginadas e com limites de São Paulo.
 * Mesmo recorte global da fila de reconciliação (BU, canal, jornada, segmento, parceiro, subgrupo).
 */
export async function loadLinkedExecutions(start: string, end: string, selectedBUs: string[], f: GlobalFilters, select = '*'): Promise<Record<string, unknown>[]> {
  const { gte, lt } = saoPauloPeriodBounds(start, end);
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    let q = supabase.from('activities').select(select).not('template_id', 'is', null)
      .gte('"Data de Disparo"', gte).lt('"Data de Disparo"', lt).order('id').range(offset, offset + 499);
    if (selectedBUs.length) q = q.in('BU', selectedBUs);
    if (f.canais?.length) q = q.in('"Canal"', f.canais);
    if (f.jornadas?.length) q = q.in('jornada', f.jornadas);
    if (f.segmentos?.length) q = q.in('"Segmento"', f.segmentos);
    if (f.parceiros?.length) q = q.in('"Parceiro"', f.parceiros);
    if (f.subgrupos?.length) q = q.in('"Subgrupos"', f.subgrupos);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if ((data ?? []).length < 500) return rows;
  }
}

/** Totais do período anterior de mesma duração (deltas da Visão Geral). */
export async function loadPreviousTotals(start: string, end: string, selectedBUs: string[], f: GlobalFilters): Promise<PerformancePrevTotals | null> {
  const prev = previousPeriod(start, end);
  return previousTotals(await loadLinkedExecutions(prev.start, prev.end, selectedBUs, f, '"Base Total", Abertura, Cliques, "Cartões Gerados"'));
}

/**
 * Performance por template (legado: TemplatePerformanceGrid). A aba Performance usa
 * useContentPerformance, que reaproveita o motor de reconciliação.
 */
export function useTemplatePerformance() {
  const [data, setData] = useState<TemplatePerformance[]>([]);
  const [previous, setPrevious] = useState<PerformancePrevTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();
  const f = useAppStore((s) => s.viewSettings.filtrosGlobais);
  const dataInicio = format(startDate, 'yyyy-MM-dd');
  const dataFim = format(endDate, 'yyyy-MM-dd');
  const filterKey = useMemo(
    () => JSON.stringify([dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros, f.subgrupos]),
    [dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros, f.subgrupos]
  );

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acts, tmpls, prev] = await Promise.all([
        loadLinkedExecutions(dataInicio, dataFim, selectedBUs, f),
        supabase.from('communication_templates').select('*'),
        loadPreviousTotals(dataInicio, dataFim, selectedBUs, f),
      ]);
      if (tmpls.error) throw tmpls.error;
      setData(buildTemplatePerformance(acts as unknown as FrameworkActivity[], (tmpls.data ?? []) as CommunicationTemplate[]));
      setPrevious(prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a performance por template.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

  return { data, previousTotals: previous, loading, error, refetch: fetchPerformance };
}
