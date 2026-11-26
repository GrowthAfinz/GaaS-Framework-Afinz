import { describe, expect, it } from 'vitest';
import {
  aggregatePool, coverageLabel, filterPoolRows, parsePoolActivityName, poolTotals, toPoolDispatchRow,
  type PoolDispatchRow,
} from './poolVisaModel';
import { fieldBlockedReason, sanitizeSelection, type ReportFieldDef } from '../relatorio/ReportColumnEditor';
import { POOL_DEFAULT_COLUMNS, POOL_FIELDS, POOL_PROFILES } from './poolVisaFields';

// Volumes inventados. Os nomes seguem o padrão de taxonomia, sem dado real.
const raw = (over: Record<string, unknown>) => ({
  id: Math.random().toString(36).slice(2),
  jornada: 'JOR_RENT_POOL_OFERTAS_VDV',
  BU: 'B2C',
  Canal: 'E-mail',
  'Activity name / Taxonomia': 'afz_x_rent_email_pool_disp1visa_pontual',
  'Data de Disparo': '2030-01-10T00:00:00+00:00',
  'Base Total': 100,
  'Base Acionável': 90,
  Abertura: 30,
  Cliques: 3,
  updated_at: '2030-01-11T10:00:00+00:00',
  ...over,
});
const rows = (list: Record<string, unknown>[]) => list.map((r) => toPoolDispatchRow(raw(r))).filter((r): r is PoolDispatchRow => r !== null);

describe('identificação das atividades do Pool', () => {
  it('aceita só as jornadas da lista fechada', () => {
    expect(toPoolDispatchRow(raw({}))?.bu).toBe('Afinz');
    expect(toPoolDispatchRow(raw({ jornada: 'JOR_RENT_POOL_OFERTAS_VDV_PLURIX', BU: 'Plurix' }))?.bu).toBe('Plurix');
    for (const jornada of ['JOR_RENT_POOL_OFERTAS', 'JOR_CIC_POOL_OFERTAS_PLURIX', 'JOR_RENT_VAI_DE_VISA', 'jor_rent_pool_ofertas_vdv', 'POOL MANUAL']) {
      expect(toPoolDispatchRow(raw({ jornada }))).toBeNull();
    }
  });
  it('descarta linha sem data válida', () => {
    expect(toPoolDispatchRow(raw({ 'Data de Disparo': null }))).toBeNull();
  });
});

describe('leitura do activity name', () => {
  it('lê toque, público e grupo da peça só no WhatsApp', () => {
    expect(parsePoolActivityName('afz_x_rent_wpp_pool_disp3visa_parcmoda_pontual', 'WhatsApp')).toEqual({ kind: 'disparo', touch: 3, audience: 'Parceiro', pieceGroup: 'Moda' });
    expect(parsePoolActivityName('afz_x_rent_wpp_pool_disp3visa_instgeral_pontual', 'WhatsApp')).toMatchObject({ audience: 'Institucional', pieceGroup: 'Genérico' });
    expect(parsePoolActivityName('afz_x_rent_wpp_pool_disp3visa_instbeleza_pontual', 'WhatsApp').pieceGroup).toBe('Saúde e Beleza');
    expect(parsePoolActivityName('afz_x_rent_wpp_pool_disp3visa_parcpresentes_pontual', 'WhatsApp').pieceGroup).toBe('Família e Presentes');
    // e-mail e SMS não têm grupo: ausente, nunca Genérico
    expect(parsePoolActivityName('afz_x_rent_email_pool_disp4visa_pontual', 'E-mail')).toEqual({ kind: 'disparo', touch: 4, audience: null, pieceGroup: null });
  });
  it('marca respostas de opt-out sem toque', () => {
    expect(parsePoolActivityName('afz_x_rent_wpp_pool_optout_instmoda_pontual', 'WhatsApp')).toMatchObject({ kind: 'optout', touch: null, pieceGroup: 'Moda' });
  });
});

