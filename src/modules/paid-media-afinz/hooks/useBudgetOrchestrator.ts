/**
 * useBudgetOrchestrator Hook
 *
 * Intelligent budget reallocation orchestration
 * Analyzes campaign pacing and suggests optimal reallocations
 */

import { useMemo } from 'react';
import { CampaignBudget, BudgetReallocationSuggestion } from '../types/budget';

interface OrchestratorResult {
  overspendingCampaigns: CampaignBudget[];
  underspendingCampaigns: CampaignBudget[];
  suggestions: BudgetReallocationSuggestion[];
  canRelocate: boolean;
}

/**
 * Analyze campaign pacing and generate intelligent reallocation suggestions
 *
 * Logic:
 * 1. Identify campaigns with pace > 1.05 (overspending risk)
 * 2. Identify campaigns with pace < 0.95 (underspending)
 * 3. For each overspending campaign:
 *    - Calculate amount to transfer (5% of budget to reduce pace)
 *    - Find best underspending recipient (lowest pace)
 *    - Generate suggestion with impact preview
 */
export const useBudgetOrchestrator = (campaigns: CampaignBudget[]): OrchestratorResult => {
  const result = useMemo(() => {
    // Categorize campaigns by pace status
    const overspending = campaigns.filter((c) => (c.paceIndex || 0) > 1.05);
    const underspending = campaigns.filter((c) => (c.paceIndex || 0) < 0.95 && (c.paceIndex || 0) > 0);
    const ontrack = campaigns.filter((c) => {
      const pace = c.paceIndex || 0;
      return pace >= 0.95 && pace <= 1.05;
    });

    // Generate suggestions: overspending → best underspending
    const suggestions: BudgetReallocationSuggestion[] = [];

    overspending.forEach((overCampaign) => {
      // Find best candidate to receive budget (lowest pace)
      const candidates = [...underspending, ...ontrack].sort((a, b) => (a.paceIndex || 0) - (b.paceIndex || 0));

      if (candidates.length === 0) return; // No one to transfer to

      const bestRecipient = candidates[0];

      // Calculate transfer amount: reduce overspending campaign by 5% of budget
      const toTransfer = Math.round(overCampaign.allocatedBudget * 0.05);

      if (toTransfer <= 0) return;

      // Calculate new pace indices after transfer
      const fromNewAllocated = overCampaign.allocatedBudget - toTransfer;
      const toNewAllocated = bestRecipient.allocatedBudget + toTransfer;

      const fromNewProjected = overCampaign.projectedSpend
        ? (overCampaign.projectedSpend * fromNewAllocated) / overCampaign.allocatedBudget
        : 0;
      const toNewProjected = bestRecipient.projectedSpend
        ? (bestRecipient.projectedSpend * toNewAllocated) / bestRecipient.allocatedBudget
        : 0;

      const fromNewPace = fromNewAllocated > 0 ? fromNewProjected / fromNewAllocated : 0;
      const toNewPace = toNewAllocated > 0 ? toNewProjected / toNewAllocated : 0;

      suggestions.push({
        from: overCampaign.campaignName,
        to: bestRecipient.campaignName,
        amount: toTransfer,
        rationale: `${overCampaign.campaignName} em risco (${overCampaign.paceIndex?.toFixed(2)}x) → transferir para ${bestRecipient.campaignName} (${bestRecipient.paceIndex?.toFixed(2)}x)`,
        impact: {
          fromNewPace,
          toNewPace,
        },
      });
    });

    return {
      overspendingCampaigns: overspending,
      underspendingCampaigns: underspending,
      suggestions,
      canRelocate: suggestions.length > 0,
    };
  }, [campaigns]);

  return result;
};
