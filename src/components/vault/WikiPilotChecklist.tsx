import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Check, CheckCheck, ChevronDown, ChevronRight, ExternalLink, Loader2, Pencil, RefreshCw, Plus, MoreHorizontal, Copy, ArrowUp, ArrowDown, Trash2, GripVertical, X } from 'lucide-react';
import { saveWork } from '../growth-learning/development/workService';
import { TASK_STATUS, taskError, type taskHistory } from '../growth-learning/development/developmentService';
import { newWork, type WorkItem } from '../growth-learning/development/workModel';
import { loadInsuranceTasks, INSURANCE_STRATEGY_PATH, loadPilotTasks } from './wikiPilotService';
import { brazilToday, displayCompletionDate, PILOT_GROUPS, PILOT_KEYS, pilotTaskGroup, activePilotProgress, preparePilotSave, insuranceTaskOrder } from './wikiPilotModel';
import type { TaskGroup, TaskLayout } from './strategy/strategyModel';
import './wikiPilot.css';

const iconButton = 'inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:opacity-40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11';
const menuItem = 'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45';
const inlineInput = 'min-w-0 flex-1 rounded-md border border-cyan-600 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-cyan-600/15';
/** Borderless until hovered or focused: the edit mode keeps the reading layout instead of turning into a form. */
const ghostInput = 'min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:border-slate-200 hover:bg-white focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-600/15 disabled:opacity-60';
const MESSAGE_MS = 3500, UNDO_MS = 10000;
/** Statuses worth calling out on the row; the default planning states stay quiet. */
const NOTABLE: Partial<Record<WorkItem['status'], string>> = { pronta: 'text-cyan-700', em_execucao: 'text-cyan-700', bloqueada: 'text-amber-700', cancelada: 'text-slate-400' };
const DEFAULT_CRITERION = 'Tarefa concluída';
const isField = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));

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

/** Text field that commits on Enter or blur and returns to the saved value on Esc or refusal. */
function CommitInput({ value, onCommit, label, className = ghostInput, disabled, placeholder, fieldKey }: { value: string; onCommit: (next: string) => Promise<boolean>; label: string; className?: string; disabled?: boolean; placeholder?: string; fieldKey?: string }) {
  const [draft, setDraft] = useState(value);
  const committing = useRef(false);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = async () => {
    if (committing.current) return;
    const next = draft.trim();
    if (next === value.trim()) { setDraft(value); return; }
    committing.current = true;
    try { if (!(await onCommit(next))) setDraft(value); } finally { committing.current = false; }
  };
  return <input aria-label={label} className={className} value={draft} readOnly={disabled} aria-disabled={disabled || undefined} placeholder={placeholder} data-field={fieldKey}
    onChange={e => setDraft(e.target.value)}
    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') { e.stopPropagation(); setDraft(value); const field = e.currentTarget; requestAnimationFrame(() => field.blur()); } }}
    onBlur={() => void commit()}/>;
}

/**
 * Note-bound work plans use the same records, revision checks and history as Testes e Tarefas.
 * Reading mode is flat: one click completes an activity, filling what the shared writer requires
 * (every criterion ticked, a delivery note, today's date). Edit mode turns the same list into an
 * outline: titles, groups and the footer note are edited in place and saved as they change.
 */
