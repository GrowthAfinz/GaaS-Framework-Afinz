/**
 * =============================================================================
 * INSIGHTS SECTION - Seção com 2 Gráficos Interativos
 * =============================================================================
 *
 * Renderiza:
 * 1. Abas para alternar entre Timeline e Comparative
 * 2. Gráfico de Performance Timeline
 * 3. Gráfico de Comparative Analysis
 * 4. Loading skeleton
 * 5. Error handling
 *
 * Props simples: derivadas do useDispatchInsights hook
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Loader } from 'lucide-react';
import { PerformanceTimelineChart } from '../charts/PerformanceTimelineChart';
import { ComparativeAnalysisChart } from '../charts/ComparativeAnalysisChart';
import { UseDispatchInsightsResult } from '@/hooks/useDispatchInsights';
import { Alternative } from '@/services/ml/alternativeGenerator';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface InsightsSectionProps {
  /** Resultado do hook useDispatchInsights */
  insightResult: UseDispatchInsightsResult;

  /** Callback quando usuário seleciona alternativa */
  onSelectAlternative?: (alternative: Alternative) => void;

  /** Classe CSS customizada */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function InsightsSection({
  insightResult,
  onSelectAlternative,
  className = '',
}: InsightsSectionProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'comparative'>('timeline');

  const { performance, alternatives, isLoading, error, currentMetric, setCurrentMetric } =
    insightResult;

  // ===========================================================================
  // RENDERIZAR
  // ===========================================================================

  return (
    <section className={`insights-section space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-6 ${className}`}>
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-blue-600/20 p-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">🔍 AI-Powered Insights</h3>
            <p className="text-xs text-slate-400">Análise de performance e alternativas</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader className="h-4 w-4 animate-spin" />
            Analisando...
          </div>
        )}
      </div>

      {/* ERRO */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-700 bg-red-900/20 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <div className="text-sm font-semibold text-red-300">Erro ao analisar</div>
            <div className="text-xs text-red-400">{error}</div>
          </div>
        </div>
      )}

      {/* ABAS */}
      <div className="flex gap-2 border-b border-slate-700">
        <TabButton
          icon="📈"
          label="Performance Timeline"
          isActive={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
        />
        <TabButton
          icon="📊"
          label="Comparative Analysis"
          isActive={activeTab === 'comparative'}
          onClick={() => setActiveTab('comparative')}
        />
      </div>

      {/* CONTEÚDO */}
      {isLoading && !performance ? (
        <LoadingSkeleton />
      ) : activeTab === 'timeline' ? (
        <TimelineTabContent
          performance={performance}
          currentMetric={currentMetric}
          onMetricChange={setCurrentMetric}
        />
      ) : (
        <ComparativeTabContent
          currentValue={performance?.stats.median ?? 0}
          alternatives={alternatives}
          currentMetric={currentMetric}
          onSelectAlternative={onSelectAlternative}
        />
      )}

      {/* INFO FOOTER */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
        <div className="text-xs text-slate-500">
          {performance && (
            <>
              📊 {performance.sampleSize} disparos similares analisados
              {insightResult.lastCalculatedAt && (
                <span className="ml-2">
                  • Atualizado {formatTime(insightResult.lastCalculatedAt)}
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={insightResult.refresh}
          disabled={isLoading}
          className="text-xs text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
        >
          🔄 Atualizar
        </button>
      </div>
    </section>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function TabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
        isActive
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-400'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function TimelineTabContent({
  performance,
  currentMetric,
  onMetricChange,
}: {
  performance: any | null;
  currentMetric: any;
  onMetricChange: (metric: any) => void;
}) {
  if (!performance) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Preencha os campos para ver análise de performance
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PerformanceTimelineChart
        performance={performance}
        metric={currentMetric}
        onMetricChange={onMetricChange}
        height={400}
        showTrend={true}
        showConfidenceInterval={true}
      />
    </div>
  );
}

function ComparativeTabContent({
  currentValue,
  alternatives,
  currentMetric,
  onSelectAlternative,
}: {
  currentValue: number;
  alternatives: any[];
  currentMetric: any;
  onSelectAlternative?: (alt: any) => void;
}) {
  if (alternatives.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Nenhuma alternativa com impacto significativo encontrada
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ComparativeAnalysisChart
        currentValue={currentValue}
        alternatives={alternatives}
        metric={currentMetric}
        onSelectAlternative={onSelectAlternative}
        minImprovementPercent={5}
        height={400}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="mb-4 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800" />
          ))}
        </div>
        <div className="h-80 rounded-lg bg-slate-800" />
      </div>
    </div>
  );
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m atrás`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}
