import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DailyMetrics, DateRange, TimeRangeOption, FilterState } from '../types';
import { startOfMonth, endOfDay, subDays, startOfDay } from 'date-fns';

interface FilterContextType {
    rawData: DailyMetrics[];
    filteredData: DailyMetrics[];
    previousPeriodData: DailyMetrics[];
    setRawData: (data: DailyMetrics[]) => void;
    filters: FilterState;
    setFilters: {
        setDateRange: (range: DateRange, option?: TimeRangeOption) => void;
        toggleChannel: (channel: 'meta' | 'google') => void;
        toggleObjective: (obj: 'marca' | 'b2c' | 'plurix') => void;
        toggleCampaign: (campaign: string) => void;
        setSelectedCampaigns: (campaigns: string[]) => void;
        setIsCompareEnabled: (enabled: boolean) => void;
    };
    availableCampaigns: string[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

import { useAppStore } from '../../../store/useAppStore';

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Sync with Global Store
    const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
    const rawData = rawDataFromStore as unknown as DailyMetrics[];
    const setRawData = setRawDataFromStore as unknown as (data: DailyMetrics[]) => void;

    // Filter State
    const [dateRange, setDateRangeState] = useState<DateRange>({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date())
    });
    const [timeRangeOption, setTimeRangeOption] = useState<TimeRangeOption>('this-month');
    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<('marca' | 'b2c' | 'plurix')[]>(['marca', 'b2c', 'plurix']);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [isCompareEnabled, setIsCompareEnabled] = useState(true);

    // Smart Date Range: Auto-set dates when data loads
    useEffect(() => {
        if (rawData.length > 0) {
            // Find max date in data to anchor the view
            const dates = rawData.map(d => new Date(d.date).getTime());
            const maxTimestamp = Math.max(...dates);
            const maxDate = new Date(maxTimestamp);

            // Default to showing the last 30 days of AVAILABLE data
            const fromDate = subDays(maxDate, 30);

            setDateRangeState({
                from: startOfDay(fromDate),
                to: endOfDay(maxDate) // Include the entire latest available day
            });

            // Set to custom so it doesn't snap back to "Today - 30d" logic if user interacts
            setTimeRangeOption('custom');

            // Also reset other filters to avoid "hidden data" confusion
            setSelectedCampaigns([]);
        }
    }, [rawData]);

    // Derived Data
    const filteredData = useMemo(() => {
        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            // Date Filter
            const inDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to;
            if (!inDateRange) return false;

            // Channel Filter
            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            // Objective Filter
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            // Campaign Filter
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            return true;
        });
    }, [rawData, dateRange, selectedChannels, selectedObjectives, selectedCampaigns]);

    const previousPeriodData = useMemo(() => {
        if (!isCompareEnabled) return [];

        const duration = dateRange.to.getTime() - dateRange.from.getTime();
        const prevTo = new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000); // 1 day before start
        const prevFrom = new Date(prevTo.getTime() - duration);

        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            const inDateRange = itemDate >= prevFrom && itemDate <= prevTo;
            if (!inDateRange) return false;

            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            return true;
        });
    }, [rawData, dateRange, selectedChannels, selectedObjectives, selectedCampaigns, isCompareEnabled]);

    const availableCampaigns = useMemo(() => {
        const campaigns = new Set<string>();

        rawData.forEach(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to;

            if (inDateRange) {
                campaigns.add(item.campaign);
            }
        });

        return Array.from(campaigns).sort();
    }, [rawData, dateRange]);

    // Handlers
    const setDateRange = (range: DateRange, option?: TimeRangeOption) => {
        setDateRangeState(range);
        if (option) setTimeRangeOption(option);
    };

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
                dateRange,
                timeRangeOption,
                selectedChannels,
                selectedObjectives,
                selectedCampaigns,
                isCompareEnabled
            },
            setFilters: {
                setDateRange,
                toggleChannel,
                toggleObjective,
                toggleCampaign,
                setSelectedCampaigns,
                setIsCompareEnabled
            },
            availableCampaigns
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
