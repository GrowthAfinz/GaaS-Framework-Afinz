import React from 'react';
import { useInsights } from '../../hooks/useInsights';
import { InsightCard } from './InsightCard';

interface InsightsPanelProps {
  channel?: string;
}

export function InsightsPanel({ channel }: InsightsPanelProps) {
  const { insights, loading, error, dismiss, markDone } = useInsights(channel);

  if (error) {
    return null; // Silent fall se erro (ex: tab vazia)
  }

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>💡</span> Insights da Semana
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
           {[1, 2, 3].map(i => (
             <div key={i} className="min-w-[300px] h-[200px] bg-gray-50 animate-pulse rounded-lg border border-gray-200 shrink-0"></div>
           ))}
        </div>
      </section>
    );
  }

  if (insights.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>💡</span> Insights da Semana
          </h2>
          <span className="text-sm text-gray-500">0 insights ativos</span>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">Tudo em dia! Nenhum insight ativo no momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>💡</span> Insights da Semana
        </h2>
        <span className="text-sm text-gray-500">{insights.length} insights ativos</span>
      </div>

      {/* Cards em linha horizontal com scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {insights.map(insight => (
          <InsightCard 
            key={insight.id} 
            insight={insight} 
            onDismiss={dismiss}
            onDone={markDone}
          />
        ))}
      </div>
    </section>
  );
}
