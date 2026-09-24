import { supabase } from '../../../services/supabaseClient';
import {
  AcceptGrowthBetInput,
  CreateContextualGrowthBetInput,
  GrowthBet,
  GrowthBetChecklistItem,
  GrowthBetStatus,
  GrowthBetUpdate,
  GrowthExecutionStatus,
  GrowthLearningApplication,
  GrowthLearningSuggestion,
  GrowthSignalDecision,
} from './growthBet.types';
import { GrowthBetSourceContext } from '../growthLearningNavigation';
import { GrowthBetSourceLink } from './relatedGrowthBets.logic';

function oneRow<T>(data: T | T[] | null): T {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('O comando foi concluído sem retornar o registro esperado.');
  return row;
}

export async function fetchGrowthBets(): Promise<GrowthBet[]> {
  const { data, error } = await supabase
    .from('growth_bets_operational_v')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GrowthBet[];
}

export async function fetchRelatedGrowthBets(context: GrowthBetSourceContext): Promise<GrowthBetSourceLink[]> {
  let query = supabase
    .from('growth_bet_source_links_v')
    .select('*')
    .eq('front', context.front)
    .eq('source_route', context.sourceRoute)
    .order('updated_at', { ascending: false })
    .limit(12);
  query = context.entityKey
    ? query.eq('entity_key', context.entityKey)
    : query.is('entity_key', null);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GrowthBetSourceLink[];
}

export async function fetchGrowthBet(id: string): Promise<GrowthBet | null> {
  const { data, error } = await supabase
    .from('growth_bets_operational_v')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as GrowthBet | null;
}

export async function fetchGrowthSignalDecisions(candidateIds: string[]): Promise<GrowthSignalDecision[]> {
  if (candidateIds.length === 0) return [];
  const { data, error } = await supabase
    .from('growth_signal_decisions_v')
    .select('*')
    .in('action_candidate_id', candidateIds);
  if (error) throw error;
  return (data || []) as GrowthSignalDecision[];
}

export async function acceptGrowthSignal(input: AcceptGrowthBetInput): Promise<GrowthBet> {
  const alternatives = input.knownAlternatives
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  const { data, error } = await supabase.rpc('growth_accept_signal_as_bet_with_memory', {
    p_action_candidate_id: input.actionCandidateId,
    p_team_scope: input.teamScope.trim(),
    p_hypothesis: input.hypothesis.trim(),
    p_action_text: input.actionText.trim(),
    p_metric_name: input.metricName.trim(),
    p_baseline_value: Number(input.baselineValue),
    p_expected_value: Number(input.expectedValue),
    p_expected_direction: input.expectedDirection,
    p_success_criterion: input.successCriterion.trim(),
    p_outcome_window_start: input.outcomeWindowStart,
    p_outcome_window_end: input.outcomeWindowEnd,
    p_verification_view: input.verificationView.trim(),
    p_learning_decisions: input.learningDecisions.map((item) => ({
      learning_id: item.learningId,
      decision: item.decision,
      reason: item.reason?.trim() || null,
    })),
    p_expected_unit: input.expectedUnit.trim() || null,
    p_execution_due_at: input.executionDueAt ? new Date(`${input.executionDueAt}T12:00:00`).toISOString() : null,
    p_stop_condition: input.stopCondition.trim() || null,
    p_known_alternatives: alternatives,
    p_owner: input.owner.trim() || null,
  });
  if (error) throw error;
  return oneRow(data as GrowthBet | GrowthBet[] | null);
}

export async function fetchApplicableGrowthLearnings(actionCandidateId: string): Promise<GrowthLearningSuggestion[]> {
  const { data, error } = await supabase.rpc('growth_find_applicable_learnings', {
    p_action_candidate_id: actionCandidateId,
  });
  if (error) throw error;
  return (data || []) as GrowthLearningSuggestion[];
}

