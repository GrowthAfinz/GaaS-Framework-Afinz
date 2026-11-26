import { supabase } from '../../../services/supabaseClient';
import type { B2cDay, CrmCell, DailyConfig, DailyEntry, DailyFrente, DailyPartner, DailyPerson, DailyProject, DailyTag } from './dailyModel';

export interface DailyLoad extends DailyConfig { canEdit: boolean }

export async function loadDailyConfig(): Promise<DailyLoad> {
  const [frentes, partners, tags, projects, people] = await Promise.all([
    supabase.from('daily_frentes').select('*').order('position'),
    supabase.from('daily_partners').select('*').order('position'),
    supabase.from('daily_tags').select('*').order('position'),
    supabase.from('daily_projects').select('*').order('name'),
    // Arquivadas vêm junto só para mostrar o nome nos registros antigos; os seletores escondem.
    supabase.rpc('gaas_work_people', { p_include_archived: true }),
  ]);
  const error = frentes.error || partners.error || tags.error || projects.error;
  if (error) throw error;
  return {
    frentes: (frentes.data || []) as DailyFrente[],
    partners: (partners.data || []) as DailyPartner[],
    tags: (tags.data || []) as DailyTag[],
    projects: (projects.data || []) as DailyProject[],
    people: (people.data || []) as DailyPerson[],
    canEdit: !people.error,
  };
}

/** Registro atual (para refazer um vínculo quando a revisão da tela ficou velha). */
export async function loadEntry(id: string): Promise<DailyEntry> {
  const { data, error } = await supabase.from('daily_entries').select('*').eq('id', id).single();
  if (error) throw error;
  return data as DailyEntry;
}

export async function loadEntries(start: string, end: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase.from('daily_entries').select('*').is('deleted_at', null).gte('day', start).lte('day', end)
    .order('day').order('position').limit(5000);
  if (error) throw error;
  return (data || []) as DailyEntry[];
}

export async function loadB2c(start: string, end: string): Promise<B2cDay[]> {
  const { data, error } = await supabase.from('b2c_daily_metrics').select('data,emissoes_total,propostas_total')
    .eq('tipo', 'total').gte('data', start).lte('data', end).order('data');
  if (error) throw error;
  return (data || []).map(r => ({ day: String(r.data), emissions: r.emissoes_total == null ? null : Number(r.emissoes_total), proposals: r.propostas_total == null ? null : Number(r.propostas_total) }));
}

export async function loadCrm(start: string, end: string): Promise<CrmCell[]> {
  const { data, error } = await supabase.rpc('gaas_daily_crm_cards', { p_start: start, p_end: end });
  if (error) throw error;
  return ((data || []) as { day: string; partner: string; cards: number | string; proposals: number | string }[])
    .map(r => ({ day: String(r.day), partner: r.partner, cards: Number(r.cards) || 0, proposals: Number(r.proposals) || 0 }));
}

/** Última data com dado, para mostrar o frescor das fontes na barra. */
export async function loadFreshness(): Promise<{ b2c: string | null; crm: string | null }> {
  const [b, c] = await Promise.all([
    supabase.from('b2c_daily_metrics').select('data').eq('tipo', 'total').not('emissoes_total', 'is', null).order('data', { ascending: false }).limit(1),
    supabase.from('activities').select('"Data de Disparo"').lte('Data de Disparo', new Date().toISOString()).order('Data de Disparo', { ascending: false }).limit(1),
  ]);
  const crmRaw = (c.data?.[0] as Record<string, string> | undefined)?.['Data de Disparo'];
  const crm = crmRaw ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(crmRaw)) : null;
  return { b2c: b.data?.[0]?.data ? String(b.data[0].data) : null, crm };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}
/** Cria, renomeia ou arquiva pessoa só com nome. */
export const saveWorkPerson = (id: string | null, revision: number | null, body: Record<string, unknown>) =>
  rpc<DailyPerson & { archived: boolean }>('gaas_work_save_person', { p_id: id, p_revision: revision, p_body: body });
