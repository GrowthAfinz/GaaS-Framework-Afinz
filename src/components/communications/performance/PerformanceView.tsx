import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BarChart3, Flame, Gauge, LayoutGrid,
  Lightbulb, Link2, ListTree, Loader2, Pencil, Rows3, Route, Search, Send, Users2, X, Zap,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../../../contexts/PeriodContext';
import { useAppStore } from '../../../store/useAppStore';
import type { PerformancePrevTotals, TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import { useContentPerformance } from '../../../hooks/useContentPerformance';
import type { CommunicationTemplate } from '../../../types/communication';
import type { TemplateContentIndex } from '../../../services/templateContentIndex';
import { resolvePreview } from '../../../utils/communicationVisualResolution';
import {
  FACET_LABEL, facetOptions, facetsFromRecords, libraryCounts, libraryVisible, matchesFacets, searchMatches, templateMomentLabel,
  type FacetFilters, type FacetKey, type ScopeFacets,
} from '../../../utils/contentPerformanceModel';
import type { FrameworkActivity } from '../../../utils/communicationOrchestrator';
import { LibraryDetail, ApprovedLibraryPanel, LIBRARY_SORTS, sortLibrary, type LibrarySort } from './ApprovedLibraryPanel';
import { UNLINKED_SORTS, UnlinkedExecutionsPanel, sortUnlinked, toUnlinkedItem, type UnlinkedSort } from './UnlinkedExecutionsPanel';
import { Pager, ScopeSelector, TagRow, paginate, tagsFromFacets } from './contentUi';
import type { ActivityRow } from '../../../types/activity';
import { CommunicationDetailModal } from '../CommunicationDetailModal';
import { TemplateIdChips } from '../TemplateIdChips';
import { parseSeqParts, translateTemplateId } from '../../../utils/taxonomy';
import { ChannelGlyph, ChannelPreview, ChannelThumb } from './ChannelPreview';
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

// Dados de prévia compartilhados (catálogo + versões carregadas uma vez): nenhuma consulta por card.
const PreviewCtx = createContext<{ catalog: CommunicationTemplate[]; contents: TemplateContentIndex | null;onOpen?:(id:string)=>void }>({ catalog: [], contents: null });
const useLinkedRes = (t: ScoredTemplate) => {
  const { catalog, contents } = useContext(PreviewCtx);
  return useMemo(() => resolvePreview({ channel: t.template.channel, catalog, contents, templateId: t.template.template_id }), [catalog, contents, t.template.channel, t.template.template_id]);
};
const LinkedThumb: React.FC<{ t: ScoredTemplate; w?: number; h?: number }> = ({ t, w = 42, h }) => {const ctx=useContext(PreviewCtx);return <ChannelThumb onOpen={()=>ctx.onOpen?.(t.template.template_id)} res={useLinkedRes(t)} w={w} h={h} title={t.template.template_id}/>;};
const LinkedPreview: React.FC<{ t: ScoredTemplate; width: number; height: number }> = ({ t, width, height }) => <ChannelPreview res={useLinkedRes(t)} width={width} height={height} zoomable={false} title={t.template.template_id} />;
/** Facetas do template a partir das activities vinculadas + momento declarado no ID (contrato da régua). */
const facetsCache = new WeakMap<ScoredTemplate, ScopeFacets>();
function facetsOf(t: ScoredTemplate): ScopeFacets {
  let f = facetsCache.get(t);
  if (!f) {
    const rows = t.timeline.flatMap((p) => p.activities) as unknown as FrameworkActivity[];
    f = facetsFromRecords(rows, [templateMomentLabel(t.template.template_id, t.facets.segmentos[0])]);
    if (!f.canal.length) f.canal = [CHANNELS[t.channelKey].label];
    facetsCache.set(t, f);
  }
  return f;
}
/** Elemento clicável sem aninhar <button> (a miniatura interna tem seu próprio botão de ampliar). */
const clickable = (fn: () => void) => ({
  role: 'button' as const, tabIndex: 0, onClick: fn,
  onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); fn(); } },
});

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const ChannelTag: React.FC<{ channel: string; soft?: boolean }> = ({ channel, soft }) => {
  const ch = CHANNELS[channelKeyOf(channel)];
  if (soft) return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: ch.dark, background: ch.tint }}>
      <ChannelGlyph channel={channel} size={13} />{ch.label}
    </span>
  );
  return <span className="grid h-7 w-7 place-items-center rounded-lg text-white shadow-sm ring-1 ring-white/40" title={ch.label} aria-label={ch.label} style={{ background: ch.color }}><ChannelGlyph channel={channel} size={15} /></span>;
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
const templateLabelText = (id: string) => translateTemplateId(id).map((part) => part.value).join(' · ') || id;

