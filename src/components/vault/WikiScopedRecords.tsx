import { ReactNode, useEffect, useMemo, useState } from 'react';
import { BookMarked, ClipboardList, History, Search, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openGrowthLearningSectionItem } from '../growth-learning/growthLearningNavigation';
import type { GrowthBetSourceLink } from '../growth-learning/bets/relatedGrowthBets.logic';
import type { GrowthLearning } from '../growth-learning/memory/growthMemory.types';
import type { Investigation } from '../growth-learning/investigations/investigation.types';
import { investigationState } from '../growth-learning/investigations/investigation.logic';
import type { ResultRetrospective, ResultsScope } from '../growth-learning/results/results.types';
import { WikiAnalytics } from './wikiAnalytics';
import { classifyRecordScope, normalizeRecordScope, noteScopeCandidates, rankScoped, RELATION_LABELS, ScopedItem, ScopeRelation } from './scopedRecords.logic';
import { fetchScopedBets, fetchScopedInvestigations, fetchScopedLearnings, fetchScopedRetrospectives } from './scopedRecordsService';

type Load<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; items: ScopedItem<T>[] };
interface Entry { key: string; title: string; detail: string; meta: string; open?: () => void }
interface Props {
  config: WikiAnalytics;
  relativePath: string;
  noteId: string;
  operationIds: string[];
  onOpenRetrospective: (scope: Partial<ResultsScope>, month: string) => void;
}
const BET_STATUS: Record<string, string> = { approved: 'Aprovada', in_progress: 'Em execução', waiting_window: 'Aguardando janela', ready_for_review: 'Pronta para revisão', closed: 'Encerrada', cancelled: 'Cancelada', not_verifiable: 'Não verificável' };
const LEARNING_CLASS: Record<string, string> = { confirmed: 'Confirmado', directional: 'Direcional', contradictory: 'Contraditório', inconclusive: 'Inconclusivo', invalidated: 'Invalidado' };
const day = (value: string) => value ? value.slice(0, 10).split('-').reverse().join('/') : '';
const failure = (e: unknown) => e instanceof Error ? e.message : 'Não foi possível ler estes registros.';

