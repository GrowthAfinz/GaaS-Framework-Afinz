import React, { useMemo } from 'react';
import type { DailyMetrics } from '../types';
import { ArrowRight } from 'lucide-react';

interface ChannelComparisonMatrixProps {
    data: DailyMetrics[];
}

export const ChannelComparisonMatrix: React.FC<ChannelComparisonMatrixProps> = ({ data = [] }) => {
    const stats = useMemo(() => {
        const meta = data.filter(d => d.channel === 'meta');
        const google = data.filter(d => d.channel === 'google');

        const calc = (rows: DailyMetrics[]) => {
            const spend = rows.reduce((a, b) => a + b.spend, 0);
            const imp = rows.reduce((a, b) => a + b.impressions, 0);
            const clicks = rows.reduce((a, b) => a + b.clicks, 0);
            const conv = rows.reduce((a, b) => a + b.conversions, 0);
            const cpm = imp ? (spend / imp) * 1000 : 0;
            const cpa = conv ? spend / conv : 0;
            // User requested ROI. We don't have Revenue.
            // Let's assume ROI = ROAS. If no revenue, maybe use Conv Value proxy?
            // Actually, in previous steps I saw no revenue field.
            // I will skip ROI row or iterate with Mock if strictly needed.
            // User example has ROI: "2.4x | 3.8x".
            // I'll calculate ROAS if revenue exists, else mock or hide.
            // Let's use CPA instead as primary efficiency metric if ROI is impossible.
            // Wait, looking at "Ação": "Meta 41% mais barato" (CPM).

            return { spend, imp, clicks, conv, cpm, cpa };
        };

        return {
            meta: calc(meta),
            google: calc(google)
        };
    }, [data]);

    const renderRow = (
        label: string,
        metaVal: number,
        googleVal: number,
        format: (v: number) => string,
        inverse = false,
        suffix = ''
    ) => {
        // Validation
        if (metaVal === 0 && googleVal === 0) return null;

        // Logic
        const metaBetter = inverse ? metaVal < googleVal : metaVal > googleVal;
        const googleBetter = inverse ? googleVal < metaVal : googleVal > metaVal;

        let action = 'Manter';
        let diffPct = 0;

        if (metaVal > 0 && googleVal > 0) {
            // Calc Diff
            const max = Math.max(metaVal, googleVal);
            const min = Math.min(metaVal, googleVal);
            diffPct = ((max - min) / min) * 100;

            if (metaBetter) {
                action = `Meta ${diffPct.toFixed(0)}% melhor`;
            } else if (googleBetter) {
                action = `Google ${diffPct.toFixed(0)}% melhor`;
            }

            // Refine Action Text based on magnitude
            if (inverse) {
                // Cost Metrics (Lower is better)
                // If Meta is 30% lower -> "Meta 30% mais barato" (Cheaper)
                // If Meta is higher -> "Google 30% mais barato"
                const cheaper = metaBetter ? 'Meta' : 'Google';
                action = `${cheaper} ${diffPct.toFixed(0)}% mais eficiente`;
            } else {
                // Volume Metrics (Higher is better)
                const higher = metaBetter ? 'Meta' : 'Google';
                action = `${higher} ${diffPct.toFixed(0)}% maior volume`;
            }
        }

        return (
            <tr className="border-b border-slate-100 last:border-0 hover:bg-orange-50/50 transition-colors group">
                <td className="py-4 px-4 font-medium text-slate-600 bg-white group-hover:bg-orange-50/50">{label}</td>

                {/* Meta */}
                <td className="py-4 px-4 text-right border-l border-r border-slate-100 bg-[#1877F2]/5 text-slate-700">
                    <div className="font-semibold">{format(metaVal)}<span className="text-xs text-slate-400 font-normal ml-0.5">{suffix}</span></div>
                    {metaBetter && <div className="text-[10px] text-green-600 font-bold uppercase tracking-wide mt-1">Vencedor</div>}
                </td>

                {/* Google */}
                <td className="py-4 px-4 text-right border-r border-slate-100 bg-[#ea4335]/5 text-slate-700">
                    <div className="font-semibold">{format(googleVal)}<span className="text-xs text-slate-400 font-normal ml-0.5">{suffix}</span></div>
                    {googleBetter && <div className="text-[10px] text-green-600 font-bold uppercase tracking-wide mt-1">Vencedor</div>}
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs font-medium text-slate-500">
                        {action}
                        <ArrowRight size={14} className="text-orange-400" />
                    </div>
                </td>
            </tr>
        );
    };

    const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
    const fmtCPA = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);
    const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

    return (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="p-6 pb-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/30">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Análise de Canais</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Comparativo direto de performance</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-orange-50 text-slate-500 uppercase text-xs tracking-wider">
                            <th className="py-3 px-4 text-left font-bold w-1/5">Métrica</th>
                            <th className="py-3 px-4 text-right font-bold w-1/4 text-[#1877F2] bg-blue-50 border-b-2 border-[#1877F2]/20">Meta Ads</th>
                            <th className="py-3 px-4 text-right font-bold w-1/4 text-[#ea4335] bg-red-50 border-b-2 border-[#ea4335]/20">Google Ads</th>
                            <th className="py-3 px-4 text-right font-bold w-1/3">Ação / Insight</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderRow('Investimento', stats.meta.spend, stats.google.spend, fmtBRL, false)}
                        {renderRow('CPM (Custo Mil)', stats.meta.cpm, stats.google.cpm, fmtBRL, true)}
                        {renderRow('Conversões', stats.meta.conv, stats.google.conv, fmtNum, false)}
                        {renderRow('CPA (Custo Conv.)', stats.meta.cpa, stats.google.cpa, fmtCPA, true)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
