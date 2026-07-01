import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import { listTemplates } from '../services/communicationService';
import { decorateTemplate, matchesGlobalFilters } from './useTemplateCatalog';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';
import type { CommunicationTemplate } from '../types/communication';
import {
  canalToId, resolveDim, parseSeq, parseActivity, matchTemplate, confidenceOf,
  type Confidence, type MatchResult, type ParsedActivity, type TemplateDims,
} from '../utils/taxonomy';

export interface CatalogEntry {
  id: string;
  channel: string;
  hasAsset: boolean;
  vinc: number;
  dims: TemplateDims;
  raw: CommunicationTemplate;
}

export interface OrphanRow {
  uid: string;
  name: string;
  jornada: string;
  channel: string | null; // id da taxonomia
  canalLabel: string;
  base: number;
  exec: number;
  latestDate: string | null;
  parsed: ParsedActivity;
  match: MatchResult<CatalogEntry> | null;
  confidence: Confidence;
  suggestedId: string;
}

export interface ReconciledRow {
  uid: string;
  name: string;
  jornada: string;
  channel: string | null;
  canalLabel: string;
  base: number;
  exec: number;
  latestDate: string | null;
  parsed: ParsedActivity;
  templateId: string;
  template: CatalogEntry | null;
}

export interface CoverageStats {
  pctCobertura: number;
  totalDisparos: number;
  cobertos: number;
  orfaos: number;
  orphanExec: number;
  semAsset: number;
  ativos: number;
  totalTemplates: number;
  fortes: number;
  byChannel: { ch: string; label: string; color: string; orf: number; tpl: number; ass: number }[];
}

interface OrphanQueryRow {
  'Activity name / Taxonomia': string | null;
  jornada: string | null;
  Canal: string | null;
  Parceiro: string | null;
  Segmento: string | null;
  'Base Total': number | null;
  'Data de Disparo': string | null;
  template_id: string | null;
}

const CH_META: Record<string, { label: string; color: string }> = {
  email: { label: 'E-mail', color: '#6366f1' },
  wpp: { label: 'WhatsApp', color: '#25D366' },
  push: { label: 'Push', color: '#f59e0b' },
  sms: { label: 'SMS', color: '#0ea5e9' },
};

function templateDims(t: CommunicationTemplate): TemplateDims {
  const id = t.template_id;
  return {
    publico: resolveDim('publico', id),
    canal: canalToId(t.channel) ?? resolveDim('canal', id),
    campanha: resolveDim('campanha', id),
    segmento: resolveDim('segmento', id),
    seq: parseSeq(id),
  };
}

const num = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

/**
 * Fila de reconciliação: disparos (activity_name) do recorte SEM template,
 * com o melhor template sugerido + estatísticas de cobertura. Escopo pelos
 * filtros globais (período, BU, canais, jornadas, segmentos, parceiros).
 */
