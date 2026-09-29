import { supabase } from '../../services/supabaseClient';
import { VaultNote, VaultNoteInput, VaultSyncRun } from './vaultTypes';

const BATCH_SIZE = 25;

export async function canSyncVault(): Promise<boolean> {
  const { data, error } = await supabase.rpc('gaas_vault_is_admin');
  if (error) throw error;
  return Boolean(data);
}

export async function searchVault(query = '', folder?: string | null): Promise<VaultNote[]> {
  const { data, error } = await supabase.rpc('gaas_search_vault', {
    p_query: query,
    p_folder: folder || null,
    p_layer: null,
    p_note_type: null,
    p_limit: 500,
  });
  if (error) throw error;
  return (data || []) as VaultNote[];
}

export async function latestVaultSync(): Promise<VaultSyncRun | null> {
  const { data, error } = await supabase
    .from('gaas_vault_sync_runs')
    .select('id,status,source,started_at,completed_at,note_count,link_count,changed_count,deleted_count')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as VaultSyncRun | null;
}

export async function syncVault(notes: VaultNoteInput[], onProgress?: (done: number, total: number) => void) {
  const { data: runId, error: beginError } = await supabase.rpc('gaas_vault_begin_sync', {
    p_vault_key: 'afinz-crm-midia',
    p_source: 'browser-directory',
  });
  if (beginError) throw beginError;
  try {
    for (let index = 0; index < notes.length; index += BATCH_SIZE) {
      const batch = notes.slice(index, index + BATCH_SIZE);
      const { error } = await supabase.rpc('gaas_vault_upsert_batch', {
        p_sync_run_id: runId,
        p_notes: batch,
      });
      if (error) throw error;
      onProgress?.(Math.min(index + batch.length, notes.length), notes.length);
    }

    const { data, error } = await supabase.rpc('gaas_vault_finish_sync', { p_sync_run_id: runId });
    if (error) throw error;
    return data as VaultSyncRun;
  } catch (error) {
    await supabase.rpc('gaas_vault_fail_sync', {
      p_sync_run_id: runId,
      p_error_message: error instanceof Error ? error.message : 'unknown_error',
    });
    throw error;
  }
}
