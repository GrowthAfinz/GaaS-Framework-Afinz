export interface MessageContent {
  schema_version: 1;
  channel: string;
  meta_template_name: string | null;
  body_text: string | null;
  body_params: string[];
  footer: string | null;
  buttons: { title: string; type: 'url' | 'reply' }[];
  banner_url: string | null;
  sms_from: string | null;
  email_html?: string | null;
  email_subject?: string | null;
  email_preheader?: string | null;
}
export interface PackageMessage {
  occurrence_key: string;
  journey_name: string;
  journey_name_raw: string;
  journey_version: number;
  journey_origin_id: string;
  activity_key: string;
  activity_name: string;
  entry_de: string | null;
  entry_filter: string | null;
  paths: { labels: string[]; waits: string[] }[];
  asset_name: string | null;
  asset_id?: string | null;
  content: MessageContent;
  link_url: string | null;
  utm: Record<string, string | null>;
  is_optout: boolean;
  alerts: string[];
}
export interface ParsedPackage {
  file_name: string;
  package_name: string;
  package_version: number;
  package_sha256: string;
  parser_version: string;
  journeys_count: number;
  messages: PackageMessage[];
  graphs?: JourneyGraph[];
}
export interface JourneyOutcome { key: string; next: string | null; label: string; metadata: Record<string, any>; arguments: Record<string, any> }
export interface JourneyNode { key: string; name: string; type: string; configuration: Record<string, any>; outcomes: JourneyOutcome[] }
export interface JourneyGraph {
  reference: string; name: string; version: number;
  entry: { trigger: Record<string, any>; event: Record<string, any>; de: Record<string, any>; entryMode: string | null };
  goals: Record<string, any>[]; exitCriteria: Record<string, any>[];
  nodes: JourneyNode[]; roots: string[]; joins: string[];
}
export interface JourneySnapshot { id: string; import_id: string; reference: string; journey_name: string; journey_version: number; graph: JourneyGraph; messages: PackageMessage[]; created_at: string }
export interface PackageImport {
  id: string; file_name: string; package_name: string; source_scope: string;
  status: string; uploaded_at: string; messages_count: number;
}
export interface StoredMessage {
  id: string; import_id: string; payload: PackageMessage; decision: 'pending' | 'rejected' | 'applied';
}
export interface TemplateContent {
  id: string; template_id: string; content_hash: string; payload: MessageContent;
  is_current: boolean; first_seen_at: string;
}
export interface ReviewDecision {
  message_id: string; template_id: string; activity_ids: string[];
  start_date: string | null; end_date: string | null; evidence: string;
  set_current: boolean; expected_current_id: string | null;
}
export interface CandidateActivity {
  id: string; activity_name: string; journey_name: string; channel: string;
  dispatch_date: string; template_id: string | null; exact_journey: boolean;
}
export interface ApplyPreview {
  messages: number; activities: number; new_templates: number; contents: number; new_slots: number;
}

