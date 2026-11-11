import { supabase } from '../../../services/supabaseClient';
import type { CardGoal, Ch, ConsumoRule, DispatchPayload, JourneyMapRow, PillarFront, PlanRow } from './consumoModel';

export interface ConsumoData { plan: PlanRow[]; rules: ConsumoRule[]; pillarFronts: PillarFront[]; goals: CardGoal[]; journeyMap: JourneyMapRow[]; payload: DispatchPayload }
export interface JourneyMapChange { journey: string; card_id?: string | null; front?: string | null; group_label?: string | null; clear?: boolean }

export async function loadConsumo(): Promise<ConsumoData> {
  const [plan, rules, fronts, goals, maps] = await Promise.all([
    supabase.from('sfmc_contract_plan').select('front,channel,month,volume').order('month'),
    supabase.from('sfmc_consumo_rules').select('id,priority,pattern,front,card_id,group_label').order('priority'),
    supabase.from('sfmc_pillar_fronts').select('front,pillar_id,position').order('position'),
    supabase.from('sfmc_card_goals').select('card_id,channel,monthly_volume'),
    supabase.from('sfmc_journey_map').select('journey,card_id,front,group_label'),
  ]);
  const error = plan.error || rules.error || fronts.error || goals.error || maps.error;
  if (error) throw error;
  const months = (plan.data || []).map(p => String(p.month)).sort();
  const from = months[0] || '2026-08-01';
  const disp = await supabase.rpc('sfmc_consumo_dispatches', { p_from: from });
  if (disp.error) throw disp.error;
  const payload = (disp.data || { journeys: [], activities: [], rows: [], last: null, loaded_at: null }) as DispatchPayload;
  return {
    plan: (plan.data || []).map(p => ({ ...p, volume: Number(p.volume) })) as PlanRow[],
    rules: (rules.data || []) as ConsumoRule[],
    pillarFronts: (fronts.data || []) as PillarFront[],
    goals: (goals.data || []).map(g => ({ ...g, monthly_volume: Number(g.monthly_volume) })) as CardGoal[],
    journeyMap: (maps.data || []) as JourneyMapRow[],
    payload,
  };
}

export async function saveGoal(cardId: string, channel: Ch, volume: number | null) {
  const { error } = await supabase.rpc('sfmc_save_card_goal', { p_card_id: cardId, p_channel: channel, p_volume: volume });
  if (error) throw error;
}

export async function saveJourneyMap(changes: JourneyMapChange[]) {
  for (let i = 0; i < changes.length; i += 400) {
    const { error } = await supabase.rpc('sfmc_save_journey_map', { p_items: changes.slice(i, i + 400) });
    if (error) throw error;
  }
}
