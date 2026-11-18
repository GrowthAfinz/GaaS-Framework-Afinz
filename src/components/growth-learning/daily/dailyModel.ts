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
  /** Trabalhos de Tarefas e atividades citados neste registro (growth_development_tasks.id). */
  work_ids?: string[];
  position: number; source: 'app' | 'planilha'; deleted_at: string | null; revision: number; created_at: string; updated_at: string;
}
/** Pessoa do trabalho: tem conta no GaaS ou é só um nome (decisão de 17/11/2026). */
export interface DailyPerson { id: string; name: string; has_account?: boolean; revision?: number }
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
/**
 * Projetos com registro no mês. Decisão do Pablo (16/11/2026): o último registro mais antigo fica em cima,
 * para a daily começar pelo que esfriou. Empate vai por nome (passe `names`) e depois por id.
 */
export function projectMonthStats(entries: DailyEntry[], month: string, names?: Map<string, string>): ProjectMonthStat[] {
  const m = new Map<string, Set<string>>();
  for (const e of entries) if (monthKey(e.day) === month) m.set(e.project_id, (m.get(e.project_id) || new Set()).add(e.day));
  const name = (id: string) => names?.get(id) || id;
  return [...m.entries()].map(([projectId, s]) => ({ projectId, days: s.size, last: [...s].sort().pop() as string }))
    .sort((a, b) => a.last.localeCompare(b.last) || name(a.projectId).localeCompare(name(b.projectId), 'pt-BR'));
}

/** Dias úteis (seg a sex) entre `from` e `to`, sem contar `from`. Zero quando `to` não é depois de `from`. */
export function workdaysBetween(from: string, to: string): number {
  let n = 0, d = from;
  while (d < to) { d = addDays(d, 1); if (!isWeekend(d)) n++; }
  return n;
}

/* ---------- resultados do dia ---------- */
/**
 * Linhas do modo Resultados, pela chave canônica de parceiro dos disparos (activities.parceiro_canonico).
 * Serasa fica em linha própria: é canal específico (marketplace por API) e só se lê junto do B2C em
 * contextos como carrinho abandonado (decisão do Pablo, 16/11/2026).
 */
export const RESULT_LINES: { key: string; label: string; crm: string[] }[] = [
  { key: 'plurix', label: 'CRM Plurix', crm: ['Plurix'] },
  { key: 'dia', label: 'CRM Dia', crm: ['Dia'] },
  { key: 'bem-barato', label: 'CRM Bem Barato', crm: ['Bem Barato'] },
  { key: 'b2c', label: 'CRM B2C', crm: ['Proprietaria'] },
  { key: 'serasa', label: 'CRM Serasa', crm: ['Serasa'] },
];
export const TOTAL_B2C_KEY = 'total-b2c';
export interface ResultValue { key: string; label: string; value: number; total?: boolean }
/**
 * Resultado agrupado de um dia. Parceiro com cartões e sem linha própria (ex.: Super Nosso) ganha linha
 * genérica; N/A fica de fora. `only` limita às chaves CRM escolhidas no filtro de parceiro.
 * O Total B2C (originação) já contém o CRM B2C: nunca somar as linhas para um total geral.
 */
export function dayResults(cells: CrmCell[], b2c: B2cDay | undefined, only?: Set<string> | null): ResultValue[] {
  const by = new Map<string, number>();
  for (const c of cells) by.set(c.partner, (by.get(c.partner) || 0) + c.cards);
  const known = new Set(RESULT_LINES.flatMap(l => l.crm));
  const lines: ResultValue[] = RESULT_LINES.filter(l => !only || l.crm.some(k => only.has(k)))
    .map(l => ({ key: l.key, label: l.label, value: l.crm.reduce((a, k) => a + (by.get(k) || 0), 0) }));
  for (const [partner, value] of by) if (!known.has(partner) && partner !== 'N/A' && value > 0 && (!only || only.has(partner))) lines.push({ key: 'crm:' + partner, label: 'CRM ' + partner, value });
  const out = lines.filter(l => l.value > 0);
  if (b2c?.emissions != null) out.push({ key: TOTAL_B2C_KEY, label: 'Total B2C', value: b2c.emissions, total: true });
  return out;
}
/**
 * Todas as linhas que emitem cartão, mesmo zeradas (pedido do Pablo, 16/11/2026): visão compacta de todas
 * as frentes. `extra` = chaves CRM de parceiros cadastrados ou vistos no mês que não têm linha fixa.
 * Total B2C sem dado na fonte vem com `missing` (mostra 0 apagado e avisa no tooltip).
 */
