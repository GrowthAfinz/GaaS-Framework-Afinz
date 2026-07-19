import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import { listTemplates } from '../services/communicationService';
import { decorateTemplate, matchesGlobalFilters } from './useTemplateCatalog';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';
import type { ActivityMomentSuggestion, CommunicationTemplate } from '../types/communication';
import {
  canalToId, resolveDim, parseSeq, parseActivity, matchTemplate, confidenceOf, formatSeq,
  templatePublicoCode, segmentoKey, segmentoKeyFromTemplateId,
  type Confidence, type MatchResult, type ParsedActivity, type TemplateDims,
} from '../utils/taxonomy';
import { runReconciliationGoldenSet } from '../utils/taxonomy.goldenset';

// Regressão do parser roda uma vez em DEV (removido do bundle de produção).
if (import.meta.env?.DEV) {
  const g = runReconciliationGoldenSet();
  if (g.failed) console.warn(`[taxonomy golden] ${g.failed}/${g.total} regressões:`, g.failures);
  else console.info(`[taxonomy golden] ${g.passed}/${g.total} OK`);
}

export interface CatalogEntry {
  id: string;
  channel: string;
  hasAsset: boolean;
  inCurrentFilter: boolean;
  vinc: number;
  dims: TemplateDims;
  raw: CommunicationTemplate;
}

export interface TemplateReuseSuggestion {
  usageSeq: string;
  targetSeq: string;
  label: string;
  variantType: 'subject_variant' | 'repeat_template';
}

export interface OrphanRow {
  uid: string;
  name: string;
  jornada: string;
  channel: string | null; // id da taxonomia
  canalLabel: string;
  segmentoLabel: string;
  subgrupoLabel: string;
  base: number;
  exec: number;
  latestDate: string | null;
  parsed: ParsedActivity;
  match: MatchResult<CatalogEntry> | null;
  confidence: Confidence;
  suggestedId: string;
  slotId?: string | null;
  momentSuggestion: ActivityMomentSuggestion;
  momentConflict: boolean;
  reuseSuggestion?: TemplateReuseSuggestion | null;
}

export interface ReconciledRow {
  uid: string;
  name: string;
  jornada: string;
  channel: string | null;
  canalLabel: string;
  segmentoLabel: string;
  subgrupoLabel: string;
  base: number;
  exec: number;
  latestDate: string | null;
  parsed: ParsedActivity;
  templateId: string;
  template: CatalogEntry | null;
}

export interface CoverageStats {
  pctCobertura: number;
  disparosUnicos: number;   // activity_names distintos disparados no período (CRM)
  comPeca: number;          // disparos únicos cuja peça (asset) já está no template
  precisamPeca: number;     // disparos únicos que ainda precisam da peça
  orfaos: number;           // disparos sem NENHUM template vinculado
  semAsset: number;         // templates (IDs) sem peça anexada
  ativos: number;           // templates com peça no ar
  totalTemplates: number;
  fortes: number;
  byChannel: { ch: string; label: string; color: string; total: number; orf: number; status: string }[];
}

interface OrphanQueryRow {
  'Activity name / Taxonomia': string | null;
  jornada: string | null;
  Canal: string | null;
  BU: string | null;
  Parceiro: string | null;
  Segmento: string | null;
  Subgrupos: string | null;
  'Base Total': number | null;
  'Data de Disparo': string | null;
  template_id: string | null;
}

interface SlotMomentRow {
  id: string;
  journey_name: string;
  activity_name: string;
  channel: string;
  metadata: Record<string, unknown> | null;
}

const CH_META: Record<string, { label: string; color: string }> = {
  email: { label: 'E-mail', color: '#6366f1' },
  wpp: { label: 'WhatsApp', color: '#25D366' },
  push: { label: 'Push', color: '#f59e0b' },
  sms: { label: 'SMS', color: '#0ea5e9' },
};

function templateDims(t: CommunicationTemplate): TemplateDims {
  const id = t.template_id;
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const metaSeg = typeof meta.segmento_af_sub1 === 'string' ? meta.segmento_af_sub1 : null;
  const metaCamp = typeof meta.campanha === 'string' ? meta.campanha : null;
  return {
    // Público = prefixo do template_id (código exato de parceiro/BU).
    publico: templatePublicoCode(id),
    canal: canalToId(t.channel) ?? resolveDim('canal', id),
    campanha: resolveDim('campanha', metaCamp ?? id),
    // Fonte de verdade do segmento é o metadata (o token do id podia divergir, ex. dia _bsp_ = CRM).
    segmento: segmentoKey(metaSeg) ?? segmentoKeyFromTemplateId(id),
    seq: parseSeq(id),
    variante: resolveDim('variante', id),
  };
}

