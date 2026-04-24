import React from 'react';
import { useFilters } from '../context/FilterContext';
import type { PaidMediaObjective } from '../types';
import { Share2, Target, ChevronDown, Filter } from 'lucide-react';
import { PeriodSelector } from '../../../components/period-selector/PeriodSelector';
import { MultiSelectDropdown } from './MultiSelectDropdown';

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

const objectiveChipClass = (objective: PaidMediaObjective, active: boolean): string => {
    if (objective === 'marca') {
        return active
            ? 'bg-violet-50/40 border-violet-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200/70';
    }
    if (objective === 'b2c') {
        return active
            ? 'bg-blue-50/40 border-blue-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200/70';
    }
    if (objective === 'plurix') {
        return active
            ? 'bg-purple-50/40 border-purple-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-purple-200/70';
    }
    if (objective === 'seguros') {
        return active
            ? 'bg-orange-50/40 border-orange-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200/70';
    }
    return active
        ? 'bg-slate-50/40 border-slate-300/70 text-slate-700 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500';
};

export const FilterBar: React.FC = () => {
    const {
        filters,
        setFilters,
        availableCampaigns,
        availableAdsets,
        availableAds,
    } = useFilters();

    return (
        <div className="w-full bg-white border-b border-slate-100 py-2.5 px-6 flex flex-wrap items-center gap-4">

            {/* Period Selector — padrão GaaS */}
            <PeriodSelector />

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Media Channels */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mídia:</span>
                </div>
                <div className="flex items-center gap-2">
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
                            {channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Objectives */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Objetivo:</span>
                </div>
                <div className="flex items-center gap-2">
                    {(['marca', 'b2c', 'plurix', 'seguros'] as const).map((obj) => (
                        <label key={obj} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${objectiveChipClass(obj, filters.selectedObjectives.includes(obj))}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedObjectives.includes(obj)}
                                onChange={() => setFilters.toggleObjective(obj)}
                            />
                            {obj === 'marca' ? 'Branding' : obj === 'b2c' ? 'Performance (B2C)' : obj === 'plurix' ? 'Plurix' : 'Seguros'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Campaign Multi-Select */}
            <MultiSelectDropdown
                label="Campanhas"
                options={availableCampaigns}
                selected={filters.selectedCampaigns}
                onChange={(selected) => {
                    setFilters.setSelectedCampaigns(selected);
                    // Reset downstream filters when campaign changes
                    setFilters.setSelectedAdsets([]);
                    setFilters.setSelectedAds([]);
                }}
                icon={<Filter className="w-3.5 h-3.5" />}
                placeholder={`Todas as Campanhas (${availableCampaigns.length})`}
            />

            {/* Adset (Grupo de Anúncios) Multi-Select */}
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
                placeholder={availableAdsets.length === 0 ? 'Sem grupos' : `Todos os Grupos (${availableAdsets.length})`}
            />

            {/* Ad Multi-Select */}
            <MultiSelectDropdown
                label="Anúncios"
                options={availableAds}
                selected={filters.selectedAds}
                onChange={setFilters.setSelectedAds}
                disabled={availableAds.length === 0}
                icon={<Filter className="w-3.5 h-3.5" />}
                placeholder={availableAds.length === 0 ? 'Sem anúncios' : `Todos os Anúncios (${availableAds.length})`}
            />

        </div>
    );
};
