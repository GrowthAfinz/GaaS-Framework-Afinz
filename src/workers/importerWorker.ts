/**
 * Web Worker do Importador Inteligente: tira leitura, índice e motor da thread principal.
 * O histórico de Aquisição fica guardado aqui entre arquivos e só é reenviado quando muda.
 */
import type { Activity } from '../types/framework';
import { runImporterPipeline, type ImporterInput, type ImporterOutput, type ImporterStage } from '../utils/importerPipeline';

export type ImporterWorkerRequest =
    | { type: 'history'; version: number; activities: Activity[] }
    | { type: 'process'; id: number; historyVersion: number; input: Omit<ImporterInput, 'activities'> };

export type ImporterWorkerResponse =
    | { type: 'stage'; id: number; stage: ImporterStage }
    | { type: 'done'; id: number; output: ImporterOutput }
    | { type: 'missing-history'; id: number };

let history: { version: number; activities: Activity[] } | null = null;

const reply = (message: ImporterWorkerResponse) => (self as unknown as Worker).postMessage(message);

self.onmessage = (event: MessageEvent<ImporterWorkerRequest>) => {
    const message = event.data;
    if (message.type === 'history') {
        history = { version: message.version, activities: message.activities };
        return;
    }
    if (!history || history.version !== message.historyVersion) {
        reply({ type: 'missing-history', id: message.id });
        return;
    }
    const output = runImporterPipeline(
        { ...message.input, activities: history.activities },
        (stage) => reply({ type: 'stage', id: message.id, stage }),
    );
    reply({ type: 'done', id: message.id, output });
};
