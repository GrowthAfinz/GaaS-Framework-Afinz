/**
 * Pool Visa: custo do CRM contra o que ele gera (cliques na comunicação, acessos e cliques na LP).
 *
 * Regras:
 * - Custo por acesso à LP usa só o custo dos canais que levam à LP (SMS e WhatsApp). Pelo desenho,
 *   o e-mail leva direto às ofertas e não gera sessão na LP.
 * - Sessões e cliques da LP contam SMS, WhatsApp e Direto (sem UTM). "Outras origens" ficam fora.
 * - Custo por clique em oferta soma os dois caminhos até a oferta: clique no e-mail + clique em
 *   oferta na LP, contra o custo total.
 * - Custo desconhecido em alguma linha deixa a razão indisponível (null), nunca zero.
 * - A hipótese de atribuição do Direto só redistribui o Direto entre SMS e WhatsApp; os totais da LP
 *   não mudam.
 */
import type { PoolDispatchRow } from './poolVisaModel';
import { filterLpEvents, filterLpTraffic, type LpEventRow, type LpFilters, type LpOrigin, type LpTrafficRow } from './poolVisaLpModel';

export const LP_CHANNELS = ['SMS', 'WhatsApp'] as const;
export type LpChannel = (typeof LP_CHANNELS)[number];
const CHANNEL_ORIGIN: Record<LpChannel, 'sms' | 'whatsapp'> = { SMS: 'sms', WhatsApp: 'whatsapp' };
export const CRM_ORIGINS: LpOrigin[] = ['sms', 'whatsapp', 'direto'];

export type DirectAttribution = 'none' | 'day' | 'sms';
export const DIRECT_ATTRIBUTION_LABELS: Record<DirectAttribution, string> = {
  none: 'Não atribuir o Direto',
  day: 'Direto = canal CRM do último disparo',
  sms: 'Direto = SMS',
};

export interface CostSum { value: number | null; known: number; total: number; estimated: number }

export function sumCost(rows: PoolDispatchRow[]): CostSum {
  let value = 0;
  let known = 0;
  let estimated = 0;
  for (const r of rows) {
    if (r.channelCost === null || r.channelCost === undefined) continue;
    value += r.channelCost;
    known++;
    if (r.estimatedCost) estimated++;
  }
  return { value: known ? value : null, known, total: rows.length, estimated };
}

/** Razão só quando o custo é conhecido em todas as linhas e o volume é positivo. */
export const costRatio = (cost: CostSum, volume: number | null): number | null =>
  cost.value !== null && cost.known === cost.total && volume !== null && volume > 0 ? cost.value / volume : null;

const lpOrigins = (f: LpFilters): LpOrigin[] => (f.origins ? f.origins.filter((o) => CRM_ORIGINS.includes(o)) : CRM_ORIGINS);

export interface CrmCostSummary {
  total: CostSum;
  lpChannels: CostSum;
  commClicks: number;
  commClicksKnown: boolean;
  lpSessions: number | null;
  lpOfferClicks: number;
  costPerAccess: number | null;
  costPerLpOfferClick: number | null;
  costPerOfferClick: number | null;
}

/** Visão executiva do custo do CRM no recorte. `rows` e `f` já filtrados. */
export function crmCostSummary(rows: PoolDispatchRow[], traffic: LpTrafficRow[], events: LpEventRow[], f: LpFilters): CrmCostSummary {
  const disparos = rows.filter((r) => r.kind === 'disparo');
  const total = sumCost(disparos);
  const lpChannels = sumCost(disparos.filter((r) => (LP_CHANNELS as readonly string[]).includes(r.channel)));
  const withClicks = disparos.filter((r) => r.clicks !== null);
  const commClicks = withClicks.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const origins = lpOrigins(f);
  const lpF = { ...f, origins };
  const lpSessions = f.group || f.cell ? null : filterLpTraffic(traffic, lpF).reduce((s, r) => s + r.sessions, 0);
  const lpOfferClicks = filterLpEvents(events, lpF).filter((e) => e.event === 'clique_oferta').reduce((s, e) => s + e.count, 0);
  return {
    total, lpChannels, commClicks, commClicksKnown: withClicks.length > 0, lpSessions, lpOfferClicks,
    costPerAccess: costRatio(lpChannels, lpSessions),
    costPerLpOfferClick: costRatio(lpChannels, lpOfferClicks),
    costPerOfferClick: costRatio(total, commClicks + lpOfferClicks),
  };
}

