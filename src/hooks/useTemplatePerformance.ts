import { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format, subDays } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import type { CommunicationTemplate } from '../types/communication';
import { channelUnitCost } from '../utils/inferChannel';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';
import type { ActivityRow } from '../types/activity';

export interface TemplateTimelinePoint {
  date: string;
  label: string;
  executions: number;
  baseEnviada: number;
  aberturas: number;
  cliques: number;
  cartoes: number;
  propostas: number;
  custoTotal: number;
  custoEfetivo: number;
  ctr: number;
  taxaAbertura: number;
  taxaConversao: number;
  cacEfetivo: number;
  activities: ActivityRow[];
}

/** Performance agregada de um template (soma de todas as execucoes vinculadas). */
export interface TemplatePerformance {
  template: CommunicationTemplate;
  activityNames: string[];
  timeline: TemplateTimelinePoint[];
  executions: number;
  baseEnviada: number;
  entregas: number;
  temEntrega: boolean;
  aberturas: number;
  cliques: number;
  cartoes: number;
  propostas: number;
  custoTotal: number;        // soma real de "Custo Total Campanha" (0 se nao preenchido)
  ctr: number;               // cliques / baseEnviada
  taxaConversao: number;     // cartoes / baseEnviada
  cac: number;               // custoTotal / cartoes (CAC real; 0 se sem custo)
  custoCanalEstimado: number; // baseEnviada * custo unitario do canal
  cacEstimado: number;       // custoCanalEstimado / cartoes (estimativa de canal)
  // Valores "efetivos": usam o custo real quando existe, senao caem no custo de canal.
  custoEfetivo: number;      // gasto exibido (real ou estimado pelo canal)
  cacEfetivo: number;        // CAC exibido (real ou estimado pelo canal)
  custoEstimado: boolean;    // true quando custoEfetivo veio do custo de canal (sem custo real)
}

/** Totais do período anterior (mesma duração), para deltas nos KPI cards. */
export interface PerformancePrevTotals {
  executions: number;
  baseEnviada: number;
  aberturas: number;
  cliques: number;
  cartoes: number;
}

interface ActivityMetricRow {
  template_id: string | null;
  'Activity name / Taxonomia': string | null;
  'Data de Disparo': string | null;
  'Base Total': number | null;
  'Taxa de Entrega'?: number | null;
  Abertura: number | null;
  Cliques: number | null;
  'Cartões Gerados'?: number | null;
  'CartÃµes Gerados'?: number | null;
  Propostas: number | null;
  'Custo Total Campanha': number | null;
}

const num = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

const deliveredVolume = (base: number, rawRate: number | null | undefined) => {
  if (rawRate == null || !Number.isFinite(Number(rawRate))) return 0;
  const rate = Number(rawRate) > 1 ? Number(rawRate) / 100 : Number(rawRate);
  return Math.round(base * Math.max(0, Math.min(rate, 1)));
};

type Accumulator = TemplatePerformance & {
  _names: Set<string>;
  _timeline: Map<string, TemplateTimelinePoint>;
};

function emptyTimelinePoint(date: string): TemplateTimelinePoint {
  return {
    date,
    label: date === 'sem-data' ? 's/d' : `${date.slice(8, 10)}/${date.slice(5, 7)}`,
    executions: 0,
    baseEnviada: 0,
    aberturas: 0,
    cliques: 0,
    cartoes: 0,
    propostas: 0,
    custoTotal: 0,
    custoEfetivo: 0,
    ctr: 0,
    taxaAbertura: 0,
    taxaConversao: 0,
    cacEfetivo: 0,
    activities: [],
  };
}