const num = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

const slotKey = (journey: string | null | undefined, activity: string | null | undefined, channel: string | null | undefined) => (
  `${journey || 'Sem jornada'}::${activity || ''}::${channel || 'N/A'}`
);

function momentLabel(s: Pick<ActivityMomentSuggestion, 'kind' | 'enabled' | 'week' | 'dispatch'>) {
  if (s.kind === 'pontual') return s.enabled && s.dispatch ? `Pontual · ${s.dispatch}` : 'Pontual';
  if (s.kind === 'semana_disparo') return `Semana ${s.week || 1} · Disparo ${s.dispatch || 1}`;
  return `Disparo ${s.dispatch || 1}`;
}

function readMomentSuggestion(metadata: Record<string, unknown> | null | undefined): ActivityMomentSuggestion | null {
  const raw = metadata?.moment_suggestion;
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ActivityMomentSuggestion>;
  if (r.kind !== 'semana_disparo' && r.kind !== 'disparo' && r.kind !== 'pontual') return null;
  return {
    kind: r.kind,
    enabled: r.enabled !== false,
    week: typeof r.week === 'number' ? r.week : null,
    dispatch: typeof r.dispatch === 'number' ? r.dispatch : null,
    label: r.label || momentLabel({
      kind: r.kind,
      enabled: r.enabled !== false,
      week: typeof r.week === 'number' ? r.week : null,
      dispatch: typeof r.dispatch === 'number' ? r.dispatch : null,
    }),
    confidence: r.confidence || 'manual',
    source: r.source || 'manual',
    updated_at: r.updated_at,
  };
}

function inferMomentSuggestion(activityName: string): ActivityMomentSuggestion {
  const seq = parseSeq(activityName);
  const weekly = seq?.match(/^S(\d+)D0*(\d+)$/i);
  if (weekly) {
    const week = Number(weekly[1]);
    const dispatch = Number(weekly[2]);
    return {
      kind: 'semana_disparo',
      enabled: true,
      week,
      dispatch: dispatch || 1,
      label: formatSeq(seq),
      confidence: 'alta',
      source: 'parser',
    };
  }
  const dispatchOnly = seq?.match(/^D0*(\d+)$/i);
  if (dispatchOnly) {
    const dispatch = Number(dispatchOnly[1]);
    return {
      kind: 'disparo',
      enabled: true,
      week: null,
      dispatch,
      label: formatSeq(seq),
      confidence: 'media',
      source: 'parser',
    };
  }
  return {
    kind: 'pontual',
    enabled: false,
    week: null,
    dispatch: 1,
    label: 'Pontual',
    confidence: 'baixa',
    source: 'parser',
  };
}

function momentSuggestionToSeq(suggestion: ActivityMomentSuggestion): string | null {
  if (!suggestion.enabled && suggestion.kind === 'pontual') return null;
  const dispatch = suggestion.dispatch && suggestion.dispatch > 0
    ? Math.round(suggestion.dispatch)
    : 1;
  if (suggestion.kind === 'semana_disparo') {
    const week = suggestion.week && suggestion.week > 0 ? Math.round(suggestion.week) : 1;
    return `S${week}D${String(dispatch).padStart(2, '0')}`;
  }
  if (suggestion.kind === 'disparo' || suggestion.kind === 'pontual') {
    return `D${dispatch}`;
  }
  return null;
}

function applyMomentSuggestion(parsed: ParsedActivity, suggestion: ActivityMomentSuggestion): ParsedActivity {
  const seq = momentSuggestionToSeq(suggestion);
  return {
    ...parsed,
    seq,
    cadencia: seq && seq.startsWith('D') ? seq : parsed.cadencia,
  };
}

function momentExactTemplates(parsed: ParsedActivity, templates: CatalogEntry[]): CatalogEntry[] {
  if (!parsed.seq) return templates;
  return templates.filter((tpl) => tpl.dims.seq === parsed.seq);
}

