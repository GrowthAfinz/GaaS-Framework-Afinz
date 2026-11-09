import { supabase } from '../../services/supabaseClient';
import { normalizeWork } from '../growth-learning/development/workModel';
import { PILOT_KEYS, VISA_STRATEGY_PATH } from './wikiPilotModel';
export async function loadPilotTasks() {
 const [known,added,access]=await Promise.all([
  supabase.from('growth_development_tasks').select('*').in('task_key',PILOT_KEYS),
  supabase.from('growth_development_tasks').select('*').contains('details',{wiki_pilot_note:VISA_STRATEGY_PATH}).order('created_at'),
  supabase.rpc('gaas_vault_is_admin'),
 ]);
 if(known.error)throw known.error;if(added.error)throw added.error;if(access.error)throw access.error;
 const tasks=[...new Map([...(known.data||[]),...(added.data||[])].map(t=>[t.id,t])).values()].map(normalizeWork);
 return {tasks,canEdit:access.data===true};
}

export const INSURANCE_STRATEGY_PATH = '05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md';
export async function loadInsuranceTasks() {
 const [result,access]=await Promise.all([
  supabase.from('growth_development_tasks').select('*').eq('initiative_id','03d2907e-2bb1-4c45-9b26-f3caf11480b4').order('created_at'),
  supabase.rpc('gaas_vault_is_admin'),
 ]);
 if(result.error)throw result.error;if(access.error)throw access.error;
 return {tasks:(result.data||[]).map(normalizeWork),canEdit:access.data===true};
}
