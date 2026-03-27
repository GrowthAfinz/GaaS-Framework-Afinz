import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DiaryEntry {
    id: string;
    createdAt: string;
    updatedAt: string;

    // Contexto
    date: string;                    // Data de referência (não criação) YYYY-MM-DD
    bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';

    // Conteúdo
    title: string;                   // Título/anotação principal
    description?: string;            // Descrição expandida (opcional)

    // Vínculos (arrays de valores do Framework)
    segmentos: string[];             // ['CRM', 'Leads_Parceiros']
    parceiros: string[];             // ['Serasa', 'Bom_Pra_Credito']
    canais?: string[];               // ['E-mail', 'SMS']
    campanhasRelacionadas?: string[]; // IDs ou nomes de campanhas específicas

    // Experimentos
    isTesteAB: boolean;
    statusExperimento?: 'hipotese' | 'rodando' | 'concluido' | 'aprendizado';
    hipotese?: string;
    conclusao?: string;
    metrics?: {
        controle: { disparos: number; conversoes: number };
        variante: { disparos: number; conversoes: number };
    };
}

interface DiaryStore {
    entries: DiaryEntry[];

    // CRUD
    addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
    deleteEntry: (id: string) => void;

    // Queries
    getEntriesByDate: (date: string) => DiaryEntry[];
    getEntriesByDateRange: (start: string, end: string) => DiaryEntry[];
    getEntriesByBU: (bu: string) => DiaryEntry[];
    getExperimentos: () => DiaryEntry[];

    // Utils
    clearEntries: () => void;
    importEntries: (entries: DiaryEntry[]) => void;
}

export const useDiaryStore = create<DiaryStore>()(
    persist(
        (set, get) => ({
            entries: [],

            addEntry: (entry) => set((state) => ({
                entries: [
                    ...state.entries,
                    {
                        ...entry,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
            })),

            updateEntry: (id, updates) => set((state) => ({
                entries: state.entries.map((entry) =>
                    entry.id === id
                        ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
                        : entry
                ),
            })),

            deleteEntry: (id) => set((state) => ({
                entries: state.entries.filter((entry) => entry.id !== id),
            })),

            getEntriesByDate: (date) => {
                return get().entries.filter((entry) => entry.date === date);
            },

            getEntriesByDateRange: (start, end) => {
                return get().entries.filter((entry) => entry.date >= start && entry.date <= end);
            },

            getEntriesByBU: (bu) => {
                return get().entries.filter((entry) => entry.bu === bu);
            },

            getExperimentos: () => {
                return get().entries.filter((entry) => entry.isTesteAB);
            },

            clearEntries: () => set({ entries: [] }),

            importEntries: (newEntries) => set((state) => {
                // Avoid duplicates by ID
                const existingIds = new Set(state.entries.map(e => e.id));
                const uniqueNewEntries = newEntries.filter(e => !existingIds.has(e.id));
                return { entries: [...state.entries, ...uniqueNewEntries] };
            }),
        }),
        {
            name: 'growth_brain_diary_store',
        }
    )
);
