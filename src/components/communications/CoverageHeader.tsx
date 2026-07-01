import React from 'react';
import type { CoverageStats } from '../../hooks/useReconciliation';

const int = (n: number) => Math.round(n).toLocaleString('pt-BR');

/** Header de saúde de cobertura de réguas CRM (anel % + stats + por canal). */
export const CoverageHeader: React.FC<{ c: CoverageStats }> = ({ c }) => {
  const R = 37;
  const circ = 2 * Math.PI * R;
  return (
    <div className="flex flex-wrap items-center gap-7 rounded-2xl bg-gradient-to-br from-[#063b3d] via-[#0a5f63] to-[#00838a] px-6 py-5 text-white">
      <div className="flex flex-shrink-0 items-center gap-5">
        <div className="relative grid h-[86px] w-[86px] place-items-center">
          <svg width="86" height="86" viewBox="0 0 86 86" className="absolute inset-0">
            <circle cx="43" cy="43" r={R} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="8" />
            <circle cx="43" cy="43" r={R} fill="none" stroke="#5eead4" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - c.pctCobertura / 100)} transform="rotate(-90 43 43)" />
          </svg>
          <div className="text-[26px] font-bold">{c.pctCobertura}<small className="text-[13px] opacity-70">%</small></div>
        </div>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">Cobertura de réguas CRM</div>
          <div className="my-1.5 text-[21px] font-bold leading-tight">
            {int(c.comPeca)} de {int(c.disparosUnicos)} disparos<br />já com a peça vinculada
          </div>
          <div className="max-w-[400px] text-xs leading-snug text-white/80">
            {int(c.disparosUnicos)} disparos únicos no período · <b className="text-white">{int(c.precisamPeca)} precisam de peça</b> · {c.fortes} com match forte prontos para vincular
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-stretch gap-3.5">
        <Stat v={c.orfaos} l="Disparos órfãos" s="réguas ativas sem template" tone="warn" />
        <Stat v={c.semAsset} l="Templates sem peça" s="IDs de template sem a peça" tone="info" />
        <Stat v={c.ativos} l="Templates no ar" s={`de ${c.totalTemplates} cadastrados`} />
        <div className="flex flex-col justify-center gap-1.5 pl-1.5">
          {c.byChannel.map((x) => (
            <div key={x.ch} className="flex items-center gap-2 text-[11.5px]" title={`${x.label}: ${x.total} disparos · ${x.orf} órfãos`}>
              <span className="h-2 w-2 rounded-full" style={{ background: x.color, opacity: x.total === 0 ? 0.35 : 1 }} />
              <span className="min-w-[64px] text-white/85">{x.label}</span>
              <span className={`font-semibold ${x.total === 0 ? 'italic text-white/40' : 'text-white/60'}`}>{x.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ v: number; l: string; s: string; tone?: 'warn' | 'info' }> = ({ v, l, s, tone }) => {
  const bg = tone === 'warn' ? 'bg-amber-400/20 border-amber-300/30'
    : tone === 'info' ? 'bg-sky-400/16 border-sky-300/30'
    : 'bg-white/10 border-white/15';
  return (
    <div className={`flex min-w-[118px] flex-col rounded-xl border px-4 py-3 ${bg}`}>
      <div className="text-[25px] font-bold leading-none tabular-nums">{v}</div>
      <div className="mt-1.5 text-[11px] font-bold text-white/90">{l}</div>
      <div className="mt-0.5 max-w-[130px] text-[10px] leading-tight text-white/60">{s}</div>
    </div>
  );
};
