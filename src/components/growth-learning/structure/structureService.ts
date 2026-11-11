import { supabase } from '../../../services/supabaseClient';
import type { StructureCard, StructureEvent, StructureLane, StructurePillar } from './structureModel';

export interface StructureBoard { pillars: StructurePillar[]; lanes: StructureLane[]; cards: StructureCard[]; isAdmin: boolean }

export async function loadStructure(): Promise<StructureBoard> {
  const [pillars, lanes, cards, access] = await Promise.all([
    supabase.from('crm_structure_pillars').select('*').eq('archived', false).order('position'),
    supabase.from('crm_structure_lanes').select('*').eq('archived', false).order('position'),
    supabase.from('crm_structure_cards').select('*').order('position'),
    supabase.rpc('gaas_vault_is_admin'),
  ]);
  const error = pillars.error || lanes.error || cards.error;
  if (error) throw error;
  return {
    pillars: (pillars.data || []) as StructurePillar[],
    lanes: (lanes.data || []) as StructureLane[],
    cards: (cards.data || []) as StructureCard[],
    isAdmin: access.data === true,
  };
}

async function call<T>(fn: string, id: string | null, revision: number | null, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, { p_id: id, p_revision: revision, p_body: body });
  if (error) throw error;
  return data as T;
}
export const saveCard = (id: string | null, revision: number | null, body: Record<string, unknown>) => call<StructureCard>('crm_structure_save_card', id, revision, body);
export const saveLane = (id: string | null, revision: number | null, body: Record<string, unknown>) => call<StructureLane>('crm_structure_save_lane', id, revision, body);
export const savePillar = (id: string | null, revision: number | null, body: Record<string, unknown>) => call<StructurePillar>('crm_structure_save_pillar', id, revision, body);

export async function loadEvents(entityId: string): Promise<StructureEvent[]> {
  const { data, error } = await supabase.from('crm_structure_events').select('id,entity,entity_id,revision,before_data,after_data,created_at')
    .eq('entity_id', entityId).order('revision', { ascending: false }).limit(60);
  if (error) throw error;
  return (data || []) as StructureEvent[];
}
