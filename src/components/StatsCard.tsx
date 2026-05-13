import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CalendarData } from '../types/framework';
import { Tooltip } from './Tooltip';

interface StatsCardProps {
  data: CalendarData;
  comparisonData?: any;
}

export const StatsCard: React.FC<StatsCardProps> = ({ data, comparisonData }) => {
  // Calcula agregados
  const stats = React.useMemo(() => {
    try {
      let totalBaseEnviada = 0;
      let totalBaseEntregue = 0;
      let totalPropostas = 0;
      let totalAprovados = 0;
      let totalEmissoes = 0;
      let totalAberturas = 0;
      let totalCusto = 0;
      let totalCAC = 0;
      let countActivities = 0;

      Object.values(data).forEach(activities => {
        activities.forEach(activity => {
          try {
            const kpis = activity?.kpis;
            if (!kpis) return;

            if (kpis.baseEnviada) totalBaseEnviada += kpis.baseEnviada;
            if (kpis.baseEntregue) totalBaseEntregue += kpis.baseEntregue;
            if (kpis.propostas) totalPropostas += kpis.propostas;
            if (kpis.aprovados) totalAprovados += kpis.aprovados;
            if (kpis.emissoes) totalEmissoes += kpis.emissoes;
            if (kpis.taxaAbertura) totalAberturas += kpis.taxaAbertura;
            if (kpis.custoTotal) totalCusto += kpis.custoTotal;
            if (kpis.cac) totalCAC += kpis.cac;
            countActivities++;
          } catch (e) {
            console.error('Error processing activity KPIs:', e);
          }
        });
      });

      // Calcula taxas percentuais
      const percentEntrega = totalBaseEnviada > 0 ? (totalBaseEntregue / totalBaseEnviada) * 100 : 0;
      const percentPropostas = totalBaseEntregue > 0 ? (totalPropostas / totalBaseEntregue) * 100 : 0;
      const percentAprovados = totalPropostas > 0 ? (totalAprovados / totalPropostas) * 100 : 0;
      const percentFinalizacao = totalPropostas > 0 ? (totalEmissoes / totalPropostas) * 100 : 0;
      const percentConversaoBase = totalBaseEntregue > 0 ? (totalEmissoes / totalBaseEntregue) * 100 : 0;
      const avgAbertura = countActivities > 0 ? (totalAberturas / countActivities) * 100 : 0;
      const avgCAC = countActivities > 0 ? totalCAC / countActivities : 0;

      return {
        totalBaseEnviada,
        totalBaseEntregue,
        percentEntrega,
        totalPropostas,
        percentPropostas,
        totalAprovados,
        percentAprovados,
        totalEmissoes,
        percentFinalizacao,
        percentConversaoBase,
        avgAbertura,
        totalCusto,
        avgCAC,
        totalActivities: countActivities
      };
    } catch (e) {
      console.error('Error in StatsCard useMemo:', e);
      return {
        totalBaseEnviada: 0,
        totalBaseEntregue: 0,
        percentEntrega: 0,
        totalPropostas: 0,
        percentPropostas: 0,
        totalAprovados: 0,
        percentAprovados: 0,
        totalEmissoes: 0,
        percentFinalizacao: 0,
        percentConversaoBase: 0,
        avgAbertura: 0,
        totalCusto: 0,
        avgCAC: 0,
        totalActivities: 0
      };
    }
  }, [data]);

  const StatBox = ({ label, value, comparison, isGrowth }: any) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
      <div className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value || '—'}</span>
        {comparison !== undefined && comparison !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isGrowth ? 'text-green-400' : 'text-red-400'}`}>
            {isGrowth ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(Number(comparison))}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1">
        <span>KPIs</span>
        <Tooltip content={'Cálculos agregados do período exibido (prioriza Safra quando disponível). Passe o mouse nos títulos dos cards para ver fórmulas.'} />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Base Enviada */}
        <StatBox
          label="Base Enviada"
          value={stats.totalBaseEnviada.toLocaleString('pt-BR')}
          comparison={comparisonData?.baseEnviadaVariation}
          isGrowth={(comparisonData?.baseEnviadaVariation || 0) >= 0}
        />

        {/* Base Entregue */}
        <StatBox
          label="Base Entregue"
          value={stats.totalBaseEntregue.toLocaleString('pt-BR')}
          comparison={comparisonData?.baseEntregueVariation}
          isGrowth={(comparisonData?.baseEntregueVariation || 0) >= 0}
        />

        {/* % Entrega */}
        <StatBox
          label="% Entrega"
          value={`${stats.percentEntrega.toFixed(1)}%`}
        />

        {/* Propostas */}
        <StatBox
          label="Propostas"
          value={stats.totalPropostas.toLocaleString('pt-BR')}
          comparison={comparisonData?.propostasVariation}
          isGrowth={(comparisonData?.propostasVariation || 0) >= 0}
        />

        {/* % Propostas */}
        <StatBox
          label="% Propostas"
          value={`${stats.percentPropostas.toFixed(1)}%`}
        />

        {/* Aprovados */}
        <StatBox
          label="Aprovados"
          value={stats.totalAprovados.toLocaleString('pt-BR')}
          comparison={comparisonData?.aprovadosVariation}
          isGrowth={(comparisonData?.aprovadosVariation || 0) >= 0}
        />

        {/* % Aprovados */}
        <StatBox
          label="% Aprovados"
          value={`${stats.percentAprovados.toFixed(1)}%`}
        />

        {/* Emissões */}
        <StatBox
          label="Emissões"
          value={stats.totalEmissoes.toLocaleString('pt-BR')}
          comparison={comparisonData?.emissoesVariation}
          isGrowth={(comparisonData?.emissoesVariation || 0) >= 0}
        />

        {/* % Finalização */}
        <StatBox
          label="% Finalização"
          value={`${stats.percentFinalizacao.toFixed(1)}%`}
        />

        {/* % Conversão Base */}
        <StatBox
          label="% Conv. Base"
          value={`${stats.percentConversaoBase.toFixed(1)}%`}
        />

        {/* CAC */}
        <StatBox
          label="CAC"
          value={`R$ ${stats.avgCAC.toFixed(2)}`}
        />

        {/* Custo Total */}
        <StatBox
          label="Custo Total"
          value={`R$ ${stats.totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          comparison={comparisonData?.custoVariation}
          isGrowth={(comparisonData?.custoVariation || 0) >= 0}
        />
      </div>
    </div>
  );
};