export interface DispatchMark { date: string; channel: LpChannel; delivered: number }

/** Disparos dos canais que levam à LP, por dia e canal. */
export function lpDispatchMarks(rows: PoolDispatchRow[]): DispatchMark[] {
  const by = new Map<string, DispatchMark>();
  for (const r of rows) {
    if (r.kind !== 'disparo' || !(LP_CHANNELS as readonly string[]).includes(r.channel)) continue;
    const k = `${r.date}|${r.channel}`;
    const m = by.get(k) ?? { date: r.date, channel: r.channel as LpChannel, delivered: 0 };
    m.delivered += r.delivered ?? 0;
    by.set(k, m);
  }
  return [...by.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Para onde vai o Direto de um dia, como frações por canal. Vazio = fica como Direto. */
export function directShare(day: string, mode: DirectAttribution, marks: DispatchMark[]): Partial<Record<LpChannel, number>> {
  if (mode === 'none') return {};
  if (mode === 'sms') return { SMS: 1 };
  const before = marks.filter((m) => m.date <= day);
  if (!before.length) return {};
  const last = before[before.length - 1].date;
  const same = before.filter((m) => m.date === last);
  const total = same.reduce((s, m) => s + m.delivered, 0);
  const out: Partial<Record<LpChannel, number>> = {};
  for (const m of same) out[m.channel] = total > 0 ? m.delivered / total : 1 / same.length;
  return out;
}

export interface ChannelLp { sessions: number; offerClicks: number; hypSessions: number; hypOfferClicks: number }

/** Sessões e cliques em oferta por canal, com a parte do Direto atribuída pela hipótese. */
export function lpByChannel(traffic: LpTrafficRow[], events: LpEventRow[], f: LpFilters, mode: DirectAttribution, marks: DispatchMark[]): Record<LpChannel, ChannelLp> {
  const out: Record<LpChannel, ChannelLp> = { SMS: { sessions: 0, offerClicks: 0, hypSessions: 0, hypOfferClicks: 0 }, WhatsApp: { sessions: 0, offerClicks: 0, hypSessions: 0, hypOfferClicks: 0 } };
  const add = (origin: LpOrigin, day: string, n: number, key: 'sessions' | 'offerClicks') => {
    if (origin === 'sms') out.SMS[key] += n;
    else if (origin === 'whatsapp') out.WhatsApp[key] += n;
    else if (origin === 'direto') {
      const hyp = key === 'sessions' ? 'hypSessions' : 'hypOfferClicks';
      for (const [ch, share] of Object.entries(directShare(day, mode, marks)) as [LpChannel, number][]) out[ch][hyp] += n * share;
    }
  };
  const lpF = { ...f, origins: null };
  for (const r of filterLpTraffic(traffic, lpF)) add(r.origin, r.date, r.sessions, 'sessions');
  for (const e of filterLpEvents(events, lpF)) if (e.event === 'clique_oferta') add(e.origin, e.date, e.count, 'offerClicks');
  return out;
}

/** Redistribui o Direto de um dia da faixa da LP para chaves de hipótese (smsHyp, whatsappHyp). */
export function reassignDirect(day: string, o: Partial<Record<LpOrigin, number>>, mode: DirectAttribution, marks: DispatchMark[]): Record<string, number> {
  const out: Record<string, number> = { ...(o as Record<string, number>) };
  const direct = o.direto ?? 0;
  const share = directShare(day, mode, marks);
  if (!direct || !Object.keys(share).length) return out;
  delete out.direto;
  for (const [ch, s] of Object.entries(share) as [LpChannel, number][]) out[`${CHANNEL_ORIGIN[ch]}Hyp`] = (out[`${CHANNEL_ORIGIN[ch]}Hyp`] ?? 0) + direct * s;
  return out;
}

/** commCost = custo só das linhas que informam clique (no Pool, o e-mail). */
export interface PeriodCost { key: string; total: CostSum; lpChannels: CostSum; commCost: CostSum; commClicks: number; lpSessions: number; lpOfferClicks: number }
export interface PeriodCostRatios { costPerCommClick: number | null; costPerAccess: number | null; costPerLpOfferClick: number | null; costPerOfferClick: number | null }

/** Custo e volumes por período (dia ou mês) para o Diário e o Mensal. */
export function costByPeriod(rows: PoolDispatchRow[], traffic: LpTrafficRow[], events: LpEventRow[], f: LpFilters, key: (d: string) => string): Map<string, PeriodCost> {
  const out = new Map<string, PeriodCost>();
  const empty = (k: string): PeriodCost => ({ key: k, total: { value: null, known: 0, total: 0, estimated: 0 }, lpChannels: { value: null, known: 0, total: 0, estimated: 0 }, commCost: { value: null, known: 0, total: 0, estimated: 0 }, commClicks: 0, lpSessions: 0, lpOfferClicks: 0 });
  const get = (k: string) => { let v = out.get(k); if (!v) { v = empty(k); out.set(k, v); } return v; };
  const byKey = new Map<string, PoolDispatchRow[]>();
  for (const r of rows) if (r.kind === 'disparo') { const k = key(r.date); byKey.set(k, [...(byKey.get(k) ?? []), r]); }
  for (const [k, rs] of byKey) {
    const p = get(k);
    p.total = sumCost(rs);
    p.lpChannels = sumCost(rs.filter((r) => (LP_CHANNELS as readonly string[]).includes(r.channel)));
    const withClicks = rs.filter((r) => r.clicks !== null);
    p.commCost = sumCost(withClicks);
    p.commClicks = withClicks.reduce((s, r) => s + (r.clicks ?? 0), 0);
  }
  const lpF = { ...f, origins: lpOrigins(f) };
  if (!f.group && !f.cell) for (const r of filterLpTraffic(traffic, lpF)) get(key(r.date)).lpSessions += r.sessions;
  for (const e of filterLpEvents(events, lpF)) if (e.event === 'clique_oferta') get(key(e.date)).lpOfferClicks += e.count;
  return out;
}

const addCost = (a: CostSum, b: CostSum): CostSum => ({
  value: a.value === null && b.value === null ? null : (a.value ?? 0) + (b.value ?? 0),
  known: a.known + b.known, total: a.total + b.total, estimated: a.estimated + b.estimated,
});

/**
 * Razões acumuladas até cada período. O acesso e o clique na LP chegam dias depois do disparo,
 * então a razão do dia isolado não faz sentido; a acumulada sim.
 */
export function cumulativeRatios(periods: PeriodCost[]): Map<string, PeriodCostRatios & { cost: number | null }> {
  const out = new Map<string, PeriodCostRatios & { cost: number | null }>();
  let total: CostSum = { value: null, known: 0, total: 0, estimated: 0 };
  let lp: CostSum = { value: null, known: 0, total: 0, estimated: 0 };
  let commCost: CostSum = { value: null, known: 0, total: 0, estimated: 0 };
  let comm = 0; let sessions = 0; let lpClicks = 0;
  for (const p of [...periods].sort((a, b) => a.key.localeCompare(b.key))) {
    total = addCost(total, p.total); lp = addCost(lp, p.lpChannels); commCost = addCost(commCost, p.commCost);
    comm += p.commClicks; sessions += p.lpSessions; lpClicks += p.lpOfferClicks;
    out.set(p.key, {
      cost: total.value,
      costPerCommClick: costRatio(commCost, comm),
      costPerAccess: costRatio(lp, sessions),
      costPerLpOfferClick: costRatio(lp, lpClicks),
      costPerOfferClick: costRatio(total, comm + lpClicks),
    });
  }
  return out;
}
