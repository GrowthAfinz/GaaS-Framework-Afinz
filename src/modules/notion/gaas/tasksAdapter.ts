/**
 * Ponte entre a base "Tarefas" do módulo e growth_development_tasks: as tarefas continuam sendo a fonte
 * (Fila, briefing dos agentes e skills leem essa tabela); o módulo só mostra e edita.
 */
import { FIELDS, WORK_TYPES, type Initiative, type WorkItem, type Workspace } from '../../../components/growth-learning/development/workModel';
import { TASK_PRIORITY, TASK_STATUS } from '../../../components/growth-learning/development/developmentService';
import type { Block, DatabaseProperty, DatabaseRow, DatabaseViewConfig, NotionColor, NotionDatabase, NotionPage, NotionUser, SelectOption } from '../types/notion';

export const TASKS_DB = 'db_tarefas';
export const TASKS_PAGE = 'page_tarefas';
export const taskRowId = (taskId: string) => `task_${taskId}`;
export const taskIdOfRow = (rowId: string) => (rowId.startsWith('task_') ? rowId.slice(5) : null);

const STATUS_COLOR: Record<string, NotionColor> = { backlog: 'gray', planejando: 'purple', pronta: 'blue', em_execucao: 'yellow', bloqueada: 'red', concluida: 'green', cancelada: 'brown' };
const TYPE_COLOR: Record<string, NotionColor> = { task: 'blue', spec: 'purple', investigation: 'orange', experiment: 'pink' };
const TYPE_ICON: Record<string, string> = { task: '✅', spec: '📐', investigation: '🔎', experiment: '🧪' };
const PRIORITY_COLOR: Record<string, NotionColor> = { P0: 'red', P1: 'orange', P2: 'yellow', P3: 'gray' };
const opt = (id: string, name: string, color: NotionColor): SelectOption => ({ id, name, color });

/** Frentes de negócio vêm da Visão Daily (daily_frentes); o desenvolvimento do GaaS é uma opção à parte. */
export interface BusinessFront { key: string; name: string; color: string; archived?: boolean }
export interface DailyProjectRef { id: string; name: string; frente_key: string; initiative_id: string | null; archived?: boolean }
export const GAAS_FRONT = 'gaas';
export const GAAS_FRONT_NAME = 'GaaS (SDD)';
/** Equivalência com a coluna antiga das tarefas (workspace), usada para preencher e manter as duas em sincronia. */
const FRONT_FROM_WORKSPACE: Record<string, string> = { acquisition: 'aq', monetization: 're', cross_sell: 'se', sdd: GAAS_FRONT };
const WORKSPACE_FROM_FRONT: Record<string, Workspace> = { aq: 'acquisition', re: 'monetization', se: 'cross_sell', [GAAS_FRONT]: 'sdd' };
/** Coluna antiga (workspace) para uma frente; frentes sem equivalente ficam em Aquisição. */
export const workspaceOfFront = (key: string | null): Workspace => (key && WORKSPACE_FROM_FRONT[key]) || 'acquisition';
/** Cor da frente (hex na Visão Daily) aproximada para a paleta do módulo. */
export function notionColor(hex: string): NotionColor {
  const h = hex.toLowerCase();
  const table: [NotionColor, number[]][] = [['blue', [2, 132, 199]], ['green', [13, 148, 136]], ['purple', [124, 58, 237]], ['orange', [234, 88, 12]], ['gray', [100, 116, 139]], ['red', [220, 38, 38]], ['yellow', [202, 138, 4]], ['pink', [219, 39, 119]], ['brown', [146, 64, 14]]];
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(h);
  if (!m) return 'gray';
  const rgb = [1, 2, 3].map(i => parseInt(m[i], 16));
  return table.reduce((best, cur) => (dist(cur[1], rgb) < dist(best[1], rgb) ? cur : best))[0];
}
const dist = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Propriedades da base Tarefas. As de sistema espelham colunas da tarefa; Frente e Projeto ficam no módulo. */
export function systemProperties(initiatives: Initiative[], fronts: BusinessFront[], projects: DailyProjectRef[]): DatabaseProperty[] {
  const frontColor = new Map(fronts.map(f => [f.key, notionColor(f.color)]));
  return [
    { id: 'prop_title', name: 'Nome', type: 'title' },
    { id: 'p_frente', name: 'Frente', type: 'select', options: [...fronts.filter(f => !f.archived).map(f => opt(f.key, f.name, frontColor.get(f.key) || 'gray')), opt(GAAS_FRONT, GAAS_FRONT_NAME, 'brown')] },
    { id: 'p_projeto', name: 'Projeto', type: 'select', options: projects.filter(p => !p.archived).map(p => opt(p.id, p.name, frontColor.get(p.frente_key) || 'gray')) },
    { id: 'p_status', name: 'Status', type: 'status', options: Object.entries(TASK_STATUS).map(([k, v]) => opt(k, v, STATUS_COLOR[k] || 'gray')) },
    { id: 'p_tipo', name: 'Tipo', type: 'select', options: Object.entries(WORK_TYPES).map(([k, v]) => opt(k, v, TYPE_COLOR[k] || 'gray')) },
    { id: 'p_responsavel', name: 'Responsável', type: 'person' },
    { id: 'p_prazo', name: 'Prazo', type: 'date' },
    { id: 'p_prioridade', name: 'Prioridade', type: 'select', options: Object.entries(TASK_PRIORITY).map(([k, v]) => opt(k, `${k} · ${v}`, PRIORITY_COLOR[k] || 'gray')) },
    { id: 'p_iniciativa', name: 'Iniciativa', type: 'select', options: initiatives.map(i => opt(i.id, i.title, 'default')) },
    { id: 'p_proxima', name: 'Próxima ação', type: 'text' },
  ];
}
/** Propriedades que espelham colunas da tarefa (não são guardadas nas linhas do módulo). */
export const SYSTEM_PROP_IDS = new Set(['prop_title', 'p_tipo', 'p_status', 'p_iniciativa', 'p_prioridade', 'p_responsavel', 'p_prazo', 'p_proxima']);
/** Propriedades do módulo com regra própria (ficam nas linhas, mas são recalculadas e não podem ser removidas). */
export const MODULE_PROP_IDS = new Set(['p_frente', 'p_projeto']);
/** Propriedades cujas opções vêm de outra tela (criar opção grava lá). */
export const SYNCED_PROPS = new Set(['p_frente', 'p_projeto', 'p_iniciativa']);

