import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';
import { FunnelStageLabel, GranularityToggle, SeriesConfigurator, StageMetricCell, granularityLabel } from './FunnelDetailControls';
import { OnboardingFunnelWorkspace } from './OnboardingFunnelWorkspace';

type Granularity = 'daily' | 'weekly' | 'monthly';
type PhaseScope = 'family' | 'app_install' | 'onboarding';
type VolumeKey = 'impressions' | 'linkClicks' | 'installs' | 'sessions' | 'initiatedCheckout' | 'startTrials';
type RateKey = 'ctr' | 'clickToInstall' | 'installToTrial';
type CostKey = 'investment' | 'cpi' | 'cpStartTrial';
type SortKey = 'date' | 'spend' | VolumeKey | RateKey | 'cpi' | 'cpStartTrial';
type Direction = 'asc' | 'desc';

type SourceRow = {
  business_date: string;
  campaign_phase: 'app_install' | 'onboarding';
  spend: number | null;
  impressions: number | null;
  clicks_all: number | null;
  link_clicks: number | null;
  installs: number | null;
  governed_installs: number | null;
  legacy_installs: number | null;
  app_sessions: number | null;
  /** Fonte real: canonical_event = 'initiated_checkout'. NUNCA foi abertura de app. */
  initiated_checkout: number | null;
  start_trials: number | null;
  start_trial_eligible: boolean;
  attribution_label: string;
  install_source: 'meta_results' | 'paid_media_metrics';
};

/** Frescor por etapa, vindo de public.v_b2c_app_install_freshness. */
type FreshnessRow = {
  stage_order: number;
  stage_key: string;
  stage_label: string;
  source_layer: 'plataforma' | 'governado' | 'legado' | 'nao_instrumentado';
  classification: 'entrega' | 'core' | 'apoio' | 'bloqueado';
  observed_through: string | null;
  expected_through: string;
  status: 'atualizado' | 'desatualizado' | 'sem_observacao' | 'nao_instrumentado';
  days_behind: number | null;
};

type DailyRow = {
  date: string;
  phases: Array<'app_install' | 'onboarding'>;
  spend: number;
  impressions: number;
  clicksAll: number;
  linkClicks: number | null;
  installs: number | null;
  sessions: number | null;
  initiatedCheckout: number | null;
  startTrials: number | null;
  eligibleSpend: number;
  eligibleInstalls: number;
  ctr: number | null;
  clickToInstall: number | null;
  installToTrial: number | null;
  cpi: number | null;
  cpStartTrial: number | null;
};

const volumeConfig: Array<{ key: VolumeKey; label: string; color: string }> = [
  { key: 'impressions', label: 'Impressões', color: '#12366f' },
  { key: 'linkClicks', label: 'Cliques no link', color: '#2563eb' },
  { key: 'installs', label: 'Instalações', color: '#7c3aed' },
  { key: 'sessions', label: 'Sessões no app', color: '#0e7490' },
  // Renomeado: a fonte sempre foi initiated_checkout, nunca abertura de app.
  { key: 'initiatedCheckout', label: 'Início de checkout', color: '#d97706' },
  { key: 'startTrials', label: 'StartTrial', color: '#059669' },
];

const rateConfig: Array<{ key: RateKey; label: string; formula: string; color: string }> = [
  { key: 'ctr', label: 'CTR de link', formula: 'Cliques no link ÷ impressões', color: '#dc2626' },
  { key: 'clickToInstall', label: 'Clique → instalação', formula: 'Instalações ÷ cliques no link', color: '#9333ea' },
  { key: 'installToTrial', label: 'Instalação → StartTrial', formula: 'StartTrials ÷ instalações elegíveis da campanha Onboarding', color: '#059669' },
];

