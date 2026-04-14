import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyTowerPoint, ExplorerMetric, TemporalViewMode } from '../../../types/explorer';
import { formatMetricValue } from '../../../hooks/explorer/useComparisonData';

interface DailyTowerChartProps {
  mode: TemporalViewMode;
  metric: ExplorerMetric;
  simpleData: DailyTowerPoint[];
  stackedData: DailyTowerPoint[];
  stackedKeys: string[];
  onBarClick?: (date: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

const AnalyticalTooltip = ({
  active,
  payload,
  label,
  metric,
  canDrillDown,
}: TooltipProps<number, string> & { metric: ExplorerMetric; canDrillDown: boolean }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl min-w-[160px]">
      <p className="text-slate-400 text-[11px] font-mono mb-2">Dia {label}</p>
      {payload.length === 1 ? (
        <p className="text-slate-100 text-sm font-bold">{formatMetricValue(total, metric)}</p>
      ) : (
        <>
          {payload.map((entry) => (
            <div key={entry.dataKey as string} className="flex justify-between gap-3 text-xs mb-1">
              <span style={{ color: entry.color ?? '#94A3B8' }}>{entry.name}</span>
              <span className="font-semibold text-slate-100">{formatMetricValue(Number(entry.value), metric)}</span>
            </div>
          ))}
          <div className="mt-1.5 pt-1.5 border-t border-slate-700 flex justify-between text-xs">
            <span className="text-slate-400">Total</span>
            <span className="font-bold text-slate-100">{formatMetricValue(total, metric)}</span>
          </div>
        </>
      )}
      {canDrillDown && (
        <p className="text-slate-500 text-[10px] mt-2">Clique para ver disparos</p>
      )}
    </div>
  );
};

export const DailyTowerChart: React.FC<DailyTowerChartProps> = ({
  mode,
  metric,
  simpleData,
  stackedData,
  stackedKeys,
  onBarClick,
}) => {
  const data = mode === 'simple' ? simpleData : stackedData;

  const mean = useMemo(() => {
    if (mode !== 'simple' || data.length === 0) return null;
    const sum = (data as DailyTowerPoint[]).reduce((acc, d) => acc + (Number(d.total) || 0), 0);
    return sum / data.length;
  }, [data, mode]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-500">
        Sem dados diários para o período.
      </div>
    );
  }

  const chartWidth = Math.max(900, data.length * 28);

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ width: chartWidth, height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 80, left: 0, bottom: 6 }}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
            onClick={(e: { activePayload?: { payload: DailyTowerPoint }[] } | null) => {
              if (onBarClick && e?.activePayload?.[0]) {
                onBarClick(e.activePayload[0].payload.date);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMetricValue(Number(v), metric)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={(props) => <AnalyticalTooltip {...props} metric={metric} canDrillDown={!!onBarClick} />}
            />
            {mean !== null && (
              <ReferenceLine
                y={mean}
                stroke="#94A3B8"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                label={{
                  value: `Méd: ${formatMetricValue(mean, metric)}`,
                  position: 'right',
                  fill: '#64748B',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
            {mode === 'simple' ? (
              <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} activeBar={{ fill: '#60A5FA' }} />
            ) : (
              stackedKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} stackId="daily" fill={COLORS[idx % COLORS.length]} radius={idx === stackedKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
