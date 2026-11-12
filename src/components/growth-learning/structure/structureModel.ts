import type { ResultRow } from '../results/results.types';
import { matchesWikiAnalytics, readWikiAnalytics, type WikiAnalytics } from '../../vault/wikiAnalytics';

export type DeclaredStatus = 'rec' | 'con' | 'mat' | 'est' | 'int' | 'bkl' | 'pon';
export type Measurement = 'r' | 'c' | 'p' | 'n';
export type Observed = 'on' | 'slow' | 'none' | 'unlinked';
export type MetricKey = 'aq' | 'de' | 're' | 'cs' | 'en';
export type Lens = 'st' | 'obs' | 'med';
export type QuickFilter = 'drift' | 'parada' | 'unlinked' | null;

export interface DataScope { domain: 'crm' | 'renta'; scope?: Record<string, string>; any_of?: Record<string, string>[] }
export interface StructurePillar { id: string; title: string; accent: string; position: number; archived: boolean; revision: number }
export interface StructureLane { id: string; pillar_id: string; title: string; metric_key: MetricKey; wide: boolean; position: number; archived: boolean; revision: number }
export interface StructureCard {
  id: string; lane_id: string; position: number; title: string; audience: string; bus: string[];
  declared_status: DeclaredStatus; measurement: Measurement; owner: string; wiki_note: string; external_note: string;
  data_scope: DataScope | null; archived: boolean; revision: number; created_at: string; updated_at: string;
}
export interface StructureEvent { id: number; entity: 'pillar' | 'lane' | 'card'; entity_id: string; revision: number; before_data: Record<string, unknown> | null; after_data: Record<string, unknown>; created_at: string }

export interface JourneySignal { journey: string; channel: string; count: number; last: string; base: number }
export interface MonthSignal { month: string; dispatches: number; primary: number; base: number }
export interface ChannelShare { channel: string; base: number; share: number }
/**
 * Janela que o card lê: os últimos 90 dias quando houve disparo; senão o último ciclo,
 * que são os 90 dias até o último envio. Assim todo card do pilar mostra as mesmas métricas.
 */
export interface CardWindow {
  kind: '90d' | 'cycle'; until: string; dispatches: number;
  primary: number | null; base: number | null; cost: number | null; opens: number | null;
  /** Peso de cada canal na base da janela; uma jornada costuma usar vários canais. */
  channels: ChannelShare[];
}
export interface CardSignal {
  observed: Observed; domain: 'crm' | 'renta' | null; lastDate: string | null; daysSince: number | null;
  dispatches90: number; primary90: number | null; base90: number | null; journeys: JourneySignal[]; monthly: MonthSignal[];
  window: CardWindow | null;
  /** Número principal dos 90 dias anteriores (cartões no CRM, base na rentabilização), para a tendência. */
  prev90: number | null;
  activeDays90: number;
}

