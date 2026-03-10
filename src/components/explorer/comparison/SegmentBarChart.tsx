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
  onBarClick: (nodeId: string) => void;
}

const CustomTooltip = ({ active, payload, metric }: { active?: boolean; payload?: any[]; metric: ExplorerMetric }) => {
  if (!active || !payload?.length) return null;
  const d: BarChartDataPoint = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-800 mb-1">{d.label}</p>
      <p className="text-slate-600">
        {formatMetricValue(d.value, metric)}
      </p>
      <p className="text-slate-400">{d.count} disparos</p>
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

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        onClick={(e: any) => {
          if (e?.activePayload?.[0]) {
            onBarClick((e.activePayload[0].payload as BarChartDataPoint).id);
          }
        }}
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
        <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer" maxBarSize={24}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
