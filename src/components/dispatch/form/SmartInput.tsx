import React, { useRef, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { ProjectableMetric } from '../../../services/ml/types';

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onClick'> {
    // Props base
    label?: string;
    error?: string;
    required?: boolean;

    // Props de IA
    projectionField?: ProjectableMetric;
    hasProjection?: boolean;
    onProjectionClick?: (field: ProjectableMetric, element: HTMLElement) => void;
    isProjectionLoading?: boolean;
}

/**
 * Input inteligente com suporte a projecao de IA
 * Ao clicar no icone de IA, abre o tooltip de projecao
 */
export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(({
    label,
    error,
    required,
    projectionField,
    hasProjection = false,
    onProjectionClick,
    isProjectionLoading = false,
    className = '',
    ...props
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleProjectionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (projectionField && onProjectionClick && containerRef.current) {
            onProjectionClick(projectionField, containerRef.current);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    {label}
                    {required && <span className="text-blue-500">*</span>}

                    {/* Icone de IA */}
                    {projectionField && hasProjection && (
                        <button
                            type="button"
                            onClick={handleProjectionClick}
                            disabled={isProjectionLoading}
                            className={`
                                ml-auto p-0.5 rounded transition-all
                                ${isProjectionLoading
                                    ? 'text-indigo-400/50 cursor-wait'
                                    : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer'
                                }
                            `}
                            title="Clique para ver projecao de IA"
                        >
                            <Sparkles size={10} className={isProjectionLoading ? 'animate-pulse' : ''} />
                        </button>
                    )}
                </label>
            )}

            <div className="relative">
                <input
                    ref={ref}
                    className={`
                        w-full px-2 py-1.5
                        bg-white border rounded
                        text-[11px] font-medium text-slate-900
                        placeholder:text-slate-400
                        focus:outline-none focus:ring-1 focus:ring-cyan-400/30
                        transition-all
                        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-300 focus:border-cyan-400'}
                        ${projectionField && hasProjection ? 'pr-7' : ''}
                        ${className}
                    `}
                    {...props}
                />

                {/* Icone de IA inline (alternativo) */}
                {projectionField && hasProjection && !label && (
                    <button
                        type="button"
                        onClick={handleProjectionClick}
                        disabled={isProjectionLoading}
                        className={`
                            absolute right-2 top-1/2 -translate-y-1/2
                            p-0.5 rounded transition-all
                            ${isProjectionLoading
                                ? 'text-indigo-400/50 cursor-wait'
                                : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer'
                            }
                        `}
                        title="Clique para ver projecao de IA"
                    >
                        <Sparkles size={12} className={isProjectionLoading ? 'animate-pulse' : ''} />
                    </button>
                )}

                {error && (
                    <span className="absolute -bottom-3 left-0 text-[8px] text-red-600 font-medium truncate max-w-full">
                        {error}
                    </span>
                )}
            </div>
        </div>
    );
});

SmartInput.displayName = 'SmartInput';

export default SmartInput;
