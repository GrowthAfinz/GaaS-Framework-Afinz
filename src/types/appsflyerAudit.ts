export type AuditStatus =
  | 'synchronized'
  | 'rule_d2_d4'
  | 'approved'
  | 'shared'
  | 'conflict'
  | 'no_appsflyer'
  | 'no_template';

export type AuditDecisionStatus = 'pending' | 'approved' | 'shared' | 'rejected' | 'conflict';
export type AuditRuleCode = 'none' | 'exact_unique' | 'd2_d4_cutover' | 'manual_split';

export interface AppsFlyerAuditDecision {
  case_key: string;
  template_id: string;
  activity_names: string[];
  decision_status: AuditDecisionStatus;
  rule_code: AuditRuleCode;
  allocation_config: Record<string, unknown>;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppsFlyerAuditActivity {
  key: string;
  activityName: string;
  dispatchDate: string;
  templateId: string | null;
  segment: string;
  channel: string;
  journey: string;
  status: AuditStatus;
  caseKey: string | null;
}

export interface AppsFlyerAuditCase {
  caseKey: string;
  templateId: string;
  activityNames: string[];
  activities: AppsFlyerAuditActivity[];
  status: AuditStatus;
  suggestedRule: AuditRuleCode;
  installs: number;
  appsFlyerDates: string[];
  reasons: string[];
  decision: AppsFlyerAuditDecision | null;
}

export interface AppsFlyerAuditDay {
  date: string;
  installs: number;
  dispatches: number;
  segments: Record<string, number>;
}
