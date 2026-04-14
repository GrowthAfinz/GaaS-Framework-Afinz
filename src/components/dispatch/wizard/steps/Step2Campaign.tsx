import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Label, Combobox } from '../../blocks/shared';
import { BU_SEGMENTO_MAP, generateSafra } from '../../../../constants/frameworkFields';
import { useAppStore } from '../../../../store/useAppStore';
import type { WizardState, WizardBU } from '../types';

interface Step2CampaignProps {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}


export const Step2Campaign: React.FC<Step2CampaignProps> = ({ state, onChange }) => {
  const activities = useAppStore((s) => s.activities) as any[];

  // Opções históricas de segmentos filtradas por BU
  const segmentoOptions = useMemo(() => {
    const smartList = BU_SEGMENTO_MAP[state.bu] ?? [];
    const smartSet = new Set(smartList);

    const counts = new Map<string, number>();
    activities.forEach((a: any) => {
      const raw = a.raw || a;
      if (state.bu && raw.BU !== state.bu) return;
      const s = raw.Segmento;
      if (s) counts.set(s, (counts.get(s) || 0) + 1);
    });

    const opts = Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, isSmart: smartSet.has(value) }))
      .sort((a, b) => b.count - a.count);

    // Adicionar smart options sem histórico
    smartList.forEach((val) => {
      if (!counts.has(val)) opts.push({ value: val, count: 0, isSmart: true });
    });

    return opts;
  }, [activities, state.bu]);

  // Opções históricas de jornadas filtradas por BU + segmento
  const jornadaOptions = useMemo(() => {
    const counts = new Map<string, number>();
    activities.forEach((a: any) => {
      const raw = a.raw || a;
      if (state.bu && raw.BU !== state.bu) return;
      if (state.segmento && raw.Segmento !== state.segmento) return;
      const j = raw.Jornada || raw.jornada;
      if (j) counts.set(j, (counts.get(j) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [activities, state.bu, state.segmento]);

  const handleSuggestJornada = () => {
    const buPart = state.bu?.toUpperCase() || 'BU';
    const segPart = state.segmento?.replace(/\s/g, '_').toUpperCase().substring(0, 12) || 'SEG';
    const today = new Date().toISOString().split('T')[0];
    const safra = generateSafra(today).replace('/', '').toUpperCase();
    onChange({ jornada: `JOR_${buPart}_${segPart}_${safra}` });
  };

  const buLabel = state.bu || '?';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            state.bu === 'B2C' ? 'bg-blue-500'
            : state.bu === 'B2B2C' ? 'bg-emerald-500'
            : state.bu === 'Plurix' ? 'bg-purple-500'
            : 'bg-orange-500'
          }`}
        />
        <span className="text-xs font-bold text-slate-600 uppercase">{buLabel}</span>
      </div>

      {/* Campanha / Segmento */}
      <div>
        <Label label="Campanha / Segmento" required />
        <Combobox
          value={state.segmento}
          onChange={(v) => onChange({ segmento: v })}
          options={segmentoOptions}
          placeholder="Selecione ou digite..."
        />
      </div>

      {/* Jornada */}
      <div>
        <Label label="Nome da Jornada" required />
        <div className="flex gap-1">
          <Combobox
            value={state.jornada}
            onChange={(v) => onChange({ jornada: v })}
            options={jornadaOptions}
            placeholder="Ex: JOR_B2C_CRM_ABR26"
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleSuggestJornada}
            className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-indigo-600 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap transition-colors"
            title="Sugerir nome baseado em BU + Segmento + Safra"
          >
            <Sparkles size={11} />
            Sugerir
          </button>
        </div>
      </div>

      {/* Nº de Disparos */}
      <div>
        <Label label="Nº de Disparos na Jornada" required />
        <input
          type="number"
          min={1}
          max={500}
          value={state.nDisparos}
          onChange={(e) => {
            const val = Math.max(1, Math.min(500, Number(e.target.value) || 1));
            onChange({ nDisparos: val as any });
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400"
          placeholder="Ex: 10, 50, 80..."
        />
        <p className="text-[10px] text-slate-500 mt-1">Digite o número de disparos (máximo: 500)</p>
      </div>
    </div>
  );
};
