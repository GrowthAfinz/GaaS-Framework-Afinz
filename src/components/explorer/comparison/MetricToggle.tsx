import React from 'react';
import { ExplorerMetric } from '../../../types/explorer';
import { useAppStore } from '../../../store/useAppStore';

const OPTIONS: { value: ExplorerMetric; label: string }[] = [
  { value: 'cartoes', label: 'Cartões' },
  { value: 'volume', label: 'Volume' },
  { value: 'custo', label: 'Custo' },
  { value: 'cac', label: 'CAC' },
];

interface MetricToggleProps {
  value: ExplorerMetric;
  onChange: (metric: ExplorerMetric) => void;
}

export const MetricToggle: React.FC<MetricToggleProps> = ({ value, onChange }) => {
  const rentab = useAppStore((state) => state.viewSettings.frente === 'rentabilizacao');
  const options = rentab
    ? [
        { value: 'cliques' as ExplorerMetric, label: 'Cliques' },
        { value: 'taxaClique' as ExplorerMetric, label: '% Clique' },
        { value: 'aberturas' as ExplorerMetric, label: 'Aberturas' },
        { value: 'volume' as ExplorerMetric, label: 'Volume' },
        { value: 'custo' as ExplorerMetric, label: 'Custo Total' },
      ]
    : OPTIONS;

  return (
    <div className="flex items-center gap-0.5 bg-slate-105/85 border border-slate-200/50 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            'px-3 py-1.5 text-[10px] font-extrabold rounded-md transition-all duration-150',
            value === opt.value
              ? 'bg-[#00c6cc] text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