export function useReconciliation() {
  const [orphans, setOrphans] = useState<OrphanRow[]>([]);
  const [reconciled, setReconciled] = useState<ReconciledRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();
  const f = useAppStore((s) => s.viewSettings.filtrosGlobais);
  const dataInicio = format(startDate, 'yyyy-MM-dd');
  const dataFim = format(endDate, 'yyyy-MM-dd');

  const filterKey = useMemo(
    () => JSON.stringify([dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros]),
    [dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseSelect = '"Activity name / Taxonomia", jornada, "Canal", "Parceiro", "Segmento", "Base Total", "Data de Disparo", template_id';

      let orphanQuery = supabase
        .from('activities')
        .select(baseSelect)
        .is('template_id', null)
        .not('"Activity name / Taxonomia"', 'is', null)
        .gte('"Data de Disparo"', dataInicio)
        .lte('"Data de Disparo"', `${dataFim} 23:59:59`)
        .in('"Canal"', ['E-mail', 'SMS', 'WhatsApp', 'Push'])
        .order('"Data de Disparo"', { ascending: false })
        .limit(1500);
      if (selectedBUs.length) orphanQuery = orphanQuery.in('BU', selectedBUs);
      if (f.canais?.length) orphanQuery = orphanQuery.in('"Canal"', f.canais);
      if (f.jornadas?.length) orphanQuery = orphanQuery.in('jornada', f.jornadas);
      if (f.segmentos?.length) orphanQuery = orphanQuery.in('"Segmento"', f.segmentos);
      if (f.parceiros?.length) orphanQuery = orphanQuery.in('"Parceiro"', f.parceiros);

      let linkedQuery = supabase
        .from('activities')
        .select(baseSelect)
        .not('template_id', 'is', null)
        .not('"Activity name / Taxonomia"', 'is', null)
        .gte('"Data de Disparo"', dataInicio)
        .lte('"Data de Disparo"', `${dataFim} 23:59:59`)
        .in('"Canal"', ['E-mail', 'SMS', 'WhatsApp', 'Push'])
        .order('"Data de Disparo"', { ascending: false })
        .limit(2500);
      if (selectedBUs.length) linkedQuery = linkedQuery.in('BU', selectedBUs);
      if (f.canais?.length) linkedQuery = linkedQuery.in('"Canal"', f.canais);
      if (f.jornadas?.length) linkedQuery = linkedQuery.in('jornada', f.jornadas);
      if (f.segmentos?.length) linkedQuery = linkedQuery.in('"Segmento"', f.segmentos);
      if (f.parceiros?.length) linkedQuery = linkedQuery.in('"Parceiro"', f.parceiros);

      const [{ data: acts, error: aErr }, { data: linkedActs, error: lErr }, templates] = await Promise.all([orphanQuery, linkedQuery, listTemplates()]);
      if (aErr) throw aErr;
      if (lErr) throw lErr;

      // Aplica os mesmos filtros globais aos templates (para o header de cobertura respeitar o recorte).
      const filteredTemplates = templates.filter((t) => matchesGlobalFilters(decorateTemplate(t), selectedBUs, f));

      const cat: CatalogEntry[] = filteredTemplates.map((t) => ({
        id: t.template_id,
        channel: t.channel,
        hasAsset: !!t.original_path,
        vinc: 0,
        dims: templateDims(t),
        raw: t,
      }));

      // Agrega órfãos por activity_name
      const byName = new Map<string, OrphanRow>();
      for (const r of (acts ?? []) as OrphanQueryRow[]) {
        const name = r['Activity name / Taxonomia'];
        if (!name) continue;
        const date = r['Data de Disparo'] ?? null;
        const existing = byName.get(name);
        if (existing) {
          existing.exec += 1;
          existing.base += num(r['Base Total']);
          if (date && (!existing.latestDate || date > existing.latestDate)) existing.latestDate = date;
        } else {
          const chId = canalToId(r.Canal);
          const parsed = parseActivity(name, { canal: r.Canal, parceiro: r.Parceiro, segmento: r.Segmento });
          const match = matchTemplate(parsed, cat);
          byName.set(name, {
            uid: name,
            name,
            jornada: r.jornada ?? '—',
            channel: chId,
            canalLabel: r.Canal ?? '—',
            base: num(r['Base Total']),
            exec: 1,
            latestDate: date,
            parsed,
            match,
            confidence: confidenceOf(match),
            suggestedId: match ? match.tpl.id : (parsed.canal ? '' : ''),
          });
        }
      }

      const catById = new Map(cat.map((t) => [t.id, t]));
      const byLinked = new Map<string, ReconciledRow>();
      for (const r of (linkedActs ?? []) as OrphanQueryRow[]) {
        const name = r['Activity name / Taxonomia'];
        const templateId = r.template_id;
        if (!name || !templateId) continue;
        const date = r['Data de Disparo'] ?? null;
        const uid = `${templateId}::${name}`;
        const existing = byLinked.get(uid);
        if (existing) {
          existing.exec += 1;
          existing.base += num(r['Base Total']);
          if (date && (!existing.latestDate || date > existing.latestDate)) existing.latestDate = date;
        } else {
          const chId = canalToId(r.Canal);
          const parsed = parseActivity(name, { canal: r.Canal, parceiro: r.Parceiro, segmento: r.Segmento });
          byLinked.set(uid, {
            uid,
            name,
            jornada: r.jornada ?? 'â€”',
            channel: chId,
            canalLabel: r.Canal ?? 'â€”',
            base: num(r['Base Total']),
            exec: 1,
            latestDate: date,
            parsed,
            templateId,
            template: catById.get(templateId) ?? null,
          });
        }
      }

      setCatalog(cat);
      setOrphans(Array.from(byName.values()));
      setReconciled(Array.from(byLinked.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a fila de reconciliação.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const coverage = useMemo<CoverageStats>(() => {
    const orphanExec = orphans.reduce((a, o) => a + o.exec, 0);
    const orfaos = orphans.length;
    const semAsset = catalog.filter((t) => !t.hasAsset).length;
    const ativos = catalog.filter((t) => t.hasAsset).length;
    const fortes = orphans.filter((o) => o.confidence === 'forte').length;
    // Base de cobertura: disparos órfãos + execuções já cobertas (aprox. via catálogo com asset)
    const totalDisparos = orphanExec + ativos;
    const cobertos = ativos;
    const byChannel = ['email', 'wpp', 'push', 'sms'].map((ch) => ({
      ch,
      label: CH_META[ch].label,
      color: CH_META[ch].color,
      orf: orphans.filter((o) => o.channel === ch).length,
      tpl: catalog.filter((t) => canalToId(t.channel) === ch).length,
      ass: catalog.filter((t) => canalToId(t.channel) === ch && t.hasAsset).length,
    }));
    return {
      pctCobertura: totalDisparos > 0 ? Math.round((cobertos / totalDisparos) * 100) : 0,
      totalDisparos, cobertos, orfaos, orphanExec, semAsset, ativos,
      totalTemplates: catalog.length, fortes, byChannel,
    };
  }, [orphans, catalog]);

  return { orphans, reconciled, catalog, coverage, loading, error, refetch: fetchData };
}
