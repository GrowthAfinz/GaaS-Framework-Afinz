import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Check, ExternalLink, KanbanSquare, MessageSquareText, Plus, Search, X } from 'lucide-react';
import { TASK_PRIORITY, TASK_STATUS, taskError } from '../development/developmentService';
import { addDays, brDate, initials, personColor, type DailyPartner, type DailyProject } from './dailyModel';
import type { DailyInitiative, DailyWork, EntryLite } from './dailyService';

/* ---------- vocabulário compartilhado ---------- */
export const STATUS_ORDER = ['backlog', 'planejando', 'pronta', 'em_execucao', 'bloqueada', 'concluida'] as const;
export const STATUS_COLOR: Record<string, string> = {
  backlog: '#94a3b8', planejando: '#6366f1', pronta: '#0891b2', em_execucao: '#d97706', bloqueada: '#dc2626', concluida: '#16a34a', cancelada: '#64748b',
};
export const statusLabel = (s: string) => TASK_STATUS[s as keyof typeof TASK_STATUS] || s;
const TYPE_LABEL: Record<string, string> = { investigation: 'Investigação', experiment: 'Experimento', spec: 'Especificação' };
export const isOverdue = (w: DailyWork, today: string) => Boolean(w.due_date && w.due_date < today && !['concluida', 'cancelada'].includes(w.status));

/** Nome curto do board: as quatro frentes que o Pablo acompanha na daily têm nome fixo; o resto usa o título. */
export function boardName(i: DailyInitiative): string {
  const t = i.title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (t.includes('seguro')) return 'Seguros';
  if (t.includes('parceiros')) return 'Pool Parceiros';
  if (t.includes('visa')) return 'Pool Visa';
  if (i.workspace === 'acquisition' || t.includes('aquisicao')) return 'Aquisição';
  return i.title;
}
const BOARD_ORDER = ['Seguros', 'Aquisição', 'Pool Visa', 'Pool Parceiros'];
/** Boards = iniciativas ligadas a algum projeto ativo da Daily, na ordem das quatro frentes. */
export function dailyBoards(initiatives: DailyInitiative[], projects: DailyProject[]): DailyInitiative[] {
  const linked = new Set(projects.filter(p => !p.archived && !p.merged_into && p.initiative_id).map(p => p.initiative_id as string));
  const rank = (i: DailyInitiative) => { const k = BOARD_ORDER.indexOf(boardName(i)); return k < 0 ? 99 : k; };
  return initiatives.filter(i => linked.has(i.id)).sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, 'pt-BR'));
}

export function StatusPill({ status, small }: { status: string; small?: boolean }) {
  const c = STATUS_COLOR[status] || '#64748b';
  return <span className={`dv-st${small ? ' sm' : ''}`} style={{ color: c, background: `color-mix(in srgb, ${c} 12%, white)` }}><i style={{ background: c }} />{statusLabel(status)}</span>;
}

