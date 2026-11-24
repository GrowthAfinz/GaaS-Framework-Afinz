import { describe, expect, it } from 'vitest';
import { buildRentabilizacaoCandidate, buildRentHistoryIndex, buildDispatchSignature, type MetricRow } from './intelligentUpdateEngine';

describe('per-run rentabilizacao suggestion cache', () => {
    it('preserves candidate decisions across dates and does not share mutable review fields', () => {
        const history = buildRentHistoryIndex([{ jornada: 'JOR_VBS_PROMO_DO_MES', Canal: 'E-mail',
            'Activity name / Taxonomia': 'promocao_mes', 'Data de Disparo': '2026-11-01',
            BU: 'B2C', Segmento: 'VBSS', Subgrupos: 'N/A', Produto: 'Cartao', Oferta: 'Padrao' }]);
        const cache = new Map();
        const make = (date: string, sent: number): MetricRow => ({ domain: 'rentabilizacao',
            key: date, sourceBlock: 'email', sourceBlocks: ['email'], journey: 'JOR_VBS_PROMO_DO_MES',
            activityName: 'promocao_mes', channel: 'E-mail', date, sent, delivered: sent,
            dispatchSignature: buildDispatchSignature('promocao_mes', 'E-mail', date) });
        const first = make('2026-11-20', 10);
        const second = make('2026-11-21', 20);
        const a = buildRentabilizacaoCandidate(first, new Map(), history, cache);
        expect(a).toEqual(buildRentabilizacaoCandidate(first, new Map(), history));
        a.suggestions.bu![0].value = 'edited by reviewer';
        const b = buildRentabilizacaoCandidate(second, new Map(), history, cache);
        expect(b).toEqual(buildRentabilizacaoCandidate(second, new Map(), history));
        expect(cache.size).toBe(1);
        expect(b.sent).toBe(20);
        expect(b.date).toBe('2026-11-21');
    });
});
