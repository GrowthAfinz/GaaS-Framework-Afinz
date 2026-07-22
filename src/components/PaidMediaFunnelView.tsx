import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';

type Granularity = 'daily' | 'weekly' | 'monthly';
type VolumeKey = 'impressions' | 'linkClicks' | 'installs' | 'sessions' | 'appOpened' | 'startTrials';
type RateKey = 'ctr' | 'clickToInstall' | 'installToTrial';
type SortKey = 'date' | 'spend' | VolumeKey | RateKey;
type Direction = 'asc' | 'desc';

type DeliveryRow = { date: string; spend: number; impressions: number; clicks: number; installs: number };
type FunnelFact = { business_date: string; canonical_event: string; value: number | null };
type DailyRow = DeliveryRow & {
  linkClicks: number; installs: number; sessions: number; appOpened: number; startTrials: number;
  ctr: number | null; clickToInstall: number | null; installToTrial: number | null;
};

const CAMPAIGN_ID = '120250049222750723';
const CAMPAIGN_MATCH = 'App_Install_Onboarding_Afinz';

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
  { key: 'installToTrial', label: 'Instalação → StartTrial', formula: 'StartTrials atribuídos ÷ instalações atribuídas', color: '#059669' },
];

const pct = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const fmt = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pctLabel = (value: number | null, digits = 1) => value == null ? '—' : `${value.toFixed(digits).replace('.', ',')}%`;
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const shortDate = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = (value: string) => parseDate(value).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const delta = (current: number | null, previous: number | null) => current == null || previous == null || previous === 0 ? null : (current - previous) / previous * 100;

function aggregateRows(rows: DailyRow[]) {
  const total = rows.reduce((acc, row) => ({
    spend: acc.spend + row.spend,
    impressions: acc.impressions + row.impressions,
    linkClicks: acc.linkClicks + row.linkClicks,
    installs: acc.installs + row.installs,
    sessions: acc.sessions + row.sessions,
    appOpened: acc.appOpened + row.appOpened,
    startTrials: acc.startTrials + row.startTrials,
  }), { spend: 0, impressions: 0, linkClicks: 0, installs: 0, sessions: 0, appOpened: 0, startTrials: 0 });
  return { ...total, ctr: pct(total.linkClicks, total.impressions), clickToInstall: pct(total.installs, total.linkClicks), installToTrial: pct(total.startTrials, total.installs) };
}

function periodKey(value: string, granularity: Granularity) {
  if (granularity === 'daily') return value;
  if (granularity === 'monthly') return value.slice(0, 7);
  const date = parseDate(value); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return isoDate(date);
}

