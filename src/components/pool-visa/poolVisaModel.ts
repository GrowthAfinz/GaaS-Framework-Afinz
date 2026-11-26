import { getCustoUnitarioCanal } from '../../constants/frameworkFields';

/**
 * Pool de Ofertas Vai de Visa: camada SFMC (rentabilizacao_activities).
 *
 * Regras que este módulo garante (ver docs de revisão do Pool):
 * - Só entram jornadas da lista fechada abaixo. Nada de busca textual: existem
 *   outros "Pool de Ofertas" (parceiros, relatório) que não são o Pool Visa.
 * - Campo nulo na fonte continua nulo. Soma de métrica traz a cobertura
 *   (quantas linhas informaram o campo) e taxa só usa linhas onde numerador
 *   e denominador são conhecidos.
 * - Público e grupo vêm do nome da atividade só no WhatsApp; nos demais canais
 *   ficam ausentes, nunca "Genérico".
 */

export type PoolBu = 'Afinz' | 'Plurix';

/** Jornadas do Pool Visa por BU. Igualdade exata. */
export const POOL_VISA_JOURNEYS: Readonly<Record<string, PoolBu>> = {
  JOR_RENT_POOL_OFERTAS_VDV: 'Afinz',
  JOR_RENT_POOL_OFERTAS_VDV_PLURIX: 'Plurix',
};

export type PoolKind = 'disparo' | 'optout';
export type PoolAudience = 'Institucional' | 'Parceiro';
export type PoolPieceGroup = 'Moda' | 'Saúde e Beleza' | 'Família e Presentes' | 'Genérico';

export interface PoolDispatchRow {
  id: string;
  /** yyyy-mm-dd, data de disparo como gravada na fonte. */
  date: string;
  /** yyyy-mm */
  month: string;
  bu: PoolBu;
  buRaw: string;
  journey: string;
  activityName: string;
  channel: string;
  kind: PoolKind;
  /** Número do toque lido de `dispN`; nulo quando o nome não traz. */
  touch: number | null;
  audience: PoolAudience | null;
  pieceGroup: PoolPieceGroup | null;
  sent: number | null;
  delivered: number | null;
  opens: number | null;
  clicks: number | null;
  channelCost?: number | null;
  estimatedCost?: boolean;
  updatedAt: string | null;
  status: string | null;
}

const PIECE_GROUPS: Record<string, PoolPieceGroup> = {
  moda: 'Moda',
  beleza: 'Saúde e Beleza',
  presentes: 'Família e Presentes',
  geral: 'Genérico',
};

export interface ParsedActivityName {
  kind: PoolKind;
  touch: number | null;
  audience: PoolAudience | null;
  pieceGroup: PoolPieceGroup | null;
}

