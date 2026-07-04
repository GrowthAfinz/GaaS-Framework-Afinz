import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BarChart3, Flame, Gauge, LayoutGrid,
  Link2, ListTree, Loader2, Pencil, Rows3, Route, Search, Send, Users2, X, Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../../../contexts/PeriodContext';
import { useAppStore } from '../../../store/useAppStore';
import { useTemplatePerformance, type PerformancePrevTotals, type TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import type { ActivityRow } from '../../../types/activity';
import { CommunicationDetailModal } from '../CommunicationDetailModal';
import { ChannelPreview, ChannelThumb } from './ChannelPreview';
import {
  CHANNELS, CHANNEL_ORDER, DIAG, type ChannelKey, type ScoredTemplate, type Tone,
  buColor, channelKeyOf, channelStats, contextLabel, dispatchTimeline, facetPeriodLabel, fmt, perfTotals,
  scoreTemplate, scoreTone, searchBlob, suggestedActions,
} from './perfModel';

type ViewMode = 'overview' | 'gallery' | 'table';

const TONE: Record<Tone | 'info', { chip: string; glyph: string; fill: string; solid: string }> = {
  good: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', glyph: 'bg-emerald-600', fill: 'bg-emerald-500', solid: '#15803d' },
  warn: { chip: 'bg-amber-50 text-amber-700 ring-amber-200', glyph: 'bg-amber-500', fill: 'bg-amber-500', solid: '#b45309' },
  bad:  { chip: 'bg-rose-50 text-rose-700 ring-rose-100', glyph: 'bg-rose-600', fill: 'bg-rose-500', solid: '#b91c1c' },
  info: { chip: 'bg-indigo-50 text-indigo-700 ring-indigo-100', glyph: 'bg-indigo-600', fill: 'bg-indigo-500', solid: '#4338ca' },
  na:   { chip: 'bg-slate-100 text-slate-500 ring-slate-200', glyph: 'bg-slate-400', fill: 'bg-slate-300', solid: '#94a3b8' },
};

const STATUS_DOT: Record<string, string> = { active: 'bg-emerald-500', paused: 'bg-amber-500', draft: 'bg-slate-400' };
const STATUS_LABEL: Record<string, string> = { active: 'No ar', paused: 'Pausado', draft: 'Rascunho' };

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const ChannelTag: React.FC<{ channel: string; soft?: boolean }> = ({ channel, soft }) => {
  const ch = CHANNELS[channelKeyOf(channel)];
  if (soft) return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: ch.dark, background: ch.tint }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ch.color }} />{ch.label}
    </span>
  );
  return <span className="inline-flex items-center rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white" style={{ background: ch.color }}>{ch.short}</span>;
};

const BuChip: React.FC<{ bu?: string | null }> = ({ bu }) => {
  if (!bu) return null;
  return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold text-white" style={{ background: buColor(bu) }}>{bu}</span>;
};

const MetaChip: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <span title={title} className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{children}</span>
);

/** ponto de status (sem o texto "No ar") */
const StatusDot: React.FC<{ status: string; withLabel?: boolean }> = ({ status, withLabel }) => {
  const dot = STATUS_DOT[status] ?? 'bg-slate-400';
  const label = STATUS_LABEL[status] ?? status;
  if (status === 'active' && !withLabel) return <span className={`inline-block h-2 w-2 rounded-full ${dot}`} title={label} />;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
      <span className={`h-2 w-2 rounded-full ${dot}`} />{label}
    </span>
  );
};

const ScoreBadge: React.FC<{ score: number | null; sm?: boolean }> = ({ score, sm }) => {
  const t = TONE[scoreTone(score)];
  return (
    <span className={`inline-flex items-baseline gap-0.5 rounded-lg font-bold tabular-nums ring-1 ${t.chip} ${sm ? 'px-1.5 py-0.5 text-[13px]' : 'px-2 py-1 text-sm'}`}>
      {score == null ? '—' : score}<small className="text-[9px] font-bold opacity-60">/100</small>
    </span>
  );
};

const ScoreRing: React.FC<{ score: number | null; size?: number }> = ({ score, size = 52 }) => {
  const solid = TONE[scoreTone(score)].solid;
  const r = (size - 6) / 2, c = 2 * Math.PI * r, off = c * (1 - (score ?? 0) / 100);
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f5" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={solid} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="text-[15px] font-bold tabular-nums" style={{ color: solid }}>{score == null ? '—' : score}</span>
    </div>
  );
};

const DiagBadge: React.FC<{ id: string }> = ({ id }) => {
  const d = DIAG[id]; if (!d) return null;
  const t = TONE[d.tone];
  const glyph = d.tone === 'good' ? '↑' : d.tone === 'bad' ? '!' : d.tone === 'info' ? 'i' : '~';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${t.chip}`} title={d.hint}>
      <span className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] font-bold text-white ${t.glyph}`}>{glyph}</span>{d.label}
    </span>
  );
};

const DiagLine: React.FC<{ id: string }> = ({ id }) => {
  const d = DIAG[id]; if (!d) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <DiagBadge id={id} /><span className="text-xs leading-snug text-slate-600">{d.hint}</span>
    </div>
  );
};

