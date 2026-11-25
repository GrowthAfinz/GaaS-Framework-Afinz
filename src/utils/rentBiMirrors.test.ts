import { describe, expect, it } from 'vitest';
import { emptyRentHistoryIndex, resolveBiJourneyMirrors, type MetricRow } from './intelligentUpdateEngine';

const row = (journey: string, activity: string, date: string, sent: number, delivered = sent): MetricRow => ({
    domain: 'rentabilizacao', key: `${journey}|${activity}|${date}`, sourceBlock: 'whatsapp', sourceBlocks: ['whatsapp'],
    journey, activityName: activity, date, channel: 'WhatsApp', sent, delivered,
    dispatchSignature: `${activity}|WhatsApp|${date}`,
});
const journeysOf = (rows: MetricRow[], date: string) => rows.filter((r) => r.date === date).map((r) => r.journey).sort();

describe('envio repetido pelo BI em jornada copiada ou renomeada', () => {
    it('fica a jornada que aparece sozinha; cópia e teste caem', () => {
        const metrics = [
            row('JOR_INCENTIVO', 'act_a', '2026-11-01', 100), // original sozinha em outro dia
            row('JOR_INCENTIVO', 'act_b', '2026-11-02', 50),
            row('JOR_INCENTIVO (Copiar)', 'act_b', '2026-11-02', 50),
            row('JOR_INCENTIVO_TESTE', 'act_b', '2026-11-02', 50),
        ];
        const result = resolveBiJourneyMirrors(metrics, emptyRentHistoryIndex());
        expect(journeysOf(result.metrics, '2026-11-02')).toEqual(['JOR_INCENTIVO']);
        expect(result.droppedRows).toBe(2);
        expect(result.mirrored.get('act_b|WhatsApp|2026-11-02')).toEqual(['JOR_INCENTIVO (Copiar)', 'JOR_INCENTIVO_TESTE']);
    });

    it('jornada de teste que disparou pouco perde para a original', () => {
        const original = Array.from({ length: 20 }, (_, i) => row('JOR_INCENTIVO', `solo_${i}`, '2026-10-01', 10 + i));
        const metrics = [
            ...original,
            row('JOR_TESTE', 'teste_solo', '2026-10-02', 1),
            row('JOR_INCENTIVO', 'act_b', '2026-11-02', 50),
            row('JOR_TESTE', 'act_b', '2026-11-02', 50),
        ];
        expect(journeysOf(resolveBiJourneyMirrors(metrics, emptyRentHistoryIndex()).metrics, '2026-11-02')).toEqual(['JOR_INCENTIVO']);
    });

    it('a jornada já gravada na base vence', () => {
        const history = emptyRentHistoryIndex();
        history.bySignature.set('act_b|WhatsApp|2026-11-02', [{ jornada: 'JOR_RENOMEADA' }]);
        const metrics = [
            row('JOR_ORIGINAL', 'act_a', '2026-11-01', 10),
            row('JOR_ORIGINAL', 'act_b', '2026-11-02', 50),
            row('JOR_RENOMEADA', 'act_b', '2026-11-02', 50),
        ];
        expect(journeysOf(resolveBiJourneyMirrors(metrics, history).metrics, '2026-11-02')).toEqual(['JOR_RENOMEADA']);
    });

    it('números diferentes são envios diferentes: segue conflito', () => {
        const metrics = [
            row('JOR_A', 'act_x', '2026-11-01', 9),
            row('JOR_A', 'act_b', '2026-11-02', 50),
            row('JOR_B', 'act_b', '2026-11-02', 264),
        ];
        const result = resolveBiJourneyMirrors(metrics, emptyRentHistoryIndex());
        expect(journeysOf(result.metrics, '2026-11-02')).toEqual(['JOR_A', 'JOR_B']);
        expect(result.droppedRows).toBe(0);
    });

    it('todas espelho (CP copiado e renomeado) ou duas originais: segue conflito', () => {
        const cp = ['JOR_CP_CLI_05', 'JOR_CP_CLI_06', 'JOR_CP_CLI_07'].map((j) => row(j, 'act_cp', '2026-10-05', 30));
        const two = [
            row('JOR_SEM1', 'act_1', '2026-06-01', 5), row('JOR_REAT', 'act_2', '2026-06-01', 6),
            row('JOR_SEM1', 'act_3', '2026-06-02', 7), row('JOR_REAT', 'act_3', '2026-06-02', 7),
        ];
        const result = resolveBiJourneyMirrors([...cp, ...two], emptyRentHistoryIndex());
        expect(journeysOf(result.metrics, '2026-10-05')).toHaveLength(3);
        expect(journeysOf(result.metrics, '2026-06-02')).toEqual(['JOR_REAT', 'JOR_SEM1']);
        expect(result.droppedRows).toBe(0);
    });

    it('histórico com outra jornada não deixa o arquivo escolher', () => {
        const history = emptyRentHistoryIndex();
        history.bySignature.set('act_b|WhatsApp|2026-11-02', [{ jornada: 'JOR_TERCEIRA' }]);
        const metrics = [
            row('JOR_ORIGINAL', 'act_a', '2026-11-01', 10),
            row('JOR_ORIGINAL', 'act_b', '2026-11-02', 50),
            row('JOR_COPIA', 'act_b', '2026-11-02', 50),
        ];
        expect(resolveBiJourneyMirrors(metrics, history).droppedRows).toBe(0);
    });
});
