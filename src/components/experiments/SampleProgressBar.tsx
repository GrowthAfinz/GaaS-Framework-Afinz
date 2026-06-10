import React from 'react';

interface Props {
  nAtual: number;
  nNecessario: number;
  compact?: boolean;
}

export function SampleProgressBar({ nAtual, nNecessario, compact = false }: Props) {
  const progress = Math.min(1.0, nAtual / Math.max(nNecessario, 1));
  const pct = Math.round(progress * 100);
  const reached = progress >= 1.0;

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1.5'}>
      {!compact && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Amostra</span>
          <span className={`font-mono text-[11px] font-medium ${reached ? 'text-emerald-600' : 'text-slate-700'}`}>
            {nAtual.toLocaleString('pt-BR')} / {nNecessario.toLocaleString('pt-BR')}
            {reached && ' ✓'}
          </span>
        </div>
      )}
      <div className="relative h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] text-slate-500 leading-none">
          {reached
            ? 'Amostra suficiente — pode declarar resultado'
            : `Faltam ~${Math.max(0, nNecessario - nAtual).toLocaleString('pt-BR')} registros`
          }
        </p>
      )}
    </div>
  );
}
