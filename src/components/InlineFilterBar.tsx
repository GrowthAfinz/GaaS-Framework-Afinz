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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
    title,
    icon: Icon,
    items,
    field,
    counts,
    align = 'left',
    searchable = false,
    searchPlaceholder = 'Buscar...'
}) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    if (items.length === 0) return null;

    const visibleItems = React.useMemo(() => {
        if (!searchable) return items;
        const q = searchTerm.trim().toLowerCase();
        if (!q) return items;
        return items.filter(item => item.toLowerCase().includes(q));
    }, [items, searchable, searchTerm]);

    const toggleItem = (value: string) => {
        const currentList = filters[field] as string[];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        setGlobalFilters({ [field]: newList });
    };

    const toggleAll = () => {
        const currentList = filters[field] as string[];
        const targetItems = visibleItems;
        const allSelected = targetItems.length > 0 && targetItems.every(i => currentList.includes(i));
        if (allSelected) {
            const newList = currentList.filter(i => !targetItems.includes(i));
            setGlobalFilters({ [field]: newList });
        } else {
            const toAdd = targetItems.filter(i => !currentList.includes(i));
            setGlobalFilters({ [field]: [...currentList, ...toAdd] });
        }
    };

    const isAllSelected = visibleItems.length > 0 && visibleItems.every(i => (filters[field] as string[]).includes(i));
    const selectedCount = (filters[field] as string[]).length;
    const isActive = selectedCount > 0;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setSearchTerm('');
        }, 300); // 300ms hover delay bridge
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className={`flex items-center gap-2 px-3 py-2 rounded-lg transition border shadow-sm ${isActive || isOpen
                ? 'bg-white border-slate-400 text-slate-800'
                : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600'
                }`}>
                <Icon size={16} className={isActive ? 'text-slate-600' : 'text-slate-400'} />
                <span className="text-sm font-medium">{title}</span>
                {isActive && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1 border border-slate-300">
                        {selectedCount}
                    </span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 opacity-100' : 'opacity-50'}`} />
            </button>

            {/* A wrapper with dropdown items. We add an invisible safe zone to trap the mouse */}
            <div className={`absolute top-full pt-1.5 min-w-64 max-w-sm z-50 transition-all duration-200 transform origin-top-left ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none'
                } ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                {/* INVISIBLE BRIDGE to prevent mouse slip */}
                <div
                    className="absolute -inset-x-8 -top-3 -bottom-8 bg-transparent -z-10"
                    aria-hidden="true"
                />

                <div className="bg-white border border-slate-200 rounded-xl shadow-[0_12px_45px_-8px_rgba(0,0,0,0.2)] p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                    <div className="flex items-center justify-between px-3 py-2.5 mb-1 border-b border-slate-100 bg-slate-50/80 -mx-2 -mt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
                        <button
                            onClick={toggleAll}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors"
                        >
                            {isAllSelected
                                ? (searchTerm ? 'Desmarcar Visiveis' : 'Desmarcar Todos')
                                : (searchTerm ? 'Selecionar Visiveis' : 'Selecionar Todos')}
                        </button>
                    </div>
                    {searchable && (
                        <div className="px-2 pb-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
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
                            const selected = (filters[field] as string[]).includes(item);
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
    totalRemainingDisparos = 0
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

    return (
        <div className="flex items-center gap-2">
            <PeriodSelector compact />
            <FilterDropdown
                title="Canais"
                icon={MessageCircle}
                items={availableCanais}
                field="canais"
                counts={countByCanal}
            />
            <FilterDropdown
                title="Jornadas"
                icon={Map}
                items={availableJornadas}
                field="jornadas"
                counts={countByJornada}
                searchable
                searchPlaceholder="Buscar jornada..."
            />
            <FilterDropdown
                title="Segmentos"
                icon={Users}
                items={availableSegmentos}
                field="segmentos"
                counts={countBySegmento}
            />
            <FilterDropdown
                title="Parceiros"
                icon={HeartHandshake}
                items={availableParceiros}
                field="parceiros"
                counts={countByParceiro}
                align="right"
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