export function defaultTaskViews(): DatabaseViewConfig[] {
  const all = ['p_frente', 'p_projeto', 'p_status', 'p_tipo', 'p_responsavel', 'p_prazo', 'p_prioridade', 'p_iniciativa', 'p_proxima'];
  return [
    { id: 'v_quadro', name: 'Quadro por status', type: 'board', groupByPropertyId: 'p_status', visiblePropertyIds: ['p_frente', 'p_projeto', 'p_responsavel', 'p_prazo'], sorts: [], filters: [] },
    { id: 'v_frente', name: 'Por frente', type: 'board', groupByPropertyId: 'p_frente', visiblePropertyIds: ['p_projeto', 'p_status', 'p_responsavel'], sorts: [], filters: [] },
    { id: 'v_projeto', name: 'Por projeto', type: 'board', groupByPropertyId: 'p_projeto', hideEmptyGroups: true, visiblePropertyIds: ['p_frente', 'p_status', 'p_responsavel'], sorts: [], filters: [] },
    { id: 'v_calendario', name: 'Calendário', type: 'calendar', datePropertyId: 'p_prazo', visiblePropertyIds: ['p_frente', 'p_status'], sorts: [], filters: [] },
    { id: 'v_tabela', name: 'Tabela', type: 'table', visiblePropertyIds: all, sorts: [], filters: [] },
    { id: 'v_sdd', name: 'SDD (GaaS)', type: 'board', groupByPropertyId: 'p_status', visiblePropertyIds: ['p_tipo', 'p_iniciativa', 'p_responsavel'], sorts: [], filters: [{ propertyId: 'p_frente', operator: 'equals', value: GAAS_FRONT_NAME }] },
  ];
}

const label = (props: DatabaseProperty[], id: string, key: string | null | undefined) => props.find(p => p.id === id)?.options?.find(o => o.id === key)?.name ?? '';
const keyOf = (props: DatabaseProperty[], id: string, name: unknown) => props.find(p => p.id === id)?.options?.find(o => o.name === name)?.id ?? null;
const personId = (users: NotionUser[], name: string | null) => (name ? users.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase())?.id ?? '' : '');

