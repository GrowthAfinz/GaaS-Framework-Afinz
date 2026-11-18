/**
 * Faixa no topo das páginas de Tarefas: o que está com você dentro dos cards (Minhas Sub Tarefas) e os
 * registros recentes da Visão Daily que ainda não estão vinculados a nenhuma Tarefa (triagem).
 * Sub Tarefa não vira card; esta faixa é o jeito de achar o trabalho que está dentro dos cards.
 */
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { ChevronDown, ChevronRight, ListChecks, Inbox } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import type { WorkItem } from '../../../components/growth-learning/development/workModel';

interface Props {
  tasks: WorkItem[];
  myName: string | null;
  /** Frentes da página (vazio = todas as frentes de negócio). */
  fronts: string[];
  onOpenTask: (id: string) => void;
}
interface LooseEntry { id: string; day: string; body: string; project_id: string }

const closed = (s: string) => s === 'concluida' || s === 'cancelada';
const br = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export function WorkStrip({ tasks, myName, fronts, onOpenTask }: Props) {
  const [open, setOpen] = useState<'mine' | 'loose' | null>(null);
  const [loose, setLoose] = useState<LooseEntry[] | null>(null);
  const [projects, setProjects] = useState<Map<string, { name: string; frente_key: string }>>(new Map());
  const byId = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const inScope = (t: WorkItem) => !fronts.length || fronts.includes(String(t.front_key || ''));
  const mine = useMemo(() => {
    if (!myName) return [];
    const me = myName.trim().toLowerCase();
    return tasks.filter(t => t.parent_task_id && !closed(t.status) && (t.owner_label || '').trim().toLowerCase() === me && inScope(t))
      .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.title.localeCompare(b.title));
  }, [tasks, myName, fronts]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open !== 'loose' || loose) return;
    const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    void Promise.all([
      supabase.from('daily_entries').select('id,day,body,project_id').is('deleted_at', null).eq('work_ids', '{}').gte('day', start).lte('day', today()).order('day', { ascending: false }).limit(200),
      supabase.from('daily_projects').select('id,name,frente_key'),
    ]).then(([e, p]) => {
      const map = new Map(((p.data || []) as { id: string; name: string; frente_key: string }[]).map(x => [x.id, { name: x.name, frente_key: x.frente_key }]));
      setProjects(map);
      setLoose(((e.data || []) as LooseEntry[]).filter(x => !fronts.length || fronts.includes(map.get(x.project_id)?.frente_key || '')));
    });
  }, [open, loose, fronts]);

  const late = (d?: string | null) => Boolean(d && d < today());
  const tab = (key: 'mine' | 'loose', icon: React.ReactNode, label: string, n: number | null) => (
    <button type="button" aria-expanded={open === key} onClick={() => setOpen(o => (o === key ? null : key))}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${open === key ? 'bg-[var(--notion-hover)] text-[var(--notion-text)]' : 'text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]'}`}>
      {open === key ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{icon}{label}{n != null && <span className="rounded-full bg-[var(--notion-hover)] px-1.5 text-[11px]">{n}</span>}
    </button>
  );
  return (
    <div className="mb-2 rounded-lg border border-[var(--notion-border)] px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {tab('mine', <ListChecks size={13} />, 'Minhas Sub Tarefas', myName ? mine.length : null)}
        {tab('loose', <Inbox size={13} />, 'Registros da Daily sem Tarefa (30 dias)', loose ? loose.length : null)}
      </div>
      {open === 'mine' && (
        <ul className="mt-1 max-h-64 overflow-y-auto text-sm">
          {!myName && <li className="px-2 py-1.5 text-xs text-[var(--notion-text-muted)]">Seu nome não está na lista de pessoas.</li>}
          {myName && !mine.length && <li className="px-2 py-1.5 text-xs text-[var(--notion-text-muted)]">Nenhuma Sub Tarefa aberta com você nesta página.</li>}
          {mine.map(s => (
            <li key={s.id}>
              <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-[var(--notion-hover)]" onClick={() => onOpenTask(s.id)}>
                <span className={`w-12 shrink-0 text-xs ${late(s.due_date) ? 'font-semibold text-red-600' : 'text-[var(--notion-text-muted)]'}`}>{s.due_date ? br(s.due_date) : 'sem prazo'}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="max-w-[45%] shrink-0 truncate text-xs text-[var(--notion-text-muted)]">{byId.get(s.parent_task_id || '')?.title}</span>
                {s.status === 'bloqueada' && <span className="shrink-0 rounded bg-red-500/10 px-1.5 text-xs text-red-600">bloqueada</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open === 'loose' && (
        <div className="mt-1">
          <p className="px-2 text-xs text-[var(--notion-text-muted)]">Rotina pode ficar só na Daily. Se o registro for parte de uma entrega, vincule na Visão Daily ("Vincular a Tarefa…").</p>
          <ul className="mt-1 max-h-64 overflow-y-auto text-sm">
            {!loose && <li className="px-2 py-1.5 text-xs text-[var(--notion-text-muted)]">Carregando…</li>}
            {loose && !loose.length && <li className="px-2 py-1.5 text-xs text-[var(--notion-text-muted)]">Nada para triar.</li>}
            {(loose || []).map(e => (
              <li key={e.id} className="flex items-baseline gap-2 px-2 py-1">
                <a className="w-12 shrink-0 text-xs text-blue-600 hover:underline" href={`?view=operacao&section=daily&day=${e.day}`}>{br(e.day)}</a>
                <span className="w-40 shrink-0 truncate text-xs text-[var(--notion-text-muted)]">{projects.get(e.project_id)?.name}</span>
                <span className="min-w-0 flex-1 truncate">{e.body}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
