import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { saveWork, } from '../growth-learning/development/workService';
import { TASK_STATUS, taskError, taskHistory, type TaskEvent } from '../growth-learning/development/developmentService';
import { safeWorkUrl, type WorkItem } from '../growth-learning/development/workModel';
import { loadPilotTasks } from './wikiPilotService';
import { brazilToday, canQuickComplete, completionDate, displayCompletionDate, PILOT_GROUPS, PILOT_KEYS, pilotGroup, pilotProgress } from './wikiPilotModel';

const control = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-cyan-500';
const button = 'rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50';

/** The same task records and guarded writer as Testes e Tarefas. */
export function WikiPilotChecklist({ loader = loadPilotTasks, writer = saveWork, historyLoader = taskHistory }: { loader?: typeof loadPilotTasks; writer?: typeof saveWork; historyLoader?: typeof taskHistory }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPilotTasks>> | null>(null);
  const [opened, setOpened] = useState(false), [pending, setPending] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [draft, setDraft] = useState<WorkItem | null>(null);
  const [history, setHistory] = useState<TaskEvent[] | null>(null), [historyError, setHistoryError] = useState('');
  const generation = useRef(0), baseline = useRef('');
  const changed = Boolean(draft && JSON.stringify(draft) !== baseline.current);
  const load = async () => {
    const g = ++generation.current;
    try { const next = await loader(); if (g === generation.current) { setData(next); setError(''); } }
    catch { if (g === generation.current) setError('Não foi possível consultar o checklist. Tente atualizar.'); }
  };
  useEffect(() => { void load(); return () => { generation.current++; }; }, [loader]);
  useEffect(() => { const focus = () => { if (!busy && !changed) void load(); }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, [loader, busy, changed]);
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
  const progress = pilotProgress(data?.tasks || []);
  const openTask = (task: WorkItem, completing = false) => {
    if (busy) return;
    if (changed) { setMessage('Salve ou descarte a edição atual antes de abrir outra atividade.'); return; }
    const next = { ...task, details: { ...task.details } };
    baseline.current = JSON.stringify(next);
    if (completing) { next.status = 'concluida'; next.details.completed_on = completionDate(task) || brazilToday(); }
    setDraft(next); setMessage(''); setError('');
  };
  const save = async (task: WorkItem) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await writer(task);
      setData(current => current && { ...current, tasks: current.tasks.map(t => t.id === saved.id ? saved : t) });
      baseline.current = ''; setDraft(null); setMessage(saved.status === 'concluida' ? 'Conclusão e data registradas.' : 'Atividade atualizada.');
    } catch (e) { setError(taskError(e)); }
    finally { setBusy(false); }
  };
  const toggle = (task: WorkItem) => {
    if (changed) { setMessage('Salve ou descarte a edição atual antes de alterar outra atividade.'); return; }
    if (task.status === 'concluida') { void save({ ...task, status: 'planejando', completed_criteria: [] }); return; }
    if (canQuickComplete(task)) void save({ ...task, status: 'concluida' });
    else openTask(task, true);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const date = new FormData(event.currentTarget).get('completed_on');
    void save(draft.status === 'concluida' && typeof date === 'string' ? { ...draft, details: { ...draft.details, completed_on: date } } : draft);
  };
  const label = data?.canEdit ? progress.validated ? 'Validado na seedlist' : progress.ready ? 'Pronto para testar na seedlist' : `Preparação: ${progress.done}/${progress.total}` : data ? 'Acesso administrativo' : 'Consultar atividades';
  return <section className="my-6 rounded-xl border border-cyan-100 bg-white text-slate-700" aria-label="Checklist do piloto na seedlist">
    <details open={opened} onToggle={e => setOpened(e.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-xl bg-cyan-50/50 px-4 py-3 text-xs marker:hidden"><span className="flex items-center gap-2 font-semibold"><span aria-hidden>{opened ? '▾' : '▸'}</span><CheckCheck size={15} className="text-cyan-700"/> Checklist do piloto · Seedlist</span><span className="flex items-center gap-3"><span className="rounded-md bg-white px-2 py-1 font-medium text-cyan-800">{label}</span><span className="text-slate-500">{opened ? 'Recolher' : 'Ver atividades'}</span></span></summary>
      <div className="border-t border-cyan-100 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">3 cards · contrato vigente · construção no GaaS e validação no SFMC registradas separadamente.</p><div className="flex items-center gap-2"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={pending} onChange={e => setPending(e.target.checked)} disabled={changed}/> Só pendentes</label><button type="button" className={button} disabled={busy || changed} onClick={() => void load()} aria-label="Atualizar checklist"><RefreshCw size={13}/></button></div></div>
        {!data && !error && <p role="status" className="py-3 text-xs">Consultando atividades…</p>}
        {data && !data.canEdit && <p className="py-3 text-xs text-slate-500">O checklist segue as permissões administrativas de Testes e Tarefas.</p>}
        {data?.canEdit && <><div className="mb-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-slate-50 px-2 py-1">Preparação {progress.done}/{progress.total}</span><span className="rounded-md bg-slate-50 px-2 py-1">Validação {progress.validationDone}/{progress.validationTotal}</span></div>
          {data.tasks.length < PILOT_KEYS.length && <p className="mb-3 text-xs text-amber-800">Há atividades do piloto ainda não cadastradas. O marco de prontidão permanece pendente.</p>}
          <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200"><table className="w-full border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th className="w-10 p-2"><span className="sr-only">Conclusão</span></th><th className="p-2">Atividade</th><th className="w-28 p-2">Estado</th><th className="w-28 whitespace-nowrap p-2">Concluída em</th></tr></thead><tbody>
            {Object.entries(PILOT_GROUPS).map(([group, name]) => {
              const tasks = data.tasks.filter(t => pilotGroup(t.task_key) === group && (!pending || t.status !== 'concluida')).sort((a,b) => PILOT_KEYS.indexOf(a.task_key) - PILOT_KEYS.indexOf(b.task_key));
              if (!tasks.length) return null;
              return <Fragment key={group}><tr><th colSpan={4} className="border-t bg-slate-50/70 px-3 py-2 text-[11px] font-semibold text-slate-500">{name}{group === 'later' && ' · não bloqueia o teste da seedlist'}</th></tr>{tasks.map(task => <Fragment key={task.id}><tr className="border-t border-slate-100 hover:bg-cyan-50/30"><td className="p-2 text-center"><input type="checkbox" aria-label={`Concluir ${task.title}`} checked={task.status === 'concluida'} disabled={busy} onChange={() => toggle(task)} className="accent-cyan-700"/></td><td className="p-2"><button type="button" className="text-left font-medium text-slate-700 hover:text-cyan-800 hover:underline" onClick={() => openTask(task)}>{task.title}</button>{task.status === 'bloqueada' && <p className="mt-1 text-[11px] text-amber-800">{task.blocked_reason}</p>}</td><td className={`p-2 ${task.status === 'concluida' ? 'text-teal-700' : task.status === 'bloqueada' ? 'text-amber-800' : 'text-slate-500'}`}>{TASK_STATUS[task.status]}</td><td className="whitespace-nowrap p-2 tabular-nums text-slate-500">{displayCompletionDate(task)}</td></tr>
                {draft?.id === task.id && <tr><td colSpan={4} className="border-t bg-slate-50 p-3"><form onSubmit={submit} className="space-y-3"><div className="flex flex-wrap justify-between gap-2"><strong>{task.title}</strong><span className="text-[11px] text-slate-400">Revisão {draft.revision}</span></div><p className="text-xs text-slate-500">{task.description}</p><fieldset disabled={busy} className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><label>Estado<select className={`${control} mt-1`} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as WorkItem['status'], details: { ...draft.details, ...(e.target.value === 'concluida' ? { completed_on: completionDate(draft) || brazilToday() } : {}) } })}>{Object.entries(TASK_STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label><label>Responsável<input className={`${control} mt-1`} value={draft.owner_label || ''} onChange={e => setDraft({ ...draft, owner_label: e.target.value || null })}/></label>{draft.status === 'concluida' && <label>Data da conclusão<input type="date" name="completed_on" required className={`${control} mt-1`} min="1900-01-01" max={brazilToday()} value={draft.details.completed_on || ''} onChange={e => setDraft({ ...draft, details: { ...draft.details, completed_on: e.target.value } })}/></label>}</div>
                  <fieldset><legend className="mb-2 font-medium">Critérios de conclusão</legend>{draft.acceptance_criteria.map((criterion, i) => <label key={i} className="my-1 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={draft.completed_criteria.includes(i)} onChange={e => setDraft({ ...draft, completed_criteria: e.target.checked ? [...draft.completed_criteria, i] : draft.completed_criteria.filter(x => x !== i) })}/>{criterion}</label>)}</fieldset>
                  {!!draft.dependencies.length && <p className="text-slate-500">Dependências: {draft.dependencies.join(' · ')}</p>}
                  {draft.status === 'bloqueada' && <label className="block">Impedimento<textarea required className={`${control} mt-1`} value={draft.blocked_reason || ''} onChange={e => setDraft({ ...draft, blocked_reason: e.target.value })}/></label>}
                  <label className="block">Entrega, evidência e limitações<textarea required={draft.status === 'concluida'} className={`${control} mt-1 min-h-20`} value={draft.resolution || ''} onChange={e => setDraft({ ...draft, resolution: e.target.value })}/></label>
                  {draft.links.map((link,i) => { const href = safeWorkUrl(link.url); return href ? <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="mr-3 inline-flex items-center gap-1 text-cyan-800 underline">{link.label}<ExternalLink size={11}/></a> : null; })}
                </fieldset><div className="flex flex-wrap gap-2"><button type="submit" disabled={busy} className="rounded-md bg-cyan-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar atividade'}</button><button type="button" disabled={busy} className={button} onClick={() => { setDraft(null); baseline.current = ''; setMessage(''); }}>{changed ? 'Descartar edição' : 'Fechar detalhes'}</button><a href={`?view=learning&section=investigations&dev_task=${task.id}`} className={`${button} no-underline`}>Abrir em Testes e Tarefas</a></div>
                <details className="border-t pt-2"><summary className="cursor-pointer text-slate-500">Histórico de conclusão e reabertura</summary>{historyError && <p role="alert">{historyError}</p>}{!history && !historyError && <p>Consultando histórico…</p>}{history?.map(event => <p key={event.id} className="mt-2 text-[11px] text-slate-500">Revisão {event.revision} · {new Date(event.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {TASK_STATUS[event.after_data.status]} · conclusão: {displayCompletionDate(event.after_data as WorkItem)}{event.after_data.resolution ? ` · ${event.after_data.resolution}` : ''}</p>)}</details></form></td></tr>}
              </Fragment>)}</Fragment>;
            })}
          </tbody></table></div>
          {pending && data.tasks.every(t => t.status === 'concluida') && <p className="mt-3 text-xs text-teal-800">Nenhuma atividade pendente.</p>}
        </>}
        {error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}{message && <p role="status" className="mt-3 text-xs text-cyan-800">{message}</p>}
        <p className="mt-3 text-[11px] leading-5 text-slate-500">As mesmas atividades de Testes e Tarefas. Concluir exige critérios atendidos e evidência; reabrir preserva a data anterior no histórico. Quarto card e GRUPO_2 ficam fora deste piloto.</p>
      </div>
    </details>
  </section>;
}
