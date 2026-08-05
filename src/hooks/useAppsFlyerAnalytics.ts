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

const emptyData = (): AppsFlyerAnalyticsData => ({
  acquisition: [], campaigns: [], lifecycle: [], templates: [], templateCatalog: [], runs: [],
});

export function useAppsFlyerAnalytics(startDate: Date, endDate: Date) {
  const [data, setData] = useState<AppsFlyerAnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const [acquisition, campaigns, lifecycle, templates, templateCatalog, runs] = await Promise.all([
        supabase.from('appsflyer_acquisition_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_campaign_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_lifecycle_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('appsflyer_template_daily').select('*').gte('business_date', range.queryStart).lte('business_date', range.currentEnd).order('business_date'),
        supabase.from('communication_templates').select('*'),
        supabase.from('appsflyer_collection_runs').select('id,status,row_count,quality_summary,started_at,completed_at,min_business_date,max_business_date').order('started_at', { ascending: false }).limit(12),
      ]);
      const firstError = [acquisition.error, campaigns.error, lifecycle.error, templates.error, templateCatalog.error, runs.error].find(Boolean);
      if (firstError) throw firstError;
      setData({
        acquisition: (acquisition.data ?? []) as AppsFlyerAcquisitionRow[],
        campaigns: (campaigns.data ?? []) as AppsFlyerCampaignRow[],
        lifecycle: (lifecycle.data ?? []) as AppsFlyerLifecycleRow[],
        templates: (templates.data ?? []) as AppsFlyerTemplateRow[],
        templateCatalog: (templateCatalog.data ?? []) as CommunicationTemplate[],
        runs: (runs.data ?? []) as AppsFlyerCollectionRun[],
      });
    } catch (cause) {
      setData(emptyData());
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar os dados AppsFlyer.');
    } finally {
      setLoading(false);
    }
  }, [range.currentEnd, range.queryStart]);

  useEffect(() => { void load(); }, [load]);

  return { ...data, loading, error, refetch: load, range };
}