const SEGMENT_LABELS: Record<string, string> = {
  abandonados: 'Abandonados', base_proprietaria: 'Base Proprietária', crm: 'CRM', negados: 'Negados',
  leads_parceiros: 'Leads de Parceiros', aprovados_nao_convertidos: 'Aprovados não convertidos',
  rentabilizacao: 'Rentabilização', cartonistas: 'Cartonistas', recencia_de_compra: 'Recência de compra', instabilidade: 'Instabilidade',
};
const SEGMENT_STAGE_FALLBACK: Record<string, string> = {
  abandonados: 'Meio de funil', base_proprietaria: 'Aquisição', crm: 'Aquisição', negados: 'Meio de funil',
  leads_parceiros: 'Meio de funil', aprovados_nao_convertidos: 'Meio de funil', rentabilizacao: 'Rentabilização',
  cartonistas: 'Rentabilização', recencia_de_compra: 'Rentabilização',
};
const segmentKey = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_');
const segmentLabel = (value: string) => SEGMENT_LABELS[segmentKey(value)] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const stageLabel = (value: string, stages: string[]) => stages[0]?.replace(/_/g, ' ') ?? SEGMENT_STAGE_FALLBACK[segmentKey(value)] ?? 'Etapa não informada';

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
    `A peça campeã é ${templateLabelText(champion.template.template_id)} (score ${champion.score ?? '—'}).`,
    firstAction ? `Próximo passo: ${firstAction.title.replace(firstAction.item.template.template_id, '').trim().toLowerCase()} — ${templateLabelText(firstAction.item.template.template_id)}.` : null,
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
              <TemplateIdChips id={champion.template.template_id} size="md" inverse />
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
                      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-900"><span>{a.title.replace(a.item.template.template_id, '').trim()}</span><TemplateIdChips id={a.item.template.template_id} /></div>
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
              <div key={t.template.template_id} {...clickable(() => onOpen(t))} className="grid w-full cursor-pointer grid-cols-[24px_42px_1fr_auto_auto_minmax(140px,180px)_16px] items-center gap-3.5 border-t border-slate-100 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">
                <span className="text-center text-sm font-bold tabular-nums text-slate-300">{i + 1}</span>
                <LinkedThumb t={t} w={42} />
                <div className="min-w-0">
                  <TemplateIdChips id={t.template.template_id} />
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
              </div>
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
    <div {...clickable(onOpen)} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">
      <div className="relative flex h-[248px] justify-center overflow-hidden border-b border-slate-100 px-4 pt-4" style={{ background: `linear-gradient(170deg, ${ch.tint}, #fff 78%)` }}>
        <div className="absolute right-3 top-3 z-10"><ChannelTag channel={t.template.channel} /></div>
        <LinkedPreview t={t} width={280} height={228} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2"><StatusDot status={t.template.status} /><TemplateIdChips id={t.template.template_id} /></span>
          <ScoreBadge score={t.score} sm />
        </div>
        <TagRow tags={tagsFromFacets(facetsOf(t))} skip={['canal']} max={7} />
        <div className="text-[10.5px] text-slate-500">{fmt.k(t.baseEnviada)} base · {t.executions} execuções{t.resultsMeasured === 0 && ' · sem resultado registrado'}</div>
        <div className="grid grid-cols-4 gap-1.5">
          <KTile v={t.resultsMeasured ? sig.v : "—"} l={sig.l} />
          <KTile v={t.resultsMeasured ? fmt.pctFrac(t.ctr, 2) : "—"} l="CTR" />
          <KTile v={t.resultsMeasured ? fmt.int(t.cartoes) : "—"} l="cartões" accent />
          <KTile v={t.cacEfetivo > 0 ? fmt.brl(t.cacEfetivo) : '—'} l={t.custoEstimado ? 'CAC est.' : 'CAC'} />
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">{t.diagnoses.filter((d) => d !== 'custo_parcial').slice(0, 2).map((d) => <DiagBadge key={d} id={d} />)}</div>
      </div>
    </div>
  );
};

const KTile: React.FC<{ v: string; l: string; accent?: boolean }> = ({ v, l, accent }) => (
  <div className={`rounded-lg border px-1 py-2 text-center ${accent ? 'border-cyan-100 bg-cyan-50' : 'border-slate-100 bg-slate-50'}`}>
    <div className={`text-sm font-bold leading-none tabular-nums ${accent ? 'text-cyan-700' : 'text-slate-900'}`}>{v}</div>
    <div className="mt-1 text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{l}</div>
  </div>
);

