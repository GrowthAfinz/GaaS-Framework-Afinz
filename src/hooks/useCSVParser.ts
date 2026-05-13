import { useState, useCallback } from 'react';
import { B2CDataRow } from '../types/b2c';
// Explicitly import the worker to ensure Vite processes it
import CsvWorker from '../workers/csvWorker?worker';
import { WorkerMessage, WorkerResponse } from '../workers/csvWorker';

export const useCSVParser = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseB2CCSV = useCallback((file: File): Promise<{ data: B2CDataRow[]; warnings: string[] }> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const worker = new CsvWorker();
            const reader = new FileReader();

            reader.onload = (e) => {
                const text = e.target?.result as string;
                const message: WorkerMessage = { type: 'PARSE_B2C_CSV', fileContent: text };
                worker.postMessage(message);
            };

            reader.onerror = (err) => {
                setError('Erro ao ler arquivo.');
                setIsLoading(false);
                worker.terminate();
                reject(err);
            };

            worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                const { type } = e.data;
                if (type === 'SUCCESS' || type === 'SUCCESS_B2C') {
                    // Force TS cast as we know the structure
                    const data = (e.data as any).data as B2CDataRow[];
                    const warnings = (e.data as any).warnings || [];
                    resolve({ data, warnings });
                } else {
                    const errMsg = (e.data as any).error || 'Unknown Worker Error';
                    setError(errMsg);
                    reject(new Error(errMsg));
                }
                setIsLoading(false);
                worker.terminate();
            };

            worker.onerror = (err) => {
                setError('Erro no Worker: ' + err.message);
                setIsLoading(false);
                worker.terminate();
                reject(err);
            };

            reader.readAsText(file);
        });
    }, []);

    return { parseB2CCSV, isLoading, error };
};