export function WikiPilotChecklist({ loader = loadPilotTasks, writer = saveWork, layout, onLayoutChange, onDirtyChange, documentBusy = false, initiallyOpen = false, insurance = false, editing = false, onEditingChange, note, onNoteChange }: { insurance?: boolean; layout?: TaskLayout; onLayoutChange?: (layout: TaskLayout, reason?: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void; documentBusy?: boolean; initiallyOpen?: boolean; loader?: typeof loadPilotTasks; writer?: typeof saveWork; historyLoader?: typeof taskHistory; editing?: boolean; onEditingChange?: (editing: boolean) => void; note?: string; onNoteChange?: (note: string) => Promise<void> }) {
  const taskLoader = insurance && loader === loadPilotTasks ? loadInsuranceTasks : loader;
  const groupLabels: Record<string, string> = insurance ? { built: 'Já realizado · diagnóstico e desenho', prepare: 'Preparação comum', mulher_mensal: 'Mulher · Mensal', mulher_trigger: 'Mulher · Trigger', residencial_mensal: 'Residencial · Mensal', residencial_trigger: 'Residencial · Trigger', celular_mensal: 'Celular · Mensal', celular_trigger: 'Celular · Trigger', later: 'Evoluções posteriores' } : PILOT_GROUPS;
  // Groups edited on the page live in the note's layout; until then the built-in stages apply.
  const groupList: TaskGroup[] = layout?.groups?.length ? layout.groups : Object.entries(groupLabels).map(([key, label]) => ({ key, label }));
  const groupKeys = new Set(groupList.map(g => g.key));
  const taskGroup = (task: WorkItem): string => {
    const chosen = task.details.wiki_pilot_group;
    if (chosen && groupKeys.has(chosen)) return chosen;
    const fallback = insurance ? task.details.insurance_group || 'prepare' : pilotTaskGroup(task);
    return groupKeys.has(fallback) ? fallback : groupList[0]?.key || 'prepare';
  };
  const activityTitle = insurance ? 'Tarefas: Construção e ativação de Seguros' : 'Tarefas: Construção do Piloto';
  const defaultNote = insurance ? 'Mesmos registros de Tarefas e atividades · seis frentes com liberação própria · marcos documentais não certificam ativação no SFMC.' : 'Mesmos registros de Tarefas e atividades · 3 cards no piloto · quarto card e GRUPO_2 ficam para depois.';
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPilotTasks>> | null>(null);
  const [opened, setOpened] = useState(initiallyOpen), [pending, setPending] = useState(false);
  const [groups, setGroups] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null), [warn, setWarn] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [adding, setAdding] = useState<{ group: string; title: string } | null>(null);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [freshGroup, setFreshGroup] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null), [dragging, setDragging] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ group: string; index: number } | null>(null);
  // Rows completed while "Só pendentes" is on stay until the filter changes, so the list does not jump under the cursor.
  const [justDone, setJustDone] = useState<Set<string>>(() => new Set());
  const generation = useRef(0), inlineLock = useRef(false), layoutRef = useRef(layout);
  layoutRef.current = layout;
  const busy = savingId !== null;
  const typing = Boolean(renaming || adding?.title.trim() || editing);

  const load = async () => {
    const g = ++generation.current;
    try { const next = await taskLoader(); if (g === generation.current) { setData(next); setError(''); } }
    catch { if (g === generation.current) setError('Não foi possível consultar as Tarefas. Tente atualizar.'); }
  };
  useEffect(() => { void load(); return () => { generation.current++; }; }, [taskLoader]);
  useEffect(() => { const focus = () => { if (!busy && !typing) void load(); }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, [taskLoader, busy, typing]);
  useEffect(() => { onDirtyChange?.(busy || typing); return () => onDirtyChange?.(false); }, [busy, typing, onDirtyChange]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => { setMessage(''); setUndo(null); }, undo ? UNDO_MS : MESSAGE_MS); return () => window.clearTimeout(timer); }, [message, undo]);
  useEffect(() => { if (!nudge) return; const timer = window.setTimeout(() => setNudge(null), 2400); return () => window.clearTimeout(timer); }, [nudge]);
  useEffect(() => { if (editing) { setOpened(true); setRenaming(null); setAdding(null); setPending(false); } else { setNewTitles({}); setNoteDraft(null); setFreshGroup(null); } }, [editing]);
  // A new group opens with its name selected, ready to be typed over.
  useEffect(() => {
    if (!freshGroup) return;
    const frame = requestAnimationFrame(() => { const field = document.querySelector<HTMLInputElement>(`[data-field="group:${freshGroup}"]`); field?.focus(); field?.select(); setFreshGroup(null); });
    return () => cancelAnimationFrame(frame);
  }, [freshGroup]);
  useEffect(() => {
    if (!editing) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isField(e.target)) onEditingChange?.(false); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [editing, onEditingChange]);

  const visibleTasks = (data?.tasks || []).filter(t => !layout?.hidden.includes(t.task_key));
  const progress = activePilotProgress(visibleTasks);
  const doneCount = visibleTasks.filter(t => t.status === 'concluida').length;
  const taskOrder = (task: WorkItem) => { const custom = layout?.order.indexOf(task.task_key) ?? -1; return custom >= 0 ? custom : insurance ? 1000 + insuranceTaskOrder(task) : PILOT_KEYS.includes(task.task_key) ? 1000 + PILOT_KEYS.indexOf(task.task_key) : 2000; };
  const tasksOf = (group: string) => visibleTasks.filter(t => taskGroup(t) === group).sort((a, b) => taskOrder(a) - taskOrder(b));
  // By default only the current step is open: the first group that still has work to do.
  const currentGroup = groupList.find(g => g.key !== 'later' && tasksOf(g.key).some(t => t.status !== 'concluida'))?.key;
  const groupOpen = (group: string) => groups[group] ?? group === currentGroup;
  /** Dependencies the shared writer would refuse on; unknown keys are left for the server to judge. */
  const blockersOf = (task: WorkItem) => task.dependencies.map(k => data?.tasks.find(t => t.task_key === k)).filter((t): t is WorkItem => Boolean(t && t.status !== 'concluida'));

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
  const notify = (text: string, undoAction?: () => void, warning = false) => { setMessage(text); setWarn(warning); setUndo(undoAction ? { label: 'Desfazer', run: undoAction } : null); };

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
    if (saved) notify('Tarefa concluída.');
  };
  const toggle = (task: WorkItem) => {
    if (documentBusy || busy || renaming) return;
    if (task.status === 'concluida') {
      // Reopening keeps the ticked criteria and the delivery note, so a second click completes it again.
      void persist({ ...task, status: 'planejando' }, true).then(saved => { if (saved) notify('Tarefa reaberta.'); });
      return;
    }
    const blockers = blockersOf(task);
    if (blockers.length) { setNudge(task.id); setError(''); notify(`Antes, conclua ${blockers.map(b => `“${b.title}”`).join(' e ')}.`, undefined, true); return; }
    if (pending) setJustDone(s => new Set(s).add(task.id));
    void complete(task);
  };

  const rename = async () => {
    if (!renaming || busy || inlineLock.current) return;
    const task = data?.tasks.find(t => t.id === renaming.id);
    const title = renaming.title.trim();
    if (!task || title === task.title) { setRenaming(null); return; }
    inlineLock.current = true;
    try { if (await persist({ ...task, title }, true)) { setRenaming(null); notify('Título atualizado.'); } } finally { inlineLock.current = false; }
  };
  const renameTask = async (task: WorkItem, title: string) => {
    if (!title) { setError('Informe um título para a Tarefa.'); return false; }
    return Boolean(await persist({ ...task, title }, true));
  };
  const create = async (group: string, title: string) => {
    const next: WorkItem = { ...newWork('monetization'), id: '', revision: 0, task_key: (insurance ? 'SEG-PILOT-' : 'VDV-PILOT-') + crypto.randomUUID().slice(0, 12), title, status: 'planejando', details: { wiki_pilot_note: insurance ? INSURANCE_STRATEGY_PATH : '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md', wiki_pilot_group: group, ...(insurance ? { insurance_group: group } : {}) } };
    const noteInitiative = (data as { initiativeId?: string | null } | null)?.initiativeId || null;
    if (insurance) { next.initiative_id = noteInitiative || '03d2907e-2bb1-4c45-9b26-f3caf11480b4'; next.source_note = INSURANCE_STRATEGY_PATH; }
    else if (noteInitiative) next.initiative_id = noteInitiative;
    return persist(next);
  };
  const add = async () => {
    if (!adding || busy || inlineLock.current) return;
    const title = adding.title.trim();
    if (!title) { setAdding(null); return; }
    inlineLock.current = true;
    try { if (await create(adding.group, title)) { setAdding({ group: adding.group, title: '' }); notify('Tarefa adicionada.'); } } finally { inlineLock.current = false; }
  };
  const addInGroup = async (group: string) => {
    const title = (newTitles[group] || '').trim();
    if (!title || busy || inlineLock.current) return;
    inlineLock.current = true;
    try { if (await create(group, title)) { setNewTitles(t => ({ ...t, [group]: '' })); notify('Tarefa adicionada.'); } } finally { inlineLock.current = false; }
  };
  const duplicate = async (task: WorkItem) => {
    const copy: WorkItem = { ...structuredClone(task), id: '', revision: 0, task_key: (insurance ? 'SEG-PILOT-' : 'VDV-PILOT-') + crypto.randomUUID().slice(0, 12), title: task.title + ' (cópia)', status: 'planejando', completed_criteria: [], resolution: null };
    delete copy.details.completed_on;
    if (await persist(copy)) notify('Tarefa duplicada.');
  };
  const currentLayout = (): TaskLayout => { const l = layoutRef.current; return { hidden: l?.hidden || [], order: l?.order || [], ...(l?.groups ? { groups: l.groups } : {}) }; };
  const updateLayout = async (next: TaskLayout, reason?: string) => {
    if (!onLayoutChange || busy || documentBusy) return false;
    try { await onLayoutChange(next, reason); setError(''); return true; } catch { setError('Não foi possível atualizar a organização. Tente novamente.'); return false; }
  };
  const removeTask = async (task: WorkItem) => {
    if (await updateLayout({ ...currentLayout(), hidden: [...currentLayout().hidden, task.task_key] }, 'Tirar Tarefa da nota: ' + task.title)) {
      notify(`“${task.title}” saiu da nota.`, () => { const l = currentLayout(); void updateLayout({ ...l, hidden: l.hidden.filter(k => k !== task.task_key) }, 'Restaurar Tarefa: ' + task.title).then(ok => { if (ok) notify('Tarefa de volta.'); }); });
    }
  };

  /** Moves an activity to a position, across groups if needed; the group lives on the record, the order on the note. */
  const moveTask = async (task: WorkItem, toGroup: string, toIndex: number) => {
    if (busy || documentBusy) return;
    const arrangement = groupList.map(g => ({ key: g.key, ids: tasksOf(g.key).map(t => t.task_key) }));
    const from = arrangement.find(a => a.ids.includes(task.task_key)), target = arrangement.find(a => a.key === toGroup);
    if (!from || !target) return;
    const fromIndex = from.ids.indexOf(task.task_key);
    let at = toIndex;
    if (from === target && fromIndex < toIndex) at -= 1;
    if (from === target && at === fromIndex) return;
    from.ids.splice(fromIndex, 1);
    target.ids.splice(Math.max(0, Math.min(at, target.ids.length)), 0, task.task_key);
    if (from !== target && !(await persist({ ...task, details: { ...task.details, wiki_pilot_group: toGroup, ...(insurance ? { insurance_group: toGroup } : {}) } }, true))) return;
    const flat = arrangement.flatMap(a => a.ids), l = currentLayout();
    await updateLayout({ ...l, order: [...flat, ...l.order.filter(k => !flat.includes(k))] }, 'Reorganizar Tarefas da nota');
  };
  const stepTask = (task: WorkItem, delta: -1 | 1) => {
    const group = taskGroup(task), list = tasksOf(group), i = list.findIndex(t => t.id === task.id), gi = groupList.findIndex(g => g.key === group);
    if (delta < 0) { if (i > 0) void moveTask(task, group, i - 1); else if (gi > 0) { const prev = groupList[gi - 1].key; void moveTask(task, prev, tasksOf(prev).length); } }
    else if (i < list.length - 1) void moveTask(task, group, i + 2);
    else if (gi < groupList.length - 1) void moveTask(task, groupList[gi + 1].key, 0);
  };

  const saveGroups = (next: TaskGroup[], reason: string) => updateLayout({ ...currentLayout(), groups: next }, reason);
  const renameGroup = async (key: string, label: string) => {
    if (!label) { setError('Informe um nome para o grupo.'); return false; }
    return saveGroups(groupList.map(g => g.key === key ? { ...g, label } : g), 'Renomear grupo: ' + label);
  };
  const moveGroup = (key: string, delta: -1 | 1) => {
    const i = groupList.findIndex(g => g.key === key), j = i + delta;
    if (i < 0 || j < 0 || j >= groupList.length) return;
    const next = [...groupList]; [next[i], next[j]] = [next[j], next[i]];
    void saveGroups(next, 'Reordenar grupos de Tarefas');
  };
  const removeGroup = (group: TaskGroup) => {
    if (tasksOf(group.key).length) { setError('Mova ou tire as Tarefas deste grupo antes de excluí-lo.'); return; }
    if (groupList.length <= 1) { setError('A seção precisa de pelo menos um grupo.'); return; }
    const before = groupList;
    void saveGroups(groupList.filter(g => g.key !== group.key), 'Excluir grupo: ' + group.label).then(ok => { if (ok) notify(`Grupo “${group.label}” excluído.`, () => void saveGroups(before, 'Restaurar grupo: ' + group.label)); });
  };
  const addGroup = () => {
    const key = 'g-' + crypto.randomUUID().slice(0, 8);
    void saveGroups([...groupList, { key, label: 'Novo grupo' }], 'Adicionar grupo de Tarefas').then(ok => { if (ok) setFreshGroup(key); });
  };
  const removeDependency = (task: WorkItem, key: string) => void persist({ ...task, dependencies: task.dependencies.filter(d => d !== key) }, true).then(saved => { if (saved) notify('Dependência removida.'); });
  const saveNote = async () => {
    if (noteDraft === null || !onNoteChange) return;
    const next = noteDraft.trim();
    if (next === (note?.trim() || defaultNote)) { setNoteDraft(null); return; }
    try { await onNoteChange(next); setNoteDraft(null); } catch { /* The document reports the failure and keeps the draft. */ }
  };

  // Drag and drop is armed from the grip only, so text in the row's field stays selectable.
  const dragOverRow = (e: DragEvent, group: string, index: number) => {
    if (!dragging) return;
    e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move';
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const at = e.clientY > box.top + box.height / 2 ? index + 1 : index;
    if (dropAt?.group !== group || dropAt.index !== at) setDropAt({ group, index: at });
  };
  const dragOverGroup = (e: DragEvent, group: string) => {
    if (!dragging) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (dropAt?.group !== group) setDropAt({ group, index: tasksOf(group).length });
  };
  const drop = (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const task = data?.tasks.find(t => t.id === dragging), target = dropAt;
    setDragging(null); setDropAt(null); setArmed(null);
    if (task && target) void moveTask(task, target.group, target.index);
  };
  const endDrag = () => { setDragging(null); setDropAt(null); setArmed(null); };

  const label = insurance ? `${doneCount}/${visibleTasks.length} Tarefas concluídas · liberação por frente` : data?.canEdit ? progress.validated ? 'Validado na seedlist' : progress.ready ? 'Pronto para testar na seedlist' : `Preparação ${progress.done}/${progress.total}` : data ? 'Acesso administrativo' : 'Consultar Tarefas';
  const subtitle = insurance ? 'Diagnóstico, preparação e seis frentes · conclusão documental não libera disparo' : `Preparação ${progress.done}/${progress.total} · validação na seedlist ${progress.validationDone}/${progress.validationTotal}`;
  const percent = visibleTasks.length ? Math.round(doneCount / visibleTasks.length * 100) : 0;
  const locked = busy || documentBusy;
  const canOrganize = Boolean(editing && onLayoutChange && data?.canEdit);

  const editRow = (task: WorkItem, group: string, index: number, list: WorkItem[]) => {
    const done = task.status === 'concluida', saving = savingId === task.id;
    const groupIndex = groupList.findIndex(g => g.key === group);
    const first = groupIndex === 0 && index === 0, last = groupIndex === groupList.length - 1 && index === list.length - 1;
    const deps = task.dependencies.map(k => ({ key: k, task: data?.tasks.find(t => t.task_key === k) }));
    const line = dropAt?.group === group ? dropAt.index === index ? 'pilot-drop-before' : dropAt.index === index + 1 && index === list.length - 1 ? 'pilot-drop-after' : '' : '';
    return <li key={task.id} draggable={armed === task.id} onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.title); setDragging(task.id); }} onDragEnd={endDrag} onDragOver={e => dragOverRow(e, group, index)} onDrop={drop}
      className={`pilot-edit-row group/row relative flex items-center gap-1 rounded-md px-1 sm:px-2 ${dragging === task.id ? 'opacity-40' : ''} ${line}`}>
      <button type="button" aria-label={`Arrastar ${task.title}`} title="Arraste para reordenar" className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing" onMouseDown={() => setArmed(task.id)} onMouseUp={() => setArmed(null)} onTouchStart={() => setArmed(task.id)}><GripVertical size={15}/></button>
      <span aria-hidden className={`flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200'}`}>{saving ? <Loader2 size={11} className="animate-spin"/> : done && <Check size={11} strokeWidth={3.5}/>}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
        <CommitInput label={`Título de ${task.title}`} value={task.title} disabled={locked} onCommit={title => renameTask(task, title)}/>
        {deps.length > 0 && <span className="flex flex-wrap items-center gap-1 pb-1 pl-2 text-[11px] text-slate-400 sm:pb-0">Depois de{deps.map(d => <span key={d.key} className="inline-flex max-w-[14rem] items-center gap-0.5 rounded-full bg-slate-100 py-0.5 pl-2 pr-0.5 text-slate-600"><span className="truncate">{d.task?.title || d.key}</span><button type="button" aria-label={`Remover dependência ${d.task?.title || d.key}`} disabled={locked} className="rounded-full p-0.5 hover:bg-slate-200 hover:text-slate-800" onClick={() => removeDependency(task, d.key)}><X size={11}/></button></span>)}</span>}
      </div>
      <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100">
        <button type="button" className={iconButton} disabled={locked || first} aria-label={`Subir ${task.title}`} title="Subir" onClick={() => stepTask(task, -1)}><ArrowUp size={14}/></button>
        <button type="button" className={iconButton} disabled={locked || last} aria-label={`Descer ${task.title}`} title="Descer" onClick={() => stepTask(task, 1)}><ArrowDown size={14}/></button>
        <button type="button" className={`${iconButton} hover:bg-rose-50 hover:text-rose-700`} disabled={locked} aria-label={`Excluir ${task.title} da nota`} title="Excluir da nota" onClick={() => void removeTask(task)}><Trash2 size={14}/></button>
      </div>
    </li>;
  };

  const row = (task: WorkItem) => {
    const done = task.status === 'concluida', saving = savingId === task.id;
    const notable = NOTABLE[task.status];
    const blockers = done ? [] : blockersOf(task);
    const meta = [
      task.owner_label && <span key="owner">{task.owner_label}</span>,
      notable && <span key="status" className={notable}>{TASK_STATUS[task.status]}</span>,
      blockers.length > 0 && <span key="deps" className={`transition-colors ${nudge === task.id ? 'font-medium text-amber-700' : ''}`}>Depois de {blockers.map(b => b.title).join(' e ')}</span>,
      done && <span key="done">Concluída em {displayCompletionDate(task)}</span>,
    ].filter(Boolean);
    if (renaming?.id === task.id) return <li key={task.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 sm:px-4">
      <span className="ml-0.5 h-[1.125rem] w-[1.125rem] shrink-0"/>
      <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={e => { e.preventDefault(); void rename(); }}>
        <input autoFocus aria-label="Título da Tarefa" className={inlineInput} value={renaming.title} readOnly={busy} onChange={e => setRenaming({ id: task.id, title: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setRenaming(null); }} onBlur={() => { if (!busy) void rename(); }}/>
      </form>
    </li>;
    return <li key={task.id} className="group/row flex items-center gap-1 px-1.5 transition-colors hover:bg-slate-50/80 sm:px-2.5">
      <button type="button" role="checkbox" aria-checked={done} aria-label={`${done ? 'Reabrir' : 'Concluir'} ${task.title}`} disabled={locked} onClick={() => toggle(task)} className="group/check flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-md py-2 pl-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:cursor-wait">
        <span className={`pilot-check-box flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 group-active/check:scale-90 ${nudge === task.id ? 'pilot-nudge border-amber-500 bg-white text-transparent' : done ? 'border-teal-600 bg-teal-600 text-white' : blockers.length ? 'border-slate-200 bg-slate-50 text-transparent' : 'border-slate-300 bg-white text-transparent group-hover/check:border-teal-500 group-hover/check:text-teal-500/70'}`}>
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
          <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); stepTask(task, -1); }}><ArrowUp size={13}/>Mover para cima</button>
          <button type="button" role="menuitem" className={menuItem} disabled={locked} onClick={() => { close(); stepTask(task, 1); }}><ArrowDown size={13}/>Mover para baixo</button>
        </>}
        <a role="menuitem" className={menuItem} href={`?view=operacao&section=investigations&dev_task=${task.id}`}><ExternalLink size={13}/>Abrir em Testes e Tarefas</a>
        {onLayoutChange && <>
          <div className="my-1 border-t border-slate-100"/>
          <button type="button" role="menuitem" className={`${menuItem} text-rose-700 hover:bg-rose-50`} disabled={locked} onClick={() => { close(); void removeTask(task); }}><Trash2 size={13}/>Excluir da nota</button>
        </>}
      </>}</RowMenu>
    </li>;
  };

  const editGroups = () => <div className="pilot-panel pb-2">
    {groupList.map((group, gi) => {
      const list = tasksOf(group.key), groupDone = list.filter(t => t.status === 'concluida').length;
      return <div key={group.key} className="border-t border-slate-100 px-2 pb-2 pt-1.5 sm:px-3" onDragOver={e => dragOverGroup(e, group.key)} onDrop={drop}>
        <div className="group/head flex items-center gap-1">
          <CommitInput label={`Nome do grupo ${group.label}`} value={group.label} disabled={locked} fieldKey={'group:' + group.key} className={`${ghostInput} text-xs font-semibold uppercase tracking-wide text-slate-500`} onCommit={labelText => renameGroup(group.key, labelText)}/>
          <span className="px-1 text-xs tabular-nums text-slate-400">{groupDone}/{list.length}</span>
          <div className="flex items-center opacity-60 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
            <button type="button" className={iconButton} disabled={locked || gi === 0} aria-label={`Subir grupo ${group.label}`} title="Subir grupo" onClick={() => moveGroup(group.key, -1)}><ArrowUp size={14}/></button>
            <button type="button" className={iconButton} disabled={locked || gi === groupList.length - 1} aria-label={`Descer grupo ${group.label}`} title="Descer grupo" onClick={() => moveGroup(group.key, 1)}><ArrowDown size={14}/></button>
            <button type="button" className={`${iconButton} hover:bg-rose-50 hover:text-rose-700`} disabled={locked} aria-label={`Excluir grupo ${group.label}`} title={list.length ? 'Mova ou tire as Tarefas antes' : 'Excluir grupo'} onClick={() => removeGroup(group)}><Trash2 size={14}/></button>
          </div>
        </div>
        <ul className="mt-0.5">{list.map((t, i) => editRow(t, group.key, i, list))}</ul>
        {!list.length && <div className={`mx-1 my-1 rounded-md border border-dashed px-3 py-2.5 text-xs transition-colors ${dropAt?.group === group.key ? 'border-teal-500 bg-teal-50/60 text-teal-800' : 'border-slate-200 text-slate-400'}`}>Grupo vazio. Arraste uma Tarefa para cá ou adicione abaixo.</div>}
        <form className="flex items-center gap-1 px-1 sm:px-2" onSubmit={e => { e.preventDefault(); void addInGroup(group.key); }}>
          <span className="flex h-8 w-6 shrink-0 items-center justify-center text-slate-300"><Plus size={15}/></span>
          <span aria-hidden className="h-[1.125rem] w-[1.125rem] shrink-0 rounded-full border-2 border-dashed border-slate-200"/>
          <input aria-label={`Nova Tarefa em ${group.label}`} placeholder="Nova Tarefa" readOnly={busy} className={`${ghostInput} placeholder:text-slate-400`} value={newTitles[group.key] || ''} onChange={e => setNewTitles(t => ({ ...t, [group.key]: e.target.value }))} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setNewTitles(t => ({ ...t, [group.key]: '' })); e.currentTarget.blur(); } }}/>
          {(newTitles[group.key] || '').trim() && <span className="shrink-0 pr-1 text-[11px] text-slate-400">Enter para adicionar</span>}
        </form>
      </div>;
    })}
    <div className="border-t border-slate-100 px-3 pt-2 sm:px-4">
      <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-700 disabled:opacity-45" disabled={locked} onClick={addGroup}><Plus size={14}/>Novo grupo</button>
    </div>
  </div>;

  const noteText = note?.trim() || defaultNote;
  return <section className={`pilot-checklist my-5 overflow-hidden rounded-xl border bg-white text-slate-700 transition-colors ${canOrganize ? 'pilot-editing border-teal-200' : 'border-slate-200'}`} aria-label={activityTitle}>
    <div className="pilot-checklist-head flex flex-wrap items-center justify-between gap-x-3 border-b border-slate-100 bg-slate-50/70 px-3 py-1 sm:px-4">
      <button type="button" aria-expanded={opened} aria-controls="wiki-pilot-activities" onClick={() => setOpened(!opened)} className="flex min-h-11 min-w-0 items-center gap-2 text-left text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">{opened ? <ChevronDown size={15} className="shrink-0"/> : <ChevronRight size={15} className="shrink-0"/>}<CheckCheck size={15} className="shrink-0 text-cyan-700"/><span>{activityTitle}</span></button>
      <span className="py-1 text-xs tabular-nums text-cyan-800">{label}</span>
    </div>
    <div id="wiki-pilot-activities" hidden={!opened}>
      {canOrganize ? <div className="pilot-edit-bar flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <span className="text-xs text-slate-500">Editando · cada mudança salva na hora · arraste <GripVertical size={12} className="inline align-[-2px]"/> para reordenar</span>
        {(busy || documentBusy) && <span className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 size={12} className="animate-spin"/>Salvando</span>}
      </div> : <div className="pilot-checklist-toolbar flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
        <div className="min-w-[12rem] flex-1">
          <div className="flex items-baseline justify-between gap-3 text-xs"><span className="text-slate-500">{subtitle}</span>{data?.canEdit && <span className="shrink-0 font-medium tabular-nums text-slate-700">{doneCount} de {visibleTasks.length}</span>}</div>
          {data?.canEdit && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Tarefas concluídas" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="pilot-progress h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }}/></div>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-pressed={pending} disabled={busy} onClick={() => { setPending(p => !p); setJustDone(new Set()); }} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-45 ${pending ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>{pending && <Check size={12} strokeWidth={3}/>}Só pendentes</button>
          <button type="button" className={iconButton} disabled={busy || typing} onClick={() => void load()} aria-label="Atualizar Tarefas" title="Atualizar"><RefreshCw size={14}/></button>
        </div>
      </div>}
      {!data && !error && <p role="status" className="px-4 py-3 text-xs text-slate-500">Consultando Tarefas…</p>}
      {data && !data.canEdit && <p className="px-4 py-3 text-xs text-slate-500">As Tarefas seguem as permissões de Tarefas e atividades.</p>}
      {data?.canEdit && (canOrganize ? editGroups() : <>
        {!insurance && data.tasks.length < PILOT_KEYS.length && <p className="px-4 py-2 text-xs text-amber-800">Há Tarefas do piloto ainda não cadastradas. O marco de prontidão permanece pendente.</p>}
        {groupList.map(({ key: group, label: name }) => {
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
                <input autoFocus aria-label="Nova Tarefa" placeholder="Nova Tarefa · Enter para salvar, Esc para sair" className={inlineInput} value={adding.title} readOnly={busy} onChange={e => setAdding({ group, title: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setAdding(null); }} onBlur={() => { if (!busy && !adding.title.trim()) setAdding(null); }}/>
              </form>}
              {onLayoutChange && !addingHere && <button type="button" className="flex min-h-9 items-center gap-1.5 px-3 text-xs font-medium text-slate-400 transition-colors hover:text-teal-700 disabled:opacity-45 sm:px-4" disabled={locked} onClick={() => { setRenaming(null); setAdding({ group, title: '' }); }}><Plus size={14}/>Adicionar</button>}
            </div>}
          </div>;
        })}
        {pending && visibleTasks.every(t => t.status === 'concluida') && <p className="px-4 py-3 text-xs text-teal-800">Nenhuma Tarefa pendente.</p>}
      </>)}
      {canOrganize && onNoteChange ? <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor="wiki-pilot-note">Nota de rodapé</label>
        <textarea id="wiki-pilot-note" rows={2} readOnly={locked} className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15" value={noteDraft ?? noteText} onChange={e => setNoteDraft(e.target.value)} onBlur={() => void saveNote()} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setNoteDraft(null); e.currentTarget.blur(); } }}/>
      </div> : <p className="pilot-checklist-note border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-400">{noteText}</p>}
      {canOrganize && <div className="pilot-edit-foot flex flex-wrap items-center justify-between gap-3 border-t border-teal-100 bg-teal-50/50 px-3 py-2 sm:px-4">
        <span className="text-[11px] text-slate-500">Tirar da nota só esconde a Tarefa aqui; ela continua em Tarefas e atividades.</span>
        <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-teal-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50" disabled={busy} onClick={() => onEditingChange?.(false)}><Check size={13} strokeWidth={3}/>Concluir edição</button>
      </div>}
    </div>
    {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
    {message && <p role="status" className={`pilot-toast flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs ${warn ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-teal-100 bg-teal-50/60 text-teal-800'}`}><span>{message}</span>{undo && <button type="button" className="shrink-0 rounded px-2 py-1 font-semibold text-teal-800 underline-offset-2 hover:bg-teal-100 hover:underline" onClick={() => { const run = undo.run; setUndo(null); setMessage(''); run(); }}>{undo.label}</button>}</p>}
  </section>;
}
