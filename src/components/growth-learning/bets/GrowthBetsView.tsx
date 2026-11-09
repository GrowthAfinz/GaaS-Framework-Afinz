import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, isBefore, parseISO } from 'date-fns';
import {
  closeGrowthBetSourceContext,
  closeGrowthLearningItem,
  completeGrowthBetSourceContext,
  GrowthBetSourceContext,
  openGrowthLearningSectionItem,
  readGrowthBetSourceContext,
  readGrowthLearningItem,
} from '../growthLearningNavigation';
import { fetchGrowthBet, fetchGrowthBets } from './growthBetService';
import { GrowthBet, GrowthBetStatus } from './growthBet.types';
import { GrowthBetDrawer } from './GrowthBetDrawer';
import { GrowthContextBetDialog } from './GrowthContextBetDialog';
import { openFeedback } from '../../feedback/feedbackBus';
import { LedgerChip, LedgerEntry, LedgerLoading, LedgerState, LoopLedger } from '../ledger/LoopLedger';
import { attentionSentence, ledgerDate, plural, withUnit } from '../ledger/ledgerFormat';

interface GrowthBetsViewProps { onCountChange?: (count: number) => void }

const STATUS_LABELS: Record<GrowthBetStatus, string> = {
  approved: 'Aprovada', in_progress: 'Em execução', waiting_window: 'Aguardando janela', ready_for_review: 'Pronta para revisão', closed: 'Encerrada', cancelled: 'Cancelada', not_verifiable: 'Não verificável',
};
const FRONT_LABELS = { crm_acquisition: 'CRM Aquisição', paid_media: 'Mídia Paga', b2c_origin: 'Originação B2C' } as const;
const EXECUTION_LABELS = { not_started: 'Não iniciada', partial: 'Parcial', completed: 'Concluída', cancelled: 'Cancelada', unknown: 'Sem registro' } as const;
const INACTIVE = ['closed', 'cancelled', 'not_verifiable'];
const isActive = (bet: GrowthBet) => !INACTIVE.includes(bet.status);
const isOverdue = (bet: GrowthBet, now: Date) => isActive(bet) && Boolean(bet.execution_due_at) && isBefore(parseISO(bet.execution_due_at as string), now);
const isNearWindow = (bet: GrowthBet, now: Date) => {
  if (!isActive(bet)) return false;
  const days = differenceInCalendarDays(parseISO(bet.outcome_window_start), now);
  return days >= 0 && days <= 7;
};

const formatDate = ledgerDate;

