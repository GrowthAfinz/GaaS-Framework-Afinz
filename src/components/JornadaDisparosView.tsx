import React, { useMemo, useState } from 'react';
import { BarChart2, AlertTriangle, Filter, X } from 'lucide-react';
import { CalendarData, AnomalyType } from '../types/framework';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { PerformanceEvolutionChart } from './jornada/PerformanceEvolutionChart';
import { InsightDeckModal } from './jornada/InsightDeckModal';
import { Tooltip } from './Tooltip';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';

interface JornadaDisparosViewProps {
  data: CalendarData;
  previousData?: CalendarData;
  selectedBU?: string;
  selectedCanais?: string[];
  selectedSegmentos?: string[];
  selectedParceiros?: string[];
}

export const JornadaDisparosView: React.FC<JornadaDisparosViewProps> = ({
  data,
  selectedBU,
  selectedCanais = [],
  selectedSegmentos = [],
  selectedParceiros = [],
}) => {
  const [chartMode, setChartMode] = useState<'performance' | 'anomalies'>('performance');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAnomalyFilters, setSelectedAnomalyFilters] = useState<AnomalyType[]>([]);

  const { viewSettings, setGlobalFilters } = useAppStore();
  const globalFilters = viewSettings.filtrosGlobais;
  const rentab = viewSettings.frente === 'rentabilizacao';

  const hasActiveFilters = useMemo(() => {
    return (
      (globalFilters.bu ?? []).length > 0 ||
      (globalFilters.canais ?? []).length > 0 ||
      (globalFilters.segmentos ?? []).length > 0 ||
      (globalFilters.parceiros ?? []).length > 0
    );
  }, [globalFilters]);

  const kpis = useMemo(() => {
    let totalBaseEnviada = 0;
    let totalBaseEntregue = 0;
    let totalAberturas = 0;
    let totalCliques = 0;
    let totalPropostas = 0;
    let totalAprovados = 0;
    let totalCartoes = 0;
    let totalCusto = 0;
    let totalAtividades = 0;

    Object.values(data).forEach((activities) => {
      activities.forEach((activity) => {
        totalBaseEnviada += activity.kpis.baseEnviada || 0;
        totalBaseEntregue += activity.kpis.baseEntregue || 0;
        totalAberturas += activity.kpis.aberturas || 0;
        totalCliques += activity.kpis.cliques || 0;
        totalPropostas += activity.kpis.propostas || 0;
        totalAprovados += activity.kpis.aprovados || 0;
        totalCartoes += activity.kpis.cartoes || 0;
        totalCusto += activity.kpis.custoTotal || 0;
        totalAtividades += 1;
      });
    });

    const taxaEntrega = totalBaseEnviada > 0 ? (totalBaseEntregue / totalBaseEnviada) * 100 : 0;
    // Aquisição usa Propostas como proxy de abertura; Rentabilização usa aberturas reais.
    const taxaAbertura = totalBaseEntregue > 0
      ? ((rentab ? totalAberturas : totalPropostas) / totalBaseEntregue) * 100
      : 0;
    const taxaClique = totalAberturas > 0 ? (totalCliques / totalAberturas) * 100 : 0;
    const taxaAprovação = totalPropostas > 0 ? (totalAprovados / totalPropostas) * 100 : 0;
    const taxaConversao = totalBaseEnviada > 0 ? (totalCartoes / totalBaseEnviada) * 100 : 0;
    const cacMedio = totalCartoes > 0 ? totalCusto / totalCartoes : 0;

    return {
      baseEnviada: totalBaseEnviada,
      baseEntregue: totalBaseEntregue,
      aberturas: totalAberturas,
      cliques: totalCliques,
      propostas: totalPropostas,
      aprovados: totalAprovados,
      cartoes: totalCartoes,
      custo: totalCusto,
      atividades: totalAtividades,
      taxaEntrega,
      taxaAbertura,
      taxaClique,
      taxaAprovação,
      taxaConversao,
      cacMedio
    };
  }, [data, rentab]);

  const toggleAnomalyFilter = (filter: AnomalyType) => {
    setSelectedAnomalyFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
  };

  const selectedActivities = useMemo(() => {
    if (!selectedDate) return [];

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const activities = data[dateKey] || [];

    return activities.filter((activity) => {
      if (selectedBU && activity.bu !== selectedBU) return false;
      if (selectedCanais.length > 0 && !selectedCanais.includes(activity.canal)) return false;
      if (selectedSegmentos.length > 0 && !selectedSegmentos.includes(activity.segmento)) return false;
      if (selectedParceiros.length > 0 && !selectedParceiros.includes(activity.parceiro)) return false;
      return true;
    });
  }, [data, selectedDate, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros]);

  return (
    <div className="flex flex-col gap-6 bg-slate-50 p-6">
      <DailyDetailsModal
        date={selectedDate}
        activities={selectedActivities}
        anomalyFilters={selectedAnomalyFilters}
        onClose={() => setSelectedDate(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            Jornada & Disparos
            <Tooltip content="Visão geral do funil de conversão, do disparo até emissão, com identificação automática de gargalos e anomalias." />
          </h1>
          <p className="text-sm text-slate-500">Análise profunda de conversão e identificação de gargalos</p>
          <p className="text-xs text-slate-500 mt-1">
            Total de Atividades no Período: {Object.values(data).reduce((acc, curr) => acc + curr.length, 0)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {chartMode === 'anomalies' && (
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 gap-1">
                {[
                  { id: 'pending', label: 'Pendente' },
                  { id: 'no_sent', label: 'Sem Envio' },
                  { id: 'no_delivered', label: 'Sem Entrega' },
                  { id: 'no_open', label: 'Sem Abertura' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => toggleAnomalyFilter(filter.id as AnomalyType)}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${selectedAnomalyFilters.includes(filter.id as AnomalyType)
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
                {selectedAnomalyFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedAnomalyFilters([])}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 border-l border-slate-200 ml-1 pl-2"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <Tooltip content="Filtre as anomalias por tipo para focar em problemas específicos." />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setChartMode('performance')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${chartMode === 'performance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
              >
                <BarChart2 size={16} />
                Performance
              </button>
              <button
                onClick={() => setChartMode('anomalies')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${chartMode === 'anomalies'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
              >
                <AlertTriangle size={16} />
                Anomalias
              </button>
            </div>
            <Tooltip content="Alterne entre visão de performance e investigação de anomalias." side="left" />
          </div>
        </div>
      </div>

      {/* Registro de Filtros Aplicados (Salesforce Style) */}
      {hasActiveFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_8px_24px_rgba(15,23,42,0.02)] flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            Filtros Ativos:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {(globalFilters.bu ?? []).map((buItem) => (
              <span key={`bu-${buItem}`} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                BU: {buItem}
                <button
                  onClick={() => setGlobalFilters({ bu: globalFilters.bu.filter((x) => x !== buItem) })}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {(globalFilters.canais ?? []).map((channelItem) => (
              <span key={`canal-${channelItem}`} className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                Canal: {channelItem}
                <button
                  onClick={() => setGlobalFilters({ canais: globalFilters.canais.filter((x) => x !== channelItem) })}
                  className="hover:bg-teal-100 rounded-full p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {(globalFilters.segmentos ?? []).map((segItem) => (
              <span key={`seg-${segItem}`} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full font-semibold max-w-[200px]">
                <span className="truncate">Campanha: {segItem}</span>
                <button
                  onClick={() => setGlobalFilters({ segmentos: globalFilters.segmentos.filter((x) => x !== segItem) })}
                  className="hover:bg-purple-100 rounded-full p-0.5 transition-colors flex-shrink-0"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {(globalFilters.parceiros ?? []).map((parcItem) => (
              <span key={`parc-${parcItem}`} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                Parceiro: {parcItem}
                <button
                  onClick={() => setGlobalFilters({ parceiros: globalFilters.parceiros.filter((x) => x !== parcItem) })}
                  className="hover:bg-amber-100 rounded-full p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => setGlobalFilters({ bu: [], canais: [], segmentos: [], parceiros: [], subgrupos: [], ofertas: [] })}
            className="text-xs text-red-500 hover:text-red-700 font-bold ml-auto"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Painel de KPIs Ponderados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Atividades no Período</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900">{kpis.atividades}</p>
          <p className="mt-1 text-xs text-slate-500">Disparos no escopo</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Volume Acionado (Base)</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900">{kpis.baseEnviada.toLocaleString('pt-BR')}</p>
          <p className="mt-1 text-xs text-slate-500">Total de clientes enviados</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Taxa de Entrega Média</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900">{kpis.taxaEntrega.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">Sucesso no recebimento</p>
        </div>
        {rentab ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Aberturas</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-slate-900">{kpis.aberturas.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-slate-500">Taxa: {kpis.taxaAbertura.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Cliques &amp; Taxa</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{kpis.cliques.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-slate-500">Taxa de Clique: {kpis.taxaClique.toFixed(1)}%</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Cartões Gerados</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-slate-900">{kpis.cartoes.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-slate-500">Emissões finais validadas</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">CAC Médio & Custo</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">R$ {kpis.cacMedio.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">Total: R$ {Math.round(kpis.custo).toLocaleString('pt-BR')}</p>
            </div>
          </>
        )}
      </div>

      {/* Análise de Evolução (largura total) */}
      <PerformanceEvolutionChart
        data={data}
        selectedBU={selectedBU}
        selectedCanais={selectedCanais}
        selectedSegmentos={selectedSegmentos}
        selectedParceiros={selectedParceiros}
        onDayClick={(dateStr) => {
          const date = new Date(`${dateStr}T00:00:00`);
          setSelectedDate(date);
        }}
      />

      {/* Insight Deck (botão flutuante + modal) — substitui a Análise de Gargalos */}
      <InsightDeckModal />
    </div>
  );
};


