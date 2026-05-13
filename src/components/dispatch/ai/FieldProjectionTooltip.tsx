import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { FieldProjection, ProjectableMetric } from '../../../services/ml/types';
import { formatMetricValue, generateTooltipTitle } from '../../../services/ml/explanationGenerator';
import { ConfidenceBar } from './ConfidenceBar';
import { CausalFactorsList } from './CausalFactorsList';
import { SimilarCampaignsList } from './SimilarCampaignsList';

interface FieldProjectionTooltipProps {
    projection: FieldProjection;
    isOpen: boolean;
    onClose: () => void;
    onAccept: (value: number) => void;
    onReject: () => void;
    anchorRect?: DOMRect | null;
    position?: 'right' | 'left' | 'bottom';
}

/**
 * Tooltip de projecao que aparece ao clicar em um campo
 * Mostra: valor projetado, intervalo, confianca, fatores causais, campanhas similares
 * Botoes: Aceitar / Rejeitar
 */
export const FieldProjectionTooltip: React.FC<FieldProjectionTooltipProps> = ({
    projection,
    isOpen,
    onClose,
    onAccept,
    onReject,
    anchorRect,
    position = 'right'
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    // Calcular posicao do tooltip
    useEffect(() => {
        if (!isOpen || !anchorRect || !tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = anchorRect.top;
        let left = anchorRect.right + 8;

        // Ajustar se sair da tela pela direita
        if (left + tooltipRect.width > viewportWidth - 20) {
            left = anchorRect.left - tooltipRect.width - 8;
        }

        // Ajustar se sair da tela por baixo
        if (top + tooltipRect.height > viewportHeight - 20) {
            top = viewportHeight - tooltipRect.height - 20;
        }

        // Ajustar se sair da tela por cima
        if (top < 20) {
            top = 20;
        }

        setTooltipPosition({ top, left });
    }, [isOpen, anchorRect]);

    // Fechar ao clicar fora
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const { field, projectedValue, confidence, interval, explanation, similarCampaigns } = projection;

    // Formatar valor para exibicao
    const formattedValue = formatMetricValue(projectedValue, field);
    const formattedMin = formatMetricValue(interval.min, field);
    const formattedMax = formatMetricValue(interval.max, field);

    return (
        <div
            ref={tooltipRef}
            className="fixed z-[100] w-[320px] bg-white border border-indigo-500/30 rounded-xl shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-500/20 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                        {generateTooltipTitle(field)}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
                {/* Valor Projetado */}
                <div className="text-center py-2">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">
                        Valor Sugerido
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                        {formattedValue}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Intervalo: {formattedMin} - {formattedMax}
                    </div>
                </div>

                {/* Barra de Confianca */}
                <div className="bg-slate-50 rounded-lg p-2">
                    <ConfidenceBar
                        confidence={confidence}
                        size="md"
                        showLabel={true}
                        showPercentage={true}
                    />
                </div>

                {/* Resumo */}
                <div className="flex items-start gap-2 text-[10px] text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    <span>{explanation.summary}</span>
                </div>

                {/* Toggle Detalhes */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 py-1 transition-colors"
                >
                    {showDetails ? (
                        <>
                            <ChevronUp size={12} />
                            Ocultar detalhes
                        </>
                    ) : (
                        <>
                            <ChevronDown size={12} />
                            Ver detalhes
                        </>
                    )}
                </button>

                {/* Detalhes Expandidos */}
                {showDetails && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Fatores Causais */}
                        {explanation.causalFactors.length > 0 && (
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold mb-1.5">
                                    Fatores Causais
                                </div>
                                <CausalFactorsList
                                    factors={explanation.causalFactors}
                                    maxItems={3}
                                    compact={true}
                                />
                            </div>
                        )}

                        {/* Campanhas Similares */}
                        {similarCampaigns.length > 0 && (
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold mb-1.5">
                                    Campanhas Similares
                                </div>
                                <SimilarCampaignsList
                                    campaigns={similarCampaigns}
                                    maxItems={3}
                                    formatValue={(v) => formatMetricValue(v, field)}
                                />
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>Metodo: {explanation.matchLevel}</span>
                            <span>{explanation.sampleSize} amostras</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Botoes */}
            <div className="flex gap-2 px-3 py-2 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                <button
                    onClick={() => {
                        onReject();
                        onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <X size={14} />
                    Rejeitar
                </button>
                <button
                    onClick={() => {
                        onAccept(projectedValue);
                        onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Check size={14} />
                    Aceitar
                </button>
            </div>
        </div>
    );
};

export default FieldProjectionTooltip;
