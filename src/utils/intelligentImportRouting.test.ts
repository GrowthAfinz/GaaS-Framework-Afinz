import { describe, expect, it } from 'vitest';
import {
    hasAquisicaoJourneyPrefix,
    parseCanonicalAcquisitionJourney,
    inferCartAudience,
    acquisitionJourneyIdentity,
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

describe('acquisition audience contract', () => {
    it.each(['JOR_AQS', 'JOR_AQUISICAO'])('handles compact and legacy layouts with %s', (prefix) => {
        expect(parseCanonicalAcquisitionJourney(`${prefix}_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26`))
            .toMatchObject({ bu: 'Plurix', segmento: 'Abandonados', etapaAquisicao: 'Reativacao' });
        expect(parseCanonicalAcquisitionJourney(`${prefix}_B2C_CARRINHO_21D_PAD_VIBE_OUT26`))
            .toMatchObject({ bu: 'B2C', segmento: 'Abandonados' });
        expect(parseCanonicalAcquisitionJourney(`${prefix}_B2B2C_BB_ANC_UPGRADE_PAD_VIBE_OUT26`))
            .toMatchObject({ parceiro: 'Bem Barato', segmento: 'Aprovados_nao_convertidos', etapaAquisicao: 'Meio_de_Funil' });
    });
    it.each([
        ['JOR_AQS_PLURIX_21D_ABD', 'plu_car_vis_aqs_wpp_car_21d1copa_diario', 'Abandonados D-21 A D>7'],
        ['JOR_AQS_PLURIX_CARRINHO_SABADO_PAD_26', 'plu_car_plx_aqs_wpp_car_sabadoplurix21diasd7_20260926', 'Abandonados D-7'],
        ['JOR_AQS_B2C_NA_ABD', 'afz_car_vis_aqs_wpp_car_disparo1sabado_20260307', 'Abandonados D-7'],
        ['JOR_AQS_PLURIX_CARRINHO', 'afz_car_vis_aqs_wpp_car_d7institucional_diario', 'Diario'],
    ])('resolves audience independently of cadence: %s / %s', (j, a, subgrupo) => {
        expect(inferCartAudience(j, a)).toEqual({ subgrupo });
    });
    it('does not reinterpret a dispatch offset as audience age', () => {
        expect(inferCartAudience('JOR_AQS_PLURIX_CARRINHO', 'plu_car_plx_aqs_email_car_d21_diario'))
            .toEqual({ subgrupo: 'Diario' });
    });
    it('normalizes prefix identity only', () => {
        expect(acquisitionJourneyIdentity('JOR_AQS_PLURIX_NA_NGD')).toBe(acquisitionJourneyIdentity('JOR_AQUISICAO_PLURIX_NA_NGD'));
    });
    it('keeps a curated audience when only cadence is known and reviews a weak weekend conflict', () => {
        expect(inferCartAudience('JOR_AQS_B2C_NA_ABD', 'afz_car_vis_aqs_wpp_car_d7_diario', 'Abandonados D-21 A D>7'))
            .toEqual({ subgrupo: 'Abandonados D-21 A D>7' });
        expect(inferCartAudience('JOR_AQS_B2C_NA_ABD', 'afz_car_vis_aqs_wpp_car_sabado_pontual', 'Abandonados D-21 A D>7').conflict)
            .toBeTruthy();
    });
    it('does not interpret the card product token as an abandoned audience', () => {
        expect(inferCartAudience('JOR_AQS_PLURIX_NA_ANC_MEIO_DE_FUNIL', 'plu_car_plx_aqs_wpp_anc_disp1_diario')).toEqual({});
        expect(inferCartAudience('JOR_AQS_B2C_NA_NGD_MEIO_DE_FUNIL', 'afz_car_vis_aqs_sms_ngd_disp1_diario')).toEqual({});
    });
    it.each(['JOR_AQS', 'JOR_AQUISICAO'])('uses owner-confirmed journey windows for %s', (prefix) => {
        expect(inferCartAudience(`${prefix}_PLURIX_CARRINHO_SABADO_PAD_26`,
            'plu_car_plx_aqs_wpp_car_sabadoplurix21diasd7_20260926', 'Abandonados D-21 A D>7'))
            .toEqual({ subgrupo: 'Abandonados D-7' });
        expect(inferCartAudience(`${prefix}_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26`,
            'afz_car_vis_aqs_wpp_car_disparo1sabado(apiserasa)_20260406'))
            .toEqual({ subgrupo: 'Abandonados D-21 A D>7' });
        expect(inferCartAudience(`${prefix}_PLURIX_NA_ABD_CARRINHO21D_SET_26`,
            'plu_car_plx_aqs_wpp_car_carrinho21dplurix_20260924'))
            .toEqual({ subgrupo: 'Abandonados D-21 A D>7' });
    });
});
