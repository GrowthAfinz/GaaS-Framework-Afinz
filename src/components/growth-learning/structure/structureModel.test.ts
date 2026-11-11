import { describe, expect, it } from 'vitest';
import type { ResultRow } from '../results/results.types';
import { computeSignal, dropPosition, emptyFilters, historyOptions, isDrift, kpis, passes, toggleIsolate, uniqueRows, type StructureCard } from './structureModel';

const row = (p: Partial<ResultRow>): ResultRow => ({
  id: Math.random().toString(36), date: '2026-11-01', domain: 'crm', bu: 'B2C', segment: 'Negados', partner: '', channel: 'WhatsApp',
  campaign: '', campaignLabel: '', type: '', title: 'act', primary: 10, secondary: 2, spend: null, conversions: null,
  duplicateKey: Math.random().toString(36), mapped: true, journey: 'JOR_A', crm: { actionable: 100 }, ...p,
});
const card = (p: Partial<StructureCard> = {}): StructureCard => ({
  id: 'c1', lane_id: 'l1', position: 1, title: 'Repescagem', audience: 'Negados', bus: ['B2C'], declared_status: 'rec', measurement: 'r',
  owner: '', wiki_note: '', external_note: '', data_scope: { domain: 'crm', scope: { segment: 'Negados' } }, archived: false, revision: 1,
  created_at: '', updated_at: '', ...p,
});
const TODAY = '2026-11-10';

describe('computeSignal', () => {
  it('sem vínculo de dados fica unlinked e não diverge', () => {
    const s = computeSignal(card({ data_scope: null }), [row({})], TODAY);
    expect(s.observed).toBe('unlinked');
    expect(isDrift(card({ data_scope: null }), s)).toBe(false);
  });
  it('soma 90 dias, último disparo e jornadas só das linhas que casam com o vínculo', () => {
    const rows = [row({ date: '2026-11-05' }), row({ date: '2026-10-01', journey: 'JOR_B' }), row({ date: '2026-01-01' }), row({ segment: 'Abandonados', date: '2026-11-09' })];
    const s = computeSignal(card(), rows, TODAY);
    expect(s.observed).toBe('on');
    expect(s.lastDate).toBe('2026-11-05');
    expect(s.dispatches90).toBe(2);
    expect(s.primary90).toBe(20);
    expect(s.base90).toBe(200);
    expect(s.journeys.map(j => j.journey)).toEqual(['JOR_A', 'JOR_B']);
    expect(s.monthly.map(m => m.month)).toEqual(['2026-01', '2026-10', '2026-11']);
  });
  it('any_of casa qualquer condição; renta usa base acionável da coluna secundária', () => {
    const rows = [row({ domain: 'renta', journey: 'J1', secondary: 50, crm: undefined }), row({ domain: 'renta', journey: 'J2', secondary: 30, crm: undefined, date: '2026-09-01' })];
    const s = computeSignal(card({ data_scope: { domain: 'renta', any_of: [{ journey: 'J1' }, { journey: 'J2' }] } }), rows, TODAY);
    expect(s.base90).toBe(80);
  });
  it('declarada ativa sem disparo recente diverge; ignora disparos futuros', () => {
    const s = computeSignal(card(), [row({ date: '2026-08-01' }), row({ date: '2026-12-01' })], TODAY);
    expect(s.observed).toBe('slow');
    expect(isDrift(card(), s)).toBe(true);
    expect(isDrift(card({ declared_status: 'est' }), s)).toBe(false);
    expect(computeSignal(card(), [row({ segment: 'Outro' })], TODAY).observed).toBe('none');
  });
});

describe('filtros e edição', () => {
  it('toggleIsolate isola, limpa e soma', () => {
    expect([...toggleIsolate(new Set<string>(), 'rec', false)]).toEqual(['rec']);
    expect([...toggleIsolate(new Set(['rec']), 'rec', false)]).toEqual([]);
    expect([...toggleIsolate(new Set(['rec']), 'mat', true)].sort()).toEqual(['mat', 'rec']);
    expect([...toggleIsolate(new Set(['rec', 'mat']), 'mat', true)]).toEqual(['rec']);
  });
  it('passes respeita status, BU, busca e atalhos', () => {
    const s = computeSignal(card(), [row({ date: '2026-07-01' })], TODAY);
    const f = emptyFilters();
    expect(passes(card(), s, f)).toBe(true);
    expect(passes(card(), s, { ...f, st: new Set(['con' as const]) })).toBe(false);
    expect(passes(card(), s, { ...f, bu: 'Plurix' })).toBe(false);
    expect(passes(card(), s, { ...f, q: 'repes' })).toBe(true);
    expect(passes(card(), s, { ...f, quick: 'drift' })).toBe(true);
    expect(passes(card(), s, { ...f, quick: 'unlinked' })).toBe(false);
  });
  it('dropPosition coloca entre vizinhos, no início e no fim', () => {
    const lane = [{ id: 'a', position: 1 }, { id: 'b', position: 2 }, { id: 'c', position: 3 }];
    expect(dropPosition(lane, 'x', 'b')).toBe(1.5);
    expect(dropPosition(lane, 'x', 'a')).toBe(0.5);
    expect(dropPosition(lane, 'x', null)).toBe(4);
    expect(dropPosition(lane, 'c', null)).toBe(3);
    expect(dropPosition([], 'x', null)).toBe(1);
  });
  it('kpis, histórico e duplicadas', () => {
    const cards = [card(), card({ id: 'c2', data_scope: null, measurement: 'n' })];
    const signals = new Map([['c1', computeSignal(cards[0], [row({ date: '2026-11-08' })], TODAY)], ['c2', computeSignal(cards[1], [], TODAY)]]);
    expect(kpis(cards, signals)).toMatchObject({ total: 2, active: 1, measured: 1, noSource: 1, unlinked: 1, drift: 0 });
    expect(historyOptions([row({ segment: 'B' }), row({ segment: 'A' }), row({ domain: 'renta', segment: 'Z' })], 'crm', 'segment')).toEqual(['A', 'B']);
    const r = row({ duplicateKey: 'k' });
    expect(uniqueRows([r, { ...r, id: 'other' }])).toHaveLength(1);
  });
});
