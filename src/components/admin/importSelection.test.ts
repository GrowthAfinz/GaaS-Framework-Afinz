import { describe, expect, it } from 'vitest';
import { previousWeekStart, replaceImportScopeSelection } from './importSelection';

describe('period selection by front', () => {
    const acquisition = [
        { key: 'september', date: '2026-09-17', eligible: true },
        { key: 'last-week', date: '2026-11-10', eligible: true },
        { key: 'current-week', date: '2026-11-18', eligible: true },
        { key: 'conflict', date: '2026-11-17', eligible: false },
    ];
    it('replaces the acquisition selection with the period and preserves other fronts', () => {
        const selected = new Set(['september', 'billing']);
        expect([...replaceImportScopeSelection(selected, acquisition, { from: '2026-11-09', to: '2026-11-18' }, true)].sort())
            .toEqual(['billing', 'current-week', 'last-week']);
        expect([...selected]).toEqual(['september', 'billing']);
    });
    it('clears just the scope when deselected', () => {
        expect([...replaceImportScopeSelection(new Set(['last-week', 'billing']), acquisition, { from: '', to: '' }, false)])
            .toEqual(['billing']);
    });
    it('computes the previous Monday without losing the current week', () => {
        expect(previousWeekStart('2026-11-18')).toBe('2026-11-09');
        expect(previousWeekStart('2026-11-16')).toBe('2026-11-09');
    });
});
