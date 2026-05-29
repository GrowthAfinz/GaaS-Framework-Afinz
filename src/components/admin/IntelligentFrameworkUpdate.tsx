import React, { useMemo, useRef, useState } from 'react';
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
    Loader2,
    Search,
    Sparkles,
    Upload,
    Wand2,
    X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { intelligentUpdateService } from '../../services/intelligentUpdateService';
import type { Activity } from '../../types/framework';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'error' | 'ignored';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';
type HumanField = 'subgrupo' | 'etapaAquisicao' | 'perfilCredito' | 'oferta' | 'promocional';

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
}

interface MetricRow {
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
    suggestions: Record<HumanField, FieldSuggestion[]>;
}

interface ProcessResult {
    blocks: BlockSummary[];
    metrics: MetricRow[];
    candidates: UpdateCandidate[];
    ignoredExisting: number;
    importedRows: number;
    tsv: string;
    warnings: string[];
}

interface FileMeta {
    name: string;
    rows: number;
    type: string;
}

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
    error: 'Erro',
    ignored: 'Ignorado',
};

const STATUS_CLASS: Record<CandidateStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    ignored: 'bg-slate-100 text-slate-500 border-slate-200',
};

const HUMAN_FIELDS: Array<{ key: HumanField; label: string }> = [
    { key: 'subgrupo', label: 'Subgrupo' },
    { key: 'etapaAquisicao', label: 'Etapa' },
    { key: 'perfilCredito', label: 'Perfil' },
    { key: 'oferta', label: 'Oferta' },
    { key: 'promocional', label: 'Promocional' },
];

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
    if (text.includes('whatsapp') || text.includes('wpp')) return 'WhatsApp';
    if (text.includes('mail') || text === 'email') return 'E-mail';
    if (text.includes('sms')) return 'SMS';
    if (text.includes('push')) return 'Push';
    return 'Indefinido';
};

const canonicalChannel = (channel: Channel | string) => {
    const normalized = normalizeChannel(channel);
    return normalized === 'Indefinido' ? String(channel ?? '') : normalized;
};

const buildNoveltyKey = (journey: unknown, channel: unknown, date: unknown) =>
    `${normalizeKey(journey)}|${canonicalChannel(String(channel))}|${toDateKey(date)}`;

