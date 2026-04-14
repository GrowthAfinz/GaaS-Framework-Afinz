import React from 'react';
import { CANAIS } from '../../../../constants/frameworkFields';
import type { Canal } from '../../../../constants/frameworkFields';
import type { WizardState, DispatchRow } from '../types';

interface Step4DispatchesProps {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export const Step4Dispatches: React.FC<Step4DispatchesProps> = ({ state, onChange }) => {
  const updateDispatch = (index: number, patch: Partial<DispatchRow>) => {
    const updated = state.dispatches.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange({ dispatches: updated });
  };

  const isRowComplete = (d: DispatchRow) =>
    d.activityName.trim() !== '' && d.canal !== '' && d.dataInicio !== '' && d.dataFim !== '';

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 flex-1">
      {/* Cabeçalho da tabela */}
      <div className="grid gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200 flex-shrink-0"
        style={{ gridTemplateColumns: '36px 1fr 80px 100px 118px 118px' }}>
        <span>#</span>
        <span>Activity Name / Taxonomia</span>
        <span>Canal</span>
        <span>Início</span>
        <span>Fim</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 space-y-2">
      {state.dispatches.map((d, i) => {
        const complete = isRowComplete(d);
        return (
          <div
            key={i}
            className={`
              grid gap-2 items-start p-2 rounded-lg border transition-colors
              ${complete ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-300'}
            `}
            style={{ gridTemplateColumns: '36px 1fr 80px 100px 118px 118px' }}
          >
            {/* Ordem */}
            <div className="flex items-center justify-center pt-1">
              <input
                type="number"
                min={1}
                value={d.ordem}
                onChange={(e) => updateDispatch(i, { ordem: Number(e.target.value) || d.ordem })}
                className="w-8 text-center text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            {/* Activity Name */}
            <textarea
              rows={2}
              value={d.activityName}
              onChange={(e) => updateDispatch(i, { activityName: e.target.value })}
              placeholder="Cole ou digite o nome do disparo (taxonomia Salesforce)..."
              className="w-full px-2 py-1 text-[11px] text-slate-900 bg-white border border-slate-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400/30 placeholder:text-slate-400 leading-snug"
            />

            {/* Canal */}
            <div className="relative">
              <select
                value={d.canal}
                onChange={(e) => updateDispatch(i, { canal: e.target.value as Canal })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-900 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
              >
                {CANAIS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m1 1 4 4 4-4" />
                </svg>
              </div>
            </div>

            {/* Data Início */}
            <input
              type="date"
              value={d.dataInicio}
              onChange={(e) => {
                const dataInicio = e.target.value;
                // Auto-fill dataFim = dataInicio + 2 dias
                let dataFim = d.dataFim;
                if (dataInicio) {
                  const end = new Date(dataInicio + 'T00:00:00');
                  end.setDate(end.getDate() + 2);
                  dataFim = end.toISOString().split('T')[0];
                }
                updateDispatch(i, { dataInicio, dataFim });
              }}
              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />

            {/* Data Fim */}
            <input
              type="date"
              value={d.dataFim}
              onChange={(e) => updateDispatch(i, { dataFim: e.target.value })}
              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>
        );
      })}
      </div>

      {state.dispatches.some((d) => !isRowComplete(d)) && (
        <p className="text-[10px] text-amber-600 flex items-center gap-1 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Preencha Activity Name, Canal e Datas para habilitar o botão Copiar
        </p>
      )}
    </div>
  );
};
