import { useState, useMemo } from 'react';
import { StrategyMetrics } from '../types/strategy';
import { DistributionAnalysis } from './DistributionAnalysis';
import { GoalsVisualization } from './GoalsVisualization';
import { GoalsModal } from './GoalsModal';
import { ProjectionsSection } from './resultados/ProjectionsSection';
import { PeriodComparisonBanner } from './resultados/PeriodComparisonBanner';
import { useGoals } from '../hooks/useGoals';
import { useMonthComparison } from '../hooks/useMonthComparison';
import { CalendarData, Activity } from '../types/framework';
import { Target, TrendingUp } from 'lucide-react';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { aggregateMetrics } from '../utils/activityMetrics';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';

interface ResultadosViewProps {
  resultados: StrategyMetrics;
  data: CalendarData;
  selectedBU?: string;
}

export const ResultadosView: React.FC<ResultadosViewProps> = ({ resultados, data, selectedBU }) => {
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const { getGoal, saveGoal } = useGoals();
  const rentab = useAppStore((s) => s.viewSettings.frente === 'rentabilizacao');

  // Resumo de engajamento (frente Rentabilização) — Cartões/CAC não se aplicam.
  const engajamento = useMemo(() => {
    const agg = aggregateMetrics(Object.values(data).flat());
    return {
      ...agg,
      taxaEntrega: agg.baseEnviada > 0 ? agg.baseEntregue / agg.baseEnviada : 0,
      taxaAbertura: agg.baseEntregue > 0 ? agg.aberturas / agg.baseEntregue : 0,
      taxaClique: agg.aberturas > 0 ? agg.cliques / agg.aberturas : 0,
    };
  }, [data]);

  // Modal State
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [dailyModalDate, setDailyModalDate] = useState<Date | null>(null);

  const handleDayClick = (dateStr: string) => {
    const activities = data[dateStr] || [];
    const [y, m, d] = dateStr.split('-').map(Number);

    setDailyModalDate(new Date(y, m - 1, d));
    setSelectedActivities(activities);
    setDailyModalOpen(true);
  };


  // Determinar mês atual baseado nos dados (pega o mês mais recente com dados)
  const currentMonthKey = Object.keys(data).sort().pop()?.substring(0, 7) || new Date().toISOString().substring(0, 7);
  const comparisonMonth = useMemo(() => {
    const [yearValue, monthValue] = currentMonthKey.split('-').map(Number);
    const fallbackDate = new Date();

    return {
      year: Number.isFinite(yearValue) ? yearValue : fallbackDate.getFullYear(),
      month: Number.isFinite(monthValue) ? monthValue - 1 : fallbackDate.getMonth(),
    };
  }, [currentMonthKey]);
  const { aggregatedComparison } = useMonthComparison(data, true, comparisonMonth);
  const fullGoal = getGoal(currentMonthKey);

  // Determine active goal based on selection
  const currentGoal = useMemo(() => {
    if (selectedBU && fullGoal.bus && fullGoal.bus[selectedBU]) {
      return {
        mes: fullGoal.mes,
        cartoes_meta: fullGoal.bus[selectedBU].cartoes,
        aprovacoes_meta: fullGoal.bus[selectedBU].aprovacoes,
        cac_max: fullGoal.bus[selectedBU].cac
      };
    }
    return fullGoal;
  }, [fullGoal, selectedBU]);

  const sortedResultados = Object.values(resultados).sort((a, b) => b.totalCartoes - a.totalCartoes);

  // Calcular totais para o GoalsVisualization
  const totalCartoes = sortedResultados.reduce((acc, curr) => acc + curr.totalCartoes, 0);
  let totalAprovacoes = 0;
  let totalCusto = 0;
  Object.values(data).flat().forEach(activity => {
    totalAprovacoes += activity.kpis.aprovados || 0;
    totalCusto += activity.kpis.custoTotal || 0;
  });

  const currentCAC = totalCartoes > 0 ? totalCusto / totalCartoes : 0;

  if (!rentab && Object.keys(resultados).length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        Nenhum resultado registrado
      </div>
    );
  }

  const engajamentoCards = [
    { label: 'Disparos', value: engajamento.disparos.toLocaleString('pt-BR') },
    { label: 'Base Enviada', value: Math.round(engajamento.baseEnviada).toLocaleString('pt-BR') },
    { label: 'Base Entregue', value: Math.round(engajamento.baseEntregue).toLocaleString('pt-BR'), hint: `Entrega: ${(engajamento.taxaEntrega * 100).toFixed(1)}%` },
    { label: 'Aberturas', value: Math.round(engajamento.aberturas).toLocaleString('pt-BR'), hint: `Abertura: ${(engajamento.taxaAbertura * 100).toFixed(1)}%`, accent: 'text-cyan-700' },
    { label: 'Cliques', value: Math.round(engajamento.cliques).toLocaleString('pt-BR'), hint: `Clique: ${(engajamento.taxaClique * 100).toFixed(1)}%`, accent: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {!rentab && (
        <PeriodComparisonBanner
          comparison={aggregatedComparison}
          year={comparisonMonth.year}
          month={comparisonMonth.month}
        />
      )}
      {/* 1. Análise de Distribuição */}
      {!rentab && <DistributionAnalysis data={data} />}

      {rentab ? (
        /* Frente Rentabilização: resumo de engajamento (sem metas/CAC nesta fase) */
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-emerald-500" />
            Engajamento da Rentabilização <span className="text-slate-500 text-sm font-normal">({selectedBU || 'Global'})</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">Metas de rentabilização ainda não configuradas — exibindo desempenho de engajamento do período.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {engajamentoCards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{c.label}</p>
                <p className={`mt-2 font-mono text-2xl font-semibold ${c.accent || 'text-slate-900'}`}>{c.value}</p>
                <p className="mt-1 text-xs text-slate-500">{c.hint || ' '}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Projections Section (Evolução + Projeção do Mês) */}
          <ProjectionsSection
            data={data}
            currentGoal={currentGoal}
            selectedBU={selectedBU}
            onPointClick={(date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              handleDayClick(dateStr);
            }}
          />

          {/* 3. Meta vs Realizado | Comparativo de Canais */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-blue-400" />
                  Meta vs. Realizado <span className="text-slate-500 text-sm font-normal">({selectedBU || 'Global'})</span>
                </h2>
                <button
                  onClick={() => setIsGoalsModalOpen(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Definir Metas
                </button>
              </div>

              <GoalsVisualization
                goal={currentGoal}
                currentCartoes={totalCartoes}
                currentAprovacoes={totalAprovacoes}
                currentCAC={currentCAC}
                scope={selectedBU || 'Global'}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal de Metas */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onSave={saveGoal}
        initialGoal={fullGoal}
        currentMonthLabel={currentMonthKey}
      />

      {dailyModalOpen && (
        <DailyDetailsModal
          date={dailyModalDate}
          activities={selectedActivities}
          onClose={() => setDailyModalOpen(false)}
        />
      )}
    </div>
  );
};
