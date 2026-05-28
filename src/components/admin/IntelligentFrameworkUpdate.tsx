import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
    AlertCircle,
    CheckCircle,
    Clipboard,
    Copy,
    Database,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    Search,
    Sparkles,
    Upload,
    Wand2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { intelligentUpdateService } from '../../services/intelligentUpdateService';
import type { Activity } from '../../types/framework';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'error';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';

interface BlockSummary {
    key: string;
    label: string;
    detected: boolean;
    rows: number;
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
    matchedActivity?: Activity;
    fieldToReview: string;
    suggestion: string;
    confidence: number;
    previousDispatches: number;
    suggestedOrder: string;
    basis: string;
}

interface ProcessResult {
    blocks: BlockSummary[];
    metrics: MetricRow[];
    candidates: UpdateCandidate[];
    tsv: string;
    warnings: string[];
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
};

const STATUS_CLASS: Record<CandidateStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
    error: 'bg-red-50 text-red-700 border-red-200',
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
    if (text.includes('whatsapp') || text === 'wpp') return 'WhatsApp';
    if (text.includes('mail') || text === 'email') return 'E-mail';
    if (text.includes('sms')) return 'SMS';
    if (text.includes('push')) return 'Push';
    return 'Indefinido';
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

    const parsed = Papa.parse<string[]>(cleanText, {
        skipEmptyLines: true,
    });

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
        journey: existing.journey || row.journey,
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

const getCell = (matrix: string[][], row: number, col: number) => matrix[row]?.[col] ?? '';

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
        if (!activityName || !date || rowChannel === 'Indefinido') continue;

        const key = `${normalizeKey(activityName)}|${date}|${rowChannel}`;
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

const inferDispatchOrder = (candidate: MetricRow, activities: Activity[]) => {
    const month = candidate.date.slice(0, 7);
    const journeyKey = normalizeKey(candidate.journey);
    const channel = candidate.channel;

    const previous = activities.filter((activity) => {
        const sameMonth = activityDateKey(activity).slice(0, 7) === month;
        const sameChannel = normalizeChannel(activity.canal) === channel;
        const sameJourney = journeyKey && normalizeKey(activity.jornada) === journeyKey;
        return sameMonth && sameChannel && sameJourney;
    });

    const activityText = normalizeKey(candidate.activityName);
    const explicitDay = activityText.match(/\bd(\d+)\b/);
    const explicitDisparo = activityText.match(/disparo\s*(\d+)/);
    const explicitRepescagem = activityText.includes('rpk') || activityText.includes('repescagem');

    if (explicitDisparo?.[1]) {
        return {
            previousDispatches: previous.length,
            suggestedOrder: `Disparo ${explicitDisparo[1]}`,
            confidence: 94,
            basis: `numero identificado no activity name; ${previous.length} disparos no mes para a mesma jornada/canal`,
        };
    }

    if (explicitDay?.[1]) {
        const order = Number(explicitDay[1]) + 1;
        return {
            previousDispatches: previous.length,
            suggestedOrder: `Disparo ${order} / D+${explicitDay[1]}`,
            confidence: 86,
            basis: `padrao D+${explicitDay[1]} identificado no activity name`,
        };
    }

    if (explicitRepescagem) {
        return {
            previousDispatches: previous.length,
            suggestedOrder: `Repescagem ${Math.max(previous.length, 1)}`,
            confidence: 82,
            basis: `padrao de repescagem identificado no activity name`,
        };
    }

    return {
        previousDispatches: previous.length,
        suggestedOrder: `Disparo ${previous.length + 1}`,
        confidence: previous.length > 0 ? 88 : 72,
        basis: previous.length > 0
            ? `${previous.length} disparos encontrados no mes para a mesma jornada/canal`
            : 'sem disparo anterior encontrado para a mesma jornada/canal no mes',
    };
};

