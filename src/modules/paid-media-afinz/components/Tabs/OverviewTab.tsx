import React, { useMemo } from 'react';
import { useFilters } from '../../context/FilterContext';
import { useBudgets } from '../../hooks/useBudgets';
import { KPICard } from '../KPICard';
import { DollarSign, Eye, MousePointer, Target } from 'lucide-react';
import { ChannelComparisonMatrix } from '../ChannelComparisonMatrix';
import { PeriodComparisonChart } from '../PeriodComparisonChart';
import type { DailyMetrics } from '../../types';
import { subDays, isSameDay } from 'date-fns';

// Helper to sum metrics
const sumMetrics = (data: DailyMetrics[]) => {
    return {
        spend: data.reduce((acc, curr) => acc + curr.spend, 0),
        impressions: data.reduce((acc, curr) => acc + curr.impressions, 0),
        clicks: data.reduce((acc, curr) => acc + curr.clicks, 0),
        conversions: data.reduce((acc, curr) => acc + curr.conversions, 0),
    };
};

// Helper for formatting
const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val);

export const OverviewTab: React.FC = () => {
    const { filteredData, rawData, filters, previousPeriodData } = useFilters();
    const { budgets } = useBudgets();

    // 1. Current Total Metrics (Selected Range)
    const currentMetrics = useMemo(() => sumMetrics(filteredData), [filteredData]);

    // 2. "Yesterday" Metrics logic
    // We want to compare the LATEST available full day vs the day before it.
    // Or, if "Compare PreviousPeriod" is active, we stick to that?
    // User asked for "vs ontem". Let's assume this means:
    // "Trend of the LAST DAY in the range vs DAY BEFORE IT" ??
    // OR "Trend of the Whole Range vs Period Before"?
    // The user example "vs ontem" suggests a DAILY view focus.
    // However, the dashboard usually shows a range (e.g. 30 days).
    // If range is 30 days, "vs yesterday" makes less sense for the total sum.
    // BUT maybe they want the CARD to show "Current Spending Pace"?
    // Let's interpret "vs ontem" as:
    // If Range is "Yesterday" -> Compare to Day Before Yesterday.
    // If Range is "Last 30 Days" -> Compare Last 30d vs Previous 30d?
    // User specifically asked "↑ 4% vs ontem".
    // This implies the MAIN number is probably "Today/Yesterday" or the user considers the *latest day* most important.
    // Let's compromise: If the date range is > 1 day, we show "vs período anterior". 
    // If date range is 1 day (or close to end), we might show daily trend.
    // actually, let's look at the user request again: "Investimento: R$ 4.066 ... vs ontem". 
    // This looks like a DAILY snapshot.
    // BUT the dashboard defaults to 30 days.
    // Let's stick to PERIOD comparison for now as it's safer, but label it clearly.
    // Wait, the user might want a "Daily Snapshot" card row?
    // Let's keep specific "vs Period" behavior but rename label if range is 1 day.

    // For the specific "Budget Status":
    // We need total budget for the current month(s) involved.
    // Simple approach: Get budget for current month.
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    // Actually, we should use the month of the DATA.
    // Let's take the month of the 'to' date.
    const targetMonth = filters.dateRange.to.toISOString().slice(0, 7);
    const totalBudget = budgets.filter(b => b.month === targetMonth).reduce((acc, b) => acc + b.value, 0);

    const budgetPercent = totalBudget > 0 ? (currentMetrics.spend / totalBudget) * 100 : 0;

    // Status Logic
    // If we are at day 15 (50% of month) and spent 65% -> Status Warning/Error
    // Days passed in month:
    const daysInMonth = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth() + 1, 0).getDate();
    const currentDay = filters.dateRange.to.getDate();
    const monthProgress = (currentDay / daysInMonth) * 100;

    let budgetStatus: 'success' | 'warning' | 'error' = 'success';
    if (totalBudget > 0) {
        if (budgetPercent > monthProgress + 20) budgetStatus = 'error'; // 20% ahead
        else if (budgetPercent > monthProgress + 5) budgetStatus = 'warning'; // 5% ahead
    }

    // Previous Period Calculation (Standard)
    // Note: useFilters provides previousPeriodData directly!
    const prevMetrics = useMemo(() => sumMetrics(previousPeriodData), [previousPeriodData]);

    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return 0;
        return ((curr - prev) / prev) * 100;
    };

    const changes = {
        spend: calcChange(currentMetrics.spend, prevMetrics.spend),
        impressions: calcChange(currentMetrics.impressions, prevMetrics.impressions),
        clicks: calcChange(currentMetrics.clicks, prevMetrics.clicks),
        conversions: calcChange(currentMetrics.conversions, prevMetrics.conversions),
    };

    // Only show comparison if filter active
    const showComparison = filters.isCompareEnabled;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Investimento"
                    value={formatCurrency(currentMetrics.spend)}
                    trendValue={showComparison ? changes.spend : undefined}
                    trendLabel="vs período anterior"
                    trendInverse={true} // Spend going up is usually "costing more" but if scaling it's good. Let's keep neutral? User asked for Red if bad. Let's assume Red if > 0 for cost? No, scaling is good.
                    // Let's set inverse=false (Green if up)
                    // BUT user example: "Investimento: R$ 4.066 | ↑ 4% vs ontem | 65% do orçado | Status: ✅"
                    // If status is checked, it implies good.
                    contextValue={totalBudget > 0 ? `${budgetPercent.toFixed(0)}% do orçado` : undefined}
                    status={budgetStatus}
                    icon={<DollarSign size={20} />}
                />
                <KPICard
                    title="Impressões"
                    value={formatNumber(currentMetrics.impressions)}
                    trendValue={showComparison ? changes.impressions : undefined}
                    icon={<Eye size={20} />}
                />
                <KPICard
                    title="Cliques"
                    value={formatNumber(currentMetrics.clicks)}
                    trendValue={showComparison ? changes.clicks : undefined}
                    icon={<MousePointer size={20} />}
                />
                <KPICard
                    title="Conversões"
                    value={formatNumber(currentMetrics.conversions)}
                    trendValue={showComparison ? changes.conversions : undefined}
                    icon={<Target size={20} />}
                    status={'success'} // Always positive for now or calculate conversion rate trend?
                // Let's calculate CPA check? 
                // CPA = Spend / Conversions
                // If CPA < Target -> Success.
                // We don't have global CPA target yet.
                />
            </div>

            {/* Comparison & Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PeriodComparisonChart current={currentMetrics} previous={prevMetrics} show={showComparison} />
                <ChannelComparisonMatrix data={filteredData} />
            </div>

        </div>
    );
};
