import type { Goal } from '../types/framework';

export const GOAL_NOTICE_SNOOZE_MS = 24 * 60 * 60 * 1000;
export type GoalNoticePreference = { kind: 'dismissed' } | { kind: 'snoozed'; until: number };
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** A dismissal belongs to one user, target month and exact inherited goal revision. */
export function inheritedGoalNoticeKey(goal: Goal, userId: string | null): string {
    return 'gaas.inherited-goal-notice.v1:' + JSON.stringify([
        userId, goal.mes, goal.herdada_de, goal.cartoes_meta ?? null,
        goal.b2c_meta ?? null, goal.b2b2c_meta ?? null, goal.plurix_meta ?? null,
        goal.cac_max ?? null, goal.aprovacoes_meta ?? null,
    ]);
}

export function readGoalNoticePreference(storage: PreferenceStorage | null, key: string): GoalNoticePreference | null {
    try {
        const value = JSON.parse(storage?.getItem(key) || 'null');
        if (value?.kind === 'dismissed') return { kind: 'dismissed' };
        if (value?.kind === 'snoozed' && typeof value.until === 'number' && Number.isFinite(value.until)) {
            return { kind: 'snoozed', until: value.until };
        }
    } catch { /* Invalid or blocked local storage must not hide the notice. */ }
    return null;
}

export function saveGoalNoticePreference(storage: PreferenceStorage | null, key: string, preference: GoalNoticePreference): void {
    try { storage?.setItem(key, JSON.stringify(preference)); } catch { /* In-memory dismissal still works. */ }
}

export function isGoalNoticeHidden(preference: GoalNoticePreference | null, now: number): boolean {
    return preference?.kind === 'dismissed' || (preference?.kind === 'snoozed' && preference.until > now);
}
