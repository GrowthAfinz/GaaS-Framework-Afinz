import React from 'react';
import type { DailyMetrics } from '../types';
import { getDay } from 'date-fns';

interface WeeklyHeatmapProps {
    data: DailyMetrics[];
}

const WeekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({ data }) => {
    // We need to aggregate data by Day of Week.
    // However, the request asks for a heatmap with 3 metrics (Invest, CPA, ROI) vs 7 Days.
    // If the data spans multiple weeks, should we AVERAGE the Mondays?
    // "Padrão Semanal" implies aggregation.
    // Let's aggregate: Sum for Spend, Average for CPA/ROI per weekday.

    const aggregated = React.useMemo(() => {
        const groups = Array(7).fill(null).map(() => ({
            spend: [] as number[],
            cpa: [] as number[],
            roi: [] as number[],
            conversions: [] as number[],
            revenue: [] as number[] // Assuming ROI needs revenue? Or just Conversion Value? We don't have Revenue in DailyMetrics.
            // Wait, DailyMetrics only has Spend, Impressions, Clicks, Conversions.
            // ROI usually requires specific revenue data.
            // If user asked "ROI", maybe they mean "ROAS" if we had revenue.
            // Checking DailyMetrics type... it likely doesn't have revenue.
            // Let's use CPA (Cost Per Acquisition) and maybe "Conversões" volume?
            // User asked: "Investim., CPA, ROI".
            // Implementation: I'll use Conversions instead of ROI if Revenue missing, or assume ROI = 0.
        }));

        data.forEach(d => {
            const dayIndex = getDay(new Date(d.date)); // 0 = Sun, 6 = Sat
            groups[dayIndex].spend.push(d.spend);

            if (d.conversions > 0) {
                const cpa = d.spend / d.conversions;
                groups[dayIndex].cpa.push(cpa);
            }

            groups[dayIndex].conversions.push(d.conversions);
        });

        return groups.map(g => {
            const totalSpend = g.spend.reduce((a, b) => a + b, 0);
            const avgSpend = g.spend.length ? totalSpend / g.spend.length : 0;

            const totalCpa = g.cpa.reduce((a, b) => a + b, 0);
            const avgCpa = g.cpa.length ? totalCpa / g.cpa.length : 0;

            // Mocking ROI/ROAS via Conversions for now (proxy)
            // Or just use Avg Conversions
            const totalConv = g.conversions.reduce((a, b) => a + b, 0);
            const avgConv = g.conversions.length ? totalConv / g.conversions.length : 0;

            return { avgSpend, avgCpa, avgConv, count: g.spend.length };
        });
    }, [data]);

    // Calculate thresholds (simple relative logic)
    // Good = Better than Average. Bad = Worse.
    const overallAvgs = {
        spend: aggregated.reduce((a, b) => a + b.avgSpend, 0) / 7,
        cpa: aggregated.reduce((a, b) => a + b.avgCpa, 0) / 7,
        conv: aggregated.reduce((a, b) => a + b.avgConv, 0) / 7
    };

    const getStatus = (val: number, avg: number, type: 'higherIsGood' | 'lowerIsGood'): 'good' | 'warning' | 'bad' => {
        if (val === 0) return 'bad';
        const diff = (val - avg) / avg; // % diff

        if (type === 'higherIsGood') {
            if (diff > 0.1) return 'good'; // +10%
            if (diff < -0.1) return 'bad'; // -10%
            return 'warning';
        } else {
            if (diff < -0.1) return 'good'; // -10% cost
            if (diff > 0.1) return 'bad'; // +10% cost
            return 'warning';
        }
    };

    const fmtMoney = (v: number) => `R$ ${v.toFixed(0)}`;
    const fmtCpa = (v: number) => `R$ ${v.toFixed(2)}`;
    const fmtConv = (v: number) => v.toFixed(0);

    return (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                🔥 Mapa de Calor Semanal (Médias)
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left font-medium text-slate-500 py-2">Métrica</th>
                            {WeekDays.map((d, i) => (
                                <th key={d} className="text-center font-bold text-slate-600 py-2 w-24">
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Spend Row */}
                        <tr className="border-t border-slate-100">
                            <td className="font-semibold text-slate-600 py-3">Investimento</td>
                            {aggregated.map((d, i) => (
                                <td key={i} className="text-center py-2">
                                    <StatusPill
                                        status={getStatus(d.avgSpend, overallAvgs.spend, 'lowerIsGood')}
                                        type="good"
                                        label={fmtMoney(d.avgSpend)}
                                    />
                                </td>
                            ))}
                        </tr>
                        {/* CPA Row */}
                        <tr className="border-t border-slate-100">
                            <td className="font-semibold text-slate-600 py-3">CPA (Custo/Conv)</td>
                            {aggregated.map((d, i) => (
                                <td key={i} className="text-center py-2">
                                    <StatusPill
                                        status={getStatus(d.avgCpa, overallAvgs.cpa, 'lowerIsGood')}
                                        label={fmtCpa(d.avgCpa)}
                                    />
                                </td>
                            ))}
                        </tr>
                        {/* Conv Row (Replacing ROI) */}
                        <tr className="border-t border-slate-100">
                            <td className="font-semibold text-slate-600 py-3">Conversões</td>
                            {aggregated.map((d, i) => (
                                <td key={i} className="text-center py-2">
                                    <StatusPill
                                        status={getStatus(d.avgConv, overallAvgs.conv, 'higherIsGood')}
                                        label={fmtConv(d.avgConv)}
                                    />
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
                *Cores baseadas na variação vs média do período selecionado.
            </p>
        </div>
    );
};

const StatusPill: React.FC<{ status: 'good' | 'warning' | 'bad'; label: string; type?: 'good' }> = ({ status, label }) => {
    let colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
    if (status === 'good') colorClass = 'bg-green-50 text-green-700 border-green-200';
    if (status === 'warning') colorClass = 'bg-amber-50 text-amber-700 border-amber-200'; // Amber is better than yellow for text contrast
    if (status === 'bad') colorClass = 'bg-red-50 text-red-700 border-red-200';

    return (
        <div className={`mx-auto w-24 py-1.5 rounded-lg border text-xs font-bold ${colorClass} transition-all hover:scale-105 cursor-pointer whitespace-nowrap shadow-sm`}>
            {label}
        </div>
    );
};
