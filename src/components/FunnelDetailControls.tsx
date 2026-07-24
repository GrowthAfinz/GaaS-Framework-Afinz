import React from 'react';

export type FunnelGranularity = 'daily' | 'weekly' | 'monthly';

export const granularityLabel = (value: FunnelGranularity) =>
  value === 'daily' ? 'Diário' : value === 'weekly' ? 'Semanal' : 'Mensal';

export const GranularityToggle: React.FC<{
  value: FunnelGranularity;
  onChange: (value: FunnelGranularity) => void;
}> = ({ value, onChange }) => (
  <div className="inline-flex border border-slate-300 bg-white text-[11px] font-semibold">
    {(['daily', 'weekly', 'monthly'] as FunnelGranularity[]).map(item => (
      <button
        key={item}
        type="button"
        onClick={() => onChange(item)}
        aria-pressed={value === item}
        className={`border-r border-slate-300 px-3 py-2 last:border-r-0 ${
          value === item ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        {granularityLabel(item)}
      </button>
    ))}
  </div>
);

export const StageMetricCell: React.FC<{
  value: string;
  rate: string | null;
  note?: string;
  tone?: 'teal' | 'amber' | 'slate';
}> = ({ value, rate, note = 'avanço', tone = 'teal' }) => {
  const toneClass = tone === 'amber'
    ? 'bg-amber-50 text-amber-800 ring-amber-200'
    : tone === 'slate'
      ? 'bg-slate-100 text-slate-500 ring-slate-200'
      : 'bg-teal-50 text-teal-700 ring-teal-200';

  return (
    <div className="min-w-[88px] text-right">
      <div className="font-mono text-[11px] font-semibold text-slate-900">{value}</div>
      <div className="mt-1 flex justify-end">
        <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${toneClass}`}>
          {rate ?? 'n/d'}{rate ? ` ${note}` : ''}
        </span>
      </div>
    </div>
  );
};

export const SeriesConfigurator: React.FC<{
  summary: string;
  children: React.ReactNode;
}> = ({ summary, children }) => (
  <details className="-mx-4 mt-3 border-y border-slate-200 bg-slate-50/70 text-[10px]">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100">
      <span>Configurar séries</span>
      <span className="rounded-sm bg-white px-2 py-1 text-[9px] text-slate-500 ring-1 ring-inset ring-slate-200">{summary}</span>
    </summary>
    <div className="border-t border-slate-200">{children}</div>
  </details>
);

export const FunnelStageLabel: React.FC<{
  index: number;
  label: string;
  compact?: boolean;
}> = ({ index, label, compact = false }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 ${compact ? 'h-4 w-4 text-[8px]' : 'h-5 w-5 text-[9px]'}`}
    >
      {index + 1}
    </span>
    <span>{label}</span>
  </span>
);