const buildCandidate = (metric: MetricRow, activities: Activity[]): UpdateCandidate => {
    const matches = activities.filter((activity) => {
        const activityName = normalizeKey(activity.raw?.['Activity name / Taxonomia'] || activity.id);
        return activityName === normalizeKey(metric.activityName)
            && activityDateKey(activity) === metric.date
            && normalizeChannel(activity.canal) === metric.channel;
    });

    const dispatch = inferDispatchOrder(metric, activities);
    const hasCriticalData = Boolean(metric.activityName && metric.date && metric.channel !== 'Indefinido');

    if (!hasCriticalData) {
        return {
            ...metric,
            status: 'error',
            matchCount: matches.length,
            fieldToReview: 'Chave',
            suggestion: 'Corrigir activity, data ou canal',
            confidence: 0,
            ...dispatch,
        };
    }

    if (matches.length > 1) {
        return {
            ...metric,
            status: 'duplicate',
            matchCount: matches.length,
            matchedActivity: matches[0],
            fieldToReview: 'Match',
            suggestion: `${matches.length} linhas possiveis`,
            confidence: 0,
            ...dispatch,
        };
    }

    if (matches.length === 0) {
        return {
            ...metric,
            status: dispatch.confidence >= 85 ? 'review' : 'new',
            matchCount: 0,
            fieldToReview: 'Campanha',
            suggestion: dispatch.suggestedOrder,
            confidence: dispatch.confidence,
            ...dispatch,
        };
    }

    const needsOrderReview = dispatch.confidence < 90;
    return {
        ...metric,
        status: needsOrderReview ? 'review' : 'ready',
        matchCount: 1,
        matchedActivity: matches[0],
        fieldToReview: needsOrderReview ? 'Ordem de disparo' : 'Metricas',
        suggestion: dispatch.suggestedOrder,
        confidence: dispatch.confidence,
        ...dispatch,
    };
};

const valueOrBlank = (value: unknown) => value === undefined || value === null ? '' : String(value);

const buildExcelRow = (candidate: UpdateCandidate) => {
    const raw = candidate.matchedActivity?.raw ?? {};
    const baseTotal = candidate.sent ?? raw['Base Total'] ?? '';
    const baseAcionavel = candidate.delivered ?? raw['Base Acionavel'] ?? raw['Base Acionável'] ?? '';
    const cartoes = candidate.finalized ?? raw['Cartoes Gerados'] ?? raw['Cartões Gerados'] ?? '';
    const aprovados = candidate.approved ?? raw['Aprovados'] ?? '';
    const propostas = candidate.proposals ?? raw['Propostas'] ?? '';
    const independentes = candidate.independent ?? raw['Emissoes Independentes'] ?? raw['Emissões Independentes'] ?? '';
    const assistidas = candidate.assisted ?? raw['Emissoes Assistidas'] ?? raw['Emissões Assistidas'] ?? '';

    const cols = FRAMEWORK_HEADERS.map((header) => {
        switch (header) {
            case 'Disparado?': return raw['Disparado?'] ?? 'Sim';
            case 'Jornada': return raw['Jornada'] ?? candidate.journey;
            case 'Activity name / Taxonomia': return raw['Activity name / Taxonomia'] ?? candidate.activityName;
            case 'Canal': return raw['Canal'] ?? candidate.channel;
            case 'Data de Disparo': return raw['Data de Disparo'] ?? formatDateBR(candidate.date);
            case 'Data Fim': return raw['Data Fim'] ?? formatDateBR(candidate.date);
            case 'Safra': return raw['Safra'] ?? generateSafra(candidate.date);
            case 'Base Total': return baseTotal;
            case 'Base Acionavel': return baseAcionavel;
            case 'Abertura': return candidate.opens ?? raw['Abertura'] ?? '';
            case 'Cliques': return candidate.clicks ?? raw['Cliques'] ?? '';
            case 'Cartoes Gerados': return cartoes;
            case 'Aprovados': return aprovados;
            case 'Propostas': return propostas;
            case 'Emissoes Independentes': return independentes;
            case 'Emissoes Assistidas': return assistidas;
            case 'Ordem de disparo': return raw['Ordem de disparo'] ?? candidate.suggestedOrder.replace(/[^\d]/g, '') ?? '';
            default: return raw[header] ?? '';
        }
    });

    return cols.map(valueOrBlank).join('\t');
};

