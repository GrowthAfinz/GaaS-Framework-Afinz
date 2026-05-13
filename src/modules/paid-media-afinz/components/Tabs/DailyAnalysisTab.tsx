import React, { useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { format, getDay, startOfWeek, addDays, getDaysInMonth, startOfMonth, isSameMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, AlertCircle, BarChart2, Grid, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const DailyAnalysisTab: React.FC = () => {
    const { filteredData } = useFilters();
    const [heatmapMetric, setHeatmapMetric] = useState<'cpa' | 'roas' | 'spend'>('cpa');

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

    // 1. Prepare Daily Table Data
    // We assume filteredData is already daily-row based, but we might have multiple rows per day (Meta + Google).
    // So we aggregate by Date.
    const dailyAggregated = useMemo(() => {
        const map = new Map<string, any>();

        filteredData.forEach(d => {
            const dateKey = String(d.date).substring(0, 10); // YYYY-MM-DD
            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    date: d.date,
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    revenue: 0 // If we had revenue
                });
            }
            const curr = map.get(dateKey);
            curr.spend += d.spend;
            curr.impressions += d.impressions;
            curr.clicks += d.clicks;
            curr.conversions += d.conversions;
        });

        const data = Array.from(map.values()).map(d => ({
            ...d,
            cpa: d.conversions ? d.spend / d.conversions : 0,
            ctr: d.impressions ? (d.clicks / d.impressions) * 100 : 0,
            cpm: d.impressions ? (d.spend / d.impressions) * 1000 : 0,
            cpc: d.clicks ? d.spend / d.clicks : 0,
            roas: d.spend ? (d.revenue || 0) / d.spend : 0 // Placeholder
        }));

        return data.sort((a, b) => {
            const aValue = sortConfig.key === 'date' ? new Date(a.date).getTime() : a[sortConfig.key];
            const bValue = sortConfig.key === 'date' ? new Date(b.date).getTime() : b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // 2. Weekday Analysis
    const weekdayData = useMemo(() => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const stats = days.map(day => ({ name: day, spend: 0, conversions: 0, clicks: 0, count: 0 }));

        dailyAggregated.forEach(d => {
            const dayIdx = getDay(new Date(d.date));
            stats[dayIdx].spend += d.spend;
            stats[dayIdx].conversions += d.conversions;
            stats[dayIdx].clicks += d.clicks;
            stats[dayIdx].count += 1;
        });

        return stats.map(s => ({
            ...s,
            avgCpa: s.conversions ? s.spend / s.conversions : 0,
            avgSpend: s.count ? s.spend / s.count : 0
        }));
    }, [dailyAggregated]);

    // 3. Heatmap Data (Calendar Grid)
    // We'll show the current selected month(s) as grids.
    // For simplicity, let's take the last month present in the data or the current range.
    // Let's just create a list of all days in the current filtered range.

    // Calculate global thresholds for Heatmap coloring
    const cpaValues = dailyAggregated.map(d => d.cpa).filter(v => v > 0);
    const avgCpa = cpaValues.reduce((a, b) => a + b, 0) / (cpaValues.length || 1);

    const getHeatmapColor = (val: number, metric: 'cpa' | 'roas' | 'spend') => {
        if (metric === 'cpa') {
            if (val === 0) return 'bg-slate-100 text-slate-400';
            if (val < avgCpa * 0.8) return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Good
            if (val > avgCpa * 1.5) return 'bg-red-100 text-red-700 border-red-200'; // Bad
            return 'bg-blue-50 text-blue-700 border-blue-100'; // Neutral
        }
        return 'bg-slate-50';
    };

    const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

    if (filteredData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm animate-fade-in">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Grid className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Sem dados para este período</h3>
                <p className="text-slate-500 text-sm">Tente ajustar os filtros de data ou canais.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Análise Diária</h2>
                    <p className="text-slate-500">Identifique padrões e anomalias dia a dia.</p>
                </div>
            </div>

            {/* Daily Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Grid size={18} className="text-primary" />
                        Detalhamento Diário
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                {[
                                    { key: 'date', label: 'Data', align: 'left' },
                                    { key: 'spend', label: 'Inv.', align: 'right' },
                                    { key: 'impressions', label: 'Impr.', align: 'right' },
                                    { key: 'clicks', label: 'Cliques', align: 'right' },
                                    { key: 'conversions', label: 'Conv.', align: 'right' },
                                    { key: 'ctr', label: 'CTR', align: 'right' },
                                    { key: 'cpm', label: 'CPM', align: 'right' },
                                    { key: 'cpc', label: 'CPC', align: 'right' },
                                    { key: 'cpa', label: 'CPA', align: 'right' },
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors group text-${col.align}`}
                                        onClick={() => handleSort(col.key)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                            {col.label}
                                            <ArrowUpDown size={12} className={`text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === col.key ? 'opacity-100 text-blue-500' : ''}`} />
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dailyAggregated.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-700 whitespace-nowrap">
                                        {format(new Date(row.date), "dd 'de' MMM, EEEE", { locale: ptBR })}
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-600">{fmtBRL(row.spend)}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{fmtNum(row.impressions)}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{fmtNum(row.clicks)}</td>
                                    <td className="px-6 py-3 text-right text-slate-600 font-bold">{fmtNum(row.conversions)}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{row.ctr.toFixed(2)}%</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{fmtBRL(row.cpm)}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{fmtBRL(row.cpc)}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${row.cpa > avgCpa * 1.2 ? 'text-red-500' :
                                        row.cpa < avgCpa * 0.8 ? 'text-emerald-500' : 'text-slate-600'
                                        }`}>
                                        {fmtBRL(row.cpa)}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {row.cpa === 0 && row.spend > 50 ?
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Crítico</span> :
                                            row.cpa > avgCpa * 1.3 ?
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">Atenção</span> :
                                                row.cpa < avgCpa * 0.8 && row.conversions > 0 ?
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">Ótimo</span> :
                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Normal</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekday Analysis Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <BarChart2 size={18} className="text-primary" />
                    Performance por Dia da Semana (Média)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekdayData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(val: any, name: any) => {
                                    if (name === 'CPA Médio') return fmtBRL(val);
                                    if (name === 'Investimento Médio') return fmtBRL(val);
                                    return val;
                                }}
                            />
                            <Bar yAxisId="right" dataKey="avgSpend" name="Investimento Médio" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.3} />
                            <Bar yAxisId="left" dataKey="avgCpa" name="CPA Médio" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40}>
                                {weekdayData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.avgCpa > avgCpa * 1.2 ? '#ef4444' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> CPA Saudável</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> CPA Alto</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500 opacity-30"></div> Volume de Investimento</div>
                </div>
            </div>
        </div>
    );
};