const Sparkline: React.FC<{ series: number[]; color: string; w?: number; h?: number }> = ({ series, color, w = 84, h = 24 }) => {
  const pts = series.length <= 1 ? [0, series[0] ?? 0] : series;
  const max = Math.max(...pts, 1);
  const step = w / Math.max(pts.length - 1, 1);
  const xy = pts.map((p, i) => [i * step, h - (p / max) * (h - 4) - 2] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {xy.length > 0 && <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.2" fill={color} />}
    </svg>
  );
};

const signatureMetric = (t: ScoredTemplate) => t.channelKey === 'sms'
  ? { v: fmt.pctFrac(t.ctr, 1), l: 'clique' }
  : { v: fmt.pctFrac(t.taxaAbertura, t.taxaAbertura < 0.1 ? 1 : 0), l: 'abertura' };

const first = (arr: string[]) => arr[0] ?? null;
const plusN = (arr: string[]) => (arr.length > 1 ? ` +${arr.length - 1}` : '');

/** chips de referência (segmento · campanha · safra · período) reutilizados nas views */
const RefChips: React.FC<{ t: ScoredTemplate }> = ({ t }) => {
  const f = t.facets;
  const seg = first(f.segmentos), jor = first(f.jornadas), saf = first(f.safras), per = facetPeriodLabel(f);
  return (
    <div className="flex flex-wrap gap-1.5">
      <BuChip bu={buOf(t)} />
      {seg && <MetaChip title={f.segmentos.join(' · ')}>{seg}{plusN(f.segmentos)}</MetaChip>}
      {jor && <MetaChip title={f.jornadas.join(' · ')}><Route size={11} />{jor}{plusN(f.jornadas)}</MetaChip>}
      {saf && <MetaChip title={f.safras.join(' · ')}>{saf}</MetaChip>}
      {per && <MetaChip>{per}</MetaChip>}
    </div>
  );
};

// ── GRÁFICOS (área temporal reutilizável) ─────────────────────────────────────
type MetricKind = 'int' | 'pct' | 'brl';
const tlFmt = (v: number, kind: MetricKind) =>
  kind === 'pct' ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: v < 0.1 ? 3 : 2 })}%`
    : kind === 'brl' ? fmt.brl(v)
      : fmt.int(Math.round(v));

const MetricArea: React.FC<{ data: { label: string; val: number }[]; color: string; kind: MetricKind; height?: number }> = ({ data, color, kind, height = 180 }) => {
  const gid = `perfArea-${color.replace('#', '')}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis width={48} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => tlFmt(Number(v), kind)} />
          <Tooltip formatter={(v: number | string) => [tlFmt(Number(v), kind), '']} labelFormatter={(l) => `Dia ${l}`} contentStyle={{ borderRadius: 12, border: '1px solid #e7ebf0', fontSize: 12 }} />
          <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2.4} fill={`url(#${gid})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const MetricTabs: React.FC<{ options: readonly { key: string; label: string }[]; value: string; onChange: (k: string) => void }> = ({ options, value, onChange }) => (
  <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
    {options.map((o) => (
      <button key={o.key} onClick={() => onChange(o.key)} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${value === o.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>{o.label}</button>
    ))}
  </div>
);

// KPIs agregados no período (Visão Geral)
const KPI_METRICS = [
  { key: 'aberturas', label: 'Aberturas', kind: 'int' as const, color: '#0ea5e9' },
  { key: 'cliques', label: 'Cliques', kind: 'int' as const, color: '#6366f1' },
  { key: 'cartoes', label: 'Cartões', kind: 'int' as const, color: '#00838a' },
  { key: 'base', label: 'Base', kind: 'int' as const, color: '#94a3b8' },
];
const KpiEvolution: React.FC<{ items: ScoredTemplate[] }> = ({ items }) => {
  const [mk, setMk] = useState('cartoes');
  const cfg = KPI_METRICS.find((m) => m.key === mk) ?? KPI_METRICS[2];
  const data = useMemo(() => {
    const byDate = new Map<string, { label: string; aberturas: number; cliques: number; cartoes: number; base: number }>();
    for (const t of items) for (const p of t.timeline) {
      if (p.date === 'sem-data') continue;
      const cur = byDate.get(p.date) ?? { label: p.label, aberturas: 0, cliques: 0, cartoes: 0, base: 0 };
      cur.aberturas += p.aberturas; cur.cliques += p.cliques; cur.cartoes += p.cartoes; cur.base += p.baseEnviada;
      byDate.set(p.date, cur);
    }
    return Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => ({ label: v.label, val: (v as unknown as Record<string, number>)[mk] }));
  }, [items, mk]);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-[18px] py-[15px]">
        <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><BarChart3 size={15} /></span>Evolução no período</div>
        <span className="text-xs font-semibold text-slate-400">soma diária no período</span>
      </div>
      <div className="p-[18px]">
        <MetricTabs options={KPI_METRICS} value={mk} onChange={setMk} />
        {data.length === 0 ? <div className="flex h-44 items-center justify-center text-sm text-slate-400">Sem série no período.</div> : <MetricArea data={data} color={cfg.color} kind={cfg.kind} height={200} />}
      </div>
    </div>
  );
};

// linha do tempo de um template (Drawer)
const TL_METRICS = [
  { key: 'baseEnviada', label: 'Base', kind: 'int' as const },
  { key: 'aberturas', label: 'Aberturas', kind: 'int' as const },
  { key: 'cliques', label: 'Cliques', kind: 'int' as const },
  { key: 'cartoes', label: 'Cartões', kind: 'int' as const },
  { key: 'ctr', label: 'CTR', kind: 'pct' as const },
  { key: 'taxaConversao', label: 'Conv.', kind: 'pct' as const },
  { key: 'cacEfetivo', label: 'CAC', kind: 'brl' as const },
];
const DrawerTimeline: React.FC<{ t: ScoredTemplate }> = ({ t }) => {
  const [mk, setMk] = useState('cartoes');
  const m = TL_METRICS.find((x) => x.key === mk) ?? TL_METRICS[3];
  const color = CHANNELS[t.channelKey].color;
  const data = useMemo(() => t.timeline.filter((p) => p.date !== 'sem-data').map((p) => {
    const raw = Number((p as unknown as Record<string, number>)[m.key] ?? 0);
    return { label: p.label, val: m.kind === 'pct' ? raw * 100 : raw };
  }), [t, m.key, m.kind]);
  return (
    <>
      <MetricTabs options={TL_METRICS} value={mk} onChange={setMk} />
      {data.length === 0 ? <div className="flex h-40 items-center justify-center text-sm text-slate-400">Sem série no período.</div> : <MetricArea data={data} color={color} kind={m.kind} height={180} />}
    </>
  );
};

// ── VISÃO GERAL ───────────────────────────────────────────────────────────────
/** Delta vs. período anterior de mesma duração. Sem baseline → não renderiza. */
const Delta: React.FC<{ cur: number; prev: number | null | undefined; goodWhenUp?: boolean }> = ({ cur, prev, goodWhenUp = true }) => {
  if (prev == null || prev <= 0) return null;
  const pct = (cur - prev) / prev;
  if (!Number.isFinite(pct)) return null;
  const up = pct >= 0;
  const good = up === goodWhenUp;
  return (
    <span
      className={`ml-2 inline-flex items-center gap-0.5 align-middle text-[12px] font-bold tabular-nums ${good ? 'text-emerald-600' : 'text-rose-600'}`}
      title="vs. período anterior de mesma duração"
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(pct * 100).toFixed(0)}%
    </span>
  );
};

const GCard: React.FC<{ label: string; value: React.ReactNode; sub: React.ReactNode; icon: React.ReactNode; delta?: React.ReactNode }> = ({ label, value, sub, icon, delta }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500">{icon}</span>
    </div>
    <div className="text-[30px] font-bold leading-none tracking-tight tabular-nums text-slate-900">{value}{delta}</div>
    <div className="mt-2 text-xs leading-snug text-slate-500">{sub}</div>
  </div>
);

const Overview: React.FC<{ items: ScoredTemplate[]; prev?: PerformancePrevTotals | null; onOpen: (t: ScoredTemplate) => void }> = ({ items, prev, onOpen }) => {
  const stats = useMemo(() => channelStats(items), [items]);
  const totals = useMemo(() => perfTotals(items, stats), [items, stats]);
  const timeline = useMemo(() => dispatchTimeline(items), [items]);
  const champions = useMemo(() => [...items].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)).slice(0, 5), [items]);
  const actions = useMemo(() => suggestedActions(items), [items]);
  const champion = champions[0];
  if (!champion) return null;

  const engaj = totals.base > 0 ? totals.aberturas / totals.base : 0;
  const engajPrev = prev && prev.baseEnviada > 0 ? prev.aberturas / prev.baseEnviada : null;
  const maxStack = Math.max(...timeline.map((d) => d.email + d.whatsapp + d.push + d.sms), 1);
  const maxDisparos = Math.max(...CHANNEL_ORDER.map((ch) => stats[ch].disparos), 1);

  // Narrativa de abertura (Padrão → Impacto → Ação), no padrão da skill de produto.
  const topChannel = CHANNEL_ORDER.reduce((a, b) => (stats[b].disparos > stats[a].disparos ? b : a), CHANNEL_ORDER[0]);
  const firstAction = actions[0];
  const narrative = [
    `${CHANNELS[topChannel].label} concentra ${stats[topChannel].disparos} de ${totals.disparos} disparos no período.`,
    `A peça campeã é ${champion.template.template_id} (score ${champion.score ?? '—'}).`,
    firstAction ? `Próximo passo: ${firstAction.title.toLowerCase()} — ${firstAction.item.template.template_id}.` : null,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-5">
      {/* narrativa do período */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan-600 text-white"><Zap size={13} /></span>
        <p className="text-[13px] leading-snug text-slate-700">{narrative}</p>
      </div>

      {/* cockpit */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <button onClick={() => onOpen(champion)} className="rounded-2xl border border-transparent bg-gradient-to-br from-[#063b3d] via-[#0a5f63] to-[#00838a] p-4 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-white/75">Peça campeã</span>
            <Flame size={15} className="text-white/80" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-white/10 ring-4 ring-white/10"><span className="text-lg font-bold">{champion.score ?? '—'}</span></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13px] font-bold"><ChannelTag channel={champion.template.channel} /><span className="truncate">{champion.template.template_id}</span></div>
              <div className="mt-1 truncate text-[11px] text-white/80">{contextLabel(champion)}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-white/70">Maior score de conteúdo do período</div>
        </button>
        <GCard label="Disparos no período" value={fmt.int(totals.disparos)} delta={<Delta cur={totals.disparos} prev={prev?.executions} />} icon={<Send size={15} />} sub={<span><b className="text-slate-800">{totals.templates}</b> templates · {totals.realChannels} de 4 canais com dado</span>} />
        <GCard label="Base acionada" value={fmt.k(totals.base)} delta={<Delta cur={totals.base} prev={prev?.baseEnviada} />} icon={<Users2 size={15} />} sub={<span>Alcance somado dos disparos no período</span>} />
        <GCard label="Engajamento médio" value={fmt.pctFrac(engaj, 1)} delta={<Delta cur={engaj} prev={engajPrev} />} icon={<Gauge size={15} />} sub={<span>WhatsApp <b className="text-slate-800">{fmt.pctFrac(stats.whatsapp.txAbertura, 0)}</b> · E-mail <b className="text-slate-800">{fmt.pctFrac(stats.email.txAbertura, 0)}</b> de abertura</span>} />
      </div>

      {/* volume + ações */}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card title="Volume de disparos" subtitle="execuções por dia" icon={<BarChart3 size={15} />}>
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Sem disparos datados no período.</p>
          ) : (
            <>
              <div className="flex h-[120px] items-end gap-1.5 pt-1">
                {timeline.map((d) => {
                  const total = d.email + d.whatsapp + d.push + d.sms;
                  return (
                    <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.dia} · ${total} disparos`}>
                      <div className="flex w-full max-w-[24px] flex-col-reverse overflow-hidden rounded-t-[5px]" style={{ height: `${(total / maxStack) * 100}%`, minHeight: total ? 3 : 0 }}>
                        {CHANNEL_ORDER.map((ch) => d[ch] > 0 && <div key={ch} style={{ flex: d[ch], background: CHANNELS[ch].color }} />)}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400">{d.dia}</span>
                    </div>
                  );
                })}
              </div>
              <div className="my-3 flex flex-wrap gap-4">
                {CHANNEL_ORDER.map((ch) => (
                  <span key={ch} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600"><span className="h-2 w-2 rounded-[3px]" style={{ background: CHANNELS[ch].color }} />{CHANNELS[ch].label}</span>
                ))}
              </div>
              <div className="mt-2 border-t border-slate-100">
                {CHANNEL_ORDER.map((ch) => {
                  const s = stats[ch];
                  return (
                    <div key={ch} className="grid grid-cols-[104px_1fr_auto_auto] items-center gap-3 border-t border-slate-100 py-2.5 first:border-t-0">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700"><span className="h-2 w-2 rounded-full" style={{ background: CHANNELS[ch].color }} />{CHANNELS[ch].label}</div>
                      <div className="h-2 overflow-hidden rounded-[5px] bg-slate-100"><div className="h-full rounded-[5px]" style={{ width: `${Math.max(4, (s.disparos / maxDisparos) * 100)}%`, background: CHANNELS[ch].color }} /></div>
                      <div className="whitespace-nowrap text-xs tabular-nums text-slate-600"><b className="text-sm font-bold text-slate-900">{s.disparos}</b> disparos</div>
                      <div className="whitespace-nowrap text-[10.5px] text-slate-400">{s.templates} {s.templates === 1 ? 'template' : 'templates'}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card title="Ações sugeridas" subtitle={`${actions.length} prioridades`} icon={<Zap size={15} />}>
          {actions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Sem prioridades claras neste recorte.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {actions.map((a) => {
                const t = TONE[a.tone];
                return (
                  <div key={`${a.tone}-${a.item.template.template_id}`} className={`flex gap-3 rounded-xl border px-3 py-3 ${a.tone === 'good' ? 'border-emerald-100 bg-emerald-50' : a.tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-rose-100 bg-rose-50'}`}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${t.glyph}`}>{a.tone === 'good' ? <Flame size={14} /> : a.tone === 'warn' ? <Link2 size={14} /> : <AlertTriangle size={14} />}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-slate-900">{a.title}</div>
                      <div className="mt-0.5 text-xs leading-snug text-slate-600">{a.text}</div>
                    </div>
                    <button onClick={() => onOpen(a.item)} className="self-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-slate-300">Ver peça →</button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* champions */}
      <Card title="Templates de maior sucesso" subtitle="score relativo ao teto de cada canal" icon={<Flame size={15} />} noPad>
        <div>
          {champions.map((t, i) => {
            const sig = signatureMetric(t);
            return (
              <button key={t.template.template_id} onClick={() => onOpen(t)} className="grid w-full grid-cols-[24px_42px_1fr_auto_auto_minmax(140px,180px)_16px] items-center gap-3.5 border-t border-slate-100 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-slate-50">
                <span className="text-center text-sm font-bold tabular-nums text-slate-300">{i + 1}</span>
                <ChannelThumb item={t} w={42} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><ChannelTag channel={t.template.channel} /><span className="truncate text-[13px] font-bold text-slate-800">{t.template.template_id}</span></div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-500">{contextLabel(t)}</div>
                  <div className="mt-1.5 flex">{t.diagnoses.filter((d) => d !== 'custo_parcial').slice(0, 1).map((d) => <DiagBadge key={d} id={d} />)}</div>
                </div>
                <div className="text-right"><div className="text-[15px] font-bold leading-none tabular-nums text-slate-900">{sig.v}</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{sig.l}</div></div>
                <div className="text-right"><div className="text-[15px] font-bold leading-none tabular-nums text-slate-400">{fmt.int(t.cartoes)}</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">cartões</div></div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-[5px] bg-slate-100"><div className={`h-full rounded-[5px] ${TONE[t.tone].fill}`} style={{ width: `${t.score ?? 0}%` }} /></div>
                  <ScoreBadge score={t.score} sm />
                </div>
                <ArrowRight size={15} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const Card: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; noPad?: boolean; children: React.ReactNode }> = ({ title, subtitle, icon, noPad, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-[18px] py-[15px]">
      <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-50 text-cyan-700">{icon}</span>{title}</div>
      {subtitle && <span className="text-xs font-semibold text-slate-400">{subtitle}</span>}
    </div>
    <div className={noPad ? '' : 'p-[18px]'}>{children}</div>
  </div>
);

// ── GALERIA ─────────────────────────────────────────────────────────────────
const GalCard: React.FC<{ t: ScoredTemplate; onOpen: () => void }> = ({ t, onOpen }) => {
  const ch = CHANNELS[t.channelKey];
  const sig = signatureMetric(t);
  return (
    <button onClick={onOpen} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-xl">
      <div className="relative flex h-[248px] justify-center overflow-hidden border-b border-slate-100 px-4 pt-4" style={{ background: `linear-gradient(170deg, ${ch.tint}, #fff 78%)` }}>
        <div className="absolute right-3 top-3 z-10"><ChannelTag channel={t.template.channel} /></div>
        <ChannelPreview item={t} width={280} height={228} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2"><StatusDot status={t.template.status} /><span className="truncate text-[13px] font-bold text-slate-800">{t.template.template_id}</span></span>
          <ScoreBadge score={t.score} sm />
        </div>
        <RefChips t={t} />
        <div className="grid grid-cols-4 gap-1.5">
          <KTile v={sig.v} l={sig.l} />
          <KTile v={fmt.pctFrac(t.ctr, 2)} l="CTR" />
          <KTile v={fmt.int(t.cartoes)} l="cartões" accent />
          <KTile v={t.cacEfetivo > 0 ? fmt.brl(t.cacEfetivo) : '—'} l={t.custoEstimado ? 'CAC est.' : 'CAC'} />
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">{t.diagnoses.filter((d) => d !== 'custo_parcial').slice(0, 2).map((d) => <DiagBadge key={d} id={d} />)}</div>
      </div>
    </button>
  );
};

const KTile: React.FC<{ v: string; l: string; accent?: boolean }> = ({ v, l, accent }) => (
  <div className={`rounded-lg border px-1 py-2 text-center ${accent ? 'border-cyan-100 bg-cyan-50' : 'border-slate-100 bg-slate-50'}`}>
    <div className={`text-sm font-bold leading-none tabular-nums ${accent ? 'text-cyan-700' : 'text-slate-900'}`}>{v}</div>
    <div className="mt-1 text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{l}</div>
  </div>
);

// ── TABELA ─────────────────────────────────────────────────────────────────
type SortKey = 'taxaAbertura' | 'ctr' | 'taxaConversao' | 'cartoes' | 'cacEfetivo' | 'score';
const COLS: { key: SortKey; label: string }[] = [
  { key: 'taxaAbertura', label: 'Abertura' }, { key: 'ctr', label: 'Clique' }, { key: 'taxaConversao', label: 'Conversão' },
  { key: 'cartoes', label: 'Cartões' }, { key: 'cacEfetivo', label: 'CAC' }, { key: 'score', label: 'Score' },
];

const TableView: React.FC<{ items: ScoredTemplate[]; onOpen: (t: ScoredTemplate) => void }> = ({ items, onOpen }) => {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'score', dir: -1 });
  const sorted = useMemo(() => {
    const get = (t: ScoredTemplate) => sort.key === 'score' ? (t.score ?? -1) : Number(t[sort.key] ?? -1);
    return [...items].sort((a, b) => (get(a) - get(b)) * sort.dir);
  }, [items, sort]);
  const setS = (key: SortKey) => setSort((s) => s.key === key ? { key, dir: (s.dir === -1 ? 1 : -1) as 1 | -1 } : { key, dir: -1 });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-2.5 py-2.5">Template / criativo</th>
              <th className="px-2.5 py-2.5">Contexto</th>
              {COLS.map((c) => (
                <th key={c.key} className="cursor-pointer select-none px-2.5 py-2.5 text-right hover:text-cyan-700" onClick={() => setS(c.key)}>
                  <span className={`inline-flex items-center gap-1 ${sort.key === c.key ? 'text-cyan-700' : ''}`}>{c.label}{sort.key === c.key && (sort.dir === -1 ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}</span>
                </th>
              ))}
              <th className="px-2.5 py-2.5 text-center">Tendência</th>
              <th className="px-2.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const seg = first(t.facets.segmentos), jor = first(t.facets.jornadas), per = facetPeriodLabel(t.facets);
              return (
                <tr key={t.template.template_id} onClick={() => onOpen(t)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50">
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <ChannelThumb item={t} w={34} h={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5"><StatusDot status={t.template.status} /><ChannelTag channel={t.template.channel} /><span className="truncate text-[12px] font-bold text-slate-800">{t.template.template_id}</span></div>
                        <div className="mt-0.5 max-w-[240px] truncate text-[10.5px] text-slate-400">{String((t.template.metadata as Record<string, unknown> | undefined)?.subject ?? t.template.title ?? contextLabel(t))}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5"><BuChip bu={buOf(t)} />{seg && <MetaChip title={t.facets.segmentos.join(' · ')}>{seg}{plusN(t.facets.segmentos)}</MetaChip>}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">{jor && <span className="inline-flex items-center gap-1 truncate max-w-[200px]"><Route size={10} />{jor}</span>}{per && <span>· {per}</span>}</div>
                  </td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{t.aberturas > 0 ? fmt.pctFrac(t.taxaAbertura, t.taxaAbertura < 0.1 ? 1 : 0) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{fmt.pctFrac(t.ctr, 2)}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{fmt.pctFrac(t.taxaConversao, t.taxaConversao < 0.0001 ? 3 : 2)}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-bold tabular-nums text-cyan-700">{fmt.int(t.cartoes)}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">
                    {t.cacEfetivo > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        {fmt.brl(t.cacEfetivo)}
                        {t.custoEstimado && <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-600" title="CAC estimado pelo custo unitário do canal (sem custo real vinculado)">est.</span>}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-2.5 py-2.5 text-right"><ScoreBadge score={t.score} sm /></td>
                  <td className="px-2.5 py-2.5"><div className="flex justify-center"><Sparkline series={t.timeline.map((p) => p.cartoes)} color={CHANNELS[t.channelKey].color} /></div></td>
                  <td className="px-2.5 py-2.5"><ArrowRight size={15} className="text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[11px] text-slate-400">* CAC estimado pelo custo de canal quando não há custo real vinculado. Clique numa linha para abrir o drilldown.</div>
    </div>
  );
};

// ── DRAWER ─────────────────────────────────────────────────────────────────
const Drawer: React.FC<{ t: ScoredTemplate; onClose: () => void; onEdit: () => void; onAudit: () => void }> = ({ t, onClose, onEdit, onAudit }) => {
  const funnel = [
    { l: 'Base', v: t.baseEnviada, pct: null as number | null },
    { l: 'Abertura', v: t.aberturas > 0 ? t.aberturas : null, pct: t.aberturas > 0 ? t.taxaAbertura : null },
    { l: 'Clique', v: t.cliques > 0 ? t.cliques : null, pct: t.cliques > 0 ? t.ctr : null },
    { l: 'Cartões', v: t.cartoes, pct: null, accent: true },
  ].filter((s) => s.v != null) as { l: string; v: number; pct: number | null; accent?: boolean }[];
  const maxF = Math.max(...funnel.map((s) => s.v), 1);
  const ch = CHANNELS[t.channelKey];
  const per = facetPeriodLabel(t.facets);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-sm" onClick={onClose}>
      <div className="grid h-full w-[1360px] max-w-[98vw] grid-cols-[minmax(560px,44%)_1fr] bg-white shadow-2xl" style={{ animation: 'perfDrawer .28s ease' }} onClick={(e) => e.stopPropagation()}>
        <style>{`@keyframes perfDrawer{from{transform:translateX(40px);opacity:.5}to{transform:translateX(0);opacity:1}}`}</style>
        <div className="flex flex-col overflow-y-auto border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white p-[18px]">
          <div className="mb-4 flex items-center justify-between">
            <ChannelTag channel={t.template.channel} soft />
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X size={16} /></button>
          </div>
          <div className="flex flex-1 items-start justify-center"><ChannelPreview item={t} width={560} height={780} /></div>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="m-0 break-all text-lg font-bold text-slate-900">{t.template.template_id}</h2>
            <ScoreRing score={t.score} size={52} />
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <BuChip bu={buOf(t)} />
            {first(t.facets.segmentos) && <MetaChip title={t.facets.segmentos.join(' · ')}>{first(t.facets.segmentos)}{plusN(t.facets.segmentos)}</MetaChip>}
            {first(t.facets.jornadas) && <MetaChip title={t.facets.jornadas.join(' · ')}><Route size={11} />{first(t.facets.jornadas)}{plusN(t.facets.jornadas)}</MetaChip>}
            {first(t.facets.safras) && <MetaChip>{first(t.facets.safras)}</MetaChip>}
            {per && <MetaChip>{per}</MetaChip>}
            <StatusDot status={t.template.status} withLabel />
          </div>

          <SectionTitle>Como o score foi calculado</SectionTitle>
          <div className="flex flex-col gap-2">
            {t.breakdown.map((b) => (
              <div key={b.metric} className={`grid grid-cols-[150px_1fr_64px_30px] items-center gap-2.5 ${b.score == null ? 'opacity-50' : ''}`}>
                <span className="text-xs font-bold text-slate-700">{b.name} <small className="font-semibold text-slate-400">·peso {Math.round(b.weight * 100)}%</small></span>
                <div className="h-[7px] overflow-hidden rounded-[5px] bg-slate-100"><div className={`h-full rounded-[5px] ${TONE[scoreTone(b.score)].fill}`} style={{ width: `${b.score ?? 0}%` }} /></div>
                <span className="text-right text-xs font-bold tabular-nums text-slate-600">{b.raw ?? '—'}</span>
                <span className="text-right text-[13px] font-bold tabular-nums text-slate-900">{b.score == null ? 'n/d' : b.score}</span>
              </div>
            ))}
          </div>

          <SectionTitle>Funil do disparo</SectionTitle>
          <div className="flex flex-col gap-2">
            {funnel.map((s) => (
              <div key={s.l} className="grid grid-cols-[64px_1fr_auto] items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">{s.l}</span>
                <div className="h-4 overflow-hidden rounded-[5px] bg-slate-100"><div className="h-full rounded-[5px]" style={{ width: `${Math.max(2, (s.v / maxF) * 100)}%`, background: s.accent ? ch.dark : ch.color }} /></div>
                <span className="whitespace-nowrap text-right text-xs font-bold tabular-nums text-slate-800">{fmt.int(s.v)}{s.pct != null && <small className="font-semibold text-slate-400"> · {fmt.pctFrac(s.pct, s.pct < 0.1 ? (s.pct < 0.001 ? 3 : 1) : 0)}</small>}</span>
              </div>
            ))}
          </div>

          <SectionTitle>Evolução no período</SectionTitle>
          <DrawerTimeline t={t} />

          {t.diagnoses.length > 0 && <>
            <SectionTitle>Diagnóstico</SectionTitle>
            <div className="flex flex-col gap-1.5">{t.diagnoses.map((d) => <DiagLine key={d} id={d} />)}</div>
          </>}

          <SectionTitle>Activity names · {t.activityNames.length} vinculada(s) · {t.executions} execuções</SectionTitle>
          <div className="flex flex-col gap-2">
            {t.timeline.filter((p) => p.date !== 'sem-data').map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-800">{String((p.activities[0] as unknown as Record<string, unknown> | undefined)?.['Activity name / Taxonomia'] ?? `${p.executions} execução(ões)`)}</span>
                  <span className="whitespace-nowrap text-[10.5px] text-slate-400">{p.label}</span>
                </div>
                <div className="mt-2 flex gap-3.5 text-xs text-slate-500">
                  <span><b className="font-bold text-slate-900">{fmt.int(p.baseEnviada)}</b> base</span>
                  {p.aberturas > 0 && <span><b className="font-bold text-slate-900">{fmt.int(p.aberturas)}</b> abert.</span>}
                  {p.cliques > 0 && <span><b className="font-bold text-slate-900">{fmt.int(p.cliques)}</b> clique</span>}
                  <span><b className="font-bold text-slate-900">{fmt.int(p.cartoes)}</b> cartões</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700 hover:border-slate-300"><Pencil size={14} /> Editar peça</button>
            <button onClick={onAudit} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-600 bg-cyan-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-cyan-700"><ListTree size={14} /> Jornadas / activity_names</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-2.5 mt-5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{children}</div>
);

// ── MODO AUDITORIA (jornadas + activity_names atribuídas ao template) ────────
interface AuditRow {
  name: string; jornada: string; segmento: string; safra: string; parceiro: string;
  base: number; aberturas: number; cliques: number; cartoes: number; datas: string[];
}

const AuditModal: React.FC<{ t: ScoredTemplate; onClose: () => void }> = ({ t, onClose }) => {
  const groups = useMemo(() => {
    const rows = t.timeline.flatMap((p) => p.activities) as unknown as ActivityRow[];
    const byName = new Map<string, AuditRow>();
    for (const r of rows) {
      const name = r['Activity name / Taxonomia'] ?? '—';
      const cur = byName.get(name) ?? { name, jornada: r.jornada ?? '—', segmento: r.Segmento ?? '—', safra: r.Safra ?? '—', parceiro: r.Parceiro ?? '—', base: 0, aberturas: 0, cliques: 0, cartoes: 0, datas: [] };
      cur.base += Number(r['Base Total'] ?? 0);
      cur.aberturas += Number(r.Abertura ?? 0);
      cur.cliques += Number(r.Cliques ?? 0);
      cur.cartoes += Number(r['Cartões Gerados'] ?? 0);
      const dt = r['Data de Disparo'] ? String(r['Data de Disparo']).slice(0, 10) : null;
      if (dt && !cur.datas.includes(dt)) cur.datas.push(dt);
      byName.set(name, cur);
    }
    const byJornada = new Map<string, AuditRow[]>();
    for (const row of byName.values()) {
      const arr = byJornada.get(row.jornada) ?? [];
      arr.push(row);
      byJornada.set(row.jornada, arr);
    }
    return Array.from(byJornada.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [t]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900"><ListTree size={18} className="text-cyan-600" />Auditoria de vínculos</div>
            <p className="mt-1 truncate text-sm text-slate-500">{t.template.template_id} · {t.facets.jornadas.length} jornada(s) · {t.activityNames.length} activity_name(s)</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            {groups.map(([jornada, rows]) => (
              <div key={jornada}>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Route size={14} className="text-cyan-600" />{jornada}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{rows.length} activity_name{rows.length === 1 ? '' : 's'}</span></div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <tr><th className="px-3 py-2">Activity name</th><th className="px-3 py-2">Segmento</th><th className="px-3 py-2">Safra</th><th className="px-3 py-2 text-right">Base</th><th className="px-3 py-2 text-right">Aberturas</th><th className="px-3 py-2 text-right">Cliques</th><th className="px-3 py-2 text-right">Cartões</th><th className="px-3 py-2 text-right">Disparos</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.name} className="border-t border-slate-100">
                          <td className="max-w-[280px] truncate px-3 py-2 font-semibold text-slate-700" title={r.name}>{r.name}</td>
                          <td className="px-3 py-2 text-slate-600">{r.segmento}</td>
                          <td className="px-3 py-2 text-slate-600">{r.safra}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt.int(r.base)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{r.aberturas > 0 ? fmt.int(r.aberturas) : '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{r.cliques > 0 ? fmt.int(r.cliques) : '—'}</td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums text-cyan-700">{fmt.int(r.cartoes)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">{r.datas.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// helper: BU a partir das activities vinculadas
function buOf(t: ScoredTemplate): string | null {
  const row = t.timeline.flatMap((p) => p.activities)[0] as unknown as Record<string, unknown> | undefined;
  const bu = row?.['BU'];
  return typeof bu === 'string' ? bu : null;
}

// ── ORQUESTRADOR ───────────────────────────────────────────────────────────
export const PerformanceView: React.FC = () => {
  const { data, previousTotals, loading, error, refetch } = useTemplatePerformance();
  const { startDate, endDate } = usePeriod();
  const perfDeepLink = useAppStore((s) => s.perfDeepLink);
  const setPerfDeepLink = useAppStore((s) => s.setPerfDeepLink);
  const [view, setView] = useState<ViewMode>('overview');
  const [channel, setChannel] = useState<ChannelKey | 'all'>('all');
  const [query, setQuery] = useState('');

  // Deep-link vindo do card "Templates no ar" (Cadastro): abre a view+filtro pedidos.
  useEffect(() => {
    if (!perfDeepLink) return;
    setView(perfDeepLink.view);
    setQuery(perfDeepLink.query);
    setChannel('all');
    setPerfDeepLink(null);
  }, [perfDeepLink, setPerfDeepLink]);
  const [selected, setSelected] = useState<ScoredTemplate | null>(null);
  const [editing, setEditing] = useState<TemplatePerformance | null>(null);
  const [auditing, setAuditing] = useState<ScoredTemplate | null>(null);

  const scored = useMemo<ScoredTemplate[]>(() => data.map(scoreTemplate), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scored.filter((t) => {
      if (channel !== 'all' && t.channelKey !== channel) return false;
      if (!q) return true;
      return searchBlob(t).includes(q);
    });
  }, [scored, channel, query]);

  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;

  if (loading) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" /> Calculando performance…</div>;
  if (error) return <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle size={16} /> {error}</div>;
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <BarChart3 size={32} className="text-slate-300" />
      <p className="max-w-md text-sm text-slate-400">A performance por template aparece conforme os disparos vinculados acumulam resultado no período filtrado.</p>
    </div>
  );

  const views: [ViewMode, string, React.ReactNode][] = [
    ['overview', 'Visão Geral', <Gauge size={15} key="g" />],
    ['gallery', 'Galeria', <LayoutGrid size={15} key="l" />],
    ['table', 'Tabela', <Rows3 size={15} key="r" />],
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
          Recorte: <b className="text-slate-700">{periodLabel}</b> · {filtered.length} de {data.length} templates
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-[3px]">
          {views.map(([id, label, icon]) => (
            <button key={id} onClick={() => setView(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${view === id ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{icon}{label}</button>
          ))}
        </div>
      </div>

      {view !== 'overview' && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button onClick={() => setChannel('all')} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${channel === 'all' ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>Todos</button>
          {CHANNEL_ORDER.map((ch) => (
            <button key={ch} onClick={() => setChannel(channel === ch ? 'all' : ch)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={channel === ch ? { color: CHANNELS[ch].dark, background: CHANNELS[ch].tint, borderColor: CHANNELS[ch].color } : { color: '#475569', background: '#fff', borderColor: '#e7ebf0' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: CHANNELS[ch].color }} />{CHANNELS[ch].label}
            </button>
          ))}
          <div className="ml-auto flex min-w-[300px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 md:max-w-[420px]">
            <Search size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por template, segmento, jornada ou activity_name…" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Search size={28} className="text-slate-300" /><p className="text-sm text-slate-400">Nenhuma peça neste filtro.</p>
        </div>
      ) : view === 'overview' ? (
        <Overview items={filtered} prev={previousTotals} onOpen={setSelected} />
      ) : view === 'gallery' ? (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((t) => <GalCard key={t.template.template_id} t={t} onOpen={() => setSelected(t)} />)}
        </div>
      ) : (
        <TableView items={filtered} onOpen={setSelected} />
      )}

      {selected && <Drawer t={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} onAudit={() => setAuditing(selected)} />}
      {auditing && <AuditModal t={auditing} onClose={() => setAuditing(null)} />}
      {editing && <CommunicationDetailModal item={editing} onClose={() => setEditing(null)} onChanged={refetch} />}
    </div>
  );
};
