/**
 * Pool de Ofertas Vai de Visa: camada da LP dinâmica (GA4), carregada em
 * pool_visa_lp_traffic_daily e pool_visa_lp_events_daily.
 *
 * Regras:
 * - Esta camada nunca é dividida pela camada SFMC: não há chave comum entre envio e visita.
 * - O GA4 não tem BU. Com filtro de uma BU só, a LP fica indisponível (null), não zerada.
 * - '(not set)' vira null e aparece como "não definido". Valor fora da lista conhecida de
 *   grupo ou célula não é corrigido: fica como inesperado.
 * - event_count soma entre linhas; usuários do GA4 não somam e não são usados aqui.
 */

export type LpOrigin = 'direto' | 'sms' | 'whatsapp' | 'outros';
export type LpEventName = 'clique_oferta' | 'clique_site_visa';

export const LP_ORIGIN_LABELS: Record<LpOrigin, string> = {
  direto: 'Direto (sem UTM)',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  outros: 'Outras origens',
};

export const POOL_GROUPS = ['MODA', 'SAUDE_BELEZA', 'FAMILIA_PRESENTES', 'GENERICO'] as const;
export type PoolGroupKey = (typeof POOL_GROUPS)[number];
export const POOL_GROUP_LABELS: Record<PoolGroupKey, string> = {
  MODA: 'Moda',
  SAUDE_BELEZA: 'Saúde e Beleza',
  FAMILIA_PRESENTES: 'Família e Presentes',
  GENERICO: 'Genérico',
};
export const POOL_CELLS = ['SEG-A', 'SEG-B', 'SEG-C', 'GEN-A', 'GEN-C'] as const;
export type PoolCellKey = (typeof POOL_CELLS)[number];

export interface LpTrafficRow {
  date: string;
  sourceMedium: string;
  origin: LpOrigin;
  sessions: number;
  pageViews: number;
}

export interface LpEventRow {
  date: string;
  event: LpEventName;
  sourceMedium: string;
  origin: LpOrigin;
  brand: string | null;
  offerId: string | null;
  partner: string | null;
  groupRaw: string | null;
  cellRaw: string | null;
  group: PoolGroupKey | null;
  cell: PoolCellKey | null;
  count: number;
}

const NOT_SET = new Set(['', '(not set)', '(não definido)', 'not set', 'undefined', 'null']);
export const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return NOT_SET.has(s.toLowerCase()) ? null : s;
};

export function lpOrigin(sourceMedium: string): LpOrigin {
  const s = sourceMedium.trim().toLowerCase();
  if (s === '(direct) / (none)') return 'direto';
  const [source = '', medium = ''] = s.split(' / ');
  if (medium === 'sms' || source === 'sms') return 'sms';
  if (/^(whatsapp|wpp)$/.test(medium) || /^(whatsapp|wpp)$/.test(source)) return 'whatsapp';
  return 'outros';
}

export function normalizeGroup(raw: string | null): PoolGroupKey | null {
  if (!raw) return null;
  const k = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return (POOL_GROUPS as readonly string[]).includes(k) ? (k as PoolGroupKey) : null;
}

export function normalizeCell(raw: string | null): PoolCellKey | null {
  if (!raw) return null;
  const k = raw.trim().toUpperCase().replace(/[\s_]+/g, '-');
  return (POOL_CELLS as readonly string[]).includes(k) ? (k as PoolCellKey) : null;
}

const toInt = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

export function toLpTrafficRow(raw: Record<string, unknown>): LpTrafficRow | null {
  const date = String(raw.event_date ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const sourceMedium = String(raw.source_medium ?? '(not set)');
  return { date, sourceMedium, origin: lpOrigin(sourceMedium), sessions: toInt(raw.sessions), pageViews: toInt(raw.page_views) };
}

export function toLpEventRow(raw: Record<string, unknown>): LpEventRow | null {
  const date = String(raw.event_date ?? '').slice(0, 10);
  const event = raw.event_name;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (event !== 'clique_oferta' && event !== 'clique_site_visa')) return null;
  const sourceMedium = String(raw.source_medium ?? '(not set)');
  const groupRaw = clean(raw.grupo_raw);
  const cellRaw = clean(raw.celula_raw);
  return {
    date, event, sourceMedium, origin: lpOrigin(sourceMedium),
    brand: clean(raw.marca_raw), offerId: clean(raw.oferta_id_raw), partner: clean(raw.parceiro_raw),
    groupRaw, cellRaw, group: normalizeGroup(groupRaw), cell: normalizeCell(cellRaw), count: toInt(raw.event_count),
  };
}

/** Canais do filtro (SFMC) que têm origem própria na LP. E-mail não passa pela LP. */
const CHANNEL_ORIGIN: Record<string, LpOrigin> = { SMS: 'sms', WhatsApp: 'whatsapp' };
export function originsForChannels(channels: string[]): LpOrigin[] | null {
  if (!channels.length) return null;
  return channels.map((c) => CHANNEL_ORIGIN[c]).filter((o): o is LpOrigin => Boolean(o));
}

export interface LpFilters {
  start: string | null;
  end: string | null;
  /** null = todas as origens. */
  origins: LpOrigin[] | null;
  group: PoolGroupKey | null;
  cell: PoolCellKey | null;
}

const inRange = (d: string, f: LpFilters) => (!f.start || d >= f.start) && (!f.end || d <= f.end);

export function filterLpTraffic(rows: LpTrafficRow[], f: LpFilters): LpTrafficRow[] {
  // Visita não tem grupo nem célula: com esses filtros ligados, sessões ficam indisponíveis.
  if (f.group || f.cell) return [];
  return rows.filter((r) => inRange(r.date, f) && (!f.origins || f.origins.includes(r.origin)));
}