function createAccumulator(template: CommunicationTemplate): Accumulator {
  return {
    template,
    activityNames: [],
    timeline: [],
    executions: 0,
    baseEnviada: 0,
    entregas: 0,
    temEntrega: false,
    aberturas: 0,
    cliques: 0,
    cartoes: 0,
    propostas: 0,
    custoTotal: 0,
    ctr: 0,
    taxaConversao: 0,
    cac: 0,
    custoCanalEstimado: 0,
    cacEstimado: 0,
    custoEfetivo: 0,
    cacEfetivo: 0,
    custoEstimado: false,
    _names: new Set<string>(),
    _timeline: new Map<string, TemplateTimelinePoint>(),
  };
}

/**
 * Performance por template - JOIN 100% local no GaaS:
 * `activities` agregado por `template_id`, enriquecido com `communication_templates`.
 * Nao chama AppsFlyer. A timeline usa as mesmas activity_names vinculadas.
 */
export function useTemplatePerformance() {
  const [data, setData] = useState<TemplatePerformance[]>([]);
  const [previousTotals, setPreviousTotals] = useState<PerformancePrevTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros globais (mesma fonte das outras abas).
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
      let actQuery = supabase
        .from('activities')
        .select('*')
        .not('template_id', 'is', null)
        .gte('"Data de Disparo"', dataInicio)
        .lte('"Data de Disparo"', `${dataFim} 23:59:59`);

      if (selectedBUs.length) actQuery = actQuery.in('BU', selectedBUs);
      if (f.canais?.length) actQuery = actQuery.in('"Canal"', f.canais);
      if (f.jornadas?.length) actQuery = actQuery.in('jornada', f.jornadas);
      if (f.segmentos?.length) actQuery = actQuery.in('"Segmento"', f.segmentos);
      if (f.parceiros?.length) actQuery = actQuery.in('"Parceiro"', f.parceiros);
      if (f.subgrupos?.length) actQuery = actQuery.in('"Subgrupos"', f.subgrupos);

      // Janela anterior de mesma duração (padrão previousFilters do App.tsx)
      const spanDays = Math.max(differenceInCalendarDays(endDate, startDate), 0);
      const prevEnd = subDays(startDate, 1);
      const prevStart = subDays(prevEnd, spanDays);
      let prevQuery = supabase
        .from('activities')
        .select('"Base Total", Abertura, Cliques, "Cartões Gerados"')
        .not('template_id', 'is', null)
        .gte('"Data de Disparo"', format(prevStart, 'yyyy-MM-dd'))
        .lte('"Data de Disparo"', `${format(prevEnd, 'yyyy-MM-dd')} 23:59:59`);
      if (selectedBUs.length) prevQuery = prevQuery.in('BU', selectedBUs);
      if (f.canais?.length) prevQuery = prevQuery.in('"Canal"', f.canais);
      if (f.jornadas?.length) prevQuery = prevQuery.in('jornada', f.jornadas);
      if (f.segmentos?.length) prevQuery = prevQuery.in('"Segmento"', f.segmentos);
      if (f.parceiros?.length) prevQuery = prevQuery.in('"Parceiro"', f.parceiros);
      if (f.subgrupos?.length) prevQuery = prevQuery.in('"Subgrupos"', f.subgrupos);

      const [{ data: acts, error: aErr }, { data: tmpls, error: tErr }, { data: prevActs }] = await Promise.all([
        actQuery,
        supabase.from('communication_templates').select('*'),
        prevQuery,
      ]);
      if (aErr) throw aErr;
      if (tErr) throw tErr;

      const prev: PerformancePrevTotals = { executions: 0, baseEnviada: 0, aberturas: 0, cliques: 0, cartoes: 0 };
      for (const r of (prevActs ?? []) as ActivityMetricRow[]) {
        prev.executions += 1;
        prev.baseEnviada += num(r['Base Total']);
        prev.aberturas += num(r.Abertura);
        prev.cliques += num(r.Cliques);
        prev.cartoes += num(r['Cartões Gerados'] ?? r['CartÃµes Gerados']);
      }
      setPreviousTotals(prev.executions > 0 ? prev : null);

      const templateById = new Map<string, CommunicationTemplate>();
      for (const t of (tmpls ?? []) as CommunicationTemplate[]) templateById.set(t.template_id, t);

      const acc = new Map<string, Accumulator>();
      for (const r of (acts ?? []) as ActivityMetricRow[]) {
        const id = r.template_id;
        if (!id) continue;
        const template = templateById.get(id);
        if (!template) continue;

        let p = acc.get(id);
        if (!p) {
          p = createAccumulator(template);
          acc.set(id, p);
        }

        const base = num(r['Base Total']);
        const entregas = deliveredVolume(base, r['Taxa de Entrega']);
        const aberturas = num(r.Abertura);
        const cliques = num(r.Cliques);
        const cartoes = num(r['Cartões Gerados'] ?? r['CartÃµes Gerados']);
        const propostas = num(r.Propostas);
        const custoTotal = num(r['Custo Total Campanha']);
        const custoEstimadoDia = base * channelUnitCost(template.channel);

        p.executions += 1;
        p.baseEnviada += base;
        p.entregas += entregas;
        p.temEntrega ||= r['Taxa de Entrega'] != null;
        p.aberturas += aberturas;
        p.cliques += cliques;
        p.cartoes += cartoes;
        p.propostas += propostas;
        p.custoTotal += custoTotal;
        const name = r['Activity name / Taxonomia'];
        if (name) p._names.add(name);

        const dateKey = r['Data de Disparo'] ? String(r['Data de Disparo']).slice(0, 10) : 'sem-data';
        const day = p._timeline.get(dateKey) ?? emptyTimelinePoint(dateKey);
        day.executions += 1;
        day.baseEnviada += base;
        day.aberturas += aberturas;
        day.cliques += cliques;
        day.cartoes += cartoes;
        day.propostas += propostas;
        day.custoTotal += custoTotal;
        day.custoEfetivo += custoTotal > 0 ? custoTotal : custoEstimadoDia;
        day.activities.push(r as unknown as ActivityRow);
        p._timeline.set(dateKey, day);
      }

      const result: TemplatePerformance[] = [];
      for (const p of acc.values()) {
        const hasResult = p.cliques > 0 || p.cartoes > 0 || p.propostas > 0;
        if (!hasResult) continue;

        p.activityNames = Array.from(p._names);
        p.ctr = p.baseEnviada > 0 ? p.cliques / p.baseEnviada : 0;
        p.taxaConversao = p.baseEnviada > 0 ? p.cartoes / p.baseEnviada : 0;
        p.cac = p.cartoes > 0 ? p.custoTotal / p.cartoes : 0;
        p.custoCanalEstimado = p.baseEnviada * channelUnitCost(p.template.channel);
        p.cacEstimado = p.cartoes > 0 ? p.custoCanalEstimado / p.cartoes : 0;
        p.custoEstimado = p.custoTotal <= 0;
        p.custoEfetivo = p.custoEstimado ? p.custoCanalEstimado : p.custoTotal;
        p.cacEfetivo = p.cartoes > 0 ? p.custoEfetivo / p.cartoes : 0;
        p.timeline = Array.from(p._timeline.values())
          .map((point) => ({
            ...point,
            ctr: point.baseEnviada > 0 ? point.cliques / point.baseEnviada : 0,
            taxaAbertura: point.baseEnviada > 0 ? point.aberturas / point.baseEnviada : 0,
            taxaConversao: point.baseEnviada > 0 ? point.cartoes / point.baseEnviada : 0,
            cacEfetivo: point.cartoes > 0 ? point.custoEfetivo / point.cartoes : 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const { _names, _timeline, ...clean } = p;
        void _names;
        void _timeline;
        result.push(clean);
      }

      result.sort((a, b) => b.cartoes - a.cartoes);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a performance por template.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { data, previousTotals, loading, error, refetch: fetchPerformance };
}
