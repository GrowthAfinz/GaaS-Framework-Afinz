import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CalendarData } from '../types/framework';
import { formatDateKey, parseDate } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { generateSimulatedData } from '../utils/simulatedData';
import { storageService } from '../services/storageService';
import CsvWorker from '../workers/csvWorker?worker';
import { WorkerMessage, WorkerResponse } from '../workers/csvWorker';

export const useFrameworkData = (): {
  data: CalendarData;
  loading: boolean;
  error: string | null;
  totalActivities: number;
  processCSV: (file: File, options?: { updateStore?: boolean }) => Promise<any>;
  loadSimulatedData: () => void;
  debugHeaders: string[];
} => {
  const { setFrameworkData, activities: storeActivities } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugHeaders, setDebugHeaders] = useState<string[]>([]);
  const syncedRef = useRef(false);

  const totalActivities = storeActivities.length;

  const data = useMemo(() => {
    const grouped: CalendarData = {};
    storeActivities.forEach((activity) => {
      const dateKey = formatDateKey(activity.dataDisparo);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    return grouped;
  }, [storeActivities]);

  const processCSV = useCallback((file: File, options?: { updateStore?: boolean }): Promise<any> => {
    return new Promise((resolve, reject) => {
      const shouldUpdateStore = options?.updateStore ?? true;
      console.log('🔄 Iniciando processamento do CSV (Worker):', file.name);
      setLoading(true);
      setError(null);
      setDebugHeaders([]);

      const worker = new CsvWorker();
      const reader = new FileReader();

      reader.onload = (event) => {
        const text = event.target?.result as string;
        const msg: WorkerMessage = { type: 'PARSE_FRAMEWORK_CSV', fileContent: text };
        worker.postMessage(msg);
      };

      reader.onerror = () => {
        const readerError = 'Erro ao ler arquivo.';
        setError(readerError);
        setLoading(false);
        worker.terminate();
        reject(new Error(readerError));
      };

      const timeoutId = setTimeout(() => {
        console.error('❌ Worker Timeout: O processamento demorou mais que 180s.');
        worker.terminate();
        setLoading(false);
        setError('O processamento do arquivo demorou demais. Tente um arquivo menor ou verifique o console.');
        reject(new Error('Processamento expirou (Timeout)'));
      }, 180000);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        clearTimeout(timeoutId);
        const { type } = event.data;

        if (type === 'SUCCESS') {
          const result = (event.data as any).data;
          const warnings = (event.data as any).warnings || [];
          console.log(`✅ Worker Finalizado: ${result.activities.length} atividades`);

          const hydratedActivities = result.activities.map((activity: any) => {
            const parsedDate = (typeof activity.dataDisparo === 'string' ? parseDate(activity.dataDisparo) : activity.dataDisparo) || new Date(activity.dataDisparo);

            if (parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) && parsedDate.getHours() === 21) {
              parsedDate.setDate(parsedDate.getDate() + 1);
              parsedDate.setHours(0);
            }

            return {
              ...activity,
              dataDisparo: parsedDate
            };
          });

          if (warnings.length > 0) {
            console.warn('Import Warnings:', warnings);
            alert(`⚠️ ATENÇÃO: ${warnings.length} alertas foram encontrados no processamento.\n\nDetalhes:\n${warnings.slice(0, 3).join('\n')}`);
          }

          if (shouldUpdateStore) {
            setFrameworkData(result.rows, hydratedActivities);
          }
          setLoading(false);
          resolve(hydratedActivities);
        } else if (type === 'ERROR') {
          const workerError = (event.data as any).error;
          setError(workerError);
          setLoading(false);
          reject(new Error(workerError));
        }

        worker.terminate();
      };

      worker.onerror = (workerError: any) => {
        console.error('CRITICAL: Web Worker Error Event:', workerError);
        const errorMsg = 'Erro no Worker: ' + (workerError.message || 'Falha de inicialização (Script error)');
        setError(errorMsg);
        setLoading(false);
        worker.terminate();
        reject(new Error(errorMsg));
      };

      reader.readAsText(file);
    });
  }, [setFrameworkData]);

  useEffect(() => {
    if (syncedRef.current) return;

    const loadFromSupabase = async () => {
      syncedRef.current = true;

      if (useAppStore.persist && !useAppStore.persist.hasHydrated()) {
        console.log('⏳ Aguardando hidratação do storage...');
        await new Promise<void>((resolve) => {
          useAppStore.persist.onFinishHydration(() => {
            resolve();
          });
        });
        console.log('💧 Storage hidratado.');
      }

      const { activities, setB2CData, setPaidMediaData } = useAppStore.getState();

      if (activities.length > 0) {
        setLoading(false);
      }

      try {
        console.log('📡 Conectando ao Supabase para buscar dados...');
        import('../services/dataService').then(async ({ dataService }) => {
          const [fetchedActivities, fetchedB2C, fetchedPaid, fetchedGoals] = await Promise.all([
            dataService.fetchActivities(),
            dataService.fetchB2CMetrics(),
            dataService.fetchPaidMedia(),
            dataService.fetchGoals()
          ]);

          console.log(`✅ Dados Carregados: ${fetchedActivities.length} Atividades, ${fetchedB2C.length} B2C, ${fetchedPaid.length} Media, ${fetchedGoals.length} Metas.`);

          const { activities: currentActivities, setActivities } = useAppStore.getState();

          if (fetchedActivities.length > 0) {
            setActivities(fetchedActivities);
            console.log('✅ Store atualizado com atividades do Supabase (Mantendo Framework Data intacto)');
          } else if (currentActivities.length === 0) {
            console.log('⏭️ Supabase vazio e Store vazio.');
          } else {
            console.log('⏭️ Supabase vazio, mantendo atividades locais.');
          }

          let finalB2C = fetchedB2C;
          if (fetchedB2C.length === 0) {
            try {
              const files = await storageService.listFiles('b2c');
              if (files && files.length > 0) {
                console.log('🔄 Fallback B2C: Found in Storage:', files[0].name);
                const url = await storageService.getDownloadUrl('b2c/' + files[0].name);
                const response = await fetch(url);
                const blob = await response.blob();
                const text = await blob.text();

                finalB2C = await new Promise<any[]>((resolve) => {
                  const worker = new CsvWorker();
                  worker.postMessage({ type: 'PARSE_B2C_CSV', fileContent: text } as WorkerMessage);
                  worker.onmessage = (event) => {
                    if (event.data.type === 'SUCCESS' || event.data.type === 'SUCCESS_B2C') {
                      resolve(((event.data as any).data) || []);
                    } else {
                      resolve([]);
                    }
                    worker.terminate();
                  };
                  worker.onerror = () => {
                    resolve([]);
                    worker.terminate();
                  };
                });
                console.log(`✅ Fallback Loaded: ${finalB2C.length} B2C rows.`);
              }
            } catch (fallbackErr) {
              console.warn('Fallback B2C failed:', fallbackErr);
            }
          }

          setB2CData(finalB2C);
          setPaidMediaData(fetchedPaid);
          useAppStore.getState().setGoals(fetchedGoals);
          setLoading(false);
        }).catch((importError) => {
          console.error('Erro ao importar dataService:', importError);
          setError('Fail to load data service');
          setLoading(false);
        });
      } catch (fetchError: any) {
        console.error('⚠️ Falha no Carregamento SQL:', fetchError);
        setError('Erro de conexão com Banco de Dados.');
        setLoading(false);
      }
    };

    loadFromSupabase();
  }, [setFrameworkData]);

  const loadSimulatedData = useCallback(() => {
    try {
      setLoading(true);
      const { rows, activities } = generateSimulatedData();
      setFrameworkData(rows, activities);
      setLoading(false);
    } catch (simulatedError: any) {
      setError('Erro ao gerar dados: ' + simulatedError.message);
      setLoading(false);
    }
  }, [setFrameworkData]);

  return {
    data,
    loading,
    error,
    totalActivities,
    processCSV,
    loadSimulatedData,
    debugHeaders
  };
};
