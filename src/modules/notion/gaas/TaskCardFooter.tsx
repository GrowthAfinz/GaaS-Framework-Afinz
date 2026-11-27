/**
 * Rodapé do card de Tarefa no Quadro (estilo Trello, mesmo card do kanban da Visão Daily):
 * checklist x/y, registros da Daily nos últimos 14 dias, e embaixo prazo e finalização (opcional).
 */
import { CalendarDays, CheckSquare } from 'lucide-react';
import type { WorkItem } from '../../../components/growth-learning/development/workModel';

export interface DailyPulse { recent: number; last: string }
const br = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const closed = (s: string) => s === 'concluida' || s === 'cancelada';

export function TaskCardFooter({ task, progress, daily, today }: {
  task: WorkItem | undefined; progress: { done: number; total: number; blocked: number }; daily: DailyPulse | undefined; today: string;
}) {
  if (!task) return null;
  const late = Boolean(task.due_date && !closed(task.status) && task.due_date < today);
  const finished = task.status === 'concluida' ? task.details?.completed_on : undefined;
  return (
    <div className="mt-2.5 space-y-2 text-[11.5px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {progress.total > 0 && <span title="Itens do checklist concluídos" className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${progress.done === progress.total ? 'bg-green-50 text-green-700' : 'bg-[var(--notion-hover)] text-[var(--notion-text-muted)]'}`}>
          <CheckSquare size={12} />{progress.done}/{progress.total}</span>}
        {progress.blocked > 0 && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{progress.blocked} bloqueada{progress.blocked > 1 ? 's' : ''}</span>}
        {daily && daily.recent > 0 && <span title={`Registros da Visão Daily ligados a este card nos últimos 14 dias; último em ${br(daily.last)}`} className="inline-flex items-center gap-1 rounded bg-cyan-50 px-1.5 py-0.5 font-semibold text-cyan-800">
          <CalendarDays size={12} />Daily {daily.recent}</span>}
        {daily && !daily.recent && !closed(task.status) && <span title="Último registro da Daily ligado ao card" className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">Daily parada desde {br(daily.last)}</span>}
        {task.owner_label
          ? <span title={`Responsável: ${task.owner_label}`} className="ml-auto inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-cyan-700 text-[10px] font-bold text-white">{task.owner_label.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
          : <span title="Sem responsável" className="ml-auto inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-[var(--notion-border)] text-[10px] text-[var(--notion-text-muted)]">?</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-[var(--notion-border)] pt-2 text-[var(--notion-text-muted)]">
        <span>Prazo<b className={`block text-xs font-semibold ${late ? 'text-red-700' : task.due_date ? 'text-[var(--notion-text)]' : ''}`}>{task.due_date ? br(task.due_date) : 'sem prazo'}</b></span>
        <span>Finalização<b className={`block text-xs font-semibold ${finished ? 'text-green-700' : ''}`}>{finished ? br(finished) : closed(task.status) ? 'cancelada' : 'ao concluir'}</b></span>
      </div>
    </div>
  );
}
