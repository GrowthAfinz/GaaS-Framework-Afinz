import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Database,
  Download,
  Info,
  MousePointerClick,
  Search,
  SlidersHorizontal,
  Smartphone,
  X,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';
import { OnboardingFunnelWorkspace } from './OnboardingFunnelWorkspace';

type Granularity = 'daily' | 'weekly' | 'monthly';
type OriginKey = 'organico' | 'pago' | 'crm' | 'parceiro';
type MetricKey = 'installs' | 'clicks' | 'sessions';
type DimensionKey = 'origin' | 'source' | 'channel' | 'platform' | 'campaign' | 'geo' | 'segment';
type SortKey = 'label' | MetricKey | 'clickToInstall' | 'sessionsPerInstall' | 'installDelta';
type SourceMode = 'supabase' | 'snapshot';

type Row = {
  date: Date;
  sourceRaw: string;
  source: string;
  origin: OriginKey;
  channel: string | null;
  platform: string | null;
  campaign: string | null;
  geo: string | null;
  segment: string | null;
  installs: number;
  sessions: number;
  clicks: number;
  qualityStatus: string;
};

type DbRow = {
  business_date: string;
  media_source: string;
  media_source_canonical: string;
  origin_group: OriginKey;
  channel: string | null;
  platform: string | null;
  campaign: string | null;
  geo: string | null;
  sub_param_1: string | null;
  installs: number | string | null;
  sessions: number | string | null;
  clicks: number | string | null;
  quality_status: string;
};

type Totals = { installs: number; sessions: number; clicks: number };

type AggregateRow = Totals & {
  key: string;
  label: string;
  previous: Totals;
  rawSources: string[];
  clickToInstall: number | null;
  sessionsPerInstall: number | null;
  installDelta: number | null;
};

const originConfig: Array<{ key: OriginKey; label: string; color: string; help: string }> = [
  { key: 'organico', label: 'Orgânico', color: '#0d9488', help: 'Sem atribuição a uma fonte de mídia.' },
  { key: 'pago', label: 'Pago', color: '#2563eb', help: 'Meta e Google Ads.' },
  { key: 'crm', label: 'CRM', color: '#7c3aed', help: 'WhatsApp, SMS, CRM, cross-sell e conteúdo próprio.' },
  { key: 'parceiro', label: 'Parceiro', color: '#db2777', help: 'Serasa, Acordo Certo e demais parceiros.' },
];

const metricConfig: Record<MetricKey, { label: string; color: string }> = {
  installs: { label: 'Installs', color: '#0f766e' },
  clicks: { label: 'Cliques rastreados', color: '#0891b2' },
  sessions: { label: 'Sessões', color: '#7c3aed' },
};

const dimensionLabels: Record<DimensionKey, string> = {
  origin: 'Origem',
  source: 'Media source',
  channel: 'Canal',
  platform: 'Plataforma',
  campaign: 'Campanha',
  geo: 'Geografia',
  segment: 'Segmento (af_sub1)',
};

const sourceLabels: Record<string, string> = {
  organic: 'Organic',
  facebook_ads: 'Facebook Ads',
  google_ads: 'Google Ads',
  crm: 'CRM',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  cross_sale: 'Cross-sell',
  blog: 'Blog',
  acordo_certo: 'Acordo Certo',
  serasa: 'Serasa',
  espaco_laser: 'Espaço Laser',
  hirota: 'Hirota',
  outros: 'Outros',
};

const channelLabels: Record<string, string> = {
  organic: 'Orgânico',
  meta: 'Meta',
  google_ads: 'Google Ads',
  crm: 'CRM',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  cross_sell: 'Cross-sell',
  owned_content: 'Conteúdo próprio',
  partner: 'Parceiros',
};

const platformLabels: Record<string, string> = {
  android_ios_aggregated: 'Android + iOS (agregado)',
  ANDROID: 'Android',
  IOS: 'iOS',
};