function scalarFilter(filters: Record<string, unknown>, key: string): string | undefined {
  const value = filters[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return undefined;
}

function contextualMatchSnapshot(context: GrowthBetSourceContext, metricName: string): Record<string, unknown> {
  return {
    metric: metricName.trim() || undefined,
    entity: context.entityKey,
    entity_key: context.entityKey,
    source_view: context.sourceSurface,
    partner: scalarFilter(context.filters, 'partner') || scalarFilter(context.filters, 'parceiros'),
    channel: scalarFilter(context.filters, 'channel') || scalarFilter(context.filters, 'canais'),
    platform: scalarFilter(context.filters, 'platform'),
    system: scalarFilter(context.filters, 'system'),
    artifact: scalarFilter(context.filters, 'artifact'),
    rule: scalarFilter(context.filters, 'rule'),
    campaign_family: scalarFilter(context.filters, 'campaign_family'),
    regime: scalarFilter(context.filters, 'regime'),
    signal_code: scalarFilter(context.filters, 'signal_code'),
  };
}

export async function fetchApplicableGrowthLearningsForContext(
  context: GrowthBetSourceContext,
  metricName: string,
): Promise<GrowthLearningSuggestion[]> {
  const { data, error } = await supabase.rpc('growth_find_applicable_learnings_for_context', {
    p_front: context.front,
    p_context_snapshot: contextualMatchSnapshot(context, metricName),
  });
  if (error) throw error;
  return (data || []) as GrowthLearningSuggestion[];
}

export async function createContextualGrowthBet(input: CreateContextualGrowthBetInput): Promise<GrowthBet> {
  const alternatives = input.knownAlternatives
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  const { data, error } = await supabase.rpc('growth_create_contextual_bet_with_memory', {
    p_front: input.sourceContext.front,
    p_source_context: {
      source_surface: input.sourceContext.sourceSurface,
      source_route: input.sourceContext.sourceRoute,
      period_start: input.sourceContext.periodStart,
      period_end: input.sourceContext.periodEnd,
      filters: input.sourceContext.filters,
      entity_key: input.sourceContext.entityKey || null,
      visual_ref: input.sourceContext.visualRef || null,
      title: input.sourceContext.title,
      verification_view: input.sourceContext.verificationView,
    },
    p_team_scope: input.teamScope.trim(),
    p_hypothesis: input.hypothesis.trim(),
    p_action_text: input.actionText.trim(),
    p_metric_name: input.metricName.trim(),
    p_baseline_value: Number(input.baselineValue),
    p_expected_value: Number(input.expectedValue),
    p_expected_direction: input.expectedDirection,
    p_success_criterion: input.successCriterion.trim(),
    p_outcome_window_start: input.outcomeWindowStart,
    p_outcome_window_end: input.outcomeWindowEnd,
    p_verification_view: input.verificationView.trim(),
    p_learning_decisions: input.learningDecisions.map((item) => ({
      learning_id: item.learningId,
      decision: item.decision,
      reason: item.reason?.trim() || null,
    })),
    p_expected_unit: input.expectedUnit.trim() || null,
    p_execution_due_at: input.executionDueAt ? new Date(`${input.executionDueAt}T12:00:00`).toISOString() : null,
    p_stop_condition: input.stopCondition.trim() || null,
    p_known_alternatives: alternatives,
    p_owner: input.owner.trim() || null,
  });
  if (error) throw error;
  return oneRow(data as GrowthBet | GrowthBet[] | null);
}

export async function fetchGrowthBetLearningApplications(betId: string): Promise<GrowthLearningApplication[]> {
  const { data, error } = await supabase
    .from('growth_learning_applications_v')
    .select('*')
    .eq('bet_id', betId)
    .order('match_score', { ascending: false });
  if (error) throw error;
  return (data || []) as GrowthLearningApplication[];
}

export async function rejectGrowthSignal(candidateId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc('growth_reject_signal', {
    p_action_candidate_id: candidateId,
    p_reason: reason.trim(),
  });
  if (error) throw error;
  return String(data);
}

export async function mergeGrowthSignal(candidateId: string, betId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc('growth_merge_signal_into_bet', {
    p_action_candidate_id: candidateId,
    p_bet_id: betId,
    p_reason: reason.trim() || null,
  });
  if (error) throw error;
  return String(data);
}

export async function fetchGrowthBetChecklist(betId: string): Promise<GrowthBetChecklistItem[]> {
  const { data, error } = await supabase
    .from('growth_bet_checklist_items')
    .select('*')
    .eq('bet_id', betId)
    .order('position');
  if (error) throw error;
  return (data || []) as GrowthBetChecklistItem[];
}

export async function fetchGrowthBetUpdates(betId: string): Promise<GrowthBetUpdate[]> {
  const { data, error } = await supabase
    .from('growth_bet_updates')
    .select('*')
    .eq('bet_id', betId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return (data || []) as GrowthBetUpdate[];
}

export async function addGrowthBetChecklistItem(betId: string, label: string): Promise<GrowthBetChecklistItem> {
  const { data, error } = await supabase.rpc('growth_add_bet_checklist_item', {
    p_bet_id: betId,
    p_label: label.trim(),
  });
  if (error) throw error;
  return oneRow(data as GrowthBetChecklistItem | GrowthBetChecklistItem[] | null);
}

export async function setGrowthBetChecklistItem(itemId: string, status: GrowthBetChecklistItem['status']): Promise<GrowthBetChecklistItem> {
  const { data, error } = await supabase.rpc('growth_set_bet_checklist_item', {
    p_item_id: itemId,
    p_status: status,
  });
  if (error) throw error;
  return oneRow(data as GrowthBetChecklistItem | GrowthBetChecklistItem[] | null);
}

export async function appendGrowthBetUpdate(input: {
  betId: string;
  type: 'comment' | 'execution' | 'status_changed';
  body: string;
  executionStatus?: GrowthExecutionStatus;
  betStatus?: GrowthBetStatus;
}): Promise<GrowthBetUpdate> {
  const { data, error } = await supabase.rpc('growth_append_bet_update', {
    p_bet_id: input.betId,
    p_update_type: input.type,
    p_body: input.body.trim(),
    p_execution_status: input.executionStatus || null,
    p_bet_status: input.betStatus || null,
  });
  if (error) throw error;
  return oneRow(data as GrowthBetUpdate | GrowthBetUpdate[] | null);
}
