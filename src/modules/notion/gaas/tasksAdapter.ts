/**
 * Ponte entre a base "Tarefas" do módulo e growth_development_tasks: as tarefas continuam sendo a fonte
 * (Fila, briefing dos agentes e skills leem essa tabela); o módulo só mostra e edita.
 */
import { FIELDS, WORK_TYPES, workspaceLabel, type Initiative, type WorkItem, type Workspace } from '../../../components/growth-learning/development/workModel';
import { TASK_PRIORITY, TASK_STATUS } from '../../../components/growth-learning/development/developmentService';
import type { Block, DatabaseProperty, DatabaseRow, DatabaseViewConfig, NotionColor, NotionDatabase, NotionPage, NotionUser, SelectOption } from '../types/notion';

export const TASKS_DB = 'db_tarefas';
export const TASKS_PAGE = 'page_tarefas';
export const taskRowId = (taskId: string) => `task_${taskId}`;
export const taskIdOfRow = (rowId: string) => (rowId.startsWith('task_') ? rowId.slice(5) : null);

const STATUS_COLOR: Record<string, NotionColor> = { backlog: 'gray', planejando: 'purple', pronta: 'blue', em_execucao: 'yellow', bloqueada: 'red', concluida: 'green', cancelada: 'brown' };
const TYPE_COLOR: Record<string, NotionColor> = { task: 'blue', spec: 'purple', investigation: 'orange', experiment: 'pink' };
const TYPE_ICON: Record<string, string> = { task: '✅', spec: '📐', investigation: '🔎', experiment: '🧪' };
const FRONT_COLOR: Record<string, NotionColor> = { sdd: 'gray', acquisition: 'blue', monetization: 'purple', cross_sell: 'orange' };
const PRIORITY_COLOR: Record<string, NotionColor> = { P0: 'red', P1: 'orange', P2: 'yellow', P3: 'gray' };
const opt = (id: string, name: string, color: NotionColor): SelectOption => ({ id, name, color });

/** Propriedades de sistema: espelham colunas da tarefa. Opções sempre recalculadas a partir dos dados atuais. */
export function systemProperties(initiatives: Initiative[], fronts: Workspace[]): DatabaseProperty[] {
  return [
    { id: 'prop_title', name: 'Nome', type: 'title' },
    { id: 'p_tipo', name: 'Tipo', type: 'select', options: Object.entries(WORK_TYPES).map(([k, v]) => opt(k, v, TYPE_COLOR[k] || 'gray')) },
    { id: 'p_status', name: 'Status', type: 'status', options: Object.entries(TASK_STATUS).map(([k, v]) => opt(k, v, STATUS_COLOR[k] || 'gray')) },
    { id: 'p_frente', name: 'Frente', type: 'select', options: fronts.map(k => opt(k, workspaceLabel(k), FRONT_COLOR[k] || 'gray')) },
    { id: 'p_iniciativa', name: 'Iniciativa', type: 'select', options: initiatives.map(i => opt(i.id, i.title, 'default')) },
    { id: 'p_prioridade', name: 'Prioridade', type: 'select', options: Object.entries(TASK_PRIORITY).map(([k, v]) => opt(k, `${k} · ${v}`, PRIORITY_COLOR[k] || 'gray')) },
    { id: 'p_responsavel', name: 'Responsável', type: 'person' },
    { id: 'p_prazo', name: 'Prazo', type: 'date' },
    { id: 'p_proxima', name: 'Próxima ação', type: 'text' },
  ];
}
export const SYSTEM_PROP_IDS = new Set(['prop_title', 'p_tipo', 'p_status', 'p_frente', 'p_iniciativa', 'p_prioridade', 'p_responsavel', 'p_prazo', 'p_proxima']);

export function defaultTaskViews(): DatabaseViewConfig[] {
  const all = ['p_tipo', 'p_status', 'p_frente', 'p_iniciativa', 'p_prioridade', 'p_responsavel', 'p_prazo', 'p_proxima'];
  return [
    { id: 'v_quadro', name: 'Quadro por status', type: 'board', groupByPropertyId: 'p_status', visiblePropertyIds: ['p_tipo', 'p_frente', 'p_responsavel', 'p_prazo'], sorts: [], filters: [] },
    { id: 'v_tabela', name: 'Tabela', type: 'table', visiblePropertyIds: all, sorts: [], filters: [] },
    { id: 'v_frente', name: 'Por frente', type: 'board', groupByPropertyId: 'p_frente', visiblePropertyIds: ['p_tipo', 'p_status', 'p_responsavel'], sorts: [], filters: [] },
    { id: 'v_calendario', name: 'Calendário', type: 'calendar', visiblePropertyIds: ['p_status', 'p_responsavel'], sorts: [], filters: [] },
    { id: 'v_lista', name: 'Lista', type: 'list', visiblePropertyIds: ['p_tipo', 'p_status', 'p_frente'], sorts: [], filters: [] },
  ];
}

const label = (props: DatabaseProperty[], id: string, key: string | null | undefined) => props.find(p => p.id === id)?.options?.find(o => o.id === key)?.name ?? '';
const keyOf = (props: DatabaseProperty[], id: string, name: unknown) => props.find(p => p.id === id)?.options?.find(o => o.name === name)?.id ?? null;
const personId = (users: NotionUser[], name: string | null) => (name ? users.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase())?.id ?? '' : '');

