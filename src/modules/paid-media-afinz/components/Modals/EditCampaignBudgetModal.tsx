/**
 * EditCampaignBudgetModal
 * Modal para editar alocação de orçamento para uma campanha
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { CampaignBudget, ObjectiveBudget } from '../../types/budget';

interface EditCampaignBudgetModalProps {
  isOpen: boolean;
  campaign?: CampaignBudget;
  objective: ObjectiveBudget;
  onSave: (campaign: Omit<CampaignBudget, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const EditCampaignBudgetModal: React.FC<EditCampaignBudgetModalProps> = ({
  isOpen,
  campaign,
  objective,
  onSave,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Partial<CampaignBudget>>({
    campaignName: '',
    allocatedBudget: 0,
    notes: '',
  });
  const [error, setError] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (campaign) {
      setFormData({
        campaignName: campaign.campaignName,
        allocatedBudget: campaign.allocatedBudget,
        notes: campaign.notes,
      });
    } else {
      setFormData({
        campaignName: '',
        allocatedBudget: 0,
        notes: '',
      });
    }
    setError('');
    setValidationError('');
  }, [campaign, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Validations
    if (!formData.campaignName || formData.campaignName.trim() === '') {
      setValidationError('Nome da campanha é obrigatório');
      return;
    }

    if (!formData.allocatedBudget || formData.allocatedBudget <= 0) {
      setValidationError('Orçamento deve ser maior que 0');
      return;
    }

    if (formData.allocatedBudget > objective.totalBudget) {
      setValidationError(`Orçamento não pode exceder ${objective.totalBudget} (total disponível)`);
      return;
    }

    try {
      await onSave({
        id: campaign?.id || '',
        month: campaign?.month || '',
        objectiveBudgetId: campaign?.objectiveBudgetId || objective.id,
        campaignName: formData.campaignName.trim(),
        objective: objective.objective,
        channel: campaign?.channel || 'meta',
        allocatedBudget: formData.allocatedBudget,
        notes: formData.notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar campanha');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {campaign ? 'Editar Alocação' : 'Adicionar Campanha'}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Objetivo (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
            <input
              type="text"
              disabled
              value={objective.objective.toUpperCase()}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
            />
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Campanha</label>
            <input
              type="text"
              placeholder="Ex: Aquisição Cartão, Lead Gen Plurix"
              value={formData.campaignName || ''}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Allocated Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Orçamento (R$)</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={formData.allocatedBudget || ''}
              onChange={(e) => setFormData({ ...formData, allocatedBudget: parseFloat(e.target.value) || 0 })}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg font-semibold"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Disponível: R$ {(objective.totalBudget - (campaign?.allocatedBudget || 0)).toLocaleString('pt-BR')}</span>
              <span>Total objetivo: R$ {objective.totalBudget.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
            <textarea
              placeholder="Ex: Testando nova audiência, aumentando de 10k para 15k"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isLoading}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Error Messages */}
          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error || validationError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
