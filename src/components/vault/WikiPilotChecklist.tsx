import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, CheckCheck, ChevronDown, ChevronRight, ExternalLink, Loader2, Pencil, RefreshCw, Plus, MoreHorizontal, Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { saveWork } from '../growth-learning/development/workService';
import { TASK_STATUS, taskError, type taskHistory } from '../growth-learning/development/developmentService';
import { newWork, type WorkItem } from '../growth-learning/development/workModel';
import { loadInsuranceTasks, INSURANCE_STRATEGY_PATH, loadPilotTasks } from './wikiPilotService';
import { brazilToday, displayCompletionDate, PILOT_GROUPS, PILOT_KEYS, pilotTaskGroup, activePilotProgress, preparePilotSave, insuranceTaskOrder } from './wikiPilotModel';
import type { TaskLayout } from './strategy/strategyModel';
import './wikiPilot.css';

const iconButton = 'inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:opacity-40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11';
const menuItem = 'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45';
const inlineInput = 'min-w-0 flex-1 rounded-md border border-cyan-600 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-cyan-600/15';
const MESSAGE_MS = 3500;
/** Statuses worth calling out on the row; the default planning states stay quiet. */
const NOTABLE: Partial<Record<WorkItem['status'], string>> = { pronta: 'text-cyan-700', em_execucao: 'text-cyan-700', bloqueada: 'text-amber-700', cancelada: 'text-slate-400' };
const DEFAULT_CRITERION = 'Atividade concluída';

function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  return <div ref={ref} className="relative">
    <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} className={`${iconButton} ${open ? 'bg-slate-100 text-slate-700' : ''}`} onClick={() => setOpen(o => !o)}><MoreHorizontal size={16}/></button>
    {open && <div role="menu" className="pilot-pop absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-lg">{children(() => setOpen(false))}</div>}
  </div>;
}

/**
 * Note-bound work plans use the same records, revision checks and history as Testes e Tarefas.
 * The list is deliberately flat: one click completes an activity, filling what the shared writer
 * requires (every criterion ticked, a delivery note, today's date). Full detail lives in Testes e Tarefas.
 */
