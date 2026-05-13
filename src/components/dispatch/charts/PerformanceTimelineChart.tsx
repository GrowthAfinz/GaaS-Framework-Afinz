/**
 * =============================================================================
 * PERFORMANCE TIMELINE CHART - Gráfico de Linha com Trend
 * =============================================================================
 *
 * Exibe performance histórica de uma métrica ao longo do tempo
 * com linha de tendência, intervalo de confiança e insights visuais
 *
 * Features:
 * - Gráfico de linha com pontos interativos
 * - Linha de tendência (regressão linear)
 * - Área de intervalo de confiança
 * - Estatísticas descritivas
 * - Indicadores de anomalias (outliers)
 * - Tooltips customizados
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
  AreaChart,
  Dot,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PerformanceSnapshot, TimeSeriesPoint, ProjectableMetric } from '../../../services/ml/performanceAnalyzer';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface PerformanceTimelineChartProps {
  /** Dados de performance */
  performance: PerformanceSnapshot;

  /** Métrica atualmente exibida */
  metric: ProjectableMetric;

  /** Callback quando métrica é alterada */
  onMetricChange?: (metric: ProjectableMetric) => void;

  /** Altura do gráfico em pixels */
  height?: number;

  /** Mostrar linha de tendência? */
  showTrend?: boolean;

  /** Mostrar intervalo de confiança? */
  showConfidenceInterval?: boolean;

  /** Classe CSS customizada */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PerformanceTimelineChart({
  performance,
  metric,
  onMetricChange,
  height = 350,
  showTrend = true,
  showConfidenceInterval = true,
  className = '',
}: PerformanceTimelineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    return performance.timeseries.map((point, index) => ({
      date: point.date.toLocaleDateString('pt-BR'),
      dateObj: point.date,
      value: Math.round(point.value * 100) / 100,
      count: point.count,
      volume: point.volume,
      // Linha de tendência (se significante)
      ...(showTrend &&
        performance.trend.isSignificant && {
          trend: calculateTrendValue(index, performance),
        }),
      // Intervalo de confiança
      ...(showConfidenceInterval && {
        ciMin: Math.max(0, performance.stats.confidenceInterval.min),
        ciMax: performance.stats.confidenceInterval.max,
      }),
    }));
  }, [performance, showTrend, showConfidenceInterval]);

  if (performance.sampleSize === 0) {
    return <EmptyState message="Sem dados para exibir" />;
  }

  return (
    <div className={`performance-timeline-chart ${className}`}>
      {/* Cabeçalho com Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Média"
          value={`${performance.stats.mean.toFixed(2)}%`}
          icon="📊"
        />
        <StatCard
          label="Mediana"
          value={`${performance.stats.median.toFixed(2)}%`}
          icon="📈"
        />
        <StatCard
          label="Desvio"
          value={`±${performance.stats.stdDev.toFixed(2)}%`}
          icon="📉"
        />
        <StatCard
          label="Amostras"
          value={performance.sampleSize.toString()}
          icon="📋"
        />
      </div>

      {/* Gráfico */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />

            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              label={{
                value: 'Taxa (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Intervalo de Confiança (fundo) */}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="ciMax"
                fill="rgba(59, 130, 246, 0.1)"
                stroke="none"
                isAnimationActive={false}
              />
            )}

            {/* Linha de Tendência */}
            {showTrend && performance.trend.isSignificant && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                name="Tendência"
              />
            )}

            {/* Linha Principal */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={getMetricColor(metric)}
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: getMetricColor(metric) }}
              isAnimationActive={true}
              name="Taxa"
            />

            {/* Linha de Média */}
            <ReferenceLine
              y={performance.stats.mean}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{
                value: `Média: ${performance.stats.mean.toFixed(2)}%`,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Análise de Tendência */}
      <TrendAnalysisCard trend={performance.trend} />

      {/* Avisos de Qualidade */}
      <DataQualityCard dataQuality={performance.dataQuality} />

      {/* Outliers */}
      {performance.stats.outliers.length > 0 && (
        <OutliersCard outliers={performance.stats.outliers} />
      )}

      {/* Seletor de Métrica */}
      {onMetricChange && (
        <MetricSelector
          currentMetric={metric}
          onMetricChange={onMetricChange}
        />
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-lg font-bold text-slate-100">{value}</span>
      </div>
    </div>
  );
}

function CustomTooltip() {
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900 p-3 shadow-lg">
      <div className="text-xs font-semibold text-slate-300">Performance</div>
      <div className="mt-2 space-y-1">
        <div className="text-sm text-slate-100">
          <span className="font-semibold">Taxa:</span> {/* valor vem do Recharts */}
        </div>
      </div>
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy, payload, value } = props;

  // Highlight outliers
  if (payload.count === 1) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#ef4444"
        stroke="#fff"
        strokeWidth={1}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#3b82f6"
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

