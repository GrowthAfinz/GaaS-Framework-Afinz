import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { closeGrowthLearningItem, openGrowthLearningItem, readGrowthLearningItem } from '../growthLearningNavigation';
import { GrowthMemoryDrawer } from './GrowthMemoryDrawer';
import { filterGrowthMemory, MEMORY_CLASSIFICATION_LABELS, MEMORY_FRONT_LABELS, MEMORY_SOURCE_LABELS, summarizeGrowthMemory } from './growthMemory.logic';
import { fetchGrowthLearning, fetchGrowthMemory } from './growthMemoryService';
import { GrowthLearning, GrowthMemoryFilters } from './growthMemory.types';
import { openFeedback } from '../../feedback/feedbackBus';
import { LedgerChip, LedgerEntry, LedgerLoading, LedgerState, LoopLedger, type LedgerTone } from '../ledger/LoopLedger';
import { ledgerDate, plural } from '../ledger/ledgerFormat';

interface GrowthMemoryViewProps { onCountChange?: (count: number) => void; }

const formatDate = ledgerDate;

function scopeLabel(scope: Record<string, unknown>) {
  const values = Object.values(scope).flatMap((value) => Array.isArray(value) ? value : [value]).filter((value) => value !== null && value !== undefined && value !== '');
  return values.slice(0, 2).map(String).join(' · ') || 'Escopo geral';
}

