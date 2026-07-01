import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Flame,
  FileImage,
  Gauge,
  Grid3X3,
  Loader2,
  Search,
  Send,
  Table2,
  TrendingUp,
} from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { useTemplatePerformance, type TemplatePerformance } from '../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';
import { CommunicationDetailModal } from './CommunicationDetailModal';

type ViewMode = 'overview' | 'gallery' | 'table';
type SortKey = 'score' | 'cartoes' | 'ctr' | 'taxaAbertura' | 'taxaConversao' | 'cacEfetivo';
type ActionTone = 'good' | 'warn' | 'bad';

interface ScoredTemplatePerformance extends TemplatePerformance {
  contentScore: number;
  scoreTone: 'good' | 'warn' | 'bad';
  taxaAbertura: number;
}

const pct = (v: number, digits = 2) => `${(v * 100).toFixed(digits)}%`;
const int = (v: number) => v.toLocaleString('pt-BR');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = (v: number) => Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', short: 'WPP', color: '#22C55E', tint: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  { key: 'email', label: 'E-mail', short: 'EM', color: '#6366F1', tint: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  { key: 'push', label: 'Push', short: 'PUSH', color: '#F59E0B', tint: 'bg-amber-50 text-amber-700 ring-amber-100' },
  { key: 'sms', label: 'SMS', short: 'SMS', color: '#0EA5E9', tint: 'bg-sky-50 text-sky-700 ring-sky-100' },
] as const;

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const channelMeta = (channel: string) => {
  const n = normalize(channel);
  return CHANNELS.find((c) => n.includes(c.key) || n.includes(normalize(c.label))) ?? {
    key: channel,
    label: channel || 'Canal',
    short: (channel || 'CH').slice(0, 4).toUpperCase(),
    color: '#64748B',
    tint: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
};

const Metric: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={accent ? 'rounded-lg bg-cyan-50 px-2 py-1.5' : undefined}>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`text-sm font-bold tabular-nums ${accent ? 'text-cyan-700' : 'text-slate-700'}`}>{value}</p>
  </div>
);

const toneClasses: Record<ActionTone, string> = {
  good: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  warn: 'border-amber-100 bg-amber-50 text-amber-800',
  bad: 'border-rose-100 bg-rose-50 text-rose-800',
};

const TemplatePreview: React.FC<{ item: TemplatePerformance; className?: string }> = ({ item, className = 'h-44' }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = item.template.original_path;
  const email = isEmailChannel(item.template.channel);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setHtml(null);
    setFailed(false);
    if (!path) {
      setFailed(true);
      return () => { active = false; };
    }
    getSignedUrl(path)
      .then(async (u) => {
        if (!active) return;
        if (email) {
          const text = await fetch(u).then((r) => r.text());
          if (active) setHtml(text);
        } else {
          setUrl(u);
        }
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path, email]);

  if (!path || failed) {
    return (
      <div className={`flex ${className} items-center justify-center bg-slate-50 text-slate-300`}>
        <FileImage size={28} />
      </div>
    );
  }

  if (email) {
    if (html === null) {
      return (
        <div className={`flex ${className} items-center justify-center bg-slate-50 text-slate-300`}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      );
    }
    return (
      <iframe
        title={`Preview ${item.template.template_id}`}
        sandbox=""
        srcDoc={html}
        className={`${className} w-full bg-white`}
      />
    );
  }

  if (!url) {
    return (
      <div className={`flex ${className} items-center justify-center bg-slate-50 text-slate-300`}>
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  return (
    <div className={`${className} w-full overflow-hidden bg-slate-50`}>
      <img src={url} alt={item.template.template_id} className="h-full w-full object-cover object-top" />
    </div>
  );
};

const MiniTemplateThumb: React.FC<{ item: TemplatePerformance }> = ({ item }) => {
  const meta = channelMeta(item.template.channel);
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 shadow-sm"
      style={{ boxShadow: `inset 0 0 0 1px ${meta.color}18` }}
    >
      <span className="text-[10px] font-black uppercase" style={{ color: meta.color }}>
        {meta.short}
      </span>
    </div>
  );
};

const ScoreBar: React.FC<{ score: number; compact?: boolean }> = ({ score, compact: isCompact }) => {
  const tone = score >= 70 ? 'emerald' : score >= 45 ? 'amber' : 'rose';
  const cls = {
    emerald: 'bg-emerald-500 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-500 text-amber-700 ring-amber-100',
    rose: 'bg-rose-500 text-rose-700 ring-rose-100',
  }[tone];
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ${cls.split(' ').find((c) => c.startsWith('ring-'))}`}>
        <div className={`h-full rounded-full ${cls.split(' ')[0]}`} style={{ width: `${Math.max(4, score)}%` }} />
      </div>
      <span className={`shrink-0 font-bold tabular-nums ${cls.split(' ')[1]} ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {score}<span className="text-[10px] font-semibold opacity-70">/100</span>
      </span>
    </div>
  );
};

