import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CalendarData } from '../types/framework';
import { formatDateKey, parseDate } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { generateSimulatedData } from '../utils/simulatedData';
import { storageService } from '../services/storageService';
import CsvWorker from '../workers/csvWorker?worker'; // Import Worker
import { WorkerMessage, WorkerResponse } from '../workers/csvWorker';

export const useFrameworkData = (): {
  data: CalendarData;
  loading: boolean;
  error: string | null;
  totalActivities: number;
  processCSV: (file: File) => Promise<any>;
  loadSimulatedData: () => void;
  debugHeaders: string[];
} => {
  const { setFrameworkData, activities: storeActivities } = useAppStore();
  const [loading, setLoading] = useState(true); // Start true to prevent flash
  const [error, setError] = useState<string | null>(null);
  const [debugHeaders, setDebugHeaders] = useState<string[]>([]);
  const syncedRef = useRef(false); // Use ref instead of state to prevent re-renders

  const totalActivities = storeActivities.length;

  const data = useMemo(() => {
    const grouped: CalendarData = {};
    storeActivities.forEach(activity => {
      const dateKey = formatDateKey(activity.dataDisparo);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    return grouped;
  }, [storeActivities]);

  const processCSV = useCallback((file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log('🔄 Iniciando processamento do CSV (Worker):', file.name);
      setLoading(true);
      setError(null);
      setDebugHeaders([]);

      const worker = new CsvWorker();
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        const msg: WorkerMessage = { type: 'PARSE_FRAMEWORK_CSV', fileContent: text };
        worker.postMessage(msg);
      };

      reader.onerror = () => {
        const err = 'Erro ao ler arquivo.';
        setError(err);
        setLoading(false);
        worker.terminate();
        reject(new Error(err));
      };

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type } = e.data;

        if (type === 'SUCCESS') {
          const result = (e.data as any).data; // { rows, activities }
          console.log(`✅ Worker Finalizado: ${result.activities.length} atividades`);

          // Fix: Hydrate dates that are serialized as strings during worker transfer
          const hydratedActivities = result.activities.map((a: any) => {
            const d = (typeof a.dataDisparo === 'string' ? parseDate(a.dataDisparo) : a.dataDisparo) || new Date(a.dataDisparo);

            // Heuristic Fix for Timezone Shift
            if (d instanceof Date && !isNaN(d.getTime()) && d.getHours() === 21) {
              d.setDate(d.getDate() + 1);
              d.setHours(0);
            }
            return {
              ...a,
              dataDisparo: d
            };
          });

          if (result.warnings && result.warnings.length > 0) {
            console.warn('Import Warnings:', result.warnings);
            alert(`⚠️ ATENÇÃO: ${result.warnings.length} linhas foram ignoradas!\nProvável erro de data/formato.\n\nErros:\n${result.warnings.slice(0, 3).join('\n')}`);
          }

          setFrameworkData(result.rows, hydratedActivities);
          setLoading(false);
          resolve(hydratedActivities); // RESOLVE WITH DATA

        } else if (type === 'ERROR') {
          const err = (e.data as any).error;
          setError(err);
          setLoading(false);
          reject(new Error(err));
        }
        worker.terminate();
      };

      worker.onerror = (err: any) => {
        console.error('CRITICAL: Web Worker Error Event:', err);
        const errorMsg = 'Erro no Worker: ' + (err.message || 'Falha de inicialização (Script error)');
        setError(errorMsg);
        setLoading(false);
        worker.terminate();
        reject(new Error(errorMsg));
      };

      reader.readAsText(file);
    });
  }, [setFrameworkData]);

  // CLOUD SYNC EFFECT (Refactored to Supabase)
  useEffect(() => {
    // Prevent multiple executions using ref
    if (syncedRef.current) return;

    const loadFromSupabase = async () => {
      syncedRef.current = true; // Mark as started immediately

      // 1. Wait for Persist Hydration (Fix Race Condition)
      if (useAppStore.persist && !useAppStore.persist.hasHydrated()) {
        console.log('⏳ Aguardando hidratação do storage...');
        await new Promise<void>((resolve) => {
          const unsub = useAppStore.persist.onFinishHydration(() => {
            resolve();
          });
        });
        console.log('💧 Storage hidratado.');
      }

      const { activities, b2cData, setB2CData, setPaidMediaData } = useAppStore.getState();

      // Cache First + Stale-While-Revalidate Strategy
      // If we have data, show it immediately (setLoading false), but CONTINUING to fetch fresh data
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

          // CRITICAL FIX: Only update activities from Supabase. 
          // Do NOT overwrite frameworkData (the "Plan") with activities (the "History").
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
          // FALLBACK: If Supabase B2C is empty, try Storage (Legacy)
          if (fetchedB2C.length === 0) {
            try {
              const files = await storageService.listFiles('b2c');
              if (files && files.length > 0) {
                console.log('🔄 Fallback B2C: Found in Storage:', files[0].name);
                const url = await storageService.getDownloadUrl('b2c/' + files[0].name);
                const resp = await fetch(url);
                const blob = await resp.blob();
                const text = await blob.text();

                // Parse with Worker
                finalB2C = await new Promise<any[]>((resolve) => {
                  const worker = new CsvWorker();
                  worker.postMessage({ type: 'PARSE_B2C_CSV', fileContent: text } as WorkerMessage);
                  worker.onmessage = (e) => {
                    if (e.data.type === 'SUCCESS' || e.data.type === 'SUCCESS_B2C') {
                      resolve(((e.data as any).data) || []);
                    } else {
                      resolve([]);
                    }
                    worker.terminate();
                  };
                  worker.onerror = () => { resolve([]); worker.terminate(); };
                });
                console.log(`✅ Fallback Loaded: ${finalB2C.length} B2C rows.`);
              }
            } catch (fallbackErr) {
              console.warn('Fallback B2C failed:', fallbackErr);
            }
          }

          // Always update B2C, Paid Media, and Goals
          setB2CData(finalB2C);
          setPaidMediaData(fetchedPaid);
          useAppStore.getState().setGoals(fetchedGoals); // Sync goals
          setLoading(false);
        }).catch(err => {
          console.error('Erro ao importar dataService:', err);
          setError('Fail to load data service');
          setLoading(false);
        });

      } catch (e: any) {
        console.error('⚠️ Falha no Carregamento SQL:', e);
        // Do not set error visibly if we just failed to fetch empty data?
        // But if connection error, show it.
        setError('Erro de conexão com Banco de Dados.');
        setLoading(false);
      }
    };

    loadFromSupabase();
  }, [setFrameworkData]); // Removed synced from dependencies

  const loadSimulatedData = useCallback(() => {
    try {
      setLoading(true);
      const { rows, activities } = generateSimulatedData();
      setFrameworkData(rows, activities);
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao gerar dados: ' + err.message);
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
