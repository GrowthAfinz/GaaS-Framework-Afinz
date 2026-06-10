import React from 'react';
import { MessageCircle, Map, Users, HeartHandshake, Layers, ChevronDown, Check, X, Search, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FilterState } from '../types/framework';
import { PeriodSelector } from './period-selector/PeriodSelector';

interface InlineFilterBarProps {
    availableCanais?: string[];
    availableJornadas?: string[];
    availableSegmentos?: string[];
    availableParceiros?: string[];
    availableSubgrupos?: string[];
    countByCanal?: { [canal: string]: number };
    countByJornada?: { [jornada: string]: number };
    countBySegmento?: { [segmento: string]: number };
    countByParceiro?: { [parceiro: string]: number };
    countBySubgrupo?: { [subgrupo: string]: number };
    totalRemainingDisparos?: number;
    onMenuLockChange?: (locked: boolean) => void;
    onApplyFilters?: (filters: Partial<FilterState>) => void;
    isPending?: boolean;
}

interface FilterDropdownProps {
    title: string;
    icon: any;
    items: string[];
    field: keyof FilterState;
    counts: Record<string, number>;
    align?: 'left' | 'right';
    searchable?: boolean;
    searchPlaceholder?: string;
    onOpenChange?: (isOpen: boolean) => void;
    onApply?: (values: string[]) => void;
    isPending?: boolean;
}