function computeScoredData(data: TemplatePerformance[]): ScoredTemplatePerformance[] {
  const maxCartoes = Math.max(...data.map((i) => i.cartoes), 1);
  const maxCtr = Math.max(...data.map((i) => i.ctr), 0.0001);
  const maxAbertura = Math.max(...data.map((i) => i.baseEnviada > 0 ? i.aberturas / i.baseEnviada : 0), 0.0001);
  const maxConversao = Math.max(...data.map((i) => i.taxaConversao), 0.0001);

  return data.map((item) => {
    const taxaAbertura = item.baseEnviada > 0 ? item.aberturas / item.baseEnviada : 0;
    const score = Math.round(100 * (
      0.35 * (item.cartoes / maxCartoes) +
      0.25 * (item.ctr / maxCtr) +
      0.20 * (taxaAbertura / maxAbertura) +
      0.20 * (item.taxaConversao / maxConversao)
    ));
    const contentScore = Math.max(0, Math.min(100, score));
    return {
      ...item,
      taxaAbertura,
      contentScore,
      scoreTone: contentScore >= 70 ? 'good' : contentScore >= 45 ? 'warn' : 'bad',
    };
  });
}

function buildSuggestedActions(data: ScoredTemplatePerformance[]) {
  const actions: Array<{ tone: ActionTone; title: string; text: string; item: ScoredTemplatePerformance }> = [];
  const byScore = [...data].sort((a, b) => b.contentScore - a.contentScore);
  const best = byScore[0];
  if (best) {
    actions.push({
      tone: 'good',
      title: `Escalar ${best.template.template_id}`,
      text: `Maior índice do recorte: ${best.contentScore}/100, ${pct(best.taxaAbertura, 1)} de abertura e ${int(best.cartoes)} cartões.`,
      item: best,
    });
  }

  const highVolume = data.filter((item) => item.baseEnviada > 1000);
  const lowOpen = [...highVolume].sort((a, b) => a.taxaAbertura - b.taxaAbertura)[0];
  if (lowOpen && lowOpen !== best) {
    actions.push({
      tone: 'bad',
      title: `Revisar abertura de ${lowOpen.template.template_id}`,
      text: `Volume relevante com abertura de ${pct(lowOpen.taxaAbertura, 1)}. Priorize assunto, primeira dobra e timing.`,
      item: lowOpen,
    });
  }

  const highOpenLowConv = [...data]
    .filter((item) => item.taxaAbertura > 0.2 && item.taxaConversao < 0.0001)
    .sort((a, b) => b.taxaAbertura - a.taxaAbertura)[0];
  if (highOpenLowConv && !actions.some((a) => a.item.template.template_id === highOpenLowConv.template.template_id)) {
    actions.push({
      tone: 'warn',
      title: `Revisar CTA de ${highOpenLowConv.template.template_id}`,
      text: `Abertura boa (${pct(highOpenLowConv.taxaAbertura, 1)}), mas conversão baixa. O gargalo provável está na oferta ou CTA.`,
      item: highOpenLowConv,
    });
  }

  const highCac = [...data]
    .filter((item) => item.cacEfetivo > 0 && item.cartoes > 0)
    .sort((a, b) => b.cacEfetivo - a.cacEfetivo)[0];
  if (highCac && !actions.some((a) => a.item.template.template_id === highCac.template.template_id)) {
    actions.push({
      tone: 'bad',
      title: `Controlar CAC de ${highCac.template.template_id}`,
      text: `CAC de ${brl(highCac.cacEfetivo)}${highCac.custoEstimado ? ' estimado' : ''}. Reavalie base e oferta antes de repetir.`,
      item: highCac,
    });
  }

  return actions.slice(0, 4);
}

