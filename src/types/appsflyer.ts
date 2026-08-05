export type AppsFlyerOrigin = 'organico' | 'pago' | 'crm' | 'parceiro';
export type AppsFlyerQuality = 'complete' | 'directional' | 'partial' | 'suspect' | 'blocked';
export type AppsFlyerMetricStatus = Record<string, string>;

export interface AppsFlyerAcquisitionRow {
  business_date: string;
  app_scope: string;
  app_id: string;
  platform: string;
  media_source: string;
  media_source_canonical: string;
  origin_group: AppsFlyerOrigin;
  af_channel: string;
  campaign: string;
  geo: string;
  sub_param_1: string;
  sub_param_2: string;
  sub_param_3: string;
  sub_param_4: string;
  sub_param_5: string;
  attributed_touch_type: string;
  is_retargeting: boolean;
  installs: number;
  metric_status: AppsFlyerMetricStatus;
  quality_status: AppsFlyerQuality;
  source_type: string;
  source_updated_at: string | null;
}

export interface AppsFlyerCampaignRow {
  business_date: string;
  app_scope: string;
  app_id: string;
  platform: string;
  media_source: string;
  media_source_canonical: string;
  origin_group: AppsFlyerOrigin;
  campaign: string;
  installs: number | null;
  clicks: number | null;
  impressions: number | null;
  sessions: number | null;
  cost: number | null;
  currency: string;
  metric_status: AppsFlyerMetricStatus;
  quality_status: AppsFlyerQuality;
  source_type: string;
  source_updated_at: string | null;
}

export interface AppsFlyerLifecycleRow {
  business_date: string;
  app_id: string;
  platform: string;
  media_source: string;
  media_source_canonical: string;
  origin_group: AppsFlyerOrigin;
  af_channel: string;
  campaign: string;
  sub_param_3: string;
  metric_type: 'uninstall' | 'reinstall';
  event_count: number;
  quality_status: AppsFlyerQuality;
  source_updated_at: string | null;
}

export interface AppsFlyerTemplateRow {
  business_date: string;
  template_id: string;
  af_installs: number;
  af_clicks: number | null;
  af_sessions: number | null;
  metric_status: AppsFlyerMetricStatus;
  quality_status: AppsFlyerQuality;
  imported_at: string;
}

export interface AppsFlyerCollectionRun {
  id: number;
  status: 'complete' | 'partial' | 'failed' | 'pending';
  row_count: number;
  quality_summary: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  date_from: string | null;
  date_to: string | null;
  max_business_date: string | null;
}
