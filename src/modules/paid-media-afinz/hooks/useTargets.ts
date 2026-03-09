import { useState, useEffect } from 'react';
import { dataService } from '../../../services/dataService';

export interface Target {
    id?: string;
    month: string; // "MM/yyyy"
    metric: 'spend' | 'impressions' | 'clicks' | 'conversions' | 'cpm' | 'cpc' | 'ctr';
    value: number;
    channel?: 'meta' | 'google';
    objective?: 'marca' | 'b2c' | 'plurix';
    notes?: string;
}

export const checkTargetStatus = (current: number, target: number) => {
    const pct = (current / target) * 100;
    if (pct >= 100) return { status: 'EXCEEDED', color: 'text-green-500' };
    if (pct >= 90) return { status: 'ON-TRACK', color: 'text-yellow-500' };
    if (pct >= 70) return { status: 'AT-RISK', color: 'text-orange-500' };
    return { status: 'FAILED', color: 'text-red-500' };
};

export const useTargets = () => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await dataService.fetchPaidMediaTargets();
            setTargets(data);
        } catch (err) {
            console.error('Error fetching targets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const add = async (t: Omit<Target, 'id'>) => {
        const optimisticId = crypto.randomUUID();
        const optimisticTarget = { ...t, id: optimisticId };

        setTargets(prev => [...prev, optimisticTarget]);

        try {
            await dataService.upsertPaidMediaTarget(t);
            await load();
        } catch (err) {
            console.error('Failed to add target:', err);
            setTargets(prev => prev.filter(x => x.id !== optimisticId));
        }
    };

    const update = async (id: string, t: Partial<Target>) => {
        const previousTargets = [...targets];
        setTargets(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));

        try {
            const trgt = previousTargets.find(x => x.id === id);
            if (trgt) {
                await dataService.upsertPaidMediaTarget({ ...trgt, ...t });
                await load();
            }
        } catch (err) {
            console.error('Failed to update target:', err);
            setTargets(previousTargets);
        }
    };

    const remove = async (id: string) => {
        const previousTargets = [...targets];
        setTargets(prev => prev.filter(x => x.id !== id));

        try {
            await dataService.deletePaidMediaTarget(id);
        } catch (err) {
            console.error('Failed to delete target:', err);
            setTargets(previousTargets);
        }
    };

    return { targets, add, update, remove, refresh: load, loading };
};
