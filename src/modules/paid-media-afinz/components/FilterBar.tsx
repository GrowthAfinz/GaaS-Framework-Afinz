import React, { useRef, useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { getObjectiveColorClasses } from '../types';
import { Share2, Target, ChevronDown, Filter } from 'lucide-react';
import { PeriodSelector } from '../../../components/period-selector/PeriodSelector';
import { MultiSelectDropdown } from './MultiSelectDropdown';

// ── Compact Objective Dropdown ────────────────────────────────────────────────

const ObjectiveSelector: React.FC<{
    objectives: ReturnType<typeof useFilters>['objectives'];
    selected: string[];
    onToggle: (key: string) => void;
}> = ({ objectives, selected, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allSelected = objectives.length > 0 && selected.length === objectives.length;
    const noneSelected = selected.length === 0;
    const label = allSelected
        ? `Todos (${objectives.length})`
        : noneSelected
        ? 'Nenhum'
        : `${selected.length} de ${objectives.length}`;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(v => !v)}
                className={`flex items-center gap-1.5 bg-white border text-xs font-medium rounded-md py-1.5 px-2.5 transition-colors
                    ${isOpen ? 'border-[#00C6CC] ring-1 ring-[#00C6CC] text-slate-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}
                `}
            >
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Objetivo:</span>
                <span>{label}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1.5 min-w-[200px]">
                    {objectives.map(obj => {
                        const active = selected.includes(obj.key);
                        const colors = getObjectiveColorClasses(obj.color);
                        return (
                            <label
                                key={obj.key}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all
                                    ${active ? colors.chipActive + ' border' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}
                                `}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={active}
                                    onChange={() => onToggle(obj.key)}
                                />
                                <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                                <span className="flex-1">{obj.label}</span>
                                {active && <span className="text-[#00C6CC] text-[10px]">✓</span>}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── FilterBar ─────────────────────────────────────────────────────────────────

const channelChipClass = (channel: 'meta' | 'google', active: boolean): string => {
    if (channel === 'meta') {
        return active
            ? 'bg-blue-50/40 border-blue-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200/70';
    }
    return active
        ? 'bg-emerald-50/40 border-emerald-300/70 text-slate-700 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200/70';
};

export const FilterBar: React.FC = () => {
    const {
        filters,
        setFilters,
        objectives,
        availableCampaigns,
        availableAdsets,
        availableAds,
    } = useFilters();

    return (
        <div className="w-full bg-white border-b border-slate-100 py-2 px-6 flex items-center gap-3 flex-wrap">

            {/* Period Selector */}
            <PeriodSelector />

            <div className="h-5 w-px bg-slate-200" />

            {/* Media Channels */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Mídia:</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {(['meta', 'google'] as const).map((channel) => (
                        <label key={channel} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${channelChipClass(channel, filters.selectedChannels.includes(channel))}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedChannels.includes(channel)}
                                onChange={() => setFilters.toggleChannel(channel)}
                            />
                            {channel === 'meta' ? 'Meta' : 'Google'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200" />

            {/* Objectives — compact dropdown */}
            <ObjectiveSelector
                objectives={objectives}
                selected={filters.selectedObjectives}
                onToggle={setFilters.toggleObjective}
            />

            <div className="h-5 w-px bg-slate-200" />

            {/* Campaign / Adset / Ad dropdowns */}
            <MultiSelectDropdown
                label="Campanhas"
                options={availableCampaigns}
                selected={filters.selectedCampaigns}
                onChange={(selected) => {
                    setFilters.setSelectedCampaigns(selected);
                    setFilters.setSelectedAdsets([]);
                    setFilters.setSelectedAds([]);
                }}
                icon={<Filter className="w-3.5 h-3.5" />}
            />

            <MultiSelectDropdown
                label="Grupos"
                options={availableAdsets}
                selected={filters.selectedAdsets}
                onChange={(selected) => {
                    setFilters.setSelectedAdsets(selected);
                    setFilters.setSelectedAds([]);
                }}
                disabled={availableAdsets.length === 0}
                icon={<Filter className="w-3.5 h-3.5" />}
                placeholder={availableAdsets.length === 0 ? 'Sem grupos' : undefined}
            />

            <MultiSelectDropdown
                label="Anúncios"
                options={availableAds}
                selected={filters.selectedAds}
                onChange={setFilters.setSelectedAds}
                disabled={availableAds.length === 0}
                icon={<Filter className="w-3.5 h-3.5" />}
                placeholder={availableAds.length === 0 ? 'Sem anúncios' : undefined}
            />

        </div>
    );
};
