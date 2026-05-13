import React from 'react';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { CalendarData } from '../types/framework';
import { Tooltip } from './Tooltip';
import { useExport } from '../hooks/useExport';

interface StatsCardProps {
  data: CalendarData;
  comparisonData?: any;
}

export const StatsCard: React.FC<StatsCardProps> = ({ data, comparisonData }) => {
  const { exportJourneyCSV, exportActivityCSV } = useExport();
  const ym = React.useMemo(() => {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const d = new Date(keys[0]);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [data]);
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

      Object.values(data).forEach((activities) => {
        activities.forEach((activity) => {
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
        });
      });

      const percentEntrega = totalBaseEnviada > 0 ? (totalBaseEntregue / totalBaseEnviada) * 100 : 0;
      const percentPropostas = totalBaseEntregue > 0 ? (totalPropostas / totalBaseEntregue) * 100 : 0;
      const percentAprovados = totalPropostas > 0 ? (totalAprovados / totalPropostas) * 100 : 0;
      const percentFinalizacao = totalPropostas > 0 ? (totalEmissoes / totalPropostas) * 100 : 0;
      const percentConversaoBase = totalBaseEntregue > 0 ? (totalEmissoes / totalBaseEntregue) * 100 : 0;
      const avgAbertura = countActivities > 0 ? (totalAberturas / countActivities) * 100 : 0;
      // CAC calculado como Custo Total / Emissões (alinha com Pivot)
      const avgCAC = totalEmissoes > 0 ? totalCusto / totalEmissoes : 0;

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
        totalActivities: countActivities,
      };
    } catch {
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
        totalActivities: 0,
      };
    }
  }, [data]);

  const StatBox = ({ label, value, comparison, isGrowth, tip }: any) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
      <div className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
        <span>{label}</span>
        {tip && <Tooltip content={tip} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value || '-'}</span>
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
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-300">KPIs</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportJourneyCSV(data, `journey_${ym}.csv`)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
            title="Exportar CSV consolidado por Jornada (Segmento)"
          >
            <Download size={14} /> CSV Jornada
          </button>
          <button
            onClick={() => exportActivityCSV(data, `disparos_${ym}.csv`)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
            title="Exportar CSV por Disparo (Activity)"
          >
            <Download size={14} /> CSV Disparos
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatBox
          label="Base Enviada"
          value={stats.totalBaseEnviada.toLocaleString('pt-BR')}
          comparison={comparisonData?.baseEnviadaVariation}
          isGrowth={(comparisonData?.baseEnviadaVariation || 0) >= 0}
          tip={'Soma da Base Enviada no período (prioriza Safra quando disponível).'}
        />
        <StatBox
          label="Base Entregue"
          value={stats.totalBaseEntregue.toLocaleString('pt-BR')}
          comparison={comparisonData?.baseEntregueVariation}
          isGrowth={(comparisonData?.baseEntregueVariation || 0) >= 0}
          tip={'Soma da Base Entregue no período. % Entrega = Base Entregue / Base Enviada.'}
        />
        <StatBox 
          label="% Entrega" 
          value={`${stats.percentEntrega.toFixed(1)}%`}
          comparison={comparisonData?.percentEntregaVariation}
          isGrowth={(comparisonData?.percentEntregaVariation || 0) >= 0}
          tip={'Base Entregue / Base Enviada.'}
        />
        <StatBox
          label="Propostas"
          value={stats.totalPropostas.toLocaleString('pt-BR')}
          comparison={comparisonData?.propostasVariation}
          isGrowth={(comparisonData?.propostasVariation || 0) >= 0}
          tip={'Soma de Propostas no período.'}
        />
        <StatBox 
          label="% Propostas" 
          value={`${stats.percentPropostas.toFixed(1)}%`}
          comparison={comparisonData?.percentPropostasVariation}
          isGrowth={(comparisonData?.percentPropostasVariation || 0) >= 0}
          tip={'Propostas / Base Entregue.'}
        />
        <StatBox
          label="Aprovados"
          value={stats.totalAprovados.toLocaleString('pt-BR')}
          comparison={comparisonData?.aprovadosVariation}
          isGrowth={(comparisonData?.aprovadosVariation || 0) >= 0}
          tip={'Soma de Aprovados no período.'}
        />
        <StatBox 
          label="% Aprovados" 
          value={`${stats.percentAprovados.toFixed(1)}%`}
          comparison={comparisonData?.percentAprovadosVariation}
          isGrowth={(comparisonData?.percentAprovadosVariation || 0) >= 0}
          tip={'Aprovados / Propostas.'}
        />
        <StatBox
          label="Emissões"
          value={stats.totalEmissoes.toLocaleString('pt-BR')}
          comparison={comparisonData?.emissoesVariation}
          isGrowth={(comparisonData?.emissoesVariation || 0) >= 0}
          tip={'Soma de Emissões no período. Conv. Geral = Emissões / Base Enviada.'}
        />
        <StatBox 
          label="% Finalização" 
          value={`${stats.percentFinalizacao.toFixed(1)}%`}
          comparison={comparisonData?.percentFinalizacaoVariation}
          isGrowth={(comparisonData?.percentFinalizacaoVariation || 0) >= 0}
          tip={'Emissões / Propostas.'}
        />
        <StatBox 
          label="% Conv. Base" 
          value={`${stats.percentConversaoBase.toFixed(1)}%`}
          comparison={comparisonData?.percentConversaoBaseVariation}
          isGrowth={(comparisonData?.percentConversaoBaseVariation || 0) >= 0}
          tip={'Emissões / Base Entregue.'}
        />
        <StatBox
          label="CAC"
          value={`R$ ${stats.avgCAC.toFixed(2)}`}
          comparison={comparisonData?.cacVariation}
          isGrowth={(comparisonData?.cacVariation || 0) >= 0}
          tip={'Custo Total / Emissões do período.'}
        />
        <StatBox
          label="Custo Total"
          value={`R$ ${stats.totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          comparison={comparisonData?.custoVariation}
          isGrowth={(comparisonData?.custoVariation || 0) >= 0}
          tip={'Soma do Custo Total das atividades do período.'}
        />
      </div>

      
    </div>
  );
};
