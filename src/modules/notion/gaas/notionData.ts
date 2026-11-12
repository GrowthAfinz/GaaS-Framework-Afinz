/** Carga e sincronização do módulo com o Supabase (tabelas nt_*), mais a ponte com as tarefas reais. */
import { supabase } from '../../../services/supabaseClient';
import { loadWorkspace, saveWork } from '../../../components/growth-learning/development/workService';
import { type Initiative, type WorkItem } from '../../../components/growth-learning/development/workModel';
import type { Block, DatabaseRow, NotionColor, NotionDatabase, NotionPage, NotionUser, NotionWorkspace } from '../types/notion';
import { TASKS_DB, TASKS_PAGE, type BusinessFront, type BoardCampaignRef, type DailyProjectRef, extraProps, storedExtra, rowPatch, systemProperties, taskBlocks, taskIdOfRow, taskPage, taskRowId, taskToRow, tasksDatabase } from './tasksAdapter';

export interface NotionContext {
  me: string | null; canEditTasks: boolean; tasks: Map<string, WorkItem>; initiatives: Initiative[]; fronts: BusinessFront[]; projects: DailyProjectRef[];
}
export interface Loaded { workspace: NotionWorkspace; ctx: NotionContext; seeded: boolean }

const COLORS: NotionColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'yellow', 'red', 'brown', 'gray'];
const favKey = (me: string | null) => `gaas.notion.favorites.${me || 'anon'}`;
const activeKey = (me: string | null) => `gaas.notion.active.${me || 'anon'}`;
const readLocal = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; } };
export const saveLocalPrefs = (me: string | null, ws: NotionWorkspace) => {
  try { localStorage.setItem(favKey(me), JSON.stringify(ws.favoritePageIds)); localStorage.setItem(activeKey(me), JSON.stringify(ws.activePageId)); } catch { /* preferência local */ }
};

function seedPages(): { pages: NotionPage[]; blocks: Block[] } {
  const now = new Date().toISOString();
  const blocks: Block[] = [
    { id: 'blk_inicio_1', type: 'callout', icon: '👋', backgroundColor: 'blue', content: 'Este é o espaço do time no GaaS, no formato do Notion. Tarefas, specs, investigações e experimentos ficam na base Tarefas; cada linha abre como página.' },
    { id: 'blk_inicio_2', type: 'heading_2', content: 'Como usar' },
    { id: 'blk_inicio_3', type: 'bulleted_list_item', content: 'Abra "Tarefas e atividades" na barra lateral e use os chips de frente no topo e troque de visão: por status, por frente, por projeto, calendário e tabela. O desenvolvimento do GaaS fica na visão SDD.' },
    { id: 'blk_inicio_4', type: 'bulleted_list_item', content: 'Clique numa tarefa para abrir a página dela; escreva no corpo com "/" para inserir blocos.' },
    { id: 'blk_inicio_5', type: 'bulleted_list_item', content: 'Conhecimento continua na Wiki: aqui ficam o trabalho e o registro de execução.' },
  ];
  return {
    pages: [
      { id: 'page_inicio', title: 'Início', icon: '🏠', parentId: null, createdAt: now, updatedAt: now, blockIds: blocks.map(b => b.id) },
      { id: TASKS_PAGE, title: 'Tarefas e atividades', icon: '✅', parentId: null, createdAt: now, updatedAt: now, blockIds: [], databaseId: TASKS_DB, isFullWidth: true },
    ],
    blocks,
  };
}

