import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChartDataPoint, ExplorerMetric } from '../../../types/explorer';
import { formatMetricValue } from '../../../hooks/explorer/useComparisonData';

interface SegmentBarChartProps {
  data: BarChartDataPoint[];
  metric: ExplorerMetric;
  onBarClick: (focusId: string | null) => void;
}

const formatDiff = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? '+100%' : '0%';
  const diff = ((curr - prev) / prev) * 100;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
};

const CustomTooltip = ({ active, payload, metric }: { active?: boolean; payload?: any[]; metric: ExplorerMetric }) => {
  if (!active || !payload?.length) return null;
  // payload can contain both 'value' and 'prevValue' bars
  const d: BarChartDataPoint = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg flex flex-col gap-1.5 min-w-[140px]">
      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-0.5">{d.label}</div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-500 font-medium tracking-wide">Atual</span>
        <span className="text-slate-700 font-bold">{formatMetricValue(d.value, metric)}</span>
      </div>

      {d.prevValue !== undefined && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 font-medium tracking-wide">Anterior</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">{formatMetricValue(d.prevValue, metric)}</span>
            {d.value !== d.prevValue && (
              <span className={`text-[10px] font-bold px-1 rounded ${d.value > d.prevValue ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                {formatDiff(d.value, d.prevValue)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-50 uppercase tracking-wider">
        {d.count} disparos (atual)
      </div>
    </div>
  );
};

export const SegmentBarChart: React.FC<SegmentBarChartProps> = ({ data, metric, onBarClick }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        Selecione nós na árvore para comparar
      </div>
    );
  }

  const hasPrev = data.some(d => d.prevValue !== undefined);
  const minHeight = hasPrev ? Math.max(160, data.length * 60) : Math.max(160, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={minHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        onClick={(e: any) => {
          if (e?.activePayload?.[0]) {
            onBarClick((e.activePayload[0].payload as BarChartDataPoint).nextFocusId ?? null);
          }
        }}
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatMetricValue(v, metric)}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'rgba(226,232,240,0.5)' }} />

        {hasPrev && (
          <Bar dataKey="prevValue" radius={[0, 4, 4, 0]} maxBarSize={hasPrev ? 16 : 24} fill="#CBD5E1" />
        )}

        <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer" maxBarSize={hasPrev ? 16 : 24}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
