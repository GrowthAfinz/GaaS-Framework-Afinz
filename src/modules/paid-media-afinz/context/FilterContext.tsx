import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DailyMetrics, FilterState } from '../types';
import { endOfDay, startOfDay } from 'date-fns';
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
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

import { useAppStore } from '../../../store/useAppStore';

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Sync with Global Store
    const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
    const rawData = rawDataFromStore as unknown as DailyMetrics[];
    const setRawData = setRawDataFromStore as unknown as (data: DailyMetrics[]) => void;

    // Use global PeriodContext as source of truth for date range
    const { startDate, endDate, compareEnabled } = usePeriod();
    const dateFrom = startOfDay(startDate);
    const dateTo = endOfDay(endDate);

    // Other filter state (channels, objectives, campaigns, adsets, ads)
    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<('marca' | 'b2c' | 'plurix')[]>(['marca', 'b2c', 'plurix']);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);
    const [selectedAds, setSelectedAds] = useState<string[]>([]);

    // Hierarchy data for filter dropdowns (lightweight: only campaign/adset/ad names)
    const [adHierarchy, setAdHierarchy] = useState<Array<{ campaign: string; adset_name: string | null; ad_name: string | null }>>([]);

    useEffect(() => {
        dataService.fetchAdHierarchy().then(setAdHierarchy).catch(console.error);
    }, []);

    // Derived Data
    const filteredData = useMemo(() => {
        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            // Date Filter (from PeriodContext)
            const inDateRange = itemDate >= dateFrom && itemDate <= dateTo;
            if (!inDateRange) return false;

            // Channel Filter
            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            // Objective Filter
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            // Campaign Filter
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            // Adset Filter
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;

            // Ad Filter
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;

            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, selectedAdsets, selectedAds]);

    const previousPeriodData = useMemo(() => {
        if (!compareEnabled) return [];

        const duration = dateTo.getTime() - dateFrom.getTime();
        const prevTo = new Date(dateFrom.getTime() - 24 * 60 * 60 * 1000);
        const prevFrom = new Date(prevTo.getTime() - duration);

        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            const inDateRange = itemDate >= prevFrom && itemDate <= prevTo;
            if (!inDateRange) return false;

            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;

            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;

            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, selectedAdsets, selectedAds, compareEnabled]);

    const availableCampaigns = useMemo(() => {
        const campaigns = new Set<string>();
        rawData.forEach(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= dateFrom && itemDate <= dateTo;
            if (inDateRange) campaigns.add(item.campaign);
        });
        return Array.from(campaigns).sort();
    }, [rawData, dateFrom, dateTo]);

    // Adsets available given the current campaign selection (from hierarchy, no date dependency)
    const availableAdsets = useMemo(() => {
        const adsets = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (row.adset_name) adsets.add(row.adset_name);
        });
        return Array.from(adsets).sort();
    }, [adHierarchy, selectedCampaigns]);

    // Ads available given the current campaign + adset selection (from hierarchy)
    const availableAds = useMemo(() => {
        const ads = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (selectedAdsets.length > 0 && (!row.adset_name || !selectedAdsets.includes(row.adset_name))) return;
            if (row.ad_name) ads.add(row.ad_name);
        });
        return Array.from(ads).sort();
    }, [adHierarchy, selectedCampaigns, selectedAdsets]);

    // Handlers
    const toggleChannel = (channel: 'meta' | 'google') => {
        setSelectedChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const toggleObjective = (obj: 'marca' | 'b2c' | 'plurix') => {
        setSelectedObjectives(prev =>
            prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
        );
    };

    const toggleCampaign = (campaign: string) => {
        setSelectedCampaigns(prev =>
            prev.includes(campaign) ? prev.filter(c => c !== campaign) : [...prev, campaign]
        );
    };

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
            availableAds
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