export function WikiPilotChecklist({ loader = loadPilotTasks, writer = saveWork, layout, onLayoutChange, onDirtyChange, documentBusy = false, initiallyOpen = false, insurance = false }: { insurance?: boolean; layout?: TaskLayout; onLayoutChange?: (layout: TaskLayout) => Promise<void>; onDirtyChange?: (dirty: boolean) => void; documentBusy?: boolean; initiallyOpen?: boolean; loader?: typeof loadPilotTasks; writer?: typeof saveWork; historyLoader?: typeof taskHistory }) {
  const taskLoader = insurance && loader === loadPilotTasks ? loadInsuranceTasks : loader;
  const groupLabels: Record<string, string> = insurance ? { built: 'Já realizado · diagnóstico e desenho', prepare: 'Preparação comum', mulher_mensal: 'Mulher · Mensal', mulher_trigger: 'Mulher · Trigger', residencial_mensal: 'Residencial · Mensal', residencial_trigger: 'Residencial · Trigger', celular_mensal: 'Celular · Mensal', celular_trigger: 'Celular · Trigger', later: 'Evoluções posteriores' } : PILOT_GROUPS;
  const taskGroup = (task: WorkItem): string => insurance ? task.details.insurance_group || 'prepare' : pilotTaskGroup(task);
  const activityTitle = insurance ? 'Atividades: Construção e ativação de Seguros' : 'Atividades: Construção do Piloto';
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPilotTasks>> | null>(null);
  const [opened, setOpened] = useState(initiallyOpen), [pending, setPending] = useState(false);
  const [groups, setGroups] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [adding, setAdding] = useState<{ group: string; title: string } | null>(null);
  // Rows completed while "Só pendentes" is on stay until the filter changes, so the list does not jump under the cursor.
  const [justDone, setJustDone] = useState<Set<string>>(() => new Set());
  const generation = useRef(0), inlineLock = useRef(false);
  const busy = savingId !== null;
  const typing = Boolean(renaming || adding?.title.trim());

  const load = async () => {
    const g = ++generation.current;
    try { const next = await taskLoader(); if (g === generation.current) { setData(next); setError(''); } }
    catch { if (g === generation.current) setError('Não foi possível consultar as atividades. Tente atualizar.'); }
  };
  useEffect(() => { void load(); return () => { generation.current++; }; }, [taskLoader]);
  useEffect(() => { const focus = () => { if (!busy && !typing) void load(); }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, [taskLoader, busy, typing]);
  useEffect(() => { onDirtyChange?.(busy || typing); return () => onDirtyChange?.(false); }, [busy, typing, onDirtyChange]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''), MESSAGE_MS); return () => window.clearTimeout(timer); }, [message]);

  const visibleTasks = (data?.tasks || []).filter(t => !layout?.hidden.includes(t.task_key));
  const progress = activePilotProgress(visibleTasks);
  const doneCount = visibleTasks.filter(t => t.status === 'concluida').length;
  const taskOrder = (task: WorkItem) => { const custom = layout?.order.indexOf(task.task_key) ?? -1; return custom >= 0 ? custom : insurance ? 1000 + insuranceTaskOrder(task) : PILOT_KEYS.includes(task.task_key) ? 1000 + PILOT_KEYS.indexOf(task.task_key) : 2000; };
  const tasksOf = (group: string) => visibleTasks.filter(t => taskGroup(t) === group).sort((a, b) => taskOrder(a) - taskOrder(b));
  // By default only the current step is open: the first group that still has work to do.
  const currentGroup = Object.keys(groupLabels).find(g => g !== 'later' && tasksOf(g).some(t => t.status !== 'concluida'));
  const groupOpen = (group: string) => groups[group] ?? group === currentGroup;

  /** Writes through the shared writer; optimistic updates are rolled back if it refuses. */
  const persist = async (next: WorkItem, optimistic = false, original = data?.tasks.find(t => t.id === next.id)): Promise<WorkItem | null> => {
    let prepared: WorkItem;
    try { prepared = preparePilotSave(next, original); }
    catch (e) { setError(e instanceof Error ? e.message : taskError(e)); return null; }
    setSavingId(next.id || 'new'); setError('');
    if (optimistic && original) setData(cur => cur && { ...cur, tasks: cur.tasks.map(t => t.id === original.id ? prepared : t) });
    try {
      const saved = await writer(prepared);
      setData(cur => cur && { ...cur, tasks: cur.tasks.some(t => t.id === saved.id) ? cur.tasks.map(t => t.id === saved.id ? saved : t) : [...cur.tasks, saved] });
      return saved;
    } catch (e) {
      if (optimistic && original) setData(cur => cur && { ...cur, tasks: cur.tasks.map(t => t.id === original.id ? original : t) });
      setError(e instanceof Error && e.name === 'PilotValidationError' ? e.message : taskError(e));
      return null;
    } finally { setSavingId(null); }
  };

  const complete = async (task: WorkItem) => {
    let base = task;
    // The writer refuses completion without criteria; an activity without any gets a generic one first.
    if (!base.acceptance_criteria.some(c => c.trim())) {
      const saved = await persist({ ...base, acceptance_criteria: [DEFAULT_CRITERION], completed_criteria: [] }, false, base);
      if (!saved) return;
      base = saved;
    }
    const today = brazilToday();
    const saved = await persist({
      ...base, status: 'concluida',
      completed_criteria: base.acceptance_criteria.map((_, i) => i),
      resolution: base.resolution?.trim() ? base.resolution : `Concluída na Wiki em ${today.split('-').reverse().join('/')}.`,
      details: { ...base.details, completed_on: today },
    }, true, base);
    if (saved) setMessage('Atividade concluída.');
  };
  const toggle = (task: WorkItem) => {
    if (documentBusy || busy || renaming) return;
    if (task.status === 'concluida') {
      // Reopening keeps the ticked criteria and the delivery note, so a second click completes it again.
      void persist({ ...task, status: 'planejando' }, true).then(saved => { if (saved) setMessage('Atividade reaberta.'); });
      return;
    }
    if (pending) setJustDone(s => new Set(s).add(task.id));
    void complete(task);
  };

  const rename = async () => {
    if (!renaming || busy || inlineLock.current) return;
    const task = data?.tasks.find(t => t.id === renaming.id);
    const title = renaming.title.trim();
    if (!task || title === task.title) { setRenaming(null); return; }
    inlineLock.current = true;
    try { if (await persist({ ...task, title }, true)) { setRenaming(null); setMessage('Título atualizado.'); } } finally { inlineLock.current = false; }
  };
  const add = async () => {
    if (!adding || busy || inlineLock.current) return;
    const title = adding.title.trim();
    if (!title) { setAdding(null); return; }
    const next: WorkItem = { ...newWork('monetization'), id: '', revision: 0, task_key: (insurance ? 'SEG-PILOT-' : 'VDV-PILOT-') + crypto.randomUUID().slice(0, 12), title, status: 'planejando', details: { wiki_pilot_note: insurance ? INSURANCE_STRATEGY_PATH : '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md', wiki_pilot_group: adding.group, ...(insurance ? { insurance_group: adding.group } : {}) } };
    if (insurance) { next.initiative_id = '03d2907e-2bb1-4c45-9b26-f3caf11480b4'; next.source_note = INSURANCE_STRATEGY_PATH; }
    inlineLock.current = true;
    try { if (await persist(next)) { setAdding({ group: adding.group, title: '' }); setMessage('Atividade adicionada.'); } } finally { inlineLock.current = false; }
  };
  const duplicate = async (task: WorkItem) => {
    const copy: WorkItem = { ...structuredClone(task), id: '', revision: 0, task_key: (insurance ? 'SEG-PILOT-' : 'VDV-PILOT-') + crypto.randomUUID().slice(0, 12), title: task.title + ' (cópia)', status: 'planejando', completed_criteria: [], resolution: null };
    delete copy.details.completed_on;
    if (await persist(copy)) setMessage('Atividade duplicada.');
  };
  const updateLayout = async (next: TaskLayout) => {
    if (!onLayoutChange || busy || documentBusy) return;
    try { await onLayoutChange(next); setError(''); } catch { setError('Não foi possível atualizar a organização. Tente novamente.'); }
  };
  const moveTask = (task: WorkItem, delta: number) => {
    const order = tasksOf(taskGroup(task)).map(t => t.task_key);
    const i = order.indexOf(task.task_key), j = i + delta; if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    void updateLayout({ hidden: layout?.hidden || [], order: [...order, ...(layout?.order || []).filter(k => !order.includes(k))] });
  };

  const label = insurance ? `${doneCount}/${visibleTasks.length} atividades concluídas · liberação por frente` : data?.canEdit ? progress.validated ? 'Validado na seedlist' : progress.ready ? 'Pronto para testar na seedlist' : `Preparação ${progress.done}/${progress.total}` : data ? 'Acesso administrativo' : 'Consultar atividades';
  const subtitle = insurance ? 'Diagnóstico, preparação e seis frentes · conclusão documental não libera disparo' : `Preparação ${progress.done}/${progress.total} · validação na seedlist ${progress.validationDone}/${progress.validationTotal}`;
  const percent = visibleTasks.length ? Math.round(doneCount / visibleTasks.length * 100) : 0;
  const locked = busy || documentBusy;

  const row = (task: WorkItem) => {
    const done = task.status === 'concluida', saving = savingId === task.id;
    const notable = NOTABLE[task.status];
    const meta = [
      task.owner_label && <span key="owner">{task.owner_label}</span>,
      notable && <span key="status" className={notable}>{TASK_STATUS[task.status]}</span>,
      done && <span key="done">Concluída em {displayCompletionDate(task)}</span>,
    ].filter(Boolean);
    if (renaming?.id === task.id) return <li key={task.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 sm:px-4">
      <span className="ml-0.5 h-[1.125rem] w-[1.125rem] shrink-0"/>
      <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={e => { e.preventDefault(); void rename(); }}>
        <input autoFocus aria-label="Título da atividade" className={inlineInput} value={renaming.title} readOnly={busy} onChange={e => setRenaming({ id: task.id, title: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setRenaming(null); }} onBlur={() => { if (!busy) void rename(); }}/>
      </form>
    </li>;
    return <li key={task.id} className="group/row flex items-center gap-1 px-1.5 transition-colors hover:bg-slate-50/80 sm:px-2.5">
      <button type="button" role="checkbox" aria-checked={done} aria-label={`${done ? 'Reabrir' : 'Concluir'} ${task.title}`} disabled={locked} onClick={() => toggle(task)} className="group/check flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-md py-2 pl-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:cursor-wait">
        <span className={`pilot-check-box flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 group-active/check:scale-90 ${done ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-transparent group-hover/check:border-teal-500 group-hover/check:text-teal-500/70'}`}>
          {saving ? <Loader2 size={11} className={`animate-spin ${done ? 'text-white' : 'text-teal-600'}`}/> : <Check size={11} strokeWidth={3.5} className={done ? 'pilot-check-mark' : ''}/>}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-medium leading-5 transition-colors duration-200 ${done ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>{task.title}</span>
          {meta.length > 0 && <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">{meta.map((m, i) => <span key={i} className="inline-flex items-center gap-x-1.5">{i > 0 && <span aria-hidden>·</span>}{m}</span>)}</span>}
        </span>
      </button>
      <RowMenu label={`Mais ações de ${task.title}`}>{close => <>
        <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); setAdding(null); setRenaming({ id: task.id, title: task.title }); }}><Pencil size={13}/>Renomear</button>
        {onLayoutChange && <>
          <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); void duplicate(task); }}><Copy size={13}/>Duplicar</button>
          <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); moveTask(task, -1); }}><ArrowUp size={13}/>Mover para cima</button>
          <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); moveTask(task, 1); }}><ArrowDown size={13}/>Mover para baixo</button>
        </>}
        <a role="menuitem" className={menuItem} href={`?view=operacao&section=investigations&dev_task=${task.id}`}><ExternalLink size={13}/>Abrir em Testes e Tarefas</a>
        {onLayoutChange && <>
          <div className="my-1 border-t border-slate-100"/>
          <button type="button" role="menuitem" className={`${menuItem} text-rose-700 hover:bg-rose-50`} disabled={locked} onClick={() => { close(); void updateLayout({ order: layout?.order || [], hidden: [...(layout?.hidden || []), task.task_key] }); }}><Trash2 size={13}/>Excluir da nota</button>
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] leading-4 text-slate-400">Recuperável no histórico da nota.</p>
        </>}
      </>}</RowMenu>
    </li>;
  };

  return <section className="pilot-checklist my-5 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700" aria-label={activityTitle}>
    <div className="pilot-checklist-head flex flex-wrap items-center justify-between gap-x-3 border-b border-slate-100 bg-slate-50/70 px-3 py-1 sm:px-4">
      <button type="button" aria-expanded={opened} aria-controls="wiki-pilot-activities" onClick={() => setOpened(!opened)} className="flex min-h-11 min-w-0 items-center gap-2 text-left text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">{opened ? <ChevronDown size={15} className="shrink-0"/> : <ChevronRight size={15} className="shrink-0"/>}<CheckCheck size={15} className="shrink-0 text-cyan-700"/><span>{activityTitle}</span></button>
      <span className="py-1 text-xs tabular-nums text-cyan-800">{label}</span>
    </div>
    <div id="wiki-pilot-activities" hidden={!opened}>
      <div className="pilot-checklist-toolbar flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
        <div className="min-w-[12rem] flex-1">
          <div className="flex items-baseline justify-between gap-3 text-xs"><span className="text-slate-500">{subtitle}</span>{data?.canEdit && <span className="shrink-0 font-medium tabular-nums text-slate-700">{doneCount} de {visibleTasks.length}</span>}</div>
          {data?.canEdit && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Atividades concluídas" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="pilot-progress h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }}/></div>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-pressed={pending} disabled={busy} onClick={() => { setPending(p => !p); setJustDone(new Set()); }} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-45 ${pending ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>{pending && <Check size={12} strokeWidth={3}/>}Só pendentes</button>
          <button type="button" className={iconButton} disabled={busy || typing} onClick={() => void load()} aria-label="Atualizar atividades" title="Atualizar"><RefreshCw size={14}/></button>
        </div>
      </div>
      {!data && !error && <p role="status" className="px-4 py-3 text-xs text-slate-500">Consultando atividades…</p>}
      {data && !data.canEdit && <p className="px-4 py-3 text-xs text-slate-500">As atividades seguem as permissões administrativas de Testes e Tarefas.</p>}
      {data?.canEdit && <>
        {!insurance && data.tasks.length < PILOT_KEYS.length && <p className="px-4 py-2 text-xs text-amber-800">Há atividades do piloto ainda não cadastradas. O marco de prontidão permanece pendente.</p>}
        {Object.entries(groupLabels).map(([group, name]) => {
          const all = tasksOf(group);
          const tasks = all.filter(t => !pending || t.status !== 'concluida' || justDone.has(t.id));
          const addingHere = adding?.group === group;
          if (!tasks.length && !addingHere) return null;
          const isOpen = groupOpen(group) || addingHere || tasks.some(t => t.id === renaming?.id);
          const groupDone = all.filter(t => t.status === 'concluida').length;
          return <div key={group} className="border-t border-slate-100">
            <button type="button" aria-expanded={isOpen} aria-controls={`wiki-pilot-${group}`} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-700 sm:px-4" onClick={() => setGroups(g => ({ ...g, [group]: !isOpen }))}>
              <ChevronRight size={14} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}/>
              <span className="flex-1">{name}</span>
              <span className={`font-normal tabular-nums ${all.length && groupDone === all.length ? 'text-teal-700' : 'text-slate-400'}`}>{all.length > 0 && groupDone === all.length && <Check size={12} strokeWidth={3} className="mr-1 inline align-[-1px]"/>}{groupDone}/{all.length}</span>
            </button>
            {isOpen && <div id={`wiki-pilot-${group}`} className="pilot-panel pb-1">
              <ul>{tasks.map(row)}</ul>
              {addingHere && <form className="flex items-center gap-3 px-3 py-2 sm:px-4" onSubmit={e => { e.preventDefault(); void add(); }}>
                <span className="h-[1.125rem] w-[1.125rem] shrink-0 rounded-full border-2 border-dashed border-slate-300"/>
                <input autoFocus aria-label="Nova atividade" placeholder="Nova atividade · Enter para salvar, Esc para sair" className={inlineInput} value={adding.title} readOnly={busy} onChange={e => setAdding({ group, title: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setAdding(null); }} onBlur={() => { if (!busy && !adding.title.trim()) setAdding(null); }}/>
              </form>}
              {onLayoutChange && !addingHere && <button type="button" className="flex min-h-9 items-center gap-1.5 px-3 text-xs font-medium text-slate-400 transition-colors hover:text-teal-700 disabled:opacity-45 sm:px-4" disabled={locked} onClick={() => { setRenaming(null); setAdding({ group, title: '' }); }}><Plus size={14}/>Adicionar</button>}
            </div>}
          </div>;
        })}
        {pending && visibleTasks.every(t => t.status === 'concluida') && <p className="px-4 py-3 text-xs text-teal-800">Nenhuma atividade pendente.</p>}
      </>}
      <p className="pilot-checklist-note border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-400">{insurance ? 'Mesmas atividades de Testes e Tarefas · seis frentes com liberação própria · marcos documentais não certificam ativação no SFMC.' : 'Mesmas atividades de Testes e Tarefas · 3 cards no piloto · quarto card e GRUPO_2 ficam para depois.'}</p>
    </div>
    {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
    {message && <p role="status" className="pilot-toast border-t border-teal-100 bg-teal-50/60 px-4 py-2.5 text-xs text-teal-800">{message}</p>}
  </section>;
}
