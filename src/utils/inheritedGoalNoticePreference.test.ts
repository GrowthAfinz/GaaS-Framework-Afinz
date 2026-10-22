import { describe, expect, it } from 'vitest';
import type { Goal } from '../types/framework';
import { GOAL_NOTICE_SNOOZE_MS, inheritedGoalNoticeKey, isGoalNoticeHidden, readGoalNoticePreference, saveGoalNoticePreference } from './inheritedGoalNoticePreference';

const goal: Goal = { mes: '2026-10', herdada_de: '2026-07', b2c_meta: 6442, b2b2c_meta: 100, plurix_meta: 400, cac_max: 31 };

describe('preferências do aviso de meta herdada', () => {
    it('isola usuário, mês, origem e revisão dos valores', () => {
        const key = inheritedGoalNoticeKey(goal, 'pablo');
        for (const [next, user] of [
            [goal, 'outra-pessoa'], [{ ...goal, mes: '2026-11' }, 'pablo'],
            [{ ...goal, herdada_de: '2026-09' }, 'pablo'], [{ ...goal, b2c_meta: 6500 }, 'pablo'],
            [{ ...goal, cac_max: 32 }, 'pablo'],
        ] as [Goal, string][]) expect(inheritedGoalNoticeKey(next, user)).not.toBe(key);
    });
    it('fecha ou adia somente o aviso sem modificar a meta', () => {
        const before = JSON.stringify(goal);
        const values = new Map<string, string>();
        const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
        const key = inheritedGoalNoticeKey(goal, 'pablo');
        saveGoalNoticePreference(storage, key, { kind: 'dismissed' });
        expect(isGoalNoticeHidden(readGoalNoticePreference(storage, key), Date.now())).toBe(true);
        expect(JSON.stringify(goal)).toBe(before);
    });
    it('reexibe o aviso exatamente ao completar as 24 horas', () => {
        const now = Date.UTC(2026, 9, 22, 12);
        const preference = { kind: 'snoozed' as const, until: now + GOAL_NOTICE_SNOOZE_MS };
        expect(isGoalNoticeHidden(preference, now)).toBe(true);
        expect(isGoalNoticeHidden(preference, preference.until - 1)).toBe(true);
        expect(isGoalNoticeHidden(preference, preference.until)).toBe(false);
    });
    it('não oculta o aviso com armazenamento bloqueado ou inválido', () => {
        const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
        expect(readGoalNoticePreference(blocked, 'key')).toBeNull();
        expect(() => saveGoalNoticePreference(blocked, 'key', { kind: 'dismissed' })).not.toThrow();
        for (const value of ['invalid', '{}', '{"kind":"snoozed","until":"tomorrow"}', '{"kind":"unknown"}']) {
            expect(readGoalNoticePreference({ getItem: () => value, setItem() {} }, 'key')).toBeNull();
        }
        expect(isGoalNoticeHidden(null, Date.now())).toBe(false);
    });
});
