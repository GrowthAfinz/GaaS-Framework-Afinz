import React, { useMemo } from 'react';
import { TrendingUp, Award, Target } from 'lucide-react';
import { StrategyMetrics } from '../types/strategy';

interface ExecutiveDashboardProps {
  resultados: StrategyMetrics;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ resultados }) => {
  const sortedResultados = Object.values(resultados).sort((a, b) => b.totalCartoes - a.totalCartoes);

  // Calcular totalizadores
  const totals = useMemo(() => {
    let totalCartoes = 0;
    let totalCusto = 0;
    let totalAtividades = 0;
    let somaCAC = 0;
    let somaEntrega = 0;
    let count = 0;

    sortedResultados.forEach((resultado) => {
      totalCartoes += resultado.totalCartoes || 0;
      totalCusto += resultado.custoTotal || 0;
      totalAtividades += resultado.atividades || 0;
      somaCAC += resultado.cacMédio || 0;
      somaEntrega += resultado.taxaEntregaMédia || 0;
      count++;
    });

    return {
      totalCartoes,
      totalCusto,
      totalAtividades,
      cacMédio: count > 0 ? somaCAC / count : 0,
      entregaMédia: count > 0 ? somaEntrega / count : 0,
      eficiência: totalAtividades > 0 ? (totalCartoes / totalAtividades).toFixed(2) : 0,
      parceirosAtivos: count,
    };
  }, [sortedResultados]);

  // Top 5 por métrica
  const topCartoes = sortedResultados.slice(0, 5);
  const topEficiencia = [...sortedResultados]
    .sort((a, b) => (b.totalCartoes / b.atividades) - (a.totalCartoes / a.atividades))
    .slice(0, 5);
  const topCAC = [...sortedResultados]
    .sort((a, b) => a.cacMédio - b.cacMédio)
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">📊 Dashboard Executivo</h1>
        <p className="text-sm text-slate-400">Visão consolidada de performance</p>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg p-4 border border-blue-700">
          <p className="text-xs text-blue-200 mb-1">Total de Cartões</p>
          <p className="text-3xl font-bold text-white">{totals.totalCartoes.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-blue-300 mt-2">Período atual</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg p-4 border border-purple-700">
          <p className="text-xs text-purple-200 mb-1">CAC Médio</p>
          <p className="text-3xl font-bold text-white">R$ {totals.cacMédio.toFixed(2)}</p>
          <p className="text-xs text-purple-300 mt-2">{totals.parceirosAtivos} parceiros</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-lg p-4 border border-emerald-700">
          <p className="text-xs text-emerald-200 mb-1">Eficiência</p>
          <p className="text-3xl font-bold text-white">{totals.eficiência}</p>
          <p className="text-xs text-emerald-300 mt-2">cartões/atividade</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-900 rounded-lg p-4 border border-orange-700">
          <p className="text-xs text-orange-200 mb-1">Custo Total</p>
          <p className="text-3xl font-bold text-white">R$ {(totals.totalCusto / 1000).toFixed(1)}k</p>
          <p className="text-xs text-orange-300 mt-2">Em {totals.totalAtividades} atividades</p>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top por Cartões */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Top por Cartões
          </h2>
          <div className="space-y-2">
            {topCartoes.map((resultado, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{idx + 1}. {resultado.nome}</p>
                  <p className="text-xs text-slate-400">{resultado.bu.join(', ')}</p>
                </div>
                <span className="text-lg font-bold text-blue-400">{resultado.totalCartoes.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top por Eficiência */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            Top por Eficiência
          </h2>
          <div className="space-y-2">
            {topEficiencia.map((resultado, idx) => {
              const eff = (resultado.totalCartoes / resultado.atividades).toFixed(2);
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{idx + 1}. {resultado.nome}</p>
                    <p className="text-xs text-slate-400">{resultado.atividades} atividades</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">{eff}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Melhor CAC */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Target size={20} className="text-pink-400" />
            Melhor CAC
          </h2>
          <div className="space-y-2">
            {topCAC.map((resultado, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{idx + 1}. {resultado.nome}</p>
                  <p className="text-xs text-slate-400">{resultado.totalCartoes} cartões</p>
                </div>
                <span className="text-lg font-bold text-pink-400">R$ {resultado.cacMédio.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas de Médias */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-4">📈 Médias de Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded p-4">
            <p className="text-xs text-slate-400 mb-2">Taxa de Entrega Média</p>
            <p className="text-2xl font-bold text-cyan-400">{(totals.entregaMédia * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <p className="text-xs text-slate-400 mb-2">Parceiros Ativos</p>
            <p className="text-2xl font-bold text-blue-400">{totals.parceirosAtivos}</p>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <p className="text-xs text-slate-400 mb-2">Atividades Total</p>
            <p className="text-2xl font-bold text-purple-400">{totals.totalAtividades.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-slate-900/50 rounded p-4">
            <p className="text-xs text-slate-400 mb-2">CPM (Custo por 1000)</p>
            <p className="text-2xl font-bold text-orange-400">
              R$ {totals.totalCartoes > 0 ? ((totals.totalCusto / totals.totalCartoes) * 1000).toFixed(2) : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
