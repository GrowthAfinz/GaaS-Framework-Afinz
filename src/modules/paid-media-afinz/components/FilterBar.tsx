import React, { useRef, useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { getObjectiveColorClasses } from '../types';
import { Share2, Target, ChevronDown, Filter, Check } from 'lucide-react';
import { PeriodSelector } from '../../../components/period-selector/PeriodSelector';
import { MultiSelectDropdown } from './MultiSelectDropdown';

// ── Objective dropdown (compact, dynamic from registry) ───────────────────────
const ObjectiveSelector: React.FC = () => {
    const { filters, setFilters, objectives } = useFilters();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allSelected = objectives.length > 0 && filters.selectedObjectives.length === objectives.length;
    const noneSelected = filters.selectedObjectives.length === 0;

    const buttonLabel = allSelected
        ? `Todos (${objectives.length})`
        : noneSelected
        ? 'Nenhum'
        : `${filters.selectedObjectives.length} de ${objectives.length}`;

    return (
        <div className="relative flex items-center gap-2" ref={ref}>
            <div className="flex items-center gap-1.5 text-slate-400">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Objetivo:</span>
            </div>
            <button
                onClick={() => setIsOpen(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                    ${isOpen
                        ? 'bg-white border-[#00C6CC] text-slate-700 ring-1 ring-[#00C6CC]/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
            >
                {/* Color dots for selected objectives */}
                <span className="flex gap-0.5">
                    {objectives
                        .filter(o => filters.selectedObjectives.includes(o.key))
                        .map(o => {
                            const c = getObjectiveColorClasses(o.color);
                            return <span key={o.key} className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />;
                        })
                    }
                </span>
                <span>{buttonLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && objectives.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] py-1.5 min-w-[200px]">
                    {/* Select all */}
                    <button
                        onClick={() => {
                            if (allSelected) {
                                objectives.forEach(o => {
                                    if (filters.selectedObjectives.includes(o.key)) setFilters.toggleObjective(o.key);
                                });
                            } else {
                                objectives.forEach(o => {
                                    if (!filters.selectedObjectives.includes(o.key)) setFilters.toggleObjective(o.key);
                                });
                            }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all
                            ${allSelected ? 'bg-[#00C6CC] border-[#00C6CC]' : 'border-slate-300'}`}>
                            {allSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-semibold">Todos os objetivos</span>
                    </button>
                    <div className="h-px bg-slate-100 mx-3 my-1" />

                    {objectives.map(obj => {
                        const active = filters.selectedObjectives.includes(obj.key);
                        const c = getObjectiveColorClasses(obj.color);
                        return (
                            <button
                                key={obj.key}
                                onClick={() => setFilters.toggleObjective(obj.key)}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors"
                            >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all
                                    ${active ? 'bg-[#00C6CC] border-[#00C6CC]' : 'border-slate-300'}`}>
                                    {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                                <span className="text-slate-700 font-medium">{obj.label}</span>
                                <span className="ml-auto text-slate-400 font-mono text-[10px]">{obj.key}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Main FilterBar ─────────────────────────────────────────────────────────────
export const FilterBar: React.FC = () => {
    const { filters, setFilters, availableCampaigns, availableAdsets, availableAds } = useFilters();

    return (
        <div className="w-full bg-white border-b border-slate-100 py-2.5 px-6 flex flex-wrap items-center gap-4">

            {/* Period Selector */}
            <PeriodSelector />

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Media Channels */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mídia:</span>
                </div>
                <div className="flex items-center gap-2">
                    {(['meta', 'google'] as const).map((channel) => {
                        const active = filters.selectedChannels.includes(channel);
                        return (
                            <label key={channel} className={`
                                cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                                ${channel === 'meta'
                                    ? active ? 'bg-blue-50/40 border-blue-300/70 text-slate-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200/70'
                                    : active ? 'bg-emerald-50/40 border-emerald-300/70 text-slate-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200/70'
                                }
                            `}>
                                <input type="checkbox" className="hidden" checked={active} onChange={() => setFilters.toggleChannel(channel)} />
                                {channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Objectives — dynamic dropdown */}
            <ObjectiveSelector />

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Campaign / Group / Ad filters */}
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
