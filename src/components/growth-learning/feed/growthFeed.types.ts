export const GROWTH_FEED_FRONTS = ['all', 'crm_acquisition', 'paid_media', 'b2c_origin', 'report_live'] as const;
export type GrowthFeedFrontFilter = typeof GROWTH_FEED_FRONTS[number];

export const GROWTH_FEED_SORTS = ['priority', 'recent', 'relevance'] as const;
export type GrowthFeedSort = typeof GROWTH_FEED_SORTS[number];

export const GROWTH_FEED_CONFIDENCES = ['all', 'confirmed', 'directional', 'suspect', 'blocked'] as const;
export type GrowthFeedConfidenceFilter = typeof GROWTH_FEED_CONFIDENCES[number];

export const GROWTH_FEED_STATES = ['all', 'open', 'blocked', 'certified', 'published'] as const;
export type GrowthFeedStateFilter = typeof GROWTH_FEED_STATES[number];

export type GrowthFeedEventType =
  | 'recommendation_created'
  | 'data_quality_blocked'
  | 'report_candidate_generated'
  | 'report_published'
  | 'report_blocked'
  | 'bet_created'
  | 'bet_updated'
  | 'signal_rejected';

export interface GrowthFeedEvidenceRef {
  view?: string;
  field?: string;
  [key: string]: unknown;
}

export interface GrowthFeedPrimaryAction {
  kind?: 'open_evidence' | 'open_report_live' | 'open_bet';
  label?: string;
}

export interface GrowthFeedSnapshot {
  title?: string;
  summary?: string;
  impact?: string;
  probable_cause?: string;
  reading_limit?: string;
  action_text?: string;
  evidence_refs?: GrowthFeedEvidenceRef[];
  source_view?: string;
  signal_code?: string;
  entity_key?: string;
  partner?: string;
  bucket?: string;
  confidence_status?: string;
  event_state?: string;
  generated_by?: string;
  review_status?: string;
  success_metric?: string;
  expected_value?: number;
  expected_unit?: string;
  expected_direction?: string;
  baseline_value?: number;
  metric_name?: string;
  success_criterion?: string;
  outcome_window_start?: string;
  execution_status?: string;
  outcome_window_end?: string;
  verification_view?: string;
  run_id?: string;
  publication_id?: string;
  publication_version?: number;
  report_type?: string;
  report_profile?: string;
  period_start?: string;
  period_end?: string;
  source_hash?: string;
  content_hash?: string;
  priority_reason?: string;
  primary_action?: GrowthFeedPrimaryAction;
  [key: string]: unknown;
}

export interface GrowthFeedDimensions {
  group_key?: string;
  domain?: string;
  partner?: string;
  source_view?: string;
  signal_code?: string;
  entity_key?: string;
  bucket?: string;
  confidence_status?: string;
  event_state?: string;
  review_status?: string;
  run_id?: string;
  period_start?: string;
  period_end?: string;
  [key: string]: unknown;
}

export interface GrowthFeedEvent {
  id: string;
  event_type: GrowthFeedEventType;
  subject_type: 'action_candidate' | 'report_run' | 'report_publication' | 'growth_bet';
  subject_id: string;
  front: Exclude<GrowthFeedFrontFilter, 'all'>;
  occurred_at: string;
  priority_score: number;
  relevance_dimensions: GrowthFeedDimensions;
  summary_snapshot: GrowthFeedSnapshot;
  route: string;
  dedupe_key: string;
  created_at: string;
  group_key: string;
  confidence_status: string | null;
  event_state: string | null;
  group_count: number;
  group_rank: number;
}

export interface GrowthFeedFilters {
  front: GrowthFeedFrontFilter;
  confidence: GrowthFeedConfidenceFilter;
  state: GrowthFeedStateFilter;
  sort: GrowthFeedSort;
}

export interface GrowthFeedGroup {
  groupKey: string;
  representative: GrowthFeedEvent;
  events: GrowthFeedEvent[];
}