const FilterDropdownInner: React.FC<FilterDropdownProps> = ({
    title,
    icon: Icon,
    items,
    field,
    counts,
    align = 'left',
    searchable = false,
    searchPlaceholder = 'Buscar...',
    onOpenChange,
    onApply,
    isPending = false
}) => {
    const selectedList = useAppStore((s) => (s.viewSettings.filtrosGlobais[field] as string[]) ?? []);
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [tempSelected, setTempSelected] = React.useState<Set<string>>(new Set());
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync temporary selection with the applied store filters when opening
    React.useEffect(() => {
        if (isOpen) {
            setTempSelected(new Set(selectedList));
        }
    }, [isOpen, selectedList]);

    const cancelCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (!isOpen) return;
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
            setSearchTerm('');
        }, 800); // Increased slightly for better usability
    };

    const handleMouseEnter = () => {
        cancelCloseTimer();
    };

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => { cancelCloseTimer(); };
    }, []);

    const visibleItems = React.useMemo(() => {
        if (!searchable) return items;
        const q = searchTerm.trim().toLowerCase();
        if (!q) return items;
        return items.filter(item => item.toLowerCase().includes(q));
    }, [items, searchable, searchTerm]);

    const toggleItem = (value: string) => {
        setTempSelected((prev) => {
            const next = new Set(prev);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    };

    const selectAllVisible = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTempSelected((prev) => {
            const next = new Set(prev);
            visibleItems.forEach(item => next.add(item));
            return next;
        });
    };

    const clearAllVisible = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTempSelected((prev) => {
            if (searchTerm) {
                const next = new Set(prev);
                visibleItems.forEach(item => next.delete(item));
                return next;
            } else {
                return new Set();
            }
        });
    };

    const handleApply = () => {
        onApply?.(Array.from(tempSelected));
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedCount = selectedList.length;
    const isActive = selectedCount > 0;

    React.useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    React.useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    if (items.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            <button
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    if (isOpen) setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all border shadow-sm select-none ${isActive || isOpen
                    ? 'bg-white border-cyan-400 text-cyan-700 shadow-md ring-1 ring-cyan-500/10'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600'
                    }`}
            >
                <Icon size={15} className={isActive ? 'text-cyan-600' : 'text-slate-450'} />
                <span className="text-xs font-semibold tracking-tight">{title}</span>
                {isActive && (
                    <span className="bg-cyan-50 text-cyan-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 border border-cyan-200/50">
                        {selectedCount}
                    </span>
                )}
                <ChevronDown size={13} className={`transition-transform duration-250 ${isOpen ? 'rotate-180 opacity-100 text-cyan-600' : 'opacity-40'}`} />
            </button>

            {isOpen && <div className={`absolute top-full pt-2 min-w-[280px] max-w-sm z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}>

                <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                    <div className="relative z-10 flex items-center justify-between px-3 py-2 mb-1.5 border-b border-slate-100 bg-slate-50/50 -mx-2 -mt-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</span>
                        {items.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllVisible}
                                    className="text-[10px] uppercase font-extrabold text-cyan-600 hover:text-cyan-700 transition-colors"
                                >
                                    Todos
                                </button>
                                <span className="text-[10px] text-slate-200">|</span>
                                <button
                                    type="button"
                                    onClick={clearAllVisible}
                                    className="text-[10px] uppercase font-extrabold text-slate-400 hover:text-slate-500 transition-colors"
                                >
                                    Limpar
                                </button>
                            </div>
                        )}
                    </div>
                    {searchable && (
                        <div className="px-1 pb-1.5">
                            <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all font-sans">
                                <Search size={12} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar py-1 border-b border-slate-100">
                        {visibleItems.length === 0 && (
                            <div className="px-2 py-4 text-center text-xs text-slate-400 italic">
                                Nenhum resultado para "{searchTerm}".
                            </div>
                        )}
                        {visibleItems.map(item => {
                            const selected = tempSelected.has(item);
                            return (
                                <label
                                    key={item}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleItem(item);
                                    }}
                                    className="flex items-center gap-2.5 cursor-pointer px-2.5 py-1.5 hover:bg-slate-50/80 rounded-lg transition-colors group/item"
                                >
                                    <div className={`w-3.5 h-3.5 rounded shadow-sm flex items-center justify-center transition-all ${selected
                                        ? 'bg-cyan-600 border-transparent text-white'
                                        : 'bg-white border text-transparent border-slate-300 group-hover/item:border-cyan-400'
                                        }`}>
                                        <Check size={10} strokeWidth={3} className={selected ? "opacity-100" : "opacity-0"} />
                                    </div>
                                    <span className={`text-xs truncate flex-1 font-semibold leading-none transition-colors ${selected ? 'text-slate-800' : 'text-slate-605'}`}>{item}</span>
                                    <span className="text-[10px] font-bold text-slate-450 tabular-nums bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 group-hover/item:bg-white transition-colors">{counts[item] || 0}</span>
                                </label>
                            );
                        })}
                    </div>
                    {/* Dropdown Footer Actions */}
                    <div className="flex items-center justify-end gap-1.5 px-2 pt-2 pb-1 bg-slate-50/50 rounded-b-xl -mx-2 -mb-2 border-t border-slate-100 mt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isPending}
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-600 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-1"
                        >
                            {isPending && <Loader2 size={10} className="animate-spin" />}
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>}
        </div>
    );
};

