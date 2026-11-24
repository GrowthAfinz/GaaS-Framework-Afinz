/**
 * Cliente do Web Worker do importador. Mesma saída do pipeline, sem travar a tela.
 * Sem suporte a Worker (teste, navegador antigo) ou se o worker falhar, roda o mesmo
 * pipeline na thread principal: o resultado é igual, só não fica em segundo plano.
 */
import type { Activity } from '../types/framework';
import { runImporterPipeline, type ImporterInput, type ImporterOutput, type ImporterStage } from './importerPipeline';
import type { ImporterWorkerRequest, ImporterWorkerResponse } from '../workers/importerWorker';

let worker: Worker | null = null;
let workerBroken = false;
let sentHistory: Activity[] | null = null;
let historyVersion = 0;
let nextId = 1;

const getWorker = () => {
    if (workerBroken || typeof Worker === 'undefined') return null;
    if (!worker) {
        try {
            worker = new Worker(new URL('../workers/importerWorker.ts', import.meta.url), { type: 'module' });
        } catch {
            workerBroken = true;
            return null;
        }
    }
    return worker;
};

const resetWorker = () => {
    worker?.terminate();
    worker = null;
    sentHistory = null;
};

const syncHistory = (target: Worker, activities: Activity[]) => {
    if (sentHistory === activities) return;
    historyVersion += 1;
    target.postMessage({ type: 'history', version: historyVersion, activities } satisfies ImporterWorkerRequest);
    sentHistory = activities;
};

export interface ProcessImportFileParams extends Omit<ImporterInput, 'buffer' | 'fileName'> {
    file: File;
}

export async function processImportFile(
    params: ProcessImportFileParams,
    onStage: (stage: ImporterStage) => void,
): Promise<ImporterOutput> {
    const buffer = await params.file.arrayBuffer();
    const input: ImporterInput = { ...params, buffer, fileName: params.file.name };
    const target = getWorker();
    if (!target) return runImporterPipeline(input, onStage);

    try {
        return await runInWorker(target, input, onStage);
    } catch {
        workerBroken = true;
        resetWorker();
        // O buffer foi transferido ao worker: lê o arquivo de novo para o plano B.
        return runImporterPipeline({ ...input, buffer: await params.file.arrayBuffer() }, onStage);
    }
}

const runInWorker = (target: Worker, input: ImporterInput, onStage: (stage: ImporterStage) => void) =>
    new Promise<ImporterOutput>((resolve, reject) => {
        const id = nextId++;
        const { activities, buffer, ...rest } = input;
        const send = () => {
            syncHistory(target, activities);
            target.postMessage(
                { type: 'process', id, historyVersion, input: { ...rest, buffer } } satisfies ImporterWorkerRequest,
                [buffer],
            );
        };
        const cleanup = () => {
            target.removeEventListener('message', onMessage);
            target.removeEventListener('error', onError);
        };
        const onMessage = (event: MessageEvent<ImporterWorkerResponse>) => {
            const message = event.data;
            if (message.id !== id) return;
            if (message.type === 'stage') onStage(message.stage);
            if (message.type === 'missing-history') {
                cleanup();
                reject(new Error('Histórico não chegou ao worker.'));
            }
            if (message.type === 'done') {
                cleanup();
                resolve(message.output);
            }
        };
        const onError = (event: ErrorEvent) => {
            cleanup();
            reject(event.error ?? new Error(event.message || 'Falha no worker do importador.'));
        };
        target.addEventListener('message', onMessage);
        target.addEventListener('error', onError);
        send();
    });

/** Para testes: volta o cliente ao estado inicial. */
export const resetImporterWorkerClient = () => {
    resetWorker();
    workerBroken = false;
};
