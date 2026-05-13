import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Info, ChevronDown, X } from 'lucide-react';

/**
 * Componentes compartilhados para os blocos do formulario de disparo
 * Design: Compacto, Desktop-first, Dark mode
 *
 * PILAR: Automatizacao por Historico
 * - Combobox permite digitar OU selecionar sugestoes
 * - Sugestoes ordenadas por frequencia no historico
 */

// ========================================
// LABEL
// ========================================

interface LabelProps {
    label: string;
    required?: boolean;
    tooltip?: string;
}

export const Label: React.FC<LabelProps> = ({ label, required, tooltip }) => (
    <label className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
        {required && <span className="text-blue-500">*</span>}
        {tooltip && (
            <span title={tooltip} className="text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                <Info size={9} />
            </span>
        )}
    </label>
);

// ========================================
// INPUT
// ========================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', error, ...props }) => (
    <div className="relative">
        <input
            className={`
                w-full px-2 py-1.5
                bg-white border rounded
                text-[11px] font-medium text-slate-900
                placeholder:text-slate-400
                focus:outline-none focus:ring-1 focus:ring-cyan-400/30
                transition-all
                ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-300 focus:border-cyan-400'}
                ${className}
            `}
            {...props}
        />
        {error && (
            <span className="absolute -bottom-3 left-0 text-[8px] text-red-600 font-medium truncate max-w-full">
                {error}
            </span>
        )}
    </div>
);

// ========================================
// SELECT
// ========================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: string;
}

export const Select: React.FC<SelectProps> = ({ className = '', error, children, ...props }) => (
    <div className="relative">
        <select
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
        </select>
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
);

// ========================================
// SECTION CARD
// ========================================

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    headerClassName?: string;
    badge?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    children,
    headerClassName = 'text-slate-700',
    badge
}) => (
    <section className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 hover:border-slate-300 transition-colors duration-300 h-full">
        <div className={`flex items-center justify-between pb-1.5 border-b border-slate-200 ${headerClassName}`}>
            <div className="flex items-center gap-1.5">
                <div className="opacity-70 text-slate-500">{icon}</div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3>
            </div>
            {badge && (
                <span className="px-1 py-0.5 bg-slate-100 rounded text-[8px] text-slate-500 font-bold uppercase">
                    {badge}
                </span>
            )}
        </div>
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    </section>
);

// ========================================
// METRIC CARD (para painel IA)
// ========================================

interface MetricCardProps {
    label: string;
    value?: number;
    prefix?: string;
    suffix?: string;
    isInt?: boolean;
    confidence?: number;
    compact?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    prefix = '',
    suffix = '',
    isInt = false,
    confidence,
    compact = false
}) => (
    <div className={`
        bg-indigo-50 border border-indigo-500/10 rounded
        ${compact ? 'p-1.5' : 'p-2'}
        flex flex-col items-center justify-center text-center
    `}>
        <span className={`uppercase font-bold text-indigo-600 ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
            {label}
        </span>
        <div className={`font-bold text-indigo-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {value !== undefined ? (
                <>
                    <span className="text-[9px] text-indigo-500 mr-0.5">{prefix}</span>
                    {isInt ? Math.round(value).toLocaleString('pt-BR') : value.toFixed(2)}
                    <span className="text-[9px] text-indigo-500 ml-0.5">{suffix}</span>
                </>
            ) : (
                <span className="text-slate-400">-</span>
            )}
        </div>
        {confidence !== undefined && confidence > 0 && (
            <div className="w-full mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500/50 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, confidence)}%` }}
                />
            </div>
        )}
    </div>
);

// ========================================
// READONLY FIELD
// ========================================

interface ReadonlyFieldProps {
    label: string;
    value: string | number;
    className?: string;
}

export const ReadonlyField: React.FC<ReadonlyFieldProps> = ({ label, value, className = '' }) => (
    <div className={`bg-slate-50 p-1.5 rounded border border-slate-200 ${className}`}>
        <Label label={label} />
        <div className="text-[11px] text-slate-700 font-mono text-center">
            {value || '-'}
        </div>
    </div>
);

// ========================================
// COMBOBOX (Input Editavel + Sugestoes)
// ========================================

export interface ComboboxOption {
    value: string;
    count?: number; // frequencia no historico
    isSmart?: boolean; // Sugestão inteligente oficial
}

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
    allowClear?: boolean;
}

/**
 * Combobox - Campo editavel com sugestoes do historico
 *
 * PILAR DO PROJETO: Automatizacao por Historico
 * - Permite digitar livremente OU selecionar sugestoes
 * - Sugestoes filtradas enquanto digita
 * - Ordenado por frequencia (mais usado primeiro)
 */
