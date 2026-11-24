/**
 * Pipeline do Importador Inteligente sem React e sem rede: lê o arquivo já em memória,
 * monta o índice de Rentabilização e roda o motor. Roda igual no Web Worker e, como
 * plano B, na thread principal. Toda regra de negócio continua em intelligentUpdateEngine.
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Activity } from '../types/framework';
import {
    buildRentHistoryIndex,
    decodeDelimitedFile,
    emptyRentHistoryIndex,
    normalizeKey,
    safeProcessDinamicaBI,
    type ParseDebugInfo,
    type ProcessResult,
    type UpdateFlow,
} from './intelligentUpdateEngine';

export type ImporterStage = 'reading' | 'indexing' | 'detecting';

export const SUPPORTED_IMPORT_EXTENSIONS = ['xlsx', 'xls', 'csv', 'tsv', 'txt'] as const;

export const fileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? '';

export interface ImporterInput {
    buffer: ArrayBuffer;
    fileName: string;
    flow: UpdateFlow;
    activities: Activity[];
    /** Linhas cruas de rentabilizacao_activities; null quando o fluxo não usa Rentabilização. */
    rentHistoryRows: Array<Record<string, any>> | null;
    mappedJourneys: string[];
}

export interface ImporterTimings {
    readingMs: number;
    indexingMs: number;
    detectingMs: number;
}

export type ImporterOutput =
    | { ok: true; result: ProcessResult; matrixRows: number; timings: ImporterTimings }
    | { ok: false; debug: ParseDebugInfo };

export type ImporterFailure = Extract<ImporterOutput, { ok: false }>;
export type ImporterSuccess = Extract<ImporterOutput, { ok: true }>;
export const isImporterFailure = (output: ImporterOutput): output is ImporterFailure => output.ok === false;

const trimRows = (rows: unknown[]) => rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => String(cell ?? '').trim()));

/** Mesma leitura do parseFileToMatrix antigo, mas síncrona e a partir do ArrayBuffer. */
export const bufferToMatrix = (buffer: ArrayBuffer, ext: string): string[][] => {
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const text = decodeDelimitedFile(buffer);
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false, delimiter: ext === 'tsv' ? '\t' : '' });
        if (parsed.errors.length > 0 && parsed.data.length === 0) {
            throw new Error(parsed.errors[0]?.message || 'Erro ao interpretar o arquivo.');
        }
        return trimRows(parsed.data as unknown[]);
    }
    if (ext === 'xlsx' || ext === 'xls') {
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames.find((name) => normalizeKey(name).includes('dinamica')) ?? workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error('Nenhuma planilha encontrada no arquivo.');
        return trimRows(XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: '' }));
    }
    throw new Error('Formato não suportado pelo parser.');
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const runImporterPipeline = (
    input: ImporterInput,
    onStage: (stage: ImporterStage) => void = () => undefined,
): ImporterOutput => {
    const ext = fileExtension(input.fileName);
    const base = { fileName: input.fileName, fileSize: input.buffer.byteLength, fileType: ext };

    onStage('reading');
    const t0 = now();
    let matrix: string[][];
    try {
        matrix = bufferToMatrix(input.buffer, ext);
    } catch (error: any) {
        return { ok: false, debug: { ...base, stage: 'parseFileToMatrix', message: error?.message || 'Erro ao ler o arquivo.', stack: error?.stack } };
    }
    if (matrix.length === 0) {
        return { ok: false, debug: { ...base, stage: 'parseFileToMatrix', matrixRows: 0, message: 'Arquivo vazio.' } };
    }

    onStage('indexing');
    const t1 = now();
    const rentHistory = input.rentHistoryRows ? buildRentHistoryIndex(input.rentHistoryRows) : emptyRentHistoryIndex();

    onStage('detecting');
    const t2 = now();
    const processed = safeProcessDinamicaBI(matrix, input.activities, input.flow, rentHistory, new Set(input.mappedJourneys));
    const t3 = now();
    if (!processed.result) {
        return { ok: false, debug: { ...base, ...processed.error, message: processed.error?.message || 'Erro ao processar arquivo.' } };
    }
    return {
        ok: true,
        result: processed.result,
        matrixRows: matrix.length,
        timings: { readingMs: Math.round(t1 - t0), indexingMs: Math.round(t2 - t1), detectingMs: Math.round(t3 - t2) },
    };
};