function inferTopFunnelReuse(parsed: ParsedActivity): TemplateReuseSuggestion | null {
  if (parsed.canal !== 'email' || parsed.campanha !== 'copa' || !parsed.seq) return null;
  const match = parsed.seq.match(/^S(\d+)D0*(\d+)$/i);
  if (!match) return null;
  const week = Number(match[1]);
  const dispatch = Number(match[2]);
  if (!week || !dispatch) return null;
  if (dispatch === 3) {
    return {
      usageSeq: parsed.seq,
      targetSeq: `S${week}D01`,
      label: 'Email x.1: variação de assunto reaproveita a peça D1',
      variantType: 'subject_variant',
    };
  }
  if (dispatch === 4) {
    return {
      usageSeq: parsed.seq,
      targetSeq: `S${week}D02`,
      label: 'Continuação da régua: D4 repete a peça D2',
      variantType: 'repeat_template',
    };
  }
  return null;
}

function applyTemplateSeq(parsed: ParsedActivity, seq: string): ParsedActivity {
  return {
    ...parsed,
    seq,
    cadencia: seq.startsWith('D') ? seq : parsed.cadencia,
  };
}

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
    () => JSON.stringify([dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros, f.subgrupos]),
    [dataInicio, dataFim, selectedBUs, f.canais, f.jornadas, f.segmentos, f.parceiros, f.subgrupos]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseSelect = '"Activity name / Taxonomia", jornada, "Canal", "BU", "Parceiro", "Segmento", "Subgrupos", "Base Total", "Data de Disparo", template_id';

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
      if (f.subgrupos?.length) orphanQuery = orphanQuery.in('"Subgrupos"', f.subgrupos);

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
      if (f.subgrupos?.length) linkedQuery = linkedQuery.in('"Subgrupos"', f.subgrupos);

      const [{ data: acts, error: aErr }, { data: linkedActs, error: lErr }, templates] = await Promise.all([orphanQuery, linkedQuery, listTemplates()]);
      if (aErr) throw aErr;
      if (lErr) throw lErr;
      const orphanRows = ((acts ?? []) as OrphanQueryRow[]);
      const slotMap = new Map<string, SlotMomentRow>();
      const activityNames = Array.from(new Set(orphanRows.map((r) => r['Activity name / Taxonomia']).filter((v): v is string => !!v)));
      if (activityNames.length) {
        const { data: slots, error: slotError } = await supabase
          .from('communication_slots')
          .select('id, journey_name, activity_name, channel, metadata')
          .in('activity_name', activityNames);
        if (slotError) {
          console.warn('[useReconciliation] falha ao carregar curadoria de momento:', slotError);
        } else {
          for (const s of (slots ?? []) as SlotMomentRow[]) {
            slotMap.set(slotKey(s.journey_name, s.activity_name, s.channel), s);
          }
        }
      }

      const cat: CatalogEntry[] = templates.map((t) => ({
        id: t.template_id,
        channel: t.channel,
        hasAsset: !!t.original_path,
        inCurrentFilter: matchesGlobalFilters(decorateTemplate(t), selectedBUs, f),
        vinc: 0,
        dims: templateDims(t),
        raw: t,
      }));
      const filteredCat = cat.filter((t) => t.inCurrentFilter);

      // Agrega órfãos por activity_name
      const byName = new Map<string, OrphanRow>();
      for (const r of orphanRows) {
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
          const parsed = parseActivity(name, {
            canal: r.Canal, parceiro: r.Parceiro, segmento: r.Segmento, bu: r.BU, jornada: r.jornada,
          });
          const slot = slotMap.get(slotKey(r.jornada, name, r.Canal));
          const momentSuggestion = readMomentSuggestion(slot?.metadata) ?? inferMomentSuggestion(name);
          const effectiveParsed = applyMomentSuggestion(parsed, momentSuggestion);
          const exactInFilter = effectiveParsed.seq ? momentExactTemplates(effectiveParsed, filteredCat) : filteredCat;
          const exactInCatalog = effectiveParsed.seq ? momentExactTemplates(effectiveParsed, cat) : [];
          const exactMatch = matchTemplate(effectiveParsed, exactInFilter) ?? matchTemplate(effectiveParsed, exactInCatalog);
          const reuseSuggestion = inferTopFunnelReuse(effectiveParsed);
          const reuseParsed = reuseSuggestion ? applyTemplateSeq(effectiveParsed, reuseSuggestion.targetSeq) : null;
          const reuseInFilter = reuseParsed ? momentExactTemplates(reuseParsed, filteredCat) : [];
          const reuseInCatalog = reuseParsed ? momentExactTemplates(reuseParsed, cat) : [];
          const reuseMatch = reuseParsed
            ? matchTemplate(reuseParsed, reuseInFilter) ?? matchTemplate(reuseParsed, reuseInCatalog)
            : null;
          const match = exactMatch ?? (reuseMatch ? {
            ...reuseMatch,
            reasons: [
              { dim: 'reuse', label: 'Regra da régua', val: reuseSuggestion?.label ?? 'Reuso esperado', ok: true },
              { dim: 'usage_seq', label: 'Uso real', val: effectiveParsed.seq ?? 'n/i', ok: true },
              ...reuseMatch.reasons,
            ],
          } : null);
          const fallbackMatch = matchTemplate(effectiveParsed, filteredCat) ?? matchTemplate(effectiveParsed, cat);
          const momentConflict = !!(
            effectiveParsed.seq
            && !match
            && fallbackMatch?.tpl.dims.seq
            && fallbackMatch.tpl.dims.seq !== effectiveParsed.seq
          );
          byName.set(name, {
            uid: name,
            name,
            jornada: r.jornada ?? '—',
            channel: chId,
            canalLabel: r.Canal ?? '—',
            segmentoLabel: r.Segmento ?? '—',
            subgrupoLabel: r.Subgrupos ?? '—',
            base: num(r['Base Total']),
            exec: 1,
            latestDate: date,
            parsed: effectiveParsed,
            match,
            confidence: confidenceOf(match),
            suggestedId: match ? match.tpl.id : (effectiveParsed.canal ? '' : ''),
            slotId: slot?.id ?? null,
            momentSuggestion,
            momentConflict,
            reuseSuggestion: exactMatch ? null : reuseSuggestion,
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
          const parsed = parseActivity(name, {
            canal: r.Canal, parceiro: r.Parceiro, segmento: r.Segmento, bu: r.BU, jornada: r.jornada,
          });
          byLinked.set(uid, {
            uid,
            name,
            jornada: r.jornada ?? '—',
            channel: chId,
            canalLabel: r.Canal ?? '—',
            segmentoLabel: r.Segmento ?? '—',
            subgrupoLabel: r.Subgrupos ?? '—',
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
    const orphanNames = new Set(orphans.map((o) => o.name));
    // Disparos únicos que já têm a PEÇA (template vinculado com asset).
    const comPecaNames = new Set(reconciled.filter((r) => r.template?.hasAsset).map((r) => r.name));
    // Todos os disparos únicos do período (órfãos + reconciliados).
    const allNames = new Set<string>([...orphanNames, ...reconciled.map((r) => r.name)]);

    const disparosUnicos = allNames.size;
    const comPeca = comPecaNames.size;
    const precisamPeca = disparosUnicos - comPeca; // órfãos + vinculados a template sem peça
    const orfaos = orphans.length;
    const scopedCatalog = catalog.filter((t) => t.inCurrentFilter);
    const semAsset = scopedCatalog.filter((t) => !t.hasAsset).length;
    const ativos = scopedCatalog.filter((t) => t.hasAsset).length;
    const fortes = orphans.filter((o) => o.confidence === 'forte').length;

    const byChannel = ['email', 'wpp', 'push', 'sms'].map((ch) => {
      const orf = orphans.filter((o) => o.channel === ch).length;
      const total = new Set<string>([
        ...orphans.filter((o) => o.channel === ch).map((o) => o.name),
        ...reconciled.filter((r) => r.channel === ch).map((r) => r.name),
      ]).size;
      const status = total === 0 ? 'sem atividade' : orf > 0 ? `${orf} órfãos` : 'ok';
      return { ch, label: CH_META[ch].label, color: CH_META[ch].color, total, orf, status };
    });

    return {
      pctCobertura: disparosUnicos > 0 ? Math.round((comPeca / disparosUnicos) * 100) : 0,
      disparosUnicos, comPeca, precisamPeca, orfaos, semAsset, ativos,
      totalTemplates: scopedCatalog.length, fortes, byChannel,
    };
  }, [orphans, reconciled, catalog]);

  return { orphans, reconciled, catalog, coverage, loading, error, refetch: fetchData };
}
