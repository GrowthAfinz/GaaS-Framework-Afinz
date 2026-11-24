import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabaseClient', () => ({ supabase: {} }));
import { buildInsertPayload, numericPatch, mapCandidateRow, mapRunRow, type IntelligentUpdateCandidatePayload } from './intelligentUpdateService';

const candidate = (overrides = {}): IntelligentUpdateCandidatePayload => ({
    key: 'key', activityName: 'plu_car_plx_aqs_wpp_car_21d_diario',
    journey: 'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26', channel: 'WhatsApp',
    date: '2026-09-25', sourceBlock: 'whatsapp', status: 'ready', matchCount: 0,
    fieldToReview: '', suggestion: '', confidence: 100, basis: '', excelTsvRow: '',
    subgrupo: 'Abandonados D-21 A D>7', etapaAquisicao: 'Reativacao',
    parceiro: 'N/A', produto: 'Cartao', oferta: 'Vibe', perfilCredito: 'Mar_aberto',
    ...overrides,
});

describe('acquisition persistence safeguards', () => {
    it('displays executor audit rows and legacy API-shaped rows in the importer history', () => {
        const row = mapCandidateRow({ domain: 'rentabilizacao', operation_type: 'update', status: 'applied',
            proposed_activity_update: { Abertura: 12 },
            after_payload: { jornada: 'JOR_VBS_PROMO_DO_MES', 'Activity name / Taxonomia': 'afz_promo', Canal: 'E-mail', 'Data de Disparo': '2026-11-20T03:00:00+00:00' } });
        expect(row).toMatchObject({ journey: 'JOR_VBS_PROMO_DO_MES', activityName: 'afz_promo', channel: 'E-mail', date: '2026-11-20' });
        expect(mapCandidateRow({ proposed_activity_update: { journey: 'legacy', activity_name: 'message', channel: 'SMS', metric_date: '2026-11-19' } })).toMatchObject({ journey: 'legacy', activityName: 'message', channel: 'SMS', date: '2026-11-19' });
        expect(mapRunRow({ summary: { selected: 58, applied: 58 } }).blocked).toBe(0);
    });
    it('leaves financial updates to the RPC so partial performance cannot erase historical incentives', () => {
        const patch = numericPatch(candidate({ delivered: 771, finalized: 4 }));
        expect(patch['Base Acionável']).toBe(771);
        expect(patch['Cartões Gerados']).toBe(4);
        for (const field of ['Custo Total Campanha', 'Custo unitário do canal', 'Custo total canal', 'CAC']) {
            expect(patch).not.toHaveProperty(field);
        }
    });
    it('does not round new CAC or manufacture costs without observed delivery', () => {
        const row = buildInsertPayload(candidate({ delivered: 128, finalized: 18 }));
        expect(row.CAC).toBeCloseTo(48.7936 / 18, 12);
        expect(row.CAC).not.toBe(2.71);
        expect(buildInsertPayload(candidate({ finalized: 18 })).CAC).toBeNull();
        expect(buildInsertPayload(candidate({ delivered: 128, finalized: 0 })).CAC).toBeNull();
    });
    it('patches only the canonical dimensions that actually changed', () => {
        const patch = numericPatch(candidate({ metricRefresh: true, canonicalDimensionRefresh: true,
            canonicalDimensionFields: ['subgrupo'] }));
        expect(patch.Subgrupos).toBe('Abandonados D-21 A D>7');
        for (const field of ['Produto', 'Oferta', 'Perfil de Crédito', 'Parceiro', 'Etapa de aquisição']) {
            expect(patch).not.toHaveProperty(field);
        }
    });
    it('does not replace old conversion metrics when the new file has no performance', () => {
        expect(numericPatch(candidate({ metricRefresh: true }))).not.toHaveProperty('Cartões Gerados');
        expect(buildInsertPayload(candidate())['Cartões Gerados']).toBeNull();
        expect(buildInsertPayload(candidate({ finalized: 0 }))['Cartões Gerados']).toBe(0);
    });
    it('preserves an explicit manual change during a metric refresh', () => {
        expect(numericPatch(candidate({ metricRefresh: true, manualOverrides: [{ field: 'oferta',
            mode: 'single', changedAt: '2026-10-15T12:00:00Z' }] })).Oferta).toBe('Vibe');
    });
});
