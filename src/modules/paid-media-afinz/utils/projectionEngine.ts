import type { DailyMetrics } from '../types';
import { getDaysInMonth, getDate, isSameMonth } from 'date-fns';

export interface ProjectionResult {
    metric: string;
    current: number;
    projected: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number; // 0-100%
    remainingDays: number;
    pace: number; // Daily AVG recently
}

export const calculateProjection = (
    data: DailyMetrics[],
    metricKey: keyof DailyMetrics,
    date: Date = new Date()
): ProjectionResult => {
    // 1. Filter for specific month
    const monthData = data.filter(d => isSameMonth(new Date(d.date), date));

    if (monthData.length === 0) {
        return {
            metric: String(metricKey),
            current: 0,
            projected: 0,
            trend: 'stable',
            confidence: 0,
            remainingDays: 0,
            pace: 0
        };
    }

    const daysInMonth = getDaysInMonth(date);
    const lastDataDay = Math.max(...monthData.map(d => getDate(new Date(d.date))));

    // Calculate Current Total (Actual)
    const currentTotal = monthData.reduce((acc, curr) => {
        // Handle potential Rate Types (though usually not summoned on rates here for simple sum)
        // Ideally we should sum Spend/Imp/Conv/Clicks.
        // For CPM/CPC we handle outside or via derived logic.
        return acc + (curr[metricKey] as number || 0);
    }, 0);

    // Smart Pace Logic:
    // Instead of linear regression which can be slow to adapt, we use "Recent Pace" (Last 7 Days)
    // weighted heavily vs the rest of the month.

    const recentDaysCount = 7;
    const sortedData = [...monthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get last N days of data
    const recentData = sortedData.slice(-recentDaysCount);

    // Calculate Pace
    let recentPace = 0;
    let overallPace = 0;

    if (recentData.length > 0) {
        const recentSum = recentData.reduce((acc, curr) => acc + (curr[metricKey] as number || 0), 0);
        recentPace = recentSum / recentData.length;
    }

    if (monthData.length > 0) {
        overallPace = currentTotal / monthData.length;
    }

    // Use Recent Pace for projection (more responsive)
    // Unless we have very few data points (< 3), then use Overall.
    const usedPace = (monthData.length >= 3) ? recentPace : overallPace;

    const remainingDays = daysInMonth - lastDataDay;
    const projectedAdditional = usedPace * remainingDays;
    const finalProjected = currentTotal + projectedAdditional;

    // Trend Logic: Comparison of Recent Pace vs Overall Pace
    // If Recent > Overall (by 5%) -> Trending UP
    // If Recent < Overall (by 5%) -> Trending DOWN
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (overallPace > 0) {
        const diff = (recentPace - overallPace) / overallPace;
        if (diff > 0.05) trend = 'up';
        else if (diff < -0.05) trend = 'down';
    }

    // Confidence Logic
    // Based on Data Coverage and Consistency
    // More days = Higher confidence.
    // Low Variance = Higher confidence (simplified here to just coverage)
    let confidence = Math.round((monthData.length / daysInMonth) * 100);
    // Boost confidence if we have > 7 days (statistical significance start)
    if (monthData.length > 7) confidence = Math.min(confidence + 20, 95);
    // Cap at 100
    confidence = Math.min(confidence, 100);

    return {
        metric: String(metricKey),
        current: currentTotal,
        projected: finalProjected,
        trend,
        confidence,
        remainingDays,
        pace: usedPace
    };
};
