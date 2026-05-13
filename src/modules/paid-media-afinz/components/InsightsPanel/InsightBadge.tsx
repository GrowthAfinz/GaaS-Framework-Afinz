import React from 'react';

type TipoInsight = 'alerta' | 'oportunidade' | 'anomalia' | 'tendencia';

interface InsightBadgeProps {
  tipo: TipoInsight;
  score: number;
}

export function InsightBadge({ tipo, score }: InsightBadgeProps) {
  const getColors = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return 'bg-red-50 text-red-700 border-red-200';
      case 'oportunidade': return 'bg-green-50 text-green-700 border-green-200';
      case 'anomalia': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'tendencia': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLabel = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return 'ALERTA 🔴';
      case 'oportunidade': return 'OPORTUNIDADE 🟢';
      case 'anomalia': return 'ANOMALIA 🟡';
      case 'tendencia': return 'TENDÊNCIA 🔵';
      default: return 'INFO';
    }
  };

  const isHighPriority = score >= 8;

  return (
    <div className="flex items-center justify-between w-full">
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getColors(tipo)} ${isHighPriority ? 'animate-pulse' : ''}`}>
        {getLabel(tipo)}
      </span>
      <span className="text-xs font-medium text-gray-500">
        Score: {score}/10
      </span>
    </div>
  );
}
