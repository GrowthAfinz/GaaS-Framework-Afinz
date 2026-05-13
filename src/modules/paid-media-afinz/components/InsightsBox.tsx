import React, { useMemo } from 'react';
import type { DailyMetrics } from '../types';
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface InsightsBoxProps {
    data: DailyMetrics[];
}

export const InsightsBox: React.FC<InsightsBoxProps> = ({ data }) => {
    const insights = useMemo(() => {
        const list: { icon: React.ReactNode, text: string, type: 'good' | 'bad' | 'neutral' }[] = [];

        if (data.length === 0) return list;

        // 1. Efficiency Relative (Meta vs Google)
        const meta = data.filter(d => d.channel === 'meta');
        const google = data.filter(d => d.channel === 'google');

        const getCPA = (ds: DailyMetrics[]) => {
            const spend = ds.reduce((a, b) => a + b.spend, 0); // Corrected variable name
            const conv = ds.reduce((a, b) => a + b.conversions, 0); // Corrected variable name
            return conv ? spend / conv : 0;
        };

        const metaCPA = getCPA(meta);
        const googleCPA = getCPA(google);

        if (metaCPA > 0 && googleCPA > 0) {
            if (metaCPA < googleCPA) {
                const diff = ((googleCPA - metaCPA) / googleCPA) * 100;
                list.push({
                    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                    text: `Meta está ${diff.toFixed(0)}% mais eficiente (CPA) que Google. Considere aumentar investimento.`,
                    type: 'good'
                });
            } else {
                const diff = ((metaCPA - googleCPA) / metaCPA) * 100;
                list.push({
                    icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
                    text: `Google está ${diff.toFixed(0)}% mais eficiente (CPA) que Meta. Aproveite a oportunidade.`,
                    type: 'good'
                });
            }
        }

        // 2. Anomalies (Recent CTR Drop)
        // Sort by date
        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Group by day recent
        // Simply check last 3 days vs previous 3 days
        // Too complex for simple inline? Let's check overall trend.
        // Let's just create some randomized/heuristic insights if data allows.

        // Check Spending Pacing
        const now = new Date();
        const day = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const progressMonth = day / daysInMonth; // e.g. 0.6

        // This requires "Budget" context. We don't have budget mapped to "Current Spend" easily here without BudgetManager lookup.
        // Skipping Budget pacing for now unless we fetch it.

        // Best Performer Campaign
        const campMap = new Map<string, { spend: number, conv: number }>();
        data.forEach(d => {
            const curr = campMap.get(d.campaign) || { spend: 0, conv: 0 };
            curr.spend += d.spend;
            curr.conv += d.conversions;
            campMap.set(d.campaign, curr);
        });

        let bestCamp = '';
        let bestCPA = Infinity;

        campMap.forEach((v, k) => {
            if (v.conv > 5) { // min threshold
                const cpa = v.spend / v.conv;
                if (cpa < bestCPA) {
                    bestCPA = cpa;
                    bestCamp = k;
                }
            }
        });

        if (bestCamp) {
            list.push({
                icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
                text: `Campanha "${bestCamp}" tem o melhor desempenho (CPA R$ ${bestCPA.toFixed(2)}).`,
                type: 'neutral'
            });
        }

        return list;
    }, [data]);

    if (insights.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Lightbulb className="text-indigo-500" />
                Insights Inteligentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{insight.icon}</div>
                        <p className="text-sm text-slate-700">{insight.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
