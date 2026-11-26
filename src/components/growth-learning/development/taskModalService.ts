/**
 * Dados da janela da Tarefa. A janela é a mesma em Tarefas e atividades, no kanban da Visão Daily e na Wiki,
 * então carrega tudo pelo id da Tarefa, sem depender da tela que a abriu.
 */
import { supabase } from '../../../services/supabaseClient';
import { canEditWork } from './developmentService';
import { normalizeWork, type WorkItem } from './workModel';

export interface Option { id: string; name: string; color?: string }
export interface Person { id: string; name: string; has_account: boolean }
export interface Mention { id: string; day: string; body: string; project_id: string; work_ids: string[]; revision: number; responsible_id: string | null }
export interface TaskEventLite { id: string; revision: number; created_at: string; before_data: Partial<WorkItem> | null; after_data: Partial<WorkItem> }
export interface TaskComment { id: string; task_id: string; author_id: string; body: string; created_at: string; deleted_at: string | null }
export interface DependencyRef { id: string; task_key: string; title: string; status: string; parent_task_id: string | null }
export interface InitiativeRef { id: string; title: string; workspace: string; source_note: string | null }
export interface TaskBundle {
  task: WorkItem; parent: WorkItem | null; subtasks: WorkItem[]; canEdit: boolean;
  initiatives: InitiativeRef[]; fronts: Option[]; projects: (Option & { frente_key: string })[]; partners: Option[]; people: Person[];
  mentions: Mention[]; dependencies: DependencyRef[]; dependents: DependencyRef[]; history: TaskEventLite[]; comments: TaskComment[];
  /** Registros recentes dos projetos do card, vinculados ou não (a atividade do card). */
  projectEntries: Mention[];
}

const one = async <T,>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> => { const { data, error } = await p; if (error) throw error; return data as T; };

export async function loadTaskBundle(id: string): Promise<TaskBundle> {
  const task = normalizeWork(await one(supabase.from('growth_development_tasks').select('*').eq('id', id).single()));
  const parentId = task.parent_task_id || null;
  const [parent, subtasks, initiatives, fronts, projects, partners, people, history, comments, canEdit] = await Promise.all([
    parentId ? one(supabase.from('growth_development_tasks').select('*').eq('id', parentId).single()).then(normalizeWork) : Promise.resolve(null),
    parentId ? Promise.resolve([] as WorkItem[]) : one(supabase.from('growth_development_tasks').select('*').eq('parent_task_id', id).order('position', { ascending: true, nullsFirst: false }).order('created_at')).then(r => (r as WorkItem[]).map(normalizeWork)),
    one(supabase.from('growth_work_initiatives').select('id,title,workspace,source_note').order('title')),
    one(supabase.from('daily_frentes').select('key,name,color,archived').order('position')).then(r => (r as { key: string; name: string; color: string; archived: boolean }[]).filter(f => !f.archived).map(f => ({ id: f.key, name: f.name, color: f.color }))),
    one(supabase.from('daily_projects').select('id,name,frente_key,archived,merged_into').order('name')).then(r => (r as { id: string; name: string; frente_key: string; archived: boolean; merged_into: string | null }[]).filter(p => !p.archived && !p.merged_into).map(p => ({ id: p.id, name: p.name, frente_key: p.frente_key }))),
    one(supabase.from('daily_partners').select('key,name,color,archived').order('position')).then(r => (r as { key: string; name: string; color: string; archived: boolean }[]).filter(p => !p.archived).map(p => ({ id: p.key, name: p.name, color: p.color }))),
    one(supabase.rpc('gaas_work_people')).then(r => r as Person[]).catch(() => [] as Person[]),
    one(supabase.from('growth_development_task_events').select('id,revision,created_at,before_data,after_data').eq('task_id', id).order('revision', { ascending: false }).limit(40)).catch(() => []),
    one(supabase.from('growth_task_comments').select('*').eq('task_id', id).is('deleted_at', null).order('created_at')).catch(() => []),
    canEditWork().catch(() => false),
  ]);
  const ids = [id, ...(subtasks as WorkItem[]).map(s => s.id)];
  const keys = [task.task_key, ...(subtasks as WorkItem[]).map(s => s.task_key)];
  const depKeys = [...new Set([...(task.dependencies || []), ...(subtasks as WorkItem[]).flatMap(s => s.dependencies || [])])];
  const projectIds = (parent ? (parent as WorkItem).project_ids : task.project_ids) || [];
  const [mentions, projectEntries, dependencies, dependents] = await Promise.all([
    one(supabase.from('daily_entries').select('id,day,body,project_id,work_ids,revision,responsible_id').is('deleted_at', null).overlaps('work_ids', ids).order('day', { ascending: false }).limit(60)).catch(() => []),
    projectIds.length ? one(supabase.from('daily_entries').select('id,day,body,project_id,work_ids,revision,responsible_id').is('deleted_at', null).in('project_id', projectIds).gte('day', daysAgo(60)).order('day', { ascending: false }).limit(80)).catch(() => []) : Promise.resolve([]),
    depKeys.length ? one(supabase.from('growth_development_tasks').select('id,task_key,title,status,parent_task_id').in('task_key', depKeys)).catch(() => []) : Promise.resolve([]),
    one(supabase.from('growth_development_tasks').select('id,task_key,title,status,parent_task_id').overlaps('dependencies', keys).limit(60)).catch(() => []),
  ]);
  return {
    task, parent: parent as WorkItem | null, subtasks: subtasks as WorkItem[], canEdit: Boolean(canEdit),
    initiatives: initiatives as InitiativeRef[], fronts, projects, partners, people: people as Person[],
    mentions: mentions as Mention[], dependencies: dependencies as DependencyRef[], dependents: (dependents as DependencyRef[]).filter(d => !ids.includes(d.id)),
    history: history as TaskEventLite[], comments: comments as TaskComment[], projectEntries: projectEntries as Mention[],
  };
}

