/** Visão Daily: tipos e regras puras (sem React, sem Supabase). */

export interface DailyFrente { key: string; name: string; short: string; color: string; position: number; archived: boolean; revision: number }
export interface DailyPartner { key: string; name: string; color: string; crm_key: string | null; position: number; archived: boolean; revision: number }
export interface DailyTag { key: string; name: string; color: string; position: number; archived: boolean; revision: number }
export interface DailyProject {
  id: string; name: string; frente_key: string; partner_keys: string[]; wiki_note: string; initiative_id: string | null;
  /** Campanha do board da Estrutura CRM (ligação por id; renomear a campanha não solta o projeto). */
  structure_card_id?: string | null;
  merged_into: string | null; archived: boolean; revision: number; created_at: string; updated_at: string;
}
export interface DailyEntry {
  id: string; day: string; project_id: string; body: string; tag_keys: string[]; responsible_id: string | null; follower_ids: string[];
  position: number; source: 'app' | 'planilha'; deleted_at: string | null; revision: number; created_at: string; updated_at: string;
}
export interface DailyPerson { id: string; name: string }
export interface B2cDay { day: string; emissions: number | null; proposals: number | null }
export interface CrmCell { day: string; partner: string; cards: number; proposals: number }

export interface DailyConfig { frentes: DailyFrente[]; partners: DailyPartner[]; tags: DailyTag[]; projects: DailyProject[]; people: DailyPerson[] }
export interface DailyFilters { frentes: string[]; projects: string[]; partners: string[]; people: string[]; tags: string[]; q: string }
export type DailyView = 'today' | 'week' | 'mine' | 'all';
export type DailyGroup = 'day' | 'project' | 'frente';
export type DailySort = 'desc' | 'asc';
export type FilterKey = Exclude<keyof DailyFilters, 'q'>;

export const emptyDailyFilters = (): DailyFilters => ({ frentes: [], projects: [], partners: [], people: [], tags: [], q: '' });
export const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const FALLBACK_COLOR = '#64748b';

/* ---------- datas (sempre ISO yyyy-mm-dd, meio-dia para fugir de fuso) ---------- */
const at = (day: string) => new Date(day + 'T12:00:00');
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const saoPauloToday = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const addDays = (day: string, n: number): string => { const d = at(day); d.setDate(d.getDate() + n); return iso(d); };
export const weekday = (day: string): number => at(day).getDay();
export const monthKey = (day: string): string => day.slice(0, 7);
export const monthStart = (y: number, m: number): string => `${y}-${String(m).padStart(2, '0')}-01`;
export const monthEnd = (y: number, m: number): string => iso(new Date(y, m, 0, 12));
export const brDate = (day: string): string => `${day.slice(8)}/${day.slice(5, 7)}`;
export const isWeekend = (day: string): boolean => [0, 6].includes(weekday(day));
export function weekRange(day: string): [string, string] { const w = weekday(day); return [addDays(day, -w), addDays(day, 6 - w)]; }
export function nextWorkday(day: string): string { let d = addDays(day, 1); while (isWeekend(d)) d = addDays(d, 1); return d; }
export function prevWorkday(day: string): string { let d = addDays(day, -1); while (isWeekend(d)) d = addDays(d, -1); return d; }
export function previousMonthKey(key: string): string { const [y, m] = key.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; }
/** Semanas (domingo a sábado) que cobrem o mês, com os dias dos meses vizinhos nas pontas. */
export function monthGrid(y: number, m: number): string[][] {
  const first = monthStart(y, m), start = addDays(first, -weekday(first)), last = monthEnd(y, m);
  const weeks: string[][] = [];
  let d = start;
  while (d <= last) { const w: string[] = []; for (let i = 0; i < 7; i++) { w.push(d); d = addDays(d, 1); } weeks.push(w); }
  return weeks;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '')).toUpperCase();
}
const PERSON_COLORS = ['#0e7490', '#2563eb', '#0d9488', '#7c3aed', '#ea580c', '#db2777', '#4f46e5', '#15803d', '#b45309'];
export function personColor(id: string): string { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PERSON_COLORS[h % PERSON_COLORS.length]; }
export const fmtInt = (n: number | null | undefined): string => (n == null ? '' : Math.round(n).toLocaleString('pt-BR'));

