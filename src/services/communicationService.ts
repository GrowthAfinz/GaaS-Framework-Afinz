import { supabase } from './supabaseClient';
import type { CommunicationTemplate } from '../types/communication';
import { normalizeTemplateId, isValidTemplateId } from '../utils/templateId';
import { channelSlug, isEmailChannel } from '../utils/inferChannel';

const BUCKET = 'crm-communications';

/**
 * Extrai uma mensagem legível de qualquer erro (Error, PostgrestError, StorageError
 * ou objeto cru do Supabase). Erros do Supabase NÃO são instâncias de Error.
 */
export function describeError(err: unknown): string {
  if (!err) return 'Erro desconhecido.';
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.error, e.details, e.hint, e.code, e.statusCode]
      .filter((v): v is string | number => v != null && v !== '')
      .map(String);
    if (parts.length) return Array.from(new Set(parts)).join(' · ');
    try { return JSON.stringify(err); } catch { /* noop */ }
  }
  return 'Erro desconhecido.';
}

export interface SaveCommunicationInput {
  /** 'new' cria o template (cola id da planilha); 'existing' reutiliza um já cadastrado. */
  mode: 'new' | 'existing';
  /** Id colado (new) ou id do template existente. Normalizado para MAIÚSCULA antes de gravar. */
  rawTemplateId: string;
  /** Canal canônico ('E-mail' | 'SMS' | 'WhatsApp' | 'Push'). */
  channel: string;
  /** Liga TODAS as execuções deste activity_name ao template (habilita a Performance). */
  activityName: string;
  /** Slot da fila a marcar como 'ready' (opcional). */
  slotId?: string | null;
  /** Título opcional do template. */
  title?: string | null;
  /** Conteúdo de e-mail (mode email). */
  email?: { html: string; subject: string; preheader: string } | null;
  /** Print/imagem (demais canais). */
  imageFile?: File | null;
}

export interface SaveCommunicationResult {
  templateId: string;
  activitiesLinked: number;
  storagePath: string | null;
}

/** Extrai extensão de um nome de arquivo (sem ponto). Default 'png'. */
function fileExtension(name: string): string {
  const ext = name.split('.').pop();
  return ext && ext !== name ? ext.toLowerCase() : 'png';
}

/**
 * Cadastra a peça e amarra o disparo ao template numa única ação.
 * Ordem (FK activities.template_id → communication_templates):
 *   1. upload do arquivo (HTML ou imagem)
 *   2. insert do template (somente mode 'new')
 *   3. update activities.template_id (todas as execuções do activity_name)
 *   4. update do slot: coverage_status='ready' + current_template_id
 * Rollback: em falha após o upload, remove o arquivo; se o template foi criado
 * nesta chamada, remove o template também.
 */
export async function saveCommunication(input: SaveCommunicationInput): Promise<SaveCommunicationResult> {
  const isEmail = isEmailChannel(input.channel);

  // Resolve template_id final
  const templateId = input.mode === 'new'
    ? normalizeTemplateId(input.rawTemplateId)
    : input.rawTemplateId.trim();

  if (!isValidTemplateId(templateId)) {
    throw new Error(
      `template_id inválido: "${templateId}". Use 3-80 caracteres A-Z, 0-9, _ ou - (começando por letra/número).`
    );
  }

  let uploadedPath: string | null = null;
  let templateCreated = false;

  try {
    // ── 1. Upload (somente em mode 'new'; existing reaproveita o asset já gravado) ──
    if (input.mode === 'new') {
      const slug = channelSlug(input.channel);

      if (isEmail) {
        if (!input.email?.html?.trim()) throw new Error('HTML do e-mail é obrigatório.');
        const path = `crm/${slug}/${templateId}/email.html`;
        const blob = new Blob([input.email.html], { type: 'text/html' });
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
          upsert: true,
          contentType: 'text/html',
        });
        if (error) throw error;
        uploadedPath = path;
      } else {
        if (!input.imageFile) throw new Error('Imagem/print é obrigatório para este canal.');
        const ext = fileExtension(input.imageFile.name);
        const path = `crm/${slug}/${templateId}/original.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, input.imageFile, {
          upsert: true,
          contentType: input.imageFile.type || undefined,
        });
        if (error) throw error;
        uploadedPath = path;
      }

      // ── 2. Insert do template ──
      const metadata: Record<string, unknown> = {};
      if (isEmail && input.email) {
        metadata.subject = input.email.subject ?? '';
        metadata.preheader = input.email.preheader ?? '';
      }

      const row = {
        template_id: templateId,
        title: input.title?.trim() || templateId,
        channel: input.channel,
        status: 'active',
        source_system: 'gaas',
        storage_bucket: BUCKET,
        original_path: uploadedPath,
        mime_type: isEmail ? 'text/html' : (input.imageFile?.type || null),
        file_size_bytes: isEmail
          ? new Blob([input.email!.html]).size
          : (input.imageFile?.size ?? null),
        metadata,
      };

      const { error: insertError } = await supabase.from('communication_templates').insert(row);
      if (insertError) throw insertError;
      templateCreated = true;
    }

    // ── 3. Liga todas as execuções do activity_name ao template ──
    const { data: linked, error: linkError } = await supabase
      .from('activities')
      .update({ template_id: templateId, updated_at: new Date().toISOString() })
      .eq('Activity name / Taxonomia', input.activityName)
      .select('id');
    if (linkError) throw linkError;

    // ── 4. Marca o slot como coberto (ready exige current_template_id) ──
    if (input.slotId) {
      const { error: slotError } = await supabase
        .from('communication_slots')
        .update({
          current_template_id: templateId,
          coverage_status: 'ready',
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.slotId);
      if (slotError) throw slotError;
    }

    return {
      templateId,
      activitiesLinked: linked?.length ?? 0,
      storagePath: uploadedPath,
    };
  } catch (err) {
    // ── Rollback best-effort ──
    if (templateCreated) {
      await supabase.from('communication_templates').delete().eq('template_id', templateId);
    }
    if (uploadedPath) {
      await supabase.storage.from(BUCKET).remove([uploadedPath]);
    }
    throw err;
  }
}

/** Signed URL temporária para preview de asset no bucket privado. */
export async function getSignedUrl(path: string, expiresInSeconds = 60 * 60): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Lista templates cadastrados (para o dropdown "vincular existente"). */
export async function listTemplates(): Promise<CommunicationTemplate[]> {
  const { data, error } = await supabase
    .from('communication_templates')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CommunicationTemplate[];
}

export const communicationService = {
  saveCommunication,
  getSignedUrl,
  listTemplates,
};
