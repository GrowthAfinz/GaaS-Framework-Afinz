import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  COLUMN_BY_KEY,
  MetricFamily,
  METRIC_COLUMNS,
  MetricKey,
  getMetricFamily,
} from './reportColumnsConfig';
import { ColumnsCustomizer } from './ColumnsCustomizer';
import { NON_STACKABLE_MONTHLY_METRICS } from '../../utils/monthlyAggregation';
import { DailyDimension, DailyDimensionRow, totalsFromDimensionRows } from '../../utils/dailyAggregation';
import { useAppStore } from '../../store/useAppStore';

interface DailyStackedBarChartProps {
  title: string;
  rows: DailyDimensionRow[];
  dimension: DailyDimension;
  rentabilizacao?: boolean;
  accumulated?: boolean;
}

// Conjunto padrão de métricas "fixadas" como atalho rápido — o usuário pode
// trocar via ColumnsCustomizer (mesma caixa de seleção da Overview).
const DEFAULT_PINNED_METRICS: MetricKey[] = [
  'baseEnviada', 'baseEntregue', 'propostas', 'aprovados', 'emissoes', 'custoTotal', 'custoPorCartao', 'taxaConversaoBase',
];

const DEFAULT_ENGAGEMENT_PINNED_METRICS: MetricKey[] = [
  'baseEnviada', 'baseEntregue', 'aberturas', 'taxaAbertura', 'cliques', 'taxaClique', 'custoTotal',
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

function formatChartValue(value: number, metric: MetricKey): string {
  const format = COLUMN_BY_KEY[metric]?.format;
  if (format === 'currency') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (format === 'percent4') return `${(value * 100).toFixed(4).replace('.', ',')}%`;
  if (format === 'percent') return `${(value * 100).toFixed(2).replace('.', ',')}%`;
  return value.toLocaleString('pt-BR');
}

function axisTickFormatter(family: MetricFamily | undefined) {
  return (value: number) => {
    if (family === 'percent') return `${(Number(value) * 100).toFixed(2)}%`;
    return Number(value).toLocaleString('pt-BR', { notation: 'compact' });
  };
}

export const DailyStackedBarChart: React.FC<DailyStackedBarChartProps> = ({ title, rows, dimension, rentabilizacao = false, accumulated = false }) => {
  const [pinnedMetrics, setPinnedMetrics] = useState<MetricKey[]>(
    rentabilizacao ? DEFAULT_ENGAGEMENT_PINNED_METRICS : DEFAULT_PINNED_METRICS,
  );
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>([rentabilizacao ? 'cliques' : 'emissoes']);
  const [focusedSeries, setFocusedSeries] = useState<string | null>(null);

  const { viewSettings, setGlobalFilters } = useAppStore();
  const globalFilters = viewSettings.filtrosGlobais;

  const isMultiMetric = activeMetrics.length > 1;
  // No modo acumulado as taxas viram cumulativas; empilhar não faz sentido para
  // métricas não somáveis (continuam como barras independentes).
  const isStackable = !isMultiMetric && !NON_STACKABLE_MONTHLY_METRICS.has(activeMetrics[0]);

  const activeGlobalValues = useMemo(
    () => (dimension === 'segmento' ? globalFilters.segmentos : globalFilters.canais),
    [dimension, globalFilters.segmentos, globalFilters.canais],
  );

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

  // Reset ao trocar de frente (aquisição ↔ rentabilização).
  useEffect(() => {
    setPinnedMetrics(rentabilizacao ? DEFAULT_ENGAGEMENT_PINNED_METRICS : DEFAULT_PINNED_METRICS);
    setActiveMetrics([rentabilizacao ? 'cliques' : 'emissoes']);
    setFocusedSeries(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentabilizacao]);

  // Se o usuário desafixar (via Colunas) uma métrica que estava ativa, reconcilia a seleção.
  useEffect(() => {
    setActiveMetrics((prev) => {
      const stillPinned = prev.filter((m) => pinnedMetrics.includes(m));
      if (stillPinned.length > 0) return stillPinned;
      return pinnedMetrics.length > 0 ? [pinnedMetrics[0]] : prev;
    });
  }, [pinnedMetrics]);

  const toggleActiveMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // mantém ao menos 1 métrica ativa
        return prev.filter((m) => m !== key);
      }
      return [...prev, key];
    });
  };

  const families = useMemo(() => {
    const seen: MetricFamily[] = [];
    activeMetrics.forEach((m) => {
      const family = getMetricFamily(m);
      if (!seen.includes(family)) seen.push(family);
    });
    return seen;
  }, [activeMetrics]);

  const leftFamily = families[0];
  const rightFamily = families[1];
  const hasOverflowFamilies = families.length > 2;

  const axisForFamily = (family: MetricFamily): 'left' | 'right' => (family === leftFamily ? 'left' : 'right');

  const { chartData, series, seriesTotals } = useMemo(() => {
    if (isMultiMetric) {
      const totals = totalsFromDimensionRows(rows);
      const data = totals.map((t) => {
        const item: Record<string, string | number> = { dayKey: t.dayKey, dayLabel: t.dayLabel };
        activeMetrics.forEach((m) => { item[m] = t[m]; });
        return item;
      });
      return { chartData: data, series: [] as string[], seriesTotals: new Map<string, number>() };
    }

    const metric = activeMetrics[0];
    const days = Array.from(new Map(rows.map(row => [row.dayKey, row.dayLabel])).entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const totalsBySeries = new Map<string, number>();
    rows.forEach((row) => {
      // No acumulado, o "total" representativo da série é o último valor (já cumulativo);
      // no diário, é a soma simples. Em ambos basta usar o maior valor encontrado.
      const value = row[metric];
      const current = totalsBySeries.get(row.label) ?? 0;
      totalsBySeries.set(row.label, accumulated ? Math.max(current, value) : current + value);
    });

    const sortedSeries = Array.from(totalsBySeries.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);

    const visibleSeries = focusedSeries ? [focusedSeries] : sortedSeries;

    const data = days.map(([dayKey, dayLabel]) => {
      const item: Record<string, string | number> = { dayKey, dayLabel };
      rows
        .filter(row => row.dayKey === dayKey && (!focusedSeries || row.label === focusedSeries))
        .forEach((row) => {
          item[row.label] = row[metric];
        });
      return item;
    });

    return { chartData: data, series: visibleSeries, seriesTotals: totalsBySeries };
  }, [isMultiMetric, activeMetrics, rows, focusedSeries, accumulated]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          <ColumnsCustomizer
            value={pinnedMetrics}
            defaults={rentabilizacao ? DEFAULT_ENGAGEMENT_PINNED_METRICS : DEFAULT_PINNED_METRICS}
            available={METRIC_COLUMNS}
            onChange={(next) => setPinnedMetrics(next as MetricKey[])}
            label="Métricas"
            buttonLabel="Métricas"
          />
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
            {pinnedMetrics.map((key) => {
              const active = activeMetrics.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleActiveMetric(key)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title={isMultiMetric ? 'Clique para remover da comparação' : 'Clique em outra métrica para comparar'}
                >
                  {COLUMN_BY_KEY[key]?.label ?? key}
                </button>
              );
            })}
          </div>
          {isMultiMetric && (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
              Comparando {activeMetrics.length} métricas · total (sem quebra por {dimension === 'segmento' ? 'segmento' : 'canal'})
            </span>
          )}
          {accumulated && (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
              Acumulado
            </span>
          )}
          {!isMultiMetric && !isStackable && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Métrica não empilhável
            </span>
          )}
          {isMultiMetric && hasOverflowFamilies && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              3+ tipos de escala selecionados — eixo direito compartilhado (comparação aproximada)
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {dimension === 'segmento' ? 'Segmentos por dia' : 'Canais por dia'}
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>

      {!isMultiMetric && seriesTotals.size > 0 && (
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
                  <span className="text-[11px] opacity-75">({formatChartValue(total, activeMetrics[0])})</span>
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
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="dayLabel" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={axisTickFormatter(leftFamily)}
            />
            {isMultiMetric && rightFamily && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={axisTickFormatter(rightFamily)}
              />
            )}
            <Tooltip
              cursor={{ fill: '#E2E8F0', opacity: 0.35 }}
              formatter={(value: number, name: string, props: any) => {
                const metricKey = (isMultiMetric ? (props?.dataKey as MetricKey) : activeMetrics[0]);
                return [formatChartValue(Number(value), metricKey), name];
              }}
              labelFormatter={(label) => `Dia: ${label}`}
              contentStyle={{ borderColor: '#E2E8F0', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, cursor: 'pointer' }} />
            {isMultiMetric
              ? activeMetrics.map((m, index) => {
                  const family = getMetricFamily(m);
                  const yAxisId = axisForFamily(family);
                  const color = SERIES_COLORS[index % SERIES_COLORS.length];
                  const label = COLUMN_BY_KEY[m]?.label ?? m;
                  return family === 'percent' ? (
                    <Line
                      key={m}
                      type="monotone"
                      dataKey={m}
                      name={label}
                      yAxisId={yAxisId}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : (
                    <Bar
                      key={m}
                      dataKey={m}
                      name={label}
                      yAxisId={yAxisId}
                      fill={color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  );
                })
              : series.map((label, index) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    yAxisId="left"
                    stackId={isStackable ? 'daily' : undefined}
                    fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                    radius={isStackable ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    maxBarSize={isStackable ? 48 : 28}
                  />
                ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