/* ---------- filtros ---------- */
export interface VisibilityContext { projects: Map<string, DailyProject>; filters: DailyFilters; view: DailyView; today: string; me: string | null }
export function entryVisible(e: DailyEntry, ctx: VisibilityContext, ignoreView = false): boolean {
  const p = ctx.projects.get(e.project_id), f = ctx.filters;
  if (!p) return false;
  if (f.frentes.length && !f.frentes.includes(p.frente_key)) return false;
  if (f.projects.length && !f.projects.includes(p.id)) return false;
  if (f.partners.length && !p.partner_keys.some(k => f.partners.includes(k))) return false;
  if (f.people.length && !f.people.some(u => e.responsible_id === u || e.follower_ids.includes(u))) return false;
  if (f.tags.length && !e.tag_keys.some(t => f.tags.includes(t))) return false;
  if (f.q.trim()) {
    const q = f.q.trim().toLocaleLowerCase('pt-BR');
    if (!e.body.toLocaleLowerCase('pt-BR').includes(q) && !p.name.toLocaleLowerCase('pt-BR').includes(q)) return false;
  }
  if (!ignoreView) {
    if (ctx.view === 'today' && e.day !== ctx.today) return false;
    if (ctx.view === 'week') { const [a, b] = weekRange(ctx.today); if (e.day < a || e.day > b) return false; }
    if (ctx.view === 'mine' && !(ctx.me && (e.responsible_id === ctx.me || e.follower_ids.includes(ctx.me)))) return false;
  }
  return true;
}
export const hasActiveFilters = (f: DailyFilters): boolean => Boolean(f.q.trim()) || (['frentes', 'projects', 'partners', 'people', 'tags'] as FilterKey[]).some(k => f[k].length > 0);
export function toggleIsolate(list: string[], value: string, additive: boolean): string[] {
  const on = list.includes(value);
  if (additive) return on ? list.filter(x => x !== value) : [...list, value];
  return on && list.length === 1 ? [] : [value];
}
export const sortEntries = (a: DailyEntry, b: DailyEntry): number => a.position - b.position || a.created_at.localeCompare(b.created_at);

/* ---------- calendário ---------- */
/** Projetos por dia na ordem em que aparecem no próprio dia. */
export function projectsByDay(entries: DailyEntry[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of entries.slice().sort(sortEntries)) { const list = m.get(e.day) || []; if (!list.includes(e.project_id)) list.push(e.project_id); m.set(e.day, list); }
  return m;
}
/**
 * Empacota os projetos de uma semana em linhas, como uma agenda: cada projeto ocupa uma linha do primeiro ao
 * último dia em que aparece na semana, e uma linha é reaproveitada quando o projeto anterior já terminou.
 */
export function packWeek(days: string[][]): string[][] {
  const span = new Map<string, [number, number]>();
  days.forEach((ps, i) => ps.forEach(p => { const s = span.get(p); span.set(p, s ? [s[0], i] : [i, i]); }));
  const order = [...span.keys()].sort((a, b) => span.get(a)![0] - span.get(b)![0] || (span.get(b)![1] - span.get(b)![0]) - (span.get(a)![1] - span.get(a)![0]) || a.localeCompare(b));
  const rows: string[][] = [];
  for (const p of order) {
    const row = rows.find(r => span.get(r[r.length - 1])![1] < span.get(p)![0]);
    if (row) row.push(p); else rows.push([p]);
  }
  return rows;
}
/** Soma de cartões CRM do dia, opcionalmente só dos parceiros escolhidos (via crm_key). */
export function crmForDay(cells: CrmCell[], partners: DailyPartner[], selected: string[]): number | null {
  if (!cells.length) return null;
  const keys = selected.length ? new Set(partners.filter(p => selected.includes(p.key) && p.crm_key).map(p => p.crm_key as string)) : null;
  if (keys && keys.size === 0) return null;
  return cells.reduce((acc, c) => acc + (!keys || keys.has(c.partner) ? c.cards : 0), 0);
}

