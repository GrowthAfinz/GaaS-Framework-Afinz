import type { Activity } from '../types/framework';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { classifyRentabilizacao } from './rentabilizacaoClassify';
import { hasAquisicaoJourneyPrefix, parseCanonicalAcquisitionJourney, acquisitionJourneyIdentity, inferCartAudience, isStandardOptOutResponse } from './intelligentImportRouting';
import { parseSeqParts, resolveDim, canonicalPlurixCartJourney, PLURIX_CART_ASSISTED_JOURNEY } from './taxonomy';
export type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'ECRED-API' | 'Indefinido';

export type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';

export type CandidateFilter = 'new_dispatch' | 'update_dispatch' | 'ignore';

export type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';

export type UpdateDomain = 'aquisicao' | 'rentabilizacao';

export type UpdateFlow = 'total_crm' | UpdateDomain;

export type TextReviewField = 'bu' | 'parceiro' | 'segmento' | 'subgrupo' | 'etapaAquisicao' | 'perfilCredito' | 'produto' | 'oferta' | 'promocional';

export type NumericReviewField = 'ordemDisparo';

export type ReviewField = TextReviewField | NumericReviewField;

export type SuggestionField = Exclude<ReviewField, 'ordemDisparo'>;

export type ProcessingStage = 'idle' | 'reading' | 'indexing' | 'detecting' | 'reviewing';

export type ReviewMode = 'operation' | 'dimensions' | 'metrics';

export type ReviewSortKey = 'date_asc' | 'date_desc' | 'action' | 'confidence_asc' | 'confidence_desc' | 'moment' | 'sent' | 'cards';

export type SuggestionStat = { count: number; lastUsed?: string };

export type SuggestionBucket = Map<SuggestionField, Map<string, SuggestionStat>>;

export interface HistoryIndex {
    existingKeys: Map<string, Activity[]>;
    byDispatchSignature: Map<string, Activity[]>;
    byJourneyChannel: Map<string, SuggestionBucket>;
    byJourney: Map<string, SuggestionBucket>;
    byActivity: Map<string, SuggestionBucket>;
    bySegmentChannel: Map<string, SuggestionBucket>;
    byToken: Map<string, SuggestionBucket>;
    global: SuggestionBucket;
    knownJourneys: Set<string>;
    activityCount: number;
}

export interface BlockSummary {
    key: SourceBlock;
    label: string;
    detected: boolean;
    rows: number;
}

export interface FieldSuggestion {
    value: string;
    confidence: number;
    source: string;
    count: number;
    lastUsed?: string;
    evidence?: string;
    deterministic?: boolean;
    historicalConflict?: string;
}

export interface ManualOverride {
    field: ReviewField;
    previousValue: string | number | undefined;
    nextValue: string | number | undefined;
    mode: 'single' | 'bulk';
    changedAt: string;
}

export interface ProcessInsights {
    rawRows: number;
    validMetricRows: number;
    uniqueJourneys: number;
    uniqueActivities: number;
    actionableDispatches: number;
    existingDispatches: number;
    newDispatches: number;
    classificationConflicts: number;
    orphanPerformanceRows: number;
    invalidVolumeRows: number;
    originCounts: Record<string, number>;
}

export interface MetricRow {
    domain: UpdateDomain;
    key: string;
    sourceBlock: SourceBlock;
    sourceBlocks: SourceBlock[];
    journey: string;
    activityName: string;
    date: string;
    channel: Channel;
    sent?: number;
    delivered?: number;
    opens?: number;
    clicks?: number;
    proposals?: number;
    approved?: number;
    finalized?: number;
    assisted?: number;
    independent?: number;
    dispatchSignature: string;
}

export interface UpdateCandidate extends MetricRow {
    status: CandidateStatus;
    matchCount: number;
    fieldToReview: string;
    suggestion: string;
    confidence: number;
    confidenceBreakdown?: Partial<Record<SuggestionField, number>>;
    basis: string;
    accepted: boolean;
    bu: string;
    parceiro: string;
    segmento: string;
    subgrupo: string;
    etapaAquisicao: string;
    perfilCredito: string;
    produto: string;
    oferta: string;
    promocional: string;
    ordemDisparo?: number;
    suggestions: Partial<Record<SuggestionField, FieldSuggestion[]>>;
    conflictJourneys?: string[];
    conflictReason?: string;
    matchedActivity?: Activity;
    metricRefresh?: boolean;
    canonicalDimensionRefresh?: boolean;
    canonicalDimensionFields?: string[];
    auditRequired?: boolean;
    manualOverrides?: ManualOverride[];
}

export const BLOCKED_UPLOAD_STATUSES: CandidateStatus[] = ['duplicate', 'error', 'ignored', 'conflict'];

export const canUploadCandidate = (candidate: Pick<UpdateCandidate, 'status'>) =>
    !BLOCKED_UPLOAD_STATUSES.includes(candidate.status);

export const candidateAction = (candidate: UpdateCandidate): 'atualizar' | 'novo' | 'ignorar' => {
    if (!canUploadCandidate(candidate)) return 'ignorar';
    return candidate.metricRefresh || candidate.matchedActivity ? 'atualizar' : 'novo';
};

export function matchesReviewCollection(
    candidate: Pick<UpdateCandidate, 'key' | 'status' | 'metricRefresh' | 'matchedActivity'>,
    selectedKeys: ReadonlySet<string>,
    collection: 'selected' | 'all' | 'status',
    status: CandidateFilter,
) {
    if (collection === 'selected') return selectedKeys.has(candidate.key);
    return collection === 'all' || candidateFilterKey(candidate as UpdateCandidate) === status;
}

export const candidateFilterKey = (candidate: UpdateCandidate): CandidateFilter => {
    const action = candidateAction(candidate);
    if (action === 'atualizar') return 'update_dispatch';
    if (action === 'novo') return 'new_dispatch';
    return 'ignore';
};

export const ACTION_SORT_ORDER: Record<ReturnType<typeof candidateAction>, number> = {
    atualizar: 0,
    novo: 1,
    ignorar: 2,
};

export const REVIEW_SORT_OPTIONS: Record<ReviewMode, Array<{ key: ReviewSortKey; label: string }>> = {
    operation: [],
    dimensions: [
        { key: 'moment', label: 'Momento' },
        { key: 'date_desc', label: 'Mais recentes' },
        { key: 'confidence_desc', label: 'Confiança' },
    ],
    metrics: [
        { key: 'sent', label: 'Mais envios' },
        { key: 'cards', label: 'Mais cartões' },
        { key: 'date_desc', label: 'Mais recentes' },
    ],
};

export interface ProcessResult {
    domain: UpdateFlow;
    blocks: BlockSummary[];
    metrics: MetricRow[];
    candidates: UpdateCandidate[];
    ignoredExisting: number;
    importedRows: number;
    tsv: string;
    warnings: string[];
    insights: ProcessInsights;
}

export interface FileMeta {
    name: string;
    rows: number;
    type: string;
}

export interface ParseDebugInfo {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    stage?: string;
    matrixRows?: number;
    firstRowColumns?: number;
    message: string;
    stack?: string;
}

export interface SaveReceipt {
    type: 'success' | 'error';
    text: string;
    runId?: string;
    audited?: number;
    applied?: number;
    acquisition?: number;
    rentabilizacao?: number;
    blocked?: number;
}

export const buildProcessInsights = (
    rawRows: MetricRow[],
    metrics: MetricRow[],
    candidates: UpdateCandidate[],
    existingDispatches: number,
    orphanPerformanceRows = 0,
    invalidVolumeRows = 0
): ProcessInsights => {
    const originCounts: Record<string, number> = { Institucional: 0, 'Serasa/Ecred': 0, Proprietaria: 0, 'Sem origem': 0 };
    metrics.forEach((metric) => {
        const deterministic = inferDeterministicDimensions(metric);
        const evidence = normalizeKey(deterministic.evidence);
        if (['serasa', 'ecred', 'srs', 'srsa', 'parceiroserasa'].includes(evidence)) originCounts['Serasa/Ecred'] += 1;
        else if (['institucional', 'inst'].includes(evidence)) originCounts.Institucional += 1;
        else if (deterministic.parceiro === 'Proprietaria') originCounts.Proprietaria += 1;
        else originCounts['Sem origem'] += 1;
    });
    return {
        rawRows: rawRows.length,
        validMetricRows: metrics.length,
        uniqueJourneys: new Set(metrics.map((row) => normalizeKey(row.journey))).size,
        uniqueActivities: new Set(metrics.map((row) => normalizeKey(row.activityName))).size,
        actionableDispatches: metrics.length,
        existingDispatches,
        newDispatches: candidates.filter((candidate) => !candidate.matchedActivity && !['duplicate', 'ignored', 'error'].includes(candidate.status)).length,
        classificationConflicts: candidates.filter((candidate) => candidate.status === 'conflict'
            || Object.values(candidate.suggestions).some((items) => items?.some((item) => item.historicalConflict))).length,
        orphanPerformanceRows,
        invalidVolumeRows,
        originCounts,
    };
};

export const FRAMEWORK_HEADERS = [
    'Disparado?',
    'Jornada',
    'Activity name / Taxonomia',
    'Canal',
    'Data de Disparo',
    'Data Fim',
    'Safra',
    'BU',
    'Parceiro',
    'SIGLA',
    'Segmento',
    'SIGLA',
    'Subgrupos',
    'Base Total',
    'Base Acionavel',
    '% Otimizacao de base',
    'Etapa de aquisicao',
    'Ordem de disparo',
    'Perfil de Credito',
    'Produto',
    'Oferta',
    'Promocional',
    'SIGLA',
    'Oferta 2',
    'Promocional 2',
    'Custo Unitario Oferta',
    'Custo Total da Oferta',
    'Custo unitario do canal',
    'Custo total canal',
    'Taxa de Entrega',
    'Abertura',
    'Taxa de Abertura',
    'Cliques',
    'Taxa de Clique',
    'Taxa de Proposta',
    'Taxa de Aprovacao',
    'Taxa de Finalizacao',
    'Taxa de Conversao',
    'Custo Total Campanha',
    'CAC',
    'Cartoes Gerados',
    'Aprovados',
    'Propostas',
    'Emissoes Independentes',
    'Emissoes Assistidas',
];

export const STATUS_LABEL: Record<CandidateStatus, string> = {
    ready: 'Novo pronto',
    review: 'Revisar',
    new: 'Sem historico',
    duplicate: 'Ja existe',
    conflict: 'Conflito',
    error: 'Erro',
    ignored: 'Sem volume',
};

export const STATUS_CLASS: Record<CandidateStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
    conflict: 'bg-orange-50 text-orange-700 border-orange-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    ignored: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const UPDATE_STATUS_CLASS = 'bg-cyan-50 text-cyan-700 border-cyan-200';

export const candidateStatusLabel = (candidate: UpdateCandidate) =>
    candidate.metricRefresh ? 'Atualizar metricas' : STATUS_LABEL[candidate.status];

export const REVIEW_FIELDS: Array<{ key: ReviewField; label: string; type?: 'number' }> = [
    { key: 'bu', label: 'BU' },
    { key: 'parceiro', label: 'Parceiro' },
    { key: 'segmento', label: 'Segmento' },
    { key: 'subgrupo', label: 'Subgrupo' },
    { key: 'etapaAquisicao', label: 'Etapa' },
    { key: 'perfilCredito', label: 'Perfil' },
    { key: 'produto', label: 'Produto' },
    { key: 'oferta', label: 'Oferta' },
    { key: 'promocional', label: 'Promocional' },
    { key: 'ordemDisparo', label: 'Ordem', type: 'number' },
];

export const SUGGESTION_FIELDS: SuggestionField[] = [
    'bu',
    'parceiro',
    'segmento',
    'subgrupo',
    'etapaAquisicao',
    'perfilCredito',
    'produto',
    'oferta',
    'promocional',
];

export const CONFIDENCE_WEIGHTS: Record<SuggestionField, number> = {
    bu: 15,
    parceiro: 20,
    segmento: 20,
    etapaAquisicao: 20,
    produto: 10,
    subgrupo: 4,
    perfilCredito: 4,
    oferta: 4,
    promocional: 3,
};

export const BLOCKING_CONFIDENCE_FIELDS: SuggestionField[] = ['bu', 'parceiro', 'segmento', 'etapaAquisicao'];

export const BULK_APPROVAL_CONFIDENCE = 90;

export const REVIEW_PAGE_SIZE = 100;

export const PROCESSING_STAGE_LABEL: Record<ProcessingStage, string> = {
    idle: 'Aguardando arquivo',
    reading: 'Lendo arquivo',
    indexing: 'Organizando historico',
    detecting: 'Detectando novidades',
    reviewing: 'Preparando revisao',
};

export const DOMAIN_LABEL: Record<UpdateDomain, string> = {
    aquisicao: 'Aquisição',
    rentabilizacao: 'Rentabilização',
};

export const FLOW_LABEL: Record<UpdateFlow, string> = {
    total_crm: 'Total CRM',
    aquisicao: DOMAIN_LABEL.aquisicao,
    rentabilizacao: DOMAIN_LABEL.rentabilizacao,
};

export const DOMAIN_TARGET_TABLE: Record<UpdateDomain, string> = {
    aquisicao: 'activities',
    rentabilizacao: 'rentabilizacao_activities',
};

export const FLOW_TARGET_LABEL: Record<UpdateFlow, string> = {
    total_crm: 'roteamento automatico',
    aquisicao: DOMAIN_TARGET_TABLE.aquisicao,
    rentabilizacao: DOMAIN_TARGET_TABLE.rentabilizacao,
};

// Cache das normalizações: as mesmas jornadas e activities são normalizadas milhares de
// vezes por arquivo. A saída é pura em relação ao texto de entrada, então o cache não muda regra.
const NORMALIZE_CACHE_LIMIT = 200_000;
const normalizeCache = new Map<string, string>();
const normalizeKeyCache = new Map<string, string>();
const remember = (cache: Map<string, string>, key: string, value: string) => {
    if (cache.size >= NORMALIZE_CACHE_LIMIT) cache.clear();
    cache.set(key, value);
    return value;
};

export const normalize = (value: unknown) => {
    const text = String(value ?? '');
    const cached = normalizeCache.get(text);
    if (cached !== undefined) return cached;
    return remember(normalizeCache, text, text
        .replace(/ATIVA�+O/gi, 'ATIVACAO')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase());
};

export const normalizeKey = (value: unknown) => {
    const text = String(value ?? '');
    const cached = normalizeKeyCache.get(text);
    if (cached !== undefined) return cached;
    return remember(normalizeKeyCache, text, normalize(text).replace(/\s+/g, ' '));
};

export const parseNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;

    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const toDateKey = (value: unknown): string => {
    if (!value) return '';
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === 'number' && value > 20000) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
            return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
    }

    const raw = String(value).trim();
    const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (br) {
        const day = br[1].padStart(2, '0');
        const month = br[2].padStart(2, '0');
        const year = br[3].length === 2 ? `20${br[3]}` : br[3];
        return `${year}-${month}-${day}`;
    }

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    if (!/[/-]/.test(raw)) return '';

    const parsed = new Date(raw);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : '';
};