export async function loadNotion(me: string | null): Promise<Loaded> {
  const [pages, blocks, dbs, rows, meta, people, work, frentesRes, projectsRes, cardsRes] = await Promise.all([
    supabase.from('nt_pages').select('id,data'), supabase.from('nt_blocks').select('id,page_id,data'),
    supabase.from('nt_databases').select('id,data'), supabase.from('nt_rows').select('id,database_id,data'),
    supabase.from('nt_meta').select('key,data'), supabase.rpc('gaas_daily_people'), loadWorkspace(),
    supabase.from('daily_frentes').select('key,name,color,archived,position').order('position'),
    supabase.from('daily_projects').select('id,name,frente_key,initiative_id,archived,structure_card_id').order('name'),
    supabase.from('crm_structure_cards').select('id,title').eq('archived', false).order('title'),
  ]);
  const err = pages.error || blocks.error || dbs.error || rows.error || meta.error;
  if (err) throw err;
  const users: NotionUser[] = ((people.data || []) as { id: string; name: string }[]).map((p, i) => ({ id: p.id, name: p.name, email: '', role: 'Member', color: COLORS[i % COLORS.length] }));
  const tasks = new Map(work.tasks.map(t => [t.id, t]));
  // Frentes e projetos da Visão Daily; se a leitura falhar, o módulo abre só com a frente do GaaS.
  const fronts = (frentesRes.data || []) as BusinessFront[];
  const projects = (projectsRes.data || []) as DailyProjectRef[];
  const campaigns = (cardsRes.error ? [] : cardsRes.data || []) as BoardCampaignRef[];
  const wsMeta = (meta.data || []).find(m => m.key === 'workspace')?.data as { rootPageIds?: string[] } | undefined;
  const seeded = !wsMeta;

  const pageMap: Record<string, NotionPage> = {};
  const blockMap: Record<string, Block> = {};
  if (seeded) { const s = seedPages(); s.pages.forEach(p => { pageMap[p.id] = p; }); s.blocks.forEach(b => { blockMap[b.id] = b; }); }
  for (const r of pages.data || []) pageMap[r.id] = r.data as NotionPage;
  if (pageMap[TASKS_PAGE]?.title === 'Testes e Tarefas') pageMap[TASKS_PAGE] = { ...pageMap[TASKS_PAGE], title: 'Tarefas e atividades' };
  for (const r of blocks.data || []) blockMap[r.id] = r.data as Block;

  // Base Tarefas: linhas vindas das tarefas; páginas e blocos guardados por cima dos gerados.
  const storedTasksDb = (dbs.data || []).find(d => d.id === TASKS_DB)?.data as Partial<NotionDatabase> | undefined;
  const props = systemProperties(work.initiatives, fronts, projects, campaigns);
  const extra = new Map((rows.data || []).filter(r => r.database_id === TASKS_DB).map(r => [r.id, (r.data as { properties?: Record<string, unknown> }).properties || {}]));
  const taskRows: DatabaseRow[] = [];
  for (const t of work.tasks) {
    const gen = taskBlocks(t);
    gen.forEach(b => { if (!blockMap[b.id]) blockMap[b.id] = b; });
    const id = taskRowId(t.id);
    pageMap[id] = taskPage(t, gen, pageMap[id]);
    taskRows.push(taskToRow(t, props, users, extra.get(id), projects));
  }
  const databases: Record<string, NotionDatabase> = { [TASKS_DB]: tasksDatabase(props, taskRows, storedTasksDb) };
  for (const d of dbs.data || []) {
    if (d.id === TASKS_DB) continue;
    databases[d.id] = { ...(d.data as NotionDatabase), rows: (rows.data || []).filter(r => r.database_id === d.id).map(r => r.data as DatabaseRow) };
  }
  if (!pageMap[TASKS_PAGE]) pageMap[TASKS_PAGE] = seedPages().pages[1];

  const roots = Object.values(pageMap).filter(p => !p.parentId && !p.isArchived).map(p => p.id);
  const rootPageIds = [...(wsMeta?.rootPageIds || ['page_inicio', TASKS_PAGE]).filter(id => roots.includes(id)), ...roots.filter(id => !(wsMeta?.rootPageIds || ['page_inicio', TASKS_PAGE]).includes(id))];
  const active = readLocal<string>(activeKey(me), TASKS_PAGE);
  const workspace: NotionWorkspace = {
    id: 'gaas', name: 'GaaS · Tarefas e atividades', icon: '✅', users, activeUserId: me && users.some(u => u.id === me) ? me : users[0]?.id || 'gaas-user',
    pages: pageMap, blocks: blockMap, databases, rootPageIds,
    trashPageIds: Object.values(pageMap).filter(p => p.isArchived).map(p => p.id),
    favoritePageIds: readLocal<string[]>(favKey(me), [TASKS_PAGE]).filter(id => pageMap[id]),
    activePageId: pageMap[active] ? active : TASKS_PAGE,
  };
  return { workspace, ctx: { me, canEditTasks: work.canEdit, tasks, initiatives: work.initiatives, fronts, projects }, seeded };
}

