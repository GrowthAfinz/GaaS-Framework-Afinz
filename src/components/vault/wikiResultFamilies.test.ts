import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchesWikiAnalytics, readWikiAnalytics, readWikiLiveLists, readWikiMatrix, readWikiVariants, refineWithinNote } from './wikiAnalytics';
import { normalizeWikiPageType, wikiPageType } from './wikiPageTypes';
import { wikiTopicForNote } from './wikiNavigation';
import { resultPagesByType } from './wikiCatalogNavigation';
import { classifyRecordScope, linkTargetsNote, normalizeRecordScope, noteScopeCandidates, rankScoped } from './scopedRecords.logic';
import { applyRefinement, cleanScope, refinementOptions } from '../growth-learning/results/results.logic';
import { buildAudiencePartnerMatrix, cellScope, matrixKey } from '../growth-learning/results/audienceMatrix.logic';
import { EMPTY_SCOPE, ResultRow } from '../growth-learning/results/results.types';
import { VaultNoteSummary } from './vaultTypes';

// Frontmatter of 10-Resultados/Publicos/Publico-Carrinho-Abandonado.md (pilot page of the new wiki).
const carrinho = {
  tipo: 'publico', codigo_dado: 'Abandonados',
  growth_catalog: { segmento: 'Abandonados' },
  analytics: { domain: 'crm', scope: { segment: 'Abandonados' } },
  variantes: [
    { operation_id: 'CRM-f9b25b84df', bu: 'B2C', partner: 'Serasa' }, { operation_id: 'CRM-2cc364c6bd', bu: 'B2C', partner: 'Proprietaria' },
    { operation_id: 'CRM-bdc57e480d', bu: 'Plurix', partner: 'Plurix' }, { operation_id: 'CRM-3bd920ad5c', bu: 'B2B2C', partner: 'Bem Barato' },
    { operation_id: 'CRM-c063e536a7', bu: 'B2B2C', partner: 'Dia' },
  ],
};
// Shape of the confirmed operation notes (Assunto-CRM-92fbd40403 / -a695575900): must keep working unchanged.
const legacyOperation = { analytics: { domain: 'crm', scope: { bu: 'Plurix', partner: 'Plurix', segment: 'Negados', operation_id: 'CRM-92fbd40403' } } };
const row = (patch: Partial<ResultRow> = {}): ResultRow => ({ id: Math.random().toString(36), date: '2026-09-10', domain: 'crm', ...EMPTY_SCOPE, segment: 'Abandonados', campaignLabel: '', title: '', primary: 10, secondary: 100, spend: null, conversions: null, duplicateKey: Math.random().toString(36), mapped: true, ...patch });
afterEach(() => vi.useRealTimers());

describe('Page families of the results wiki', () => {
  it('recognizes the six page types without touching growth-assunto notes', () => {
    expect(normalizeWikiPageType('Público')).toBe('publico');
    expect(normalizeWikiPageType('Domínio')).toBe('dominio');
    expect(normalizeWikiPageType('conceito')).toBeNull();
    expect(wikiPageType({ note_type: 'concept', frontmatter: { tipo: 'mecanica' } })).toBe('mecanica');
    expect(wikiPageType({ note_type: 'iniciativa' })).toBe('iniciativa');
    expect(wikiTopicForNote({ relative_path: '10-Resultados/Publicos/Publico-Carrinho-Abandonado.md', folder: '10-Resultados/Publicos', tags: ['publico'] })).toBe('Resultados');
    expect(wikiTopicForNote({ relative_path: 'X/Plurix.md', folder: 'X', tags: [], note_type: 'parceiro' })).toBe('Resultados');
    expect(wikiTopicForNote({ relative_path: '07-Evolucao/Assunto-CRM-92fbd40403.md', folder: '07-Evolucao', tags: ['growth-assunto'] })).toBe('Resultados');
    expect(wikiTopicForNote({ relative_path: '04-Operacao/Servico-Emails-Dinamicos.md', folder: '04-Operacao', tags: [] })).toBe('CRM e e-mails dinâmicos');
  });
  it('lists new pages by type in the catalog and leaves growth-assunto notes out of that list', () => {
    const notes = [
      { id: 'p', title: 'Carrinho abandonado', tags: ['publico'], note_type: 'publico' },
      { id: 'd', title: 'CRM Aquisição', tags: [], note_type: 'dominio' },
      { id: 'a', title: 'Assunto', tags: ['growth-assunto'], note_type: 'publico' },
      { id: 'c', title: 'Conceito', tags: [], note_type: 'conceito' },
    ] as VaultNoteSummary[];
    expect(resultPagesByType(notes).map(group => [group.type, group.notes.map(note => note.id)])).toEqual([['dominio', ['d']], ['publico', ['p']]]);
  });
});

