import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, Download,
  Filter, Gauge, Info, MousePointerClick, RefreshCw, Search, ShieldCheck,
  Smartphone, TableProperties, Unplug, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { differenceInCalendarDays, format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePeriod } from '../contexts/PeriodContext';
import { useAppsFlyerAnalytics } from '../hooks/useAppsFlyerAnalytics';
import type { AppsFlyerSourceKey, AppsFlyerSourceStatuses } from '../hooks/useAppsFlyerAnalytics';
import type {
  AppsFlyerAcquisitionRow, AppsFlyerCampaignRow, AppsFlyerMetricStatus,
  AppsFlyerOrigin, AppsFlyerQuality,
} from '../types/appsflyer';
import { OnboardingFunnelWorkspace } from './OnboardingFunnelWorkspace';

type Granularity = 'daily' | 'weekly' | 'monthly';
type SortKey = 'campaign' | 'clicks' | 'installs' | 'conversion' | 'sessions' | 'intensity' | 'cost';

const originMeta: Record<AppsFlyerOrigin, { label: string; color: string }> = {
  organico: { label: 'Orgânico', color: '#0f766e' },
  pago: { label: 'Pago', color: '#2563eb' },
  crm: { label: 'CRM', color: '#7c3aed' },
  parceiro: { label: 'Parceiro', color: '#db2777' },
};

const qualityLabel: Record<AppsFlyerQuality, string> = {
  complete: 'Completo', directional: 'Direcional', partial: 'Parcial', suspect: 'Suspeito', blocked: 'Bloqueado',
};

const n = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const sumBy = <T,>(rows: T[], pick: (row: T) => number | null | undefined) => rows.reduce((total, row) => total + n(pick(row)), 0);
const pct = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator * 100 : null;
const ratio = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator : null;
const numberLabel = (value: number | null | undefined) => value == null ? '—' : Math.round(value).toLocaleString('pt-BR');
const compact = (value: number) => Math.abs(value) >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : Math.round(value).toLocaleString('pt-BR');
const pctLabel = (value: number | null, digits = 1) => value == null ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
const ratioLabel = (value: number | null) => value == null ? '—' : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const moneyLabel = (value: number | null, currency = 'USD') => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
const isInRange = (date: string, start: string, end: string) => date >= start && date <= end;
const isResidualAmbiguous = (row: AppsFlyerCampaignRow) => row.media_source.trim().toLowerCase() === 'unknown' && row.campaign.trim() === '';
const clean = (value: string) => value.trim().toLowerCase();

function previousRange(start: Date, end: Date) {
  const span = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const previousEnd = subDays(start, 1);
  return { start: format(subDays(previousEnd, span - 1), 'yyyy-MM-dd'), end: format(previousEnd, 'yyyy-MM-dd') };
}

