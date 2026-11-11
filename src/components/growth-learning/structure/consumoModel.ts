/* Consumo SFMC: contrato de consumíveis por frente e canal contra os envios reais do SFMC. Tudo em envios. */

export type PlanChannel = 'EMAIL' | 'WPPM' | 'WPPU' | 'SMS';
export type Ch = 'EMAIL' | 'WPP' | 'SMS';
export type RawCh = 'EMAIL' | 'PUSH' | 'WPP' | 'SMS';
export const CHS: Ch[] = ['EMAIL', 'WPP', 'SMS'];
export const CH_OF: Record<RawCh, Ch> = { EMAIL: 'EMAIL', PUSH: 'EMAIL', WPP: 'WPP', SMS: 'SMS' };
export const CH_LABEL: Record<Ch, string> = { EMAIL: 'E-mail/Push', WPP: 'WhatsApp', SMS: 'SMS' };
export const RAW_LABEL: Record<RawCh, string> = { EMAIL: 'E-mail', PUSH: 'Push', WPP: 'WhatsApp', SMS: 'SMS' };
/** Mesmas cores do card da Estrutura CRM. */
export const RAW_COLOR: Record<RawCh, string> = { EMAIL: '#0e7490', PUSH: '#f59e0b', WPP: '#16a34a', SMS: '#6366f1' };
export const CH_COLOR: Record<Ch, string> = { EMAIL: '#0e7490', WPP: '#16a34a', SMS: '#6366f1' };
export const NO_FRONT = '(sem frente)';
export const FORA = 'fora';

export interface PlanRow { front: string; channel: PlanChannel; month: string; volume: number }
export interface ConsumoRule { id: string; priority: number; pattern: string; front: string | null; card_id: string | null; group_label: string | null }
export interface PillarFront { front: string; pillar_id: string | null; position: number }
export interface CardGoal { card_id: string; channel: Ch; monthly_volume: number }
export type DispatchRow = [number, number, RawCh, string, number, number | null];
export interface DispatchPayload { journeys: string[]; activities: string[]; rows: DispatchRow[]; last: string | null; loaded_at: string | null }

export interface ItemDef { key: string; label: string; pillarKey: string; front: string | null; cardId: string | null; isGroup: boolean }
export interface PillarDef { key: string; title: string; accent: string; fronts: string[]; items: ItemDef[] }
export interface Dispatch { j: number; a: number; ch: RawCh; day: number; sent: number; dl: number | null; item: string }
export interface ConsumoModel {
  start: string; months: string[]; daysTotal: number; last: number; rem: number;
  pillars: PillarDef[]; items: Map<string, ItemDef>; dispatches: Dispatch[]; byItem: Map<string, Dispatch[]>;
  journeys: string[]; activities: string[]; plan: Map<string, Record<PlanChannel, number[]>>; fronts: string[];
}

const DAY = 86400000;
const t = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const dayOffset = (start: string, iso: string) => Math.round((t(iso) - t(start)) / DAY);
const daysInMonth = (iso: string) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7), 0)).getUTCDate();
export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const monthLabel = (iso: string) => `${MONTHS[+iso.slice(5, 7) - 1]}/${iso.slice(2, 4)}`;
const z12 = (n: number) => Array<number>(n).fill(0);
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

/** Regras em ordem de prioridade; padrão inválido é ignorado. */
export function compileRules(rules: ConsumoRule[]) {
  return rules.slice().sort((a, b) => a.priority - b.priority).flatMap(r => {
    try { return [{ rule: r, re: new RegExp(r.pattern, 'i') }]; } catch { return []; }
  });
}
export function classify(journey: string, activity: string, compiled: ReturnType<typeof compileRules>) {
  const text = journey || activity;
  return compiled.find(c => c.re.test(text))?.rule || null;
}