// ── TABELA ─────────────────────────────────────────────────────────────────
type SortKey = 'score' | 'recent' | 'moment' | 'base' | 'executions' | 'entregas' | 'cliques' | 'propostas' | 'cartoes' | 'cacEfetivo' | 'taxaAbertura' | 'ctr' | 'taxaConversao';
type SortState = { key: SortKey; dir: 1 | -1 };

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: 1 | -1 }[] = [
  { key: 'score', label: 'Melhor score', defaultDir: -1 },
  { key: 'recent', label: 'Mais recentes', defaultDir: -1 },
  { key: 'moment', label: 'Ordem da régua', defaultDir: 1 },
  { key: 'base', label: 'Maior base', defaultDir: -1 },
  { key: 'executions', label: 'Mais execuções', defaultDir: -1 },
  { key: 'entregas', label: 'Mais entregas', defaultDir: -1 },
  { key: 'cliques', label: 'Mais cliques', defaultDir: -1 },
  { key: 'propostas', label: 'Mais propostas', defaultDir: -1 },
  { key: 'cartoes', label: 'Mais emissões', defaultDir: -1 },
  { key: 'cacEfetivo', label: 'Menor CAC', defaultDir: 1 },
];

const sortValue = (t: ScoredTemplate, key: SortKey): number | null => {
  if (key === 'score') return t.score;
  if (key === 'recent') return t.facets.periodEnd ? Date.parse(`${t.facets.periodEnd}T00:00:00`) : null;
  if (key === 'moment') {
    const moment = parseSeqParts(t.template.template_id);
    if (!moment) return null;
    return moment.week == null ? 100000 + moment.dispatch : moment.week * 1000 + moment.dispatch;
  }
  if (key === 'base') return t.baseEnviada;
  if (key === 'executions') return t.executions;
  if (key === 'entregas' && !t.temEntrega) return null;
  const value = Number(t[key]);
  if (!Number.isFinite(value)) return null;
  if (key === 'cacEfetivo' && value <= 0) return null;
  return value;
};

const sortTemplates = (items: ScoredTemplate[], sort: SortState) => [...items].sort((a, b) => {
  const av = sortValue(a, sort.key), bv = sortValue(b, sort.key);
  if (av == null && bv == null) return a.template.template_id.localeCompare(b.template.template_id);
  if (av == null) return 1;
  if (bv == null) return -1;
  const primary = (av - bv) * sort.dir;
  if (primary !== 0) return primary;
  return (b.score ?? -1) - (a.score ?? -1) || a.template.template_id.localeCompare(b.template.template_id);
});
const COLS: { key: SortKey; label: string }[] = [
  { key: 'taxaAbertura', label: 'Abertura' }, { key: 'ctr', label: 'Clique' }, { key: 'taxaConversao', label: 'Conversão' },
  { key: 'cartoes', label: 'Cartões' }, { key: 'cacEfetivo', label: 'CAC' }, { key: 'score', label: 'Score' },
];

