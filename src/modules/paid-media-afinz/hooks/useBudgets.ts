import { useState, useEffect } from 'react';
import { dataService } from '../../../services/dataService';

export interface Budget {
    id?: string;
    month: string; // "MM/yyyy"
    channel: 'meta' | 'google';
    objective: 'marca' | 'b2c' | 'plurix';
    value: number; // Budgeted Amount
    notes?: string;
}

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await dataService.fetchPaidMediaBudgets();
            setBudgets(data);
        } catch (err) {
            console.error('Error fetching budgets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const add = async (b: Omit<Budget, 'id'>) => {
        const newId = crypto.randomUUID();
        const optimisticBudget = { ...b, id: newId };

        // Optimistic UI update
        setBudgets(prev => [...prev, optimisticBudget]);

        try {
            // Include id so upsert (onConflict: 'id') can insert correctly
            await dataService.upsertPaidMediaBudget({ ...b, id: newId });
            await load(); // re-sync
        } catch (err) {
            console.error('Failed to add budget:', err);
            // Revert
            setBudgets(prev => prev.filter(x => x.id !== optimisticId));
        }
    };

    const update = async (id: string, b: Partial<Budget>) => {
        const previousBudgets = [...budgets];
        setBudgets(prev => prev.map(x => x.id === id ? { ...x, ...b } : x));

        try {
            const target = previousBudgets.find(x => x.id === id);
            if (target) {
                await dataService.upsertPaidMediaBudget({ ...target, ...b });
                await load();
            }
        } catch (err) {
            console.error('Failed to update budget:', err);
            setBudgets(previousBudgets);
        }
    };

    const remove = async (id: string) => {
        const previousBudgets = [...budgets];
        setBudgets(prev => prev.filter(x => x.id !== id));

        try {
            await dataService.deletePaidMediaBudget(id);
        } catch (err) {
            console.error('Failed to delete budget:', err);
            setBudgets(previousBudgets);
        }
    };

    return { budgets, add, update, remove, refresh: load, loading };
};