/** Liga a pessoa só com nome a uma conta (registros e Tarefas passam a apontar para a conta). */
export const linkWorkPerson = (person: string, member: string) =>
  rpc<{ daily_entries: number; tasks: number }>('gaas_work_link_person', { p_person: person, p_member: member });
export const saveEntry = (id: string | null, revision: number | null, body: Record<string, unknown>) =>
  rpc<DailyEntry>('gaas_daily_save_entry', { p_id: id, p_revision: revision, p_body: body });
export const saveProject = (id: string | null, revision: number | null, body: Record<string, unknown>) =>
  rpc<DailyProject>('gaas_daily_save_project', { p_id: id, p_revision: revision, p_body: body });
export const mergeProjects = (from: string, into: string) => rpc<{ moved: number }>('gaas_daily_merge_projects', { p_from: from, p_into: into });
export const saveOption = <T extends DailyFrente | DailyPartner | DailyTag>(kind: 'frente' | 'partner' | 'tag', key: string | null, body: Record<string, unknown>) =>
  rpc<T>('gaas_daily_save_option', { p_kind: kind, p_key: key, p_body: body });

export async function loadProjectEntries(projectId: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase.from('daily_entries').select('*').eq('project_id', projectId).is('deleted_at', null).order('day', { ascending: false }).order('position').limit(1000);
  if (error) throw error;
  return (data || []) as DailyEntry[];
}

export async function loadEarliestDay(): Promise<string | null> {
  const { data, error } = await supabase.from('daily_entries').select('day').is('deleted_at', null).order('day').limit(1);
  if (error) return null;
  return data?.[0]?.day ? String(data[0].day) : null;
}

/** Campanhas do board da Estrutura CRM, com o caminho pilar › coluna para a escolha no projeto. */
export interface BoardCampaign { id: string; title: string; path: string }
export async function loadBoardCampaigns(): Promise<BoardCampaign[]> {
  const [cards, lanes, pillars] = await Promise.all([
    supabase.from('crm_structure_cards').select('id,title,lane_id,position,archived').eq('archived', false).order('position'),
    supabase.from('crm_structure_lanes').select('id,title,pillar_id,position').eq('archived', false),
    supabase.from('crm_structure_pillars').select('id,title,position').eq('archived', false),
  ]);
  if (cards.error || lanes.error || pillars.error) return [];
  const lane = new Map((lanes.data || []).map(l => [l.id, l]));
  const pillar = new Map((pillars.data || []).map(p => [p.id, p]));
  return (cards.data || []).filter(c => lane.has(c.lane_id)).map(c => {
    const l = lane.get(c.lane_id)!; const p = pillar.get(l.pillar_id);
    return { id: c.id, title: c.title, path: `${p?.title || ''} › ${l.title}`, order: (p?.position ?? 0) * 1e6 + l.position * 1e3 + c.position };
  }).sort((a, b) => a.order - b.order).map(({ order: _o, ...c }) => c);
}

export async function loadInitiatives(): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('growth_work_initiatives').select('id,title').order('title');
  if (error) return [];
  return (data || []) as { id: string; title: string }[];
}

/* ---------- Kanban e disparos (16/11/2026) ---------- */
export interface DailyWork {
  id: string; task_key: string; title: string; status: string; priority: string; owner_label: string | null; due_date: string | null;
  next_action: string; initiative_id: string | null; work_type: string; workspace: string; blocked_reason: string | null; revision: number; updated_at?: string;
  /** Sub Tarefa: aparece dentro do card da Tarefa pai, não como card. */
  parent_task_id?: string | null;
  /** completed_on = data de finalização (só quando concluída). */
  details?: Record<string, string> | null;
}
export interface DailyInitiative { id: string; title: string; workspace: string; source_note: string | null }
const WORK_COLS = 'id,task_key,title,status,priority,owner_label,due_date,next_action,initiative_id,work_type,workspace,blocked_reason,revision,updated_at,parent_task_id,details';