describe('BU and partner refinements inside a page', () => {
  it('keeps the confirmed operation notes exactly as before', () => {
    const config = readWikiAnalytics(legacyOperation)!;
    expect(config.scope).toEqual(cleanScope('crm', legacyOperation.analytics.scope));
    expect(refineWithinNote(config, { ...EMPTY_SCOPE, partner: 'Serasa', bu: 'B2C', journey: 'J1' })).toEqual({ bu: 'Plurix', partner: 'Plurix', segment: 'Negados', operation_id: 'CRM-92fbd40403', journey: 'J1' });
  });
  it('lets a public page narrow by BU and partner without leaving its fixed segment', () => {
    const config = readWikiAnalytics(carrinho)!;
    expect(refineWithinNote(config, { ...EMPTY_SCOPE, segment: 'Negados', partner: 'Plurix', bu: 'Plurix' })).toEqual({ segment: 'Abandonados', partner: 'Plurix', bu: 'Plurix' });
  });
  it('drops a refinement that no any_of rule admits instead of showing an empty page', () => {
    const config = readWikiAnalytics({ analytics: { domain: 'renta', scope: {}, any_of: [{ partner: 'Plurix', journey: 'J1' }, { partner: 'Dia' }] } })!;
    expect(refineWithinNote(config, { partner: 'Serasa' })).toEqual({});
    expect(refineWithinNote(config, { partner: 'Dia', journey: 'J9' })).toEqual({ partner: 'Dia', journey: 'J9' });
    expect(refineWithinNote(config, { bu: 'B2C' })).toEqual({ bu: 'B2C' });
  });
  it('offers every observed value and clears a coupled BU or partner that no longer fits', () => {
    const rows = [row({ bu: 'B2C', partner: 'Serasa' }), row({ bu: 'B2C', partner: 'Proprietaria' }), row({ bu: 'Plurix', partner: 'Plurix' })];
    const scope = { ...EMPTY_SCOPE, segment: 'Abandonados', bu: 'Plurix', partner: 'Plurix' };
    expect(refinementOptions(rows, scope, 'partner')).toEqual(['Plurix', 'Proprietaria', 'Serasa']);
    expect(applyRefinement(rows, scope, 'partner', 'Serasa')).toMatchObject({ partner: 'Serasa', bu: '' });
    expect(applyRefinement(rows, scope, 'partner', 'Serasa', { bu: 'Plurix' })).toMatchObject({ partner: 'Serasa', bu: 'Plurix' });
    expect(applyRefinement(rows, { ...scope, partner: '' }, 'partner', 'Plurix')).toMatchObject({ partner: 'Plurix', bu: 'Plurix' });
    expect(applyRefinement(rows, scope, 'partner', '')).toMatchObject({ partner: '', bu: 'Plurix' });
    expect(applyRefinement(rows, { ...scope, operation_id: 'CRM-bdc57e480d' }, 'partner', 'Serasa').operation_id).toBe('');
    expect(applyRefinement(rows, { ...scope, operation_id: 'CRM-bdc57e480d' }, 'channel', 'SMS').operation_id).toBe('CRM-bdc57e480d');
    expect(applyRefinement(rows, { ...scope, operation_id: 'CRM-92fbd40403' }, 'partner', 'Serasa', { operation_id: 'CRM-92fbd40403' }).operation_id).toBe('CRM-92fbd40403');
  });
  it('accepts a page whose whole filter comes from any_of (Topo de funil: two segments)', () => {
    const config = readWikiAnalytics({ analytics: { domain: 'crm', scope: {}, any_of: [{ segment: 'CRM' }, { segment: 'Base_Proprietaria' }] } })!;
    expect(config.anyOf.map(rule => rule.segment)).toEqual(['CRM', 'Base_Proprietaria']);
    expect(matchesWikiAnalytics(row({ segment: 'Base_Proprietaria' }), config)).toBe(true);
    expect(matchesWikiAnalytics(row({ segment: 'Negados' }), config)).toBe(false);
    expect(refineWithinNote(config, { segment: 'CRM', partner: 'Plurix' })).toEqual({ segment: 'CRM', partner: 'Plurix' });
    expect(refineWithinNote(config, { segment: 'Negados' })).toEqual({});
    expect(readWikiMatrix({ tipo: 'publico' }, config, true)).toBe(config);
    expect(noteScopeCandidates(config)).toEqual([{ segment: 'CRM' }, { segment: 'Base_Proprietaria' }]);
  });
  it('reads variants as names of operations, rejecting invalid ones', () => {
    expect(readWikiVariants(carrinho, 'crm').map(v => v.partner)).toEqual(['Serasa', 'Proprietaria', 'Plurix', 'Bem Barato', 'Dia']);
    expect(readWikiVariants({ variantes: [{ sql: 'x' }] }, 'crm')).toEqual([]);
    expect(readWikiVariants({ variantes: [{ campaign: 'x' }] }, 'crm')).toEqual([]);
  });
});

