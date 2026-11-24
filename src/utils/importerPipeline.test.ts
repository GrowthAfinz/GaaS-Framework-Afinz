import { describe, expect, it } from 'vitest';
import { buildRentHistoryIndex, processTotalCrmDinamicaBI } from './intelligentUpdateEngine';
import { bufferToMatrix, isImporterFailure, runImporterPipeline } from './importerPipeline';
import { generateSyntheticDataset, matrixToCsv } from './importer-fixtures/syntheticDinamicaBI';

const toBuffer = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;
const stable = (result: { candidates: Array<Record<string, any>>; warnings: string[]; tsv: string }) =>
    JSON.stringify({
        candidates: result.candidates.map(({ matchedActivity, suggestions, ...rest }) => ({ ...rest, matched: matchedActivity?.id ?? null })),
        warnings: result.warnings,
        tsv: result.tsv,
    });

describe('pipeline do importador', () => {
    const dataset = generateSyntheticDataset({ rows: 600, acquisitionHistory: 400, rentHistory: 600, seed: 7 });
    const csv = matrixToCsv(dataset.matrix);

    it('lê o CSV na mesma matriz que gerou o arquivo', () => {
        expect(bufferToMatrix(toBuffer(csv), 'csv')).toEqual(dataset.matrix.map((row) => row.map((cell) => cell.trim())));
    });

    it('dá o mesmo resultado que chamar o motor direto, com as etapas na ordem', () => {
        const stages: string[] = [];
        const output = runImporterPipeline({
            buffer: toBuffer(csv),
            fileName: 'Dinamica_BI_sintetica.csv',
            flow: 'total_crm',
            activities: dataset.activities,
            rentHistoryRows: dataset.rentHistoryRows,
            mappedJourneys: [],
        }, (stage) => stages.push(stage));

        expect(stages).toEqual(['reading', 'indexing', 'detecting']);
        expect(output.ok).toBe(true);
        if (isImporterFailure(output)) return;
        const direct = processTotalCrmDinamicaBI(dataset.matrix, dataset.activities, buildRentHistoryIndex(dataset.rentHistoryRows), new Set());
        expect(stable(output.result)).toBe(stable(direct));
        expect(output.matrixRows).toBe(dataset.matrix.length);
    });

    it('devolve erro legível para formato não suportado e arquivo vazio', () => {
        const base = { flow: 'aquisicao' as const, activities: [], rentHistoryRows: null, mappedJourneys: [] };
        const pdf = runImporterPipeline({ ...base, buffer: toBuffer('x'), fileName: 'arquivo.pdf' });
        expect(pdf.ok).toBe(false);
        if (isImporterFailure(pdf)) expect(pdf.debug.message).toMatch(/não suportado/);
        const empty = runImporterPipeline({ ...base, buffer: toBuffer(''), fileName: 'vazio.csv' });
        expect(empty.ok).toBe(false);
    });
});