export const STATUS_META: Record<DeclaredStatus, { label: string; hint: string; color: string | null; tint: string }> = {
  rec: { label: 'Recorrente', hint: 'Nova, já em cadência mensal', color: '#b5d334', tint: '#f6fadf' },
  con: { label: 'Consolidada', hint: 'Legado, em operação contínua', color: '#0e9ea8', tint: '#e6f6f6' },
  mat: { label: 'Em maturação', hint: 'Recém-lançada, calibrando cadência', color: '#2e8b57', tint: '#e5f1e8' },
  est: { label: 'Em estruturação', hint: 'Dados, KPIs, jornada e oferta', color: '#8a63b8', tint: '#f0ebf7' },
  int: { label: 'Intermitente', hint: 'Existe, mas sem cadência regular', color: '#d9734a', tint: '#fbeee7' },
  bkl: { label: 'Backlog', hint: 'Próximas ondas', color: null, tint: '#ffffff' },
  pon: { label: 'Pontual', hint: 'Ação promocional realizada', color: null, tint: '#ffffff' },
};
export const OBS_META: Record<Observed, { label: string; hint: string; color: string; tint: string }> = {
  on: { label: 'Ativa', hint: 'Disparo nos últimos 30 dias', color: '#16a34a', tint: '#dcfce7' },
  slow: { label: 'Parada', hint: 'Sem disparo há mais de 30 dias', color: '#d97706', tint: '#fef3c7' },
  none: { label: 'Sem disparo no GaaS', hint: 'O vínculo não casa com nenhum disparo', color: '#94a3b8', tint: '#f1f5f9' },
  unlinked: { label: 'Sem vínculo de dados', hint: 'Campanha ainda não ligada aos disparos', color: '#cbd5e1', tint: '#f8fafc' },
};
export const MED_META: Record<Measurement, { label: string; short: string; hint: string; color: string; tint: string }> = {
  r: { label: 'Resultado medido', short: 'Medido', hint: 'Fonte de resultado carregada', color: '#15803d', tint: '#dcfce7' },
  c: { label: 'Só contato', short: 'Contato', hint: 'Abertura e clique, sem resultado', color: '#b45309', tint: '#fef3c7' },
  p: { label: 'Resultado planejado', short: 'Planejado', hint: 'Contrato de dados previsto', color: '#1d4ed8', tint: '#dbeafe' },
  n: { label: 'Sem fonte', short: 'Sem fonte', hint: 'Nenhuma fonte mapeada', color: '#b91c1c', tint: '#fee2e2' },
};
export const BU_COLORS: Record<string, string> = {
  B2C: '#3B82F6', Plurix: '#A855F7', B2B2C: '#10B981', 'Bem Barato': '#F59E0B', Dia: '#EF4444', 'Super Nosso': '#0EA5A4', Seguros: '#EC4899',
};
export const BU_OPTIONS = ['B2C', 'Plurix', 'B2B2C', 'Bem Barato', 'Dia', 'Super Nosso', 'Seguros'];
export const B2B2C_WITHOUT_CRM = ['RD', 'Saúde', 'RM', 'Nosso Pay'];
export const METRIC_LABEL: Record<MetricKey, string> = { aq: 'cartões em 90d', de: 'base impactada em 90d', re: 'base impactada em 90d', cs: 'base impactada em 90d', en: 'base impactada em 90d' };
/** Largura de cada coluna do quadro (o esqueleto de carregamento usa a mesma). */
export const BOARD_COL_W = 272;
const ACTIVE: DeclaredStatus[] = ['rec', 'con', 'mat'];
const DAY = 86_400_000;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export function daysBetween(fromIso: string, toIso: string) { return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY); }

export function scopeConfig(scope: DataScope | null): WikiAnalytics | null {
  if (!scope) return null;
  return readWikiAnalytics({ analytics: { domain: scope.domain, scope: scope.scope || {}, any_of: scope.any_of || [] } });
}

/** Remove linhas duplicadas da mesma atividade (mesmo activity/data/BU/canal), mantendo a primeira. */
export function uniqueRows(rows: ResultRow[]) {
  const seen = new Set<string>();
  return rows.filter(row => { if (seen.has(row.duplicateKey)) return false; seen.add(row.duplicateKey); return true; });
}

