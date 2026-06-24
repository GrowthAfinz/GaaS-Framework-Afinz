import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { inferChannelFromActivityName } from '../utils/inferChannel';

export interface ActivitySearchFilters {
  jornada?: string;
  segmento?: string;
  canal?: string;
  activityName?: string;
  data?: string; // YYYY-MM-DD
}

/** Um disparo candidato, agregando todas as execuções de um mesmo activity_name. */
export interface ActivityCandidate {
  activityName: string;
  jornada: string;
  canal: string;            // Canal salvo (pode divergir da taxonomia)
  canalInferido: string | null;
  segmento: string;
  bu: string;
  latestDate: string | null;
  executions: number;
  hasTemplate: boolean;
  templateId: string | null;
}

interface ActivityQueryRow {
  id: string;
  'Activity name / Taxonomia': string | null;
  jornada: string | null;
  Canal: string | null;
  Segmento: string | null;
  'Data de Disparo': string | null;
  BU: string | null;
  template_id: string | null;
}

const MAX_ROWS = 500;

function hasAnyFilter(f: ActivitySearchFilters): boolean {
  return !!(f.jornada || f.segmento || f.canal || f.activityName || f.data);
}

/**
 * Busca multidimensional em `activities`. Combina filtros (AND) e agrega por
 * activity_name, já que o vínculo de template é por activity_name (1 template → N execuções).
 */
export function useActivitySearch(filters: ActivitySearchFilters, debounceMs = 350) {
  const [candidates, setCandidates] = useState<ActivityCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chave estável para disparar o efeito só quando os filtros mudam de fato.
  const filterKey = useMemo(
    () => JSON.stringify([filters.jornada, filters.segmento, filters.canal, filters.activityName, filters.data]),
    [filters.jornada, filters.segmento, filters.canal, filters.activityName, filters.data]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!hasAnyFilter(filters)) {
      setCandidates([]);
      setError(null);
      setTruncated(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        let query = supabase
          .from('activities')
          .select('id, "Activity name / Taxonomia", jornada, "Canal", "Segmento", "Data de Disparo", BU, template_id')
          .not('Activity name / Taxonomia', 'is', null)
          .order('Data de Disparo', { ascending: false })
          .limit(MAX_ROWS);

        if (filters.jornada) query = query.ilike('jornada', `%${filters.jornada}%`);
        if (filters.segmento) query = query.ilike('Segmento', `%${filters.segmento}%`);
        if (filters.canal) query = query.eq('Canal', filters.canal);
        if (filters.activityName) query = query.ilike('Activity name / Taxonomia', `%${filters.activityName}%`);
        if (filters.data) query = query.eq('Data de Disparo', filters.data);

        const { data, error: qError } = await query;
        if (qError) throw qError;

        const rows = (data ?? []) as ActivityQueryRow[];
        setTruncated(rows.length >= MAX_ROWS);

        // Agrega por activity_name
        const byName = new Map<string, ActivityCandidate>();
        for (const r of rows) {
          const name = r['Activity name / Taxonomia'];
          if (!name) continue;
          const existing = byName.get(name);
          const date = r['Data de Disparo'] ?? null;
          if (existing) {
            existing.executions += 1;
            if (date && (!existing.latestDate || date > existing.latestDate)) existing.latestDate = date;
            if (r.template_id) { existing.hasTemplate = true; existing.templateId = r.template_id; }
          } else {
            byName.set(name, {
              activityName: name,
              jornada: r.jornada ?? '—',
              canal: r.Canal ?? '—',
              canalInferido: inferChannelFromActivityName(name),
              segmento: r.Segmento ?? '—',
              bu: r.BU ?? '—',
              latestDate: date,
              executions: 1,
              hasTemplate: !!r.template_id,
              templateId: r.template_id ?? null,
            });
          }
        }

        setCandidates(Array.from(byName.values()).sort((a, b) => (b.latestDate ?? '').localeCompare(a.latestDate ?? '')));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha na busca de disparos.');
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, debounceMs]);

  return { candidates, loading, error, truncated };
}