/**
 * Linha da tarefa. Frente e Projeto: o que estiver guardado no módulo vale; sem isso, o projeto vem da iniciativa
 * (projeto da Visão Daily ligado à mesma iniciativa) e a frente vem do projeto ou da coluna antiga.
 */
export function taskToRow(t: WorkItem, props: DatabaseProperty[], users: NotionUser[], extra: Record<string, unknown> = {}, projects: DailyProjectRef[] = []): DatabaseRow {
  const storedProject = typeof extra.p_projeto === 'string' && extra.p_projeto ? extra.p_projeto : '';
  const inferred = !storedProject && t.initiative_id ? projects.find(p => p.initiative_id === t.initiative_id && !p.archived) : undefined;
  const projectName = storedProject || (inferred ? label(props, 'p_projeto', inferred.id) : '');
  const project = projects.find(p => label(props, 'p_projeto', p.id) === projectName);
  const storedFront = typeof extra.p_frente === 'string' && extra.p_frente ? extra.p_frente : '';
  const frontKey = project?.frente_key || FRONT_FROM_WORKSPACE[t.workspace] || '';
  return {
    id: taskRowId(t.id), pageId: taskRowId(t.id),
    properties: {
      ...extra,
      prop_title: t.title,
      p_frente: storedFront || label(props, 'p_frente', frontKey), p_projeto: projectName,
      p_tipo: label(props, 'p_tipo', t.work_type), p_status: label(props, 'p_status', t.status),
      p_iniciativa: label(props, 'p_iniciativa', t.initiative_id), p_prioridade: label(props, 'p_prioridade', t.priority),
      p_responsavel: personId(users, t.owner_label), p_prazo: t.due_date || '', p_proxima: t.next_action || '',
    },
  };
}

/** Diferença entre duas versões da linha, já no formato da tarefa (inclui a frente quando há coluna equivalente). */
export function rowPatch(before: DatabaseRow, after: DatabaseRow, props: DatabaseProperty[], users: NotionUser[]): Partial<WorkItem> {
  const a = before.properties, b = after.properties, out: Partial<WorkItem> = {};
  const changed = (k: string) => JSON.stringify(a[k] ?? '') !== JSON.stringify(b[k] ?? '');
  if (changed('prop_title')) out.title = String(b.prop_title || '').trim();
  if (changed('p_tipo')) { const k = keyOf(props, 'p_tipo', b.p_tipo); if (k) out.work_type = k as WorkItem['work_type']; }
  if (changed('p_status')) { const k = keyOf(props, 'p_status', b.p_status); if (k) out.status = k as WorkItem['status']; }
  if (changed('p_frente')) { const k = keyOf(props, 'p_frente', b.p_frente); if (k && WORKSPACE_FROM_FRONT[k]) out.workspace = WORKSPACE_FROM_FRONT[k]; }
  if (changed('p_iniciativa')) out.initiative_id = keyOf(props, 'p_iniciativa', b.p_iniciativa);
  if (changed('p_prioridade')) { const k = keyOf(props, 'p_prioridade', b.p_prioridade); if (k) out.priority = k as WorkItem['priority']; }
  if (changed('p_responsavel')) out.owner_label = users.find(u => u.id === b.p_responsavel)?.name ?? null;
  if (changed('p_prazo')) out.due_date = (b.p_prazo as string) || null;
  if (changed('p_proxima')) out.next_action = String(b.p_proxima || '');
  return out;
}
/** Ao trocar o projeto, a frente acompanha a do projeto (feito no módulo, antes de salvar). */
export function frontOfProject(props: DatabaseProperty[], projects: DailyProjectRef[], projectName: unknown): string | null {
  const p = projects.find(x => label(props, 'p_projeto', x.id) === projectName);
  return p ? label(props, 'p_frente', p.frente_key) || null : null;
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
  const userProps = (stored?.properties || []).filter(p => !SYSTEM_PROP_IDS.has(p.id) && !MODULE_PROP_IDS.has(p.id));
  const views = stored?.views?.length ? stored.views : defaultTaskViews();
  return {
    id: TASKS_DB, title: stored?.title || 'Tarefas', description: stored?.description ?? 'O que o time leva na daily, por frente de negócio e projeto. Cada linha é uma página.',
    properties: [...props, ...userProps], views, currentViewId: views.some(v => v.id === stored?.currentViewId) ? (stored!.currentViewId as string) : views[0].id, rows,
  };
}
