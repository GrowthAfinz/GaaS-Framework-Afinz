import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
import { intelligentUpdateService } from '../../services/intelligentUpdateService';
import type { Activity } from '../../types/framework';
import { classifyRentabilizacao } from '../../utils/rentabilizacaoClassify';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'ECRED-API' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';
type CandidateFilter = CandidateStatus | 'update' | 'all';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';
type UpdateDomain = 'aquisicao' | 'rentabilizacao';
type TextReviewField = 'bu' | 'parceiro' | 'segmento' | 'subgrupo' | 'etapaAquisicao' | 'perfilCredito' | 'produto' | 'oferta' | 'promocional';
type NumericReviewField = 'ordemDisparo';
type ReviewField = TextReviewField | NumericReviewField;
type SuggestionField = Exclude<ReviewField, 'ordemDisparo'>;
type ProcessingStage = 'idle' | 'reading' | 'indexing' | 'detecting' | 'reviewing';

type SuggestionStat = { count: number; lastUsed?: string };
type SuggestionBucket = Map<SuggestionField, Map<string, SuggestionStat>>;

interface HistoryIndex {
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

interface BlockSummary {
    key: SourceBlock;
    label: string;
    detected: boolean;
    rows: number;
}

interface FieldSuggestion {
    value: string;
    confidence: number;
    source: string;
    count: number;
    lastUsed?: string;
    evidence?: string;
    deterministic?: boolean;
    historicalConflict?: string;
}

interface ManualOverride {
    field: ReviewField;
    previousValue: string | number | undefined;
    nextValue: string | number | undefined;
    mode: 'single' | 'bulk';
    changedAt: string;
}

interface ProcessInsights {
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

interface MetricRow {
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

interface UpdateCandidate extends MetricRow {
    status: CandidateStatus;
    matchCount: number;
    fieldToReview: string;
    suggestion: string;
    confidence: number;
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
    manualOverrides?: ManualOverride[];
}

const BLOCKED_UPLOAD_STATUSES: CandidateStatus[] = ['duplicate', 'error', 'ignored', 'conflict'];
const canUploadCandidate = (candidate: Pick<UpdateCandidate, 'status'>) =>
    !BLOCKED_UPLOAD_STATUSES.includes(candidate.status);

interface ProcessResult {
    domain: UpdateDomain;
    blocks: BlockSummary[];
    metrics: MetricRow[];
    candidates: UpdateCandidate[];
    ignoredExisting: number;
    importedRows: number;
    tsv: string;
    warnings: string[];
    insights: ProcessInsights;
}

interface FileMeta {
    name: string;
    rows: number;
    type: string;
}

interface ParseDebugInfo {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    stage?: string;
    matrixRows?: number;
    firstRowColumns?: number;
    message: string;
    stack?: string;
}

const buildProcessInsights = (
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

const FRAMEWORK_HEADERS = [
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

const STATUS_LABEL: Record<CandidateStatus, string> = {
    ready: 'Pronto',
    review: 'Revisar',
    new: 'Novo',
    duplicate: 'Duplicado',
    conflict: 'Conflito',
    error: 'Erro',
    ignored: 'Ignorado',
};
const STATUS_CLASS: Record<CandidateStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
    conflict: 'bg-orange-50 text-orange-700 border-orange-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    ignored: 'bg-slate-100 text-slate-500 border-slate-200',
};
const UPDATE_STATUS_CLASS = 'bg-cyan-50 text-cyan-700 border-cyan-200';

const candidateStatusLabel = (candidate: UpdateCandidate) =>
    candidate.metricRefresh ? 'Atualização' : STATUS_LABEL[candidate.status];

const REVIEW_FIELDS: Array<{ key: ReviewField; label: string; type?: 'number' }> = [
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

const SUGGESTION_FIELDS: SuggestionField[] = [
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

const REVIEW_PAGE_SIZE = 100;

const PROCESSING_STAGE_LABEL: Record<ProcessingStage, string> = {
    idle: 'Aguardando arquivo',
    reading: 'Lendo arquivo',
    indexing: 'Organizando historico',
    detecting: 'Detectando novidades',
    reviewing: 'Preparando revisao',
};

const DOMAIN_LABEL: Record<UpdateDomain, string> = {
    aquisicao: 'Aquisição',
    rentabilizacao: 'Rentabilização',
};

const DOMAIN_TARGET_TABLE: Record<UpdateDomain, string> = {
    aquisicao: 'activities',
    rentabilizacao: 'rentabilizacao_activities',
};

const SEGMENT_BY_TAXONOMY_CODE: Record<string, string> = {
    abn: 'Abandono',
    ac: 'Acordo Certo',
    adq: 'Adquirencia',
    alv: 'Alvorada',
    apr: 'Aprovados',
    anc: 'Aprovados nao convertidos',
    atl: 'Ativo com limite',
    atv: 'Ativo Geral',
    bp: 'Base_Proprietaria',
    bsp: 'Base_Proprietaria',
    bb: 'Bem Barato',
    abb: 'Ativo Bem Barato',
    car: 'Carrinho Abandonado',
    blq: 'Cartao Bloqueado',
    cart: 'Cartonista',
    emi: 'Clientes Emissores',
    club: 'Clube',
    cp: 'Credito Pessoal',
    rtv: 'Reativacao',
    cap: 'Desenrola Contemplado aVista aPrazo',
    dne: 'Desenrola Nao Elegiveis',
    dia: 'Dia',
    err: 'Erro',
    frm: 'Farmacia',
    freq: 'Frequentes e recorrentes',
    ina: 'Inadimplente',
    inv: 'Investidores',
    ipr: 'Ip roxo',
    leal: 'Leal',
    ami: 'Mais Amigo',
    nsa: 'Nao se aplica',
    ngd: 'Negados',
    expl: 'Novo explorador e ocasional',
    nov: 'Novos',
    org: 'Organico',
    bpc: 'Parceiro Bom Pra Credito',
    srsa: 'Parceiro Serasa',
    tbm: 'Pos Tombamento',
    pre: 'Pre Analisados',
    chu: 'Pre churn e churn',
    pro: 'Prospect',
    in1: 'Publico 1 - Investidores',
    pf1: 'Publico 1 - PF Atrasado',
    pj1: 'Publico 1 - PJ Negado',
    pf2: 'Publico 2 - PF Em dia - Lim Baixo',
    pj2: 'Publico 2 - PJ Aceito',
    pf3: 'Publico 3 - PF Em dia - Lim Alto',
    quo: 'Quod',
    rec: 'Recencia',
    seg: 'Segurados',
    sem: 'Sem Parar',
    pao: 'Super Pao',
    tst: 'Teste',
    tds: 'Todos',
    upo: 'Upgrade de Oferta',
    nvp: 'Venda Nova Platinum',
    vnd: 'Vendedor',
};

const normalize = (value: unknown) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

const normalizeKey = (value: unknown) => normalize(value).replace(/\s+/g, ' ');

const parseNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;

    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const toDateKey = (value: unknown): string => {
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

const formatDateBR = (dateKey: string) => {
    if (!dateKey) return '';
    const [year, month, day] = dateKey.split('-');
    return `${day}/${month}/${year}`;
};

const generateSafra = (dateKey: string) => {
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const date = new Date(`${dateKey}T12:00:00`);
    if (!Number.isFinite(date.getTime())) return '';
    return `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;
};

const normalizeChannel = (value: unknown): Channel => {
    const text = normalize(value);
    if (text.includes('ecred')) return 'ECRED-API';
    if (text.includes('whatsapp') || text.includes('wpp')) return 'WhatsApp';
    if (text.includes('mail') || text === 'email') return 'E-mail';
    if (text.includes('sms')) return 'SMS';
    if (text.includes('push')) return 'Push';
    return 'Indefinido';
};

const taxonomyTokens = (value: unknown) =>
    normalizeKey(value)
        .split(/[_\s-]+/)
        .filter(Boolean);

const normalizedOriginTokens = (value: unknown) =>
    taxonomyTokens(value).flatMap((token) => {
        const cadenceMatch = token.match(/^d\d+(.*)$/);
        return cadenceMatch?.[1] ? [token, cadenceMatch[1]] : [token];
    });

const inferDeterministicDimensions = (metric: Pick<MetricRow, 'journey' | 'activityName'>) => {
    const activityTokens = normalizedOriginTokens(metric.activityName);
    const journeyTokens = normalizedOriginTokens(metric.journey);
    const findOrigin = (tokens: string[]) => {
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
        if (tokens.includes('bem') && tokens.includes('barato') || tokens.includes('b2b2c') && tokens.includes('bb')) {
            return { parceiro: 'Bem Barato', evidence: 'bem_barato' };
        }
        return null;
    };

    const activityOrigin = findOrigin(activityTokens);
    const journeyOrigin = activityOrigin ? null : findOrigin(journeyTokens);
    const origin = activityOrigin ?? journeyOrigin;
    return {
        parceiro: origin?.parceiro,
        source: activityOrigin ? 'token determinístico da activity' : journeyOrigin ? 'token determinístico da jornada' : undefined,
        evidence: origin?.evidence,
    };
};

const inferSegmentFromTaxonomy = (value: unknown) => {
    const tokens = taxonomyTokens(value);
    for (const token of tokens) {
        const segment = SEGMENT_BY_TAXONOMY_CODE[token];
        if (segment) return segment;
    }
    return '';
};

const canonicalChannel = (channel: Channel | string) => {
    const normalized = normalizeChannel(channel);
    return normalized === 'Indefinido' ? String(channel ?? '') : normalized;
};

const PLURIX_CART_INDEPENDENT_JOURNEY = 'JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE';
const PLURIX_CART_ASSISTED_JOURNEY = 'JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO';

const isPlurixCartActivity = (activityName: unknown) =>
    normalizeKey(activityName).includes('carrinhoabandonado');

const canonicalPlurixCartJourney = (journey: unknown, activityName: unknown) => {
    const journeyKey = normalizeKey(journey);
    const isPlurixCartJourney = journeyKey.includes('aquisicao_plurix_carrinho_abandonado');
    if (!isPlurixCartJourney || journeyKey.includes('teste')) return String(journey ?? '').trim();

    return normalizeKey(activityName).includes('carrinhoabandonadoassistido')
        ? PLURIX_CART_ASSISTED_JOURNEY
        : PLURIX_CART_INDEPENDENT_JOURNEY;
};

const canonicalActivityJourney = (activity: Activity) => {
    const activityName = activity.raw?.['Activity name / Taxonomia'] || activity.id;
    return canonicalPlurixCartJourney(activity.jornada, activityName);
};

const buildNoveltyKey = (journey: unknown, activityName: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(journey)}|${normalizeKey(activityName)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

const buildJourneyDayKey = (journey: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(journey)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

const buildDispatchSignature = (activityName: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(activityName)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

const isSameJourneyFamily = (currentJourney: unknown, otherJourney: unknown) => {
    const current = normalizeKey(currentJourney);
    const other = normalizeKey(otherJourney);
    return current === other;
};

const parseClipboardMatrix = (text: string): string[][] => {
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

const findCell = (matrix: string[][], terms: string[]) => {
    const wanted = terms.map(normalizeKey);
    for (let row = 0; row < Math.min(matrix.length, 12); row += 1) {
        for (let col = 0; col < (matrix[row]?.length ?? 0); col += 1) {
            const cell = normalizeKey(matrix[row][col]);
            if (wanted.includes(cell)) return { row, col };
        }
    }
    return null;
};

const getCell = (matrix: string[][], row: number, col: number) => matrix[row]?.[col] ?? '';

const looksLikeDate = (value: string) => Boolean(toDateKey(value));
const looksLikeActivityName = (value: string) => {
    const text = normalizeKey(value);
    return text.includes('_') || text.includes('afz') || text.includes('plu') || text.includes('jor_');
};

const mergeMetric = (map: Map<string, MetricRow>, row: MetricRow) => {
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

const readBlockRows = (
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
    }
) => {
    if (!start) return [];
    const rows: MetricRow[] = [];

    for (let row = start.row + 1; row < matrix.length; row += 1) {
        const rawJourney = getCell(matrix, row, start.col + offsets.journey);
        const activityName = getCell(matrix, row, start.col + offsets.activity);
        const journey = canonicalPlurixCartJourney(rawJourney, activityName);
        const date = toDateKey(getCell(matrix, row, start.col + offsets.date));
        const rowChannel = offsets.channel !== undefined
            ? normalizeChannel(getCell(matrix, row, start.col + offsets.channel))
            : channel;

        if (!activityName && !journey && !date) continue;
        if (!activityName || !journey || !date || rowChannel === 'Indefinido') continue;
        if (!looksLikeActivityName(activityName) || !looksLikeDate(getCell(matrix, row, start.col + offsets.date))) continue;

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

const activityDateKey = (activity: Activity) => toDateKey(activity.dataDisparo);

const isValidActivity = (activity: Activity | null | undefined): activity is Activity =>
    Boolean(activity && typeof activity === 'object');

const getRaw = (activity: Activity, keys: string[]) => {
    for (const key of keys) {
        const value = activity.raw?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    return '';
};

const activityField = (activity: Activity, field: SuggestionField) => {
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

const activityMetricValue = (activity: Activity, field: keyof MetricRow): number => {
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

const REFRESHABLE_METRIC_FIELDS: Array<keyof MetricRow> = [
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

const metricRefreshDetails = (metric: MetricRow, existing?: Activity) => {
    if (!existing) return [];
    return REFRESHABLE_METRIC_FIELDS.flatMap((field) => {
        const next = metric[field];
        if (typeof next !== 'number' || !Number.isFinite(next)) return [];
        const previous = activityMetricValue(existing, field);
        return previous === next ? [] : [{ field, previous, next }];
    });
};

const inferTaxonomy = (metric: MetricRow) => {
    const text = normalizeKey(`${metric.journey} ${metric.activityName}`);
    const journeyText = normalizeKey(metric.journey);
    const tokens = taxonomyTokens(`${metric.journey} ${metric.activityName}`);
    const deterministic = inferDeterministicDimensions(metric);
    const isNovosCopa = journeyText.includes('novos') && journeyText.includes('copa');
    const hasBasePropriaSignal = tokens.some((token) =>
        ['bp', 'bsp'].includes(token)
    ) || /base[_\s-]+propri(a|etaria)/.test(text);

    if (hasBasePropriaSignal) {
        return { bu: 'B2C', parceiro: 'Proprietaria', segmento: 'Base_Proprietaria' };
    }

    const segmentByCode = inferSegmentFromTaxonomy(`${metric.journey} ${metric.activityName}`);

    const bu = text.includes('plurix') || text.includes('_plu_') || text.startsWith('plu_')
        ? 'Plurix'
        : text.includes('b2b2c') || text.includes('_bb_') || text.includes('bem barato')
            ? 'B2B2C'
            : text.includes('seguro')
                ? 'Seguros'
                : 'B2C';

    const parceiro = deterministic.parceiro || (text.includes('serasa') || text.includes('ecred') || text.includes('_srs_')
        ? 'Serasa'
        : text.includes('bem barato') || text.includes('_bb_') || text.includes('b2b2c_bb')
            ? 'Bem Barato'
            : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
                ? 'Proprietaria'
                : bu === 'Plurix'
                    ? 'N/A'
                    : 'N/A');

    const segmento = isNovosCopa
        ? 'Novos'
        : segmentByCode
        || (text.includes('carrinho') || text.includes('_car_')
            ? 'Carrinho Abandonado'
            : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
                ? 'Base Proprietaria'
                : text.includes('crm')
                    ? 'CRM'
                    : 'CRM');

    return { bu, parceiro, segmento, subgrupo: isNovosCopa ? 'Copa' : undefined };
};

const emptySuggestions = SUGGESTION_FIELDS.reduce<Partial<Record<SuggestionField, FieldSuggestion[]>>>((acc, field) => {
    acc[field] = [];
    return acc;
}, {});

const suggestionsFor = (
    suggestions: Partial<Record<SuggestionField, FieldSuggestion[]>> | undefined,
    field: SuggestionField
) => suggestions?.[field] ?? [];

const createBucket = (): SuggestionBucket =>
    SUGGESTION_FIELDS.reduce<SuggestionBucket>((bucket, field) => {
        bucket.set(field, new Map<string, SuggestionStat>());
        return bucket;
    }, new Map<SuggestionField, Map<string, SuggestionStat>>());

const bucketFor = (index: Map<string, SuggestionBucket>, key: string) => {
    const normalizedKey = normalizeKey(key);
    const existing = index.get(normalizedKey);
    if (existing) return existing;
    const bucket = createBucket();
    index.set(normalizedKey, bucket);
    return bucket;
};

const addActivityToBucket = (bucket: SuggestionBucket, activity: Activity) => {
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

const tokenizeForHistory = (...values: unknown[]) =>
    Array.from(new Set(
        normalizeKey(values.join(' '))
            .split(/[_\s-]+/)
            .filter((token) => token.length >= 4 && !['cartao', 'campanha', 'jornada', 'teste'].includes(token))
    )).slice(0, 12);

const buildHistoryIndex = (activities: Activity[]): HistoryIndex => {
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

const topSuggestionsFromBucket = (
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

// Computa sugestoes de TODOS os campos de uma vez. Antes, suggestFromHistory era
// chamada 1x por campo (9x), refazendo inferTaxonomy + tokenize + lookups a cada vez.
// Agora o contexto (taxonomia, buckets, tokens) e calculado uma unica vez por linha.
const suggestAllFields = (
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
    for (const field of SUGGESTION_FIELDS) {
        const deterministic = inferDeterministicDimensions(metric);
        const deterministicSuggestion: FieldSuggestion[] = field === 'parceiro' && deterministic.parceiro
            ? [{
                value: deterministic.parceiro,
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

// ── Eleicao da jornada canonica quando o BI duplica a mesma activity+canal+data ──
type CanonicalRole = 'winner' | 'superseded' | 'ambiguous';

const MONTH_RANK: Record<string, number> = {
    jan: 1, fev: 2, mar: 3, abr: 4, abri: 4, mai: 5, maio: 5, jun: 6,
    jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};
const PERIOD_TOKEN_RE = /(jan|fev|mar|abri|abr|maio|mai|jun|jul|ago|set|out|nov|dez)\s*(\d{4}|\d{2})/gi;
const VARIANT_JUNK_RE = /\(teste\)|\bteste\b|\(interno\)|\binterno\b|\(v\d\)|_v\d(?:\b|_)|\(copiar\)|rascunho|nova jornada/i;

const journeyPeriodRank = (journey: string): number => {
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

// "tronco" da jornada sem o token de periodo: identifica a campanha base
const journeyStem = (journey: string): string =>
    normalizeKey(journey).replace(PERIOD_TOKEN_RE, ' ').replace(/\s+/g, ' ').trim();

// Recebe as jornadas distintas que colidem na mesma assinatura (arquivo) e
// devolve o papel de cada uma: winner (canonica/gravavel) | superseded | ambiguous.
// knownJourneys = jornadas que ja existem na base (para preferir nome novo no caso 2).
const electCanonicalJourney = (
    journeys: string[],
    knownJourneys: Set<string>
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

// Quando o BI duplica a mesma activity+canal+data em varias jornadas, cada candidato
// recebe as emissoes da SUA jornada (via consolidacao por jornada). Para que TODOS os
// candidatos da colisao exibam o resultado da activity (Conflito/Revisar), propagamos o
// MAX de cada metrica de resultado para todos do grupo. Max evita dupla contagem do
// mesmo cartao reportado sob nomes diferentes. So a vencedora (status nao-conflito)
// e gravada no banco; as demais apenas exibem.
const GROUP_RESULT_FIELDS: Array<keyof MetricRow> = ['proposals', 'approved', 'finalized', 'assisted', 'independent'];
const ALL_METRIC_FIELDS: Array<keyof MetricRow> = [
    'sent', 'delivered', 'opens', 'clicks', ...GROUP_RESULT_FIELDS,
];

const collapsePlurixCartDuplicates = (rows: MetricRow[]) => {
    const result: MetricRow[] = [];
    const grouped = new Map<string, MetricRow>();

    rows.forEach((row) => {
        if (!isPlurixCartActivity(row.activityName)) {
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

const propagateGroupEmissions = (candidates: UpdateCandidate[]): UpdateCandidate[] => {
    const groups = new Map<string, UpdateCandidate[]>();
    candidates.forEach((candidate) => {
        const list = groups.get(candidate.dispatchSignature);
        if (list) list.push(candidate); else groups.set(candidate.dispatchSignature, [candidate]);
    });
    groups.forEach((group) => {
        if (group.length < 2) return; // sem colisao de jornada
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

const buildCandidate = (
    metric: MetricRow,
    historyIndex: HistoryIndex,
    importedKeyCount: Map<string, number>,
    importedSignatureJourneys: Map<string, Set<string>>
): UpdateCandidate => {
    const taxonomy = inferTaxonomy(metric);
    const hasDeterministicBasePropria = taxonomy.bu === 'B2C' && taxonomy.parceiro === 'Proprietaria' && taxonomy.segmento === 'Base_Proprietaria';
    const hasDeterministicNovosCopa = taxonomy.segmento === 'Novos' && taxonomy.subgrupo === 'Copa';
    const fieldSuggestions = suggestAllFields(metric, historyIndex);

    const valueFor = (field: SuggestionField, fallback: string) => suggestionsFor(fieldSuggestions, field)[0]?.value || fallback;
    const confidences = SUGGESTION_FIELDS
        .filter((field) => !['bu', 'segmento', 'produto'].includes(field))
        .map((field) => suggestionsFor(fieldSuggestions, field)[0]?.confidence ?? 0);
    const averageConfidence = Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length);
    const duplicateCount = importedKeyCount.get(metric.key) ?? 0;
    const importedJourneys = importedSignatureJourneys.get(metric.dispatchSignature) ?? new Set<string>();
    const historicalSignatureMatches = historyIndex.byDispatchSignature.get(metric.dispatchSignature) ?? [];
    const compatibleHistoricalMatches = historicalSignatureMatches.filter(
        (activity) => isSameJourneyFamily(metric.journey, canonicalActivityJourney(activity))
    );

    // Atualizacao automatica exige a mesma jornada canonica. A mesma
    // activity+canal+data em outra jornada pode ser um novo disparo criado a
    // partir de uma duplicacao, portanto nao deve herdar o registro anterior.
    const existingDispatch = [...compatibleHistoricalMatches].sort((left, right) => {
        const target = normalizeKey(metric.journey);
        const score = (activity: Activity) => {
            const canonicalJourney = normalizeKey(canonicalActivityJourney(activity));
            const rawJourney = normalizeKey(activity.jornada);
            if (canonicalJourney === target) return 4;
            if (rawJourney === target) return 3;
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
    const hasMetricRefresh = refreshDetails.length > 0;
    const collidesWithAnotherJourney = historicalSignatureMatches.length > 0 && !existsInBase;

    // Duplicacao do BI: a mesma activity+canal+data vem com varios nomes de jornada
    // (antigo + novo). Elege a jornada canonica; as demais viram conflito.
    const fileJourneys = Array.from(new Set([metric.journey, ...Array.from(importedJourneys)])).filter(Boolean);
    const canonicalRoles = electCanonicalJourney(fileJourneys, historyIndex.knownJourneys);
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
            : (fileSuperseded || fileAmbiguous)
                // Nome antigo/variante do BI, ou colisao sem vencedor claro => conflito (nunca grava no escuro)
                ? 'conflict'
                : existsInBase
                    ? (hasMetricRefresh ? 'ready' : 'duplicate')
                    : missingHumanSuggestion
                        ? 'new'
                        // BP/Base Propria e deterministico (taxonomia forca BU/Parceiro/Segmento);
                        // com todos os campos humanos cobertos pelo historico, vira Pronto mesmo
                        // sem historico de mesma-jornada (que e o unico que ultrapassa 80%).
                        : (averageConfidence >= 80 || hasDeterministicBasePropria)
                            ? 'ready'
                            : 'review';

    return {
        ...metric,
        status,
        matchCount: 0,
        fieldToReview: missingCritical
            ? 'Chave'
            : duplicateCount > 1
                ? 'Duplicidade'
                : fileSuperseded
                    ? 'Jornada antiga (BI)'
                    : fileAmbiguous
                        ? 'Colisao de jornada'
                        : existsInBase
                            ? (hasMetricRefresh ? 'Atualizar resultados' : 'Ja existe na base')
                            : collidesWithAnotherJourney
                                ? 'Novo disparo em outra jornada'
                            : missingHumanSuggestion
                                ? 'Campos humanos'
                                : status === 'ready'
                                    ? 'Aprovar'
                                    : 'Sugestoes',
        suggestion: fileSuperseded
            ? `Nome antigo/variante do BI; canonica: ${winnerJourney ?? '-'}`
            : fileAmbiguous
                ? 'Colisao de jornada sem vencedor claro'
                : existsInBase
                    ? (hasMetricRefresh
                        ? `${refreshDetails.length} metricas mudaram desde a ultima atualizacao`
                        : 'Disparo ja existe na base de dados')
                    : collidesWithAnotherJourney
                        ? 'Mesma activity, canal e data existem em outra jornada; tratado como novo disparo'
                    : status === 'ready'
                        ? 'Sugestoes historicas fortes'
                        : 'Revisar campos sugeridos',
        confidence: hasMetricRefresh
            ? 100
            : missingCritical || duplicateCount > 1 || fileSuperseded || fileAmbiguous || existsInBase ? 0 : averageConfidence,
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
                                ? refreshDetails.map(({ field, previous, next }) => `${String(field)}: ${previous} -> ${next}`).join(' | ')
                                : 'activity, canal, data e jornada ja existem na base de dados')
                            : collidesWithAnotherJourney
                                ? `assinatura operacional ja usada em outra jornada: ${historicalSignatureMatches.map((activity) => activity.jornada).join(', ')}`
                            : 'sugestoes por taxonomia e historico',
        accepted: false,
        domain: metric.domain,
        bu: hasDeterministicBasePropria ? taxonomy.bu : valueFor('bu', taxonomy.bu),
        parceiro: valueFor('parceiro', taxonomy.parceiro),
        segmento: hasDeterministicBasePropria || hasDeterministicNovosCopa ? taxonomy.segmento : valueFor('segmento', taxonomy.segmento),
        subgrupo: hasDeterministicNovosCopa ? taxonomy.subgrupo : valueFor('subgrupo', 'N/A'),
        etapaAquisicao: valueFor('etapaAquisicao', ''),
        perfilCredito: valueFor('perfilCredito', ''),
        produto: valueFor('produto', 'Cartao'),
        oferta: valueFor('oferta', ''),
        promocional: valueFor('promocional', ''),
        ordemDisparo: undefined,
        suggestions: fieldSuggestions,
        conflictJourneys,
        // matchedActivity forca UPDATE no service (asDbActivityId) em vez de INSERT,
        // evitando duplicar disparo que ja existe na base. Nao setar para nomes
        // antigos/variantes (superseded) ou colisoes ambiguas: esses nunca devem gravar.
        matchedActivity: (fileSuperseded || fileAmbiguous) ? undefined : existingDispatch,
        metricRefresh: hasMetricRefresh,
        conflictReason: fileSuperseded
            ? 'superseded_file_journey'
            : fileAmbiguous
                ? 'ambiguous_file_journey'
                : existsInBase
                    ? 'existing_dispatch'
                    : undefined,
    };
};

const buildErrorCandidate = (metric: MetricRow, error: unknown): UpdateCandidate => {
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

const valueOrBlank = (value: unknown) => value === undefined || value === null ? '' : String(value);
const textOrFallback = (value: unknown, fallback = 'N/A') => {
    const text = valueOrBlank(value).trim();
    return text || fallback;
};

const applyApprovalDefaults = (candidate: UpdateCandidate): UpdateCandidate => ({
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

const buildExcelRow = (candidate: UpdateCandidate) => {
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

const toCsv = (tsv: string) =>
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

const positive = (value?: number) => (value ?? 0) > 0;
const dayDiff = (fromDate: string, toDate: string) => {
    const from = new Date(`${fromDate}T12:00:00`);
    const to = new Date(`${toDate}T12:00:00`);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return Number.POSITIVE_INFINITY;
    return Math.round((to.getTime() - from.getTime()) / 86400000);
};

const attributionKey = (row: MetricRow) => `${normalizeKey(row.activityName)}|${canonicalChannel(row.channel)}`;
const hasDispatchVolume = (row: MetricRow) => positive(row.sent) && positive(row.delivered);
const hasConversionMetric = (row: MetricRow) =>
    positive(row.proposals) || positive(row.approved) || positive(row.finalized) || positive(row.assisted) || positive(row.independent);
const hasEngagementMetric = (row: MetricRow) => positive(row.opens) || positive(row.clicks);
const isAttributionResidual = (row: MetricRow) =>
    row.sourceBlock !== 'performance' && !hasDispatchVolume(row) && !hasConversionMetric(row);

const addMetricValue = (target: MetricRow, source: MetricRow, field: keyof MetricRow) => {
    const value = source[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
    const current = target[field];
    if (value === 0) {
        if (typeof current !== 'number') (target as any)[field] = 0;
        return;
    }
    (target as any)[field] = (typeof current === 'number' ? current : 0) + value;
};

const consolidateOperationalRows = (dispatchRows: MetricRow[], performanceRows: MetricRow[]) => {
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

    const findAnchor = (row: MetricRow) => {
        const candidates = (anchorsByAttributionKey.get(attributionKey(row)) ?? [])
            .map((candidate) => ({ candidate, diff: dayDiff(candidate.date, row.date) }))
            .filter((item) => item.diff >= 0 && item.diff <= 2);

        // Preferir ancora com a MESMA jornada do PERF. Sem isso, quando o BI duplica
        // a mesma activity+canal+data em jornadas diferentes (ex: ABRI26 e MAIO26),
        // todas as linhas PERF caem na primeira ancora e a jornada canonica fica com
        // 0 cartoes. Com a preferencia por jornada, cada PERF vai para o seu disparo.
        const sameJourney = candidates.filter((item) =>
            row.journey && isSameJourneyFamily(item.candidate.journey, row.journey)
        );
        const pool = sameJourney.length > 0 ? sameJourney : candidates;
        const match = pool.sort((a, b) => a.diff - b.diff)[0]?.candidate;

        if (match) return match;

        // Fallback ECRED-API: o resultado de conversao do caminho ECRED chega no bloco
        // PERF com canal='ECRED-API', mas o disparo original e WPP/SMS. Busca pelo
        // activityName sem considerar o canal, dentro da janela D0-D2.
        if (isEcredChannel(row.channel)) {
            const ecredCandidates = (anchorsByActivityName.get(normalizeKey(row.activityName)) ?? [])
                .map((candidate) => ({ candidate, diff: dayDiff(candidate.date, row.date) }))
                .filter((item) => item.diff >= 0 && item.diff <= 2);
            // Mesma preferencia por jornada do caminho principal: quando o BI duplica a
            // activity em varias jornadas, cada PERF ECRED-API vai para a ancora da SUA
            // jornada (evita somar 3x o mesmo cartao numa unica jornada).
            const ecredSameJourney = ecredCandidates.filter((item) =>
                row.journey && isSameJourneyFamily(item.candidate.journey, row.journey)
            );
            const ecredPool = ecredSameJourney.length > 0 ? ecredSameJourney : ecredCandidates;
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

    anchors.forEach((anchor) => {
        GROUP_RESULT_FIELDS.forEach((field) => {
            if (typeof anchor[field] !== 'number') (anchor as any)[field] = 0;
        });
    });

    return { rows: anchors, mergedResidual, ignoredResidual, mergedPerformance, mergedEcred, ignoredPerformance };
};

const hasAquisicaoJourneyPrefix = (journey: unknown) => {
    const j = normalizeKey(journey);
    return j.startsWith('jor_aquisicao')
        || j.startsWith('disp_aquisicao')
        || j.startsWith('disparo_aquisicao');
};

const isAquisicaoMetric = (metric: MetricRow) => {
    return hasAquisicaoJourneyPrefix(metric.journey);
};

interface RentabilizacaoTaxonomy {
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

const rentTitleCase = (value: string) =>
    value
        .toLowerCase()
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const inferRentabilizacaoContext = (journey: unknown, activityName: unknown): RentabilizacaoTaxonomy => {
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

const inferRentabilizacaoTaxonomy = (metric: MetricRow) =>
    inferRentabilizacaoContext(metric.journey, metric.activityName);

// ── Inteligencia de historico para Rentabilizacao ───────────────────────────────
// Aprende, da tabela rentabilizacao_activities, o mapeamento jornada/segmento -> dimensoes
// e reaplica ao subir novos disparos (consistente com o que o XLSX de Rentabilizacao classifica).
interface RentHistoryIndex {
    byJourneyChannel: Map<string, SuggestionBucket>;
    byJourney: Map<string, SuggestionBucket>;
    byFamilyChannel: Map<string, SuggestionBucket>;
    byFamily: Map<string, SuggestionBucket>;
    bySegmentChannel: Map<string, SuggestionBucket>;
    byToken: Map<string, SuggestionBucket>;
    global: SuggestionBucket;
    existingSignatures: Set<string>;
    rowCount: number;
}

const RENT_FIELD_COLUMN: Record<SuggestionField, string> = {
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

const addRawRowToBucket = (bucket: SuggestionBucket, row: Record<string, any>) => {
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

const buildRentHistoryIndex = (rows: Array<Record<string, any>>): RentHistoryIndex => {
    const index: RentHistoryIndex = {
        byJourneyChannel: new Map(),
        byJourney: new Map(),
        byFamilyChannel: new Map(),
        byFamily: new Map(),
        bySegmentChannel: new Map(),
        byToken: new Map(),
        global: createBucket(),
        existingSignatures: new Set(),
        rowCount: rows.length,
    };
    rows.forEach((row) => {
        const journey = String(row['jornada'] ?? '');
        const activityName = String(row['Activity name / Taxonomia'] ?? '');
        const rawCanal = row['Canal'];
        const channel = normalizeChannel(rawCanal);
        const journeyKey = normalizeKey(journey);
        const taxonomy = inferRentabilizacaoContext(journey, activityName);
        index.existingSignatures.add(buildDispatchSignature(activityName, rawCanal, row['Data de Disparo']));
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

const emptyRentHistoryIndex = (): RentHistoryIndex => ({
    byJourneyChannel: new Map(),
    byJourney: new Map(),
    byFamilyChannel: new Map(),
    byFamily: new Map(),
    bySegmentChannel: new Map(),
    byToken: new Map(),
    global: createBucket(),
    existingSignatures: new Set(),
    rowCount: 0,
});

const suggestRentFields = (
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
        const deterministic = deterministicValues[field]
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

const buildRentabilizacaoCandidate = (
    metric: MetricRow,
    importedKeyCount: Map<string, number>,
    history: RentHistoryIndex
): UpdateCandidate => {
    const taxonomy = inferRentabilizacaoTaxonomy(metric);
    const fieldSuggestions = suggestRentFields(metric, history, taxonomy);
    const duplicateCount = importedKeyCount.get(metric.key) ?? 0;
    // Ja existe na tabela rentabilizacao_activities (mesma activity+canal+data)?
    const existsInBase = history.existingSignatures.has(metric.dispatchSignature);
    const missingCritical = !metric.journey || !metric.activityName || !metric.date || metric.channel === 'Indefinido';
    const missingDispatchVolume = !hasDispatchVolume(metric);
    const status: CandidateStatus = missingCritical
        ? 'error'
        : duplicateCount > 1
            ? 'duplicate'
            : missingDispatchVolume
                ? 'ignored'
                : existsInBase
                    // Ja gravado na base de rentabilizacao: nao reinserir.
                    ? 'duplicate'
                    : 'ready';

    return {
        ...metric,
        status,
        matchCount: 0,
        fieldToReview: missingCritical
            ? 'Chave'
            : duplicateCount > 1
                ? 'Duplicidade'
                : missingDispatchVolume
                    ? 'Disparo sem volume acionavel'
                    : existsInBase
                        ? 'Ja existe na base'
                        : 'Aprovar',
        suggestion: existsInBase
            ? 'Disparo ja existe na base de rentabilizacao'
            : status === 'ready' ? 'Classificacao por regra de rentabilizacao' : 'Linha fora do upload automatico',
        confidence: status === 'ready' ? 86 : 0,
        basis: missingCritical
            ? 'journey, canal ou data ausente'
            : duplicateCount > 1
                ? 'mais de uma linha no arquivo com a mesma chave'
                : missingDispatchVolume
                    ? 'Base Total e Base Acionavel precisam ser maiores que zero'
                    : existsInBase
                        ? 'activity, canal e data ja existem em rentabilizacao_activities'
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
        ordemDisparo: undefined,
        suggestions: fieldSuggestions,
        conflictJourneys: [],
        conflictReason: undefined,
    };
};

const processRentabilizacaoDinamicaBI = (matrix: string[][], history: RentHistoryIndex): ProcessResult => {
    const warnings: string[] = [];
    const whatsappStart = findCell(matrix, ['journeyname (whatsapp)']);
    const emailStart = findCell(matrix, ['journeyname (e-mail)', 'journeyname (email)']);
    const smsStart = findCell(matrix, ['journeyname (sms)']);
    const pushStart = findCell(matrix, ['journeyname (push)']);

    const whatsappRows = readBlockRows(matrix, whatsappStart, 'rentabilizacao', 'WhatsApp', 'whatsapp', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5,
    });
    const emailRows = readBlockRows(matrix, emailStart, 'rentabilizacao', 'E-mail', 'email', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5, clicks: 6,
    });
    const smsRows = readBlockRows(matrix, smsStart, 'rentabilizacao', 'SMS', 'sms', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    });
    const pushRows = readBlockRows(matrix, pushStart, 'rentabilizacao', 'Push', 'push', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    });

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
    scopedRows.forEach((row) => {
        mergeMetric(metricMap, {
            ...row,
            key: row.dispatchSignature,
        });
    });
    const metrics = Array.from(metricMap.values());
    const importedKeyCount = scopedRows.reduce((map, row) => {
        map.set(row.dispatchSignature, (map.get(row.dispatchSignature) ?? 0) + 1);
        return map;
    }, new Map<string, number>());
    const candidates = metrics
        .map((row) => buildRentabilizacaoCandidate(row, importedKeyCount, history))
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

const processDinamicaBI = (matrix: string[][], activities: Activity[]): ProcessResult => {
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

    const dispatchRows = collapsePlurixCartDuplicates([...whatsappRows, ...emailRows, ...smsRows, ...pushRows]);
    const collapsedPerformanceRows = collapsePlurixCartDuplicates(performanceRows);
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
    const importedKeyCount = scopedRows.reduce((map, row) => {
        map.set(row.key, (map.get(row.key) ?? 0) + 1);
        return map;
    }, new Map<string, number>());
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

const parseFileToMatrix = (file: File): Promise<string[][]> => new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        Papa.parse<string[]>(file, {
            worker: true,
            skipEmptyLines: false,
            delimiter: ext === 'tsv' ? '\t' : '',
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    reject(new Error(results.errors[0]?.message || 'Erro ao interpretar o arquivo.'));
                    return;
                }
                resolve(results.data
                    .filter((row): row is string[] => Array.isArray(row))
                    .map((row) => row.map((cell) => String(cell ?? '').trim())));
            },
            error: (error) => reject(new Error(error.message || 'Erro ao ler o arquivo.')),
        });
        return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.onload = (event) => {
        try {
            if (ext === 'xlsx' || ext === 'xls') {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames.find((name) => normalizeKey(name).includes('dinamica')) ?? workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) throw new Error('Nenhuma planilha encontrada no arquivo.');
                const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: '' });
                resolve(rows
                    .filter((row): row is unknown[] => Array.isArray(row))
                    .map((row) => row.map((cell) => String(cell ?? '').trim())));
                return;
            }

            reject(new Error('Formato não suportado pelo parser.'));
        } catch (error: any) {
            reject(new Error(error?.message || 'Erro ao processar o arquivo.'));
        }
    };

    reader.readAsArrayBuffer(file);
});

const safeProcessDinamicaBI = (
    matrix: string[][],
    activities: Activity[],
    domain: UpdateDomain,
    rentHistory: RentHistoryIndex
): { result: ProcessResult | null; error?: ParseDebugInfo } => {
    try {
        return { result: domain === 'rentabilizacao' ? processRentabilizacaoDinamicaBI(matrix, rentHistory) : processDinamicaBI(matrix, activities) };
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

const nextFrame = () => new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
});

const sleep = (ms: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
});

const waitForLoadingPaint = async () => {
    await nextFrame();
    await nextFrame();
    await sleep(80);
};

const keepLoadingVisible = async (startedAt: number, minimumMs = 900) => {
    const elapsed = performance.now() - startedAt;
    if (elapsed < minimumMs) await sleep(minimumMs - elapsed);
};

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
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
            top: Math.min(window.innerHeight - 360, rect.bottom + 4),
            left: Math.min(window.innerWidth - 320, rect.left),
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className={`text-2xl font-bold ${tone}`}>{value}</div>
        <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
);

export const IntelligentFrameworkUpdate: React.FC = () => {
    const { activities, viewSettings } = useAppStore();
    const activeDomain: UpdateDomain = viewSettings.frente === 'rentabilizacao' ? 'rentabilizacao' : 'aquisicao';
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [statusFilter, setStatusFilter] = useState<CandidateFilter>('all');
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<ParseDebugInfo | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastRunId, setLastRunId] = useState<string | null>(null);
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
    const [reviewMode, setReviewMode] = useState<'operation' | 'dimensions' | 'metrics'>('operation');
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkField, setBulkField] = useState<ReviewField>('promocional');
    const [bulkValue, setBulkValue] = useState('');
    const [bulkScope, setBulkScope] = useState<'selected' | 'filtered'>('selected');
    const [undoSnapshot, setUndoSnapshot] = useState<UpdateCandidate[] | null>(null);
    const setActiveDomain = (_domain: UpdateDomain) => undefined;
    const previousDomainRef = useRef<UpdateDomain>(activeDomain);

    useEffect(() => {
        if (previousDomainRef.current === activeDomain) return;
        previousDomainRef.current = activeDomain;
        setResult(null);
        setFileMeta(null);
        setSelectedKeys(new Set());
        setReviewOpen(false);
        setFlowChooserOpen(false);
    }, [activeDomain]);

    const candidates = result?.candidates ?? [];
    const activeCandidates = candidates.filter((candidate) => candidate.status !== 'ignored');
    const isRentReview = (result?.domain ?? activeDomain) === 'rentabilizacao';
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

    const filteredCandidates = useMemo(() => {
        const term = normalizeKey(reviewSearchTerm);
        return candidates.filter((candidate) => {
            const statusMatches = statusFilter === 'all'
                || (statusFilter === 'update' && candidate.metricRefresh)
                || (statusFilter === 'ready' && candidate.status === 'ready' && !candidate.metricRefresh)
                || (statusFilter !== 'update' && statusFilter !== 'ready' && candidate.status === statusFilter);
            if (!statusMatches) return false;
            if (reviewStartDate && candidate.date < reviewStartDate) return false;
            if (reviewEndDate && candidate.date > reviewEndDate) return false;
            if (!term) return true;

            const haystack = normalizeKey([
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
    }, [candidates, statusFilter, reviewSearchTerm, reviewStartDate, reviewEndDate]);
    const reviewPageCount = Math.max(1, Math.ceil(filteredCandidates.length / REVIEW_PAGE_SIZE));
    const pagedCandidates = useMemo(() => {
        const safePage = Math.min(reviewPage, reviewPageCount);
        const start = (safePage - 1) * REVIEW_PAGE_SIZE;
        return filteredCandidates.slice(start, start + REVIEW_PAGE_SIZE);
    }, [filteredCandidates, reviewPage, reviewPageCount]);
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
    const copyCandidates = selectedCandidatesForCopy.length > 0 ? selectedCandidatesForCopy : exportableCandidates;
    // Disparos que ja existem na base (matchedActivity) ou em conflito (nome antigo do BI,
    // colisao, renomeacao) nao devem virar linha nova no Excel: a gravacao deles e UPDATE
    // ou revisao manual, nunca append. Excluidos da copia TSV por padrao.
    const reviewedTsv = useMemo(
        () => copyCandidates
            .filter((candidate) => !candidate.matchedActivity && candidate.status !== 'conflict')
            .map(buildExcelRow).join('\n'),
        [copyCandidates]
    );
    const uploadCandidates = useMemo(() => {
        const source = exportableCandidates.length > 0 ? exportableCandidates : selectedCandidatesForCopy;
        return source.map((candidate) => ({ ...applyApprovalDefaults(candidate), accepted: true }));
    }, [exportableCandidates, selectedCandidatesForCopy]);
    const uploadUsesSelection = exportableCandidates.length === 0 && selectedCandidatesForCopy.length > 0;
    const uploadBlocks = useMemo(() => {
        const unique = new Set<SourceBlock>();
        uploadCandidates.forEach((candidate) => candidate.sourceBlocks.forEach((block) => unique.add(block)));
        return Array.from(unique);
    }, [uploadCandidates]);
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

        const processingStartedAt = performance.now();
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
            await waitForLoadingPaint();
            const matrix = await parseFileToMatrix(file);
            if (matrix.length === 0) throw new Error('Arquivo vazio.');
            setProcessingStage('indexing');
            await nextFrame();
            await sleep(40);
            // Para rentabilizacao, carrega o historico completo da base para (1) deduplicar
            // o que ja existe e (2) herdar dimensoes (BU/Segmento/Etapa) por jornada/segmento.
            let rentHistory = emptyRentHistoryIndex();
            if (activeDomain === 'rentabilizacao') {
                try {
                    const historyRows = await intelligentUpdateService.fetchDomainHistory('rentabilizacao');
                    rentHistory = buildRentHistoryIndex(historyRows);
                } catch (fetchError) {
                    console.warn('[Atualizacao Inteligente] Falha ao carregar historico de rentabilizacao', fetchError);
                }
            }
            setProcessingStage('detecting');
            await nextFrame();
            await sleep(40);
            const processedResult = safeProcessDinamicaBI(matrix, activities, activeDomain, rentHistory);
            if (!processedResult.result) {
                const debug = {
                    ...processedResult.error,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: ext,
                    message: processedResult.error?.message || 'Erro ao processar arquivo.',
                };
                console.error('[Atualizacao Inteligente] Falha ao processar arquivo', debug);
                setDebugInfo(debug);
                setDragError(`Erro ao processar o arquivo (${debug.stage || 'parser'}): ${debug.message}`);
                return;
            }
            const processed = processedResult.result;
            setProcessingStage('reviewing');
            await nextFrame();
            await sleep(40);
            setResult(processed);
            setFileMeta({ name: file.name, rows: matrix.length, type: ext ?? 'arquivo' });
            setReviewPage(1);
            setStatusFilter('all');
            setSelectedKeys(new Set());
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
            await keepLoadingVisible(processingStartedAt);
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
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                candidate.confidence >= 80 && canUploadCandidate(candidate)
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
                    targetTable: DOMAIN_TARGET_TABLE[result.domain],
                },
            });

            setLastRunId(saved.runId);
            setSaveMessage({
                type: 'success',
                text: `${saved.candidateCount} candidatos auditados. ${saved.appliedCount} linhas confirmadas na base de dados.`,
            });
            setReviewOpen(false);
            setUploadConfirmOpen(false);
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
                : candidate
        );
        setResult((current) => current ? {
            ...current,
            candidates: candidatesForRun,
            tsv: candidatesForRun.filter((candidate) => candidate.accepted).map(buildExcelRow).join('\n'),
        } : current);
        await handleSaveRun(candidatesForRun.filter((candidate) => uploadKeys.has(candidate.key)));
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10 space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700 shadow-inner">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Atualizacao Inteligente</h3>
                            <p className="text-sm text-slate-500">
                                Fluxo definido pelo toggle superior: {DOMAIN_LABEL[activeDomain]}. Destino: {DOMAIN_TARGET_TABLE[activeDomain]}.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
                            saveMessage.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                            {saveMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            <span>{saveMessage.text}</span>
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
                            <StatCard label="Atualizações" value={summary.update} tone="text-cyan-700" />
                            <StatCard label="Revisao" value={summary.review} tone="text-amber-700" />
                            <StatCard label="Novas" value={summary.fresh} tone="text-blue-700" />
                            <StatCard label="Duplicadas" value={summary.duplicate} tone="text-purple-700" />
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
            </div>

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
                            {(['aquisicao', 'rentabilizacao'] as const).map((domain) => (
                                <button
                                    key={domain}
                                    type="button"
                                    onClick={() => {
                                        setActiveDomain(domain);
                                        setResult(null);
                                        setFileMeta(null);
                                        setSelectedKeys(new Set());
                                        setFlowChooserOpen(false);
                                    }}
                                    className={`rounded-xl border px-4 py-4 text-left transition ${
                                        activeDomain === domain
                                            ? 'border-cyan-500 bg-cyan-50'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-bold text-slate-900">Atualizar {DOMAIN_LABEL[domain]}</div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                            {DOMAIN_TARGET_TABLE[domain]}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {domain === 'aquisicao'
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
                                            <h3 className="text-lg font-bold text-slate-900">Revisao de {DOMAIN_LABEL[result.domain]}</h3>
                                            <p className="text-xs text-slate-500">{fileMeta.name} - destino: {DOMAIN_TARGET_TABLE[result.domain]}</p>
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
                            <div className="mt-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-sm text-cyan-950">
                                <strong>{result.insights.rawRows.toLocaleString('pt-BR')} linhas</strong> da Dinâmica BI foram consolidadas em{' '}
                                <strong>{result.insights.uniqueJourneys} jornadas</strong>,{' '}
                                <strong>{result.insights.uniqueActivities} activities</strong> e{' '}
                                <strong>{result.insights.newDispatches} novos disparos</strong>.
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-8">
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
                                            onClick={() => setReviewMode(mode)}
                                            className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                                                reviewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                    {Object.entries(result.insights.originCounts).map(([origin, count]) => (
                                        <span key={origin} className="rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600">
                                            {origin}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'update', 'ready', 'review', 'new', 'conflict', 'duplicate', 'error', 'ignored'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setReviewPage(1);
                                        }}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                            statusFilter === status
                                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {status === 'all' ? 'Todos' : status === 'update' ? 'Atualização' : STATUS_LABEL[status]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`flex flex-col gap-2 border-b px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${
                            selectedKeys.size > 0 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600'
                        }`}>
                                <label className="inline-flex items-center gap-2 font-bold">
                                    <input
                                        type="checkbox"
                                        checked={filteredCandidates.length > 0 && filteredCandidates.every((candidate) => selectedKeys.has(candidate.key))}
                                        onChange={() => {
                                            const allSelected = filteredCandidates.length > 0 && filteredCandidates.every((candidate) => selectedKeys.has(candidate.key));
                                            setSelectedKeys((current) => {
                                                const next = new Set(current);
                                                filteredCandidates.forEach((candidate) => allSelected ? next.delete(candidate.key) : next.add(candidate.key));
                                                return next;
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    {selectedKeys.size > 0
                                        ? `${selectedKeys.size} selecionados`
                                        : `Selecionar todos os ${filteredCandidates.length} filtrados`}
                                </label>
                                <div className="flex flex-wrap gap-2">
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
                                Mostrando {pagedCandidates.length} de {filteredCandidates.length} candidatos{reviewSearchTerm ? ` para "${reviewSearchTerm}"` : ' neste filtro'}. A revisao carrega em paginas para manter a tela responsiva.
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
                                        <th className="w-[32%] px-3 py-3 font-bold">Disparo</th>
                                        {reviewMode === 'operation' && <>
                                            <th className="w-[31%] px-3 py-3 font-bold">Classificação</th>
                                            <th className="w-[18%] px-3 py-3 font-bold">Revisão</th>
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
                                                <div className="truncate font-semibold text-slate-900" title={candidate.journey}>{candidate.journey}</div>
                                                <div className="mt-1 truncate text-slate-500" title={candidate.activityName}>{candidate.activityName}</div>
                                                <div className="mt-2 flex gap-2 text-[10px] font-bold text-slate-500">
                                                    <span>{candidate.channel}</span>
                                                    <span>{formatDateBR(candidate.date)}</span>
                                                </div>
                                            </td>
                                            {reviewMode === 'operation' && <>
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
                                            </>}
                                            {reviewMode === 'dimensions' && <>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
                                                        <span><b>BU:</b> {candidate.bu}</span>
                                                        <span><b>Parceiro:</b> {candidate.parceiro}</span>
                                                        <span><b>Segmento:</b> {candidate.segmento}</span>
                                                        <span><b>Subgrupo:</b> {candidate.subgrupo}</span>
                                                        <span><b>Etapa:</b> {candidate.etapaAquisicao}</span>
                                                        <span><b>Perfil:</b> {candidate.perfilCredito}</span>
                                                        <span><b>Produto:</b> {candidate.produto}</span>
                                                        <span><b>Oferta:</b> {candidate.oferta}</span>
                                                        <span><b>Promo:</b> {candidate.promocional}</span>
                                                    </div>
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

                        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-500">
                                {selectedCandidatesForCopy.length > 0
                                    ? `${selectedCandidatesForCopy.length} linhas selecionadas. Se não houver aceitas, elas serão usadas no upload.`
                                    : exportableCandidates.length > 0 && blockingCount > 0
                                        ? `${exportableCandidates.length} linhas aceitas; ${blockingCount} pendentes ficam fora da atualizacao.`
                                        : blockingCount > 0
                                            ? `${blockingCount} linhas ainda precisam de aceite, edicao ou ignorar.`
                                        : `${exportableCandidates.length} linhas prontas para Excel e base de dados.`}
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
                                <StatCard label="Serão gravadas" value={uploadCandidates.length} tone="text-blue-700" />
                                <StatCard label="Pendentes fora" value={Math.max(0, candidates.length - uploadCandidates.length - summary.ignored)} tone="text-amber-700" />
                                <StatCard label="Duplicadas" value={summary.duplicate} tone="text-purple-700" />
                                <StatCard label="Erros" value={summary.error} tone="text-red-700" />
                            </div>

                            {uploadUsesSelection && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-800">
                                    Nenhuma linha aceita foi encontrada. As {uploadCandidates.length} linhas selecionadas serão aprovadas e enviadas neste upload.
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-600">
                                <div className="font-bold text-slate-900">Conteúdo do upload</div>
                                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                    <span>Blocos:</span>
                                    <span className="font-semibold text-slate-800">{uploadBlocks.length > 0 ? uploadBlocks.join(', ') : 'N/A'}</span>
                                    <span>Defaults aplicados:</span>
                                    <span className="font-semibold text-slate-800">N/A, Padrao, Cartao</span>
                                    <span>Auditoria:</span>
                                    <span className="font-semibold text-slate-800">run, métricas e candidatos</span>
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
