/**
 * useBudgetHierarchy Hook
 *
 * Aggregates budget data from three sources:
 * 1. ObjectiveBudget (from paid_media_budgets table)
 * 2. CampaignBudget (from campaign_budgets table)
 * 3. paid_media_metrics + paid_media_campaign_mappings (for realized spend)
 *
 * Realized spend strategy:
 * - Primary: paid_media_metrics ↔ paid_media_campaign_mappings → grouped by objective
 * - This works even when campaign_budgets is empty
 * - Campaign-level budgets add planning granularity, not required for spend tracking
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
 * Calculate realized spend for a specific campaign from daily metrics
 */
const calculateCampaignRealizedSpend = (
  metrics: any[],
  campaignName: string,
  month: string
): number => {
  const [mm, yyyy] = month.split('/');
  const targetMonth = `${yyyy}-${mm}`;
  return metrics
    .filter((m) => {
      const dateStr = typeof m.date === 'string' ? m.date.slice(0, 7) : format(new Date(m.date), 'yyyy-MM');
      return m.campaign === campaignName && dateStr === targetMonth;
    })
    .reduce((sum, m) => sum + (m.spend || 0), 0);
};

/**
 * Linear projection to month-end
 * Formula: (realized / daysPassed) * daysInMonth
 */
const calculateProjection = (realizedSpend: number, month: string): number => {
  const now = new Date();
  const [mm, yyyy] = month.split('/');
  const monthDate = parseISO(`${yyyy}-${mm}-01`);

  if (!isSameMonth(now, monthDate)) {
    return now > monthDate ? realizedSpend : 0;
  }

  const daysPassed = getDate(now);
  if (daysPassed === 0) return 0;
  return (realizedSpend / daysPassed) * getDaysInMonth(monthDate);
};