function periodKey(date: string, granularity: Granularity) {
  const parsed = new Date(`${date}T12:00:00`);
  if (granularity === 'monthly') return format(startOfMonth(parsed), 'yyyy-MM-dd');
  if (granularity === 'weekly') return format(startOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return date;
}

function periodLabel(key: string, granularity: Granularity) {
  const date = new Date(`${key}T12:00:00`);
  if (granularity === 'monthly') return format(date, 'MMM/yy', { locale: ptBR }).replace('.', '');
  if (granularity === 'weekly') return `sem. ${format(date, 'dd/MM')}`;
  return format(date, 'dd/MM');
}

function statusMeta(status: string | undefined) {
  if (status === 'confirmed_via_raw_reconciled' || status === 'confirmed') return { label: 'raw confirmado', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  if (status?.includes('aggregate_ltv_cohort')) return { label: 'agregado · LTV/cohort', className: 'border-blue-200 bg-blue-50 text-blue-800' };
  if (status?.includes('not_available')) return { label: 'indisponível', className: 'border-slate-200 bg-slate-100 text-slate-500' };
  return { label: status || 'não informado', className: 'border-amber-200 bg-amber-50 text-amber-800' };
}

const StatusBadge = ({ status, title }: { status?: string; title?: string }) => {
  const meta = statusMeta(status);
  return <span title={title} className={`inline-flex whitespace-nowrap border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.className}`}>{meta.label}</span>;
};

const Delta = ({ current, previous }: { current: number; previous: number }) => {
  if (previous <= 0) return <span className="text-[9px] text-slate-400">sem base anterior</span>;
  const value = (current - previous) / previous * 100;
  return <span className={`text-[9px] font-semibold ${value > 0 ? 'text-emerald-700' : value < 0 ? 'text-red-700' : 'text-slate-500'}`}>{value > 0 ? '+' : ''}{value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs. anterior</span>;
};

const MetricCard = ({ label, value, previous, icon: Icon, status, note }: {
  label: string; value: string; previous?: { current: number; previous: number }; icon: LucideIcon;
  status?: string; note: string;
}) => <div className="border border-slate-200 bg-white p-3 shadow-sm">
  <div className="flex items-start justify-between gap-2"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-600"><Icon size={14} />{label}</span>{status && <StatusBadge status={status} />}</div>
  <p className="mt-2 font-mono text-2xl font-semibold leading-none text-slate-950">{value}</p>
  <div className="mt-1 h-4">{previous && <Delta {...previous} />}</div>
  <p className="mt-1 text-[9px] leading-snug text-slate-500">{note}</p>
</div>;

function MultiFilter({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  return <details className="relative min-w-[150px] border border-slate-300 bg-white text-[11px]">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-2.5 py-2 font-semibold text-slate-700">
      <span>{label}{selected.length ? ` (${selected.length})` : ''}</span><ChevronDown size={13} />
    </summary>
    <div className="absolute left-0 top-full z-40 mt-1 max-h-64 min-w-[230px] overflow-auto border border-slate-300 bg-white p-2 shadow-xl">
      <button type="button" onClick={() => onChange([])} className="mb-1 w-full border-b border-slate-100 px-2 py-1 text-left text-[10px] font-semibold text-cyan-700">Limpar seleção</button>
      {options.map(option => <label key={option} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-slate-50">
        <input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter(v => v !== option) : [...selected, option])} />
        <span className="max-w-[260px] truncate" title={option}>{option || '(sem valor)'}</span>
      </label>)}
    </div>
  </details>;
}

function QualityPill({ quality }: { quality: AppsFlyerQuality }) {
  const cls = quality === 'complete' ? 'bg-emerald-50 text-emerald-800' : quality === 'blocked' || quality === 'suspect' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800';
  return <span className={`px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>{qualityLabel[quality]}</span>;
}

const sourceLabels: Record<AppsFlyerSourceKey, string> = {
  acquisition: 'Installs raw',
  campaigns: 'Campanhas agregadas',
  lifecycle: 'Lifecycle',
  templates: 'Templates AppsFlyer',
  templateCatalog: 'Catálogo de templates',
  runs: 'Histórico de coleta',
};

function SourceStatusList({ statuses }: { statuses: AppsFlyerSourceStatuses }) {
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
    {(Object.keys(sourceLabels) as AppsFlyerSourceKey[]).map(key => {
      const status = statuses[key];
      const available = status.state === 'available';
      const failed = status.state === 'error';
      return <div key={key} className={`border p-2.5 ${failed ? 'border-red-200 bg-red-50' : available ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-slate-700">{sourceLabels[key]}</span>
          <span className={`text-[9px] font-bold uppercase ${failed ? 'text-red-700' : available ? 'text-emerald-700' : 'text-slate-500'}`}>{failed ? 'Indisponível' : available ? 'Disponível' : 'Sem dados'}</span>
        </div>
        <p className="mt-1 text-[9px] leading-snug text-slate-500">{failed ? status.message : available ? `${status.rowCount.toLocaleString('pt-BR')} linhas consultadas` : 'Consulta concluída sem registros na janela.'}</p>
      </div>;
    })}
  </div>;
}

export const AppsFlyerFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => {
  const { startDate, endDate } = usePeriod();
  const { acquisition, campaigns, lifecycle, templates, templateCatalog, runs, loading, sourceStatuses, refetch } = useAppsFlyerAnalytics(startDate, endDate);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [origins, setOrigins] = useState<AppsFlyerOrigin[]>([]);
  const [qualities, setQualities] = useState<AppsFlyerQuality[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [templateMode, setTemplateMode] = useState<'all' | 'with' | 'without'>('all');
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'clicks', direction: 'desc' });

  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');
  const previous = previousRange(startDate, endDate);
  const period = `${format(startDate, 'dd/MM/yyyy')} – ${format(endDate, 'dd/MM/yyyy')}`;

  const options = useMemo(() => ({
    platforms: [...new Set([...acquisition.map(r => r.platform), ...campaigns.map(r => r.platform)].filter(Boolean))].sort(),
    sources: [...new Set([...acquisition.map(r => r.media_source_canonical || r.media_source), ...campaigns.map(r => r.media_source_canonical || r.media_source)].filter(Boolean))].sort(),
    channels: [...new Set(acquisition.map(r => r.af_channel).filter(Boolean))].sort(),
  }), [acquisition, campaigns]);

  const matchesCommon = (row: { platform: string; media_source: string; media_source_canonical: string; origin_group: AppsFlyerOrigin; quality_status: AppsFlyerQuality; campaign: string }) =>
    (!platforms.length || platforms.includes(row.platform)) &&
    (!sources.length || sources.includes(row.media_source_canonical || row.media_source)) &&
    (!origins.length || origins.includes(row.origin_group)) &&
    (!qualities.length || qualities.includes(row.quality_status)) &&
    (!campaignSearch.trim() || clean(row.campaign).includes(clean(campaignSearch)));

  const filteredAcquisition = useMemo(() => acquisition.filter(row =>
    matchesCommon(row) && (!channels.length || channels.includes(row.af_channel)) &&
    (templateMode === 'all' || (templateMode === 'with' ? Boolean(row.sub_param_3.trim()) : !row.sub_param_3.trim()))
  ), [acquisition, platforms, sources, channels, origins, qualities, campaignSearch, templateMode]);

  const filteredCampaigns = useMemo(() => campaigns.filter(row => !isResidualAmbiguous(row) && matchesCommon(row)), [campaigns, platforms, sources, origins, qualities, campaignSearch]);
  const currentAcquisition = filteredAcquisition.filter(row => isInRange(row.business_date, start, end));
  const previousAcquisition = filteredAcquisition.filter(row => isInRange(row.business_date, previous.start, previous.end));
  const currentCampaigns = filteredCampaigns.filter(row => isInRange(row.business_date, start, end));
  const previousCampaigns = filteredCampaigns.filter(row => isInRange(row.business_date, previous.start, previous.end));
  const currentLifecycle = lifecycle.filter(row => isInRange(row.business_date, start, end) && matchesCommon({ ...row, quality_status: row.quality_status, campaign: row.campaign }));
  const advancedRawFilterActive = channels.length > 0 || templateMode !== 'all';
  const comparableCampaigns = advancedRawFilterActive ? [] : currentCampaigns;
  const comparablePreviousCampaigns = advancedRawFilterActive ? [] : previousCampaigns;

  const rawInstalls = sumBy(currentAcquisition, r => r.installs);
  const previousRawInstalls = sumBy(previousAcquisition, r => r.installs);
  const clicks = sumBy(comparableCampaigns, r => r.clicks);
  const previousClicks = sumBy(comparablePreviousCampaigns, r => r.clicks);
  const sessions = sumBy(comparableCampaigns, r => r.sessions);
  const previousSessions = sumBy(comparablePreviousCampaigns, r => r.sessions);
  const nonOrganicCampaignInstalls = sumBy(comparableCampaigns.filter(r => r.origin_group !== 'organico'), r => r.installs);
  const conversion = pct(nonOrganicCampaignInstalls, clicks);
  const intensity = ratio(sessions, nonOrganicCampaignInstalls);
  const hasRawData = currentAcquisition.length > 0;
  const hasCampaignData = comparableCampaigns.length > 0;
  const templateInstalls = sumBy(currentAcquisition.filter(r => r.sub_param_3.trim()), r => r.installs);
  const templateCoverage = pct(templateInstalls, rawInstalls);
  const uninstalls = sumBy(currentLifecycle.filter(r => r.metric_type === 'uninstall'), r => r.event_count);
  const reinstalls = sumBy(currentLifecycle.filter(r => r.metric_type === 'reinstall'), r => r.event_count);
  const currencies = [...new Set(comparableCampaigns.filter(r => r.cost != null).map(r => r.currency))];
  const cost = currencies.length === 1 ? sumBy(comparableCampaigns.filter(r => r.currency === currencies[0]), r => r.cost) : null;
  const latestRun = runs[0];
  const unavailableSources = (Object.keys(sourceLabels) as AppsFlyerSourceKey[]).filter(key => sourceStatuses[key].state === 'error');
  const collectionStatus = sourceStatuses.runs.state === 'error'
    ? { label: 'Status da coleta indisponível', tone: 'error' as const }
    : latestRun?.status === 'complete'
      ? { label: 'Coleta saudável', tone: 'success' as const }
      : latestRun?.status === 'partial'
        ? { label: 'Coleta parcial', tone: 'warning' as const }
        : latestRun?.status === 'failed'
          ? { label: 'Coleta com falha', tone: 'error' as const }
          : { label: 'Sem execução disponível', tone: 'neutral' as const };
  const sourceDates = [acquisition[acquisition.length - 1]?.business_date, campaigns[campaigns.length - 1]?.business_date].filter((value): value is string => Boolean(value)).sort();
  const latestDate = sourceDates[sourceDates.length - 1];
  const aggregateOnlyCount = currentCampaigns.filter(r => r.metric_status?.installs === 'confirmed_aggregate_ltv_cohort').length;
  const reconciledCount = currentCampaigns.filter(r => r.metric_status?.installs === 'confirmed_via_raw_reconciled').length;

  const chartData = useMemo(() => {
    const map = new Map<string, { key: string; installs: number; clicks: number; sessions: number }>();
    for (const row of currentAcquisition) {
      const key = periodKey(row.business_date, granularity);
      const point = map.get(key) ?? { key, installs: 0, clicks: 0, sessions: 0 };
      point.installs += row.installs;
      map.set(key, point);
    }
    if (!advancedRawFilterActive) for (const row of comparableCampaigns) {
      const key = periodKey(row.business_date, granularity);
      const point = map.get(key) ?? { key, installs: 0, clicks: 0, sessions: 0 };
      point.clicks += n(row.clicks);
      point.sessions += n(row.sessions);
      map.set(key, point);
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map(point => ({ ...point, period: periodLabel(point.key, granularity) }));
  }, [currentAcquisition, comparableCampaigns, granularity, advancedRawFilterActive]);

  const acquisitionBreakdown = useMemo(() => {
    const map = new Map<string, { source: string; channel: string; campaign: string; origin: AppsFlyerOrigin; installs: number; templates: number; quality: AppsFlyerQuality }>();
    for (const row of currentAcquisition) {
      const key = `${row.media_source_canonical}|${row.af_channel}|${row.campaign}|${row.origin_group}`;
      const item = map.get(key) ?? { source: row.media_source_canonical || row.media_source, channel: row.af_channel || '—', campaign: row.campaign || '—', origin: row.origin_group, installs: 0, templates: 0, quality: row.quality_status };
      item.installs += row.installs;
      if (row.sub_param_3.trim()) item.templates += row.installs;
      map.set(key, item);
    }
    return [...map.values()].sort((a, b) => b.installs - a.installs);
  }, [currentAcquisition]);

  const campaignBreakdown = useMemo(() => {
    const map = new Map<string, { source: string; campaign: string; origin: AppsFlyerOrigin; clicks: number; installs: number; sessions: number; cost: number; currency: string; statuses: Set<string> }>();
    for (const row of comparableCampaigns) {
      const key = `${row.media_source_canonical}|${row.campaign}|${row.origin_group}|${row.currency}`;
      const item = map.get(key) ?? { source: row.media_source_canonical || row.media_source, campaign: row.campaign || '(sem campanha)', origin: row.origin_group, clicks: 0, installs: 0, sessions: 0, cost: 0, currency: row.currency, statuses: new Set<string>() };
      item.clicks += n(row.clicks); item.installs += n(row.installs); item.sessions += n(row.sessions); item.cost += n(row.cost);
      item.statuses.add(row.metric_status?.installs ?? 'not_available');
      map.set(key, item);
    }
    const rows = [...map.values()].map(item => ({ ...item, conversion: pct(item.installs, item.clicks), intensity: ratio(item.sessions, item.installs), status: item.statuses.has('confirmed_aggregate_ltv_cohort') ? 'confirmed_aggregate_ltv_cohort' : [...item.statuses][0] }));
    const value = (row: typeof rows[number]) => sort.key === 'campaign' ? row.campaign : n(row[sort.key]);
    return rows.sort((a, b) => {
      const av = value(a); const bv = value(b);
      const result = typeof av === 'string' ? av.localeCompare(String(bv)) : av - Number(bv);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [comparableCampaigns, sort]);

  const catalogById = useMemo(() => {
    const map = new Map<string, typeof templateCatalog[number]>();
    for (const template of templateCatalog) {
      map.set(clean(template.template_id), template);
      const planilha = template.metadata?.template_id_planilha;
      if (typeof planilha === 'string') map.set(clean(planilha), template);
    }
    return map;
  }, [templateCatalog]);

  const templatePerformance = useMemo(() => {
    const map = new Map<string, { id: string; installs: number; days: Set<string>; quality: AppsFlyerQuality; status: AppsFlyerMetricStatus }>();
    for (const row of templates.filter(r => isInRange(r.business_date, start, end))) {
      const item = map.get(row.template_id) ?? { id: row.template_id, installs: 0, days: new Set<string>(), quality: row.quality_status, status: row.metric_status };
      item.installs += row.af_installs; item.days.add(row.business_date); map.set(row.template_id, item);
    }
    return [...map.values()].map(item => ({ ...item, catalog: catalogById.get(clean(item.id)) })).sort((a, b) => b.installs - a.installs);
  }, [templates, catalogById, start, end]);

  const setSortKey = (key: SortKey) => setSort(current => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' });
  const clearFilters = () => { setPlatforms([]); setSources([]); setChannels([]); setOrigins([]); setQualities([]); setCampaignSearch(''); setTemplateMode('all'); };

  const exportCampaigns = () => {
    const header = ['Origem', 'Media source', 'Campanha', 'Cliques', 'Installs', 'Status install', 'Conversao clique-install', 'Sessoes', 'Sessoes por install', 'Custo', 'Moeda'];
    const lines = campaignBreakdown.map(row => [originMeta[row.origin].label, row.source, row.campaign, row.clicks, row.installs, row.status, row.conversion ?? '', row.sessions, row.intensity ?? '', row.cost || '', row.currency]);
    const csv = [header, ...lines].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `appsflyer-campanhas-${start}-${end}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-[520px] animate-pulse bg-slate-50 p-6"><div className="mx-auto max-w-[1780px] space-y-4"><div className="h-36 bg-slate-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-slate-200" />)}</div><div className="h-80 bg-slate-200" /></div></div>;

  return <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
    <div className="mx-auto max-w-[1780px] space-y-4">
      <OnboardingFunnelWorkspace navigation={navigation} sidebarMeta={<>
        <div className={`border p-3 text-xs ${collectionStatus.tone === 'success' ? 'border-emerald-300/40 bg-emerald-50 text-emerald-900' : collectionStatus.tone === 'error' ? 'border-red-300/40 bg-red-50 text-red-950' : 'border-amber-300/40 bg-amber-50 text-amber-950'}`}>
          <p className="flex items-center gap-2 font-bold">{collectionStatus.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {collectionStatus.label}</p>
          <p className="mt-1 text-[10px]">Última execução: {latestRun?.completed_at ? new Date(latestRun.completed_at).toLocaleString('pt-BR') : '—'}</p>
          {unavailableSources.length > 0 && <p className="mt-1 text-[10px]">Indisponível: {unavailableSources.map(key => sourceLabels[key]).join(', ')}</p>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
          <div><span className="text-white/55">Dado até</span><p className="font-semibold text-white">{latestDate ? format(new Date(`${latestDate}T12:00:00`), 'dd/MM/yyyy') : '—'}</p></div>
          <div><span className="text-white/55">Campanhas</span><p className="font-semibold text-white">{campaignBreakdown.length}</p></div>
          <div><span className="text-white/55">Raw reconciliado</span><p className="font-semibold text-white">{reconciledCount} linhas</p></div>
          <div><span className="text-white/55">Só agregado</span><p className="font-semibold text-white">{aggregateOnlyCount} linhas</p></div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[10px] text-amber-200"><Info size={13} className="mt-0.5 shrink-0" /> Clique mede tráfego atribuído. Install raw é a fonte oficial. Sessões medem intensidade da coorte, não usuários únicos.</p>
      </>}>
        <section className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Aquisição e engajamento · AppsFlyer</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={15} />{period}</p></div>
            <button onClick={() => void refetch()} className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold"><RefreshCw size={13} />Atualizar</button>
          </div>
          {unavailableSources.length > 0 && <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><span className="font-semibold">Dados parciais.</span> As fontes disponíveis continuam visíveis. Consulte “Saúde do pipeline” para ver o que não pôde ser carregado.</div>}
        </section>

        {(acquisition.length > 0 || campaigns.length > 0) && <section className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-600"><Filter size={13} />Filtros</p><button onClick={clearFilters} className="text-[10px] font-semibold text-cyan-700">Limpar todos</button></div>
          <div className="flex flex-wrap gap-2">
            <MultiFilter label="Plataforma" options={options.platforms} selected={platforms} onChange={setPlatforms} />
            <MultiFilter label="Media source" options={options.sources} selected={sources} onChange={setSources} />
            <MultiFilter label="Canal raw" options={options.channels} selected={channels} onChange={setChannels} />
            <MultiFilter label="Origem" options={Object.keys(originMeta)} selected={origins} onChange={next => setOrigins(next as AppsFlyerOrigin[])} />
            <MultiFilter label="Qualidade" options={Object.keys(qualityLabel)} selected={qualities} onChange={next => setQualities(next as AppsFlyerQuality[])} />
            <label className="flex min-w-[220px] items-center gap-2 border border-slate-300 bg-white px-2.5 py-2 text-[11px]"><Search size={13} /><input value={campaignSearch} onChange={e => setCampaignSearch(e.target.value)} placeholder="Buscar campanha" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
            <select value={templateMode} onChange={e => setTemplateMode(e.target.value as typeof templateMode)} className="border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-semibold"><option value="all">Todos os links</option><option value="with">Só com template</option><option value="without">Sem template</option></select>
          </div>
          {advancedRawFilterActive && <p className="mt-2 flex items-center gap-2 text-[10px] text-amber-800"><AlertTriangle size={12} />Canal e presença de template existem apenas no raw. Cliques/sessões agregados ficam ocultos no gráfico enquanto esses filtros estiverem ativos.</p>}
        </section>}

        {(hasRawData || hasCampaignData) && <section className="px-4 py-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {hasRawData && <MetricCard label="Installs oficiais" value={numberLabel(rawInstalls)} previous={{ current: rawInstalls, previous: previousRawInstalls }} icon={Smartphone} status="confirmed" note="Raw fino; respeita canal, campanha e template." />}
            {hasCampaignData && <MetricCard label="Cliques atribuídos" value={numberLabel(clicks)} previous={{ current: clicks, previous: previousClicks }} icon={MousePointerClick} status="confirmed_aggregate_ltv_cohort" note={advancedRawFilterActive ? 'Recorte de canal/template não existe no agregado.' : 'Agregado por coorte de instalação; não é clique total do CRM.'} />}
            {hasCampaignData && <MetricCard label="Conversão clique → install" value={pctLabel(conversion)} icon={Gauge} status="confirmed_aggregate_ltv_cohort" note={advancedRawFilterActive ? 'Recorte de canal/template não existe no agregado.' : 'Usa apenas installs não orgânicos do agregado da mesma campanha/coorte.'} />}
            {hasCampaignData && <MetricCard label="Sessões" value={numberLabel(sessions)} previous={{ current: sessions, previous: previousSessions }} icon={Activity} status="confirmed_aggregate_ltv_cohort" note={advancedRawFilterActive ? 'Recorte de canal/template não existe no agregado.' : `Intensidade: ${ratioLabel(intensity)} sessões por install não orgânico agregado.`} />}
            {hasCampaignData && <MetricCard label="Custo" value={currencies.length > 1 ? 'múltiplas moedas' : moneyLabel(cost, currencies[0] || 'USD')} icon={ShieldCheck} status="confirmed_aggregate_ltv_cohort" note={advancedRawFilterActive ? 'Recorte de canal/template não existe no agregado.' : 'Moeda preservada da fonte; nunca convertida silenciosamente.'} />}
            {hasRawData && <MetricCard label="Cobertura de template" value={pctLabel(templateCoverage, 2)} icon={UsersRound} status="confirmed" note={`${numberLabel(templateInstalls)} de ${numberLabel(rawInstalls)} installs raw com af_sub3.`} />}
          </div>
        </section>}

        {chartData.length > 0 && <section className="border-t border-slate-200 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Evolução da aquisição</h2><p className="text-xs text-slate-500">Barras = installs raw · linhas tracejadas = cliques e sessões agregados/cohort.</p></div><div className="inline-flex border border-slate-300 bg-white text-[10px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(value => <button key={value} onClick={() => setGranularity(value)} className={`border-r border-slate-300 px-3 py-1.5 last:border-r-0 ${granularity === value ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>{value === 'daily' ? 'Diária' : value === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div></div>
          <div className="mt-3 h-[330px]">
            <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 10, right: 42, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" tick={{ fontSize: 10, fill: '#475569' }} /><YAxis yAxisId="volume" tickFormatter={compact} tick={{ fontSize: 10, fill: '#475569' }} /><YAxis yAxisId="activity" orientation="right" tickFormatter={compact} tick={{ fontSize: 10, fill: '#475569' }} />
              <Tooltip contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 0, fontSize: 11 }} formatter={(value: number, name: string) => [numberLabel(value), name === 'installs' ? 'Installs raw' : name === 'clicks' ? 'Cliques · cohort' : 'Sessões · cohort']} />
              <Bar yAxisId="volume" dataKey="installs" fill="#0f766e" maxBarSize={30} isAnimationActive={false} />
              {!advancedRawFilterActive && <Line yAxisId="activity" type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2, fill: '#fff' }} isAnimationActive={false} />}
              {!advancedRawFilterActive && <Line yAxisId="activity" type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={2} strokeDasharray="2 4" dot={{ r: 2, fill: '#fff' }} isAnimationActive={false} />}
            </ComposedChart></ResponsiveContainer>
          </div>
        </section>}
      </OnboardingFunnelWorkspace>

      {acquisitionBreakdown.length > 0 && <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="text-lg font-semibold text-slate-950">Aquisição raw · media source × canal × campanha</h2><p className="text-xs text-slate-500">Fonte oficial de installs no grão fino; presença de template é medida por volume.</p></div><span className="text-[10px] text-slate-500">{acquisitionBreakdown.length} combinações</span></div>
        <div className="max-h-[430px] overflow-auto"><table className="w-full min-w-[920px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Media source</th><th className="px-3 py-2 text-left">Canal</th><th className="px-3 py-2 text-left">Campanha</th><th className="px-3 py-2 text-left">Origem</th><th className="px-3 py-2 text-right">Installs raw</th><th className="px-3 py-2 text-right">Com template</th><th className="px-3 py-2 text-left">Qualidade</th></tr></thead><tbody>
          {acquisitionBreakdown.map((row, index) => <tr key={`${row.source}-${row.channel}-${row.campaign}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2 font-mono font-semibold">{row.source}</td><td className="px-3 py-2">{row.channel}</td><td className="max-w-[360px] truncate px-3 py-2" title={row.campaign}>{row.campaign}</td><td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ backgroundColor: originMeta[row.origin].color }} />{originMeta[row.origin].label}</span></td><td className="px-3 py-2 text-right font-mono font-semibold">{numberLabel(row.installs)}</td><td className="px-3 py-2 text-right font-mono">{pctLabel(pct(row.templates, row.installs), 2)}</td><td className="px-3 py-2"><QualityPill quality={row.quality} /></td></tr>)}
          {!acquisitionBreakdown.length && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum install raw no período e filtros selecionados.</td></tr>}
        </tbody></table></div>
      </section>}

      {campaignBreakdown.length > 0 && <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="text-lg font-semibold text-slate-950">Conversão e intensidade por campanha</h2><p className="text-xs text-slate-500">Clique → install é conversão. Sessões por install é intensidade de engajamento e pode superar 1.</p></div><button onClick={exportCampaigns} className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-[11px] font-semibold"><Download size={13} />Exportar CSV</button></div>
        <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[1180px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr>
          <th className="px-3 py-2 text-left">Origem</th><th className="px-3 py-2 text-left">Media source</th><th onClick={() => setSortKey('campaign')} className="cursor-pointer px-3 py-2 text-left">Campanha</th><th onClick={() => setSortKey('clicks')} className="cursor-pointer px-3 py-2 text-right">Cliques</th><th onClick={() => setSortKey('installs')} className="cursor-pointer px-3 py-2 text-right">Installs</th><th className="px-3 py-2 text-left">Status install</th><th onClick={() => setSortKey('conversion')} className="cursor-pointer px-3 py-2 text-right">Clique → install</th><th onClick={() => setSortKey('sessions')} className="cursor-pointer px-3 py-2 text-right">Sessões</th><th onClick={() => setSortKey('intensity')} className="cursor-pointer px-3 py-2 text-right">Sessões/install</th><th onClick={() => setSortKey('cost')} className="cursor-pointer px-3 py-2 text-right">Custo</th>
        </tr></thead><tbody>
          {campaignBreakdown.map((row, index) => <tr key={`${row.source}-${row.campaign}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ backgroundColor: originMeta[row.origin].color }} />{originMeta[row.origin].label}</span></td><td className="px-3 py-2 font-mono">{row.source}</td><td className="max-w-[360px] truncate px-3 py-2 font-semibold" title={row.campaign}>{row.campaign}</td><td className="px-3 py-2 text-right font-mono">{row.clicks ? numberLabel(row.clicks) : '—'}</td><td className="px-3 py-2 text-right font-mono font-semibold">{numberLabel(row.installs)}</td><td className="px-3 py-2"><StatusBadge status={row.status} title="O badge define se o install já foi reconciliado contra o raw ou permanece somente agregado/cohort." /></td><td className="px-3 py-2 text-right font-mono text-cyan-700">{pctLabel(row.conversion)}</td><td className="px-3 py-2 text-right font-mono">{row.sessions ? numberLabel(row.sessions) : '—'}</td><td className="px-3 py-2 text-right font-mono text-violet-700">{ratioLabel(row.intensity)}</td><td className="px-3 py-2 text-right font-mono">{row.cost ? moneyLabel(row.cost, row.currency) : '—'}</td></tr>)}
          {!campaignBreakdown.length && <tr><td colSpan={10} className="p-8 text-center text-slate-500">Nenhuma campanha agregada no período e filtros selecionados.</td></tr>}
        </tbody></table></div>
      </section>}

      <div className="grid gap-4 xl:grid-cols-2">
        {currentLifecycle.length > 0 && <section className="border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Lifecycle</h2><p className="text-xs text-slate-500">Uninstalls e reinstalls no mesmo recorte.</p></div><Unplug className="text-slate-400" size={20} /></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><MetricCard label="Uninstalls" value={numberLabel(uninstalls)} icon={Unplug} status="confirmed" note="Evento raw de lifecycle." /><MetricCard label="Reinstalls" value={numberLabel(reinstalls)} icon={RefreshCw} status="confirmed" note="Somente quando disponível no plano." />{hasRawData && <MetricCard label="Movimento líquido" value={numberLabel(rawInstalls - uninstalls)} icon={Gauge} status="confirmed" note="Installs − uninstalls; não é churn." />}</div>
        </section>}

        <section className="border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Saúde do pipeline</h2><p className="text-xs text-slate-500">Coletas recentes, frescor, cobertura e erros por relatório.</p></div><ShieldCheck className="text-slate-400" size={20} /></div>
          <div className="mt-3"><SourceStatusList statuses={sourceStatuses} /></div>
          {runs.length > 0 && <div className="mt-3 max-h-[300px] overflow-auto"><table className="w-full text-[10px]"><thead className="bg-slate-100"><tr><th className="px-2 py-2 text-left">Execução</th><th className="px-2 py-2 text-left">Status</th><th className="px-2 py-2 text-right">Raw rows</th><th className="px-2 py-2 text-right">Campanhas</th><th className="px-2 py-2 text-right">Templates %</th><th className="px-2 py-2 text-left">Erros</th></tr></thead><tbody>{runs.map(run => {
            const summary = run.quality_summary ?? {}; const errors = summary.report_errors && typeof summary.report_errors === 'object' ? Object.keys(summary.report_errors as Record<string, unknown>) : [];
            return <tr key={run.id} className="border-t border-slate-100"><td className="px-2 py-2 whitespace-nowrap">{new Date(run.started_at).toLocaleString('pt-BR')}</td><td className="px-2 py-2"><span className={`font-semibold ${run.status === 'complete' ? 'text-emerald-700' : run.status === 'failed' ? 'text-red-700' : 'text-amber-700'}`}>{run.status}</span></td><td className="px-2 py-2 text-right font-mono">{numberLabel(run.row_count)}</td><td className="px-2 py-2 text-right font-mono">{numberLabel(typeof summary.campaign_rows_written === 'number' ? summary.campaign_rows_written : null)}</td><td className="px-2 py-2 text-right font-mono">{typeof summary.sub_param_3_coverage_pct === 'number' ? pctLabel(summary.sub_param_3_coverage_pct) : '—'}</td><td className="max-w-[220px] truncate px-2 py-2 text-red-700" title={errors.join(', ')}>{errors.length ? errors.join(', ') : '—'}</td></tr>;
          })}</tbody></table></div>}
        </section>
      </div>

      {templatePerformance.length > 0 && <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4"><div><h2 className="text-lg font-semibold text-slate-950">Performance por template</h2><p className="text-xs text-slate-500">Installs confirmados via af_sub3; cliques e sessões por template não existem no raw atual.</p></div><TableProperties size={20} className="text-slate-400" /></div>
        <div className="max-h-[440px] overflow-auto"><table className="w-full min-w-[900px] text-[10px]"><thead className="sticky top-0 bg-slate-100"><tr><th className="px-3 py-2 text-left">Template ID</th><th className="px-3 py-2 text-left">Título / catálogo</th><th className="px-3 py-2 text-left">Canal</th><th className="px-3 py-2 text-right">Dias</th><th className="px-3 py-2 text-right">Installs</th><th className="px-3 py-2 text-right">Cliques</th><th className="px-3 py-2 text-right">Sessões</th><th className="px-3 py-2 text-left">Qualidade</th></tr></thead><tbody>
          {templatePerformance.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="px-3 py-2 font-mono font-semibold">{row.id}</td><td className="px-3 py-2">{row.catalog?.title || 'Não reconciliado no catálogo'}</td><td className="px-3 py-2">{row.catalog?.channel || '—'}</td><td className="px-3 py-2 text-right font-mono">{row.days.size}</td><td className="px-3 py-2 text-right font-mono font-semibold">{numberLabel(row.installs)}</td><td className="px-3 py-2 text-right"><span title="Pull API não fornece clique no grão de template">—</span></td><td className="px-3 py-2 text-right"><span title="Sessão existe apenas no agregado sem af_sub3">—</span></td><td className="px-3 py-2"><QualityPill quality={row.quality} /></td></tr>)}
          {!templatePerformance.length && <tr><td colSpan={8} className="p-8 text-center text-slate-500">Nenhum template AppsFlyer no período selecionado.</td></tr>}
        </tbody></table></div>
      </section>}
    </div>
  </div>;
};
