/**
 * RealocateBudgetOrchestrator Modal
 *
 * Intelligent budget reallocation UI
 * Shows analysis of overspending/underspending campaigns
 * Allows user to confirm automated or manual reallocations
 */

import React, { useState } from 'react';
import { X, AlertTriangle, TrendingDown, TrendingUp, Check } from 'lucide-react';
import { CampaignBudget, BudgetReallocationSuggestion } from '../../types/budget';
import { useBudgetOrchestrator } from '../../hooks/useBudgetOrchestrator';

interface RealocateBudgetOrchestratorProps {
  isOpen: boolean;
  campaigns: CampaignBudget[];
  onConfirm: (reallocations: Array<{ id: string; allocatedBudget: number }>) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const RealocateBudgetOrchestrator: React.FC<RealocateBudgetOrchestratorProps> = ({
  isOpen,
  campaigns,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const { suggestions } = useBudgetOrchestrator(campaigns);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleConfirm = async () => {
    setError('');

    const reallocations: Array<{ id: string; allocatedBudget: number }> = [];

    for (const index of selectedSuggestions) {
      const suggestion = suggestions[index];

      // Find campaigns
      const fromCampaign = campaigns.find((c) => c.campaignName === suggestion.from);
      const toCampaign = campaigns.find((c) => c.campaignName === suggestion.to);

      if (!fromCampaign || !toCampaign) continue;

      // Add new allocations
      reallocations.push({
        id: fromCampaign.id,
        allocatedBudget: fromCampaign.allocatedBudget - suggestion.amount,
      });

      reallocations.push({
        id: toCampaign.id,
        allocatedBudget: toCampaign.allocatedBudget + suggestion.amount,
      });
    }

    if (reallocations.length === 0) {
      setError('Selecione pelo menos uma realocação');
      return;
    }

    try {
      await onConfirm(reallocations);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar realocações');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">⟳ Orquestrador de Realocação</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-2">Nenhuma realocação necessária</p>
              <p className="text-sm text-slate-400">Todos os orçamentos estão dentro da faixa ideal (0.85x - 1.05x)</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Summary Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900">
                  {suggestions.length} sugestão{suggestions.length !== 1 ? 's' : ''} de realocação identificada{suggestions.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Suggestions */}
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Checkbox + Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.has(index)}
                      onChange={() => handleToggleSuggestion(index)}
                      disabled={isLoading}
                      className="mt-1 w-5 h-5 rounded border-slate-300 cursor-pointer"
                    />

                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{suggestion.rationale}</p>

                      {/* Amount Badge */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-slate-600">Transferir:</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-bold">
                          {formatCurrency(suggestion.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Preview */}
                  <div className="ml-8 grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded">
                    {/* From Campaign */}
                    <div className="border-r border-slate-200 pr-4">
                      <p className="text-xs text-slate-500 mb-1">Após remover:</p>
                      <div className="flex items-center gap-1">
                        <TrendingDown size={14} className="text-emerald-500" />
                        <span className="text-sm font-bold text-slate-800">
                          {suggestion.impact.fromNewPace.toFixed(2)}x
                        </span>
                        <span className="text-xs text-slate-400">
                          ({suggestion.impact.fromNewPace > 1.05 ? '⚠️' : '✓'})
                        </span>
                      </div>
                    </div>

                    {/* To Campaign */}
                    <div className="pl-4">
                      <p className="text-xs text-slate-500 mb-1">Após receber:</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-800">
                          {suggestion.impact.toNewPace.toFixed(2)}x
                        </span>
                        <span className="text-xs text-slate-400">
                          ({suggestion.impact.toNewPace > 1.05 ? '⚠️' : '✓'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <>
            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || selectedSuggestions.size === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={18} />
                {isLoading ? 'Aplicando...' : `Aplicar (${selectedSuggestions.size})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
