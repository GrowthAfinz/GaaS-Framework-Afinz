import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Metrics {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
}

interface PeriodComparisonChartProps {
    current: Metrics;
    previous: Metrics;
    show: boolean;
}

export const PeriodComparisonChart: React.FC<PeriodComparisonChartProps> = ({ current, previous, show }) => {
    if (!show) return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 flex items-center justify-center text-slate-500">
            <p>Habilite "Comparar anterior" para ver a análise de período.</p>
        </div>
    );

    const renderRow = (label: string, curr: number, prev: number, type: 'number' | 'currency' | 'percent' = 'number', inverse = false, precision = 0) => {
        const change = prev === 0 ? 0 : ((curr - prev) / prev) * 100;
        const isPositive = change > 0;
        const isNeutral = change === 0;

        let color = 'text-slate-500';
        if (!isNeutral) {
            if (isPositive) color = inverse ? 'text-red-400' : 'text-green-400';
            else color = inverse ? 'text-green-400' : 'text-red-400';
        }

        const format = (v: number) => {
            if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: precision, minimumFractionDigits: precision }).format(v);
            if (type === 'percent') return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(v) + '%';
            return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: precision }).format(v);
        };

        return (
            <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-orange-50/50 transition-colors px-2 rounded-lg">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Anterior</p>
                        <p className="text-sm font-medium text-slate-500">{format(prev)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Atual</p>
                        <p className="text-sm font-bold text-slate-800">{format(curr)}</p>
                    </div>
                    <div className={`w-16 text-right font-bold text-sm ${color}`}>
                        {change > 0 && '+'}{change.toFixed(1)}%
                    </div>
                </div>
            </div>
        );
    };

    // Derived Metrics
    const cpaCurr = current.conversions > 0 ? current.spend / current.conversions : 0;
    const cpaPrev = previous.conversions > 0 ? previous.spend / previous.conversions : 0;

    const ctrCurr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0;
    const ctrPrev = previous.impressions > 0 ? (previous.clicks / previous.impressions) * 100 : 0;

    return (
        <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                Comparativo de Período
            </h3>
            <div className="space-y-1">
                {renderRow('Investimento', current.spend, previous.spend, 'currency', true, 0)}
                {renderRow('Impressões', current.impressions, previous.impressions)}
                {renderRow('Cliques', current.clicks, previous.clicks)}
                {renderRow('Conversões', current.conversions, previous.conversions)}

                {/* Changes: Added CPA and CTR */}
                <div className="my-2 border-t border-dashed border-slate-200"></div>
                {renderRow('CPA', cpaCurr, cpaPrev, 'currency', true, 2)}
                {renderRow('CTR', ctrCurr, ctrPrev, 'percent', false, 2)}
            </div>
        </div>
    );
};
