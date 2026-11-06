import type { WorkItem } from '../growth-learning/development/workModel';
import { safeWorkUrl } from '../growth-learning/development/workModel';

export const VISA_STRATEGY_PATH = '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md';
export const PILOT_GROUPS = { built: 'Já construído', prepare: 'Preparar a seedlist', validate: 'Validar o piloto', later: 'Após a seedlist' } as const;
export type PilotGroup = keyof typeof PILOT_GROUPS;
const groups: Record<string, PilotGroup> = {
  'VDV-BUILD-1': 'built', 'VDV-BUILD-2': 'built', 'VDV-BUILD-3': 'built',
  'VDV-PLAN-1': 'prepare', 'VDV-PLAN-2': 'prepare', 'VDV-PLAN-4': 'prepare', 'VDV-SEED-1': 'prepare', 'VDV-SEED-2': 'prepare',
  'VDV-PLAN-3': 'validate', 'VDV-SEED-3': 'validate', 'VDV-SEED-4': 'validate',
  'VDV-PLAN-5': 'later', 'VDV-PLAN-6': 'later',
};
export const PILOT_KEYS = Object.keys(groups);
export const pilotGroup = (key: string) => groups[key];
export const isPilotHeading = (path: string, heading: string) => path === VISA_STRATEGY_PATH && heading === '1-intencao-estrategica';
export const brazilToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function completionDate(task: { status: string; details?: Record<string, string> }) {
  const value = task.status === 'concluida' ? task.details?.completed_on : undefined;
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}
export const displayCompletionDate = (task: { status: string; details?: Record<string, string> }) => {
  const value = completionDate(task); return value ? value.split('-').reverse().join('/') : '—';
};
export function pilotProgress(tasks: WorkItem[]) {
  const preparation = PILOT_KEYS.filter(key => ['built', 'prepare'].includes(groups[key]));
  const validation = PILOT_KEYS.filter(key => groups[key] === 'validate');
  const done = (keys: string[]) => keys.filter(key => tasks.some(t => t.task_key === key && t.status === 'concluida')).length;
  const ready = done(preparation) === preparation.length;
  return { done: done(preparation), total: preparation.length, ready, validated: ready && done(validation) === validation.length, validationDone: done(validation), validationTotal: validation.length };
}
export const canQuickComplete = (task: WorkItem) => task.acceptance_criteria.length > 0 && task.acceptance_criteria.every((_, i) => task.completed_criteria.includes(i)) && Boolean(task.resolution?.trim());

/** Normalize editable metadata without changing the shared writer's acceptance rules. */
export function preparePilotSave(task: WorkItem, original?: WorkItem): WorkItem {
  const fail = (message: string): never => { const error = new Error(message); error.name = 'PilotValidationError'; throw error; };
  const criteria = task.acceptance_criteria.map(c => c.trim()).filter(Boolean);
  const criteriaChanged = Boolean(original && JSON.stringify(criteria) !== JSON.stringify(original.acceptance_criteria));
  if (task.title.trim().length < 5) fail('O título precisa ter pelo menos cinco caracteres.');
  if (criteriaChanged && task.status === 'concluida') fail('Reabra a atividade antes de alterar seus critérios de conclusão.');
  if (task.links.some(l => !l.label.trim() || !safeWorkUrl(l.url.trim()) || /[\u0000-\u001f]/.test(l.url.trim()))) fail('Revise as referências: informe título e endereço https, link interno ou caminho de nota válido.');
  const dependencies = [...new Set(task.dependencies.map(d => d.trim()).filter(Boolean))];
  if (dependencies.includes(task.task_key)) fail('Uma atividade não pode depender dela mesma.');
  const legacyUndated = original?.status === 'concluida' && !completionDate(original) && !task.details.completed_on;
  if (task.status === 'concluida' && !legacyUndated && (!completionDate(task) || completionDate(task)! > brazilToday())) fail('Informe uma data de conclusão válida, até hoje, no horário de Brasília.');
  return { ...task, title: task.title.trim(), acceptance_criteria: criteria, completed_criteria: criteriaChanged ? [] : task.completed_criteria, dependencies, links: task.links.map(l => ({ ...l, label: l.label.trim(), url: l.url.trim() })) };
}

export const pilotTaskGroup = (task: WorkItem): PilotGroup => pilotGroup(task.task_key) || (Object.prototype.hasOwnProperty.call(PILOT_GROUPS, task.details.wiki_pilot_group) ? task.details.wiki_pilot_group as PilotGroup : 'prepare');
export function activePilotProgress(tasks: WorkItem[]) {
 const preparation=tasks.filter(t=>['built','prepare'].includes(pilotTaskGroup(t)));
 const validation=tasks.filter(t=>pilotTaskGroup(t)==='validate');
 const done=preparation.filter(t=>t.status==='concluida').length, validationDone=validation.filter(t=>t.status==='concluida').length;
 const ready=preparation.length>0&&done===preparation.length;
 return {done,total:preparation.length,ready,validated:ready&&validation.length>0&&validationDone===validation.length,validationDone,validationTotal:validation.length};
}
