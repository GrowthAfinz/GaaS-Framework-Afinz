import { describe, expect, it } from 'vitest';
import {
  cellExists, cellMatrix, knownGroupsAndCells, lpByPeriod, lpOrigin, lpTotals, normalizeCell, normalizeGroup,
  offerRanking, originsForChannels, sessionsByDayOrigin, toLpEventRow, toLpTrafficRow, type LpEventRow, type LpFilters, type LpTrafficRow,
} from './poolVisaLpModel';

// Dados sintéticos.
const traffic = [
  { event_date: '2026-01-10', source_medium: '(direct) / (none)', sessions: 10, page_views: 12 },
  { event_date: '2026-01-10', source_medium: 'sfmc / sms', sessions: 4, page_views: 5 },
  { event_date: '2026-01-11', source_medium: 'sfmc / whatsapp', sessions: 2, page_views: 2 },
  { event_date: '2026-02-01', source_medium: 'facebook.com / referral', sessions: 1, page_views: 1 },
].map(toLpTrafficRow).filter((r): r is LpTrafficRow => r !== null);

const ev = (o: Record<string, unknown>) => toLpEventRow({ marca_raw: '(not set)', oferta_id_raw: '(not set)', parceiro_raw: '(not set)', grupo_raw: '(not set)', celula_raw: '(not set)', ...o });
const events = [
  ev({ event_date: '2026-01-10', event_name: 'clique_oferta', source_medium: '(direct) / (none)', marca_raw: 'Marca X', event_count: 5 }),
  ev({ event_date: '2026-01-10', event_name: 'clique_oferta', source_medium: 'sfmc / sms', marca_raw: 'Marca Y', parceiro_raw: 'LOJA_A', event_count: 2 }),
  ev({ event_date: '2026-01-11', event_name: 'clique_oferta', source_medium: 'sfmc / whatsapp', marca_raw: 'Marca X', grupo_raw: 'moda', celula_raw: 'seg_a', event_count: 3 }),
  ev({ event_date: '2026-01-11', event_name: 'clique_oferta', source_medium: 'sfmc / whatsapp', grupo_raw: 'moda', celula_raw: 'seg_b', event_count: 1 }),
  ev({ event_date: '2026-01-11', event_name: 'clique_oferta', source_medium: 'sfmc / sms', grupo_raw: 'esporte', celula_raw: 'seg_a', event_count: 1 }),
  ev({ event_date: '2026-01-11', event_name: 'clique_site_visa', source_medium: '(direct) / (none)', event_count: 7 }),
].filter((r): r is LpEventRow => r !== null);

const all: LpFilters = { start: null, end: null, origins: null, group: null, cell: null };

describe('Pool Visa · LP (GA4)', () => {
  it('classifica origem sem confundir direto com WhatsApp', () => {
    expect(lpOrigin('(direct) / (none)')).toBe('direto');
    expect(lpOrigin('sfmc / sms')).toBe('sms');
    expect(lpOrigin('sfmc / whatsapp')).toBe('whatsapp');
    expect(lpOrigin('wpp / (not set)')).toBe('whatsapp');
    expect(lpOrigin('sfmc / email')).toBe('outros');
  });

  it('normaliza grupo e célula do link e não corrige valor desconhecido', () => {
    expect(normalizeGroup('moda')).toBe('MODA');
    expect(normalizeGroup('saude-beleza')).toBe('SAUDE_BELEZA');
    expect(normalizeGroup('esporte')).toBeNull();
    expect(normalizeCell('seg_a')).toBe('SEG-A');
    expect(normalizeCell('GEN-C')).toBe('GEN-C');
    expect(normalizeCell('seg_z')).toBeNull();
    expect(events[0].brand).toBe('Marca X');
    expect(events[0].partner).toBeNull();
  });

  it('soma totais e respeita filtro de canal (e-mail não passa pela LP)', () => {
    expect(lpTotals(traffic, events, all)).toEqual({ sessions: 17, offerClicks: 12, visaClicks: 7 });
    expect(originsForChannels([])).toBeNull();
    expect(originsForChannels(['E-mail'])).toEqual([]);
    const sms = { ...all, origins: originsForChannels(['SMS']) };
    expect(lpTotals(traffic, events, sms)).toEqual({ sessions: 4, offerClicks: 3, visaClicks: 0 });
  });

  it('com filtro de grupo ou célula, sessões ficam indisponíveis e não zeradas', () => {
    const t = lpTotals(traffic, events, { ...all, group: 'MODA' });
    expect(t.sessions).toBeNull();
    expect(t.offerClicks).toBe(4);
  });

  it('agrupa por mês e por dia × origem', () => {
    const m = lpByPeriod(traffic, events, all, (d) => d.slice(0, 7));
    expect(m.get('2026-01')).toEqual({ sessions: 16, offerClicks: 12, visaClicks: 7 });
    expect(m.get('2026-02')).toEqual({ sessions: 1, offerClicks: 0, visaClicks: 0 });
    expect(sessionsByDayOrigin(traffic, all).get('2026-01-10')).toEqual({ direto: 10, sms: 4 });
  });

  it('ranking separa não definido e conta só clique em oferta', () => {
    const brands = offerRanking(events, all, 'brand');
    expect(brands.items).toEqual([{ label: 'Marca X', value: 8 }, { label: 'Marca Y', value: 2 }]);
    expect(brands.undefinedCount).toBe(2);
    expect(brands.total).toBe(12);
    expect(offerRanking(events, all, 'partner').items).toEqual([{ label: 'LOJA_A', value: 2 }]);
  });

  it('matriz grupo × célula só conta cliques com parâmetros válidos e aponta inesperados', () => {
    const { matrix, quality } = cellMatrix(events, all);
    expect(matrix.get('MODA|SEG-A')).toBe(3);
    expect(matrix.get('MODA|SEG-B')).toBe(1);
    expect(quality).toEqual({ offerClicks: 12, withParams: 4, unexpected: 1, unexpectedValues: ['grupo=esporte'] });
    expect(knownGroupsAndCells(events)).toEqual({ groups: ['MODA'], cells: ['SEG-A', 'SEG-B'] });
    expect(cellExists('GENERICO', 'SEG-A')).toBe(false);
    expect(cellExists('MODA', 'GEN-A')).toBe(false);
    expect(cellExists('MODA', 'SEG-C')).toBe(true);
  });

  it('descarta linha com data ou evento inválido', () => {
    expect(toLpTrafficRow({ event_date: 'x', source_medium: 'a', sessions: 1 })).toBeNull();
    expect(toLpEventRow({ event_date: '2026-01-01', event_name: 'page_view', event_count: 1 })).toBeNull();
  });
});
