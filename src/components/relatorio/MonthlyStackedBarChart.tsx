import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getMonthlyMetricValue,
  MONTHLY_METRIC_LABELS,
  MonthlyDimension,
  MonthlyDimensionRow,
  MonthlyMetricKey,
  NON_STACKABLE_MONTHLY_METRICS,
} from '../../utils/monthlyAggregation';

interface MonthlyStackedBarChartProps {
  title: string;
  rows: MonthlyDimensionRow[];
  dimension: MonthlyDimension;
}

const METRIC_OPTIONS: MonthlyMetricKey[] = [
  'baseEnviada',
  'baseEntregue',
  'propostas',
  'aprovados',
  'emissoes',
  'custoTotal',
  'custoPorCartao',
  'taxaConversaoBase',
];

const SERIES_COLORS = [
  '#2563EB',
  '#10B981',
  '#A855F7',
  '#F97316',
  '#EC4899',
  '#14B8A6',
  '#F59E0B',
  '#64748B',
  '#0EA5E9',
  '#84CC16',
];

function formatChartValue(value: number, metric: MonthlyMetricKey): string {
  if (metric === 'custoTotal' || metric === 'custoPorCartao') {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (metric === 'taxaConversaoBase') {
    return `${(value * 100).toFixed(4).replace('.', ',')}%`;
  }
  return value.toLocaleString('pt-BR');
}

export const MonthlyStackedBarChart: React.FC<MonthlyStackedBarChartProps> = ({ title, rows, dimension }) => {
  const [metric, setMetric] = useState<MonthlyMetricKey>('emissoes');
  const [focusedSeries, setFocusedSeries] = useState<string | null>(null);
  const isStackable = !NON_STACKABLE_MONTHLY_METRICS.has(metric);

  const { chartData, series, seriesTotals } = useMemo(() => {
    const months = Array.from(new Map(rows.map(row => [row.monthKey, row.monthLabel])).entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const totalsBySeries = new Map<string, number>();
    rows.forEach((row) => {
      const value = getMonthlyMetricValue(row, metric);
      totalsBySeries.set(row.label, (totalsBySeries.get(row.label) ?? 0) + value);
    });

    const sortedSeries = Array.from(totalsBySeries.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);

    // Filter series if focused
    const visibleSeries = focusedSeries ? [focusedSeries] : sortedSeries;

    const data = months.map(([monthKey, monthLabel]) => {
      const item: Record<string, string | number> = { monthKey, monthLabel };
      rows
        .filter(row => row.monthKey === monthKey && (!focusedSeries || row.label === focusedSeries))
        .forEach((row) => {
          item[row.label] = getMonthlyMetricValue(row, metric);
        });
      return item;
    });

    return { chartData: data, series: visibleSeries, seriesTotals: totalsBySeries };
  }, [metric, rows, focusedSeries]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {METRIC_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setMetric(option)}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                  metric === option
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {MONTHLY_METRIC_LABELS[option]}
              </button>
            ))}
          </div>
          {!isStackable && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Métrica não empilhável
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {dimension === 'segmento' ? 'Segmentos por mês' : 'Canais por mês'}
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>

      {/* Series Totals - Filter Buttons */}
      {seriesTotals.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {Array.from(seriesTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, total], idx) => (
              <button
                key={`filter-${label}`}
                type="button"
                onClick={() => setFocusedSeries(focusedSeries === label ? null : label)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  focusedSeries === label
                    ? 'bg-slate-900 text-white border border-slate-700 shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
                title={`Clique para focar em ${label}`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }}
                />
                <span className="truncate">{label}</span>
                <span className="text-[11px] opacity-75">({formatChartValue(total, metric)})</span>
              </button>
            ))}
          {focusedSeries && (
            <button
              type="button"
              onClick={() => setFocusedSeries(null)}
              className="text-xs px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 transition-all"
            >
              ✕ Limpar filtro
            </button>
          )}
        </div>
      )}

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="monthLabel" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => metric === 'taxaConversaoBase' ? `${(Number(value) * 100).toFixed(2)}%` : Number(value).toLocaleString('pt-BR', { notation: 'compact' })}
            />
            <Tooltip
              cursor={{ fill: '#E2E8F0', opacity: 0.35 }}
              formatter={(value: number, name: string) => [formatChartValue(value, metric), name]}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{ borderColor: '#E2E8F0', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, cursor: 'pointer' }} />
            {series.map((label, index) => (
              <Bar
                key={label}
                dataKey={label}
                stackId={isStackable ? 'monthly' : undefined}
                fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                radius={isStackable ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                maxBarSize={isStackable ? 64 : 34}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
