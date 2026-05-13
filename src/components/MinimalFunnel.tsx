import React from 'react';
import { TrendingDown } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface MinimalFunnelProps {
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
}

export const MinimalFunnel: React.FC<MinimalFunnelProps> = ({
  baseEnviada,
  baseEntregue,
  propostas,
  aprovados,
  emissoes,
}) => {
  const stages = [
    { label: 'Enviadas', value: baseEnviada, color: 'bg-blue-600' },
    { label: 'Entregues', value: baseEntregue, color: 'bg-cyan-600' },
    { label: 'Propostas', value: propostas, color: 'bg-purple-600' },
    { label: 'Aprovadas', value: aprovados, color: 'bg-emerald-600' },
    { label: 'Emissões', value: emissoes, color: 'bg-orange-600' },
  ];

  // Calcular taxa de conversão geral
  const conversionGeral = baseEnviada > 0 ? (emissoes / baseEnviada) * 100 : 0;
  const queda = baseEnviada - emissoes;

  // Função para formatar percentual com precisão dinâmica
  // Função para formatar percentual com precisão dinâmica
  const formatPercent = (value: number): string => {
    if (value === 0) return '0%';
    if (value < 0.01) return value.toFixed(4) + '%'; // Ex: 0.0012%
    if (value < 1) return value.toFixed(2) + '%';    // Ex: 0.12%
    return value.toFixed(1) + '%';                   // Ex: 1.5%
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header com resumo */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          📊 Funil de Conversão
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700">
            <p className="text-slate-500 mb-0.5 flex items-center gap-1">Conv. Geral <Tooltip content={'Emissões / Base Enviada'} /></p>
            <p className="text-lg font-bold text-emerald-400">{formatPercent(conversionGeral)}</p>
          </div>
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700">
            <p className="text-slate-500 mb-0.5 flex items-center gap-1">Queda Total <Tooltip content={'Base Enviada - Emissões'} /></p>
            <p className="text-lg font-bold text-red-400 flex items-center gap-1">
              <TrendingDown size={14} />
              {queda.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Funil com barras */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const prevValue = idx > 0 ? stages[idx - 1].value : stage.value;
          const conversionRate = prevValue > 0 ? (stage.value / prevValue) * 100 : 100;
          const percentOfTotal = baseEnviada > 0 ? (stage.value / baseEnviada) * 100 : 0;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-300 font-medium">{stage.label}</span>
                  <span className="text-slate-500 ml-2">({stage.value.toLocaleString('pt-BR')})</span>
                </div>
                <div className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className={`font-bold ${conversionRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatPercent(conversionRate)}
                    </span>
                  )}
                  <span className="text-slate-500">{formatPercent(percentOfTotal)}</span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="relative h-6 bg-slate-900/50 rounded-full overflow-hidden border border-slate-700">
                {percentOfTotal > 0 && (
                  <div
                    className={`h-full ${stage.color} transition-all duration-300 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(percentOfTotal, 3)}%` }}
                  >
                    {percentOfTotal > 8 && (
                      <span className="text-xs font-bold text-white">{formatPercent(percentOfTotal)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="pt-2 border-t border-slate-700 text-xs text-slate-500">
        <p>De {baseEnviada.toLocaleString('pt-BR')} enviadas para {emissoes.toLocaleString('pt-BR')} emissões</p>
      </div>
    </div>
  );
};
