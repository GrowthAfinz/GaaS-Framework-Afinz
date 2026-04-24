import React, { useMemo, useState } from 'react';
import { Activity, Goal } from '../../types/framework';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
import { useB2CAnalysis } from '../../hooks/useB2CAnalysis';
import { useBU } from '../../contexts/BUContext';
import { Info } from 'lucide-react';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LaunchPlannerKPIsProps {
    activities: Activity[];
    goals: Goal[];
    currentMonth: string;
}

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({ activities, goals, currentMonth }) => {

    const { dailyAnalysis } = useB2CAnalysis();
    const { isBUSelected, selectedBUs } = useBU();
    const isOnlySeguros = selectedBUs.length === 1 && selectedBUs[0] === 'Seguros';
    const segurosActivities = useMemo(() => activities.filter((activity) => activity.bu === 'Seguros'), [activities]);

    const showCharts = !isOnlySeguros && selectedBUs.includes('B2C') && !isBUSelected('B2B2C') && !isBUSelected('Plurix');

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const payload = data.activePayload[0].payload;
            if (payload.data) {
                setSelectedDate(payload.data);
            }
        }
    };

    const handleDotClick = (props: any) => {
        if (props && props.payload && props.payload.data) {
            setSelectedDate(props.payload.data);
        }
    };

    const selectedActivities = useMemo(() => {
        if (!selectedDate) return [];
        return activities.filter(act => {
            const actDate = act.dataDisparo instanceof Date
                ? format(act.dataDisparo, 'yyyy-MM-dd')
                : typeof act.dataDisparo === 'string' ? (act.dataDisparo as string).split('T')[0] : '';
            return actDate === selectedDate;
        });
    }, [selectedDate, activities]);

    const metrics = useMemo(() => {
        const currentGoal = goals.find(g => g.mes === currentMonth);

        const isOnlyBU = (bu: string) => selectedBUs.length === 1 && selectedBUs[0] === bu;
        // selectedBUs vazio = todas as BUs ativas
        const hasBU = (bu: string) => selectedBUs.length === 0 || selectedBUs.includes(bu);
        // BUs não-Seguros ativas
        const activeCoreB2Us = ['B2C', 'B2B2C', 'Plurix'].filter(bu => hasBU(bu));

        // ── Seguros isolado ──────────────────────────────────────────────────
        if (isOnlySeguros) {
            const totalCards = segurosActivities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.bus?.Seguros?.cartoes || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (Seguros)' };
        }

        // ── B2C sozinho ou nenhuma BU especial filtrada (estado padrão) ─────
        if (isOnlyBU('B2C') || activeCoreB2Us.every(bu => bu === 'B2C')) {
            const totalCards = dailyAnalysis.reduce((sum, d) => sum + d.emissoes_b2c_total, 0);
            const goalCards  = currentGoal?.b2c_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (B2C)' };
        }

        // ── B2B2C isolado ────────────────────────────────────────────────────
        if (isOnlyBU('B2B2C')) {
            const totalCards = activities.filter(a => a.bu === 'B2B2C').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.b2b2c_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (B2B2C)' };
        }

        // ── Plurix isolado ───────────────────────────────────────────────────
        if (isOnlyBU('Plurix')) {
            const totalCards = activities.filter(a => a.bu === 'Plurix').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.plurix_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (Plurix)' };
        }

        // ── Múltiplas BUs — soma proporcional ────────────────────────────────
        let totalCards = 0;
        let goalCards  = 0;
        const labelParts: string[] = [];

        if (hasBU('B2C')) {
            totalCards += dailyAnalysis.reduce((sum, d) => sum + d.emissoes_b2c_total, 0);
            const g = currentGoal?.b2c_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('B2C');
        }
        if (hasBU('B2B2C')) {
            totalCards += activities.filter(a => a.bu === 'B2B2C').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const g = currentGoal?.b2b2c_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('B2B2C');
        }
        if (hasBU('Plurix')) {
            totalCards += activities.filter(a => a.bu === 'Plurix').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const g = currentGoal?.plurix_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('Plurix');
        }

        const label = labelParts.length > 0 ? `Meta (${labelParts.join(' + ')})` : 'Meta combinada';
        return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label };
    }, [goals, currentMonth, dailyAnalysis, selectedBUs, activities, isOnlySeguros, segurosActivities]);

    const metaChartData = [
        { name: 'Realizado', value: metrics.totalCards, color: '#3B82F6' },
        { name: metrics.label, value: metrics.goalCards, color: '#10B981' }
    ];

    const comparisonData = useMemo(() => {
        return dailyAnalysis.map(d => {
            const [y, m, day] = d.data.split('-').map(Number);
            const dateObj = new Date(y, m - 1, day);
            return {
                ...d,
                displayDate: format(dateObj, 'dd/MM', { locale: ptBR }),
                outros_propostas: Math.max(0, d.propostas_b2c_total - d.propostas_crm),
                outros_emissoes: Math.max(0, d.emissoes_b2c_total - d.emissoes_crm),
                cac_medio: d.cac_medio
            };
        });
    }, [dailyAnalysis]);

    const ChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-slate-200 p-2 rounded text-[10px] text-slate-700 shadow-sm">
                    <p className="font-bold mb-1 border-b border-slate-200 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => {
                        const isCurrency = entry.name.includes('CAC');
                        const val = isCurrency
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
                            : entry.value.toLocaleString('pt-BR');

                        return (
                            <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {val}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`grid gap-4 mb-2 ${showCharts ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between h-48 relative overflow-hidden group shadow-sm">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-500 text-xs font-medium">Cartoes vs Meta</h3>
                                <span title="Visualizacao do realizado contra a meta definida para o periodo">
                                    <Info size={12} className="text-slate-500 cursor-help" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-bold text-slate-800">{metrics.totalCards.toLocaleString()}</span>
                                <span className="text-xs text-slate-400">/ {metrics.goalCards.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${metrics.goalProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'}`}>
                            {metrics.goalProgress.toFixed(1)}%
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={metaChartData} barSize={12}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#334155', fontSize: '10px' }}
                                    itemStyle={{ color: '#334155' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {metaChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {showCharts && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 h-52 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            CAC Evolution (R$) <span title="Evolucao do Custo de Aquisicao de Cartao ao longo do tempo"><Info size={10} className="text-slate-500" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Line type="monotone" dataKey="cac_medio" name="CAC Medio" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 6, onClick: handleDotClick, style: { cursor: 'pointer' } }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>

            {showCharts && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-3 h-52 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            Propostas: CRM vs B2C <span title="Comparativo entre propostas geradas via CRM e outros canais B2C"><Info size={10} className="text-slate-500" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.9 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Bar dataKey="propostas_crm" name="CRM" stackId="a" fill="#3B82F6" />
                                    <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3 h-48 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            Emissoes: CRM vs B2C <span title="Comparativo entre cartoes emitidos via CRM e outros canais B2C"><Info size={10} className="text-slate-500" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.9 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Bar dataKey="emissoes_crm" name="CRM" stackId="a" fill="#10B981" />
                                    <Bar dataKey="outros_emissoes" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <DailyDetailsModal
                date={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
                activities={selectedActivities}
                onClose={() => setSelectedDate(null)}
            />
        </div>
    );
};
