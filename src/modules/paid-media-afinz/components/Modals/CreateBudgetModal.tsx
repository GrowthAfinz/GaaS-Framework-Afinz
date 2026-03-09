import React, { useState } from 'react';
import type { Budget } from '../hooks/useBudgets';
import { X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreateBudgetModalProps {
    existingBudget?: Budget;
    onSave: (b: Omit<Budget, 'id'>) => void;
    onUpdate: (id: string, b: Partial<Budget>) => void;
    onClose: () => void;
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({ existingBudget, onSave, onUpdate, onClose }) => {
    const [formData, setFormData] = useState<Partial<Budget>>({
        month: existingBudget?.month || format(new Date(), 'MM/yyyy'),
        channel: existingBudget?.channel || 'meta',
        objective: existingBudget?.objective || 'marca',
        value: existingBudget?.value || 0,
        notes: existingBudget?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.value || !formData.month) return;

        if (existingBudget) {
            onUpdate(existingBudget.id, formData);
        } else {
            onSave(formData as Omit<Budget, 'id'>);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {existingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mês/Ano</label>
                        <input
                            type="text"
                            placeholder="MM/AAAA"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            required
                        />
                        <p className="text-xs text-slate-400 mt-1">Ex: 05/2026</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                value={formData.channel}
                                onChange={e => setFormData({ ...formData, channel: e.target.value as any })}
                            >
                                <option value="meta">Meta Ads</option>
                                <option value="google">Google Ads</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                value={formData.objective}
                                onChange={e => setFormData({ ...formData, objective: e.target.value as any })}
                            >
                                <option value="marca">Branding</option>
                                <option value="b2c">Conversão</option>
                                <option value="plurix">Plurix</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Orçamento (R$)</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold text-slate-800"
                            value={formData.value || ''}
                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notas (Opcional)</label>
                        <textarea
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-slate-900 font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        <Save size={20} />
                        {existingBudget ? 'Salvar Alterações' : 'Criar Orçamento'}
                    </button>
                </form>
            </div>
        </div>
    );
};