/** Lê toque, público e grupo da peça a partir do activity_name. */
export function parsePoolActivityName(name: string, channel: string): ParsedActivityName {
  const tokens = name.toLowerCase().split('_');
  const kind: PoolKind = tokens.includes('optout') ? 'optout' : 'disparo';
  let touch: number | null = null;
  for (const token of tokens) {
    const m = /^disp(\d+)/.exec(token);
    if (m) { touch = Number(m[1]); break; }
  }
  let audience: PoolAudience | null = null;
  let pieceGroup: PoolPieceGroup | null = null;
  if (channel === 'WhatsApp') {
    for (const token of tokens) {
      const m = /^(inst|parc)(moda|beleza|presentes|geral)$/.exec(token);
      if (m) {
        audience = m[1] === 'inst' ? 'Institucional' : 'Parceiro';
        pieceGroup = PIECE_GROUPS[m[2]];
        break;
      }
    }
  }
  return { kind, touch, audience, pieceGroup };
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

/** Converte uma linha crua de rentabilizacao_activities; devolve null se não for do Pool. */
export function toPoolDispatchRow(raw: Record<string, unknown>): PoolDispatchRow | null {
  const journey = str(raw.jornada);
  const bu = POOL_VISA_JOURNEYS[journey];
  if (!bu) return null;
  const date = str(raw['Data de Disparo']).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const activityName = str(raw['Activity name / Taxonomia']);
  const channel = str(raw.Canal) || 'Não informado';
  const parsed = parsePoolActivityName(activityName, channel);
  const delivered = num(raw['Base Acionável']);
  const recordedCost = num(raw['Custo total canal']);
  const rate = num(raw['Custo unitário do canal']) ?? getCustoUnitarioCanal(channel, date + 'T12:00:00');
  const estimatedCost = recordedCost === null && delivered !== null && delivered >= 0 && rate > 0;

  return {
    id: str(raw.id) || `${activityName}|${channel}|${date}`,
    date,
    month: date.slice(0, 7),
    bu,
    buRaw: str(raw.BU),
    journey,
    activityName,
    channel,
    ...parsed,
    sent: num(raw['Base Total']),
    delivered,
    channelCost: recordedCost ?? (estimatedCost ? delivered! * rate : null),
    estimatedCost,
    opens: num(raw.Abertura),
    clicks: num(raw.Cliques),
    updatedAt: str(raw.updated_at) || null,
    status: str(raw.status) || null,
  };
}

export interface PoolFilters {
  start: string | null;
  end: string | null;
  bu: 'all' | PoolBu;
  channels: string[];
  includeOptout: boolean;
}

export function filterPoolRows(rows: PoolDispatchRow[], f: PoolFilters): PoolDispatchRow[] {
  return rows.filter((r) =>
    (!f.start || r.date >= f.start) &&
    (!f.end || r.date <= f.end) &&
    (f.bu === 'all' || r.bu === f.bu) &&
    (!f.channels.length || f.channels.includes(r.channel)) &&
    (f.includeOptout || r.kind === 'disparo'));
}

/** Soma com cobertura: `value` é nulo quando nenhuma linha informou o campo. */
export interface CoveredSum {
  value: number | null;
  known: number;
  total: number;
}

export interface PoolAggregate {
  key: string;
  dims: Record<string, string>;
  rows: number;
  dispatches: number;
  sent: CoveredSum;
  delivered: CoveredSum;
  opens: CoveredSum;
  clicks: CoveredSum;
  channelCost: CoveredSum;
  estimatedCosts: number;
  messageCpc: number | null;
  costPerThousand: number | null;
  deliveryRate: number | null;
  openRate: number | null;
  ctrDelivered: number | null;
  ctor: number | null;
  lastUpdate: string | null;
}

interface Acc {
  dims: Record<string, string>;
  rows: number;
  estimatedCosts: number;
  sums: Record<'sent' | 'delivered' | 'opens' | 'clicks' | 'channelCost', { s: number; k: number }>;
  pairs: Record<'sentDel' | 'delOpen' | 'delClick' | 'openClick' | 'costClick' | 'costDelivered', { a: number; b: number }>;
  lastUpdate: string | null;
}

const ratio = (a: number, b: number): number | null => (b > 0 ? a / b : null);

export type PoolDimensionKey =
  | 'date' | 'month' | 'bu' | 'channel' | 'journey' | 'activityName'
  | 'touch' | 'kind' | 'audience' | 'pieceGroup';

export const NOT_AVAILABLE = 'Não informado na fonte';

export function dimensionValue(row: PoolDispatchRow, key: PoolDimensionKey): string {
  switch (key) {
    case 'date': return row.date;
    case 'month': return row.month;
    case 'bu': return row.bu;
    case 'channel': return row.channel;
    case 'journey': return row.journey;
    case 'activityName': return row.activityName;
    case 'touch': return row.touch == null ? NOT_AVAILABLE : `Toque ${row.touch}`;
    case 'kind': return row.kind === 'optout' ? 'Resposta de opt-out' : 'Disparo';
    case 'audience': return row.audience ?? NOT_AVAILABLE;
    case 'pieceGroup': return row.pieceGroup ?? NOT_AVAILABLE;
  }
}

/** Agrega por qualquer combinação de dimensões, recalculando as taxas depois de somar. */
export function aggregatePool(rows: PoolDispatchRow[], dims: PoolDimensionKey[]): PoolAggregate[] {
  const map = new Map<string, Acc>();
  for (const r of rows) {
    const values = dims.map((d) => dimensionValue(r, d));
    const key = values.join('\u0001');
    let acc = map.get(key);
    if (!acc) {
      acc = {
        dims: Object.fromEntries(dims.map((d, i) => [d, values[i]])),
        rows: 0,
        estimatedCosts: 0,
        sums: { sent: { s: 0, k: 0 }, delivered: { s: 0, k: 0 }, opens: { s: 0, k: 0 }, clicks: { s: 0, k: 0 }, channelCost: { s: 0, k: 0 } },
        pairs: { sentDel: { a: 0, b: 0 }, delOpen: { a: 0, b: 0 }, delClick: { a: 0, b: 0 }, openClick: { a: 0, b: 0 }, costClick: { a: 0, b: 0 }, costDelivered: { a: 0, b: 0 } },
        lastUpdate: null,
      };
      map.set(key, acc);
    }
    acc.rows += 1;
    for (const f of ['sent', 'delivered', 'opens', 'clicks', 'channelCost'] as const) {
      const v = r[f];
      if (v != null) { acc.sums[f].s += v; acc.sums[f].k += 1; }
    }
    if (r.estimatedCost) acc.estimatedCosts += 1;
    if (r.channelCost != null && r.clicks !== null) { acc.pairs.costClick.a += r.channelCost; acc.pairs.costClick.b += r.clicks; }
    if (r.channelCost != null && r.delivered !== null) { acc.pairs.costDelivered.a += r.channelCost; acc.pairs.costDelivered.b += r.delivered; }
    if (r.sent !== null && r.delivered !== null) { acc.pairs.sentDel.a += r.delivered; acc.pairs.sentDel.b += r.sent; }
    if (r.delivered !== null && r.opens !== null) { acc.pairs.delOpen.a += r.opens; acc.pairs.delOpen.b += r.delivered; }
    if (r.delivered !== null && r.clicks !== null) { acc.pairs.delClick.a += r.clicks; acc.pairs.delClick.b += r.delivered; }
    if (r.opens !== null && r.clicks !== null) { acc.pairs.openClick.a += r.clicks; acc.pairs.openClick.b += r.opens; }
    if (r.updatedAt && (!acc.lastUpdate || r.updatedAt > acc.lastUpdate)) acc.lastUpdate = r.updatedAt;
  }
  const covered = (x: { s: number; k: number }, total: number): CoveredSum => ({ value: x.k ? x.s : null, known: x.k, total });
  return [...map.entries()].map(([key, acc]) => ({
    key,
    dims: acc.dims,
    rows: acc.rows,
    dispatches: acc.rows,
    sent: covered(acc.sums.sent, acc.rows),
    delivered: covered(acc.sums.delivered, acc.rows),
    opens: covered(acc.sums.opens, acc.rows),
    clicks: covered(acc.sums.clicks, acc.rows),
    channelCost: covered(acc.sums.channelCost, acc.rows), estimatedCosts: acc.estimatedCosts,
    messageCpc: ratio(acc.pairs.costClick.a, acc.pairs.costClick.b),
    costPerThousand: ratio(acc.pairs.costDelivered.a * 1000, acc.pairs.costDelivered.b),
    deliveryRate: ratio(acc.pairs.sentDel.a, acc.pairs.sentDel.b),
    openRate: ratio(acc.pairs.delOpen.a, acc.pairs.delOpen.b),
    ctrDelivered: ratio(acc.pairs.delClick.a, acc.pairs.delClick.b),
    ctor: ratio(acc.pairs.openClick.a, acc.pairs.openClick.b),
    lastUpdate: acc.lastUpdate,
  }));
}

export function poolTotals(rows: PoolDispatchRow[]): PoolAggregate {
  return aggregatePool(rows, [])[0] ?? {
    key: '', dims: {}, rows: 0, dispatches: 0,
    sent: { value: null, known: 0, total: 0 }, delivered: { value: null, known: 0, total: 0 },
    opens: { value: null, known: 0, total: 0 }, clicks: { value: null, known: 0, total: 0 },
    channelCost: { value: null, known: 0, total: 0 }, estimatedCosts: 0, messageCpc: null, costPerThousand: null,
    deliveryRate: null, openRate: null, ctrDelivered: null, ctor: null, lastUpdate: null,
  };
}

export function coverageLabel(c: CoveredSum): string | null {
  if (c.total === 0 || c.known === c.total) return null;
  if (c.known === 0) return 'não informado pela fonte';
  return `parcial: ${c.known} de ${c.total} linhas`;
}

export function dateRange(rows: PoolDispatchRow[]): { min: string | null; max: string | null } {
  let min: string | null = null;
  let max: string | null = null;
  for (const r of rows) {
    if (!min || r.date < min) min = r.date;
    if (!max || r.date > max) max = r.date;
  }
  return { min, max };
}