const TableView: React.FC<{ items: ScoredTemplate[]; sort: SortState; onSort: (sort: SortState) => void; onOpen: (t: ScoredTemplate) => void; page: number; onPage: (p: number) => void }> = ({ items, sort, onSort, onOpen, page, onPage }) => {
  const sorted = useMemo(() => sortTemplates(items, sort), [items, sort]);
  const { rows, pages, page: current } = paginate(sorted, page);
  const setS = (key: SortKey) => onSort(sort.key === key ? { key, dir: sort.dir === -1 ? 1 : -1 } : { key, dir: key === 'cacEfetivo' ? 1 : -1 });

  return (
    <div className="space-y-3">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-2.5 py-2.5">Template / criativo</th>
              <th className="px-2.5 py-2.5">Contexto</th>
              <th className="cursor-pointer select-none px-2.5 py-2.5 text-right hover:text-cyan-700" onClick={() => setS('base')}><span className={`inline-flex items-center gap-1 ${sort.key === 'base' ? 'text-cyan-700' : ''}`}>Base{sort.key === 'base' && (sort.dir === -1 ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}</span></th>
              <th className="cursor-pointer select-none px-2.5 py-2.5 text-right hover:text-cyan-700" onClick={() => setS('executions')}><span className={`inline-flex items-center gap-1 ${sort.key === 'executions' ? 'text-cyan-700' : ''}`}>Exec.{sort.key === 'executions' && (sort.dir === -1 ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}</span></th>
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
            {rows.map((t) => {
              const jor = first(t.facets.jornadas), per = facetPeriodLabel(t.facets);
              const f = facetsOf(t);
              return (
                <tr key={t.template.template_id} onClick={() => onOpen(t)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50">
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <LinkedThumb t={t} w={34} h={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5"><StatusDot status={t.template.status} /><TemplateIdChips id={t.template.template_id} /></div>
                        <div className="mt-0.5 max-w-[240px] truncate text-[10.5px] text-slate-400">{String((t.template.metadata as Record<string, unknown> | undefined)?.subject ?? t.template.title ?? contextLabel(t))}</div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[340px] px-2.5 py-2.5">
                    <TagRow tags={tagsFromFacets(f)} skip={['canal', 'momento']} max={7} />
                    <div className="mt-1 text-[10.5px] font-semibold text-slate-600">{f.momento[0] ? `Momento: ${f.momento[0]}` : 'Momento não declarado no ID'}</div>
                    <div className="mt-0.5 truncate text-[10px] text-slate-400" title={t.activityNames.join(' · ')}>{t.activityNames[0]}{plusN(t.activityNames)}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">{jor && <span className="inline-flex max-w-[200px] items-center gap-1 truncate"><Route size={10} />{jor}{plusN(t.facets.jornadas)}</span>}{per && <span>· {per}</span>}</div>
                  </td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{fmt.k(t.baseEnviada)}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{t.executions}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{t.aberturas > 0 ? fmt.pctFrac(t.taxaAbertura, t.taxaAbertura < 0.1 ? 1 : 0) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{t.resultsMeasured ? fmt.pctFrac(t.ctr, 2) : <span className="text-slate-300" title="Sem resultado registrado">—</span>}</td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{t.resultsMeasured ? fmt.pctFrac(t.taxaConversao, t.taxaConversao < 0.0001 ? 3 : 2) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-bold tabular-nums text-cyan-700">{t.resultsMeasured ? fmt.int(t.cartoes) : <span className="text-slate-300">—</span>}</td>
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
      <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[11px] text-slate-500">Métricas somam as execuções vinculadas ao template no período; não certificam qual versão do conteúdo foi enviada. * CAC estimado pelo custo de canal quando não há custo real vinculado. Clique numa linha para abrir o detalhe.</div>
      </div>
      <Pager page={current} pages={pages} total={items.length} unit="template(s)" onPage={onPage} />
    </div>
  );
};

// ── DRAWER ─────────────────────────────────────────────────────────────────
// Zoom do preview do criativo (e-mail e imagem). Escalamos a MOLDURA (width/height),
// não um transform, para que o scroll acompanhe naturalmente ao ampliar.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const PREVIEW_W = 500;
const PREVIEW_H = 620;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

const PerformanceDetails:React.FC<{t:ScoredTemplate}>=({t})=>{
  const funnel = [
    { l: 'Base', v: t.baseEnviada, pct: null as number | null },
    { l: 'Abertura', v: t.aberturas > 0 ? t.aberturas : null, pct: t.aberturas > 0 ? t.taxaAbertura : null },
    { l: 'Clique', v: t.cliques > 0 ? t.cliques : null, pct: t.cliques > 0 ? t.ctr : null },
    { l: 'Cartões', v: t.cartoes, pct: null, accent: true },
  ].filter((s) => s.v != null) as { l: string; v: number; pct: number | null; accent?: boolean }[];
  const maxF = Math.max(...funnel.map((s) => s.v), 1);
  const ch = CHANNELS[t.channelKey];
return <>
          <p className="mb-1 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">Métricas somam {t.executions} execução(ões) vinculadas a este template no período. A prévia é a peça atual/catálogo e não certifica a versão enviada em cada execução.{t.resultsMeasured === 0 && ' Nenhuma execução tem resultado registrado ainda: sem score.'}</p>
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

</>;
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
            <div className="mt-2"><TemplateIdChips id={t.template.template_id} /></div>
            <p className="mt-1 truncate text-xs text-slate-500">{t.facets.jornadas.length} jornada(s) · {t.activityNames.length} activity_name(s)</p>
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
type Scope = 'linked' | 'unlinked' | 'library';
const SELECT_FACETS: FacetKey[] = ['frente', 'parceiro', 'segmento', 'subgrupo', 'oferta', 'promocional', 'momento'];
const SCOPE_HINT: Record<Scope, string> = {
  linked: 'Templates com execuções vinculadas no período. Métricas reais das execuções; a prévia não certifica a versão enviada.',
  unlinked: 'Grupos de execuções do período sem template, com as sugestões do motor de reconciliação. Vínculo só após revisão.',
  library: 'Comunicações aprovadas (versão aprovada no pack ou cadastro ativo/pausado no catálogo). Sem execução, não há métrica nem ranking.',
};

export const PerformanceView: React.FC = () => {
  const perf = useContentPerformance();
  const { startDate, endDate } = usePeriod();
  const perfDeepLink = useAppStore((s) => s.perfDeepLink);
  const setPerfDeepLink = useAppStore((s) => s.setPerfDeepLink);
  const [view, setView] = useState<ViewMode>('gallery');
  const [scope, setScope] = useState<Scope>('linked');
  const [filters, setFilters] = useState<FacetFilters>({});
  const [query, setQuery] = useState('');
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: 'score', dir: -1 });
  const [unlinkedSort, setUnlinkedSort] = useState<{ key: UnlinkedSort; dir: 1 | -1 }>({ key: 'priority', dir: -1 });
  const [librarySort, setLibrarySort] = useState<{ key: LibrarySort; dir: 1 | -1 }>({ key: 'period', dir: -1 });
  const [page, setPage] = useState(1);

  // Deep-link vindo do card "Templates no ar" (Cadastro): abre a view+busca pedidas.
  useEffect(() => {
    if (!perfDeepLink) return;
    setView(perfDeepLink.view);
    setScope('linked');
    setQuery(perfDeepLink.query);
    setFilters({});
    setPerfDeepLink(null);
  }, [perfDeepLink, setPerfDeepLink]);
  const [detailId,setDetailId]=useState<string|null>(null);
  const [libraryPeriodOnly,setLibraryPeriodOnly]=useState(true);
  const [selected, setSelected] = useState<ScoredTemplate | null>(null);
  const [editing, setEditing] = useState<TemplatePerformance | null>(null);
  const [auditing, setAuditing] = useState<ScoredTemplate | null>(null);

  // Página volta ao início sempre que o recorte muda (escopo, filtros, busca, ordenação, rascunhos).
  useEffect(() => { setPage(1); }, [scope, filters, query, includeDrafts, sort, unlinkedSort, librarySort, view]);

  // ── visão 1: templates com execução vinculada ──
  const scored = useMemo<ScoredTemplate[]>(() => perf.linked.map(scoreTemplate), [perf.linked]);
  const assetNamesById = useMemo(() => new Map(perf.library.map((i) => [i.template.template_id, i.assetNames])), [perf.library]);
  const linkedFiltered = useMemo(() => scored.filter((t) => matchesFacets(facetsOf(t), filters)
    && searchMatches(`${searchBlob(t)} ${(assetNamesById.get(t.template.template_id) ?? []).join(' ')}`, query)), [scored, filters, query, assetNamesById]);
  const linkedOrdered = useMemo(() => sortTemplates(linkedFiltered, sort), [linkedFiltered, sort]);

  // ── visão 2: grupos de execuções sem template ──
  const unlinkedAll = useMemo(() => perf.orphans.map(toUnlinkedItem), [perf.orphans]);
  const unlinkedFiltered = useMemo(() => sortUnlinked(unlinkedAll.filter((i) => matchesFacets(i.facets, filters) && searchMatches(i.searchText, query)), unlinkedSort.key, unlinkedSort.dir), [unlinkedAll, filters, query, unlinkedSort]);

  // ── visão 3: biblioteca de comunicações aprovadas ──
  const libCounts = useMemo(() => libraryCounts(perf.library.filter(i=>!libraryPeriodOnly||i.periodExecutions.length>0)), [perf.library,libraryPeriodOnly]);
  const libraryAll = useMemo(() => libraryVisible(perf.library, includeDrafts).filter(i=>!libraryPeriodOnly||i.periodExecutions.length>0), [perf.library, includeDrafts,libraryPeriodOnly]);
  const libraryFiltered = useMemo(() => sortLibrary(libraryAll.filter((i) => matchesFacets(i.facets, filters) && searchMatches(i.searchText, query)), librarySort.key, librarySort.dir), [libraryAll, filters, query, librarySort]);

  const scopeFacets: ScopeFacets[] = useMemo(() => scope === 'linked' ? scored.map(facetsOf) : scope === 'unlinked' ? unlinkedAll.map((i) => i.facets) : libraryAll.map((i) => i.facets), [scope, scored, unlinkedAll, libraryAll]);
  const segmentChips = useMemo(() => facetOptions(scopeFacets, 'segmento'), [scopeFacets]);
  const setFacet = (key: FacetKey, value: string) => setFilters((cur) => { const next = { ...cur }; if (!value || value === 'all') delete next[key]; else next[key] = value; return next; });
  const activeFilters = Object.keys(filters).length + (query.trim() ? 1 : 0);

  const linkedExecutions = scored.reduce((n, t) => n + t.executions, 0);
  const unlinkedExecutions = perf.orphans.reduce((n, o) => n + o.executionRecords.length, 0);
  const scopeOptions = [
    { id: 'linked' as const, label: 'Com template vinculado', count: scored.length, unit: 'templates', sub: `${linkedExecutions.toLocaleString('pt-BR')} execuções vinculadas no período` },
    { id: 'unlinked' as const, label: 'Vínculos pendentes', count: perf.orphans.length, unit: 'grupos de execuções', sub: `${unlinkedExecutions.toLocaleString('pt-BR')} execuções aguardando vínculo` },
    { id: 'library' as const, label: 'Comunicações aprovadas', count: libCounts.approved + (includeDrafts ? libCounts.drafts + libCounts.inactive : 0), unit: 'templates', sub: `${libCounts.withExecution} com execução no período${includeDrafts && libCounts.drafts ? ` · inclui ${libCounts.drafts} rascunho(s)` : ''}` },
  ];

  const insight = useMemo(() => {
    if (!linkedFiltered.length) return { lead: 'Sem peças comparáveis', text: 'Tente outro segmento ou canal. Execuções sem vínculo aparecem em “Vínculos pendentes”.', item: null as ScoredTemplate | null };
    const actions = suggestedActions(linkedFiltered);
    if (actions[0]) return { lead: actions[0].title.replace(actions[0].item.template.template_id, '').trim(), text: actions[0].text, item: actions[0].item };
    const best = [...linkedFiltered].filter((t) => t.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    if (best) return { lead: 'Lidera o recorte', text: `Score ${best.score}/100. Compare oferta, CTA e abertura com as peças de menor score do mesmo segmento.`, item: best };
    return { lead: 'Próxima análise', text: 'Compare peças do mesmo segmento e etapa de funil; depois altere apenas o canal para reduzir diferenças de contexto.', item: null };
  }, [linkedFiltered]);

  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;
  const previewCtx = useMemo(() => ({ catalog: perf.catalogRaw, contents: perf.contents }), [perf.catalogRaw, perf.contents]);

  if (perf.initialLoading) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" /> Calculando performance…</div>;
  if (perf.error && !scored.length && !perf.orphans.length) return <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle size={16} /> {perf.error}</div>;

  const views: [ViewMode, string, React.ReactNode][] = [
    ['overview', 'Visão Geral', <Gauge size={15} key="g" />],
    ['gallery', 'Galeria', <LayoutGrid size={15} key="l" />],
    ['table', 'Tabela', <Rows3 size={15} key="r" />],
  ];
  const sortSelect = scope === 'linked'
    ? { value: sort.key, dir: sort.dir, options: SORT_OPTIONS.map((o) => ({ key: o.key as string, label: o.label })), onChange: (k: string) => { const o = SORT_OPTIONS.find((x) => x.key === k) ?? SORT_OPTIONS[0]; setSort({ key: o.key, dir: o.defaultDir }); }, flip: () => setSort((c) => ({ ...c, dir: c.dir === -1 ? 1 : -1 })), note: undefined as string | undefined }
    : scope === 'unlinked'
      ? { value: unlinkedSort.key, dir: unlinkedSort.dir, options: UNLINKED_SORTS, onChange: (k: string) => setUnlinkedSort({ key: k as UnlinkedSort, dir: k === 'moment' ? 1 : -1 }), flip: () => setUnlinkedSort((c) => ({ ...c, dir: c.dir === -1 ? 1 : -1 })), note: 'Sem valor registrado fica ao final.' }
      : { value: librarySort.key, dir: librarySort.dir, options: LIBRARY_SORTS, onChange: (k: string) => setLibrarySort({ key: k as LibrarySort, dir: k === 'id' ? 1 : -1 }), flip: () => setLibrarySort((c) => ({ ...c, dir: c.dir === -1 ? 1 : -1 })), note: LIBRARY_SORTS.find((o) => o.key === librarySort.key)?.note };
  const draftsAvailable = libCounts.drafts + libCounts.inactive;
  const mode = view === 'table' ? 'table' : 'gallery';

  return (
    <PreviewCtx.Provider value={{...previewCtx,onOpen:setDetailId}}>
    <div className="mx-auto max-w-[1480px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
          Recorte: <b className="text-slate-700">{periodLabel}</b> (dias de São Paulo)
          {perf.refreshing && <span role="status" className="ml-2 inline-flex items-center gap-1 text-cyan-700"><Loader2 size={12} className="animate-spin" />Atualizando…</span>}
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-[3px]">
          {views.map(([id, label, icon]) => (
            <button key={id} onClick={() => setView(id)} aria-pressed={view === id} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${view === id ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{icon}{label}</button>
          ))}
        </div>
      </div>
      {perf.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{perf.error}</div>}
      {perf.contentsError && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">Não foi possível acessar as versões de conteúdo do pack ({perf.contentsError}). Prévias de WhatsApp/SMS/Push podem aparecer como indisponíveis.</div>}

      {view === 'overview' ? (
        <>
          <p className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600">
            Resultados <b>somente das execuções vinculadas</b> no período: {scored.length} templates · {linkedExecutions.toLocaleString('pt-BR')} execuções.
            {' '}{unlinkedExecutions > 0 ? `${unlinkedExecutions.toLocaleString('pt-BR')} execuções sem template e as peças sem execução não entram nestes indicadores.` : 'Peças sem execução não entram nestes indicadores.'}
          </p>
          {scored.length ? <Overview items={scored} prev={perf.previousTotals} onOpen={setSelected} /> : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <BarChart3 size={32} className="text-slate-300" />
              <p className="max-w-md text-sm text-slate-500">Nenhuma execução vinculada a template no período. Revise em “Vínculos pendentes”, na Galeria ou Tabela.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <ScopeSelector<Scope> value={scope} options={scopeOptions} onChange={setScope} />
          <p className="px-1 text-xs text-slate-600">{SCOPE_HINT[scope]}</p>

          <section aria-labelledby="segment-filter-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div><h3 id="segment-filter-title" className="text-sm font-bold text-slate-800">Escolha o segmento</h3><p className="mt-0.5 text-xs text-slate-400">Compare primeiro peças do mesmo público e etapa de funil.</p></div>
              {activeFilters > 0 && <button type="button" onClick={() => { setFilters({}); setQuery(''); }} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900">Limpar filtros ({activeFilters})</button>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setFacet('segmento', 'all')} aria-pressed={!filters.segmento} className={`min-w-fit rounded-xl border px-3 py-2 text-left transition-colors ${!filters.segmento ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                <span className="block text-xs font-bold text-slate-800">Todos os segmentos</span><span className="mt-0.5 block text-[10px] text-slate-400">{scopeFacets.length} {scope === 'unlinked' ? 'grupos' : 'templates'}</span>
              </button>
              {segmentChips.map((option) => (
                <button key={option.value} type="button" onClick={() => setFacet('segmento', option.value)} aria-pressed={filters.segmento === option.value} className={`min-w-fit rounded-xl border px-3 py-2 text-left transition-colors ${filters.segmento === option.value ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <span className="block text-xs font-bold text-slate-800">{segmentLabel(option.value)}</span><span className="mt-0.5 block text-[10px] text-slate-400">{stageLabel(option.value, [])} · {option.count} {scope === 'unlinked' ? 'grupos' : 'tmpl.'}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button onClick={() => setFacet('canal', 'all')} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${!filters.canal ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>Todos</button>
            {CHANNEL_ORDER.map((ch) => {
              const on = filters.canal === CHANNELS[ch].label;
              return (
                <button key={ch} onClick={() => setFacet('canal', on ? 'all' : CHANNELS[ch].label)} aria-pressed={on} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={on ? { color: CHANNELS[ch].dark, background: CHANNELS[ch].tint, borderColor: CHANNELS[ch].color } : { color: '#475569', background: '#fff', borderColor: '#e7ebf0' }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: CHANNELS[ch].color }} />{CHANNELS[ch].label}
                </button>
              );
            })}
            <div className="ml-auto inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600">
              <span className="border-r border-slate-200 px-2.5 py-2 text-slate-400">Ordenar</span>
              <select value={sortSelect.value} onChange={(e) => sortSelect.onChange(e.target.value)} className="bg-white px-2.5 py-2 outline-none" aria-label="Ordenar por">
                {sortSelect.options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <button type="button" onClick={sortSelect.flip} className="border-l border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" title="Inverter ordem" aria-label="Inverter ordem">
                {sortSelect.dir === -1 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              </button>
            </div>
          {scope === 'library' && (
              <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold ${draftsAvailable ? 'cursor-pointer text-slate-600' : 'cursor-not-allowed text-slate-400'}`} title={draftsAvailable ? 'Rascunhos e inativos aparecem com o estado real; não são aprovação.' : 'Não há rascunhos nem inativos no catálogo dentro dos filtros globais.'}>
                <input type="checkbox" checked={includeDrafts} disabled={!draftsAvailable} onChange={(e) => setIncludeDrafts(e.target.checked)} className="peer sr-only" />
                <span className="relative h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-cyan-600 peer-disabled:opacity-50 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
                Incluir rascunhos ({libCounts.drafts}{libCounts.inactive ? ` + ${libCounts.inactive} inativos` : ''})
              </label>
            )}
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 md:max-w-[420px]">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" placeholder="Buscar por ID, nome da peça, jornada ou Activity Name…" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca" className="text-slate-400 hover:text-slate-700"><X size={14} /></button>}
            </div>
            <div className="flex basis-full flex-wrap items-center gap-1.5">
              {SELECT_FACETS.map((key) => {
                const opts = facetOptions(scopeFacets, key);
                const value = filters[key] ?? 'all';
                if (!opts.length && value === 'all') return null;
                return (
                  <select key={key} value={value} onChange={(e) => setFacet(key, e.target.value)} aria-label={FACET_LABEL[key]}
                    className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${value !== 'all' ? 'border-cyan-400 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <option value="all">{FACET_LABEL[key]}: todos</option>
                    {value !== 'all' && !opts.some((o) => o.value === value) && <option value={value}>{value} (0)</option>}
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.value} ({o.count})</option>)}
                  </select>
                );
              })}
              {sortSelect.note && <span className="text-[11px] text-slate-500">{sortSelect.note}</span>}
            </div>
          </div>

          {scope === 'linked' && (
            <aside className="flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3" aria-label="Insight do recorte">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-cyan-700 shadow-sm"><Lightbulb size={15} /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Insight e sugestão de análise</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><span className="text-sm font-semibold text-slate-800">{insight.lead}</span>{insight.item && <TemplateIdChips id={insight.item.template.template_id} />}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{insight.text}</p>
              </div>
            </aside>
          )}

          {scope === 'linked' && (linkedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Search size={28} className="text-slate-300" /><p className="text-sm text-slate-400">{scored.length ? 'Nenhuma peça neste filtro.' : 'Nenhum template com execução vinculada no período.'}</p>
            </div>
          ) : mode === 'gallery' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginate(linkedOrdered, page).rows.map((t) => <GalCard key={t.template.template_id} t={t} onOpen={() => setSelected(t)} />)}
              </div>
              <Pager page={paginate(linkedOrdered, page).page} pages={paginate(linkedOrdered, page).pages} total={linkedOrdered.length} unit={`template(s)${linkedOrdered.length !== scored.length ? ` (de ${scored.length})` : ''}`} onPage={setPage} />
            </div>
          ) : (
            <TableView items={linkedFiltered} sort={sort} onSort={setSort} onOpen={setSelected} page={page} onPage={setPage} />
          ))}
          {scope === 'unlinked' && (
            <UnlinkedExecutionsPanel items={unlinkedFiltered} linked={perf.linked} total={unlinkedAll.length} view={mode} catalog={perf.catalog} catalogRaw={perf.catalogRaw} contents={perf.contents} page={page} onPage={setPage} onChanged={perf.refetch} busy={perf.refreshing} />
          )}
          {scope==='library'&&<label className="mb-3 flex items-center gap-2 text-sm">Acervo<select value={libraryPeriodOnly?'period':'all'} onChange={e=>{setLibraryPeriodOnly(e.target.value==='period');setPage(1);}} className="rounded-lg border px-3 py-2"><option value="period">Com uso no período</option><option value="all">Todas as aprovadas deste público</option></select></label>}
          {scope === 'library' && (
            <ApprovedLibraryPanel items={libraryFiltered} total={libraryAll.length} view={mode} catalogRaw={perf.catalogRaw} contents={perf.contents} page={page} onPage={setPage}
              onOpenDetail={setDetailId} onOpenPerformance={setDetailId}
              onReviewCompatible={(id) => { setScope('unlinked'); setFilters({}); setQuery(id); }} />
          )}
        </div>
      )}

      {(selected||detailId)&&(()=>{const id=selected?.template.template_id||detailId;const item=perf.library.find(i=>i.template.template_id===id);const t=scored.find(i=>i.template.template_id===id);return item?<LibraryDetail item={item} res={resolvePreview({channel:item.template.channel,catalog:perf.catalogRaw,contents:perf.contents,templateId:id!})} performance={t?<><ScoreRing score={t.score} size={52}/><PerformanceDetails t={t}/><div className="flex gap-2"><button className="rounded border px-3 py-2" onClick={()=>{setEditing(t);setSelected(null);setDetailId(null);}}>Editar peça</button><button className="rounded border px-3 py-2" onClick={()=>setAuditing(t)}>Jornadas / activity_names</button></div></>:undefined} onClose={()=>{setSelected(null);setDetailId(null);}} onOpenPerformance={setDetailId} onReviewCompatible={id=>{setSelected(null);setDetailId(null);setScope('unlinked');setQuery(id);}}/>:null;})()}
      {auditing && <AuditModal t={auditing} onClose={() => setAuditing(null)} />}
      {editing && <CommunicationDetailModal item={editing} onClose={() => setEditing(null)} onChanged={perf.refetch} />}
    </div>
    </PreviewCtx.Provider>
  );
};
