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
}
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