const parseClipboardMatrix = (text: string): string[][] => {
    const cleanText = text.replace(/\r/g, '').trim();
    if (!cleanText) return [];

    if (cleanText.includes('\t')) {
        return cleanText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split('\t').map((cell) => cell.trim()));
    }

    const parsed = Papa.parse<string[]>(cleanText, { skipEmptyLines: true });
    if (parsed.errors.length > 0 || !Array.isArray(parsed.data)) {
        return cleanText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split(';').map((cell) => cell.trim()));
    }

    return parsed.data.map((row) => row.map((cell) => String(cell ?? '').trim()));
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
        const journey = getCell(matrix, row, start.col + offsets.journey);
        const activityName = getCell(matrix, row, start.col + offsets.activity);
        const date = toDateKey(getCell(matrix, row, start.col + offsets.date));
        const rowChannel = offsets.channel !== undefined
            ? normalizeChannel(getCell(matrix, row, start.col + offsets.channel))
            : channel;

        if (!activityName && !journey && !date) continue;
        if (!activityName || !journey || !date || rowChannel === 'Indefinido') continue;

        const key = buildNoveltyKey(journey, rowChannel, date);
        rows.push({
            key,
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

const getRaw = (activity: Activity, keys: string[]) => {
    for (const key of keys) {
        const value = activity.raw?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    return '';
};

const activityField = (activity: Activity, field: HumanField | 'bu' | 'parceiro' | 'segmento') => {
    switch (field) {
        case 'bu': return activity.bu || getRaw(activity, ['BU']);
        case 'parceiro': return activity.parceiro || getRaw(activity, ['Parceiro']);
        case 'segmento': return activity.segmento || getRaw(activity, ['Segmento']);
        case 'subgrupo': return activity.subgrupo || getRaw(activity, ['Subgrupos']);
        case 'etapaAquisicao': return activity.etapaAquisicao || getRaw(activity, ['Etapa de aquisicao', 'Etapa de aquisição']);
        case 'perfilCredito': return activity.perfilCredito || getRaw(activity, ['Perfil de Credito', 'Perfil de Crédito']);
        case 'oferta': return activity.oferta || getRaw(activity, ['Oferta']);
        case 'promocional': return activity.promocional || getRaw(activity, ['Promocional']);
        default: return '';
    }
};

const inferTaxonomy = (metric: MetricRow) => {
    const text = normalizeKey(`${metric.journey} ${metric.activityName}`);

    const bu = text.includes('plurix') || text.includes('_plu_') || text.startsWith('plu_')
        ? 'Plurix'
        : text.includes('b2b2c') || text.includes('_bb_') || text.includes('bem barato')
            ? 'B2B2C'
            : text.includes('seguro')
                ? 'Seguros'
                : 'B2C';

    const parceiro = text.includes('serasa') || text.includes('_srs_')
        ? 'Serasa'
        : text.includes('bem barato') || text.includes('_bb_') || text.includes('b2b2c_bb')
            ? 'Bem Barato'
            : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
                ? 'Proprietaria'
                : bu === 'Plurix'
                    ? 'N/A'
                    : 'N/A';

    const segmento = text.includes('carrinho') || text.includes('_car_')
        ? 'Abandonados'
        : text.includes('base proprietaria') || text.includes('_bsp_') || text.includes('_bp_')
            ? 'Base_Proprietaria'
            : text.includes('crm')
                ? 'CRM'
                : 'CRM';

    return { bu, parceiro, segmento };
};

const scoreSimilarity = (metric: MetricRow, activity: Activity) => {
    let score = 0;
    if (normalizeKey(metric.journey) === normalizeKey(activity.jornada)) score += 6;
    if (normalizeChannel(activity.canal) === metric.channel) score += 3;

    const metricTokens = new Set(normalizeKey(`${metric.journey} ${metric.activityName}`).split(/[_\s-]+/).filter(Boolean));
    const activityTokens = normalizeKey(`${activity.jornada} ${activity.raw?.['Activity name / Taxonomia'] || activity.id}`)
        .split(/[_\s-]+/)
        .filter(Boolean);

    activityTokens.forEach((token) => {
        if (metricTokens.has(token)) score += 1;
    });

    return score;
};

const topSuggestions = (
    activities: Activity[],
    field: HumanField | 'bu' | 'parceiro' | 'segmento',
    source: string,
    confidenceCap: number
): FieldSuggestion[] => {
    const counts = new Map<string, number>();
    activities.forEach((activity) => {
        const value = activityField(activity, field);
        if (!value) return;
        counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
            value,
            count,
            source,
            confidence: Math.min(confidenceCap, Math.round((count / total) * confidenceCap)),
        }));
};

const suggestFromHistory = (
    metric: MetricRow,
    activities: Activity[],
    field: HumanField | 'bu' | 'parceiro' | 'segmento'
) => {
    const sameJourneyChannel = activities.filter((activity) =>
        normalizeKey(activity.jornada) === normalizeKey(metric.journey)
        && normalizeChannel(activity.canal) === metric.channel
    );
    const sameJourney = activities.filter((activity) => normalizeKey(activity.jornada) === normalizeKey(metric.journey));
    const similar = activities
        .map((activity) => ({ activity, score: scoreSimilarity(metric, activity) }))
        .filter((item) => item.score >= 6)
        .sort((a, b) => b.score - a.score)
        .slice(0, 80)
        .map((item) => item.activity);

    return [
        ...topSuggestions(sameJourneyChannel, field, 'mesma jornada e canal', 96),
        ...topSuggestions(sameJourney, field, 'mesma jornada', 88),
        ...topSuggestions(similar, field, 'campanhas similares', 78),
    ].reduce<FieldSuggestion[]>((acc, suggestion) => {
        if (!acc.some((item) => normalizeKey(item.value) === normalizeKey(suggestion.value))) {
            acc.push(suggestion);
        }
        return acc;
    }, []).slice(0, 5);
};

const buildCandidate = (
    metric: MetricRow,
    activities: Activity[],
    importedKeyCount: Map<string, number>
): UpdateCandidate => {
    const taxonomy = inferTaxonomy(metric);
    const fieldSuggestions = HUMAN_FIELDS.reduce<Record<HumanField, FieldSuggestion[]>>((acc, field) => {
        acc[field] = suggestFromHistory(metric, activities, field);
        return acc;
    }, {} as Record<HumanField, FieldSuggestion[]>);

    const valueFor = (field: HumanField, fallback: string) => fieldSuggestions[field][0]?.value || fallback;
    const confidences = HUMAN_FIELDS.map((field) => fieldSuggestions[field][0]?.confidence ?? 0);
    const averageConfidence = Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length);
    const duplicateCount = importedKeyCount.get(metric.key) ?? 0;
    const missingCritical = !metric.journey || !metric.activityName || !metric.date || metric.channel === 'Indefinido';
    const missingHumanSuggestion = HUMAN_FIELDS.some((field) => !fieldSuggestions[field][0]?.value);

    const status: CandidateStatus = missingCritical
        ? 'error'
        : duplicateCount > 1
            ? 'duplicate'
            : missingHumanSuggestion
                ? 'new'
                : averageConfidence >= 80
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
                : missingHumanSuggestion
                    ? 'Campos humanos'
                    : status === 'ready'
                        ? 'Aprovar'
                        : 'Sugestoes',
        suggestion: status === 'ready' ? 'Sugestoes historicas fortes' : 'Revisar campos sugeridos',
        confidence: missingCritical || duplicateCount > 1 ? 0 : averageConfidence,
        basis: missingCritical
            ? 'journey, canal ou data ausente'
            : duplicateCount > 1
                ? 'mais de uma linha no arquivo com a mesma chave'
                : 'sugestoes por taxonomia e historico',
        accepted: false,
        bu: suggestFromHistory(metric, activities, 'bu')[0]?.value || taxonomy.bu,
        parceiro: suggestFromHistory(metric, activities, 'parceiro')[0]?.value || taxonomy.parceiro,
        segmento: suggestFromHistory(metric, activities, 'segmento')[0]?.value || taxonomy.segmento,
        subgrupo: valueFor('subgrupo', 'N/A'),
        etapaAquisicao: valueFor('etapaAquisicao', ''),
        perfilCredito: valueFor('perfilCredito', ''),
        produto: 'Cartao',
        oferta: valueFor('oferta', ''),
        promocional: valueFor('promocional', ''),
        ordemDisparo: undefined,
        suggestions: fieldSuggestions,
    };
};

