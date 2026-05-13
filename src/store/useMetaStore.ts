import { create } from 'zustand';
import { MetaMensal } from '../types/framework';
import { dataService } from '../services/dataService';

interface MetaStore {
    metas: MetaMensal[];

    // Actions
    setMetas: (metas: MetaMensal[]) => void;
    setMeta: (meta: Omit<MetaMensal, 'id' | 'created_at' | 'updated_at'>) => void;
    getMeta: (mes: string, bu: string) => MetaMensal | undefined;
    getMetasMes: (mes: string) => MetaMensal[];
    deleteMeta: (id: string) => void;

    // Computed
    getMetaConsolidada: (mes: string) => {
        cartoes_meta: number;
        pedidos_meta: number;
        cac_max_medio: number;
    };
}

export const useMetaStore = create<MetaStore>((set, get) => ({
    metas: [],

    setMetas: (metas) => set({ metas }),

    setMeta: async (metaData) => {
        const id = `${metaData.mes}-${metaData.bu}`;
        const now = new Date().toISOString();

        const existingIndex = get().metas.findIndex(
            m => m.mes === metaData.mes && m.bu === metaData.bu
        );

        let newMeta: MetaMensal;
        if (existingIndex >= 0) {
            newMeta = {
                ...get().metas[existingIndex],
                ...metaData,
                updated_at: now,
            };
        } else {
            newMeta = {
                id,
                ...metaData,
                created_at: now,
                updated_at: now,
            };
        }

        // Optimistic UI Update
        if (existingIndex >= 0) {
            const updated = [...get().metas];
            updated[existingIndex] = newMeta;
            set({ metas: updated });
        } else {
            set({ metas: [...get().metas, newMeta] });
        }

        // DB Update
        try {
            await dataService.upsertGoal(newMeta);
        } catch (err) {
            console.error('Failed to sync goal to DB', err);
        }
    },

    getMeta: (mes, bu) => {
        return get().metas.find(m => m.mes === mes && m.bu === bu);
    },

    getMetasMes: (mes) => {
        return get().metas.filter(m => m.mes === mes);
    },

    deleteMeta: async (id) => {
        const prev = [...get().metas];
        set({ metas: prev.filter(m => m.id !== id) });
        // NOTE: Optional feature. Currently delete is barely used for MetaMensal. 
        // If needed, we'll need a dataService.deleteGoal(id).
    },

    getMetaConsolidada: (mes) => {
        const metasMes = get().metas.filter(m => m.mes === mes);
        if (metasMes.length === 0) {
            return { cartoes_meta: 0, pedidos_meta: 0, cac_max_medio: 0 };
        }

        return {
            cartoes_meta: metasMes.reduce((sum, m) => sum + m.cartoes_meta, 0),
            pedidos_meta: metasMes.reduce((sum, m) => sum + m.pedidos_meta, 0),
            cac_max_medio: metasMes.reduce((sum, m) => sum + m.cac_max, 0) / metasMes.length,
        };
    },
}));