export function computeSignal(card: Pick<StructureCard, 'data_scope'>, rows: ResultRow[], today: string): CardSignal {
  const empty: CardSignal = {
    observed: 'unlinked', domain: null, lastDate: null, daysSince: null, dispatches90: 0, primary90: null, base90: null, journeys: [], monthly: [],
    window: null, prev90: null, activeDays90: 0,
  };
  const config = scopeConfig(card.data_scope);
  if (!config) return empty;
  const matched = rows.filter(row => row.domain === config.domain && row.date && row.date <= today && matchesWikiAnalytics(row, config));
  if (!matched.length) return { ...empty, observed: 'none', domain: config.domain as 'crm' | 'renta' };
  const lastDate = matched.reduce((max, row) => (row.date > max ? row.date : max), '');
  const daysSince = daysBetween(lastDate, today);
  const from = isoDay(new Date(Date.parse(today) - 90 * DAY));
  const recent = matched.filter(row => row.date > from);
  const previous = matched.filter(row => row.date > isoDay(new Date(Date.parse(today) - 180 * DAY)) && row.date <= from);
  const cycleFrom = isoDay(new Date(Date.parse(lastDate) - 90 * DAY));
  const windowRows = recent.length ? recent : matched.filter(row => row.date > cycleFrom);
  const baseOf = (row: ResultRow) => (config.domain === 'crm' ? row.crm?.actionable ?? null : row.secondary) ?? 0;
  const sum = (list: ResultRow[], pick: (row: ResultRow) => number | null) => {
    const values = list.map(pick).filter((v): v is number => typeof v === 'number');
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const journeys = new Map<string, JourneySignal>();
  for (const row of matched) {
    const key = (row.journey || '(sem jornada)') + '|' + row.channel;
    const j = journeys.get(key) || { journey: row.journey || '(sem jornada)', channel: row.channel, count: 0, last: '', base: 0 };
    j.count += 1; j.base += baseOf(row); if (row.date > j.last) j.last = row.date; journeys.set(key, j);
  }
  const months = new Map<string, MonthSignal>();
  for (const row of matched) {
    const month = row.date.slice(0, 7);
    const m = months.get(month) || { month, dispatches: 0, primary: 0, base: 0 };
    m.dispatches += 1; m.primary += row.primary ?? 0; m.base += baseOf(row); months.set(month, m);
  }
  const byChannel = new Map<string, number>();
  for (const row of windowRows) { const ch = row.channel || 'Sem canal'; byChannel.set(ch, (byChannel.get(ch) || 0) + baseOf(row)); }
  const channelTotal = [...byChannel.values()].reduce((a, b) => a + b, 0);
  const win: CardWindow = {
    kind: recent.length ? '90d' : 'cycle', until: lastDate, dispatches: windowRows.length,
    primary: sum(windowRows, row => row.primary), base: sum(windowRows, row => baseOf(row)),
    cost: sum(windowRows, row => row.spend), opens: sum(windowRows, row => row.opens ?? null),
    channels: [...byChannel.entries()]
      .map(([channel, base]) => ({ channel, base, share: channelTotal ? base / channelTotal : 1 / byChannel.size }))
      .sort((a, b) => b.share - a.share),
  };
  const isCrm = config.domain === 'crm';
  return {
    observed: daysSince <= 30 ? 'on' : 'slow', domain: config.domain as 'crm' | 'renta', lastDate, daysSince,
    window: win, prev90: sum(previous, row => (isCrm ? row.primary : baseOf(row))), activeDays90: new Set(recent.map(row => row.date)).size,
    dispatches90: recent.length, primary90: sum(recent, row => row.primary), base90: sum(recent, row => baseOf(row)),
    journeys: [...journeys.values()].sort((a, b) => b.last.localeCompare(a.last)),
    monthly: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
  };
}

/** Divergência: declarada como ativa, ligada a dados, mas sem disparo recente. */
export function isDrift(card: Pick<StructureCard, 'declared_status'>, signal: CardSignal) {
  return ACTIVE.includes(card.declared_status) && (signal.observed === 'slow' || signal.observed === 'none');
}

export interface StructureFilters { st: Set<DeclaredStatus>; obs: Set<Observed>; med: Set<Measurement>; bu: string; q: string; quick: QuickFilter }
export const emptyFilters = (): StructureFilters => ({ st: new Set(), obs: new Set(), med: new Set(), bu: '', q: '', quick: null });
export function hasFilters(f: StructureFilters) { return Boolean(f.st.size || f.obs.size || f.med.size || f.bu || f.q || f.quick); }

export function passes(card: StructureCard, signal: CardSignal, f: StructureFilters) {
  if (f.st.size && !f.st.has(card.declared_status)) return false;
  if (f.obs.size && !f.obs.has(signal.observed)) return false;
  if (f.med.size && !f.med.has(card.measurement)) return false;
  if (f.bu && !card.bus.includes(f.bu)) return false;
  if (f.q) {
    const q = f.q.toLocaleLowerCase('pt-BR');
    if (![card.title, card.audience, card.owner, ...card.bus].join(' ').toLocaleLowerCase('pt-BR').includes(q)) return false;
  }
  if (f.quick === 'drift' && !isDrift(card, signal)) return false;
  if (f.quick === 'parada' && signal.observed !== 'slow') return false;
  if (f.quick === 'unlinked' && signal.observed !== 'unlinked') return false;
  return true;
}

/** Clique isola o valor (ou limpa se já isolado); com modificador, soma ou remove. */
export function toggleIsolate<T>(current: Set<T>, value: T, additive: boolean): Set<T> {
  const next = new Set(current);
  if (additive) { if (next.has(value)) next.delete(value); else next.add(value); return next; }
  if (next.size === 1 && next.has(value)) return new Set();
  return new Set([value]);
}

/** Posição para soltar antes de `beforeId` (ou no fim) numa lista ordenada por posição. */
export function dropPosition(laneCards: Pick<StructureCard, 'id' | 'position'>[], movingId: string, beforeId: string | null) {
  const list = laneCards.filter(c => c.id !== movingId).sort((a, b) => a.position - b.position);
  if (!beforeId) return list.length ? list[list.length - 1].position + 1 : 1;
  const i = list.findIndex(c => c.id === beforeId);
  if (i < 0) return list.length ? list[list.length - 1].position + 1 : 1;
  const prev = i === 0 ? list[i].position - 1 : list[i - 1].position;
  return (prev + list[i].position) / 2;
}

export interface StructureKpis { total: number; active: number; measured: number; drift: number; noSource: number; stopped: number; unlinked: number }
export function kpis(cards: StructureCard[], signals: Map<string, CardSignal>): StructureKpis {
  const s = (c: StructureCard) => signals.get(c.id) || computeSignal({ data_scope: null }, [], '2000-01-01');
  return {
    total: cards.length,
    active: cards.filter(c => s(c).observed === 'on').length,
    measured: cards.filter(c => c.measurement === 'r').length,
    drift: cards.filter(c => isDrift(c, s(c))).length,
    noSource: cards.filter(c => c.measurement === 'n').length,
    stopped: cards.filter(c => s(c).observed === 'slow').length,
    unlinked: cards.filter(c => s(c).observed === 'unlinked').length,
  };
}

export const RESULT_FIELDS = ['segment', 'journey', 'subgroup', 'partner', 'bu', 'channel'] as const;
export type ResultField = typeof RESULT_FIELDS[number];
export const RESULT_FIELD_LABEL: Record<ResultField, string> = { segment: 'Segmento', journey: 'Jornada', subgroup: 'Subgrupo', partner: 'Parceiro', bu: 'BU', channel: 'Canal' };
/** Valores do histórico para montar o vínculo com SELECT (pilar do projeto: nada digitado à mão). */
export function historyOptions(rows: ResultRow[], domain: 'crm' | 'renta', field: ResultField) {
  const values = new Set<string>();
  for (const row of rows) if (row.domain === domain) { const v = row[field]; if (typeof v === 'string' && v) values.add(v); }
  return [...values].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const fmtInt = (n: number | null | undefined) => (n == null ? 'n/d' : Math.round(n).toLocaleString('pt-BR'));
export const fmtPct = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return 'n/d';
  const v = value * 100;
  const digits = v > 0 && v < 0.1 ? 3 : v < 1 ? 2 : 1;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';
};
export const fmtMoney = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? 'n/d' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
export const fmtShortDate = (iso: string | null | undefined) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(2, 4) : 'n/d');
const ratio = (a: number | null | undefined, b: number | null | undefined) => (a == null || b == null || b === 0 ? null : a / b);

