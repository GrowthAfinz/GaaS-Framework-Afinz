import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { toCanonicalChannel } from '../utils/inferChannel';
import type { CatalogTemplate } from './useTemplateCatalog';

export interface ActivitySuggestion {
  activityName: string;
  jornada: string;
  segmento: string;
  latestDate: string | null;
  executions: number;
  score: number;          // 0-100
  reasons: string[];
  alreadyLinked: boolean; // já vinculado a ESTE template
}

interface Row {
  'Activity name / Taxonomia': string | null;
  jornada: string | null;
  Segmento: string | null;
  'Data de Disparo': string | null;
  template_id: string | null;
}

// segmento_af_sub1 (planilha) -> sigla esperada na taxonomia
const SIGLA_BY_SEGMENTO: Record<string, string[]> = {
  base_proprietaria: ['bsp'],
  negados: ['ngd'],
  crm: ['crm', 'apr'],
};

/** Família/emissor esperado pelo prefixo do template_id. */
function expectedEmissor(templateId: string): 'afz' | 'plu' | null {
  const id = templateId.toLowerCase();
  if (id.startsWith('plurix_')) return 'plu';
  if (id.startsWith('b2c_') || id.startsWith('dia_') || id.startsWith('bb_')) return 'afz';
  return null;
}

/**
 * Sugere os activity_name mais prováveis para um template (camada B — determinística).
 * Filtra por canal + marca; pontua por copa, semana (af_sub2), sigla de segmento,
 * recência e "não vinculado". Retorna top-N para marcação humana (1 template → N).
 */
export function useActivitySuggestions(template: CatalogTemplate | null, topN = 8) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channel = template?.channel ?? '';
  const campanha = (template?.campanha ?? '').toLowerCase();
  const semana = (template?.semana ?? '').toLowerCase();
  const segKey = (template?.segmento_af_sub1 ?? '').toLowerCase();
  const templateId = template?.template_id ?? '';

  useEffect(() => {
    if (!template) { setRows([]); return; }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        let q = supabase
          .from('activities')
          .select('"Activity name / Taxonomia", jornada, "Segmento", "Data de Disparo", template_id')
          .not('"Activity name / Taxonomia"', 'is', null)
          .order('"Data de Disparo"', { ascending: false })
          .limit(1000);
        if (channel) q = q.eq('"Canal"', channel);
        if (campanha.includes('copa')) q = q.ilike('"Activity name / Taxonomia"', '%copa%');
        const { data, error: e } = await q;
        if (e) throw e;
        if (active) { setRows((data ?? []) as Row[]); setError(null); }
      } catch (err) {
        if (active) { setError(err instanceof Error ? err.message : 'Falha ao buscar sugestões.'); setRows([]); }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, channel, campanha, semana, segKey]);

  const suggestions = useMemo<ActivitySuggestion[]>(() => {
    if (!template) return [];
    const emissor = expectedEmissor(templateId);
    const siglas = SIGLA_BY_SEGMENTO[segKey] ?? [];

    const byName = new Map<string, ActivitySuggestion>();
    for (const r of rows) {
      const name = r['Activity name / Taxonomia'];
      if (!name) continue;
      const lower = name.toLowerCase();

      // Filtro de marca: descarta emissor divergente.
      if (emissor && lower.split('_', 1)[0] !== emissor && !(emissor === 'plu' && lower.includes('_grl_'))) continue;

      const date = r['Data de Disparo'] ?? null;
      const linkedToThis = r.template_id === templateId;
      let s = byName.get(name);
      if (!s) {
        const reasons: string[] = [];
        let score = 0;
        if (lower.includes('copa')) { score += 20; reasons.push('Copa'); }
        if (semana && new RegExp(`(^|[^a-z])${semana}([^a-z0-9]|$)`).test(lower)) { score += 25; reasons.push(`semana ${semana}`); }
        if (siglas.some((sg) => lower.includes(`_${sg}_`))) { score += 25; reasons.push('segmento'); }
        if (!r.template_id) { score += 10; reasons.push('livre'); }
        score += 10; // canal/marca já casaram (passou nos filtros)
        s = {
          activityName: name,
          jornada: r.jornada ?? '—',
          segmento: r.Segmento ?? '—',
          latestDate: date,
          executions: 1,
          score: Math.min(100, score),
          reasons,
          alreadyLinked: linkedToThis,
        };
        byName.set(name, s);
      } else {
        s.executions += 1;
        if (date && (!s.latestDate || date > s.latestDate)) s.latestDate = date;
        if (linkedToThis) s.alreadyLinked = true;
      }
    }

    return Array.from(byName.values())
      .sort((a, b) => b.score - a.score || (b.latestDate ?? '').localeCompare(a.latestDate ?? ''))
      .slice(0, topN);
  }, [rows, template, templateId, semana, segKey, topN]);

  return { suggestions, loading, error };
}
