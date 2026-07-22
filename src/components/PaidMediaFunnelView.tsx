import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';

type Granularity = 'daily' | 'weekly' | 'monthly';
type PhaseScope = 'family' | 'app_install' | 'onboarding';
type VolumeKey = 'impressions' | 'linkClicks' | 'installs' | 'sessions' | 'appOpened' | 'startTrials';
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
  app_sessions: number | null;
  app_opened: number | null;
  start_trials: number | null;
  start_trial_eligible: boolean;
  attribution_label: string;
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
  appOpened: number | null;
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
  { key: 'appOpened', label: 'App aberto', color: '#d97706' },
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

const pct = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const fmt = (value: number | null) => value == null ? 'n/d' : value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const money = (value: number | null) => value == null ? 'n/d' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pctLabel = (value: number | null, digits = 1) => value == null ? '—' : `${value.toFixed(digits).replace('.', ',')}%`;
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const shortDate = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const delta = (current: number | null, previous: number | null) => current == null || previous == null || previous === 0 ? null : (current - previous) / previous * 100;
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
  const appOpened = sumNullable(rows.map(row => row.appOpened));
  const startTrials = sumNullable(rows.map(row => row.startTrials));
  const eligibleSpend = rows.reduce((sum, row) => sum + row.eligibleSpend, 0);
  const eligibleInstalls = rows.reduce((sum, row) => sum + row.eligibleInstalls, 0);
  return {
    spend, impressions, clicksAll, linkClicks, installs, sessions, appOpened, startTrials,
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

export const PaidMediaFunnelView: React.FC = () => {
  const { startDate, endDate } = usePeriod();
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [scope, setScope] = useState<PhaseScope>('family');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');
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
      const appOpened = sumNullable(items.map(row => row.app_opened == null ? null : Number(row.app_opened)));
      const startTrials = sumNullable(items.map(row => row.start_trials == null ? null : Number(row.start_trials)));
      const eligibleItems = items.filter(row => row.start_trial_eligible);
      const eligibleSpend = eligibleItems.reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
      const eligibleInstalls = eligibleItems.reduce((sum, row) => sum + Number(row.installs ?? 0), 0);
      return {
        date,
        phases: items.map(row => row.campaign_phase),
        spend, impressions, clicksAll, linkClicks, installs, sessions, appOpened, startTrials,
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
  const lastDate = rows.at(-1)?.date;
  const hasAppInstall = sourceRows.some(row => row.campaign_phase === 'app_install');
  const hasOnboarding = sourceRows.some(row => row.campaign_phase === 'onboarding');

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

  const cards = [
    { label: 'Impressões', value: totals.impressions, rate: null, status: 'entrega', tone: 'neutral' },
    { label: 'Cliques no link', value: totals.linkClicks, rate: totals.ctr, status: 'conversão', tone: 'neutral' },
    { label: 'Instalações', value: totals.installs, rate: totals.clickToInstall, status: 'CORE · trusted', tone: 'core' },
    { label: 'Sessões no app', value: totals.sessions, rate: null, status: 'apoio · directional', tone: 'directional' },
    { label: 'App aberto', value: totals.appOpened, rate: null, status: hasAppInstall && scope !== 'onboarding' ? 'cobertura parcial' : 'apoio · directional', tone: 'directional' },
    { label: 'StartTrial', value: totals.startTrials, rate: totals.installToTrial, status: hasAppInstall && scope === 'family' ? 'Onboarding apenas' : 'CORE · trusted', tone: 'core' },
    { label: 'Pedido de cartão', value: null, rate: null, status: 'bloqueado', tone: 'blocked' },
  ];

  const sortedRows = useMemo(() => [...rows].sort((a, b) => {
    const av = sortKey === 'date' ? a.date : Number(a[sortKey] ?? -Infinity);
    const bv = sortKey === 'date' ? b.date : Number(b[sortKey] ?? -Infinity);
    const result = typeof av === 'string' ? av.localeCompare(String(bv)) : av - Number(bv);
    return direction === 'asc' ? result : -result;
  }), [rows, sortKey, direction]);

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
      'Data;Fases;Investimento;Impressoes;Cliques no link;Instalacoes;Sessoes;App aberto;StartTrial;CTR;Clique para instalacao;Instalacao para StartTrial;CPI;CP inicio proposta',
      ...rows.map(row => [row.date, row.phases.join('+'), row.spend, row.impressions, row.linkClicks ?? '', row.installs ?? '', row.sessions ?? '', row.appOpened ?? '', row.startTrials ?? '', row.ctr ?? '', row.clickToInstall ?? '', row.installToTrial ?? '', row.cpi ?? '', row.cpStartTrial ?? ''].join(';')),
    ].join('\n');
    const href = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `funil-midia-paga-${scope}-${since}-${until}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const secondaryIsCurrency = costs.length > 0;
  const scopeLabel = scope === 'family' ? 'Família B2C App Install' : scope === 'app_install' ? 'Campanha App Install' : 'Campanha Onboarding';

  return <div className="min-h-full bg-slate-50 px-4 pb-5 text-slate-800">
    <div className="mx-auto flex max-w-[1780px] flex-col gap-4">
      <header className="flex justify-end pt-1">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados até {lastDate ? parseDate(lastDate).toLocaleDateString('pt-BR') : '—'}</div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <span className="flex items-start gap-2"><Info size={15} className="mt-0.5 shrink-0" /><span><strong>Escopo:</strong> App Install reporta instalação em 1d click + 1d view; Onboarding reporta StartTrial em 7d click. CP início de proposta usa somente investimento elegível. CPA de plataforma não é CAC.</span></span>
        <div className="inline-flex border border-blue-300 bg-white text-[10px] font-semibold">
          {([
            ['family', 'Consolidado'],
            ['app_install', 'App Install'],
            ['onboarding', 'Onboarding'],
          ] as Array<[PhaseScope, string]>).map(([key, label]) => <button key={key} onClick={() => setScope(key)} disabled={(key === 'app_install' && !hasAppInstall) || (key === 'onboarding' && !hasOnboarding)} className={`border-r border-blue-200 px-3 py-1.5 last:border-0 disabled:cursor-not-allowed disabled:text-slate-300 ${scope === key ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-blue-50'}`}>{label}</button>)}
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado · {scopeLabel}</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} /> {startDate.toLocaleDateString('pt-BR')} – {endDate.toLocaleDateString('pt-BR')}</p></div>
          <p className="text-[10px] text-slate-400">Ausência de evento é exibida como n/d, nunca como zero real.</p>
        </div>
        <div className="mt-3 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Investimento', money(totals.spend), 'volume financeiro'],
            ['Instalações', fmt(totals.installs), 'resultado de instalação'],
            ['CPI', money(totals.cpi), scope === 'family' ? 'blended · políticas preservadas' : 'custo por instalação'],
            ['StartTrial', fmt(totals.startTrials), scope === 'app_install' ? 'não mensurado' : 'atribuído Meta'],
            ['CP início de proposta', money(totals.cpStartTrial), 'somente investimento elegível'],
          ].map(([label, value, note]) => <div key={label} className="bg-white px-3 py-2.5"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 font-mono text-lg font-semibold text-slate-950">{value}</p><p className="text-[9px] text-slate-500">{note}</p></div>)}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2>
        <p className="mb-3 text-xs text-slate-500">Topo consolidado entre campanhas equivalentes; StartTrial e sua taxa usam apenas a fase Onboarding.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{cards.map((card, index) => <div key={card.label} className={`rounded-md border px-3 py-2.5 ${card.tone === 'core' ? 'border-cyan-300 bg-cyan-50' : card.tone === 'blocked' ? 'border-red-200 bg-red-50' : card.tone === 'directional' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold">{index + 1}</span><span className={`text-[8px] font-semibold uppercase ${card.tone === 'blocked' ? 'text-red-600' : card.tone === 'core' ? 'text-cyan-700' : 'text-slate-400'}`}>{card.status}</span></div><p className="mt-1.5 text-[11px] font-semibold text-slate-700">{card.label}</p><p className="mt-0.5 font-mono text-lg font-semibold leading-none text-slate-950">{fmt(card.value)}</p><p className="mt-1 text-[10px] font-semibold text-cyan-700">{card.rate == null ? card.value == null ? 'Não mensurado' : 'Volume do período' : pctLabel(card.rate)}</p></div>)}</div>
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 text-[10px] sm:grid-cols-4"><div><span className="text-slate-400">Resultado principal</span><p className="font-semibold">{fmt(totals.startTrials)} StartTrials atribuídos</p></div><div><span className="text-slate-400">Taxa CORE elegível</span><p className="font-semibold">{pctLabel(totals.installToTrial)} instalação → StartTrial</p></div><div><span className="text-slate-400">Eficiência de mídia</span><p className="font-semibold">{money(totals.cpStartTrial)} por StartTrial</p></div><div><span className="text-slate-400">Lacuna crítica</span><p className="font-semibold text-red-700">SubmitApplication sem instrumentação Meta</p></div></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Volumes, taxas e custos da família de campanhas no mesmo eixo temporal.</p></div><div className="inline-flex border border-slate-300 text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(item => <button key={item} onClick={() => setGranularity(item)} className={`border-r border-slate-300 px-3 py-1.5 last:border-0 ${granularity === item ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>{item === 'daily' ? 'Diária' : item === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div></div>
        <div className="mt-4 flex flex-wrap items-center border-y border-slate-200 bg-slate-50/60 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Volumes</span>{volumeConfig.map(item => <button key={item.key} onClick={() => toggleVolume(item.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${volumes.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: volumes.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}<button onClick={() => setVolumes([])} className="px-2.5 py-2 font-semibold text-slate-500">Limpar</button></div>
        <div className="flex flex-wrap items-center border-b border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Taxas</span>{rateConfig.map(item => <button key={item.key} title={item.formula} onClick={() => toggleRate(item.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${rates.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: rates.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}</div>
        <div className="flex flex-wrap items-center border-b border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Custos</span>{costConfig.map(item => <button key={item.key} title={item.formula} onClick={() => toggleCost(item.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${costs.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: costs.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}<span className="px-2 py-2 text-slate-400">Taxas e custos alternam o eixo direito.</span></div>
        <div className="mt-3 h-[390px]">{loading ? <div className="h-full animate-pulse bg-slate-50" /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 46, left: 8, bottom: granularity === 'daily' ? 20 : 4 }} barGap={2} barCategoryGap="22%"><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" height={granularity === 'daily' ? 42 : 30} tick={granularity === 'daily' ? ({ x, y, payload }: any) => { const point = chartData.find(item => item.period === payload.value); return <g transform={`translate(${x},${y})`}><text y={12} textAnchor="middle" fill="#334155" fontSize={10} fontFamily="monospace">{payload.value}</text><text y={26} textAnchor="middle" fill="#94a3b8" fontSize={9}>{point?.weekday}</text></g>; } : { fontSize: 10, fill: '#475569' }} /><YAxis yAxisId="volume" hide={volumes.length === 0} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} /><YAxis yAxisId="secondary" orientation="right" tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => secondaryIsCurrency ? `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : `${value}%`} /><Tooltip contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }} formatter={(value: number, name: string) => { const rate = rateConfig.find(item => item.key === name); const cost = costConfig.find(item => item.key === name); const volume = volumeConfig.find(item => item.key === name); return [rate ? pctLabel(value, 2) : cost ? money(value) : fmt(value), rate?.label ?? cost?.label ?? volume?.label ?? name]; }} />{volumeConfig.filter(item => volumes.includes(item.key)).map(item => <Bar key={item.key} yAxisId="volume" dataKey={item.key} fill={item.color} maxBarSize={granularity === 'daily' ? 17 : 38} isAnimationActive={false} />)}{rateConfig.filter(item => rates.includes(item.key)).map(item => <Line key={item.key} yAxisId="secondary" type="linear" dataKey={item.key} stroke={item.color} strokeWidth={3} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} connectNulls={false} isAnimationActive={false} />)}{costConfig.filter(item => costs.includes(item.key)).map(item => <Line key={item.key} yAxisId="secondary" type="linear" dataKey={item.key} stroke={item.color} strokeWidth={3} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} connectNulls={false} isAnimationActive={false} />)}</ComposedChart></ResponsiveContainer>}</div>
        <p className="text-[10px] text-slate-500">CPI consolidado preserva a política reportada de cada campanha. StartTrial e CP início de proposta pertencem somente à fase Onboarding. Sessões e App aberto são diagnósticos de apoio.</p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between p-5"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe diário</h2><p className="text-xs text-slate-500">Volumes, eficiência e mudança contra o dia fechado anterior.</p></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div><div className="max-h-[470px] overflow-auto"><table className="w-full min-w-[1420px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr>{([{ key: 'date', label: 'Data' }, { key: 'spend', label: 'Investimento' }, ...volumeConfig, ...rateConfig, { key: 'cpi', label: 'CPI' }, { key: 'cpStartTrial', label: 'CP início proposta' }] as Array<{ key: SortKey; label: string }>).map(column => <th key={column.key} className={`px-3 py-2 ${column.key === 'date' ? 'text-left' : 'text-right'}`}><button onClick={() => changeSort(column.key)} className={`flex items-center gap-1 font-semibold ${column.key === 'date' ? '' : 'ml-auto'}`}>{column.label}<ArrowUpDown size={10} /></button></th>)}</tr></thead><tbody>{sortedRows.map((row, index) => { const originalIndex = rows.findIndex(item => item.date === row.date); const previous = originalIndex > 0 ? rows[originalIndex - 1] : null; return <tr key={row.date} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50/40' : ''}`}><td className="whitespace-nowrap px-3 py-2"><p className="font-mono text-[11px] font-semibold">{shortDate(row.date)}</p><p className="capitalize text-slate-400">{parseDate(row.date).toLocaleDateString('pt-BR', { weekday: 'long' })}</p><p className="text-[8px] text-cyan-700">{row.phases.length > 1 ? '2 campanhas' : row.phases[0] === 'app_install' ? 'App Install' : 'Onboarding'}</p></td><td className="px-3 py-2 text-right font-mono">{money(row.spend)}</td>{volumeConfig.map(item => { const change = delta(row[item.key], previous?.[item.key] ?? null); return <td key={item.key} className="px-3 py-2 text-right"><p className="font-mono font-semibold">{fmt(row[item.key])}</p><p className={`${change == null ? 'text-slate-400' : change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-700' : 'text-slate-400'} flex items-center justify-end gap-0.5`}>{change == null ? <ArrowRight size={9} /> : change > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}{change == null ? 'sem base' : `${Math.abs(change).toFixed(1).replace('.', ',')}%`}</p></td>; })}{rateConfig.map(item => <td key={item.key} className="px-3 py-2 text-right font-mono font-semibold">{pctLabel(row[item.key], 2)}</td>)}<td className="px-3 py-2 text-right font-mono font-semibold">{money(row.cpi)}</td><td className="px-3 py-2 text-right font-mono font-semibold">{money(row.cpStartTrial)}</td></tr>; })}</tbody></table></div></section>
      <div className="flex items-center gap-2 text-[10px] text-amber-800"><AlertTriangle size={13} /> Pedido de cartão/SubmitApplication permanece bloqueado até instrumentação AppsFlyer → Meta.</div>
    </div>
  </div>;
};