const formatNumber = (value: number) => Math.round(value).toLocaleString('pt-BR');
const compact = (value: number) => value >= 1_000
  ? `${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  : String(Math.round(value));
const percentage = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator * 100 : null;
const pctLabel = (value: number | null, digits = 1) => value == null ? '—' : `${value.toFixed(digits).replace('.', ',')}%`;
const ratioLabel = (value: number | null, digits = 1) => value == null ? '—' : value.toFixed(digits).replace('.', ',');
const delta = (current: number, previous: number) => previous === 0 ? null : (current - previous) / previous * 100;
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
const shortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const shortWeekday = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const emptyTotals = (): Totals => ({ installs: 0, sessions: 0, clicks: 0 });
const sum = (rows: Row[]): Totals => rows.reduce((total, row) => ({
  installs: total.installs + row.installs,
  sessions: total.sessions + row.sessions,
  clicks: total.clicks + row.clicks,
}), emptyTotals());
const unique = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

function fallbackSourceMapping(sourceRaw: string) {
  const source = sourceRaw.toLowerCase();
  if (source === 'organic') return { source: 'organic', origin: 'organico' as OriginKey, channel: 'organic' };
  if (source === 'facebook ads') return { source: 'facebook_ads', origin: 'pago' as OriginKey, channel: 'meta' };
  if (source === 'googleadwords_int') return { source: 'google_ads', origin: 'pago' as OriginKey, channel: 'google_ads' };
  if (source === 'crm') return { source: 'crm', origin: 'crm' as OriginKey, channel: 'crm' };
  if (source === 'whatsapp') return { source: 'whatsapp', origin: 'crm' as OriginKey, channel: 'whatsapp' };
  if (source === 'sms') return { source: 'sms', origin: 'crm' as OriginKey, channel: 'sms' };
  if (source === 'cross_sale') return { source: 'cross_sale', origin: 'crm' as OriginKey, channel: 'cross_sell' };
  if (source === 'blog') return { source: 'blog', origin: 'crm' as OriginKey, channel: 'owned_content' };
  return { source: source.replace(/\s+/g, '_'), origin: 'parceiro' as OriginKey, channel: 'partner' };
}

function parseCsv(text: string): Row[] {
  return text.split(/\r?\n/)
    .slice(1)
    .map(line => line.split(','))
    .filter(columns => /^\d{4}-\d{2}-\d{2}$/.test(columns[0] || ''))
    .map(columns => {
      const mapping = fallbackSourceMapping(columns[1]);
      return {
        date: parseDate(columns[0]),
        sourceRaw: columns[1],
        source: mapping.source,
        origin: mapping.origin,
        channel: mapping.channel,
        platform: 'android_ios_aggregated',
        campaign: null,
        geo: null,
        segment: null,
        installs: Number(columns[2]) || 0,
        sessions: Number(columns[3]) || 0,
        clicks: Number(columns[4]) || 0,
        qualityStatus: 'complete',
      };
    });
}

function normalizeDbRow(row: DbRow): Row {
  return {
    date: parseDate(row.business_date),
    sourceRaw: row.media_source,
    source: row.media_source_canonical,
    origin: row.origin_group,
    channel: row.channel,
    platform: row.platform,
    campaign: row.campaign,
    geo: row.geo,
    segment: row.sub_param_1,
    installs: Number(row.installs) || 0,
    sessions: Number(row.sessions) || 0,
    clicks: Number(row.clicks) || 0,
    qualityStatus: row.quality_status,
  };
}

function periodKey(date: Date, granularity: Granularity) {
  if (granularity === 'daily') return iso(date);
  if (granularity === 'monthly') return iso(date).slice(0, 7);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return iso(monday);
}

function dimensionValue(row: Row, dimension: DimensionKey) {
  if (dimension === 'origin') return row.origin;
  if (dimension === 'source') return row.source;
  if (dimension === 'channel') return row.channel;
  if (dimension === 'platform') return row.platform;
  if (dimension === 'campaign') return row.campaign;
  if (dimension === 'geo') return row.geo;
  return row.segment;
}

function dimensionLabel(value: string, dimension: DimensionKey) {
  if (dimension === 'origin') return originConfig.find(item => item.key === value)?.label ?? value;
  if (dimension === 'source') return sourceLabels[value] ?? value;
  if (dimension === 'channel') return channelLabels[value] ?? value;
  if (dimension === 'platform') return platformLabels[value] ?? value;
  return value;
}

const DeltaBadge = ({ change, unit = '%' }: { change: number | null; unit?: string }) => {
  if (change == null) return <span className="text-[9px] font-semibold text-slate-400">sem base</span>;
  const up = change > 0;
  const down = change < 0;
  return (
    <span className={`flex items-center text-[9px] font-semibold ${up ? 'text-emerald-700' : down ? 'text-red-700' : 'text-slate-400'}`}>
      {up ? <ArrowUp size={10} /> : down ? <ArrowDown size={10} /> : <ArrowRight size={10} />}
      {Math.abs(change).toFixed(1).replace('.', ',')}{unit} vs. anterior
    </span>
  );
};

const SelectFilter = ({
  label,
  value,
  options,
  onChange,
  disabledMessage,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabledMessage?: string;
}) => (
  <label className="min-w-[150px] text-[10px] font-semibold text-slate-500">
    <span className="mb-1 block uppercase tracking-[0.08em]">{label}</span>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={options.length === 0}
      title={options.length === 0 ? disabledMessage : undefined}
      className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none focus:border-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <option value="all">{options.length === 0 ? 'Sem cobertura' : 'Todos'}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

export const AppsFlyerFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => {
  const { startDate, endDate } = usePeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>('snapshot');
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selectedOrigins, setSelectedOrigins] = useState<OriginKey[]>(originConfig.map(item => item.key));
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedGeo, setSelectedGeo] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<DimensionKey>('source');
  const [visibleMetrics, setVisibleMetrics] = useState<MetricKey[]>(['installs', 'clicks']);
  const [sortKey, setSortKey] = useState<SortKey>('installs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [dailyResult, runResult] = await Promise.all([
        supabase
          .from('appsflyer_acquisition_daily')
          .select('business_date, media_source, media_source_canonical, origin_group, channel, platform, campaign, geo, sub_param_1, installs, sessions, clicks, quality_status')
          .gte('business_date', '2026-01-01')
          .order('business_date'),
        supabase
          .from('appsflyer_collection_runs')
          .select('completed_at, max_business_date')
          .eq('status', 'complete')
          .order('completed_at', { ascending: false })
          .limit(1),
      ]);

      if (!active) return;
      if (!dailyResult.error && dailyResult.data?.length) {
        setRows((dailyResult.data as DbRow[]).map(normalizeDbRow));
        setSourceMode('supabase');
        const run = runResult.data?.[0] as { completed_at?: string; max_business_date?: string } | undefined;
        setSourceUpdatedAt(run?.completed_at ?? run?.max_business_date ?? null);
        setError('');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/appsflyer-acquisition-daily.csv`);
        if (!response.ok) throw new Error('Snapshot AppsFlyer indisponível');
        const snapshotRows = parseCsv(await response.text());
        if (!active) return;
        setRows(snapshotRows);
        setSourceMode('snapshot');
        setSourceUpdatedAt(snapshotRows.length ? iso(snapshotRows[snapshotRows.length - 1].date) : null);
        setError(dailyResult.error ? `Supabase indisponível; exibindo snapshot local. ${dailyResult.error.message}` : '');
      } catch (snapshotError) {
        if (!active) return;
        setError(snapshotError instanceof Error ? snapshotError.message : 'Não foi possível carregar o AppsFlyer.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const lastDate = useMemo(
    () => rows.reduce<Date | null>((maximum, row) => !maximum || row.date > maximum ? row.date : maximum, null),
    [rows],
  );

  const requestedStart = useMemo(
    () => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
    [startDate],
  );
  const requestedEnd = useMemo(
    () => new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999),
    [endDate],
  );
  const effectiveEnd = useMemo(() => {
    if (!lastDate) return requestedEnd;
    const closedEnd = new Date(lastDate);
    closedEnd.setHours(23, 59, 59, 999);
    return closedEnd < requestedEnd ? closedEnd : requestedEnd;
  }, [lastDate, requestedEnd]);

  const periodRows = useMemo(
    () => rows.filter(row => row.date >= requestedStart && row.date <= effectiveEnd),
    [rows, requestedStart, effectiveEnd],
  );

  const sourceOptions = useMemo(() => unique(periodRows.map(row => row.source)), [periodRows]);
  const channelOptions = useMemo(() => unique(periodRows.map(row => row.channel)), [periodRows]);
  const platformOptions = useMemo(() => unique(periodRows.map(row => row.platform)), [periodRows]);
  const campaignOptions = useMemo(() => unique(periodRows.map(row => row.campaign)), [periodRows]);
  const geoOptions = useMemo(() => unique(periodRows.map(row => row.geo)), [periodRows]);
  const segmentOptions = useMemo(() => unique(periodRows.map(row => row.segment)), [periodRows]);

  const applyFilters = (input: Row[]) => input.filter(row => {
    if (!selectedOrigins.includes(row.origin)) return false;
    if (selectedSource !== 'all' && row.source !== selectedSource) return false;
    if (selectedChannel !== 'all' && row.channel !== selectedChannel) return false;
    if (selectedPlatform !== 'all' && row.platform !== selectedPlatform) return false;
    if (selectedCampaign !== 'all' && row.campaign !== selectedCampaign) return false;
    if (selectedGeo !== 'all' && row.geo !== selectedGeo) return false;
    if (selectedSegment !== 'all' && row.segment !== selectedSegment) return false;
    if (search.trim()) {
      const haystack = [row.sourceRaw, row.source, row.channel, row.platform, row.campaign, row.geo, row.segment]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      if (!haystack.includes(search.trim().toLocaleLowerCase('pt-BR'))) return false;
    }
    return true;
  });

  const current = useMemo(() => applyFilters(periodRows), [
    periodRows,
    selectedOrigins,
    selectedSource,
    selectedChannel,
    selectedPlatform,
    selectedCampaign,
    selectedGeo,
    selectedSegment,
    search,
  ]);

  const previous = useMemo(() => {
    if (effectiveEnd < requestedStart) return [];
    const duration = Math.max(1, Math.round((effectiveEnd.getTime() - requestedStart.getTime()) / 86_400_000) + 1);
    const previousEnd = new Date(requestedStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - duration + 1);
    previousStart.setHours(0, 0, 0, 0);
    return applyFilters(rows.filter(row => row.date >= previousStart && row.date <= previousEnd));
  }, [
    rows,
    requestedStart,
    effectiveEnd,
    selectedOrigins,
    selectedSource,
    selectedChannel,
    selectedPlatform,
    selectedCampaign,
    selectedGeo,
    selectedSegment,
    search,
  ]);

  const total = useMemo(() => sum(current), [current]);
  const previousTotal = useMemo(() => sum(previous), [previous]);
  const nonOrganic = useMemo(() => sum(current.filter(row => row.origin !== 'organico')).installs, [current]);
  const previousNonOrganic = useMemo(() => sum(previous.filter(row => row.origin !== 'organico')).installs, [previous]);
  const clickToInstall = percentage(nonOrganic, total.clicks);
  const previousClickToInstall = percentage(previousNonOrganic, previousTotal.clicks);
  const sessionsPerInstall = total.installs > 0 ? total.sessions / total.installs : null;
  const previousSessionsPerInstall = previousTotal.installs > 0 ? previousTotal.sessions / previousTotal.installs : null;
  const nonOrganicShare = percentage(nonOrganic, total.installs);

  const periodLabel = effectiveEnd >= requestedStart
    ? `${requestedStart.toLocaleDateString('pt-BR')} – ${effectiveEnd.toLocaleDateString('pt-BR')}`
    : `${startDate.toLocaleDateString('pt-BR')} – sem dados fechados`;

  const byOrigin = useMemo(() => originConfig.map(origin => {
    const values = sum(current.filter(row => row.origin === origin.key));
    return { ...origin, ...values, share: percentage(values.installs, total.installs) };
  }), [current, total.installs]);

  const availableDimensions = useMemo<Record<DimensionKey, boolean>>(() => ({
    origin: true,
    source: sourceOptions.length > 0,
    channel: channelOptions.length > 0,
    platform: platformOptions.length > 0,
    campaign: campaignOptions.length > 0,
    geo: geoOptions.length > 0,
    segment: segmentOptions.length > 0,
  }), [sourceOptions, channelOptions, platformOptions, campaignOptions, geoOptions, segmentOptions]);

  const groupedRows = useMemo(() => {
    const aggregate = (input: Row[]) => {
      const map = new Map<string, Totals & { rawSources: Set<string> }>();
      input.forEach(row => {
        const key = dimensionValue(row, groupBy);
        if (!key) return;
        const existing = map.get(key) ?? { ...emptyTotals(), rawSources: new Set<string>() };
        existing.installs += row.installs;
        existing.sessions += row.sessions;
        existing.clicks += row.clicks;
        existing.rawSources.add(row.sourceRaw);
        map.set(key, existing);
      });
      return map;
    };
    const currentMap = aggregate(current);
    const previousMap = aggregate(previous);
    const combined = [...new Set([...currentMap.keys(), ...previousMap.keys()])].map(key => {
      const currentValue = currentMap.get(key) ?? { ...emptyTotals(), rawSources: new Set<string>() };
      const previousValue = previousMap.get(key) ?? { ...emptyTotals(), rawSources: new Set<string>() };
      return {
        key,
        label: dimensionLabel(key, groupBy),
        installs: currentValue.installs,
        sessions: currentValue.sessions,
        clicks: currentValue.clicks,
        previous: previousValue,
        rawSources: [...currentValue.rawSources].sort(),
        clickToInstall: percentage(currentValue.installs, currentValue.clicks),
        sessionsPerInstall: currentValue.installs > 0 ? currentValue.sessions / currentValue.installs : null,
        installDelta: delta(currentValue.installs, previousValue.installs),
      } satisfies AggregateRow;
    });
    return combined.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'label') return a.label.localeCompare(b.label, 'pt-BR') * direction;
      const left = a[sortKey] ?? Number.NEGATIVE_INFINITY;
      const right = b[sortKey] ?? Number.NEGATIVE_INFINITY;
      return (left - right) * direction;
    });
  }, [current, previous, groupBy, sortKey, sortDirection]);

  const chartData = useMemo(() => {
    const groups = new Map<string, Row[]>();
    current.forEach(row => {
      const key = periodKey(row.date, granularity);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });
    const limit = granularity === 'daily' ? 60 : granularity === 'weekly' ? 16 : 12;
    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-limit)
      .map(([key, values]) => {
        const firstDate = [...values].sort((a, b) => a.date.getTime() - b.date.getTime())[0].date;
        const label = granularity === 'daily'
          ? shortDate(firstDate)
          : granularity === 'weekly'
            ? `sem. ${shortDate(firstDate)}`
            : firstDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const installsByOrigin = Object.fromEntries(originConfig.map(origin => [
          origin.key,
          values.filter(row => row.origin === origin.key).reduce((sumValue, row) => sumValue + row.installs, 0),
        ]));
        const totals = sum(values);
        return { key, period: label, weekday: granularity === 'daily' ? shortWeekday(firstDate) : '', ...installsByOrigin, clicks: totals.clicks, sessions: totals.sessions };
      });
  }, [current, granularity]);

  const largestLoss = useMemo(
    () => [...groupedRows]
      .filter(row => row.previous.installs > 0 && row.installDelta != null)
      .sort((left, right) => (left.installDelta ?? 0) - (right.installDelta ?? 0))[0],
    [groupedRows],
  );
  const bestEfficiency = useMemo(
    () => [...groupedRows]
      .filter(row => row.clicks >= 30 && row.clickToInstall != null)
      .sort((left, right) => (right.clickToInstall ?? 0) - (left.clickToInstall ?? 0))[0],
    [groupedRows],
  );
  const volumeLeader = useMemo(
    () => [...groupedRows].sort((left, right) => right.installs - left.installs)[0],
    [groupedRows],
  );

  const quality = useMemo(() => {
    const expectedDays = effectiveEnd >= requestedStart
      ? Math.round((effectiveEnd.getTime() - requestedStart.getTime()) / 86_400_000) + 1
      : 0;
    const presentDays = new Set(current.map(row => iso(row.date))).size;
    const campaignInstalls = current.filter(row => row.campaign).reduce((value, row) => value + row.installs, 0);
    const sourceAliases = new Map<string, Set<string>>();
    current.forEach(row => {
      const aliases = sourceAliases.get(row.source) ?? new Set<string>();
      aliases.add(row.sourceRaw);
      sourceAliases.set(row.source, aliases);
    });
    const aliases = [...sourceAliases.entries()].filter(([, values]) => values.size > 1);
    return {
      expectedDays,
      presentDays,
      dayCoverage: percentage(presentDays, expectedDays),
      campaignCoverage: percentage(campaignInstalls, total.installs),
      aliasCount: aliases.length,
      aliases,
      partialRows: current.filter(row => row.qualityStatus !== 'complete').length,
    };
  }, [current, requestedStart, effectiveEnd, total.installs]);

  const activeFilterCount = [
    selectedOrigins.length !== originConfig.length,
    selectedSource !== 'all',
    selectedChannel !== 'all',
    selectedPlatform !== 'all',
    selectedCampaign !== 'all',
    selectedGeo !== 'all',
    selectedSegment !== 'all',
    Boolean(search.trim()),
  ].filter(Boolean).length;

  const toggleOrigin = (origin: OriginKey) => {
    setSelectedOrigins(currentOrigins => currentOrigins.includes(origin)
      ? currentOrigins.filter(item => item !== origin)
      : [...currentOrigins, origin]);
  };

  const toggleMetric = (metric: MetricKey) => {
    setVisibleMetrics(currentMetrics => currentMetrics.includes(metric)
      ? currentMetrics.filter(item => item !== metric)
      : [...currentMetrics, metric]);
  };

  const resetFilters = () => {
    setSelectedOrigins(originConfig.map(item => item.key));
    setSelectedSource('all');
    setSelectedChannel('all');
    setSelectedPlatform('all');
    setSelectedCampaign('all');
    setSelectedGeo('all');
    setSelectedSegment('all');
    setSearch('');
  };

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'label' ? 'asc' : 'desc');
    }
  };

  const exportCsv = () => {
    const header = [
      dimensionLabels[groupBy],
      'Aliases de origem',
      'Installs',
      'Variação installs',
      'Cliques',
      'Clique→Install',
      'Sessões',
      'Sessões/Install',
    ];
    const body = groupedRows.map(row => [
      row.label,
      row.rawSources.join(' | '),
      row.installs,
      row.installDelta == null ? '' : row.installDelta.toFixed(2),
      row.clicks,
      row.clickToInstall == null ? '' : row.clickToInstall.toFixed(2),
      row.sessions,
      row.sessionsPerInstall == null ? '' : row.sessionsPerInstall.toFixed(2),
    ].join(';'));
    const csv = [header.join(';'), ...body].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `appsflyer-${groupBy}-${iso(requestedStart)}-${iso(effectiveEnd)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const stages = [
    { key: 'clicks' as MetricKey, label: 'Cliques rastreados', icon: MousePointerClick, value: total.clicks, previous: previousTotal.clicks, note: 'Subconjunto de cliques que passou pela atribuição rumo ao app.' },
    { key: 'installs' as MetricKey, label: 'Installs', icon: Smartphone, value: total.installs, previous: previousTotal.installs, note: 'Installs atribuídos e orgânicos no corte selecionado.' },
    { key: 'sessions' as MetricKey, label: 'Sessões', icon: ActivityIcon, value: total.sessions, previous: previousTotal.sessions, note: 'Volume de atividade pós-install; não representa usuários únicos.' },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto max-w-[1780px] space-y-4">
        <OnboardingFunnelWorkspace
          navigation={navigation}
          sidebarMeta={(
            <>
              <div className="grid gap-3 sm:grid-cols-2 min-[1180px]:grid-cols-1">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200/40 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 size={15} />
                  Dados fechados até {lastDate ? lastDate.toLocaleDateString('pt-BR') : '—'}
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-blue-200/50 bg-blue-50 px-3 py-2 text-[10px] leading-relaxed text-blue-950">
                  <Database size={14} className="mt-0.5 shrink-0" />
                  <span><strong>Fonte:</strong> {sourceMode === 'supabase' ? 'Supabase · AppsFlyer agregado' : 'snapshot local de contingência'}.</span>
                </div>
              </div>
              <div className="mt-4 grid gap-x-4 gap-y-3 text-[10px] sm:grid-cols-2 min-[1180px]:grid-cols-1">
                <div><span className="text-white/55">Não-orgânico</span><p className="font-semibold text-white">{pctLabel(nonOrganicShare)} dos installs</p></div>
                <div><span className="text-white/55">Clique → Install</span><p className="font-semibold text-white">{pctLabel(clickToInstall)}</p></div>
                <div><span className="text-white/55">Sessões por install</span><p className="font-semibold text-white">{ratioLabel(sessionsPerInstall)}</p></div>
                <div><span className="text-white/55">Cobertura diária</span><p className="font-semibold text-white">{quality.presentDays}/{quality.expectedDays} dias</p></div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-[10px] text-amber-200">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                Existe apenas `af_content_view` no agregado. Onboarding e cartão continuam bloqueados até a prova do raw data.
              </p>
              {sourceUpdatedAt && <p className="mt-2 text-[9px] text-white/45">Sincronização: {new Date(sourceUpdatedAt).toLocaleString('pt-BR')}</p>}
            </>
          )}
        >
          <section className="border-b border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período efetivo · apenas dias fechados</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={16} /> {periodLabel}</p>
              </div>
              <p className="text-[10px] text-slate-500">Apps Afinz B2C · Android + iOS</p>
            </div>
            {error && <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">{error}</div>}
          </section>

          <section className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-slate-500" />
                <h2 className="text-xs font-semibold text-slate-800">Filtros da análise</h2>
                <span className="text-[9px] text-slate-400">{current.length} de {periodRows.length} linhas</span>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] font-semibold text-cyan-700 hover:text-cyan-900">
                  <X size={12} /> Limpar {activeFilterCount} filtro{activeFilterCount === 1 ? '' : 's'}
                </button>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-1">
              {originConfig.map(origin => {
                const selected = selectedOrigins.includes(origin.key);
                return (
                  <button
                    key={origin.key}
                    onClick={() => toggleOrigin(origin.key)}
                    aria-pressed={selected}
                    className={`border px-2.5 py-1.5 text-[10px] font-semibold ${selected ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-500'}`}
                  >
                    {origin.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <SelectFilter
                label="Media source"
                value={selectedSource}
                options={sourceOptions.map(value => ({ value, label: sourceLabels[value] ?? value }))}
                onChange={setSelectedSource}
              />
              <SelectFilter
                label="Canal"
                value={selectedChannel}
                options={channelOptions.map(value => ({ value, label: channelLabels[value] ?? value }))}
                onChange={setSelectedChannel}
              />
              <SelectFilter
                label="Plataforma"
                value={selectedPlatform}
                options={platformOptions.map(value => ({ value, label: platformLabels[value] ?? value }))}
                onChange={setSelectedPlatform}
              />
              <SelectFilter
                label="Campanha"
                value={selectedCampaign}
                options={campaignOptions.map(value => ({ value, label: value }))}
                onChange={setSelectedCampaign}
                disabledMessage="A dimensão existe no AppsFlyer e aguarda ingestão no grão certificado."
              />
              <SelectFilter
                label="Geografia"
                value={selectedGeo}
                options={geoOptions.map(value => ({ value, label: value }))}
                onChange={setSelectedGeo}
                disabledMessage="A dimensão existe no AppsFlyer e aguarda ingestão no grão certificado."
              />
              <SelectFilter
                label="Segmento"
                value={selectedSegment}
                options={segmentOptions.map(value => ({ value, label: value }))}
                onChange={setSelectedSegment}
                disabledMessage="af_sub1 existe, mas a compatibilidade varia por métrica."
              />
              <label className="min-w-[150px] text-[10px] font-semibold text-slate-500">
                <span className="mb-1 block uppercase tracking-[0.08em]">Busca</span>
                <span className="flex h-9 items-center border border-slate-300 bg-white px-2">
                  <Search size={13} className="mr-1.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Origem, campanha..."
                    className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-700 outline-none"
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="px-4 pb-3 pt-4">
            <h2 className="text-lg font-semibold text-slate-950">Jornada de aquisição</h2>
            <p className="mb-3 text-xs text-slate-500">Sinais encadeados de aquisição e uso. Sessões representam intensidade, não uma etapa única de conversão.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600"><Icon size={13} /></span>
                      <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">sinal {index + 1}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{stage.label}</p>
                    <p className="mt-0.5 font-mono text-2xl font-semibold leading-none text-slate-950">{formatNumber(stage.value)}</p>
                    <div className="mt-1"><DeltaBadge change={delta(stage.value, stage.previous)} /></div>
                    <p className="mt-1.5 text-[9px] leading-tight text-slate-400">{stage.note}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-500">Clique → Install <span className="text-slate-400">(não-orgânico)</span></p>
                <div className="mt-0.5 flex items-end justify-between">
                  <p className="font-mono text-lg font-semibold text-cyan-700">{pctLabel(clickToInstall)}</p>
                  <DeltaBadge change={clickToInstall != null && previousClickToInstall != null ? clickToInstall - previousClickToInstall : null} unit=" p.p." />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-500">Sessões por install <span className="text-slate-400">(intensidade)</span></p>
                <div className="mt-0.5 flex items-end justify-between">
                  <p className="font-mono text-lg font-semibold text-cyan-700">{ratioLabel(sessionsPerInstall)}</p>
                  <DeltaBadge change={sessionsPerInstall != null && previousSessionsPerInstall != null ? delta(sessionsPerInstall, previousSessionsPerInstall) : null} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-500">Installs não-orgânicos</p>
                <div className="mt-0.5 flex items-end justify-between">
                  <p className="font-mono text-lg font-semibold text-cyan-700">{formatNumber(nonOrganic)}</p>
                  <span className="text-[10px] font-semibold text-slate-400">{pctLabel(nonOrganicShare)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 px-4 pb-4 pt-3">
            <h2 className="text-lg font-semibold text-slate-950">Mix de origem</h2>
            <p className="mb-3 text-xs text-slate-500">Participação dos installs depois dos filtros ativos.</p>
            <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {byOrigin.filter(origin => origin.installs > 0).map(origin => (
                <div key={origin.key} title={`${origin.label}: ${pctLabel(origin.share)}`} style={{ width: `${origin.share ?? 0}%`, backgroundColor: origin.color }} />
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {byOrigin.map(origin => (
                <div key={origin.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: origin.color }} /><span className="text-[11px] font-semibold text-slate-700">{origin.label}</span></div>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-950">{formatNumber(origin.installs)}</p>
                  <p className="text-[10px] font-semibold text-cyan-700">{pctLabel(origin.share)} dos installs{origin.clicks > 0 ? ` · ${formatNumber(origin.clicks)} cliques` : ''}</p>
                  <p className="mt-0.5 text-[9px] leading-tight text-slate-400">{origin.help}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 px-4 pb-4 pt-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Evolução dos sinais</h2>
                <p className="text-xs text-slate-500">Volumes selecionáveis; filtros e período são preservados.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="inline-flex border border-slate-300 bg-white text-[10px] font-semibold">
                  {(Object.keys(metricConfig) as MetricKey[]).map(metric => (
                    <button
                      key={metric}
                      onClick={() => toggleMetric(metric)}
                      aria-pressed={visibleMetrics.includes(metric)}
                      className={`border-r border-slate-300 px-2.5 py-1.5 last:border-r-0 ${visibleMetrics.includes(metric) ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {metricConfig[metric].label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex border border-slate-300 bg-white text-[10px] font-semibold">
                  {(['daily', 'weekly', 'monthly'] as Granularity[]).map(value => (
                    <button
                      key={value}
                      onClick={() => setGranularity(value)}
                      aria-pressed={granularity === value}
                      className={`border-r border-slate-300 px-2.5 py-1.5 last:border-r-0 ${granularity === value ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {value === 'daily' ? 'Diária' : value === 'weekly' ? 'Semanal' : 'Mensal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 h-[330px]">
              {chartData.length === 0 || visibleMetrics.length === 0 ? (
                <div className="flex h-full items-center justify-center border border-dashed border-slate-300 text-xs text-slate-400">
                  {visibleMetrics.length === 0 ? 'Selecione ao menos uma métrica.' : 'Sem dados para os filtros escolhidos.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 16, right: 42, left: 8, bottom: granularity === 'daily' ? 18 : 4 }} barCategoryGap="20%">
                    <CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" />
                    <XAxis dataKey="period" height={granularity === 'daily' ? 40 : 28} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} interval="preserveStartEnd" tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} />
                    {visibleMetrics.includes('installs') && <YAxis yAxisId="installs" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={compact} />}
                    {(visibleMetrics.includes('clicks') || visibleMetrics.includes('sessions')) && <YAxis yAxisId="activity" orientation="right" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={compact} />}
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                      labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }}
                      formatter={(value: number, name: string) => [formatNumber(value), name]}
                    />
                    {visibleMetrics.includes('installs') && originConfig.map(origin => (
                      <Bar key={origin.key} yAxisId="installs" dataKey={origin.key} name={`Installs · ${origin.label}`} stackId="origin" fill={origin.color} maxBarSize={granularity === 'daily' ? 20 : 40} isAnimationActive={false} />
                    ))}
                    {visibleMetrics.includes('clicks') && <Line yAxisId="activity" type="monotone" dataKey="clicks" name="Cliques rastreados" stroke={metricConfig.clicks.color} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />}
                    {visibleMetrics.includes('sessions') && <Line yAxisId="activity" type="monotone" dataKey="sessions" name="Sessões" stroke={metricConfig.sessions.color} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </OnboardingFunnelWorkspace>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sinal</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Maior perda de installs</h3>
            <p className="mt-2 font-mono text-xl font-semibold text-red-700">{largestLoss ? pctLabel(largestLoss.installDelta) : '—'}</p>
            <p className="text-[10px] text-slate-500">{largestLoss?.label ?? 'Sem baseline comparável.'}</p>
            <p className="mt-2 text-[10px] text-slate-600"><strong>Ação:</strong> revisar origem e campanha equivalentes antes de reduzir esforço.</p>
            <p className="mt-1 text-[9px] text-slate-400">Confiança: {largestLoss ? 'média · comparação temporal' : 'bloqueada'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Oportunidade</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Melhor clique → install</h3>
            <p className="mt-2 font-mono text-xl font-semibold text-emerald-700">{bestEfficiency ? pctLabel(bestEfficiency.clickToInstall) : '—'}</p>
            <p className="text-[10px] text-slate-500">{bestEfficiency?.label ?? 'Amostra mínima de 30 cliques não atingida.'}</p>
            <p className="mt-2 text-[10px] text-slate-600"><strong>Ação:</strong> investigar criativo, público e destino; não inferir causalidade.</p>
            <p className="mt-1 text-[9px] text-slate-400">Confiança: direcional · atribuição agregada</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Impacto</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Líder de volume</h3>
            <p className="mt-2 font-mono text-xl font-semibold text-cyan-700">{volumeLeader ? formatNumber(volumeLeader.installs) : '—'}</p>
            <p className="text-[10px] text-slate-500">{volumeLeader?.label ?? 'Sem dados.'}</p>
            <p className="mt-2 text-[10px] text-slate-600"><strong>Ação:</strong> monitorar mudança de mix para não confundir volume com eficiência.</p>
            <p className="mt-1 text-[9px] text-slate-400">Confiança: alta no volume agregado</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700">Bloqueio de medição</p>
            <h3 className="mt-1 text-sm font-semibold text-amber-950">Funil de negócio indisponível</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-amber-900">O agregado possui apenas <code>af_content_view</code>. Cadastro, proposta, aprovação e cartão não podem ser inferidos.</p>
            <p className="mt-2 text-[10px] text-amber-900"><strong>Recuperação:</strong> provar <code>af_param_1</code> e <code>af_sub3</code> via Pull API/Data Locker.</p>
            <p className="mt-1 text-[9px] text-amber-700">Confiança: bloqueada até raw data</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Detalhe analítico · {periodLabel}</h2>
              <p className="text-xs text-slate-500">Compare, ordene e exporte a dimensão selecionada sem perder os filtros.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] font-semibold text-slate-500">
                <span className="mb-1 block uppercase tracking-[0.08em]">Analisar por</span>
                <select value={groupBy} onChange={event => setGroupBy(event.target.value as DimensionKey)} className="h-9 border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700">
                  {(Object.keys(dimensionLabels) as DimensionKey[]).map(dimension => (
                    <option key={dimension} value={dimension} disabled={!availableDimensions[dimension]}>
                      {dimensionLabels[dimension]}{availableDimensions[dimension] ? '' : ' · sem cobertura'}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={exportCsv} className="flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download size={14} /> Exportar</button>
            </div>
          </div>

          <div className="grid gap-2 border-y border-slate-200 bg-slate-50 px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-[10px]"><span className="text-slate-400">Dias presentes</span><p className="font-semibold text-slate-700">{quality.presentDays}/{quality.expectedDays} · {pctLabel(quality.dayCoverage)}</p></div>
            <div className="text-[10px]"><span className="text-slate-400">Cobertura de campanha</span><p className="font-semibold text-slate-700">{pctLabel(quality.campaignCoverage)} dos installs</p></div>
            <div className="text-[10px]"><span className="text-slate-400">Aliases semânticos</span><p className="font-semibold text-slate-700">{quality.aliasCount}{quality.aliases.length ? ` · ${quality.aliases.map(([key]) => sourceLabels[key] ?? key).join(', ')}` : ''}</p></div>
            <div className="text-[10px]"><span className="text-slate-400">Linhas parciais/suspeitas</span><p className="font-semibold text-slate-700">{quality.partialRows}</p></div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Carregando aquisição AppsFlyer…</div>
          ) : groupedRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Nenhuma linha atende aos filtros. Limpe filtros ou amplie o período.</div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full min-w-[960px] text-[11px]">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left font-semibold">
                      <button onClick={() => changeSort('label')}>{dimensionLabels[groupBy]}</button>
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Cobertura/aliases</th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('installs')}>Installs</button></th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('installDelta')}>Δ anterior</button></th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('clicks')}>Cliques</button></th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('clickToInstall')}>Clique→Install</button></th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('sessions')}>Sessões</button></th>
                    <th className="px-3 py-2 text-right font-semibold"><button onClick={() => changeSort('sessionsPerInstall')}>Sessões/Install</button></th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((row, index) => (
                    <tr key={row.key} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50/40' : ''}`}>
                      <td className="sticky left-0 z-[5] whitespace-nowrap bg-white px-3 py-2 font-mono font-semibold text-slate-800">{row.label}</td>
                      <td className="max-w-[260px] px-3 py-2 text-[9px] text-slate-500">{row.rawSources.length > 1 ? `${row.rawSources.length} aliases: ${row.rawSources.join(', ')}` : row.rawSources[0] ?? 'Cobertura agregada'}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">{formatNumber(row.installs)}</td>
                      <td className="px-3 py-2 text-right"><DeltaBadge change={row.installDelta} /></td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{row.clicks > 0 ? formatNumber(row.clicks) : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-cyan-700">{pctLabel(row.clickToInstall)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNumber(row.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{ratioLabel(row.sessionsPerInstall)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-[10px] text-slate-500">
          <div className="flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0 text-cyan-700" />
            <p><strong>Contrato da leitura:</strong> clique é o subconjunto atribuído rumo ao app; install inclui orgânico; sessão pode se repetir. Taxas são recalculadas pelos volumes filtrados. Campanha, geo e af_sub1 só serão liberados quando a coleta persistir essas dimensões sem perda de métricas.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