/* ---------- seletor de trabalhos para um registro ---------- */
/** No seletor, o que está andando aparece antes do que ainda vai começar. */
const PICK_ORDER = ['em_execucao', 'bloqueada', 'pronta', 'planejando', 'backlog', 'concluida'];
export function WorkPicker({ works, initiativeId, initiatives, selected, today, onToggle, onCreate, onCreateSub }: {
  works: DailyWork[]; initiativeId: string | null; initiatives: Map<string, DailyInitiative>; selected: string[]; today: string;
  onToggle: (id: string) => void; onCreate?: () => void;
  /** Cria Sub Tarefa nesta Tarefa a partir do registro (o registro fica vinculado como origem). */
  onCreateSub?: (parentId: string) => void;
}) {
  const [q, setQ] = useState('');
  const [openIds, setOpenIds] = useState<string[]>([]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const kidsOf = useMemo(() => {
    const m = new Map<string, DailyWork[]>();
    for (const w of works) if (w.parent_task_id) m.set(w.parent_task_id, [...(m.get(w.parent_task_id) || []), w]);
    return m;
  }, [works]);
  const list = useMemo(() => {
    const nq = norm(q.trim());
    const hit = (w: DailyWork) => norm(w.title + ' ' + w.task_key).includes(nq);
    const open = works.filter(w => !w.parent_task_id && w.status !== 'cancelada' && (nq ? hit(w) || (kidsOf.get(w.id) || []).some(hit)
      : w.initiative_id === initiativeId || selected.includes(w.id) || (kidsOf.get(w.id) || []).some(k => selected.includes(k.id))));
    return open.sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)) || Number(b.initiative_id === initiativeId) - Number(a.initiative_id === initiativeId)
      || PICK_ORDER.indexOf(a.status) - PICK_ORDER.indexOf(b.status)).slice(0, 60);
  }, [works, q, initiativeId, selected, kidsOf]);
  const row = (w: DailyWork, sub: boolean) => {
    const on = selected.includes(w.id);
    return (
      <button key={w.id} className="dv-pi" style={sub ? { paddingLeft: 34 } : undefined} onClick={() => onToggle(w.id)} title={on ? 'Desvincular' : 'Vincular: o registro aparece na Tarefa, nada novo é criado'}>
        <span className={`dv-cb${on ? ' on' : ''}`}>{on && <Check />}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: on ? 600 : 400, fontSize: sub ? 12.5 : undefined }}>{w.title}</span>
          <span style={{ fontSize: 10.5, color: isOverdue(w, today) ? '#b91c1c' : '#94a3b8' }}>{sub ? 'Sub Tarefa · ' : ''}{statusLabel(w.status)}{w.due_date ? ` · prazo ${brDate(w.due_date)}` : ''}{!sub && w.initiative_id !== initiativeId && w.initiative_id ? ` · ${initiatives.get(w.initiative_id)?.title || ''}` : ''}</span>
        </span>
      </button>
    );
  };
  return (
    <>
      <div className="hd"><b>Vincular a Tarefa…</b><div className="s">{initiativeId ? `Tarefas de ${initiatives.get(initiativeId)?.title || 'iniciativa'}; busque para ver as outras` : 'Projeto sem iniciativa: busque em todas as Tarefas'}</div></div>
      <div style={{ padding: 10, borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 19, top: 20, color: '#94a3b8' }} />
        <input autoFocus type="search" value={q} placeholder="Buscar Tarefa ou Sub Tarefa" style={{ paddingLeft: 26 }} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="lst">
        {list.map(w => {
          const kids = (kidsOf.get(w.id) || []).filter(k => k.status !== 'cancelada');
          const expanded = openIds.includes(w.id) || Boolean(q.trim()) || kids.some(k => selected.includes(k.id));
          return (
            <div key={w.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>{row(w, false)}</div>
                {kids.length > 0 && <button className="dv-ib sm" title={expanded ? 'Recolher Sub Tarefas' : `Ver ${kids.length} Sub Tarefas`} onClick={() => setOpenIds(ids => (ids.includes(w.id) ? ids.filter(x => x !== w.id) : [...ids, w.id]))}>{kids.length}</button>}
                {onCreateSub && <button className="dv-ib sm" title="Criar Sub Tarefa nesta Tarefa a partir do registro" onClick={() => onCreateSub(w.id)}><Plus /></button>}
              </div>
              {expanded && kids.sort((a, b) => a.title.localeCompare(b.title)).map(k => row(k, true))}
            </div>
          );
        })}
        {!list.length && <div className="dv-empty" style={{ padding: '8px 12px' }}>{q ? 'Nenhuma Tarefa com esse nome.' : 'Esta iniciativa ainda não tem Tarefas.'}</div>}
      </div>
      <div className="ft" style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Marcar vincula (nada novo é criado). O + cria Sub Tarefa naquela Tarefa.</span>
        {onCreate && <button className="dv-link" onClick={onCreate}><Plus size={12} style={{ verticalAlign: -2 }} /> Criar Tarefa nova a partir deste registro</button>}
      </div>
    </>
  );
}

