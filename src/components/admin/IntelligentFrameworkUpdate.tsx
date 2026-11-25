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
import { buildBaseFreshness, type BaseFreshness } from './updateHistoryModel';
import { ImportCampaignTree, importToday } from './ImportCampaignTree';
import { sha256Hex } from '../../utils/fileHash';
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
    RotateCcw,
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
export type ImportStep = 'arquivo' | 'escopo' | 'revisao' | 'recibo';
type ImportStepView = ImportStep | 'gravacao';

const IMPORT_STEPS: Array<{ id: ImportStepView; label: string; hint: string }> = [
    { id: 'arquivo', label: 'Arquivo', hint: 'solte a Dinâmica BI' },
    { id: 'escopo', label: 'Escopo', hint: 'frentes e período' },
    { id: 'revisao', label: 'Revisão', hint: 'Operação, Dimensões, Métricas' },
    { id: 'gravacao', label: 'Gravação', hint: 'em lotes, com retorno validado' },
    { id: 'recibo', label: 'Recibo', hint: 'vai para o histórico' },
];

export const IntelligentFrameworkUpdate: React.FC<{
    onOpenHistory?: () => void;
    onStepChange?: (step: ImportStep) => void;
}> = ({ onOpenHistory, onStepChange }) => {
    const { activities } = useAppStore();
    const [activeFlow, setActiveFlow] = useState<UpdateFlow>('total_crm');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [sourceHash, setSourceHash] = useState<string | null>(null);
    const [sameFileRuns, setSameFileRuns] = useState<Array<{ id: string; createdAt: string; createdBy: string | null; applied: number; domain: string }>>([]);
    const [statusFilter, setStatusFilter] = useState<CandidateFilter>('new_dispatch');
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    // Etapas no lugar do overlay de revisão: Arquivo, Escopo, Revisão, Gravação, Recibo.
    const [step, setStep] = useState<ImportStep>('arquivo');
    // Avisa só quando a etapa muda (a callback do pai é recriada a cada render).
    const onStepChangeRef = useRef(onStepChange);
    onStepChangeRef.current = onStepChange;
    useEffect(() => { onStepChangeRef.current?.(step); }, [step]);
    const reviewOpen = step === 'revisao';
    const setReviewOpen = (open: boolean) => setStep(open ? 'revisao' : 'escopo');
    const rentabilizacaoCount = useAppStore((state) => state.rentabilizacaoActivities?.length ?? 0);
    const [baseFreshness, setBaseFreshness] = useState<BaseFreshness[]>([]);
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
        setStep('arquivo');
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
        // A regra do Consumo SFMC e o pilar do Board escrevem a mesma frente de jeitos diferentes
        // ("1º uso" e "1º Uso"). Mesma frente sem diferenciar caixa e acento; vale o nome do pilar.
        const frontNames = new Map<string, string>();
        importMapping?.board.pillars.forEach(pillar => frontNames.set(normalizeKey(pillar.title), pillar.title));
        const canonicalFront = (front: string) => {
            const key = normalizeKey(front);
            if (!key) return '';
            if (!frontNames.has(key)) frontNames.set(key, front.trim());
            return frontNames.get(key)!;
        };
        return new Map(candidates.map(candidate => {
            const manual = importMapping?.manual.get(candidate.journey || candidate.activityName);
            const rule = manual ?? (importMapping && classify(candidate.journey, candidate.activityName, importMapping.rules));
            const exactCardId = importMapping?.exactRentCards.get(normalizeKey(candidate.journey));
            const cardId = manual ? manual.card_id : exactCardId || rule?.card_id;
            const card = cardId ? cards.get(cardId) : undefined;
            const front = canonicalFront(rule?.front || pillars.get(lanes.get(card?.lane_id ?? '')?.pillar_id ?? '') || '');
            const title = card?.title || rule?.group_label || front || 'Sem campanha mapeada';
            const key = card?.id || JSON.stringify([normalizeKey(front), normalizeKey(title)]);
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
            status: row.status, accepted: Boolean(row.accepted),
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
        setSourceHash(null);
        setSameFileRuns([]);
        // Mesmo arquivo já gravado? O hash roda em paralelo e nunca segura o processamento.
        void file.arrayBuffer().then(sha256Hex).then(async (hash) => {
            if (!hash) return;
            setSourceHash(hash);
            setSameFileRuns(await intelligentUpdateService.findAppliedRunsBySource(hash));
        }).catch(() => undefined);

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
            // Padrão da casa: tudo que dá para gravar, Aquisição da segunda passada para cá e as
            // demais frentes inteiras. Gravar continua exigindo aprovação na Revisão.
            setSelectedKeys(new Set(reviewed.filter(candidate => canUploadCandidate(candidate)
                && (candidate.domain !== 'aquisicao' || candidate.date >= previousWeekStart(importToday()) && candidate.date <= importToday()))
                .map(candidate => candidate.key)));
            setStep('escopo');
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

    const loadFreshness = useCallback(async () => {
        try {
            const [latest, stats] = await Promise.all([
                intelligentUpdateService.fetchLatestAppliedRuns().catch(() => []),
                intelligentUpdateService.fetchBaseStats().catch(() => ({})),
            ]);
            setBaseFreshness(buildBaseFreshness(latest, {}, new Date(), stats));
        } catch {
            setBaseFreshness([]);
        }
    }, []);

    useEffect(() => {
        void loadFreshness();
    }, [loadFreshness]);

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
                    ...(sourceHash ? { sourceHash } : {}),
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
            setUploadConfirmOpen(false);
            setStep('recibo');

            // PILAR: apos gravar, o snapshot do Zustand fica defasado (ainda tem os
            // valores antigos). Sem este reload, reprocessar o mesmo arquivo na mesma
            // sessao compara contra a base velha e os disparos ja aplicados reaparecem
            // como "Atualizar metricas". Recarrega as duas frentes da base.
            // Roda em segundo plano: o recibo aparece na hora.
            void Promise.all([
                dataService.fetchActivities(),
                dataService.fetchRentabilizacaoActivities(),
            ]).then(([freshActivities, freshRentab]) => {
                useAppStore.getState().setActivities(freshActivities);
                useAppStore.getState().setRentabilizacaoActivities(freshRentab);
            }).catch((refreshError) => {
                console.error('Falha ao recarregar base apos atualizacao inteligente:', refreshError);
            });

            void loadHistory();
            void loadFreshness();
        } catch (error: any) {
            setSaveMessage({
                type: 'error',
                text: error?.message ? `Falha ao salvar: ${error.message}` : 'Falha ao salvar na base de dados.',
            });
            setUploadConfirmOpen(false);
            setStep('recibo');
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

    const visualStep: ImportStepView = saving ? 'gravacao' : step;
    const scopeTotal = selectedKeys.size;
    const scopeCandidates = candidates.filter((candidate) => selectedKeys.has(candidate.key));
    const scopeNew = scopeCandidates.filter((candidate) => candidateAction(candidate) === 'novo').length;
    const scopeUpdates = scopeCandidates.filter((candidate) => candidateAction(candidate) === 'atualizar').length;
    const scopeDomain = {
        aquisicao: scopeCandidates.filter((candidate) => candidate.domain === 'aquisicao').length,
        rentabilizacao: scopeCandidates.filter((candidate) => candidate.domain === 'rentabilizacao').length,
    };
    const scopeConfidence = scopeCandidates.length
        ? Math.round(scopeCandidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / scopeCandidates.length)
        : null;
    // Só o que está no escopo, dá para gravar e ainda não foi aprovado. Conflito e "já existe"
    // ficam de fora do escopo (não dá para selecionar), então não entram aqui.
    const needsYou = scopeCandidates.filter((candidate) => canUploadCandidate(candidate) && !candidate.accepted).length;
    const fileDates = candidates.map((candidate) => candidate.date).filter(Boolean).sort();
    const fileComposition = [
        { key: 'ok', label: 'Dá para gravar', bar: 'bg-cyan-700', count: candidates.filter(canUploadCandidate).length, hint: 'Novo ou com número novo. Entra no escopo e passa pela Revisão.' },
        { key: 'duplicate', label: 'Já igual na base', bar: 'bg-slate-300', count: summary.duplicate, hint: 'Já está gravado com os mesmos números. Nada para fazer.' },
        { key: 'conflict', label: 'Conflito de jornada', bar: 'bg-orange-400', count: summary.conflict, hint: 'A mesma activity, canal e data aparece com outra jornada, no arquivo ou na base. Não grava sem decisão.' },
        { key: 'ignored', label: 'Sem volume', bar: 'bg-slate-200', count: summary.ignored, hint: 'Linha sem Base Total e Base Acionável válidas. Não vira disparo.' },
        { key: 'error', label: 'Erro de leitura', bar: 'bg-red-600', count: summary.error, hint: 'Falta jornada, activity, data ou canal.' },
    ].filter((part) => part.key === 'ok' || part.count > 0);
    const filePeriod = fileDates.length ? `${formatDateBR(fileDates[0])} a ${formatDateBR(fileDates[fileDates.length - 1])}` : 'sem dado';
    const worstFreshness = baseFreshness.find((base) => base.tone !== 'ok') ?? baseFreshness[0];
    const goToReview = () => {
        setReviewCollection('selected');
        setReviewCollision('');
        setReviewPage(1);
        setStep('revisao');
    };
    const startOver = () => {
        setStep('arquivo');
        setSaveMessage(null);
    };

    return (
        <div className="flex min-h-[calc(var(--screen-h)-56px)] flex-col bg-slate-50 text-slate-900">
            <div className="flex flex-wrap items-center gap-3 bg-white px-6 pb-2.5 pt-3.5">
                <div>
                    <div className="text-xs text-slate-500">Configurações · Gestão de dados</div>
                    <h1 className="text-xl font-bold">Atualizar bases</h1>
                </div>
                <div role="group" aria-label="O que atualizar" className="ml-2 inline-flex overflow-hidden rounded-sm border border-slate-300">
                    {(['total_crm', 'aquisicao', 'rentabilizacao'] as const).map((flow) => (
                        <button
                            key={flow}
                            type="button"
                            disabled={step !== 'arquivo' || processing}
                            title={step !== 'arquivo' ? 'Volte para a etapa Arquivo para trocar a frente' : FLOW_TARGET_LABEL[flow]}
                            aria-pressed={activeFlow === flow}
                            onClick={() => setActiveFlow(flow)}
                            className={`px-3 py-1.5 text-[12.5px] disabled:cursor-not-allowed ${activeFlow === flow ? 'bg-cyan-50 font-semibold text-cyan-700' : 'bg-white text-slate-600 disabled:text-slate-400'}`}
                        >
                            {flow === 'total_crm' ? 'Total CRM' : flow === 'aquisicao' ? 'Só Aquisição' : 'Só Rentabilização'}
                        </button>
                    ))}
                </div>
                <span className="flex-1" />
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <Database size={14} aria-hidden="true" />
                    Na base: {(baseFreshness.find((base) => base.key === 'aquisicao')?.count ?? activities.length).toLocaleString('pt-BR')} disparos de Aquisição · {(baseFreshness.find((base) => base.key === 'rentabilizacao')?.count ?? rentabilizacaoCount).toLocaleString('pt-BR')} de Rentabilização
                </span>
                {worstFreshness && (
                    <span
                        title={baseFreshness.map((base) => `${base.label}: ${base.freshLabel}`).join(' · ')}
                        className={`rounded-sm border px-2.5 py-1 text-xs font-semibold ${worstFreshness.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                    >
                        {worstFreshness.label} gravada {worstFreshness.freshLabel}
                    </span>
                )}
            </div>

            <ol aria-label="Etapas" className="flex border-b border-slate-200 bg-white px-6 pb-3">
                {IMPORT_STEPS.map((item, index) => {
                    const currentIndex = IMPORT_STEPS.findIndex((stepItem) => stepItem.id === visualStep);
                    const done = index < currentIndex;
                    const current = index === currentIndex;
                    const hint = item.id === 'arquivo' && fileMeta ? `${fileMeta.name} · ${fileMeta.rows.toLocaleString('pt-BR')} linhas`
                        : item.id === 'escopo' && result ? `${scopeTotal.toLocaleString('pt-BR')} de ${candidates.length.toLocaleString('pt-BR')} disparos`
                            : item.id === 'revisao' && result ? `${needsYou.toLocaleString('pt-BR')} precisam de você`
                                : item.hint;
                    return (
                        <li
                            key={item.id}
                            aria-current={current ? 'step' : undefined}
                            className={`flex min-w-0 flex-1 items-center gap-2 border px-3 py-2 text-[12.5px] ${index > 0 ? '-ml-px' : ''} ${current
                                ? 'z-10 border-cyan-700 bg-cyan-700 text-white'
                                : done ? 'border-teal-200 bg-teal-50 text-slate-900' : 'border-slate-200 bg-white text-slate-600'}`}
                        >
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${current
                                ? 'bg-white text-cyan-700'
                                : done ? 'bg-teal-700 text-white' : 'border-[1.5px] border-slate-300 text-slate-600'}`}>
                                {done ? <CheckCircle size={12} aria-hidden="true" /> : index + 1}
                            </span>
                            <span className="flex min-w-0 flex-col">
                                {done && item.id !== 'gravacao' && item.id !== 'recibo' && !saving ? (
                                    <button type="button" onClick={() => setStep(item.id as ImportStep)} className="truncate text-left font-bold underline-offset-2 hover:underline">{item.label}</button>
                                ) : (
                                    <b className={`truncate ${current ? '' : 'text-slate-900'}`}>{item.label}</b>
                                )}
                                <span className={`truncate ${current ? 'text-cyan-100' : 'text-slate-600'}`}>{hint}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>

            {dragError && (
                <div role="alert" className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-800">
                    <div className="flex items-center gap-2 font-semibold"><AlertCircle size={15} aria-hidden="true" /> {dragError}</div>
                    {debugInfo && (
                        <details className="mt-1 text-xs text-red-700">
                            <summary className="cursor-pointer">Detalhe técnico</summary>
                            <div className="mt-1 font-mono">arquivo: {debugInfo.fileName || 'sem dado'} · etapa: {debugInfo.stage || 'sem dado'} · linhas: {debugInfo.matrixRows ?? 'sem dado'} · colunas: {debugInfo.firstRowColumns ?? 'sem dado'}</div>
                        </details>
                    )}
                </div>
            )}

            {step === 'arquivo' && (
                <div className="flex min-h-0 flex-1 flex-wrap gap-5 p-6">
                    <section aria-label="Arquivo" className="flex min-w-[420px] flex-[999_1_560px] flex-col gap-3">
                        <div
                            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                            onDrop={async (event) => {
                                event.preventDefault();
                                setIsDragging(false);
                                const file = event.dataTransfer.files?.[0];
                                if (file) await processFile(file);
                            }}
                            className={`flex min-h-[340px] flex-1 flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed px-6 text-center transition ${isDragging ? 'border-cyan-600 bg-cyan-50' : 'border-cyan-200 bg-[#f0fdff]'}`}
                        >
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-cyan-700 shadow-[0_1px_2px_rgba(15,23,42,.08)]">
                                {processing ? <Loader2 size={26} className="animate-spin" aria-hidden="true" /> : <Upload size={26} aria-hidden="true" />}
                            </span>
                            <b className="text-[17px]">{processing ? PROCESSING_STAGE_LABEL[processingStage] : 'Solte a Dinâmica BI aqui'}</b>
                            {processing ? (
                                <ol className="flex gap-4 text-[12.5px] text-slate-600" aria-label="Progresso da leitura">
                                    {(['reading', 'indexing', 'detecting'] as const).map((stage) => {
                                        const order = ['reading', 'indexing', 'detecting', 'reviewing'];
                                        const doneStage = order.indexOf(processingStage) > order.indexOf(stage);
                                        const currentStage = processingStage === stage;
                                        return (
                                            <li key={stage} className={`inline-flex items-center gap-1.5 ${currentStage ? 'font-semibold text-cyan-700' : doneStage ? 'text-teal-700' : ''}`}>
                                                {doneStage ? <CheckCircle size={13} aria-hidden="true" /> : currentStage ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                                {PROCESSING_STAGE_LABEL[stage]}
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <span className="text-[13px] text-slate-600">.xlsx, .csv ou .tsv · a leitura roda em segundo plano, a tela não trava</span>
                            )}
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
                                className="h-9 rounded-sm border border-cyan-700 bg-cyan-700 px-4 text-[13px] font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                            >
                                Selecionar arquivo
                            </button>
                        </div>
                        {result && fileMeta && !processing && (
                            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px]">
                                <RotateCcw size={16} className="text-slate-600" aria-hidden="true" />
                                <span>Revisão em aberto: <b>{fileMeta.name}</b> · {needsYou.toLocaleString('pt-BR')} itens esperando você</span>
                                <span className="flex-1" />
                                <button type="button" onClick={() => setStep('escopo')} className="font-semibold text-cyan-700 hover:underline">Continuar revisão</button>
                            </div>
                        )}
                    </section>

                    <aside aria-label="Situação" className="flex min-w-[300px] flex-[1_1_340px] flex-col gap-3.5">
                        <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3.5">
                            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">Bases</div>
                            {baseFreshness.map((base) => (
                                <div key={base.key} className="flex items-center gap-2 border-b border-[#eef2f6] py-1.5 text-[13px] last:border-b-0">
                                    <span className={`h-2 w-2 rounded-full ${base.tone === 'ok' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                                    {base.label}
                                    <span className="flex-1" />
                                    <span className={`font-semibold ${base.tone === 'ok' ? 'text-emerald-700' : 'text-amber-700'}`}>{base.freshLabel}</span>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3.5">
                            <div className="mb-2 flex items-center">
                                <span className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">Últimas atualizações</span>
                                <span className="flex-1" />
                                {onOpenHistory && <button type="button" onClick={onOpenHistory} className="text-xs font-semibold text-cyan-700 hover:underline">Ver histórico</button>}
                            </div>
                            {historyLoading && historyItems.length === 0 && <div className="text-[12.5px] text-slate-500">Carregando</div>}
                            {historyError && <div className="text-[12.5px] text-red-700">{historyError}</div>}
                            {!historyLoading && !historyError && historyItems.length === 0 && <div className="text-[12.5px] text-slate-500">Nenhuma atualização registrada ainda.</div>}
                            {historyItems.slice(0, 4).map((run) => (
                                <div key={run.id} className="flex gap-2 border-b border-[#eef2f6] py-1.5 text-[12.5px] last:border-b-0">
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${run.status === 'applied' ? 'bg-emerald-600' : run.status === 'failed' ? 'bg-red-600' : 'bg-amber-600'}`} />
                                    <span className="min-w-0 flex-1">
                                        <b>{new Date(run.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</b> · {FLOW_LABEL[run.domain as UpdateFlow] ?? run.domain}
                                        <br />
                                        <span className="text-slate-600">{run.applied.toLocaleString('pt-BR')} gravados · {run.blocked.toLocaleString('pt-BR')} fora</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            )}

            {step === 'escopo' && result && fileMeta && (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex flex-1 flex-wrap items-start gap-5 p-6">
                        <section aria-label="Frentes e período" className="flex min-w-[520px] flex-[999_1_640px] flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                            <p className="border-b border-[#eef2f6] bg-slate-50 px-4 py-2 text-xs text-slate-600">
                                Já veio marcado tudo que dá para gravar: Aquisição da segunda passada para cá e as outras frentes inteiras. Gravar ainda pede sua aprovação na Revisão.
                            </p>
                            {sameFileRuns.length > 0 && (
                                <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12.5px] text-amber-900">
                                    <b>Esse arquivo já foi gravado</b>
                                    <span>
                                        {sameFileRuns.map((run) => `${new Date(run.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${run.applied.toLocaleString('pt-BR')} disparos${run.createdBy ? '' : ' por agente ou script'}`).join('  |  ')}
                                    </span>
                                    <span className="text-amber-800">O que já entrou aparece como "Já na base".</span>
                                    {onOpenHistory && <button type="button" onClick={onOpenHistory} className="ml-auto font-semibold text-amber-900 underline-offset-2 hover:underline">Ver no histórico</button>}
                                </div>
                            )}
                            {mappingUnavailable && (
                                <p role="status" className="border-b border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-800">
                                    Mapeamento de campanhas indisponível agora. Dá para revisar disparo a disparo na próxima etapa.
                                </p>
                            )}
                            <div>
                                <ImportCampaignTree
                                    campaigns={treeCampaigns}
                                    selected={selectedKeys}
                                    focusedCampaign={reviewCampaign}
                                    focusedJourney={reviewJourney}
                                    onFocus={(front, campaign, journey, period) => {
                                        setPreviousFocus({ front: reviewFront, campaign: reviewCampaign, journey: reviewJourney });
                                        setReviewFront(front); setReviewCampaign(campaign); setReviewJourney(journey);
                                        if (period) { setReviewStartDate(period.from); setReviewEndDate(period.to); }
                                        setReviewCollection('all');
                                        setReviewCollision(''); setReviewPage(1);
                                        setStep('revisao');
                                    }}
                                    onScopeSelection={(rows, period, checked) => {
                                        setSelectedKeys((current) => replaceImportScopeSelection(current, rows, period, checked));
                                        setReviewPage(1);
                                    }}
                                    onSelection={(keys, action) => setSelectedKeys((current) => {
                                        const next = action === 'only' ? new Set<string>() : new Set(current);
                                        for (const key of keys) {
                                            if (action === 'remove') next.delete(key);
                                            else next.add(key);
                                        }
                                        return next;
                                    })}
                                />
                            </div>
                        </section>

                        <aside aria-label="Resumo do escopo" className="flex min-w-[300px] flex-[1_1_340px] flex-col gap-3.5">
                            <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3.5">
                                <div className="text-xs text-slate-600">Vai para a revisão</div>
                                <div className="text-[30px] font-bold tabular-nums">
                                    {scopeTotal.toLocaleString('pt-BR')} <span className="text-[13px] font-normal text-slate-600">de {(fileComposition[0]?.count ?? 0).toLocaleString('pt-BR')} que dá para gravar</span>
                                </div>
                                {scopeTotal > 0 && (
                                    <>
                                        <div className="mt-2 flex h-2 overflow-hidden rounded-[3px]" role="img" aria-label={`${scopeDomain.aquisicao} de Aquisição e ${scopeDomain.rentabilizacao} de Rentabilização`}>
                                            <span className="bg-cyan-700" style={{ width: `${(scopeDomain.aquisicao / scopeTotal) * 100}%` }} />
                                            <span className="bg-[#67c6d2]" style={{ width: `${(scopeDomain.rentabilizacao / scopeTotal) * 100}%` }} />
                                        </div>
                                        <div className="mt-1.5 flex justify-between text-[12.5px] tabular-nums text-slate-700">
                                            <span>Aquisição <b>{scopeDomain.aquisicao.toLocaleString('pt-BR')}</b></span>
                                            <span>Rentabilização <b>{scopeDomain.rentabilizacao.toLocaleString('pt-BR')}</b></span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-3.5 text-[12.5px]">
                                <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">No arquivo</div>
                                <div className="flex justify-between"><span className="text-slate-600">Período</span><b>{filePeriod}</b></div>
                                <div className="flex justify-between"><span className="text-slate-600">Linhas lidas</span><b className="tabular-nums">{fileMeta.rows.toLocaleString('pt-BR')}</b></div>
                                <div className="flex justify-between"><span className="text-slate-600">Jornadas</span><b className="tabular-nums">{result.insights.uniqueJourneys.toLocaleString('pt-BR')}</b></div>
                                <div className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">O que dá para gravar</div>
                                <div className="flex h-2 overflow-hidden rounded-[3px] bg-slate-100" role="img" aria-label={fileComposition.map((part) => `${part.label} ${part.count}`).join(', ')}>
                                    {fileComposition.map((part) => part.count > 0 && (
                                        <span key={part.key} className={part.bar} style={{ width: `${(part.count / Math.max(candidates.length, 1)) * 100}%` }} />
                                    ))}
                                </div>
                                {fileComposition.map((part) => (
                                    <div key={part.key} className="flex items-center justify-between gap-2" title={part.hint}>
                                        <span className="flex items-center gap-2 text-slate-600"><span className={`h-2 w-2 rounded-[2px] ${part.bar}`} />{part.label}</span>
                                        <b className="tabular-nums">{part.count.toLocaleString('pt-BR')}</b>
                                    </div>
                                ))}
                                <div className="mt-1 text-xs text-slate-600">
                                    Origem pela taxonomia: {Object.entries(result.insights.originCounts).map(([origin, count]) => `${origin === 'Sem origem' ? 'não identificada' : origin} ${Number(count).toLocaleString('pt-BR')}`).join(' · ')}
                                </div>
                            </div>
                        </aside>
                    </div>
                    <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-6 py-2.5">
                        <span className="text-[13px]"><b className="tabular-nums">{scopeTotal.toLocaleString('pt-BR')}</b> disparos selecionados</span>
                        <span className="text-[12.5px] text-slate-600">os outros {(candidates.length - scopeTotal).toLocaleString('pt-BR')} do arquivo não são tocados</span>
                        <span className="flex-1" />
                        <button type="button" onClick={() => setStep('arquivo')} className="h-[34px] rounded-sm border border-slate-300 bg-white px-3 text-[13px] text-slate-800 hover:border-slate-400">Voltar</button>
                        <button
                            type="button"
                            onClick={goToReview}
                            disabled={scopeTotal === 0}
                            className="h-[34px] rounded-sm border border-cyan-700 bg-cyan-700 px-4 text-[13px] font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                        >
                            Revisar {scopeTotal.toLocaleString('pt-BR')} disparos
                        </button>
                    </footer>
                </div>
            )}

            {step === 'recibo' && saveMessage && (
                <div className="flex flex-1 justify-center p-6">
                    <section aria-label="Recibo" className="w-full max-w-3xl self-start rounded-[14px] border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2.5">
                            {saveMessage.type === 'success'
                                ? <CheckCircle size={22} className="text-emerald-600" aria-hidden="true" />
                                : <AlertCircle size={22} className="text-red-600" aria-hidden="true" />}
                            <h2 className="text-[17px] font-bold">{saveMessage.type === 'success' ? 'Atualização gravada' : 'A gravação falhou'}</h2>
                        </div>
                        <p className="mt-1 text-[13px] text-slate-600">{saveMessage.text}</p>
                        {saveMessage.type === 'success' && (
                            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-[#eef2f6] md:grid-cols-4">
                                {[
                                    ['Gravados', saveMessage.applied ?? 0],
                                    ['Aquisição', saveMessage.acquisition ?? 0],
                                    ['Rentabilização', saveMessage.rentabilizacao ?? 0],
                                    ['Ficaram de fora', saveMessage.blocked ?? 0],
                                ].map(([label, value]) => (
                                    <div key={label as string} className="border-r border-[#eef2f6] px-3.5 py-2.5 last:border-r-0">
                                        <div className="text-xs text-slate-600">{label}</div>
                                        <div className="text-[22px] font-bold tabular-nums">{Number(value).toLocaleString('pt-BR')}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {onOpenHistory && saveMessage.type === 'success' && (
                                <button type="button" onClick={onOpenHistory} className="h-[34px] rounded-sm border border-cyan-700 bg-cyan-700 px-4 text-[13px] font-bold text-white hover:bg-cyan-800">Ver no histórico</button>
                            )}
                            {saveMessage.type === 'error' && (
                                <button type="button" onClick={() => setStep('revisao')} className="h-[34px] rounded-sm border border-cyan-700 bg-cyan-700 px-4 text-[13px] font-bold text-white hover:bg-cyan-800">Voltar à revisão</button>
                            )}
                            <button type="button" onClick={startOver} className="h-[34px] rounded-sm border border-slate-300 bg-white px-3 text-[13px] text-slate-800 hover:border-slate-400">Atualizar outro arquivo</button>
                        </div>
                    </section>
                </div>
            )}

            {step === 'revisao' && result && fileMeta && (
                <div className="flex flex-1 flex-col">
                    <div className="flex w-full flex-1 flex-col bg-white">
                        <section aria-label="Resumo do escopo" className="grid grid-cols-2 border-b border-slate-200 bg-white md:grid-cols-3 xl:grid-cols-6">
                            <div className="border-r border-[#eef2f6] px-5 py-3">
                                <div className="text-xs text-slate-600">Disparos no escopo</div>
                                <div className="text-[26px] font-bold tabular-nums">{scopeTotal.toLocaleString('pt-BR')}</div>
                                <div className="text-[11.5px] text-slate-600">de {candidates.length.toLocaleString('pt-BR')} no arquivo</div>
                            </div>
                            <div className="border-r border-[#eef2f6] px-5 py-3">
                                <div className="text-xs text-slate-600">Novos</div>
                                <div className="text-[26px] font-bold tabular-nums">{scopeNew.toLocaleString('pt-BR')}</div>
                                <div className="text-[11.5px] text-slate-600">viram linha nova</div>
                            </div>
                            <div className="border-r border-[#eef2f6] px-5 py-3">
                                <div className="text-xs text-slate-600">Atualizações</div>
                                <div className="text-[26px] font-bold tabular-nums">{scopeUpdates.toLocaleString('pt-BR')}</div>
                                <div className="text-[11.5px] text-slate-600">métrica mudou</div>
                            </div>
                            <div className={`border-r border-[#eef2f6] px-5 py-3 ${needsYou > 0 ? 'bg-amber-50' : ''}`}>
                                <div className={`text-xs ${needsYou > 0 ? 'font-semibold text-amber-700' : 'text-slate-600'}`}>Precisa de você</div>
                                <div className={`text-[26px] font-bold tabular-nums ${needsYou > 0 ? 'text-amber-800' : ''}`}>{needsYou.toLocaleString('pt-BR')}</div>
                                <div className={`text-[11.5px] ${needsYou > 0 ? 'text-amber-800' : 'text-slate-600'}`}>{needsYou > 0 ? 'no escopo, ainda sem aprovação' : 'tudo aprovado no escopo'}</div>
                            </div>
                            <div className="border-r border-[#eef2f6] px-5 py-3">
                                <div className="text-xs text-slate-600">Confiança média</div>
                                <div className="text-[26px] font-bold tabular-nums">{scopeConfidence === null ? 'sem dado' : `${scopeConfidence}%`}</div>
                                <div className="relative mt-1 h-1 rounded bg-[#eef2f6]" aria-hidden="true">
                                    <span className="absolute left-0 top-0 h-1 rounded bg-cyan-700" style={{ width: `${scopeConfidence ?? 0}%` }} />
                                    <span className="absolute -top-[3px] left-[90%] h-2.5 w-0.5 bg-slate-900" />
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-slate-600">aprovação em massa a partir de 90%</div>
                            </div>
                            <div className="px-5 py-3">
                                <div className="text-xs text-slate-600">Destino</div>
                                <div className="mt-1 text-[13px] tabular-nums">Aquisição <b>{scopeDomain.aquisicao.toLocaleString('pt-BR')}</b></div>
                                <div className="text-[13px] tabular-nums">Rentabilização <b>{scopeDomain.rentabilizacao.toLocaleString('pt-BR')}</b></div>
                            </div>
                        </section>

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
                                    Aprovar alta confiança (90% ou mais)
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
                                    Voltar ao escopo
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
                                    Gravar {uploadCandidates.length.toLocaleString('pt-BR')} disparos
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
                                    Confirmar gravação
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
                                {saving ? 'Gravando...' : `Gravar ${uploadCandidates.length.toLocaleString('pt-BR')} disparos`}
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