const valueOrBlank = (value: unknown) => value === undefined || value === null ? '' : String(value);

const buildExcelRow = (candidate: UpdateCandidate) => {
    const baseTotal = candidate.sent ?? '';
    const baseAcionavel = candidate.delivered ?? '';
    const cartoes = candidate.finalized ?? '';
    const aprovados = candidate.approved ?? '';
    const propostas = candidate.proposals ?? '';
    const independentes = candidate.independent ?? '';
    const assistidas = candidate.assisted ?? '';

    const cols = FRAMEWORK_HEADERS.map((header) => {
        switch (header) {
            case 'Disparado?': return 'Sim';
            case 'Jornada': return candidate.journey;
            case 'Activity name / Taxonomia': return candidate.activityName;
            case 'Canal': return candidate.channel;
            case 'Data de Disparo': return formatDateBR(candidate.date);
            case 'Data Fim': return formatDateBR(candidate.date);
            case 'Safra': return generateSafra(candidate.date);
            case 'BU': return candidate.bu;
            case 'Parceiro': return candidate.parceiro;
            case 'Segmento': return candidate.segmento;
            case 'Subgrupos': return candidate.subgrupo;
            case 'Base Total': return baseTotal;
            case 'Base Acionavel': return baseAcionavel;
            case 'Etapa de aquisicao': return candidate.etapaAquisicao;
            case 'Ordem de disparo': return candidate.ordemDisparo ?? '';
            case 'Perfil de Credito': return candidate.perfilCredito;
            case 'Produto': return candidate.produto;
            case 'Oferta': return candidate.oferta;
            case 'Promocional': return candidate.promocional;
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

const processDinamicaBI = (matrix: string[][], activities: Activity[]): ProcessResult => {
    const warnings: string[] = [];
    const existingKeys = new Map<string, Activity[]>();

    activities.forEach((activity) => {
        const key = buildNoveltyKey(activity.jornada, normalizeChannel(activity.canal), activityDateKey(activity));
        if (!existingKeys.has(key)) existingKeys.set(key, []);
        existingKeys.get(key)!.push(activity);
    });

    const whatsappStart = findCell(matrix, ['journeyname (whatsapp)']);
    const emailStart = findCell(matrix, ['journeyname (e-mail)', 'journeyname (email)']);
    const smsStart = findCell(matrix, ['journeyname (sms)']);
    const performanceStart = findCell(matrix, ['journey (resultados de performance)']);
    const pushStart = findCell(matrix, ['journeyname (push)']);

    const whatsappRows = readBlockRows(matrix, whatsappStart, 'WhatsApp', 'whatsapp', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5,
    });
    const emailRows = readBlockRows(matrix, emailStart, 'E-mail', 'email', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4, opens: 5, clicks: 6,
    });
    const smsRows = readBlockRows(matrix, smsStart, 'SMS', 'sms', {
        journey: 0, activity: 1, date: 2, sent: 3, delivered: 4,
    });
    const performanceRows = readBlockRows(matrix, performanceStart, 'Indefinido', 'performance', {
        journey: 0, activity: 1, date: 2, channel: 3, proposals: 4, approved: 5, finalized: 6, assisted: 7, independent: 8,
    });
    const pushRows = readBlockRows(matrix, pushStart, 'Push', 'push', {
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

    const allRows = [...whatsappRows, ...emailRows, ...smsRows, ...performanceRows, ...pushRows];
    const importedKeyCount = allRows.reduce((map, row) => {
        map.set(row.key, (map.get(row.key) ?? 0) + 1);
        return map;
    }, new Map<string, number>());

    let ignoredExisting = 0;
    const metricMap = new Map<string, MetricRow>();
    allRows.forEach((row) => {
        if (existingKeys.has(row.key)) {
            ignoredExisting += 1;
            return;
        }
        mergeMetric(metricMap, row);
    });

    const metrics = Array.from(metricMap.values());
    const candidates = metrics
        .map((row) => buildCandidate(row, activities, importedKeyCount))
        .sort((a, b) => a.status.localeCompare(b.status) || b.confidence - a.confidence);

    const tsv = candidates
        .filter((candidate) => candidate.status !== 'duplicate' && candidate.status !== 'error' && candidate.status !== 'ignored')
        .map(buildExcelRow)
        .join('\n');

    return { blocks, metrics, candidates, ignoredExisting, importedRows: allRows.length, tsv, warnings };
};

const parseFileToMatrix = (file: File): Promise<string[][]> => new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
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
                resolve(rows.map((row) => row.map((cell) => String(cell ?? '').trim())));
                return;
            }

            const text = String(event.target?.result ?? '');
            resolve(parseClipboardMatrix(text));
        } catch (error: any) {
            reject(new Error(error?.message || 'Erro ao processar o arquivo.'));
        }
    };

    if (ext === 'xlsx' || ext === 'xls') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
});

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className={`text-2xl font-bold ${tone}`}>{value}</div>
        <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
);

