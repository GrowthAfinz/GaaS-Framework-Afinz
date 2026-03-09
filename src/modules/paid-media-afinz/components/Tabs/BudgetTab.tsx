import React, { useState, useMemo } from 'react';
import { useBudgets } from '../../hooks/useBudgets';
import { useFilters } from '../../context/FilterContext';
import { BudgetCard } from '../BudgetCard';
import { CreateBudgetModal } from '../Modals/CreateBudgetModal';
import { Plus, Wallet, TrendingUp, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { parse, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, format, isFuture, getDaysInMonth, differenceInCalendarDays, getDate } from 'date-fns';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Budget } from '../../hooks/useBudgets';

export const BudgetTab: React.FC = () => {
    const { budgets, add, update, remove } = useBudgets();
    const { rawData, filters } = useFilters(); // Using rawData to calculate global realized spend
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

    // Current Month Context (Based on Filter)
    const currentMonthDate = filters.dateRange.to || new Date();
    const currentMonthStr = format(currentMonthDate, 'MM/yyyy');

    // 1. Calculate Realized Spend per Day (Meta vs Google)
    const dailySpendData = useMemo(() => {
        const start = startOfMonth(currentMonthDate);
        const end = endOfMonth(currentMonthDate);
        const days = eachDayOfInterval({ start, end });

        // Filter data for this month only
        const thisMonthData = rawData.filter(d => isSameMonth(new Date(d.date), currentMonthDate));

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayLabel = format(day, 'dd');
            const isFutureDay = isFuture(day);

            const metaSpend = thisMonthData
                .filter(d => String(d.date).startsWith(dayStr) && d.channel === 'meta')
                .reduce((sum, d) => sum + d.spend, 0);

            const googleSpend = thisMonthData
                .filter(d => String(d.date).startsWith(dayStr) && d.channel === 'google')
                .reduce((sum, d) => sum + d.spend, 0);

            return {
                day: dayLabel,
                date: day,
                meta: isFutureDay ? 0 : metaSpend,
                google: isFutureDay ? 0 : googleSpend,
                total: isFutureDay ? 0 : (metaSpend + googleSpend)
            };
        });
    }, [rawData, currentMonthDate]);

    // 2. Derive Budget Stats
    const totalMonthlyBudget = useMemo(() => {
        return budgets
            .filter(b => b.month === currentMonthStr)
            .reduce((sum, b) => sum + b.value, 0);
    }, [budgets, currentMonthStr]);

    const realizedTotal = dailySpendData.reduce((acc, day) => acc + day.total, 0);

    // Projection Logic (Simple Linear)
    const daysPassed = getDate(currentMonthDate); // 1-31
    const totalDays = getDaysInMonth(currentMonthDate);
    // Avoid division by zero or projecting very early
    const projection = daysPassed > 0 ? (realizedTotal / daysPassed) * totalDays : 0;

    const remainingBudget = totalMonthlyBudget - realizedTotal;

    let paceStatus = 'ontrack';
    if (totalMonthlyBudget > 0) {
        if (projection > totalMonthlyBudget * 1.05) paceStatus = 'overspending';
        else if (projection < totalMonthlyBudget * 0.95) paceStatus = 'underspending';
    }

    // 3. Prepare Chart Data with Budget Line
    const chartData = useMemo(() => {
        const dailyBudget = totalMonthlyBudget / totalDays;
        let cumulativeBudget = 0;
        let cumulativeSpend = 0;

        return dailySpendData.map(d => {
            cumulativeBudget += dailyBudget;
            // Only add cumulative spend for past/today
            if (!isFuture(d.date)) {
                cumulativeSpend += d.total;
            }

            return {
                ...d,
                cumulativeBudget,
                cumulativeSpend: isFuture(d.date) ? null : cumulativeSpend,
            };
        });
    }, [dailySpendData, totalMonthlyBudget, totalDays]);

    const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Orçamento - {format(currentMonthDate, 'MMMM/yyyy')}</h2>
                    <p className="text-slate-500">Acompanhe seus gastos diários vs planejado.</p>
                </div>
                <button
                    onClick={() => { setEditingBudget(undefined); setIsModalOpen(true); }}
                    className="bg-primary text-slate-900 font-bold py-2.5 px-5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus size={20} />
                    Adicionar Orçamento
                </button>
            </div>

            {/* Top Cards - Pacing Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Budget Total */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet size={48} className="text-slate-700" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Orçamento Planejado</p>
                    <h3 className="text-2xl font-extrabold text-slate-800">{fmtBRL(totalMonthlyBudget)}</h3>
                    <div className="mt-4 text-xs text-slate-400">Soma dos orçamentos ativos</div>
                </div>

                {/* 2. Realized */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Gasto Realizado</p>
                    <h3 className="text-2xl font-extrabold text-blue-600">{fmtBRL(realizedTotal)}</h3>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-500">
                        {totalMonthlyBudget > 0 ? ((realizedTotal / totalMonthlyBudget) * 100).toFixed(1) : 0}% do total
                    </div>
                </div>

                {/* 3. Projection */}
                <div className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm
                    ${paceStatus === 'overspending' ? 'border-red-100 bg-red-50/50' : ''}
                `}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Projeção de Fechamento</p>
                            <h3 className={`text-2xl font-extrabold ${paceStatus === 'overspending' ? 'text-red-500' : 'text-slate-700'}`}>
                                {fmtBRL(projection)}
                            </h3>
                        </div>
                        {paceStatus === 'overspending' ? <TrendingUp className="text-red-500" size={24} /> :
                            paceStatus === 'underspending' ? <TrendingDown className="text-amber-500" size={24} /> :
                                <CheckCircle className="text-emerald-500" size={24} />}
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500">
                        {paceStatus === 'overspending' ? 'Ritmo Acelerado (Risco)' :
                            paceStatus === 'underspending' ? 'Ritmo Lento (Sobra)' : 'No Ritmo Ideal'}
                    </div>
                </div>

                {/* 4. Remaining */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Saldo Restante</p>
                    <h3 className="text-2xl font-extrabold text-emerald-600">{fmtBRL(remainingBudget)}</h3>
                    <div className="mt-4 text-xs text-slate-400">Disponível até o fim do mês</div>
                </div>
            </div>

            {/* Main Chart: Daily Spend vs Budget Pace */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[400px]">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" />
                    Evolução Diária de Investimento
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val: number) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            hide
                        />
                        <Tooltip
                            formatter={(val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Stacked Bars for Daily Spend */}
                        <Bar yAxisId="left" dataKey="meta" name="Meta Ads" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={20} />
                        <Bar yAxisId="left" dataKey="google" name="Google Ads" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />

                        {/* Reference Line for Average Daily Budget */}
                        {totalMonthlyBudget > 0 && (
                            <ReferenceLine yAxisId="left" y={totalMonthlyBudget / totalDays} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta Diária Ideal', fill: '#ef4444', fontSize: 10 }} />
                        )}

                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* List of Configured Budgets */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-lg">Orçamentos Configurados</h3>
                {budgets.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 mb-4">Nenhum orçamento configurado para este mês.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-primary font-bold hover:underline"
                        >
                            Configurar Orçamento
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...budgets].filter(b => b.month === currentMonthStr).map(budget => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                actualSpend={
                                    // Calculate spend strictly for this budget's scope
                                    rawData
                                        .filter(d =>
                                            isSameMonth(new Date(d.date), currentMonthDate) &&
                                            d.channel === budget.channel &&
                                            d.objective === budget.objective
                                        )
                                        .reduce((acc, curr) => acc + curr.spend, 0)
                                }
                                onEdit={(b) => { setEditingBudget(b); setIsModalOpen(true); }}
                                onDelete={remove}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CreateBudgetModal
                    onClose={() => setIsModalOpen(false)}
                    existingBudget={editingBudget}
                    onSave={(b) => {
                        add(b);
                        setIsModalOpen(false);
                    }}
                    onUpdate={(id, b) => {
                        update(id, b);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};
