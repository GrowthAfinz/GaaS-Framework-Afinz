/**
 * BudgetTabV2
 *
 * Main budget management interface
 * Two-level hierarchy: Objective > Campaign
 * Features: Visualization, CRUD, Intelligent reallocation
 */

import React, { useState, useMemo } from 'react';
import { dataService } from '../../../../services/dataService';
import { useBudgetHierarchy } from '../../hooks/useBudgetHierarchy';
import { useFilters } from '../../context/FilterContext';
import { ObjectiveBudgetCard } from '../ObjectiveBudgetCard';
import { CampaignBudgetTable } from '../CampaignBudgetTable';
import { EditCampaignBudgetModal } from '../Modals/EditCampaignBudgetModal';
import { RealocateBudgetOrchestrator } from '../Modals/RealocateBudgetOrchestrator';
import { CampaignBudget, ObjectiveBudget } from '../../types/budget';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export const BudgetTabV2: React.FC = () => {
  const { filters } = useFilters();
  const currentMonth = format(filters.dateRange.to || new Date(), 'MM/yyyy');

  // Data fetching
  const { objectives, campaigns, status, loading, error, refetch } = useBudgetHierarchy(currentMonth);

  // Modals state
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignBudget | undefined>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReallocateOpen, setIsReallocateOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get campaigns for expanded objective
  const campaignsForObjective = useMemo(() => {
    if (!expandedObjective) return [];
    return campaigns.filter((c) => c.objective_budget_id === expandedObjective);
  }, [campaigns, expandedObjective]);

  // Handle save campaign
  const handleSaveCampaign = async (campaign: Omit<CampaignBudget, 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const campaignWithId = {
        ...campaign,
        id: campaign.id || crypto.randomUUID(),
      };
      await dataService.upsertCampaignBudget(campaignWithId);
      await refetch();
      setIsEditModalOpen(false);
      setEditingCampaign(undefined);
    } catch (err) {
      console.error('Error saving campaign:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta campanha?')) return;

    setIsLoading(true);
    try {
      await dataService.deleteCampaignBudget(id);
      await refetch();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Erro ao deletar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reallocation
  const handleConfirmReallocation = async (reallocations: Array<{ id: string; allocatedBudget: number }>) => {
    setIsLoading(true);
    try {
      await dataService.updateCampaignBudgetAllocations(reallocations);
      await refetch();
      setIsReallocateOpen(null);
    } catch (err) {
      console.error('Error reallocating budget:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-medium">Erro ao carregar orçamentos</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Orçamento — {currentMonth}</h2>
        <p className="text-slate-500 mt-1">
          Acompanhe seus gastos diários vs planejado com projeções em tempo real
        </p>
      </div>

      {/* Overall Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Planejado Total',
            value: objectives.reduce((s, o) => s + o.totalBudget, 0),
            color: 'text-slate-800',
          },
          {
            label: 'Realizado Total',
            value: status.cumulativeActual,
            color: 'text-blue-600',
          },
          {
            label: 'Projeção',
            value: status.projectionFull,
            color:
              status.status === 'overspending'
                ? 'text-red-600'
                : status.status === 'underspending'
                  ? 'text-amber-600'
                  : 'text-slate-800',
          },
          {
            label: 'Ritmo Geral',
            value: `${status.paceIndex.toFixed(2)}x`,
            color: 'text-slate-800',
          },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>
              {typeof kpi.value === 'number'
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(kpi.value)
                : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Orçamento por Objetivo</h3>

        {objectives.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Nenhum orçamento configurado para este mês</p>
            <p className="text-slate-400 text-sm mt-1">
              Configure metas em <strong>Configurações</strong> para começar
            </p>
          </div>
        ) : (
          objectives.map((objective) => (
            <div key={objective.id}>
              {/* Objective Card */}
              <ObjectiveBudgetCard
                objective={objective}
                status={status}
                campaignsCount={campaigns.filter((c) => c.objective_budget_id === objective.id).length}
                isExpanded={expandedObjective === objective.id}
                onToggleExpand={() =>
                  setExpandedObjective(expandedObjective === objective.id ? null : objective.id)
                }
              />

              {/* Expanded Campaign Table */}
              {expandedObjective === objective.id && (
                <div className="mt-4 animate-fade-in">
                  <CampaignBudgetTable
                    campaigns={campaignsForObjective}
                    onEdit={(campaign) => {
                      setEditingCampaign(campaign);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteCampaign}
                    onRelocate={() => setIsReallocateOpen(objective.id)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <EditCampaignBudgetModal
        isOpen={isEditModalOpen}
        campaign={editingCampaign}
        objective={
          editingCampaign
            ? (objectives.find((o) => o.id === editingCampaign.objective_budget_id) as ObjectiveBudget)
            : (objectives[0] as ObjectiveBudget)
        }
        onSave={handleSaveCampaign}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCampaign(undefined);
        }}
        isLoading={isLoading}
      />

      {isReallocateOpen && (
        <RealocateBudgetOrchestrator
          isOpen={true}
          campaigns={campaignsForObjective}
          onConfirm={handleConfirmReallocation}
          onClose={() => setIsReallocateOpen(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
