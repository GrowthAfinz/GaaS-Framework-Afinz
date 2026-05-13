import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Pause } from 'lucide-react';
import { StrategyMetrics } from '../types/strategy';

interface StrategyViewProps {
  strategies: StrategyMetrics;
}

export const StrategyView: React.FC<StrategyViewProps> = ({ strategies }) => {
  const sortedStrategies = Object.values(strategies).sort((a, b) => b.totalCartoes - a.totalCartoes);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'parado':
        return <Pause className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'parado':
        return 'Parado';
      default:
        return 'Em Progresso';
    }
  };

  if (Object.keys(strategies).length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Nenhuma estratégia/campanha registrada
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-100">Estratégias / Campanhas por Segmento</h2>
        <div className="text-sm text-slate-400">Total: {sortedStrategies.length}</div>
      </div>

      <div className="grid gap-3">
        {sortedStrategies.map((strategy, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(strategy.status)}
                <div>
                  <h3 className="font-semibold text-slate-100">{strategy.nome}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    {strategy.bu.join(', ')} • {strategy.atividades} atividades
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-300">{getStatusLabel(strategy.status)}</div>
                {strategy.variacao !== 0 && (
                  <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                    strategy.variacao >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {strategy.variacao >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(strategy.variacao).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">Cartões</div>
                <div className="text-lg font-bold text-slate-200">
                  {strategy.totalCartoes.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">Entrega</div>
                <div className="text-lg font-bold text-slate-200">
                  {(strategy.taxaEntregaMédia * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">Abertura</div>
                <div className="text-lg font-bold text-slate-200">
                  {(strategy.taxaAberturaMédia * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">Proposta</div>
                <div className="text-lg font-bold text-slate-200">
                  {(strategy.taxaPropostaMédia * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">CAC</div>
                <div className="text-lg font-bold text-slate-200">
                  R$ {strategy.cacMédio.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">Custo Total</div>
                <div className="text-lg font-bold text-slate-200">
                  R$ {(strategy.custoTotal / 1000).toFixed(1)}k
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
