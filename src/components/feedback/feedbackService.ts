import { supabase } from '../../services/supabaseClient';
import {
  editorialDate, type FeedbackAttachment, type FeedbackEvent, type FeedbackItem, type FeedbackKind, type FeedbackRule,
  type FeedbackStatus, type ReviewNote, type ReviewRecord,
} from './feedbackModel';

const BUCKET = 'gaas-feedback';
const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf', 'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};
export const ACCEPTED_FILES = Object.keys(EXT).join(',');
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const MESSAGES: Record<string, string> = {
  feedback_auth_required: 'Entre no GaaS para registrar uma correção.',
  feedback_admin_required: 'Só o administrador decide, aprova ou aplica. Você ainda pode comentar, editar e anexar.',
  feedback_revision_conflict: 'Alguém mudou este comentário agora há pouco. Atualize para ver a versão nova.',
  feedback_item_missing: 'Este comentário não existe mais. Ele pode ter sido excluído.',
  feedback_reason_required: 'Diga o motivo antes de recusar.',
  feedback_attachment_limit: 'Cada comentário aceita até 10 anexos.',
  feedback_invalid_transition: 'Esse passo não vale para o estado atual do comentário.',
};

export function feedbackError(error: unknown): string {
  const text = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error);
  const key = Object.keys(MESSAGES).find(code => text.includes(code));
  return key ? MESSAGES[key] : 'Não foi possível concluir agora. Tente de novo em instantes.';
}

const must = <T,>(result: { data: T | null; error: unknown }): T => {
  if (result.error) throw result.error;
  return result.data as T;
};

export interface NewFeedback {
  kind: FeedbackKind;
  item_type: string;
  body: string;
  front?: string | null;
  subject?: string | null;
  surface: string;
  page_label: string;
  location_label: string;
  route: string;
  target_type?: string | null;
  target_id?: string | null;
  anchor?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || '';
}

export async function isFeedbackAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('gaas_vault_is_admin');
  return !error && data === true;
}

export async function listFeedbackItems(): Promise<FeedbackItem[]> {
  return must(await supabase.from('gaas_feedback_items').select('*').order('created_at', { ascending: false }).limit(1000)) as FeedbackItem[];
}

export async function countOpenFeedback(): Promise<number> {
  const { count, error } = await supabase.from('gaas_feedback_items').select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_conversation', 'with_ai', 'proposal_ready', 'ai_disagrees', 'needs_data', 'approved']);
  if (error) throw error;
  return count || 0;
}

export async function listFeedbackForTarget(targetType: string, targetId: string): Promise<FeedbackItem[]> {
  return must(await supabase.from('gaas_feedback_items').select('*').eq('target_type', targetType).eq('target_id', targetId).order('created_at', { ascending: false })) as FeedbackItem[];
}

export async function listVotes(): Promise<{ item_id: string; user_id: string }[]> {
  return must(await supabase.from('gaas_feedback_votes').select('item_id,user_id')) as { item_id: string; user_id: string }[];
}

export async function listAttachments(itemId: string): Promise<FeedbackAttachment[]> {
  return must(await supabase.from('gaas_feedback_attachments').select('*').eq('item_id', itemId).order('created_at')) as FeedbackAttachment[];
}

export async function listAttachmentCounts(): Promise<Record<string, number>> {
  const rows = must(await supabase.from('gaas_feedback_attachments').select('item_id')) as { item_id: string }[];
  return rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.item_id]: (acc[row.item_id] || 0) + 1 }), {});
}

export async function listEvents(itemId: string): Promise<FeedbackEvent[]> {
  return must(await supabase.from('gaas_feedback_events').select('*').eq('item_id', itemId).order('created_at')) as FeedbackEvent[];
}

export async function listPeople(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('profiles').select('id,full_name,email');
  if (error || !data) return {};
  return Object.fromEntries((data as { id: string; full_name?: string | null; email?: string | null }[])
    .map(p => [p.id, p.full_name?.trim() || p.email?.split('@')[0] || 'Pessoa do time']));
}

export async function createFeedback(input: NewFeedback, files: File[] = []): Promise<FeedbackItem> {
  const item = must(await supabase.rpc('gaas_feedback_create', { p_body: input })) as FeedbackItem;
  for (const file of files) await addAttachment(item.id, file);
  return item;
}

export async function editFeedback(item: FeedbackItem, patch: Partial<Pick<FeedbackItem, 'body' | 'item_type' | 'kind' | 'front' | 'subject'>>): Promise<FeedbackItem> {
  return must(await supabase.rpc('gaas_feedback_edit', { p_id: item.id, p_revision: item.revision, p_patch: patch })) as FeedbackItem;
}