export const Combobox: React.FC<ComboboxProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Digite ou selecione...',
    error,
    className = '',
    disabled = false,
    allowClear = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sincronizar inputValue com value externo
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Filtrar e ordenar opcoes baseado no input
    const filteredOptions = useMemo(() => {
        const searchTerm = inputValue.toLowerCase().trim();

        let filtered = options;

        // Filtrar por termo de busca
        if (searchTerm) {
            filtered = options.filter(opt =>
                opt.value.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenar: primeiro exatos, depois por Smart, depois frequencia
        return filtered.sort((a, b) => {
            const aLower = a.value.toLowerCase();
            const bLower = b.value.toLowerCase();

            // Match exato primeiro
            if (aLower === searchTerm && bLower !== searchTerm) return -1;
            if (bLower === searchTerm && aLower !== searchTerm) return 1;

            // Comeca com o termo
            if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
            if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;

            // Smart Options (Oficiais) primeiro
            if (a.isSmart && !b.isSmart) return -1;
            if (!a.isSmart && b.isSmart) return 1;

            // Por frequencia (mais usado primeiro)
            const countA = a.count || 0;
            const countB = b.count || 0;
            if (countB !== countA) return countB - countA;

            // Alfabetico
            return aLower.localeCompare(bLower);
        });
    }, [options, inputValue]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Se fechou sem selecionar, manter o valor digitado
                if (inputValue !== value) {
                    onChange(inputValue);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputValue, value, onChange]);

    // Handler do input
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
    }, []);

    // Selecionar opcao
    const handleSelectOption = useCallback((option: ComboboxOption) => {
        setInputValue(option.value);
        onChange(option.value);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    }, [onChange]);

    // Limpar valor
    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue('');
        onChange('');
        inputRef.current?.focus();
    }, [onChange]);

    // Navegacao por teclado
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setIsOpen(true);
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelectOption(filteredOptions[highlightedIndex]);
                } else if (inputValue) {
                    // Enter sem selecao: confirma valor digitado
                    onChange(inputValue);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
            case 'Tab':
                // Tab fecha e confirma valor
                if (inputValue !== value) {
                    onChange(inputValue);
                }
                setIsOpen(false);
                break;
        }
    }, [isOpen, highlightedIndex, filteredOptions, handleSelectOption, inputValue, value, onChange]);

    // Scroll para opcao destacada
    useEffect(() => {
        if (highlightedIndex >= 0 && dropdownRef.current) {
            const highlighted = dropdownRef.current.children[highlightedIndex] as HTMLElement;
            if (highlighted) {
                highlighted.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`
                        w-full px-2 py-1.5 pr-12
                        bg-white border rounded
                        text-[11px] font-medium text-slate-900
                        placeholder:text-slate-400
                        focus:outline-none focus:ring-1 focus:ring-cyan-400/30
                        transition-all
                        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-300 focus:border-cyan-400'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                />

                {/* Botoes de acao */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {/* Limpar */}
                    {allowClear && inputValue && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            <X size={10} />
                        </button>
                    )}

                    {/* Toggle dropdown */}
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                    >
                        <ChevronDown
                            size={12}
                            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            </div>

            {/* Dropdown de sugestoes */}
            {isOpen && filteredOptions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-[100] w-full mt-0.5 py-0.5 max-h-40 overflow-auto
                               bg-white border border-slate-200 rounded shadow-lg
                               scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50"
                >
                    {filteredOptions.map((option, index) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelectOption(option)}
                            className={`
                                px-2 py-1 text-[11px] cursor-pointer flex justify-between items-center
                                ${highlightedIndex === index
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-900 hover:bg-slate-100'
                                }
                                ${option.value === value ? 'font-semibold' : ''}
                            `}
                        >
                            <span className="truncate flex items-center gap-1">
                                {option.value}
                            </span>
                            {option.count !== undefined && option.count > 0 && (
                                <span className={`
                                    text-[9px] ml-1 px-1 rounded
                                    ${highlightedIndex === index
                                        ? 'bg-blue-500 text-blue-100'
                                        : 'bg-slate-100 text-slate-500'
                                    }
                                `}>
                                    {option.count}x
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Mensagem quando nao ha opcoes */}
            {isOpen && filteredOptions.length === 0 && inputValue && (
                <div className="absolute z-50 w-full mt-0.5 py-2 px-2
                               bg-white border border-slate-200 rounded shadow-lg
                               text-[10px] text-slate-500 text-center">
                    Novo valor: "{inputValue}"
                    <br />
                    <span className="text-[9px] text-slate-400">Pressione Enter para confirmar</span>
                </div>
            )}

            {/* Erro */}
            {error && (
                <span className="absolute -bottom-3 left-0 text-[8px] text-red-600 font-medium truncate max-w-full">
                    {error}
                </span>
            )}
        </div>
    );
};
