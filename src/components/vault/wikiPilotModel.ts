import type { WorkItem } from '../growth-learning/development/workModel';

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
