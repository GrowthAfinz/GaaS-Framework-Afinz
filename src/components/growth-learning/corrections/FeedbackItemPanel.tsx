import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, ThumbsUp } from 'lucide-react';
import {
  FRONTS, ITEM_TYPES, KIND_LABELS, STATUS_LABELS, STATUS_TONE, itemTypeLabel, statusLabel,
  type FeedbackAttachment, type FeedbackEvent, type FeedbackItem, type FeedbackKind,
} from '../../feedback/feedbackModel';
import {
  ACCEPTED_FILES, addAttachment, attachmentUrl, deleteFeedback, editFeedback, feedbackError, listAttachments, listEvents,
  recordDecision, removeAttachment, replaceAttachment, toggleVote,
} from '../../feedback/feedbackService';
import { notifyFeedbackChanged } from '../../feedback/feedbackBus';
import { SUBJECTS } from './correctionsShared';

interface Props {
  item: FeedbackItem;
  people: Record<string, string>;
  votes: number;
  voted: boolean;
  isAdmin: boolean;
  onChanged: (next: FeedbackItem | null) => void;
}

const when = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
const kb = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const EVENT_LABELS: Record<string, string> = {
  created: 'Aberto', edited: 'Editado', decided: 'Decisão registrada', claimed: 'A IA começou', completed: 'A IA concluiu',
  failed: 'A IA não conseguiu concluir', reviewed: 'Revisado', applied: 'Aplicado',
};

