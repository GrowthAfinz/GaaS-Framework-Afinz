import React, { createContext, useContext, useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

export type PeriodPreset = 'today' | 'yesterday' | 'thisWeek' | 'last7' | 'last14' | 'last28' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

interface PeriodContextType {
    startDate: Date;
    endDate: Date;
    preset: PeriodPreset;
    compareEnabled: boolean;
    compareMode: 'previousPeriod' | null;
    setPeriod: (start: Date, end: Date, preset?: PeriodPreset) => void;
    setPreset: (preset: PeriodPreset) => void;
    toggleCompare: (enabled: boolean) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default to This Month (Launch Planner requirement)
    // const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 27));
    const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
    const [endDate, setEndDate] = useState<Date>(() => endOfMonth(new Date()));
    const [preset, setPresetState] = useState<PeriodPreset>('thisMonth');
    const [compareEnabled, setCompareEnabled] = useState(false);
    const [compareMode, setCompareMode] = useState<'previousPeriod' | null>(null);


    // Initial load effect
    useEffect(() => {
        console.log("PeriodProvider mounted. Force-setting preset to 'thisMonth'.");
        // Ensure we start with 'thisMonth' even if state initialization was weird
        setPreset('thisMonth');
    }, []);

    const setPeriod = (start: Date, end: Date, newPreset: PeriodPreset = 'custom') => {
        console.log("setPeriod called:", { start, end, newPreset });
        setStartDate(start);
        setEndDate(end);
        setPresetState(newPreset);
    };

    const setPreset = (newPreset: PeriodPreset) => {
        const today = new Date();
        let start = today;
        let end = today;

        switch (newPreset) {
            case 'today':
                start = today;
                end = today;
                break;
            case 'yesterday':
                start = subDays(today, 1);
                end = subDays(today, 1);
                break;
            case 'thisWeek':
                // Assuming week starts on Sunday or Monday? Let's use date-fns default (usually Sunday)
                // But often "This Week" means last 7 days or start of week.
                // Let's use start of week.
                // Need to import startOfWeek. For now, I'll assume I can add it to imports.
                // Actually, I'll use subDays for now to avoid import errors if I can't see imports.
                // But I should add imports.
                // Let's stick to "Last 7 days" style if I can't import easily.
                // Wait, I can use replace_file_content to update imports too.
                // For now, I'll use a simple approximation or just update imports in a separate call if needed.
                // Actually, I'll use `startOfMonth` logic for `thisYear` (startOfYear).
                // I'll update imports in a separate call to be safe.
                start = subDays(today, today.getDay()); // Start of week (Sunday)
                break;
            case 'last7':
                start = subDays(today, 6);
                break;
            case 'last14':
                start = subDays(today, 13);
                break;
            case 'last28':
                start = subDays(today, 27);
                break;
            case 'last30':
                start = subDays(today, 29);
                break;
            case 'last90':
                start = subDays(today, 89);
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                start = startOfMonth(subMonths(today, 1));
                end = endOfMonth(subMonths(today, 1));
                break;
            case 'thisYear':
                // I need startOfYear. I'll add it to imports next.
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'custom':
                return; // Do not change dates automatically for custom
        }

        setStartDate(start);
        setEndDate(end);
        setPresetState(newPreset);
    };

    const toggleCompare = (enabled: boolean) => {
        setCompareEnabled(enabled);
        if (enabled && !compareMode) {
            setCompareMode('previousPeriod');
        } else if (!enabled) {
            setCompareMode(null);
        }
    };

    return (
        <PeriodContext.Provider value={{
            startDate,
            endDate,
            preset,
            compareEnabled,
            compareMode,
            setPeriod,
            setPreset,
            toggleCompare
        }}>
            {children}
        </PeriodContext.Provider>
    );
};

export const usePeriod = () => {
    const context = useContext(PeriodContext);
    if (context === undefined) {
        throw new Error('usePeriod must be used within a PeriodProvider');
    }
    return context;
};
