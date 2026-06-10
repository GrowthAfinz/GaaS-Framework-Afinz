import React, { useState, useMemo } from 'react';
import { useExperiments } from '../../hooks/useExperiments';
import { ExperimentKanban } from '../experiments/ExperimentKanban';
import { LearningRepository } from '../experiments/LearningRepository';
import { ProgramaView } from '../experiments/ProgramaView';
import { ExperimentDetailModal } from '../experiments/ExperimentDetailModal';
import { ExperimentModal } from '../experiments/ExperimentModal';
import { FlaskConical, Plus } from 'lucide-react';
import type { Experiment } from '../../types/experiments';

type SubTab = 'kanban' | 'aprendizados' | 'programa';

export const ExperimentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('kanban');
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const {
    experiments,
    metricsMap,
    loading,
    error,
    refetch,
    createExperiment,
    updateExperimentStatus,
    concludeExperiment,
    incrementViewCount
  } = useExperiments();

  // Calculate ICE Score helper
  const getIceScore = (exp: Experiment): number => {
    const impact = (exp as any).ice_impact ?? 5;
    const confidence = (exp as any).ice_confidence ?? 5;
    const ease = (exp as any).ice_ease ?? 5;
    return impact * confidence * ease;
  };

  // Group and sort experiments by status for the Kanban columns
  const byStatus = useMemo(() => {
    const backlog = experiments
      .filter(e => e.status === 'backlog')
      .sort((a, b) => getIceScore(b) - getIceScore(a)); // Sort by ICE descending

    const rodando = experiments
      .filter(e => e.status === 'rodando')
      .sort((a, b) => {
        // Sort by days running descending (oldest first)
        const dateA = a.iniciado_em ? new Date(a.iniciado_em).getTime() : 0;
        const dateB = b.iniciado_em ? new Date(b.iniciado_em).getTime() : 0;
        return dateA - dateB;
      });

    const concluido = experiments
      .filter(e => e.status === 'concluido')
      .sort((a, b) => {
        // Sort by closure date descending (newest first)
        const dateA = a.encerrado_em ? new Date(a.encerrado_em).getTime() : 0;
        const dateB = b.encerrado_em ? new Date(b.encerrado_em).getTime() : 0;
        return dateB - dateA;
      });

    return { backlog, rodando, concluido };
  }, [experiments]);

  const handleCardClick = (id: string) => {
    setSelectedExpId(id);
    incrementViewCount(id);
  };

  const handleDragTransition = async (
    id: string, 
    from: Experiment['status'], 
    to: Experiment['status']
  ) => {
    // If moving to concluded, open modal to force findings entry & final decision
    if (to === 'concluido') {
      setSelectedExpId(id);
      return;
    }

    try {
      await updateExperimentStatus(id, to);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDecision = async (
    decisao: 'validado' | 'refutado' | 'inconclusivo', 
    aprendizado: string
  ) => {
    if (!selectedExpId) return;
    try {
      await concludeExperiment(selectedExpId, decisao, aprendizado);
      setSelectedExpId(null);
    } catch (err) {
      console.error('Failed to conclude experiment:', err);
    }
  };

  const handleCreateExperiment = async (data: {
    titulo: string;
    hipotese: string;
    status: 'backlog';
    definicao: any;
  }) => {
    try {
      await createExperiment(data);
      setShowNewModal(false);
    } catch (err) {
      console.error('Failed to create experiment:', err);
      throw err;
    }
  };

  const selectedExp = experiments.find(e => e.id === selectedExpId);
  const selectedStats = selectedExpId ? metricsMap[selectedExpId] : undefined;

  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      {/* View Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-purple-600" size={20} />
            Gestor de Experimentos GaaS
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Registre suas hipóteses, monitore testes A/B ativos e consulte a base de aprendizados acumulados.
          </p>
        </div>
        
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={14} />
          Nova Hipótese
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200 mb-4 bg-slate-50/50 p-1.5 rounded-lg">
        {[
          { id: 'kanban', label: 'Quadro Kanban' },
          { id: 'aprendizados', label: 'Repositório de Aprendizados' },
          { id: 'programa', label: 'Análise do Programa' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SubTab)}
            className={[
              'px-4 py-1.5 text-xs font-semibold rounded-md transition-all',
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            ].join(' ')}
          >
            {tab.label}
            {tab.id === 'kanban' && (
              <span className="ml-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {experiments.filter(e => e.status !== 'concluido').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {loading && experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent mb-2" />
            Carregando experimentos e métricas...
          </div>
        ) : error ? (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 leading-snug">
            Ocorreu um erro ao carregar os dados: {error}
            <button onClick={refetch} className="block mt-2 font-bold text-blue-600 hover:underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            {activeTab === 'kanban' && (
              <div className="h-full overflow-hidden">
                <ExperimentKanban
                  byStatus={byStatus}
                  metricsMap={metricsMap}
                  onCardClick={handleCardClick}
                  onDragTransition={handleDragTransition}
                />
              </div>
            )}

            {activeTab === 'aprendizados' && (
              <div className="h-full overflow-hidden">
                <LearningRepository
                  learnings={byStatus.concluido}
                  onSelect={handleCardClick}
                />
              </div>
            )}

            {activeTab === 'programa' && (
              <div className="h-full overflow-hidden">
                <ProgramaView experiments={experiments} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedExp && (
        <ExperimentDetailModal
          experiment={selectedExp}
          stats={selectedStats}
          onClose={() => setSelectedExpId(null)}
          onDecision={handleDecision}
        />
      )}

      {/* Creation Modal */}
      {showNewModal && (
        <ExperimentModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateExperiment}
        />
      )}
    </div>
  );
};
