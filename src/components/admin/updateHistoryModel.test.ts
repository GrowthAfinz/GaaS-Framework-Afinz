import { describe, expect, it } from 'vitest';
import {
    buildBaseFreshness,
    buildDailyActivity,
    buildFieldChanges,
    durationLabel,
    freshnessLabel,
    runStatusMeta,
} from './updateHistoryModel';
import type { UpdateRunCandidateRow } from '../../services/intelligentUpdateService';

const NOW = new Date(2026, 10, 24, 15, 0);
const at = (day: number, hour = 9) => new Date(2026, 10, day, hour, 30).toISOString();

describe('histórico de atualizações', () => {
    it('marca a base como velha depois de 2 dias e diz hoje/ontem', () => {
        expect(freshnessLabel(at(24, 8), NOW)).toMatchObject({ label: 'hoje · 08:30', tone: 'ok' });
        expect(freshnessLabel(at(23), NOW)).toMatchObject({ label: 'ontem · 09:30', tone: 'ok' });
        expect(freshnessLabel(at(22), NOW).tone).toBe('ok');
        expect(freshnessLabel(at(21), NOW)).toMatchObject({ label: 'há 3 dias · 21/11', tone: 'warn' });
        expect(freshnessLabel(undefined, NOW)).toMatchObject({ label: 'sem carga registrada', tone: 'bad' });
    });

    it('Total CRM conta para as duas bases e gravação vence falha no mesmo dia', () => {
        const runs = [
            { createdAt: at(24), domain: 'total_crm', status: 'applied' },
            { createdAt: at(23), domain: 'aquisicao', status: 'failed' },
            { createdAt: at(23, 11), domain: 'aquisicao', status: 'applied' },
            { createdAt: at(20), domain: 'aquisicao', status: 'failed' },
            { createdAt: at(19), domain: 'aquisicao', status: 'reviewing' },
        ];
        const daily = buildDailyActivity(runs, 7, NOW);
        const kinds = (key: string) => daily[key].map((day) => day.kind).join(',');
        expect(kinds('aquisicao')).toBe('none,warn,bad,none,none,ok,ok');
        expect(kinds('rentabilizacao')).toBe('none,none,none,none,none,none,ok');

        const bases = buildBaseFreshness([{ createdAt: at(24), domain: 'total_crm' }], daily, NOW);
        expect(bases.map((base) => [base.label, base.freshLabel, base.tone, base.loads])).toEqual([
            ['Aquisição', 'hoje · 09:30', 'ok', 4],
            ['Rentabilização', 'hoje · 09:30', 'ok', 1],
        ]);
    });

    it('traduz situação e duração', () => {
        expect(runStatusMeta('applied')).toEqual({ label: 'Concluída', tone: 'ok' });
        expect(runStatusMeta('reviewing').label).toBe('Não gravada');
        expect(durationLabel('2026-11-24T10:00:00Z', '2026-11-24T10:00:41Z')).toBe('41 s');
        expect(durationLabel('2026-11-24T10:00:00Z', '2026-11-24T10:01:12Z')).toBe('1 min 12 s');
        expect(durationLabel('x', 'y')).toBe('sem dado');
    });

    it('lista só os campos que mudaram e trata disparo novo como uma linha', () => {
        const row = (id: string, operationType: string, before: any, after: any): UpdateRunCandidateRow => ({
            id, operationType, status: 'applied', domain: 'aquisicao', targetTable: 'activities', targetRecordId: null,
            journey: 'JOR_AQS_X', activityName: `act_${id}`, channel: 'WhatsApp', date: '2026-11-23',
            fieldToReview: '', suggestion: '', basis: '', conflictReason: null, beforePayload: before, afterPayload: after,
        } as UpdateRunCandidateRow);
        const changes = buildFieldChanges([
            row('1', 'update_metrics', { Propostas: 296, 'Cartões Gerados': 37, Cliques: 10 }, { Propostas: 312, 'Cartões Gerados': 37, Cliques: 10 }),
            row('2', 'insert', null, { Propostas: 5 }),
        ]);
        expect(changes.map((change) => [change.activityName, change.field, change.before, change.after, change.date])).toEqual([
            ['act_1', 'Propostas', '296', '312', '23/11'],
            ['act_2', 'Linha nova', 'sem dado', 'criada', '23/11'],
        ]);
    });
});
