/**
 * EditCampaignBudgetModal
 * Modal para criar/editar alocação de orçamento para uma campanha
 *
 * "Nome da Campanha" é um select populado com campanhas reais do DB
 * (filtrado por objetivo via paid_media_campaign_mappings)
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { CampaignBudget, ObjectiveBudget, getObjectiveLabel } from '../../types/budget';
import { dataService } from '../../../../services/dataService';

interface EditCampaignBudgetModalProps {
  isOpen: boolean;
  campaign?: CampaignBudget;
  objective: ObjectiveBudget;
  currentMonth: string;
  onSave: (campaign: Omit<CampaignBudget, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const CUSTOM_SENTINEL = '__custom__';

export const EditCampaignBudgetModal: React.FC<EditCampaignBudgetModalProps> = ({
  isOpen,
  campaign,
  objective,
  currentMonth,
  onSave,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Partial<CampaignBudget>>({
    campaignName: '',
    allocatedBudget: 0,
    channel: 'meta',
    notes: '',
  });
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [customCampaign, setCustomCampaign] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [mappedCampaigns, setMappedCampaigns] = useState<string[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  // Carregar campanhas mapeadas para este objetivo
  useEffect(() => {
    if (!isOpen || !objective?.objective) return;
    setLoadingCampaigns(true);
    dataService.fetchCampaignMappings()
      .then((all) => {
        const filtered = all
          .filter((m: any) => m.objective === objective.objective)
          .map((m: any) => m.campaign_name)
          .sort();
        setMappedCampaigns(filtered);
      })
      .catch(() => setMappedCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, [isOpen, objective?.objective]);

  // Resetar form ao abrir/fechar
  useEffect(() => {
    if (campaign) {
      const isKnown = mappedCampaigns.includes(campaign.campaignName);
      setSelectedCampaign(isKnown ? campaign.campaignName : CUSTOM_SENTINEL);
      setCustomCampaign(isKnown ? '' : campaign.campaignName);
      setUseCustom(!isKnown);
      setFormData({
        allocatedBudget: campaign.allocatedBudget,
        channel: campaign.channel || 'meta',
        notes: campaign.notes,
      });
    } else {
      setSelectedCampaign('');
      setCustomCampaign('');
      setUseCustom(false);
      setFormData({ allocatedBudget: 0, channel: 'meta', notes: '' });
    }
    setError('');
    setValidationError('');
  }, [campaign, isOpen]);

  const resolvedCampaignName = useCustom ? customCampaign.trim() : selectedCampaign;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    if (!resolvedCampaignName) {
      setValidationError('Selecione ou informe o nome da campanha');
      return;
    }
    if (!formData.allocatedBudget || formData.allocatedBudget <= 0) {
      setValidationError('Orçamento deve ser maior que R$ 0');
      return;
    }

    try {
      await onSave({
        id: campaign?.id || '',
        month: campaign?.month || currentMonth,
        objectiveBudgetId: campaign?.objectiveBudgetId || objective.id,
        campaignName: resolvedCampaignName,
        objective: objective.objective,
        channel: (formData.channel || 'meta') as 'meta' | 'google',
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {campaign ? 'Editar Alocação' : 'Adicionar Campanha'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {getObjectiveLabel(objective.objective)} · {currentMonth}
            </p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Campanha — select populado do DB */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Campanha
              {loadingCampaigns && <Loader2 size={12} className="inline ml-1 animate-spin text-slate-400" />}
            </label>
            {!useCustom ? (
              <select
                value={selectedCampaign}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_SENTINEL) { setUseCustom(true); setSelectedCampaign(''); return; }
                  setSelectedCampaign(e.target.value);
                }}
                disabled={isLoading || loadingCampaigns}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-slate-50"
              >
                <option value="">Selecionar campanha...</option>
                {mappedCampaigns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option disabled>──────────</option>
                <option value={CUSTOM_SENTINEL}>✏️ Nome personalizado...</option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome exato da campanha"
                  value={customCampaign}
                  onChange={(e) => setCustomCampaign(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => { setUseCustom(false); setCustomCampaign(''); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  ← Voltar para lista
                </button>
              </div>
            )}
            {mappedCampaigns.length === 0 && !loadingCampaigns && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Nenhuma campanha mapeada para este objetivo.{' '}
                <span className="font-medium">Use "Nome personalizado" ou configure em Gerenciar Objetivos.</span>
              </p>
            )}
          </div>

          {/* Canal */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
            <select
              value={formData.channel || 'meta'}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'meta' | 'google' })}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
            </select>
          </div>

          {/* Orçamento */}
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
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-lg font-semibold"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-500">
              <span>Total objetivo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(objective.totalBudget)}</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas <span className="font-normal text-slate-400">(opcional)</span></label>
            <textarea
              placeholder="Ex: Testando nova audiência, foco em lookalike..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isLoading}
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Erros */}
          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error || validationError}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              <Save size={16} />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
