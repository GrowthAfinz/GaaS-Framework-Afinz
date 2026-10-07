import { supabase } from './supabaseClient';
import type { ApplyPreview, CandidateActivity, PackageImport, ParsedPackage, ReviewDecision, StoredMessage, TemplateContent } from '../modules/sfmc-package/types';
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}
export async function listPackageImports(): Promise<PackageImport[]> {
  const { data, error } = await supabase.from('sfmc_package_imports').select('*').order('uploaded_at', { ascending: false }).limit(50);
  if (error) throw error; return data || [];
}
export function stagePackage(pkg: ParsedPackage, scope: string) { return rpc<string>('stage_sfmc_package', { p_package: pkg, p_scope: scope }); }
export async function readPackage(id: string): Promise<StoredMessage[]> {
  const result: StoredMessage[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('sfmc_package_messages').select('*').eq('import_id', id).order('occurrence_key').range(offset, offset + 499);
    if (error) throw error;
    result.push(...(data || [])); if ((data || []).length < 500) return result;
  }
}
export function readCandidates(id: string) { return rpc<CandidateActivity[]>('sfmc_package_candidates', { p_import_id: id }); }
export function previewApply(id: string, decisions: ReviewDecision[]) {
  return rpc<ApplyPreview & { preview_token: string }>('preview_sfmc_package_apply', { p_import_id: id, p_decisions: decisions });
}
export function applyPackage(id: string, decisions: ReviewDecision[], token: string, key: string) {
  return rpc<ApplyPreview>('apply_sfmc_package_import', { p_import_id: id, p_decisions: decisions, p_preview_token: token, p_idempotency_key: key });
}
export function rejectMessages(id: string, messageIds: string[]) {
  return rpc<void>('reject_sfmc_package_messages', { p_import_id: id, p_message_ids: messageIds });
}
export async function readContents(templateId?: string): Promise<TemplateContent[]> {
  const result: TemplateContent[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from('communication_template_contents').select('*').order('id').range(offset, offset + 499);
    if (templateId) query = query.eq('template_id', templateId);
    const { data, error } = await query;
    if (error) throw error;
    result.push(...(data || [])); if ((data || []).length < 500) return result;
  }
}
export function notifyPackageChanged() { window.dispatchEvent(new Event('sfmc-package-changed')); }

