import React, { useRef, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';

interface SmartSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onClick'> {
    // Props base
    label?: string;
    error?: string;
    required?: boolean;

    // Props de IA
    suggestionField?: string;
    hasSuggestion?: boolean;
    onSuggestionClick?: (field: string, element: HTMLElement) => void;
    isSuggestionLoading?: boolean;
    suggestions?: { value: string; label: string; confidence?: number }[];
}

/**
 * Select inteligente com sugestoes de IA
 * Mostra icone de IA se ha sugestoes disponiveis
 */
export const SmartSelect = forwardRef<HTMLSelectElement, SmartSelectProps>(({
    label,
    error,
    required,
    suggestionField,
    hasSuggestion = false,
    onSuggestionClick,
    isSuggestionLoading = false,
    suggestions = [],
    className = '',
    children,
    ...props
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSuggestionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (suggestionField && onSuggestionClick && containerRef.current) {
            onSuggestionClick(suggestionField, containerRef.current);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    {label}
                    {required && <span className="text-blue-500">*</span>}

                    {/* Icone de IA */}
                    {suggestionField && hasSuggestion && (
                        <button
                            type="button"
                            onClick={handleSuggestionClick}
                            disabled={isSuggestionLoading}
                            className={`
                                ml-auto p-0.5 rounded transition-all
                                ${isSuggestionLoading
                                    ? 'text-indigo-400/50 cursor-wait'
                                    : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer'
                                }
                            `}
                            title="Clique para ver sugestoes de IA"
                        >
                            <Sparkles size={10} className={isSuggestionLoading ? 'animate-pulse' : ''} />
                        </button>
                    )}
                </label>
            )}

            <div className="relative">
                <select
                    ref={ref}
                    className={`
                        w-full px-2 py-1.5
                        bg-white border rounded
                        text-[11px] font-medium text-slate-900
                        focus:outline-none focus:ring-1 focus:ring-cyan-400/30
                        transition-all appearance-none cursor-pointer
                        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-300 focus:border-cyan-400'}
                        ${className}
                    `}
                    {...props}
                >
                    {children}

                    {/* Adicionar sugestoes ao select */}
                    {suggestions.length > 0 && (
                        <optgroup label="Sugestoes IA">
                            {suggestions.map((s, i) => (
                                <option key={`suggestion-${i}`} value={s.value}>
                                    {s.label} {s.confidence ? `(${s.confidence}%)` : ''}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>

                {/* Seta do select */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m1 1 4 4 4-4" />
                    </svg>
                </div>

                {error && (
                    <span className="absolute -bottom-3 left-0 text-[8px] text-red-600 font-medium truncate max-w-full">
                        {error}
                    </span>
                )}
            </div>
        </div>
    );
});

SmartSelect.displayName = 'SmartSelect';

export default SmartSelect;