/** Exclusão completa: o banco apaga item, votos, anexos e histórico; depois os arquivos saem do Storage. */
export async function deleteFeedback(itemId: string): Promise<void> {
  const paths = must(await supabase.rpc('gaas_feedback_delete', { p_id: itemId })) as string[];
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

export async function toggleVote(itemId: string): Promise<number> {
  return must(await supabase.rpc('gaas_feedback_toggle_vote', { p_id: itemId })) as number;
}

export async function addAttachment(itemId: string, file: File | Blob, name?: string): Promise<FeedbackAttachment> {
  const type = file.type || 'application/octet-stream';
  const ext = EXT[type];
  if (!ext) throw new Error('Formato não aceito. Use imagem, PDF, CSV ou XLSX.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Arquivo acima de 10 MB.');
  const path = `${itemId}/${crypto.randomUUID()}.${ext}`;
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false });
  if (upload.error) throw upload.error;
  try {
    return must(await supabase.rpc('gaas_feedback_add_attachment', {
      p_item: itemId, p_path: path, p_name: name || (file instanceof File ? file.name : `print.${ext}`), p_mime: type, p_bytes: file.size,
    })) as FeedbackAttachment;
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

export async function removeAttachment(attachmentId: string): Promise<void> {
  const path = must(await supabase.rpc('gaas_feedback_remove_attachment', { p_id: attachmentId })) as string;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function replaceAttachment(old: FeedbackAttachment, file: File): Promise<FeedbackAttachment> {
  const next = await addAttachment(old.item_id, file);
  await removeAttachment(old.id);
  return next;
}

export async function attachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data) throw error || new Error('sem url');
  return data.signedUrl;
}

export async function recordDecision(itemId: string, status: Extract<FeedbackStatus, 'open' | 'in_conversation' | 'deferred' | 'declined'>, priority: number | null, note: string): Promise<FeedbackItem> {
  return must(await supabase.rpc('gaas_feedback_record_decision', { p_id: itemId, p_status: status, p_priority: priority, p_note: note, p_via: 'gaas' })) as FeedbackItem;
}

export async function reviewProposal(itemId: string, decision: 'approve' | 'request_changes' | 'reject', note: string): Promise<FeedbackItem> {
  return must(await supabase.rpc('gaas_feedback_review', { p_id: itemId, p_decision: decision, p_note: note || null })) as FeedbackItem;
}

export async function listRules(): Promise<FeedbackRule[]> {
  return must(await supabase.from('gaas_feedback_rules').select('*').order('created_at', { ascending: false })) as FeedbackRule[];
}

export async function setRuleStatus(ruleId: string, status: FeedbackRule['status']): Promise<FeedbackRule> {
  return must(await supabase.rpc('gaas_feedback_set_rule_status', { p_id: ruleId, p_status: status })) as FeedbackRule;
}

export async function listReviewNotes(): Promise<ReviewNote[]> {
  const rows = must(await supabase.from('gaas_vault_notes').select('id,relative_path,title,status,content_hash,frontmatter').is('deleted_at', null).limit(2000)) as
    { id: string; relative_path: string; title: string; status: string | null; content_hash: string; frontmatter: Record<string, unknown> | null }[];
  return rows.map(r => ({ id: r.id, relative_path: r.relative_path, title: r.title, status: r.status, content_hash: r.content_hash, updated: editorialDate(r.frontmatter) }));
}

export async function listNoteReviews(path?: string): Promise<ReviewRecord[]> {
  let query = supabase.from('gaas_vault_note_reviews').select('relative_path,content_hash,verdict,reviewed_at').order('reviewed_at', { ascending: false }).limit(5000);
  if (path) query = query.eq('relative_path', path);
  return must(await query) as ReviewRecord[];
}

export async function recordNoteReview(path: string, verdict: ReviewRecord['verdict']): Promise<void> {
  must(await supabase.rpc('gaas_vault_record_note_review', { p_path: path, p_verdict: verdict }));
}

export async function noteContent(noteId: string): Promise<{ content_markdown: string; content_hash: string }> {
  return must(await supabase.from('gaas_vault_notes').select('content_markdown,content_hash').eq('id', noteId).single()) as { content_markdown: string; content_hash: string };
}

export async function noteHashByPath(path: string): Promise<string | null> {
  const { data } = await supabase.from('gaas_vault_notes').select('content_hash').eq('relative_path', path).is('deleted_at', null).limit(1);
  return (data as { content_hash: string }[] | null)?.[0]?.content_hash || null;
}

export interface HydrationStatus {
  enabled: boolean;
  cadence_hours: number;
  stale_after_days: number;
  last_checked_at: string | null;
  next_check_at: string | null;
  last_checked_by: string | null;
  last_result: { stale_count?: number; stale_notes?: { path: string; snapshot: string }[]; note?: string } | null;
  due: boolean;
}

/** Portão de hidratação: quando foi a última checagem dos snapshots e quando é a próxima. */
export async function hydrationStatus(): Promise<HydrationStatus | null> {
  const { data, error } = await supabase.rpc('gaas_vault_hydration_status');
  if (error) return null;
  return data as HydrationStatus;
}

export async function configureHydration(cadenceHours: number, staleAfterDays: number, enabled: boolean): Promise<void> {
  must(await supabase.rpc('gaas_vault_hydration_configure', { p_cadence_hours: cadenceHours, p_stale_after_days: staleAfterDays, p_enabled: enabled }));
}
