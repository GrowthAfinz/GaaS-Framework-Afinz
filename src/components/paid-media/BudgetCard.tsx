import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatPercentage } from '../../utils/formatters'; // Assuming these exist or I'll implement generic formatting
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export const BudgetCard: React.FC = () => {
    const { paidMediaData, budgets } = useAppStore();

    const currentMonthData = useMemo(() => {
        const now = new Date();
        return paidMediaData.filter(d =>
            d.date.getMonth() === now.getMonth() &&
            d.date.getFullYear() === now.getFullYear()
        );
    }, [paidMediaData]);

    const stats = useMemo(() => {
        const totalSpend = currentMonthData.reduce((acc, curr) => acc + curr.spend, 0);
        // Sum all distinct budgets for the current month
        // Note: Logic assumes one budget entry per channel per month
        const totalBudget = budgets.reduce((acc, curr) => acc + curr.value, 0) || 1; // Avoid div/0

        const today = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

        const linearProjection = (totalSpend / today) * daysInMonth;
        const pacing = (totalSpend / totalBudget);
        const idealPacing = today / daysInMonth;

        const delta = pacing - idealPacing; // + means overspending, - means underspending

        return {
            totalSpend,
            totalBudget,
            linearProjection,
            pacing,
            delta,
            status: delta > 0.05 ? 'over' : delta < -0.05 ? 'under' : 'ontrack'
        };
    }, [currentMonthData, budgets]);

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Orçamento Mensal</h3>
                    <div className="text-2xl font-bold text-slate-100 mt-1">
                        {formatBRL(stats.totalSpend)}
                        <span className="text-slate-500 text-sm font-normal ml-2">/ {formatBRL(stats.totalBudget)}</span>
                    </div>
                </div>
                <div className={`p-2 rounded-full ${stats.status === 'ontrack' ? 'bg-emerald-500/10 text-emerald-400' :
                    stats.status === 'over' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {stats.status === 'ontrack' && <CheckCircle size={20} />}
                    {stats.status === 'over' && <TrendingUp size={20} />}
                    {stats.status === 'under' && <TrendingDown size={20} />}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${stats.status === 'over' ? 'bg-red-500' :
                        stats.status === 'under' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                    style={{ width: `${Math.min(stats.pacing * 100, 100)}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{(stats.pacing * 100).toFixed(1)}% Consumido</span>
                <span>Projeção: {formatBRL(stats.linearProjection)}</span>
            </div>

            {/* Projection Alert */}
            {stats.linearProjection > stats.totalBudget && (
                <div className="mt-4 flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
                    <AlertTriangle size={14} />
                    <span>Risco de estourar budget em {formatBRL(stats.linearProjection - stats.totalBudget)}</span>
                </div>
            )}
        </div>
    );
};
