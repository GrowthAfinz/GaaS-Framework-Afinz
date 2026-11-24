/**
 * Baseline de performance do Importador Inteligente (Fase 0 da Gestão de Dados V1).
 *
 * Não roda na suíte normal. Para medir:
 *   GAAS_BENCH=1 npx vitest run src/utils/intelligentUpdateEngine.baseline.test.ts
 * Tamanhos por env (linhas da matriz, separadas por vírgula): GAAS_BENCH_SIZES=5000,10000,20000,50000
 *
 * Mede as etapas que hoje rodam na thread principal do navegador, com o histórico no
 * tamanho de produção (ordem de grandeza de nov/26: ~12 mil activities e ~40 mil linhas de Rentabilização).
 * Cada etapa síncrona aqui é, no navegador, uma tarefa longa que trava a tela inteira.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { describe, it } from 'vitest';

import {
    buildRentHistoryIndex,
    processDinamicaBI,
    processRentabilizacaoDinamicaBI,
    processTotalCrmDinamicaBI,
} from './intelligentUpdateEngine';
import { generateSyntheticDataset, matrixToCsv } from './importer-fixtures/syntheticDinamicaBI';

const PROD_ACQUISITION_HISTORY = 12_000;
const PROD_RENT_HISTORY = 40_000;
const sizes = (process.env.GAAS_BENCH_SIZES ?? '5000,10000,20000,50000')
    .split(',').map((value) => Number(value.trim())).filter((value) => value > 0);
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'gestao-dados', 'baseline-fase0.json');

const time = <T,>(fn: () => T): { ms: number; value: T } => {
    const start = performance.now();
    const value = fn();
    return { ms: Math.round(performance.now() - start), value };
};
const heapMb = () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

describe.skipIf(process.env.GAAS_BENCH !== '1')('baseline do Importador Inteligente', () => {
    it('mede leitura, índice e processamento por tamanho de arquivo', () => {
        const results: Array<Record<string, unknown>> = [];
        for (const rows of sizes) {
            global.gc?.();
            const dataset = generateSyntheticDataset({
                rows,
                acquisitionHistory: PROD_ACQUISITION_HISTORY,
                rentHistory: PROD_RENT_HISTORY,
            });
            const csv = matrixToCsv(dataset.matrix);
            const heapBefore = heapMb();

            const parse = time(() => Papa.parse<string[]>(csv, { skipEmptyLines: false, delimiter: ';' }).data
                .map((row) => row.map((cell) => String(cell ?? '').trim())));
            const rentIndex = time(() => buildRentHistoryIndex(dataset.rentHistoryRows));
            const aquisicao = time(() => processDinamicaBI(parse.value, dataset.activities));
            const rent = time(() => processRentabilizacaoDinamicaBI(parse.value, rentIndex.value));
            const total = time(() => processTotalCrmDinamicaBI(parse.value, dataset.activities, buildRentHistoryIndex(dataset.rentHistoryRows)));

            const entry = {
                rows,
                matrixRows: dataset.matrix.length,
                csvMb: Math.round((csv.length / 1024 / 1024) * 10) / 10,
                parseMs: parse.ms,
                rentIndexMs: rentIndex.ms,
                aquisicaoMs: aquisicao.ms,
                rentabilizacaoMs: rent.ms,
                totalCrmMs: total.ms,
                candidates: total.value.candidates.length,
                candidatesJsonMb: Math.round((JSON.stringify(total.value.candidates.map(({ matchedActivity, ...rest }) => rest)).length / 1024 / 1024) * 10) / 10,
                heapGrowthMb: heapMb() - heapBefore,
            };
            results.push(entry);
            console.log('[baseline]', JSON.stringify(entry));
        }
        mkdirSync(dirname(OUT), { recursive: true });
        writeFileSync(OUT, `${JSON.stringify({
            measuredAt: new Date().toISOString(),
            node: process.version,
            history: { acquisition: PROD_ACQUISITION_HISTORY, rentabilizacao: PROD_RENT_HISTORY },
            results,
        }, null, 2)}\n`, 'utf-8');
    }, 60 * 60 * 1000);
});
