/**
 * Janela da Tarefa: a mesma em Tarefas e atividades, no kanban da Visão Daily e na Wiki (decisão de 17/11/2026).
 * Abre por cima da tela (fundo escurecido), fecha com Esc, botão ou clique fora e devolve o foco ao card.
 * Sub Tarefas são itens de checklist: caixa, título, responsável e prazo; grupos renomeáveis; um clique conclui.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, Copy, Link2, ListChecks, MessageSquare,
  MoreHorizontal, Plus, Trash2, User, X,
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { TASK_PRIORITY, TASK_STATUS, taskError } from './developmentService';
import { saveTaskTree } from './workService';
import { subtaskProgress, type WorkItem } from './workModel';
import {
  addComment, createPerson, createSubtask, deleteComment, loadSubtasks, loadTask, loadTaskBundle, patchTask, taskLink,
  type Person, type TaskBundle,
} from './taskModalService';

interface Props {
  taskId: string;
  onClose: () => void;
  /** Avisa a tela de origem do que mudou (Tarefa e Sub Tarefas), para ela atualizar sem recarregar tudo. */
  onChanged?: (tasks: WorkItem[]) => void;
  onOpenDay?: (day: string, projectId: string) => void;
}

const STATUS_COLOR: Record<string, string> = { backlog: '#64748b', planejando: '#7c3aed', pronta: '#0284c7', em_execucao: '#ca8a04', bloqueada: '#dc2626', concluida: '#16a34a', cancelada: '#a8a29e' };
const closed = (s: string) => s === 'concluida' || s === 'cancelada';
const br = (d?: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');
const NO_GROUP = '';

export function TaskModal({ taskId, onClose, onChanged, onOpenDay }: Props) {
  const [currentId, setCurrentId] = useState(taskId);
  const [b, setB] = useState<TaskBundle | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [preview, setPreview] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newGroup, setNewGroup] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [nonce, setNonce] = useState(0);
  const busyRef = useRef(false);
  const resolutionDraft = useRef<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null);

  useEffect(() => { setCurrentId(taskId); }, [taskId]);
  const reload = useCallback(async (id = currentId) => {
    try { setB(await loadTaskBundle(id)); setError(''); } catch (e) { setError(taskError(e)); }
  }, [currentId]);
  useEffect(() => { setB(null); void reload(currentId); }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void supabase.auth.getSession().then(s => setMe(s.data.session?.user?.id ?? null)); }, []);

  // Link direto: ?task=<id> enquanto a janela está aberta; voltar do navegador fecha.
  useEffect(() => {
    const url = new URL(window.location.href);
    const had = url.searchParams.get('task');
    url.searchParams.set('task', currentId); url.searchParams.delete('dev_task');
    window.history.replaceState(window.history.state, '', url);
    return () => {
      const u = new URL(window.location.href);
      if (u.searchParams.get('task') === currentId) { if (had && had !== currentId) u.searchParams.set('task', had); else u.searchParams.delete('task'); window.history.replaceState(window.history.state, '', u); }
    };
  }, [currentId]);

  // Teclado: Esc fecha (menus primeiro); Tab fica dentro da janela; foco volta ao card de origem ao fechar.
  const menus = useRef({ menu, rowMenu }); menus.current = { menu, rowMenu };
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const prev = opener.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        const a = document.activeElement as HTMLElement | null;
        if (a && box.current?.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !['checkbox', 'radio'].includes((a as HTMLInputElement).type)) {
          if (a.tagName !== 'SELECT') a.dataset.cancel = '1';
          a.blur();
          return;
        }
        if (menus.current.menu) setMenu(false); else if (menus.current.rowMenu) setRowMenu(null); else closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !box.current) return;
      const f = [...box.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(el => !el.hasAttribute('disabled'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); prev?.focus?.(); };
  }, []);
  useEffect(() => { if (b) window.setTimeout(() => box.current?.querySelector<HTMLElement>('#task-modal-title')?.focus(), 0); }, [b?.task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text: string) => { setNote(text); window.setTimeout(() => setNote(n => (n === text ? '' : n)), 4000); };
  const fail = async (e: unknown) => {
    const m = String((e as { message?: string })?.message || e);
    if (m.includes('revision_conflict')) { await reload(); setError('Alguém mudou esta Tarefa enquanto você editava. Recarreguei; refaça a última alteração.'); return; }
    setError(taskError(e));
  };
  /** Salva campos de uma linha (a Tarefa ou uma Sub Tarefa) e atualiza a janela e a tela de origem. */
  const save = async (target: WorkItem, patch: Record<string, unknown>, ok?: string) => {
    if (!b?.canEdit) { setError('Seu acesso permite ler, mas não editar.'); return null; }
    if (busyRef.current) return null;
    if ('title' in patch) {
      const len = String(patch.title || '').trim().length;
      if (len < 5 || len > 180) { setError('O título precisa ter de 5 a 180 letras.'); setNonce(n => n + 1); return null; }
    }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const saved = await patchTask(target, patch);
      const cascade = saved.id === b.task.id && !saved.parent_task_id && b.subtasks.length > 0 && ['initiative_id', 'front_key', 'project_ids', 'workspace'].some(k => k in patch);
      const kidsNow = cascade ? await loadSubtasks(saved.id) : null;
      setB(cur => cur && (saved.id === cur.task.id ? { ...cur, task: saved, subtasks: kidsNow || cur.subtasks } : { ...cur, subtasks: cur.subtasks.map(s => (s.id === saved.id ? saved : s)) }));
      onChanged?.([saved, ...(kidsNow || [])]);
      if (ok) flash(ok);
      return saved;
    } catch (e) { await fail(e); return null; } finally { busyRef.current = false; setBusy(false); }
  };

  const t = b?.task;
  const progress = useMemo(() => (t && b ? subtaskProgress(t.id, b.subtasks) : { done: 0, total: 0, blocked: 0 }), [t, b]);
  const groupLabels = useMemo(() => {
    const declared = (() => { try { const v = JSON.parse(String(t?.details?.subtask_groups || '[]')); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } })();
    const used = (b?.subtasks || []).map(s => s.subtask_group || NO_GROUP);
    const all = [...declared, ...used.filter(g => !declared.includes(g))];
    return [...new Set(all.length ? all : [NO_GROUP])];
  }, [t, b]);

  if (!b || !t) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={box} role="dialog" aria-modal="true" aria-label="Tarefa" className="w-full max-w-3xl rounded-xl bg-white p-6 text-sm text-slate-600 shadow-2xl">
          {error ? <p role="alert" className="text-red-700">{error}</p> : 'Carregando Tarefa…'}
          <button className="ml-3 rounded px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>Fechar</button>
        </div>
      </div>
    );
  }

  const ro = !b.canEdit || busy;
  const front = b.fronts.find(f => f.id === t.front_key)?.name || (t.front_key === 'gaas' ? 'GaaS (SDD)' : '');
  const initiative = b.initiatives.find(i => i.id === t.initiative_id);
  const projectNames = (t.project_ids || []).map(id => b.projects.find(p => p.id === id)?.name).filter(Boolean) as string[];
  const isSub = Boolean(b.parent);
  /** Tarefa fechada não recebe nem reabre Sub Tarefa (a regra também vale no servidor). */
  const parentClosed = !isSub && closed(t.status);
  const people = b.people;
  const criteria = t.acceptance_criteria || [];
  const marked = new Set(t.completed_criteria || []);
  const kids = b.subtasks;

  const toggleList = (list: string[] | undefined, v: string) => ((list || []).includes(v) ? (list || []).filter(x => x !== v) : [...(list || []), v]);
  const personPick = async (target: WorkItem, value: string) => {
    if (value === '__new__') {
      const name = window.prompt('Nome da pessoa (pode não ter conta no GaaS):')?.trim();
      if (!name) return;
      try { const p = await createPerson(name); setB(cur => cur && { ...cur, people: [...cur.people, p].sort((a, c) => a.name.localeCompare(c.name, 'pt-BR')) }); await save(target, { owner_label: p.name }); }
      catch (e) { setError(String((e as { message?: string })?.message || '').includes('person_name_taken') ? 'Já existe alguém com esse nome na lista.' : 'Não foi possível adicionar a pessoa.'); }
      return;
    }
    await save(target, { owner_label: value || '' });
  };
  // Chamado como função (não como componente) para o select não ser recriado a cada render e manter o foco.
  const PersonSelect = ({ target, small }: { target: WorkItem; small?: boolean }) => (
    <select aria-label={`Responsável de ${target.title}`} disabled={ro} value={target.owner_label || ''} onChange={e => void personPick(target, e.target.value)}
      className={`${small ? 'w-[7.5rem] shrink-0 truncate text-xs' : 'w-full text-sm'} rounded border border-transparent bg-transparent px-1 py-0.5 ${target.owner_label ? 'text-slate-700' : 'text-slate-400'} hover:border-slate-200 focus:border-slate-300`}>
      <option value="">{small ? 'Responsável' : 'Sem responsável'}</option>
      {target.owner_label && !people.some(p => p.name === target.owner_label) && <option value={target.owner_label}>{target.owner_label}</option>}
      {people.map((p: Person) => <option key={p.id} value={p.name}>{p.name}{p.has_account ? '' : ' (sem conta)'}</option>)}
      <option value="__new__">+ Usar outro nome…</option>
    </select>
  );

  /* ---------- Sub Tarefas ---------- */
  const addSub = async (group: string) => {
    const title = (drafts[group] || '').trim();
    if (!title || busyRef.current) return;
    if (title.length < 5) { setError('O título precisa de pelo menos 5 letras.'); return; }
    if (parentClosed) { setError('A Tarefa está fechada. Reabra a Tarefa antes de acrescentar Sub Tarefas.'); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const pos = Math.max(0, ...kids.map(k => k.position || 0)) + 1;
      const sub = await createSubtask(t, title, group || null, pos);
      setB(cur => cur && { ...cur, subtasks: [...cur.subtasks, sub] });
      setDrafts(d => ({ ...d, [group]: '' }));
      onChanged?.([sub]);
    } catch (e) { await fail(e); } finally { busyRef.current = false; setBusy(false); }
  };
  const toggleSub = async (s: WorkItem) => {
    if (s.status === 'concluida' && parentClosed) { setError('A Tarefa está fechada. Reabra a Tarefa antes de reabrir uma Sub Tarefa.'); return; }
    if (s.status === 'concluida') await save(s, { status: 'em_execucao' }, 'Sub Tarefa reaberta.');
    else await save(s, { status: 'concluida' });
  };
  const blockSub = async (s: WorkItem) => {
    if (s.status === 'bloqueada') { await save(s, { status: 'em_execucao', blocked_reason: '' }, 'Sub Tarefa desbloqueada.'); return; }
    const reason = window.prompt('O que está travando esta Sub Tarefa?')?.trim();
    if (reason) await save(s, { status: 'bloqueada', blocked_reason: reason });
  };
  const saveGroups = async (labels: string[]) => save(t, { details: { subtask_groups: JSON.stringify(labels.filter(Boolean)) } });
  const renameGroup = async (from: string, to: string) => {
    to = to.trim(); if (!to || to === from) return;
    await saveGroups(groupLabels.map(g => (g === from ? to : g)));
    for (const s of kids.filter(k => (k.subtask_group || NO_GROUP) === from)) await save(s, { subtask_group: to });
  };
  const promote = async (s: WorkItem) => {
    if (!window.confirm(`Transformar "${s.title}" em Tarefa? Ela sai do checklist e vira card próprio, com o mesmo histórico e vínculos.`)) return;
    const saved = await save(s, { parent_task_id: null });
    if (saved) {
      setB(cur => cur && { ...cur, subtasks: cur.subtasks.filter(k => k.id !== s.id) });
      onChanged?.([saved, { ...t, revision: t.revision }]);
    }
  };
  /** "Transformar em Tarefa" com a janela aberta na própria Sub Tarefa: recarrega como Tarefa e atualiza o pai antigo. */
  const promoteSelf = async () => {
    const oldParent = b.parent;
    const saved = await save(t, { parent_task_id: null }, 'Agora é uma Tarefa com card próprio.');
    if (!saved) return;
    await reload(saved.id);
    if (oldParent) { try { onChanged?.([saved, await loadTask(oldParent.id)]); } catch { /* o card do pai atualiza no próximo carregamento */ } }
  };

  /* ---------- critérios, entrega e conclusão ---------- */
  const setCriteria = async (list: string[]) => {
    if (marked.size && !window.confirm('Mudar os critérios desmarca os que já estavam atendidos. Continuar?')) return;
    await save(t, { acceptance_criteria: list });
  };
  const toggleCriterion = async (i: number) => save(t, { completed_criteria: marked.has(i) ? [...marked].filter(x => x !== i) : [...marked, i] });
  /** Conclui levando junto a entrega que ainda está sendo digitada (o clique não perde o texto nem precisa ser repetido). */
  const conclude = async () => {
    const res = (resolutionDraft.current ?? t.resolution ?? '').trim();
    if (!res) { setError('Escreva a entrega antes de concluir.'); return; }
    const patch: Record<string, unknown> = { status: 'concluida' };
    if (res !== (t.resolution || '').trim()) patch.resolution = res;
    if (await save(t, patch, 'Tarefa concluída.')) resolutionDraft.current = null;
  };
  const finish = () => (isSub ? save(t, { status: 'concluida' }) : conclude());
  const reopen = () => (isSub && b.parent && closed(b.parent.status)
    ? (setError('A Tarefa pai está fechada. Reabra a Tarefa antes de reabrir esta Sub Tarefa.'), Promise.resolve(null))
    : save(t, { status: 'em_execucao' }, isSub ? 'Sub Tarefa reaberta.' : 'Tarefa reaberta.'));

  /* ---------- ações ---------- */
  const duplicate = async () => {
    setMenu(false); setBusy(true);
    try {
      // A cópia não leva o que identifica a original nem resultado: pergunta da Wiki, nota de origem, fase, veredito, leitura.
      const RESULT_KEYS = ['completed_on', 'question', 'origin_note', 'phase', 'verdict', 'reading', 'result', 'wiki_pilot_note', 'wiki_pilot_group'];
      const details = Object.fromEntries(Object.entries(t.details || {}).filter(([k]) => !RESULT_KEYS.includes(k)));
      const r = await saveTaskTree({
        task: { title: `${t.title.slice(0, 172).trimEnd()} (cópia)`, description: t.description, next_action: t.next_action, priority: t.priority, work_type: t.work_type, initiative_id: t.initiative_id,
          front_key: t.front_key, project_ids: t.project_ids, partner_keys: t.partner_keys, acceptance_criteria: t.acceptance_criteria, details, dependencies: t.dependencies, workspace: t.workspace },
        subtasks: kids.filter(k => k.status !== 'cancelada').map(k => ({ title: k.title, subtask_group: k.subtask_group, owner_label: k.owner_label })),
      });
      onChanged?.([r.task, ...r.subtasks]);
      flash('Tarefa duplicada sem conclusão, entrega nem registros da Daily.');
      setCurrentId(r.task.id);
    } catch (e) { await fail(e); } finally { setBusy(false); }
  };
  const copyLink = async () => { setMenu(false); try { await navigator.clipboard.writeText(taskLink(t.id)); flash('Link copiado.'); } catch { flash(taskLink(t.id)); } };
  const cancelTask = async () => {
    setMenu(false);
    const why = window.prompt('Por que esta Tarefa sai do plano? (fica no histórico como Cancelada)')?.trim();
    if (why) await save(t, { status: 'cancelada', resolution: why }, 'Tarefa cancelada.');
  };
  const send = async () => {
    const body = comment.trim(); if (!body) return;
    try { const c = await addComment(t.id, body); setB(cur => cur && { ...cur, comments: [...cur.comments, c] }); setComment(''); } catch (e) { await fail(e); }
  };

  const label = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const field = 'flex items-center gap-2 text-sm';
  const chip = 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700';

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-2 sm:p-6" onPointerDown={e => {
      if (e.target !== e.currentTarget) return;
      // Sai do campo antes de fechar, para o texto digitado ser salvo (o blur não acontece sozinho se a janela some).
      const a = document.activeElement as HTMLElement | null;
      if (a && box.current?.contains(a)) a.blur();
      onClose();
    }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="relative my-4 w-full max-w-4xl rounded-xl bg-white text-slate-800 shadow-2xl">
        {/* topo: contexto, status, ações */}
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:px-6">
          {isSub && b.parent && <button className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100" onClick={() => setCurrentId(b.parent!.id)}><ChevronRight size={12} className="rotate-180" />Sub Tarefa de <b className="text-slate-700">{b.parent.title}</b></button>}
          {!isSub && <span className="truncate">{[front, initiative?.title, projectNames.join(', ')].filter(Boolean).join(' › ') || 'Sem frente'}</span>}
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[t.status] }} />
            <select aria-label="Status" disabled={ro} value={t.status} onChange={e => void (e.target.value === 'concluida' ? finish() : t.status === 'concluida' && e.target.value !== 'cancelada' && isSub && b.parent && closed(b.parent.status) ? reopen() : e.target.value === 'bloqueada' ? (() => { const r = window.prompt('O que está travando?')?.trim(); return r ? save(t, { status: 'bloqueada', blocked_reason: r }) : undefined; })() : save(t, { status: e.target.value }))}
              className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs font-medium text-slate-700">
              {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </span>
          <div className="relative">
            <button aria-label="Ações da Tarefa" aria-expanded={menu} className="rounded p-1.5 hover:bg-slate-100" onClick={() => setMenu(m => !m)}><MoreHorizontal size={16} /></button>
            {menu && <div role="menu" className="absolute right-0 top-8 z-10 w-56 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-xl">
              <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => void copyLink()}><Link2 size={14} />Copiar link</button>
              {!isSub && <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => void duplicate()}><Copy size={14} />Duplicar (sem conclusão)</button>}
              {isSub && <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setMenu(false); void promoteSelf(); }}><ArrowUpRight size={14} />Transformar em Tarefa</button>}
              <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-red-700 hover:bg-red-50" onClick={() => void cancelTask()}><Trash2 size={14} />Cancelar {isSub ? 'Sub Tarefa' : 'Tarefa'}</button>
            </div>}
          </div>
          <button aria-label="Fechar" className="rounded p-1.5 hover:bg-slate-100" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="grid gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <main className="min-w-0 space-y-5">
            <div className="flex items-start gap-3">
              <button aria-label={t.status === 'concluida' ? 'Reabrir' : 'Concluir'} disabled={ro} onMouseDown={e => e.preventDefault()} onClick={() => void (t.status === 'concluida' ? reopen() : finish())}
                className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${t.status === 'concluida' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 hover:border-green-600'}`}>{t.status === 'concluida' && <Check size={12} strokeWidth={3} />}</button>
              <TitleInput key={`${t.id}${t.revision}.${nonce}`} value={t.title} disabled={ro} onSave={v => void save(t, { title: v })} />
            </div>
            {t.status === 'bloqueada' && t.blocked_reason && <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"><AlertTriangle size={14} />{t.blocked_reason}</p>}

            <label className="block">
              <span className={label}>Próxima ação</span>
              <CommitInput value={t.next_action || ''} disabled={ro} placeholder="O próximo passo, numa linha" onSave={v => void save(t, { next_action: v })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm" />
            </label>

            <section>
              <div className="flex items-center justify-between"><span className={label}>Descrição</span>
                <button className="text-xs text-slate-500 hover:text-slate-800" onClick={() => setPreview(p => !p)}>{preview ? 'Editar' : 'Ver formatado'}</button></div>
              {preview && t.description
                ? <div className="task-md mt-1 rounded-md px-1 text-sm leading-relaxed text-slate-700" onDoubleClick={() => !ro && setPreview(false)}><ReactMarkdown components={MD}>{t.description}</ReactMarkdown></div>
                : <CommitArea value={t.description || ''} disabled={ro} placeholder="Briefing, peças, combinados. Aceita Markdown." onSave={v => { void save(t, { description: v }); setPreview(true); }} />}
            </section>

            {!isSub && (
              <section aria-label="Sub Tarefas">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={16} />Sub Tarefas <span className="text-slate-500">{progress.done}/{progress.total}</span></h3>
                  {progress.total > 0 && <progress className="h-1.5 w-32 overflow-hidden rounded accent-green-600" max={progress.total} value={progress.done} aria-label="Sub Tarefas concluídas" />}
                  {progress.blocked > 0 && <span className="text-xs font-medium text-red-700">{progress.blocked} bloqueada{progress.blocked > 1 ? 's' : ''}</span>}
                  <label className="ml-auto flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} />Ocultar concluídas</label>
                </div>
                <div className="mt-2 space-y-3">
                  {groupLabels.map(g => {
                    const list = kids.filter(k => (k.subtask_group || NO_GROUP) === g).sort((a, c) => (a.position || 0) - (c.position || 0));
                    const shown = hideDone ? list.filter(k => !closed(k.status)) : list;
                    const gDone = list.filter(k => closed(k.status)).length;
                    return (
                      <div key={g || '__none'} className="rounded-lg border border-slate-100">
                        {(g || groupLabels.length > 1) && <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5">
                          <ChevronDown size={14} className="text-slate-400" />
                          {g ? <CommitInput value={g} disabled={ro} onSave={v => void renameGroup(g, v)} className="min-w-0 flex-1 bg-transparent text-xs font-semibold uppercase tracking-wide text-slate-600" ariaLabel={`Nome do grupo ${g}`} />
                            : <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sem grupo</span>}
                          <span className="text-xs text-slate-500">{gDone}/{list.length}</span>
                        </div>}
                        <ul>
                          {shown.map(s => {
                            const late = s.due_date && !closed(s.status) && s.due_date < new Date().toISOString().slice(0, 10);
                            const waits = closed(s.status) ? [] : (s.dependencies || []).map(k => b.dependencies.find(d => d.task_key === k)).filter(d => d && d.status !== 'concluida');
                            return (
                              <li key={s.id} className="group flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-1.5 hover:bg-slate-50 sm:flex-nowrap">
                                <button aria-label={s.status === 'concluida' ? `Reabrir ${s.title}` : `Concluir ${s.title}`} disabled={ro || s.status === 'cancelada'} onClick={() => void toggleSub(s)}
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${s.status === 'concluida' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 hover:border-green-600'}`}>{s.status === 'concluida' && <Check size={11} strokeWidth={3} />}</button>
                                <CommitInput key={`${s.id}.${nonce}`} value={s.title} disabled={ro} onSave={v => void save(s, { title: v })} ariaLabel={`Título de ${s.title}`}
                                  className={`min-w-0 flex-1 basis-[calc(100%-1.5rem)] truncate bg-transparent text-sm sm:basis-auto ${closed(s.status) ? 'text-slate-400 line-through' : ''}`} />
                                {s.status === 'bloqueada' && <span className="rounded bg-red-50 px-1.5 text-xs text-red-700" title={s.blocked_reason || ''}>bloqueada</span>}
                                {waits.length > 0 && <span className="text-xs text-amber-700" title={waits.map(w => w!.title).join(', ')}>espera {waits.length}</span>}
                                {PersonSelect({ target: s, small: true })}
                                <DateInput ariaLabel={`Prazo de ${s.title}`} disabled={!b.canEdit} value={s.due_date || ''} onSave={v => void save(s, { due_date: v })}
                                  className={`w-[7.25rem] shrink-0 rounded border border-transparent bg-transparent px-1 text-xs hover:border-slate-200 ${late ? 'text-red-700' : s.due_date ? 'text-slate-600' : 'text-slate-300'}`} />
                                <span className="relative shrink-0">
                                  <button aria-label={`Ações de ${s.title}`} aria-expanded={rowMenu === s.id} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700" onClick={() => setRowMenu(m => (m === s.id ? null : s.id))}><MoreHorizontal size={14} /></button>
                                  {rowMenu === s.id && <div role="menu" className="absolute right-0 top-7 z-20 w-52 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-xl" onMouseLeave={() => setRowMenu(null)}>
                                    <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setRowMenu(null); setCurrentId(s.id); }}><ArrowUpRight size={13} />Abrir Sub Tarefa</button>
                                    <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setRowMenu(null); void blockSub(s); }}><AlertTriangle size={13} />{s.status === 'bloqueada' ? 'Desbloquear' : 'Bloquear…'}</button>
                                    {groupLabels.filter(o => o !== (s.subtask_group || NO_GROUP)).map(o => <button key={o || 'none'} role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setRowMenu(null); void save(s, { subtask_group: o }); }}><ChevronRight size={13} />Mover para {o || 'Sem grupo'}</button>)}
                                    <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setRowMenu(null); void promote(s); }}><ArrowUpRight size={13} />Transformar em Tarefa</button>
                                    <button role="menuitem" disabled={ro || s.status === 'cancelada'} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-red-700 hover:bg-red-50" onClick={() => { setRowMenu(null); const why = window.prompt('Por que sai do escopo?')?.trim(); if (why) void save(s, { status: 'cancelada', resolution: why }, 'Sub Tarefa cancelada.'); }}><Trash2 size={13} />Tirar do escopo</button>
                                  </div>}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        {b.canEdit && !parentClosed && <form className="flex items-center gap-2 px-3 py-1.5" onSubmit={e => { e.preventDefault(); void addSub(g); }}>
                          <Plus size={14} className="text-slate-400" />
                          <input disabled={busy} aria-label={`Adicionar Sub Tarefa${g ? ` em ${g}` : ''}`} placeholder="Adicionar Sub Tarefa" value={drafts[g] || ''} onChange={e => setDrafts(d => ({ ...d, [g]: e.target.value }))}
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                        </form>}
                      </div>
                    );
                  })}
                  {parentClosed && <p className="text-xs text-slate-500">Tarefa fechada: para acrescentar ou reabrir Sub Tarefas, reabra a Tarefa.</p>}
                  {b.canEdit && !parentClosed && (newGroup === null
                    ? <button className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" onClick={() => setNewGroup('')}><Plus size={13} />Novo grupo</button>
                    : <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); const v = (newGroup || '').trim(); if (v) void saveGroups([...groupLabels.filter(Boolean), v]); setNewGroup(null); }}>
                        <input autoFocus aria-label="Nome do novo grupo" value={newGroup} onChange={e => setNewGroup(e.target.value)} onBlur={() => setNewGroup(null)} placeholder="Ex.: Conteúdo, Validação" className="rounded border border-slate-200 px-2 py-1 text-sm" />
                      </form>)}
                </div>
              </section>
            )}

            <section aria-label="Critérios de aceite e entrega">
              <h3 className="text-sm font-semibold">Critérios de aceite {criteria.length > 0 && <span className="text-slate-500">{marked.size}/{criteria.length}</span>}</h3>
              <ul className="mt-1 space-y-1">
                {criteria.map((c, i) => <li key={i} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" aria-label={c} disabled={ro} checked={marked.has(i)} onChange={() => void toggleCriterion(i)} />
                  <span className={marked.has(i) ? 'text-slate-500' : ''}>{c}</span>
                  {b.canEdit && <button aria-label={`Remover critério ${c}`} disabled={ro} className="ml-auto rounded p-0.5 text-slate-400 hover:text-red-700" onClick={() => void setCriteria(criteria.filter((_, j) => j !== i))}><X size={12} /></button>}
                </li>)}
              </ul>
              {b.canEdit && <form className="mt-1 flex items-center gap-2" onSubmit={e => { e.preventDefault(); const v = (drafts.__crit || '').trim(); if (v) { void setCriteria([...criteria, v]); setDrafts(d => ({ ...d, __crit: '' })); } }}>
                <Plus size={14} className="text-slate-400" /><input disabled={ro} aria-label="Adicionar critério de aceite" placeholder="Adicionar critério (o resultado que comprova a entrega)" value={drafts.__crit || ''} onChange={e => setDrafts(d => ({ ...d, __crit: e.target.value }))} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </form>}
              {!isSub && <label className="mt-3 block"><span className={label}>Entrega e evidência</span>
                <CommitArea value={t.resolution || ''} disabled={ro} placeholder="O que foi entregue, link da evidência e limitações" onDraft={v => { resolutionDraft.current = v; }} onSave={v => void save(t, { resolution: v }).then(r => { if (r) resolutionDraft.current = null; })} rows={2} /></label>}
              {!isSub && t.status !== 'concluida' && b.canEdit && <button className="mt-2 rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50" disabled={ro} onMouseDown={e => e.preventDefault()} onClick={() => void conclude()}>Concluir Tarefa</button>}
            </section>

            {(b.dependencies.length > 0 || b.dependents.length > 0) && <section className="text-sm">
              {b.dependencies.filter(d => (t.dependencies || []).includes(d.task_key)).length > 0 && <p className="flex flex-wrap items-center gap-1"><span className="text-slate-500">Depende de</span>{b.dependencies.filter(d => (t.dependencies || []).includes(d.task_key)).map(d => <button key={d.id} className={chip} onClick={() => setCurrentId(d.id)}>{d.status === 'concluida' ? '✓' : '○'} {d.title}</button>)}</p>}
              {b.dependents.length > 0 && <p className="mt-1 flex flex-wrap items-center gap-1"><span className="text-slate-500">Segura {b.dependents.length}:</span>{b.dependents.slice(0, 8).map(d => <button key={d.id} className={chip} onClick={() => setCurrentId(d.id)}>{d.title}</button>)}</p>}
            </section>}

            <section aria-label="Na Daily">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays size={15} />Na Daily <span className="text-slate-500">{b.mentions.length}</span></h3>
              {b.mentions.length === 0 ? <p className="mt-1 text-xs text-slate-500">Nenhum registro vinculado ainda. Na Visão Daily, use "Vincular a Tarefa…" no registro.</p>
                : <ol className="mt-1 space-y-1 text-sm">{b.mentions.slice(0, 8).map(m => <li key={m.id} className="flex gap-2">
                    <button className="shrink-0 text-xs font-medium text-cyan-700 hover:underline" onClick={() => onOpenDay?.(m.day, m.project_id)}>{br(m.day)}</button>
                    <span className="text-slate-700">{m.body}{!m.work_ids.includes(t.id) && <span className="ml-1 text-xs text-slate-400">(Sub Tarefa)</span>}</span></li>)}</ol>}
            </section>

            <section aria-label="Comentários e histórico">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare size={15} />Comentários</h3>
              <ul className="mt-1 space-y-2">{b.comments.map(c => <li key={c.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500"><User size={12} />{people.find(p => p.id === c.author_id)?.name || 'Membro'} · {new Date(c.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {c.author_id === me && <button className="ml-auto text-slate-400 hover:text-red-700" onClick={() => void deleteComment(c.id).then(() => setB(cur => cur && { ...cur, comments: cur.comments.filter(x => x.id !== c.id) })).catch(fail)}>apagar</button>}</div>
                <p className="mt-0.5 whitespace-pre-wrap">{c.body}</p></li>)}</ul>
              {b.canEdit && <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
                <input aria-label="Escrever comentário" value={comment} onChange={e => setComment(e.target.value)} placeholder="Escrever comentário" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm" />
                <button className="rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50" disabled={!comment.trim()}>Enviar</button></form>}
              <button className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" aria-expanded={showHistory} onClick={() => setShowHistory(v => !v)}>{showHistory ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Histórico ({b.history.length})</button>
              {showHistory && <ol className="mt-1 space-y-0.5 text-xs text-slate-600">{b.history.map(h => {
                const keys = h.before_data ? Object.keys(h.after_data || {}).filter(k => !['revision', 'updated_at'].includes(k) && JSON.stringify((h.before_data as Record<string, unknown>)[k]) !== JSON.stringify((h.after_data as Record<string, unknown>)[k])) : ['criada'];
                const renamed = h.before_data && h.before_data.title !== h.after_data.title ? ` (antes: "${h.before_data.title}")` : '';
                return <li key={h.id}>r{h.revision} · {new Date(h.created_at).toLocaleDateString('pt-BR')} · {keys.join(', ')}{renamed}</li>;
              })}</ol>}
            </section>
          </main>

          <aside className="space-y-3 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div><span className={label}>Responsável</span><div className={field}>{PersonSelect({ target: t })}</div></div>
            <div><span className={label}>Prazo</span><div className={field}><DateInput ariaLabel="Prazo" disabled={!b.canEdit} value={t.due_date || ''} onSave={v => void save(t, { due_date: v })} className="rounded border border-slate-200 px-2 py-1 text-sm" /></div></div>
            <div><span className={label}>Prioridade</span><div className={field}>
              <select aria-label="Prioridade" disabled={ro} value={t.priority} onChange={e => void save(t, { priority: e.target.value })} className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                {Object.entries(TASK_PRIORITY).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select></div></div>
            {!isSub && <>
              <div><span className={label}>Iniciativa</span><div className={field}>
                <select aria-label="Iniciativa" disabled={ro} value={t.initiative_id || ''} onChange={e => void save(t, { initiative_id: e.target.value })} className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                  <option value="">Sem iniciativa</option>{b.initiatives.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}</select></div></div>
              <div><span className={label}>Frente</span><div className={field}>
                <select aria-label="Frente" disabled={ro} value={t.front_key || ''} onChange={e => void save(t, { front_key: e.target.value })} className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                  {b.fronts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}<option value="gaas">GaaS (SDD)</option></select></div></div>
              <ChipPicker title="Projetos" options={b.projects} selected={t.project_ids || []} disabled={ro} onToggle={id => void save(t, { project_ids: toggleList(t.project_ids, id) })} />
              <ChipPicker title="BU/parceiro" options={b.partners} selected={t.partner_keys || []} disabled={ro} onToggle={id => void save(t, { partner_keys: toggleList(t.partner_keys, id) })} />
            </>}
            {initiative?.source_note && <a className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:underline" href={`?view=learning&section=vault&wiki_path=${encodeURIComponent(initiative.source_note)}`}>Contexto na Wiki <ArrowUpRight size={12} /></a>}
            <p className="text-[11px] text-slate-400">{t.task_key} · r{t.revision}</p>
          </aside>
        </div>

        {(error || note) && <div role={error ? 'alert' : 'status'} className={`sticky bottom-0 rounded-b-xl border-t px-6 py-2 text-sm ${error ? 'border-red-100 bg-red-50 text-red-800' : 'border-green-100 bg-green-50 text-green-800'}`}>{error || note}</div>}
      </div>
    </div>
  );
}

/** Markdown da descrição com o mesmo tom do app (sem depender de plugin de tipografia). */
const MD = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h4 className="mt-2 text-base font-semibold text-slate-800" {...p} />,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h4 className="mt-2 text-sm font-semibold text-slate-800" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h5 className="mt-2 text-sm font-semibold text-slate-700" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="my-1" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="my-1 list-disc pl-5" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="my-1 list-decimal pl-5" {...p} />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="text-cyan-700 underline" target="_blank" rel="noreferrer" {...p} />,
};