interface BoardInput {
  pillars: { id: string; title: string; accent: string; position: number }[];
  lanes: { id: string; pillar_id: string; position: number }[];
  cards: { id: string; lane_id: string; title: string; position: number; archived: boolean }[];
}

export function buildModel(board: BoardInput, rules: ConsumoRule[], pillarFronts: PillarFront[], planRows: PlanRow[], payload: DispatchPayload): ConsumoModel {
  const months = [...new Set(planRows.map(p => p.month.slice(0, 10)))].sort();
  const start = months[0] || (payload.last ? payload.last.slice(0, 8) + '01' : '2026-08-01');
  while (months.length < 12) { const l = months[months.length - 1] || start; const d = new Date(t(l)); d.setUTCMonth(d.getUTCMonth() + 1); months.push(d.toISOString().slice(0, 10)); }
  const lastMonth = months[months.length - 1];
  const end = addDays(lastMonth, daysInMonth(lastMonth) - 1);
  const daysTotal = dayOffset(start, end) + 1;
  const lastIso = payload.last || start;
  const last = Math.min(daysTotal - 1, Math.max(0, dayOffset(start, lastIso)));

  const plan = new Map<string, Record<PlanChannel, number[]>>();
  for (const p of planRows) {
    const i = months.indexOf(p.month.slice(0, 10)); if (i < 0) continue;
    if (!plan.has(p.front)) plan.set(p.front, { EMAIL: z12(12), WPPM: z12(12), WPPU: z12(12), SMS: z12(12) });
    plan.get(p.front)![p.channel][i] += Number(p.volume) || 0;
  }

  const pf = pillarFronts.slice().sort((a, b) => a.position - b.position);
  const pillars = board.pillars.slice().sort((a, b) => a.position - b.position);
  const pillarOfFront = (front: string | null) => (front && pf.find(x => x.front === front)?.pillar_id) || FORA;
  const compiled = compileRules(rules);
  const lanePillar = new Map(board.lanes.map(l => [l.id, l.pillar_id]));
  const liveCards = board.cards.filter(c => !c.archived && lanePillar.has(c.lane_id))
    .sort((a, b) => { const la = board.lanes.find(l => l.id === a.lane_id)!, lb = board.lanes.find(l => l.id === b.lane_id)!; return la.position - lb.position || a.position - b.position; });
  const cardFront = (cardId: string, pillarId: string) => compiled.find(c => c.rule.card_id === cardId)?.rule.front ?? (pf.find(x => x.pillar_id === pillarId)?.front || null);

  const items = new Map<string, ItemDef>();
  for (const c of liveCards) {
    const pid = lanePillar.get(c.lane_id)!;
    items.set('card:' + c.id, { key: 'card:' + c.id, label: c.title, pillarKey: pid, front: cardFront(c.id, pid), cardId: c.id, isGroup: false });
  }
  const groupItem = (label: string, front: string | null) => {
    const key = 'group:' + label;
    if (!items.has(key)) items.set(key, { key, label, pillarKey: pillarOfFront(front), front, cardId: null, isGroup: true });
    return key;
  };

  const dispatches: Dispatch[] = [];
  const memo = new Map<string, string>();
  for (const [j, a, ch, iso, sent, dl] of payload.rows) {
    const day = dayOffset(start, iso);
    if (day < 0 || day >= daysTotal) continue;
    const mk = j + '|' + a;
    let item = memo.get(mk);
    if (!item) {
      const r = classify(payload.journeys[j] || '', payload.activities[a] || '', compiled);
      item = r?.card_id && items.has('card:' + r.card_id) ? 'card:' + r.card_id
        : groupItem(r?.group_label || (r ? 'Campanha arquivada' : 'Sem regra'), r?.front ?? null);
      memo.set(mk, item);
    }
    dispatches.push({ j, a, ch, day, sent: Number(sent) || 0, dl: dl == null ? null : Number(dl), item });
  }
  const byItem = new Map<string, Dispatch[]>();
  for (const d of dispatches) { const l = byItem.get(d.item); if (l) l.push(d); else byItem.set(d.item, [d]); }

  const defs: PillarDef[] = pillars.map(p => ({ key: p.id, title: p.title, accent: p.accent, fronts: pf.filter(x => x.pillar_id === p.id).map(x => x.front), items: [] }));
  const fora: PillarDef = { key: FORA, title: 'Fora do board', accent: '#64748B', fronts: pf.filter(x => !x.pillar_id || !pillars.some(p => p.id === x.pillar_id)).map(x => x.front), items: [] };
  for (const it of items.values()) {
    if (it.isGroup && !byItem.has(it.key)) continue;
    (defs.find(d => d.key === it.pillarKey) || fora).items.push(it);
  }
  const allPillars = [...defs, fora].filter(d => d.items.length || d.fronts.length);
  const fronts = [...pf.map(x => x.front), ...[...plan.keys()].filter(f => !pf.some(x => x.front === f))];
  return { start, months, daysTotal, last, rem: daysTotal - 1 - last, pillars: allPillars, items, dispatches, byItem, journeys: payload.journeys, activities: payload.activities, plan, fronts };
}