/* ---------- foto e diferença ---------- */
export interface Snapshot { pages: Map<string, string>; blocks: Map<string, string>; dbs: Map<string, string>; rows: Map<string, string>; rowObjs: Map<string, DatabaseRow>; meta: string }
const dbSchema = (d: NotionDatabase) => { const { rows: _rows, ...rest } = d; return rest; };
export function snapshot(ws: NotionWorkspace): Snapshot {
  const rows = new Map<string, string>(), rowObjs = new Map<string, DatabaseRow>();
  for (const d of Object.values(ws.databases)) for (const r of d.rows) { rows.set(d.id + '|' + r.id, JSON.stringify(r)); rowObjs.set(d.id + '|' + r.id, JSON.parse(JSON.stringify(r))); }
  return {
    pages: new Map(Object.values(ws.pages).map(p => [p.id, JSON.stringify(p)])),
    blocks: new Map(Object.values(ws.blocks).map(b => [b.id, JSON.stringify(b)])),
    dbs: new Map(Object.values(ws.databases).map(d => [d.id, JSON.stringify(dbSchema(d))])),
    rows, rowObjs, meta: JSON.stringify({ rootPageIds: ws.rootPageIds }),
  };
}
export interface TaskChange { taskId: string; patch: Partial<WorkItem>; rowKey: string }
export interface Changes { upserts: Record<string, unknown[]>; deletes: Record<string, string[]>; tasks: TaskChange[]; empty: boolean }
export function diff(prev: Snapshot, ws: NotionWorkspace, props = ws.databases[TASKS_DB]?.properties || []): Changes {
  const up: Record<string, unknown[]> = { pages: [], blocks: [], databases: [], rows: [], meta: [] };
  const del: Record<string, string[]> = { pages: [], blocks: [], rows: [] };
  const tasks: TaskChange[] = [];
  const blockPage = new Map<string, string>();
  for (const p of Object.values(ws.pages)) for (const b of p.blockIds) blockPage.set(b, p.id);
  for (const p of Object.values(ws.pages)) { const s = JSON.stringify(p); if (prev.pages.get(p.id) !== s) up.pages.push({ id: p.id, data: p }); }
  for (const id of prev.pages.keys()) if (!ws.pages[id] && !taskIdOfRow(id)) del.pages.push(id);
  for (const b of Object.values(ws.blocks)) {
    const s = JSON.stringify(b);
    if (prev.blocks.get(b.id) !== s) up.blocks.push({ id: b.id, page_id: blockPage.get(b.id) || findParent(ws, b.id) || 'orphan', data: b });
  }
  for (const id of prev.blocks.keys()) if (!ws.blocks[id]) del.blocks.push(id);
  for (const d of Object.values(ws.databases)) {
    const s = JSON.stringify(dbSchema(d));
    if (prev.dbs.get(d.id) !== s) up.databases.push({ id: d.id, data: dbSchema(d) });
    for (const r of d.rows) {
      const key = d.id + '|' + r.id, s2 = JSON.stringify(r);
      if (prev.rows.get(key) === s2) continue;
      if (d.id === TASKS_DB) {
        const before = prev.rowObjs.get(key), taskId = taskIdOfRow(r.id);
        if (before && taskId) {
          const patch = rowPatch(before, r, props, ws.users);
          if (Object.keys(patch).length) tasks.push({ taskId, patch, rowKey: key });
          if (JSON.stringify(extraProps(before)) !== JSON.stringify(extraProps(r))) up.rows.push({ id: r.id, database_id: d.id, data: { properties: storedExtra(extraProps(r), props) } });
        }
      } else up.rows.push({ id: r.id, database_id: d.id, data: r });
    }
  }
  for (const key of prev.rows.keys()) {
    const [dbId, rowId] = key.split('|');
    if (dbId !== TASKS_DB && !ws.databases[dbId]?.rows.some(r => r.id === rowId)) del.rows.push(rowId);
  }
  const meta = JSON.stringify({ rootPageIds: ws.rootPageIds });
  if (meta !== prev.meta) up.meta.push({ key: 'workspace', data: { rootPageIds: ws.rootPageIds } });
  const empty = Object.values(up).every(a => !a.length) && Object.values(del).every(a => !a.length) && !tasks.length;
  return { upserts: up, deletes: del, tasks, empty };
}
function findParent(ws: NotionWorkspace, blockId: string): string | null {
  for (const b of Object.values(ws.blocks)) if (b.childrenIds?.includes(blockId)) return findParentPage(ws, b.id);
  return null;
}
function findParentPage(ws: NotionWorkspace, blockId: string): string | null {
  for (const p of Object.values(ws.pages)) if (p.blockIds.includes(blockId)) return p.id;
  return findParent(ws, blockId);
}

export async function pushChanges(c: Changes): Promise<void> {
  const hasTable = Object.values(c.upserts).some(a => a.length) || Object.values(c.deletes).some(a => a.length);
  if (!hasTable) return;
  const { error } = await supabase.rpc('nt_sync', { p_upserts: c.upserts, p_deletes: c.deletes });
  if (error) throw error;
}
export async function saveTask(task: WorkItem, patch: Partial<WorkItem>): Promise<WorkItem> {
  return saveWork({ ...task, ...patch });
}
export async function createTask(fields: Partial<WorkItem>, base: WorkItem): Promise<WorkItem> {
  return saveWork({ ...base, ...fields, id: '', revision: 0 } as WorkItem);
}
