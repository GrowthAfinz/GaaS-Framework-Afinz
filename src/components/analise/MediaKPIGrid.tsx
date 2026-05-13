import React from 'react';
import { CorrelationStats, CorrelationDataPoint } from '../../hooks/useMediaCorrelation';
import { Info, DollarSign, CreditCard, TrendingUp, MousePointer, Activity, Eye, Smartphone, Search } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface MediaKPIGridProps {
    stats: CorrelationStats | null;
    data: CorrelationDataPoint[];
}

export const MediaKPIGrid: React.FC<MediaKPIGridProps> = ({ stats, data }) => {
    if (!stats) return null;

    const {
        totalSpend, totalCards, effectiveCpa, conversionRateB2C,
        avgCpm, avgCtr, bestLag, cpaMetaPixel, cpaGooglePixel
    } = stats;

    const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNum = (v: number) => v.toLocaleString('pt-BR');
    const formatPct = (v: number) => (v * 100).toFixed(2) + '%';

    const getData = (key: string) => {
        return data.map((d, i) => {
            let val = 0;
            if (key === 'spend') val = d.spendTotal;
            if (key === 'cards') val = d.cards;
            if (key === 'cpa') val = d.cpa || 0;
            if (key === 'conv') val = d.conversionRate;
            if (key === 'cpm') val = d.impressions > 0 ? (d.spendTotal / d.impressions) * 1000 : 0;
            if (key === 'ctr') val = d.impressions > 0 ? d.clicks / d.impressions : 0;
            return { i, val };
        });
    };

    const cards = [
        {
            label: 'Spend Mídia',
            value: formatBRL(totalSpend),
            sub: 'Meta + Google',
            icon: DollarSign,
            color: '#818cf8',
            chartColor: '#818cf8',
            dataKey: 'spend',
            tooltip: 'Investimento total em mídia paga no período selecionado.'
        },
        {
            label: 'Cartões B2C',
            value: formatNum(totalCards),
            sub: `Total no Período`,
            icon: CreditCard,
            color: '#34d399',
            chartColor: '#34d399',
            dataKey: 'cards',
            tooltip: `Total de cartões emitidos (B2C_Originacao).`
        },
        {
            label: 'CPA Efetivo',
            value: formatBRL(effectiveCpa),
            sub: 'Spend / Cartões',
            icon: Activity,
            color: effectiveCpa > 350 ? '#f87171' : effectiveCpa < 200 ? '#34d399' : '#fbbf24',
            chartColor: effectiveCpa > 350 ? '#f87171' : effectiveCpa < 200 ? '#34d399' : '#fbbf24',
            dataKey: 'cpa',
            tooltip: 'Custo por Aquisição real (Spend Total / Cartões Totais).'
        },
        {
            label: 'Taxa Conv. B2C',
            value: formatPct(conversionRateB2C),
            sub: 'Cartões / Propostas',
            icon: TrendingUp,
            color: conversionRateB2C > 0.025 ? '#34d399' : conversionRateB2C < 0.02 ? '#f87171' : '#fbbf24',
            chartColor: conversionRateB2C > 0.025 ? '#34d399' : conversionRateB2C < 0.02 ? '#f87171' : '#fbbf24',
            dataKey: 'conv',
            tooltip: 'Conversão de Propostas B2C para Cartões (2.5% é meta).'
        },
        {
            label: 'CPM Médio',
            value: formatBRL(avgCpm),
            sub: 'Custo / 1k Impr.',
            icon: Eye,
            color: '#60a5fa',
            chartColor: '#60a5fa',
            dataKey: 'cpm',
            tooltip: 'Custo médio para exibir 1000 impressões.'
        },
        {
            label: 'CTR Médio',
            value: formatPct(avgCtr),
            sub: 'Cliques / Impr.',
            icon: MousePointer,
            color: '#c084fc',
            chartColor: '#c084fc',
            dataKey: 'ctr',
            tooltip: 'Taxa de Cliques média dos anúncios (0.4% é bom).'
        }
    ];

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-500/30 transition-all relative group overflow-hidden h-32 flex flex-col justify-between">
                        <div className="flex justify-between items-start p-4 z-10 relative">
                            <div className="flex items-center gap-1.5">
                                <c.icon size={16} style={{ color: c.color }} />
                                <span className="text-slate-500 text-sm font-medium">{c.label}</span>
                                <div className="group/tip relative">
                                    <Info size={12} className="cursor-help opacity-40 hover:opacity-100 text-slate-700 transition-opacity" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tip:block bg-white border border-slate-200 text-xs text-slate-900 p-2 rounded w-48 shadow-xl z-50 pointer-events-none">
                                        {c.tooltip}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 z-10 relative">
                            <div className="text-2xl font-bold mb-0.5" style={{ color: c.chartColor }}>{c.value}</div>
                            <div className="text-[10px] text-slate-500">{c.sub}</div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none z-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getData(c.dataKey)}>
                                    <defs>
                                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={c.chartColor} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={c.chartColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="val" stroke={c.chartColor} fill={`url(#grad-${i})`} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>

            {/* Channel Efficiency Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Smartphone size={16} className="text-indigo-600" />
                        <span className="text-slate-700 font-medium">Meta Ads</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">CPA Pixel:</span>
                        <span className={`font-bold ${cpaMetaPixel > 350 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {cpaMetaPixel > 0 ? formatBRL(cpaMetaPixel) : 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-blue-600" />
                        <span className="text-slate-700 font-medium">Google Ads</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">CPA Pixel:</span>
                        <span className={`font-bold ${cpaGooglePixel > 350 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {cpaGooglePixel > 0 ? formatBRL(cpaGooglePixel) : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
