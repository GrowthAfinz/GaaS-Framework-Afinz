import { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format, subDays } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import type { CommunicationTemplate } from '../types/communication';
import type {
  AppsFlyerAcquisitionRow,
  AppsFlyerCampaignRow,
  AppsFlyerCollectionRun,
  AppsFlyerLifecycleRow,
  AppsFlyerTemplateRow,
} from '../types/appsflyer';

export interface AppsFlyerAnalyticsData {
  acquisition: AppsFlyerAcquisitionRow[];
  campaigns: AppsFlyerCampaignRow[];
  lifecycle: AppsFlyerLifecycleRow[];
  templates: AppsFlyerTemplateRow[];
  templateCatalog: CommunicationTemplate[];
  runs: AppsFlyerCollectionRun[];
}

export type AppsFlyerSourceKey = 'acquisition' | 'campaigns' | 'lifecycle' | 'templates' | 'templateCatalog' | 'runs';
export type AppsFlyerSourceState = 'available' | 'empty' | 'error';

export interface AppsFlyerSourceStatus {
  state: AppsFlyerSourceState;
  rowCount: number;
  message: string | null;
}

export type AppsFlyerSourceStatuses = Record<AppsFlyerSourceKey, AppsFlyerSourceStatus>;

const emptyData = (): AppsFlyerAnalyticsData => ({
  acquisition: [], campaigns: [], lifecycle: [], templates: [], templateCatalog: [], runs: [],
});

const emptyStatuses = (): AppsFlyerSourceStatuses => ({
  acquisition: { state: 'empty', rowCount: 0, message: null },
  campaigns: { state: 'empty', rowCount: 0, message: null },
  lifecycle: { state: 'empty', rowCount: 0, message: null },
  templates: { state: 'empty', rowCount: 0, message: null },
  templateCatalog: { state: 'empty', rowCount: 0, message: null },
  runs: { state: 'empty', rowCount: 0, message: null },
});

const errorMessage = (error: { message?: string; details?: string; hint?: string } | null) => {
  if (!error) return null;
  return [error.message, error.details, error.hint].filter(Boolean).join(' · ') || 'Falha não identificada na consulta.';
};

export function useAppsFlyerAnalytics(startDate: Date, endDate: Date) {
  const [data, setData] = useState<AppsFlyerAnalyticsData>(emptyData);
  const [sourceStatuses, setSourceStatuses] = useState<AppsFlyerSourceStatuses>(emptyStatuses);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const days = Math.max(differenceInCalendarDays(endDate, startDate) + 1, 1);
    return {
      currentStart: format(startDate, 'yyyy-MM-dd'),
      currentEnd: format(endDate, 'yyyy-MM-dd'),
      queryStart: format(subDays(startDate, days), 'yyyy-MM-dd'),
    };
  }, [startDate, endDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acquisition, campaigns, lifecycle, templates, templateCatalog, runs] = await Promise.all([
        supabase.from('appsflyer_acquisition_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_campaign_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_lifecycle_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_template_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('communication_templates').select('template_id,title,channel,metadata'),
        supabase.from('appsflyer_collection_runs').select('id,status,row_count,quality_summary,started_at,completed_at,date_from,date_to,max_business_date').order('started_at', { ascending: false }).limit(12),
      ]);

      const responses = { acquisition, campaigns, lifecycle, templates, templateCatalog, runs };
      const nextStatuses = Object.fromEntries(Object.entries(responses).map(([key, response]) => {
        const rowCount = response.data?.length ?? 0;
        return [key, {
          state: response.error ? 'error' : rowCount > 0 ? 'available' : 'empty',
          rowCount,
          message: errorMessage(response.error),
        }];
      })) as AppsFlyerSourceStatuses;

      setData({
        acquisition: acquisition.error ? [] : (acquisition.data ?? []) as AppsFlyerAcquisitionRow[],
        campaigns: campaigns.error ? [] : (campaigns.data ?? []) as AppsFlyerCampaignRow[],
        lifecycle: lifecycle.error ? [] : (lifecycle.data ?? []) as AppsFlyerLifecycleRow[],
        templates: templates.error ? [] : (templates.data ?? []) as AppsFlyerTemplateRow[],
        templateCatalog: templateCatalog.error ? [] : (templateCatalog.data ?? []) as CommunicationTemplate[],
        runs: runs.error ? [] : (runs.data ?? []) as AppsFlyerCollectionRun[],
      });
      setSourceStatuses(nextStatuses);
    } catch (cause) {
      setData(emptyData());
      const message = cause instanceof Error ? cause.message : 'Falha inesperada ao consultar AppsFlyer.';
      setSourceStatuses(Object.fromEntries(Object.keys(emptyStatuses()).map(key => [key, { state: 'error', rowCount: 0, message }])) as AppsFlyerSourceStatuses);
    } finally {
      setLoading(false);
    }
  }, [range.currentEnd, range.queryStart]);

  useEffect(() => { void load(); }, [load]);

  return { ...data, loading, sourceStatuses, refetch: load, range };
}
