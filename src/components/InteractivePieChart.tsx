import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarData, Activity } from '../types/framework';
import { Filter } from 'lucide-react';

interface InteractivePieChartProps {
    data: CalendarData;
}

type MetricType = 'cartoes' | 'custo' | 'envios' | 'aprovacoes' | 'cac';
type GroupByType = 'canal' | 'bu' | 'parceiro' | 'oferta' | 'segmento';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({ data }) => {
    const [metric, setMetric] = useState<MetricType>('cartoes');
    const [groupBy, setGroupBy] = useState<GroupByType>('canal');

    const chartData = useMemo(() => {
        const groups: { [key: string]: { name: string; value: number; cost: number; cards: number } } = {};

        Object.values(data).flat().forEach((activity: Activity) => {
            let key = '';
            switch (groupBy) {
                case 'canal': key = activity.canal; break;
                case 'bu': key = activity.bu; break;
                case 'parceiro': key = activity.parceiro; break;
                case 'oferta': key = activity.oferta || 'Padrao'; break;
                case 'segmento': key = activity.segmento; break;
            }

            if (!key) key = 'Outros';

            if (!groups[key]) {
                groups[key] = { name: key, value: 0, cost: 0, cards: 0 };
            }

            const kpis = activity.kpis;

            // Accumulate raw values first
            groups[key].cost += kpis.custoTotal || 0;
            groups[key].cards += kpis.cartoes || 0;

            // Determine value based on metric
            switch (metric) {
                case 'cartoes':
                    groups[key].value += kpis.cartoes || 0;
                    break;
                case 'custo':
                    groups[key].value += kpis.custoTotal || 0;
                    break;
                case 'envios':
                    groups[key].value += kpis.baseEnviada || 0;
                    break;
                case 'aprovacoes':
                    groups[key].value += kpis.aprovados || 0;
                    break;
                case 'cac':
                    // CAC will be calculated after aggregation
                    break;
            }
        });

        let result = Object.values(groups);

        // Special handling for CAC: calculate it per group
        if (metric === 'cac') {
            result = result.map(g => ({
                ...g,
                value: g.cards > 0 ? parseFloat((g.cost / g.cards).toFixed(2)) : 0
            }));
        }

        // Sort by value descending
        return result.sort((a, b) => b.value - a.value);
    }, [data, metric, groupBy]);

    const formatValue = (value: number) => {
        if (metric === 'custo') return `R$ ${(value / 1000).toFixed(1)}k`;
        if (metric === 'cac') return `R$ ${value.toFixed(2)}`;
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const getTotal = () => {
        if (metric === 'cac') {
            // Weighted average CAC
            const totalCost = chartData.reduce((acc, curr) => acc + curr.cost, 0);
            const totalCards = chartData.reduce((acc, curr) => acc + curr.cards, 0);
            return totalCards > 0 ? (totalCost / totalCards) : 0;
        }
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    };

    const total = getTotal();

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Filter size={20} className="text-blue-400" />
                    Distribuição
                </h2>

                <div className="flex gap-2">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as MetricType)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="cartoes">Cartões Gerados</option>
                        <option value="custo">Custo Total</option>
                        <option value="envios">Base Enviada</option>
                        <option value="aprovacoes">Aprovações</option>
                        <option value="cac">CAC Médio</option>
                    </select>

                    <span className="text-slate-500 self-center">por</span>

                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupByType)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="canal">Canal</option>
                        <option value="bu">BU</option>
                        <option value="parceiro">Parceiro</option>
                        <option value="oferta">Oferta</option>
                        <option value="segmento">Segmento</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => formatValue(value)}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ color: '#94a3b8' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
                        <p className="text-sm text-slate-400 mb-1">
                            {metric === 'cac' ? 'CAC Médio Global' : 'Total Geral'}
                        </p>
                        <p className="text-3xl font-bold text-white">
                            {formatValue(total)}
                        </p>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-2 hover:bg-slate-700/30 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-slate-300">{item.name}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-medium text-slate-200">{formatValue(item.value)}</span>
                                    {metric !== 'cac' && total > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {((item.value / total) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