/** Título editável no lugar: salva ao sair do campo ou com Enter; Esc desfaz. */
function TitleInput({ value, disabled, onSave }: { value: string; disabled: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return <textarea id="task-modal-title" rows={1} aria-label="Título da Tarefa" value={v} disabled={disabled} onChange={e => setV(e.target.value)}
    onBlur={e => { if (cancelled(e.currentTarget)) { setV(value); return; } const n = v.trim(); if (n && n !== value) onSave(n); else setV(value); }}
    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
    className="w-full resize-none bg-transparent text-xl font-semibold leading-snug outline-none focus:rounded focus:ring-2 focus:ring-cyan-600/30" />;
}
function CommitInput({ value, disabled, onSave, className, placeholder, ariaLabel }: { value: string; disabled: boolean; onSave: (v: string) => void; className?: string; placeholder?: string; ariaLabel?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <input aria-label={ariaLabel || placeholder} value={v} disabled={disabled} placeholder={placeholder} onChange={e => setV(e.target.value)}
    onBlur={e => { if (cancelled(e.currentTarget)) { setV(value); return; } if (v.trim() !== value.trim()) onSave(v.trim()); }}
    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    className={`${className || ''} outline-none focus:rounded focus:ring-2 focus:ring-cyan-600/30`} />;
}
function CommitArea({ value, disabled, onSave, onDraft, placeholder, rows = 5 }: { value: string; disabled: boolean; onSave: (v: string) => void; onDraft?: (v: string | null) => void; placeholder?: string; rows?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <textarea aria-label={placeholder} rows={rows} value={v} disabled={disabled} placeholder={placeholder} onChange={e => { setV(e.target.value); onDraft?.(e.target.value); }}
    onBlur={e => { if (cancelled(e.currentTarget)) { setV(value); onDraft?.(null); return; } if (v !== value) onSave(v); }}
    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-cyan-600/30" />;
}
/** Esc dentro do campo (marcado pelo teclado da janela) desfaz em vez de salvar. */
function cancelled(el: HTMLElement): boolean {
  if (el.dataset.cancel !== '1') return false;
  delete el.dataset.cancel;
  return true;
}
/** Data salva ao sair do campo (digitar pelo teclado não grava ano pela metade); ano antes de 2000 é recusado. */
function DateInput({ value, disabled, onSave, className, ariaLabel }: { value: string; disabled: boolean; onSave: (v: string) => void; className?: string; ariaLabel: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = (next: string) => {
    if (next === value) return;
    if (next && (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next < '2000-01-01')) { setV(value); return; }
    onSave(next);
  };
  return <input type="date" aria-label={ariaLabel} disabled={disabled} value={v} onChange={e => setV(e.target.value)}
    onBlur={e => { if (cancelled(e.currentTarget)) { setV(value); return; } commit(v); }}
    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} className={className} />;
}
function ChipPicker({ title, options, selected, disabled, onToggle }: { title: string; options: { id: string; name: string }[]; selected: string[]; disabled: boolean; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const chosen = options.filter(o => selected.includes(o.id));
  const list = options.filter(o => !q.trim() || o.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</span>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {chosen.map(o => <span key={o.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{o.name}{!disabled && <button aria-label={`Tirar ${o.name}`} onClick={() => onToggle(o.id)}><X size={11} /></button>}</span>)}
        {!disabled && <button className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:border-slate-400" aria-expanded={open} onClick={() => setOpen(v => !v)}>+ {chosen.length ? 'mais' : 'escolher'}</button>}
      </div>
      {open && <div className="mt-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
        <input autoFocus aria-label={`Buscar ${title}`} value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar" className="mb-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
        <div className="max-h-40 overflow-y-auto">{list.map(o => <button key={o.id} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-slate-50" onClick={() => onToggle(o.id)}>{o.name}{selected.includes(o.id) && <Check size={12} />}</button>)}</div>
      </div>}
    </div>
  );
}

export type { Props as TaskModalProps };