describe('Matrix and live list declarations', () => {
  it('turns the matrix on for domain, public and partner pages, and only narrows the result scope', () => {
    const analytics = readWikiAnalytics(carrinho)!;
    expect(readWikiMatrix(carrinho, analytics, true)).toBe(analytics);
    expect(readWikiMatrix(carrinho, analytics, false)).toBeNull();
    expect(readWikiMatrix({ ...carrinho, matriz: false }, analytics, true)).toBeNull();
    expect(readWikiMatrix({ ...carrinho, matriz: { scope: { bu: 'B2C' } } }, analytics)!.scope).toMatchObject({ segment: 'Abandonados', bu: 'B2C' });
    expect(readWikiMatrix({ ...carrinho, matriz: { scope: { segment: 'Negados' } } }, analytics)).toBeNull();
    expect(readWikiMatrix({ matriz: { domain: 'media', scope: {} } }, null)).toBeNull();
    expect(readWikiMatrix({ matriz: { domain: 'crm', scope: { partner: 'Plurix' } } }, null)!.scope.partner).toBe('Plurix');
    const b2c = readWikiAnalytics({ analytics: { domain: 'b2c', scope: { type: 'total' } } });
    expect(readWikiMatrix({ matriz: true }, b2c)).toBeNull();
  });
  it('enables live lists for page families and keeps legacy subjects untouched', () => {
    const analytics = readWikiAnalytics(legacyOperation)!;
    expect(readWikiLiveLists(legacyOperation, analytics, false)).toBeNull();
    expect(readWikiLiveLists({ ...legacyOperation, listas_vivas: true }, analytics)).toBe(analytics);
    expect(readWikiLiveLists({ listas_vivas: { domain: 'media', scope: { campaign: 'X' } } }, null)!.domain).toBe('media');
  });
});

describe('Public × partner matrix', () => {
  it('builds only observed combinations, keeps absent ones empty and compares the same calendar cut', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-28T15:00:00Z'));
    const dup = row({ partner: 'Serasa', duplicateKey: 'same' });
    const rows = [
      row({ partner: 'Serasa', primary: 30 }), dup, row({ partner: 'Serasa', duplicateKey: 'same', date: '2026-09-11' }),
      row({ partner: 'Plurix', primary: 5, secondary: 50 }), row({ segment: 'Negados', partner: 'Plurix', primary: 2 }),
      row({ partner: 'Serasa', date: '2026-08-05', primary: 20 }), row({ partner: 'Plurix', date: '2026-08-05', primary: null }),
    ];
    const duplicates = new Set([dup.id, rows[2].id]);
    const matrix = buildAudiencePartnerMatrix(rows, duplicates, '2026-09', '2026-10-27', ['Dia']);
    expect(matrix.partners).toEqual(['Dia', 'Serasa', 'Plurix']);
    expect(matrix.cells.has(matrixKey('Negados', 'Serasa'))).toBe(false);
    expect(matrix.cells.has(matrixKey('Abandonados', 'Dia'))).toBe(false);
    const serasa = matrix.cells.get(matrixKey('Abandonados', 'Serasa'))!;
    expect(serasa.summary.primary).toBe(30);
    expect(serasa.summary.usable).toBe(1);
    expect(serasa.variation).toBeCloseTo(50);
    expect(matrix.cells.get(matrixKey('Abandonados', 'Plurix'))!.variationNote).toBe('Comparação incompleta');
    expect(matrix.cells.get(matrixKey('Negados', 'Plurix'))!.variationNote).toBe('Sem registros no mês anterior');
    expect(matrix.segmentTotals.get('Abandonados')!.summary.primary).toBe(35);
  });
  it('attaches a declared operation to a cell only when every row of the cell belongs to it', () => {
    const variants = readWikiVariants(carrinho, 'crm');
    expect(cellScope('Abandonados', 'Plurix', [row({ bu: 'Plurix', partner: 'Plurix' })], variants)).toEqual({ segment: 'Abandonados', partner: 'Plurix', bu: 'Plurix', operation_id: 'CRM-bdc57e480d' });
    expect(cellScope('Abandonados', 'Plurix', [row({ bu: 'Plurix' }), row({ bu: 'B2C' })], variants)).toEqual({ segment: 'Abandonados', partner: 'Plurix' });
    expect(cellScope('Abandonados', 'Outro', [row({ bu: 'B2C' })], variants)).toEqual({ segment: 'Abandonados', partner: 'Outro' });
  });
});

