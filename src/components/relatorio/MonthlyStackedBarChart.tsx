import React, { useEffect, useMemo, useState } from 'react';
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
import { useAppStore } from '../../store/useAppStore';
import { ChartTooltip } from '../ui/ChartTooltip';

interface MonthlyStackedBarChartProps {
  title: string;
  rows: MonthlyDimensionRow[];
  dimension: MonthlyDimension;
  rentabilizacao?: boolean;
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

const ENGAGEMENT_METRIC_OPTIONS: MonthlyMetricKey[] = [
  'baseEnviada',
  'baseEntregue',
  'aberturas',
  'taxaAbertura',
  'cliques',
  'taxaClique',
  'custoTotal',
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
  if (metric === 'taxaConversaoBase' || metric === 'taxaAbertura' || metric === 'taxaClique') {
    return `${(value * 100).toFixed(4).replace('.', ',')}%`;
  }
  return value.toLocaleString('pt-BR');
}

export const MonthlyStackedBarChart: React.FC<MonthlyStackedBarChartProps> = ({ title, rows, dimension, rentabilizacao = false }) => {
  const metricOptions = rentabilizacao ? ENGAGEMENT_METRIC_OPTIONS : METRIC_OPTIONS;
  const [metric, setMetric] = useState<MonthlyMetricKey>(rentabilizacao ? 'cliques' : 'emissoes');
  const [focusedSeries, setFocusedSeries] = useState<string | null>(null);
  const isStackable = !NON_STACKABLE_MONTHLY_METRICS.has(metric);

  const { viewSettings, setGlobalFilters } = useAppStore();
  const globalFilters = viewSettings.filtrosGlobais;

  const activeGlobalValues = useMemo(
    () => (dimension === 'segmento' ? globalFilters.segmentos : globalFilters.canais),
    [dimension, globalFilters.segmentos, globalFilters.canais],
  );

  // Sync local focused series with the global filter state
  useEffect(() => {
    if (activeGlobalValues.length === 1) {
      setFocusedSeries(activeGlobalValues[0]);
    } else if (activeGlobalValues.length === 0) {
      setFocusedSeries(null);
    }
  }, [activeGlobalValues]);

  const handleSeriesClick = (label: string) => {
    const isActive = activeGlobalValues.length === 1 && activeGlobalValues[0] === label;
    const next = isActive ? [] : [label];
    if (dimension === 'segmento') {
      setGlobalFilters({ segmentos: next });
    } else {
      setGlobalFilters({ canais: next });
    }
    setFocusedSeries(next.length > 0 ? label : null);
  };

  const handleClearFilter = () => {
    if (dimension === 'segmento') {
      setGlobalFilters({ segmentos: [] });
    } else {
      setGlobalFilters({ canais: [] });
    }
    setFocusedSeries(null);
  };

  useEffect(() => {
    setMetric(rentabilizacao ? 'cliques' : 'emissoes');
    setFocusedSeries(null);
  }, [rentabilizacao]);

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
            {metricOptions.map(option => (
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

      {/* Series Totals - Filter Buttons (aplicam filtro global) */}
      {seriesTotals.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtro rápido — clique para aplicar filtro global
          </span>
          {Array.from(seriesTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, total], idx) => {
              const isGloballyActive = activeGlobalValues.includes(label);
              return (
                <button
                  key={`filter-${label}`}
                  type="button"
                  onClick={() => handleSeriesClick(label)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isGloballyActive
                      ? 'bg-slate-900 text-white border border-slate-700 shadow-md ring-2 ring-offset-1 ring-slate-700'
                      : focusedSeries && focusedSeries !== label
                      ? 'bg-white text-slate-400 border border-slate-200 opacity-60'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 hover:border-slate-400 hover:shadow-sm'
                  }`}
                  title={isGloballyActive ? `Remover filtro: ${label}` : `Aplicar filtro global: ${label}`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }}
                  />
                  <span className="truncate">{label}</span>
                  <span className="text-[11px] opacity-75">({formatChartValue(total, metric)})</span>
                  {isGloballyActive && (
                    <svg className="w-3 h-3 ml-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                  )}
                </button>
              );
            })}
          {activeGlobalValues.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="text-xs px-3 py-1.5 rounded-md font-medium text-red-500 hover:text-red-700 bg-white border border-red-200 hover:border-red-400 transition-all"
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
              tickFormatter={(value) => ['taxaConversaoBase', 'taxaAbertura', 'taxaClique'].includes(metric) ? `${(Number(value) * 100).toFixed(2)}%` : Number(value).toLocaleString('pt-BR', { notation: 'compact' })}
            />
            <Tooltip
              cursor={{ fill: '#E2E8F0', opacity: 0.35 }}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }}
              content={
                <ChartTooltip
                  labelPrefix="Mês"
                  totalLabel="Total no mês"
                  formatValue={(value) => formatChartValue(value, metric)}
                  showTotal={isStackable}
                />
              }
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
