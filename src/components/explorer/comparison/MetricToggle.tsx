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
  return <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={[
          'px-3 py-1 text-xs font-semibold rounded-md transition-all',
          value === opt.value
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50',
        ].join(' ')}
      >
        {opt.label}
      </button>
    ))}
  </div>;
};