/** Linha atual de uma Tarefa e Sub Tarefas atuais de um pai (depois de cascata do servidor). */
export async function loadTask(id: string): Promise<WorkItem> {
  return normalizeWork(await one(supabase.from('growth_development_tasks').select('*').eq('id', id).single()));
}
export async function loadSubtasks(parentId: string): Promise<WorkItem[]> {
  const r = await one(supabase.from('growth_development_tasks').select('*').eq('parent_task_id', parentId).order('position', { ascending: true, nullsFirst: false }).order('created_at'));
  return (r as WorkItem[]).map(normalizeWork);
}

const spDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
export const todaySP = () => spDay();
const daysAgo = (n: number) => spDay(new Date(Date.now() - n * 86400000));

/** Vincula um registro da Daily ao card (ou Sub Tarefa); se o registro mudou no meio, relê e tenta de novo. */
export async function linkEntry(entry: Pick<Mention, 'id' | 'revision' | 'work_ids'>, workId: string): Promise<Mention> {
  const call = (rev: number, ids: string[]) => supabase.rpc('gaas_daily_save_entry', { p_id: entry.id, p_revision: rev, p_body: { work_ids: [...new Set([...ids, workId])] } });
  let { data, error } = await call(entry.revision, entry.work_ids || []);
  if (error && String(error.message).includes('revision_conflict')) {
    const fresh = await one(supabase.from('daily_entries').select('revision,work_ids').eq('id', entry.id).single()) as { revision: number; work_ids: string[] };
    ({ data, error } = await call(fresh.revision, fresh.work_ids || []));
  }
  if (error) throw error;
  return data as Mention;
}
/** Registro de hoje na Visão Daily, feito de dentro do card e já vinculado a ele. */
export async function createDailyEntry(projectId: string, body: string, workId: string, responsibleId: string | null): Promise<Mention> {
  const { data, error } = await supabase.rpc('gaas_daily_save_entry', { p_id: null, p_revision: null, p_body: {
    day: todaySP(), project_id: projectId, body, work_ids: [workId], ...(responsibleId ? { responsible_id: responsibleId } : {}),
  } });
  if (error) throw error;
  return data as Mention;
}

/** Salva só os campos enviados, com a revisão que a janela conhece. */
export async function patchTask(task: Pick<WorkItem, 'id' | 'revision'>, patch: Record<string, unknown>): Promise<WorkItem> {
  const { data, error } = await supabase.rpc('growth_save_development_task', { p_id: task.id, p_revision: task.revision, p_body: patch });
  if (error) throw error;
  return normalizeWork(data as WorkItem);
}
export async function createSubtask(parent: WorkItem, title: string, group: string | null, position: number): Promise<WorkItem> {
  const { data, error } = await supabase.rpc('growth_save_task_tree', { p_body: { parent_id: parent.id, subtasks: [{ title, subtask_group: group, position }] } });
  if (error) throw error;
  return normalizeWork((data as { subtasks: WorkItem[] }).subtasks[0]);
}
export async function addComment(taskId: string, body: string): Promise<TaskComment> {
  const { data, error } = await supabase.rpc('growth_add_task_comment', { p_task: taskId, p_body: body });
  if (error) throw error;
  return data as TaskComment;
}
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.rpc('growth_delete_task_comment', { p_id: id });
  if (error) throw error;
}
export async function createPerson(name: string): Promise<Person> {
  const { data, error } = await supabase.rpc('gaas_work_save_person', { p_id: null, p_revision: null, p_body: { name } });
  if (error) throw error;
  const p = data as { id: string; name: string };
  return { id: p.id, name: p.name, has_account: false };
}

/** Link direto da Tarefa: mantém a tela atual e acrescenta ?task=<id> (sem perder filtros e busca). */
export function taskLink(id: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('task', id);
  url.searchParams.delete('dev_task');
  return url.toString();
}