/* ---------- tags dos cards ---------- */
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Palavras genéricas que não distinguem um card do outro dentro da frente. */
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'para', 'com', 'em', 'no', 'na', 'seguro', 'seguros', 'pool', 'ofertas', 'oferta',
  'bases', 'base', 'midia', 'funil', 'meio', 'topo', 'parceiros', 'visa', 'compra', 'grupo', 'outros', 'abandonado', 'portfolio', 'reativacao', 'ativacao']);
/** Tags que valem para qualquer frente: cadência e canal. */
const FIXED_TAGS = ['Trigger', 'Mensal', 'Semanal', 'Diário', 'WhatsApp', 'SMS', 'E-mail', 'Push', 'LP', 'Device'];
export interface TagVocab { label: string; key: string; color: string | null }
/**
 * Vocabulário de tags de um board: as palavras que distinguem os projetos da iniciativa (Seguro Mulher -> Mulher,
 * Pool Parceiros (Star, Sipolatti) -> Star, Sipolatti), os parceiros cadastrados e cadência/canal.
 */
export function boardVocab(projects: DailyProject[], partners: DailyPartner[], initiativeId: string): TagVocab[] {
  const out = new Map<string, TagVocab>();
  const add = (label: string, color: string | null) => { const key = norm(label); if (key.length >= 3 && !STOP.has(key) && !out.has(key)) out.set(key, { label, key, color }); };
  for (const pr of projects) {
    if (pr.initiative_id !== initiativeId || pr.archived || pr.merged_into) continue;
    for (const w of pr.name.split(/[^\p{L}\p{N}-]+/u)) if (w) add(w.charAt(0).toUpperCase() + w.slice(1), personColor(norm(w)));
  }
  for (const pa of partners) if (!pa.archived) add(pa.name, pa.color);
  for (const f of FIXED_TAGS) add(f, null);
  return [...out.values()];
}
export function workTags(w: DailyWork, vocab: TagVocab[]): TagVocab[] {
  const text = ' ' + norm(`${w.title} ${w.next_action || ''}`).replace(/[^a-z0-9-]+/g, ' ') + ' ';
  return vocab.filter(v => text.includes(' ' + v.key.replace(/[^a-z0-9-]+/g, ' ') + ' ')).slice(0, 4);
}
const tagStyle = (t: TagVocab) => (t.color ? { color: `color-mix(in srgb, ${t.color} 80%, black)`, background: `color-mix(in srgb, ${t.color} 14%, white)` } : undefined);

/* ---------- kanban da iniciativa ---------- */
interface KanbanProps {
  /** Abre a janela da Tarefa (a mesma de Tarefas e atividades). */
  onOpenTask?: (id: string) => void;
  boards: DailyInitiative[]; boardId: string; focusWorkId: string | null; works: DailyWork[]; mentions: EntryLite[];
  projects: Map<string, DailyProject>; partners: DailyPartner[]; today: string; canEdit: boolean;
  onBoard: (id: string) => void; onClose: () => void;
  onSave: (w: DailyWork | null, body: Record<string, unknown>) => Promise<DailyWork>;
  onOpenDay: (day: string, projectId: string) => void;
}

