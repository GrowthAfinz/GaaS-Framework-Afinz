import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { CalendarData, AnomalyType } from '../types/framework';
import { format, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JornadaChartProps {
    data: CalendarData;
    mode: 'performance' | 'anomalies';
    anomalyFilters?: AnomalyType[];
    onPointClick: (date: Date) => void;
}

type GroupBy = 'daily' | 'weekly';

export const JornadaChart: React.FC<JornadaChartProps> = ({ data, mode, anomalyFilters = [], onPointClick }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('daily');
    const [visibleLines, setVisibleLines] = useState({
        cartoes: true,
        aprovados: true,
        propostas: true
    });

    const chartData = useMemo(() => {
        const aggregated: { [key: string]: any } = {};

        Object.entries(data).forEach(([dateKey, activities]) => {
            // dateKey is YYYY-MM-DD
            let key = dateKey;
            let label = format(parseISO(dateKey), 'dd/MM', { locale: ptBR });

            if (groupBy === 'weekly') {
                const date = parseISO(dateKey);
                const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday start
                key = format(weekStart, 'yyyy-MM-dd');
                label = `Semana ${format(weekStart, 'dd/MM')}`;
            }

            if (!aggregated[key]) {
                aggregated[key] = {
                    date: key,
                    label,
                    cartoes: 0,
                    aprovados: 0,
                    propostas: 0,
                    anomalies: 0,
                    timestamp: parseISO(key).getTime() // For sorting
                };
            }

            activities.forEach(activity => {
                if (mode === 'performance') {
                    aggregated[key].cartoes += activity.kpis.cartoes || 0;
                    aggregated[key].aprovados += activity.kpis.aprovados || 0;
                    aggregated[key].propostas += activity.kpis.propostas || 0;
                } else {
                    // Anomaly Logic
                    const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
                    const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');

                    const rawDisparado = String(activity.raw['Disparado?'] || '').toLowerCase().trim();
                    // Check for various affirmative values
                    const isDisparado = ['sim', 's', 'yes', 'y', 'enviado', 'ok', 'true', '1'].includes(rawDisparado);

                    const isNoSent = isDisparado && (activity.kpis.baseEnviada || 0) === 0;
                    const isNoDelivered = isDisparado && (activity.kpis.baseEntregue || 0) === 0;
                    const isNoOpen = isDisparado && (activity.kpis.taxaAbertura || 0) === 0;

                    let isAnomaly = false;

                    // If no filters selected, show all
                    if (anomalyFilters.length === 0) {
                        isAnomaly = isPending || isNoSent || isNoDelivered || isNoOpen;
                    } else {
                        if (anomalyFilters.includes('pending') && isPending) isAnomaly = true;
                        if (anomalyFilters.includes('no_sent') && isNoSent) isAnomaly = true;
                        if (anomalyFilters.includes('no_delivered') && isNoDelivered) isAnomaly = true;
                        if (anomalyFilters.includes('no_open') && isNoOpen) isAnomaly = true;
                    }

                    if (isAnomaly) {
                        aggregated[key].anomalies += 1;
                    }
                }
            });
        });

        return Object.values(aggregated).sort((a, b) => a.timestamp - b.timestamp);
    }, [data, groupBy, mode, anomalyFilters]);

    const handleLegendClick = (e: any) => {
        const { dataKey } = e;
        setVisibleLines(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey as keyof typeof visibleLines]
        }));
    };

    const handleChartClick = (data: any) => {
        // Recharts onClick provides activeIndex, not activePayload
        if (data && typeof data.activeIndex === 'string') {
            const index = parseInt(data.activeIndex, 10);
            if (!isNaN(index) && chartData[index]) {
                onPointClick(parseISO(chartData[index].date));
            }
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg">
                    <p className="text-slate-200 font-bold mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-400 capitalize">{entry.name}:</span>
                            <span className="text-slate-200 font-mono font-bold">
                                {entry.value.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    ))}
                    <p className="text-xs text-slate-500 mt-2 italic">Clique para ver detalhes</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-100">
                    {mode === 'performance' ? 'Evolução de Performance' : 'Evolução de Anomalias'}
                </h2>

                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setGroupBy('daily')}
                        className={`px-3 py-1 text-xs font-medium rounded transition ${groupBy === 'daily'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Diário
                    </button>
                    <button
                        onClick={() => setGroupBy('weekly')}
                        className={`px-3 py-1 text-xs font-medium rounded transition ${groupBy === 'weekly'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Semanal
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                    {mode === 'performance' ? (
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
                                tickFormatter={(value) => value.toLocaleString('pt-BR')}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                onClick={handleLegendClick}
                                wrapperStyle={{ paddingTop: '20px' }}
                            />

                            <Line
                                type="monotone"
                                dataKey="propostas"
                                name="Propostas"
                                stroke="#8b5cf6" // Purple
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.propostas}
                            />
                            <Line
                                type="monotone"
                                dataKey="aprovados"
                                name="Aprovados"
                                stroke="#10b981" // Emerald
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.aprovados}
                            />
                            <Line
                                type="monotone"
                                dataKey="cartoes"
                                name="Cartões"
                                stroke="#3b82f6" // Blue
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                hide={!visibleLines.cartoes}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick}>
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
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="anomalies" name="Anomalias" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