/* ---------- período e contrato ---------- */
export interface Period { key: string; from: number; to: number }
export function presets(m: Pick<ConsumoModel, 'start' | 'months' | 'last'>): { key: string; label: string; from: number; to: number }[] {
  const out = [
    { key: 'contrato', label: 'Contrato até hoje', from: 0, to: m.last },
    { key: '7d', label: 'Últimos 7 dias', from: Math.max(0, m.last - 6), to: m.last },
    { key: '30d', label: 'Últimos 30 dias', from: Math.max(0, m.last - 29), to: m.last },
    { key: '90d', label: 'Últimos 90 dias', from: Math.max(0, m.last - 89), to: m.last },
  ];
  for (const mo of m.months) {
    const from = dayOffset(m.start, mo); if (from > m.last) break;
    const to = Math.min(m.last, from + daysInMonth(mo) - 1);
    out.push({ key: 'm' + mo, label: monthLabel(mo) + (to < from + daysInMonth(mo) - 1 ? ` (até ${ddmm(addDays(m.start, to))})` : ''), from, to });
  }
  return out;
}
/** Fração de cada mês do contrato que cai dentro do período. */
export function periodFractions(m: Pick<ConsumoModel, 'start' | 'months'>, from: number, to: number) {
  const f = z12(m.months.length);
  m.months.forEach((mo, i) => {
    const a = dayOffset(m.start, mo), n = daysInMonth(mo), b = a + n - 1;
    const lo = Math.max(a, from), hi = Math.min(b, to);
    if (hi >= lo) f[i] = (hi - lo + 1) / n;
  });
  return f;
}
export function planFor(model: Pick<ConsumoModel, 'plan'>, fronts: string[], chs: Ch[]) {
  const v = z12(12);
  for (const f of fronts) {
    const p = model.plan.get(f); if (!p) continue;
    for (const ch of chs) {
      const parts: PlanChannel[] = ch === 'WPP' ? ['WPPM', 'WPPU'] : [ch];
      for (const pc of parts) p[pc].forEach((x, i) => { v[i] += x; });
    }
  }
  return v;
}

