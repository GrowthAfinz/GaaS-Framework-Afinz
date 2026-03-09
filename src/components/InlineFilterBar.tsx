import React from 'react';
import { MessageCircle, Map, Users, HeartHandshake, ChevronDown, Check, X } from 'lucide-react';
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
}

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
    availableCanais = [],
    availableJornadas = [],
    availableSegmentos = [],
    availableParceiros = [],
    countByCanal = {},
    countByJornada = {},
    countBySegmento = {},
    countByParceiro = {}
}) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;

    const toggleItem = (field: keyof FilterState, value: string) => {
        const currentList = filters[field] as string[];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];

        setGlobalFilters({ [field]: newList });
    };

    const toggleAll = (field: keyof FilterState, available: string[]) => {
        const currentList = filters[field] as string[];
        const allSelected = available.every(item => currentList.includes(item));

        if (allSelected) {
            const newList = currentList.filter(item => !available.includes(item));
            setGlobalFilters({ [field]: newList });
        } else {
            const toAdd = available.filter(item => !currentList.includes(item));
            setGlobalFilters({ [field]: [...currentList, ...toAdd] });
        }
    };

    const areAllSelected = (field: keyof FilterState, available: string[]) => {
        const currentList = filters[field] as string[];
        return available.length > 0 && available.every(item => currentList.includes(item));
    };

    const clearFilters = () => {
        setGlobalFilters({
            canais: [],
            segmentos: [],
            parceiros: [],
            ofertas: [],
            disparado: 'Todos'
        });
    };

    const hasActiveFilters = filters.canais.length > 0 || filters.jornadas.length > 0 || filters.segmentos.length > 0 || filters.parceiros.length > 0;

    const FilterDropdown = ({
        title,
        icon: Icon,
        items,
        field,
        counts,
        align = 'left'
    }: {
        title: string,
        icon: any,
        items: string[],
        field: keyof FilterState,
        counts: Record<string, number>,
        align?: 'left' | 'right'
    }) => {
        if (items.length === 0) return null;

        const selectedCount = (filters[field] as string[]).length;
        const isAllSelected = areAllSelected(field, items);
        const isActive = selectedCount > 0;

        return (
            <div className="relative group">
                <button className={`flex items-center gap-2 px-3 py-2 rounded-lg transition border shadow-sm ${isActive
                    ? 'bg-slate-50 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}>
                    <Icon size={16} className={isActive ? 'text-slate-600' : 'text-slate-400'} />
                    <span className="text-sm font-medium">{title}</span>
                    {isActive && (
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1 border border-slate-300">
                            {selectedCount}
                        </span>
                    )}
                    <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className={`absolute top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform origin-top-left ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                    <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase">{title}</span>
                        <button
                            onClick={() => toggleAll(field, items)}
                            className="text-[10px] text-slate-600 hover:text-slate-800 font-medium"
                        >
                            {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                        {items.map(item => (
                            <label
                                key={item}
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleItem(field, item);
                                }}
                                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition group/item"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${(filters[field] as string[]).includes(item)
                                    ? 'bg-slate-700 border-slate-700'
                                    : 'border-slate-300 group-hover/item:border-slate-400'
                                    }`}>
                                    {(filters[field] as string[]).includes(item) && <Check size={10} className="text-white" />}
                                </div>
                                <span className="text-slate-700 text-sm truncate flex-1">{item}</span>
                                <span className="text-slate-400 text-xs">({counts[item] || 0})</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

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
        </div>
    );
};
