import React, { useMemo } from 'react';
import { Label, Combobox, Select, Input } from '../../blocks/shared';
import {
  ETAPAS_AQUISICAO,
  OFERTA_DETALHE_MAP,
  SEGMENTO_CONTEXT_MAP,
} from '../../../../constants/frameworkFields';
import { useAppStore } from '../../../../store/useAppStore';
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


  const perfisOpts = useMemo(() => {
    const opts = makeOptions((r) => r['Perfil de Crédito'] || r.perfilCredito);
    return opts.length > 0 ? opts : [{ value: 'N/A', count: 0 }];
  }, [filtered]);

  const subgruposHist = useMemo(() => makeOptions((r) => r.Subgrupos || r.subgrupo), [filtered]);
  const subgruposOpts = useMemo(() => {
    const smart = SEGMENTO_CONTEXT_MAP[state.segmento]?.subgrupos ?? [];
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: subgruposHist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = subgruposHist.filter((h) => !smartSet.has(h.value));
    const combined = [...smartObjs, ...rest].filter((o) => o.count > 0 || (o as any).isSmart);
    return combined.length > 0 ? combined : [{ value: 'N/A', count: 0 }];
  }, [filtered, state.segmento, subgruposHist]);

  const ofertasOpts = useMemo(() => {
    const opts = makeOptions((r) => r.Oferta);
    return opts.length > 0 ? opts : [{ value: 'N/A', count: 0 }];
  }, [filtered]);

  const ofertasAll = useMemo(() => {
    const opts = makeOptions((r) => r.Oferta);
    return opts.length > 0 ? opts : [{ value: 'N/A', count: 0 }];
  }, [filtered]);
  const promoOpts = useMemo(() => {
    const smart = OFERTA_DETALHE_MAP[state.oferta] ?? [];
    const hist = makeOptions((r) => r.Promocional);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    const combined = [...smartObjs, ...rest];
    return combined.length > 0 ? combined : [{ value: 'N/A', count: 0 }];
  }, [filtered, state.oferta]);

  const promo2Opts = useMemo(() => {
    const smart = OFERTA_DETALHE_MAP[state.oferta2] ?? [];
    const hist = makeOptions((r) => r['Promocional 2'] || r.promocional2);
    const smartSet = new Set(smart);
    const smartObjs = smart.map((v) => ({ value: v, count: hist.find((h) => h.value === v)?.count ?? 0, isSmart: true }));
    const rest = hist.filter((h) => !smartSet.has(h.value));
    const combined = [...smartObjs, ...rest];
    return combined.length > 0 ? combined : [{ value: 'N/A', count: 0 }];
  }, [filtered, state.oferta2]);


  return (
    <div className="flex gap-4 h-full">
      {/* Formulário */}
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

    </div>
  );
};