export function filterLpEvents(rows: LpEventRow[], f: LpFilters): LpEventRow[] {
  return rows.filter((r) => inRange(r.date, f) && (!f.origins || f.origins.includes(r.origin)) && (!f.group || r.group === f.group) && (!f.cell || r.cell === f.cell));
}

export interface LpTotals {
  sessions: number | null;
  offerClicks: number;
  visaClicks: number;
}

export function lpTotals(traffic: LpTrafficRow[], events: LpEventRow[], f: LpFilters): LpTotals {
  const t = filterLpTraffic(traffic, f);
  const e = filterLpEvents(events, f);
  return {
    sessions: f.group || f.cell ? null : t.reduce((s, r) => s + r.sessions, 0),
    offerClicks: e.filter((r) => r.event === 'clique_oferta').reduce((s, r) => s + r.count, 0),
    visaClicks: e.filter((r) => r.event === 'clique_site_visa').reduce((s, r) => s + r.count, 0),
  };
}

export type PeriodKey = (date: string) => string;
export const byDay: PeriodKey = (d) => d;
export const byMonth: PeriodKey = (d) => d.slice(0, 7);

/** Sessões e cliques por período, já filtrados. */
export function lpByPeriod(traffic: LpTrafficRow[], events: LpEventRow[], f: LpFilters, key: PeriodKey): Map<string, LpTotals> {
  const out = new Map<string, LpTotals>();
  const get = (k: string) => {
    let v = out.get(k);
    if (!v) { v = { sessions: f.group || f.cell ? null : 0, offerClicks: 0, visaClicks: 0 }; out.set(k, v); }
    return v;
  };
  for (const r of filterLpTraffic(traffic, f)) { const v = get(key(r.date)); v.sessions = (v.sessions ?? 0) + r.sessions; }
  for (const r of filterLpEvents(events, f)) {
    const v = get(key(r.date));
    if (r.event === 'clique_oferta') v.offerClicks += r.count; else v.visaClicks += r.count;
  }
  return out;
}

/** Sessões por dia e origem, para a faixa da LP na linha do tempo. */
export function sessionsByDayOrigin(traffic: LpTrafficRow[], f: LpFilters): Map<string, Partial<Record<LpOrigin, number>>> {
  const out = new Map<string, Partial<Record<LpOrigin, number>>>();
  for (const r of filterLpTraffic(traffic, f)) {
    const day = out.get(r.date) ?? {};
    day[r.origin] = (day[r.origin] ?? 0) + r.sessions;
    out.set(r.date, day);
  }
  return out;
}

export interface RankItem { label: string; value: number }

/** Ranking de cliques em oferta por um campo; ausente vira "não definido" e fica à parte. */
export function offerRanking(events: LpEventRow[], f: LpFilters, field: 'brand' | 'partner'): { items: RankItem[]; undefinedCount: number; total: number } {
  const by = new Map<string, number>();
  let undefinedCount = 0;
  let total = 0;
  for (const r of filterLpEvents(events, f)) {
    if (r.event !== 'clique_oferta') continue;
    total += r.count;
    const k = r[field];
    if (!k) { undefinedCount += r.count; continue; }
    by.set(k, (by.get(k) ?? 0) + r.count);
  }
  const items = [...by.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return { items, undefinedCount, total };
}

export interface CellQuality {
  offerClicks: number;
  /** Cliques com grupo e célula reconhecidos. */
  withParams: number;
  /** Cliques com grupo ou célula preenchidos com valor fora da lista. */
  unexpected: number;
  unexpectedValues: string[];
}

/** Matriz grupo × célula de cliques em oferta, sem aplicar os filtros de grupo e célula. */
export function cellMatrix(events: LpEventRow[], f: LpFilters): { matrix: Map<string, number>; quality: CellQuality } {
  const matrix = new Map<string, number>();
  const quality: CellQuality = { offerClicks: 0, withParams: 0, unexpected: 0, unexpectedValues: [] };
  const unexpected = new Set<string>();
  for (const r of filterLpEvents(events, { ...f, group: null, cell: null })) {
    if (r.event !== 'clique_oferta') continue;
    quality.offerClicks += r.count;
    if ((r.groupRaw && !r.group) || (r.cellRaw && !r.cell)) {
      quality.unexpected += r.count;
      if (r.groupRaw && !r.group) unexpected.add(`grupo=${r.groupRaw}`);
      if (r.cellRaw && !r.cell) unexpected.add(`célula=${r.cellRaw}`);
    }
    if (r.group && r.cell) {
      quality.withParams += r.count;
      const k = `${r.group}|${r.cell}`;
      matrix.set(k, (matrix.get(k) ?? 0) + r.count);
    }
  }
  quality.unexpectedValues = [...unexpected].sort();
  return { matrix, quality };
}

/** Combinações que existem no desenho do teste. */
export function cellExists(group: PoolGroupKey, cell: PoolCellKey): boolean {
  return group === 'GENERICO' ? cell.startsWith('GEN') : cell.startsWith('SEG');
}
export const isControlCell = (cell: PoolCellKey) => cell.endsWith('-C');

/** Grupos e células presentes nos dados (para habilitar os filtros). */
export function knownGroupsAndCells(events: LpEventRow[]): { groups: PoolGroupKey[]; cells: PoolCellKey[] } {
  const g = new Set<PoolGroupKey>();
  const c = new Set<PoolCellKey>();
  for (const r of events) { if (r.group) g.add(r.group); if (r.cell) c.add(r.cell); }
  return { groups: POOL_GROUPS.filter((x) => g.has(x)), cells: POOL_CELLS.filter((x) => c.has(x)) };
}
