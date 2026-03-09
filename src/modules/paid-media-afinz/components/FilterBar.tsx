import React from 'react';
import { useFilters } from '../context/FilterContext';
import { Calendar, Filter, Share2, Target, ChevronDown } from 'lucide-react';
import type { TimeRangeOption } from '../types';
import { subDays, format, startOfMonth, endOfDay } from 'date-fns';

export const FilterBar: React.FC = () => {
    const {
        filters,
        setFilters,
        availableCampaigns
    } = useFilters();

    const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as TimeRangeOption;
        const now = new Date();
        let from = now;
        let to = now;

        switch (val) {
            case '7d':
                to = now;
                from = subDays(to, 7);
                break;
            case '14d':
                to = now;
                from = subDays(to, 14);
                break;
            case '30d':
                to = now;
                from = subDays(to, 30);
                break;
            case '90d':
                to = now;
                from = subDays(to, 90);
                break;
            case 'this-month':
                from = startOfMonth(now);
                to = endOfDay(now);
                break;
            case 'last-month':
                from = startOfMonth(subDays(startOfMonth(now), 1));
                to = endOfDay(subDays(startOfMonth(now), 1));
                break;
            case 'custom':
                // Keep current range or open picker (not implemented yet)
                from = filters.dateRange.from;
                to = filters.dateRange.to;
                break;
            default: break;
        }

        setFilters.setDateRange({ from, to }, val);
    };

    return (
        <div className="absolute top-[calc(100%-1px)] left-0 w-full bg-white border-b border-slate-200 shadow-lg py-3 px-6 flex flex-wrap items-center gap-4 transition-all duration-300 ease-in-out transform -translate-y-full opacity-0 invisible group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible z-40">

            {/* Range Selector */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50/50 hover:bg-white transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                    value={filters.timeRangeOption}
                    onChange={handleRangeChange}
                    className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none p-0 pr-2"
                >
                    <option value="this-month">Mês Atual</option>
                    <option value="last-month">Mês Passado</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="14d">Últimos 14 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="custom">Personalizado</option>
                </select>
                <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
                    {format(filters.dateRange.from, 'dd/MM')} - {format(filters.dateRange.to, 'dd/MM')}
                </span>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Media Channels */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Mídia:</span>
                </div>
                <div className="flex items-center gap-2">
                    {['meta', 'google'].map((channel) => (
                        <label key={channel} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${filters.selectedChannels.includes(channel as any)
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedChannels.includes(channel as any)}
                                onChange={() => setFilters.toggleChannel(channel as any)}
                            />
                            {channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Objectives */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Objetivo:</span>
                </div>
                <div className="flex items-center gap-2">
                    {['marca', 'b2c', 'plurix'].map((obj) => (
                        <label key={obj} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${filters.selectedObjectives.includes(obj as any)
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedObjectives.includes(obj as any)}
                                onChange={() => setFilters.toggleObjective(obj as any)}
                            />
                            {obj === 'marca' ? 'Branding' : obj === 'b2c' ? 'Performance (B2C)' : 'Plurix'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Campaign Select */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                <div className="relative w-full">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                        className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-md py-1.5 pl-8 pr-8 focus:ring-1 focus:ring-blue-500 outline-none appearance-none hover:border-slate-300 transition-colors"
                        value={filters.selectedCampaigns.length === 1 ? filters.selectedCampaigns[0] : ""}
                        onChange={(e) => {
                            if (e.target.value === "") {
                                setFilters.setSelectedCampaigns([]);
                            } else {
                                setFilters.setSelectedCampaigns([e.target.value]);
                            }
                        }}
                    >
                        <option value="">Todas as Campanhas ({availableCampaigns.length})</option>
                        {availableCampaigns.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Compare Toggle */}
            <label className={`
                flex items-center gap-2 cursor-pointer ml-auto border rounded-md px-3 py-1.5 transition-all
                ${filters.isCompareEnabled
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'}
            `}>
                <input
                    type="checkbox"
                    checked={filters.isCompareEnabled}
                    onChange={() => setFilters.setIsCompareEnabled(!filters.isCompareEnabled)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className={`text-xs font-medium ${filters.isCompareEnabled ? 'text-indigo-700' : 'text-slate-600'}`}>
                    Comparar período anterior
                </span>
            </label>

        </div>
    );
};

