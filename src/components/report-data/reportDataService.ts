import { supabase } from '../../services/supabaseClient';
import type { NoteDataBinding, NoteDataBlock, ReportDataset, ReportScope } from './reportDataContract';

async function read<T>(name: string, args = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}
export const readReportDataset = (snapshotId: string, scope: ReportScope = {}, includeRows = false) => read<ReportDataset>('report_data_read', { p_snapshot_id: snapshotId, p_scope: scope, p_include_rows: includeRows });
export const readNoteDataIndex = () => read<NoteDataBinding[]>('report_data_note_index');
export const readNoteDataBlocks = (noteId: string) => read<NoteDataBlock[]>('report_data_note_blocks', { p_note_id: noteId });
