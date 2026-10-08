import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useReconciliation } from './useReconciliation';
import { loadPreviousTotals } from './useTemplatePerformance';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';
import { useTemplateContentIndex } from '../services/templateContentIndex';
import { buildApprovedLibrary, buildTemplatePerformance, type PerformancePrevTotals } from '../utils/contentPerformanceModel';

/**
 * Dados das três visões de Performance por conteúdo, a partir do MESMO motor da fila de
 * reconciliação (useReconciliation): activities paginadas no período (São Paulo), consolidação
 * de duplicidades revisadas, evidência de pack/histórico e catálogo.
 *  - linked:   execuções vinculadas no período, agregadas por template (métricas reais).
 *  - orphans:  grupos de execuções sem template, com sugestões do motor.
 *  - library:  identidades do catálogo com estado de aprovação real e uso no período.
 */
export function useContentPerformance() {
  const rec = useReconciliation();
  const [contentRevision, setContentRevision] = useState(0);
  const contents = useTemplateContentIndex(contentRevision);
  const [previous, setPrevious] = useState<PerformancePrevTotals | null>(null);
  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();
  const f = useAppStore((s) => s.viewSettings.filtrosGlobais);
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');
  const prevKey = JSON.stringify([start, end, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros, f.subgrupos]);
  const fRef = useRef(f); fRef.current = f;

  const loadPrev = useCallback(() => {
    let alive = true;
    loadPreviousTotals(start, end, selectedBUs, fRef.current).then((v) => { if (alive) setPrevious(v); }).catch(() => { if (alive) setPrevious(null); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevKey]);
  useEffect(() => loadPrev(), [loadPrev]);

  const catalogRaw = useMemo(() => rec.catalog.map((c) => c.raw), [rec.catalog]);
  const linked = useMemo(() => buildTemplatePerformance(rec.periodLinked, catalogRaw), [rec.periodLinked, catalogRaw]);
  const library = useMemo(() => buildApprovedLibrary({
    catalog: rec.catalog.filter(c=>c.inCurrentFilter||rec.periodLinked.some(a=>a.template_id===c.id)).map(c=>c.raw), contents: contents.index, proposals: rec.proposals,
    periodLinked: rec.periodLinked, historyLinked: rec.historyLinked, orphans: rec.orphans,
  }), [catalogRaw, rec.catalog, contents.index, rec.proposals, rec.periodLinked, rec.historyLinked, rec.orphans]);

  const recRefetch = rec.refetch;
  const refetch = useCallback(() => { recRefetch(); setContentRevision((v) => v + 1); loadPrev(); }, [recRefetch, loadPrev]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  useEffect(() => { if (!rec.loading) setLoadedOnce(true); }, [rec.loading]);

  return {
    period: { start, end },
    linked, orphans: rec.orphans, library, catalog: rec.catalog, catalogRaw, contents: contents.index,
    contentsError: contents.error, previousTotals: previous,
    /** Primeira carga (sem dados ainda). Recargas posteriores não desmontam a tela. */
    initialLoading: rec.loading && !loadedOnce,
    refreshing: rec.loading && loadedOnce,
    error: rec.error,
    refetch,
  };
}
