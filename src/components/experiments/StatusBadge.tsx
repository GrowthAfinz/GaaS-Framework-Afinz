import React from 'react';

type Props = {
  status: 'backlog' | 'rodando' | 'concluido';
  decisao?: 'validado' | 'refutado' | 'inconclusivo';
};

export function StatusBadge({ status, decisao }: Props) {
  if (status === 'rodando') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        {/* Pulsing dot (Statsig pattern) */}
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
        </span>
        Rodando
      </span>
    );
  }

  if (status === 'concluido') {
    const config = {
      validado:     { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: '✓ Validado' },
      refutado:     { cls: 'bg-red-50 text-red-700 border border-red-100',             label: '✗ Refutado' },
      inconclusivo: { cls: 'bg-amber-50 text-amber-700 border border-amber-100',         label: '⚠ Inconclusivo' },
    };
    const d = decisao ? config[decisao] : { cls: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'Concluído' };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${d.cls}`}>
        {d.label}
      </span>
    );
  }

  // Backlog
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Backlog
    </span>
  );
}
