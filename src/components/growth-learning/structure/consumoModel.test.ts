import { describe, expect, it } from 'vitest';
import {
  aggregate, buildModel, classify, compileRules, goalPlan, itemAgg, metrics, monthlyProjection, periodFractions, planFor, presets, status,
  type ConsumoRule, type DispatchPayload, type PlanRow,
} from './consumoModel';

const rules: ConsumoRule[] = [
  { id: 'r9', priority: 99, pattern: '.', front: null, card_id: null, group_label: 'A classificar' },
  { id: 'r1', priority: 10, pattern: 'TESTE', front: null, card_id: null, group_label: 'Testes' },
  { id: 'r2', priority: 20, pattern: 'RECENCIA', front: 'Aquisição', card_id: 'c1', group_label: null },
  { id: 'r3', priority: 30, pattern: 'COB', front: 'Cobrança', card_id: null, group_label: 'Cobrança' },
  { id: 'r4', priority: 40, pattern: '([', front: null, card_id: null, group_label: 'Regex ruim' },
  { id: 'r5', priority: 50, pattern: 'GHOST', front: 'Aquisição', card_id: 'arquivado', group_label: null },
];
const board = {
  pillars: [{ id: 'p1', title: 'Aquisição', accent: '#00C6CC', position: 1 }, { id: 'p2', title: 'Rentabilização', accent: '#A855F7', position: 2 }],
  lanes: [{ id: 'l1', pillar_id: 'p1', position: 1 }, { id: 'l2', pillar_id: 'p2', position: 1 }],
  cards: [
    { id: 'c1', lane_id: 'l1', title: 'Recência de compra', position: 1, archived: false },
    { id: 'c2', lane_id: 'l2', title: 'Sem envio', position: 1, archived: false },
    { id: 'arquivado', lane_id: 'l1', title: 'Velha', position: 2, archived: true },
  ],
};
const months = ['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01', '2027-03-01', '2027-04-01', '2027-05-01', '2027-06-01', '2027-07-01'];
const plan: PlanRow[] = months.flatMap(m => [
  { front: 'Aquisição', channel: 'SMS' as const, month: m, volume: 300 },
  { front: 'Aquisição', channel: 'WPPM' as const, month: m, volume: 100 },
  { front: 'Aquisição', channel: 'WPPU' as const, month: m, volume: 20 },
]);
const pillarFronts = [{ front: 'Aquisição', pillar_id: 'p1', position: 1 }, { front: 'Cobrança', pillar_id: null, position: 2 }];
const payload: DispatchPayload = {
  journeys: ['JOR_RECENCIA_X', 'JOR_COB_FATURA', 'JOR_TESTE', 'JOR_NOVA', 'JOR_GHOST'],
  activities: ['a1', 'a2', 'a3', 'a4', 'a5'],
  rows: [
    [0, 0, 'SMS', '2026-08-10', 100, 90], [0, 0, 'SMS', '2026-10-25', 200, 190], [0, 0, 'WPP', '2026-11-05', 50, 40],
    [1, 1, 'EMAIL', '2026-11-01', 1000, null], [2, 2, 'PUSH', '2026-11-02', 5, 5], [3, 3, 'SMS', '2026-11-08', 7, 7],
    [4, 4, 'SMS', '2026-11-09', 3, 3], [0, 0, 'SMS', '2026-07-31', 999, 999],
  ],
  last: '2026-11-09', loaded_at: null,
};

describe('regras', () => {
  it('ordem por prioridade, regex inválida ignorada, jornada vazia usa activity', () => {
    const c = compileRules(rules);
    expect(c.map(x => x.rule.id)).toEqual(['r1', 'r2', 'r3', 'r5', 'r9']);
    expect(classify('JOR_RECENCIA_TESTE', 'x', c)?.id).toBe('r1');
    expect(classify('', 'afz_cob_sms', c)?.id).toBe('r3');
    expect(classify('JOR_QUALQUER', 'x', c)?.id).toBe('r9');
  });
});