describe('ausente não é zero', () => {
  const list = rows([
    { Canal: 'E-mail' },
    { Canal: 'SMS', 'Activity name / Taxonomia': 'afz_x_rent_sms_pool_disp2visa_pontual', 'Base Total': 200, 'Base Acionável': 180, Abertura: null, Cliques: null },
    { Canal: 'WhatsApp', 'Activity name / Taxonomia': 'afz_x_rent_wpp_pool_disp3visa_instmoda_pontual', 'Base Total': 10, 'Base Acionável': 10, Abertura: 6, Cliques: null },
  ]);
  it('soma com cobertura e taxas só com linhas conhecidas', () => {
    const t = poolTotals(list);
    expect(t.sent).toEqual({ value: 310, known: 3, total: 3 });
    expect(t.opens).toEqual({ value: 36, known: 2, total: 3 });
    expect(t.clicks).toEqual({ value: 3, known: 1, total: 3 });
    expect(t.openRate).toBeCloseTo(36 / 100); // 90 + 10 entregues com abertura informada
    expect(t.ctrDelivered).toBeCloseTo(3 / 90);
    expect(t.ctor).toBeCloseTo(3 / 30);
    expect(coverageLabel(t.clicks)).toBe('parcial: 1 de 3 linhas');
  });
  it('grupo só com nulos fica nulo e não zero', () => {
    const sms = aggregatePool(list, ['channel']).find((g) => g.dims.channel === 'SMS')!;
    expect(sms.opens.value).toBeNull();
    expect(sms.openRate).toBeNull();
    expect(coverageLabel(sms.opens)).toBe('não informado pela fonte');
  });
  it('dimensão ausente aparece como não informada', () => {
    const groups = aggregatePool(list, ['pieceGroup']).map((g) => g.dims.pieceGroup).sort();
    expect(groups).toEqual(['Moda', 'Não informado na fonte']);
  });
});

describe('filtros', () => {
  const list = rows([
    {},
    { jornada: 'JOR_RENT_POOL_OFERTAS_VDV_PLURIX', 'Data de Disparo': '2030-01-20T00:00:00+00:00' },
    { Canal: 'WhatsApp', 'Activity name / Taxonomia': 'afz_x_rent_wpp_pool_optout_instmoda_pontual' },
  ]);
  it('exclui opt-out por padrão e respeita BU e período', () => {
    const base = { start: null, end: null, bu: 'all' as const, channels: [], includeOptout: false };
    expect(filterPoolRows(list, base)).toHaveLength(2);
    expect(filterPoolRows(list, { ...base, includeOptout: true })).toHaveLength(3);
    expect(filterPoolRows(list, { ...base, bu: 'Plurix' })).toHaveLength(1);
    expect(filterPoolRows(list, { ...base, end: '2030-01-15' })).toHaveLength(1);
  });
});

describe('editor de colunas', () => {
  const f = (key: string, layer: string, state: ReportFieldDef['availability']['state'] = 'available'): ReportFieldDef => ({
    key, label: key, kind: 'metric', category: 'x', layer, source: 's', grain: 'g', definition: 'd', availability: { state },
  });
  it('bloqueia campo sem fonte e mistura de camadas', () => {
    expect(fieldBlockedReason(f('a', 'ga4', 'unavailable'), [])).toBeTruthy();
    expect(fieldBlockedReason(f('b', 'ga4'), [f('c', 'sfmc')])).toMatch(/não existe chave/);
    expect(fieldBlockedReason(f('d', 'common'), [f('c', 'sfmc')])).toBeNull();
    expect(sanitizeSelection(['c', 'b', 'd', 'zz'], [f('b', 'ga4'), f('c', 'sfmc'), f('d', 'common')])).toEqual(['c', 'd']);
  });
  it('padrão e perfis habilitados só usam campos disponíveis', () => {
    expect(sanitizeSelection(POOL_DEFAULT_COLUMNS, POOL_FIELDS)).toEqual(POOL_DEFAULT_COLUMNS);
    for (const p of POOL_PROFILES.filter((x) => !x.disabledReason)) {
      expect(sanitizeSelection(p.fields, POOL_FIELDS)).toEqual(p.fields);
    }
  });
});
