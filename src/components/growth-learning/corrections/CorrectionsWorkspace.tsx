import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Search } from 'lucide-react';
import {
  AI_COMMAND, EMPTY_FILTERS, FRONTS, REVIEW_STATUSES, STATUS_TONE, isOpen, itemTypeLabel, matchesFilters, sortItems, statusLabel,
  type FeedbackFilters, type FeedbackItem, type FeedbackRule,
} from '../../feedback/feedbackModel';
import {
  currentUserId, feedbackError, isFeedbackAdmin, listAttachmentCounts, listFeedbackItems, listPeople, listRules, listVotes,
  reviewProposal, setRuleStatus,
} from '../../feedback/feedbackService';
import { notifyFeedbackChanged, onFeedbackChanged, openFeedback } from '../../feedback/feedbackBus';
import { FeedbackItemPanel } from './FeedbackItemPanel';
import { HealthView } from './HealthView';
import { SUBJECTS, VIEW_LABELS, readCorrectionsRoute, writeCorrectionsRoute, type CorrectionsView } from './correctionsShared';

const when = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
const select = 'rounded-lg border border-slate-300 bg-white p-2 text-sm';

export function CorrectionsWorkspace({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const initial = readCorrectionsRoute(window.location.search);
  const [view, setView] = useState<CorrectionsView>(initial.view);
  const [selectedId, setSelectedId] = useState<string | null>(initial.item);
  const [filters, setFilters] = useState<FeedbackFilters>({ ...EMPTY_FILTERS, targetId: initial.target || undefined });
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [votes, setVotes] = useState<{ item_id: string; user_id: string }[]>([]);
  const [attachments, setAttachments] = useState<Record<string, number>>({});
  const [people, setPeople] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<FeedbackRule[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [rows, v, a, p, r, admin, uid] = await Promise.all([listFeedbackItems(), listVotes(), listAttachmentCounts(), listPeople(), listRules(), isFeedbackAdmin(), currentUserId()]);
      setItems(rows); setVotes(v); setAttachments(a); setPeople(p); setRules(r); setIsAdmin(admin); setUserId(uid); setError('');
    } catch (e) {
      setError(feedbackError(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); return onFeedbackChanged(() => void load()); }, [load]);
  useEffect(() => { onCountChange?.(items.filter(i => isOpen(i.status)).length); }, [items, onCountChange]);

  const choose = (next: CorrectionsView) => { setView(next); writeCorrectionsRoute({ fix_view: next === 'queue' ? null : next }); };
  const pick = (id: string | null) => { setSelectedId(id); writeCorrectionsRoute({ fix_item: id }); };
  const setFilter = <K extends keyof FeedbackFilters>(key: K, value: FeedbackFilters[K]) => setFilters(f => ({ ...f, [key]: value }));

  const voteCount = (id: string) => votes.filter(v => v.item_id === id).length;
  const visible = useMemo(() => sortItems(items.filter(i => matchesFilters(i, filters))), [items, filters]);
  const pages = useMemo(() => Array.from(new Set(items.map(i => i.page_label))).sort((a, b) => a.localeCompare(b, 'pt-BR')), [items]);
  const selected = items.find(i => i.id === selectedId) || visible[0] || null;
  const toReview = items.filter(i => REVIEW_STATUSES.includes(i.status));
  const counts: Record<CorrectionsView, number | null> = { queue: items.filter(i => isOpen(i.status)).length, review: toReview.length, rules: rules.filter(r => r.status !== 'retired').length, health: null };

  const copyCommand = async () => {
    try { await navigator.clipboard.writeText(AI_COMMAND); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
    catch { setError('Não consegui copiar. Selecione o texto do comando manualmente.'); }
  };

  const review = async (item: FeedbackItem, decision: 'approve' | 'request_changes' | 'reject') => {
    try { await reviewProposal(item.id, decision, reviewNote[item.id] || ''); notifyFeedbackChanged(); }
    catch (e) { setError(feedbackError(e)); }
  };

  return (
    <section aria-label="Correções e melhorias" className="space-y-4">
      <div className="!mt-0 flex flex-wrap items-end justify-between gap-3 rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-cyan-700">Troca Humano → IA</p>
          <h2 className="text-lg font-semibold text-slate-900">Correções e melhorias</h2>
          <p className="mt-1 text-sm text-slate-500">O que o time pediu para a IA corrigir no conhecimento ou ajustar no GaaS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openFeedback()} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">Nova correção</button>
          <button type="button" onClick={() => void copyCommand()} title={AI_COMMAND} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white"><Copy size={15} />{copied ? 'Comando copiado' : 'Copiar comando para a IA'}</button>
        </div>
      </div>

      <div role="tablist" aria-label="Visões" className="inline-flex flex-wrap gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1 text-sm">
        {(Object.keys(VIEW_LABELS) as CorrectionsView[]).map(v => (
          <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => choose(v)}
            className={`rounded-lg px-3 py-1.5 ${view === v ? 'bg-white font-bold text-cyan-800 shadow-sm' : 'text-slate-600'}`}>
            {VIEW_LABELS[v]}{counts[v] !== null ? ` · ${counts[v]}` : ''}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-500">Carregando…</p>}

      {!loading && view === 'queue' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-10 flex-[1_1_240px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-500">
              <Search size={15} /><span className="sr-only">Buscar comentários</span>
              <input value={filters.q} onChange={e => setFilter('q', e.target.value)} placeholder="Buscar texto, nota ou pessoa" className="flex-1 border-0 bg-transparent text-slate-800 outline-none" />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700">Página<select value={filters.page} onChange={e => setFilter('page', e.target.value)} className={select}><option value="">Todas</option>{pages.map(p => <option key={p}>{p}</option>)}</select></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700">Frente<select value={filters.front} onChange={e => setFilter('front', e.target.value)} className={select}><option value="">Todas</option>{FRONTS.map(f => <option key={f}>{f}</option>)}</select></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700">Assunto<select value={filters.subject} onChange={e => setFilter('subject', e.target.value)} className={select}><option value="">Todos</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700">Estado<select value={filters.state} onChange={e => setFilter('state', e.target.value as FeedbackFilters['state'])} className={select}>
              <option value="open">Abertos</option><option value="conversation">Na conversa</option><option value="ai">Com a IA ou para revisar</option><option value="closed">Fechados</option><option value="all">Todos</option>
            </select></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700"><input type="checkbox" checked={filters.onlyApp} onChange={e => setFilter('onlyApp', e.target.checked)} />Só ajustes do app</label>
            {filters.targetId && <button type="button" onClick={() => { setFilter('targetId', undefined); writeCorrectionsRoute({ fix_target: null }); }} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">Só desta nota · limpar</button>}
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <section aria-label="Fila de comentários" className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between border-b border-slate-200 px-4 py-2 text-xs text-slate-500"><span>{visible.length} itens</span><span>Prioridade combinada primeiro</span></div>
              {!visible.length && <div className="p-6 text-sm text-slate-500">Nada por aqui com estes filtros. Use o botão Declarar melhoria, na borda direita de qualquer tela, para abrir uma correção.</div>}
              {visible.map(item => {
                const active = selected?.id === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => pick(item.id)} aria-current={active ? 'true' : undefined}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left ${active ? 'bg-cyan-50 shadow-[inset_3px_0_0_#06b6d4]' : 'bg-white hover:bg-slate-50'}`}>
                    <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span className="rounded border border-slate-400 bg-white px-1.5 py-0.5 text-slate-900">{item.page_label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{itemTypeLabel(item.item_type)}</span>
                      {item.front && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">{item.front}</span>}
                      <span className={`rounded-full px-2 py-0.5 ${STATUS_TONE[item.status]}`}>{statusLabel(item)}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[15px] font-semibold leading-snug text-slate-900">{item.body}</span>
                    <span className="mt-0.5 block truncate text-xs text-cyan-800">{item.location_label || item.page_label}</span>
                    <span className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{people[item.created_by] || 'Pessoa do time'} · {when(item.created_at)}</span>
                      <span>+1 de {voteCount(item.id)}</span>
                      <span>{attachments[item.id] ? `${attachments[item.id]} anexo${attachments[item.id] > 1 ? 's' : ''}` : 'sem anexo'}</span>
                    </span>
                  </button>
                );
              })}
            </section>
            <div className="min-w-0 flex-[1_1_420px]">
              {selected
                ? <FeedbackItemPanel item={selected} people={people} votes={voteCount(selected.id)} voted={votes.some(v => v.item_id === selected.id && v.user_id === userId)} isAdmin={isAdmin} onChanged={next => { if (!next) pick(null); }} />
                : <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Escolha um item para ver os detalhes.</p>}
            </div>
          </div>
        </>
      )}

      {!loading && view === 'review' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">A IA terminou. Confira a mudança exata antes de ela entrar na Wiki ou no app. Aprovar não publica sozinho: a skill aplica, recompila e sincroniza.</p>
          {!toReview.length && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Nada para revisar agora.</p>}
          {toReview.map(item => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="rounded border border-slate-400 bg-white px-1.5 py-0.5 text-slate-900">{item.page_label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{itemTypeLabel(item.item_type)}</span>
                <span className={`rounded-full px-2 py-0.5 ${STATUS_TONE[item.status]}`}>{statusLabel(item)}</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">{item.body}</h3>
              <p className="text-xs text-cyan-800">{item.location_label}</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-xs font-bold text-slate-700">{item.status === 'ai_disagrees' ? 'Por que a IA discorda' : item.status === 'needs_data' ? 'O que falta para a IA fazer' : 'O que a IA fez'}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{item.proposal?.summary}</p>
                {item.proposal?.sources && <p className="mt-2 text-xs text-slate-500">Fontes: {item.proposal.sources}</p>}
              </div>
              {(item.proposal?.before || item.proposal?.after) && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="overflow-hidden rounded-lg border border-red-200"><p className="bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800">Hoje</p><pre className="whitespace-pre-wrap p-3 font-sans text-sm text-slate-700">{item.proposal?.before || 'Nada'}</pre></div>
                  <div className="overflow-hidden rounded-lg border border-emerald-200"><p className="bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">Depois da mudança</p><pre className="whitespace-pre-wrap p-3 font-sans text-sm text-slate-700">{item.proposal?.after || 'Nada'}</pre></div>
                </div>
              )}
              {item.result_ref && <a href={item.result_ref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-cyan-800">Ver PR ou entrega <ExternalLink size={13} /></a>}
              {isAdmin ? (
                <div className="mt-4 space-y-2">
                  <textarea value={reviewNote[item.id] || ''} onChange={e => setReviewNote(n => ({ ...n, [item.id]: e.target.value }))} rows={2} placeholder="Comentário (obrigatório para pedir mudança ou rejeitar)" className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void review(item, 'approve')} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">Aprovar</button>
                    <button type="button" onClick={() => void review(item, 'request_changes')} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700">Pedir mudança</button>
                    <button type="button" onClick={() => void review(item, 'reject')} className="min-h-10 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700">Rejeitar</button>
                  </div>
                </div>
              ) : <p className="mt-3 text-xs text-slate-500">Quem aprova é o administrador. Você pode comentar no item pela Fila.</p>}
            </article>
          ))}
        </div>
      )}

      {!loading && view === 'rules' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Quando a mesma correção aparece várias vezes, a IA propõe uma regra. Ela só passa a valer depois de aprovada.</p>
          {!rules.length && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Nenhuma regra proposta ainda.</p>}
          {rules.map(rule => (
            <article key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2 text-[11px] font-bold">
                <span className={`rounded-full px-2 py-0.5 ${rule.status === 'active' ? 'bg-emerald-50 text-emerald-800' : rule.status === 'proposed' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{rule.status === 'active' ? 'Ativa' : rule.status === 'proposed' ? 'Aguardando aprovação' : 'Aposentada'}</span>
                <span className="text-slate-500">nasceu de {rule.source_items.length} correç{rule.source_items.length === 1 ? 'ão' : 'ões'}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{rule.rule_text}</p>
              {rule.applies_to && <p className="mt-1 text-xs text-slate-500">Vale em: {rule.applies_to}</p>}
              {isAdmin && (
                <div className="mt-3 flex gap-2 text-xs">
                  {rule.status !== 'active' && <button type="button" onClick={() => void setRuleStatus(rule.id, 'active').then(load).catch(e => setError(feedbackError(e)))} className="rounded-lg bg-teal-700 px-3 py-2 font-bold text-white">Ativar regra</button>}
                  {rule.status !== 'retired' && <button type="button" onClick={() => void setRuleStatus(rule.id, 'retired').then(load).catch(e => setError(feedbackError(e)))} className="rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700">Aposentar</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && view === 'health' && <HealthView items={items} onChanged={() => void load()} />}
    </section>
  );
}