/* ---------- lista ---------- */
export interface EntryGroup { key: string; kind: DailyGroup; entries: DailyEntry[] }
export function groupEntries(entries: DailyEntry[], group: DailyGroup, sort: DailySort, projects: Map<string, DailyProject>, frenteOrder: string[]): EntryGroup[] {
  const dir = sort === 'desc' ? -1 : 1;
  const byDay = (a: DailyEntry, b: DailyEntry) => (a.day === b.day ? sortEntries(a, b) : (a.day < b.day ? -1 : 1) * dir);
  const map = new Map<string, DailyEntry[]>();
  const keyOf = (e: DailyEntry) => (group === 'day' ? e.day : group === 'project' ? e.project_id : projects.get(e.project_id)?.frente_key || '');
  for (const e of entries) map.set(keyOf(e), [...(map.get(keyOf(e)) || []), e]);
  const groups = [...map.entries()].map(([key, list]) => ({ key, kind: group, entries: list.sort(byDay) }));
  if (group === 'day') return groups.sort((a, b) => (a.key < b.key ? -1 : 1) * dir);
  if (group === 'project') {
    const last = (g: EntryGroup) => g.entries.reduce((m, e) => (e.day > m ? e.day : m), '');
    return groups.sort((a, b) => (last(a) === last(b) ? (projects.get(a.key)?.name || '').localeCompare(projects.get(b.key)?.name || '') : last(a) < last(b) ? 1 : -1));
  }
  return groups.sort((a, b) => frenteOrder.indexOf(a.key) - frenteOrder.indexOf(b.key));
}
/** Dentro de um dia, junta os registros do mesmo projeto, mantendo a ordem do primeiro registro de cada um. */
export function clusterByProject(entries: DailyEntry[]): DailyEntry[][] {
  const map = new Map<string, DailyEntry[]>();
  for (const e of entries) map.set(e.project_id, [...(map.get(e.project_id) || []), e]);
  return [...map.values()];
}
/** Projetos dos últimos dias úteis antes de `day`, para sugerir "continuar". */
export function recentProjects(entries: DailyEntry[], day: string, workdays = 2): string[] {
  const days: string[] = []; let d = day;
  for (let i = 0; i < workdays; i++) { d = prevWorkday(d); days.push(d); }
  const out: string[] = [];
  for (const target of days) for (const e of entries.filter(x => x.day === target).sort(sortEntries)) if (!out.includes(e.project_id)) out.push(e.project_id);
  return out;
}
export interface ProjectMonthStat { projectId: string; days: number; last: string }
export function projectMonthStats(entries: DailyEntry[], month: string): ProjectMonthStat[] {
  const m = new Map<string, Set<string>>();
  for (const e of entries) if (monthKey(e.day) === month) m.set(e.project_id, (m.get(e.project_id) || new Set()).add(e.day));
  return [...m.entries()].map(([projectId, s]) => ({ projectId, days: s.size, last: [...s].sort().pop() as string })).sort((a, b) => b.days - a.days || b.last.localeCompare(a.last));
}

/* ---------- erros ---------- */
export function friendlyDailyError(e: unknown): string {
  const msg = String((e as { message?: string })?.message || e);
  if (msg.includes('revision_conflict')) return 'Alguém salvou isso antes de você. Os dados foram recarregados.';
  if (msg.includes('access_denied')) return 'Seu acesso não permite editar a Visão Daily.';
  if (msg.includes('project_name_taken')) return 'Já existe um projeto ativo com esse nome.';
  if (msg.includes('project_invalid')) return 'Esse projeto está arquivado. Escolha um projeto ativo.';
  if (msg.includes('body_required')) return 'Escreva o que andou no projeto.';
  if (msg.includes('name_required')) return 'Dê um nome antes de salvar.';
  if (msg.includes('frente_invalid')) return 'Escolha uma frente válida.';
  return 'Não foi possível salvar. Tente de novo.';
}
