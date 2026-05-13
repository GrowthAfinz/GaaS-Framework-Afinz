import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { HelpCircle } from 'lucide-react';

export const ChannelComparisonChart: React.FC = () => {
    const { paidMediaData } = useAppStore();

    const data = useMemo(() => {
        // Group by Channel
        const grouped = paidMediaData.reduce((acc, curr) => {
            const ch = curr.channel;
            if (!acc[ch]) {
                acc[ch] = { channel: ch, spend: 0, conversions: 0, clicks: 0 };
            }
            acc[ch].spend += curr.spend;
            acc[ch].conversions += curr.conversions;
            acc[ch].clicks += curr.clicks;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).map(d => ({
            ...d,
            cpa: d.conversions > 0 ? d.spend / d.conversions : 0
        }));
    }, [paidMediaData]);

    // Custom color function for charts
    const getBarColor = (channel: string) => {
        if (channel === 'meta') return '#60A5FA'; // Blue-400
        if (channel === 'google') return '#F87171'; // Red-400
        if (channel === 'tiktok') return '#F472B6'; // Pink-400
        return '#94A3B8';
    };

    if (data.length === 0) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-[300px] flex flex-col items-center justify-center text-slate-500">
                <BarChart className="mb-2 opacity-50" />
                <p>Sem dados para gráfico comparativo</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-slate-100 font-bold text-lg">Comparativo de Canais</h3>
                    <p className="text-slate-400 text-xs">Investimento Total vs Conversões</p>
                </div>
                <div className="group relative">
                    <HelpCircle size={18} className="text-slate-500 cursor-help" />
                    <div className="absolute right-0 top-6 w-64 bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-20 hidden group-hover:block">
                        <p className="text-xs text-slate-300">
                            Compara o volume de investimento e o retorno em conversões de cada canal. Identifique canais com alto custo e baixa conversão.
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="channel"
                            type="category"
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
                            formatter={(value: number, name: string) => [
                                name === 'spend' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : value,
                                name === 'spend' ? 'Investimento' : 'Conversões'
                            ]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="spend" name="Investimento" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.channel)} />
                            ))}
                        </Bar>
                        <Bar dataKey="conversions" name="Conversões" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