/* ---------- agregação ---------- */
export interface Agg { m: number[]; real: number; all: number; r30: number }
export const emptyAgg = (): Agg => ({ m: z12(12), real: 0, all: 0, r30: 0 });
export function addAgg(a: Agg, b: Agg): Agg { return { m: a.m.map((x, i) => x + b.m[i]), real: a.real + b.real, all: a.all + b.all, r30: a.r30 + b.r30 }; }
const monthIdx = (m: Pick<ConsumoModel, 'start' | 'months'>) => {
  const starts = m.months.map(mo => dayOffset(m.start, mo));
  return (day: number) => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= day) i++; return i; };
};
/** Agregados por item e canal (chave "item|canal") para o período. */
export function aggregate(model: ConsumoModel, period: Period) {
  const out = new Map<string, Agg>();
  const mi = monthIdx(model);
  for (const d of model.dispatches) {
    const k = d.item + '|' + CH_OF[d.ch];
    let a = out.get(k); if (!a) { a = emptyAgg(); out.set(k, a); }
    a.all += d.sent; a.m[mi(d.day)] += d.sent;
    if (d.day > model.last - 30) a.r30 += d.sent;
    if (d.day >= period.from && d.day <= period.to) a.real += d.sent;
  }
  return out;
}
export function itemAgg(aggs: Map<string, Agg>, item: string, chs: Ch[]) {
  let a = emptyAgg();
  for (const ch of chs) { const x = aggs.get(item + '|' + ch); if (x) a = addAgg(a, x); }
  return a;
}

export interface Metrics { tot: number; exp: number; real: number; uso: number | null; r30: number; proj: number; saldo: number | null }
/** Esperado, realizado e uso olham o período; ritmo, projeção e saldo olham o contrato inteiro. */
export function metrics(plan: number[] | null, a: Agg, pf: number[], rem: number): Metrics {
  const tot = plan ? sum(plan) : 0;
  const exp = plan ? sum(plan.map((x, i) => x * (pf[i] || 0))) : 0;
  const proj = a.all + (a.r30 / 30) * rem;
  return { tot, exp, real: a.real, uso: exp ? a.real / exp : null, r30: a.r30, proj, saldo: plan ? tot - proj : null };
}
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';
export function status(x: Metrics): [Tone, string] {
  if (x.tot === 0) return x.real > 0 || x.proj > 0 ? ['bad', 'Sem linha no contrato'] : ['mute', 'Sem previsão'];
  if (x.saldo != null && x.saldo < 0 && x.uso != null && x.uso > 1.15) return ['bad', 'Vai estourar'];
  if (x.saldo != null && x.saldo < 0) return ['warn', 'Estoura no ritmo'];
  if (x.uso != null && x.uso > 1.15) return ['warn', 'Acima do ritmo'];
  if (x.uso != null && x.uso < 0.6) return ['info', 'Sobrando'];
  return ['ok', 'No ritmo'];
}
export const TONE_COLOR: Record<Tone, string> = { ok: '#15803d', warn: '#b45309', bad: '#b91c1c', info: '#1d4ed8', mute: '#94a3b8' };
export function goalPlan(goals: CardGoal[], cardId: string | null, chs: Ch[]) {
  if (!cardId) return null;
  const g = goals.filter(x => x.card_id === cardId && chs.includes(x.channel));
  if (!g.length) return null;
  const monthly = sum(g.map(x => Number(x.monthly_volume) || 0));
  return monthly > 0 ? z12(12).map(() => monthly) : null;
}

/** Projeção mês a mês pelo ritmo dos últimos 30 dias, a partir do dia seguinte ao último dado. */
export function monthlyProjection(model: Pick<ConsumoModel, 'start' | 'months' | 'last'>, r30: number) {
  const perDay = r30 / 30;
  return model.months.map(mo => {
    const a = dayOffset(model.start, mo), b = a + daysInMonth(mo) - 1;
    const lo = Math.max(a, model.last + 1);
    return b < lo ? null : perDay * (b - lo + 1);
  });
}

export const fmtVol = (v: number | null | undefined) => {
  if (v == null) return '';
  const s = v < 0 ? '−' : ''; const x = Math.abs(v);
  const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  if (x >= 1e6) return s + nf.format(x / 1e6) + ' MM';
  if (x >= 1e3) return s + nf.format(x / 1e3) + ' mil';
  return s + Math.round(x);
};
export const fmtPct = (v: number) => Math.round(v * 100) + '%';
