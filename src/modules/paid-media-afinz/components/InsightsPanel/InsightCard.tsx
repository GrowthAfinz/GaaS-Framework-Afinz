import React from 'react';
import { MediaInsight } from '../../../../schemas/paid-media';
import { InsightBadge } from './InsightBadge';

interface InsightCardProps {
  insight: MediaInsight;
  onDismiss: (id: string) => void;
  onDone: (id: string) => void;
}

export function InsightCard({ insight, onDismiss, onDone }: InsightCardProps) {
  const isHighPriority = insight.score >= 8;
  const cardBorder = isHighPriority 
    ? (insight.tipo === 'alerta' ? 'border-red-400 border-2' : 'border-gray-300 border-2')
    : 'border-gray-200';

  return (
    <div className={`min-w-[300px] max-w-[350px] p-4 bg-white rounded-lg shadow-sm border ${cardBorder} flex flex-col gap-3 shrink-0`}>
      <InsightBadge tipo={insight.tipo as any} score={insight.score} />
      
      <div>
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{insight.mudanca}</h4>
      </div>

      <div className="text-xs space-y-2 flex-1">
        <p className="text-gray-600"><span className="font-medium text-gray-700">Contexto:</span> {insight.contexto}</p>
        <p className="text-gray-600"><span className="font-medium text-gray-700">Causa:</span> {insight.causa}</p>
        
        {insight.acoes && insight.acoes.length > 0 && (
          <div className="mt-2">
            <span className="font-medium text-gray-700">Ações recomendadas:</span>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {insight.acoes.map((acao, idx) => (
                <li key={idx} className="text-gray-600">{acao}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="text-xs text-gray-500 max-w-[60%] truncate" title={`${insight.campaign || 'Geral'} - ${insight.adset_name || ''}`}>
          {insight.campaign ? <span className="font-medium">{insight.campaign}</span> : 'Conta Geral'}
          {insight.adset_name && <span> › {insight.adset_name}</span>}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onDismiss(insight.id)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="Ignorar"
          >
            ✕
          </button>
          <button 
            onClick={() => onDone(insight.id)}
            className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100 transition-colors"
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}
