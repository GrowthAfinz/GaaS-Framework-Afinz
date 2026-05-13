import React from 'react';
import { NodeMetrics } from '../../../types/explorer';

interface MetricItemProps {
  label: string;
  value: string;
  sub?: string;
  currRaw?: number;
  prevRaw?: number;
  invertColor?: boolean; // For metrics where lower is better (CAC, Custo)
}

const formatDiff = (curr?: number, prev?: number, invertColor?: boolean) => {
  if (curr === undefined || prev === undefined) return null;
  if (!prev) return curr > 0 ? { text: '+100%', isGood: !invertColor } : null;
  const diff = ((curr - prev) / prev) * 100;
  if (diff === 0) return { text: '0%', isGood: true }; // Neutral
  const sign = diff > 0 ? '+' : '';

  const isIncrease = diff > 0;
  const isGood = invertColor ? !isIncrease : isIncrease;

  return {
    text: `${sign}${diff.toFixed(1)}%`,
    isGood
  };
};

const MetricItem: React.FC<MetricItemProps> = ({ label, value, sub, currRaw, prevRaw, invertColor }) => {
  const diffData = formatDiff(currRaw, prevRaw, invertColor);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-0.5 shadow-sm relative">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold font-mono text-slate-700 tabular-nums">{value}</span>
        {diffData && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diffData.isGood ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
            {diffData.text}
          </span>
        )}
      </div>
      {sub && <span className="text-[10px] text-slate-400 uppercase tracking-widest">{sub}</span>}
    </div>
  );
};

function fmtNum(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtCurrency(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return `R$ ${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  if (n === 0) return '—';
  return `${n.toFixed(1)}%`;
}

interface PerformanceCardProps {
  metrics: NodeMetrics;
  count: number;
  prevMetrics?: NodeMetrics;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ metrics, count, prevMetrics }) => (
  <div className="flex flex-col gap-2">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Performance</p>
    <div className="grid grid-cols-2 gap-2">
      <MetricItem label="Disparos" value={String(count)} currRaw={count} prevRaw={prevMetrics?.baseTotal} />
      <MetricItem label="Cartões" value={fmtNum(metrics.cartoes)} currRaw={metrics.cartoes} prevRaw={prevMetrics?.cartoes} />
      <MetricItem label="CAC médio" value={fmtCurrency(metrics.cac)} currRaw={metrics.cac} prevRaw={prevMetrics?.cac} invertColor />
      <MetricItem label="Custo Total" value={fmtCurrency(metrics.custoTotal)} currRaw={metrics.custoTotal} prevRaw={prevMetrics?.custoTotal} invertColor />
      <MetricItem label="Propostas" value={fmtNum(metrics.propostas)} currRaw={metrics.propostas} prevRaw={prevMetrics?.propostas} />
      <MetricItem label="Tx Conversão" value={fmtPct(metrics.taxaConversao)} currRaw={metrics.taxaConversao} prevRaw={prevMetrics?.taxaConversao} />
    </div>
  </div>
);
