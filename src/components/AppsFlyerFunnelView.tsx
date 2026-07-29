import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CalendarDays, CheckCircle2, Download, Info, MousePointerClick, Smartphone, Activity as ActivityIcon } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { OnboardingFunnelWorkspace } from './OnboardingFunnelWorkspace';

type Granularity = 'daily' | 'weekly' | 'monthly';
type OriginKey = 'organico' | 'pago' | 'crm' | 'parceiro';
type Row = { date: Date; source: string; origin: OriginKey; installs: number; sessions: number; clicks: number };

const originConfig: Array<{ key: OriginKey; label: string; color: string; help: string }> = [
  { key: 'organico', label: 'Orgânico', color: '#0d9488', help: 'Sem atribuição a fonte paga' },
  { key: 'pago', label: 'Pago', color: '#2563eb', help: 'Meta + Google Ads' },
  { key: 'crm', label: 'CRM', color: '#7c3aed', help: 'WhatsApp, SMS, e-mail, cross-sell e blog próprio' },
  { key: 'parceiro', label: 'Parceiro', color: '#db2777', help: 'Serasa, Acordo Certo e demais parceiros' },
];

// Mapeamento media source (AppsFlyer) -> grupo de origem do GaaS.
const originOf = (source: string): OriginKey => {
  const s = source.toLowerCase();
  if (s === 'organic') return 'organico';
  if (s === 'facebook ads' || s === 'googleadwords_int') return 'pago';
  if (['crm', 'whatsapp', 'sms', 'email', 'push', 'cross_sale', 'blog'].includes(s)) return 'crm';
  return 'parceiro';
};

const formatNumber = (v: number) => Math.round(v).toLocaleString('pt-BR');
const compact = (v: number) => v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : String(Math.round(v));
const percentage = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const pctLabel = (v: number | null, digits = 1) => v == null ? '—' : `${v.toFixed(digits).replace('.', ',')}%`;
const ratioLabel = (v: number | null, digits = 1) => v == null ? '—' : v.toFixed(digits).replace('.', ',');
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDate = (v: string) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const shortDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const shortWeekday = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const delta = (current: number, previous: number) => previous === 0 ? null : (current - previous) / previous * 100;

function parseCsv(text: string): Row[] {
  return text.split(/\r?\n/).slice(1).map(line => line.split(','))
    .filter(c => /^\d{4}-\d{2}-\d{2}$/.test(c[0] || ''))
    .map(c => ({ date: parseDate(c[0]), source: c[1], origin: originOf(c[1]), installs: Number(c[2]) || 0, sessions: Number(c[3]) || 0, clicks: Number(c[4]) || 0 }));
}

type Totals = { installs: number; sessions: number; clicks: number };
const emptyTotals = (): Totals => ({ installs: 0, sessions: 0, clicks: 0 });
const sum = (rows: Row[]): Totals => rows.reduce((a, r) => ({ installs: a.installs + r.installs, sessions: a.sessions + r.sessions, clicks: a.clicks + r.clicks }), emptyTotals());

function periodKey(date: Date, g: Granularity) {
  if (g === 'daily') return iso(date);
  if (g === 'monthly') return iso(date).slice(0, 7);
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(monday);
}

const DeltaBadge = ({ change, unit = '%' }: { change: number | null; unit?: string }) => {
  if (change == null) return <span className="text-[9px] font-semibold text-slate-400">sem base</span>;
  const up = change > 0, down = change < 0;
  return <span className={`flex items-center text-[9px] font-semibold ${up ? 'text-emerald-700' : down ? 'text-red-700' : 'text-slate-400'}`}>
    {up ? <ArrowUp size={10} /> : down ? <ArrowDown size={10} /> : <ArrowRight size={10} />}{Math.abs(change).toFixed(1).replace('.', ',')}{unit} vs. anterior
  </span>;
};

