import React from 'react';
import { MessageCircle, Map, Users, HeartHandshake, ChevronDown, Check, X, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FilterState } from '../types/framework';
import { PeriodSelector } from './period-selector/PeriodSelector';

interface InlineFilterBarProps {
    availableCanais?: string[];
    availableJornadas?: string[];
    availableSegmentos?: string[];
    availableParceiros?: string[];
    countByCanal?: { [canal: string]: number };
    countByJornada?: { [jornada: string]: number };
    countBySegmento?: { [segmento: string]: number };
    countByParceiro?: { [parceiro: string]: number };
    totalRemainingDisparos?: number;
    onMenuLockChange?: (locked: boolean) => void;
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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
    title,
    icon: Icon,
    items,
    field,
    counts,
    align = 'left',
    searchable = false,
    searchPlaceholder = 'Buscar...',
    onOpenChange
}) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    if (items.length === 0) return null;

    const visibleItems = React.useMemo(() => {
        if (!searchable) return items;
        const q = searchTerm.trim().toLowerCase();
        if (!q) return items;
        return items.filter(item => item.toLowerCase().includes(q));
    }, [items, searchable, searchTerm]);

    const selectedList = filters[field] as string[];
    const selectedSet = React.useMemo(() => new Set(selectedList), [selectedList]);

    const toggleItem = (value: string) => {
        const nextSet = new Set(selectedSet);
        if (nextSet.has(value)) {
            nextSet.delete(value);
        } else {
            nextSet.add(value);
        }
        setGlobalFilters({ [field]: Array.from(nextSet) });
    };

    const selectAllVisible = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nextSet = new Set(selectedSet);
        visibleItems.forEach(item => nextSet.add(item));
        setGlobalFilters({ [field]: Array.from(nextSet) });
    };

    const clearAllVisible = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (searchTerm) {
            const nextSet = new Set(selectedSet);
            visibleItems.forEach(item => nextSet.delete(item));
            setGlobalFilters({ [field]: Array.from(nextSet) });
        } else {
            setGlobalFilters({ [field]: [] });
        }
    };

    const selectedCount = selectedSet.size;
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

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    if (isOpen) setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition border shadow-sm ${isActive || isOpen
                    ? 'bg-white border-slate-400 text-slate-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600'
                    }`}
            >
                <Icon size={16} className={isActive ? 'text-slate-600' : 'text-slate-400'} />
                <span className="text-sm font-medium">{title}</span>
                {isActive && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1 border border-slate-300">
                        {selectedCount}
                    </span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 opacity-100' : 'opacity-50'}`} />
            </button>

            <div className={`absolute top-full pt-2.5 min-w-[280px] max-w-sm z-50 transition-all duration-200 transform origin-top-left ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
                } ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>

                <div className="bg-white border border-slate-200 rounded-xl shadow-[0_12px_45px_-8px_rgba(0,0,0,0.2)] p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                    <div className="flex items-center justify-between px-3 py-2.5 mb-1.5 border-b border-slate-100 bg-slate-50/80 -mx-2 -mt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
                        {items.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAllVisible}
                                    className="text-[10px] uppercase font-bold text-[#00c6cc] hover:text-[#00a1a6] transition-colors"
                                >
                                    Todos
                                </button>
                                <span className="text-[10px] text-slate-300">|</span>
                                <button
                                    onClick={clearAllVisible}
                                    className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Limpar
                                </button>
                            </div>
                        )}
                    </div>
                    {searchable && (
                        <div className="px-2 pb-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-[#00c6cc] focus-within:border-[#00c6cc] transition-all">
                                <Search size={13} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-80 overflow-y-auto space-y-0.5 custom-scrollbar py-1">
                        {visibleItems.length === 0 && (
                            <div className="px-2 py-4 text-center text-xs text-slate-400">
                                Nenhum resultado para "{searchTerm}".
                            </div>
                        )}
                        {visibleItems.map(item => {
                            const selected = selectedSet.has(item);
                            return (
                                <label
                                    key={item}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleItem(item);
                                    }}
                                    className="flex items-center gap-3 cursor-pointer px-2 py-2 hover:bg-slate-50/80 rounded-lg transition group/item"
                                >
                                    <div className={`w-4 h-4 rounded shadow-sm flex items-center justify-center transition ${selected
                                        ? 'bg-blue-600 border-transparent text-white'
                                        : 'bg-white border text-transparent border-slate-300 group-hover/item:border-blue-400'
                                        }`}>
                                        <Check size={12} strokeWidth={3} className={selected ? "opacity-100" : "opacity-0"} />
                                    </div>
                                    <span className={`text-sm truncate flex-1 font-medium leading-none mt-0.5 transition-colors ${selected ? 'text-slate-800' : 'text-slate-600'}`}>{item}</span>
                                    <span className="text-slate-400 text-xs tabular-nums bg-slate-50 border border-slate-100 rounded px-1 group-hover/item:bg-white transition-colors">{counts[item] || 0}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
    availableCanais = [],
    availableJornadas = [],
    availableSegmentos = [],
    availableParceiros = [],
    countByCanal = {},
    countByJornada = {},
    countBySegmento = {},
    countByParceiro = {},
    totalRemainingDisparos = 0,
    onMenuLockChange
}) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;

    const clearFilters = () => {
        setGlobalFilters({
            canais: [],
            jornadas: [],
            segmentos: [],
            parceiros: [],
            ofertas: [],
            disparado: 'Todos'
        });
    };

    const hasActiveFilters = filters.canais.length > 0 || filters.jornadas.length > 0 || filters.segmentos.length > 0 || filters.parceiros.length > 0;
    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

    const handleMenuOpenChange = React.useCallback((menuId: string, isOpen: boolean) => {
        setOpenMenus(prev => ({ ...prev, [menuId]: isOpen }));
    }, []);

    React.useEffect(() => {
        const locked = Object.values(openMenus).some(Boolean);
        onMenuLockChange?.(locked);
    }, [openMenus, onMenuLockChange]);

    return (
        <div className="flex items-center gap-2">
            <PeriodSelector compact onOpenChange={(isOpen) => handleMenuOpenChange('period', isOpen)} />
            <FilterDropdown
                title="Canais"
                icon={MessageCircle}
                items={availableCanais}
                field="canais"
                counts={countByCanal}
                onOpenChange={(isOpen) => handleMenuOpenChange('canais', isOpen)}
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
            />
            <FilterDropdown
                title="Segmentos"
                icon={Users}
                items={availableSegmentos}
                field="segmentos"
                counts={countBySegmento}
                onOpenChange={(isOpen) => handleMenuOpenChange('segmentos', isOpen)}
            />
            <FilterDropdown
                title="Parceiros"
                icon={HeartHandshake}
                items={availableParceiros}
                field="parceiros"
                counts={countByParceiro}
                align="right"
                onOpenChange={(isOpen) => handleMenuOpenChange('parceiros', isOpen)}
            />

            {hasActiveFilters && (
                <div className="h-6 w-px bg-slate-200 mx-2" />
            )}

            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                    <X size={14} />
                    Limpar
                </button>
            )}

            <div className="ml-1 px-2.5 py-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full tabular-nums">
                {totalRemainingDisparos} disparos
            </div>
        </div>
    );
};
