import React, { useMemo } from 'react';
import { useFilters } from '../../context/FilterContext';
import { useBudgets } from '../../hooks/useBudgets';
import { KPICard } from '../KPICard';
import { DollarSign, Target, Activity, MousePointerClick, Megaphone } from 'lucide-react';
import { ChannelComparisonMatrix } from '../ChannelComparisonMatrix';
import { PeriodComparisonChart } from '../PeriodComparisonChart';
import type { DailyMetrics } from '../../types';

// Helper to sum metrics
const sumMetrics = (data: DailyMetrics[]) => {
    const spend = data.reduce((acc, curr) => acc + curr.spend, 0);
    const impressions = data.reduce((acc, curr) => acc + curr.impressions, 0);
    const clicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
    const conversions = data.reduce((acc, curr) => acc + curr.conversions, 0);
    const activeAds = new Set(data.map(d => d.campaign)).size;

    return {
        spend,
        impressions,
        clicks,
        conversions,
        cpa: conversions > 0 ? spend / conversions : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        activeAds
    };
};

// Helper for formatting
const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);

const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val);

export const OverviewTab: React.FC = () => {
    const { filteredData, filters, previousPeriodData } = useFilters();
    const { budgets } = useBudgets();

    // 1. Current Total Metrics (Selected Range)
    const currentMetrics = useMemo(() => sumMetrics(filteredData), [filteredData]);

    // Budget Status
    const targetMonth = filters.dateRange.to.toISOString().slice(0, 7);
    const totalBudget = budgets.filter(b => b.month === targetMonth).reduce((acc, b) => acc + b.value, 0);
    const budgetPercent = totalBudget > 0 ? (currentMetrics.spend / totalBudget) * 100 : 0;

    const daysInMonth = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth() + 1, 0).getDate();
    const currentDay = filters.dateRange.to.getDate();
    const monthProgress = (currentDay / daysInMonth) * 100;

    let budgetStatus: 'success' | 'warning' | 'error' = 'success';
    if (totalBudget > 0) {
        if (budgetPercent > monthProgress + 20) budgetStatus = 'error'; // 20% ahead
        else if (budgetPercent > monthProgress + 5) budgetStatus = 'warning'; // 5% ahead
    }

    // Previous Period Calculation
    const prevMetrics = useMemo(() => sumMetrics(previousPeriodData), [previousPeriodData]);

    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return 0;
        return ((curr - prev) / prev) * 100;
    };

    const changes = {
        spend: calcChange(currentMetrics.spend, prevMetrics.spend),
        conversions: calcChange(currentMetrics.conversions, prevMetrics.conversions),
        cpa: calcChange(currentMetrics.cpa, prevMetrics.cpa),
        ctr: currentMetrics.ctr - prevMetrics.ctr, // Diff in percentage points
        activeAds: currentMetrics.activeAds - prevMetrics.activeAds,
    };

    const showComparison = true; // Forçar visualização vs período anterior conforme spec

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Total Custo"
                    value={formatCurrency(currentMetrics.spend)}
                    trendValue={showComparison ? changes.spend : undefined}
                    trendLabel="vs período ant."
                    contextValue={totalBudget > 0 ? `${budgetPercent.toFixed(0)}% do orçado` : undefined}
                    status={budgetStatus}
                    icon={<DollarSign size={20} />}
                />
                <KPICard
                    title="Total Conv."
                    value={formatNumber(currentMetrics.conversions)}
                    trendValue={showComparison ? changes.conversions : undefined}
                    trendLabel="vs período ant."
                    icon={<Target size={20} />}
                />
                <KPICard
                    title="CPA Médio"
                    value={formatCurrency(currentMetrics.cpa)}
                    trendValue={showComparison ? changes.cpa : undefined}
                    trendInverse={true} // CPA subindo é ruim
                    trendLabel="vs período ant."
                    icon={<Activity size={20} />}
                />
                <KPICard
                    title="CTR Médio"
                    value={`${currentMetrics.ctr.toFixed(2)}%`}
                    trendValue={showComparison ? changes.ctr : undefined}
                    trendLabel="vs período ant. (pp)"
                    icon={<MousePointerClick size={20} />}
                />
                <KPICard
                    title="Campanhas Ativas"
                    value={formatNumber(currentMetrics.activeAds)}
                    trendValue={showComparison ? changes.activeAds : undefined}
                    trendLabel="vs período ant."
                    icon={<Megaphone size={20} />}
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