describe('modelo', () => {
  const m = buildModel(board, rules, pillarFronts, plan, payload);
  it('liga envios a campanha ou grupo e põe cada item no pilar da frente', () => {
    expect(m.start).toBe('2026-08-01');
    expect(m.last).toBe(100);
    expect(m.dispatches).toHaveLength(7);
    expect(m.byItem.get('card:c1')?.length).toBe(3);
    expect(m.items.get('group:Cobrança')?.pillarKey).toBe('fora');
    expect(m.items.get('group:Campanha arquivada')?.front).toBe('Aquisição');
    const aq = m.pillars.find(p => p.key === 'p1')!;
    expect(aq.fronts).toEqual(['Aquisição']);
    expect(aq.items.map(i => i.label)).toEqual(['Recência de compra', 'Campanha arquivada']);
    expect(m.pillars.find(p => p.key === 'p2')!.items.map(i => i.label)).toEqual(['Sem envio']);
    expect(m.pillars.find(p => p.key === 'fora')!.items.map(i => i.label).sort()).toEqual(['A classificar', 'Cobrança', 'Testes']);
  });
  it('período, contrato, agregação e métricas', () => {
    const pf = periodFractions(m, 92, 100);
    expect(pf[3]).toBeCloseTo(9 / 30);
    expect(pf[2]).toBe(0);
    expect(planFor(m, ['Aquisição'], ['WPP'])[0]).toBe(120);
    expect(planFor(m, ['Aquisição', 'Cobrança'], ['SMS', 'EMAIL'])[0]).toBe(300);
    const per = presets(m).find(p => p.key === 'contrato')!;
    const aggs = aggregate(m, per);
    const a = itemAgg(aggs, 'card:c1', ['SMS', 'WPP']);
    expect(a.all).toBe(350);
    expect(a.m.slice(0, 4)).toEqual([100, 0, 200, 50]);
    expect(a.r30).toBe(250);
    const x = metrics(planFor(m, ['Aquisição'], ['SMS', 'WPP']), a, periodFractions(m, per.from, per.to), m.rem);
    expect(x.tot).toBe(420 * 12);
    expect(x.exp).toBeCloseTo(420 * 3 + 420 * 9 / 30);
    expect(x.proj).toBeCloseTo(350 + (250 / 30) * m.rem);
    expect(status(x)).toEqual(['info', 'Sobrando']);
    expect(presets(m).slice(-1)[0]?.label).toBe('nov/26 (até 09/11)');
  });
  it('situação e meta da campanha', () => {
    expect(status({ tot: 0, exp: 0, real: 10, uso: null, r30: 0, proj: 10, saldo: null })[1]).toBe('Sem linha no contrato');
    expect(status({ tot: 100, exp: 10, real: 20, uso: 2, r30: 0, proj: 200, saldo: -100 })[1]).toBe('Vai estourar');
    expect(status({ tot: 100, exp: 10, real: 10, uso: 1, r30: 0, proj: 200, saldo: -100 })[1]).toBe('Estoura no ritmo');
    expect(status({ tot: 100, exp: 10, real: 13, uso: 1.3, r30: 0, proj: 50, saldo: 50 })[1]).toBe('Acima do ritmo');
    expect(status({ tot: 100, exp: 10, real: 9, uso: 0.9, r30: 0, proj: 50, saldo: 50 })[1]).toBe('No ritmo');
    expect(goalPlan([{ card_id: 'c1', channel: 'SMS', monthly_volume: 10 }, { card_id: 'c1', channel: 'WPP', monthly_volume: 5 }], 'c1', ['SMS'])?.[0]).toBe(10);
    expect(goalPlan([], 'c1', ['SMS'])).toBeNull();
  });
  it('projeção mensal começa no dia seguinte ao último dado', () => {
    const p = monthlyProjection(m, 300);
    expect(p[2]).toBeNull();
    expect(p[3]).toBeCloseTo(10 * 21);
    expect(p[4]).toBeCloseTo(10 * 31);
  });
});
