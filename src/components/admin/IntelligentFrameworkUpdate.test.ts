import { describe, expect, it, vi } from 'vitest';
import type { Activity } from '../../types/framework';
vi.mock('../../store/useAppStore', () => ({ useAppStore: vi.fn() }));
vi.mock('../../services/dataService', () => ({ dataService: {} }));
vi.mock('../../services/intelligentUpdateService', () => ({ intelligentUpdateService: {} }));
import { processDinamicaBI } from './IntelligentFrameworkUpdate';

const activityName = 'plu_car_plx_aqs_wpp_car_carrinho21dplurix_20260924';
const header = ['journeyname (whatsapp)', 'activity_name', 'Date', 'sent', 'delivered', 'read',
    'journey (resultados de performance)', 'activity_name', 'data_inicio', 'Canal', 'propostas', 'aprovados', 'finalizados', 'assistida', 'independente'];
const row = (journey: string, name = activityName, date = '25/09/2026') =>
    [journey, name, date, '370', '344', '100', journey, name, date, 'WHATSAPP', '5', '3', '2', '1', '1'];
const historical = (journey: string, name = activityName): Activity => ({
    id: name, jornada: journey, canal: 'WhatsApp', bu: 'Plurix', parceiro: 'N/A',
    segmento: 'Abandonados', subgrupo: 'Diario', etapaAquisicao: 'Reativacao',
    dataDisparo: new Date('2026-09-25T03:00:00Z'), kpis: {} as Activity['kpis'],
    raw: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Activity name / Taxonomia': name,
        Segmento: 'Abandonados', Subgrupos: 'Diario', 'Etapa de aquisição': 'Reativacao' },
} as unknown as Activity);

describe('intelligent importer cart audience and BI aliases', () => {
    it('elects one explicit 21D alias and never sums repeated journey volumes/results', () => {
        const journeys = ['JOR_AQS_PLURIX_NA_ABD_CARRINHO_SAB_SET_26',
            'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26', 'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_OUT26'];
        const result = processDinamicaBI([header, ...journeys.map(j => row(j))], []);
        const active = result.candidates.filter(c => c.status !== 'conflict');
        expect(active).toHaveLength(1);
        expect(active[0]).toMatchObject({ journey: journeys[2], subgrupo: 'Abandonados D-21 A D>7',
            sent: 370, delivered: 344, finalized: 2 });
    });

    it('refreshes the existing UUID when only the audience changed', () => {
        const j = 'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26';
        const first = processDinamicaBI([header, row(j)], [] ).candidates[0];
        const old = historical(j);
        old.kpis = { baseEnviada: first.sent, baseEntregue: first.delivered, aberturas: first.opens,
            propostas: first.proposals, aprovados: first.approved, cartoes: first.finalized,
            emissoesAssistidas: first.assisted, emissoesIndependentes: first.independent } as Activity['kpis'];
        const c = processDinamicaBI([header, row(j)], [old]).candidates[0];
        expect(c).toMatchObject({ status: 'ready', metricRefresh: true, canonicalDimensionRefresh: true,
            subgrupo: 'Abandonados D-21 A D>7', canonicalDimensionFields: ['subgrupo'] });
        expect(c.matchedActivity?.raw?.id).toBe(old.raw?.id);
    });

    it('matches a prefix rename to the existing UUID and elects only one spelling', () => {
        const old = 'JOR_AQUISICAO_PLURIX_NA_ABD_CARRINHO21D_SET_26';
        const next = old.replace('AQUISICAO', 'AQS');
        const result = processDinamicaBI([header, row(old), row(next)], [historical(old)]);
        const active = result.candidates.filter(c => c.status !== 'conflict');
        expect(active).toHaveLength(1);
        expect(active[0].journey).toBe(next);
        expect(active[0].finalized).toBe(2);
        expect(active[0].matchedActivity?.raw?.id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    });

    it('keeps ECRED results on the matching prefix alias before electing a winner', () => {
        const old = 'JOR_AQUISICAO_PLURIX_NA_ABD_CARRINHO21D_SET_26';
        const next = old.replace('AQUISICAO', 'AQS');
        const oldRow = row(old); oldRow[9] = 'ECRED-API';
        const nextRow = row(next); nextRow[9] = 'ECRED-API';
        const active = processDinamicaBI([header, oldRow, nextRow], []).candidates.filter(c => c.status !== 'conflict');
        expect(active).toHaveLength(1);
        expect(active[0].finalized).toBe(2);
    });

    it('blocks contradictory explicit 7D/21D evidence, even for existing records', () => {
        const j = 'JOR_AQS_PLURIX_NA_ABD_CARRINHO7D_SET_26';
        const c = processDinamicaBI([header, row(j)], [historical(j)]).candidates[0];
        expect(c).toMatchObject({ status: 'conflict', confidence: 0, metricRefresh: false });
    });

    it('does not merge different activities on the same journey and day', () => {
        const j = 'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26';
        const result = processDinamicaBI([header, row(j), row(j, activityName.replace('plurix_', 'plurix3_'))], []);
        expect(result.candidates).toHaveLength(2);
        expect(result.candidates.every(c => c.sent === 370 && c.finalized === 2)).toBe(true);
    });

    it('keeps missing performance distinct from an explicit zero', () => {
        const j = 'JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26';
        const missing = processDinamicaBI([header, row(j).slice(0, 6)], []).candidates[0];
        expect(missing.finalized).toBeUndefined();
        expect(missing.proposals).toBeUndefined();
        const explicit = row(j);
        explicit.splice(10, 5, '0', '0', '0', '0', '0');
        expect(processDinamicaBI([header, explicit], []).candidates[0].finalized).toBe(0);
    });
    it('refreshes Plurix Saturday to confirmed 7D and accepts the confirmed B2C 21D audience', () => {
        const j = 'JOR_AQS_PLURIX_CARRINHO_SABADO_PAD_26';
        const name = 'plu_car_plx_aqs_wpp_car_sabadoplurix21diasd7_20260926';
        const old = historical(j, name); old.subgrupo = 'Abandonados D-21 A D>7';
        old.raw!.Subgrupos = old.subgrupo;
        const c = processDinamicaBI([header, row(j, name)], [old]).candidates[0];
        expect(c).toMatchObject({ status: 'ready', subgrupo: 'Abandonados D-7', canonicalDimensionRefresh: true });
        expect(c.canonicalDimensionFields).toContain('subgrupo');
        const b2c = 'JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26';
        const b2cName = 'afz_car_vis_aqs_wpp_car_disparo1sabado(apiserasa)_20260406';
        const b = processDinamicaBI([header, row(b2c, b2cName)], []).candidates[0];
        expect(b.subgrupo).toBe('Abandonados D-21 A D>7');
        expect(b.status).not.toBe('conflict');
    });
});
