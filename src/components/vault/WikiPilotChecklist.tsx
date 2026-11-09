import { useEffect, useRef, useState } from 'react';
import { CheckCheck, ChevronDown, ChevronRight, Pencil, RefreshCw, Plus, MoreHorizontal, Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { saveWork } from '../growth-learning/development/workService';
import { TASK_STATUS, taskError, taskHistory, type TaskEvent } from '../growth-learning/development/developmentService';
import { newWork, type WorkItem } from '../growth-learning/development/workModel';
import { loadInsuranceTasks, INSURANCE_STRATEGY_PATH, loadPilotTasks } from './wikiPilotService';
import { brazilToday, canQuickComplete, completionDate, displayCompletionDate, PILOT_GROUPS, PILOT_KEYS, pilotTaskGroup, activePilotProgress, preparePilotSave, insuranceTaskOrder } from './wikiPilotModel';
import { WikiPilotTaskEditor } from './WikiPilotTaskEditor';
import type { TaskLayout } from './strategy/strategyModel';

const icon = 'inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:opacity-40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11';
const groupsInitial: Record<string, boolean> = { built: false, prepare: true, validate: false, later: false };

/** Note-bound work plans use the same records, revision checks and history as Testes e Tarefas. */
export function WikiPilotChecklist({ loader = loadPilotTasks, writer = saveWork, historyLoader = taskHistory, layout, onLayoutChange, onDirtyChange, documentBusy = false, initiallyOpen = false, insurance = false }: { insurance?: boolean; layout?: TaskLayout; onLayoutChange?: (layout: TaskLayout) => Promise<void>; onDirtyChange?: (dirty: boolean) => void; documentBusy?: boolean; initiallyOpen?: boolean; loader?: typeof loadPilotTasks; writer?: typeof saveWork; historyLoader?: typeof taskHistory }) {
  const taskLoader = insurance && loader === loadPilotTasks ? loadInsuranceTasks : loader;
  const groupLabels: Record<string,string> = insurance ? {built:'Já realizado · diagnóstico e desenho',prepare:'Preparação comum',mulher_mensal:'Mulher · Mensal',mulher_trigger:'Mulher · Trigger',residencial_mensal:'Residencial · Mensal',residencial_trigger:'Residencial · Trigger',celular_mensal:'Celular · Mensal',celular_trigger:'Celular · Trigger',later:'Evoluções posteriores'} : PILOT_GROUPS;
  const taskGroup = (task: WorkItem): string => insurance ? task.details.insurance_group || 'prepare' : pilotTaskGroup(task);
  const activityTitle = insurance ? 'Atividades: Construção e ativação de Seguros' : 'Atividades: Construção do Piloto';
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPilotTasks>> | null>(null);
  const [opened, setOpened] = useState(initiallyOpen), [pending, setPending] = useState(false), [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState(groupsInitial);
  const [expandedGroups,setExpandedGroups]=useState<Record<string,boolean>>({});
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [draft, setDraft] = useState<WorkItem | null>(null);
  const [initialField, setInitialField] = useState<'title' | null>(null);
  const [history, setHistory] = useState<TaskEvent[] | null>(null), [historyError, setHistoryError] = useState('');
  const generation = useRef(0), baseline = useRef('');
  const editors = useRef(new Map<string, HTMLButtonElement>());
  const changed = Boolean(draft && JSON.stringify(draft) !== baseline.current);
  const load = async () => {
    const g = ++generation.current;
    try { const next = await taskLoader(); if (g === generation.current) { setData(next); setError(''); } }
    catch { if (g === generation.current) setError('Não foi possível consultar as atividades. Tente atualizar.'); }
  };
  useEffect(() => { void load(); return () => { generation.current++; }; }, [taskLoader]);
  useEffect(() => { const focus = () => { if (!busy && !draft) void load(); }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, [taskLoader, busy, draft]);
  useEffect(() => {
    if (!changed) return;
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload);
  }, [changed]);
  useEffect(() => {
    let active = true; setHistory(null); setHistoryError('');
    if (draft?.id) void historyLoader(draft.id).then(rows => { if (active) setHistory(rows); }).catch(() => { if (active) setHistoryError('Histórico indisponível. Reabra a atividade para tentar novamente.'); });
    return () => { active = false; };
  }, [draft?.id, draft?.revision, historyLoader]);
  const visibleTasks = (data?.tasks || []).filter(t => !layout?.hidden.includes(t.task_key));
  const progress = activePilotProgress(visibleTasks);
  useEffect(() => { onDirtyChange?.(Boolean(draft) || changed || busy); return () => onDirtyChange?.(false); }, [draft, changed, busy, onDirtyChange]);
  const updateLayout = async (next: TaskLayout) => {
    if (!onLayoutChange || changed || busy || documentBusy) { setMessage('Salve ou cancele a edição antes de reorganizar as atividades.'); return; }
    try { await onLayoutChange(next); setError(''); } catch { setError('Não foi possível atualizar a organização. Tente novamente.'); }
  };
  const addTask = (copy?: WorkItem) => {
    if(changed || busy || documentBusy) { setMessage('Salve ou cancele a edição atual antes de adicionar uma atividade.'); return; }
    const next: WorkItem = {...newWork('monetization'),...(copy ? structuredClone(copy) : {}),id:'',revision:0,task_key:(insurance?'SEG-PILOT-':'VDV-PILOT-')+crypto.randomUUID().slice(0,12),title:copy ? copy.title+' (cópia)' : '',status:'planejando',completed_criteria:[],resolution:null,details:{...(copy?.details||{}),wiki_pilot_note:insurance?INSURANCE_STRATEGY_PATH:'05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md',wiki_pilot_group:copy ? taskGroup(copy) : 'prepare',...(insurance?{insurance_group:copy?taskGroup(copy):'prepare'}:{})}};
    if(insurance){next.initiative_id='03d2907e-2bb1-4c45-9b26-f3caf11480b4';next.source_note=INSURANCE_STRATEGY_PATH;}
    delete next.details.completed_on;
    baseline.current=JSON.stringify(next);setDraft(next);setInitialField('title');setError('');setMessage('');
  };
  const moveTask = (task: WorkItem,delta:number) => {
    const order=visibleTasks.filter(t=>taskGroup(t)===taskGroup(task)).sort((a,b)=>taskOrder(a)-taskOrder(b)).map(t=>t.task_key);
    const i=order.indexOf(task.task_key),j=i+delta;if(j<0||j>=order.length)return;
    [order[i],order[j]]=[order[j],order[i]];
    void updateLayout({hidden:layout?.hidden||[],order:[...order,...(layout?.order||[]).filter(k=>!order.includes(k))]});
  };
  const taskOrder = (task: WorkItem) => { const custom=layout?.order.indexOf(task.task_key)??-1;return custom>=0?custom:insurance?1000+insuranceTaskOrder(task):PILOT_KEYS.includes(task.task_key)?1000+PILOT_KEYS.indexOf(task.task_key):2000; };
  const focusEditor = (id: string) => requestAnimationFrame(() => editors.current.get(id)?.focus({ preventScroll: true }));
  const close = () => { if (busy) return; const id = draft?.id; setDraft(null); baseline.current = ''; setInitialField(null); setMessage(''); setError(''); if (id) focusEditor(id); };
  const openTask = (task: WorkItem, completing = false, editTitle = false) => {
    if (busy || documentBusy) return;
    if (changed) { setMessage('Salve ou cancele a edição atual antes de abrir outra atividade.'); return; }
    if (draft?.id === task.id && !completing) { if (editTitle) setInitialField('title'); else close(); return; }
    const next = structuredClone(task);
    baseline.current = JSON.stringify(next);
    if (completing) { next.status = 'concluida'; next.details.completed_on = completionDate(task) || brazilToday(); }
    setDraft(next); setInitialField(editTitle ? 'title' : null); setMessage(''); setError('');
    const group = taskGroup(task); if (group) setGroups(g => ({ ...g, [group]: true }));
  };
  const save = async (task: WorkItem) => {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const original = data?.tasks.find(t => t.id === task.id);
      const prepared = preparePilotSave(task, original);
      const saved = await writer(prepared);
      setData(current => current && { ...current, tasks: current.tasks.some(t=>t.id===saved.id) ? current.tasks.map(t => t.id === saved.id ? saved : t) : [...current.tasks,saved] });
      baseline.current = ''; setDraft(null); setInitialField(null);
      const savedGroup=taskGroup(saved);if(savedGroup){setGroups(g=>({...g,[savedGroup]:true}));setExpandedGroups(g=>({...g,[savedGroup]:true}));}
      setMessage(saved.status === 'concluida' ? 'Conclusão e data registradas.' : 'Atividade atualizada.');
      // A completed row must remain mounted until focus is restored, even in pending-only view.
      if (pending && saved.status === 'concluida') setPending(false);
      focusEditor(saved.id);
    } catch (e) { setError(e instanceof Error && e.name === 'PilotValidationError' ? e.message : taskError(e)); }
    finally { setBusy(false); }
  };
  const toggle = (task: WorkItem) => {
    if(documentBusy || busy)return;
    if (changed) { setMessage('Salve ou cancele a edição atual antes de alterar outra atividade.'); return; }
    if (task.status === 'concluida') { void save({ ...task, status: 'planejando', completed_criteria: [] }); return; }
    if (canQuickComplete(task)) void save({ ...task, status: 'concluida', details: { ...task.details, completed_on: brazilToday() } });
    else openTask(task, true);
  };
  const blockCollapse = () => { setMessage('Salve ou cancele a edição atual antes de recolher as atividades.'); };
  const label = insurance ? `${visibleTasks.filter(t=>t.status==='concluida').length}/${visibleTasks.length} atividades concluídas · liberação por frente` : data?.canEdit ? progress.validated ? 'Validado na seedlist' : progress.ready ? 'Pronto para testar na seedlist' : `Preparação ${progress.done}/${progress.total}` : data ? 'Acesso administrativo' : 'Consultar atividades';
  return <section className="my-5 rounded-xl border border-slate-200 bg-white text-slate-700" aria-label={activityTitle}>
    <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-slate-100 bg-slate-50/70 px-3 py-1 sm:px-4">
      <button type="button" aria-expanded={opened} aria-controls="wiki-pilot-activities" onClick={() => { if (opened && (changed || busy)) { blockCollapse(); return; } setOpened(!opened); }} className="flex min-h-11 min-w-0 items-center gap-2 text-left text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">{opened ? <ChevronDown size={15} className="shrink-0"/> : <ChevronRight size={15} className="shrink-0"/>}<CheckCheck size={15} className="shrink-0 text-cyan-700"/><span>{activityTitle}</span></button>
      <span className="py-1 text-xs tabular-nums text-cyan-800">{label}</span>
    </div>
    <div id="wiki-pilot-activities" hidden={!opened}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4"><p className="text-xs text-slate-500">{insurance ? 'Diagnóstico, preparação e seis frentes · conclusão documental não libera disparo' : `Preparação e validação na seedlist · ${progress.validationDone}/${progress.validationTotal} validações`}</p><div className="flex items-center gap-2"><label className="flex min-h-9 items-center gap-1.5 text-xs"><input type="checkbox" checked={pending} onChange={e => setPending(e.target.checked)} disabled={Boolean(draft) || busy} className="accent-cyan-700"/>Só pendentes</label><button type="button" className={icon} disabled={busy || Boolean(draft)} onClick={() => void load()} aria-label="Atualizar atividades"><RefreshCw size={14}/></button></div></div>
      {!data && !error && <p role="status" className="px-4 py-3 text-xs">Consultando atividades…</p>}
      {data && !data.canEdit && <p className="px-4 py-3 text-xs text-slate-500">As atividades seguem as permissões administrativas de Testes e Tarefas.</p>}
      {data?.canEdit && <>
        {!insurance && data.tasks.length < PILOT_KEYS.length && <p className="px-4 py-2 text-xs text-amber-800">Há atividades do piloto ainda não cadastradas. O marco de prontidão permanece pendente.</p>}
        {Object.entries(groupLabels).map(([group, name]) => {
          const all = visibleTasks.filter(t => taskGroup(t) === group).sort((a,b) => taskOrder(a)-taskOrder(b));
          const tasks = all.filter(t => !pending || t.status !== 'concluida');
          const shown=expandedGroups[group]||pending||draft&&taskGroup(draft)===group?tasks:tasks.slice(0,3);
          if (!tasks.length) return null;
          return <div key={group} className="border-t border-slate-100">
            <button type="button" aria-expanded={groups[group]} aria-controls={`wiki-pilot-${group}`} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 sm:px-4" onClick={() => { if (groups[group] && draft && taskGroup(draft) === group && (changed || busy)) { blockCollapse(); return; } setGroups(g => ({ ...g, [group]: !g[group] })); }}>{groups[group] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="flex-1">{name}</span><span className="font-normal tabular-nums text-slate-400">{all.filter(t => t.status === 'concluida').length}/{all.length}</span></button>
            <div id={`wiki-pilot-${group}`} hidden={!groups[group]}>
              {insurance && group !== 'built' && group !== 'prepare' && group !== 'later' && <p className="px-4 pb-2 text-xs text-slate-500">{all.some(t=>t.task_key.endsWith('-LIBERAR') && t.status==='concluida') ? 'Liberação do piloto registrada; conferir execução e leitura.' : `Liberação pendente · próxima atividade: ${all.find(t=>t.status!=='concluida')?.title || 'conferir dependências comuns e evidências'}.`}</p>}
              {group === 'later' && <p className="px-4 pb-2 text-xs text-slate-500">{insurance ? 'Evoluções fora do caminho inicial; conferir dependências de cada piloto.' : 'Não bloqueia o teste da seedlist.'}</p>}
              {shown.map(task => <article key={task.id} className="border-t border-slate-100">
                <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-x-2 px-3 py-1.5 sm:grid-cols-[1.25rem_minmax(0,1fr)_7rem_5rem_4.5rem] sm:items-center sm:px-4">
                  <label className="flex min-h-11 items-center justify-center sm:min-h-10"><input type="checkbox" aria-label={`${task.status === 'concluida' ? 'Reabrir' : 'Concluir'} ${task.title}`} checked={task.status === 'concluida'} disabled={busy||documentBusy} onChange={() => toggle(task)} className="h-4 w-4 accent-cyan-700"/></label>
                  <button type="button" aria-expanded={draft?.id === task.id} aria-controls={`pilot-task-${task.id}`} className="min-h-10 min-w-0 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700" onClick={() => openTask(task)}><span className="block text-sm font-medium leading-5 text-slate-700">{task.title}</span><span className="mt-0.5 block text-xs text-slate-400">{task.owner_label || 'Sem responsável'}</span></button>
                  <div className="col-start-2 flex flex-wrap items-center gap-x-2 pb-1 sm:contents"><span className={`text-xs ${task.status === 'concluida' ? 'text-teal-700' : task.status === 'bloqueada' ? 'text-amber-800' : 'text-slate-500'}`}>{TASK_STATUS[task.status]}</span>
                  <span aria-hidden className="text-slate-300 sm:hidden">·</span><span className="text-xs tabular-nums text-slate-400">{task.status === 'concluida' ? <><span className="sm:sr-only">Concluída em </span>{displayCompletionDate(task)}</> : 'Sem conclusão'}</span></div>
                  <div className="col-start-3 row-start-1 flex items-center sm:col-start-5"><button type="button" ref={el => { if (el) editors.current.set(task.id, el); else editors.current.delete(task.id); }} aria-label={`Editar atividade ${task.title}`} className={icon} disabled={busy||documentBusy} onClick={() => openTask(task, false, true)}><Pencil size={14}/></button>
                  {onLayoutChange && <details className="relative"><summary aria-label={`Mais ações de ${task.title}`} className={`${icon} cursor-pointer list-none`}><MoreHorizontal size={15}/></summary><div className="absolute right-0 top-full z-20 min-w-48 border border-slate-200 bg-white p-1 text-xs shadow-sm">
                    <button type="button" className="flex w-full items-center gap-2 p-2 text-left hover:bg-slate-50" disabled={changed||busy||documentBusy} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');addTask(task);}}><Copy size={13}/>Duplicar</button>
                    <button type="button" className="flex w-full items-center gap-2 p-2 text-left hover:bg-slate-50" disabled={changed||busy||documentBusy} onClick={()=>moveTask(task,-1)}><ArrowUp size={13}/>Mover para cima</button>
                    <button type="button" className="flex w-full items-center gap-2 p-2 text-left hover:bg-slate-50" disabled={changed||busy||documentBusy} onClick={()=>moveTask(task,1)}><ArrowDown size={13}/>Mover para baixo</button>
                    <button type="button" className="flex w-full items-center gap-2 p-2 text-left text-rose-700 hover:bg-rose-50" disabled={changed||busy||documentBusy} onClick={()=>void updateLayout({order:layout?.order||[],hidden:[...(layout?.hidden||[]),task.task_key]})}><Trash2 size={13}/>Excluir da nota</button><p className="border-t p-2 text-slate-400">Recuperável no histórico. O registro de Testes e Tarefas é preservado.</p>
                  </div></details>}</div>
                </div>
                {task.status === 'bloqueada' && <p className="px-4 pb-2 text-xs text-amber-800">{task.blocked_reason}</p>}
                <div id={`pilot-task-${task.id}`}>{draft?.id === task.id && <WikiPilotTaskEditor key={task.id} draft={draft} original={task} setDraft={setDraft} busy={busy} initialField={initialField} onSave={() => void save(draft)} onClose={close} history={history} historyError={historyError}/>}</div>
              </article>)}
              {tasks.length>3&&!pending&&<button type="button" className="min-h-10 px-4 text-xs text-teal-700" onClick={()=>setExpandedGroups(g=>({...g,[group]:!g[group]}))}>{expandedGroups[group]?'Mostrar menos':`Ver mais ${tasks.length-3} atividades`}</button>}
            </div>
          </div>;
        })}
        {pending && visibleTasks.every(t => t.status === 'concluida') && <p className="px-4 py-3 text-xs text-teal-800">Nenhuma atividade pendente.</p>}
        {onLayoutChange && <button type="button" className="flex min-h-11 items-center gap-2 px-4 text-sm font-medium text-teal-700" disabled={busy||documentBusy} onClick={()=>addTask()}><Plus size={16}/>Adicionar atividade</button>}
        {draft && !draft.id && <WikiPilotTaskEditor key={draft.task_key} draft={draft} original={JSON.parse(baseline.current)} setDraft={setDraft} busy={busy} initialField="title" onSave={()=>void save(draft)} onClose={close} history={[]} historyError=""/>}
      </>}
      <p className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-400">{insurance ? 'Mesmas atividades de Testes e Tarefas · seis frentes com liberação própria · marcos documentais não certificam ativação no SFMC.' : 'Mesmas atividades de Testes e Tarefas · 3 cards no piloto · quarto card e GRUPO_2 ficam para depois.'}</p>
    </div>
    {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
    {message && <p role="status" className="border-t border-cyan-100 bg-cyan-50/50 px-4 py-3 text-xs text-cyan-800">{message}</p>}
  </section>;
}
