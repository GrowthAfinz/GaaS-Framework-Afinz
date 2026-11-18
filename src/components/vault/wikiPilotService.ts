import { supabase } from '../../services/supabaseClient';
import { normalizeWork } from '../growth-learning/development/workModel';
import { canEditWork } from '../growth-learning/development/developmentService';
import { PILOT_KEYS, VISA_STRATEGY_PATH } from './wikiPilotModel';

/**
 * Iniciativa da nota: a dos projetos da Visão Daily cujo wiki_note aponta para ela (decisão de 18/11/2026).
 * Assim a seção de Tarefas da nota, o kanban da Daily e as páginas de Tarefas mostram os mesmos registros.
 */
export async function initiativeOfNote(path: string): Promise<string | null> {
 const { data, error } = await supabase.from('daily_projects').select('initiative_id').eq('wiki_note', path).eq('archived', false).not('initiative_id', 'is', null);
 if (error) return null;
 const ids = [...new Set((data || []).map(r => r.initiative_id as string))];
 return ids.length === 1 ? ids[0] : null;
}

export async function loadPilotTasks() {
 const initiativeId = await initiativeOfNote(VISA_STRATEGY_PATH);
 const [known,added,byInitiative,access]=await Promise.all([
  supabase.from('growth_development_tasks').select('*').in('task_key',PILOT_KEYS),
  supabase.from('growth_development_tasks').select('*').contains('details',{wiki_pilot_note:VISA_STRATEGY_PATH}).order('created_at'),
  initiativeId ? supabase.from('growth_development_tasks').select('*').eq('initiative_id',initiativeId).order('created_at') : Promise.resolve({ data: [], error: null }),
  canEditWork(),
 ]);
 if(known.error)throw known.error;if(added.error)throw added.error;if(byInitiative.error)throw byInitiative.error;
 const tasks=[...new Map([...(known.data||[]),...(added.data||[]),...(byInitiative.data||[])].map(t=>[t.id,t])).values()].map(normalizeWork);
 return {tasks,canEdit:access,initiativeId};
}

export const INSURANCE_STRATEGY_PATH = '05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md';
const INSURANCE_INITIATIVE = '03d2907e-2bb1-4c45-9b26-f3caf11480b4';
export async function loadInsuranceTasks() {
 const initiativeId = (await initiativeOfNote(INSURANCE_STRATEGY_PATH)) || INSURANCE_INITIATIVE;
 const [result,access]=await Promise.all([
  supabase.from('growth_development_tasks').select('*').eq('initiative_id',initiativeId).order('created_at'),
  canEditWork(),
 ]);
 if(result.error)throw result.error;
 return {tasks:(result.data||[]).map(normalizeWork),canEdit:access,initiativeId};
}