export function DailyKanbanModal(p: KanbanProps) {
  const board = p.boards.find(b => b.id === p.boardId) || null;
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<{ work: DailyWork; reason: string } | null>(null);
  const [adding, setAdding] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [open, setOpen] = useState<string | null>(p.focusWorkId);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const focusRef = useRef<HTMLDivElement>(null);

  const vocab = useMemo(() => boardVocab([...p.projects.values()], p.partners, p.boardId), [p.projects, p.partners, p.boardId]);
  const tagsOf = useMemo(() => new Map(p.works.filter(w => w.initiative_id === p.boardId).map(w => [w.id, workTags(w, vocab)])), [p.works, p.boardId, vocab]);
  const allWorks = useMemo(() => p.works.filter(w => w.initiative_id === p.boardId && !w.parent_task_id), [p.works, p.boardId]);
  const tagCounts = useMemo(() => {
    const m = new Map<string, { tag: TagVocab; n: number }>();
    for (const w of allWorks) if (w.status !== 'cancelada') for (const t of tagsOf.get(w.id) || []) m.set(t.key, { tag: t, n: (m.get(t.key)?.n || 0) + 1 });
    return [...m.values()].sort((a, b) => Number(Boolean(b.tag.color)) - Number(Boolean(a.tag.color)) || b.n - a.n);
  }, [allWorks, tagsOf]);
  const works = useMemo(() => {
    const nq = norm(q.trim());
    return allWorks.filter(w => (!tagFilter.length || (tagsOf.get(w.id) || []).some(t => tagFilter.includes(t.key)) || w.id === p.focusWorkId)
      && (!nq || norm(`${w.title} ${w.next_action || ''} ${w.owner_label || ''} ${w.task_key}`).includes(nq)));
  }, [allWorks, tagFilter, tagsOf, q, p.focusWorkId]);
  const byStatus = useMemo(() => {
    const m = new Map<string, DailyWork[]>();
    for (const w of works) m.set(w.status, [...(m.get(w.status) || []), w]);
    const prio = (w: DailyWork) => ['P0', 'P1', 'P2', 'P3'].indexOf(w.priority);
    for (const list of m.values()) list.sort((a, b) => prio(a) - prio(b) || (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.title.localeCompare(b.title, 'pt-BR'));
    return m;
  }, [works]);
  const mentionsOf = useMemo(() => {
    const m = new Map<string, EntryLite[]>();
    for (const e of p.mentions) for (const id of e.work_ids) m.set(id, [...(m.get(id) || []), e]);
    for (const list of m.values()) list.sort((a, b) => b.day.localeCompare(a.day));
    return m;
  }, [p.mentions]);

  useEffect(() => { setOpen(p.focusWorkId); setError(''); }, [p.focusWorkId, p.boardId]);
  useEffect(() => { setTagFilter([]); setQ(''); }, [p.boardId]);
  useEffect(() => { focusRef.current?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); }, [p.boardId, p.focusWorkId]);
  const onClose = useRef(p.onClose); onClose.current = p.onClose;
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); if (blocking) setBlocking(null); else onClose.current(); } };
    document.addEventListener('keydown', key, true); return () => document.removeEventListener('keydown', key, true);
  }, [blocking]);

  const save = async (w: DailyWork | null, body: Record<string, unknown>) => {
    setBusy(true); setError('');
    try { await p.onSave(w, body); return true; } catch (e) { setError(taskError(e)); return false; } finally { setBusy(false); }
  };
  const drop = async (status: string) => {
    const w = works.find(x => x.id === dragId); setDragId(null); setOverCol(null);
    if (!w || w.status === status) return;
    if (status === 'bloqueada') { setBlocking({ work: w, reason: w.blocked_reason || '' }); return; }
    // Concluir exige critérios e evidência, que se registram na tela completa de Tarefas.
    if (!(await save(w, { status })) && status === 'concluida') setError(e => `${e} Use "Abrir em Tarefas e atividades" para registrar.`);
  };
  const create = async () => {
    const title = adding.trim(); if (!board) return;
    if (title.length < 5) { setError('Dê um título com pelo menos 5 letras.'); return; }
    if (await save(null, { title, initiative_id: board.id, workspace: board.workspace })) setAdding('');
  };
  const tasksUrl = board ? `${window.location.pathname}?view=operacao&section=investigations&task_space=${board.workspace}&work_initiative=${board.id}` : '#';
  const cols: string[] = [...STATUS_ORDER, ...(showCancelled ? ['cancelada'] : [])];
  const cancelled = byStatus.get('cancelada')?.length || 0;

  const card = (w: DailyWork) => {
    const ms = mentionsOf.get(w.id) || [], focus = w.id === p.focusWorkId, expanded = open === w.id, late = isOverdue(w, p.today);
    const soon = !late && Boolean(w.due_date) && !['concluida', 'cancelada'].includes(w.status) && (w.due_date as string) <= addDays(p.today, 3);
    const tags = tagsOf.get(w.id) || [];
    return (
      <div key={w.id} ref={focus ? focusRef : undefined} className={`dv-kc${focus ? ' focus' : ''}${expanded ? ' open' : ''}${dragId === w.id ? ' dragging' : ''}`} style={{ ['--sc' as string]: STATUS_COLOR[w.status] || '#64748b' }}
        draggable={p.canEdit && !busy} onDragStart={e => { setDragId(w.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', w.id); }} onDragEnd={() => { setDragId(null); setOverCol(null); }}
        onClick={() => setOpen(expanded ? null : w.id)}>
        <div className="top">
          <span className={`pr p${w.priority}`} title={TASK_PRIORITY[w.priority as keyof typeof TASK_PRIORITY]}>{w.priority}</span>
          {TYPE_LABEL[w.work_type] && <span className="ty">{TYPE_LABEL[w.work_type]}</span>}
          {tags.map(t => <span key={t.key} className={`dv-ktag${t.color ? '' : ' neutral'}`} style={tagStyle(t)}>{t.label}</span>)}
          {focus && <span className="here">deste registro</span>}
        </div>
        <div className="tt">{w.title}</div>
        {p.onOpenTask && <button className="dv-link" style={{ fontSize: 12, marginTop: 2 }} onClick={ev => { ev.stopPropagation(); p.onOpenTask?.(w.id); }}>Abrir Tarefa</button>}
        {w.status === 'bloqueada' && w.blocked_reason && <div className="bl">{w.blocked_reason}</div>}
        {w.next_action && <div className="na"><b>Próxima ação</b>{w.next_action}</div>}
        <div className="ft">
          {w.owner_label
            ? <span className="who" title={`Responsável: ${w.owner_label}`}><span className="dv-kav" style={{ background: personColor(w.owner_label) }}>{initials(w.owner_label)}</span>{w.owner_label.split(/\s+/)[0]}</span>
            : <span title="Sem responsável definido" style={{ color: '#94a3b8' }}>sem responsável</span>}
          {w.due_date && <span className={`due${late ? ' late' : soon ? ' soon' : ''}`} title={late ? 'Prazo vencido' : soon ? 'Prazo nos próximos 3 dias' : 'Prazo'}><CalendarClock />{brDate(w.due_date)}</span>}
          {ms.length > 0 && <span className="ment" title={`Citado ${ms.length} ${ms.length === 1 ? 'vez' : 'vezes'} na Daily; última em ${brDate(ms[0].day)}`}><MessageSquareText />{ms.length} · {brDate(ms[0].day)}</span>}
        </div>
        {expanded && ms.length > 0 && (
          <ol className="tl" onClick={e => e.stopPropagation()}>
            {ms.slice(0, 6).map(e => (
              <li key={e.id}><button className="dv-link" onClick={() => p.onOpenDay(e.day, e.project_id)}>{brDate(e.day)}</button> <span className="pj">{p.projects.get(e.project_id)?.name}</span><div>{e.body}</div></li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  return (
    <div className="dv-km" onPointerDown={e => { if (e.target === e.currentTarget) p.onClose(); }}>
      <div className="dv-kbox" role="dialog" aria-label={`Kanban ${board ? boardName(board) : ''}`}>
        <header>
          <span className="ic"><KanbanSquare /></span>
          <div style={{ minWidth: 0 }}>
            <b>{board ? board.title : 'Kanban'}</b>
            <p>{allWorks.length} {allWorks.length === 1 ? 'Tarefa' : 'Tarefas'}{works.length !== allWorks.length ? ` · ${works.length} no filtro` : ''} · arraste os cards entre colunas para mudar o status{p.canEdit ? '' : ' (somente leitura)'}</p>
          </div>
          <span style={{ flex: 1 }} />
          <a className="cs-btn" href={tasksUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Abrir em Tarefas e atividades</a>
          <button className="dv-ib" aria-label="Fechar" onClick={p.onClose}><X /></button>
        </header>
        <nav className="dv-ktabs" role="tablist">
          {p.boards.map(b => {
            const n = p.works.filter(w => w.initiative_id === b.id && !w.parent_task_id && !['concluida', 'cancelada'].includes(w.status)).length;
            return <button key={b.id} role="tab" aria-selected={b.id === p.boardId} className={b.id === p.boardId ? 'on' : ''} onClick={() => p.onBoard(b.id)}>{boardName(b)}<span>{n}</span></button>;
          })}
          {cancelled > 0 && <button className="dv-link" style={{ marginLeft: 'auto' }} onClick={() => setShowCancelled(s => !s)}>{showCancelled ? 'Esconder' : 'Mostrar'} {cancelled} cancelado{cancelled > 1 ? 's' : ''}</button>}
        </nav>
        <div className="dv-kfil">
          <label className="srch"><Search /><input type="search" value={q} placeholder="Buscar Tarefa, responsável ou código" onChange={e => setQ(e.target.value)} /></label>
          {tagCounts.length > 0 && <span className="lb">Filtrar:</span>}
          {tagCounts.map(({ tag, n }) => (
            <button key={tag.key} type="button" className={`dv-ktag${tag.color ? '' : ' neutral'}${tagFilter.includes(tag.key) ? ' on' : ''}`} style={tagStyle(tag)}
              onClick={() => setTagFilter(f => (f.includes(tag.key) ? f.filter(x => x !== tag.key) : [...f, tag.key]))}>{tag.label}<small>{n}</small></button>
          ))}
          {(tagFilter.length > 0 || q) && <button className="dv-link" onClick={() => { setTagFilter([]); setQ(''); }}>Limpar</button>}
        </div>
        {error && <div className="dv-kerr">{error}<button className="dv-ib sm" aria-label="Fechar aviso" onClick={() => setError('')}><X /></button></div>}
        <div className="dv-kcols">
          {cols.map(status => {
            const list = byStatus.get(status) || [];
            return (
              <section key={status} className={`dv-kcol${overCol === status ? ' over' : ''}`} style={{ ['--sc' as string]: STATUS_COLOR[status] }}
                onDragOver={e => { if (!dragId) return; e.preventDefault(); if (overCol !== status) setOverCol(status); }} onDragLeave={() => setOverCol(c => (c === status ? null : c))}
                onDrop={e => { e.preventDefault(); void drop(status); }}>
                <h4><i />{statusLabel(status)}<span>{list.length}</span></h4>
                {status === 'backlog' && p.canEdit && board && (
                  <div className="dv-kadd">
                    <input value={adding} placeholder="Nova Tarefa" onChange={e => setAdding(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void create(); }} />
                    <button className="dv-ib sm" aria-label="Criar Tarefa" disabled={busy} onClick={() => void create()}><Plus /></button>
                  </div>
                )}
                <div className="cards">{list.map(card)}{!list.length && <div className="empty">Nada aqui</div>}</div>
              </section>
            );
          })}
        </div>
        {blocking && (
          <div className="dv-kblock" onPointerDown={e => e.stopPropagation()}>
            <b>O que está travando "{blocking.work.title}"?</b>
            <textarea autoFocus rows={2} value={blocking.reason} onChange={e => setBlocking({ ...blocking, reason: e.target.value })} placeholder="Ex.: aguardando LP do parceiro" />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="cs-btn" onClick={() => setBlocking(null)}>Cancelar</button>
              <button className="cs-btn pri" disabled={!blocking.reason.trim() || busy}
                onClick={async () => { if (await save(blocking.work, { status: 'bloqueada', blocked_reason: blocking.reason.trim() })) setBlocking(null); }}>Marcar como bloqueada</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

