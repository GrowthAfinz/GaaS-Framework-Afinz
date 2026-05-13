import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Target, Calculator } from 'lucide-react';
import { Goal } from '../types/framework';

interface GoalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Goal) => void;
    initialGoal: Goal;
    currentMonthLabel: string;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialGoal,
    currentMonthLabel
}) => {
    const [activeTab, setActiveTab] = useState<'B2C' | 'B2B2C' | 'Plurix' | 'Seguros'>('B2C');

    // BU States
    const [buGoals, setBuGoals] = useState<{ [key: string]: { cartoes: string; aprovacoes: string; cac: string } }>({
        B2C: { cartoes: '', aprovacoes: '', cac: '' },
        B2B2C: { cartoes: '', aprovacoes: '', cac: '' },
        Plurix: { cartoes: '', aprovacoes: '', cac: '' },
        Seguros: { cartoes: '', aprovacoes: '', cac: '' }
    });

    useEffect(() => {
        if (isOpen) {
            const newBuGoals = {
                B2C: { cartoes: '', aprovacoes: '', cac: '' },
                B2B2C: { cartoes: '', aprovacoes: '', cac: '' },
                Plurix: { cartoes: '', aprovacoes: '', cac: '' },
                Seguros: { cartoes: '', aprovacoes: '', cac: '' }
            };

            if (initialGoal.bus) {
                Object.entries(initialGoal.bus).forEach(([bu, data]) => {
                    if (newBuGoals[bu as keyof typeof newBuGoals]) {
                        newBuGoals[bu as keyof typeof newBuGoals] = {
                            cartoes: data.cartoes?.toString() || '',
                            aprovacoes: data.aprovacoes?.toString() || '',
                            cac: data.cac?.toString() || ''
                        };
                    }
                });
            }
            setBuGoals(newBuGoals);
        }
    }, [isOpen, initialGoal]);

    // Computed totals for summary
    const totals = useMemo(() => {
        let totalCartoes = 0;
        let totalAprovacoes = 0;
        let totalCacSum = 0;
        let count = 0;

        Object.values(buGoals).forEach(g => {
            totalCartoes += Number(g.cartoes) || 0;
            totalAprovacoes += Number(g.aprovacoes) || 0;
            if (Number(g.cac) > 0) {
                totalCacSum += Number(g.cac);
                count++;
            }
        });

        return {
            cartoes: totalCartoes,
            aprovacoes: totalAprovacoes,
            cacMedio: count > 0 ? totalCacSum / count : 0
        };
    }, [buGoals]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const busData: any = {};
        Object.entries(buGoals).forEach(([bu, data]) => {
            busData[bu] = {
                cartoes: Number(data.cartoes) || 0,
                aprovacoes: Number(data.aprovacoes) || 0,
                cac: Number(data.cac) || 0
            };
        });

        // The saveGoal adapter will handle distributing these to the store
        onSave({
            mes: initialGoal.mes,
            cartoes_meta: totals.cartoes,
            aprovacoes_meta: totals.aprovacoes,
            cac_max: totals.cacMedio,
            bus: busData
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-2xl border border-white/10 flex flex-col md:flex-row overflow-hidden">

                {/* Sidebar / Tabs */}
                <div className="w-full md:w-1/3 bg-slate-900/50 border-r border-white/10 p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                        <Target className="text-blue-400" size={20} />
                        Metas
                    </h2>

                    <div className="space-y-2 flex-1">
                        {['B2C', 'B2B2C', 'Plurix', 'Seguros'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab as any)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between group ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                            </button>
                        ))}
                    </div>

                    {/* Summary Card in Sidebar */}
                    <div className="mt-6 bg-slate-800/50 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-slate-400 mb-3">
                            <Calculator size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Consolidado</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Cartões</span>
                                <span className="text-slate-200 font-mono">{totals.cartoes.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Aprovações</span>
                                <span className="text-slate-200 font-mono">{totals.aprovacoes.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">CAC Médio</span>
                                <span className="text-emerald-400 font-mono">R$ {totals.cacMedio.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                        <div>
                            <h3 className="text-slate-100 font-bold">Configuração: {activeTab}</h3>
                            <p className="text-xs text-slate-400">Defina as metas para o mês de {currentMonthLabel}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    Meta de Cartões Gerados
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={buGoals[activeTab].cartoes}
                                        onChange={(e) => setBuGoals({
                                            ...buGoals,
                                            [activeTab]: { ...buGoals[activeTab], cartoes: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-3 text-slate-500 text-xs">unidades</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    Meta de Aprovações
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={buGoals[activeTab].aprovacoes}
                                        onChange={(e) => setBuGoals({
                                            ...buGoals,
                                            [activeTab]: { ...buGoals[activeTab], aprovacoes: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-3 text-slate-500 text-xs">unidades</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    CAC Máximo Aceitável
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-500">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={buGoals[activeTab].cac}
                                        onChange={(e) => setBuGoals({
                                            ...buGoals,
                                            [activeTab]: { ...buGoals[activeTab], cac: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="p-4 border-t border-slate-700 bg-slate-900/30 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20 font-medium"
                        >
                            <Save size={18} />
                            Salvar Todas as Metas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
