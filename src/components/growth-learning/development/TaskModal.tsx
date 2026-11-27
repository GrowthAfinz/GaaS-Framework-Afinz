/**
 * Janela da Tarefa: a mesma em Tarefas e atividades, no kanban da Visão Daily e na Wiki (decisão de 17/11/2026).
 * Abre por cima da tela (fundo escurecido), fecha com Esc, botão ou clique fora e devolve o foco ao card.
 * Sub Tarefas são itens de checklist: caixa, título, responsável e prazo; grupos renomeáveis; um clique conclui.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronRight, Copy, Link2, ListChecks, MessageSquare,
  MoreHorizontal, Plus, Tag, Trash2, User, X,
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { TASK_PRIORITY, TASK_STATUS, taskError } from './developmentService';
import { saveTaskTree } from './workService';
import { subtaskProgress, type WorkItem } from './workModel';
import {
  addComment, createDailyEntry, createPerson, createSubtask, deleteComment, linkEntry, loadSubtasks, loadTask, loadTaskBundle, patchTask, taskLink, todaySP,
  type Person, type TaskBundle, type TaskEventLite,
} from './taskModalService';
import { buildFeed } from './taskActivity';

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
const FIELD_NAMES: Record<string, string> = {
  title: 'título', status: 'status', owner_label: 'responsável', due_date: 'prazo', priority: 'prioridade', description: 'descrição', next_action: 'próxima ação',
  acceptance_criteria: 'critérios', completed_criteria: 'critérios marcados', resolution: 'entrega', project_ids: 'projetos', partner_keys: 'BU/parceiro',
  front_key: 'frente', initiative_id: 'iniciativa', parent_task_id: 'Tarefa pai', subtask_group: 'grupo', position: 'ordem', details: 'detalhes', dependencies: 'dependências', blocked_reason: 'motivo do bloqueio',
};
/** Linha do histórico em português: o que mudou naquela revisão. */
function historyText(h: TaskEventLite): string {
  if (!h.before_data) return 'card criado';
  const changed = Object.keys(h.after_data || {}).filter(k => !['revision', 'updated_at', 'workspace', 'area'].includes(k)
    && JSON.stringify((h.before_data as Record<string, unknown>)[k]) !== JSON.stringify((h.after_data as Record<string, unknown>)[k]));
  if (changed.includes('status')) return `status: ${TASK_STATUS[h.after_data.status as keyof typeof TASK_STATUS] || h.after_data.status}`;
  return changed.length ? `mudou ${changed.map(k => FIELD_NAMES[k] || k).join(', ')}` : 'sem mudança visível';
}

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
  const [composer, setComposer] = useState('');
  const [composerMode, setComposerMode] = useState<'daily' | 'comment'>('daily');
  const [composerProject, setComposerProject] = useState('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'daily' | 'loose' | 'comment' | 'history'>('all');
  const [feedLimit, setFeedLimit] = useState(12);
  const [moreOpen, setMoreOpen] = useState(false);
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
  useEffect(() => { if (b) window.setTimeout(() => box.current?.focus(), 0); }, [b?.task.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const PersonSelect = ({ target, small, chip }: { target: WorkItem; small?: boolean; chip?: boolean }) => (
    <select aria-label={`Responsável de ${target.title}`} disabled={ro} value={target.owner_label || ''} onChange={e => void personPick(target, e.target.value)}
      className={chip ? `appearance-none rounded-md px-2 py-1 text-sm ${target.owner_label ? 'bg-slate-100 text-slate-800' : 'border border-dashed border-slate-300 bg-white text-slate-500'}` : `${small ? 'w-[7.5rem] shrink-0 truncate text-xs' : 'w-full text-sm'} rounded border border-transparent bg-transparent px-1 py-0.5 ${target.owner_label ? 'text-slate-700' : 'text-slate-400'} hover:border-slate-200 focus:border-slate-300`}>
      <option value="">{small ? 'Responsável' : chip ? '+ Pessoa' : 'Sem responsável'}</option>
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
  const send = async (body: string) => {
    try { const c = await addComment(t.id, body); setB(cur => cur && { ...cur, comments: [...cur.comments, c] }); } catch (e) { await fail(e); }
  };

  /* ---------- atividade: Daily, comentários e histórico numa linha do tempo ---------- */
  const ids = [t.id, ...kids.map(k => k.id)];
  const feed = buildFeed({
    ids, subs: kids,
    entries: [...b.mentions, ...b.projectEntries].sort((x, y) => y.day.localeCompare(x.day)),
    comments: b.comments,
    history: b.history.map(h => ({ id: h.id, created_at: h.created_at, text: historyText(h) })),
  });
  const dailyLinked = b.mentions.filter(m => m.work_ids.some(id => ids.includes(id)));
  const unlinked = feed.filter(f => f.kind === 'daily' && !f.linkedTo.length).length;
  const shownFeed = feed.filter(f => (feedFilter === 'all' ? f.kind !== 'history' || showHistory : feedFilter === 'daily' ? f.kind === 'daily' : feedFilter === 'loose' ? f.kind === 'daily' && !f.linkedTo.length : feedFilter === 'comment' ? f.kind === 'comment' : f.kind === 'history'));
  const lastDailyOf = (id: string) => b.mentions.filter(m => m.work_ids.includes(id)).map(m => m.day).sort().pop();
  const projectsForEntry = (isSub ? b.parent?.project_ids : t.project_ids) || [];
  const entryProject = composerProject && projectsForEntry.includes(composerProject) ? composerProject : projectsForEntry[0] || '';
  const putEntry = (e: TaskBundle['mentions'][number]) => setB(cur => cur && {
    ...cur,
    mentions: [e, ...cur.mentions.filter(m => m.id !== e.id)].filter(m => m.work_ids.length),
    projectEntries: cur.projectEntries.map(m => (m.id === e.id ? e : m)),
  });
  const link = async (entry: TaskBundle['mentions'][number], workId: string, alsoCheck?: WorkItem) => {
    if (!b.canEdit || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      putEntry(await linkEntry(entry, workId));
      flash(alsoCheck ? 'Registro vinculado.' : 'Registro vinculado ao card.');
    } catch (e) { setError(taskError(e)); } finally { busyRef.current = false; setBusy(false); }
    if (alsoCheck) await toggleSub(alsoCheck);
  };
  const post = async () => {
    const body = composer.trim(); if (!body || busyRef.current) return;
    if (composerMode === 'comment') { await send(body); setComposer(''); return; }
    if (!entryProject) { setError('Ponha o card num projeto da Visão Daily para registrar.'); return; }
    busyRef.current = true; setBusy(true); setError('');
    try { putEntry(await createDailyEntry(entryProject, body, t.id, me)); setComposer(''); flash('Registrado na Visão Daily de hoje.'); }
    catch (e) { setError(taskError(e)); } finally { busyRef.current = false; setBusy(false); }
  };
  const focusEl = (sel: string) => { const el = box.current?.querySelector<HTMLElement>(sel); el?.scrollIntoView({ block: 'center' }); el?.focus(); };

  const label = 'text-[10.5px] font-bold uppercase tracking-[.4px] text-slate-400';
  const chip = 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700';
  const railBtn = 'flex w-full items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1.5 text-left text-[12.5px] text-slate-800 hover:bg-slate-200 disabled:opacity-50';
  const completedOn = t.details?.completed_on || '';
  const statusPick = (v: string) => (v === 'concluida' ? finish() : t.status === 'concluida' && v !== 'cancelada' && isSub && b.parent && closed(b.parent.status) ? reopen()
    : v === 'bloqueada' ? (() => { const r = window.prompt('O que está travando?')?.trim(); return r ? save(t, { status: 'bloqueada', blocked_reason: r }) : undefined; })() : save(t, { status: v }));

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-2 sm:p-6" onPointerDown={e => {
      if (e.target !== e.currentTarget) return;
      // Sai do campo antes de fechar, para o texto digitado ser salvo (o blur não acontece sozinho se a janela some).
      const a = document.activeElement as HTMLElement | null;
      if (a && box.current?.contains(a)) a.blur();
      onClose();
    }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="relative my-4 w-full max-w-5xl rounded-[14px] bg-white text-slate-800 shadow-2xl outline-none">
        {/* topo: onde o card mora e o que dá para fazer com ele */}
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:px-6">
          {isSub && b.parent
            ? <button className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100" onClick={() => setCurrentId(b.parent!.id)}><ChevronRight size={12} className="rotate-180" />Sub Tarefa de <b className="text-slate-700">{b.parent.title}</b></button>
            : <span className="min-w-0 truncate">{[front, initiative?.title].filter(Boolean).join(' › ') || 'Sem frente'}{projectNames.length > 0 && <> › <b className="text-slate-700">{projectNames.join(', ')}</b></>}</span>}
          <span className="ml-auto tabular-nums text-slate-400">{t.task_key}</span>
          <div className="relative">
            <button aria-label="Ações da Tarefa" aria-expanded={menu} className="rounded p-1.5 hover:bg-slate-100" onClick={() => setMenu(m => !m)}><MoreHorizontal size={16} /></button>
            {menu && <div role="menu" className="absolute right-0 top-8 z-10 w-56 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl">
              <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => void copyLink()}><Link2 size={14} />Copiar link</button>
              {!isSub && <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => void duplicate()}><Copy size={14} />Duplicar (sem conclusão)</button>}
              {isSub && <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50" onClick={() => { setMenu(false); void promoteSelf(); }}><ArrowUpRight size={14} />Transformar em Tarefa</button>}
              <button role="menuitem" disabled={ro} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-red-700 hover:bg-red-50" onClick={() => void cancelTask()}><Trash2 size={14} />Cancelar {isSub ? 'Sub Tarefa' : 'Tarefa'}</button>
            </div>}
          </div>
          <button aria-label="Fechar" className="rounded p-1.5 hover:bg-slate-100" onClick={onClose}><X size={16} /></button>
        </header>

        {/* título e lista em que o card está */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="flex items-start gap-3">
            <button aria-label={t.status === 'concluida' ? 'Reabrir' : 'Concluir'} disabled={ro} onMouseDown={e => e.preventDefault()} onClick={() => void (t.status === 'concluida' ? reopen() : finish())}
              className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${t.status === 'concluida' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 hover:border-green-600'}`}>{t.status === 'concluida' && <Check size={12} strokeWidth={3} />}</button>
            <TitleInput key={`${t.id}${t.revision}.${nonce}`} value={t.title} disabled={ro} onSave={v => void save(t, { title: v })} />
          </div>
          <p className="ml-8 mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">na lista
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[t.status] }} />
            <select aria-label="Status" disabled={ro} value={t.status} onChange={e => void statusPick(e.target.value)} className="appearance-none rounded bg-transparent px-0.5 font-semibold text-cyan-700 underline decoration-dotted underline-offset-2 hover:bg-slate-50">
              {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </p>
          {t.status === 'bloqueada' && t.blocked_reason && <p className="ml-8 mt-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"><AlertTriangle size={14} />{t.blocked_reason}</p>}
        </div>

        <div className="grid gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_12rem]">
          <main className="min-w-0 space-y-5">
            {/* campos do card numa faixa de chips, como no Trello */}
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              <div><div className={label}>Responsável</div><div id="tm-owner">{PersonSelect({ target: t, chip: true })}</div></div>
              {!isSub && <div id="tm-labels"><div className={label}>Etiquetas</div>
                <div className="flex flex-wrap items-center gap-1">
                  {(t.project_ids || []).map(id => { const pr = b.projects.find(p => p.id === id); const c = b.fronts.find(f => f.id === pr?.frente_key)?.color || '#64748b';
                    return pr ? <span key={id} className="rounded px-2 py-1 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${c} 14%, white)`, color: `color-mix(in srgb, ${c} 75%, black)` }}>{pr.name}</span> : null; })}
                  <select aria-label="Prioridade" disabled={ro} value={t.priority} onChange={e => void save(t, { priority: e.target.value })}
                    className={`appearance-none rounded px-2 py-1 text-xs font-bold ${t.priority === 'P0' ? 'bg-red-100 text-red-800' : t.priority === 'P1' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}`} title="Prioridade">
                    {Object.entries(TASK_PRIORITY).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select>
                  <button type="button" aria-expanded={moreOpen} className="rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-xs text-slate-500 hover:border-slate-400" onClick={() => setMoreOpen(o => !o)} title="Frente, iniciativa, projetos e BU/parceiro"><Plus size={12} className="inline" /></button>
                </div></div>}
              {isSub && <div><div className={label}>Prioridade</div>
                <select aria-label="Prioridade" disabled={ro} value={t.priority} onChange={e => void save(t, { priority: e.target.value })} className="appearance-none rounded-md bg-slate-100 px-2 py-1 text-sm">
                  {Object.entries(TASK_PRIORITY).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select></div>}
              <div><div className={label}>Prazo</div><DateInput ariaLabel="Prazo" disabled={!b.canEdit} value={t.due_date || ''} onSave={v => void save(t, { due_date: v })} className="tm-due rounded-md border-0 bg-slate-100 px-2 py-1 text-sm" /></div>
              <div><div className={label}>Finalização</div>
                {t.status === 'concluida'
                  ? <DateInput ariaLabel="Data de finalização" disabled={!b.canEdit} value={completedOn} onSave={v => { if (v) void save(t, { details: { completed_on: v } }); }} className="rounded-md border-0 bg-green-50 px-2 py-1 text-sm text-green-800" />
                  : <span className="inline-block rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-400" title="Preenchida sozinha ao concluir; dá para corrigir depois">ao concluir</span>}</div>
              <div><div className={label}>Na Daily</div>
                <button className="rounded-md bg-cyan-50 px-2 py-1 text-sm font-semibold text-cyan-800" onClick={() => setFeedFilter('daily')} title="Ver os registros na atividade">
                  <CalendarDays size={13} className="mr-1 inline" />{dailyLinked.length} {dailyLinked.length === 1 ? 'registro' : 'registros'}{dailyLinked[0] ? ` · último ${br(dailyLinked[0].day)}` : ''}</button></div>
            </div>
            {!isSub && moreOpen && <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              <div className="flex items-center gap-2"><span className={`${label} w-16`}>Frente</span>
                <select aria-label="Frente" disabled={ro} value={t.front_key || ''} onChange={e => void save(t, { front_key: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-sm">
                  {b.fronts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}<option value="gaas">GaaS (SDD)</option></select></div>
              <div className="flex items-center gap-2"><span className={`${label} w-16`}>Iniciativa</span>
                <select aria-label="Iniciativa" disabled={ro} value={t.initiative_id || ''} onChange={e => void save(t, { initiative_id: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-sm">
                  <option value="">Sem iniciativa</option>{b.initiatives.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}</select></div>
              <ChipPicker title="Projetos" options={b.projects} selected={t.project_ids || []} disabled={ro} onToggle={id => void save(t, { project_ids: toggleList(t.project_ids, id) })} />
              <ChipPicker title="BU/parceiro" options={b.partners} selected={t.partner_keys || []} disabled={ro} onToggle={id => void save(t, { partner_keys: toggleList(t.partner_keys, id) })} />
            </div>}

            <label className="flex items-center gap-2">
              <span className={`${label} shrink-0`}>Próxima ação</span>
              <CommitInput value={t.next_action || ''} disabled={ro} placeholder="O próximo passo, numa linha" onSave={v => void save(t, { next_action: v })} className="min-w-0 flex-1 rounded-md bg-slate-50 px-2.5 py-1 text-sm" />
            </label>

            <section>
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Descrição</h3>
                <button className="text-xs text-slate-500 hover:text-slate-800" onClick={() => setPreview(p => !p)}>{preview ? 'Editar' : 'Ver formatado'}</button></div>
              {preview && !t.description
                ? <button type="button" disabled={ro} onClick={() => setPreview(false)} className="mt-1 w-full rounded-md bg-slate-50 px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100">Sem descrição. Clique para escrever o briefing, as peças e os combinados.</button>
                : preview
                ? <div className="task-md mt-1 rounded-md bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700" onDoubleClick={() => !ro && setPreview(false)}><ReactMarkdown components={MD}>{t.description}</ReactMarkdown></div>
                : <CommitArea value={t.description || ''} disabled={ro} placeholder="Briefing, peças, combinados. Aceita Markdown." onSave={v => { void save(t, { description: v }); setPreview(true); }} />}
            </section>

            {!isSub && (
              <section aria-label="Checklist">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={16} />Checklist</h3>
                  {progress.blocked > 0 && <span className="text-xs font-medium text-red-700">{progress.blocked} bloqueada{progress.blocked > 1 ? 's' : ''}</span>}
                  <label className="ml-auto flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} />Ocultar marcados</label>
                </div>
                {progress.total > 0 && <div className="mt-1.5 flex items-center gap-2 text-xs tabular-nums text-slate-500">
                  <span className="w-9">{Math.round((progress.done / progress.total) * 100)}%</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-100"><span className="block h-full bg-green-600" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></span>
                  <span>{progress.done}/{progress.total}</span></div>}
                <div className="mt-2 space-y-3">
                  {groupLabels.map(g => {
                    const list = kids.filter(k => (k.subtask_group || NO_GROUP) === g).sort((a, c) => (a.position || 0) - (c.position || 0));
                    const shown = hideDone ? list.filter(k => !closed(k.status)) : list;
                    const gDone = list.filter(k => closed(k.status)).length;
                    return (
                      <div key={g || '__none'}>
                        {(g || groupLabels.length > 1) && <div className="flex items-center gap-2 px-1 py-1">
                          {g ? <CommitInput value={g} disabled={ro} onSave={v => void renameGroup(g, v)} className="min-w-0 flex-1 bg-transparent text-[11px] font-bold uppercase tracking-wide text-slate-500" ariaLabel={`Nome do grupo ${g}`} />
                            : <span className="flex-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Sem grupo</span>}
                          <span className="text-xs tabular-nums text-slate-400">{gDone}/{list.length}</span>
                        </div>}
                        <ul>
                          {shown.map(s => {
                            const late = s.due_date && !closed(s.status) && s.due_date < todaySP();
                            const waits = closed(s.status) ? [] : (s.dependencies || []).map(k => b.dependencies.find(d => d.task_key === k)).filter(d => d && d.status !== 'concluida');
                            const lastDaily = lastDailyOf(s.id);
                            return (
                              <li key={s.id} className="group flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-1.5 py-1 hover:bg-slate-50 sm:flex-nowrap">
                                <button aria-label={s.status === 'concluida' ? `Reabrir ${s.title}` : `Concluir ${s.title}`} disabled={ro || s.status === 'cancelada'} onClick={() => void toggleSub(s)}
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${s.status === 'concluida' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 hover:border-green-600'}`}>{s.status === 'concluida' && <Check size={11} strokeWidth={3} />}</button>
                                <CommitInput key={`${s.id}.${nonce}`} value={s.title} disabled={ro} onSave={v => void save(s, { title: v })} ariaLabel={`Título de ${s.title}`}
                                  className={`min-w-0 flex-1 basis-[calc(100%-1.5rem)] truncate bg-transparent text-sm sm:basis-auto ${closed(s.status) ? 'text-slate-400 line-through' : ''}`} />
                                {lastDaily && <span className="shrink-0 rounded bg-cyan-50 px-1.5 text-[11px] text-cyan-800" title="Último registro da Daily vinculado">Daily {br(lastDaily)}</span>}
                                {s.status === 'bloqueada' && <span className="rounded bg-red-50 px-1.5 text-xs text-red-700" title={s.blocked_reason || ''}>bloqueada</span>}
                                {waits.length > 0 && <span className="text-xs text-amber-700" title={waits.map(w => w!.title).join(', ')}>espera {waits.length}</span>}
                                {PersonSelect({ target: s, small: true })}
                                <DateInput ariaLabel={`Prazo de ${s.title}`} disabled={!b.canEdit} value={s.due_date || ''} onSave={v => void save(s, { due_date: v })}
                                  className={`w-[7.25rem] shrink-0 rounded border border-transparent bg-transparent px-1 text-xs hover:border-slate-200 ${late ? 'text-red-700' : s.due_date ? 'text-slate-600' : 'text-slate-300'}`} />
                                <span className="relative shrink-0">
                                  <button aria-label={`Ações de ${s.title}`} aria-expanded={rowMenu === s.id} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700" onClick={() => setRowMenu(m => (m === s.id ? null : s.id))}><MoreHorizontal size={14} /></button>
                                  {rowMenu === s.id && <div role="menu" className="absolute right-0 top-7 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl" onMouseLeave={() => setRowMenu(null)}>
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
                        {b.canEdit && !parentClosed && <form className="flex items-center gap-2 px-1.5 py-1" onSubmit={e => { e.preventDefault(); void addSub(g); }}>
                          <Plus size={14} className="text-slate-400" />
                          <input disabled={busy} data-addsub aria-label={`Adicionar item${g ? ` em ${g}` : ''}`} placeholder="Adicionar item" value={drafts[g] || ''} onChange={e => setDrafts(d => ({ ...d, [g]: e.target.value }))}
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                        </form>}
                      </div>
                    );
                  })}
                  {parentClosed && <p className="text-xs text-slate-500">Tarefa fechada: para acrescentar ou reabrir itens, reabra a Tarefa.</p>}
                  {b.canEdit && !parentClosed && (newGroup === null
                    ? <button className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" onClick={() => setNewGroup('')}><Plus size={13} />Novo grupo</button>
                    : <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); const v = (newGroup || '').trim(); if (v) void saveGroups([...groupLabels.filter(Boolean), v]); setNewGroup(null); }}>
                        <input autoFocus aria-label="Nome do novo grupo" value={newGroup} onChange={e => setNewGroup(e.target.value)} onBlur={() => setNewGroup(null)} placeholder="Ex.: Conteúdo, Validação" className="rounded border border-slate-200 px-2 py-1 text-sm" />
                      </form>)}
                </div>
              </section>
            )}

            <section aria-label="Critérios de aceite e entrega">
              <h3 className="text-sm font-semibold">Critérios de aceite {criteria.length > 0 && <span className="tabular-nums text-slate-500">{marked.size}/{criteria.length}</span>}</h3>
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

            {/* atividade: o registro da Daily é a atividade do card */}
            <section aria-label="Atividade">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare size={15} />Atividade</h3>
                <span className="ml-auto inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
                  {([['all', 'Tudo'], ['daily', 'Daily'], ['loose', `Sem vínculo${unlinked ? ` ${unlinked}` : ''}`], ['comment', 'Comentários'], ['history', 'Histórico']] as const).map(([k, v]) =>
                    <button key={k} className={`rounded-md px-2 py-0.5 ${feedFilter === k ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setFeedFilter(k)}>{v}</button>)}
                </span>
              </div>
              {b.canEdit && <form className="mt-2 rounded-lg border border-slate-200 p-2" onSubmit={e => { e.preventDefault(); void post(); }}>
                <textarea data-composer rows={2} value={composer} onChange={e => setComposer(e.target.value)} placeholder={composerMode === 'daily' ? 'O que andou hoje? Vira registro na Visão Daily, já vinculado a este card.' : 'Escrever comentário'}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-400" />
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <button type="button" className={`rounded-md border px-2 py-0.5 ${composerMode === 'daily' ? 'border-cyan-200 bg-cyan-50 font-semibold text-cyan-800' : 'border-slate-200 text-slate-500'}`} onClick={() => setComposerMode('daily')}>Registro de hoje</button>
                  <button type="button" className={`rounded-md border px-2 py-0.5 ${composerMode === 'comment' ? 'border-cyan-200 bg-cyan-50 font-semibold text-cyan-800' : 'border-slate-200 text-slate-500'}`} onClick={() => setComposerMode('comment')}>Comentário</button>
                  {composerMode === 'daily' && projectsForEntry.length > 1 && <select aria-label="Projeto do registro" value={entryProject} onChange={e => setComposerProject(e.target.value)} className="rounded border border-slate-200 px-1 py-0.5">
                    {projectsForEntry.map(id => <option key={id} value={id}>{b.projects.find(p => p.id === id)?.name || 'Projeto'}</option>)}</select>}
                  {composerMode === 'daily' && !projectsForEntry.length && <span className="text-amber-700">ponha o card num projeto para registrar</span>}
                  <button className="ml-auto rounded-md bg-cyan-700 px-3 py-1 font-semibold text-white disabled:opacity-50" disabled={!composer.trim() || busy || (composerMode === 'daily' && !projectsForEntry.length)}>{composerMode === 'daily' ? 'Registrar' : 'Enviar'}</button>
                </div>
              </form>}
              <ol className="mt-3 space-y-3">
                {shownFeed.slice(0, feedLimit).map(f => {
                  if (f.kind === 'daily') {
                    const e = f.entry, who = e.responsible_id ? people.find(p => p.id === e.responsible_id)?.name : undefined;
                    const sub = f.suggestion ? kids.find(k => k.id === f.suggestion!.id) : undefined;
                    return (
                      <li key={'d' + e.id} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-cyan-800"><CalendarDays size={13} /></span>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500"><button className="font-semibold text-slate-700 hover:underline" onClick={() => onOpenDay?.(e.day, e.project_id)}>Daily {br(e.day)}</button>{who && <> · {who}</>}{projectsForEntry.length > 1 && <> · {b.projects.find(p => p.id === e.project_id)?.name}</>}
                            {f.linkedTo.length > 0 && <span className="ml-1 text-cyan-700">· {f.linkedTo.map(id => (id === t.id ? 'card' : kids.find(k => k.id === id)?.title || 'Sub Tarefa')).join(', ')}</span>}</div>
                          <p className="mt-0.5 whitespace-pre-wrap rounded-md border border-slate-200 border-l-[3px] border-l-cyan-600 px-2.5 py-1.5 text-slate-800">{e.body}</p>
                          {!f.linkedTo.length && b.canEdit && <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            {sub && <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800"><AlertTriangle size={12} />Parece com "{sub.title}"
                              <button disabled={busy} className="rounded border border-amber-400 bg-white px-1.5 font-semibold" onClick={() => void link(e, sub.id)}>Vincular</button>
                              {sub.status !== 'concluida' && <button disabled={busy} className="rounded border border-amber-400 bg-white px-1.5 font-semibold" onClick={() => void link(e, sub.id, sub)}>Vincular e marcar</button>}</span>}
                            <button disabled={busy} className="rounded border border-slate-200 px-1.5 text-slate-600 hover:bg-slate-50" onClick={() => void link(e, t.id)}>Vincular ao card</button>
                          </div>}
                        </div>
                      </li>
                    );
                  }
                  if (f.kind === 'comment') return (
                    <li key={'c' + f.id} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm">
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600"><User size={13} /></span>
                      <div className="min-w-0"><div className="flex items-center gap-2 text-xs text-slate-500"><b className="text-slate-700">{people.find(p => p.id === f.author_id)?.name || 'Membro'}</b>{new Date(f.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {f.author_id === me && <button className="ml-auto text-slate-400 hover:text-red-700" onClick={() => void deleteComment(f.id).then(() => setB(cur => cur && { ...cur, comments: cur.comments.filter(x => x.id !== f.id) })).catch(fail)}>apagar</button>}</div>
                        <p className="mt-0.5 whitespace-pre-wrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5">{f.body}</p></div>
                    </li>);
                  return <li key={'h' + f.id} className="pl-8 text-xs text-slate-400">{new Date(f.at).toLocaleDateString('pt-BR')} · {f.text}</li>;
                })}
                {!shownFeed.length && <li className="text-xs text-slate-500">{feedFilter === 'loose' ? 'Nenhum registro do projeto sem vínculo nos últimos 60 dias.' : 'Nada por aqui ainda.'}</li>}
              </ol>
              {shownFeed.length > feedLimit && <button className="mt-2 text-xs text-cyan-700 hover:underline" onClick={() => setFeedLimit(n => n + 20)}>Ver mais {Math.min(20, shownFeed.length - feedLimit)}</button>}
              {feedFilter === 'all' && <button className="mt-2 ml-3 text-xs text-slate-500 hover:text-slate-800" onClick={() => setShowHistory(v => !v)}>{showHistory ? 'Esconder' : 'Mostrar'} histórico de mudanças ({b.history.length})</button>}
            </section>
          </main>

          {/* trilho de ações, como no Trello */}
          <aside className="space-y-4 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
            {b.canEdit && <div className="space-y-1.5">
              <div className={label}>Adicionar ao card</div>
              <button className={railBtn} onClick={() => focusEl('#tm-owner select')}><User size={14} />Responsável</button>
              {!isSub && <button className={railBtn} onClick={() => { setMoreOpen(true); focusEl('#tm-labels button'); }}><Tag size={14} />Projetos e etiquetas</button>}
              {!isSub && <button className={railBtn} disabled={parentClosed} onClick={() => focusEl('[data-addsub]')}><ListChecks size={14} />Item no checklist</button>}
              <button className={railBtn} onClick={() => focusEl('.tm-due')}><CalendarDays size={14} />Prazo</button>
            </div>}
            {b.canEdit && <div className="space-y-1.5">
              <div className={label}>Visão Daily</div>
              <button className={`${railBtn} !bg-cyan-700 font-semibold !text-white hover:!bg-cyan-800`} disabled={!projectsForEntry.length} title={projectsForEntry.length ? '' : 'Ponha o card num projeto para registrar'} onClick={() => { setComposerMode('daily'); setFeedFilter('all'); focusEl('[data-composer]'); }}><CalendarDays size={14} />Registrar hoje</button>
              <button className={railBtn} onClick={() => setFeedFilter('loose')}><Link2 size={14} />Vincular registros{unlinked ? ` (${unlinked})` : ''}</button>
            </div>}
            <div className="space-y-1.5">
              <div className={label}>Ações</div>
              <button className={railBtn} onClick={() => void copyLink()}><Link2 size={14} />Copiar link</button>
              {!isSub && b.canEdit && <button className={railBtn} disabled={ro} onClick={() => void duplicate()}><Copy size={14} />Duplicar</button>}
              {isSub && b.canEdit && <button className={railBtn} disabled={ro} onClick={() => void promoteSelf()}><ArrowUpRight size={14} />Virar Tarefa</button>}
              {initiative?.source_note && <a className={railBtn} href={`?view=learning&section=vault&wiki_path=${encodeURIComponent(initiative.source_note)}`}><BookOpen size={14} />Ver na Wiki</a>}
              {b.canEdit && <button className={`${railBtn} text-red-700`} disabled={ro} onClick={() => void cancelTask()}><Trash2 size={14} />Cancelar</button>}
            </div>
            <p className="text-[11px] tabular-nums text-slate-400">{t.task_key} · r{t.revision}</p>
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
    className="w-full resize-none rounded bg-transparent text-xl font-semibold leading-snug outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-600/30" />;
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