/** Aquisição lê cartões; os demais pilares leem contato, que é o que a base de rentabilização registra. */
export function isAcquisitionCard(signal: Pick<CardSignal, 'domain'>, metricKey: MetricKey) {
  return signal.domain ? signal.domain === 'crm' : metricKey === 'aq';
}
export const METRIC_LABELS = { crm: ['Cartões', 'Conv.', 'CAC'], contact: ['Base', 'Abertura', 'Cliques'] } as const;

export interface CardMetric { label: string; value: string; tone?: 'big' | 'na' }
/** Três números fixos por pilar; muda só a janela (90 dias, último ciclo ou a medir). */
export function cardMetrics(signal: CardSignal, metricKey: MetricKey): CardMetric[] {
  const crm = isAcquisitionCard(signal, metricKey);
  const labels = crm ? METRIC_LABELS.crm : METRIC_LABELS.contact;
  const w = signal.window;
  if (!w) return labels.map(label => ({ label, value: 'n/d', tone: 'na' as const }));
  const values = crm
    ? [fmtInt(w.primary), fmtPct(ratio(w.primary, w.base)), fmtMoney(ratio(w.cost, w.primary))]
    : [fmtInt(w.base), fmtPct(ratio(w.opens, w.base)), fmtInt(w.primary)];
  return labels.map((label, i): CardMetric => ({ label, value: values[i], tone: values[i] === 'n/d' ? 'na' : i === 0 ? 'big' : undefined }));
}

