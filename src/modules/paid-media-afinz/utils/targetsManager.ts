export interface Target {
    id: string;
    month: string; // "MM/yyyy"
    metric: 'spend' | 'impressions' | 'clicks' | 'conversions' | 'cpm' | 'cpc' | 'ctr';
    value: number;
    channel?: 'meta' | 'google';
    objective?: 'marca' | 'b2c' | 'plurix';
    notes?: string;
}

const STORAGE_KEY = 'media_paga_targets';

export const getTargets = (): Target[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveTarget = (target: Omit<Target, 'id'>) => {
    const targets = getTargets();
    const newTarget = { ...target, id: crypto.randomUUID() };
    targets.push(newTarget);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
    return newTarget;
};

export const updateTarget = (id: string, updates: Partial<Target>) => {
    const targets = getTargets();
    const idx = targets.findIndex(t => t.id === id);
    if (idx !== -1) {
        targets[idx] = { ...targets[idx], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
    }
};

export const deleteTarget = (id: string) => {
    const targets = getTargets().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
};

export const checkTargetStatus = (current: number, target: number) => {
    const pct = (current / target) * 100;
    if (pct >= 100) return { status: 'EXCEEDED', color: 'text-green-500' };
    if (pct >= 90) return { status: 'ON-TRACK', color: 'text-yellow-500' };
    if (pct >= 70) return { status: 'AT-RISK', color: 'text-orange-500' };
    return { status: 'FAILED', color: 'text-red-500' };
};
