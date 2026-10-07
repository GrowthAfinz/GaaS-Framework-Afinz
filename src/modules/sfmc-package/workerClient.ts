import type { ParsedPackage } from './types';
export function parsePackageInWorker(file: File, signal?: AbortSignal): Promise<ParsedPackage> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./package.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { worker.terminate(); signal?.removeEventListener('abort', abort); };
    const abort = () => { finish(); reject(new Error('Leitura cancelada.')); };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    worker.onmessage = e => { finish(); if (e.data.error) reject(new Error(e.data.error)); else resolve(e.data.result); };
    worker.onerror = () => { finish(); reject(new Error('Não foi possível processar o ZIP.')); };
    file.arrayBuffer().then(bytes => { if (!signal?.aborted) worker.postMessage({ bytes, name: file.name }, [bytes]); }).catch(e => { finish(); reject(e); });
  });
}

