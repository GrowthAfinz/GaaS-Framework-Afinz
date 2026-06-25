import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import type { CommunicationTemplate } from '../types/communication';
import { channelUnitCost } from '../utils/inferChannel';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';

/** Performance agregada de um template (soma de todas as execuções vinculadas). */
export interface TemplatePerformance {
  template: CommunicationTemplate;
  activityNames: string[];
  executions: number;
  baseEnviada: number;
  cliques: number;
  cartoes: number;
  propostas: number;
  custoTotal: number;        // soma real de "Custo Total Campanha" (0 se não preenchido)
  ctr: number;               // cliques / baseEnviada
  taxaConversao: number;     // cartoes / baseEnviada
  cac: number;               // custoTotal / cartoes (CAC real; 0 se sem custo)
  custoCanalEstimado: number; // baseEnviada * custo unitário do canal
  cacEstimado: number;       // custoCanalEstimado / cartoes (estimativa de canal)
  // Valores "efetivos": usam o custo real quando existe, senão caem no custo de canal.
  custoEfetivo: number;      // gasto exibido (real ou estimado pelo canal)
  cacEfetivo: number;        // CAC exibido (real ou estimado pelo canal)
  custoEstimado: boolean;    // true quando custoEfetivo veio do custo de canal (sem custo real)
}

interface ActivityMetricRow {
  template_id: string | null;
  'Activity name / Taxonomia': string | null;
  'Base Total': number | null;
  Cliques: number | null;
  'Cartões Gerados': number | null;
  Propostas: number | null;
  'Custo Total Campanha': number | null;
}

const num = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

/**
 * Performance por template — JOIN 100% local no GaaS:
 * `activities` (resultado já extraído) agregado por `template_id`,
 * enriquecido com `communication_templates` (preview). NÃO chama AppsFlyer.
 * Lista só templates com ≥1 execução vinculada que tenha resultado.
 */
export function useTemplatePerformance() {
  const [data, setData] = useState<TemplatePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros globais (mesma fonte das outras abas).
  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();
  const f = useAppStore((s) => s.viewSettings.filtrosGlobais);

  const dataInicio = format(startDate, 'yyyy-MM-dd');
  const dataFim = format(endDate, 'yyyy-MM-dd');

  // Chave estável para refazer a busca quando qualquer filtro mudar.
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
        .select('template_id, "Activity name / Taxonomia", "Base Total", "Cliques", "Cartões Gerados", "Propostas", "Custo Total Campanha"')
        .not('template_id', 'is', null)
        .gte('"Data de Disparo"', dataInicio)
        .lte('"Data de Disparo"', `${dataFim} 23:59:59`);

      if (selectedBUs.length) actQuery = actQuery.in('BU', selectedBUs);
      if (f.canais?.length) actQuery = actQuery.in('"Canal"', f.canais);
      if (f.jornadas?.length) actQuery = actQuery.in('jornada', f.jornadas);
      if (f.segmentos?.length) actQuery = actQuery.in('"Segmento"', f.segmentos);
      if (f.parceiros?.length) actQuery = actQuery.in('"Parceiro"', f.parceiros);
      if (f.subgrupos?.length) actQuery = actQuery.in('"Subgrupos"', f.subgrupos);

      const [{ data: acts, error: aErr }, { data: tmpls, error: tErr }] = await Promise.all([
        actQuery,
        supabase.from('communication_templates').select('*'),
      ]);
      if (aErr) throw aErr;
      if (tErr) throw tErr;

      const templateById = new Map<string, CommunicationTemplate>();
      for (const t of (tmpls ?? []) as CommunicationTemplate[]) templateById.set(t.template_id, t);

      const acc = new Map<string, TemplatePerformance & { _names: Set<string> }>();
      for (const r of (acts ?? []) as ActivityMetricRow[]) {
        const id = r.template_id;
        if (!id) continue;
        const template = templateById.get(id);
        if (!template) continue; // vínculo órfão — ignora

        let p = acc.get(id);
        if (!p) {
          p = {
            template,
            activityNames: [],
            executions: 0,
            baseEnviada: 0,
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
          };
          acc.set(id, p);
        }
        p.executions += 1;
        p.baseEnviada += num(r['Base Total']);
        p.cliques += num(r.Cliques);
        p.cartoes += num(r['Cartões Gerados']);
        p.propostas += num(r.Propostas);
        p.custoTotal += num(r['Custo Total Campanha']);
        const name = r['Activity name / Taxonomia'];
        if (name) p._names.add(name);
      }

      const result: TemplatePerformance[] = [];
      for (const p of acc.values()) {
        // só templates com resultado registrado
        const hasResult = p.cliques > 0 || p.cartoes > 0 || p.propostas > 0;
        if (!hasResult) continue;
        p.activityNames = Array.from(p._names);
        p.ctr = p.baseEnviada > 0 ? p.cliques / p.baseEnviada : 0;
        p.taxaConversao = p.baseEnviada > 0 ? p.cartoes / p.baseEnviada : 0;
        p.cac = p.cartoes > 0 ? p.custoTotal / p.cartoes : 0;
        p.custoCanalEstimado = p.baseEnviada * channelUnitCost(p.template.channel);
        p.cacEstimado = p.cartoes > 0 ? p.custoCanalEstimado / p.cartoes : 0;
        // Efetivo: prioriza custo real; cai no custo de canal quando não há custo real.
        p.custoEstimado = p.custoTotal <= 0;
        p.custoEfetivo = p.custoEstimado ? p.custoCanalEstimado : p.custoTotal;
        p.cacEfetivo = p.cartoes > 0 ? p.custoEfetivo / p.cartoes : 0;
        const { _names, ...clean } = p;
        void _names;
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

  return { data, loading, error, refetch: fetchPerformance };
}
