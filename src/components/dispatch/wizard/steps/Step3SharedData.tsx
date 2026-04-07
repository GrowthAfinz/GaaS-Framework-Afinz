import React, { useMemo } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { Label, Combobox, Select, Input, MetricCard } from '../../blocks/shared';
import {
  ETAPAS_AQUISICAO,
  OFERTA_DETALHE_MAP,
  SEGMENTO_CONTEXT_MAP,
  CUSTO_UNITARIO_CANAL,
} from '../../../../constants/frameworkFields';
import { useAppStore } from '../../../../store/useAppStore';
import { getAIOrchestrator } from '../../../../services/ml/AIOrchestrator';
import type { WizardState } from '../types';

interface Step3SharedDataProps {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export const Step3SharedData: React.FC<Step3SharedDataProps> = ({ state, onChange }) => {
  const activities = useAppStore((s) => s.activities) as any[];

  // Filtro por BU + segmento para opções históricas
  const filtered = useMemo(() => {
    return activities.filter((a: any) => {
      const raw = a.raw || a;
      if (state.bu && raw.BU !== state.bu) return false;
      if (state.segmento && raw.Segmento !== state.segmento) return false;
      return true;
    });
  }, [activities, state.bu, state.segmento]);

  const makeOptions = (getter: (raw: any) => string | undefined) => {
    const counts = new Map<string, number>();
    filtered.forEach((a: any) => {
      const val = getter(a.raw || a);
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  };

  const parceirosOpts = useMemo(() => {
    const smart = SEGMENTO_CONTEXT_MAP[state.segmento]?.parceiros ?? [];
    const hist = makeOptions((r) => r.Parceiro);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    return [...smartObjs, ...rest].filter((o) => o.count > 0 || (o as any).isSmart);
  }, [filtered, state.segmento]);

  const subgruposOpts = useMemo(() => {
    const smart = SEGMENTO_CONTEXT_MAP[state.segmento]?.subgrupos ?? [];
    const hist = makeOptions((r) => r.Subgrupos || r.subgrupo);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    return [...smartObjs, ...rest].filter((o) => o.count > 0 || (o as any).isSmart);
  }, [filtered, state.segmento]);

  const perfisOpts = useMemo(() => makeOptions((r) => r['Perfil de Crédito'] || r.perfilCredito), [filtered]);
  const ofertasOpts = useMemo(() => makeOptions((r) => r.Oferta), [filtered]);
  const ofertasAll = useMemo(() => makeOptions((r) => r.Oferta), [filtered]);
  const promoOpts = useMemo(() => {
    const smart = OFERTA_DETALHE_MAP[state.oferta] ?? [];
    const hist = makeOptions((r) => r.Promocional);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    return [...smartObjs, ...rest];
  }, [filtered, state.oferta]);

  const promo2Opts = useMemo(() => {
    const smart = OFERTA_DETALHE_MAP[state.oferta2] ?? [];
    const hist = makeOptions((r) => r['Promocional 2'] || r.promocional2);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    return [...smartObjs, ...rest];
  }, [filtered, state.oferta2]);

  // --- IA Preview ---
  const projections = useMemo(() => {
    if (!state.bu || !state.segmento) return null;
    try {
      const activityRows = activities
        .filter((a: any) => a.raw != null)
        .map((a: any) => ({
          ...a.raw,
          'Data de Disparo': a.raw['Data de Disparo'] || '',
          BU: a.raw.BU || a.bu,
          Segmento: a.raw.Segmento || a.segmento,
        } as any));
      if (activityRows.length === 0) return null;

      const orchestrator = getAIOrchestrator({
        temporalWindow: 90,
        similarityWeights: {
          BU: 0.15, Segmento: 0.15, Canal: 0.12, Jornada: 0.10,
          Perfil_Credito: 0.10, Oferta: 0.08, Promocional: 0.05,
          Parceiro: 0.05, Subgrupo: 0.05, Etapa_Aquisicao: 0.05,
          Produto: 0.05, Temporal: 0.05,
        },
        minSampleSize: 3,
      });
      orchestrator.initialize(activityRows);

      const result = orchestrator.projectAllFields({
        bu: state.bu,
        segmento: state.segmento,
        oferta: state.oferta || undefined,
        parceiro: state.parceiro || undefined,
        perfilCredito: state.perfilCredito || undefined,
        produto: state.produto || undefined,
      });
      return result.projections || null;
    } catch {
      return null;
    }
  }, [activities, state.bu, state.segmento, state.oferta, state.perfilCredito]);

  const taxaConv = (projections?.['taxaConversao'] as any)?.projectedValue;
  const cacValue = (projections?.['cac'] as any)?.projectedValue;
  const cartoesValue = (projections?.['cartoesGerados'] as any)?.projectedValue;
  const taxaEntrega = (projections?.['taxaEntrega'] as any)?.projectedValue;
  const propostas = (projections?.['propostas'] as any)?.projectedValue;
  const sampleSize = (projections?.['taxaConversao'] as any)?.explanation?.sampleSize ?? 0;

  const isIAReady = !!(state.bu && state.segmento);

  return (
    <div className="flex gap-4 h-full">
      {/* Coluna esquerda: formulário */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 min-w-0">
        {/* Ordem inicial */}
        <div>
          <Label label="Posição na Jornada" />
          <div className="flex items-center gap-2 mt-0.5">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={state.ordemInicial === 1}
                onChange={(e) => onChange({ ordemInicial: e.target.checked ? 1 : 2 })}
                className="w-3 h-3 rounded accent-cyan-600"
              />
              Primeiro do mês para este segmento
            </label>
            {state.ordemInicial !== 1 && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">Continuando da ordem:</span>
                <input
                  type="number"
                  min={1}
                  value={state.ordemInicial}
                  onChange={(e) => onChange({ ordemInicial: Number(e.target.value) || 1 })}
                  className="w-12 px-1.5 py-1 border border-slate-300 rounded text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            )}
          </div>
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label label="Parceiro" />
            <Combobox value={state.parceiro} onChange={(v) => onChange({ parceiro: v })} options={parceirosOpts} placeholder="Opcional..." />
          </div>
          <div>
            <Label label="Subgrupo" />
            <Combobox value={state.subgrupo} onChange={(v) => onChange({ subgrupo: v })} options={subgruposOpts} placeholder="Opcional..." />
          </div>

          <div>
            <Label label="Etapa de Aquisição" />
            <Select value={state.etapaAquisicao} onChange={(e) => onChange({ etapaAquisicao: e.target.value })}>
              <option value="">Selecione...</option>
              {ETAPAS_AQUISICAO.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div>
            <Label label="Perfil de Crédito" />
            <Combobox value={state.perfilCredito} onChange={(v) => onChange({ perfilCredito: v })} options={perfisOpts} placeholder="Opcional..." />
          </div>

          <div>
            <Label label="Oferta" />
            <Combobox value={state.oferta} onChange={(v) => onChange({ oferta: v, promocional: '' })} options={ofertasOpts} placeholder="Opcional..." />
          </div>
          <div>
            <Label label="Promocional" />
            <Combobox value={state.promocional} onChange={(v) => onChange({ promocional: v })} options={promoOpts} placeholder="Opcional..." />
          </div>

          <div>
            <Label label="Oferta 2" />
            <Combobox value={state.oferta2} onChange={(v) => onChange({ oferta2: v, promo2: '' })} options={ofertasAll} placeholder="Opcional..." />
          </div>
          <div>
            <Label label="Promo 2" />
            <Combobox value={state.promo2} onChange={(v) => onChange({ promo2: v })} options={promo2Opts} placeholder="Opcional..." />
          </div>

          <div>
            <Label label="Base Total" />
            <Input
              type="number"
              min={0}
              value={state.baseTotal || ''}
              onChange={(e) => onChange({ baseTotal: Number(e.target.value) || 0 })}
              placeholder="Ex: 100000"
            />
          </div>
          <div>
            <Label label="Base Acionável" />
            <Input
              type="number"
              min={0}
              value={state.baseAcionavel || ''}
              onChange={(e) => onChange({ baseAcionavel: Number(e.target.value) || 0 })}
              placeholder="Ex: 78000"
            />
          </div>
        </div>

      </div>

      {/* Coluna direita: painel IA */}
      <div className="w-52 shrink-0 flex flex-col">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex flex-col gap-2 h-full">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-indigo-200">
            <TrendingUp size={12} className="text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Previsão IA</span>
            <Sparkles size={9} className="text-indigo-400/60 ml-auto" />
          </div>

          {!isIAReady ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] text-indigo-400 text-center leading-snug">
                Preencha Campanha para ativar previsões
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                <MetricCard label="Tx Conv" value={taxaConv} suffix="%" compact />
                <MetricCard label="CAC" value={cacValue} prefix="R$" compact />
                <MetricCard label="Cartões" value={cartoesValue} isInt compact />
                <MetricCard label="Tx Entrega" value={taxaEntrega} suffix="%" compact />
                <MetricCard label="Propostas" value={propostas} isInt compact />
              </div>
              <div className="text-[9px] text-indigo-500 text-center border-t border-indigo-200 pt-1.5">
                {sampleSize > 0 ? (
                  <>Baseado em <span className="font-bold">{sampleSize}</span> disparos similares</>
                ) : (
                  'Calculando...'
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