describe('Live lists scoped like the page', () => {
  const page = noteScopeCandidates(readWikiAnalytics(carrinho)!);
  it('normalizes the scope shapes written by different surfaces', () => {
    expect(normalizeRecordScope({ bu: ['B2C'], parceiros: [], segmentos: ['Abandonados'], canais: [] })).toEqual({ bu: ['B2C'], segment: ['Abandonados'] });
    expect(normalizeRecordScope({ domain: 'crm', channel: 'email', partner: 'N/A' })).toEqual({ channel: ['email'] });
    expect(normalizeRecordScope({ ...EMPTY_SCOPE, segment: 'Abandonados', operation_id: 'CRM-1' })).toEqual({ segment: ['Abandonados'] });
  });
  it('ranks same scope, related scope and front context, and excludes conflicting records', () => {
    expect(classifyRecordScope({ segment: ['Abandonados'], partner: ['Plurix'] }, page)).toBe('escopo');
    expect(classifyRecordScope({ channel: ['email'] }, page)).toBe('frente');
    expect(classifyRecordScope({ segment: ['Negados'] }, page)).toBeNull();
    const operation = noteScopeCandidates(readWikiAnalytics(legacyOperation)!);
    expect(classifyRecordScope({ partner: ['plurix'] }, operation)).toBe('relacionado');
    expect(classifyRecordScope({ partner: ['Serasa'] }, operation)).toBeNull();
    expect(classifyRecordScope({ segment: ['Aprovados não convertidos'] }, noteScopeCandidates(readWikiAnalytics({ analytics: { domain: 'crm', scope: { segment: 'Aprovados_nao_convertidos' } } })!))).toBe('escopo');
    expect(classifyRecordScope({ partner: ['Plurix'] }, noteScopeCandidates(readWikiAnalytics({ analytics: { domain: 'crm', scope: {} } })!))).toBe('escopo');
    expect(rankScoped([{ item: 'a', relation: 'frente', date: '2026-10-01' }, { item: 'b', relation: 'escopo', date: '2026-01-01' }, { item: 'c', relation: 'nota', date: '2025-01-01' }]).map(x => x.item)).toEqual(['c', 'b', 'a']);
  });
  it('recognizes learning links that point to the page itself', () => {
    expect(linkTargetsNote('Afinz-CRM-Midia-Vault/10-Resultados/Publicos/Publico-Carrinho-Abandonado.md#o-que-ja-aprendemos', '10-Resultados/Publicos/Publico-Carrinho-Abandonado.md')).toBe(true);
    expect(linkTargetsNote('Afinz-CRM-Midia-Vault/04-Operacao/Emails-Dinamicos-SFMC.md', '10-Resultados/Publicos/Publico-Carrinho-Abandonado.md')).toBe(false);
  });
  it('keeps any_of memberships as alternatives', () => {
    const config = readWikiAnalytics({ analytics: { domain: 'crm', scope: { segment: 'Abandonados' }, any_of: [{ partner: 'Plurix' }, { partner: 'Dia' }] } })!;
    expect(matchesWikiAnalytics(row({ partner: 'Dia' }), config)).toBe(true);
    expect(classifyRecordScope({ partner: ['Dia'], segment: ['Abandonados'] }, noteScopeCandidates(config))).toBe('escopo');
    expect(classifyRecordScope({ partner: ['Serasa'] }, noteScopeCandidates(config))).toBeNull();
  });
});
