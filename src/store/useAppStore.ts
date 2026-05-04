
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval'; // IndexedDB
import { FrameworkRow, ViewSettings, Goal, JournalEntry, FilterState, Activity } from '../types/framework';
import { B2CDataRow, AlertConfig } from '../types/b2c';
import { DailyAdMetrics, Budget } from '../schemas/paid-media';

// Custom Storage Adapter using IDB-Keyval
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

interface AppState {
    // Data
    frameworkData: FrameworkRow[];
    activities: Activity[]; // Processed activities for easier consumption
    goals: Goal[];
    journal: JournalEntry[];

    // UI State
    viewSettings: ViewSettings;

    // Actions
    setFrameworkData: (data: FrameworkRow[], activities: Activity[]) => void;
    setActivities: (activities: Activity[]) => void; // <--- ADDED
    setGoals: (goals: Goal[]) => void;
    addJournalEntry: (entry: JournalEntry) => void;
    updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
    updateActivity: (id: string, updates: Partial<Activity>) => void;
    addActivity: (activity: Activity) => void;
    removeActivity: (activityId: string) => void;

    // Filter Actions
    setGlobalFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;

    // Navigation Actions
    setTab: (tab: ViewSettings['abaAtual']) => void;
    setPeriodo: (inicio: string, fim: string) => void;
    setPerspective: (perspective: ViewSettings['perspective']) => void;

    // B2C Actions
    b2cData: B2CDataRow[];
    setB2CData: (data: B2CDataRow[]) => void;
    alertConfig: AlertConfig;
    setAlertConfig: (config: AlertConfig) => void;

    // Paid Media
    paidMediaData: DailyAdMetrics[];
    setPaidMediaData: (data: DailyAdMetrics[]) => void;
    budgets: Budget[];
    setBudgets: (bg: Budget[]) => void;
}

const INITIAL_FILTERS: FilterState = {
    bu: [],
    canais: [],
    jornadas: [],
    segmentos: [],
    parceiros: [],
    subgrupos: [],
    ofertas: [],
    disparado: 'Todos',
    dataInicio: '',
    dataFim: ''
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            frameworkData: [],
            activities: [],
            goals: [],
            journal: [],

            viewSettings: {
                periodo: { inicio: '', fim: '' }, // Should be initialized with current month
                abaAtual: 'launch',
                filtrosGlobais: INITIAL_FILTERS,
                modoTempoJornada: 'diario',
                perspective: 'crm'
            },

            setPerspective: (perspective) => set((state) => ({
                viewSettings: { ...state.viewSettings, perspective }
            })),

            setFrameworkData: (data, activities) => set({ frameworkData: data, activities }),

            setActivities: (activities) => set({ activities }), // <--- ADDED IMPLEMENTATION

            setGoals: (goals) => set({ goals }),

            addJournalEntry: (entry) => set((state) => ({
                journal: [...state.journal, entry]
            })),

            updateJournalEntry: (id, entry) => set((state) => ({
                journal: state.journal.map(j => j.id === id ? { ...j, ...entry } : j)
            })),

            updateActivity: (id, updates) => set((state) => ({
                activities: state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a))
            })),

            addActivity: (activity) => set((state) => ({
                activities: [...state.activities.filter(a => a.id !== activity.id), activity]
            })),

            removeActivity: (activityId) => set((state) => ({
                activities: state.activities.filter(a => a.id !== activityId)
            })),

            setGlobalFilters: (filters) => set((state) => ({
                viewSettings: {
                    ...state.viewSettings,
                    filtrosGlobais: { ...state.viewSettings.filtrosGlobais, ...filters }
                }
            })),

            resetFilters: () => set((state) => ({
                viewSettings: {
                    ...state.viewSettings,
                    filtrosGlobais: INITIAL_FILTERS
                }
            })),

            setTab: (tab) => set((state) => ({
                viewSettings: { ...state.viewSettings, abaAtual: tab }
            })),

            setPeriodo: (inicio, fim) => set((state) => ({
                viewSettings: { ...state.viewSettings, periodo: { inicio, fim } }
            })),

            // B2C State
            b2cData: [],
            setB2CData: (data) => set({ b2cData: data }),

            // Paid Media Actions
            paidMediaData: [],
            setPaidMediaData: (data) => set({ paidMediaData: data }),
            budgets: [],
            setBudgets: (bg) => set({ budgets: bg }),

            alertConfig: {
                share_crm_limiar: 10,
                ativar_anomalias: true
            },
            setAlertConfig: (config) => set({ alertConfig: config })
        }),
        {
            name: 'app-storage', // unique name
            storage: createJSONStorage(() => storage), // use IDB
            partialize: (state) => ({
                // Select fields to persist (ONLY UI STATE)
                journal: state.journal, // Ideally this moves to Supabase too (Fase 3)
                viewSettings: { ...state.viewSettings, abaAtual: 'launch', perspective: 'crm' }, // Reverte para launch e CRM ao iniciar
                alertConfig: state.alertConfig
            }),
            onRehydrateStorage: () => (state) => {
                // Hydration logic is mostly irrelevant now that we fetch from DB on mount, 
                // but keeping it safe for anything that remains.
                if (state) {
                    // Hydrate Dates for Activities
                    if (state.activities) {
                        state.activities.forEach((activity) => {
                            if (typeof activity.dataDisparo === 'string') {
                                activity.dataDisparo = new Date(activity.dataDisparo);
                            }
                        });
                    }

                    // Hydrate Dates for FrameworkData (if needed, though mostly unused directly for dates)
                    if (state.frameworkData) {
                        state.frameworkData.forEach((row: any) => {
                            if (row['Data de Disparo'] && typeof row['Data de Disparo'] === 'string') {
                                row['Data de Disparo'] = new Date(row['Data de Disparo']);
                            }
                        });
                    }
                }
            }
        }
    )
);
