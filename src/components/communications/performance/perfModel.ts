// ─── Modelo de Performance do Conteúdo ───────────────────────────────────────
// Portado do protótipo "performance" para os dados REAIS do useTemplatePerformance.
// Diferença de unidade: o protótipo usava métricas já em PERCENTUAL; o hook real
// entrega FRAÇÕES (ctr/taxaAbertura/taxaConversao = x/baseEnviada). Aqui tudo é
// convertido para percentual ao pontuar contra os benchmarks de cada canal.

import type { TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import type { ActivityRow } from '../../../types/activity';
import { channelSlug } from '../../../utils/inferChannel';

export type ChannelKey = 'email' | 'whatsapp' | 'push' | 'sms';
export type Tone = 'good' | 'warn' | 'bad' | 'na';

export interface ChannelMeta {
  key: ChannelKey;
  label: string;
  short: string;
  color: string;
  dark: string;
  tint: string;
}

export const CHANNELS: Record<ChannelKey, ChannelMeta> = {
  email:    { key: 'email',    label: 'E-mail',   short: 'EM',   color: '#6366f1', dark: '#4338ca', tint: '#eef0ff' },
  whatsapp: { key: 'whatsapp', label: 'WhatsApp', short: 'WPP',  color: '#25D366', dark: '#0c7c54', tint: '#e4faec' },
  push:     { key: 'push',     label: 'Push',     short: 'PUSH', color: '#f59e0b', dark: '#b45309', tint: '#fef3c7' },
  sms:      { key: 'sms',      label: 'SMS',      short: 'SMS',  color: '#0ea5e9', dark: '#0369a1', tint: '#e0f4fe' },
};

export const CHANNEL_ORDER: ChannelKey[] = ['whatsapp', 'email', 'push', 'sms'];

export function channelKeyOf(channel: string | null | undefined): ChannelKey {
  const slug = channelSlug(channel ?? '');
  if (slug === 'email' || slug === 'whatsapp' || slug === 'push' || slug === 'sms') return slug;
  return 'email';
}

export const BU_COLORS: Record<string, string> = {
  B2C: '#3b82f6',
  B2B2C: '#10b981',
  Plurix: '#a855f7',
  Seguros: '#f59e0b',
};

export function buColor(bu: string | null | undefined): string {
  return BU_COLORS[bu ?? ''] ?? '#64748b';
}

// ── Modelo de score (benchmarks por canal; pesos das métricas disponíveis) ────
interface ScoreCfg {
  weights: Partial<Record<ScoreMetric, number>>;
  targets: Partial<Record<'entrega' | 'abertura' | 'ctr' | 'conversao', number>>; // em %
  cacBest?: number;
  cacCap?: number;
  metricNames: Partial<Record<ScoreMetric, string>>;
}

export type ScoreMetric = 'entrega' | 'abertura' | 'ctr' | 'conversao' | 'cacEff';

export const SCORE_CFG: Record<ChannelKey, ScoreCfg> = {
  email: {
    weights: { entrega: 0.10, abertura: 0.20, ctr: 0.22, conversao: 0.33, cacEff: 0.15 },
    targets: { entrega: 99, abertura: 35, ctr: 0.15, conversao: 0.012 },
    cacBest: 12, cacCap: 60,
    metricNames: { entrega: 'Entrega', abertura: 'Abertura', ctr: 'Clique (CTR)', conversao: 'Conversão', cacEff: 'Eficiência de CAC' },
  },
  whatsapp: {
    weights: { abertura: 0.30, conversao: 0.45, cacEff: 0.25 },
    targets: { abertura: 70, conversao: 1.6 },
    cacBest: 0.20, cacCap: 5,
    metricNames: { abertura: 'Abertura', conversao: 'Conversão', cacEff: 'Eficiência de CAC' },
  },
  push: {
    weights: { entrega: 0.25, abertura: 0.40, ctr: 0.35 },
    targets: { entrega: 96, abertura: 40, ctr: 9 },
    metricNames: { entrega: 'Entrega', abertura: 'Abertura', ctr: 'Clique (CTR)' },
  },
  sms: {
    weights: { entrega: 0.35, ctr: 0.65 },
    targets: { entrega: 97, ctr: 6 },
    metricNames: { entrega: 'Entrega', ctr: 'Clique (CTR)' },
  },
};

// ── Formatadores pt-BR ────────────────────────────────────────────────────────
export const fmt = {
  int: (n: number | null | undefined) => (n == null ? '—' : Math.round(n).toLocaleString('pt-BR')),
  k: (n: number | null | undefined) => {
    if (n == null) return '—';
    if (n >= 1000) return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k`;
    return String(Math.round(n));
  },
  /** recebe FRAÇÃO (0–1) e mostra percentual */
  pctFrac: (n: number | null | undefined, d = 2) =>
    n == null ? '—' : `${(n * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`,
  brl: (n: number | null | undefined) =>
    n == null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
};

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }
function metricScore(valPct: number | null, targetPct?: number): number | null {
  if (valPct == null || !targetPct) return null;
  return clamp((valPct / targetPct) * 100);
}
function cacScore(cac: number | null, best?: number, cap?: number): number | null {
  if (cac == null || cac <= 0 || best == null || cap == null) return null;
  return clamp(((cap - cac) / (cap - best)) * 100);
}

export function scoreTone(s: number | null): Tone {
  return s == null ? 'na' : s >= 70 ? 'good' : s >= 45 ? 'warn' : 'bad';
}

export interface ScoreBreakdownRow {
  metric: ScoreMetric;
  name: string;
  weight: number;
  score: number | null;
  raw: string | null;
}

// Métricas derivadas do template real, já em PERCENTUAL para o cálculo de score.
interface RealMetrics {
  channel: ChannelKey;
  aberturasMedidas: boolean;
  abPct: number | null;     // taxa de abertura em %
  ctrPct: number | null;    // CTR em %
  convPct: number | null;   // conversão em %
  cac: number | null;       // BRL (efetivo)
}

function realMetrics(item: TemplatePerformance): RealMetrics {
  const ch = channelKeyOf(item.template.channel);
  const aberturasMedidas = item.aberturas > 0;
  const abPct = item.baseEnviada > 0 && aberturasMedidas ? (item.aberturas / item.baseEnviada) * 100 : null;
  const ctrPct = item.baseEnviada > 0 ? item.ctr * 100 : null;
  const convPct = item.baseEnviada > 0 ? item.taxaConversao * 100 : null;
  const cac = item.cacEfetivo > 0 ? item.cacEfetivo : null;
  return { channel: ch, aberturasMedidas, abPct, ctrPct, convPct, cac };
}

export function scoreBreakdown(item: TemplatePerformance): ScoreBreakdownRow[] {
  const m = realMetrics(item);
  const cfg = SCORE_CFG[m.channel];
  const out: ScoreBreakdownRow[] = [];
  for (const [metricRaw, weight] of Object.entries(cfg.weights)) {
    const metric = metricRaw as ScoreMetric;
    let score: number | null = null;
    let raw: string | null = null;
    switch (metric) {
      case 'cacEff':
        score = cacScore(m.cac, cfg.cacBest, cfg.cacCap);
        raw = m.cac == null ? null : fmt.brl(m.cac);
        break;
      case 'entrega':
        // taxa de entrega não é rastreada no hook → métrica indisponível
        score = null; raw = null;
        break;
      case 'abertura':
        score = metricScore(m.abPct, cfg.targets.abertura);
        raw = m.abPct == null ? null : `${m.abPct.toLocaleString('pt-BR', { maximumFractionDigits: m.abPct < 10 ? 1 : 0 })}%`;
        break;
      case 'ctr':
        score = metricScore(m.ctrPct, cfg.targets.ctr);
        raw = m.ctrPct == null ? null : `${m.ctrPct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        break;
      case 'conversao':
        score = metricScore(m.convPct, cfg.targets.conversao);
        raw = m.convPct == null ? null : `${m.convPct.toLocaleString('pt-BR', { maximumFractionDigits: m.convPct < 0.01 ? 3 : 2 })}%`;
        break;
    }
    out.push({ metric, name: cfg.metricNames[metric] ?? metric, weight: weight as number, score: score == null ? null : Math.round(score), raw });
  }
  return out;
}

export function computeScore(item: TemplatePerformance): number | null {
  const bd = scoreBreakdown(item);
  let sum = 0, wsum = 0;
  for (const b of bd) {
    if (b.score != null) { sum += b.score * b.weight; wsum += b.weight; }
  }
  return wsum ? Math.round(sum / wsum) : null;
}

// ── Diagnóstico (vocabulário fechado) — DERIVADO das métricas reais ───────────
export interface DiagDef { label: string; tone: Exclude<Tone, 'na'> | 'info'; hint: string; }

export const DIAG: Record<string, DiagDef> = {
  escalar:        { label: 'Escalar',                 tone: 'good', hint: 'Eficiência muito acima da média do canal. Aumente a base e a frequência.' },
  revisar_cta:    { label: 'Revisar CTA',             tone: 'warn', hint: 'Abre bem, mas não clica/converte. O gargalo está no conteúdo e no botão.' },
  revisar_oferta: { label: 'Revisar oferta',          tone: 'warn', hint: 'Bom clique, baixa conversão. A oferta ou a página de destino não sustentam o interesse.' },
  baixa_conv:     { label: 'Bom alcance, baixa conv', tone: 'warn', hint: 'Alcance e abertura saudáveis, mas a conversão para cartão fica abaixo da média.' },
  baixa_abertura: { label: 'Baixa abertura',          tone: 'bad',  hint: 'Abertura muito abaixo do canal. Revisar assunto, remetente e horário de disparo.' },
  cac_alto:       { label: 'CAC alto',                tone: 'bad',  hint: 'Custo por cartão acima do teto do canal. Reavaliar oferta, base e investimento.' },
  volume:         { label: 'Volume sem resultado',    tone: 'bad',  hint: 'Base grande com pouquíssimo cartão — alto custo de oportunidade.' },
  custo_parcial:  { label: 'Custo não medido',        tone: 'info', hint: 'Parte dos disparos sem custo vinculado — CAC ainda é estimado.' },
};

export function deriveDiagnoses(item: TemplatePerformance, score: number | null): string[] {
  const m = realMetrics(item);
  const cfg = SCORE_CFG[m.channel];
  const tgtAb = cfg.targets.abertura;
  const tgtCtr = cfg.targets.ctr;
  const tgtConv = cfg.targets.conversao;
  const out: string[] = [];

  if (score != null && score >= 80) out.push('escalar');

  if (tgtAb && m.aberturasMedidas && m.abPct != null && m.abPct < tgtAb * 0.45) out.push('baixa_abertura');

  if (cfg.cacCap && m.cac != null && m.cac > cfg.cacCap) out.push('cac_alto');

  // gargalo de conversão: prioriza o sinal mais específico
  if (tgtAb && tgtConv && m.abPct != null && m.convPct != null && m.abPct >= tgtAb * 0.9 && m.convPct < tgtConv * 0.4) {
    out.push('revisar_cta');
  } else if (tgtCtr && tgtConv && m.ctrPct != null && m.convPct != null && m.ctrPct >= tgtCtr * 0.9 && m.convPct < tgtConv * 0.5) {
    out.push('revisar_oferta');
  } else if (tgtAb && tgtConv && m.abPct != null && m.convPct != null && m.convPct > 0 && m.convPct < tgtConv * 0.6 && m.abPct >= tgtAb * 0.6) {
    out.push('baixa_conv');
  }

  if (item.baseEnviada > 50000 && item.cartoes <= 5) out.push('volume');

  if (item.custoEstimado) out.push('custo_parcial');

  return Array.from(new Set(out));
}

// ── Facetas do template (segmento/campanha/safra/período) ─────────────────────
// A força da activity_name: tem muitas colunas no Supabase. Extraímos as
// dimensões de referência a partir das activities vinculadas ao template.
export interface TemplateFacets {
  segmentos: string[];
  jornadas: string[];
  safras: string[];
  parceiros: string[];
  subgrupos: string[];
  produtos: string[];
  ofertas: string[];
  etapas: string[];
  periodStart: string | null;
  periodEnd: string | null;
}

const uniqStr = (vals: Array<string | null | undefined>): string[] =>
  Array.from(new Set(vals.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim())));

export function templateFacets(item: TemplatePerformance): TemplateFacets {
  const rows = item.timeline.flatMap((p) => p.activities) as unknown as ActivityRow[];
  const dates = item.timeline.map((p) => p.date).filter((d) => d !== 'sem-data').sort();
  return {
    segmentos: uniqStr(rows.map((r) => r.Segmento)),
    jornadas: uniqStr(rows.map((r) => r.jornada)),
    safras: uniqStr(rows.map((r) => r.Safra)),
    parceiros: uniqStr(rows.map((r) => r.Parceiro)),
    subgrupos: uniqStr(rows.map((r) => r.Subgrupos)),
    produtos: uniqStr(rows.map((r) => r.Produto)),
    ofertas: uniqStr(rows.map((r) => r.Oferta ?? undefined)),
    etapas: uniqStr(rows.map((r) => r['Etapa de aquisição'])),
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
  };
}

const dm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
export function facetPeriodLabel(f: TemplateFacets): string | null {
  if (!f.periodStart) return null;
  return f.periodStart === f.periodEnd || !f.periodEnd ? dm(f.periodStart) : `${dm(f.periodStart)}–${dm(f.periodEnd)}`;
}

// ── Tipo enriquecido + builder ────────────────────────────────────────────────
export interface ScoredTemplate extends TemplatePerformance {
  channelKey: ChannelKey;
  score: number | null;
  tone: Tone;
  breakdown: ScoreBreakdownRow[];
  diagnoses: string[];
  taxaAbertura: number; // fração
  facets: TemplateFacets;
}

export function scoreTemplate(item: TemplatePerformance): ScoredTemplate {
  const breakdown = scoreBreakdown(item);
  const score = computeScore(item);
  return {
    ...item,
    channelKey: channelKeyOf(item.template.channel),
    score,
    tone: scoreTone(score),
    breakdown,
    diagnoses: deriveDiagnoses(item, score),
    taxaAbertura: item.baseEnviada > 0 ? item.aberturas / item.baseEnviada : 0,
    facets: templateFacets(item),
  };
}

/** Blob de busca: id + título + activity_names + jornadas + segmentos + safras + parceiros. */
export function searchBlob(t: ScoredTemplate): string {
  return [
    t.template.template_id, t.template.title, t.template.family,
    ...t.activityNames, ...t.facets.jornadas, ...t.facets.segmentos,
    ...t.facets.safras, ...t.facets.parceiros, ...t.facets.subgrupos,
  ].filter(Boolean).join(' ').toLowerCase();
}

// ── Agregações para a Visão Geral ─────────────────────────────────────────────
export interface ChannelStats {
  channel: ChannelKey;
  templates: number;
  disparos: number;
  base: number;
  aberturas: number;
  cartoes: number;
  txAbertura: number; // fração
  avgScore: number | null;
}

export function channelStats(items: ScoredTemplate[]): Record<ChannelKey, ChannelStats> {
  const out = {} as Record<ChannelKey, ChannelStats>;
  for (const ch of CHANNEL_ORDER) {
    const ts = items.filter((t) => t.channelKey === ch);
    const base = ts.reduce((a, t) => a + t.baseEnviada, 0);
    const aberturas = ts.reduce((a, t) => a + t.aberturas, 0);
    const withScore = ts.filter((t) => t.score != null);
    out[ch] = {
      channel: ch,
      templates: ts.length,
      disparos: ts.reduce((a, t) => a + t.executions, 0),
      base,
      aberturas,
      cartoes: ts.reduce((a, t) => a + t.cartoes, 0),
      txAbertura: base > 0 ? aberturas / base : 0,
      avgScore: withScore.length ? Math.round(withScore.reduce((a, t) => a + (t.score ?? 0), 0) / withScore.length) : null,
    };
  }
  return out;
}

export interface DispatchDay { dia: string; date: string; email: number; whatsapp: number; push: number; sms: number; }

/** Volume de disparos (execuções) por dia e canal, derivado das timelines. */
export function dispatchTimeline(items: ScoredTemplate[]): DispatchDay[] {
  const byDate = new Map<string, DispatchDay>();
  for (const t of items) {
    for (const p of t.timeline) {
      if (p.date === 'sem-data') continue;
      let day = byDate.get(p.date);
      if (!day) {
        day = { dia: p.date.slice(8, 10), date: p.date, email: 0, whatsapp: 0, push: 0, sms: 0 };
        byDate.set(p.date, day);
      }
      day[t.channelKey] += p.executions;
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface PerfTotals {
  disparos: number; templates: number; base: number; aberturas: number; cartoes: number; realChannels: number;
}

export function perfTotals(items: ScoredTemplate[], stats: Record<ChannelKey, ChannelStats>): PerfTotals {
  return {
    disparos: items.reduce((a, t) => a + t.executions, 0),
    templates: items.length,
    base: items.reduce((a, t) => a + t.baseEnviada, 0),
    aberturas: items.reduce((a, t) => a + t.aberturas, 0),
    cartoes: items.reduce((a, t) => a + t.cartoes, 0),
    realChannels: CHANNEL_ORDER.filter((ch) => stats[ch].templates > 0).length,
  };
}

// ── Ações sugeridas (derivadas dos diagnósticos) ──────────────────────────────
export interface SuggestedAction {
  tone: 'good' | 'warn' | 'bad';
  title: string;
  text: string;
  item: ScoredTemplate;
}

const labelOf = (t: ScoredTemplate) => t.template.template_id;

export function suggestedActions(items: ScoredTemplate[]): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const used = new Set<string>();
  const push = (a: SuggestedAction) => {
    if (used.has(a.item.template.template_id)) return;
    used.add(a.item.template.template_id);
    actions.push(a);
  };

  const byScore = [...items].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const best = byScore[0];
  if (best && (best.score ?? 0) >= 60) {
    push({
      tone: 'good',
      title: `Escalar ${labelOf(best)}`,
      text: `Score ${best.score} e ${fmt.pctFrac(best.taxaAbertura, best.taxaAbertura < 0.1 ? 1 : 0)} de abertura. Amplie base e frequência desta peça.`,
      item: best,
    });
  }

  const highVol = items.filter((t) => t.baseEnviada > 1000 && t.aberturas > 0);
  const lowOpen = [...highVol].sort((a, b) => a.taxaAbertura - b.taxaAbertura)[0];
  if (lowOpen) {
    push({
      tone: 'bad',
      title: `Revisar abertura de ${labelOf(lowOpen)}`,
      text: `Volume relevante com abertura de ${fmt.pctFrac(lowOpen.taxaAbertura, 1)} sobre ${fmt.k(lowOpen.baseEnviada)} de base. Testar assunto e horário.`,
      item: lowOpen,
    });
  }

  const highCac = [...items]
    .filter((t) => t.cacEfetivo > 0 && t.cartoes > 0)
    .sort((a, b) => b.cacEfetivo - a.cacEfetivo)[0];
  if (highCac && highCac.diagnoses.includes('cac_alto')) {
    push({
      tone: 'bad',
      title: `Conter custo de ${labelOf(highCac)}`,
      text: `CAC de ${fmt.brl(highCac.cacEfetivo)}${highCac.custoEstimado ? ' (estimado)' : ''} — acima do teto do canal. Reavaliar oferta e base.`,
      item: highCac,
    });
  }

  const ctaIssue = items.find((t) => t.diagnoses.includes('revisar_cta') && !used.has(t.template.template_id));
  if (ctaIssue) {
    push({
      tone: 'warn',
      title: `Revisar CTA de ${labelOf(ctaIssue)}`,
      text: `Boa abertura (${fmt.pctFrac(ctaIssue.taxaAbertura, 1)}) mas conversão baixa. O gargalo está no botão e na oferta.`,
      item: ctaIssue,
    });
  }

  return actions.slice(0, 4);
}

// ── Texto de contexto (segmento · campanha) a partir da activity_name ────────
export function contextLabel(t: ScoredTemplate): string {
  const parts: string[] = [];
  if (t.facets.segmentos[0]) parts.push(t.facets.segmentos[0]);
  if (t.facets.jornadas[0]) parts.push(t.facets.jornadas[0]);
  if (!parts.length && t.template.family) parts.push(String(t.template.family));
  if (!parts.length && t.activityNames.length) parts.push(`${t.activityNames.length} activity_name${t.activityNames.length === 1 ? '' : 's'}`);
  return parts.join(' · ') || '—';
}
