import { describe, expect, it } from 'vitest';
import type { PoolDispatchRow } from './poolVisaModel';
import { toLpEventRow, toLpTrafficRow, type LpEventRow, type LpFilters, type LpTrafficRow } from './poolVisaLpModel';
import { costByPeriod, crmCostSummary, cumulativeRatios, directShare, lpByChannel, lpDispatchMarks, reassignDirect } from './poolVisaCostModel';

// Dados sintéticos.
const row = (date: string, channel: string, delivered: number, cost: number | null, clicks: number | null, kind: 'disparo' | 'optout' = 'disparo'): PoolDispatchRow => ({
  id: `${date}${channel}${kind}`, date, month: date.slice(0, 7), bu: 'Afinz', buRaw: 'B2C', journey: 'J', activityName: 'x', channel, kind, touch: 1,
  audience: null, pieceGroup: null, sent: delivered, delivered, opens: null, clicks, channelCost: cost, estimatedCost: cost !== null, updatedAt: null, status: null,
});
const rows = [
  row('2026-01-01', 'E-mail', 1000, 10, 20),
  row('2026-01-02', 'SMS', 100, 60, null),
  row('2026-01-04', 'WhatsApp', 50, 40, null),
  row('2026-01-04', 'WhatsApp', 5, 2, null, 'optout'),
];
const traffic = [
  { event_date: '2026-01-03', source_medium: 'sfmc / sms', sessions: 10 },
  { event_date: '2026-01-03', source_medium: '(direct) / (none)', sessions: 6 },
  { event_date: '2026-01-05', source_medium: '(direct) / (none)', sessions: 24 },
  { event_date: '2026-01-05', source_medium: 'facebook.com / referral', sessions: 9 },
].map(toLpTrafficRow).filter((r): r is LpTrafficRow => r !== null);
const events = [
  { event_date: '2026-01-03', event_name: 'clique_oferta', source_medium: 'sfmc / sms', event_count: 2 },
  { event_date: '2026-01-05', event_name: 'clique_oferta', source_medium: '(direct) / (none)', event_count: 3 },
  { event_date: '2026-01-05', event_name: 'clique_site_visa', source_medium: '(direct) / (none)', event_count: 50 },
].map(toLpEventRow).filter((r): r is LpEventRow => r !== null);
const all: LpFilters = { start: null, end: null, origins: null, group: null, cell: null };

describe('Pool Visa · custo do CRM', () => {
  it('custo por acesso usa só SMS e WhatsApp e ignora outras origens e opt-out', () => {
    const s = crmCostSummary(rows, traffic, events, all);
    expect(s.total.value).toBe(110);
    expect(s.lpChannels.value).toBe(100);
    expect(s.lpSessions).toBe(40);
    expect(s.costPerAccess).toBe(2.5);
    expect(s.costPerLpOfferClick).toBe(20);
    // 110 / (20 cliques no e-mail + 5 cliques em oferta na LP)
    expect(s.costPerOfferClick).toBeCloseTo(4.4);
  });

  it('custo desconhecido deixa a razão indisponível', () => {
    const s = crmCostSummary([...rows, row('2026-01-06', 'SMS', 10, null, null)], traffic, events, all);
    expect(s.costPerAccess).toBeNull();
    expect(s.costPerOfferClick).toBeNull();
  });

  it('hipótese do Direto vai para o canal do último disparo, ou para SMS', () => {
    const marks = lpDispatchMarks(rows);
    expect(marks.map((m) => `${m.date} ${m.channel}`)).toEqual(['2026-01-02 SMS', '2026-01-04 WhatsApp']);
    expect(directShare('2026-01-03', 'day', marks)).toEqual({ SMS: 1 });
    expect(directShare('2026-01-05', 'day', marks)).toEqual({ WhatsApp: 1 });
    expect(directShare('2026-01-01', 'day', marks)).toEqual({});
    expect(directShare('2026-01-05', 'sms', marks)).toEqual({ SMS: 1 });
    expect(directShare('2026-01-05', 'none', marks)).toEqual({});
    const day = lpByChannel(traffic, events, all, 'day', marks);
    expect(day.SMS).toEqual({ sessions: 10, offerClicks: 2, hypSessions: 6, hypOfferClicks: 0 });
    expect(day.WhatsApp).toEqual({ sessions: 0, offerClicks: 0, hypSessions: 24, hypOfferClicks: 3 });
    expect(reassignDirect('2026-01-05', { direto: 24, outros: 9 }, 'day', marks)).toEqual({ whatsappHyp: 24, outros: 9 });
    expect(reassignDirect('2026-01-05', { direto: 24 }, 'none', marks)).toEqual({ direto: 24 });
  });

  it('diário acumula custo e volumes para a razão chegar com o atraso do acesso', () => {
    const periods = [...costByPeriod(rows, traffic, events, all, (d) => d).values()];
    const cum = cumulativeRatios(periods);
    expect(cum.get('2026-01-01')).toMatchObject({ cost: 10, costPerCommClick: 0.5, costPerAccess: null });
    expect(cum.get('2026-01-03')).toMatchObject({ cost: 70, costPerAccess: 60 / 16 });
    expect(cum.get('2026-01-05')).toMatchObject({ cost: 110, costPerAccess: 2.5, costPerLpOfferClick: 20, costPerOfferClick: 4.4 });
  });
});