const FilterDropdown = React.memo(FilterDropdownInner);

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
    availableCanais = [],
    availableJornadas = [],
    availableSegmentos = [],
    availableParceiros = [],
    availableSubgrupos = [],
    countByCanal = {},
    countByJornada = {},
    countBySegmento = {},
    countByParceiro = {},
    countBySubgrupo = {},
    totalRemainingDisparos = 0,
    onMenuLockChange,
    onApplyFilters,
    isPending = false
}) => {
    const filters = useAppStore((s) => s.viewSettings.filtrosGlobais);
    const setGlobalFilters = useAppStore((s) => s.setGlobalFilters);

    const clearFilters = () => {
        if (onApplyFilters) {
            onApplyFilters({
                canais: [],
                jornadas: [],
                segmentos: [],
                parceiros: [],
                subgrupos: [],
                ofertas: [],
                disparado: 'Todos'
            });
        } else {
            setGlobalFilters({
                canais: [],
                jornadas: [],
                segmentos: [],
                parceiros: [],
                subgrupos: [],
                ofertas: [],
                disparado: 'Todos'
            });
        }
    };

    const hasActiveFilters = filters.canais.length > 0 || filters.jornadas.length > 0 || filters.segmentos.length > 0 || filters.parceiros.length > 0 || (filters.subgrupos ?? []).length > 0;
    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

    const handleMenuOpenChange = React.useCallback((menuId: string, isOpen: boolean) => {
        setOpenMenus(prev => ({ ...prev, [menuId]: isOpen }));
    }, []);

    React.useEffect(() => {
        const locked = Object.values(openMenus).some(Boolean);
        onMenuLockChange?.(locked);
    }, [openMenus, onMenuLockChange]);

    const handleApplyField = (field: keyof FilterState, values: string[]) => {
        if (onApplyFilters) {
            onApplyFilters({ [field]: values });
        } else {
            setGlobalFilters({ [field]: values });
        }
    };

    return (
        <div className="relative w-full flex flex-col">
            {/* Top pulsing linear progress indicator during calculations */}
            {isPending && (
                <div className="absolute -top-3 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse z-50 rounded-t-lg" />
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <PeriodSelector compact onOpenChange={(isOpen) => handleMenuOpenChange('period', isOpen)} />
                <FilterDropdown
                    title="Canais"
                    icon={MessageCircle}
                    items={availableCanais}
                    field="canais"
                    counts={countByCanal}
                    onOpenChange={(isOpen) => handleMenuOpenChange('canais', isOpen)}
                    onApply={(vals) => handleApplyField('canais', vals)}
                    isPending={isPending}
                />
                <FilterDropdown
                    title="Jornadas"
                    icon={Map}
                    items={availableJornadas}
                    field="jornadas"
                    counts={countByJornada}
                    searchable
                    searchPlaceholder="Buscar jornada..."
                    onOpenChange={(isOpen) => handleMenuOpenChange('jornadas', isOpen)}
                    onApply={(vals) => handleApplyField('jornadas', vals)}
                    isPending={isPending}
                />
                <FilterDropdown
                    title="Segmentos"
                    icon={Users}
                    items={availableSegmentos}
                    field="segmentos"
                    counts={countBySegmento}
                    onOpenChange={(isOpen) => handleMenuOpenChange('segmentos', isOpen)}
                    onApply={(vals) => handleApplyField('segmentos', vals)}
                    isPending={isPending}
                />
                <FilterDropdown
                    title="Parceiros"
                    icon={HeartHandshake}
                    items={availableParceiros}
                    field="parceiros"
                    counts={countByParceiro}
                    onOpenChange={(isOpen) => handleMenuOpenChange('parceiros', isOpen)}
                    onApply={(vals) => handleApplyField('parceiros', vals)}
                    isPending={isPending}
                />
                <FilterDropdown
                    title="Subgrupos"
                    icon={Layers}
                    items={availableSubgrupos}
                    field="subgrupos"
                    counts={countBySubgrupo}
                    searchable
                    searchPlaceholder="Buscar subgrupo..."
                    align="right"
                    onOpenChange={(isOpen) => handleMenuOpenChange('subgrupos', isOpen)}
                    onApply={(vals) => handleApplyField('subgrupos', vals)}
                    isPending={isPending}
                />

                {hasActiveFilters && (
                    <div className="h-6 w-px bg-slate-200 mx-2" />
                )}

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                        <X size={14} />
                        Limpar
                    </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {isPending && (
                        <div className="flex items-center gap-1.5 text-[11px] text-cyan-600 font-semibold bg-cyan-50/50 border border-cyan-200/30 px-2.5 py-1 rounded-full">
                            <Loader2 size={11} className="animate-spin text-cyan-500" />
                            <span>Calculando...</span>
                        </div>
                    )}
                    <div className="px-2.5 py-1 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-full tabular-nums">
                        {totalRemainingDisparos} disparos
                    </div>
                </div>
            </div>
        </div>
    );
};
