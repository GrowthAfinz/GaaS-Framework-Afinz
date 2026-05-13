import React, { useState } from 'react';
import type { Target } from '../../hooks/useTargets';
import { X, Save } from 'lucide-react';
import { format } from 'date-fns';

interface CreateTargetModalProps {
    onSave: (t: Omit<Target, 'id'>) => void;
    onClose: () => void;
}

export const CreateTargetModal: React.FC<CreateTargetModalProps> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Target>>({
        month: format(new Date(), 'MM/yyyy'),
        metric: 'conversions',
        value: 0
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.value || !formData.month || !formData.metric) return;
        onSave(formData as Omit<Target, 'id'>);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Definir Meta Mensal</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mês/Ano</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            placeholder="MM/AAAA"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Métrica</label>
                        <select
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                            value={formData.metric}
                            onChange={e => setFormData({ ...formData, metric: e.target.value as any })}
                        >
                            <option value="spend">Investimento</option>
                            <option value="conversions">Conversões</option>
                            <option value="impressions">Impressões</option>
                            <option value="clicks">Cliques</option>
                            <option value="cpm">CPM</option>
                            <option value="cpc">CPC</option>
                            <option value="ctr">CTR</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor Meta</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-lg font-semibold text-slate-800"
                            value={formData.value || ''}
                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                            required
                            step="0.01"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-slate-900 font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        <Save size={20} />
                        Salvar Meta
                    </button>
                </form>
            </div>
        </div>
    );
};
