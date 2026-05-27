import React from 'react';

export interface SegmentDisplay {
  main: string;
  suffix?: string;
}

export const SEGMENT_DISPLAY: Record<string, SegmentDisplay> = {
  'Abandonados': { main: 'Abandonados' },
  'Negados': { main: 'Negados', suffix: 'Repescagem' },
  'Base_Proprietaria': { main: 'Base Proprietária', suffix: 'Topo de Funil' },
  'Leads_Parceiros': { main: 'Leads Parceiros' },
  'Aprovados_nao_convertidos': { main: 'Aprovados não convertidos', suffix: 'Upgrade' },
};

function resolveDisplay(value: string): SegmentDisplay {
  const cfg = SEGMENT_DISPLAY[value];
  if (cfg) return cfg;
  return { main: value.replace(/_/g, ' ') };
}

interface SegmentLabelProps {
  value: string;
  inverse?: boolean;
  className?: string;
}

export const SegmentLabel: React.FC<SegmentLabelProps> = ({ value, inverse = false, className = '' }) => {
  const cfg = resolveDisplay(value);
  const suffixColor = inverse ? 'text-white/60' : 'text-slate-400';
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span>{cfg.main}</span>
      {cfg.suffix && (
        <span className={`text-[9px] font-semibold uppercase tracking-wide ${suffixColor}`}>
          ({cfg.suffix})
        </span>
      )}
    </span>
  );
};

export function formatSegmentText(value: string): string {
  const cfg = resolveDisplay(value);
  return cfg.suffix ? `${cfg.main} (${cfg.suffix})` : cfg.main;
}
