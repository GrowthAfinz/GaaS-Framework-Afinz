import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabaseClient', () => ({ supabase: {} }));
import { buildInsertPayload, numericPatch, type IntelligentUpdateCandidatePayload } from './intelligentUpdateService';

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