const processDinamicaBI = (text: string, activities: Activity[]): ProcessResult => {
    const matrix = parseClipboardMatrix(text);
    const warnings: string[] = [];

    const whatsappStart = findCell(matrix, ['journeyname (whatsapp)']);
    const emailStart = findCell(matrix, ['journeyname (e-mail)', 'journeyname (email)']);
    const smsStart = findCell(matrix, ['journeyname (sms)']);
    const performanceStart = findCell(matrix, ['journey (resultados de performance)']);
    const pushStart = findCell(matrix, ['journeyname (push)']);

    const metricMap = new Map<string, MetricRow>();
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

    [...whatsappRows, ...emailRows, ...smsRows, ...performanceRows, ...pushRows].forEach((row) => mergeMetric(metricMap, row));

    const blocks: BlockSummary[] = [
        { key: 'whatsapp', label: 'WhatsApp', detected: Boolean(whatsappStart), rows: whatsappRows.length },
        { key: 'email', label: 'E-mail', detected: Boolean(emailStart), rows: emailRows.length },
        { key: 'sms', label: 'SMS', detected: Boolean(smsStart), rows: smsRows.length },
        { key: 'performance', label: 'Performance', detected: Boolean(performanceStart), rows: performanceRows.length },
        { key: 'push', label: 'Push', detected: Boolean(pushStart), rows: pushRows.length },
    ];

    const missingBlocks = blocks.filter((block) => !block.detected).map((block) => block.label);
    if (missingBlocks.length > 0) {
        warnings.push(`Blocos nao detectados: ${missingBlocks.join(', ')}.`);
    }

    const metrics = Array.from(metricMap.values());
    const candidates = metrics
        .map((row) => buildCandidate(row, activities))
        .sort((a, b) => a.status.localeCompare(b.status) || b.confidence - a.confidence);

    const tsv = candidates
        .filter((candidate) => candidate.status !== 'duplicate' && candidate.status !== 'error')
        .map(buildExcelRow)
        .join('\n');

    return { blocks, metrics, candidates, tsv, warnings };
};

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="border border-slate-200 rounded-lg bg-white p-4">
        <div className={`text-2xl font-bold ${tone}`}>{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
    </div>
);