export const GrowthMemoryView: React.FC<GrowthMemoryViewProps> = ({ onCountChange }) => {
  const [learnings, setLearnings] = useState<GrowthLearning[]>([]);
  const [selected, setSelected] = useState<GrowthLearning | null>(null);
  const [filters, setFilters] = useState<GrowthMemoryFilters>({ search: '', source: 'all', front: 'all', classification: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchGrowthMemory();
      setLearnings(data); onCountChange?.(data.length);
    } catch (loadError) {
      console.error('Growth memory could not be loaded', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os registros.');

    } finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    const syncItem = async () => {
      const id = readGrowthLearningItem(window.location.search);
      if (!id) { setSelected(null); return; }
      const local = learnings.find((learning) => learning.id === id);
      if (local) { setSelected(local); return; }
      try { const remote = await fetchGrowthLearning(id); if (!cancelled) setSelected(remote); }
      catch (itemError) { console.error('Growth memory item could not be loaded', itemError); if (!cancelled) setSelected(null); }
    };
    void syncItem(); window.addEventListener('popstate', syncItem);
    return () => { cancelled = true; window.removeEventListener('popstate', syncItem); };
  }, [learnings]);

  const visible = useMemo(() => filterGrowthMemory(learnings, filters), [filters, learnings]);
  const summary = useMemo(() => summarizeGrowthMemory(learnings), [learnings]);
  const set = (patch: Partial<GrowthMemoryFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const count = (predicate: (learning: GrowthLearning) => boolean) => learnings.filter(predicate).length;

  const title = loading ? 'Registros' : summary.total === 0 ? 'Nenhum registro vigente' : `${plural(summary.total, 'registro vigente', 'registros vigentes')}`;
  const summaryText = loading || error ? undefined : summary.total === 0
    ? 'Registros nascem de resultados confirmados em Outcomes ou de orientações curadas do vault. O sistema não cria aprendizados para preencher a tela.'
    : `${summary.validated === 0 ? 'Nenhum foi validado por resultado ainda' : `${plural(summary.validated, 'foi validado', 'foram validados')} por resultado`} e ${plural(summary.curated, 'veio', 'vieram')} da curadoria do vault. ${summary.reviewDue ? `${plural(summary.reviewDue, 'registro precisa', 'registros precisam')} de revisão antes de ser reutilizado.` : 'Nenhuma revisão está vencida.'}`;

  return (
    <>
      <LoopLedger
        section="Registros"
        title={title}
        meta={!loading && !error && <>
          {summary.reviewDue > 0 ? <LedgerChip tone="warn">{plural(summary.reviewDue, 'revisão vencida', 'revisões vencidas')}</LedgerChip> : summary.total > 0 && <LedgerChip tone="ok">Revisões em dia</LedgerChip>}
          <span>Acervo vigente, sem recorte por mês</span>
        </>}
        summary={summaryText}
        search={{ value: filters.search, onChange: (search) => set({ search }), placeholder: 'Buscar afirmação, escopo, regime ou fonte', ariaLabel: 'Buscar registros' }}
        segment={{ value: filters.front, onChange: (front) => set({ front: front as GrowthMemoryFilters['front'] }), ariaLabel: 'Frente', options: [{ value: 'all', label: 'Todas' }, ...Object.entries(MEMORY_FRONT_LABELS).map(([value, label]) => ({ value, label }))] }}
        index={[
          { label: 'Origem', value: filters.source, onSelect: (source) => set({ source: source as GrowthMemoryFilters['source'] }), items: [
            { id: 'all', label: 'Todas as origens', count: summary.total },
            { id: 'outcome', label: 'Validadas por resultado', count: summary.validated, tone: 'ok' },
            { id: 'vault_curated', label: 'Curadas do vault', count: summary.curated },
          ] },
          { label: 'Classificação', value: filters.classification, onSelect: (classification) => set({ classification: classification as GrowthMemoryFilters['classification'] }), items: [
            { id: 'all', label: 'Todas', count: summary.total },
            ...(Object.entries(MEMORY_CLASSIFICATION_LABELS) as [keyof typeof MEMORY_CLASSIFICATION_LABELS, string][]).map(([key, label]) => ({ id: key, label, count: count((learning) => learning.classification === key), tone: (key === 'contradictory' || key === 'invalidated' ? 'alert' : undefined) as LedgerTone | undefined })),
          ] },
        ]}
        indexNote="A Wiki reúne fontes e contexto. Aqui ficam só as orientações que podem ser reutilizadas em novas apostas."
        onFeedback={() => { const item = readGrowthLearningItem(window.location.search); openFeedback({ surface: 'memory', pageLabel: 'Registros', locationLabel: item ? 'Registros › item aberto' : 'Registros', targetType: item ? 'memory' : 'page', targetId: item || undefined }); }}
        footer={!loading && !error ? `${visible.length} de ${plural(learnings.length, 'registro', 'registros')} nesta leitura.` : undefined}
      >
        {loading ? <LedgerLoading label="Lendo registros" /> : error ? (
          <LedgerState tone="alert" title="Os registros não puderam ser carregados" action={{ label: 'Tentar novamente', onClick: () => void load() }}>{error}</LedgerState>
        ) : visible.length === 0 ? (
          <LedgerState title="Nenhum registro nesta leitura">Troque o item do índice, a frente ou a busca. O sistema não cria aprendizados fictícios para preencher a tela.</LedgerState>
        ) : (
          <ul className="ledger-list">
            {visible.map((learning) => (
              <LedgerEntry
                key={learning.id}
                selected={selected?.id === learning.id}
                onOpen={() => { setSelected(learning); openGrowthLearningItem(learning.id); }}
                kicker={<><LedgerChip tone={learning.source_kind === 'outcome' ? 'ok' : 'neutral'}>{MEMORY_SOURCE_LABELS[learning.source_kind]}</LedgerChip><span>{MEMORY_FRONT_LABELS[learning.front]}</span><span>{MEMORY_CLASSIFICATION_LABELS[learning.classification as keyof typeof MEMORY_CLASSIFICATION_LABELS] || learning.classification}</span></>}
                title={learning.source_title}
                text={learning.statement}
                facts={[
                  { label: 'Escopo', value: scopeLabel(learning.scope), hint: learning.regime || undefined },
                  { label: 'Validade', value: learning.valid_until ? `até ${formatDate(learning.valid_until)}` : 'Vigente' },
                  { label: 'Reuso', value: learning.reused_count ? `${plural(learning.reused_count, 'vez', 'vezes')}` : 'Ainda não reutilizado' },
                  { label: 'Próxima revisão', value: formatDate(learning.review_at), hint: learning.review_due ? 'vencida' : undefined, tone: learning.review_due ? 'warn' : undefined },
                ]}
              />
            ))}
          </ul>
        )}
      </LoopLedger>

      {selected && <GrowthMemoryDrawer learning={selected} onClose={closeGrowthLearningItem} />}
    </>
  );
};
