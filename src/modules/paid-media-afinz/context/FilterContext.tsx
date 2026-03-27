import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DailyMetrics, FilterState, AdCreative } from '../types';
import { endOfDay, format, startOfDay } from 'date-fns';
import { usePeriod } from '../../../contexts/PeriodContext';
import { dataService } from '../../../services/dataService';

interface FilterContextType {
    rawData: DailyMetrics[];
    filteredData: DailyMetrics[];
    previousPeriodData: DailyMetrics[];
    setRawData: (data: DailyMetrics[]) => void;
    filters: FilterState;
    setFilters: {
        toggleChannel: (channel: 'meta' | 'google') => void;
        toggleObjective: (obj: 'marca' | 'b2c' | 'plurix') => void;
        toggleCampaign: (campaign: string) => void;
        setSelectedCampaigns: (campaigns: string[]) => void;
        setSelectedAdsets: (adsets: string[]) => void;
        setSelectedAds: (ads: string[]) => void;
    };
    availableCampaigns: string[];
    availableAdsets: string[];
    availableAds: string[];
    adCreatives: AdCreative[];
    refreshCreatives: () => Promise<void>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

import { useAppStore } from '../../../store/useAppStore';

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
    const rawData = rawDataFromStore as unknown as DailyMetrics[];
    const setRawData = setRawDataFromStore as unknown as (data: DailyMetrics[]) => void;

    const { startDate, endDate, compareEnabled } = usePeriod();
    const dateFrom = startOfDay(startDate);
    const dateTo = endOfDay(endDate);

    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<('marca' | 'b2c' | 'plurix')[]>(['marca', 'b2c', 'plurix']);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);
    const [selectedAds, setSelectedAds] = useState<string[]>([]);

    // Hierarchy fetched directly from DB filtered by current period — reliable source for dropdowns
    type HierarchyRow = { campaign: string; adset_name: string | null; ad_name: string | null };
    const [adHierarchy, setAdHierarchy] = useState<HierarchyRow[]>([]);

    // Ad creatives (thumbnails, body, title from Meta API)
    const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);

    const refreshCreatives = async () => {
        try {
            const data = await dataService.fetchAdCreatives();
            setAdCreatives(data as AdCreative[]);
        } catch (err) {
            console.error('Failed to fetch ad creatives:', err);
        }
    };

    useEffect(() => {
        const from = format(dateFrom, 'yyyy-MM-dd');
        const to = format(dateTo, 'yyyy-MM-dd');
        dataService.fetchAdHierarchy(from, to).then(setAdHierarchy).catch(console.error);
    }, [dateFrom.getTime(), dateTo.getTime()]);

    // Fetch creatives once on mount
    useEffect(() => { refreshCreatives(); }, []);

    // Rows in period — used as base for filteredData
    const rowsInPeriod = useMemo(() => {
        return rawData.filter(item => {
            const d = new Date(item.date);
            if (d < dateFrom || d > dateTo) return false;
            if (!selectedChannels.includes(item.channel as 'meta' | 'google')) return false;
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives]);

    // Fully filtered data used by all tabs
    const filteredData = useMemo(() => {
        return rowsInPeriod.filter(item => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rowsInPeriod, selectedCampaigns, selectedAdsets, selectedAds]);

    const previousPeriodData = useMemo(() => {
        // Always calculate previous period (used for vs período anterior KPIs)
        const duration = dateTo.getTime() - dateFrom.getTime();
        const prevTo = new Date(dateFrom.getTime() - 86400000);
        const prevFrom = new Date(prevTo.getTime() - duration);
        return rawData.filter(item => {
            const d = new Date(item.date);
            if (d < prevFrom || d > prevTo) return false;
            if (!selectedChannels.includes(item.channel as 'meta' | 'google')) return false;
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, selectedAdsets, selectedAds]);

    // --- Dropdown options ---
    // Campaigns: from rowsInPeriod (fast, already in memory)
    const availableCampaigns = useMemo(() => {
        const set = new Set<string>();
        rowsInPeriod.forEach(item => set.add(item.campaign));
        return Array.from(set).sort();
    }, [rowsInPeriod]);

    // Adsets & Ads: from adHierarchy (DB query scoped to period — handles pagination gaps)
    const availableAdsets = useMemo(() => {
        const set = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (row.adset_name) set.add(row.adset_name);
        });
        return Array.from(set).sort();
    }, [adHierarchy, selectedCampaigns]);

    const availableAds = useMemo(() => {
        const set = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (selectedAdsets.length > 0 && (!row.adset_name || !selectedAdsets.includes(row.adset_name))) return;
            if (row.ad_name) set.add(row.ad_name);
        });
        return Array.from(set).sort();
    }, [adHierarchy, selectedCampaigns, selectedAdsets]);

    const toggleChannel = (ch: 'meta' | 'google') =>
        setSelectedChannels(p => p.includes(ch) ? p.filter(c => c !== ch) : [...p, ch]);
    const toggleObjective = (obj: 'marca' | 'b2c' | 'plurix') =>
        setSelectedObjectives(p => p.includes(obj) ? p.filter(o => o !== obj) : [...p, obj]);
    const toggleCampaign = (c: string) =>
        setSelectedCampaigns(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

    return (
        <FilterContext.Provider value={{
            rawData,
            filteredData,
            previousPeriodData,
            setRawData,
            filters: {
                dateRange: { from: dateFrom, to: dateTo },
                timeRangeOption: 'custom',
                selectedChannels,
                selectedObjectives,
                selectedCampaigns,
                selectedAdsets,
                selectedAds,
                isCompareEnabled: compareEnabled
            },
            setFilters: {
                toggleChannel,
                toggleObjective,
                toggleCampaign,
                setSelectedCampaigns,
                setSelectedAdsets,
                setSelectedAds,
            },
            availableCampaigns,
            availableAdsets,
            availableAds,
            adCreatives,
            refreshCreatives
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const ctx = useContext(FilterContext);
    if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
    return ctx;
};