export const IntelligentFrameworkUpdate: React.FC = () => {
    const { activities } = useAppStore();
    const [input, setInput] = useState('');
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastRunId, setLastRunId] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

    const handleFileDrop = async (file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        setDragError(null);
        setLoadedFileName(null);
        
        if (fileExt === 'xlsx' || fileExt === 'xls') {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        if (!worksheet) {
                            setDragError('Nenhuma planilha encontrada no arquivo Excel.');
                            return;
                        }
                        
                        const tsvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
                        
                        if (!tsvContent.trim()) {
                            setDragError('A planilha selecionada está vazia.');
                            return;
                        }
                        
                        setInput(tsvContent);
                        setLoadedFileName(file.name);
                        
                        setProcessing(true);
                        setCopied(false);
                        setSaveMessage(null);
                        setLastRunId(null);
                        
                        window.setTimeout(() => {
                            setResult(processDinamicaBI(tsvContent, activities));
                            setProcessing(false);
                        }, 120);
                    } catch (err) {
                        console.error(err);
                        setDragError('Erro ao processar o arquivo Excel. Verifique se o formato é válido.');
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error(err);
                setDragError('Erro ao carregar o arquivo Excel.');
            }
        } else if (fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt') {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    if (!text.trim()) {
                        setDragError('O arquivo de texto selecionado está vazio.');
                        return;
                    }
                    
                    setInput(text);
                    setLoadedFileName(file.name);
                    
                    setProcessing(true);
                    setCopied(false);
                    setSaveMessage(null);
                    setLastRunId(null);
                    
                    window.setTimeout(() => {
                        setResult(processDinamicaBI(text, activities));
                        setProcessing(false);
                    }, 120);
                };
                reader.readAsText(file);
            } catch (err) {
                console.error(err);
                setDragError('Erro ao ler o arquivo de texto.');
            }
        } else {
            setDragError('Formato de arquivo não suportado. Arraste planilhas Excel (.xlsx, .xls) ou arquivos de texto (.csv, .tsv, .txt).');
        }
    };

    const summary = useMemo(() => {
        const candidates = result?.candidates ?? [];
        return {
            ready: candidates.filter((candidate) => candidate.status === 'ready').length,
            review: candidates.filter((candidate) => candidate.status === 'review').length,
            fresh: candidates.filter((candidate) => candidate.status === 'new').length,
            duplicate: candidates.filter((candidate) => candidate.status === 'duplicate').length,
            error: candidates.filter((candidate) => candidate.status === 'error').length,
        };
    }, [result]);

    const filteredCandidates = useMemo(() => {
        const candidates = result?.candidates ?? [];
        if (statusFilter === 'all') return candidates.slice(0, 120);
        return candidates.filter((candidate) => candidate.status === statusFilter).slice(0, 120);
    }, [result, statusFilter]);

    const handleProcess = () => {
        setProcessing(true);
        setCopied(false);
        setSaveMessage(null);
        setLastRunId(null);
        window.setTimeout(() => {
            setResult(processDinamicaBI(input, activities));
            setProcessing(false);
        }, 120);
    };

    const handleCopy = async () => {
        if (!result?.tsv) return;
        await navigator.clipboard.writeText(result.tsv);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const handleSaveRun = async () => {
        if (!result) return;
        setSaving(true);
        setSaveMessage(null);

        try {
            const saved = await intelligentUpdateService.saveRun({
                inputLineCount: input.split('\n').filter(Boolean).length,
                blocks: result.blocks,
                metrics: result.metrics,
                candidates: result.candidates.map((candidate) => ({
                    ...candidate,
                    excelTsvRow: buildExcelRow(candidate),
                })),
                warnings: result.warnings,
                summary: {
                    ready: summary.ready,
                    review: summary.review,
                    new: summary.fresh,
                    duplicate: summary.duplicate,
                    error: summary.error,
                },
            });

            setLastRunId(saved.runId);
            setSaveMessage({
                type: 'success',
                text: `${saved.metricCount} metricas e ${saved.candidateCount} pendencias salvas. ${saved.appliedCount} campanhas prontas aplicadas na base de dados.`,
            });
        } catch (error: any) {
            setSaveMessage({
                type: 'error',
                text: error?.message ? `Falha ao salvar: ${error.message}` : 'Falha ao salvar na base de dados.',
            });
        } finally {
            setSaving(false);
        }
    };

    const rowCount = result?.tsv ? result.tsv.split('\n').filter(Boolean).length : 0;
    const blockingCount = summary.duplicate + summary.error;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10 space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 rounded-xl text-cyan-700 shadow-inner">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Atualizacao Inteligente</h3>
                            <p className="text-sm text-slate-500">
                                Cole a Dinamica BI em formato Excel ou CSV, revise pendencias e gere linhas prontas para Excel e base de dados.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <Database size={14} />
                        Historico carregado: {activities.length} campanhas
                    </div>
                </div>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">1. Entrada de dados</h4>
                            <p className="text-xs text-slate-500">
                                Cole os dados copiados da aba Dinamica BI ou{' '}
                                <label className="text-cyan-600 hover:text-cyan-800 font-bold underline cursor-pointer transition duration-150 inline-flex items-center gap-1">
                                    selecione um arquivo do computador
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.tsv,.txt"
                                        className="hidden"
                                        onChange={async (event) => {
                                            if (event.target.files && event.target.files.length > 0) {
                                                await handleFileDrop(event.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                                . Arraste e solte planilhas Excel ou arquivos CSV/TSV na área abaixo.
                            </p>
                        </div>
                        <FileSpreadsheet size={18} className="text-slate-400" />
                    </div>

                    {dragError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                            <span>{dragError}</span>
                        </div>
                    )}

                    {loadedFileName && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                            <span>Arquivo <strong>{loadedFileName}</strong> importado e processado com sucesso!</span>
                        </div>
                    )}

                    <div 
                        className="relative group"
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                        }}
                        onDrop={async (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                await handleFileDrop(e.dataTransfer.files[0]);
                            }
                        }}
                    >
                        <textarea
                            value={input}
                            onChange={(event) => {
                                setInput(event.target.value);
                                setLoadedFileName(null);
                                setDragError(null);
                            }}
                            placeholder="Cole aqui os dados da Dinamica BI em Excel/TSV ou CSV, ou arraste e solte uma planilha..."
                            className="min-h-44 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                        />
                        {isDragging && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-cyan-500 bg-cyan-50/90 backdrop-blur-sm transition-all duration-300 z-20 animate-pulse">
                                <div className="p-4 bg-cyan-100 rounded-full text-cyan-700 shadow-lg mb-2 animate-bounce">
                                    <Upload size={28} />
                                </div>
                                <p className="text-sm font-bold text-cyan-800">Solte o arquivo para importar</p>
                                <p className="text-xs text-cyan-600">Planilhas Excel (.xlsx, .xls) ou CSV/TSV/TXT</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            {input ? `${input.split('\n').filter(Boolean).length} linhas carregadas` : 'Aguardando colagem'}
                        </div>
                        <button
                            type="button"
                            onClick={handleProcess}
                            disabled={!input.trim() || processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {processing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Processar atualizacao
                        </button>
                    </div>
                </section>

                {result && (
                    <>
                        <section className="space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">2. Diagnostico da atualizacao</h4>
                                <p className="text-xs text-slate-500">Use os status para decidir o que pode seguir e o que precisa de acao humana.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                <button type="button" onClick={() => setStatusFilter('ready')} className="text-left">
                                    <StatCard label="Prontas" value={summary.ready} tone="text-emerald-700" />
                                </button>
                                <button type="button" onClick={() => setStatusFilter('review')} className="text-left">
                                    <StatCard label="Revisao humana" value={summary.review} tone="text-amber-700" />
                                </button>
                                <button type="button" onClick={() => setStatusFilter('new')} className="text-left">
                                    <StatCard label="Novas" value={summary.fresh} tone="text-blue-700" />
                                </button>
                                <button type="button" onClick={() => setStatusFilter('duplicate')} className="text-left">
                                    <StatCard label="Duplicadas" value={summary.duplicate} tone="text-purple-700" />
                                </button>
                                <button type="button" onClick={() => setStatusFilter('error')} className="text-left">
                                    <StatCard label="Erros" value={summary.error} tone="text-red-700" />
                                </button>
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

                            {result.warnings.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                                    {result.warnings.join(' ')}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">3. Mesa de revisao humana</h4>
                                    <p className="text-xs text-slate-500">O orquestrador estima a ordem do disparo pelo historico mensal da base de dados.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    <Search size={14} />
                                    Mostrar tudo
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <div className="max-h-96 overflow-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                        <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 font-bold">Status</th>
                                                <th className="px-3 py-2 font-bold">Data</th>
                                                <th className="px-3 py-2 font-bold">Canal</th>
                                                <th className="px-3 py-2 font-bold">Activity</th>
                                                <th className="px-3 py-2 font-bold">Campo</th>
                                                <th className="px-3 py-2 font-bold">Sugestao</th>
                                                <th className="px-3 py-2 font-bold">Conf.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredCandidates.map((candidate) => (
                                                <tr key={candidate.key} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[candidate.status]}`}>
                                                            {STATUS_LABEL[candidate.status]}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{formatDateBR(candidate.date)}</td>
                                                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{candidate.channel}</td>
                                                    <td className="max-w-xs px-3 py-2">
                                                        <div className="truncate font-medium text-slate-800" title={candidate.activityName}>{candidate.activityName}</div>
                                                        <div className="truncate text-[10px] text-slate-400" title={candidate.basis}>{candidate.basis}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{candidate.fieldToReview}</td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                                            <Sparkles size={12} className="text-indigo-500" />
                                                            {candidate.suggestion}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-700">{candidate.confidence}%</td>
                                                </tr>
                                            ))}
                                            {filteredCandidates.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                                                        Nenhuma linha neste filtro.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">4. Linhas para Excel</h4>
                                        <p className="text-xs text-slate-500">{rowCount} linhas sem cabecalho, prontas para colar.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        disabled={!result.tsv}
                                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <textarea
                                    readOnly
                                    value={result.tsv}
                                    className="h-40 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 font-mono text-[10px] text-slate-700 outline-none"
                                />
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Base de dados</h4>
                                        <p className="text-xs text-slate-500">Salva a execucao, registra as pendencias e aplica automaticamente o que estiver pronto.</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">Linhas existentes para atualizar</span>
                                        <span className="font-bold text-slate-800">{summary.ready + summary.review}</span>
                                    </div>
                                    <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">Novas linhas candidatas</span>
                                        <span className="font-bold text-slate-800">{summary.fresh}</span>
                                    </div>
                                    <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">Pendencias bloqueantes</span>
                                        <span className="font-bold text-slate-800">{blockingCount}</span>
                                    </div>
                                    {lastRunId && (
                                        <div className="flex justify-between rounded bg-emerald-50 px-3 py-2">
                                            <span className="text-emerald-700">Execucao salva</span>
                                            <span className="font-mono text-[10px] font-bold text-emerald-800">{lastRunId.slice(0, 8)}...</span>
                                        </div>
                                    )}
                                </div>
                                {saveMessage && (
                                    <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
                                        saveMessage.type === 'success'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                            : 'border-red-200 bg-red-50 text-red-700'
                                    }`}>
                                        {saveMessage.text}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleSaveRun}
                                    disabled={saving || result.candidates.length === 0}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
                                    {saving ? 'Salvando...' : 'Salvar e aplicar prontas na base de dados'}
                                </button>
                                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                                    Linhas em revisao, novas, duplicadas ou com erro ficam registradas para acao humana; apenas status Pronto altera campanhas existentes.
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};
