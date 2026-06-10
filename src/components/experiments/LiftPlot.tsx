import React from 'react';

interface Props {
  liftPct: number;     // ponto estimado, ex: 28.1
  ciLow: number;       // limite inferior %, ex: 8.4
  ciHigh: number;      // limite superior %, ex: 47.8
  significant: boolean;
}

export function LiftPlot({ liftPct, ciLow, ciHigh, significant }: Props) {
  const SCALE = 60; // eixo vai de -60% a +60%
  const pct = (v: number) => Math.max(0, Math.min(100, ((v + SCALE) / (2 * SCALE)) * 100));

  const barColor = !significant
    ? '#94a3b8' // slate-400
    : liftPct > 0 ? '#10b981' : '#ef4444';

  return (
    <div className="space-y-1">
      {/* Label */}
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">IC 95% (Intervalo de Confiança)</span>
        <span className={`font-mono font-semibold ${
          !significant ? 'text-slate-400' :
          liftPct > 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {liftPct > 0 ? '+' : ''}{liftPct.toFixed(1)}%
          {!significant && <span className="text-slate-400 font-normal ml-1">(n.s.)</span>}
        </span>
      </div>

      {/* Plot */}
      <div className="relative h-6 w-full">
        {/* Track line */}
        <div className="absolute top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200" />
        
        {/* Zero line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
          style={{ left: `${pct(0)}%` }}
        />
        
        {/* CI bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full opacity-30"
          style={{
            left: `${pct(ciLow)}%`,
            width: `${pct(ciHigh) - pct(ciLow)}%`,
            backgroundColor: barColor,
          }}
        />
        
        {/* Point estimate dot */}
        <div
          className="absolute top-1/2 h-4.5 w-4.5 rounded-full border-2 border-white shadow-md"
          style={{
            left: `${pct(liftPct)}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: barColor,
          }}
        />
        
        {/* Eixo labels */}
        <span className="absolute -bottom-4 left-0 text-[9px] font-mono text-slate-400">-{SCALE}%</span>
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">0</span>
        <span className="absolute -bottom-4 right-0 text-[9px] font-mono text-slate-400">+{SCALE}%</span>
      </div>
    </div>
  );
}
