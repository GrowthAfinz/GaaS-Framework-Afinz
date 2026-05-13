import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp, Target, TrendingDown } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { CalendarData, Goal } from '../../types/framework';
import { getDaysInMonth, getDate, parseISO, isSameMonth } from 'date-fns';
import { formatDateKey } from '../../utils/formatters';

interface ProjectionsSectionProps {
    data: CalendarData;
    currentGoal: Goal;
    selectedBU?: string;
    onPointClick?: (date: Date) => void;
}

export const ProjectionsSection: React.FC<ProjectionsSectionProps> = ({ data, currentGoal, selectedBU, onPointClick }) => {
    const [simulationBoost, setSimulationBoost] = useState<number>(0); // % increase in conversion

    const today = new Date();
    const currentMonthStr = currentGoal.mes; // "YYYY-MM"
    const currentMonthDate = parseISO(`${currentMonthStr}-01`);
    const daysInMonth = getDaysInMonth(currentMonthDate);

    // Determine days passed and remaining
    // If we are in the current month, use the last day we have data for (or today if no data).
    // This prevents "flatlining" logic where empty future/current days drag down the average.
    const isCurrentMonth = isSameMonth(today, currentMonthDate);

    // Find the last day in the current month that has data
    const lastDayWithData = useMemo(() => {
        if (!isCurrentMonth) return daysInMonth;

        const dates = Object.keys(data)
            .filter(d => d.startsWith(currentMonthStr))
            .sort();

        if (dates.length > 0) {
            const lastDate = parseISO(dates[dates.length - 1]);
            return getDate(lastDate);
        }

        const currentDay = getDate(today);
        // Ensure we don't go beyond daysInMonth
        return Math.min(currentDay, daysInMonth);
    }, [data, currentMonthStr, isCurrentMonth, daysInMonth, today]);

    const daysPassed = isCurrentMonth ? lastDayWithData : daysInMonth;
    const daysRemaining = daysInMonth - daysPassed;

    // Calculate Realized Data
    const realizedData = useMemo(() => {
        let totalCartoes = 0;
        let totalAprovacoes = 0;
        let totalCusto = 0;

        Object.entries(data).forEach(([dateKey, activities]) => {
            if (!dateKey.startsWith(currentMonthStr)) return;

            activities.forEach(activity => {
                if (selectedBU && activity.bu !== selectedBU) return;

                totalCartoes += activity.kpis.cartoes || 0;
                totalAprovacoes += activity.kpis.aprovados || 0;
                totalCusto += activity.kpis.custoTotal || 0;
            });
        });

        return {
            cartoes: totalCartoes,
            aprovacoes: totalAprovacoes,
            custo: totalCusto,
            cac: totalCartoes > 0 ? totalCusto / totalCartoes : 0
        };
    }, [data, currentMonthStr, selectedBU]);

    // Calculate Projections
    const projection = useMemo(() => {
        const rateCartoes = daysPassed > 0 ? realizedData.cartoes / daysPassed : 0;
        const rateAprovacoes = daysPassed > 0 ? realizedData.aprovacoes / daysPassed : 0;

        const projectedCartoes = realizedData.cartoes + (rateCartoes * daysRemaining);
        const projectedAprovacoes = realizedData.aprovacoes + (rateAprovacoes * daysRemaining);

        // Simulation
        const simulatedCartoes = projectedCartoes * (1 + (simulationBoost / 100));

        return {
            cartoes: Math.round(projectedCartoes),
            aprovacoes: Math.round(projectedAprovacoes),
            simulatedCartoes: Math.round(simulatedCartoes),
            rateCartoes
        };
    }, [realizedData, daysPassed, daysRemaining, simulationBoost]);

    // Required Rhythm
    const requiredRhythm = useMemo(() => {
        const goalCartoes = currentGoal.cartoes_meta || 0;
        const remainingCartoes = Math.max(0, goalCartoes - realizedData.cartoes);

        return {
            daily: daysRemaining > 0 ? Math.ceil(remainingCartoes / daysRemaining) : 0,
            gap: remainingCartoes
        };
    }, [currentGoal, realizedData, daysRemaining]);

    // Chart Data Generation
    const chartData = useMemo(() => {
        const points = [];
        const goalDaily = (currentGoal.cartoes_meta || 0) / daysInMonth;
        let accumRealized = 0;
        let accumProjected = 0;
        let accumGoal = 0;

        // DEBUG LOGGING
        const sampleDataKeys = Object.keys(data).slice(0, 3);
        console.log('🔍 Projections Debug:', {
            currentMonthStr,
            sampleDataKeys,
            firstDayGenerated: formatDateKey(`${currentMonthStr}-01`),
            hasDataForFirstDay: !!data[formatDateKey(`${currentMonthStr}-01`)]
        });

        for (let day = 1; day <= daysInMonth; day++) {
            const rawDateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
            const dateStr = formatDateKey(rawDateStr);

            // Realized
            let dailyRealized = 0;
            if (day <= daysPassed) {
                const activities = data[dateStr] || [];
                activities.forEach(a => {
                    if (selectedBU && a.bu !== selectedBU) return;
                    dailyRealized += a.kpis.cartoes || 0;
                });
                accumRealized += dailyRealized;
                accumProjected = accumRealized; // Sync projection with reality up to today
            } else {
                // Projection
                accumProjected += projection.rateCartoes * (1 + (simulationBoost / 100));
            }

            accumGoal += goalDaily;

            points.push({
                day,
                label: `${day}/${currentMonthStr.split('-')[1]}`,
                realizado: day <= daysPassed ? accumRealized : null,
                projetado: Math.round(accumProjected),
                meta: Math.round(accumGoal)
            });
        }
        return points;
    }, [data, currentMonthStr, daysInMonth, daysPassed, currentGoal, projection.rateCartoes, simulationBoost, selectedBU]);

    const handleChartClick = (e: any) => {
        if (e && e.activePayload && e.activePayload[0] && onPointClick) {
            const payload = e.activePayload[0].payload;
            const day = payload.day;
            const date = parseISO(`${currentMonthStr}-${String(day).padStart(2, '0')}`);
            onPointClick(date);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
                {/* Projections Table & Summary */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-400" />
                        Projeção do Mês
                    </h3>

                    <div className="space-y-6">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="text-sm text-slate-400 mb-1">Projeção de Fechamento</div>
                            <div className="text-3xl font-bold text-white mb-1">
                                {projection.cartoes.toLocaleString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500">Meta: {(currentGoal.cartoes_meta || 0).toLocaleString('pt-BR')}</span>
                                {projection.cartoes >= (currentGoal.cartoes_meta || 0) ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> Atingirá
                                    </span>
                                ) : (
                                    <span className="text-red-400 font-bold flex items-center gap-1">
                                        <TrendingDown size={12} /> Abaixo
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Realizado ({daysPassed} dias)</span>
                                <span className="text-slate-200 font-mono">{realizedData.cartoes.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Ritmo Atual (dia)</span>
                                <span className="text-slate-200 font-mono">{Math.round(projection.rateCartoes).toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pb-2">
                                <span className="text-slate-400">Gap para Meta</span>
                                <span className="text-red-400 font-mono font-bold">{requiredRhythm.gap.toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* "How much I need to do" Calculator */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Calculator size={20} className="text-amber-400" />
                        Quanto Preciso Fazer?
                    </h3>

                    <div className="flex flex-col items-center justify-center h-[200px]">
                        <div className="text-center mb-6">
                            <div className="text-sm text-slate-400 mb-2">Para bater a meta, você precisa de:</div>
                            <div className="text-5xl font-bold text-amber-400 mb-2">
                                {requiredRhythm.daily.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-slate-300">cartões / dia</div>
                        </div>

                        <div className="w-full bg-slate-900/50 rounded p-3 text-xs text-center text-slate-400">
                            Restam <span className="text-white font-bold">{daysRemaining}</span> dias úteis comerciais (aprox)
                        </div>
                    </div>
                </div>

                {/* Simulator */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Target size={20} className="text-purple-400" />
                        Simulador de Cenários
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Impacto de Nova Campanha (% Conversão)
                            </label>
                            <input
                                type="range"
                                min="-20"
                                max="50"
                                step="5"
                                value={simulationBoost}
                                onChange={(e) => setSimulationBoost(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>-20%</span>
                                <span className="text-purple-400 font-bold">+{simulationBoost}%</span>
                                <span>+50%</span>
                            </div>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-900/50 rounded-lg p-4">
                            <div className="text-sm text-purple-300 mb-1">Resultado Simulado</div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-white">
                                    {projection.simulatedCartoes.toLocaleString('pt-BR')}
                                </div>
                                <div className={`text-sm font-bold ${projection.simulatedCartoes > projection.cartoes ? 'text-green-400' : 'text-slate-400'}`}>
                                    {projection.simulatedCartoes > projection.cartoes ? '+' : ''}
                                    {(projection.simulatedCartoes - projection.cartoes).toLocaleString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projection Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-6">Evolução: Realizado vs. Projetado vs. Meta</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                type="monotone"
                                dataKey="realizado"
                                name="Realizado"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="projetado"
                                name="Projeção"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="meta"
                                name="Meta Ideal"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                            />

                            {isCurrentMonth && (
                                <ReferenceLine x={chartData[daysPassed - 1]?.label} stroke="#fbbf24" strokeDasharray="3 3" label="Hoje" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
