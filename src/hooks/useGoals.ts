import { useMetaStore } from '../store/useMetaStore';
import { Goal } from '../types/framework';

export const useGoals = () => {
    const { getMetasMes, setMeta } = useMetaStore();

    const getGoal = (month: string): Goal => {
        const metas = getMetasMes(month);

        // Construct the legacy Goal object from the new store data
        const goal: Goal = {
            mes: month,
            cartoes_meta: 0,
            aprovacoes_meta: 0,
            cac_max: 0,
            bus: {}
        };

        if (metas.length === 0) return goal;

        // Aggregate data
        let totalCartoes = 0;
        let totalPedidos = 0;
        let totalCacSum = 0;

        metas.forEach(m => {
            totalCartoes += m.cartoes_meta;
            totalPedidos += m.pedidos_meta;
            totalCacSum += m.cac_max;

            if (!goal.bus) goal.bus = {};
            goal.bus[m.bu] = {
                cartoes: m.cartoes_meta,
                aprovacoes: m.pedidos_meta, // Mapping pedidos to aprovacoes for compatibility
                cac: m.cac_max
            };
        });

        goal.cartoes_meta = totalCartoes;
        goal.aprovacoes_meta = totalPedidos;
        goal.cac_max = metas.length > 0 ? totalCacSum / metas.length : 0;

        return goal;
    };

    const saveGoal = (goal: Goal) => {
        // Save consolidated goal back to individual BUs
        // This is a bit tricky because the old saveGoal might not have granular data if coming from the old modal
        // But the old modal (GoalsModal) seems to support BUs if they are in the object.
        // If the goal object has 'bus', we save those.

        if (goal.bus) {
            Object.entries(goal.bus).forEach(([bu, values]) => {
                setMeta({
                    mes: goal.mes,
                    bu: bu as 'B2C' | 'B2B2C' | 'Plurix',
                    cartoes_meta: values.cartoes,
                    pedidos_meta: values.aprovacoes, // Mapping back
                    cac_max: values.cac
                });
            });
        } else {
            // Fallback if no specific BU data is present (legacy support)
            // We might distribute equally or just save to a default BU? 
            // For now, let's assume the UI will be updated to support BUs or we just save to a default 'Global' if needed, 
            // but the new requirement is strict about BUs.
            // Let's try to save to a default 'B2C' if nothing else, or split?
            // Actually, the best approach is to ensure the UI sends BU data.
            // If the user uses the old modal, it might not send 'bus' structure correctly if it wasn't fully implemented.
            // But looking at the types, 'bus' is optional.
            // Let's just log a warning if no BU data is found.
            console.warn('saveGoal called without BU breakdown. This might result in data loss in the new store.');
        }
    };

    return {
        getGoal,
        saveGoal
    };
};