function useScoped<T>(load: () => Promise<ScopedItem<T>[]>, deps: unknown[]): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: 'loading' });
  useEffect(() => {
    let active = true; setState({ status: 'loading' });
    load().then(items => { if (active) setState({ status: 'ready', items: rankScoped(items) }); }).catch(e => { if (active) setState({ status: 'error', message: failure(e) }); });
    return () => { active = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

function RecordList<T>({ title, icon, empty, state, entry }: { title: string; icon: ReactNode; empty: string; state: Load<T>; entry: (item: T, relation: ScopeRelation) => Entry }) {
  const [all, setAll] = useState(false);
  const render = (items: ScopedItem<T>[]) => <ul className="mt-2 space-y-2">{items.map(({ item, relation }) => { const e = entry(item, relation); return <li key={e.key}>
    <button type="button" disabled={!e.open} onClick={e.open} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-white">
      <span className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><span>{e.meta}</span><span className="rounded-full bg-slate-100 px-2 py-0.5">{RELATION_LABELS[relation]}</span></span>
      <span className="mt-1 block text-sm font-medium text-slate-800">{e.title}</span>
      {e.detail && <span className="mt-1 block text-xs text-slate-600">{e.detail}</span>}
    </button></li>; })}</ul>;
  const focused = state.status === 'ready' ? state.items.filter(item => item.relation !== 'frente') : [];
  const front = state.status === 'ready' ? state.items.filter(item => item.relation === 'frente') : [];
  return <section aria-label={title} className="rounded-lg border border-slate-200 bg-white p-4">
    <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900">{icon}{title}{state.status === 'ready' && <span className="text-xs font-normal text-slate-500">· {focused.length}</span>}</h5>
    {state.status === 'loading' ? <p role="status" className="mt-2 text-xs text-slate-500">Lendo registros…</p>
      : state.status === 'error' ? <p role="alert" className="mt-2 text-xs text-red-700">Falha ao ler: {state.message}</p>
        : <>{focused.length ? render(all ? focused : focused.slice(0, 5)) : <p className="mt-2 text-xs text-slate-500">{empty}</p>}
          {focused.length > 5 && <button type="button" onClick={() => setAll(v => !v)} className="mt-2 text-xs font-semibold text-cyan-800">{all ? 'Mostrar menos' : `Ver todos (${focused.length})`}</button>}
          {front.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer text-slate-500">Contexto da frente, sem recorte desta página ({front.length})</summary>{render(front.slice(0, 20))}</details>}</>}
  </section>;
}

// Live, read-only lists whose scope matches the page. Assuming a bet, reviewing outcomes and approving
// editorial changes stay in their own screens; this block only links there.
export function WikiScopedRecords({ config, relativePath, noteId, operationIds, onOpenRetrospective }: Props) {
  const { user } = useAuth();
  const candidates = useMemo(() => noteScopeCandidates(config), [config]);
  const operations = useMemo(() => new Set(operationIds.filter(Boolean)), [operationIds]);
  const relate = (scope: unknown, operation?: unknown): ScopeRelation | null => typeof operation === 'string' && operations.has(operation) ? 'nota' : classifyRecordScope(normalizeRecordScope(scope), candidates);
  const deps = [config, relativePath, noteId, operationIds.join('|'), user?.id];
  const bets = useScoped<GrowthBetSourceLink>(async () => (await fetchScopedBets(config.domain)).flatMap(link => {
    const relation = link.source_route === 'wiki:' + noteId ? 'nota' : relate(link.source_filters, link.source_filters?.operation_id);
    return relation ? [{ item: link, relation, date: link.updated_at }] : [];
  }), deps);
  const learnings = useScoped<GrowthLearning>(async () => { const { learnings: rows, linked } = await fetchScopedLearnings(config.domain, relativePath); return rows.flatMap(learning => {
    const relation = linked.has(learning.id) ? 'nota' : relate(learning.scope);
    return relation ? [{ item: learning, relation, date: learning.updated_at }] : [];
  }); }, deps);
  const retrospectives = useScoped<ResultRetrospective>(async () => (await fetchScopedRetrospectives(config.domain)).flatMap(retro => {
    const relation = relate(retro.scope, retro.scope.operation_id);
    return relation ? [{ item: retro, relation, date: retro.period }] : [];
  }), deps);
  const investigations = useScoped<Investigation>(async () => (await fetchScopedInvestigations(config.domain)).flatMap(task => {
    const relation = relate({ ...task.packet?.scope, ...task.filters }, task.operation_id);
    return relation ? [{ item: task, relation, date: task.read_at || task.period }] : [];
  }), deps);
  if (!user) return null;
  return <section aria-label="Decisões, apostas e aprendizados deste escopo" data-wiki-scoped-records className="my-6 space-y-3">
    <div><h4 className="font-semibold text-slate-900">Decisões, apostas e aprendizados deste escopo</h4>
      <p className="mt-1 text-sm text-slate-600">Registros do banco cujo escopo casa com o desta página, do mais específico para o mais geral. Só leitura: assumir aposta, revisar outcome e aprovar mudanças continuam nas telas de Aprendizado e Memória.</p></div>
    <div className="grid gap-3 lg:grid-cols-2">
      <RecordList title="Apostas" icon={<Target size={15} className="text-cyan-700" />} empty="Nenhuma aposta com este escopo." state={bets} entry={link => ({
        key: link.bet_id, title: link.hypothesis, detail: `${link.metric_name} · esperado ${link.expected_value}${link.expected_unit ? ' ' + link.expected_unit : ''} · janela ${day(link.outcome_window_start)} a ${day(link.outcome_window_end)}`,
        meta: `${BET_STATUS[link.status] || link.status} · ${link.source_title}`, open: () => openGrowthLearningSectionItem('bets', link.bet_id) })} />
      <RecordList title="Aprendizados" icon={<BookMarked size={15} className="text-cyan-700" />} empty="Nenhum aprendizado registrado com este escopo." state={learnings} entry={learning => ({
        key: learning.id, title: learning.statement, detail: learning.source_title,
        meta: `${LEARNING_CLASS[learning.classification] || learning.classification}${learning.review_due ? ' · revisão vencida' : ''} · revisar em ${day(learning.review_at)}`, open: () => openGrowthLearningSectionItem('memory', learning.id) })} />
      <RecordList title="Retrospectivas" icon={<History size={15} className="text-cyan-700" />} empty="Nenhuma retrospectiva registrada com este escopo." state={retrospectives} entry={(retro, relation) => ({
        key: retro.id, title: retro.observation || retro.learning || 'Retrospectiva sem observação', detail: [retro.learning && 'Aprendizado: ' + retro.learning, retro.next_action && 'Próxima ação: ' + retro.next_action].filter(Boolean).join(' · '),
        meta: `${retro.period.slice(0, 7)} · versão ${retro.revision} · ${Object.entries(retro.scope).filter(([key, value]) => value && key !== 'operation_id').map(([, value]) => String(value).replace(/_/g, ' ')).join(' · ') || 'panorama'}`,
        open: relation === 'nota' || relation === 'escopo' ? () => onOpenRetrospective(retro.scope, retro.period.slice(0, 7)) : undefined })} />
      {config.domain === 'crm' && <RecordList title="Investigações" icon={<Search size={15} className="text-cyan-700" />} empty="Nenhuma investigação com este escopo neste acesso." state={investigations} entry={task => ({
        key: task.id, title: task.analysis?.body.summary || 'Análise ainda não publicada', detail: [task.packet?.scope.partner, task.packet?.scope.segment].filter(Boolean).join(' · '),
        meta: `${task.period.slice(0, 7)} · ${task.question_type === 'execution_review' ? 'revisão de execução' : 'mudança de resultado'} · ${investigationState(task)}`, open: () => openGrowthLearningSectionItem('investigations', task.id) })} />}
    </div>
    <p className="flex items-center gap-1 text-xs text-slate-500"><ClipboardList size={12} />Correlação entre registros não é causalidade; a confiança vem da evidência de cada registro.</p>
  </section>;
}
