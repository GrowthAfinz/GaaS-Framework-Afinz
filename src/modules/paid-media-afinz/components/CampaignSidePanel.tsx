import React, { useMemo } from 'react';
import type { DailyMetrics } from '../types';
import { X, TrendingUp, DollarSign, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface CampaignSidePanelProps {
    campaign: string | null;
    data: DailyMetrics[];
    onClose: () => void;
}

export const CampaignSidePanel: React.FC<CampaignSidePanelProps> = ({ campaign, data, onClose }) => {
    // 1. Filter Data for this Campaign
    const campaignData = useMemo(() => {
        if (!campaign) return [];
        return data
            .filter(d => d.campaign === campaign)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [campaign, data]);

    // 2. Aggregate Metrics
    const metrics = useMemo(() => {
        const totalSpend = campaignData.reduce((a, b) => a + b.spend, 0);
        const totalImp = campaignData.reduce((a, b) => a + b.impressions, 0);
        const totalClicks = campaignData.reduce((a, b) => a + b.clicks, 0);
        const totalConv = campaignData.reduce((a, b) => a + b.conversions, 0);

        const cpm = totalImp ? (totalSpend / totalImp) * 1000 : 0;
        const cpc = totalClicks ? totalSpend / totalClicks : 0;
        const ctr = totalImp ? (totalClicks / totalImp) * 100 : 0;
        const cpa = totalConv ? totalSpend / totalConv : 0;
        const convRate = totalClicks ? (totalConv / totalClicks) * 100 : 0;

        return { totalSpend, totalImp, totalClicks, totalConv, cpm, cpc, ctr, cpa, convRate };
    }, [campaignData]);

    if (!campaign) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl pointer-events-auto overflow-y-auto animate-slide-in-right">

                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur z-10 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detalhes da Campanha</div>
                        <h2 className="text-xl font-bold text-slate-800 leading-tight">{campaign}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Top Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-lime-50 rounded-xl border border-lime-100">
                            <div className="flex items-center gap-2 text-lime-700 mb-2">
                                <DollarSign size={16} />
                                <span className="text-xs font-bold uppercase">Valor</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalSpend)}
                            </div>
                        </div>
                        <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                            <div className="flex items-center gap-2 text-sky-700 mb-2">
                                <Target size={16} />
                                <span className="text-xs font-bold uppercase">Conv.</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {metrics.totalConv}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <span className="text-xs font-bold uppercase">CPA</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.cpa)}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <span className="text-xs font-bold uppercase">ROAS</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                -
                            </div>
                        </div>
                    </div>

                    {/* Chart: Spend vs Conversions */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp size={16} className="text-primary" />
                            Evolução Diária
                        </h3>
                        <div className="h-[250px] w-full bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={campaignData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(parseISO(str), 'dd/MM')}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        orientation="left"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `R$${v}`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                                        labelFormatter={(d) => format(parseISO(d), 'dd MMM, yyyy')}
                                    />
                                    <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#84cc16" strokeWidth={2} dot={false} name="Investimento" />
                                    <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Conversões" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700">Métricas Secundárias</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">CPM</div>
                                <div className="font-semibold text-slate-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.cpm)}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">CTR</div>
                                <div className="font-semibold text-slate-600">
                                    {metrics.ctr.toFixed(2)}%
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">CPC</div>
                                <div className="font-semibold text-slate-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.cpc)}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
