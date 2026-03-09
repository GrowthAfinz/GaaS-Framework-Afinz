import React from 'react';
import type { Budget } from '../hooks/useBudgets';
import type { DailyMetrics } from '../types';
import { Edit2, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { isSameMonth, parse } from 'date-fns';

interface BudgetCardProps {
    budget: Budget;
    actualSpend: number;
    onEdit: (b: Budget) => void;
    onDelete: (id: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, actualSpend, onEdit, onDelete }) => {
    const percentUsed = (actualSpend / budget.value) * 100;

    // Status Logic
    // Requires knowing day of month to know if "At Risk".
    // Simple logic: 
    // If Today > 50% of month and Spend < 40% -> Underpacing.
    // If Today < 50% of month and Spend > 60% -> Overpacing (Risk).

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const percentMonth = (currentDay / daysInMonth) * 100;

    let status: 'ok' | 'risk' | 'failed' = 'ok';

    // If current month matches budget month, we check pacing.
    // Pacing Index = %Spend / %Time
    // 1.0 = Perfect. > 1.1 = Fast. < 0.9 = Slow.
    const pacingIndex = percentMonth > 0 ? percentUsed / percentMonth : 0;

    if (percentUsed >= 100) status = 'failed';
    else if (pacingIndex > 1.1) status = 'risk'; // Spending too fast
    else if (pacingIndex < 0.85) status = 'ok'; // Spending slightly slow is usually OK, but "Underpacing" might be bad. 
    // Prompt says: "Green OK, Yellow At-Risk, Red Failed".
    // Let's assume Risk is Overspending projection.

    // Projection
    const dailyRate = currentDay > 0 ? actualSpend / currentDay : 0;
    const projectedTotal = dailyRate * daysInMonth;
    const projectedPercent = (projectedTotal / budget.value) * 100;

    if (projectedPercent > 105) status = 'risk';
    if (percentUsed >= 100) status = 'failed';

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${status === 'ok' ? 'bg-green-500' : status === 'risk' ? 'bg-yellow-500' : 'bg-red-500'}`} />

            <div className="flex justify-between items-start mb-4 pl-3">
                <div>
                    <h4 className="font-bold text-slate-800 text-lg">{budget.channel === 'meta' ? 'Meta Ads' : 'Google Ads'}</h4>
                    <p className="text-xs text-slate-500 uppercase font-medium tracking-wide bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">
                        {budget.objective === 'b2c' ? 'Conversão' : 'Branding'}
                    </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(budget)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-primary">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(budget.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="pl-3 space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Gasto: <strong className="text-slate-700">{fmt(actualSpend)}</strong></span>
                        <span className="text-slate-500">Meta: <strong className="text-slate-700">{fmt(budget.value)}</strong></span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'risk' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-400">{percentUsed.toFixed(1)}% utilizado</span>
                        <span className="text-xs text-slate-400">{status === 'risk' ? 'Risco de estouro' : status === 'failed' ? 'Esgotado' : 'Dentro da meta'}</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex justify-between items-center">
                    <span>
                        Ritmo ideal: <strong>{fmt((budget.value - actualSpend) / (daysInMonth - currentDay))}</strong>/dia
                    </span>
                    {status === 'risk' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    {status === 'ok' && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>

                {status !== 'failed' && (
                    <div className="text-xs text-slate-400 text-center">
                        Projeção final: {fmt(projectedTotal)} ({projectedPercent.toFixed(0)}%)
                    </div>
                )}
            </div>
        </div>
    );
};
