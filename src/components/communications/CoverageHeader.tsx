import React from 'react';
import type { CoverageStats } from '../../hooks/useReconciliation';

const int = (n: number) => Math.round(n).toLocaleString('pt-BR');

interface Props {
  c: CoverageStats;
  /** Clique em "Disparos órfãos" → abre a Fila de reconciliação. */
  onOrfaosClick?: () => void;
  /** Clique em "Templates sem peça" → abre a sub-aba Templates sem peça. */
  onSemPecaClick?: () => void;
  /** Clique numa linha de canal com órfãos → abre a Fila filtrada naquele canal. */
  onChannelClick?: (channelLabel: string) => void;
}

/** Header de saúde de cobertura de réguas CRM (anel % + stats acionáveis + por canal). */
export const CoverageHeader: React.FC<Props> = ({ c, onOrfaosClick, onSemPecaClick, onChannelClick }) => {
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
            {int(c.disparosUnicos)} disparos únicos no período ·{' '}
            <button
              onClick={onSemPecaClick}
              className="font-bold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
              title="Ver os templates que ainda precisam da peça"
            >
              {int(c.precisamPeca)} precisam de peça
            </button>
            {' '}· {c.fortes} com match forte prontos para vincular
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-stretch gap-3.5">
        <Stat v={c.orfaos} l="Disparos órfãos" s="réguas ativas sem template" tone="warn" onClick={onOrfaosClick} hint="Abrir a fila de reconciliação" />
        <Stat v={c.semAsset} l="Templates sem peça" s="IDs de template sem a peça" tone="info" onClick={onSemPecaClick} hint="Abrir templates sem peça" />
        <Stat v={c.ativos} l="Templates no ar" s={`de ${c.totalTemplates} cadastrados`} />
        <div className="flex flex-col justify-center gap-1.5 pl-1.5">
          {c.byChannel.map((x) => {
            const clickable = x.orf > 0 && !!onChannelClick;
            return (
              <button
                key={x.ch}
                onClick={clickable ? () => onChannelClick?.(x.label) : undefined}
                disabled={!clickable}
                className={`flex items-center gap-2 text-left text-[11.5px] ${clickable ? 'cursor-pointer rounded-md px-1 -mx-1 hover:bg-white/10' : 'cursor-default'}`}
                title={clickable ? `Ver os ${x.orf} órfãos de ${x.label} na fila` : `${x.label}: ${x.total} disparos · ${x.orf} órfãos`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: x.color, opacity: x.total === 0 ? 0.35 : 1 }} />
                <span className="min-w-[64px] text-white/85">{x.label}</span>
                <span className={`font-semibold ${x.total === 0 ? 'italic text-white/40' : clickable ? 'text-white underline decoration-white/40 underline-offset-2' : 'text-white/60'}`}>{x.status}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ v: number; l: string; s: string; tone?: 'warn' | 'info'; onClick?: () => void; hint?: string }> = ({ v, l, s, tone, onClick, hint }) => {
  const bg = tone === 'warn' ? 'bg-amber-400/20 border-amber-300/30'
    : tone === 'info' ? 'bg-sky-400/16 border-sky-300/30'
    : 'bg-white/10 border-white/15';
  const interactive = onClick ? 'cursor-pointer transition-transform hover:scale-[1.03] hover:brightness-110' : 'cursor-default';
  return (
    <button onClick={onClick} disabled={!onClick} title={hint}
      className={`flex min-w-[118px] flex-col rounded-xl border px-4 py-3 text-left ${bg} ${interactive}`}>
      <div className="text-[25px] font-bold leading-none tabular-nums">{v}</div>
      <div className="mt-1.5 text-[11px] font-bold text-white/90">{l}</div>
      <div className="mt-0.5 max-w-[130px] text-[10px] leading-tight text-white/60">{s}</div>
    </button>
  );
};
