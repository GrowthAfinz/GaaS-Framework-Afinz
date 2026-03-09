export interface Budget {
    id: string;
    month: string; // "MM/yyyy"
    channel: 'meta' | 'google';
    objective: 'marca' | 'b2c' | 'plurix';
    value: number; // Budgeted Amount
    notes?: string;
}

const STORAGE_KEY = 'media_paga_budgets';

export const getBudgets = (): Budget[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveBudget = (budget: Omit<Budget, 'id'>) => {
    const budgets = getBudgets();
    const newBudget = { ...budget, id: crypto.randomUUID() };
    budgets.push(newBudget);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    return newBudget;
};

export const updateBudget = (id: string, updates: Partial<Budget>) => {
    const budgets = getBudgets();
    const idx = budgets.findIndex(b => b.id === id);
    if (idx !== -1) {
        budgets[idx] = { ...budgets[idx], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    }
};

export const deleteBudget = (id: string) => {
    const budgets = getBudgets().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
};