export function dayResultsAll(cells: CrmCell[], b2c: B2cDay | undefined, extra: string[] = [], only?: Set<string> | null): (ResultValue & { missing?: boolean })[] {
  const by = new Map<string, number>();
  for (const c of cells) by.set(c.partner, (by.get(c.partner) || 0) + c.cards);
  const known = new Set(RESULT_LINES.flatMap(l => l.crm));
  const lines: (ResultValue & { missing?: boolean })[] = RESULT_LINES.filter(l => !only || l.crm.some(k => only.has(k)))
    .map(l => ({ key: l.key, label: l.label, value: l.crm.reduce((a, k) => a + (by.get(k) || 0), 0) }));
  const extras = new Set([...extra, ...[...by.keys()].filter(k => (by.get(k) || 0) > 0)]);
  for (const partner of [...extras].sort()) if (!known.has(partner) && partner !== 'N/A' && (!only || only.has(partner))) lines.push({ key: 'crm:' + partner, label: 'CRM ' + partner, value: by.get(partner) || 0 });
  lines.push({ key: TOTAL_B2C_KEY, label: 'Total B2C', value: b2c?.emissions ?? 0, total: true, missing: b2c?.emissions == null });
  return lines;
}
/** Valor de uma linha num dia, para a média de comparação. null = sem dado naquele dia. */
export function resultValue(key: string, cells: CrmCell[] | undefined, b2c: B2cDay | undefined): number | null {
  if (key === TOTAL_B2C_KEY) return b2c?.emissions ?? null;
  if (!cells) return null;
  const line = RESULT_LINES.find(l => l.key === key);
  const keys = line ? line.crm : key.startsWith('crm:') ? [key.slice(4)] : [];
  return cells.reduce((a, c) => a + (keys.includes(c.partner) ? c.cards : 0), 0);
}
export interface WeekdayCompare { avg: number; weeks: number; delta: number | null }
/**
 * Compara um dia com a média do mesmo dia da semana nas `weeks` semanas anteriores (só semanas com dado).
 * delta = variação relativa; null quando a média é zero ou não há semana com dado.
 */
export function weekdayCompare(day: string, value: number, valueOf: (d: string) => number | null, weeks = 4): WeekdayCompare {
  const prev: number[] = [];
  for (let i = 1; i <= weeks; i++) { const v = valueOf(addDays(day, -7 * i)); if (v != null) prev.push(v); }
  if (!prev.length) return { avg: 0, weeks: 0, delta: null };
  const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
  return { avg, weeks: prev.length, delta: avg > 0 ? value / avg - 1 : null };
}

/* ---------- projeto parado ---------- */
export interface WorkLite { id: string; initiative_id: string | null; status: string }
export interface StaleInfo { idle: number; last: string; active: number }
/**
 * Projeto "parado": tem trabalho Em execução e ninguém cita o projeto na Daily há `minIdle` dias úteis ou mais.
 * Trabalho em execução citado por registros pertence aos projetos que o citaram; o que nunca foi citado
 * pertence a todos os projetos da iniciativa (vale para a iniciativa inteira).
 * `lastDay` = último registro do projeto até hoje (registros futuros, planejados, não contam como andamento).
 */
export function staleProjects(projects: DailyProject[], works: WorkLite[], recent: Pick<DailyEntry, 'project_id' | 'day' | 'work_ids'>[], today: string, minIdle = 5): Map<string, StaleInfo> {
  const running = works.filter(w => w.status === 'em_execucao');
  const citedBy = new Map<string, Set<string>>();
  for (const e of recent) for (const w of e.work_ids || []) citedBy.set(w, (citedBy.get(w) || new Set()).add(e.project_id));
  const last = new Map<string, string>();
  for (const e of recent) if (e.day <= today && (last.get(e.project_id) || '') < e.day) last.set(e.project_id, e.day);
  const out = new Map<string, StaleInfo>();
  for (const p of projects) {
    if (p.archived || p.merged_into) continue;
    const active = running.filter(w => (citedBy.has(w.id) ? citedBy.get(w.id)!.has(p.id) : Boolean(p.initiative_id) && w.initiative_id === p.initiative_id)).length;
    if (!active) continue;
    // Sem registro na janela carregada: projeto dormente, não "parado" (evita acender projeto antigo).
    const l = last.get(p.id);
    if (!l) continue;
    const idle = workdaysBetween(l, today);
    if (idle >= minIdle) out.set(p.id, { idle, last: l, active });
  }
  return out;
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