export const GrowthBetsView: React.FC<GrowthBetsViewProps> = ({ onCountChange }) => {
  const [bets, setBets] = useState<GrowthBet[]>([]);
  const [selected, setSelected] = useState<GrowthBet | null>(null);
  const [sourceContext, setSourceContext] = useState<GrowthBetSourceContext | null>(() => readGrowthBetSourceContext(window.location.search));
  const [front, setFront] = useState('all');
  const [status, setStatus] = useState('active');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const rows = await fetchGrowthBets(); setBets(rows); onCountChange?.(rows.length); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as apostas.');  }
    finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const syncContext = () => setSourceContext(readGrowthBetSourceContext(window.location.search));
    window.addEventListener('popstate', syncContext);
    return () => window.removeEventListener('popstate', syncContext);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const syncItem = async () => {
      const itemId = readGrowthLearningItem(window.location.search);
      if (!itemId) { setSelected(null); return; }
      const local = bets.find((bet) => bet.id === itemId);
      if (local) { setSelected(local); return; }
      try { const remote = await fetchGrowthBet(itemId); if (!cancelled) setSelected(remote); } catch { if (!cancelled) setSelected(null); }
    };
    void syncItem(); window.addEventListener('popstate', syncItem);
    return () => { cancelled = true; window.removeEventListener('popstate', syncItem); };
  }, [bets]);

  const now = useMemo(() => new Date(), [bets]);
  const matchesView = useCallback((bet: GrowthBet) => {
    if (status === 'active') return isActive(bet);
    if (status === 'all') return true;
    if (status === 'no_owner') return isActive(bet) && !bet.owner;
    if (status === 'overdue') return isOverdue(bet, now);
    if (status === 'near_window') return isNearWindow(bet, now);
    return bet.status === status;
  }, [now, status]);

  const filtered = useMemo(() => bets.filter((bet) => {
    if (front !== 'all' && bet.front !== front) return false;
    if (!matchesView(bet)) return false;
    const haystack = `${bet.hypothesis} ${bet.action_text} ${bet.metric_name} ${bet.team_scope} ${bet.owner || ''}`.toLocaleLowerCase('pt-BR');
    return haystack.includes(query.trim().toLocaleLowerCase('pt-BR'));
  }), [bets, front, matchesView, query]);

  const summary = useMemo(() => {
    const active = bets.filter(isActive);
    return {
      active: active.length,
      noOwner: active.filter((bet) => !bet.owner).length,
      overdue: active.filter((bet) => isOverdue(bet, now)).length,
      nearWindow: active.filter((bet) => isNearWindow(bet, now)).length,
    };
  }, [bets, now]);

  const openBet = (bet: GrowthBet) => { setSelected(bet); openGrowthLearningSectionItem('bets', bet.id); };
  const count = (predicate: (bet: GrowthBet) => boolean) => bets.filter(predicate).length;

  const title = loading ? 'Apostas' : summary.active === 0 ? 'Nenhuma aposta ativa' : plural(summary.active, 'aposta ativa', 'apostas ativas');
  const sentence = attentionSentence(summary.active,
    [summary.noOwner ? 'está sem responsável' : '', summary.overdue ? 'passou do prazo de execução' : ''].filter(Boolean),
    [summary.noOwner ? (summary.noOwner === 1 ? 'uma está sem responsável' : `${summary.noOwner} estão sem responsável`) : '', summary.overdue ? (summary.overdue === 1 ? 'uma passou do prazo de execução' : `${summary.overdue} passaram do prazo de execução`) : ''].filter(Boolean));
  const summaryText = loading || error ? undefined : summary.active === 0
    ? 'Aceite uma recomendação elegível na Fila ou abra uma aposta a partir de um relatório. Nenhuma aposta é criada automaticamente.'
    : sentence
      ? `${sentence} Abra a aposta para definir o responsável e registrar o andamento.`
      : 'Todas têm responsável e estão dentro do prazo de execução.';

  return (
    <>
      <LoopLedger
        section="Apostas"
        title={title}
        meta={!loading && !error && <>
          {summary.overdue > 0 && <LedgerChip tone="alert">{plural(summary.overdue, 'checkpoint vencido', 'checkpoints vencidos')}</LedgerChip>}
          {summary.noOwner > 0 && <LedgerChip tone="warn">{summary.noOwner} sem responsável</LedgerChip>}
          {summary.nearWindow > 0 && <LedgerChip>{plural(summary.nearWindow, 'janela abre em 7 dias', 'janelas abrem em 7 dias')}</LedgerChip>}
          {summary.active > 0 && !summary.overdue && !summary.noOwner && <LedgerChip tone="ok">Em dia</LedgerChip>}
          <span>Todos os períodos</span>
        </>}
        summary={summaryText}
        search={{ value: query, onChange: setQuery, placeholder: 'Buscar hipótese, métrica ou time', ariaLabel: 'Buscar hipótese, métrica ou time' }}
        segment={{ value: front, onChange: setFront, ariaLabel: 'Frente', options: [{ value: 'all', label: 'Todas' }, ...Object.entries(FRONT_LABELS).map(([value, label]) => ({ value, label }))] }}
        index={[
          { label: 'Pede atenção', value: status, onSelect: setStatus, items: [
            { id: 'overdue', label: 'Checkpoint vencido', count: summary.overdue, tone: 'alert' },
            { id: 'no_owner', label: 'Sem responsável', count: summary.noOwner, tone: 'warn' },
            { id: 'near_window', label: 'Janela em 7 dias', count: summary.nearWindow },
          ] },
          { label: 'Estado', value: status, onSelect: setStatus, items: [
            { id: 'active', label: 'Ativas', count: summary.active },
            ...(Object.keys(STATUS_LABELS) as GrowthBetStatus[]).map((key) => ({ id: key, label: STATUS_LABELS[key], count: count((bet) => bet.status === key) })),
            { id: 'all', label: 'Todas', count: bets.length },
          ] },
        ]}
        indexNote="A aposta nasce de uma recomendação aceita na Fila ou de um relatório. O resultado é verificado em Outcomes."
        onFeedback={() => { const item = readGrowthLearningItem(window.location.search); openFeedback({ surface: 'bets', pageLabel: 'Apostas', locationLabel: item ? 'Apostas › item aberto' : 'Apostas', targetType: item ? 'bet' : 'page', targetId: item || undefined }); }}
        footer={!loading && !error ? `${filtered.length} de ${plural(bets.length, 'aposta', 'apostas')} nesta leitura.` : undefined}
      >
        {loading ? <LedgerLoading label="Lendo apostas" /> : error ? (
          <LedgerState tone="alert" title="As apostas não puderam ser carregadas" action={{ label: 'Tentar novamente', onClick: () => void load() }}>{error}</LedgerState>
        ) : filtered.length === 0 ? (
          <LedgerState title="Nenhuma aposta nesta leitura">Troque o item do índice ou a frente. Nenhuma aposta é criada automaticamente.</LedgerState>
        ) : (
          <ul className="ledger-list">
            {filtered.map((bet) => {
              const overdue = isOverdue(bet, now);
              return (
                <LedgerEntry
                  key={bet.id}
                  selected={selected?.id === bet.id}
                  onOpen={() => openBet(bet)}
                  kicker={<><LedgerChip tone={isActive(bet) ? 'ok' : 'neutral'}>{STATUS_LABELS[bet.status]}</LedgerChip>{overdue && <LedgerChip tone="alert">Prazo vencido</LedgerChip>}<span>{FRONT_LABELS[bet.front]}</span>{bet.team_scope && bet.team_scope !== FRONT_LABELS[bet.front] && <span>{bet.team_scope}</span>}</>}
                  title={bet.action_text || bet.hypothesis}
                  text={bet.action_text ? bet.hypothesis : undefined}
                  facts={[
                    { label: 'Métrica', value: bet.metric_name },
                    { label: 'Esperado', value: withUnit(bet.expected_value, bet.expected_unit), hint: `hoje ${withUnit(bet.baseline_value, bet.expected_unit)}` },
                    { label: 'Prazo de execução', value: bet.execution_due_at ? formatDate(bet.execution_due_at) : 'Sem prazo', hint: overdue ? 'vencido' : undefined, tone: overdue ? 'alert' : undefined },
                    { label: 'Janela do resultado', value: `${formatDate(bet.outcome_window_start)} a ${formatDate(bet.outcome_window_end)}` },
                    { label: 'Responsável', value: bet.owner || 'Sem responsável', tone: bet.owner ? undefined : 'warn' },
                    { label: 'Execução', value: bet.checklist_total ? `${bet.checklist_completed} de ${bet.checklist_total} passos` : EXECUTION_LABELS[bet.last_execution_status || 'unknown'] },
                  ]}
                />
              );
            })}
          </ul>
        )}
      </LoopLedger>

      {selected && <GrowthBetDrawer bet={selected} onClose={closeGrowthLearningItem} onChanged={() => void load()} />}
      {sourceContext && <GrowthContextBetDialog context={sourceContext} onClose={closeGrowthBetSourceContext} onCompleted={(betId) => { setSourceContext(null); completeGrowthBetSourceContext(betId); void load(); }} />}
    </>
  );
};