export const AppsFlyerFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => {
  const { startDate, endDate } = usePeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/appsflyer-acquisition-daily.csv`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error('Fonte AppsFlyer indisponível')))
      .then(t => setRows(parseCsv(t))).catch(e => setError(e.message));
  }, []);

  const lastDate = useMemo(() => rows.reduce<Date | null>((max, r) => !max || r.date > max ? r.date : max, null), [rows]);
  const periodStart = useMemo(() => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()), [startDate]);
  const periodEnd = useMemo(() => new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999), [endDate]);
  const current = useMemo(() => rows.filter(r => r.date >= periodStart && r.date <= periodEnd), [rows, periodStart, periodEnd]);
  const previous = useMemo(() => {
    const duration = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1);
    const prevEnd = new Date(periodStart); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - duration + 1); prevStart.setHours(0, 0, 0, 0);
    return rows.filter(r => r.date >= prevStart && r.date <= prevEnd);
  }, [rows, periodStart, periodEnd]);

  const total = useMemo(() => sum(current), [current]);
  const prevTotal = useMemo(() => sum(previous), [previous]);
  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;

  const byOrigin = useMemo(() => originConfig.map(o => {
    const t = sum(current.filter(r => r.origin === o.key));
    return { ...o, ...t, share: percentage(t.installs, total.installs) };
  }), [current, total.installs]);

  const nonOrganic = useMemo(() => total.installs - (byOrigin.find(o => o.key === 'organico')?.installs ?? 0), [total.installs, byOrigin]);

  const bySource = useMemo(() => {
    const map = new Map<string, Totals & { origin: OriginKey }>();
    current.forEach(r => {
      const agg = map.get(r.source) ?? { ...emptyTotals(), origin: r.origin };
      agg.installs += r.installs; agg.sessions += r.sessions; agg.clicks += r.clicks;
      map.set(r.source, agg);
    });
    return [...map.entries()].map(([source, t]) => ({ source, ...t, clickToInstall: percentage(t.installs, t.clicks), sessionsPerInstall: t.installs > 0 ? t.sessions / t.installs : null }))
      .sort((a, b) => b.installs - a.installs);
  }, [current]);

  const chartData = useMemo(() => {
    const groups = new Map<string, Row[]>();
    current.forEach(r => { const k = periodKey(r.date, granularity); groups.set(k, [...(groups.get(k) ?? []), r]); });
    const limit = granularity === 'daily' ? 60 : granularity === 'weekly' ? 16 : 12;
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-limit).map(([key, values]) => {
      const first = values[0].date;
      const label = granularity === 'daily' ? shortDate(first) : granularity === 'weekly' ? `sem. ${shortDate(first)}` : first.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const perOrigin = Object.fromEntries(originConfig.map(o => [o.key, values.filter(r => r.origin === o.key).reduce((s, r) => s + r.installs, 0)]));
      const clicks = values.reduce((s, r) => s + r.clicks, 0);
      return { key, period: label, weekday: granularity === 'daily' ? shortWeekday(first) : '', clicks, ...perOrigin };
    });
  }, [current, granularity]);

  const stages = [
    { key: 'clicks', label: 'Cliques', icon: MousePointerClick, value: total.clicks, prev: prevTotal.clicks, note: 'Somente origens rastreadas (paga + CRM + parceiro). Orgânico não gera clique.' },
    { key: 'installs', label: 'Installs', icon: Smartphone, value: total.installs, prev: prevTotal.installs, note: 'Todas as origens, incluindo orgânico.' },
    { key: 'sessions', label: 'Sessões', icon: ActivityIcon, value: total.sessions, prev: prevTotal.sessions, note: 'Engajamento pós-install no período.' },
  ] as const;

  const clickToInstall = percentage(total.installs - (byOrigin.find(o => o.key === 'organico')?.installs ?? 0), total.clicks);
  const prevClickToInstall = percentage(sum(previous.filter(r => r.origin !== 'organico')).installs, prevTotal.clicks);
  const sessionsPerInstall = total.installs > 0 ? total.sessions / total.installs : null;
  const prevSessionsPerInstall = prevTotal.installs > 0 ? prevTotal.sessions / prevTotal.installs : null;
  const nonOrganicShare = percentage(nonOrganic, total.installs);

  const exportCsv = () => {
    const header = ['Origem', 'Media source', 'Installs', 'Sessões', 'Cliques', 'Clique→Install', 'Sessões/Install'];
    const csv = [header.join(';'), ...bySource.map(s => [originConfig.find(o => o.key === s.origin)?.label ?? s.origin, s.source, s.installs, s.sessions, s.clicks, s.clickToInstall == null ? '' : s.clickToInstall.toFixed(1), s.sessionsPerInstall == null ? '' : s.sessionsPerInstall.toFixed(1)].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `funil-appsflyer-${iso(periodStart)}-${iso(periodEnd)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
    <div className="mx-auto max-w-[1780px] space-y-4">
      <OnboardingFunnelWorkspace
        navigation={navigation}
        sidebarMeta={<>
          <div className="grid gap-3 sm:grid-cols-2 min-[1180px]:grid-cols-1">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200/40 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900"><CheckCircle2 size={15} /> Dados até {lastDate ? lastDate.toLocaleDateString('pt-BR') : '—'}</div>
            <div className="flex items-start gap-2 rounded-lg border border-blue-200/50 bg-blue-50 px-3 py-2 text-[10px] leading-relaxed text-blue-950"><Info size={14} className="mt-0.5 shrink-0" /><span><strong>Escopo:</strong> topo de funil (install → sessão) por origem. Onboarding e emissão por template dependem de raw data (Pull API / Data Locker).</span></div>
          </div>
          {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
          <div className="mt-4 grid gap-x-4 gap-y-3 text-[10px] sm:grid-cols-2 min-[1180px]:grid-cols-1">
            <div><span className="text-white/55">Não-orgânico</span><p className="font-semibold text-white">{pctLabel(nonOrganicShare)} dos installs</p></div>
            <div><span className="text-white/55">Clique→Install (rastreado)</span><p className="font-semibold text-white">{pctLabel(clickToInstall)}</p></div>
            <div><span className="text-white/55">Sessões por install</span><p className="font-semibold text-white">{ratioLabel(sessionsPerInstall)}</p></div>
            <div><span className="text-white/55">Origem líder (não-org.)</span><p className="font-semibold text-white">{[...byOrigin].filter(o => o.key !== 'organico').sort((a, b) => b.installs - a.installs)[0]?.label ?? '—'}</p></div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-[10px] text-amber-200"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> Clique = subconjunto que passou por OneLink rumo ao app — não é a taxa de clique cheia do CRM.</p>
        </>}
      >
        <section className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={16} /> {periodLabel}</p></div>
          <p className="text-[10px] text-slate-500">Fonte: AppsFlyer · apps B2C Afinz (Android + iOS)</p>
        </section>

        {/* Funil de topo */}
        <section className="px-4 pb-3 pt-4">
          <h2 className="text-lg font-semibold text-slate-950">Funil de topo</h2>
          <p className="mb-3 text-xs text-slate-500">Cliques rastreados → installs → sessões, com comparação contra a janela anterior.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {stages.map((s, i) => { const Icon = s.icon; return <div key={s.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center justify-between"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600"><Icon size={13} /></span><span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">etapa {i + 1}</span></div>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{s.label}</p>
              <div className="mt-0.5 flex items-end justify-between gap-2"><p className="font-mono text-2xl font-semibold leading-none text-slate-950">{formatNumber(s.value)}</p></div>
              <div className="mt-1"><DeltaBadge change={delta(s.value, s.prev)} /></div>
              <p className="mt-1.5 text-[9px] leading-tight text-slate-400">{s.note}</p>
            </div>; })}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-semibold text-slate-500">Clique → Install <span className="text-slate-400">(rastreado)</span></p><div className="mt-0.5 flex items-end justify-between"><p className="font-mono text-lg font-semibold text-cyan-700">{pctLabel(clickToInstall)}</p><DeltaBadge change={clickToInstall != null && prevClickToInstall != null ? clickToInstall - prevClickToInstall : null} unit=" p.p." /></div></div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-semibold text-slate-500">Sessões por install</p><div className="mt-0.5 flex items-end justify-between"><p className="font-mono text-lg font-semibold text-cyan-700">{ratioLabel(sessionsPerInstall)}</p><DeltaBadge change={sessionsPerInstall != null && prevSessionsPerInstall != null ? delta(sessionsPerInstall, prevSessionsPerInstall) : null} /></div></div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-semibold text-slate-500">Installs não-orgânicos</p><div className="mt-0.5 flex items-end justify-between"><p className="font-mono text-lg font-semibold text-cyan-700">{formatNumber(nonOrganic)}</p><span className="text-[10px] font-semibold text-slate-400">{pctLabel(nonOrganicShare)}</span></div></div>
          </div>
        </section>

        {/* Split de origem */}
        <section className="border-t border-slate-200 px-4 pb-4 pt-3">
          <h2 className="text-lg font-semibold text-slate-950">Installs por origem</h2>
          <p className="mb-3 text-xs text-slate-500">Orgânico, pago, CRM e parceiro na mesma régua.</p>
          <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {byOrigin.filter(o => o.installs > 0).map(o => <div key={o.key} title={`${o.label}: ${pctLabel(o.share)}`} style={{ width: `${o.share ?? 0}%`, backgroundColor: o.color }} />)}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {byOrigin.map(o => <div key={o.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: o.color }} /><span className="text-[11px] font-semibold text-slate-700">{o.label}</span></div>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-950">{formatNumber(o.installs)}</p>
              <p className="text-[10px] font-semibold text-cyan-700">{pctLabel(o.share)} dos installs{o.clicks > 0 ? ` · ${formatNumber(o.clicks)} cliques` : ''}</p>
              <p className="mt-0.5 text-[9px] leading-tight text-slate-400">{o.help}</p>
            </div>)}
          </div>
        </section>

        {/* Evolução */}
        <section className="border-t border-slate-200 px-4 pb-4 pt-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-950">Evolução</h2><p className="text-xs text-slate-500">Installs empilhados por origem · linha = cliques rastreados (eixo direito).</p></div>
            <div className="inline-flex border border-slate-300 bg-white text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(g => <button key={g} onClick={() => setGranularity(g)} aria-pressed={granularity === g} className={`border-r border-slate-300 px-3 py-1.5 last:border-r-0 ${granularity === g ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{g === 'daily' ? 'Diária' : g === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div>
          </div>
          <div className="mt-2 h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 16, right: 42, left: 8, bottom: granularity === 'daily' ? 18 : 4 }} barCategoryGap="20%">
                <CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" />
                <XAxis dataKey="period" height={granularity === 'daily' ? 40 : 28} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} interval="preserveStartEnd" tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} />
                <YAxis yAxisId="installs" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={compact} />
                <YAxis yAxisId="clicks" orientation="right" domain={[0, 'auto']} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={compact} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'ui-monospace, monospace' }} labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }} formatter={(value: number, name: string) => [formatNumber(value), name === 'clicks' ? 'Cliques' : originConfig.find(o => o.key === name)?.label ?? name]} />
                {originConfig.map(o => <Bar key={o.key} yAxisId="installs" dataKey={o.key} name={o.key} stackId="origin" fill={o.color} maxBarSize={granularity === 'daily' ? 20 : 40} isAnimationActive={false} />)}
                <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="clicks" stroke="#0891b2" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            {originConfig.map(o => <span key={o.key} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: o.color }} />{o.label}</span>)}
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm" style={{ backgroundColor: '#0891b2' }} />Cliques (dir.)</span>
          </div>
        </section>
      </OnboardingFunnelWorkspace>

      {/* Detalhe por origem/canal */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h2 className="text-lg font-semibold text-slate-950">Detalhe por media source · {periodLabel}</h2><p className="text-xs text-slate-500">Cada origem do AppsFlyer, com clique → install e intensidade de sessão. Os canais de CRM (WhatsApp, SMS, crm) são o que hoje não temos no framework.</p></div>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="w-full min-w-[860px] text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left font-semibold">Media source</th>
                <th className="px-3 py-2 text-left font-semibold">Origem</th>
                <th className="px-3 py-2 text-right font-semibold">Installs</th>
                <th className="px-3 py-2 text-right font-semibold">Cliques</th>
                <th className="px-3 py-2 text-right font-semibold">Clique→Install</th>
                <th className="px-3 py-2 text-right font-semibold">Sessões</th>
                <th className="px-3 py-2 text-right font-semibold">Sessões/Install</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((s, i) => { const o = originConfig.find(x => x.key === s.origin); return <tr key={s.source} className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/40' : ''}`}>
                <td className="sticky left-0 z-[5] whitespace-nowrap bg-white px-3 py-2 font-mono font-semibold text-slate-800">{s.source}</td>
                <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: o?.color }} /><span className="text-slate-600">{o?.label}</span></span></td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">{formatNumber(s.installs)}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-700">{s.clicks > 0 ? formatNumber(s.clicks) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-cyan-700">{pctLabel(s.clickToInstall)}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNumber(s.sessions)}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-700">{ratioLabel(s.sessionsPerInstall)}</td>
              </tr>; })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>;
};
