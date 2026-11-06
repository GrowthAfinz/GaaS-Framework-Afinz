import { useEffect, useId, useState, type ReactNode } from 'react';
import { Check, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { TASK_STATUS, type TaskEvent } from '../growth-learning/development/developmentService';
import { safeWorkUrl, type WorkItem } from '../growth-learning/development/workModel';
import { brazilToday, completionDate, displayCompletionDate } from './wikiPilotModel';

const input = 'w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600';
const icon = 'inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 disabled:opacity-40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11';

function Field({ label, value, children, initiallyEditing = false }: { label: string; value: ReactNode; children: (id: string) => ReactNode; initiallyEditing?: boolean }) {
  const [editing, setEditing] = useState(initiallyEditing);
  useEffect(() => { if (initiallyEditing) setEditing(true); }, [initiallyEditing]);
  const id = useId();
  return <div className="min-w-0">
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={editing ? id : undefined} className="text-xs font-medium text-slate-500">{label}</label>
      <button type="button" aria-label={`${editing ? 'Terminar edição de' : 'Editar'} ${label}`} aria-expanded={editing} className={icon} onClick={() => setEditing(!editing)}>{editing ? <Check size={14}/> : <Pencil size={14}/>}</button>
    </div>
    {editing ? children(id) : <div className="break-words whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || <span className="text-slate-400">Não informado</span>}</div>}
  </div>;
}

export function WikiPilotTaskEditor({ draft, original, setDraft, busy, initialField, onSave, onClose, history, historyError }: {
  draft: WorkItem; original: WorkItem; setDraft: (task: WorkItem) => void; busy: boolean; initialField: 'title' | null;
  onSave: () => void; onClose: () => void; history: TaskEvent[] | null; historyError: string;
}) {
  const criteriaChanged = JSON.stringify(draft.acceptance_criteria) !== JSON.stringify(original.acceptance_criteria);
  const update = (patch: Partial<WorkItem>) => setDraft({ ...draft, ...patch });
  return <form onSubmit={e => { e.preventDefault(); onSave(); }} className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
    <fieldset disabled={busy} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Detalhes da atividade</span><span>Revisão {draft.revision}</span></div>
      <Field label="Título" value={draft.title} initiallyEditing={initialField === 'title'}>{id => <input id={id} autoFocus required minLength={5} className={input} value={draft.title} onChange={e => update({ title: e.target.value })}/>}</Field>
      <Field label="Descrição" value={draft.description}>{id => <textarea id={id} autoFocus rows={3} className={input} value={draft.description} onChange={e => update({ description: e.target.value })}/>}</Field>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Estado" value={TASK_STATUS[draft.status]}>{id => <select id={id} autoFocus className={input} value={draft.status} onChange={e => update({ status: e.target.value as WorkItem['status'], details: { ...draft.details, ...(e.target.value === 'concluida' ? { completed_on: completionDate(draft) || brazilToday() } : {}) } })}>{Object.entries(TASK_STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>}</Field>
        <Field label="Responsável" value={draft.owner_label}>{id => <input id={id} autoFocus className={input} value={draft.owner_label || ''} onChange={e => update({ owner_label: e.target.value || null })}/>}</Field>
        {draft.status === 'concluida' && <Field label="Data da conclusão" value={displayCompletionDate(draft)} initiallyEditing={!completionDate(draft) && original.status !== 'concluida'}>{id => <input id={id} autoFocus type="date" required min="1900-01-01" max={brazilToday()} className={input} value={draft.details.completed_on || ''} onChange={e => update({ details: { ...draft.details, completed_on: e.target.value } })}/>}</Field>}
      </div>
      <details open className="border-t border-slate-200 pt-2">
        <summary className="cursor-pointer py-2 text-xs font-medium text-slate-600">Critérios de conclusão · {draft.completed_criteria.length}/{draft.acceptance_criteria.filter(c => c.trim()).length}</summary>
        <Field label="Critérios" value={<div className="space-y-2">{draft.acceptance_criteria.map((criterion, i) => criterion.trim() && <label key={i} className="flex items-start gap-2"><input type="checkbox" className="mt-1 shrink-0 accent-cyan-700" disabled={criteriaChanged} checked={draft.completed_criteria.includes(i)} onChange={e => update({ completed_criteria: e.target.checked ? [...draft.completed_criteria, i] : draft.completed_criteria.filter(x => x !== i) })}/><span>{criterion}</span></label>)}{!draft.acceptance_criteria.length && <span className="text-slate-400">Nenhum critério cadastrado</span>}</div>}>{id => <><textarea id={id} autoFocus rows={4} className={input} defaultValue={draft.acceptance_criteria.join('\n')} onChange={e => update({ acceptance_criteria: e.target.value.split('\n'), completed_criteria: [] })}/><p className="mt-1 text-xs text-slate-500">Um critério por linha. Salve os novos critérios antes de marcar sua conclusão.</p></>}</Field>
        {criteriaChanged && <p role="status" className="mt-2 text-xs text-amber-800">Os critérios mudaram. As marcações anteriores serão reiniciadas; uma atividade concluída precisa ser reaberta antes de salvar esta mudança.</p>}
      </details>
      <Field label="Entrega, evidência e limitações" value={draft.resolution}>{id => <textarea id={id} autoFocus rows={3} required={draft.status === 'concluida'} className={input} value={draft.resolution || ''} onChange={e => update({ resolution: e.target.value || null })}/>}</Field>
      {draft.status === 'bloqueada' && <Field label="Impedimento" value={draft.blocked_reason} initiallyEditing={!draft.blocked_reason}>{id => <textarea id={id} autoFocus required rows={2} className={input} value={draft.blocked_reason || ''} onChange={e => update({ blocked_reason: e.target.value })}/>}</Field>}
      <details className="border-t border-slate-200 pt-2">
        <summary className="cursor-pointer py-2 text-xs font-medium text-slate-600">Dependências e referências · {draft.dependencies.length + draft.links.length}</summary>
        <div className="space-y-3">
          <Field label="Dependências" value={draft.dependencies.join('\n')}>{id => <><textarea id={id} autoFocus rows={2} className={input} defaultValue={draft.dependencies.join('\n')} onChange={e => update({ dependencies: e.target.value.split('\n') })}/><p className="mt-1 text-xs text-slate-500">Uma chave de atividade por linha. A existência e os ciclos são conferidos ao salvar.</p></>}</Field>
          <Field label="Referências" value={<ul className="space-y-1">{draft.links.map((link,i) => { const href = safeWorkUrl(link.url); return <li key={i}>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-cyan-800 underline"><span className="break-all">{link.label}</span><ExternalLink size={12} className="shrink-0"/></a> : <span>{link.label || 'Referência sem endereço válido'}</span>}</li>; })}{!draft.links.length && <li className="text-slate-400">Nenhuma referência cadastrada</li>}</ul>}>{id => <div id={id} className="space-y-3">{draft.links.map((link,i) => <div key={i} className="flex min-w-0 items-start gap-1"><div className="min-w-0 flex-1 space-y-2"><input aria-label={`Título da referência ${i+1}`} className={input} required value={link.label} onChange={e => update({ links: draft.links.map((l,j) => j === i ? { ...l, label: e.target.value } : l) })}/><input aria-label={`Endereço da referência ${i+1}`} className={input} required placeholder="https:// ou caminho de nota" value={link.url} onChange={e => update({ links: draft.links.map((l,j) => j === i ? { ...l, url: e.target.value } : l) })}/></div><button type="button" aria-label={`Remover referência ${i+1}`} className={icon} onClick={() => update({ links: draft.links.filter((_,j) => j !== i) })}><Trash2 size={14}/></button></div>)}<button type="button" className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-cyan-800" onClick={() => update({ links: [...draft.links, { label: '', url: '', kind: 'evidence', state: 'suggested' }] })}><Plus size={14}/>Adicionar referência</button></div>}</Field>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
        <button type="submit" className="min-h-10 rounded-md bg-cyan-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar atividade'}</button>
        <button type="button" className="min-h-10 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100" onClick={onClose}>Cancelar</button>
        {draft.id && <a href={`?view=learning&section=investigations&dev_task=${draft.id}`} className="min-h-10 content-center text-xs text-cyan-800 underline" onClick={e => { if (JSON.stringify(draft) !== JSON.stringify(original)) { e.preventDefault(); } }}>Abrir em Testes e Tarefas</a>}
      </div>
      {JSON.stringify(draft) !== JSON.stringify(original) && <p className="text-xs text-slate-500">Há alterações não salvas. Salve ou cancele antes de abrir em Testes e Tarefas.</p>}
    </fieldset>
    <details className="mt-3 border-t border-slate-200 pt-2"><summary className="cursor-pointer py-2 text-xs text-slate-500">Histórico de alterações</summary>{historyError && <p role="alert" className="text-xs text-rose-700">{historyError}</p>}{!history && !historyError && <p className="text-xs">Consultando histórico…</p>}{history?.map(event => <p key={event.id} className="mt-2 text-xs text-slate-500">Revisão {event.revision} · {new Date(event.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {TASK_STATUS[event.after_data.status]} · conclusão: {displayCompletionDate(event.after_data as WorkItem)}{event.after_data.resolution ? ` · ${event.after_data.resolution}` : ''}</p>)}</details>
  </form>;
}
