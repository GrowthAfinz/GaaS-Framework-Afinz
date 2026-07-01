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

async function sha256Hex(input: Blob | string): Promise<string> {
  const buffer = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : await input.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getTemplateAssetHash(templateId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('communication_templates')
    .select('content_hash')
    .eq('template_id', templateId)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.content_hash === 'string' ? data.content_hash : null;
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
  let uploadedHash: string | null = null;

  try {
    // ── 1. Upload (novo template ou template existente recebendo/atualizando asset) ──
    const shouldUploadAsset = input.mode === 'new'
      || (isEmail ? !!input.email?.html?.trim() : !!input.imageFile);
    if (shouldUploadAsset) {
      const slug = channelSlug(input.channel);

      if (isEmail) {
        if (!input.email?.html?.trim()) throw new Error('HTML do e-mail é obrigatório.');
        uploadedHash = await sha256Hex(input.email.html);
        if (input.mode === 'existing' && uploadedHash === await getTemplateAssetHash(templateId)) {
          throw new Error('Este mesmo asset já está salvo neste template_id. Use outro HTML/imagem para substituir.');
        }
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
        uploadedHash = await sha256Hex(input.imageFile);
        if (input.mode === 'existing' && uploadedHash === await getTemplateAssetHash(templateId)) {
          throw new Error('Este mesmo asset já está salvo neste template_id. Use outro HTML/imagem para substituir.');
        }
        const ext = fileExtension(input.imageFile.name);
        const path = `crm/${slug}/${templateId}/original.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, input.imageFile, {
          upsert: true,
          contentType: input.imageFile.type || undefined,
        });
        if (error) throw error;
        uploadedPath = path;
      }
    }

      // ── 2. Insert do template ──
    if (input.mode === 'new') {
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
        content_hash: uploadedHash,
        file_size_bytes: isEmail
          ? new Blob([input.email!.html]).size
          : (input.imageFile?.size ?? null),
        metadata,
      };

      const { error: insertError } = await supabase.from('communication_templates').insert(row);
      if (insertError) throw insertError;
      templateCreated = true;
    } else if (uploadedPath) {
      // Template existente: grava/atualiza o asset sem criar outro template.
      const { data: current } = await supabase
        .from('communication_templates')
        .select('metadata')
        .eq('template_id', templateId)
        .single();
      const metadata: Record<string, unknown> = { ...(current?.metadata ?? {}) };
      if (isEmail && input.email) {
        metadata.subject = input.email.subject ?? '';
        metadata.preheader = input.email.preheader ?? '';
      }

      const { error: updateTemplateError } = await supabase
        .from('communication_templates')
        .update({
          channel: input.channel,
          title: input.title?.trim() || undefined,
          status: 'active',
          storage_bucket: BUCKET,
          original_path: uploadedPath,
          preview_path: null,
          thumbnail_path: null,
          mime_type: isEmail ? 'text/html' : (input.imageFile?.type || null),
          content_hash: uploadedHash,
          file_size_bytes: isEmail
            ? new Blob([input.email!.html]).size
            : (input.imageFile?.size ?? null),
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('template_id', templateId);
      if (updateTemplateError) throw updateTemplateError;
    }

    // ── 3. Liga todas as execuções do activity_name ao template ──
    const { data: linked, error: linkError } = await supabase
      .from('activities')
      .update({ template_id: templateId, updated_at: new Date().toISOString() })
      .eq('"Activity name / Taxonomia"', input.activityName)
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

export interface AddAssetInput {
  templateId: string;
  channel: string;
  email?: { html: string; subject: string; preheader: string } | null;
  imageFile?: File | null;
  /** activity_names planejados a vincular (best-effort) ao gravar o asset. */
  linkActivityNames?: string[];
}

/**
 * Adiciona o asset a um template DRAFT já existente (fluxo da governança):
 * sobe o arquivo, marca status='active' + original_path, e vincula os
 * activity_names planejados que existirem em activities. Rollback do upload em falha.
 */
export async function addAssetToTemplate(input: AddAssetInput): Promise<{ storagePath: string; activitiesLinked: number }> {
  const isEmail = isEmailChannel(input.channel);
  const slug = channelSlug(input.channel);
  let uploadedPath: string | null = null;
  let uploadedHash: string | null = null;

  try {
    if (isEmail) {
      if (!input.email?.html?.trim()) throw new Error('HTML do e-mail é obrigatório.');
      uploadedHash = await sha256Hex(input.email.html);
      if (uploadedHash === await getTemplateAssetHash(input.templateId)) {
        throw new Error('Este mesmo asset já está salvo neste template_id. Use outro HTML/imagem para substituir.');
      }
      const path = `crm/${slug}/${input.templateId}/email.html`;
      const blob = new Blob([input.email.html], { type: 'text/html' });
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: 'text/html' });
      if (error) throw error;
      uploadedPath = path;
    } else {
      if (!input.imageFile) throw new Error('Imagem/print é obrigatório para este canal.');
      uploadedHash = await sha256Hex(input.imageFile);
      if (uploadedHash === await getTemplateAssetHash(input.templateId)) {
        throw new Error('Este mesmo asset já está salvo neste template_id. Use outro HTML/imagem para substituir.');
      }
      const ext = fileExtension(input.imageFile.name);
      const path = `crm/${slug}/${input.templateId}/original.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, input.imageFile, { upsert: true, contentType: input.imageFile.type || undefined });
      if (error) throw error;
      uploadedPath = path;
    }

    // Lê metadata atual para preservar os campos da governança e mesclar subject/preheader.
    const { data: current } = await supabase
      .from('communication_templates').select('metadata').eq('template_id', input.templateId).single();
    const metadata: Record<string, unknown> = { ...(current?.metadata ?? {}) };
    if (isEmail && input.email) {
      metadata.subject = input.email.subject ?? '';
      metadata.preheader = input.email.preheader ?? '';
    }

    const { error: upErr } = await supabase.from('communication_templates').update({
      original_path: uploadedPath,
      mime_type: isEmail ? 'text/html' : (input.imageFile?.type || null),
      content_hash: uploadedHash,
      file_size_bytes: isEmail ? new Blob([input.email!.html]).size : (input.imageFile?.size ?? null),
      status: 'active',
      metadata,
      updated_at: new Date().toISOString(),
    }).eq('template_id', input.templateId);
    if (upErr) throw upErr;

    // Vincula os activity_names planejados (best-effort; só os que existirem são afetados).
    let linked = 0;
    for (const an of input.linkActivityNames ?? []) {
      const { data } = await supabase.from('activities')
        .update({ template_id: input.templateId, updated_at: new Date().toISOString() })
        .eq('"Activity name / Taxonomia"', an).select('id');
      linked += data?.length ?? 0;
    }
    return { storagePath: uploadedPath, activitiesLinked: linked };
  } catch (err) {
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
    throw err;
  }
}

/** Cria um template DRAFT (sem asset) a partir do compositor de ID. */
export async function createDraftTemplate(input: {
  templateId: string;
  channel: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('communication_templates').insert({
    template_id: input.templateId,
    title: input.templateId,
    channel: input.channel,
    status: 'draft',
    source_system: 'gaas',
    storage_bucket: 'crm-communications',
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

/** Vincula (marca) um activity_name a um template — todas as execuções do nome. */
export async function linkActivityToTemplate(activityName: string, templateId: string): Promise<number> {
  const { data, error } = await supabase
    .from('activities')
    .update({ template_id: templateId, updated_at: new Date().toISOString() })
    .eq('"Activity name / Taxonomia"', activityName)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/** Desvincula um activity_name (volta a template_id nulo). */
export async function unlinkActivity(activityName: string): Promise<number> {
  const { data, error } = await supabase
    .from('activities')
    .update({ template_id: null, updated_at: new Date().toISOString() })
    .eq('"Activity name / Taxonomia"', activityName)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Renomeia o template_id (PK). O FK activities.template_id e
 * communication_slots.current_template_id têm ON UPDATE CASCADE, então o vínculo
 * é reapontado pelo banco. Não move o asset no storage (original_path é preservado).
 */
export async function renameTemplate(oldId: string, newId: string): Promise<void> {
  const { error } = await supabase
    .from('communication_templates')
    .update({ template_id: newId, updated_at: new Date().toISOString() })
    .eq('template_id', oldId);
  if (error) throw error;
}

/** Remove o asset visual/HTML de um template, mantendo o template e seus vínculos. */
export async function deleteTemplateAsset(template: Pick<CommunicationTemplate, 'template_id' | 'original_path' | 'preview_path' | 'thumbnail_path'>): Promise<void> {
  const paths = [template.original_path, template.preview_path, template.thumbnail_path]
    .filter((path): path is string => !!path);

  const { error } = await supabase
    .from('communication_templates')
    .update({
      original_path: null,
      preview_path: null,
      thumbnail_path: null,
      mime_type: null,
      file_size_bytes: null,
      content_hash: null,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('template_id', template.template_id);
  if (error) throw error;

  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) {
      // O banco já voltou para "sem asset"; a remoção física é best-effort.
      console.warn('[deleteTemplateAsset] falha ao remover arquivo do storage:', storageError);
    }
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
  addAssetToTemplate,
  createDraftTemplate,
  deleteTemplateAsset,
  getSignedUrl,
  listTemplates,
};