export function taskToRow(t: WorkItem, props: DatabaseProperty[], users: NotionUser[], extra: Record<string, unknown> = {}): DatabaseRow {
  return {
    id: taskRowId(t.id), pageId: taskRowId(t.id),
    properties: {
      ...extra,
      prop_title: t.title,
      p_tipo: label(props, 'p_tipo', t.work_type), p_status: label(props, 'p_status', t.status), p_frente: label(props, 'p_frente', t.workspace),
      p_iniciativa: label(props, 'p_iniciativa', t.initiative_id), p_prioridade: label(props, 'p_prioridade', t.priority),
      p_responsavel: personId(users, t.owner_label), p_prazo: t.due_date || '', p_proxima: t.next_action || '',
    },
  };
}

/** Diferença de propriedades de sistema entre duas versões da linha, já no formato da tarefa. */
export function rowPatch(before: DatabaseRow, after: DatabaseRow, props: DatabaseProperty[], users: NotionUser[]): Partial<WorkItem> {
  const a = before.properties, b = after.properties, out: Partial<WorkItem> = {};
  const changed = (k: string) => JSON.stringify(a[k] ?? '') !== JSON.stringify(b[k] ?? '');
  if (changed('prop_title')) out.title = String(b.prop_title || '').trim();
  if (changed('p_tipo')) { const k = keyOf(props, 'p_tipo', b.p_tipo); if (k) out.work_type = k as WorkItem['work_type']; }
  if (changed('p_status')) { const k = keyOf(props, 'p_status', b.p_status); if (k) out.status = k as WorkItem['status']; }
  if (changed('p_frente')) { const k = keyOf(props, 'p_frente', b.p_frente); if (k) out.workspace = k as Workspace; }
  if (changed('p_iniciativa')) out.initiative_id = keyOf(props, 'p_iniciativa', b.p_iniciativa);
  if (changed('p_prioridade')) { const k = keyOf(props, 'p_prioridade', b.p_prioridade); if (k) out.priority = k as WorkItem['priority']; }
  if (changed('p_responsavel')) out.owner_label = users.find(u => u.id === b.p_responsavel)?.name ?? null;
  if (changed('p_prazo')) out.due_date = (b.p_prazo as string) || null;
  if (changed('p_proxima')) out.next_action = String(b.p_proxima || '');
  return out;
}
export const extraProps = (row: DatabaseRow) => Object.fromEntries(Object.entries(row.properties).filter(([k]) => !SYSTEM_PROP_IDS.has(k)));

/** Corpo inicial da página da tarefa, montado a partir dos campos que já existem. Ids estáveis por tarefa. */
export function taskBlocks(t: WorkItem): Block[] {
  const base = 'tb_' + t.id.replace(/-/g, '').slice(0, 16) + '_';
  const out: Block[] = [];
  const add = (b: Omit<Block, 'id'>) => out.push({ id: base + out.length, ...b });
  for (const para of (t.description || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean)) add({ type: 'paragraph', content: para });
  if (t.next_action?.trim()) add({ type: 'callout', icon: '👉', backgroundColor: 'blue', content: 'Próxima ação: ' + t.next_action.trim() });
  if (t.blocked_reason?.trim()) add({ type: 'callout', icon: '⛔', backgroundColor: 'red', content: 'Impedimento: ' + t.blocked_reason.trim() });
  for (const [k, title] of FIELDS[t.work_type] || []) {
    const v = (t.details?.[k] || '').trim();
    if (v) { add({ type: 'heading_3', content: title }); add({ type: 'paragraph', content: v }); }
  }
  const criteria = (t.acceptance_criteria || []).filter(c => c.trim());
  if (criteria.length) {
    add({ type: 'heading_3', content: 'Critérios de entrega' });
    criteria.forEach((c, i) => add({ type: 'to_do', content: c, checked: (t.completed_criteria || []).includes(i) }));
  }
  if (t.resolution?.trim()) { add({ type: 'heading_3', content: 'Entrega, resultado e limitações' }); add({ type: 'paragraph', content: t.resolution.trim() }); }
  if (t.source_note?.trim()) add({ type: 'paragraph', content: 'Nota de origem: ' + t.source_note.trim() });
  if (!out.length) add({ type: 'paragraph', content: '' });
  return out;
}

export function taskPage(t: WorkItem, blocks: Block[], stored?: NotionPage): NotionPage {
  const now = t.updated_at || t.created_at || new Date().toISOString();
  return {
    id: taskRowId(t.id), icon: TYPE_ICON[t.work_type] || '📄', parentId: TASKS_PAGE, createdAt: t.created_at || now, updatedAt: now,
    blockIds: blocks.map(b => b.id), ...(stored || {}), title: t.title,
  };
}

export function tasksDatabase(props: DatabaseProperty[], rows: DatabaseRow[], stored?: Partial<NotionDatabase>): NotionDatabase {
  const userProps = (stored?.properties || []).filter(p => !SYSTEM_PROP_IDS.has(p.id));
  const views = stored?.views?.length ? stored.views : defaultTaskViews();
  return {
    id: TASKS_DB, title: stored?.title || 'Tarefas', description: stored?.description ?? 'Tarefas, specs, investigações e experimentos das frentes. Cada linha é uma página.',
    properties: [...props, ...userProps], views, currentViewId: views.some(v => v.id === stored?.currentViewId) ? (stored!.currentViewId as string) : views[0].id, rows,
  };
}
