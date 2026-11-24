/**
 * Teste golden do Importador Inteligente.
 *
 * Trava o comportamento atual: o mesmo arquivo sintético (seed fixa) tem que gerar
 * exatamente os mesmos candidatos, status, sugestões, confiança, avisos e TSV.
 * Protege as refatorações da Gestão de Dados V1 (worker, índice, store, divisão do monolito).
 *
 * Mudou uma regra de negócio de propósito? Regrave com:
 *   UPDATE_GOLDEN=1 npx vitest run src/utils/intelligentUpdateEngine.golden.test.ts
 * e explique no PR o porquê da diferença.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
    buildRentHistoryIndex,
    processDinamicaBI,
    processRentabilizacaoDinamicaBI,
    processTotalCrmDinamicaBI,
} from './intelligentUpdateEngine';
import { generateSyntheticDataset } from './importer-fixtures/syntheticDinamicaBI';

const GOLDEN_PATH = join(dirname(fileURLToPath(import.meta.url)), '__golden__', 'intelligent-importer.golden.json');
const DATASET = { rows: 3000, acquisitionHistory: 2000, rentHistory: 3000, seed: 20261124 };

type AnyRecord = Record<string, any>;

/** Forma estável do candidato: troca objetos grandes por identificadores. */
const canonicalCandidate = (candidate: AnyRecord) => {
    const { matchedActivity, suggestions, ...rest } = candidate;
    const topSuggestions: AnyRecord = {};
    Object.keys(suggestions ?? {}).sort().forEach((field) => {
        topSuggestions[field] = (suggestions[field] ?? []).slice(0, 3).map((s: AnyRecord) => [s.value, s.confidence, s.source]);
    });
    return {
        ...rest,
        matchedActivity: matchedActivity ? (matchedActivity.raw?.id ?? matchedActivity.id ?? null) : null,
        suggestions: topSuggestions,
    };
};

const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value instanceof Date) return value.toISOString();
    if (value && typeof value === 'object') {
        return Object.keys(value as AnyRecord).sort().reduce<AnyRecord>((acc, key) => {
            const next = (value as AnyRecord)[key];
            if (next !== undefined) acc[key] = sortKeys(next);
            return acc;
        }, {});
    }
    return value;
};

const countBy = (items: AnyRecord[], key: (item: AnyRecord) => string) =>
    items.reduce<Record<string, number>>((acc, item) => {
        const k = key(item);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
    }, {});

const snapshotOf = (result: AnyRecord) => {
    const candidates = result.candidates.map(canonicalCandidate);
    const payload = sortKeys({
        domain: result.domain,
        blocks: result.blocks,
        candidates,
        ignoredExisting: result.ignoredExisting,
        importedRows: result.importedRows,
        tsv: result.tsv,
        warnings: result.warnings,
        insights: result.insights,
    });
    return {
        hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
        candidates: candidates.length,
        status: countBy(result.candidates, (c) => c.status),
        domain: countBy(result.candidates, (c) => c.domain),
        warnings: result.warnings,
        sample: (sortKeys(candidates.slice(0, 8)) as AnyRecord[]),
    };
};

const runAll = () => {
    const dataset = generateSyntheticDataset(DATASET);
    const rentIndex = () => buildRentHistoryIndex(dataset.rentHistoryRows);
    return {
        dataset: { ...DATASET, matrixRows: dataset.matrix.length, blockRows: dataset.blockRows },
        aquisicao: snapshotOf(processDinamicaBI(dataset.matrix, dataset.activities)),
        rentabilizacao: snapshotOf(processRentabilizacaoDinamicaBI(dataset.matrix, rentIndex())),
        total_crm: snapshotOf(processTotalCrmDinamicaBI(dataset.matrix, dataset.activities, rentIndex())),
    };
};

describe('golden do Importador Inteligente', () => {
    it('gera os mesmos candidatos para o mesmo arquivo sintético', () => {
        const current = runAll();

        if (process.env.UPDATE_GOLDEN === '1' || !existsSync(GOLDEN_PATH)) {
            if (!existsSync(GOLDEN_PATH) && process.env.CI) {
                throw new Error(`Golden ausente em ${GOLDEN_PATH}. Gere localmente com UPDATE_GOLDEN=1.`);
            }
            mkdirSync(dirname(GOLDEN_PATH), { recursive: true });
            writeFileSync(GOLDEN_PATH, `${JSON.stringify(current, null, 2)}\n`, 'utf-8');
            return;
        }

        const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf-8'));
        // Compara os resumos primeiro: a diferença aparece legível antes do hash.
        for (const flow of ['aquisicao', 'rentabilizacao', 'total_crm'] as const) {
            expect(current[flow].candidates, `${flow}: total de candidatos`).toBe(golden[flow].candidates);
            expect(current[flow].status, `${flow}: status`).toEqual(golden[flow].status);
            expect(current[flow].domain, `${flow}: domínio`).toEqual(golden[flow].domain);
            expect(current[flow].warnings, `${flow}: avisos`).toEqual(golden[flow].warnings);
            expect(current[flow].sample, `${flow}: amostra`).toEqual(golden[flow].sample);
            expect(current[flow].hash, `${flow}: hash da saída completa`).toBe(golden[flow].hash);
        }
    }, 120_000);
});
