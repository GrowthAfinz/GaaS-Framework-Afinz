/**
 * =============================================================================
 * COMPARATIVE ANALYSIS CHART - Gráfico de Barras com Alternativas
 * =============================================================================
 *
 * Exibe setup atual vs alternativas lado-a-lado
 * permitindo comparação visual de impacto
 *
 * Features:
 * - Gráfico de barras horizontais
 * - Highlighting do setup atual
 * - Labels com % de melhoria
 * - Confiança visual (cor)
 * - Tooltips com detalhes
 * - Clique para aplicar sugestão
 */

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Alternative } from '../../../services/ml/alternativeGenerator';
import { ProjectableMetric } from '../../../services/ml/performanceAnalyzer';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface ComparativeAnalysisChartProps {
  /** Setup atual */
  currentValue: number;

  /** Alternativas para comparar */
  alternatives: Alternative[];

  /** Métrica sendo comparada */
  metric: ProjectableMetric;

  /** Callback quando usuario clica em alternativa */
  onSelectAlternative?: (alternative: Alternative) => void;

  /** Mostrar apenas alternativas com melhoria > X%? */
  minImprovementPercent?: number;

  /** Altura do gráfico */
  height?: number;

  /** Classe CSS */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ComparativeAnalysisChart({
  currentValue,
  alternatives,
  metric,
  onSelectAlternative,
  minImprovementPercent = 5,
  height = 400,
  className = '',
}: ComparativeAnalysisChartProps) {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [filterLowConfidence, setFilterLowConfidence] = useState(false);

  // Preparar dados incluindo setup atual
  const chartData = useMemo(() => {
    const data: any[] = [
      {
        id: 'current',
        name: 'Setup Atual',
        value: currentValue,
        improvement: 0,
        confidence: 100,
        isCurrentSetup: true,
        type: 'current',
      },
    ];

    // Adicionar alternativas com melhoria significativa
    for (const alt of alternatives) {
      if (alt.improvementPercent < minImprovementPercent) continue;
      if (filterLowConfidence && alt.confidence < 70) continue;

      data.push({
        id: alt.id,
        name: alt.displayText,
        value: alt.expectedMetricValue,
        improvement: alt.improvementPercent,
        confidence: alt.confidence,
        sampleCount: alt.sampleCount,
        riskLevel: alt.riskLevel,
        isCurrentSetup: false,
        type: alt.type,
        icon: alt.icon,
        alternative: alt,
      });
    }

    return data;
  }, [alternatives, currentValue, minImprovementPercent, filterLowConfidence]);

  if (alternatives.length === 0) {
    return <EmptyState message="Nenhuma alternativa com impacto significativo" />;
  }

  return (
    <div className={`comparative-analysis-chart ${className}`}>
      {/* Cabeçalho com Filtros */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Análise de Alternativas
        </h3>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={filterLowConfidence}
            onChange={(e) => setFilterLowConfidence(e.target.checked)}
            className="rounded"
          />
          {`Apenas alta confiança (>70%)`}
        </label>
      </div>

      {/* Gráfico */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              type="number"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              label={{
                value: `${metric === 'cac' ? 'CAC (R$)' : 'Taxa (%)'}`,
                position: 'insideBottomRight',
                offset: -5,
                fill: '#94a3b8',
              }}
            />

            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#94a3b8' }}
              width={240}
            />

            <Tooltip content={<CustomTooltip metric={metric} />} />

            <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry)}
                  onClick={() => {
                    if (!entry.isCurrentSetup && entry.alternative) {
                      setSelectedAlternative(entry.id);
                      onSelectAlternative?.(entry.alternative);
                    }
                  }}
                  style={{
                    cursor: entry.isCurrentSetup ? 'default' : 'pointer',
                    transition: 'all 200ms ease',
                    opacity: selectedAlternative === null || selectedAlternative === entry.id ? 1 : 0.6,
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cards de Alternativas com Detalhes */}
      <div className="space-y-3">
        {chartData.map((item) => (
          <AlternativeCard
            key={item.id}
            data={item}
            isSelected={selectedAlternative === item.id}
            onClick={() => {
              setSelectedAlternative(item.id);
              if (!item.isCurrentSetup && item.alternative) {
                onSelectAlternative?.(item.alternative);
              }
            }}
          />
        ))}
      </div>

      {/* Recomendação Top */}
      {!filterLowConfidence && chartData.length > 1 && (
        <TopRecommendation
          topAlternative={chartData[1]} // Skip current setup
          onApply={() => {
            if (chartData[1].alternative) {
              onSelectAlternative?.(chartData[1].alternative);
            }
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function AlternativeCard({
  data,
  isSelected,
  onClick,
}: {
  data: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (data.isCurrentSetup) {
    return (
      <div className="rounded-lg border-2 border-blue-600 bg-blue-900/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📌</span>
              <div className="font-semibold text-blue-300">{data.name}</div>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-200">
              {data.value.toFixed(2)}
              {data.name.includes('%') ? '%' : 'R$'}
            </div>
            <div className="mt-1 text-xs text-blue-300">Setup selecionado atualmente</div>
          </div>
          <CheckCircle className="h-6 w-6 text-blue-400" />
        </div>
      </div>
    );
  }

  const improvement = data.improvement;
  const confidence = data.confidence;
  const getImpactColor = (improvement: number) => {
    if (improvement > 50) return 'text-green-400';
    if (improvement > 25) return 'text-emerald-400';
    if (improvement > 10) return 'text-cyan-400';
    return 'text-slate-400';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 80) return '🟢';
    if (confidence > 60) return '🟡';
    return '🔴';
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-900/30'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Título com icon */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon || '📊'}</span>
            <div className="font-semibold text-slate-100">{data.name}</div>
          </div>

          {/* Valor esperado */}
          <div className="mt-2 text-xl font-bold text-slate-100">
            {data.value.toFixed(2)}
            {data.name.includes('%') ? '%' : 'R$'}
          </div>

          {/* Melhoria */}
          <div className={`mt-1 text-sm font-semibold ${getImpactColor(improvement)}`}>
            {improvement > 0 ? '+' : ''}
            {improvement.toFixed(1)}% vs setup atual
          </div>

          {/* Detalhes */}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span>
              {getConfidenceIcon(confidence)} Confiança: {confidence}%
            </span>
            <span>📊 {data.sampleCount} casos similares</span>
            <span>
              Risk:{' '}
              {data.riskLevel === 'low'
                ? '✅ BAIXO'
                : data.riskLevel === 'medium'
                ? '⚠️ MÉDIO'
                : '🔴 ALTO'}
            </span>
          </div>
        </div>

        {/* Seta de seleção */}
        <TrendingUp className="h-5 w-5 text-slate-500" />
      </div>
    </div>
  );
}

function TopRecommendation({
  topAlternative,
  onApply,
}: {
  topAlternative: any;
  onApply: () => void;
}) {
  if (!topAlternative || topAlternative.isCurrentSetup) {
    return null;
  }

  return (
    <div className="mt-6 rounded-lg border-2 border-green-600 bg-green-900/30 p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-bold text-green-300">TOP RECOMENDAÇÃO</div>
              <div className="mt-1 text-sm text-green-200">
                {topAlternative.name}
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-green-300">
            <div>
              Melhoria: <strong>+{topAlternative.improvement.toFixed(1)}%</strong>
            </div>
            <div>
              Confiança: <strong>{topAlternative.confidence}%</strong>
            </div>
            <div>
              Baseado em <strong>{topAlternative.sampleCount}</strong> disparos similares
            </div>
          </div>
        </div>

        <button
          onClick={onApply}
          className="flex-shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

function CustomTooltip({ metric }: { metric: ProjectableMetric }) {
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900 p-3 shadow-lg">
      <div className="text-xs font-semibold text-slate-300">Detalhes</div>
      <div className="mt-2 text-sm text-slate-100">
        {/* Recharts injeita valores aqui */}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900">
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-500" />
        <div className="mt-2 text-sm text-slate-400">{message}</div>
      </div>
    </div>
  );
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function getBarColor(data: any): string {
  if (data.isCurrentSetup) {
    return '#3b82f6'; // Blue para setup atual
  }

  // Verde para alto impacto + confiança alta
  if (data.improvement > 30 && data.confidence > 75) {
    return '#22c55e';
  }

  // Amarelo para médio impacto
  if (data.improvement > 15) {
    return '#f59e0b';
  }

  // Cinza para baixo impacto
  return '#8b5cf6';
}
