import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Filter, Inbox, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openGrowthLearningItem, openGrowthLearningSection, openGrowthLearningSectionItem, readGrowthLearningItem } from '../growthLearningNavigation';
import { buildGrowthFeedFilterSearch, classifyGrowthFeedAttentionBucket, filterAndGroupGrowthFeed, readGrowthFeedFilters } from './growthFeed.logic';
import { fetchGrowthFeed, fetchGrowthFeedItem } from './growthFeedService';
import { GrowthFeedEvent, GrowthFeedFilters } from './growthFeed.types';
import { GrowthFeedCard } from './GrowthFeedCard';
import { GrowthFeedDrawer } from './GrowthFeedDrawer';
import { GrowthFeedInspector } from './GrowthFeedInspector';
import { GrowthSignalDecisionDialog } from '../bets/GrowthSignalDecisionDialog';
import { fetchGrowthSignalDecisions } from '../bets/growthBetService';
import { GrowthSignalDecision } from '../bets/growthBet.types';

interface GrowthFeedViewProps {
  periodStart: Date;
  periodEnd: Date;
  onCountChange?: (count: number) => void;
}

const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

function updateFiltersInUrl(filters: GrowthFeedFilters) {
  const search = buildGrowthFeedFilterSearch(filters, window.location.search);
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

export const GrowthFeedView: React.FC<GrowthFeedViewProps> = ({ periodStart, periodEnd, onCountChange }) => {
  const [events, setEvents] = useState<GrowthFeedEvent[]>([]);
  const [filters, setFilters] = useState<GrowthFeedFilters>(() => readGrowthFeedFilters(window.location.search));
  const [selected, setSelected] = useState<GrowthFeedEvent | null>(null);
  const [provenanceEvent, setProvenanceEvent] = useState<GrowthFeedEvent | null>(null);
  const [attentionBucket, setAttentionBucket] = useState<'all' | 'act' | 'watch' | 'investigate'>('all');
  const [decisionEvent, setDecisionEvent] = useState<GrowthFeedEvent | null>(null);
  const [decisions, setDecisions] = useState<Map<string, GrowthSignalDecision>>(() => new Map());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextEvents = await fetchGrowthFeed(periodStart, periodEnd);
      const candidateIds = Array.from(new Set(nextEvents.filter((event) => event.subject_type === 'action_candidate').map((event) => event.subject_id)));
      const nextDecisions = await fetchGrowthSignalDecisions(candidateIds);
      setEvents(nextEvents);
      setDecisions(new Map(nextDecisions.map((decision) => [decision.action_candidate_id, decision])));
      onCountChange?.(nextEvents.length);
    } catch (loadError) {
      console.error('Growth feed could not be loaded', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a fila.');
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange, periodEnd, periodStart]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const syncItem = async () => {
      const itemId = readGrowthLearningItem(window.location.search);
      if (!itemId) {
        setSelected(null);
        return;
      }
      const local = events.find((event) => event.id === itemId);
      if (local) {
        setSelected(local);
        return;
      }
      try {
        const remote = await fetchGrowthFeedItem(itemId);
        if (!cancelled) setSelected(remote);
      } catch (itemError) {
        console.error('Growth feed item could not be loaded', itemError);
        if (!cancelled) setSelected(null);
      }
    };
    void syncItem();
    window.addEventListener('popstate', syncItem);
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', syncItem);
    };
  }, [events]);

  const groups = useMemo(() => filterAndGroupGrowthFeed(events, filters), [events, filters]);
  const bucketCounts = useMemo(() => groups.reduce((counts, group) => {
    counts[classifyGrowthFeedAttentionBucket(group.representative)] += 1;
    return counts;
  }, { act: 0, watch: 0, investigate: 0 }), [groups]);
  const visibleGroups = useMemo(() => attentionBucket === 'all' ? groups : groups.filter((group) => classifyGrowthFeedAttentionBucket(group.representative) === attentionBucket), [attentionBucket, groups]);
  const activeFilterLabels = [
    filters.front !== 'all'
      ? (
          {
            crm_acquisition: 'CRM Aquisição',
            paid_media: 'Mídia Paga',
            b2c_origin: 'Originação B2C',
            report_live: 'Report Live',
          } as Record<string, string>
        )[filters.front]
      : null,
    filters.confidence !== 'all' ? `Confiança: ${filters.confidence}` : null,
    filters.state !== 'all' ? `Estado: ${filters.state}` : null,
  ].filter(Boolean) as string[];

  const changeFilters = (patch: Partial<GrowthFeedFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    updateFiltersInUrl(next);
  };

  const openEvent = (event: GrowthFeedEvent) => {
    setSelected(event);
    openGrowthLearningItem(event.id);
  };

  useEffect(() => {
    if (visibleGroups.length === 0) {
      setSelected(null);
      return;
    }
    if (!selected || !visibleGroups.some((group) => group.events.some((event) => event.id === selected.id))) {
      setSelected(visibleGroups[0].representative);
    }
  }, [selected, visibleGroups]);

  const primaryAction = (event: GrowthFeedEvent) => {
    if (event.summary_snapshot.primary_action?.kind === 'open_report_live') {
      setSelected(null);
      openGrowthLearningSection('report-live');
      return;
    }
    if (event.summary_snapshot.primary_action?.kind === 'open_bet' || event.subject_type === 'growth_bet') {
      setSelected(null);
      openGrowthLearningSectionItem('bets', event.subject_id);
      return;
    }
    if (event.summary_snapshot.primary_action?.kind === 'open_outcome' || event.subject_type === 'growth_outcome') {
      setSelected(null);
      openGrowthLearningSectionItem('outcomes', event.subject_id);
      return;
    }
    if (event.summary_snapshot.primary_action?.kind === 'open_learning' || event.subject_type === 'growth_learning') {
      setSelected(null);
      openGrowthLearningSectionItem('memory', event.subject_id);
      return;
    }
    if (event.event_type === 'recommendation_created') {
      const decision = decisions.get(event.subject_id);
      if (decision?.bet_id) {
        setSelected(null);
        openGrowthLearningSectionItem('bets', decision.bet_id);
        return;
      }
      if (!decision) {
        setDecisionEvent(event);
        return;
      }
    }
    openEvent(event);
  };

  const emptyMessage = filters.front === 'b2c_origin' ? 'Originação B2C ainda não possui um produtor governado de eventos. A frente permanece visível, sem conteúdo simulado.' : events.length === 0 ? 'Nenhum produtor sistêmico registrou evento neste período.' : 'Há eventos no período, mas nenhum corresponde aos filtros ativos.';

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-4 border border-slate-200 bg-white px-4 py-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
            <Inbox size={15} /> Fila sistêmica
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {format(periodStart, 'dd MMM', { locale: ptBR })} — {format(periodEnd, 'dd MMM yyyy', { locale: ptBR })} · {visibleGroups.length} de {groups.length} sinais agrupados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <Filter size={13} /> Filtros
          </span>
          <select
            aria-label="Filtrar por frente"
            value={filters.front}
            onChange={(e) =>
              changeFilters({
                front: e.target.value as GrowthFeedFilters['front'],
              })
            }
            className={selectClass}
          >
            <option value="all">Todas as frentes</option>
            <option value="crm_acquisition">CRM Aquisição</option>
            <option value="paid_media">Mídia Paga</option>
            <option value="b2c_origin">Originação B2C</option>
            <option value="report_live">Report Live</option>
          </select>
          <select
            aria-label="Filtrar por confiança"
            value={filters.confidence}
            onChange={(e) =>
              changeFilters({
                confidence: e.target.value as GrowthFeedFilters['confidence'],
              })
            }
            className={selectClass}
          >
            <option value="all">Toda confiança</option>
            <option value="confirmed">Confirmada</option>
            <option value="directional">Direcional</option>
            <option value="suspect">Sob suspeita</option>
            <option value="blocked">Bloqueada</option>
          </select>
          <select
            aria-label="Filtrar por estado"
            value={filters.state}
            onChange={(e) =>
              changeFilters({
                state: e.target.value as GrowthFeedFilters['state'],
              })
            }
            className={selectClass}
          >
            <option value="all">Todos os estados</option>
            <option value="open">Abertos</option>
            <option value="blocked">Bloqueados</option>
            <option value="certified">Certificados</option>
            <option value="published">Publicados</option>
          </select>
          <span className="mx-1 hidden h-6 w-px bg-slate-200 lg:block" />
          <label className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <SlidersHorizontal size={13} /> Ordenar
          </label>
          <select
            aria-label="Ordenar fila"
            value={filters.sort}
            onChange={(e) =>
              changeFilters({
                sort: e.target.value as GrowthFeedFilters['sort'],
              })
            }
            className={selectClass}
          >
            <option value="priority">Prioridade</option>
            <option value="recent">Recentes</option>
            <option value="relevance">Relevância</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="mr-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Decisão</span>
        {([
          ['all', 'Toda a fila', groups.length, 'border-slate-200 bg-white text-slate-700'],
          ['act', 'Agir hoje', bucketCounts.act, 'border-rose-200 bg-rose-50 text-rose-700'],
          ['watch', 'Acompanhar', bucketCounts.watch, 'border-amber-200 bg-amber-50 text-amber-700'],
          ['investigate', 'Investigar', bucketCounts.investigate, 'border-cyan-200 bg-cyan-50 text-cyan-700'],
        ] as const).map(([value, label, count, tone]) => (
          <button key={value} type="button" onClick={() => setAttentionBucket(value)} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${attentionBucket === value ? `${tone} ring-2 ring-cyan-100` : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>{label} <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px]">{count}</span></button>
        ))}
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs text-slate-500">Filtros ativos:</span>
          {activeFilterLabels.map((label) => (
            <span key={label} className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800">
              {label}
            </span>
          ))}
          <button type="button" onClick={() => changeFilters({ front: 'all', confidence: 'all', state: 'all' })} className="text-xs font-bold text-slate-500 underline underline-offset-2">
            Limpar
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-slate-200 bg-white">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Lendo eventos governados…
          </span>
        </div>
      ) : error ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-center">
          <div>
            <AlertCircle size={30} className="mx-auto text-rose-600" />
            <h3 className="mt-3 font-black text-rose-900">A fila não pôde ser carregada</h3>
            <p className="mt-2 max-w-xl text-sm text-rose-800">{error}</p>
            <button type="button" onClick={() => void load()} className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white">
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <Inbox size={32} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-black text-slate-800">Nada para mostrar nesta leitura</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(390px,.75fr)] lg:items-start">
          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(150px,.9fr)_110px_92px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 md:grid"><span>Sinal</span><span>Impacto</span><span>Confiança</span><span className="text-right">Tempo</span></div>
            <div>
              {visibleGroups.map((group) => (
                <GrowthFeedCard
                  key={group.groupKey}
                  group={group}
                  expanded={expandedGroups.has(group.groupKey)}
                  selected={selected?.id === group.representative.id}
                  onSelect={() => openEvent(group.representative)}
                  onToggleGroup={() =>
                    setExpandedGroups((current) => {
                      const next = new Set(current);
                      if (next.has(group.groupKey)) next.delete(group.groupKey);
                      else next.add(group.groupKey);
                      return next;
                    })
                  }
                  onOpen={setProvenanceEvent}
                  onPrimaryAction={primaryAction}
                  decision={decisions.get(group.representative.subject_id)}
                />
              ))}
            </div>
          </div>
          <GrowthFeedInspector
            event={selected}
            decision={selected ? decisions.get(selected.subject_id) : undefined}
            occurrences={selected ? groups.find((group) => group.events.some((event) => event.id === selected.id))?.events.length : 0}
            onPrimaryAction={primaryAction}
            onOpenProvenance={setProvenanceEvent}
          />
        </div>
      )}

      {provenanceEvent && <GrowthFeedDrawer event={provenanceEvent} decision={decisions.get(provenanceEvent.subject_id)} onClose={() => setProvenanceEvent(null)} onPrimaryAction={primaryAction} />}
      {decisionEvent && (
        <GrowthSignalDecisionDialog
          event={decisionEvent}
          onClose={() => setDecisionEvent(null)}
          onCompleted={({ betId }) => {
            setDecisionEvent(null);
            setSelected(null);
            void load();
            if (betId) openGrowthLearningSectionItem('bets', betId);
            else openGrowthLearningSection('feed');
          }}
        />
      )}
    </section>
  );
};
