export type CommunicationTemplateStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'superseded'
  | 'archived';

export type AttributionLinkStatus = 'draft' | 'active' | 'revoked' | 'invalid';

export type CommunicationSlotLifecycleStatus =
  | 'candidate'
  | 'active'
  | 'paused'
  | 'retired';

export type CommunicationSlotCoverageStatus =
  | 'unmapped'
  | 'partial'
  | 'ready'
  | 'blocked';

export interface CommunicationTemplate {
  template_id: string;
  title?: string | null;
  channel: string;
  family?: string | null;
  version_label: string;
  status: CommunicationTemplateStatus;
  source_system: string;
  storage_bucket: string;
  original_path?: string | null;
  preview_path?: string | null;
  thumbnail_path?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  content_hash?: string | null;
  metadata: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttributionLink {
  id: string;
  activity_id: string;
  template_id: string;
  provider: 'appsflyer';
  onelink_template_id?: string | null;
  base_url: string;
  deep_link_value: string;
  generated_url: string;
  parameters: Record<string, string>;
  link_version: number;
  status: AttributionLinkStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationSlot {
  id: string;
  journey_name: string;
  activity_name: string;
  channel: string;
  lifecycle_status: CommunicationSlotLifecycleStatus;
  coverage_status: CommunicationSlotCoverageStatus;
  current_template_id?: string | null;
  owner_id?: string | null;
  source: 'manual' | 'recent_activity' | 'import';
  first_seen_on?: string | null;
  last_seen_on?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  last_reviewed_at?: string | null;
  review_due_on?: string | null;
  notes?: string | null;
  metadata: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityMomentKind = 'semana_disparo' | 'disparo' | 'pontual';

export interface ActivityMomentSuggestion {
  kind: ActivityMomentKind;
  enabled: boolean;
  week?: number | null;
  dispatch?: number | null;
  label: string;
  confidence: 'alta' | 'media' | 'baixa' | 'manual';
  source: 'parser' | 'manual';
  updated_at?: string;
}

// Regra CRM atual (substitui o AppsFlyerCommunicationParameters antigo).
// Identidade: c = jornada/campanha · af_sub3 = template_id (conteúdo).
export interface AppsFlyerCrmCommunicationParameters {
  c: string;        // campanha/jornada CRM
  af_sub1: string;  // segmento/base/público
  af_sub2: string;  // semana/momento da jornada
  af_sub3: string;  // template_id (identidade do conteúdo) — minúsculo, como na planilha
}

export interface AppsFlyerPaidMediaParameters {
  c: string;
  af_adset?: string;
  af_ad?: string;
  af_ad_id?: string;
}

/**
 * Chaves esperadas dentro de `CommunicationTemplate.metadata` para o canal email.
 * Não são colunas: vivem no JSONB `metadata`.
 */
export interface EmailTemplateMetadata {
  subject?: string;    // Assunto
  preheader?: string;  // Pré-cabeçalho
}