/** Cadência observada pelos dias com disparo nos últimos 90 dias. */
export function cadenceLabel(activeDays90: number) {
  if (activeDays90 >= 45) return 'Cadência diária';
  if (activeDays90 >= 10) return 'Cadência semanal';
  if (activeDays90 >= 5) return 'Cadência quinzenal';
  if (activeDays90 >= 2) return 'Cadência mensal';
  return 'Disparo único em 90d';
}

/** Tendência do número principal contra os 90 dias anteriores e série mensal (meses fechados). */
export function cardTrend(signal: CardSignal, today: string) {
  const crm = signal.domain === 'crm';
  const cur = crm ? signal.primary90 : signal.base90;
  const month = today.slice(0, 7);
  const series = signal.monthly.filter(m => m.month < month).map(m => (crm ? m.primary : m.base)).slice(-8);
  return { delta: cur != null && signal.prev90 ? (cur - signal.prev90) / signal.prev90 : null, series };
}

/** Resumo do pilar para o cabeçalho: ativas, cartões e CAC (aquisição) ou base impactada. */
export function pillarSummary(cards: StructureCard[], signals: Map<string, CardSignal>) {
  let active = 0, stopped = 0, crmCards: number | null = null, cost = 0, base = 0;
  for (const c of cards) {
    const s = signals.get(c.id); if (!s) continue;
    if (s.observed === 'on') active += 1;
    if (s.observed === 'slow') stopped += 1;
    if (s.domain === 'crm' && s.primary90 != null) { crmCards = (crmCards ?? 0) + s.primary90; cost += s.window?.kind === '90d' ? s.window.cost ?? 0 : 0; }
    else if (s.domain === 'renta') base += s.base90 ?? 0;
  }
  return { active, stopped, cards: crmCards, cac: crmCards ? cost / crmCards : null, base };
}
export function friendlyError(error: unknown) {
  const msg = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (msg.includes('revision_conflict')) return 'Alguém editou isto agora. Recarregue para ver a versão nova.';
  if (msg.includes('access_denied')) return 'Só administradores podem editar a Estrutura CRM.';
  if (msg.includes('title_required')) return 'Dê um nome com pelo menos 2 letras.';
  if (msg.includes('lane_not_empty')) return 'Arquive ou mova as campanhas da coluna antes.';
  if (msg.includes('pillar_not_empty')) return 'Arquive as colunas do pilar antes.';
  if (msg.includes('lane_invalid')) return 'A coluna escolhida não existe mais.';
  return 'Não foi possível salvar. Tente de novo.';
}