const costConfig: Array<{ key: CostKey; label: string; formula: string; color: string }> = [
  { key: 'investment', label: 'Investimento diário', formula: 'Investimento Meta no período', color: '#0f172a' },
  { key: 'cpi', label: 'CPI', formula: 'Investimento ÷ instalações', color: '#7c3aed' },
  { key: 'cpStartTrial', label: 'CP início de proposta', formula: 'Investimento elegível ÷ StartTrials atribuídos', color: '#ea580c' },
];
const paidSeriesOrder = new Map<string, number>([
  ['impressions', 0],
  ['linkClicks', 10],
  ['ctr', 11],
  ['installs', 20],
  ['clickToInstall', 21],
  ['sessions', 30],
  ['initiatedCheckout', 40],
  ['startTrials', 50],
  ['installToTrial', 51],
  ['investment', 60],
  ['cpi', 61],
  ['cpStartTrial', 62],
]);

const pct = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const fmt = (value: number | null) => value == null ? 'n/d' : value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const money = (value: number | null) => value == null ? 'n/d' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pctLabel = (value: number | null, digits = 1) => value == null ? '—' : `${value.toFixed(digits).replace('.', ',')}%`;
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const shortDate = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const sumNullable = (values: Array<number | null>) => {
  const available = values.filter((value): value is number => value != null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null;
};

function aggregateRows(rows: DailyRow[]) {
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicksAll = rows.reduce((sum, row) => sum + row.clicksAll, 0);
  const linkClicks = sumNullable(rows.map(row => row.linkClicks));
  const installs = sumNullable(rows.map(row => row.installs));
  const sessions = sumNullable(rows.map(row => row.sessions));
  const initiatedCheckout = sumNullable(rows.map(row => row.initiatedCheckout));
  const startTrials = sumNullable(rows.map(row => row.startTrials));
  const eligibleSpend = rows.reduce((sum, row) => sum + row.eligibleSpend, 0);
  const eligibleInstalls = rows.reduce((sum, row) => sum + row.eligibleInstalls, 0);
  return {
    spend, impressions, clicksAll, linkClicks, installs, sessions, initiatedCheckout, startTrials,
    eligibleSpend, eligibleInstalls,
    ctr: linkClicks == null ? null : pct(linkClicks, impressions),
    clickToInstall: linkClicks == null || installs == null ? null : pct(installs, linkClicks),
    installToTrial: startTrials == null ? null : pct(startTrials, eligibleInstalls),
    cpi: installs && installs > 0 ? spend / installs : null,
    cpStartTrial: startTrials && startTrials > 0 ? eligibleSpend / startTrials : null,
  };
}

function periodKey(value: string, granularity: Granularity) {
  if (granularity === 'daily') return value;
  if (granularity === 'monthly') return value.slice(0, 7);
  const date = parseDate(value);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return isoDate(date);
}

function groupPaidRows(rows: DailyRow[], granularity: Granularity) {
  const groups = new Map<string, DailyRow[]>();
  rows.forEach(row => {
    const key = periodKey(row.date, granularity);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
    const summary = aggregateRows(values);
    const first = values[0].date;
    const last = values.at(-1)?.date ?? first;
    const label = granularity === 'daily'
      ? shortDate(first)
      : granularity === 'weekly'
        ? `${shortDate(first)}–${shortDate(last)}`
        : parseDate(`${key}-01`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
    const row: DailyRow = {
      date: first,
      phases: [...new Set(values.flatMap(item => item.phases))],
      ...summary,
    };
    return { key, label, weekday: granularity === 'daily' ? weekday(first) : '', row };
  });
}

function paidAdvanceRate(row: DailyRow, stage: VolumeKey) {
  if (stage === 'linkClicks') return row.ctr;
  if (stage === 'installs') return row.clickToInstall;
  if (stage === 'startTrials') return row.installToTrial;
  return null;
}

export const PaidMediaFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => {
  const { startDate, endDate } = usePeriod();
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [freshness, setFreshness] = useState<FreshnessRow[]>([]);
  const [scope, setScope] = useState<PhaseScope>('family');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [detailGranularity, setDetailGranularity] = useState<Granularity>('daily');
  const [volumes, setVolumes] = useState<VolumeKey[]>(['impressions', 'linkClicks', 'installs', 'startTrials']);
  const [rates, setRates] = useState<RateKey[]>(['ctr', 'installToTrial']);
  const [costs, setCosts] = useState<CostKey[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [direction, setDirection] = useState<Direction>('asc');

  const since = isoDate(startDate);
  const until = isoDate(endDate);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    supabase.from('v_b2c_app_install_daily').select('*')
      .gte('business_date', since).lte('business_date', until)
      .order('business_date')
      .then(({ data, error: queryError }) => {
        if (queryError) throw queryError;
        if (!cancelled) setSourceRows((data ?? []) as SourceRow[]);
      })
      .catch(reason => !cancelled && setError(reason.message || 'Não foi possível carregar o funil de mídia paga.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [since, until]);

  // Frescor NAO depende do periodo filtrado: e o estado real do pipeline.
  // Falha aqui nao derruba a tela: o funil continua util, so perde o selo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('v_b2c_app_install_freshness').select('*').order('stage_order');
      if (!cancelled) setFreshness((data ?? []) as FreshnessRow[]);
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    const filtered = scope === 'family' ? sourceRows : sourceRows.filter(row => row.campaign_phase === scope);
    const byDate = new Map<string, SourceRow[]>();
    filtered.forEach(row => byDate.set(row.business_date, [...(byDate.get(row.business_date) ?? []), row]));
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]): DailyRow => {
      const spend = items.reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
      const impressions = items.reduce((sum, row) => sum + Number(row.impressions ?? 0), 0);
      const clicksAll = items.reduce((sum, row) => sum + Number(row.clicks_all ?? 0), 0);
      const linkClicks = sumNullable(items.map(row => row.link_clicks == null ? null : Number(row.link_clicks)));
      const installs = sumNullable(items.map(row => row.installs == null ? null : Number(row.installs)));
      const sessions = sumNullable(items.map(row => row.app_sessions == null ? null : Number(row.app_sessions)));
      const initiatedCheckout = sumNullable(items.map(row => row.initiated_checkout == null ? null : Number(row.initiated_checkout)));
      const startTrials = sumNullable(items.map(row => row.start_trials == null ? null : Number(row.start_trials)));
      const eligibleItems = items.filter(row => row.start_trial_eligible);
      const eligibleSpend = eligibleItems.reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
      const eligibleInstalls = eligibleItems.reduce((sum, row) => sum + Number(row.installs ?? 0), 0);
      return {
        date,
        phases: items.map(row => row.campaign_phase),
        spend, impressions, clicksAll, linkClicks, installs, sessions, initiatedCheckout, startTrials,
        eligibleSpend, eligibleInstalls,
        ctr: linkClicks == null ? null : pct(linkClicks, impressions),
        clickToInstall: linkClicks == null || installs == null ? null : pct(installs, linkClicks),
        installToTrial: startTrials == null ? null : pct(startTrials, eligibleInstalls),
        cpi: installs && installs > 0 ? spend / installs : null,
        cpStartTrial: startTrials && startTrials > 0 ? eligibleSpend / startTrials : null,
      };
    });
  }, [sourceRows, scope]);

  const totals = useMemo(() => aggregateRows(rows), [rows]);
  const hasAppInstall = sourceRows.some(row => row.campaign_phase === 'app_install');
  const hasOnboarding = sourceRows.some(row => row.campaign_phase === 'onboarding');

  // ---- Frescor: entrega e eventos atribuidos sao DUAS datas distintas. ----
  // A data unica anterior ("Dados até 26/07") lia a entrega e escondia o atraso
  // da camada governada. O verde agora exige as duas alinhadas ao ultimo dia fechado.
  const stageFreshness = useMemo(
    () => new Map(freshness.map(item => [item.stage_key, item])),
    [freshness],
  );
  const expectedThrough = freshness[0]?.expected_through ?? null;
  const deliveryThrough = stageFreshness.get('impressions')?.observed_through ?? null;
  // A camada atribuida vale ate o elo mais fraco: a MENOR data observada entre
  // as etapas governadas. Etapa sem observacao nao empurra a data para frente.
  const eventsThrough = useMemo(
    () => freshness
      .filter(item => item.source_layer === 'governado' && item.observed_through != null)
      .reduce<string | null>(
        (oldest, item) => oldest == null || item.observed_through! < oldest ? item.observed_through! : oldest,
        null,
      ),
    [freshness],
  );
  const freshnessAligned = Boolean(
    expectedThrough && deliveryThrough && eventsThrough
    && deliveryThrough >= expectedThrough && eventsThrough >= expectedThrough,
  );
  const brDate = (value: string | null) => value ? parseDate(value).toLocaleDateString('pt-BR') : '—';
  const brShort = (value: string | null) => value ? shortDate(value) : '—';

  /** Estado da etapa: bloqueado > sem observacao > desatualizado > zero explicito > ok. */
  const stageState = (stageKey: string, value: number | null) => {
    const info = stageFreshness.get(stageKey);
    if (info?.status === 'nao_instrumentado') return 'bloqueado' as const;
    if (value == null) return 'n/d' as const;
    if (info?.status === 'desatualizado') return 'desatualizado' as const;
    if (value === 0) return 'zero' as const;
    return 'ok' as const;
  };

  const chartData = useMemo(() => {
    const groups = new Map<string, DailyRow[]>();
    rows.forEach(row => {
      const key = periodKey(row.date, granularity);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
      const summary = aggregateRows(values);
      const first = values[0].date;
      const last = values.at(-1)?.date ?? first;
      const period = granularity === 'daily' ? shortDate(first) : granularity === 'weekly'
        ? `${shortDate(first)}–${shortDate(last)}`
        : parseDate(`${key}-01`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { key, period, weekday: weekday(first), investment: summary.spend, ...summary };
    });
  }, [rows, granularity]);
  const detailRows = useMemo(() => groupPaidRows(rows, detailGranularity), [rows, detailGranularity]);

  // Classificacao explicita da procedencia de cada etapa. CPA/CP de plataforma
  // nunca e chamado de CAC em lugar nenhum desta tela.
  const cards: Array<{
    label: string; value: number | null; rate: number | null;
    status: string; tone: 'neutral' | 'core' | 'directional' | 'blocked';
    stageKey: string; note?: string;
  }> = [
    { label: 'Impressões', value: totals.impressions, rate: null, status: 'plataforma · entrega', tone: 'neutral', stageKey: 'impressions' },
    { label: 'Cliques no link', value: totals.linkClicks, rate: totals.ctr, status: 'plataforma · entrega', tone: 'neutral', stageKey: 'link_clicks' },
    {
      label: 'Instalações', value: totals.installs, rate: totals.clickToInstall,
      status: 'legado · não certificado', tone: 'directional', stageKey: 'installs',
      note: 'Fonte: paid_media_metrics. Dual-write governado em certificação.',
    },
    { label: 'Sessões no app', value: totals.sessions, rate: null, status: 'apoio · direcional', tone: 'directional', stageKey: 'app_sessions' },
    {
      label: 'Início de checkout', value: totals.initiatedCheckout, rate: null,
      status: 'apoio · direcional', tone: 'directional', stageKey: 'initiated_checkout',
      note: 'Evento Meta initiated_checkout. Não representa abertura do app.',
    },
    {
      label: 'StartTrial', value: totals.startTrials, rate: totals.installToTrial,
      status: hasAppInstall && scope === 'family' ? 'Onboarding apenas' : 'CORE · Meta 7d click',
      tone: 'core', stageKey: 'start_trials',
      note: 'StartTrial atribuído à Meta — 7d click.',
    },
    {
      label: 'Pedido de cartão', value: null, rate: null,
      status: 'bloqueado', tone: 'blocked', stageKey: 'card_order',
      note: 'Não instrumentado na Meta.',
    },
  ];

  const sortedDetailRows = useMemo(() => [...detailRows].sort((a, b) => {
    const av = sortKey === 'date' ? a.key : Number(a.row[sortKey] ?? -Infinity);
    const bv = sortKey === 'date' ? b.key : Number(b.row[sortKey] ?? -Infinity);
    const result = typeof av === 'string' ? av.localeCompare(String(bv)) : av - Number(bv);
    return direction === 'asc' ? result : -result;
  }), [detailRows, sortKey, direction]);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) setDirection(value => value === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setDirection(key === 'date' ? 'asc' : 'desc'); }
  };
  const toggleVolume = (key: VolumeKey) => setVolumes(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  const toggleRate = (key: RateKey) => {
    setCosts([]);
    setRates(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  };
  const toggleCost = (key: CostKey) => {
    setRates([]);
    setCosts(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  };

  const exportCsv = () => {
    const content = [
      // Cabecalho declara procedencia. Celula vazia = sem observacao (n/d), nunca zero.
      'Periodo;Fases;Impressoes (plataforma);Cliques no link (plataforma);Taxa avanco cliques;Instalacoes (legado);Taxa avanco instalacoes;Sessoes no app (apoio);Inicio de checkout (apoio);StartTrial (Meta 7d click);Taxa avanco StartTrial;Investimento;CPI;CP inicio proposta;Pedido de cartao',
      ...detailRows.map(({ label, row }) => [label, row.phases.join('+'), row.impressions, row.linkClicks ?? '', row.ctr ?? '', row.installs ?? '', row.clickToInstall ?? '', row.sessions ?? '', row.initiatedCheckout ?? '', row.startTrials ?? '', row.installToTrial ?? '', row.spend, row.cpi ?? '', row.cpStartTrial ?? '', 'bloqueado'].join(';')),
      '',
      `# Entrega atualizada ate ${brDate(deliveryThrough)}; eventos atribuidos ate ${brDate(eventsThrough)}; ultimo dia fechado ${brDate(expectedThrough)}`,
      '# Celula vazia = sem observacao (n/d). Zero explicito e exportado como 0.',
      '# Pedido de cartao: nao instrumentado na Meta (SubmitApplication inexistente na fonte).',
    ].join('\n');
    const href = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `funil-midia-paga-${scope}-${detailGranularity}-${since}-${until}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const secondaryIsCurrency = costs.length > 0;
  const scopeLabel = scope === 'family' ? 'Família B2C App Install' : scope === 'app_install' ? 'Campanha App Install' : 'Campanha Onboarding';

  return <div className="min-h-full bg-slate-50 px-4 pb-5 text-slate-800">
    <div className="mx-auto max-w-[1780px] space-y-4">
      <OnboardingFunnelWorkspace
        navigation={navigation}
        sidebarMeta={<>
          <div className="grid gap-3 sm:grid-cols-2 min-[1180px]:grid-cols-1">
            {/* Frescor em DUAS linhas: entrega e eventos atribuídos. Verde só quando ambas
                alcançam o último dia fechado esperado. */}
            <div className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${freshnessAligned ? 'border-emerald-200/40 bg-emerald-50 text-emerald-900' : 'border-amber-300/60 bg-amber-50 text-amber-900'}`}>
              <div className="flex items-center gap-2">
                {freshnessAligned ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
                <span>{freshnessAligned ? 'Pipeline em dia' : 'Atenção · camadas desalinhadas'}</span>
              </div>
              <p className="mt-1.5 font-normal">Entrega atualizada até <strong>{brDate(deliveryThrough)}</strong></p>
              <p className="font-normal">Eventos atribuídos atualizados até <strong>{brDate(eventsThrough)}</strong></p>
              {!freshnessAligned && <p className="mt-1 font-normal opacity-80">Último dia fechado esperado: {brDate(expectedThrough)}</p>}
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-blue-200/50 bg-blue-50 px-3 py-2 text-[10px] leading-relaxed text-blue-950"><Info size={14} className="mt-0.5 shrink-0" /><span><strong>Escopo:</strong> App Install usa 1d click + 1d view; Onboarding usa StartTrial atribuído à Meta em 7d click. CP início de proposta considera somente investimento elegível. CPA/CP de plataforma <strong>não é CAC</strong>.</span></div>
          </div>
          {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
          <div className="mt-4 grid gap-x-4 gap-y-3 text-[10px] sm:grid-cols-2 min-[1180px]:grid-cols-1">
            <div><span className="text-white/55">Resultado principal</span><p className="font-semibold text-white">{fmt(totals.startTrials)} StartTrials atribuídos</p></div>
            <div><span className="text-white/55">Taxa CORE elegível</span><p className="font-semibold text-white">{pctLabel(totals.installToTrial)} instalação → StartTrial</p></div>
            <div><span className="text-white/55">Eficiência de mídia</span><p className="font-semibold text-white">{money(totals.cpStartTrial)} por StartTrial</p></div>
            <div><span className="text-white/55">Lacuna crítica</span><p className="font-semibold text-amber-200">Pedido de cartão — não instrumentado na Meta</p></div>
          </div>
        </>}
      >
      <section className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado · {scopeLabel}</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} /> {startDate.toLocaleDateString('pt-BR')} – {endDate.toLocaleDateString('pt-BR')}</p></div>
          <div className="inline-flex border border-slate-300 bg-white text-[10px] font-semibold">
            {([
              ['family', 'Consolidado'],
              ['app_install', 'App Install'],
              ['onboarding', 'Onboarding'],
            ] as Array<[PhaseScope, string]>).map(([key, label]) => <button key={key} onClick={() => setScope(key)} aria-pressed={scope === key} disabled={(key === 'app_install' && !hasAppInstall) || (key === 'onboarding' && !hasOnboarding)} className={`border-r border-slate-300 px-3 py-1.5 last:border-0 disabled:cursor-not-allowed disabled:text-slate-300 ${scope === key ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>{label}</button>)}
          </div>
        </div>
        <div className="mt-3 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Investimento', money(totals.spend), 'volume financeiro'],
            ['Instalações', fmt(totals.installs), 'fonte legada · em certificação'],
            ['CPI', money(totals.cpi), scope === 'family' ? 'blended · políticas preservadas' : 'custo por instalação · não é CAC'],
            ['StartTrial', fmt(totals.startTrials), scope === 'app_install' ? 'não mensurado' : 'atribuído à Meta · 7d click'],
            ['CP início de proposta', money(totals.cpStartTrial), 'investimento elegível · não é CAC'],
          ].map(([label, value, note]) => <div key={label} className="bg-white px-3 py-2.5"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 font-mono text-lg font-semibold text-slate-950">{value}</p><p className="text-[9px] text-slate-500">{note}</p></div>)}
        </div>
      </section>

      <section className="px-4 pb-3 pt-4">
        <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2>
        <p className="mb-3 text-xs text-slate-500">Topo consolidado entre campanhas equivalentes; StartTrial e sua taxa usam apenas a fase Onboarding. Ausência de observação aparece como <strong>n/d</strong> e nunca é convertida em zero.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {cards.map((card, index) => {
            const state = stageState(card.stageKey, card.value);
            const info = stageFreshness.get(card.stageKey);
            // Valor exibido respeita a semantica: bloqueado nao mostra numero,
            // ausencia mostra n/d, zero explicito mostra 0.
            const display = state === 'bloqueado' ? '—' : fmt(card.value);
            const footer = state === 'bloqueado'
              ? 'Não instrumentado'
              : state === 'n/d'
                ? 'n/d · sem observação'
                : state === 'desatualizado'
                  ? `Desatualizado · até ${brShort(info?.observed_through ?? null)}`
                  : card.rate == null ? 'Volume do período' : pctLabel(card.rate);
            const footerTone = state === 'bloqueado'
              ? 'text-red-600'
              : state === 'desatualizado'
                ? 'text-amber-700'
                : state === 'n/d' ? 'text-slate-400' : 'text-cyan-700';
            return (
              <div
                key={card.label}
                title={card.note}
                className={`rounded-md border px-3 py-2.5 ${card.tone === 'core' ? 'border-cyan-300 bg-cyan-50' : card.tone === 'blocked' ? 'border-red-200 bg-red-50' : card.tone === 'directional' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold">{index + 1}</span>
                  <span className={`truncate text-right text-[8px] font-semibold uppercase ${card.tone === 'blocked' ? 'text-red-600' : card.tone === 'core' ? 'text-cyan-700' : 'text-slate-400'}`}>{card.status}</span>
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{card.label}</p>
                <p className="mt-0.5 font-mono text-lg font-semibold leading-none text-slate-950">{display}</p>
                <p className={`mt-1 text-[10px] font-semibold ${footerTone}`}>{footer}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Volumes, taxas e custos da família de campanhas no mesmo eixo temporal.</p></div><div className="inline-flex border border-slate-300 text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(item => <button key={item} onClick={() => setGranularity(item)} aria-pressed={granularity === item} className={`border-r border-slate-300 px-3 py-1.5 last:border-0 ${granularity === item ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>{item === 'daily' ? 'Diária' : item === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div></div>
        <SeriesConfigurator summary={`${volumes.length} volumes · ${rates.length} taxas · ${costs.length} custos`}>
          <div className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap bg-slate-50/60 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Volumes</span>{volumeConfig.map((item, index) => <button key={item.key} onClick={() => toggleVolume(item.key)} aria-pressed={volumes.includes(item.key)} className={`flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${volumes.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: volumes.includes(item.key) ? item.color : '#cbd5e1' }} /><FunnelStageLabel index={index} label={item.label} compact /></button>)}<button onClick={() => setVolumes([])} className="shrink-0 px-2.5 py-2 font-semibold text-slate-500">Limpar</button></div>
          <div className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap border-t border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Taxas</span>{rateConfig.map(item => <button key={item.key} title={item.formula} onClick={() => toggleRate(item.key)} aria-pressed={rates.includes(item.key)} className={`flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${rates.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: rates.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}</div>
          <div className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap border-t border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Custos</span>{costConfig.map(item => <button key={item.key} title={item.formula} onClick={() => toggleCost(item.key)} aria-pressed={costs.includes(item.key)} className={`flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${costs.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: costs.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}<span className="shrink-0 px-2 py-2 text-slate-400">Taxas e custos alternam o eixo direito.</span></div>
        </SeriesConfigurator>
        <div className="mt-2 h-[360px]">{loading ? <div className="h-full animate-pulse bg-slate-50" /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 46, left: 8, bottom: granularity === 'daily' ? 20 : 4 }} barGap={2} barCategoryGap="22%" reverseStackOrder={false}><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" height={granularity === 'daily' ? 42 : 30} tick={granularity === 'daily' ? ({ x, y, payload }: any) => { const point = chartData.find(item => item.period === payload.value); return <g transform={`translate(${x},${y})`}><text y={12} textAnchor="middle" fill="#334155" fontSize={10} fontFamily="monospace">{payload.value}</text><text y={26} textAnchor="middle" fill="#94a3b8" fontSize={9}>{point?.weekday}</text></g>; } : { fontSize: 10, fill: '#475569' }} /><YAxis yAxisId="volume" hide={volumes.length === 0} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} /><YAxis yAxisId="secondary" orientation="right" tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => secondaryIsCurrency ? `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : `${value}%`} /><Tooltip itemSorter={(item: any) => paidSeriesOrder.get(String(item.dataKey ?? item.name)) ?? 999} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }} formatter={(value: number, name: string) => { const rate = rateConfig.find(item => item.key === name); const cost = costConfig.find(item => item.key === name); const volume = volumeConfig.find(item => item.key === name); return [rate ? pctLabel(value, 2) : cost ? money(value) : fmt(value), rate?.label ?? cost?.label ?? volume?.label ?? name]; }} />{volumeConfig.filter(item => volumes.includes(item.key)).map(item => <Bar key={item.key} yAxisId="volume" dataKey={item.key} fill={item.color} maxBarSize={granularity === 'daily' ? 17 : 38} isAnimationActive={false} />)}{rateConfig.filter(item => rates.includes(item.key)).map(item => <Line key={item.key} yAxisId="secondary" type="linear" dataKey={item.key} stroke={item.color} strokeWidth={3} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} connectNulls={false} isAnimationActive={false} />)}{costConfig.filter(item => costs.includes(item.key)).map(item => <Line key={item.key} yAxisId="secondary" type="linear" dataKey={item.key} stroke={item.color} strokeWidth={3} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} connectNulls={false} isAnimationActive={false} />)}</ComposedChart></ResponsiveContainer>}</div>
        <p className="text-[10px] text-slate-500">CPI consolidado preserva a política reportada de cada campanha. StartTrial (atribuído à Meta — 7d click) e CP início de proposta pertencem somente à fase Onboarding. Sessões no app e Início de checkout são diagnósticos de apoio. CP de plataforma não é CAC.</p>
      </section>
      </OnboardingFunnelWorkspace>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe {granularityLabel(detailGranularity).toLowerCase()}</h2><p className="text-xs text-slate-500">As etapas seguem a jornada da impressão ao StartTrial; custos ficam ao final como contexto. Células <strong>n/d</strong> indicam ausência de observação, não zero.</p></div><div className="flex flex-wrap items-center gap-2"><GranularityToggle value={detailGranularity} onChange={setDetailGranularity} /><button onClick={exportCsv} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div></div><div className="max-h-[470px] overflow-auto"><table className="w-full min-w-[1120px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left"><button onClick={() => changeSort('date')} className="flex items-center gap-1 font-semibold">Período<ArrowUpDown size={10} /></button></th>{volumeConfig.map((stage, index) => <th key={stage.key} className="px-3 py-2 text-right"><button onClick={() => changeSort(stage.key)} className="ml-auto flex items-center gap-1 font-semibold"><FunnelStageLabel index={index} label={stage.label} compact /><ArrowUpDown size={10} /></button></th>)}{([{ key: 'spend', label: 'Investimento' }, { key: 'cpi', label: 'CPI' }, { key: 'cpStartTrial', label: 'CP início proposta' }] as Array<{ key: SortKey; label: string }>).map(column => <th key={column.key} className="px-3 py-2 text-right"><button onClick={() => changeSort(column.key)} className="ml-auto flex items-center gap-1 font-semibold">{column.label}<ArrowUpDown size={10} /></button></th>)}</tr></thead><tbody>{sortedDetailRows.map((item, index) => <tr key={item.key} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50/40' : ''}`}><td className="whitespace-nowrap px-3 py-2"><p className="font-mono text-[11px] font-semibold">{item.label}</p>{item.weekday && <p className="capitalize text-slate-400">{item.weekday}</p>}<p className="text-[8px] text-cyan-700">{item.row.phases.length > 1 ? '2 campanhas' : item.row.phases[0] === 'app_install' ? 'App Install' : 'Onboarding'}</p></td>{volumeConfig.map(stage => { const rate = paidAdvanceRate(item.row, stage.key); const isSupport = stage.key === 'sessions' || stage.key === 'initiatedCheckout'; const note = stage.key === 'impressions' ? 'base' : isSupport ? 'apoio' : 'avanço'; return <td key={stage.key} className="px-3 py-2"><StageMetricCell value={fmt(item.row[stage.key])} rate={rate == null ? null : pctLabel(rate, 2)} note={note} tone={isSupport || stage.key === 'impressions' ? 'slate' : 'teal'} /></td>; })}<td className="px-3 py-2 text-right font-mono">{money(item.row.spend)}</td><td className="px-3 py-2 text-right font-mono font-semibold">{money(item.row.cpi)}</td><td className="px-3 py-2 text-right font-mono font-semibold">{money(item.row.cpStartTrial)}</td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
};
