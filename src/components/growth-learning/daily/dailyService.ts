import { supabase } from '../../../services/supabaseClient';
import type { B2cDay, CrmCell, DailyConfig, DailyEntry, DailyFrente, DailyPartner, DailyPerson, DailyProject, DailyTag } from './dailyModel';

export interface DailyLoad extends DailyConfig { canEdit: boolean }

export async function loadDailyConfig(): Promise<DailyLoad> {
  const [frentes, partners, tags, projects, people] = await Promise.all([
    supabase.from('daily_frentes').select('*').order('position'),
    supabase.from('daily_partners').select('*').order('position'),
    supabase.from('daily_tags').select('*').order('position'),
    supabase.from('daily_projects').select('*').order('name'),
    supabase.rpc('gaas_daily_people'),
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

export async function loadInitiatives(): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('growth_work_initiatives').select('id,title').order('title');
  if (error) return [];
  return (data || []) as { id: string; title: string }[];
}
