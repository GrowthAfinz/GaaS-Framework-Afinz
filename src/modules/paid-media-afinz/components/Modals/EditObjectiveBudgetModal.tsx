/**
 * EditObjectiveBudgetModal
 * Modal para criar ou editar orçamento por objetivo (paid_media_budgets)
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ObjectiveBudget, BudgetObjective, BudgetChannel, KNOWN_OBJECTIVES } from '../../types/budget';

const DEFAULT_OBJECTIVES = Object.entries(KNOWN_OBJECTIVES).map(([value, label]) => ({ value, label }));
const CUSTOM_SENTINEL = '__custom__';

interface EditObjectiveBudgetModalProps {
  isOpen: boolean;
  objective?: ObjectiveBudget;
  month: string;
  onSave: (data: {
    id?: string;
    month: string;
    objective: BudgetObjective;
    budget: number;
    channel?: string | null;
  }) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const EditObjectiveBudgetModal: React.FC<EditObjectiveBudgetModalProps> = ({
  isOpen,
  objective,
  month,
  onSave,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState<{
    objective: string;
    customObjective: string;
    budget: number;
    channel: string;
  }>({
    objective: 'b2c',
    customObjective: '',
    budget: 0,
    channel: '',
  });
  const [error, setError] = useState('');

  const isKnownObjective = (val: string) => val in KNOWN_OBJECTIVES;

  useEffect(() => {
    if (objective) {
      const known = isKnownObjective(objective.objective);
      setFormData({
        objective: known ? objective.objective : CUSTOM_SENTINEL,
        customObjective: known ? '' : objective.objective,
        budget: objective.totalBudget,
        channel: objective.channel || '',
      });
    } else {
      setFormData({ objective: 'b2c', customObjective: '', budget: 0, channel: '' });
    }
    setError('');
  }, [objective, isOpen]);

  const resolvedObjective =
    formData.objective === CUSTOM_SENTINEL ? formData.customObjective.trim() : formData.objective;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.budget <= 0) {
      setError('Orçamento deve ser maior que R$ 0');
      return;
    }
    if (!resolvedObjective) {
      setError('Informe um nome para o objetivo personalizado');
      return;
    }

    try {
      await onSave({
        id: objective?.id,
        month,
        objective: resolvedObjective,
        budget: formData.budget,
        channel: formData.channel || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar orçamento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {objective ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Nível: Objetivo — {month}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Objetivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
            <select
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value, customObjective: '' })}
              disabled={!!objective || isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
            >
              {DEFAULT_OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              <option value={CUSTOM_SENTINEL}>✏️ Personalizado...</option>
            </select>
            {!!objective && (
              <p className="text-xs text-slate-400 mt-1">Objetivo não pode ser alterado após criação</p>
            )}
            {/* Input livre para objetivo personalizado */}
            {formData.objective === CUSTOM_SENTINEL && !objective && (
              <input
                type="text"
                placeholder="ex: rentabilizacao"
                value={formData.customObjective}
                onChange={(e) => setFormData({ ...formData, customObjective: e.target.value })}
                disabled={isLoading}
                className="mt-2 w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                autoFocus
              />
            )}
          </div>

          {/* Orçamento Total */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Orçamento Total (R$)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              value={formData.budget || ''}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg font-semibold"
            />
            <p className="text-xs text-slate-400 mt-1">
              Valor total disponível para distribuir entre campanhas
            </p>
          </div>

          {/* Canal (opcional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Canal <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">Todos os Canais</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
