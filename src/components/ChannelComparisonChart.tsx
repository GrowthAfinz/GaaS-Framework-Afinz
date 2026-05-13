import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarData, Activity } from '../types/framework';
import { BarChart3 } from 'lucide-react';

interface ChannelComparisonChartProps {
    data: CalendarData;
}

type MetricType = 'cartoes' | 'custo' | 'envios' | 'aprovacoes' | 'cac' | 'conversao';

const COLORS = {
    'Email': '#3B82F6',
    'SMS': '#10B981',
    'WhatsApp': '#8B5CF6',
    'Push': '#F59E0B',
    'Outros': '#64748B'
};

export const ChannelComparisonChart: React.FC<ChannelComparisonChartProps> = ({ data }) => {
    const [metric, setMetric] = useState<MetricType>('conversao');

    const chartData = useMemo(() => {
        const groups: { [key: string]: { name: string; value: number; cost: number; cards: number; envios: number; aprovacoes: number } } = {};

        Object.values(data).flat().forEach((activity: Activity) => {
            const key = activity.canal || 'Outros';

            if (!groups[key]) {
                groups[key] = { name: key, value: 0, cost: 0, cards: 0, envios: 0, aprovacoes: 0 };
            }

            const kpis = activity.kpis;

            groups[key].cost += kpis.custoTotal || 0;
            groups[key].cards += kpis.cartoes || 0;
            groups[key].envios += kpis.baseEnviada || 0;
            groups[key].aprovacoes += kpis.aprovados || 0;
        });

        let result = Object.values(groups).map(g => {
            let value = 0;
            switch (metric) {
                case 'cartoes': value = g.cards; break;
                case 'custo': value = g.cost; break;
                case 'envios': value = g.envios; break;
                case 'aprovacoes': value = g.aprovacoes; break;
                case 'cac': value = g.cards > 0 ? g.cost / g.cards : 0; break;
                case 'conversao': value = g.envios > 0 ? (g.cards / g.envios) * 100 : 0; break;
            }
            return { ...g, value };
        });

        // Sort by value descending
        return result.sort((a, b) => b.value - a.value);
    }, [data, metric]);

    const formatValue = (value: number) => {
        if (metric === 'custo') return `R$ ${(value / 1000).toFixed(1)}k`;
        if (metric === 'cac') return `R$ ${value.toFixed(2)}`;
        if (metric === 'conversao') return `${value.toFixed(2)}%`;
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const getMetricLabel = () => {
        switch (metric) {
            case 'cartoes': return 'Cartões Gerados';
            case 'custo': return 'Custo Total';
            case 'envios': return 'Base Enviada';
            case 'aprovacoes': return 'Aprovações';
            case 'cac': return 'CAC Médio';
            case 'conversao': return 'Taxa de Conversão';
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BarChart3 size={20} className="text-emerald-400" />
                    Comparativo de Canais
                </h2>

                <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as MetricType)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    <option value="conversao">Taxa de Conversão</option>
                    <option value="cac">CAC Médio</option>
                    <option value="cartoes">Cartões Gerados</option>
                    <option value="custo">Custo Total</option>
                    <option value="aprovacoes">Aprovações</option>
                    <option value="envios">Base Enviada</option>
                </select>
            </div>

            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                            formatter={(value: number) => [formatValue(value), getMetricLabel()]}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS['Outros']} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