export const PaidMediaFunnelView: React.FC = () => {
  const { startDate, endDate } = usePeriod();
  const [delivery, setDelivery] = useState<DeliveryRow[]>([]);
  const [facts, setFacts] = useState<FunnelFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [volumes, setVolumes] = useState<VolumeKey[]>(['impressions', 'linkClicks', 'installs', 'startTrials']);
  const [rates, setRates] = useState<RateKey[]>(['ctr', 'clickToInstall', 'installToTrial']);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [direction, setDirection] = useState<Direction>('asc');

  const since = isoDate(startDate);
  const until = isoDate(endDate);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([
      supabase.from('paid_media_metrics').select('date,spend,impressions,clicks,installs')
        .ilike('campaign', `%${CAMPAIGN_MATCH}%`).gte('date', since).lte('date', until),
      supabase.from('v_funnel_ad_latest').select('business_date,canonical_event,value')
        .eq('campaign_id', CAMPAIGN_ID).gte('business_date', since).lte('business_date', until),
    ]).then(([deliveryResult, funnelResult]) => {
      if (deliveryResult.error) throw deliveryResult.error;
      if (funnelResult.error) throw funnelResult.error;
      if (cancelled) return;
      const deliveryByDate = new Map<string, DeliveryRow>();
      for (const row of deliveryResult.data ?? []) {
        const date = String(row.date); const current = deliveryByDate.get(date) ?? { date, spend: 0, impressions: 0, clicks: 0, installs: 0 };
        current.spend += Number(row.spend ?? 0); current.impressions += Number(row.impressions ?? 0); current.clicks += Number(row.clicks ?? 0); current.installs += Number(row.installs ?? 0);
        deliveryByDate.set(date, current);
      }
      setDelivery([...deliveryByDate.values()]);
      setFacts((funnelResult.data ?? []).map(row => ({ business_date: String(row.business_date), canonical_event: String(row.canonical_event), value: row.value == null ? null : Number(row.value) })));
    }).catch(reason => !cancelled && setError(reason.message || 'Não foi possível carregar o funil de mídia paga.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [since, until]);

  const rows = useMemo(() => {
    const byDate = new Map<string, DailyRow>();
    for (const item of delivery) byDate.set(item.date, { ...item, linkClicks: 0, sessions: 0, appOpened: 0, startTrials: 0, ctr: null, clickToInstall: null, installToTrial: null });
    for (const fact of facts) {
      const row = byDate.get(fact.business_date) ?? { date: fact.business_date, spend: 0, impressions: 0, clicks: 0, linkClicks: 0, installs: 0, sessions: 0, appOpened: 0, startTrials: 0, ctr: null, clickToInstall: null, installToTrial: null };
      const value = fact.value ?? 0;
      if (fact.canonical_event === 'link_click') row.linkClicks += value;
      // Instalações vêm da métrica reportada da campanha. O alias de actions[]
      // permanece auditável no fato, mas não substitui o resultado consolidado.
      if (fact.canonical_event === 'app_session') row.sessions += value;
      if (fact.canonical_event === 'initiated_checkout') row.appOpened += value;
      if (fact.canonical_event === 'start_trial') row.startTrials += value;
      byDate.set(fact.business_date, row);
    }
    return [...byDate.values()].map(row => ({ ...row, ctr: pct(row.linkClicks, row.impressions), clickToInstall: pct(row.installs, row.linkClicks), installToTrial: pct(row.startTrials, row.installs) })).sort((a, b) => a.date.localeCompare(b.date));
  }, [delivery, facts]);

  const totals = useMemo(() => aggregateRows(rows), [rows]);
  const lastDate = rows.at(-1)?.date;
  const chartData = useMemo(() => {
    const groups = new Map<string, DailyRow[]>();
    rows.forEach(row => { const key = periodKey(row.date, granularity); groups.set(key, [...(groups.get(key) ?? []), row]); });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
      const summary = aggregateRows(values); const first = values[0].date; const last = values.at(-1)?.date ?? first;
      const period = granularity === 'daily' ? shortDate(first) : granularity === 'weekly' ? `${shortDate(first)}–${shortDate(last)}` : parseDate(`${key}-01`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { key, period, weekday: weekday(first), ...summary };
    });
  }, [rows, granularity]);

  const cards = [
    { label: 'Impressões', value: totals.impressions, rate: null, status: 'entrega', tone: 'neutral' },
    { label: 'Cliques no link', value: totals.linkClicks, rate: totals.ctr, status: 'conversão', tone: 'neutral' },
    { label: 'Instalações', value: totals.installs, rate: totals.clickToInstall, status: 'CORE · trusted', tone: 'core' },
    { label: 'Sessões no app', value: totals.sessions, rate: null, status: 'apoio · directional', tone: 'directional' },
    { label: 'App aberto', value: totals.appOpened, rate: null, status: 'apoio · directional', tone: 'directional' },
    { label: 'StartTrial', value: totals.startTrials, rate: totals.installToTrial, status: 'CORE · trusted', tone: 'core' },
    { label: 'Pedido de cartão', value: null, rate: null, status: 'bloqueado', tone: 'blocked' },
  ];

  const sortedRows = useMemo(() => [...rows].sort((a, b) => {
    const av = sortKey === 'date' ? a.date : Number(a[sortKey] ?? -Infinity); const bv = sortKey === 'date' ? b.date : Number(b[sortKey] ?? -Infinity);
    const result = typeof av === 'string' ? av.localeCompare(String(bv)) : av - Number(bv); return direction === 'asc' ? result : -result;
  }), [rows, sortKey, direction]);

  const changeSort = (key: SortKey) => { if (sortKey === key) setDirection(value => value === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setDirection(key === 'date' ? 'asc' : 'desc'); } };
  const toggleVolume = (key: VolumeKey) => setVolumes(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  const toggleRate = (key: RateKey) => setRates(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  const exportCsv = () => {
    const content = ['Data;Investimento;Impressoes;Cliques no link;Instalacoes;Sessoes;App aberto;StartTrial;CTR;Clique para instalacao;Instalacao para StartTrial', ...rows.map(row => [row.date, row.spend, row.impressions, row.linkClicks, row.installs, row.sessions, row.appOpened, row.startTrials, row.ctr ?? '', row.clickToInstall ?? '', row.installToTrial ?? ''].join(';'))].join('\n');
    const href = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = href; anchor.download = `funil-midia-paga-${since}-${until}.csv`; anchor.click(); URL.revokeObjectURL(href);
  };

  return <div className="min-h-full bg-slate-50 px-4 pb-5 text-slate-800">
    <div className="mx-auto flex max-w-[1780px] flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Análise · Mídia Paga B2C</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Funil de Aquisição · App Install</h1><p className="text-sm text-slate-600">Campanha [B2C] App Install Onboarding Afinz · atribuição Meta.</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados até {lastDate ? parseDate(lastDate).toLocaleDateString('pt-BR') : '—'}</div>
      </header>
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><Info size={15} className="mt-0.5 shrink-0" /><span><strong>Escopo:</strong> resultados atribuídos pela Meta em 7 dias após clique. StartTrial não representa o total do app; CPA de plataforma não é CAC de cartão.</span></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} /> {startDate.toLocaleDateString('pt-BR')} – {endDate.toLocaleDateString('pt-BR')}</p></div><div className="text-right"><p className="text-[10px] uppercase text-slate-400">Investimento</p><p className="font-mono text-lg font-semibold text-slate-950">{money(totals.spend)}</p></div></section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2><p className="mb-3 text-xs text-slate-500">CORE para decisão: instalação → StartTrial. Etapas de apoio diagnosticam entrega e instrumentação.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{cards.map((card, index) => <div key={card.label} className={`rounded-md border px-3 py-2.5 ${card.tone === 'core' ? 'border-cyan-300 bg-cyan-50' : card.tone === 'blocked' ? 'border-red-200 bg-red-50' : card.tone === 'directional' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold">{index + 1}</span><span className={`text-[8px] font-semibold uppercase ${card.tone === 'blocked' ? 'text-red-600' : card.tone === 'core' ? 'text-cyan-700' : 'text-slate-400'}`}>{card.status}</span></div><p className="mt-1.5 text-[11px] font-semibold text-slate-700">{card.label}</p><p className="mt-0.5 font-mono text-lg font-semibold leading-none text-slate-950">{card.value == null ? 'n/d' : fmt(card.value)}</p><p className="mt-1 text-[10px] font-semibold text-cyan-700">{card.rate == null ? card.value == null ? 'Não instrumentado' : 'Volume do período' : pctLabel(card.rate)}</p></div>)}</div>
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 text-[10px] sm:grid-cols-4"><div><span className="text-slate-400">Resultado principal</span><p className="font-semibold">{fmt(totals.startTrials)} StartTrials atribuídos</p></div><div><span className="text-slate-400">Taxa CORE</span><p className="font-semibold">{pctLabel(totals.installToTrial)} instalação → StartTrial</p></div><div><span className="text-slate-400">Eficiência de mídia</span><p className="font-semibold">{totals.startTrials ? money(totals.spend / totals.startTrials) : '—'} por StartTrial</p></div><div><span className="text-slate-400">Lacuna crítica</span><p className="font-semibold text-red-700">SubmitApplication sem instrumentação Meta</p></div></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Volumes absolutos e taxas certificadas no mesmo eixo temporal.</p></div><div className="inline-flex border border-slate-300 text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(item => <button key={item} onClick={() => setGranularity(item)} className={`border-r border-slate-300 px-3 py-1.5 last:border-0 ${granularity === item ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>{item === 'daily' ? 'Diária' : item === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div></div>
        <div className="mt-4 flex flex-wrap items-center border-y border-slate-200 bg-slate-50/60 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Volumes</span>{volumeConfig.map(item => <button key={item.key} onClick={() => toggleVolume(item.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${volumes.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: volumes.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}<button onClick={() => setVolumes([])} className="px-2.5 py-2 font-semibold text-slate-500">Limpar</button></div>
        <div className="flex flex-wrap items-center border-b border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase text-slate-500">Taxas</span>{rateConfig.map(item => <button key={item.key} title={item.formula} onClick={() => toggleRate(item.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${rates.includes(item.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: rates.includes(item.key) ? item.color : '#cbd5e1' }} />{item.label}</button>)}</div>
        <div className="mt-3 h-[390px]">{loading ? <div className="h-full animate-pulse bg-slate-50" /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 40, left: 8, bottom: granularity === 'daily' ? 20 : 4 }} barGap={2} barCategoryGap="22%"><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" height={granularity === 'daily' ? 42 : 30} tick={granularity === 'daily' ? ({ x, y, payload }: any) => { const point = chartData.find(item => item.period === payload.value); return <g transform={`translate(${x},${y})`}><text y={12} textAnchor="middle" fill="#334155" fontSize={10} fontFamily="monospace">{payload.value}</text><text y={26} textAnchor="middle" fill="#94a3b8" fontSize={9}>{point?.weekday}</text></g>; } : { fontSize: 10, fill: '#475569' }} /><YAxis yAxisId="volume" hide={volumes.length === 0} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} /><YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={value => `${value}%`} /><Tooltip contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }} formatter={(value: number, name: string) => [rateConfig.some(item => item.key === name) ? pctLabel(value, 2) : fmt(value), [...volumeConfig, ...rateConfig].find(item => item.key === name)?.label ?? name]} />{volumeConfig.filter(item => volumes.includes(item.key)).map(item => <Bar key={item.key} yAxisId="volume" dataKey={item.key} fill={item.color} maxBarSize={granularity === 'daily' ? 17 : 38} isAnimationActive={false} />)}{rateConfig.filter(item => rates.includes(item.key)).map(item => <Line key={item.key} yAxisId="rate" type="linear" dataKey={item.key} stroke={item.color} strokeWidth={3} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} connectNulls={false} isAnimationActive={false} />)}</ComposedChart></ResponsiveContainer>}</div>
        <p className="text-[10px] text-slate-500">StartTrial atribuído · Meta · 7d click. Sessões e App aberto são eventos de apoio, não conversões causais entre usuários únicos.</p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between p-5"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe diário</h2><p className="text-xs text-slate-500">Volumes, taxas e mudança contra o dia fechado anterior.</p></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div><div className="max-h-[470px] overflow-auto"><table className="w-full min-w-[1120px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr>{([{ key: 'date', label: 'Data' }, { key: 'spend', label: 'Investimento' }, ...volumeConfig, ...rateConfig] as Array<{ key: SortKey; label: string }>).map(column => <th key={column.key} className={`px-3 py-2 ${column.key === 'date' ? 'text-left' : 'text-right'}`}><button onClick={() => changeSort(column.key)} className={`flex items-center gap-1 font-semibold ${column.key === 'date' ? '' : 'ml-auto'}`}>{column.label}<ArrowUpDown size={10} /></button></th>)}</tr></thead><tbody>{sortedRows.map((row, index) => { const originalIndex = rows.findIndex(item => item.date === row.date); const previous = originalIndex > 0 ? rows[originalIndex - 1] : null; return <tr key={row.date} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50/40' : ''}`}><td className="whitespace-nowrap px-3 py-2"><p className="font-mono text-[11px] font-semibold">{shortDate(row.date)}</p><p className="capitalize text-slate-400">{parseDate(row.date).toLocaleDateString('pt-BR', { weekday: 'long' })}</p></td><td className="px-3 py-2 text-right font-mono">{money(row.spend)}</td>{volumeConfig.map(item => { const change = delta(row[item.key], previous?.[item.key] ?? null); return <td key={item.key} className="px-3 py-2 text-right"><p className="font-mono font-semibold">{fmt(row[item.key])}</p><p className={`${change == null ? 'text-slate-400' : change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-700' : 'text-slate-400'} flex items-center justify-end gap-0.5`}>{change == null ? <ArrowRight size={9} /> : change > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}{change == null ? 'sem base' : `${Math.abs(change).toFixed(1).replace('.', ',')}%`}</p></td>; })}{rateConfig.map(item => <td key={item.key} className="px-3 py-2 text-right font-mono font-semibold">{pctLabel(row[item.key], 2)}</td>)}</tr>; })}</tbody></table></div></section>
      <div className="flex items-center gap-2 text-[10px] text-amber-800"><AlertTriangle size={13} /> Pedido de cartão/SubmitApplication permanece bloqueado até instrumentação AppsFlyer → Meta.</div>
    </div>
  </div>;
};