function openInPlace(route: string) {
  window.history.pushState({}, '', window.location.pathname + (route.startsWith('?') ? route : '?' + route));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function FeedbackItemPanel({ item, people, votes, voted, isAdmin, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.body);
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [priority, setPriority] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacing = useRef<FeedbackAttachment | null>(null);

  useEffect(() => {
    setEditing(false); setDraft(item.body); setError(''); setDecisionNote(''); setPriority('');
    let alive = true;
    void Promise.all([listAttachments(item.id), listEvents(item.id)])
      .then(([a, e]) => { if (alive) { setAttachments(a); setEvents(e); } })
      .catch(() => { if (alive) setError('Não foi possível carregar anexos e histórico.'); });
    return () => { alive = false; };
  }, [item.id, item.revision]);

  const run = async (action: () => Promise<FeedbackItem | null>) => {
    setBusy(true); setError('');
    try {
      const next = await action();
      notifyFeedbackChanged();
      onChanged(next);
    } catch (e) { setError(feedbackError(e)); } finally { setBusy(false); }
  };

  const patch = (p: Partial<Pick<FeedbackItem, 'body' | 'item_type' | 'kind' | 'front' | 'subject'>>) => run(() => editFeedback(item, p));
  const reloadAttachments = async () => setAttachments(await listAttachments(item.id));
  const attach = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError('');
    try { for (const file of Array.from(files)) await addAttachment(item.id, file); await reloadAttachments(); notifyFeedbackChanged(); }
    catch (e) { setError(e instanceof Error && !/feedback_/.test(e.message) ? e.message : feedbackError(e)); }
    finally { setBusy(false); }
  };
  const view = async (a: FeedbackAttachment) => {
    try { window.open(await attachmentUrl(a.storage_path), '_blank', 'noopener'); } catch { setError('Não foi possível abrir o anexo.'); }
  };

  const author = people[item.created_by] || 'Pessoa do time';
  const editor = item.updated_by && item.updated_by !== item.created_by ? people[item.updated_by] || 'outra pessoa' : null;

  return (
    <aside aria-label="Detalhe do comentário" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span className="rounded border border-slate-400 bg-white px-1.5 py-0.5 text-slate-900">{item.page_label}</span>
          <span className={`rounded-full px-2 py-0.5 ${STATUS_TONE[item.status]}`}>{statusLabel(item)}</span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" disabled={busy} onClick={() => setEditing(!editing)} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700">{editing ? 'Cancelar' : 'Editar'}</button>
          <button type="button" disabled={busy} onClick={() => { if (window.confirm('Excluir apaga o comentário e os anexos de vez, sem histórico. Continuar?')) void run(async () => { await deleteFeedback(item.id); return null; }); }}
            className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700">Excluir</button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
          {['with_ai', 'proposal_ready', 'approved'].includes(item.status) || item.priority ? <p className="text-xs text-amber-800">Como o pedido muda, o item volta para a conversa com a IA e perde a prioridade combinada.</p> : null}
          <button type="button" disabled={busy || draft.trim().length < 3} onClick={() => { setEditing(false); void patch({ body: draft }); }} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Salvar texto</button>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-slate-900">{item.body}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">{author} · {when(item.created_at)}{editor ? ` · editado por ${editor} em ${when(item.updated_at)}` : ''}</p>
      <button type="button" disabled={busy} aria-pressed={voted} onClick={() => void run(async () => { await toggleVote(item.id); return item; })}
        className={`mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${voted ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-300 text-slate-700'}`}>
        <ThumbsUp size={13} />{voted ? 'Você também viu isso' : '+1, também vi isso'} · {votes}
      </button>

      <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900">Localização</h3>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-cyan-800">{item.location_label || item.page_label}</p>
        {item.anchor?.exact && <blockquote className="mt-2 border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-xs text-slate-700">“{item.anchor.exact}”</blockquote>}
        {item.anchor_state === 'orphan' && <p className="mt-2 text-xs font-semibold text-orange-800">O trecho não existe mais na nota. Confira se ainda vale.</p>}
        {item.route && <button type="button" onClick={() => openInPlace(item.route)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-800 hover:underline">Abrir no lugar <ExternalLink size={12} /></button>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-slate-700">Frente
          <select disabled={busy} value={item.front || ''} onChange={e => void patch({ front: e.target.value || null })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal">
            <option value="">Sem frente</option>{FRONTS.map(f => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">Assunto
          <select disabled={busy} value={item.subject || ''} onChange={e => void patch({ subject: e.target.value || null })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal">
            <option value="">Sem assunto</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">Destino
          <select disabled={busy} value={item.kind} onChange={e => void patch({ kind: e.target.value as FeedbackKind, item_type: 'outro' })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal">
            {(Object.keys(KIND_LABELS) as FeedbackKind[]).map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">Tipo
          <select disabled={busy} value={item.item_type} onChange={e => void patch({ item_type: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal">
            <option value="outro">Outro</option>{ITEM_TYPES[item.kind].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {!ITEM_TYPES[item.kind].some(([v]) => v === item.item_type) && item.item_type !== 'outro' && <option value={item.item_type}>{itemTypeLabel(item.item_type)}</option>}
          </select>
        </label>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900">Anexos</h3>
      {attachments.length === 0 && <p className="text-xs text-slate-500">Nenhum anexo.</p>}
      <ul className="space-y-2">
        {attachments.map(a => (
          <li key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
            <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">{a.storage_path.split('.').pop()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{a.file_name}</p>
              <p className="text-xs text-slate-500">{kb(a.bytes)}</p>
            </div>
            <div className="flex gap-3 text-xs font-bold">
              <button type="button" onClick={() => void view(a)} className="text-cyan-800">Ver</button>
              <button type="button" disabled={busy} onClick={() => { replacing.current = a; replaceInput.current?.click(); }} className="text-cyan-800">Substituir</button>
              <button type="button" disabled={busy} onClick={() => void (async () => { setBusy(true); try { await removeAttachment(a.id); await reloadAttachments(); notifyFeedbackChanged(); } catch (e) { setError(feedbackError(e)); } finally { setBusy(false); } })()} className="text-red-700">Remover</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="mt-2 min-h-10 w-full rounded-lg border border-dashed border-slate-400 text-xs font-bold text-slate-700">+ Adicionar anexo</button>
      <input ref={fileInput} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={e => { void attach(e.target.files); e.target.value = ''; }} />
      <input ref={replaceInput} type="file" accept={ACCEPTED_FILES} className="hidden" onChange={e => {
        const file = e.target.files?.[0]; const old = replacing.current; e.target.value = '';
        if (file && old) void (async () => { setBusy(true); try { await replaceAttachment(old, file); await reloadAttachments(); notifyFeedbackChanged(); } catch (err) { setError(err instanceof Error && !/feedback_/.test(err.message) ? err.message : feedbackError(err)); } finally { setBusy(false); } })();
      }} />

      <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900">Decisão na conversa com a IA</h3>
      {item.decision_note || item.priority ? (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm">
          <p><strong>{item.status === 'declined' ? 'Não vamos fazer' : item.priority ? `Prioridade ${item.priority}` : STATUS_LABELS[item.status]}</strong>{item.decided_at ? ` · ${when(item.decided_at)}` : ''}{item.decided_via && item.decided_via !== 'gaas' ? ` · pelo ${item.decided_via === 'claude' ? 'Claude Code' : 'Codex'}` : ''}</p>
          {item.decision_note && <p className="mt-1 text-slate-700">{item.decision_note}</p>}
        </div>
      ) : <p className="text-xs text-slate-500">Ainda não passou pela conversa. Rode a skill para a IA apresentar este item.</p>}
      {item.proposal?.summary && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900"><strong>Proposta da IA:</strong> {item.proposal.summary}</p>}
      {item.result_ref && <a href={item.result_ref} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-800">Ver entrega <ExternalLink size={12} /></a>}

      {isAdmin && ['open', 'in_conversation', 'deferred', 'declined', 'needs_data', 'ai_disagrees'].includes(item.status) && (
        <details className="mt-3 rounded-lg border border-slate-200 p-3 text-xs">
          <summary className="cursor-pointer font-bold text-slate-700">Decidir aqui, sem a conversa</summary>
          <div className="mt-2 space-y-2">
            <input value={priority} onChange={e => setPriority(e.target.value.replace(/\D/g, ''))} placeholder="Prioridade (1, 2, 3...)" className="w-full rounded border border-slate-300 p-2" />
            <textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)} placeholder="O que combinar ou por que não fazer" rows={2} className="w-full rounded border border-slate-300 p-2" />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" disabled={busy || !priority} onClick={() => void run(() => recordDecision(item.id, 'in_conversation', Number(priority), decisionNote))} className="rounded bg-teal-700 px-2 py-1.5 font-bold text-white disabled:opacity-50">Priorizar</button>
              <button type="button" disabled={busy} onClick={() => void run(() => recordDecision(item.id, 'deferred', null, decisionNote))} className="rounded border border-slate-300 px-2 py-1.5 font-bold">Adiar</button>
              <button type="button" disabled={busy || !decisionNote.trim()} onClick={() => void run(() => recordDecision(item.id, 'declined', null, decisionNote))} className="rounded border border-red-200 px-2 py-1.5 font-bold text-red-700 disabled:opacity-50">Não vamos fazer</button>
              {item.status !== 'open' && <button type="button" disabled={busy} onClick={() => void run(() => recordDecision(item.id, 'open', null, decisionNote))} className="rounded border border-slate-300 px-2 py-1.5 font-bold">Reabrir</button>}
            </div>
          </div>
        </details>
      )}

      <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900">Caminho</h3>
      <ol className="space-y-1 text-xs text-slate-600">
        {events.map(e => <li key={e.id}>{EVENT_LABELS[e.event] || e.event}{e.to_status && e.event !== 'created' ? ` · ${STATUS_LABELS[e.to_status as FeedbackItem['status']] || e.to_status}` : ''} · {e.actor_id ? people[e.actor_id] || 'Pessoa do time' : 'Sistema'} · {when(e.created_at)}</li>)}
      </ol>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}
      <p className="mt-4 text-[11px] text-slate-500">Qualquer pessoa do time pode editar ou excluir. Excluir apaga o comentário e os anexos de vez, sem histórico.</p>
    </aside>
  );
}