const HeaderControls: React.FC<{
  view: ViewMode;
  setView: (view: ViewMode) => void;
  channel: string;
  setChannel: (channel: string) => void;
  query: string;
  setQuery: (query: string) => void;
}> = ({ view, setView, channel, setChannel, query, setQuery }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="hidden">
        <h3 className="text-xl font-bold text-slate-900">Performance do conteúdo</h3>
        <p className="text-sm text-slate-500">Compare peças por canal, template e activity_name vinculada.</p>
      </div>
      <div className="inline-flex rounded-2xl bg-slate-100/80 p-1 shadow-inner ring-1 ring-slate-200/70">
        {[
          ['overview', Gauge, 'Visão Geral'],
          ['gallery', Grid3X3, 'Galeria'],
          ['table', Table2, 'Tabela'],
        ].map(([id, Icon, label]) => (
          <button
            key={id as string}
            type="button"
            onClick={() => setView(id as ViewMode)}
            className={[
              'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
              view === id ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {React.createElement(Icon as typeof Gauge, { size: 15 })}
            {label as string}
          </button>
        ))}
      </div>
    </div>

    {view !== 'overview' && (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <CalendarDays size={14} />
          Período global
        </div>
        <button
          type="button"
          onClick={() => setChannel('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${channel === 'all' ? 'bg-slate-900 text-white ring-slate-900 shadow-sm' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
        >
          Todos
        </button>
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChannel(channel === c.key ? 'all' : c.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${channel === c.key ? c.tint : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex min-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID do template..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    )}
  </div>
);

const Overview: React.FC<{ data: ScoredTemplatePerformance[]; onOpen: (item: TemplatePerformance) => void }> = ({ data, onOpen }) => {
  const byScore = [...data].sort((a, b) => b.contentScore - a.contentScore);
  const champion = byScore[0];
  const totals = data.reduce((acc, item) => {
    acc.executions += item.executions;
    acc.base += item.baseEnviada;
    acc.aberturas += item.aberturas;
    acc.cliques += item.cliques;
    acc.cartoes += item.cartoes;
    acc.custo += item.custoEfetivo;
    return acc;
  }, { executions: 0, base: 0, aberturas: 0, cliques: 0, cartoes: 0, custo: 0 });
  const avgEngagement = totals.base > 0 ? totals.aberturas / totals.base : 0;
  const byChannel = CHANNELS.map((c) => {
    const items = data.filter((item) => normalize(item.template.channel).includes(c.key) || normalize(item.template.channel).includes(normalize(c.label)));
    return {
      ...c,
      templates: items.length,
      executions: items.reduce((sum, item) => sum + item.executions, 0),
      base: items.reduce((sum, item) => sum + item.baseEnviada, 0),
    };
  });
  const maxExecutions = Math.max(...byChannel.map((c) => c.executions), 1);

  if (!champion) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => onOpen(champion)}
          className="rounded-2xl bg-gradient-to-br from-teal-800 to-cyan-700 p-4 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 xl:col-span-1"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">Peça campeã</p>
            <TrendingUp size={18} className="text-cyan-100" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10">
              <span className="text-lg font-black">{champion.contentScore}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ChannelBadge channel={champion.template.channel} />
                <p className="truncate font-mono text-sm font-bold">{champion.template.template_id}</p>
              </div>
              <p className="mt-1 truncate text-xs text-cyan-100">{champion.template.title || 'Maior índice do recorte'}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-cyan-100">Índice beta relativo ao período filtrado</p>
        </button>

        <SummaryCard label="Disparos no período" value={int(totals.executions)} sub={`${data.length} templates com resultado`} icon={<Send size={18} />} />
        <SummaryCard label="Base acionada" value={compact(totals.base)} sub="Soma das execuções vinculadas" icon={<BarChart3 size={18} />} />
        <SummaryCard label="Engajamento médio" value={pct(avgEngagement, 1)} sub={`${int(totals.cliques)} cliques · ${int(totals.cartoes)} cartões`} icon={<Gauge size={18} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800">Volume por canal</h4>
              <p className="text-xs text-slate-400">Execuções vinculadas a templates no recorte atual.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {byChannel.map((c) => (
              <div key={c.key} className="grid grid-cols-[92px_1fr_120px] items-center gap-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(3, (c.executions / maxExecutions) * 100)}%`, background: c.color }} />
                </div>
                <div className="text-right text-xs text-slate-500">
                  <b className="text-slate-700">{int(c.executions)}</b> disp. · {c.templates} tmpl.
                </div>
              </div>
            ))}
          </div>
        </div>

        <ActionPanel data={data} onOpen={onOpen} />
        <div className="hidden">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-cyan-700 shadow-sm">
              <Gauge size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Próximo passo de inteligência</h4>
              <p className="mt-1 text-sm text-slate-500">
                As ações sugeridas ficam marcadas para a próxima etapa. Nesta versão, deixamos a base pronta:
                score beta, ordenação, visão por canal e drilldown por template/activity.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                Sem recomendações hardcoded nesta entrega.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h4 className="font-bold text-slate-800">Templates de maior sucesso</h4>
            <p className="text-xs text-slate-400">Ordenados pelo índice beta relativo ao recorte.</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {byScore.slice(0, 6).map((item, index) => (
            <button
              key={item.template.template_id}
              type="button"
              onClick={() => onOpen(item)}
              className="grid w-full grid-cols-[32px_1fr_90px_90px_minmax(120px,240px)] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className="text-sm font-bold text-slate-300">{index + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={item.template.channel} />
                  <span className="truncate font-mono text-xs font-bold text-slate-700">{item.template.template_id}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">{item.template.title || `${item.activityNames.length} activity_names`}</p>
              </div>
              <Metric label="Abertura" value={item.aberturas > 0 ? pct(item.taxaAbertura, 1) : '—'} />
              <Metric label="Cartões" value={int(item.cartoes)} accent />
              <ScoreBar score={item.contentScore} compact />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; sub: string; icon: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="rounded-xl bg-slate-50 p-2 text-slate-400">{icon}</div>
    </div>
    <p className="mt-5 text-3xl font-black text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{sub}</p>
  </div>
);

const ActionPanel: React.FC<{ data: ScoredTemplatePerformance[]; onOpen: (item: TemplatePerformance) => void }> = ({ data, onOpen }) => {
  const actions = buildSuggestedActions(data);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <Flame size={16} />
          </span>
          <div>
            <h4 className="font-bold text-slate-800">Ações sugeridas</h4>
            <p className="text-xs text-slate-400">Regras simples por peça · inteligência avançada depois</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {actions.map((action) => (
          <button
            key={`${action.tone}-${action.item.template.template_id}`}
            type="button"
            onClick={() => onOpen(action.item)}
            className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-transform hover:-translate-y-0.5 ${toneClasses[action.tone]}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 font-black shadow-sm">
              {action.tone === 'good' ? '↑' : action.tone === 'warn' ? '!' : '△'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black">{action.title}</span>
              <span className="mt-0.5 block text-xs leading-snug opacity-80">{action.text}</span>
            </span>
            <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold shadow-sm transition-colors group-hover:bg-white">
              Ver peça →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChannelBadge: React.FC<{ channel: string }> = ({ channel }) => {
  const meta = channelMeta(channel);
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ring-1 ${meta.tint}`}>
      {meta.short}
    </span>
  );
};

const GalleryCard: React.FC<{ item: ScoredTemplatePerformance; onOpen: () => void }> = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-900/5"
  >
    <div className="relative bg-gradient-to-br from-cyan-50/40 via-white to-indigo-50/30 px-4 pt-4">
      <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {item.template.status === 'active' ? 'No ar' : item.template.status}
      </div>
      <div className="absolute right-3 top-3 z-10">
        <ChannelBadge channel={item.template.channel} />
      </div>
      <TemplatePreview item={item} className="h-48 rounded-t-xl" />
    </div>
    <div className="space-y-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-black text-slate-800" title={item.template.template_id}>{item.template.template_id}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{item.template.title || `${item.activityNames.length} activity_name${item.activityNames.length === 1 ? '' : 's'}`}</p>
      </div>
      <ScoreBar score={item.contentScore} />
      <div className="flex flex-wrap gap-1.5">
        {item.activityNames.length > 0 && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{item.activityNames.length} activity_names</span>}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{int(item.executions)} exec.</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Metric label="Abertura" value={item.aberturas > 0 ? pct(item.taxaAbertura, 0) : '—'} />
        <Metric label="CTR" value={pct(item.ctr, 2)} />
        <Metric label="Cartões" value={int(item.cartoes)} accent />
        <Metric label={item.custoEstimado ? 'CAC*' : 'CAC'} value={item.cacEfetivo > 0 ? brl(item.cacEfetivo) : '—'} />
      </div>
    </div>
  </button>
);

const Gallery: React.FC<{ data: ScoredTemplatePerformance[]; onOpen: (item: TemplatePerformance) => void }> = ({ data, onOpen }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {data.map((item) => (
      <GalleryCard key={item.template.template_id} item={item} onOpen={() => onOpen(item)} />
    ))}
  </div>
);

const Sparkline: React.FC<{ item: ScoredTemplatePerformance }> = ({ item }) => {
  const values = item.timeline.map((p) => p.cartoes);
  const max = Math.max(...values, 1);
  const points = values.length <= 1 ? [0, values[0] ?? 0] : values;
  const width = 92;
  const height = 28;
  const step = width / Math.max(points.length - 1, 1);
  const d = points.map((v, i) => {
    const x = i * step;
    const y = height - ((v / max) * (height - 6)) - 3;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={`${d} L${width} ${height} L0 ${height} Z`} fill={channelMeta(item.template.channel).color} opacity="0.08" />
      <path d={d} fill="none" stroke={channelMeta(item.template.channel).color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TableView: React.FC<{ data: ScoredTemplatePerformance[]; onOpen: (item: TemplatePerformance) => void }> = ({ data, onOpen }) => {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'score', dir: 'desc' });
  const sorted = useMemo(() => {
    const get = (item: ScoredTemplatePerformance) => {
      if (sort.key === 'score') return item.contentScore;
      if (sort.key === 'taxaAbertura') return item.taxaAbertura;
      return Number(item[sort.key] ?? 0);
    };
    return [...data].sort((a, b) => (get(a) - get(b)) * (sort.dir === 'asc' ? 1 : -1));
  }, [data, sort]);
  const setSortKey = (key: SortKey) => setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  const cols: Array<{ key: SortKey; label: string }> = [
    { key: 'taxaAbertura', label: 'Abertura' },
    { key: 'ctr', label: 'Clique' },
    { key: 'taxaConversao', label: 'Conversão' },
    { key: 'cartoes', label: 'Cartões' },
    { key: 'cacEfetivo', label: 'CAC' },
    { key: 'score', label: 'Score' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">Template / criativo</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">Contexto</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</th>
              {cols.map((col) => (
                <th key={col.key} className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <button type="button" onClick={() => setSortKey(col.key)} className="inline-flex items-center gap-1 hover:text-slate-700">
                    {col.label}
                    {sort.key === col.key && <span>{sort.dir === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">Tendência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sorted.map((item) => (
              <tr key={item.template.template_id} onClick={() => onOpen(item)} className="cursor-pointer transition-colors hover:bg-cyan-50/40">
                <td className="max-w-[360px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <MiniTemplateThumb item={item} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={item.template.channel} />
                        <span className="truncate font-mono text-xs font-black text-slate-800">{item.template.template_id}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{item.template.title || `${item.activityNames.length} activity_names`}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <div className="font-semibold text-slate-600">{item.activityNames.length} activity_name{item.activityNames.length === 1 ? '' : 's'}</div>
                  <div>{int(item.executions)} execuções</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 size={11} />
                    {item.template.status === 'active' ? 'No ar' : item.template.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">{item.aberturas > 0 ? pct(item.taxaAbertura, 1) : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">{pct(item.ctr, 2)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">{pct(item.taxaConversao, 3)}</td>
                <td className="px-4 py-3 text-right font-black tabular-nums text-cyan-700">{int(item.cartoes)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">{item.cacEfetivo > 0 ? `${brl(item.cacEfetivo)}${item.custoEstimado ? '*' : ''}` : '—'}</td>
                <td className="px-4 py-3 text-right"><ScoreBar score={item.contentScore} compact /></td>
                <td className="px-4 py-3 text-right"><Sparkline item={item} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-400">
        * Custo/CAC estimado quando não há custo real vinculado ao disparo. O score é beta e relativo ao recorte filtrado.
      </div>
    </div>
  );
};

export const TemplatePerformanceGrid: React.FC = () => {
  const { data, loading, error, refetch } = useTemplatePerformance();
  const { startDate, endDate } = usePeriod();
  const [selected, setSelected] = useState<TemplatePerformance | null>(null);
  const [view, setView] = useState<ViewMode>('overview');
  const [channel, setChannel] = useState('all');
  const [query, setQuery] = useState('');

  const scored = useMemo(() => computeScoredData(data), [data]);
  const filtered = useMemo(() => {
    const q = normalize(query);
    return scored.filter((item) => {
      const channelText = normalize(item.template.channel);
      const matchesChannel = channel === 'all' || channelText.includes(channel) || channelText.includes(normalize(channelMeta(channel).label));
      const searchable = normalize([
        item.template.template_id,
        item.template.title,
        item.template.channel,
        item.activityNames.join(' '),
      ].join(' '));
      return matchesChannel && (!q || searchable.includes(q));
    });
  }, [scored, channel, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin" /> Calculando performance...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <BarChart3 size={32} className="text-slate-300" />
        <p className="max-w-md text-sm text-slate-400">
          A performance por template aparece conforme os disparos cadastrados acumulam resultado.
        </p>
      </div>
    );
  }

  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;

  return (
    <>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <HeaderControls view={view} setView={setView} channel={channel} setChannel={setChannel} query={query} setQuery={setQuery} />
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          Recorte atual: <b className="text-slate-700">{periodLabel}</b> · {filtered.length} de {data.length} templates exibidos
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Search size={30} className="text-slate-300" />
            <p className="max-w-md text-sm text-slate-400">Nenhum template encontrado para o filtro atual.</p>
          </div>
        ) : view === 'overview' ? (
          <Overview data={filtered} onOpen={setSelected} />
        ) : view === 'gallery' ? (
          <Gallery data={filtered} onOpen={setSelected} />
        ) : (
          <TableView data={filtered} onOpen={setSelected} />
        )}
      </div>

      {selected && <CommunicationDetailModal item={selected} onClose={() => setSelected(null)} onChanged={refetch} />}
    </>
  );
};