export async function loadWorks(): Promise<DailyWork[]> {
  const { data, error } = await supabase.from('growth_development_tasks').select(WORK_COLS).order('updated_at', { ascending: false }).limit(2000);
  if (error) throw error;
  return (data || []) as DailyWork[];
}
export async function loadInitiativesFull(): Promise<DailyInitiative[]> {
  const { data, error } = await supabase.from('growth_work_initiatives').select('id,title,workspace,source_note').order('title');
  if (error) throw error;
  return (data || []) as DailyInitiative[];
}
/** Cria Sub Tarefa numa Tarefa (growth_save_task_tree). */
export async function createSubWork(parentId: string, body: Record<string, unknown>): Promise<DailyWork> {
  const { data, error } = await supabase.rpc('growth_save_task_tree', { p_body: { parent_id: parentId, subtasks: [body] } });
  if (error) throw error;
  return (data as { subtasks: DailyWork[] }).subtasks[0];
}
/** Salva um trabalho pelo RPC de Tarefas (as regras de bloqueio, critérios e evidência continuam valendo). */
export const saveWork = (id: string | null, revision: number | null, body: Record<string, unknown>) =>
  rpc<DailyWork>('growth_save_development_task', { p_id: id, p_revision: revision, p_body: body });

/** Registros leves de um período (para "parado" e menções nos cards), sem o mês inteiro em memória. */
export interface EntryLite { id: string; day: string; project_id: string; body: string; work_ids: string[] }
export async function loadEntriesLite(start: string, end: string): Promise<EntryLite[]> {
  const { data, error } = await supabase.from('daily_entries').select('id,day,project_id,body,work_ids').is('deleted_at', null).gte('day', start).lte('day', end).limit(5000);
  if (error) throw error;
  return (data || []).map(r => ({ ...r, day: String(r.day), work_ids: (r.work_ids || []) as string[] })) as EntryLite[];
}
/** Todos os registros que citam algum trabalho (para o card mostrar a última menção). */
export async function loadWorkMentions(): Promise<EntryLite[]> {
  const { data, error } = await supabase.from('daily_entries').select('id,day,project_id,body,work_ids').is('deleted_at', null).neq('work_ids', '{}').order('day', { ascending: false }).limit(3000);
  if (error) throw error;
  return (data || []).map(r => ({ ...r, day: String(r.day), work_ids: (r.work_ids || []) as string[] })) as EntryLite[];
}

export interface Dispatch {
  id: string; name: string; journey: string; channel: string; bu: string; partner: string; segment: string;
  base: number | null; cards: number; proposals: number; at: string;
}
/** Disparos CRM de um dia (fuso de São Paulo), mais cartões primeiro. */
export async function loadDispatches(day: string): Promise<Dispatch[]> {
  const next = addDaysIso(day, 1);
  const { data, error } = await supabase.from('activities')
    .select('id,"Activity name / Taxonomia",jornada,"Canal","BU",parceiro_canonico,"Segmento","Base Acionável","Cartões Gerados","Propostas","Data de Disparo"')
    .gte('Data de Disparo', `${day}T00:00:00-03:00`).lt('Data de Disparo', `${next}T00:00:00-03:00`).limit(500);
  if (error) throw error;
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  return ((data || []) as Record<string, unknown>[]).map(r => ({
    id: String(r.id), name: String(r['Activity name / Taxonomia'] || ''), journey: String(r.jornada || ''), channel: String(r['Canal'] || ''),
    bu: String(r['BU'] || ''), partner: String(r.parceiro_canonico || 'N/A'), segment: String(r['Segmento'] || ''),
    base: num(r['Base Acionável']), cards: num(r['Cartões Gerados']) || 0, proposals: num(r['Propostas']) || 0, at: String(r['Data de Disparo'] || ''),
  })).sort((a, b) => b.cards - a.cards || (b.base || 0) - (a.base || 0));
}
function addDaysIso(day: string, n: number): string { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
