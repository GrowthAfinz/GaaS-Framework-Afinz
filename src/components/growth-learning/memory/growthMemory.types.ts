import { GrowthBetFront } from '../bets/growthBet.types';

export type GrowthLearningSourceKind = 'outcome' | 'vault_curated';
export type GrowthLearningClassification = 'confirmed' | 'directional' | 'contradictory' | 'inconclusive' | 'invalidated';
export type GrowthLearningLifecycle = 'active' | 'expired' | 'superseded' | 'contested';
export type GrowthLearningConfidence = 'confirmed' | 'directional' | 'suspect' | 'blocked';

export interface GrowthLearning {
  id: string;
  source_kind: GrowthLearningSourceKind;
  source_outcome_id: string | null;
  source_key: string;
  source_title: string;
  source_ref: string;
  front: GrowthBetFront | 'report_live';
  classification: GrowthLearningClassification;
  lifecycle_status: GrowthLearningLifecycle;
  statement: string;
  scope: Record<string, unknown>;
  applicability: Record<string, unknown>;
  limitations: Record<string, unknown>;
  confidence_status: GrowthLearningConfidence;
  regime: string | null;
  valid_from: string;
  review_at: string;
  valid_until: string | null;
  supersedes_learning_id: string | null;
  current_revision: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  validated_by_loop: boolean;
  review_due: boolean;
  revision_count: number;
  last_revision_at: string | null;
  link_count: number;
}

export interface GrowthLearningRevision {
  id: string;
  learning_id: string;
  revision: number;
  statement: string;
  scope: Record<string, unknown>;
  applicability: Record<string, unknown>;
  limitations: Record<string, unknown>;
  classification: GrowthLearningClassification;
  lifecycle_status: GrowthLearningLifecycle;
  confidence_status: GrowthLearningConfidence;
  regime: string | null;
  valid_from: string;
  review_at: string;
  valid_until: string | null;
  change_reason: string;
  changed_by: string;
  created_at: string;
}

export interface GrowthMemoryFilters {
  search: string;
  source: 'all' | GrowthLearningSourceKind;
  front: 'all' | GrowthLearning['front'];
  classification: 'all' | GrowthLearningClassification;
}
