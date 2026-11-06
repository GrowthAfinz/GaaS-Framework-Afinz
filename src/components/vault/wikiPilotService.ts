import { supabase } from '../../services/supabaseClient';
import { normalizeWork } from '../growth-learning/development/workModel';
import { PILOT_KEYS } from './wikiPilotModel';

export async function loadPilotTasks() {
  const [result, access] = await Promise.all([
    supabase.from('growth_development_tasks').select('*').in('task_key', PILOT_KEYS),
    supabase.rpc('gaas_vault_is_admin'),
  ]);
  if (result.error) throw result.error;
  if (access.error) throw access.error;
  return { tasks: (result.data || []).map(normalizeWork), canEdit: access.data === true };
}
