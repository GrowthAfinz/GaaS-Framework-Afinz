import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Pin, PinOff, Check, Trash2 } from 'lucide-react';
import { CrmInsight } from '../../services/insightService';

const SEVERITY_STYLES: Record<string, { dot: string; badge: string; border: string; label: string }> = {
    critico: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', border: 'border-l-red-500', label: 'CRÍTICO' },
    alto: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-l-orange-500', label: 'ALTO' },
    medio: { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-l-amber-400', label: 'MÉDIO' },
    baixo: { dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-l-blue-400', label: 'BAIXO' },
};

const TIPO_LABELS: Record<string, string> = {
    gargalo: 'Gargalo de Funil',
    decomposicao_cac: 'Decomposição de CAC',
    share_portfolio: 'Share de Portfólio',
    risco_concentracao: 'Risco de Concentração',
    oportunidade: 'Oportunidade',
    queda_performance: 'Queda de Performance',
    virada_safra: 'Virada de Safra',
};

const CONFIANCA_LABELS: Record<string, string> = {
    alta: 'Confiança alta',
    media: 'Confiança média',
    baixa: 'Confiança baixa',
};

interface InsightCardProps {
    insight: CrmInsight;
    onUpdateStatus: (id: string, status: 'ativo' | 'fixado' | 'resolvido' | 'descartado') => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onUpdateStatus }) => {
    const [expanded, setExpanded] = useState(false);
    const style = SEVERITY_STYLES[insight.severidade] ?? SEVERITY_STYLES.baixo;
    const isPinned = insight.status === 'fixado';

    const contextChips = [
        insight.bu && `BU: ${insight.bu}`,
        insight.canal && `Canal: ${insight.canal}`,
        insight.segmento && `Segmento: ${insight.segmento}`,
        insight.etapa && `Etapa: ${insight.etapa}`,
        insight.safra && `Safra: ${insight.safra}`,
    ].filter(Boolean) as string[];

    return (
        <div className={`bg-white border border-slate-200 border-l-4 ${style.border} rounded-xl shadow-sm overflow-hidden`}>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${style.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${insight.severidade === 'critico' ? 'animate-pulse' : ''}`} />
                            {style.label}
                        </span>
                        <span className="text-slate-400">{TIPO_LABELS[insight.tipo] ?? insight.tipo}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{CONFIANCA_LABELS[insight.confianca]}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400 shrink-0" title="Prioridade (impacto × urgência × confiança / esforço)">
                        {Math.round(Number(insight.prioridade))}
                    </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 leading-snug">{insight.titulo}</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{insight.sinal}</p>

                {contextChips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {contextChips.map((chip) => (
                            <span key={chip} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                {chip}
                            </span>
                        ))}
                    </div>
                )}

                {expanded && (
                    <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impacto</p>
                            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{insight.impacto}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Causa Provável</p>
                            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{insight.causa_provavel}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Ação Sugerida</p>
                            <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{insight.acao}</p>
                            {insight.criterio_sucesso && (
                                <p className="text-[11px] text-blue-600 mt-1.5">
                                    <span className="font-semibold">Critério de sucesso:</span> {insight.criterio_sucesso}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? 'Recolher' : 'Detalhes'}
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onUpdateStatus(insight.id, isPinned ? 'ativo' : 'fixado')}
                            title={isPinned ? 'Desafixar' : 'Fixar no topo'}
                            className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                        >
                            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                        <button
                            onClick={() => onUpdateStatus(insight.id, 'resolvido')}
                            title="Marcar como resolvido"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => onUpdateStatus(insight.id, 'descartado')}
                            title="Descartar"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
