
import React from 'react';
import { CorrelationStats } from '../../hooks/useMediaCorrelation';
import { AlertTriangle, Info, Lightbulb, CheckCircle2 } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { format } from 'date-fns';

interface Props {
    stats: CorrelationStats | null;
}

export const CorrelationBadge: React.FC<Props> = ({ stats }) => {
    const { startDate, endDate } = usePeriod();
    const periodStr = `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!stats) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 text-center text-slate-400">
                Dados insuficientes para correlação neste período.
            </div>
        );
    }

    const { rSquared, quality, color, influenceMin, influenceMax, estimatedCardsMin, estimatedCardsMax, effectiveCacMin, effectiveCacMax, interpretation, bestLag } = stats || {
        rSquared: 0, quality: 'Baixa', color: '#EF4444', influenceMin: 0, influenceMax: 0, estimatedCardsMin: 0, estimatedCardsMax: 0, effectiveCacMin: 0, effectiveCacMax: 0, interpretation: '', bestLag: 3
    };

    // Formatting Helpers
    const fmtPct = (v: number) => (v * 100).toFixed(0) + '%';
    const fmtNum = (v: number) => Math.round(v).toLocaleString('pt-BR');
    const fmtCur = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-1 shadow-sm mb-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-5 border border-slate-200">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Estimativa de Influência (B2C c/ Lag)
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">
                            Base: Correlação Spend vs Cartões B2C (Lag de {bestLag} dias) • Período: {diffDays} dias
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-sm text-slate-500 font-medium">Correlação (R²)</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-900">{rSquared.toFixed(2)}</span>
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: color }}
                            >
                                {quality}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Est. Influence */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <span className="text-slate-700 font-bold text-sm">Estimado: {fmtPct(influenceMin)}-{fmtPct(influenceMax)} dos cartões CRM</span>
                        </div>
                        <div className="text-slate-500 text-xs pl-6">
                            ≈ {fmtNum(estimatedCardsMin)} - {fmtNum(estimatedCardsMax)} cartões
                        </div>
                    </div>

                    {/* Effective CAC */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Info size={16} className="text-blue-500" />
                            <span className="text-slate-700 font-bold text-sm">CAC Efetivo Mídia</span>
                        </div>
                        <div className="text-slate-600 font-medium text-sm pl-6">
                            {fmtCur(effectiveCacMin)} - {fmtCur(effectiveCacMax)}
                            <span className="text-slate-400 font-normal text-xs ml-1">(vs CPA aparente)</span>
                        </div>
                    </div>
                </div>

                {/* Interpretation */}
                <div className="mb-4">
                    <div className="flex items-start gap-2">
                        <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-slate-600 text-sm italic">
                            Interpretação: {interpretation}
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-red-50 border border-red-100 rounded-md p-2 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-red-700 leading-tight">
                        <strong>AVISO:</strong> Correlação não é Atribuição. Sem rastreamento user-level, estes números são apenas estimativas estatísticas de influência possível baseadas na sincronia temporal.
                    </p>
                </div>
            </div>
        </div>
    );
};