function TrendAnalysisCard({ trend }: { trend: any }) {
  if (!trend.isSignificant) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
        <Minus className="h-6 w-6 text-slate-400" />
        <div>
          <div className="text-sm font-semibold text-slate-200">
            Performance Estável
          </div>
          <div className="text-xs text-slate-400">
            Sem tendência clara nos dados
          </div>
        </div>
      </div>
    );
  }

  const isUp = trend.direction === 'up';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${
        isUp
          ? 'border-green-700 bg-green-900/20'
          : 'border-red-700 bg-red-900/20'
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-6 w-6 text-green-400" />
      ) : (
        <TrendingDown className="h-6 w-6 text-red-400" />
      )}

      <div>
        <div
          className={`text-sm font-semibold ${
            isUp ? 'text-green-300' : 'text-red-300'
          }`}
        >
          {trend.description}
        </div>
        <div className="text-xs text-slate-400">
          Mudança nos últimos 30 dias: {trend.change30days > 0 ? '+' : ''}
          {trend.change30days.toFixed(1)}% | R² = {trend.rSquared.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function DataQualityCard({ dataQuality }: { dataQuality: any }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-900/20 border-green-700 text-green-300';
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-300';
      case 'low':
        return 'bg-red-900/20 border-red-700 text-red-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getLevelColor(dataQuality.level)}`}>
      <div className="text-sm font-semibold">Qualidade dos Dados</div>
      <ul className="mt-2 space-y-1 text-xs">
        {dataQuality.reasons.map((reason: string, i: number) => (
          <li key={i}>• {reason}</li>
        ))}
      </ul>
      <div className="mt-2 text-xs font-semibold">
        💡 {dataQuality.recommendation}
      </div>
    </div>
  );
}

function OutliersCard({ outliers }: { outliers: number[] }) {
  return (
    <div className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-4">
      <div className="text-sm font-semibold text-yellow-300">
        ⚠️ {outliers.length} Outlier(s) Detectado(s)
      </div>
      <div className="mt-2 text-xs text-yellow-200">
        Valores atípicos encontrados: {outliers.map((v) => v.toFixed(2)).join(', ')}
      </div>
      <div className="mt-2 text-xs font-semibold text-yellow-300">
        Dica: Usar MEDIANA ao invés de MÉDIA para maior confiabilidade
      </div>
    </div>
  );
}

function MetricSelector({
  currentMetric,
  onMetricChange,
}: {
  currentMetric: ProjectableMetric;
  onMetricChange: (metric: ProjectableMetric) => void;
}) {
  const metrics: { value: ProjectableMetric; label: string; icon: string }[] = [
    { value: 'taxaConversao', label: 'Taxa Conversão', icon: '📊' },
    { value: 'cac', label: 'CAC', icon: '💰' },
    { value: 'cartoesGerados', label: 'Cartões', icon: '🎟️' },
    { value: 'taxaEntrega', label: 'Taxa Entrega', icon: '📬' },
    { value: 'taxaAbertura', label: 'Taxa Abertura', icon: '📖' },
    { value: 'propostas', label: 'Propostas', icon: '🎯' },
    { value: 'aprovados', label: 'Aprovados', icon: '✅' },
    { value: 'baseAcionavel', label: 'Base Acionável', icon: '📋' },
    { value: 'volume', label: 'Volume', icon: '📦' },
  ];

  return (
    <div className="mt-6">
      <div className="mb-3 text-sm font-semibold text-slate-300">
        Alterar Métrica:
      </div>
      <div className="flex flex-wrap gap-2">
        {metrics.map((m) => (
          <button
            key={m.value}
            onClick={() => onMetricChange(m.value)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              currentMetric === m.value
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
            } border`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900">
      <div className="text-center">
        <div className="text-3xl">📊</div>
        <div className="mt-2 text-sm text-slate-400">{message}</div>
      </div>
    </div>
  );
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function calculateTrendValue(index: number, performance: PerformanceSnapshot): number {
  if (!performance.trend.isSignificant) return 0;

  const slope = performance.trend.slope;
  const median = performance.stats.median;

  // Usar a fórmula: y = slope * x + intercept
  // intercept = mediana (ponto de referência)
  return median + slope * (index - performance.timeseries.length / 2);
}

function getMetricColor(metric: ProjectableMetric): string {
  const colors: Record<ProjectableMetric, string> = {
    taxaConversao: '#3b82f6', // blue
    cac: '#ef4444', // red
    cartoesGerados: '#22c55e', // green
    taxaEntrega: '#8b5cf6', // purple
    taxaAbertura: '#06b6d4', // cyan
    propostas: '#f59e0b', // amber
    aprovados: '#14b8a6', // teal
    baseAcionavel: '#ec4899', // pink
    volume: '#6366f1', // indigo
  };

  return colors[metric] || '#3b82f6';
}
