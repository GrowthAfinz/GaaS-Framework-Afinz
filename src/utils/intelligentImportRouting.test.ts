import { describe, expect, it } from 'vitest';
import {
    hasAquisicaoJourneyPrefix,
    parseCanonicalAcquisitionJourney,
} from './intelligentImportRouting';

describe('intelligent import journey routing', () => {
    it.each([
        'JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26',
        'DISP_AQUISICAO_B2C_NA_NGD',
        'DISPARO_AQUISICAO_B2C_NA_NGD',
        'JOR_AQS_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26',
    ])('routes %s to acquisition', (journey) => {
        expect(hasAquisicaoJourneyPrefix(journey)).toBe(true);
    });

    it.each([
        'JOR_AQS_CP',
        'JOR_AQS_CP_ATIVACAO_SET26',
    ])('preserves the JOR_AQS_CP exception for %s', (journey) => {
        expect(hasAquisicaoJourneyPrefix(journey)).toBe(false);
    });

    it('does not broaden the CP exception to a different token', () => {
        expect(hasAquisicaoJourneyPrefix('JOR_AQS_CPA_B2C_NA_NGD')).toBe(true);
    });

    it('parses the abbreviated B2C denied journey canonically', () => {
        expect(parseCanonicalAcquisitionJourney(
            'JOR_AQS_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26'
        )).toMatchObject({
            bu: 'B2C',
            parceiro: 'N/A',
            segmento: 'Negados',
            etapaAquisicao: 'Meio_de_Funil',
        });
    });

    it('parses proprietary abandoned journeys while keeping acquisition semantics', () => {
        expect(parseCanonicalAcquisitionJourney(
            'JOR_AQS_B2C_PROPRI_ABD_CARRINHO21D_PADRAO_21D_SET26'
        )).toMatchObject({
            bu: 'B2C',
            parceiro: 'Proprietaria',
            segmento: 'Abandonados',
        });
    });
});
