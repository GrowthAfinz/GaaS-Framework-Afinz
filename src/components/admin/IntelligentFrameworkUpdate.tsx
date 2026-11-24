import {
    type Channel,
    type CandidateFilter,
    type SourceBlock,
    type UpdateFlow,
    type ReviewField,
    type SuggestionField,
    type ProcessingStage,
    type ReviewMode,
    type ReviewSortKey,
    type FieldSuggestion,
    type ManualOverride,
    type UpdateCandidate,
    canUploadCandidate,
    candidateAction,
    matchesReviewCollection,
    candidateFilterKey,
    ACTION_SORT_ORDER,
    REVIEW_SORT_OPTIONS,
    type ProcessResult,
    type FileMeta,
    type ParseDebugInfo,
    type SaveReceipt,
    STATUS_CLASS,
    UPDATE_STATUS_CLASS,
    candidateStatusLabel,
    REVIEW_FIELDS,
    REVIEW_PAGE_SIZE,
    PROCESSING_STAGE_LABEL,
    DOMAIN_LABEL,
    FLOW_LABEL,
    DOMAIN_TARGET_TABLE,
    FLOW_TARGET_LABEL,
    normalizeKey,
    formatDateBR,
    buildDispatchSignature,
    suggestionsFor,
    isBulkApprovalEligible,
    applyApprovalDefaults,
    buildExcelRow,
    toCsv,
} from '../../utils/intelligentUpdateEngine';
export { matchesReviewCollection, processRentabilizacaoDinamicaBI, processDinamicaBI } from '../../utils/intelligentUpdateEngine';
import { previousWeekStart, replaceImportScopeSelection } from './importSelection';
import { processImportFile } from '../../utils/importerWorkerClient';
import { isImporterFailure } from '../../utils/importerPipeline';
import { ImportCampaignTree, importToday } from './ImportCampaignTree';
import { loadStructure } from '../growth-learning/structure/structureService';
import { supabase } from '../../services/supabaseClient';
import { classify, compileRules } from '../growth-learning/structure/consumoModel';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalViewport, toLocalRect } from '../../context/UIScaleContext';
import {
    AlertCircle,
    CheckCircle,
    Clipboard,
    Copy,
    Database,
    Download,
    FileSpreadsheet,
    CalendarDays,
    ChevronDown,
    Edit3,
    Loader2,
    MoreHorizontal,
    Search,
    Sparkles,
    Upload,
    Wand2,
    X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { dataService } from '../../services/dataService';
import { intelligentUpdateService } from '../../services/intelligentUpdateService';
import type {
    UpdateRunHistoryItem,
    UpdateRunHistoryDetail,
    UpdateRunCandidateRow,
} from '../../services/intelligentUpdateService';
import type { Activity } from '../../types/framework';
import { classifyRentabilizacao } from '../../utils/rentabilizacaoClassify';
import {
    hasAquisicaoJourneyPrefix,
    parseCanonicalAcquisitionJourney,
    acquisitionJourneyIdentity,
    inferCartAudience,
    isStandardOptOutResponse,
} from '../../utils/intelligentImportRouting';
import {
    parseSeqParts,
    resolveDim,
    canonicalPlurixCartJourney,
    PLURIX_CART_ASSISTED_JOURNEY,
} from '../../utils/taxonomy';






























async function loadImportCampaigns() {
    const [board, maps, rules] = await Promise.all([
        loadStructure(),
        supabase.from('sfmc_journey_map').select('journey,card_id,front,group_label').order('journey'),
        supabase.from('sfmc_consumo_rules').select('id,priority,pattern,front,card_id,group_label').order('priority'),
    ]);
    if (maps.error || rules.error) throw maps.error || rules.error;
    const exactRentCards = new Map<string, string>();
    const ambiguous = new Set<string>();
    for (const card of board.cards) {
        const scope = card.data_scope;
        if (card.archived || scope?.domain !== 'renta') continue;
        const rules = [scope.scope, ...(scope.any_of ?? [])];
        for (const rule of rules) {
            if (!rule?.journey || Object.keys(rule).length !== 1 || (scope.scope && Object.keys(scope.scope).some(field => field !== 'journey'))) continue;
            const key = normalizeKey(rule.journey);
            if (exactRentCards.has(key) && exactRentCards.get(key) !== card.id) ambiguous.add(key);
            exactRentCards.set(key, card.id);
        }
    }
    ambiguous.forEach(key => exactRentCards.delete(key));
    return {
        board,
        exactRentCards,
        manual: new Map((maps.data ?? []).map(row => [row.journey, row])),
        rules: compileRules(rules.data ?? []),
    };
}









































































/**
 * Sugere a ordem de disparo a partir do activity_name, reaproveitando o
 * parser de sequência do taxonomy.ts (mesmo motor da Reconciliation Queue
 * de Comunicações). Antes disso o campo ficava sempre em branco, obrigando
 * digitação manual em todo upload — mesmo quando o nome já carrega o padrão
 * (ex.: d3ecredcopa_diario -> disparo 3). O humano ainda pode sobrescrever
 * no input numérico antes de aprovar o candidato.
 */








/**
 * Vocabulário de SEGMENTO derivado 100% do histórico GaaS (coluna `Segmento`
 * de `activities`, jornadas JOR_AQUISICAO_*). Só entram tokens de alta pureza,
 * i.e. que no histórico mapeiam para um único segmento.
 *
 * IMPORTANTE: NÃO usar `SEGMENT_CODE_TABLE` (taxonomy.ts) aqui.
 * Aquela tabela mistura três dimensões (segmento, PARCEIRO e público) num mapa
 * só — `bb`→Bem Barato, `dia`→Dia, `bpc`→BpC, `srsa`→Serasa são PARCEIRO, não
 * segmento. Como a taxonomia é `JOR_AQUISICAO_{BU}_{PARCEIRO}_{SEGMENTO}_...`,
 * o parceiro aparece ANTES do segmento; um scan "primeiro match ganha" sobre a
 * tabela conflada gravava o parceiro no campo Segmento (ex.: `_BB_NGD_` virava
 * Segmento=Bem Barato em vez de Negados). O cruzamento token×Segmento no GaaS
 * confirma: todo token de parceiro se espalha por vários segmentos; todo token
 * abaixo é puro. Ver memory: importador-segmento-parceiro-bug.
 */


/**
 * Valores que são PARCEIRO/base — nunca podem ocupar o campo Segmento. Guard de
 * coerência: mesmo que uma fonte futura tente gravar um destes como segmento,
 * recusamos e deixamos cair no fallback/revisão humana.
 */















































// Compara metrica gravada vs metrica do BI tolerando null/undefined/0 e ruido de
// arredondamento. Igualdade exata (===) gerava falso positivo permanente de
// "Atualizar metricas" para taxas/consolidacoes com diferenca insignificante.


































// Computa sugestoes de TODOS os campos de uma vez. Antes, suggestFromHistory era
// chamada 1x por campo (9x), refazendo inferTaxonomy + tokenize + lookups a cada vez.
// Agora o contexto (taxonomia, buckets, tokens) e calculado uma unica vez por linha.


// ── Eleicao da jornada canonica quando o BI duplica a mesma activity+canal+data ──








// "tronco" da jornada sem o token de periodo: identifica a campanha base


// Recebe as jornadas distintas que colidem na mesma assinatura (arquivo) e
// devolve o papel de cada uma: winner (canonica/gravavel) | superseded | ambiguous.
// knownJourneys = jornadas que ja existem na base (para preferir nome novo no caso 2).


// Quando o BI duplica a mesma activity+canal+data em varias jornadas, cada candidato
// recebe as emissoes da SUA jornada (via consolidacao por jornada). Para que TODOS os
// candidatos da colisao exibam o resultado da activity (Conflito/Revisar), propagamos o
// MAX de cada metrica de resultado para todos do grupo. Max evita dupla contagem do
// mesmo cartao reportado sob nomes diferentes. So a vencedora (status nao-conflito)
// e gravada no banco; as demais apenas exibem.











































// ── Inteligencia de historico para Rentabilizacao ───────────────────────────────
// Aprende, da tabela rentabilizacao_activities, o mapeamento jornada/segmento -> dimensoes
// e reaplica ao subir novos disparos (consistente com o que o XLSX de Rentabilizacao classifica).
























const suggestionGroup = (suggestion: FieldSuggestion) => {
    if (suggestion.deterministic || suggestion.confidence >= 90) return 'Recomendadas';
    if (suggestion.source.includes('jornada')) return 'Usadas nesta jornada';
    if (suggestion.source.includes('base')) return 'Outros valores da base';
    return 'Histórico relacionado';
};

const HistoryCombobox = ({
    value,
    suggestions,
    onChange,
    compact = false,
}: {
    value: string;
    suggestions: FieldSuggestion[];
    onChange: (value: string) => void;
    compact?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 280 });

    useEffect(() => setDraft(value), [value]);
    useEffect(() => {
        if (!open || !anchorRef.current) return;
        // px locais: e a unidade em que top/left sao aplicados (ver UIScaleContext).
        const rect = toLocalRect(anchorRef.current.getBoundingClientRect());
        const viewport = getLocalViewport();
        setPosition({
            top: Math.min(viewport.height - 360, rect.bottom + 4),
            left: Math.min(viewport.width - 320, rect.left),
            width: Math.max(280, rect.width),
        });
    }, [open]);

    const filtered = suggestions.filter((item) =>
        !draft || normalizeKey(item.value).includes(normalizeKey(draft))
    );
    const groups = ['Recomendadas', 'Usadas nesta jornada', 'Histórico relacionado', 'Outros valores da base']
        .map((label) => ({ label, items: filtered.filter((item) => suggestionGroup(item) === label) }))
        .filter((group) => group.items.length > 0);

    return (
        <div ref={anchorRef} className="relative">
            <div className="relative">
                <input
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => {
                        onChange(draft);
                        setOpen(false);
                    }, 140)}
                    className={`w-full rounded-md border border-slate-200 bg-white pr-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 ${
                        compact ? 'px-2 py-1 text-[11px]' : 'px-2 py-1.5 text-xs'
                    }`}
                />
                <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setOpen((current) => !current)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
                    aria-label="Abrir sugestões"
                >
                    <ChevronDown size={13} />
                </button>
            </div>
            {open && createPortal(
                <div
                    className="fixed z-[120] max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-2xl"
                    style={{ top: position.top, left: position.left, width: position.width }}
                    onMouseDown={(event) => event.preventDefault()}
                >
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="px-2 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">{group.label}</div>
                            {group.items.map((suggestion) => (
                                <button
                                    key={`${group.label}-${suggestion.value}`}
                                    type="button"
                                    onClick={() => {
                                        setDraft(suggestion.value);
                                        onChange(suggestion.value);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-cyan-50"
                                >
                                    <span>
                                        <span className="block text-xs font-semibold text-slate-800">{suggestion.value}</span>
                                        <span className="mt-0.5 block text-[10px] text-slate-400">
                                            {suggestion.source}{suggestion.evidence ? ` · ${suggestion.evidence}` : ''}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-[10px] text-slate-500">
                                        <span className="block font-bold">{suggestion.count} usos</span>
                                        {suggestion.lastUsed && <span>{formatDateBR(suggestion.lastUsed)}</span>}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange(draft);
                                setOpen(false);
                            }}
                            className="w-full rounded-md px-3 py-3 text-left text-xs text-slate-600 hover:bg-slate-50"
                        >
                            Usar “{draft || 'novo valor'}”
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <div className={`text-xl font-bold leading-tight ${tone}`}>{value.toLocaleString('pt-BR')}</div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
);

const DimensionChip = ({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value?: string | number | null;
    tone?: 'slate' | 'cyan' | 'blue' | 'emerald';
}) => {
    const text = value === undefined || value === null ? '' : String(value).trim();
    if (!text || text === 'N/A') return null;
    const toneClass = {
        slate: 'border-slate-200 bg-slate-50 text-slate-700',
        cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
        blue: 'border-blue-100 bg-blue-50 text-blue-700',
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }[tone];
    return (
        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${toneClass}`} title={`${label}: ${text}`}>
            <span className="text-[9px] uppercase text-slate-400">{label}</span>
            <span>{text}</span>
        </span>
    );
};

const momentChipsFor = (candidate: UpdateCandidate) => {
    const parsed = parseSeqParts(candidate.activityName);
    return {
        seq: parsed?.seq ?? (candidate.ordemDisparo !== undefined ? `D${candidate.ordemDisparo}` : ''),
        week: parsed?.week ? `S${parsed.week}` : '',
        dispatch: parsed?.dispatch !== undefined ? `D${String(parsed.dispatch).padStart(2, '0')}` : '',
        source: parsed?.source === 'template' ? 'template' : parsed?.source === 'activity' ? 'activity' : parsed?.source === 'fallback' ? 'parser' : '',
    };
};

// ── Historico de atualizacoes ──
type HistoryDomainFilter = 'all' | 'aquisicao' | 'rentabilizacao';
type HistoryOperationFilter = 'all' | 'new' | 'metrics' | 'blocked';

const OPERATION_META: Record<string, { label: string; className: string }> = {
    insert: { label: 'Novo', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    upsert: { label: 'Upsert', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    update_metrics: { label: 'Metricas', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    blocked: { label: 'Bloqueado', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const OperationBadge = ({ operation }: { operation: string }) => {
    const meta = OPERATION_META[operation] ?? { label: operation || '-', className: 'bg-slate-100 text-slate-500 border-slate-200' };
    return (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.className}`}>
            {meta.label}
        </span>
    );
};

const formatRunDateTime = (iso: string) => {
    if (!iso) return '-';
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return iso;
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const DIFF_METRIC_KEYS = [
    'Base Total',
    'Base Acionável',
    'Abertura',
    'Cliques',
    'Propostas',
    'Aprovados',
    'Cartões Gerados',
    'Emissões Assistidas',
    'Emissões Independentes',
];

const formatDiffValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString('pt-BR') : String(value);
};

const MetricDiffList = ({ before, after }: { before: any; after: any }) => {
    const rows = DIFF_METRIC_KEYS
        .filter((key) => after && Object.prototype.hasOwnProperty.call(after, key))
        .map((key) => ({ key, previous: before?.[key], next: after?.[key] }))
        .filter(({ previous, next }) => formatDiffValue(previous) !== formatDiffValue(next));

    if (rows.length === 0) {
        return <span className="text-[11px] text-slate-400">sem diferenca de metricas</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {rows.map(({ key, previous, next }) => (
                <span key={key} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-500">{key}</span>
                    <span className="text-slate-400">{formatDiffValue(previous)}</span>
                    <span className="text-cyan-600">→</span>
                    <span className="font-bold text-slate-800">{formatDiffValue(next)}</span>
                </span>
            ))}
        </div>
    );
};

const HISTORY_DOMAIN_LABEL: Record<string, string> = {
    total_crm: 'Total CRM',
    aquisicao: 'Aquisição',
    rentabilizacao: 'Rentabilização',
};

const matchesOperationFilter = (row: UpdateRunCandidateRow, filter: HistoryOperationFilter) => {
    if (filter === 'all') return true;
    if (filter === 'metrics') return row.operationType === 'update_metrics';
    if (filter === 'new') return row.operationType === 'insert' || row.operationType === 'upsert';
    if (filter === 'blocked') return row.status !== 'applied';
    return true;
};

const UpdateRunDrawer = ({
    detail,
    loading,
    onClose,
}: {
    detail: UpdateRunHistoryDetail | null;
    loading: boolean;
    onClose: () => void;
}) => {
    const [search, setSearch] = useState('');
    const [operationFilter, setOperationFilter] = useState<HistoryOperationFilter>('all');

    const allRows = useMemo(
        () => (detail ? [...detail.applied, ...detail.blocked] : []),
        [detail]
    );

    const filteredRows = useMemo(() => {
        const term = normalizeKey(search);
        return allRows
            .filter((row) => matchesOperationFilter(row, operationFilter))
            .filter((row) => !term
                || normalizeKey(row.journey).includes(term)
                || normalizeKey(row.activityName).includes(term));
    }, [allRows, operationFilter, search]);

    return createPortal(
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Detalhe da atualizacao</h4>
                        {detail && (
                            <p className="mt-0.5 text-xs text-slate-500">
                                {formatRunDateTime(detail.run.createdAt)} · {detail.run.sourceLabel} · {HISTORY_DOMAIN_LABEL[detail.run.domain] ?? detail.run.domain}
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X size={16} />
                    </button>
                </header>

                {loading || !detail ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                        <Loader2 size={18} className="mr-2 animate-spin" /> Carregando detalhe...
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-2 border-b border-slate-100 px-5 py-3">
                            <StatCard label="Aplicadas" value={detail.appliedTotal} tone="text-emerald-700" />
                            <StatCard label="Novas" value={detail.applied.filter((row) => row.operationType === 'insert' || row.operationType === 'upsert').length} tone="text-blue-700" />
                            <StatCard label="Metricas" value={detail.applied.filter((row) => row.operationType === 'update_metrics').length} tone="text-cyan-700" />
                            <StatCard label="Bloqueadas" value={detail.blockedTotal} tone="text-amber-700" />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar jornada ou activity"
                                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-cyan-400 focus:outline-none"
                                />
                            </div>
                            {([
                                ['all', 'Todos'],
                                ['new', 'Novos'],
                                ['metrics', 'Metricas'],
                                ['blocked', 'Bloqueados'],
                            ] as Array<[HistoryOperationFilter, string]>).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setOperationFilter(value)}
                                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                                        operationFilter === value
                                            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-3">
                            {(detail.appliedCapped || detail.blockedCapped) && (
                                <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700">
                                    Mostrando amostra: {detail.applied.length} de {detail.appliedTotal} aplicadas e {detail.blocked.length} de {detail.blockedTotal} bloqueadas.
                                </p>
                            )}
                            {filteredRows.length === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-400">Nenhuma linha para o filtro atual.</div>
                            ) : (
                                <table className="w-full border-collapse text-left text-[11px]">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                                            <th className="py-2 pr-2 font-bold">Operacao</th>
                                            <th className="py-2 pr-2 font-bold">Jornada / Activity</th>
                                            <th className="py-2 pr-2 font-bold">Canal / Data</th>
                                            <th className="py-2 font-bold">Diff / Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRows.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 align-top">
                                                <td className="py-2 pr-2"><OperationBadge operation={row.operationType} /></td>
                                                <td className="py-2 pr-2">
                                                    <div className="font-semibold text-slate-700">{row.journey || '—'}</div>
                                                    <div className="font-mono text-[10px] text-slate-400">{row.activityName || '—'}</div>
                                                </td>
                                                <td className="py-2 pr-2 text-slate-500">
                                                    <div>{row.channel || '—'}</div>
                                                    <div className="text-[10px] text-slate-400">{row.date ? formatDateBR(row.date) : '—'}</div>
                                                </td>
                                                <td className="py-2">
                                                    {row.operationType === 'update_metrics' ? (
                                                        <MetricDiffList before={row.beforePayload} after={row.afterPayload} />
                                                    ) : row.status !== 'applied' ? (
                                                        <span className="text-[11px] text-slate-500">{row.conflictReason || row.fieldToReview || row.suggestion || 'bloqueado'}</span>
                                                    ) : (
                                                        <span className="text-[11px] text-emerald-600">{row.targetTable}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

const UpdateHistoryPanel = ({
    items,
    loading,
    error,
    onRefresh,
    onSelect,
}: {
    items: UpdateRunHistoryItem[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onSelect: (runId: string) => void;
}) => {
    const [domainFilter, setDomainFilter] = useState<HistoryDomainFilter>('all');

    const visibleItems = useMemo(
        () => items.filter((item) => domainFilter === 'all' || item.domain === domainFilter),
        [items, domainFilter]
    );

    return (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Historico de atualizacoes</h4>
                    <p className="text-xs text-slate-500">O que foi aplicado, atualizado e bloqueado em cada envio para a base de dados.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {([
                        ['all', 'Todos'],
                        ['aquisicao', 'Aquisição'],
                        ['rentabilizacao', 'Rentabilização'],
                    ] as Array<[HistoryDomainFilter, string]>).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setDomainFilter(value)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                                domainFilter === value
                                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                        Atualizar
                    </button>
                </div>
            </div>

            {error ? (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <span>{error}</span>
                    <button type="button" onClick={onRefresh} className="font-bold underline">Tentar novamente</button>
                </div>
            ) : loading && items.length === 0 ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : visibleItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                    Nenhuma atualizacao registrada ainda.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="py-2 pr-3 font-bold">Quando</th>
                                <th className="py-2 pr-3 font-bold">Arquivo</th>
                                <th className="py-2 pr-3 font-bold">Fluxo</th>
                                <th className="py-2 pr-3 text-right font-bold">Lido</th>
                                <th className="py-2 pr-3 text-right font-bold">Aplicadas</th>
                                <th className="py-2 pr-3 text-right font-bold">Bloqueadas</th>
                                <th className="py-2 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleItems.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                                >
                                    <td className="py-2.5 pr-3 text-slate-600">{formatRunDateTime(item.createdAt)}</td>
                                    <td className="py-2.5 pr-3 max-w-[220px] truncate text-slate-700" title={item.sourceLabel}>{item.sourceLabel}</td>
                                    <td className="py-2.5 pr-3 text-slate-500">{HISTORY_DOMAIN_LABEL[item.domain] ?? item.domain}</td>
                                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{item.pastedRowCount.toLocaleString('pt-BR')}</td>
                                    <td className="py-2.5 pr-3 text-right tabular-nums font-bold text-emerald-700">{item.applied.toLocaleString('pt-BR')}</td>
                                    <td className="py-2.5 pr-3 text-right tabular-nums text-amber-700">{item.blocked.toLocaleString('pt-BR')}</td>
                                    <td className="py-2.5">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                            item.status === 'applied'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : item.status === 'failed'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export const IntelligentFrameworkUpdate: React.FC = () => {
    const { activities } = useAppStore();
    const [activeFlow, setActiveFlow] = useState<UpdateFlow>('total_crm');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [statusFilter, setStatusFilter] = useState<CandidateFilter>('new_dispatch');
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<ParseDebugInfo | null>(null);
    const [saveMessage, setSaveMessage] = useState<SaveReceipt | null>(null);
    const [lastRunId, setLastRunId] = useState<string | null>(null);
    const [historyItems, setHistoryItems] = useState<UpdateRunHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [runDetail, setRunDetail] = useState<UpdateRunHistoryDetail | null>(null);
    const [runDetailLoading, setRunDetailLoading] = useState(false);
    const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
    const [reviewPage, setReviewPage] = useState(1);
    const [selectedCandidate, setSelectedCandidate] = useState<UpdateCandidate | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
    const [reviewSearchTerm, setReviewSearchTerm] = useState('');
    const [flowChooserOpen, setFlowChooserOpen] = useState(false);
    const [periodFilterOpen, setPeriodFilterOpen] = useState(false);
    const [reviewStartDate, setReviewStartDate] = useState('');
    const [reviewEndDate, setReviewEndDate] = useState('');
    const [reviewMode, setReviewMode] = useState<ReviewMode>('operation');
    const [reviewSortByMode, setReviewSortByMode] = useState<Record<ReviewMode, ReviewSortKey>>({
        operation: 'date_desc',
        dimensions: 'moment',
        metrics: 'sent',
    });
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkField, setBulkField] = useState<ReviewField>('promocional');
    const [bulkValue, setBulkValue] = useState('');
    const [bulkScope, setBulkScope] = useState<'selected' | 'filtered'>('selected');
    const [undoSnapshot, setUndoSnapshot] = useState<UpdateCandidate[] | null>(null);
    const previousFlowRef = useRef<UpdateFlow>(activeFlow);

    useEffect(() => {
        if (previousFlowRef.current === activeFlow) return;
        previousFlowRef.current = activeFlow;
        setResult(null);
        setFileMeta(null);
        setSelectedKeys(new Set());
        setReviewOpen(false);
        setFlowChooserOpen(false);
    }, [activeFlow]);

    const candidates = useMemo(() => result?.candidates ?? [], [result]);
    const activeCandidates = candidates.filter((candidate) => candidate.status !== 'ignored');
    const isRentReview = (result?.domain ?? activeFlow) === 'rentabilizacao';
    // A tabela permanece compacta, mas o drawer permite revisar todas as dimensoes
    // relevantes para Rentabilizacao e Seguros.
    const reviewFields = useMemo(
        () => isRentReview
            ? REVIEW_FIELDS.filter((field) => field.key !== 'ordemDisparo')
            : REVIEW_FIELDS,
        [isRentReview]
    );

    const summary = useMemo(() => ({
        ready: candidates.filter((candidate) => candidate.status === 'ready' && !candidate.metricRefresh).length,
        update: candidates.filter((candidate) => candidate.metricRefresh).length,
        review: candidates.filter((candidate) => candidate.status === 'review').length,
        fresh: candidates.filter((candidate) => candidate.status === 'new').length,
        duplicate: candidates.filter((candidate) => candidate.status === 'duplicate').length,
        conflict: candidates.filter((candidate) => candidate.status === 'conflict').length,
        error: candidates.filter((candidate) => candidate.status === 'error').length,
        ignored: candidates.filter((candidate) => candidate.status === 'ignored').length,
    }), [candidates]);

    const averageConfidence = useMemo(() => {
        const measurable = activeCandidates.filter((candidate) => candidate.confidence > 0);
        if (measurable.length === 0) return 0;
        return Math.round(measurable.reduce((sum, candidate) => sum + candidate.confidence, 0) / measurable.length);
    }, [activeCandidates]);

    const [importMapping, setImportMapping] = useState<Awaited<ReturnType<typeof loadImportCampaigns>> | null>(null);
    const [mappingUnavailable, setMappingUnavailable] = useState(false);
    const [reviewCampaign, setReviewCampaign] = useState('');
    const [reviewJourney, setReviewJourney] = useState('');
    const [reviewChannel, setReviewChannel] = useState('');
    const [reviewFront, setReviewFront] = useState('');
    const campaignByCandidate = useMemo(() => {
        const cards = new Map(importMapping?.board.cards.filter(card => !card.archived).map(card => [card.id, card]));
        const lanes = new Map(importMapping?.board.lanes.map(lane => [lane.id, lane]));
        const pillars = new Map(importMapping?.board.pillars.map(pillar => [pillar.id, pillar.title]));
        return new Map(candidates.map(candidate => {
            const manual = importMapping?.manual.get(candidate.journey || candidate.activityName);
            const rule = manual ?? (importMapping && classify(candidate.journey, candidate.activityName, importMapping.rules));
            const exactCardId = importMapping?.exactRentCards.get(normalizeKey(candidate.journey));
            const cardId = manual ? manual.card_id : exactCardId || rule?.card_id;
            const card = cardId ? cards.get(cardId) : undefined;
            const front = rule?.front || pillars.get(lanes.get(card?.lane_id ?? '')?.pillar_id ?? '') || '';
            const title = card?.title || rule?.group_label || front || 'Sem campanha mapeada';
            const key = card?.id || JSON.stringify([front, title]);
            return [candidate.key, { key, title, front, origin: manual ? 'Vínculo aprovado' : exactCardId ? 'Vínculo no Board Campanhas' : rule?.card_id ? 'Regra do Consumo SFMC' : '' }] as const;
        }));
    }, [candidates, importMapping]);
    const visibleCampaignCandidates = useMemo(() => candidates.filter(candidate =>
        (!reviewCampaign || campaignByCandidate.get(candidate.key)?.key === reviewCampaign)
        && (!reviewJourney || candidate.journey === reviewJourney)
        && (!reviewChannel || candidate.channel === reviewChannel)
        && (!reviewFront || campaignByCandidate.get(candidate.key)?.front === reviewFront)
    ), [candidates, campaignByCandidate, reviewCampaign, reviewJourney, reviewChannel, reviewFront]);
    const campaignRows = useMemo(() => {
        const groups = new Map<string, { title: string; front: string; rows: UpdateCandidate[] }>();
        for (const candidate of candidates) {
            const campaign = campaignByCandidate.get(candidate.key)!;
            const group = groups.get(campaign.key) ?? { ...campaign, rows: [] };
            group.rows.push(candidate);
            groups.set(campaign.key, group);
        }
        return [...groups].sort(([, a], [, b]) => a.title.localeCompare(b.title, 'pt-BR'));
    }, [candidates, campaignByCandidate]);
    const [previousFocus, setPreviousFocus] = useState<{ front: string; campaign: string; journey: string } | null>(null);
    const [frontSelectorOpen, setFrontSelectorOpen] = useState(true);
    const [reviewCollection, setReviewCollection] = useState<'selected' | 'all' | 'status'>('selected');
    const openSelected = () => {
        setReviewCollection('selected');
        setReviewCollision('');
        setReviewCampaign('');
        setReviewJourney('');
        setReviewChannel('');
        setReviewFront('');
        setReviewSearchTerm('');
        setReviewStartDate('');
        setReviewEndDate('');
        setReviewPage(1);
    };
    const treeCampaigns = useMemo(() => campaignRows.map(([key, group]) => ({
        key, title: group.title, front: group.front,
        rows: group.rows.map(row => ({
            key: row.key, journey: row.journey, date: row.date,
            eligible: canUploadCandidate(row), operation: candidateFilterKey(row),
        })),
    })), [campaignRows]);
    const [reviewCollision, setReviewCollision] = useState('');
    const collisionGroups = useMemo(() => {
        const occurrences = new Map<string, UpdateCandidate[]>();
        const candidatesByJourney = new Map<string, UpdateCandidate[]>();
        for (const candidate of candidates) {
            if (candidate.domain !== 'rentabilizacao') continue;
            const journeyKey = JSON.stringify([candidate.channel, candidate.journey]);
            const journeyRows = candidatesByJourney.get(journeyKey) ?? [];
            journeyRows.push(candidate);
            candidatesByJourney.set(journeyKey, journeyRows);
            if (candidate.status !== 'conflict') continue;
            const rows = occurrences.get(candidate.dispatchSignature) ?? [];
            rows.push(candidate);
            occurrences.set(candidate.dispatchSignature, rows);
        }
        const groups = new Map<string, {
            channel: Channel; journeys: string[]; occurrences: number; equal: number;
            keys: Set<string>; activities: Set<string>; sample: UpdateCandidate[]; first: string; last: string;
        }>();
        for (const rows of occurrences.values()) {
            const channel = rows[0].channel;
            const journeys = [...new Set(rows.flatMap(row => [row.journey, ...(row.conflictJourneys ?? [])]))].sort();
            const key = JSON.stringify([channel, journeys]);
            const group = groups.get(key) ?? {
                channel, journeys, occurrences: 0, equal: 0, keys: new Set<string>(),
                activities: new Set<string>(), sample: rows, first: rows[0].date, last: rows[0].date,
            };
            const metrics = new Set(rows.map(row => JSON.stringify([row.sent, row.delivered, row.opens, row.clicks])));
            group.occurrences += 1;
            if (rows.length === journeys.length && rows.length > 1 && metrics.size === 1) group.equal += 1;
            for (const row of rows) {
                group.keys.add(row.key);
                group.activities.add(row.activityName);
            }
            if (rows[0].date < group.first) group.first = rows[0].date;
            if (rows[0].date > group.last) group.last = rows[0].date;
            groups.set(key, group);
        }
        return [...groups].map(([key, group]) => ({
            key, ...group,
            exclusive: group.journeys.map(journey => ({
                journey,
                count: (candidatesByJourney.get(JSON.stringify([group.channel, journey])) ?? []).filter(row =>
                    group.activities.has(row.activityName) && !occurrences.has(row.dispatchSignature)
                ).length,
            })),
        })).sort((a, b) => b.occurrences - a.occurrences);
    }, [candidates]);
    const activeCollision = collisionGroups.find(group => group.key === reviewCollision);
    const filteredCandidates = useMemo(() => {
        const term = normalizeKey(reviewSearchTerm);
        const [periodStart, periodEnd] = reviewStartDate && reviewEndDate && reviewStartDate > reviewEndDate
            ? [reviewEndDate, reviewStartDate]
            : [reviewStartDate, reviewEndDate];
        if (activeCollision) return candidates.filter(candidate => activeCollision.keys.has(candidate.key));
        return visibleCampaignCandidates.filter((candidate) => {
            if (!matchesReviewCollection(candidate, selectedKeys, reviewCollection, statusFilter)) return false;
            if (periodStart && candidate.date < periodStart) return false;
            if (periodEnd && candidate.date > periodEnd) return false;
            if (!term) return true;

            const haystack = normalizeKey([
                campaignByCandidate.get(candidate.key)?.title,
                campaignByCandidate.get(candidate.key)?.front,
                ...(candidate.conflictJourneys ?? []),
                candidate.journey,
                candidate.activityName,
                candidate.channel,
                candidate.date,
                candidate.bu,
                candidate.parceiro,
                candidate.segmento,
                candidate.subgrupo,
            ].join(' '));

            return haystack.includes(term);
        });
    }, [candidates, visibleCampaignCandidates, activeCollision, campaignByCandidate, reviewCollection, selectedKeys, statusFilter, reviewSearchTerm, reviewStartDate, reviewEndDate]);
    const sortedCandidates = useMemo(() => {
        const sortKey = reviewSortByMode[reviewMode];
        const valueFor = (candidate: UpdateCandidate): string | number => {
            if (sortKey === 'date_desc' || sortKey === 'date_asc') return candidate.date;
            if (sortKey === 'action') return ACTION_SORT_ORDER[candidateAction(candidate)];
            if (sortKey === 'confidence_asc' || sortKey === 'confidence_desc') return candidate.confidence;
            if (sortKey === 'moment') {
                const moment = momentChipsFor(candidate);
                return moment.seq || `D${candidate.ordemDisparo ?? 9999}`;
            }
            if (sortKey === 'sent') return candidate.sent ?? 0;
            if (sortKey === 'cards') return candidate.finalized ?? 0;
            return candidate.date;
        };
        return [...filteredCandidates].sort((left, right) => {
            const leftValue = valueFor(left);
            const rightValue = valueFor(right);
            if (typeof leftValue === 'number' && typeof rightValue === 'number') {
                const direction = sortKey === 'action' || sortKey === 'moment' || sortKey === 'date_asc' || sortKey === 'confidence_asc' ? 1 : -1;
                const diff = leftValue - rightValue;
                if (diff !== 0) return diff * direction;
            } else {
                const direction = sortKey === 'date_desc' || sortKey === 'confidence_desc' ? -1 : 1;
                const diff = String(leftValue).localeCompare(String(rightValue), 'pt-BR', { numeric: true });
                if (diff !== 0) return diff * direction;
            }
            return right.confidence - left.confidence || right.date.localeCompare(left.date);
        });
    }, [filteredCandidates, reviewMode, reviewSortByMode]);
    const toggleOperationSort = (column: 'date' | 'confidence') => {
        setReviewSortByMode((current) => {
            const active = current.operation;
            const next: ReviewSortKey = column === 'date'
                ? active === 'date_desc' ? 'date_asc' : 'date_desc'
                : active === 'confidence_desc' ? 'confidence_asc' : 'confidence_desc';
            return { ...current, operation: next };
        });
        setReviewPage(1);
    };
    const reviewPageCount = Math.max(1, Math.ceil(sortedCandidates.length / REVIEW_PAGE_SIZE));
    const pagedCandidates = useMemo(() => {
        const safePage = Math.min(reviewPage, reviewPageCount);
        const start = (safePage - 1) * REVIEW_PAGE_SIZE;
        return sortedCandidates.slice(start, start + REVIEW_PAGE_SIZE);
    }, [sortedCandidates, reviewPage, reviewPageCount]);
    const bulkSuggestions = useMemo(() => {
        if (bulkField === 'ordemDisparo') return [];
        const source = bulkScope === 'filtered'
            ? filteredCandidates
            : candidates.filter((candidate) => selectedKeys.has(candidate.key));
        const merged = new Map<string, FieldSuggestion>();
        source.forEach((candidate) => {
            suggestionsFor(candidate.suggestions, bulkField as SuggestionField).forEach((suggestion) => {
                const key = normalizeKey(suggestion.value);
                const current = merged.get(key);
                if (!current) merged.set(key, { ...suggestion });
                else {
                    current.count += suggestion.count;
                    current.confidence = Math.max(current.confidence, suggestion.confidence);
                    if ((suggestion.lastUsed ?? '') > (current.lastUsed ?? '')) current.lastUsed = suggestion.lastUsed;
                }
            });
        });
        return Array.from(merged.values()).sort((a, b) => b.confidence - a.confidence || b.count - a.count).slice(0, 20);
    }, [bulkField, bulkScope, candidates, filteredCandidates, selectedKeys]);

    const exportableCandidates = useMemo(() =>
        candidates.filter((candidate) =>
            candidate.accepted
            && canUploadCandidate(candidate)
        ), [candidates]);

    const selectedCandidatesForCopy = useMemo(() =>
        candidates.filter((candidate) =>
            selectedKeys.has(candidate.key)
            && canUploadCandidate(candidate)
        ), [candidates, selectedKeys]);
    const copyCandidates = selectedCandidatesForCopy;
    // Disparos que ja existem na base (matchedActivity) ou em conflito (nome antigo do BI,
    // colisao, renomeacao) nao devem virar linha nova no Excel: a gravacao deles e UPDATE
    // ou revisao manual, nunca append. Excluidos da copia TSV por padrao.
    const reviewedTsv = useMemo(
        () => copyCandidates
            .filter((candidate) => !candidate.matchedActivity && candidate.status !== 'conflict')
            .map(buildExcelRow).join('\n'),
        [copyCandidates]
    );
    const uploadCandidates = useMemo(() =>
        selectedCandidatesForCopy.filter(candidate => candidate.accepted),
        [selectedCandidatesForCopy]
    );
    const uploadBlocks = useMemo(() => {
        const unique = new Set<SourceBlock>();
        uploadCandidates.forEach((candidate) => candidate.sourceBlocks.forEach((block) => unique.add(block)));
        return Array.from(unique);
    }, [uploadCandidates]);
    const uploadDomainCounts = useMemo(() => ({
        aquisicao: uploadCandidates.filter((candidate) => candidate.domain === 'aquisicao').length,
        rentabilizacao: uploadCandidates.filter((candidate) => candidate.domain === 'rentabilizacao').length,
    }), [uploadCandidates]);
    const uploadOperationCounts = useMemo(() => ({
        metricUpdates: uploadCandidates.filter((candidate) => candidate.metricRefresh || candidate.matchedActivity).length,
        upserts: uploadCandidates.filter((candidate) => !candidate.metricRefresh && !candidate.matchedActivity).length,
        blocked: Math.max(0, candidates.length - uploadCandidates.length - summary.ignored),
    }), [candidates.length, summary.ignored, uploadCandidates]);
    const filteredDomainCounts = useMemo(() => ({
        aquisicao: filteredCandidates.filter((candidate) => candidate.domain === 'aquisicao').length,
        rentabilizacao: filteredCandidates.filter((candidate) => candidate.domain === 'rentabilizacao').length,
    }), [filteredCandidates]);
    const readyFilteredKeys = useMemo(() =>
        filteredCandidates
            .filter((candidate) => candidate.status === 'ready')
            .map((candidate) => candidate.key),
        [filteredCandidates]);
    const selectedReadyCount = readyFilteredKeys.filter((key) => selectedKeys.has(key)).length;
    const blockingCount = candidates.filter((candidate) =>
        candidate.status !== 'ignored'
        && (!canUploadCandidate(candidate) || !candidate.accepted)
    ).length;

    const processFile = async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv', 'tsv', 'txt'].includes(ext ?? '')) {
            setDragError('Formato nao suportado. Use .xlsx, .xls, .csv ou .tsv.');
            return;
        }

        setProcessing(true);
        setDragError(null);
        setDebugInfo(null);
        setSaveMessage(null);
        setLastRunId(null);
        setCopied(false);
        setSelectedKeys(new Set());
        setUploadConfirmOpen(false);
        setReviewSearchTerm('');
        setReviewStartDate('');
        setReviewEndDate('');
        setReviewMode('operation');
        setUndoSnapshot(null);
        setBulkEditOpen(false);
        setProcessingStage('reading');

        try {
            // Para rentabilizacao, carrega o historico da base para (1) deduplicar o que ja
            // existe e (2) herdar dimensoes por jornada/segmento. Historico e mapeamento de
            // campanhas vem em paralelo; leitura, indice e motor rodam no Web Worker.
            const needsRentHistory = activeFlow === 'rentabilizacao' || activeFlow === 'total_crm';
            const [rentHistoryRows, mapping] = await Promise.all([
                needsRentHistory
                    ? intelligentUpdateService.fetchDomainHistory('rentabilizacao').catch(() => {
                        throw new Error('Não foi possível conferir o histórico de Rentabilização. Tente carregar o arquivo novamente.');
                    })
                    : Promise.resolve(null),
                loadImportCampaigns().catch(() => null),
            ]);
            const output = await processImportFile({
                file,
                flow: activeFlow,
                activities,
                rentHistoryRows,
                mappedJourneys: Array.from(mapping?.exactRentCards.keys() ?? []),
            }, setProcessingStage);
            if (isImporterFailure(output)) {
                const debug = { ...output.debug, fileName: file.name, fileSize: file.size, fileType: ext };
                console.error('[Atualizacao Inteligente] Falha ao processar arquivo', debug);
                setDebugInfo(debug);
                setDragError(`Erro ao processar o arquivo (${debug.stage || 'parser'}): ${debug.message}`);
                return;
            }
            const processed = output.result;
            setProcessingStage('reviewing');
            setImportMapping(mapping);
            setMappingUnavailable(mapping === null);
            setReviewCampaign('');
            setReviewJourney('');
            setReviewChannel('');
            setReviewFront('');
            setReviewCollision('');
            setReviewCollection('selected');
            setFrontSelectorOpen(true);
            setPreviousFocus(null);
            const reviewed = processed.candidates.map(candidate =>
                isBulkApprovalEligible(candidate)
                    ? { ...applyApprovalDefaults(candidate), accepted: true }
                    : candidate
            );
            setResult({
                ...processed,
                candidates: reviewed,
                tsv: reviewed.filter(candidate => candidate.accepted).map(buildExcelRow).join('\n'),
            });
            setFileMeta({ name: file.name, rows: output.matrixRows, type: ext ?? 'arquivo' });
            setReviewPage(1);
            setStatusFilter('new_dispatch');
            setSelectedKeys(new Set(reviewed.filter(candidate => candidate.accepted
                && (candidate.domain !== 'aquisicao' || candidate.date >= previousWeekStart(importToday()) && candidate.date <= importToday()))
                .map(candidate => candidate.key)));
            setReviewOpen(true);
        } catch (error: any) {
            const debug = {
                fileName: file.name,
                fileSize: file.size,
                fileType: ext,
                stage: 'parseFileToMatrix',
                message: error?.message || 'Erro ao processar arquivo.',
                stack: error?.stack,
            };
            console.error('[Atualizacao Inteligente] Falha ao ler arquivo', debug);
            setDebugInfo(debug);
            setDragError(`${debug.stage}: ${debug.message}`);
        } finally {
            setProcessing(false);
            setProcessingStage('idle');
        }
    };

    const updateCandidate = (key: string, updates: Partial<UpdateCandidate>, mode: 'single' | 'bulk' = 'single') => {
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) => {
                if (candidate.key !== key) return candidate;
                const changedAt = new Date().toISOString();
                const overrides = Object.entries(updates)
                    .filter(([field]) => REVIEW_FIELDS.some((item) => item.key === field))
                    .map(([field, nextValue]) => ({
                        field: field as ReviewField,
                        previousValue: candidate[field as ReviewField],
                        nextValue: nextValue as string | number | undefined,
                        mode,
                        changedAt,
                    }));
                return {
                    ...candidate,
                    ...updates,
                    manualOverrides: [...(candidate.manualOverrides ?? []), ...overrides],
                };
            });
            return {
                ...current,
                candidates,
                tsv: candidates
                    .filter((candidate) => candidate.status !== 'duplicate' && candidate.status !== 'error' && candidate.status !== 'ignored')
                    .map(buildExcelRow)
                    .join('\n'),
            };
        });
        setSelectedCandidate((current) => current?.key === key ? { ...current, ...updates } : current);
    };

    const applyBulkEdit = () => {
        if (!result || !bulkValue.trim()) return;
        const targetKeys = new Set(
            bulkScope === 'filtered'
                ? filteredCandidates.map((candidate) => candidate.key)
                : Array.from(selectedKeys)
        );
        setUndoSnapshot(result.candidates);
        setResult((current) => {
            if (!current) return current;
            const changedAt = new Date().toISOString();
            const candidates = current.candidates.map((candidate) => {
                if (!targetKeys.has(candidate.key)) return candidate;
                const nextValue = bulkField === 'ordemDisparo' ? Number(bulkValue) : bulkValue;
                const override: ManualOverride = {
                    field: bulkField,
                    previousValue: candidate[bulkField],
                    nextValue,
                    mode: 'bulk',
                    changedAt,
                };
                return {
                    ...candidate,
                    [bulkField]: nextValue,
                    accepted: false,
                    manualOverrides: [...(candidate.manualOverrides ?? []), override],
                };
            });
            return { ...current, candidates, tsv: candidates.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n') };
        });
        setBulkEditOpen(false);
        setBulkValue('');
    };

    const undoBulkEdit = () => {
        if (!undoSnapshot) return;
        setResult((current) => current ? {
            ...current,
            candidates: undoSnapshot,
            tsv: undoSnapshot.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n'),
        } : current);
        setUndoSnapshot(null);
    };

    const acceptCandidate = (key: string) => {
        toggleCandidateSelection(key, true);
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                candidate.key === key ? { ...applyApprovalDefaults(candidate), accepted: true } : candidate
            );
            return {
                ...current,
                candidates,
                tsv: candidates.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n'),
            };
        });
    };
    const ignoreCandidate = (key: string) => updateCandidate(key, { status: 'ignored', accepted: false });

    const toggleCandidateSelection = (key: string, checked: boolean) => {
        setSelectedKeys((current) => {
            const next = new Set(current);
            if (checked) next.add(key);
            else next.delete(key);
            return next;
        });
    };

    const toggleReadySelection = () => {
        setSelectedKeys((current) => {
            const next = new Set(current);
            const allSelected = readyFilteredKeys.length > 0 && readyFilteredKeys.every((key) => next.has(key));
            readyFilteredKeys.forEach((key) => {
                if (allSelected) next.delete(key);
                else next.add(key);
            });
            return next;
        });
    };

    const acceptSelectedCandidates = () => {
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                selectedKeys.has(candidate.key) && canUploadCandidate(candidate)
                    ? { ...applyApprovalDefaults(candidate), accepted: true }
                    : candidate
            );
            return { ...current, candidates, tsv: candidates.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n') };
        });
    };

    const acceptHighConfidence = () => {
        const eligibleKeys = new Set(filteredCandidates.filter(isBulkApprovalEligible).map(candidate => candidate.key));
        setSelectedKeys(current => new Set([...current, ...eligibleKeys]));
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                eligibleKeys.has(candidate.key)
                    ? { ...applyApprovalDefaults(candidate), accepted: true }
                    : candidate
            );
            return { ...current, candidates, tsv: candidates.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n') };
        });
    };

    const handleCopy = async () => {
        if (!reviewedTsv) return;
        await navigator.clipboard.writeText(reviewedTsv);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const handleDownloadCsv = () => {
        if (!reviewedTsv) return;
        const blob = new Blob([toCsv(reviewedTsv)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gaas-atualizacao-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const runs = await intelligentUpdateService.fetchUpdateRunHistory(20);
            setHistoryItems(runs);
        } catch (error: any) {
            setHistoryError(error?.message ? `Falha ao carregar historico: ${error.message}` : 'Falha ao carregar historico.');
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    const handleSelectRun = useCallback(async (runId: string) => {
        setSelectedRunId(runId);
        setRunDetail(null);
        setRunDetailLoading(true);
        try {
            const detail = await intelligentUpdateService.fetchUpdateRunDetail(runId);
            setRunDetail(detail);
        } catch (error) {
            console.error('Falha ao carregar detalhe do run:', error);
            setSelectedRunId(null);
        } finally {
            setRunDetailLoading(false);
        }
    }, []);

    const handleSaveRun = async (candidatesForRun = result?.candidates ?? []) => {
        if (!result) return;
        setSaving(true);
        setSaveMessage(null);

        try {
            const candidateKeysForRun = new Set(candidatesForRun.map((candidate) => candidate.key));
            const metricsForRun = result.metrics.filter((metric) => candidateKeysForRun.has(metric.key));
            const acceptedCount = candidatesForRun.filter((candidate) =>
                candidate.accepted && canUploadCandidate(candidate)
            ).length;
            const saved = await intelligentUpdateService.saveRun({
                domain: result.domain,
                sourceLabel: fileMeta?.name ?? 'Dinamica BI',
                sourceType: fileMeta?.type === 'xlsx' || fileMeta?.type === 'xls' ? 'xlsx' : 'csv',
                inputLineCount: fileMeta?.rows ?? result.importedRows,
                blocks: result.blocks,
                metrics: metricsForRun,
                candidates: candidatesForRun.map((candidate) => ({
                    ...candidate,
                    excelTsvRow: candidate.accepted ? buildExcelRow(candidate) : '',
                })),
                warnings: result.warnings,
                summary: {
                    ready: summary.ready,
                    review: summary.review,
                    new: summary.fresh,
                    duplicate: summary.duplicate,
                    error: summary.error,
                    conflict: summary.conflict,
                    ignored: summary.ignored,
                    ignoredExisting: result.ignoredExisting,
                    accepted: acceptedCount,
                    domain: result.domain,
                    targetTable: FLOW_TARGET_LABEL[result.domain],
                },
            });

            setLastRunId(saved.runId);
            const appliedCandidates = candidatesForRun.filter((candidate) => candidate.accepted && canUploadCandidate(candidate));
            setSaveMessage({
                type: 'success',
                text: `${saved.candidateCount} candidatos auditados. ${saved.appliedCount} linhas confirmadas na base de dados. Retorno da gravacao validado.`,
                runId: saved.runId,
                audited: saved.candidateCount,
                applied: saved.appliedCount,
                acquisition: appliedCandidates.filter((candidate) => candidate.domain === 'aquisicao').length,
                rentabilizacao: appliedCandidates.filter((candidate) => candidate.domain === 'rentabilizacao').length,
                blocked: Math.max(0, saved.candidateCount - saved.appliedCount),
            });
            setReviewOpen(false);
            setUploadConfirmOpen(false);

            // PILAR: apos gravar, o snapshot do Zustand fica defasado (ainda tem os
            // valores antigos). Sem este reload, reprocessar o mesmo arquivo na mesma
            // sessao compara contra a base velha e os disparos ja aplicados reaparecem
            // como "Atualizar metricas". Recarrega as duas frentes da base.
            try {
                const [freshActivities, freshRentab] = await Promise.all([
                    dataService.fetchActivities(),
                    dataService.fetchRentabilizacaoActivities(),
                ]);
                useAppStore.getState().setActivities(freshActivities);
                useAppStore.getState().setRentabilizacaoActivities(freshRentab);
            } catch (refreshError) {
                console.error('Falha ao recarregar base apos atualizacao inteligente:', refreshError);
            }

            void loadHistory();
        } catch (error: any) {
            setSaveMessage({
                type: 'error',
                text: error?.message ? `Falha ao salvar: ${error.message}` : 'Falha ao salvar na base de dados.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmUpload = async () => {
        if (!result || uploadCandidates.length === 0) return;
        const uploadKeys = new Set(uploadCandidates.map((candidate) => candidate.key));
        const candidatesForRun = result.candidates.map((candidate) =>
            uploadKeys.has(candidate.key)
                ? { ...applyApprovalDefaults(candidate), accepted: true }
                : { ...candidate, accepted: false }
        );
        setResult((current) => current ? {
            ...current,
            candidates: candidatesForRun,
            tsv: candidatesForRun.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n'),
        } : current);
        await handleSaveRun(candidatesForRun);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700 shadow-inner">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Atualizacao Inteligente</h3>
                            <p className="text-sm text-slate-500">
                                Upload assistido para {FLOW_LABEL[activeFlow]} com validacao antes da base de dados.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFlowChooserOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
                        >
                            <Sparkles size={14} />
                            Alterar fluxo
                        </button>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            <Database size={14} />
                            Historico carregado: {activities.length} campanhas
                        </div>
                    </div>
                </div>

                <section className="space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">1. Entrada de arquivo</h4>
                        <p className="text-xs text-slate-500">Use a aba Dinamica BI em Excel, CSV ou TSV. O conteudo bruto nao sera renderizado.</p>
                    </div>

                    {dragError && (
                        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-500" />
                                <span>{dragError}</span>
                            </div>
                            {debugInfo && (
                                <div className="rounded-md bg-white/70 p-2 font-mono text-[10px] text-red-700">
                                    <div>arquivo: {debugInfo.fileName || '-'}</div>
                                    <div>etapa: {debugInfo.stage || '-'}</div>
                                    <div>linhas matriz: {debugInfo.matrixRows ?? '-'}</div>
                                    <div>colunas primeira linha: {debugInfo.firstRowColumns ?? '-'}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {saveMessage && (
                        <div className={`rounded-xl border px-4 py-3 text-xs ${
                            saveMessage.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                            <div className="flex items-center gap-2 font-bold">
                                {saveMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                <span>{saveMessage.type === 'success' ? 'Recibo da atualizacao' : 'Falha na atualizacao'}</span>
                            </div>
                            <p className="mt-1 text-slate-600">{saveMessage.text}</p>
                            {saveMessage.type === 'success' && (
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    <StatCard label="Auditadas" value={saveMessage.audited ?? 0} tone="text-slate-800" />
                                    <StatCard label="Aplicadas" value={saveMessage.applied ?? 0} tone="text-emerald-700" />
                                    <StatCard label="Aquisicao" value={saveMessage.acquisition ?? 0} tone="text-blue-700" />
                                    <StatCard label="Rentabilizacao" value={saveMessage.rentabilizacao ?? 0} tone="text-cyan-700" />
                                    <StatCard label="Fora do envio" value={saveMessage.blocked ?? 0} tone="text-amber-700" />
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={(event) => {
                            event.preventDefault();
                            setIsDragging(false);
                        }}
                        onDrop={async (event) => {
                            event.preventDefault();
                            setIsDragging(false);
                            const file = event.dataTransfer.files?.[0];
                            if (file) await processFile(file);
                        }}
                        className={`flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                            isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50 hover:border-cyan-400'
                        }`}
                    >
                        <div className="mb-4 rounded-full bg-white p-4 text-cyan-700 shadow-sm">
                            {processing ? <Loader2 size={34} className="animate-spin" /> : <Upload size={34} />}
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                            {processing ? 'Processando arquivo...' : 'Arraste a Dinamica BI aqui'}
                        </h4>
                        {processing && (
                            <div className="mt-3 w-full max-w-md rounded-lg border border-cyan-100 bg-white px-3 py-2 text-left">
                                <div className="flex items-center justify-between text-xs font-bold text-cyan-800">
                                    <span>{PROCESSING_STAGE_LABEL[processingStage]}</span>
                                    <span>em andamento</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-2/3 rounded-full bg-cyan-600" />
                                </div>
                            </div>
                        )}
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                            O sistema detecta novas linhas por JourneyName + Canal + Data e abre a revisao humana automaticamente.
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv,.tsv,.txt"
                            className="hidden"
                            onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (file) await processFile(file);
                                event.currentTarget.value = '';
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={processing}
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <FileSpreadsheet size={14} />
                            Selecionar arquivo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                        {[
                            ['Ingestao', 'detecta blocos e normaliza chave'],
                            ['Novidade', 'separa novas, existentes e duplicadas'],
                            ['Taxonomia', 'preenche BU e segmento'],
                            ['Revisao', 'prioriza parceiro e campos humanos por confianca'],
                        ].map(([title, description]) => (
                            <div key={title} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                                <div className="text-xs font-bold text-slate-800">{title}</div>
                                <div className="mt-1 text-[11px] leading-snug text-slate-500">{description}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {result && fileMeta && (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">2. Diagnostico da importacao</h4>
                                <p className="text-xs text-slate-500">{fileMeta.name} - {fileMeta.rows} linhas lidas.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
                            >
                                <Search size={14} />
                                Abrir revisao
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                            <StatCard label="Prontas" value={summary.ready} tone="text-emerald-700" />
                            <StatCard label="Atualizar metricas" value={summary.update} tone="text-cyan-700" />
                            <StatCard label="Revisao" value={summary.review} tone="text-amber-700" />
                            <StatCard label="Novas" value={summary.fresh} tone="text-blue-700" />
                            <StatCard label="Ja existem" value={summary.duplicate} tone="text-purple-700" />
                            <StatCard label="Conflitos" value={summary.conflict} tone="text-orange-700" />
                            <StatCard label="Existentes analisadas" value={result.ignoredExisting} tone="text-slate-700" />
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                            {result.blocks.map((block) => (
                                <div key={block.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <span className="text-xs font-semibold text-slate-700">{block.label}</span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${block.detected ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {block.detected ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                        {block.rows}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {lastRunId && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                                Execucao salva na base de dados: <span className="font-mono font-bold">{lastRunId.slice(0, 8)}...</span>
                            </div>
                        )}
                    </section>
                )}

                <UpdateHistoryPanel
                    items={historyItems}
                    loading={historyLoading}
                    error={historyError}
                    onRefresh={loadHistory}
                    onSelect={handleSelectRun}
                />
            </div>

            {selectedRunId && (
                <UpdateRunDrawer
                    detail={runDetail}
                    loading={runDetailLoading}
                    onClose={() => {
                        setSelectedRunId(null);
                        setRunDetail(null);
                    }}
                />
            )}

            {flowChooserOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                            <div>
                            <h3 className="text-base font-bold text-slate-900">Escolher fluxo de atualização</h3>
                                <p className="mt-1 text-xs text-slate-500">Cada fluxo usa regras e tabela destino próprias.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFlowChooserOpen(false)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Fechar selecao de fluxo"
                            >
                                <X size={16} />
                            </button>
                        </header>
                        <main className="grid gap-3 p-5">
                            {(['total_crm', 'aquisicao', 'rentabilizacao'] as const).map((domain) => (
                                <button
                                    key={domain}
                                    type="button"
                                    onClick={() => {
                                        setActiveFlow(domain);
                                        setResult(null);
                                        setFileMeta(null);
                                        setSelectedKeys(new Set());
                                        setFlowChooserOpen(false);
                                    }}
                                    className={`rounded-xl border px-4 py-4 text-left transition ${
                                        activeFlow === domain
                                            ? 'border-cyan-500 bg-cyan-50'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-bold text-slate-900">Atualizar {FLOW_LABEL[domain]}</div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                            {FLOW_TARGET_LABEL[domain]}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {domain === 'total_crm'
                                            ? 'Lê todo o CRM da Dinâmica BI, separa aquisição e restante CRM, e grava cada disparo na base correta.'
                                            : domain === 'aquisicao'
                                            ? 'Campanhas do framework de aquisição, com revisão completa das dimensões antes de gravar.'
                                            : 'Réguas de rentabilização, seguros, Copa e ativações mapeáveis para a base de rentabilização.'}
                                    </p>
                                </button>
                            ))}
                        </main>
                    </div>
                </div>
            )}

            {reviewOpen && result && fileMeta && (
                <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-100">
                    <div className="flex w-full flex-col overflow-hidden bg-white">
                        <header className="border-b border-slate-200 bg-white px-6 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700">
                                            <FileSpreadsheet size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Revisao de {FLOW_LABEL[result.domain]}</h3>
                                            <p className="text-xs text-slate-500">{fileMeta.name} - destino: {FLOW_TARGET_LABEL[result.domain]}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReviewOpen(false)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Fechar revisao"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-slate-600">Resumo do arquivo · {result.insights.uniqueJourneys} jornadas · {result.insights.classificationConflicts} conflitos</summary>
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                                <strong>{result.insights.rawRows.toLocaleString('pt-BR')} linhas</strong> da Dinâmica BI foram consolidadas em{' '}
                                <strong>{result.insights.uniqueJourneys} jornadas</strong>,{' '}
                                <strong>{result.insights.uniqueActivities} activities</strong> e{' '}
                                <strong>{result.insights.newDispatches} novos disparos</strong>.
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                                {[
                                    ['Linhas BI', result.insights.rawRows],
                                    ['Métricas válidas', result.insights.validMetricRows],
                                    ['Jornadas', result.insights.uniqueJourneys],
                                    ['Activities', result.insights.uniqueActivities],
                                    ['Acionáveis', result.insights.actionableDispatches],
                                    ['Existentes', result.insights.existingDispatches],
                                    ['Novos', result.insights.newDispatches],
                                    ['Conflitos', result.insights.classificationConflicts],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                        <div className="text-lg font-bold text-slate-900">{Number(value).toLocaleString('pt-BR')}</div>
                                        <div className="text-[10px] font-semibold text-slate-500">{label}</div>
                                    </div>
                                ))}
                            </div>
                            </details>
                        </header>

                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex w-full flex-col gap-2 xl:max-w-3xl">
                                    <div className="flex gap-2">
                                        <div className="relative min-w-0 flex-1">
                                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="search"
                                                value={reviewSearchTerm}
                                                onChange={(event) => {
                                                    setReviewSearchTerm(event.target.value);
                                                    setReviewPage(1);
                                                }}
                                                placeholder="Buscar JourneyName, activity, canal ou segmento"
                                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                            />
                                            {reviewSearchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReviewSearchTerm('');
                                                        setReviewPage(1);
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                    aria-label="Limpar busca"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPeriodFilterOpen((open) => !open)}
                                            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                                                reviewStartDate || reviewEndDate || periodFilterOpen
                                                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <CalendarDays size={14} />
                                            Período
                                        </button>
                                    </div>
                                    {periodFilterOpen && (
                                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                                            <input
                                                type="date"
                                                value={reviewStartDate}
                                                onChange={(event) => {
                                                    setReviewStartDate(event.target.value);
                                                    setReviewPage(1);
                                                }}
                                                className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500"
                                            />
                                            <span className="text-xs text-slate-400">ate</span>
                                            <input
                                                type="date"
                                                value={reviewEndDate}
                                                onChange={(event) => {
                                                    setReviewEndDate(event.target.value);
                                                    setReviewPage(1);
                                                }}
                                                className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500"
                                            />
                                            {(reviewStartDate || reviewEndDate) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReviewStartDate('');
                                                        setReviewEndDate('');
                                                        setReviewPage(1);
                                                    }}
                                                    className="rounded-md px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                                                >
                                                    Limpar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={acceptHighConfidence}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                >
                                    <Sparkles size={14} />
                                    Aceitar alta confianca
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                                    {([
                                        ['operation', 'Operação'],
                                        ['dimensions', 'Dimensões'],
                                        ['metrics', 'Métricas'],
                                    ] as const).map(([mode, label]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => {
                                                setReviewMode(mode);
                                                setReviewPage(1);
                                            }}
                                            className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                                                reviewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {reviewMode !== 'operation' && <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                                    <span className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Ordenar</span>
                                    {REVIEW_SORT_OPTIONS[reviewMode].map((option) => (
                                        <button
                                            key={`${reviewMode}-${option.key}`}
                                            type="button"
                                            onClick={() => {
                                                setReviewSortByMode((current) => ({ ...current, [reviewMode]: option.key }));
                                                setReviewPage(1);
                                            }}
                                            className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${
                                                reviewSortByMode[reviewMode] === option.key
                                                    ? 'bg-cyan-50 text-cyan-700'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>}
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                    {Object.entries(result.insights.originCounts).map(([origin, count]) => (
                                        <span key={origin} className="rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600">
                                            {origin}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {([
                                    ['new_dispatch', 'Novos disparos'],
                                    ['update_dispatch', 'Disparos com atualização'],
                                    ['ignore', 'Ignorar'],
                                ] as const).map(([status, label]) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => {
                                            setReviewCollection('status');
                                            setReviewCollision('');
                                            setStatusFilter(status);
                                            setReviewPage(1);
                                        }}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                            reviewCollection === 'status' && !reviewCollision && statusFilter === status
                                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {result.domain === 'total_crm' && (
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
                                        Aquisição: {filteredDomainCounts.aquisicao}
                                    </span>
                                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2 py-1 text-cyan-700">
                                        Rentabilização: {filteredDomainCounts.rentabilizacao}
                                    </span>
                                </div>
                            )}
                        </div>

                        {collisionGroups.length > 0 && (
                            <details className="space-y-2 border-b px-6 py-2 text-xs" open={Boolean(reviewCollision)}>
                                <summary className="cursor-pointer font-semibold">Conflitos por grupo ({collisionGroups.length})</summary>
                            <section className="space-y-2" aria-label="Colisões de jornadas">
                                <label className="flex flex-wrap items-center gap-2 font-semibold">
                                    Conflitos por grupo
                                    <select className="max-w-full rounded border px-2 py-1" value={reviewCollision} onChange={event => {
                                        setReviewCollision(event.target.value);
                                        setReviewCampaign('');
                                        setReviewJourney('');
                                        setReviewChannel('');
                                        setReviewFront('');
                                        setReviewPage(1);
                                    }}>
                                        <option value="">Escolher grupo ({collisionGroups.length})</option>
                                        {collisionGroups.map(group => <option key={group.key} value={group.key}>
                                            {`${group.channel} · ${group.occurrences} ocorrências · ${group.journeys.join(' / ')}`}
                                        </option>)}
                                    </select>
                                </label>
                                {activeCollision && (
                                    <div className="space-y-2 rounded border bg-slate-50 p-3">
                                        <p>{activeCollision.occurrences} ocorrências em {activeCollision.activities.size} Activities.
                                            {' '}{activeCollision.equal} com métricas coincidentes. Período de {activeCollision.first} a {activeCollision.last}.</p>
                                        <ul>{activeCollision.exclusive.map(({ journey, count }) =>
                                            <li key={journey}>{journey} · {count} ocorrências exclusivas nas Activities do grupo</li>
                                        )}</ul>
                                        <p className="font-semibold">Amostra de {activeCollision.sample[0].date} · {activeCollision.sample[0].activityName}</p>
                                        <table className="w-full text-left">
                                            <thead><tr><th>Jornada</th><th>Enviados</th><th>Entregues</th><th>Aberturas / Leituras</th><th>Cliques</th></tr></thead>
                                            <tbody>{activeCollision.sample.map(row => <tr key={row.key}>
                                                <td>{row.journey}</td><td>{row.sent ?? '—'}</td><td>{row.delivered ?? '—'}</td>
                                                <td>{row.opens ?? '—'}</td><td>{row.clicks ?? '—'}</td>
                                            </tr>)}</tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                            </details>
                        )}
                        <div className="flex flex-wrap items-center gap-2 border-b bg-white px-6 py-3">
                            <button type="button" aria-pressed={reviewCollection === 'selected' && !reviewCollision}
                                className={'rounded-lg border px-3 py-2 text-xs font-bold ' + (reviewCollection === 'selected' && !reviewCollision ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : '')}
                                onClick={openSelected}>Selecionados ({selectedKeys.size})</button>
                            <button type="button" aria-pressed={reviewCollection === 'all' && !reviewCollision}
                                className={'rounded-lg border px-3 py-2 text-xs font-bold ' + (reviewCollection === 'all' && !reviewCollision ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : '')}
                                onClick={() => { setReviewCollection('all'); setReviewCollision(''); setReviewPage(1); }}>Todos os disparos</button>
                            {(reviewFront || reviewCampaign || reviewJourney) && <span className="text-xs text-slate-600">
                                {reviewJourney || campaignRows.find(([key]) => key === reviewCampaign)?.[1].title || reviewFront}
                                <button type="button" className="ml-2 text-cyan-800 underline" onClick={() => {
                                    setReviewFront(''); setReviewCampaign(''); setReviewJourney(''); setReviewPage(1);
                                }}>Limpar foco</button>
                            </span>}
                            {(reviewStartDate || reviewEndDate) && <span className="rounded bg-cyan-50 px-2 py-1 text-xs text-cyan-900">
                                Disparos de {reviewStartDate || 'início'} a {reviewEndDate || 'fim'}
                            </span>}
                            {previousFocus && <button type="button" className="text-xs text-cyan-800 underline" onClick={() => {
                                setReviewFront(previousFocus.front); setReviewCampaign(previousFocus.campaign); setReviewJourney(previousFocus.journey);
                                setPreviousFocus(null); setReviewCollision(''); setReviewPage(1);
                            }}>Voltar ao foco anterior</button>}
                            {mappingUnavailable && <p role="status" className="text-xs text-amber-700">Mapeamento indisponível. Revisão por disparo disponível.</p>}
                            <select className="ml-auto rounded border p-2 text-xs" aria-label="Canal" value={reviewChannel} onChange={event => { setReviewChannel(event.target.value); setReviewPage(1); }}>
                                <option value="">Todos os canais</option>
                                {[...new Set(candidates.map(row => row.channel))].sort().map(channel => <option key={channel}>{channel}</option>)}
                            </select>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            <details open={frontSelectorOpen} onToggle={event => setFrontSelectorOpen(event.currentTarget.open)} className="shrink-0">
                                <summary className="cursor-pointer border-b bg-slate-50 px-6 py-2 text-xs font-semibold text-cyan-800">Campanhas e períodos · expandir ou recolher</summary>
                            <ImportCampaignTree campaigns={treeCampaigns} selected={selectedKeys}
                                focusedCampaign={reviewCampaign} focusedJourney={reviewJourney}
                                onFocus={(front, campaign, journey, period) => {
                                    setPreviousFocus({ front: reviewFront, campaign: reviewCampaign, journey: reviewJourney });
                                    setReviewFront(front); setReviewCampaign(campaign); setReviewJourney(journey);
                                    if (period) { setReviewStartDate(period.from); setReviewEndDate(period.to); }
                                    setReviewCollection('all');
                                    setFrontSelectorOpen(false);
                                    setReviewCollision(''); setReviewPage(1);
                                }}
                                onScopeSelection={(rows, period, checked) => {
                                    setSelectedKeys(current => replaceImportScopeSelection(current, rows, period, checked));
                                    setReviewPage(1);
                                }}
                                onSelection={(keys, action) => setSelectedKeys(current => {
                                    const next = action === 'only' ? new Set<string>() : new Set(current);
                                    for (const key of keys) {
                                        if (action === 'remove') next.delete(key);
                                        else next.add(key);
                                    }
                                    return next;
                                })} />
                            </details>
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <div className={`flex flex-col gap-2 border-b px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${
                            selectedKeys.size > 0 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600'
                        }`}>
                                <label className="inline-flex items-center gap-2 font-bold">
                                    <input
                                        type="checkbox"
                                        ref={input => {
                                            if (!input) return;
                                            const eligible = filteredCandidates.filter(canUploadCandidate);
                                            const selected = eligible.filter(candidate => selectedKeys.has(candidate.key)).length;
                                            input.indeterminate = selected > 0 && selected < eligible.length;
                                        }}
                                        checked={filteredCandidates.some(canUploadCandidate) && filteredCandidates.filter(canUploadCandidate).every(candidate => selectedKeys.has(candidate.key))}
                                        onChange={() => {
                                            const allSelected = filteredCandidates.some(canUploadCandidate) && filteredCandidates.filter(canUploadCandidate).every(candidate => selectedKeys.has(candidate.key));
                                            setSelectedKeys((current) => {
                                                const next = new Set(current);
                                                filteredCandidates.filter(canUploadCandidate).forEach((candidate) => allSelected ? next.delete(candidate.key) : next.add(candidate.key));
                                                return next;
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    {selectedKeys.size > 0
                                        ? `${selectedKeys.size} selecionados · ${selectedKeys.size - filteredCandidates.filter(candidate => selectedKeys.has(candidate.key)).length} fora do filtro`
                                        : `Selecionar todos os ${filteredCandidates.length} filtrados`}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={openSelected} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700">Ver todos os selecionados</button>
                                    {selectedKeys.size > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setBulkEditOpen(true)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700"
                                        >
                                            <Edit3 size={13} />
                                            Editar campos
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={acceptSelectedCandidates}
                                        disabled={selectedKeys.size === 0}
                                        className="rounded-lg border border-white/30 bg-white px-3 py-2 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300"
                                    >
                                        Aprovar selecionados
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        disabled={!reviewedTsv}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <Copy size={14} />
                                        Copiar selecionados
                                    </button>
                                    {selectedKeys.size > 0 && (
                                        <button type="button" onClick={() => setSelectedKeys(new Set())} className="rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
                                            Limpar seleção
                                        </button>
                                    )}
                                    {undoSnapshot && (
                                        <button type="button" onClick={undoBulkEdit} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                                            Desfazer edição
                                        </button>
                                    )}
                                </div>
                        </div>

                        <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                {reviewCollection === 'selected' && !reviewCollision ? 'Seleção' : 'Lista'} · Mostrando {pagedCandidates.length} de {filteredCandidates.length} candidatos{reviewSearchTerm ? ` para "${reviewSearchTerm}"` : ' neste filtro'}. A revisao carrega em paginas para manter a tela responsiva.
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                                    disabled={reviewPage <= 1}
                                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                    Anterior
                                </button>
                                <span className="font-bold text-slate-700">{Math.min(reviewPage, reviewPageCount)} / {reviewPageCount}</span>
                                <button
                                    type="button"
                                    onClick={() => setReviewPage((page) => Math.min(reviewPageCount, page + 1))}
                                    disabled={reviewPage >= reviewPageCount}
                                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>

                        <main className="min-h-0 flex-1 overflow-auto">
                            <table className="w-full table-fixed divide-y divide-slate-200 text-left text-xs">
                                <thead className="sticky top-0 z-10 bg-white text-[10px] uppercase tracking-wider text-slate-500 shadow-sm">
                                    <tr>
                                        <th className="w-10 px-3 py-3 font-bold">Sel.</th>
                                        <th className="w-24 px-3 py-3 font-bold">Status</th>
                                        <th className="w-[25%] px-3 py-3 font-bold">Disparo</th>
                                        {reviewMode === 'operation' && <>
                                            <th className="w-28 px-3 py-3 font-bold">
                                                <button type="button" onClick={() => toggleOperationSort('date')} className="inline-flex items-center gap-1 hover:text-cyan-700">
                                                    Data do disparo {reviewSortByMode.operation === 'date_asc' ? '↑' : reviewSortByMode.operation === 'date_desc' ? '↓' : '↕'}
                                                </button>
                                            </th>
                                            <th className="w-[26%] px-3 py-3 font-bold">Classificação</th>
                                            <th className="w-[16%] px-3 py-3 font-bold">Decisão</th>
                                            <th className="w-24 px-3 py-3 font-bold">
                                                <button type="button" onClick={() => toggleOperationSort('confidence')} className="inline-flex items-center gap-1 hover:text-cyan-700">
                                                    Confiança {reviewSortByMode.operation === 'confidence_asc' ? '↑' : reviewSortByMode.operation === 'confidence_desc' ? '↓' : '↕'}
                                                </button>
                                            </th>
                                        </>}
                                        {reviewMode === 'dimensions' && <>
                                            <th className="w-[38%] px-3 py-3 font-bold">Dimensões</th>
                                            <th className="w-[12%] px-3 py-3 font-bold">Confiança</th>
                                        </>}
                                        {reviewMode === 'metrics' && <>
                                            <th className="px-3 py-3 font-bold">Base</th>
                                            <th className="px-3 py-3 font-bold">Engajamento</th>
                                            <th className="px-3 py-3 font-bold">Conversão</th>
                                        </>}
                                        <th className="w-24 px-3 py-3 font-bold">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {pagedCandidates.map((candidate) => (
                                        <tr
                                            key={candidate.key}
                                            onClick={() => setSelectedCandidate(candidate)}
                                            className={`${candidate.accepted ? 'bg-emerald-50/40' : 'hover:bg-slate-50'} cursor-pointer`}
                                        >
                                            <td className="px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKeys.has(candidate.key)}
                                                    onChange={(event) => toggleCandidateSelection(candidate.key, event.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                />
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${candidate.metricRefresh ? UPDATE_STATUS_CLASS : STATUS_CLASS[candidate.status]}`}>
                                                    {candidate.accepted ? 'Aceito' : candidateStatusLabel(candidate)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                                        candidate.domain === 'aquisicao'
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-cyan-50 text-cyan-700'
                                                    }`}>
                                                        {DOMAIN_LABEL[candidate.domain]}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-slate-400">
                                                        {DOMAIN_TARGET_TABLE[candidate.domain]}
                                                    </span>
                                                </div>
                                                <div className="truncate font-semibold text-slate-900" title={candidate.journey}>{candidate.journey}</div>
                                                <div className="mt-1 truncate text-slate-500" title={candidate.activityName}>{candidate.activityName}</div>
                                                <div className="mt-2 text-[10px] font-bold text-slate-500">{candidate.channel}</div>
                                            </td>
                                            {reviewMode === 'operation' && <>
                                                <td className="px-3 py-3 align-top font-semibold text-slate-700">{formatDateBR(candidate.date)}</td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="font-semibold text-slate-800">{candidate.bu} · {candidate.parceiro} · {candidate.segmento}</div>
                                                    <div className="mt-1 text-[11px] text-slate-500">{candidate.subgrupo} · {candidate.etapaAquisicao} · {candidate.perfilCredito}</div>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {candidate.oferta && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">{candidate.oferta}</span>}
                                                        {candidate.promocional && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] text-cyan-700">{candidate.promocional}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="font-bold text-slate-800">{candidate.fieldToReview}</div>
                                                    <div className="mt-1 line-clamp-2 text-[10px] text-slate-500">{candidate.suggestion}</div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="font-bold text-slate-800">{candidate.confidence}%</div>
                                                    <div className="mt-1 text-[10px] text-slate-500">
                                                        {candidate.auditRequired ? 'Auditoria obrigatória' : isBulkApprovalEligible(candidate) ? 'Elegível em lote' : 'Requer validação'}
                                                    </div>
                                                </td>
                                            </>}
                                            {reviewMode === 'dimensions' && <>
                                                <td className="px-3 py-3 align-top">
                                                    {(() => {
                                                        const moment = momentChipsFor(candidate);
                                                        return (
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    <DimensionChip label="BU" value={candidate.bu} tone="blue" />
                                                                    <DimensionChip label="Parceiro" value={candidate.parceiro} />
                                                                    <DimensionChip label="Segmento" value={candidate.segmento} tone="cyan" />
                                                                    <DimensionChip label="Subgrupo" value={candidate.subgrupo} />
                                                                    <DimensionChip label="Etapa" value={candidate.etapaAquisicao} />
                                                                    <DimensionChip label="Perfil" value={candidate.perfilCredito} />
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    <DimensionChip label="Momento" value={moment.seq} tone="emerald" />
                                                                    <DimensionChip label="Semana" value={moment.week} tone="emerald" />
                                                                    <DimensionChip label="Disparo" value={moment.dispatch} tone="emerald" />
                                                                    <DimensionChip label="Canal" value={candidate.channel} tone="blue" />
                                                                    <DimensionChip label="Data" value={formatDateBR(candidate.date)} tone="slate" />
                                                                    <DimensionChip label="Origem" value={moment.source} tone="slate" />
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    <DimensionChip label="Produto" value={candidate.produto} />
                                                                    <DimensionChip label="Oferta" value={candidate.oferta} tone="cyan" />
                                                                    <DimensionChip label="Promo" value={candidate.promocional} tone="cyan" />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-3 align-top font-bold text-slate-700">{candidate.confidence}%</td>
                                            </>}
                                            {reviewMode === 'metrics' && <>
                                                <td className="px-3 py-3 align-top"><b>{candidate.sent ?? '-'}</b> total<br/><span className="text-slate-500">{candidate.delivered ?? '-'} acionável</span></td>
                                                <td className="px-3 py-3 align-top"><b>{candidate.opens ?? '-'}</b> aberturas<br/><span className="text-slate-500">{candidate.clicks ?? '-'} cliques</span></td>
                                                <td className="px-3 py-3 align-top"><b>{candidate.proposals ?? '-'}</b> propostas<br/><span className="text-slate-500">{candidate.approved ?? '-'} aprovados · {candidate.finalized ?? '-'} cartões</span></td>
                                            </>}
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            acceptCandidate(candidate.key);
                                                        }}
                                                        disabled={!canUploadCandidate(candidate)}
                                                        className="rounded-md bg-emerald-600 px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                        title="Aceitar"
                                                    >
                                                        <CheckCircle size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setSelectedCandidate(candidate);
                                                        }}
                                                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100"
                                                        title="Editar detalhes"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button type="button" onClick={(event) => { event.stopPropagation(); ignoreCandidate(candidate.key); }} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100" title="Ignorar">
                                                        <MoreHorizontal size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCandidates.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-16 text-center text-slate-500">
                                                {reviewSearchTerm ? 'Nenhum candidato encontrado para esta busca.' : 'Nenhum candidato neste filtro.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </main>
                            </div>
                        </div>

                        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-500">
                                {selectedKeys.size} selecionados · {uploadCandidates.length} aprovados para gravar.
                                {selectedCandidatesForCopy.length > uploadCandidates.length && ' Há selecionados que ainda precisam de aprovação.'}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewOpen(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!reviewedTsv}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copiado' : 'Copiar linhas'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadCsv}
                                    disabled={!reviewedTsv}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                    <Download size={14} />
                                    Baixar CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadConfirmOpen(true)}
                                    disabled={saving || uploadCandidates.length === 0}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
                                    Enviar para base de dados
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}

            {uploadConfirmOpen && result && fileMeta && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <Database size={16} className="text-blue-700" />
                                    Confirmar upload para base de dados
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Revise o lote antes de gravar. Apenas linhas aceitas entram na tabela de campanhas.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUploadConfirmOpen(false)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Fechar confirmacao"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        <main className="space-y-4 px-5 py-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Arquivo</div>
                                <div className="mt-1 truncate text-sm font-bold text-slate-900" title={fileMeta.name}>{fileMeta.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{fileMeta.rows} linhas lidas da Dinamica BI</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="Serao gravadas" value={uploadCandidates.length} tone="text-blue-700" />
                                <StatCard label="Fora do envio" value={uploadOperationCounts.blocked} tone="text-amber-700" />
                                <StatCard label="Novos / upsert" value={uploadOperationCounts.upserts} tone="text-emerald-700" />
                                <StatCard label="Atualizar metricas" value={uploadOperationCounts.metricUpdates} tone="text-cyan-700" />
                                <StatCard label="Duplicadas" value={summary.duplicate} tone="text-purple-700" />
                                <StatCard label="Erros" value={summary.error} tone="text-red-700" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Aquisição</div>
                                    <div className="mt-1 text-xl font-bold text-blue-800">{uploadDomainCounts.aquisicao}</div>
                                    <div className="text-xs text-blue-700">destino: activities</div>
                                </div>
                                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-500">Rentabilização</div>
                                    <div className="mt-1 text-xl font-bold text-cyan-800">{uploadDomainCounts.rentabilizacao}</div>
                                    <div className="text-xs text-cyan-700">destino: rentabilizacao_activities</div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-600">
                                <div className="font-bold text-slate-900">Conteúdo do upload</div>
                                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                    <span>Blocos:</span>
                                    <span className="font-semibold text-slate-800">{uploadBlocks.length > 0 ? uploadBlocks.join(', ') : 'N/A'}</span>
                                    <span>Defaults aplicados:</span>
                                    <span className="font-semibold text-slate-800">N/A, Padrao, Cartao</span>
                                    <span>Auditoria:</span>
                                    <span className="font-semibold text-slate-800">run, métricas, candidatos e validação do retorno</span>
                                </div>
                            </div>
                        </main>

                        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setUploadConfirmOpen(false)}
                                disabled={saving}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUpload}
                                disabled={saving || uploadCandidates.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                                {saving ? 'Enviando...' : 'Enviar para base de dados'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {bulkEditOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Editar campos em massa</h3>
                                <p className="mt-1 text-xs text-slate-500">A alteração fica disponível para desfazer até o upload.</p>
                            </div>
                            <button type="button" onClick={() => setBulkEditOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X size={16}/></button>
                        </header>
                        <main className="space-y-4 p-5">
                            <div className="grid grid-cols-2 gap-3">
                                <label>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Campo</span>
                                    <select value={bulkField} onChange={(event) => { setBulkField(event.target.value as ReviewField); setBulkValue(''); }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs">
                                        {REVIEW_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Aplicar em</span>
                                    <select value={bulkScope} onChange={(event) => setBulkScope(event.target.value as 'selected' | 'filtered')} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs">
                                        <option value="selected">{selectedKeys.size} selecionados</option>
                                        <option value="filtered">{filteredCandidates.length} resultados filtrados</option>
                                    </select>
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Novo valor</span>
                                <div className="mt-1">
                                    {bulkField === 'ordemDisparo' ? (
                                        <input type="number" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"/>
                                    ) : (
                                        <HistoryCombobox value={bulkValue} suggestions={bulkSuggestions} onChange={setBulkValue}/>
                                    )}
                                </div>
                            </label>
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                                <strong>{bulkScope === 'selected' ? selectedKeys.size : filteredCandidates.length} activities</strong> receberão <strong>{REVIEW_FIELDS.find((field) => field.key === bulkField)?.label} = {bulkValue || '...'}</strong>.
                            </div>
                        </main>
                        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <button type="button" onClick={() => setBulkEditOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancelar</button>
                            <button type="button" onClick={applyBulkEdit} disabled={!bulkValue.trim()} className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-300">Aplicar alteração</button>
                        </footer>
                    </div>
                </div>
            )}

            {selectedCandidate && (
                <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/35 backdrop-blur-sm">
                    <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl">
                        <header className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${selectedCandidate.metricRefresh ? UPDATE_STATUS_CLASS : STATUS_CLASS[selectedCandidate.status]}`}>
                                        {selectedCandidate.accepted ? 'Aceito' : candidateStatusLabel(selectedCandidate)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">{selectedCandidate.channel} - {formatDateBR(selectedCandidate.date)}</span>
                                </div>
                                <h3 className="mt-2 break-words text-lg font-bold leading-snug text-slate-900">{selectedCandidate.journey}</h3>
                                <p className="mt-1 break-all text-xs text-slate-500">{selectedCandidate.activityName}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCandidate(null)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Fechar detalhe da metrica"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
                            <section className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    {isRentReview ? 'Engajamento' : 'Resultado consolidado'}
                                </h4>
                                <div className={`grid gap-2 ${isRentReview ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
                                    {(isRentReview
                                        ? [
                                            ['Base Total', selectedCandidate.sent],
                                            ['Base Acionavel', selectedCandidate.delivered],
                                            ['Aberturas', selectedCandidate.opens],
                                            ['Cliques', selectedCandidate.clicks],
                                        ]
                                        : [
                                            ['Base Total', selectedCandidate.sent],
                                            ['Base Acionavel', selectedCandidate.delivered],
                                            ['Aberturas', selectedCandidate.opens],
                                            ['Cliques', selectedCandidate.clicks],
                                            ['Propostas', selectedCandidate.proposals],
                                            ['Aprovados', selectedCandidate.approved],
                                            ['Cartoes', selectedCandidate.finalized],
                                            ['Emissoes Assistidas', selectedCandidate.assisted],
                                            ['Emissoes Indep.', selectedCandidate.independent],
                                        ]
                                    ).map(([label, value]) => (
                                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                                            <div className="mt-0.5 text-base font-bold text-slate-900">{value ?? '-'}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                    <div><span className="font-bold text-slate-900">Blocos consolidados:</span> {selectedCandidate.sourceBlocks.join(', ')}</div>
                                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                        Editar Jornada, Activity, Canal ou Data altera a chave de unicidade usada para gravar na base de dados.
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jornada</span>
                                            <input
                                                value={selectedCandidate.journey}
                                                onChange={(event) => updateCandidate(selectedCandidate.key, {
                                                    journey: event.target.value,
                                                    accepted: false,
                                                })}
                                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Canal</span>
                                            <select
                                                value={selectedCandidate.channel}
                                                onChange={(event) => {
                                                    const channel = event.target.value as Channel;
                                                    updateCandidate(selectedCandidate.key, {
                                                        channel,
                                                        dispatchSignature: buildDispatchSignature(selectedCandidate.activityName, channel, selectedCandidate.date),
                                                        accepted: false,
                                                    });
                                                }}
                                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                                            >
                                                {(['WhatsApp', 'E-mail', 'SMS', 'Push'] as Channel[]).map((channel) => (
                                                    <option key={channel} value={channel}>{channel}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Data</span>
                                            <input
                                                type="date"
                                                value={selectedCandidate.date}
                                                onChange={(event) => updateCandidate(selectedCandidate.key, {
                                                    date: event.target.value,
                                                    dispatchSignature: buildDispatchSignature(selectedCandidate.activityName, selectedCandidate.channel, event.target.value),
                                                    accepted: false,
                                                })}
                                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Activity name / Taxonomia</span>
                                            <input
                                                value={selectedCandidate.activityName}
                                                onChange={(event) => updateCandidate(selectedCandidate.key, {
                                                    activityName: event.target.value,
                                                    dispatchSignature: buildDispatchSignature(event.target.value, selectedCandidate.channel, selectedCandidate.date),
                                                    accepted: false,
                                                })}
                                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                                            />
                                        </label>
                                    </div>
                                    <details className="mt-3 rounded-md bg-slate-50 p-2">
                                        <summary className="cursor-pointer text-[11px] font-bold text-slate-500">Ver identificadores técnicos</summary>
                                        <div className="mt-2 break-all font-mono text-[10px] text-slate-500">
                                            <div>identity: {selectedCandidate.key}</div>
                                            <div className="mt-1">anti-renomeacao: {selectedCandidate.dispatchSignature}</div>
                                        </div>
                                    </details>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Revisao compacta</h4>
                                {selectedCandidate.status === 'conflict' && (
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                                        <div className="font-bold">Possivel jornada renomeada no SFMC</div>
                                        <div className="mt-1">{selectedCandidate.basis}</div>
                                    </div>
                                )}
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {reviewFields.map((field) => {
                                            const hasSuggestions = field.key !== 'ordemDisparo';
                                            const suggestions = hasSuggestions
                                                ? suggestionsFor(selectedCandidate.suggestions, field.key as SuggestionField)
                                                : [];
                                            const top = suggestions[0];
                                            return (
                                                <label key={field.key} className="block">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{field.label}</span>
                                                    <div className="mt-1">
                                                        {hasSuggestions ? (
                                                            <HistoryCombobox
                                                                value={String(selectedCandidate[field.key] ?? '')}
                                                                suggestions={suggestions}
                                                                onChange={(value) => updateCandidate(selectedCandidate.key, {
                                                                    [field.key]: value,
                                                                    accepted: false,
                                                                } as Partial<UpdateCandidate>)}
                                                            />
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                value={selectedCandidate[field.key] ?? ''}
                                                                onChange={(event) => updateCandidate(selectedCandidate.key, {
                                                                    [field.key]: event.target.value ? Number(event.target.value) : undefined,
                                                                    accepted: false,
                                                                } as Partial<UpdateCandidate>)}
                                                                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                                                            />
                                                        )}
                                                    </div>
                                                    {top && (
                                                        <div className="mt-1 text-[10px] leading-tight text-slate-400">
                                                            {top.confidence}% - {top.source} ({top.count})
                                                        </div>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                    <div className="font-bold text-slate-900">{selectedCandidate.fieldToReview}</div>
                                    <div className="mt-1">{selectedCandidate.suggestion}</div>
                                    <div className="mt-1 text-slate-400">{selectedCandidate.basis}</div>
                                </div>
                            </section>
                        </div>
                        </div>

                        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setSelectedCandidate(null)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Fechar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    ignoreCandidate(selectedCandidate.key);
                                    setSelectedCandidate(null);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Ignorar disparo
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    acceptCandidate(selectedCandidate.key);
                                    setSelectedCandidate(null);
                                }}
                                disabled={!canUploadCandidate(selectedCandidate)}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                Aceitar disparo
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
