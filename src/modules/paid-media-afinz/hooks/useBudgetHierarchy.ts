/**
 * useBudgetHierarchy Hook
 *
 * Aggregates budget data from three sources:
 * 1. ObjectiveBudget (from paid_media_budgets table, linked to Goals)
 * 2. CampaignBudget (from campaign_budgets table)
 * 3. paid_media_metrics (for realized spend calculations)
 *
 * Computes derived metrics:
 * - realizedSpend per campaign and objective
 * - projectedSpend (linear projection to month-end)
 * - paceIndex and status (ontrack, atrisk, overspending, etc.)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataService } from '../../../services/dataService';
import {
  ObjectiveBudget,
  CampaignBudget,
  BudgetStatus,
  getPaceStatus,
  BudgetObjective,
  BudgetChannel,
} from '../types/budget';
import { getDate, getDaysInMonth, isSameMonth, format, parseISO } from 'date-fns';

interface UseBudgetHierarchyFilters {
  objectives?: BudgetObjective[];
  channels?: BudgetChannel[];
}

interface UseBudgetHierarchyResult {
  objectives: ObjectiveBudget[];
  campaigns: CampaignBudget[];
  status: BudgetStatus;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Calculate realized spend for a campaign from daily metrics
 * Filters paid_media_metrics where campaign_name matches
 */
const calculateRealizedSpend = (
  metrics: any[],
  campaignName: string,
  month: string
): number => {
  return metrics
    .filter((m) => {
      const metricMonth = format(new Date(m.date), 'MM/yyyy');
      return m.campaign === campaignName && metricMonth === month;
    })
    .reduce((sum, m) => sum + (m.spend || 0), 0);
};

/**
 * Calculate linear projection for a campaign
 * Formula: (realized / daysPassed) * daysInMonth
 */
const calculateProjection = (realizedSpend: number, month: string): number => {
  const now = new Date();
  const monthDate = parseISO(`${month.split('/')[1]}-${month.split('/')[0]}-01`);

  // Check if we're in the same month
  if (!isSameMonth(now, monthDate)) {
    // If month is in the past, projection = realized spend
    if (now > monthDate) {
      return realizedSpend;
    }
    // If month is in the future, we can't project yet
    return 0;
  }

  // We're in the month, calculate projection
  const daysPassed = getDate(now);
  const daysInMonth = getDaysInMonth(monthDate);

  if (daysPassed === 0) return 0;

  return (realizedSpend / daysPassed) * daysInMonth;
};

/**
 * Calculate daily rate for a budget
 */
const calculateDailyRate = (allocatedBudget: number, month: string): number => {
  const monthDate = parseISO(`${month.split('/')[1]}-${month.split('/')[0]}-01`);
  const daysInMonth = getDaysInMonth(monthDate);
  return allocatedBudget / daysInMonth;
};

export const useBudgetHierarchy = (
  month: string,
  filters?: UseBudgetHierarchyFilters
): UseBudgetHierarchyResult => {
  const [objectives, setObjectives] = useState<ObjectiveBudget[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignBudget[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ObjectiveBudgets (paid_media_budgets table)
      const budgetsData = await dataService.fetchPaidMediaBudgets();
      const objectivesData: ObjectiveBudget[] = budgetsData
        .filter((b: any) => b.month === month)
        .map((b: any) => ({
          id: b.id,
          month: b.month,
          objective: b.objective,
          channel: b.channel,
          totalBudget: b.value || 0,
          createdAt: b.created_at ? new Date(b.created_at) : undefined,
          updatedAt: b.updated_at ? new Date(b.updated_at) : undefined,
        }));

      // 2. Fetch CampaignBudgets
      const campaignsData = await dataService.fetchCampaignBudgetsByMonth(month);

      // 3. Fetch paid_media_metrics for realized spend
      const metricsData = await dataService.fetchPaidMediaByAd();

      setObjectives(objectivesData);
      setCampaigns(campaignsData as CampaignBudget[]);
      setDailyMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch budget data'));
    } finally {
      setLoading(false);
    }
  }, [month]);

  // Load data on mount and when month changes
  useEffect(() => {
    fetchData();
  }, [month, fetchData]);

  // Compute enriched campaign budgets with realized/projected spend
  const enrichedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => {
      const realizedSpend = calculateRealizedSpend(dailyMetrics, campaign.campaignName, month);
      const projectedSpend = calculateProjection(realizedSpend, month);
      const paceIndex = campaign.allocatedBudget > 0 ? projectedSpend / campaign.allocatedBudget : 0;

      return {
        ...campaign,
        realizedSpend,
        projectedSpend,
        paceIndex,
        paceStatus: getPaceStatus(paceIndex),
        percentOfAllocated:
          campaign.allocatedBudget > 0 ? (realizedSpend / campaign.allocatedBudget) * 100 : 0,
      };
    });
  }, [campaigns, dailyMetrics, month]);

  // Apply filters
  const filteredCampaigns = useMemo(() => {
    let filtered = enrichedCampaigns;

    if (filters?.objectives && filters.objectives.length > 0) {
      filtered = filtered.filter((c) => filters.objectives!.includes(c.objective));
    }

    if (filters?.channels && filters.channels.length > 0) {
      filtered = filtered.filter((c) => filters.channels!.includes(c.channel));
    }

    return filtered;
  }, [enrichedCampaigns, filters]);

  // Compute enriched objectives with aggregated metrics
  const enrichedObjectives = useMemo(() => {
    return objectives.map((objective) => {
      const objectiveCampaigns = filteredCampaigns.filter(
        (c) => c.objective_budget_id === objective.id
      );

      const realizedSpend = objectiveCampaigns.reduce((sum, c) => sum + c.realizedSpend, 0);
      const projectedSpend = objectiveCampaigns.reduce((sum, c) => sum + c.projectedSpend, 0);

      return {
        ...objective,
        realizedSpend,
        projectedSpend,
      };
    });
  }, [objectives, filteredCampaigns]);

  // Compute overall budget status
  const status = useMemo(() => {
    const totalAllocated = enrichedObjectives.reduce((sum, o) => sum + o.totalBudget, 0);
    const totalRealizedSpend = enrichedObjectives.reduce((sum, o) => sum + o.realizedSpend, 0);
    const totalProjectedSpend = enrichedObjectives.reduce((sum, o) => sum + o.projectedSpend, 0);

    const monthDate = parseISO(`${month.split('/')[1]}-${month.split('/')[0]}-01`);
    const daysPassed = getDate(new Date());
    const daysInMonth = getDaysInMonth(monthDate);
    const dailyProjected = totalAllocated / daysInMonth;

    return {
      dailyActual: daysPassed > 0 ? totalRealizedSpend / daysPassed : 0,
      dailyProjected,
      cumulativeActual: totalRealizedSpend,
      cumulativeProjected: (totalAllocated / daysInMonth) * daysPassed,
      projectionFull: totalProjectedSpend,
      paceIndex: totalAllocated > 0 ? totalProjectedSpend / totalAllocated : 0,
      status: getPaceStatus(totalAllocated > 0 ? totalProjectedSpend / totalAllocated : 0),
    };
  }, [enrichedObjectives, month]);

  return {
    objectives: enrichedObjectives,
    campaigns: filteredCampaigns,
    status,
    loading,
    error,
    refetch: fetchData,
  };
};
