/**
 * Budget Hierarchy Types
 *
 * Two-level budget structure:
 * 1. ObjectiveBudget: Total allocated budget per objective (linked to Goals)
 * 2. CampaignBudget: Distribution of budget across specific campaigns
 *
 * Calculated fields (paceIndex, projections) are derived from paid_media_metrics
 */

export type BudgetObjective = 'marca' | 'b2c' | 'plurix' | 'seguros';
export type BudgetChannel = 'meta' | 'google';
export type PaceStatus = 'ontrack' | 'atrisk' | 'overspending' | 'underspending' | 'severe';

/**
 * ObjectiveBudget
 * Level 1: Aggregated budget per objective (linked to Goals table)
 *
 * Represents the total monthly budget allocated to a specific objective (e.g., "B2C", "Branding")
 * The totalBudget comes from Goals configuration in Configurações tab
 */
export interface ObjectiveBudget {
  id: string;                          // UUID
  month: string;                       // MM/yyyy format (e.g., "04/2026")
  objective: BudgetObjective;          // marca | b2c | plurix | seguros
  totalBudget: number;                 // R$ planejado (from Goals, mandatory)
  channel?: BudgetChannel;             // Optional: meta | google (if split by channel)

  // Calculated on the fly (aggregated from campaigns)
  realizedSpend?: number;              // Sum of all campaign.realizedSpend
  projectedSpend?: number;             // Sum of all campaign.projectedSpend

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CampaignBudget
 * Level 2: Budget allocation per campaign within an objective
 *
 * Represents how the objective's total budget is distributed across specific campaigns.
 * allocatedBudget must sum to ObjectiveBudget.totalBudget (enforced by validation)
 */
export interface CampaignBudget {
  id: string;                          // UUID
  month: string;                       // MM/yyyy format
  objectiveBudgetId: string;           // FK → ObjectiveBudget.id

  // Identifiers
  campaignName: string;                // e.g., "Aquisição Cartão", "Lead Gen Plurix"
  objective: BudgetObjective;          // Inherited from ObjectiveBudget (for filtering)
  channel: BudgetChannel;              // meta | google

  // Configuration
  allocatedBudget: number;             // R$ allocated to this specific campaign
  notes?: string;                      // Optional notes about allocation

  // Calculated from paid_media_metrics
  realizedSpend?: number;              // Sum of daily spend for this campaign in this month
  projectedSpend?: number;             // Linear projection: (realized / daysPassed) * totalDays

  // Derived metrics
  percentOfObjective?: number;         // allocatedBudget / objectiveBudget.totalBudget (%)
  percentOfAllocated?: number;         // realizedSpend / allocatedBudget (%)
  paceIndex?: number;                  // projectedSpend / allocatedBudget (1.0 = perfect)
  paceStatus?: PaceStatus;             // ontrack | atrisk | overspending | underspending | severe

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * BudgetStatus
 * Calculated metrics for display in UI
 *
 * Represents the "health" of a budget at a specific point in time
 */
export interface BudgetStatus {
  // Daily metrics
  dailyActual: number;                 // realizedSpend / daysPassed
  dailyProjected: number;              // allocatedBudget / daysInMonth

  // Cumulative metrics
  cumulativeActual: number;            // Sum of spend so far
  cumulativeProjected: number;         // (allocatedBudget / daysInMonth) * daysPassed

  // End-of-month projection
  projectionFull: number;              // (cumulativeActual / daysPassed) * daysInMonth

  // Pacing health
  paceIndex: number;                   // projectionFull / allocatedBudget
  status: PaceStatus;                  // Human-readable status
}

/**
 * BudgetReallocationSuggestion
 * Intelligent suggestion to move budget between campaigns
 *
 * Used by RealocateBudgetOrchestrator to suggest optimal reallocations
 */
export interface BudgetReallocationSuggestion {
  from: string;                        // Source campaign name
  to: string;                          // Destination campaign name
  amount: number;                      // R$ to transfer
  rationale: string;                   // Human explanation (e.g., "Risk high, other has slack")
  impact: {
    fromNewPace: number;               // New pace index after transfer (from campaign)
    toNewPace: number;                 // New pace index after transfer (to campaign)
  }
}

/**
 * Helper function to determine pace status based on paceIndex
 *
 * Thresholds:
 * - > 1.05: overspending (critical, at risk of budget overrun)
 * - 0.95-1.05: ontrack (ideal range, within 5% of budget)
 * - 0.85-0.95: underspending (below ideal, but acceptable)
 * - < 0.85: severe (significantly under budget, may indicate lack of execution)
 */
export function getPaceStatus(paceIndex: number): PaceStatus {
  if (paceIndex > 1.05) return 'overspending';
  if (paceIndex > 0.95) return 'ontrack';
  if (paceIndex > 0.85) return 'underspending';
  return 'severe';
}

/**
 * Helper function to format pace status for display
 */
export function formatPaceStatus(status: PaceStatus): { label: string; color: string; icon: string } {
  const statusMap: Record<PaceStatus, { label: string; color: string; icon: string }> = {
    ontrack: { label: 'No Ritmo', color: 'text-emerald-500 bg-emerald-50', icon: '✓' },
    underspending: { label: 'Lento', color: 'text-amber-500 bg-amber-50', icon: '↓' },
    atrisk: { label: 'Atenção', color: 'text-orange-500 bg-orange-50', icon: '⚠' },
    overspending: { label: 'Risco', color: 'text-red-500 bg-red-50', icon: '↑' },
    severe: { label: 'Crítico', color: 'text-red-600 bg-red-50', icon: '🔴' },
  };
  return statusMap[status];
}
