import React from 'react';
import type { DailyMetrics } from '../../types';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { KPICard } from '../KPICard';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface CampaignDetailModalProps {
    campaign: string;
    data: DailyMetrics[];
    onClose: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, data, onClose }) => {
    // Aggregate data for this campaign
    const campaignData = data.filter(d => d.campaign === campaign).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalSpend = campaignData.reduce((a, b) => a + b.spend, 0);
    const totalImp = campaignData.reduce((a, b) => a + b.impressions, 0);
    const totalClicks = campaignData.reduce((a, b) => a + b.clicks, 0);
    const totalConv = campaignData.reduce((a, b) => a + b.conversions, 0);

    const cpm = totalImp ? (totalSpend / totalImp) * 1000 : 0;
    const ctr = totalImp ? (totalClicks / totalImp) * 100 : 0;
    const cpc = totalClicks ? (totalSpend / totalClicks) : 0;
    const cpa = totalConv ? (totalSpend / totalConv) : 0;

    const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

    // Chart Data (Daily Spend & Conv)
    const chartData = campaignData.map(d => ({
        date: format(new Date(d.date), 'dd/MM'),
        spend: d.spend,
        conversions: d.conversions
    }));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-start z-10 transition-all">
                    <div>
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase mb-2">
                            {campaignData[0]?.channel || 'Mídia'}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight">{campaign}</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {campaignData[0]?.objective === 'b2c' ? 'Objetivo: Conversão/App' : campaignData[0]?.objective === 'plurix' ? 'Objetivo: Plurix' : 'Objetivo: Branding/Marca'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard title="Investimento" value={fmtCurrency(totalSpend)} />
                        <KPICard title="Conversões" value={fmtNum(totalConv)} />
                        <KPICard title="CPA" value={fmtCurrency(cpa)} trendInverse />
                        <KPICard title="CTR" value={`${ctr.toFixed(2)}%`} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard title="Impressões" value={fmtNum(totalImp)} />
                        <KPICard title="Cliques" value={fmtNum(totalClicks)} />
                        <KPICard title="CPM" value={fmtCurrency(cpm)} trendInverse />
                        <KPICard title="CPC" value={fmtCurrency(cpc)} trendInverse />
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <h3 className="text-md font-bold text-slate-700 mb-4">Tendência Diária</h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gradientSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a8e800" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a8e800" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <Tooltip labelStyle={{ color: '#333' }} />
                                    <Area type="monotone" dataKey="spend" stroke="#a8e800" fill="url(#gradientSpend)" name="Investimento" />
                                    <Area type="monotone" dataKey="conversions" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Conversões" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
