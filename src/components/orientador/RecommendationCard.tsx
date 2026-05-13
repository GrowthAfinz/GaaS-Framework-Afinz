import React from 'react';
import { Recommendation } from '../../types/recommendations';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Clock } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface RecommendationCardProps {
    recommendation: Recommendation;
    onClick: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onClick }) => {
    const { combo, score, metrics, insights } = recommendation;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 border-emerald-400 bg-emerald-50';
        if (score >= 60) return 'text-yellow-600 border-yellow-400 bg-yellow-50';
        if (score >= 40) return 'text-orange-600 border-orange-400 bg-orange-50';
        return 'text-red-600 border-red-400 bg-red-50';
    };

    const getChannelColor = (canal: string) => {
        const c = canal.toLowerCase();
        if (c.includes('email') || c.includes('e-mail')) return 'bg-blue-50 text-blue-700 border-blue-200';
        if (c.includes('sms')) return 'bg-amber-50 text-amber-700 border-amber-200';
        if (c.includes('push')) return 'bg-purple-50 text-purple-700 border-purple-200';
        if (c.includes('whats')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return 'bg-slate-100 text-slate-700 border-slate-300';
    };

    const getRecencyInfo = (date: Date | null) => {
        if (!date) return { text: 'Nunca executado', color: 'text-blue-400' };

        const diffTime = Math.abs(new Date().getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return { text: `há ${diffDays} dias`, color: 'text-slate-500' };
        if (diffDays < 14) return { text: `há ${diffDays} dias`, color: 'text-yellow-500' };
        return { text: `há ${diffDays} dias`, color: 'text-emerald-500' };
    };

    const recency = getRecencyInfo(metrics.lastExecuted);
    const scoreColorClass = getScoreColor(score.finalScore);

    return (
        <div
            onClick={onClick}
            className={`bg-white border rounded-lg p-4 transition cursor-pointer group relative overflow-hidden hover:shadow-lg ${scoreColorClass.replace('text-', 'border-').split(' ')[1]}`}
        >
            {/* Background Gradient based on score */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none`} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getChannelColor(combo.canal)}`}>
                            {combo.canal}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-700">{combo.segmento}</span>
                        {combo.promocional && (
                            <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-200">
                                    {combo.promocional}
                                </span>
                            </>
                        )}

                        {/* Oferta 2 - Cyan/Teal */}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded border border-cyan-200">
                            {combo.oferta2}
                        </span>

                        {/* Promo 2 - Indigo */}
                        {combo.promocional2 && (
                            <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200">
                                    {combo.promocional2}
                                </span>
                            </>
                        )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2" title={combo.oferta}>
                        {combo.oferta}
                    </h3>
                </div>

                {/* Score Circle */}
                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 ${scoreColorClass}`}>
                    <span className="text-sm font-bold">{Math.round(score.finalScore)}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <Tooltip content="Custo de Aquisição Médio das campanhas">
                    <div className="bg-slate-50 rounded p-2 text-center group/metric relative cursor-help border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1">
                            <DollarSign size={10} /> CAC
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                            {metrics.avgCAC > 0 ? `R$ ${metrics.avgCAC.toFixed(0)}` : '-'}
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Taxa de Conversão Média (Aprovados / Entregues)">
                    <div className="bg-slate-50 rounded p-2 text-center group/metric relative cursor-help border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1">
                            <TrendingUp size={10} /> Conv.
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                            {(metrics.avgConversion * 100).toFixed(1)}%
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Número total de execuções desta combinação">
                    <div className="bg-slate-50 rounded p-2 text-center group/metric relative cursor-help border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1">
                            <Users size={10} /> Vol.
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                            {metrics.totalVolume}
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Data da última execução registrada">
                    <div className="bg-slate-50 rounded p-2 text-center group/metric relative cursor-help border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1">
                            <Clock size={10} /> Última
                        </div>
                        <div className={`text-[10px] font-semibold ${recency.color} leading-tight`}>
                            {recency.text}
                        </div>
                    </div>
                </Tooltip>
            </div>

            <div className="space-y-1">
                {insights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${insight.type === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                        insight.type === 'negative' ? 'bg-red-50 text-red-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                        {insight.type === 'positive' ? <TrendingUp size={10} /> :
                            insight.type === 'negative' ? <TrendingDown size={10} /> :
                                <Minus size={10} />}
                        {insight.text}
                    </div>
                ))}
            </div>
        </div>
    );
};