export const formatDateBR = (dateKey: string) => {
    if (!dateKey) return '';
    const [year, month, day] = dateKey.split('-');
    return `${day}/${month}/${year}`;
};

export const generateSafra = (dateKey: string) => {
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const date = new Date(`${dateKey}T12:00:00`);
    if (!Number.isFinite(date.getTime())) return '';
    return `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;
};

export const normalizeChannel = (value: unknown): Channel => {
    const text = normalize(value);
    if (text.includes('ecred')) return 'ECRED-API';
    if (text.includes('whatsapp') || text.includes('wpp')) return 'WhatsApp';
    if (text.includes('mail') || text === 'email') return 'E-mail';
    if (text.includes('sms')) return 'SMS';
    if (text.includes('push')) return 'Push';
    return 'Indefinido';
};

export const taxonomyTokens = (value: unknown) =>
    normalizeKey(value)
        .split(/[_\s-]+/)
        .filter(Boolean);

export const normalizedOriginTokens = (value: unknown) =>
    taxonomyTokens(value).flatMap((token) => {
        const cadenceMatch = token.match(/^d\d+(.*)$/);
        return cadenceMatch?.[1] ? [token, cadenceMatch[1]] : [token];
    });

export const inferOrdemDisparo = (activityName: unknown): number | undefined => {
    const parsed = parseSeqParts(String(activityName ?? ''));
    return parsed?.dispatch;
};

export const hasAbandonedCartSignal = (journey: unknown, activityName: unknown) => {
    const journeyText = normalizeKey(journey);
    const activityText = normalizeKey(activityName);
    return journeyText.includes('carrinho')
        || journeyText.includes('abandonado')
        || activityText.includes('carrinhoabandonado')
        || /(^|_)car_d\d/.test(activityText);
};

export const canonicalAcquisitionJourney = (journey: unknown, activityName: unknown) => {
    const plurixCanonical = canonicalPlurixCartJourney(journey, activityName);
    if (!hasAbandonedCartSignal(plurixCanonical, activityName)) return plurixCanonical;
    return String(plurixCanonical).replace(/CARRINHO_AQUISICAO/gi, 'CARRINHO_REATIVACAO');
};

export const inferDeterministicDimensions = (metric: Pick<MetricRow, 'journey' | 'activityName'>) => {
    const activityTokens = normalizedOriginTokens(metric.activityName);
    const journeyTokens = normalizedOriginTokens(metric.journey);
    const canonicalJourney = parseCanonicalAcquisitionJourney(metric.journey);
    const isAbandonedCart = canonicalJourney.segmento
        ? canonicalJourney.segmento === 'Abandonados'
        : hasAbandonedCartSignal(metric.journey, metric.activityName);
    const findOrigin = (tokens: string[]) => {
        if (tokens.some((token) => ['bb', 'bbt'].includes(token))
            || tokens.includes('bem') && tokens.includes('barato')
            || tokens.includes('b2b2c') && tokens.includes('bb')) {
            return { parceiro: 'Bem Barato', evidence: tokens.find((token) => ['bb', 'bbt'].includes(token)) ?? 'bem_barato' };
        }
        if (tokens.some((token) => ['serasa', 'ecred', 'srs', 'srsa', 'parceiroserasa'].includes(token))) {
            return { parceiro: 'Serasa', evidence: tokens.find((token) => ['serasa', 'ecred', 'srs', 'srsa', 'parceiroserasa'].includes(token))! };
        }
        if (tokens.some((token) => ['institucional', 'inst'].includes(token))) {
            return { parceiro: 'Proprietaria', evidence: tokens.find((token) => ['institucional', 'inst'].includes(token))! };
        }
        if (tokens.some((token) => ['bp', 'bsp'].includes(token))
            || /base[_\s-]+propri(a|etaria)/.test(normalizeKey(tokens.join(' ')))) {
            return { parceiro: 'Proprietaria', evidence: tokens.find((token) => ['bp', 'bsp'].includes(token)) ?? 'base_propria' };
        }
        // DIA is the B2B2C partner, not an acquisition segment. Without this
        // deterministic rule the generic segment-code parser interprets the
        // `dia` token as Segmento=Dia and loses Parceiro=Dia.
        if (tokens.includes('dia')) {
            return { parceiro: 'Dia', evidence: 'dia' };
        }
        return null;
    };

    const activityOrigin = findOrigin(activityTokens);
    const journeyOrigin = activityOrigin ? null : findOrigin(journeyTokens);
    const origin = activityOrigin ?? journeyOrigin;
    // Dimensão "variante de criativo" (institucional/ecred/int/maior/menor) do
    // taxonomy.ts, exposta aqui como campo próprio — antes só entrava indiretamente
    // como sinal de parceiro (institucional/inst -> Proprietaria), sem virar
    // informação visível por si só (ex.: Carrinho Abandonado Copa B2C manda
    // institucional E ecred no mesmo disparo; isso hoje é achatado em "Proprietaria"
    // pra ambos, perdendo a distinção de qual peça é qual).
    const variante = resolveDim('variante', activityTokens.join('_'))
        ?? resolveDim('variante', journeyTokens.join('_'))
        ?? undefined;
    return {
        bu: canonicalJourney.bu,
        parceiro: canonicalJourney.parceiro ?? origin?.parceiro,
        segmento: isAbandonedCart ? 'Abandonados' : canonicalJourney.segmento,
        etapaAquisicao: isAbandonedCart ? 'Reativacao' : canonicalJourney.etapaAquisicao,
        subgrupo: inferCartAudience(metric.journey, metric.activityName).subgrupo,
        source: canonicalJourney.source ?? (activityOrigin ? 'token determinístico da activity' : journeyOrigin ? 'token determinístico da jornada' : undefined),
        evidence: canonicalJourney.evidence ?? origin?.evidence ?? (isAbandonedCart ? 'carrinho_abandonado' : undefined),
        variante,
    };
};

export const SEGMENT_VOCAB: Record<string, string> = {
    carrinho: 'Abandonados',
    abandonado: 'Abandonados',
    abandonados: 'Abandonados',
    abd: 'Abandonados',
    car: 'Abandonados',
    ngd: 'Negados',
    repescagem: 'Negados',
    anc: 'Aprovados_nao_convertidos',
    upgrade: 'Aprovados_nao_convertidos',
    lp: 'Leads_Parceiros',
    leads: 'Leads_Parceiros',
    bp: 'Base_Proprietaria',
    bsp: 'Base_Proprietaria',
    crm: 'CRM',
    topo: 'CRM',
    recencia: 'Recencia_de_Compra',
    cartonistas: 'Cartonistas',
    cart: 'Cartonistas',
    // Produtos/campanhas institucionais B2C — no histórico GaaS mapeiam 100%
    // para Base_Proprietaria (que é o papel de topo-de-funil/institucional do
    // B2C, equivalente ao CRM dos parceiros B2B2C/Plurix). Só aparecem em
    // jornadas B2C legadas; jornadas GaaS estruturadas usam bp/bsp, então isto
    // não colide. Elevou a acurácia de inferência de 87,4% -> 96,9% sem regressão.
    classic: 'Base_Proprietaria',
    platinum: 'Base_Proprietaria',
    cooke: 'Base_Proprietaria',
    livre: 'Base_Proprietaria',
    pago: 'Base_Proprietaria',
    institucional: 'Base_Proprietaria',
    tudao: 'Base_Proprietaria',
    friday: 'Base_Proprietaria',
    pa: 'Base_Proprietaria',
};

export const PARTNER_VALUE_GUARD = new Set<string>([
    'Bem Barato', 'Dia', 'Serasa', 'Proprietaria', 'BpC',
    'Bom Pra Credito', 'Mais Amigo', 'Sem Parar', 'Pos Tombamento',
]);

export const isPartnerValue = (value: string | null | undefined) =>
    !!value && PARTNER_VALUE_GUARD.has(value);

export const inferSegmentFromTaxonomy = (value: unknown) => {
    const tokens = taxonomyTokens(value);
    for (const token of tokens) {
        const segment = SEGMENT_VOCAB[token];
        if (segment) return segment;
    }
    return '';
};

export const canonicalChannel = (channel: Channel | string) => {
    const normalized = normalizeChannel(channel);
    return normalized === 'Indefinido' ? String(channel ?? '') : normalized;
};

export const canonicalActivityJourney = (activity: Activity) => {
    const activityName = activity.raw?.['Activity name / Taxonomia'] || activity.id;
    return canonicalAcquisitionJourney(activity.jornada, activityName);
};

export const buildNoveltyKey = (journey: unknown, activityName: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(journey)}|${normalizeKey(activityName)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

export const buildJourneyDayKey = (journey: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(journey)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

export const buildDispatchSignature = (activityName: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(activityName)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

export const isSameJourneyFamily = (currentJourney: unknown, otherJourney: unknown) => {
    const current = acquisitionJourneyIdentity(currentJourney);
    const other = acquisitionJourneyIdentity(otherJourney);
    return current === other;
};

export const journeySimilarity = (currentJourney: unknown, otherJourney: unknown) => {
    const currentTokens = new Set(normalizeKey(currentJourney).split(/\s+/).filter(Boolean));
    const otherTokens = new Set(normalizeKey(otherJourney).split(/\s+/).filter(Boolean));
    if (currentTokens.size === 0 || otherTokens.size === 0) return 0;
    let intersection = 0;
    currentTokens.forEach((token) => {
        if (otherTokens.has(token)) intersection += 1;
    });
    return intersection / Math.max(currentTokens.size, otherTokens.size);
};

export const RENAMED_JOURNEY_SIMILARITY_THRESHOLD = 0.7;

export const parseClipboardMatrix = (text: string): string[][] => {
    const cleanText = text.replace(/\r/g, '').trim();
    if (!cleanText) return [];

    if (cleanText.includes('\t')) {
        return cleanText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split('\t').map((cell) => cell.trim()));
    }

    const firstLine = cleanText.split('\n')[0] ?? '';
    const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
        ? ';'
        : undefined;

    const parsed = Papa.parse<string[]>(cleanText, {
        delimiter,
        skipEmptyLines: true,
    });
    if (parsed.errors.length > 0 || !Array.isArray(parsed.data)) {
        return cleanText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split(';').map((cell) => cell.trim()));
    }

    return parsed.data
        .filter((row): row is string[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? '').trim()));
};

export const findCell = (matrix: string[][], terms: string[]) => {
    const wanted = terms.map(normalizeKey);
    for (let row = 0; row < Math.min(matrix.length, 12); row += 1) {
        for (let col = 0; col < (matrix[row]?.length ?? 0); col += 1) {
            const cell = normalizeKey(matrix[row][col]);
            if (wanted.includes(cell)) return { row, col };
        }
    }
    return null;
};

export const getCell = (matrix: string[][], row: number, col: number) => matrix[row]?.[col] ?? '';

export const looksLikeDate = (value: string) => Boolean(toDateKey(value));

export const looksLikeActivityName = (value: string) => {
    const text = normalizeKey(value);
    return text.includes('_') || text.includes('afz') || text.includes('plu') || text.includes('jor_');
};

export const mergeMetric = (map: Map<string, MetricRow>, row: MetricRow) => {
    const existing = map.get(row.key);
    if (!existing) {
        map.set(row.key, row);
        return;
    }

    map.set(row.key, {
        ...existing,
        sourceBlocks: Array.from(new Set([...(existing.sourceBlocks ?? [existing.sourceBlock]), row.sourceBlock])),
        sourceBlock: existing.sourceBlock === 'performance' ? row.sourceBlock : existing.sourceBlock,
        dispatchSignature: existing.dispatchSignature || row.dispatchSignature,
        activityName: existing.activityName || row.activityName,
        sent: row.sent ?? existing.sent,
        delivered: row.delivered ?? existing.delivered,
        opens: row.opens ?? existing.opens,
        clicks: row.clicks ?? existing.clicks,
        proposals: row.proposals ?? existing.proposals,
        approved: row.approved ?? existing.approved,
        finalized: row.finalized ?? existing.finalized,
        assisted: row.assisted ?? existing.assisted,
        independent: row.independent ?? existing.independent,
    });
};

export const readBlockRows = (
    matrix: string[][],
    start: { row: number; col: number } | null,
    domain: UpdateDomain,
    channel: Channel,
    sourceBlock: SourceBlock,
    offsets: {
        journey: number;
        activity: number;
        date: number;
        sent?: number;
        delivered?: number;
        opens?: number;
        clicks?: number;
        proposals?: number;
        approved?: number;
        finalized?: number;
        assisted?: number;
        independent?: number;
        channel?: number;
    },
    mappedJourneys?: ReadonlySet<string>
) => {
    if (!start) return [];
    const rows: MetricRow[] = [];

    for (let row = start.row + 1; row < matrix.length; row += 1) {
        const rawJourney = getCell(matrix, row, start.col + offsets.journey);
        const activityName = getCell(matrix, row, start.col + offsets.activity);
        const explicitlyMapped = mappedJourneys?.has(normalizeKey(rawJourney));
        const journey = explicitlyMapped ? rawJourney.trim() : canonicalAcquisitionJourney(rawJourney, activityName);
        const date = toDateKey(getCell(matrix, row, start.col + offsets.date));
        const rowChannel = offsets.channel !== undefined
            ? normalizeChannel(getCell(matrix, row, start.col + offsets.channel))
            : channel;

        if (!activityName && !journey && !date) continue;
        if (!activityName || !journey || !date || rowChannel === 'Indefinido') continue;
        if ((!explicitlyMapped && !looksLikeActivityName(activityName)) || !looksLikeDate(getCell(matrix, row, start.col + offsets.date))) continue;

        const key = buildNoveltyKey(journey, activityName, rowChannel, date);
        const dispatchSignature = buildDispatchSignature(activityName, rowChannel, date);
        rows.push({
            domain,
            key,
            dispatchSignature,
            sourceBlock,
            sourceBlocks: [sourceBlock],
            journey,
            activityName,
            date,
            channel: rowChannel,
            sent: offsets.sent !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.sent)) : undefined,
            delivered: offsets.delivered !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.delivered)) : undefined,
            opens: offsets.opens !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.opens)) : undefined,
            clicks: offsets.clicks !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.clicks)) : undefined,
            proposals: offsets.proposals !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.proposals)) : undefined,
            approved: offsets.approved !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.approved)) : undefined,
            finalized: offsets.finalized !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.finalized)) : undefined,
            assisted: offsets.assisted !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.assisted)) : undefined,
            independent: offsets.independent !== undefined ? parseNumber(getCell(matrix, row, start.col + offsets.independent)) : undefined,
        });
    }

    return rows;
};

export const activityDateKey = (activity: Activity) => toDateKey(activity.dataDisparo);

export const isValidActivity = (activity: Activity | null | undefined): activity is Activity =>
    Boolean(activity && typeof activity === 'object');

export const getRaw = (activity: Activity, keys: string[]) => {
    for (const key of keys) {
        const value = activity.raw?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    return '';
};

export const activityField = (activity: Activity, field: SuggestionField) => {
    switch (field) {
        case 'bu': return activity.bu || getRaw(activity, ['BU']);
        case 'parceiro': return activity.parceiro || getRaw(activity, ['Parceiro']);
        case 'segmento': return activity.segmento || getRaw(activity, ['Segmento']);
        case 'subgrupo': return activity.subgrupo || getRaw(activity, ['Subgrupos']);
        case 'etapaAquisicao': return activity.etapaAquisicao || getRaw(activity, ['Etapa de aquisicao', 'Etapa de aquisição']);
        case 'perfilCredito': return activity.perfilCredito || getRaw(activity, ['Perfil de Credito', 'Perfil de Crédito']);
        case 'produto': return activity.produto || getRaw(activity, ['Produto']);
        case 'oferta': return activity.oferta || getRaw(activity, ['Oferta']);
        case 'promocional': return activity.promocional || getRaw(activity, ['Promocional']);
        default: return '';
    }
};

export const activityMetricValue = (activity: Activity, field: keyof MetricRow): number => {
    switch (field) {
        case 'sent': return activity.kpis?.baseEnviada ?? parseNumber(getRaw(activity, ['Base Total'])) ?? 0;
        case 'delivered': return activity.kpis?.baseEntregue ?? parseNumber(getRaw(activity, ['Base Acionavel', 'Base Acionável'])) ?? 0;
        case 'opens': return activity.kpis?.aberturas ?? parseNumber(getRaw(activity, ['Abertura'])) ?? 0;
        case 'clicks': return activity.kpis?.cliques ?? parseNumber(getRaw(activity, ['Cliques'])) ?? 0;
        case 'proposals': return activity.kpis?.propostas ?? parseNumber(getRaw(activity, ['Propostas'])) ?? 0;
        case 'approved': return activity.kpis?.aprovados ?? parseNumber(getRaw(activity, ['Aprovados'])) ?? 0;
        case 'finalized': return activity.kpis?.cartoes ?? activity.kpis?.emissoes ?? parseNumber(getRaw(activity, ['Cartoes Gerados', 'Cartões Gerados'])) ?? 0;
        case 'assisted': return activity.kpis?.emissoesAssistidas ?? parseNumber(getRaw(activity, ['Emissoes Assistidas', 'Emissões Assistidas'])) ?? 0;
        case 'independent': return activity.kpis?.emissoesIndependentes ?? parseNumber(getRaw(activity, ['Emissoes Independentes', 'Emissões Independentes'])) ?? 0;
        default: return 0;
    }
};

export const REFRESHABLE_METRIC_FIELDS: Array<keyof MetricRow> = [
    'sent',
    'delivered',
    'opens',
    'clicks',
    'proposals',
    'approved',
    'finalized',
    'assisted',
    'independent',
];

export const metricEquals = (previous: unknown, next: unknown) => {
    const a = Number(previous ?? 0);
    const b = Number(next ?? 0);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
    return Math.abs(a - b) < 0.0001;
};

export const metricRefreshDetails = (metric: MetricRow, existing?: Activity) => {
    if (!existing) return [];
    return REFRESHABLE_METRIC_FIELDS.flatMap((field) => {
        const next = metric[field];
        if (typeof next !== 'number' || !Number.isFinite(next)) return [];
        const previous = activityMetricValue(existing, field);
        return metricEquals(previous, next) ? [] : [{ field, previous, next }];
    });
};

export const RENT_REFRESH_FIELD_ALIASES: Partial<Record<keyof MetricRow, string[]>> = {
    sent: ['Base Total'],
    delivered: ['Base Acionavel'],
    opens: ['Abertura'],
    clicks: ['Cliques'],
    proposals: ['Propostas'],
    approved: ['Aprovados'],
    finalized: ['Cartoes Gerados'],
    assisted: ['Emissoes Assistidas'],
    independent: ['Emissoes Independentes'],
};

export const rawValueByNormalizedColumn = (row: Record<string, any>, aliases: string[]) => {
    const wanted = new Set(aliases.map(normalizeKey));
    const key = Object.keys(row).find((column) => wanted.has(normalizeKey(column)));
    return key ? row[key] : undefined;
};

export const rentActivityMetricValue = (row: Record<string, any>, field: keyof MetricRow) => {
    const aliases = RENT_REFRESH_FIELD_ALIASES[field];
    if (!aliases) return 0;
    return parseNumber(rawValueByNormalizedColumn(row, aliases)) ?? 0;
};

export const rentMetricRefreshDetails = (metric: MetricRow, existing?: Record<string, any>) => {
    if (!existing) return [];
    return REFRESHABLE_METRIC_FIELDS.flatMap((field) => {
        const next = metric[field];
        if (typeof next !== 'number' || !Number.isFinite(next)) return [];
        const previous = rentActivityMetricValue(existing, field);
        return metricEquals(previous, next) ? [] : [{ field, previous, next }];
    });
};

export const inferTaxonomy = (metric: MetricRow) => {
    const text = normalizeKey(`${metric.journey} ${metric.activityName}`);
    const journeyText = normalizeKey(metric.journey);
    const tokens = taxonomyTokens(`${metric.journey} ${metric.activityName}`);
    const deterministic = inferDeterministicDimensions(metric);
    const canonicalJourney = parseCanonicalAcquisitionJourney(metric.journey);
    const isNovosCopa = journeyText.includes('novos') && journeyText.includes('copa');
    const hasBasePropriaSignal = tokens.some((token) =>
        ['bp', 'bsp'].includes(token)
    ) || /base[_\s-]+propri(a|etaria)/.test(text);

    if (hasBasePropriaSignal && !canonicalJourney.bu && !canonicalJourney.parceiro) {
        return { bu: 'B2C', parceiro: 'Proprietaria', segmento: 'Base_Proprietaria' };
    }

    const segmentByCode = inferSegmentFromTaxonomy(`${metric.journey} ${metric.activityName}`);

    const bu = deterministic.bu || (text.includes('plurix') || text.includes('_plu_') || text.startsWith('plu_')
        ? 'Plurix'
        : text.includes('b2b2c') || text.includes('_bb_') || text.includes('bem barato')
            ? 'B2B2C'
            : text.includes('seguro')
                ? 'Seguros'
                : 'B2C');

    const parceiro = deterministic.parceiro || (text.includes('serasa') || text.includes('ecred') || text.includes('_srs_')
        ? 'Serasa'
        : text.includes('bem barato') || text.includes('_bb_') || text.includes('b2b2c_bb')
            ? 'Bem Barato'
            : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
                ? 'Proprietaria'
                : bu === 'Plurix'
                    ? 'N/A'
                    : 'N/A');

    const segmentoRaw = deterministic.segmento || canonicalJourney.segmento || (isNovosCopa
        ? 'Novos'
        : segmentByCode
        || (text.includes('carrinho') || text.includes('_car_')
            ? 'Abandonados'
            : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
                ? 'Base_Proprietaria'
                : text.includes('crm')
                    ? 'CRM'
                    : 'CRM'));

    // Guard de coerência: um valor de PARCEIRO nunca pode ocupar o Segmento.
    // Se escapou até aqui, cai no default institucional (CRM) em vez de gravar
    // o parceiro no campo errado. Ver: importador-segmento-parceiro-bug.
    const segmento = isPartnerValue(segmentoRaw) ? 'CRM' : segmentoRaw;

    // Carrinho abandonado ⇒ etapa de funil "Reativacao" (reativação de AQUISIÇÃO,
    // não confundir com a reativação de RENTABILIZAÇÃO). O sinal de carrinho por si
    // só não pega o token abreviado `ABD`; amarrar à resolução de Segmento garante
    // que todo carrinho (Segmento=Abandonados) fique Reativacao. Ver memory:
    // fechamento-copa-report.
    const etapaAquisicao = segmento === 'Abandonados' ? 'Reativacao' : deterministic.etapaAquisicao;

    return { bu, parceiro, segmento, etapaAquisicao, subgrupo: isNovosCopa ? 'Copa' : deterministic.subgrupo };
};

export const emptySuggestions = SUGGESTION_FIELDS.reduce<Partial<Record<SuggestionField, FieldSuggestion[]>>>((acc, field) => {
    acc[field] = [];
    return acc;
}, {});

export const suggestionsFor = (
    suggestions: Partial<Record<SuggestionField, FieldSuggestion[]>> | undefined,
    field: SuggestionField
) => suggestions?.[field] ?? [];

export const calculateCandidateConfidence = (
    suggestions: Partial<Record<SuggestionField, FieldSuggestion[]>>
) => {
    const breakdown = SUGGESTION_FIELDS.reduce<Partial<Record<SuggestionField, number>>>((result, field) => {
        result[field] = suggestionsFor(suggestions, field)[0]?.confidence ?? 0;
        return result;
    }, {});
    const confidence = Math.round(SUGGESTION_FIELDS.reduce(
        (sum, field) => sum + (breakdown[field] ?? 0) * CONFIDENCE_WEIGHTS[field] / 100,
        0
    ));
    return { confidence, breakdown };
};

export const isBulkApprovalEligible = (candidate: UpdateCandidate) =>
    canUploadCandidate(candidate)
    && !candidate.auditRequired
    && candidate.confidence >= BULK_APPROVAL_CONFIDENCE
    && BLOCKING_CONFIDENCE_FIELDS.every((field) => (candidate.confidenceBreakdown?.[field] ?? 0) >= BULK_APPROVAL_CONFIDENCE);

export const createBucket = (): SuggestionBucket =>
    SUGGESTION_FIELDS.reduce<SuggestionBucket>((bucket, field) => {
        bucket.set(field, new Map<string, SuggestionStat>());
        return bucket;
    }, new Map<SuggestionField, Map<string, SuggestionStat>>());

export const bucketFor = (index: Map<string, SuggestionBucket>, key: string) => {
    const normalizedKey = normalizeKey(key);
    const existing = index.get(normalizedKey);
    if (existing) return existing;
    const bucket = createBucket();
    index.set(normalizedKey, bucket);
    return bucket;
};

export const addActivityToBucket = (bucket: SuggestionBucket, activity: Activity) => {
    const usedAt = activityDateKey(activity);
    SUGGESTION_FIELDS.forEach((field) => {
        const value = activityField(activity, field);
        if (!value) return;
        const counts = bucket.get(field);
        if (!counts) return;
        const current = counts.get(value);
        counts.set(value, {
            count: (current?.count ?? 0) + 1,
            lastUsed: !current?.lastUsed || usedAt > current.lastUsed ? usedAt : current.lastUsed,
        });
    });
};

export const tokenizeForHistory = (...values: unknown[]) =>
    Array.from(new Set(
        normalizeKey(values.join(' '))
            .split(/[_\s-]+/)
            .filter((token) => token.length >= 4 && !['cartao', 'campanha', 'jornada', 'teste'].includes(token))
    )).slice(0, 12);

export const buildHistoryIndex = (activities: Activity[]): HistoryIndex => {
    const safeActivities = activities.filter(isValidActivity);
    const index: HistoryIndex = {
        existingKeys: new Map<string, Activity[]>(),
        byDispatchSignature: new Map<string, Activity[]>(),
        byJourneyChannel: new Map<string, SuggestionBucket>(),
        byJourney: new Map<string, SuggestionBucket>(),
        byActivity: new Map<string, SuggestionBucket>(),
        bySegmentChannel: new Map<string, SuggestionBucket>(),
        byToken: new Map<string, SuggestionBucket>(),
        global: createBucket(),
        knownJourneys: new Set<string>(),
        activityCount: safeActivities.length,
    };

    safeActivities.forEach((activity) => {
        const channel = normalizeChannel(activity.canal);
        const canonicalJourney = canonicalActivityJourney(activity);
        const journeyKey = normalizeKey(canonicalJourney);
        if (journeyKey) index.knownJourneys.add(journeyKey);
        const activityName = activity.raw?.['Activity name / Taxonomia'] || activity.id;
        const noveltyKey = buildNoveltyKey(canonicalJourney, activityName, channel, activityDateKey(activity));
        const dispatchSignature = buildDispatchSignature(activityName, channel, activityDateKey(activity));
        if (!index.existingKeys.has(noveltyKey)) index.existingKeys.set(noveltyKey, []);
        index.existingKeys.get(noveltyKey)!.push(activity);
        if (!index.byDispatchSignature.has(dispatchSignature)) index.byDispatchSignature.set(dispatchSignature, []);
        index.byDispatchSignature.get(dispatchSignature)!.push(activity);

        addActivityToBucket(bucketFor(index.byJourneyChannel, `${journeyKey}|${channel}`), activity);
        addActivityToBucket(bucketFor(index.byJourney, journeyKey), activity);
        addActivityToBucket(bucketFor(index.byActivity, normalizeKey(activityName)), activity);
        addActivityToBucket(index.global, activity);

        const segment = activityField(activity, 'segmento');
        if (segment && channel !== 'Indefinido') {
            addActivityToBucket(bucketFor(index.bySegmentChannel, `${segment}|${channel}`), activity);
        }

        tokenizeForHistory(activity.jornada, activity.raw?.['Activity name / Taxonomia'], activity.id)
            .forEach((token) => addActivityToBucket(bucketFor(index.byToken, token), activity));
    });

    return index;
};

// Ranking por balde em cache: o mesmo balde (ex.: o global) era reordenado para cada
// disparo e cada campo. Baldes não mudam depois que o índice é montado; devolvemos cópias
// para que ninguém altere o resultado guardado.
const topSuggestionsCache = new WeakMap<SuggestionBucket, Map<string, FieldSuggestion[]>>();

export const topSuggestionsFromBucket = (
    bucket: SuggestionBucket | undefined,
    field: SuggestionField,
    source: string,
    confidenceCap: number
): FieldSuggestion[] => {
    if (!bucket) return [];
    let byKey = topSuggestionsCache.get(bucket);
    if (!byKey) {
        byKey = new Map();
        topSuggestionsCache.set(bucket, byKey);
    }
    const cacheKey = `${field}|${source}|${confidenceCap}`;
    let ranked = byKey.get(cacheKey);
    if (!ranked) {
        ranked = rankBucket(bucket, field, source, confidenceCap);
        byKey.set(cacheKey, ranked);
    }
    return ranked.map((suggestion) => ({ ...suggestion }));
};

const rankBucket = (
    bucket: SuggestionBucket | undefined,
    field: SuggestionField,
    source: string,
    confidenceCap: number
): FieldSuggestion[] => {
    const counts = bucket?.get(field);
    if (!counts || counts.size === 0) return [];

    const total = Array.from(counts.values()).reduce((sum, stat) => sum + stat.count, 0);
    if (total === 0) return [];

    return Array.from(counts.entries())
        .sort((a, b) => b[1].count - a[1].count || String(b[1].lastUsed ?? '').localeCompare(String(a[1].lastUsed ?? '')))
        .slice(0, 5)
        .map(([value, stat]) => ({
            value,
            count: stat.count,
            source,
            lastUsed: stat.lastUsed,
            confidence: Math.min(confidenceCap, Math.round((stat.count / total) * confidenceCap)),
        }));
};

export const suggestAllFields = (
    metric: MetricRow,
    historyIndex: HistoryIndex
): Partial<Record<SuggestionField, FieldSuggestion[]>> => {
    const taxonomy = inferTaxonomy(metric);
    const journeyKey = normalizeKey(metric.journey);
    const journeyChannelKey = normalizeKey(`${journeyKey}|${metric.channel}`);
    const segmentChannelKey = normalizeKey(`${taxonomy.segmento}|${metric.channel}`);
    const journeyChannelBucket = historyIndex.byJourneyChannel.get(journeyChannelKey);
    const journeyBucket = historyIndex.byJourney.get(journeyKey);
    const activityBucket = historyIndex.byActivity.get(normalizeKey(metric.activityName));
    const segmentChannelBucket = historyIndex.bySegmentChannel.get(segmentChannelKey);
    const tokenBuckets = tokenizeForHistory(metric.journey, metric.activityName)
        .map((token) => historyIndex.byToken.get(normalizeKey(token)))
        .filter((bucket): bucket is SuggestionBucket => Boolean(bucket));

    const result: Partial<Record<SuggestionField, FieldSuggestion[]>> = {};
    const deterministic = inferDeterministicDimensions(metric);
    for (const field of SUGGESTION_FIELDS) {
        const deterministicValue = field === 'bu'
            ? taxonomy.bu
            : field === 'produto'
                ? 'Cartao'
                : field === 'parceiro'
                    ? deterministic.parceiro || taxonomy.parceiro
            : field === 'segmento'
                ? deterministic.segmento || taxonomy.segmento
                : field === 'etapaAquisicao'
                    ? deterministic.etapaAquisicao
                    : field === 'subgrupo' ? deterministic.subgrupo : undefined;
        const deterministicSuggestion: FieldSuggestion[] = deterministicValue
            ? [{
                value: deterministicValue,
                confidence: 100,
                source: deterministic.source ?? 'regra determinística',
                count: 1,
                evidence: deterministic.evidence,
                deterministic: true,
            }]
            : [];
        result[field] = [
            ...deterministicSuggestion,
            ...topSuggestionsFromBucket(activityBucket, field, 'mesma activity', 99),
            ...topSuggestionsFromBucket(journeyChannelBucket, field, 'mesma jornada e canal', 96),
            ...topSuggestionsFromBucket(journeyBucket, field, 'mesma jornada', 88),
            ...topSuggestionsFromBucket(segmentChannelBucket, field, 'mesmo segmento e canal', 78),
            ...tokenBuckets.flatMap((bucket) => topSuggestionsFromBucket(bucket, field, 'campanhas similares por token', 70)),
            ...topSuggestionsFromBucket(historyIndex.global, field, 'outros valores da base', 45),
        ].reduce<FieldSuggestion[]>((acc, suggestion) => {
            if (!acc.some((item) => normalizeKey(item.value) === normalizeKey(suggestion.value))) {
                acc.push(suggestion);
            }
            return acc;
        }, []).slice(0, 12);
        if (deterministicSuggestion[0]) {
            const historicalConflict = result[field]?.find((item) =>
                !item.deterministic && normalizeKey(item.value) !== normalizeKey(deterministicSuggestion[0].value)
            );
            deterministicSuggestion[0].historicalConflict = historicalConflict?.value;
        }
    }
    return result;
};

export type CanonicalRole = 'winner' | 'superseded' | 'ambiguous';

export const MONTH_RANK: Record<string, number> = {
    jan: 1, fev: 2, mar: 3, abr: 4, abri: 4, mai: 5, maio: 5, jun: 6,
    jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

export const PERIOD_TOKEN_RE = /(jan|fev|mar|abri|abr|maio|mai|jun|jul|ago|set|out|nov|dez)[_\s]*(\d{4}|\d{2})/gi;

export const VARIANT_JUNK_RE = /\(teste\)|\bteste\b|\(interno\)|\binterno\b|\(v\d\)|_v\d(?:\b|_)|\(copiar\)|rascunho|nova jornada/i;

export const journeyPeriodRank = (journey: string): number => {
    const text = normalizeKey(journey);
    let best = 0;
    PERIOD_TOKEN_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PERIOD_TOKEN_RE.exec(text))) {
        const month = MONTH_RANK[match[1]] ?? 0;
        if (!month) continue;
        let year = parseInt(match[2], 10);
        if (year < 100) year += 2000;
        best = Math.max(best, year * 100 + month);
    }
    return best;
};

export const journeyStem = (journey: string): string =>
    acquisitionJourneyIdentity(journey).replace(PERIOD_TOKEN_RE, ' ').replace(/\s+/g, ' ').trim();

export const electCanonicalJourney = (
    journeys: string[],
    knownJourneys: Set<string>,
    activityName = '',
): Map<string, CanonicalRole> => {
    const roles = new Map<string, CanonicalRole>();
    const distinct = Array.from(new Set(journeys.map((j) => (j ?? '').trim()).filter(Boolean)));
    if (distinct.length <= 1) return roles; // sem colisao
    const norm = (j: string) => normalizeKey(j);
    const mark = (list: string[], role: CanonicalRole) => list.forEach((j) => roles.set(norm(j), role));
    const elect = (winner: string, pool: string[]) => {
        mark([winner], 'winner');
        mark(pool.filter((j) => norm(j) !== norm(winner)), 'superseded');
    };

    // 1. descartar variantes obvias (teste/interno/v1/v2/rascunho/copiar/nova jornada)
    mark(distinct.filter((j) => VARIANT_JUNK_RE.test(j)), 'superseded');
    let pool = distinct.filter((j) => !VARIANT_JUNK_RE.test(j));

    // 2. preferir JOR_ sobre rascunho/nao-JOR
    const jorPool = pool.filter((j) => norm(j).startsWith('jor_'));
    if (jorPool.length > 0 && jorPool.length < pool.length) {
        mark(pool.filter((j) => !norm(j).startsWith('jor_')), 'superseded');
        pool = jorPool;
    }

    if (pool.length === 0) { mark(distinct, 'ambiguous'); return roles; }
    if (pool.length === 1) { mark(pool, 'winner'); return roles; }

    // Prefix-only aliases are one journey. Prefer the new spelling, exactly once.
    if (new Set(pool.map(acquisitionJourneyIdentity)).size === 1) {
        const winner = [...pool].sort((a, b) =>
            Number(/^jor_aqs_/i.test(b)) - Number(/^jor_aqs_/i.test(a)) || a.localeCompare(b))[0];
        elect(winner, pool);
        return roles;
    }

    // Observed Plurix BI aliases for the SAME operational signature. An explicit
    // 21D activity disambiguates SAB vs 21D; never use this to merge different activities.
    const plurix21 = inferCartAudience('', activityName).subgrupo === 'Abandonados D-21 A D>7'
        && pool.every((j) => /^jor_(?:aqs|aquisicao)_plurix_na_abd_carrinho(?:21d|_sab)_/i.test(j));
    if (plurix21) {
        const explicit = pool.filter((j) => /_carrinho21d_/i.test(j));
        if (explicit.length) {
            const ranked = [...explicit].sort((a, b) => journeyPeriodRank(b) - journeyPeriodRank(a));
            if (ranked.length === 1 || journeyPeriodRank(ranked[0]) > journeyPeriodRank(ranked[1])) {
                elect(ranked[0], pool);
                return roles;
            }
        }
    }

    const pickNewestUnique = (candidates: string[]): string | null => {
        let best = -1;
        candidates.forEach((j) => { best = Math.max(best, journeyPeriodRank(j)); });
        const top = candidates.filter((j) => journeyPeriodRank(j) === best);
        return top.length === 1 ? top[0] : null;
    };

    // 3. mesmo stem (renomeacao pura) => periodo mais novo vence
    if (new Set(pool.map(journeyStem)).size === 1) {
        const winner = pickNewestUnique(pool);
        if (winner) elect(winner, pool); else mark(pool, 'ambiguous');
        return roles;
    }

    // 4. stems diferentes => preferir a jornada NOVA (que ainda nao existe na base)
    const novel = pool.filter((j) => !knownJourneys.has(norm(j)));
    if (novel.length === 1) { elect(novel[0], pool); return roles; }
    if (novel.length > 1) {
        const winner = pickNewestUnique(novel);
        if (winner) { elect(winner, pool); return roles; }
    }

    // nenhuma claramente nova / empate => conflito seguro
    mark(pool, 'ambiguous');
    return roles;
};

export const GROUP_RESULT_FIELDS: Array<keyof MetricRow> = ['proposals', 'approved', 'finalized', 'assisted', 'independent'];

export const ALL_METRIC_FIELDS: Array<keyof MetricRow> = [
    'sent', 'delivered', 'opens', 'clicks', ...GROUP_RESULT_FIELDS,
];

export const collapseAbandonedCartDuplicates = (rows: MetricRow[]) => {
    const result: MetricRow[] = [];
    const grouped = new Map<string, MetricRow>();

    rows.forEach((row) => {
        if (!hasAbandonedCartSignal(row.journey, row.activityName)) {
            result.push(row);
            return;
        }

        const existing = grouped.get(row.key);
        if (!existing) {
            grouped.set(row.key, { ...row });
            return;
        }

        ALL_METRIC_FIELDS.forEach((field) => {
            const previous = existing[field];
            const incoming = row[field];
            if (typeof incoming === 'number' && (!Number.isFinite(Number(previous)) || incoming > Number(previous))) {
                (existing as any)[field] = incoming;
            }
        });
        existing.sourceBlocks = Array.from(new Set([...existing.sourceBlocks, ...row.sourceBlocks]));
    });

    return [...result, ...grouped.values()];
};

export const propagateGroupEmissions = (candidates: UpdateCandidate[]): UpdateCandidate[] => {
    const groups = new Map<string, UpdateCandidate[]>();
    candidates.forEach((candidate) => {
        const list = groups.get(candidate.dispatchSignature);
        if (list) list.push(candidate); else groups.set(candidate.dispatchSignature, [candidate]);
    });
    groups.forEach((group) => {
        if (group.length < 2) return; // sem colisao de jornada
        if (isStandardOptOutResponse(group[0].activityName)) return;
        GROUP_RESULT_FIELDS.forEach((field) => {
            let best = 0;
            group.forEach((candidate) => {
                const value = candidate[field];
                if (typeof value === 'number' && value > best) best = value;
            });
            if (best > 0) group.forEach((candidate) => { (candidate as any)[field] = best; });
        });
    });
    return candidates;
};

export const buildCandidate = (
    metric: MetricRow,
    historyIndex: HistoryIndex,
    importedKeyCount: Map<string, number>,
    importedSignatureJourneys: Map<string, Set<string>>
): UpdateCandidate => {
    const taxonomy = inferTaxonomy(metric);
    const hasDeterministicBasePropria = taxonomy.bu === 'B2C' && taxonomy.parceiro === 'Proprietaria' && taxonomy.segmento === 'Base_Proprietaria';
    const hasDeterministicNovosCopa = taxonomy.segmento === 'Novos' && taxonomy.subgrupo === 'Copa';
    // Auditoria 2026-07-06: jornadas com token explicito de BU (B2B2C/Plurix no nome)
    // entravam com BU='B2C' porque a sugestao por historico (valueFor) podia vencer o
    // parse deterministico de inferTaxonomy quando o bucket de tokens tinha contaminacao
    // de outras jornadas. Token explicito na jornada e sinal de alta confianca (mesma
    // logica de inferTaxonomy:806-812) e nao deve perder para sugestao por similaridade.
    const hasExplicitBuToken = taxonomy.bu === 'B2B2C' || taxonomy.bu === 'Plurix';
    const fieldSuggestions = suggestAllFields(metric, historyIndex);

    const valueFor = (field: SuggestionField, fallback: string) => suggestionsFor(fieldSuggestions, field)[0]?.value || fallback;
    const weightedConfidence = calculateCandidateConfidence(fieldSuggestions);
    const averageConfidence = weightedConfidence.confidence;
    const blockingFieldsReady = BLOCKING_CONFIDENCE_FIELDS.every(
        (field) => (weightedConfidence.breakdown[field] ?? 0) >= BULK_APPROVAL_CONFIDENCE
    );
    const duplicateCount = importedKeyCount.get(metric.key) ?? 0;
    const importedJourneys = importedSignatureJourneys.get(metric.dispatchSignature) ?? new Set<string>();
    const historicalSignatureMatches = historyIndex.byDispatchSignature.get(metric.dispatchSignature) ?? [];
    const compatibleHistoricalMatches = historicalSignatureMatches.filter(activity =>
        isStandardOptOutResponse(metric.activityName)
            ? normalizeKey(metric.journey) === normalizeKey(canonicalActivityJourney(activity))
            : isSameJourneyFamily(metric.journey, canonicalActivityJourney(activity))
    );
    const renamedHistoricalMatches = compatibleHistoricalMatches.length > 0 || isStandardOptOutResponse(metric.activityName)
        ? []
        : historicalSignatureMatches
            .map((activity) => ({
                activity,
                similarity: Math.max(
                    journeySimilarity(metric.journey, canonicalActivityJourney(activity)),
                    journeySimilarity(metric.journey, activity.jornada)
                ),
            }))
            .filter((match) => match.similarity >= RENAMED_JOURNEY_SIMILARITY_THRESHOLD);

    // Atualizacao automatica usa mesma jornada canonica ou renomeacao forte.
    // Mesma activity+canal+data com jornada >=70% similar e duplicidade operacional:
    // atualiza o registro existente e fixa a jornada canonica com o nome do arquivo.
    const existingDispatchCandidates = compatibleHistoricalMatches.length > 0
        ? compatibleHistoricalMatches
        : renamedHistoricalMatches.map((match) => match.activity);
    const renamedJourneyMatch = compatibleHistoricalMatches.length === 0 && renamedHistoricalMatches.length > 0;
    const renamedJourneySimilarity = renamedHistoricalMatches
        .reduce((best, match) => Math.max(best, match.similarity), 0);
    const existingDispatch = [...existingDispatchCandidates].sort((left, right) => {
        const target = normalizeKey(metric.journey);
        const score = (activity: Activity) => {
            const canonicalJourney = normalizeKey(canonicalActivityJourney(activity));
            const rawJourney = normalizeKey(activity.jornada);
            if (canonicalJourney === target) return 4;
            if (rawJourney === target) return 3;
            const similarity = Math.max(
                journeySimilarity(metric.journey, canonicalActivityJourney(activity)),
                journeySimilarity(metric.journey, activity.jornada)
            );
            if (similarity >= RENAMED_JOURNEY_SIMILARITY_THRESHOLD) return 2 + similarity;
            if (
                target === normalizeKey(PLURIX_CART_ASSISTED_JOURNEY)
                && (rawJourney.includes('assistido') || rawJourney.includes('lojista'))
            ) return 2;
            return 1;
        };
        const scoreDiff = score(right) - score(left);
        if (scoreDiff !== 0) return scoreDiff;
        const rightUpdatedAt = String(right.raw?.updated_at ?? right.raw?.created_at ?? '');
        const leftUpdatedAt = String(left.raw?.updated_at ?? left.raw?.created_at ?? '');
        return rightUpdatedAt.localeCompare(leftUpdatedAt);
    })[0];
    const existsInBase = Boolean(existingDispatch);
    const refreshDetails = metricRefreshDetails(metric, existingDispatch);
    const canonicalJourneyChanged = Boolean(existingDispatch)
        && normalizeKey(existingDispatch?.jornada) !== normalizeKey(metric.journey);
    const canonicalCartDimensionChanged = Boolean(existingDispatch)
        && hasAbandonedCartSignal(metric.journey, metric.activityName)
        && (
            normalizeKey(getRaw(existingDispatch!, ['Segmento'])) !== normalizeKey(taxonomy.segmento)
            || normalizeKey(getRaw(existingDispatch!, ['Etapa de aquisicao', 'Etapa de aquisição'])) !== normalizeKey(taxonomy.etapaAquisicao)
        );
    const resolvedAudience = inferCartAudience(metric.journey, metric.activityName,
        existingDispatch ? activityField(existingDispatch, 'subgrupo') : undefined);
    if (resolvedAudience.subgrupo) taxonomy.subgrupo = resolvedAudience.subgrupo;
    const canonicalAudienceChanged = Boolean(existingDispatch) && Boolean(taxonomy.subgrupo)
        && normalizeKey(getRaw(existingDispatch!, ['Subgrupos'])) !== normalizeKey(taxonomy.subgrupo);
    const canonicalStageChanged = Boolean(existingDispatch) && Boolean(taxonomy.etapaAquisicao)
        && normalizeKey(getRaw(existingDispatch!, ['Etapa de aquisição'])) !== normalizeKey(taxonomy.etapaAquisicao);
    const canonicalSegmentChanged = Boolean(existingDispatch) && Boolean(taxonomy.segmento)
        && Boolean(parseCanonicalAcquisitionJourney(metric.journey).segmento)
        && normalizeKey(getRaw(existingDispatch!, ['Segmento'])) !== normalizeKey(taxonomy.segmento);
    const audienceConflict = resolvedAudience.conflict;
    const hasCanonicalDimensionRefresh = canonicalJourneyChanged || canonicalCartDimensionChanged || canonicalAudienceChanged || canonicalStageChanged || canonicalSegmentChanged;
    const hasMetricRefresh = refreshDetails.length > 0 || hasCanonicalDimensionRefresh;
    const collidesWithAnotherJourney = historicalSignatureMatches.length > 0 && !existsInBase;
    const renamedJourneyPct = Math.round(renamedJourneySimilarity * 100);

    // Duplicacao do BI: a mesma activity+canal+data vem com varios nomes de jornada
    // (antigo + novo). Elege a jornada canonica; as demais viram conflito.
    const fileJourneys = Array.from(new Set([metric.journey, ...Array.from(importedJourneys)])).filter(journey =>
        Boolean(journey) && (!isStandardOptOutResponse(metric.activityName)
            || normalizeKey(journey) === normalizeKey(metric.journey)));
    const canonicalRoles = electCanonicalJourney(fileJourneys, historyIndex.knownJourneys, metric.activityName);
    const myRole = canonicalRoles.get(normalizeKey(metric.journey));
    const fileSuperseded = myRole === 'superseded';
    const fileAmbiguous = myRole === 'ambiguous';
    const winnerJourney = fileJourneys.find((journey) => canonicalRoles.get(normalizeKey(journey)) === 'winner');

    const conflictJourneys = Array.from(new Set([
        ...Array.from(importedJourneys).filter((journey) => !isSameJourneyFamily(metric.journey, journey)),
        ...historicalSignatureMatches
            .filter((activity) => !isSameJourneyFamily(metric.journey, canonicalActivityJourney(activity)))
            .map((activity) => activity.jornada),
    ])).filter(Boolean);

    const missingCritical = !metric.journey || !metric.activityName || !metric.date || metric.channel === 'Indefinido';
    const missingHumanSuggestion = ['parceiro', 'subgrupo', 'etapaAquisicao', 'perfilCredito', 'oferta', 'promocional']
        .some((field) => !suggestionsFor(fieldSuggestions, field as SuggestionField)[0]?.value);

    const status: CandidateStatus = missingCritical
        ? 'error'
        : duplicateCount > 1
            ? 'duplicate'
            : (fileSuperseded || fileAmbiguous || Boolean(audienceConflict))
                // Nome antigo/variante do BI, ou colisao sem vencedor claro => conflito (nunca grava no escuro)
                ? 'conflict'
                : existsInBase
                    ? (hasMetricRefresh ? 'ready' : 'duplicate')
                    : missingHumanSuggestion
                        ? 'new'
                        // BP/Base Propria e deterministico (taxonomia forca BU/Parceiro/Segmento);
                        // com todos os campos humanos cobertos pelo historico, vira Pronto mesmo
                        // sem historico de mesma-jornada (que e o unico que ultrapassa 80%).
                        : ((averageConfidence >= BULK_APPROVAL_CONFIDENCE && blockingFieldsReady) || hasDeterministicBasePropria)
                            ? 'ready'
                            : 'review';

    return {
        ...metric,
        status,
        matchCount: 0,
        fieldToReview: audienceConflict ? 'Janela do publico' : missingCritical
            ? 'Chave'
            : duplicateCount > 1
                ? 'Duplicidade'
                : fileSuperseded
                    ? 'Jornada antiga (BI)'
                    : fileAmbiguous
                        ? 'Colisao de jornada'
                        : existsInBase
                            ? (renamedJourneyMatch ? 'Jornada renomeada' : hasMetricRefresh ? 'Atualizar resultados' : 'Ja existe na base')
                            : collidesWithAnotherJourney
                                ? 'Novo disparo em outra jornada'
                            : missingHumanSuggestion
                                ? 'Campos humanos'
                                : status === 'ready'
                                    ? 'Aprovar'
                                    : 'Sugestoes',
        suggestion: audienceConflict || (fileSuperseded
            ? `Nome antigo/variante do BI; canonica: ${winnerJourney ?? '-'}`
            : fileAmbiguous
                ? 'Colisao de jornada sem vencedor claro'
                : existsInBase
                    ? (hasMetricRefresh
                        ? (renamedJourneyMatch
                            ? `Mesma activity, canal e data com jornada ${renamedJourneyPct}% similar; atualizar para nome canonico novo`
                            : hasCanonicalDimensionRefresh
                            ? 'Classificacao canonica de segmento, etapa ou janela do publico mudou'
                            : `${refreshDetails.length} metricas mudaram desde a ultima atualizacao`)
                        : 'Disparo ja existe na base de dados')
                    : collidesWithAnotherJourney
                        ? 'Mesma activity, canal e data existem em outra jornada; tratado como novo disparo'
                    : status === 'ready'
                        ? 'Sugestoes historicas fortes'
                        : 'Revisar campos sugeridos'),
        confidence: audienceConflict ? 0 : hasMetricRefresh
            ? 100
            : missingCritical || duplicateCount > 1 || fileSuperseded || fileAmbiguous || existsInBase ? 0 : averageConfidence,
        confidenceBreakdown: hasMetricRefresh
            ? SUGGESTION_FIELDS.reduce((result, field) => ({ ...result, [field]: 100 }), {})
            : weightedConfidence.breakdown,
        basis: missingCritical
            ? 'journey, canal ou data ausente'
            : duplicateCount > 1
                ? 'mais de uma linha no arquivo com a mesma chave'
                : fileSuperseded
                    ? `jornada substituida pela mais recente: ${winnerJourney ?? '-'}`
                    : fileAmbiguous
                        ? `colisao de jornada sem vencedor claro: ${conflictJourneys.join(', ')}`
                : existsInBase
                            ? (hasMetricRefresh
                                ? [
                                    ...refreshDetails.map(({ field, previous, next }) => `${String(field)}: ${previous} -> ${next}`),
                                    ...(renamedJourneyMatch ? [`jornada similar ${renamedJourneyPct}%: ${existingDispatch?.jornada ?? '-'} -> ${metric.journey}`] : []),
                                    ...(canonicalJourneyChanged ? [`jornada: ${existingDispatch?.jornada ?? '-'} -> ${metric.journey}`] : []),
                                    ...(canonicalCartDimensionChanged ? ['carrinho abandonado: Segmento/Etapa -> Abandonados/Reativacao'] : []),
                                    ...(canonicalAudienceChanged ? [`Subgrupos -> ${taxonomy.subgrupo}`] : []),
                                    ...(canonicalStageChanged ? [`Etapa -> ${taxonomy.etapaAquisicao}`] : []),
                                ].join(' | ')
                                : 'activity, canal, data e jornada ja existem na base de dados')
                            : collidesWithAnotherJourney
                                ? `assinatura operacional ja usada em outra jornada: ${historicalSignatureMatches.map((activity) => activity.jornada).join(', ')}`
                            : 'sugestoes por taxonomia e historico',
        accepted: false,
        domain: metric.domain,
        bu: hasDeterministicBasePropria || hasExplicitBuToken ? taxonomy.bu : valueFor('bu', taxonomy.bu),
        parceiro: valueFor('parceiro', taxonomy.parceiro),
        segmento: hasDeterministicBasePropria || hasDeterministicNovosCopa || taxonomy.segmento === 'Abandonados' ? taxonomy.segmento : valueFor('segmento', taxonomy.segmento),
        subgrupo: taxonomy.subgrupo || valueFor('subgrupo', 'N/A'),
        etapaAquisicao: taxonomy.etapaAquisicao || valueFor('etapaAquisicao', ''),
        perfilCredito: valueFor('perfilCredito', ''),
        produto: valueFor('produto', 'Cartao'),
        oferta: valueFor('oferta', ''),
        promocional: valueFor('promocional', ''),
        ordemDisparo: inferOrdemDisparo(metric.activityName),
        suggestions: fieldSuggestions,
        conflictJourneys,
        // matchedActivity forca UPDATE no service (asDbActivityId) em vez de INSERT,
        // evitando duplicar disparo que ja existe na base. Nao setar para nomes
        // antigos/variantes (superseded) ou colisoes ambiguas: esses nunca devem gravar.
        matchedActivity: (fileSuperseded || fileAmbiguous) ? undefined : existingDispatch,
        // Conflito de jornada (superseded/ambiguo) nunca e update seguro: nao deve
        // aparecer no rotulo/filtro "Atualizar metricas", mesmo que as metricas tenham mudado.
        metricRefresh: hasMetricRefresh && !fileSuperseded && !fileAmbiguous && !audienceConflict,
        canonicalDimensionRefresh: hasCanonicalDimensionRefresh && !fileSuperseded && !fileAmbiguous && !audienceConflict,
        canonicalDimensionFields: [
            ...(canonicalCartDimensionChanged ? ['segmento', 'etapaAquisicao'] : []),
            ...(canonicalAudienceChanged ? ['subgrupo'] : []),
            ...(canonicalStageChanged ? ['etapaAquisicao'] : []),
            ...(canonicalSegmentChanged && !canonicalCartDimensionChanged ? ['segmento'] : []),
        ],
        auditRequired: renamedJourneyMatch,
        conflictReason: fileSuperseded
            ? 'superseded_file_journey'
            : fileAmbiguous
                ? 'ambiguous_file_journey'
                : existsInBase
                    ? (renamedJourneyMatch ? 'renamed_journey_existing_dispatch' : 'existing_dispatch')
                    : undefined,
    };
};

export const buildErrorCandidate = (metric: MetricRow, error: unknown): UpdateCandidate => {
    const taxonomy = inferTaxonomy(metric);
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao montar candidato';

    return {
        ...metric,
        status: 'error',
        matchCount: 0,
        fieldToReview: 'Processamento',
        suggestion: 'Linha precisa de revisao manual',
        confidence: 0,
        basis: message,
        accepted: false,
        bu: taxonomy.bu,
        parceiro: taxonomy.parceiro,
        segmento: taxonomy.segmento,
        subgrupo: 'N/A',
        etapaAquisicao: '',
        perfilCredito: '',
        produto: 'Cartao',
        oferta: '',
        promocional: '',
        ordemDisparo: undefined,
        suggestions: emptySuggestions,
        conflictJourneys: [],
        conflictReason: undefined,
    };
};

export const valueOrBlank = (value: unknown) => value === undefined || value === null ? '' : String(value);

export const textOrFallback = (value: unknown, fallback = 'N/A') => {
    const text = valueOrBlank(value).trim();
    return text || fallback;
};

export const applyApprovalDefaults = (candidate: UpdateCandidate): UpdateCandidate => ({
    ...candidate,
    parceiro: textOrFallback(candidate.parceiro),
    segmento: textOrFallback(candidate.segmento),
    subgrupo: textOrFallback(candidate.subgrupo),
    etapaAquisicao: textOrFallback(candidate.etapaAquisicao),
    perfilCredito: textOrFallback(candidate.perfilCredito),
    produto: textOrFallback(candidate.produto, 'Cartao'),
    oferta: textOrFallback(candidate.oferta, 'Padrao'),
    promocional: textOrFallback(candidate.promocional),
});

export const buildExcelRow = (candidate: UpdateCandidate) => {
    const baseTotal = candidate.sent ?? '';
    const baseAcionavel = candidate.delivered ?? '';
    const cartoes = candidate.finalized ?? 0;
    const aprovados = candidate.approved ?? 0;
    const propostas = candidate.proposals ?? 0;
    const independentes = candidate.independent ?? 0;
    const assistidas = candidate.assisted ?? 0;

    const cols = FRAMEWORK_HEADERS.map((header) => {
        switch (header) {
            case 'Disparado?': return 'Sim';
            case 'Jornada': return candidate.journey;
            case 'Activity name / Taxonomia': return candidate.activityName;
            case 'Canal': return candidate.channel;
            case 'Data de Disparo': return formatDateBR(candidate.date);
            case 'Data Fim': return formatDateBR(candidate.date);
            case 'Safra': return generateSafra(candidate.date);
            case 'BU': return textOrFallback(candidate.bu, 'B2C');
            case 'Parceiro': return textOrFallback(candidate.parceiro);
            case 'SIGLA': return 'N/A';
            case 'Segmento': return textOrFallback(candidate.segmento, 'CRM');
            case 'Subgrupos': return textOrFallback(candidate.subgrupo);
            case 'Base Total': return baseTotal;
            case 'Base Acionavel': return baseAcionavel;
            case 'Etapa de aquisicao': return textOrFallback(candidate.etapaAquisicao);
            case 'Ordem de disparo': return candidate.ordemDisparo ?? '';
            case 'Perfil de Credito': return textOrFallback(candidate.perfilCredito);
            case 'Produto': return textOrFallback(candidate.produto, 'Cartao');
            case 'Oferta': return textOrFallback(candidate.oferta, 'Padrao');
            case 'Promocional': return textOrFallback(candidate.promocional);
            case 'Oferta 2': return 'Padrao';
            case 'Promocional 2': return 'N/A';
            case 'Abertura': return candidate.opens ?? '';
            case 'Cliques': return candidate.clicks ?? '';
            case 'Cartoes Gerados': return cartoes;
            case 'Aprovados': return aprovados;
            case 'Propostas': return propostas;
            case 'Emissoes Independentes': return independentes;
            case 'Emissoes Assistidas': return assistidas;
            default: return '';
        }
    });

    return cols.map(valueOrBlank).join('\t');
};

export const toCsv = (tsv: string) =>
    tsv
        .split('\n')
        .filter(Boolean)
        .map((line) =>
            line.split('\t').map((cell) => {
                const value = String(cell ?? '');
                return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(';')
        )
        .join('\n');

export const positive = (value?: number) => (value ?? 0) > 0;

// Meio-dia local de cada data em cache: a consolidação compara as mesmas datas milhões de
// vezes. Mesma conta de antes (diferença em ms arredondada), só sem reinterpretar a data.
const noonMsCache = new Map<string, number>();
const noonMs = (date: string) => {
    const key = String(date);
    let value = noonMsCache.get(key);
    if (value === undefined) {
        value = new Date(`${key}T12:00:00`).getTime();
        if (noonMsCache.size >= 50_000) noonMsCache.clear();
        noonMsCache.set(key, value);
    }
    return value;
};

export const dayDiff = (fromDate: string, toDate: string) => {
    const from = noonMs(fromDate);
    const to = noonMs(toDate);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.POSITIVE_INFINITY;
    return Math.round((to - from) / 86400000);
};

export const attributionKey = (row: MetricRow) => `${normalizeKey(row.activityName)}|${canonicalChannel(row.channel)}`;

export const hasDispatchVolume = (row: MetricRow) => positive(row.sent) && positive(row.delivered);

export const hasConversionMetric = (row: MetricRow) =>
    positive(row.proposals) || positive(row.approved) || positive(row.finalized) || positive(row.assisted) || positive(row.independent);

export const hasEngagementMetric = (row: MetricRow) => positive(row.opens) || positive(row.clicks);

export const isAttributionResidual = (row: MetricRow) =>
    row.sourceBlock !== 'performance' && !hasDispatchVolume(row) && !hasConversionMetric(row);

export const addMetricValue = (target: MetricRow, source: MetricRow, field: keyof MetricRow) => {
    const value = source[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
    const current = target[field];
    if (value === 0) {
        if (typeof current !== 'number') (target as any)[field] = 0;
        return;
    }
    (target as any)[field] = (typeof current === 'number' ? current : 0) + value;
};

export const consolidateOperationalRows = (dispatchRows: MetricRow[], performanceRows: MetricRow[]) => {
    const anchors = dispatchRows.filter((row) => !isAttributionResidual(row));
    const anchorsByAttributionKey = anchors.reduce((map, row) => {
        const key = attributionKey(row);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
        return map;
    }, new Map<string, MetricRow[]>());

    // Secondary index: activityName only (sem canal) - usado como fallback para
    // ECRED-API, cujos resultados aparecem no bloco PERF com canal='ECRED-API'
    // mesmo que o disparo tenha sido WPP/SMS. O attributionKey normal falha porque
    // os canais diferem ('WhatsApp' vs 'ECRED-API'), entao sem este indice os
    // cartoes finalizados ficam em ignoredPerformance.
    const anchorsByActivityName = anchors.reduce((map, row) => {
        const key = normalizeKey(row.activityName);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
        return map;
    }, new Map<string, MetricRow[]>());

    const isEcredChannel = (channel: string | undefined) =>
        /ecred/i.test(String(channel ?? ''));

    let mergedResidual = 0;
    let ignoredResidual = 0;
    let mergedPerformance = 0;
    let mergedEcred = 0;
    let ignoredPerformance = 0;

    // Índice por data dentro de cada chave: a janela D0-D2 olha só as datas distintas da
    // chave, não todos os disparos. A ordem original das âncoras é preservada, então o
    // resultado é idêntico ao da varredura completa.
    const anchorOrder = new Map<MetricRow, number>();
    anchors.forEach((row, index) => anchorOrder.set(row, index));
    const byDate = (rows: MetricRow[]) => rows.reduce((map, row) => {
        const list = map.get(row.date);
        if (list) list.push(row);
        else map.set(row.date, [row]);
        return map;
    }, new Map<string, MetricRow[]>());
    const datedByAttributionKey = new Map<string, Map<string, MetricRow[]>>();
    anchorsByAttributionKey.forEach((rows, key) => datedByAttributionKey.set(key, byDate(rows)));
    const datedByActivityName = new Map<string, Map<string, MetricRow[]>>();
    anchorsByActivityName.forEach((rows, key) => datedByActivityName.set(key, byDate(rows)));
    const windowCandidates = (dated: Map<string, MetricRow[]> | undefined, date: string) => {
        if (!dated) return [];
        const found: Array<{ candidate: MetricRow; diff: number }> = [];
        dated.forEach((rows, anchorDate) => {
            const diff = dayDiff(anchorDate, date);
            if (diff >= 0 && diff <= 2) rows.forEach((candidate) => found.push({ candidate, diff }));
        });
        return found.sort((a, b) => anchorOrder.get(a.candidate)! - anchorOrder.get(b.candidate)!);
    };

    const findAnchor = (row: MetricRow) => {
        const candidates = windowCandidates(datedByAttributionKey.get(attributionKey(row)), row.date);

        // A resposta padrão é reutilizada. Só vincula métricas à execução da mesma
        // jornada, incluindo a safra do nome, quando há uma âncora inequívoca.
        if (isStandardOptOutResponse(row.activityName)) {
            const journey = normalizeKey(row.journey);
            if (!journey) return undefined;
            const exact = candidates.filter(item => normalizeKey(item.candidate.journey) === journey);
            const sameDay = exact.filter(item => item.diff === 0);
            if (sameDay.length === 1) return sameDay[0].candidate;
            return sameDay.length === 0 && exact.length === 1 ? exact[0].candidate : undefined;
        }

        // Preferir ancora com a MESMA jornada do PERF. Sem isso, quando o BI duplica
        // a mesma activity+canal+data em jornadas diferentes (ex: ABRI26 e MAIO26),
        // todas as linhas PERF caem na primeira ancora e a jornada canonica fica com
        // 0 cartoes. Com a preferencia por jornada, cada PERF vai para o seu disparo.
        const sameJourney = candidates.filter((item) =>
            row.journey && isSameJourneyFamily(item.candidate.journey, row.journey)
        );
        const exactJourney = sameJourney.filter((item) =>
            normalizeKey(item.candidate.journey) === normalizeKey(row.journey));
        const pool = exactJourney.length > 0 ? exactJourney : sameJourney.length > 0 ? sameJourney : candidates;
        const match = pool.sort((a, b) => a.diff - b.diff)[0]?.candidate;

        if (match) return match;

        // Fallback ECRED-API: o resultado de conversao do caminho ECRED chega no bloco
        // PERF com canal='ECRED-API', mas o disparo original e WPP/SMS. Busca pelo
        // activityName sem considerar o canal, dentro da janela D0-D2.
        if (isEcredChannel(row.channel)) {
            const ecredCandidates = windowCandidates(datedByActivityName.get(normalizeKey(row.activityName)), row.date);
            // Mesma preferencia por jornada do caminho principal: quando o BI duplica a
            // activity em varias jornadas, cada PERF ECRED-API vai para a ancora da SUA
            // jornada (evita somar 3x o mesmo cartao numa unica jornada).
            const ecredSameJourney = ecredCandidates.filter((item) =>
                row.journey && isSameJourneyFamily(item.candidate.journey, row.journey)
            );
            const ecredExactJourney = ecredSameJourney.filter((item) =>
                normalizeKey(item.candidate.journey) === normalizeKey(row.journey));
            const ecredPool = ecredExactJourney.length > 0 ? ecredExactJourney
                : ecredSameJourney.length > 0 ? ecredSameJourney : ecredCandidates;
            const ecredMatch = ecredPool.sort((a, b) => a.diff - b.diff)[0]?.candidate;
            if (ecredMatch) mergedEcred += 1;
            return ecredMatch;
        }

        return undefined;
    };

    dispatchRows.filter(isAttributionResidual).forEach((row) => {
        const anchor = findAnchor(row);

        if (!anchor) {
            ignoredResidual += 1;
            return;
        }

        addMetricValue(anchor, row, 'delivered');
        addMetricValue(anchor, row, 'opens');
        addMetricValue(anchor, row, 'clicks');
        anchor.sourceBlocks = Array.from(new Set([...(anchor.sourceBlocks ?? [anchor.sourceBlock]), row.sourceBlock]));
        mergedResidual += hasEngagementMetric(row) || positive(row.delivered) ? 1 : 0;
    });

    performanceRows.forEach((row) => {
        const anchor = findAnchor(row);

        if (!anchor) {
            ignoredPerformance += 1;
            return;
        }

        addMetricValue(anchor, row, 'proposals');
        addMetricValue(anchor, row, 'approved');
        addMetricValue(anchor, row, 'finalized');
        addMetricValue(anchor, row, 'assisted');
        addMetricValue(anchor, row, 'independent');
        anchor.sourceBlocks = Array.from(new Set([...(anchor.sourceBlocks ?? [anchor.sourceBlock]), 'performance']));
        mergedPerformance += hasConversionMetric(row) ? 1 : 0;
    });

    return { rows: anchors, mergedResidual, ignoredResidual, mergedPerformance, mergedEcred, ignoredPerformance };
};

export const isAquisicaoMetric = (metric: MetricRow) => {
    return hasAquisicaoJourneyPrefix(metric.journey);
};

export interface RentabilizacaoTaxonomy {
    family: string;
    bu: string;
    parceiro: string;
    segmento: string;
    subgrupo: string;
    produto: string;
    etapaAquisicao: string;
    perfilCredito: string;
    oferta: string;
    promocional?: string;
    evidence: string;
}

export const rentTitleCase = (value: string) =>
    value
        .toLowerCase()
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

export const inferRentabilizacaoContext = (journey: unknown, activityName: unknown): RentabilizacaoTaxonomy => {
    const journeyText = normalizeKey(journey).toUpperCase();
    const activityText = normalizeKey(activityName).toUpperCase();
    const text = `${journeyText} ${activityText}`;
    const isCopa = journeyText.includes('COPA');
    const semanticClass = classifyRentabilizacao(text);
    const isInsurance = semanticClass.segmento === 'Seguro' || semanticClass.segmento === 'Abandonado';

    const bu = text.includes('PLURIX') || text.includes('MAISAMIGO') || text.includes('PLU_')
        ? 'Plurix'
        : isInsurance
            ? 'Seguros'
            : text.includes('B2B2C') || text.includes('_BB_') || text.includes('BB_')
                ? 'B2B2C'
                : 'B2C';

    if (isInsurance) {
        const isCarrinho = text.includes('CARRINHO');
        const produto = text.includes('AUTO_E_RESIDENCIAL') || (text.includes('AUTO') && text.includes('RESIDENCIA'))
            ? 'Seguro Auto e Residencial'
            : text.includes('SEGURO_AUTO')
                ? 'Seguro Auto'
                : text.includes('RESIDENCIA24H') || text.includes('RESIDENCIA')
            ? `${isCarrinho ? 'Carrinho ' : ''}Seguro Residencia${text.includes('24H') ? ' 24h' : ''}`
            : text.includes('MULHER')
                ? `${isCarrinho ? 'Carrinho ' : ''}Seguro Mulher`
                : isCarrinho
                    ? 'Carrinho Seguro'
                    : 'Seguro';
        return {
            family: `seguros:${normalizeKey(produto)}`,
            bu,
            parceiro: 'N/A',
            segmento: semanticClass.segmento,
            subgrupo: semanticClass.subgrupo,
            produto,
            etapaAquisicao: 'Rentabilizacao',
            perfilCredito: 'N/A',
            oferta: 'Padrao',
            evidence: `árvore Seguros: ${semanticClass.segmento} > ${semanticClass.subgrupo}`,
        };
    }

    const segmento = semanticClass.segmento;

    if (isCopa) {
        return {
            family: `copa:${normalizeKey(segmento)}`,
            bu,
            parceiro: 'N/A',
            segmento,
            subgrupo: semanticClass.subgrupo || 'Copa',
            produto: 'Cartao',
            etapaAquisicao: 'Rentabilizacao',
            perfilCredito: 'N/A',
            oferta: 'Padrao',
            promocional: 'Copa',
            evidence: `regra do XLSX Rentabilizacao Copa: ${segmento}`,
        };
    }

    let produto = 'Cartao';
    let family = `rentabilizacao:${normalizeKey(segmento)}`;
    if (journeyText.startsWith('JOR_INCENTIVO_AO_USO_')) {
        produto = 'Incentivo ao Uso';
        family = 'rentabilizacao:incentivo_ao_uso';
    } else if (journeyText.includes('INCENTIVO_AO_USO_AFINZ')) {
        produto = 'Incentivo ao Uso Afinz';
        family = 'rentabilizacao:incentivo_ao_uso_afinz';
    } else if (journeyText.startsWith('JOR_POS_TOMBAMENTO_DESBLOQUEIO_')) {
        produto = 'Desbloqueio Pos-Tombamento';
        family = 'rentabilizacao:desbloqueio_pos_tombamento';
    } else if (journeyText.includes('WELCOME_PLURIX')) {
        produto = 'Welcome Plurix Mais Amigo';
        family = 'rentabilizacao:welcome_plurix';
    } else if (journeyText.includes('WELCOME_AFINZ') || journeyText.startsWith('JOR_CARTAO_VC_WELCOME')) {
        produto = 'Welcome Afinz VC';
        family = 'rentabilizacao:welcome_afinz';
    } else if (journeyText.includes('DESBLOQUEIO_PLURIX')) {
        produto = 'Desbloqueio Plurix Mais Amigo';
        family = 'rentabilizacao:desbloqueio_plurix';
    } else if (journeyText.includes('DESBLOQUEIO_VC')) {
        produto = 'Desbloqueio VC';
        family = 'rentabilizacao:desbloqueio_vc';
    } else if (journeyText.startsWith('JOR_RENTABILIZACAO_')) {
        const rawProduct = journeyText
            .replace(/^JOR_RENTABILIZACAO_[A-Z0-9]+_/, '')
            .replace(/_[A-Z]{2,5}\d{2}$/, '');
        if (rawProduct && !['ATIVACAO', 'REATIVACAO', 'NOVOS', 'CARTONISTAS'].includes(rawProduct)) {
            produto = rentTitleCase(rawProduct);
            family = `rentabilizacao:${normalizeKey(rawProduct)}`;
        }
    }

    return {
        family,
        bu,
        parceiro: 'N/A',
        segmento,
        subgrupo: semanticClass.subgrupo || 'N/A',
        produto,
        etapaAquisicao: 'Rentabilizacao',
        perfilCredito: 'N/A',
        oferta: 'Padrao',
        promocional: 'N/A',
        evidence: `familia deterministica ${family}`,
    };
};

export const inferRentabilizacaoTaxonomy = (metric: MetricRow) =>
    inferRentabilizacaoContext(metric.journey, metric.activityName);

export interface RentHistoryIndex {
    byJourneyChannel: Map<string, SuggestionBucket>;
    byJourney: Map<string, SuggestionBucket>;
    byFamilyChannel: Map<string, SuggestionBucket>;
    byFamily: Map<string, SuggestionBucket>;
    bySegmentChannel: Map<string, SuggestionBucket>;
    byToken: Map<string, SuggestionBucket>;
    global: SuggestionBucket;
    existingSignatures: Set<string>;
    bySignature: Map<string, Record<string, any>[]>;
    rowCount: number;
}

export const RENT_FIELD_COLUMN: Record<SuggestionField, string> = {
    bu: 'BU',
    parceiro: 'Parceiro',
    segmento: 'Segmento',
    subgrupo: 'Subgrupos',
    etapaAquisicao: 'Etapa de aquisição',
    perfilCredito: 'Perfil de Crédito',
    produto: 'Produto',
    oferta: 'Oferta',
    promocional: 'Promocional',
};

export const addRawRowToBucket = (bucket: SuggestionBucket, row: Record<string, any>) => {
    const usedAt = toDateKey(row['Data de Disparo']);
    SUGGESTION_FIELDS.forEach((field) => {
        const value = String(row[RENT_FIELD_COLUMN[field]] ?? '').trim();
        if (!value || value === 'N/A') return;
        const counts = bucket.get(field);
        if (!counts) return;
        const current = counts.get(value);
        counts.set(value, {
            count: (current?.count ?? 0) + 1,
            lastUsed: !current?.lastUsed || usedAt > current.lastUsed ? usedAt : current.lastUsed,
        });
    });
};

export const buildRentHistoryIndex = (rows: Array<Record<string, any>>): RentHistoryIndex => {
    const index: RentHistoryIndex = {
        byJourneyChannel: new Map(),
        byJourney: new Map(),
        byFamilyChannel: new Map(),
        byFamily: new Map(),
        bySegmentChannel: new Map(),
        byToken: new Map(),
        global: createBucket(),
        existingSignatures: new Set(),
        bySignature: new Map(),
        rowCount: rows.length,
    };
    rows.forEach((row) => {
        const journey = String(row['jornada'] ?? '');
        const activityName = String(row['Activity name / Taxonomia'] ?? '');
        const rawCanal = row['Canal'];
        const channel = normalizeChannel(rawCanal);
        const journeyKey = normalizeKey(journey);
        const taxonomy = inferRentabilizacaoContext(journey, activityName);
        const dispatchSignature = buildDispatchSignature(activityName, rawCanal, row['Data de Disparo']);
        index.existingSignatures.add(dispatchSignature);
        const matches = index.bySignature.get(dispatchSignature) ?? [];
        matches.push(row);
        index.bySignature.set(dispatchSignature, matches);
        if (journeyKey) {
            addRawRowToBucket(bucketFor(index.byJourneyChannel, `${journeyKey}|${channel}`), row);
            addRawRowToBucket(bucketFor(index.byJourney, journeyKey), row);
        }
        addRawRowToBucket(bucketFor(index.byFamilyChannel, `${taxonomy.family}|${channel}`), row);
        addRawRowToBucket(bucketFor(index.byFamily, taxonomy.family), row);
        addRawRowToBucket(index.global, row);
        const segment = String(row['Segmento'] ?? '').trim();
        if (segment && channel !== 'Indefinido') {
            addRawRowToBucket(bucketFor(index.bySegmentChannel, `${segment}|${channel}`), row);
        }
        tokenizeForHistory(journey, activityName).forEach((token) =>
            addRawRowToBucket(bucketFor(index.byToken, `${taxonomy.family}|${token}`), row)
        );
    });
    return index;
};

export const emptyRentHistoryIndex = (): RentHistoryIndex => ({
    byJourneyChannel: new Map(),
    byJourney: new Map(),
    byFamilyChannel: new Map(),
    byFamily: new Map(),
    bySegmentChannel: new Map(),
    byToken: new Map(),
    global: createBucket(),
    existingSignatures: new Set(),
    bySignature: new Map(),
    rowCount: 0,
});

export const suggestRentFields = (
    metric: MetricRow,
    index: RentHistoryIndex,
    taxonomy: RentabilizacaoTaxonomy
): Partial<Record<SuggestionField, FieldSuggestion[]>> => {
    const journeyKey = normalizeKey(metric.journey);
    const journeyChannelKey = normalizeKey(`${journeyKey}|${metric.channel}`);
    const familyChannelKey = normalizeKey(`${taxonomy.family}|${metric.channel}`);
    const familyKey = normalizeKey(taxonomy.family);
    const segmentChannelKey = normalizeKey(`${taxonomy.segmento}|${metric.channel}`);
    const journeyChannelBucket = index.byJourneyChannel.get(journeyChannelKey);
    const journeyBucket = index.byJourney.get(journeyKey);
    const familyChannelBucket = index.byFamilyChannel.get(familyChannelKey);
    const familyBucket = index.byFamily.get(familyKey);
    const segmentChannelBucket = index.bySegmentChannel.get(segmentChannelKey);
    const tokenBuckets = tokenizeForHistory(metric.journey, metric.activityName)
        .map((token) => index.byToken.get(normalizeKey(`${taxonomy.family}|${token}`)))
        .filter((bucket): bucket is SuggestionBucket => Boolean(bucket));
    const deterministicValues: Partial<Record<SuggestionField, string>> = {
        bu: taxonomy.bu,
        parceiro: taxonomy.parceiro,
        segmento: taxonomy.segmento,
        subgrupo: taxonomy.subgrupo,
        etapaAquisicao: taxonomy.etapaAquisicao,
        perfilCredito: taxonomy.perfilCredito,
        produto: taxonomy.produto,
        oferta: taxonomy.oferta,
        promocional: taxonomy.promocional,
    };
    const isCompatible = (field: SuggestionField, suggestion: FieldSuggestion) => {
        if (taxonomy.family.startsWith('seguros:')) return true;
        const value = normalizeKey(suggestion.value);
        if (value.includes('seguro')) return false;
        if (field === 'bu' && value === 'seguros') return false;
        return true;
    };

    const result: Partial<Record<SuggestionField, FieldSuggestion[]>> = {};
    for (const field of SUGGESTION_FIELDS) {
        const deterministic: FieldSuggestion[] = deterministicValues[field]
            ? [{
                value: deterministicValues[field]!,
                confidence: 100,
                source: 'regra deterministica de rentabilizacao',
                count: 1,
                evidence: taxonomy.evidence,
                deterministic: true,
            } satisfies FieldSuggestion]
            : [];
        result[field] = [
            ...deterministic,
            ...topSuggestionsFromBucket(journeyChannelBucket, field, 'mesma jornada e canal', 96),
            ...topSuggestionsFromBucket(journeyBucket, field, 'mesma jornada', 90),
            ...topSuggestionsFromBucket(familyChannelBucket, field, 'mesma familia e canal', 86),
            ...topSuggestionsFromBucket(familyBucket, field, 'mesma familia de rentabilizacao', 82),
            ...topSuggestionsFromBucket(segmentChannelBucket, field, 'mesmo segmento e canal', 68),
            ...tokenBuckets.flatMap((bucket) => topSuggestionsFromBucket(bucket, field, 'mesma familia e token', 64)),
            ...topSuggestionsFromBucket(index.global, field, 'outros valores da base', 35),
        ].filter((suggestion) => isCompatible(field, suggestion)).reduce<FieldSuggestion[]>((acc, suggestion) => {
            if (!acc.some((item) => normalizeKey(item.value) === normalizeKey(suggestion.value))) acc.push(suggestion);
            return acc;
        }, []).slice(0, 10);
        if (deterministic[0]) {
            deterministic[0].historicalConflict = result[field]?.find((item) =>
                !item.deterministic && normalizeKey(item.value) !== normalizeKey(deterministic[0].value)
            )?.value;
        }
    }
    return result;
};

export const buildRentabilizacaoCandidate = (
    metric: MetricRow,
    importedJourneys: Map<string, Set<string>>,
    history: RentHistoryIndex,
    suggestionCache?: Map<string, Partial<Record<SuggestionField, FieldSuggestion[]>>>
): UpdateCandidate => {
    const taxonomy = inferRentabilizacaoTaxonomy(metric);
    // Suggestions depend on names/channel/taxonomy and the immutable history index,
    // not on dispatch date or metrics. Cache only inside this processing run.
    const suggestionKey = JSON.stringify([metric.journey, metric.activityName, metric.channel, taxonomy]);
    let suggestions = suggestionCache?.get(suggestionKey);
    if (!suggestions) {
        suggestions = suggestRentFields(metric, history, taxonomy);
        suggestionCache?.set(suggestionKey, suggestions);
    }
    // Reviewers may edit a candidate later; do not share its mutable suggestions.
    const fieldSuggestions = Object.fromEntries(Object.entries(suggestions).map(([field, values]) =>
        [field, values?.map(value => ({ ...value }))]
    ));
    const historicalRows = history.bySignature.get(metric.dispatchSignature) ?? [];
    const conflictJourneys = [...new Set([
        ...(importedJourneys.get(metric.dispatchSignature) ?? []),
        ...historicalRows.map(row => String(row.jornada ?? '').trim()),
    ].filter(journey => journey && normalizeKey(journey) !== normalizeKey(metric.journey)))];
    const hasCollision = conflictJourneys.length > 0 || historicalRows.length > 1
        || historicalRows.some(row => !normalizeKey(row.jornada));
    // Ja existe na tabela rentabilizacao_activities (mesma activity+canal+data)?
    const existingRow = hasCollision ? undefined : historicalRows[0];
    const existsInBase = Boolean(existingRow);
    const refreshDetails = rentMetricRefreshDetails(metric, existingRow);
    const hasMetricRefresh = refreshDetails.length > 0;
    const missingCritical = !metric.journey || !metric.activityName || !metric.date || metric.channel === 'Indefinido';
    const missingDispatchVolume = !hasDispatchVolume(metric);
    const status: CandidateStatus = missingCritical
        ? 'error'
        : hasCollision
            ? 'conflict'
            : missingDispatchVolume
                ? 'ignored'
                : existsInBase
                    // Ja gravado na base de rentabilizacao: nao reinserir.
                    ? (hasMetricRefresh ? 'ready' : 'duplicate')
                    : 'ready';

    return {
        ...metric,
        status,
        matchCount: 0,
        fieldToReview: missingCritical
            ? 'Chave'
            : hasCollision
                ? 'Jornada em conflito'
                : missingDispatchVolume
                    ? 'Disparo sem volume acionavel'
                    : existsInBase
                        ? (hasMetricRefresh ? 'Atualizar resultados' : 'Ja existe na base')
                        : 'Aprovar',
        suggestion: existsInBase
            ? (hasMetricRefresh
                ? `${refreshDetails.length} metricas mudaram desde a ultima atualizacao`
                : 'Disparo ja existe na base de rentabilizacao')
            : status === 'ready' ? 'Classificacao por regra de rentabilizacao' : 'Linha fora do upload automatico',
        confidence: hasMetricRefresh ? 100 : status === 'ready' ? 86 : 0,
        basis: missingCritical
            ? 'journey, canal ou data ausente'
            : hasCollision
                ? 'Mesma Activity, canal e data em jornadas diferentes'
                : missingDispatchVolume
                    ? 'Base Total e Base Acionavel precisam ser maiores que zero'
                    : existsInBase
                        ? (hasMetricRefresh
                            ? refreshDetails.map(({ field, previous, next }) => `${String(field)}: ${previous} -> ${next}`).join(' | ')
                            : 'activity, canal e data ja existem em rentabilizacao_activities')
                        : 'regras portadas do upload de rentabilizacao',
        accepted: false,
        // Dimensoes estruturais seguem a taxonomia deterministica. O historico
        // complementa campos operacionais sem misturar Seguros com outras familias.
        bu: taxonomy.bu,
        parceiro: taxonomy.parceiro,
        segmento: taxonomy.segmento,
        subgrupo: taxonomy.subgrupo,
        etapaAquisicao: taxonomy.etapaAquisicao,
        perfilCredito: taxonomy.perfilCredito,
        produto: taxonomy.produto,
        oferta: taxonomy.oferta,
        promocional: taxonomy.promocional ?? 'N/A',
        ordemDisparo: inferOrdemDisparo(metric.activityName),
        suggestions: fieldSuggestions,
        conflictJourneys,
        conflictReason: hasCollision ? 'Confirmar a identidade do disparo antes de aplicar.' : undefined,
        auditRequired: hasCollision,
        metricRefresh: hasMetricRefresh,
    };
};

const MIRROR_METRIC_FIELDS = ['sent', 'delivered', 'opens', 'clicks', 'proposals', 'approved', 'finalized', 'assisted', 'independent'] as const;

export interface BiMirrorResolution {
    metrics: MetricRow[];
    /** Assinatura do disparo -> jornadas descartadas por serem espelho da vencedora. */
    mirrored: Map<string, string[]>;
    droppedRows: number;
}

/**
 * O BI da Dinâmica repete o mesmo envio em toda jornada que tem uma activity com aquele nome:
 * cópia, teste, seedlist e jornada renomeada herdam os nomes da original. Mesma activity, canal,
 * data e os mesmos números em várias jornadas é um disparo só. Fica a jornada que já está gravada
 * para esse disparo; sem isso, a do grupo que manda sozinha em outros envios do arquivo (espelho
 * nunca manda sozinho), desde que tenha pelo menos 10x mais envios sozinha que a segunda.
 * Números diferentes, candidatas parecidas ou nenhuma: segue conflito.
 */
export function resolveBiJourneyMirrors(metrics: MetricRow[], history: RentHistoryIndex): BiMirrorResolution {
    const bySignature = new Map<string, MetricRow[]>();
    for (const row of metrics) {
        const list = bySignature.get(row.dispatchSignature);
        if (list) list.push(row); else bySignature.set(row.dispatchSignature, [row]);
    }
    // Quantos envios cada jornada tem sozinha no arquivo. Espelho tem zero.
    const standalone = new Map<string, number>();
    for (const group of bySignature.values()) {
        if (new Set(group.map((row) => normalizeKey(row.journey))).size !== 1) continue;
        const key = normalizeKey(group[0].journey);
        standalone.set(key, (standalone.get(key) ?? 0) + 1);
    }
    // A original manda sozinha muito mais que uma jornada de teste que disparou poucas vezes.
    const DOMINANCE = 10;
    const pickOrigin = (group: MetricRow[]) => {
        const ranked = group
            .map((row) => ({ row, alone: standalone.get(normalizeKey(row.journey)) ?? 0 }))
            .filter((item) => item.alone > 0)
            .sort((a, b) => b.alone - a.alone);
        if (ranked.length === 1) return ranked[0].row;
        if (ranked.length > 1 && ranked[0].alone >= DOMINANCE * ranked[1].alone) return ranked[0].row;
        return undefined;
    };
    const mirrored = new Map<string, string[]>();
    const kept: MetricRow[] = [];
    let droppedRows = 0;
    for (const [signature, group] of bySignature) {
        const journeys = new Set(group.map((row) => normalizeKey(row.journey)));
        if (journeys.size < 2) { kept.push(...group); continue; }
        const numbers = new Set(group.map((row) => MIRROR_METRIC_FIELDS.map((field) => row[field] ?? '').join('|')));
        let winner: MetricRow | undefined;
        if (numbers.size === 1) {
            const recorded = new Set((history.bySignature.get(signature) ?? []).map((row) => normalizeKey(row.jornada)).filter(Boolean));
            const byHistory = group.filter((row) => recorded.has(normalizeKey(row.journey)));
            winner = recorded.size > 0
                ? (byHistory.length === 1 && recorded.size === 1 ? byHistory[0] : undefined)
                : pickOrigin(group);
        }
        if (!winner) { kept.push(...group); continue; }
        kept.push(winner);
        droppedRows += group.length - 1;
        mirrored.set(signature, group.filter((row) => row !== winner).map((row) => row.journey));
    }
    return { metrics: kept, mirrored, droppedRows };
}

export const processRentabilizacaoDinamicaBI = (matrix: string[][], history: RentHistoryIndex = emptyRentHistoryIndex(), mappedJourneys?: ReadonlySet<string>): ProcessResult => {
    const warnings: string[] = [];
    const whatsappStart = findCell(matrix, ['journeyname (whatsapp)']);
    const emailStart = findCell(matrix, ['journeyname (e-mail)', 'journeyname (email)']);
    const smsStart = findCell(matrix, ['journeyname (sms)']);
    const pushStart = findCell(matrix, ['journeyname (push)']);

    const whatsappRows = readBlockRows(matrix, whatsappStart, 'rentabilizacao', 'WhatsApp', 'whatsapp', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5,
    }, mappedJourneys);
    const emailRows = readBlockRows(matrix, emailStart, 'rentabilizacao', 'E-mail', 'email', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5, clicks: 6,
    }, mappedJourneys);
    const smsRows = readBlockRows(matrix, smsStart, 'rentabilizacao', 'SMS', 'sms', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    }, mappedJourneys);
    const pushRows = readBlockRows(matrix, pushStart, 'rentabilizacao', 'Push', 'push', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    }, mappedJourneys);

    const blocks: BlockSummary[] = [
        { key: 'whatsapp', label: 'WhatsApp', detected: Boolean(whatsappStart), rows: whatsappRows.length },
        { key: 'email', label: 'E-mail', detected: Boolean(emailStart), rows: emailRows.length },
        { key: 'sms', label: 'SMS', detected: Boolean(smsStart), rows: smsRows.length },
        { key: 'push', label: 'Push', detected: Boolean(pushStart), rows: pushRows.length },
        { key: 'performance', label: 'Performance', detected: false, rows: 0 },
    ];
    const rawRows = [...whatsappRows, ...emailRows, ...smsRows, ...pushRows];
    const scopedRows = rawRows.filter((row) => !hasAquisicaoJourneyPrefix(row.journey));
    const ignoredOutOfScope = rawRows.length - scopedRows.length;
    if (ignoredOutOfScope > 0) {
        warnings.push(`${ignoredOutOfScope} linhas JOR_AQUISICAO/DISP_AQUISICAO foram ignoradas no modo rentabilizacao.`);
    }

    const metricMap = new Map<string, MetricRow>();
    for (const row of scopedRows) {
        mergeMetric(metricMap, {
            ...row,
            key: JSON.stringify([row.dispatchSignature, normalizeKey(row.journey)]),
        });
    }
    const resolution = resolveBiJourneyMirrors(Array.from(metricMap.values()), history);
    const metrics = resolution.metrics;
    if (resolution.droppedRows > 0) {
        warnings.push(`${resolution.droppedRows} linhas repetidas pelo BI em jornadas copiadas ou renomeadas foram unificadas em ${resolution.mirrored.size} disparos.`);
    }
    const importedJourneys = new Map<string, Set<string>>();
    for (const row of metrics) {
        const journeys = importedJourneys.get(row.dispatchSignature) ?? new Set<string>();
        journeys.add(row.journey);
        importedJourneys.set(row.dispatchSignature, journeys);
    }
    const suggestionCache = new Map<string, Partial<Record<SuggestionField, FieldSuggestion[]>>>();
    const candidates = metrics
        .map(row => {
            const candidate = buildRentabilizacaoCandidate(row, importedJourneys, history, suggestionCache);
            const mirrors = resolution.mirrored.get(row.dispatchSignature);
            return mirrors ? { ...candidate, basis: `${candidate.basis} · o BI repetiu este envio em: ${mirrors.join(', ')}` } : candidate;
        })
        .sort((a, b) => a.date.localeCompare(b.date) || a.status.localeCompare(b.status));
    const ignoredExisting = candidates.filter((candidate) => candidate.status === 'ignored').length;
    const tsv = candidates
        .filter(canUploadCandidate)
        .map(buildExcelRow)
        .join('\n');

    return {
        domain: 'rentabilizacao',
        blocks,
        metrics,
        candidates,
        ignoredExisting,
        importedRows: rawRows.length,
        tsv,
        warnings,
        insights: buildProcessInsights(rawRows, metrics, candidates, ignoredExisting),
    };
};

export const processDinamicaBI = (matrix: string[][], activities: Activity[]): ProcessResult => {
    const warnings: string[] = [];
    const historyIndex = buildHistoryIndex(activities);

    const whatsappStart = findCell(matrix, ['journeyname (whatsapp)']);
    const emailStart = findCell(matrix, ['journeyname (e-mail)', 'journeyname (email)']);
    const smsStart = findCell(matrix, ['journeyname (sms)']);
    const performanceStart = findCell(matrix, ['journey (resultados de performance)']);
    const pushStart = findCell(matrix, ['journeyname (push)']);

    const whatsappRows = readBlockRows(matrix, whatsappStart, 'aquisicao', 'WhatsApp', 'whatsapp', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5,
    });
    const emailRows = readBlockRows(matrix, emailStart, 'aquisicao', 'E-mail', 'email', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5, clicks: 6,
    });
    const smsRows = readBlockRows(matrix, smsStart, 'aquisicao', 'SMS', 'sms', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    });
    const performanceRows = readBlockRows(matrix, performanceStart, 'aquisicao', 'Indefinido', 'performance', {
        journey: 0, activity: 1, date: 2, channel: 3, proposals: 4, approved: 5, finalized: 6, assisted: 7, independent: 8,
    });
    const pushRows = readBlockRows(matrix, pushStart, 'aquisicao', 'Push', 'push', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    });

    const blocks: BlockSummary[] = [
        { key: 'whatsapp', label: 'WhatsApp', detected: Boolean(whatsappStart), rows: whatsappRows.length },
        { key: 'email', label: 'E-mail', detected: Boolean(emailStart), rows: emailRows.length },
        { key: 'sms', label: 'SMS', detected: Boolean(smsStart), rows: smsRows.length },
        { key: 'performance', label: 'Performance', detected: Boolean(performanceStart), rows: performanceRows.length },
        { key: 'push', label: 'Push', detected: Boolean(pushStart), rows: pushRows.length },
    ];

    const missingBlocks = blocks.filter((block) => !block.detected).map((block) => block.label);
    if (missingBlocks.length > 0) warnings.push(`Blocos nao detectados: ${missingBlocks.join(', ')}.`);

    const dispatchRows = collapseAbandonedCartDuplicates([...whatsappRows, ...emailRows, ...smsRows, ...pushRows]);
    const collapsedPerformanceRows = collapseAbandonedCartDuplicates(performanceRows);
    const rawRows = [...dispatchRows, ...collapsedPerformanceRows];
    const attribution = consolidateOperationalRows(dispatchRows, collapsedPerformanceRows);
    const allRows = attribution.rows;
    const scopedRows = allRows.filter(isAquisicaoMetric);
    const ignoredOutOfScope = allRows.length - scopedRows.length;
    if (ignoredOutOfScope > 0) {
        warnings.push(`${ignoredOutOfScope} linhas sem prefixo JOR_AQUISICAO/DISP_AQUISICAO foram ignoradas no modo aquisicao.`);
    }
    if (attribution.mergedResidual > 0 || attribution.ignoredResidual > 0) {
        warnings.push(`${attribution.mergedResidual} linhas residuais D0-D2 consolidadas no disparo real; ${attribution.ignoredResidual} linhas sem Base Total e Base Acionavel validas foram ignoradas.`);
    }
    if (attribution.mergedPerformance > 0 || attribution.ignoredPerformance > 0) {
        warnings.push(`${attribution.mergedPerformance} linhas de performance D0-D2 consolidadas no disparo real; ${attribution.ignoredPerformance} linhas de performance sem disparo acionavel foram ignoradas.`);
    }
    if (attribution.mergedEcred > 0) {
        warnings.push(`${attribution.mergedEcred} linhas ECRED-API consolidadas via caminho ecred (cartoes emitidos pelo canal ECRED atribuidos ao disparo de origem).`);
    }
    const journeyDayActivityCount = scopedRows.reduce((map, row) => {
        const key = buildJourneyDayKey(row.journey, row.channel, row.date);
        if (!map.has(key)) map.set(key, new Set<string>());
        map.get(key)!.add(normalizeKey(row.activityName));
        return map;
    }, new Map<string, Set<string>>());
    const multiActivityGroups = Array.from(journeyDayActivityCount.values()).filter((set) => set.size > 1).length;
    if (multiActivityGroups > 0) {
        warnings.push(`${multiActivityGroups} grupos jornada/canal/data tinham multiplas activities e foram preservados como disparos separados.`);
    }
    const importedSignatureJourneys = scopedRows.reduce((map, row) => {
        if (!map.has(row.dispatchSignature)) map.set(row.dispatchSignature, new Set<string>());
        map.get(row.dispatchSignature)!.add(row.journey);
        return map;
    }, new Map<string, Set<string>>());

    let ignoredExisting = 0;
    const metricMap = new Map<string, MetricRow>();
    scopedRows.forEach((row) => {
        if (historyIndex.existingKeys.has(row.key)) {
            ignoredExisting += 1;
        }
        mergeMetric(metricMap, row);
    });

    const metrics = Array.from(metricMap.values());
    const importedKeyCount = metrics.reduce((map, row) => {
        map.set(row.key, 1);
        return map;
    }, new Map<string, number>());
    const candidates = propagateGroupEmissions(metrics
        .map((row) => {
            try {
                return buildCandidate(row, historyIndex, importedKeyCount, importedSignatureJourneys);
            } catch (error) {
                return buildErrorCandidate(row, error);
            }
        }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.status.localeCompare(b.status) || b.confidence - a.confidence);

    const tsv = candidates
        .filter((candidate) => candidate.status !== 'duplicate' && candidate.status !== 'error' && candidate.status !== 'ignored')
        .map(buildExcelRow)
        .join('\n');

    return {
        domain: 'aquisicao',
        blocks,
        metrics,
        candidates,
        ignoredExisting,
        importedRows: rawRows.length,
        tsv,
        warnings,
        insights: buildProcessInsights(
            scopedRows,
            metrics,
            candidates,
            ignoredExisting,
            attribution.ignoredPerformance,
            attribution.ignoredResidual
        ),
    };
};

export const mergeBlockSummaries = (left: BlockSummary[], right: BlockSummary[]): BlockSummary[] => {
    const byKey = new Map<SourceBlock, BlockSummary>();
    [...left, ...right].forEach((block) => {
        const current = byKey.get(block.key);
        byKey.set(block.key, {
            ...block,
            detected: Boolean(current?.detected || block.detected),
            rows: (current?.rows ?? 0) + block.rows,
        });
    });
    return Array.from(byKey.values());
};

export const processTotalCrmDinamicaBI = (
    matrix: string[][],
    activities: Activity[],
    rentHistory: RentHistoryIndex,
    mappedJourneys?: ReadonlySet<string>
): ProcessResult => {
    const aquisicao = processDinamicaBI(matrix, activities);
    const rentabilizacao = processRentabilizacaoDinamicaBI(matrix, rentHistory, mappedJourneys);
    const candidates = [...aquisicao.candidates, ...rentabilizacao.candidates]
        .sort((a, b) =>
            a.date.localeCompare(b.date)
            || a.domain.localeCompare(b.domain)
            || a.status.localeCompare(b.status)
            || b.confidence - a.confidence
        );
    const metrics = [...aquisicao.metrics, ...rentabilizacao.metrics];
    const insights = buildProcessInsights(
        metrics,
        metrics,
        candidates,
        aquisicao.ignoredExisting + rentabilizacao.ignoredExisting,
        aquisicao.insights.orphanPerformanceRows + rentabilizacao.insights.orphanPerformanceRows,
        aquisicao.insights.invalidVolumeRows + rentabilizacao.insights.invalidVolumeRows
    );

    return {
        domain: 'total_crm',
        blocks: mergeBlockSummaries(aquisicao.blocks, rentabilizacao.blocks),
        metrics,
        candidates,
        ignoredExisting: aquisicao.ignoredExisting + rentabilizacao.ignoredExisting,
        importedRows: aquisicao.importedRows + rentabilizacao.importedRows,
        tsv: candidates.filter(canUploadCandidate).map(buildExcelRow).join('\n'),
        warnings: [...aquisicao.warnings, ...rentabilizacao.warnings],
        insights: {
            ...insights,
            rawRows: aquisicao.insights.rawRows + rentabilizacao.insights.rawRows,
            actionableDispatches: aquisicao.insights.actionableDispatches + rentabilizacao.insights.actionableDispatches,
        },
    };
};

export const decodeDelimitedFile = (buffer: ArrayBuffer) => {
    const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const win1252 = new TextDecoder('windows-1252', { fatal: false }).decode(buffer);
    const brokenScore = (text: string) => (text.match(/�/g)?.length ?? 0)
        + (text.match(/Ã|Â/g)?.length ?? 0);
    return brokenScore(win1252) < brokenScore(utf8) ? win1252 : utf8;
};

export const safeProcessDinamicaBI = (
    matrix: string[][],
    activities: Activity[],
    domain: UpdateFlow,
    rentHistory: RentHistoryIndex,
    mappedJourneys?: ReadonlySet<string>
): { result: ProcessResult | null; error?: ParseDebugInfo } => {
    try {
        return {
            result: domain === 'total_crm'
                ? processTotalCrmDinamicaBI(matrix, activities, rentHistory, mappedJourneys)
                : domain === 'rentabilizacao'
                    ? processRentabilizacaoDinamicaBI(matrix, rentHistory, mappedJourneys)
                    : processDinamicaBI(matrix, activities),
        };
    } catch (error: any) {
        return {
            result: null,
            error: {
                stage: 'processDinamicaBI',
                matrixRows: matrix.length,
                firstRowColumns: matrix[0]?.length ?? 0,
                message: error?.message || 'Erro desconhecido ao processar a Dinamica BI.',
                stack: error?.stack,
            },
        };
    }
};