export const useBudgetHierarchy = (
  month: string,
  filters?: UseBudgetHierarchyFilters
): UseBudgetHierarchyResult => {
  const [objectives, setObjectives] = useState<ObjectiveBudget[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignBudget[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  // Map: objective_key → realized spend (computed from metrics + campaign_mappings)
  const [objectiveRealizedMap, setObjectiveRealizedMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ObjectiveBudgets
      const budgetsData = await dataService.fetchPaidMediaBudgets();
      const objectivesData: ObjectiveBudget[] = budgetsData
        .filter((b: any) => b.month === month)
        .map((b: any) => ({
          id: b.id,
          month: b.month,
          objective: b.objective as BudgetObjective,
          channel: b.channel || undefined,
          totalBudget: b.budget || 0,
          createdAt: b.created_at ? new Date(b.created_at) : undefined,
          updatedAt: b.updated_at ? new Date(b.updated_at) : undefined,
        }));

      // 2. Fetch CampaignBudgets — map snake_case DB → camelCase TypeScript
      const campaignsRaw = await dataService.fetchCampaignBudgetsByMonth(month);
      const campaignsMapped: CampaignBudget[] = campaignsRaw.map((c: any) => ({
        id: c.id,
        month: c.month,
        objectiveBudgetId: c.objective_budget_id,
        campaignName: c.campaign_name,
        objective: c.objective as BudgetObjective,
        channel: c.channel as BudgetChannel,
        allocatedBudget: c.allocated_budget,
        notes: c.notes || undefined,
        createdAt: c.created_at ? new Date(c.created_at) : undefined,
        updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
      }));

      // 3. Fetch metrics + campaign mappings for realized spend
      const [metricsData, mappingsData] = await Promise.all([
        dataService.fetchPaidMediaByAd(),
        dataService.fetchCampaignMappings(),
      ]);

      // Build campaign_name → objective lookup
      const campaignToObjective = new Map<string, string>(
        mappingsData.map((m: any) => [m.campaign_name, m.objective])
      );

      // String-based month matching to avoid timezone issues with ISO date strings
      const [mm, yyyy] = month.split('/');
      const targetMonthStr = `${yyyy}-${mm}`;
      const isCurrentMonth = (date: any): boolean => {
        const dateStr = typeof date === 'string' ? date.slice(0, 7) : format(new Date(date), 'yyyy-MM');
        return dateStr === targetMonthStr;
      };

      // Aggregate realized spend per objective (primary path — no campaign_budgets needed)
      const realizedByObjective = new Map<string, number>();
      metricsData.forEach((m: any) => {
        if (!m.date || !m.campaign) return;
        if (!isCurrentMonth(m.date)) return;
        const obj = campaignToObjective.get(m.campaign);
        if (!obj) return;
        realizedByObjective.set(obj, (realizedByObjective.get(obj) || 0) + (m.spend || 0));
      });

      // Auto-include campaigns with spend that have a mapping but no budget entry
      const campaignNamesInBudget = new Set(campaignsMapped.map((c: any) => c.campaignName));
      const unbudgetedMap = new Map<string, { objective: string; channel: string }>();
      metricsData.forEach((m: any) => {
        if (!m.date || !m.campaign) return;
        if (!isCurrentMonth(m.date)) return;
        if (campaignNamesInBudget.has(m.campaign)) return;
        if (unbudgetedMap.has(m.campaign)) return;
        const obj = campaignToObjective.get(m.campaign);
        if (!obj) return;
        unbudgetedMap.set(m.campaign, { objective: obj, channel: m.channel || 'google' });
      });

      const unbudgetedCampaigns: CampaignBudget[] = [];
      unbudgetedMap.forEach((info, campaignName) => {
        const matchingObjective = objectivesData.find((o: any) => o.objective === info.objective);
        if (!matchingObjective) return;
        unbudgetedCampaigns.push({
          id: `unbudgeted-${campaignName}`,
          month,
          objectiveBudgetId: matchingObjective.id,
          campaignName,
          objective: info.objective as BudgetObjective,
          channel: info.channel as BudgetChannel,
          allocatedBudget: 0,
        });
      });

      setObjectives(objectivesData);
      setCampaigns([...campaignsMapped, ...unbudgetedCampaigns]);
      setDailyMetrics(metricsData);
      setObjectiveRealizedMap(realizedByObjective);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch budget data'));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [month, fetchData]);

  // Enrich campaign budgets with per-campaign realized/projected spend
  const enrichedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => {
      const realizedSpend = calculateCampaignRealizedSpend(dailyMetrics, campaign.campaignName, month);
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

  // Apply filters to campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = enrichedCampaigns;
    if (filters?.objectives?.length) {
      filtered = filtered.filter((c) => filters.objectives!.includes(c.objective));
    }
    if (filters?.channels?.length) {
      filtered = filtered.filter((c) => filters.channels!.includes(c.channel));
    }
    return filtered;
  }, [enrichedCampaigns, filters]);

  // Enrich objectives using mapping-based realized spend (works with or without campaign_budgets)
  const enrichedObjectives = useMemo(() => {
    return objectives.map((objective) => {
      // Primary: spend from metrics+mappings (always populated when data exists)
      const realizedSpend = objectiveRealizedMap.get(objective.objective) || 0;
      const projectedSpend = calculateProjection(realizedSpend, month);
      const paceIndex = objective.totalBudget > 0 ? projectedSpend / objective.totalBudget : 0;

      return {
        ...objective,
        realizedSpend,
        projectedSpend,
        paceIndex,
        paceStatus: getPaceStatus(paceIndex),
      };
    });
  }, [objectives, objectiveRealizedMap, month]);

  // Overall budget status
  const status = useMemo<BudgetStatus>(() => {
    const totalAllocated = enrichedObjectives.reduce((s, o) => s + o.totalBudget, 0);
    const totalRealized = enrichedObjectives.reduce((s, o) => s + (o.realizedSpend || 0), 0);
    const totalProjected = enrichedObjectives.reduce((s, o) => s + (o.projectedSpend || 0), 0);

    const [mm, yyyy] = month.split('/');
    const monthDate = parseISO(`${yyyy}-${mm}-01`);
    const daysPassed = getDate(new Date());
    const daysInMonth = getDaysInMonth(monthDate);
    const dailyProjected = totalAllocated / daysInMonth;

    return {
      dailyActual: daysPassed > 0 ? totalRealized / daysPassed : 0,
      dailyProjected,
      cumulativeActual: totalRealized,
      cumulativeProjected: dailyProjected * daysPassed,
      projectionFull: totalProjected,
      paceIndex: totalAllocated > 0 ? totalProjected / totalAllocated : 0,
      status: getPaceStatus(totalAllocated > 0 ? totalProjected / totalAllocated : 0),
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
