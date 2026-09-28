import { Goal } from '../types/framework';

const MONTH_KEY = /^\d{4}-\d{2}$/;

export const toMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const shiftMonthKey = (monthKey: string, amount: number) => {
    const [year, month] = monthKey.split('-').map(Number);
    return toMonthKey(new Date(year, month - 1 + amount, 1));
};

export const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const copyGoal = (source: Goal, mes: string): Goal => ({
    mes,
    cartoes_meta: source.cartoes_meta ?? 0,
    b2c_meta: source.b2c_meta ?? 0,
    b2b2c_meta: source.b2b2c_meta ?? 0,
    plurix_meta: source.plurix_meta ?? 0,
    cac_max: source.cac_max ?? 0,
    // Aponta sempre para o mês que foi realmente cadastrado, não para outro herdado.
    herdada_de: source.herdada_de ?? source.mes,
});

/**
 * Preenche os meses sem meta até `untilMonth` copiando o mês anterior.
 * Retorna só as metas criadas; as cadastradas nunca são alteradas.
 */
export const buildInheritedGoals = (goals: Goal[], untilMonth: string): Goal[] => {
    const byMonth = new Map(goals.filter((g) => MONTH_KEY.test(g.mes)).map((g) => [g.mes, g]));
    if (byMonth.size === 0 || !MONTH_KEY.test(untilMonth)) return [];

    const firstMonth = [...byMonth.keys()].sort()[0];
    const created: Goal[] = [];
    let previous = byMonth.get(firstMonth)!;

    for (let month = shiftMonthKey(firstMonth, 1); month <= untilMonth; month = shiftMonthKey(month, 1)) {
        const existing = byMonth.get(month);
        if (existing) {
            previous = existing;
            continue;
        }
        previous = copyGoal(previous, month);
        created.push(previous);
    }
    return created;
};

/** Meta do mês pedido; se não existir, a herdada do último mês cadastrado antes dele. */
export const resolveGoalForMonth = (goals: Goal[], month: string): Goal | undefined => {
    const exact = goals.find((g) => g.mes === month);
    if (exact) return exact;
    return buildInheritedGoals(goals, month).find((g) => g.mes === month);
};