export const IntelligentFrameworkUpdate: React.FC = () => {
    const { activities } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastRunId, setLastRunId] = useState<string | null>(null);

    const candidates = result?.candidates ?? [];
    const activeCandidates = candidates.filter((candidate) => candidate.status !== 'ignored');

    const summary = useMemo(() => ({
        ready: candidates.filter((candidate) => candidate.status === 'ready').length,
        review: candidates.filter((candidate) => candidate.status === 'review').length,
        fresh: candidates.filter((candidate) => candidate.status === 'new').length,
        duplicate: candidates.filter((candidate) => candidate.status === 'duplicate').length,
        error: candidates.filter((candidate) => candidate.status === 'error').length,
        ignored: candidates.filter((candidate) => candidate.status === 'ignored').length,
    }), [candidates]);

    const averageConfidence = useMemo(() => {
        const measurable = activeCandidates.filter((candidate) => candidate.confidence > 0);
        if (measurable.length === 0) return 0;
        return Math.round(measurable.reduce((sum, candidate) => sum + candidate.confidence, 0) / measurable.length);
    }, [activeCandidates]);

    const filteredCandidates = useMemo(() => {
        if (statusFilter === 'all') return candidates;
        return candidates.filter((candidate) => candidate.status === statusFilter);
    }, [candidates, statusFilter]);

    const exportableCandidates = useMemo(() =>
        candidates.filter((candidate) =>
            candidate.accepted
            && !['duplicate', 'error', 'ignored'].includes(candidate.status)
        ), [candidates]);

    const reviewedTsv = useMemo(() => exportableCandidates.map(buildExcelRow).join('\n'), [exportableCandidates]);
    const blockingCount = candidates.filter((candidate) =>
        candidate.status !== 'ignored'
        && (candidate.status === 'duplicate' || candidate.status === 'error' || !candidate.accepted)
    ).length;

    const processFile = async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv', 'tsv', 'txt'].includes(ext ?? '')) {
            setDragError('Formato nao suportado. Use .xlsx, .xls, .csv ou .tsv.');
            return;
        }

        setProcessing(true);
        setDragError(null);
        setSaveMessage(null);
        setLastRunId(null);
        setCopied(false);

        try {
            const matrix = await parseFileToMatrix(file);
            if (matrix.length === 0) throw new Error('Arquivo vazio.');
            const processed = processDinamicaBI(matrix, activities);
            setResult(processed);
            setFileMeta({ name: file.name, rows: matrix.length, type: ext ?? 'arquivo' });
            setReviewOpen(true);
        } catch (error: any) {
            setDragError(error?.message || 'Erro ao processar arquivo.');
        } finally {
            setProcessing(false);
        }
    };

    const updateCandidate = (key: string, updates: Partial<UpdateCandidate>) => {
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                candidate.key === key ? { ...candidate, ...updates } : candidate
            );
            return {
                ...current,
                candidates,
                tsv: candidates
                    .filter((candidate) => candidate.status !== 'duplicate' && candidate.status !== 'error' && candidate.status !== 'ignored')
                    .map(buildExcelRow)
                    .join('\n'),
            };
        });
    };

    const acceptCandidate = (key: string) => updateCandidate(key, { accepted: true });
    const ignoreCandidate = (key: string) => updateCandidate(key, { status: 'ignored', accepted: false });

    const acceptHighConfidence = () => {
        setResult((current) => {
            if (!current) return current;
            const candidates = current.candidates.map((candidate) =>
                candidate.confidence >= 80 && !['duplicate', 'error', 'ignored'].includes(candidate.status)
                    ? { ...candidate, accepted: true }
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

    const handleSaveRun = async () => {
        if (!result) return;
        setSaving(true);
        setSaveMessage(null);

        try {
            const saved = await intelligentUpdateService.saveRun({
                sourceLabel: fileMeta?.name ?? 'Dinamica BI',
                sourceType: fileMeta?.type === 'xlsx' || fileMeta?.type === 'xls' ? 'xlsx' : 'csv',
                inputLineCount: fileMeta?.rows ?? result.importedRows,
                blocks: result.blocks,
                metrics: result.metrics,
                candidates: result.candidates.map((candidate) => ({
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
                    ignored: summary.ignored,
                    ignoredExisting: result.ignoredExisting,
                    accepted: exportableCandidates.length,
                },
            });

            setLastRunId(saved.runId);
            setSaveMessage({
                type: 'success',
                text: `${saved.candidateCount} candidatos auditados. ${saved.appliedCount} linhas confirmadas na base de dados.`,
            });
            setReviewOpen(false);
        } catch (error: any) {
            setSaveMessage({
                type: 'error',
                text: error?.message ? `Falha ao salvar: ${error.message}` : 'Falha ao salvar na base de dados.',
            });
        } finally {
            setSaving(false);
        }
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
                                Arraste a Dinamica BI, revise os campos essenciais e confirme Excel + base de dados.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        <Database size={14} />
                        Historico carregado: {activities.length} campanhas
                    </div>
                </div>

                <section className="space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">1. Entrada de arquivo</h4>
                        <p className="text-xs text-slate-500">Use a aba Dinamica BI em Excel, CSV ou TSV. O conteudo bruto nao sera renderizado.</p>
                    </div>

                    {dragError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                            <AlertCircle size={14} className="text-red-500" />
                            <span>{dragError}</span>
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

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            <StatCard label="Prontas" value={summary.ready} tone="text-emerald-700" />
                            <StatCard label="Revisao" value={summary.review} tone="text-amber-700" />
                            <StatCard label="Novas" value={summary.fresh} tone="text-blue-700" />
                            <StatCard label="Duplicadas" value={summary.duplicate} tone="text-purple-700" />
                            <StatCard label="Existentes ignoradas" value={result.ignoredExisting} tone="text-slate-700" />
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

            {reviewOpen && result && fileMeta && (
                <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <header className="border-b border-slate-200 bg-white px-6 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700">
                                            <FileSpreadsheet size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Review Sheet da Atualizacao</h3>
                                            <p className="text-xs text-slate-500">{fileMeta.name}</p>
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
                            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                                <StatCard label="Novas linhas" value={candidates.length} tone="text-blue-700" />
                                <StatCard label="Ignoradas existentes" value={result.ignoredExisting} tone="text-slate-700" />
                                <StatCard label="Pendencias" value={blockingCount} tone="text-amber-700" />
                                <StatCard label="Confianca media" value={averageConfidence} tone="text-emerald-700" />
                                <StatCard label="Aceitas" value={exportableCandidates.length} tone="text-indigo-700" />
                            </div>
                        </header>

                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'ready', 'review', 'new', 'duplicate', 'error', 'ignored'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setStatusFilter(status)}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                            statusFilter === status
                                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {status === 'all' ? 'Todos' : STATUS_LABEL[status]}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={acceptHighConfidence}
                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                                <Sparkles size={14} />
                                Aceitar alta confianca
                            </button>
                        </div>

                        <main className="min-h-0 flex-1 overflow-auto">
                            <table className="min-w-[1500px] w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="sticky top-0 z-10 bg-white text-[10px] uppercase tracking-wider text-slate-500 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-3 font-bold">Status</th>
                                        <th className="px-3 py-3 font-bold">Chave</th>
                                        <th className="px-3 py-3 font-bold">Automaticos</th>
                                        {HUMAN_FIELDS.map((field) => (
                                            <th key={field.key} className="px-3 py-3 font-bold">{field.label}</th>
                                        ))}
                                        <th className="px-3 py-3 font-bold">Confianca</th>
                                        <th className="px-3 py-3 font-bold">Acoes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredCandidates.map((candidate) => (
                                        <tr key={candidate.key} className={candidate.accepted ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                                            <td className="px-3 py-3 align-top">
                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[candidate.status]}`}>
                                                    {candidate.accepted ? 'Aceito' : STATUS_LABEL[candidate.status]}
                                                </span>
                                            </td>
                                            <td className="w-80 px-3 py-3 align-top">
                                                <div className="font-semibold text-slate-900">{candidate.journey}</div>
                                                <div className="mt-1 text-slate-500">{candidate.activityName}</div>
                                                <div className="mt-2 flex gap-2 text-[10px] font-bold text-slate-500">
                                                    <span>{candidate.channel}</span>
                                                    <span>{formatDateBR(candidate.date)}</span>
                                                </div>
                                            </td>
                                            <td className="w-56 px-3 py-3 align-top">
                                                <div className="space-y-1 text-slate-700">
                                                    <div><span className="text-slate-400">BU:</span> {candidate.bu}</div>
                                                    <div><span className="text-slate-400">Parceiro:</span> {candidate.parceiro}</div>
                                                    <div><span className="text-slate-400">Segmento:</span> {candidate.segmento}</div>
                                                    <div><span className="text-slate-400">Produto:</span> {candidate.produto}</div>
                                                </div>
                                            </td>
                                            {HUMAN_FIELDS.map((field) => {
                                                const top = candidate.suggestions[field.key][0];
                                                const listId = `${candidate.key}-${field.key}`;
                                                return (
                                                    <td key={field.key} className="w-44 px-3 py-3 align-top">
                                                        <input
                                                            value={candidate[field.key]}
                                                            list={listId}
                                                            onChange={(event) => updateCandidate(candidate.key, {
                                                                [field.key]: event.target.value,
                                                                accepted: false,
                                                            } as Partial<UpdateCandidate>)}
                                                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                                                        />
                                                        <datalist id={listId}>
                                                            {candidate.suggestions[field.key].map((suggestion) => (
                                                                <option key={`${field.key}-${suggestion.value}`} value={suggestion.value} />
                                                            ))}
                                                        </datalist>
                                                        {top && (
                                                            <div className="mt-1 text-[10px] leading-tight text-slate-400">
                                                                {top.confidence}% - {top.source} ({top.count})
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-3 align-top font-bold text-slate-700">
                                                {candidate.confidence}%
                                                <div className="mt-1 max-w-40 text-[10px] font-normal text-slate-400">{candidate.basis}</div>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => acceptCandidate(candidate.key)}
                                                        disabled={candidate.status === 'duplicate' || candidate.status === 'error' || candidate.status === 'ignored'}
                                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                    >
                                                        Aceitar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => ignoreCandidate(candidate.key)}
                                                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100"
                                                    >
                                                        Ignorar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCandidates.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-3 py-16 text-center text-slate-500">
                                                Nenhum candidato neste filtro.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </main>

                        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-500">
                                {blockingCount > 0
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
                                    onClick={handleSaveRun}
                                    disabled={saving || blockingCount > 0 || exportableCandidates.length === 0}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
                                    Confirmar atualizacao
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
