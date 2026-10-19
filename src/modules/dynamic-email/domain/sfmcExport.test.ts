import { describe, it, expect } from 'vitest';
import { emptyBriefingRow, parseBriefingCsv, BRIEFING_COLUMNS } from './briefing';
import { buildSfmcExport, prepareSfmcExport } from './sfmcExport';

const row = () => Object.assign(emptyBriefingRow('00000000-0000-4000-8000-000000000001'), {
  NM_PRODUTO_INTERNO: 'BOA', TP_CAMPANHA: 'Topo de Funil', SEQUENCIA: 'E-mail 1',
  DT_INICIO: '2026-10-15T00:00', DT_FIM: '2027-10-19T23:59',
  HEADER_TITULO: 'Seu mercado rende mais!', HEADER_SUBTITULO: 'Economia, com você',
  HEADER_IMAGEM_CARTAO: 'https://img.example/cartao.png', HEADER_LOGO: '',
});

describe('export SFMC com header V13', () => {
  it('exporta conteúdo real das 41 colunas, aplica CRM só ao arquivo e mantém formato SFMC', () => {
    const source = row();
    const csv = buildSfmcExport([source], { campaignType: 'CRM', requireDynamicHeader: true });
    const parsed = parseBriefingCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(csv.split('\r\n')[0].split(',')).toEqual([...BRIEFING_COLUMNS]);
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(csv).toContain('10/15/2026 00:00:00');
    expect(csv).toContain('"Economia, com você"');
    expect(parsed.rows[0]).toMatchObject({ TP_CAMPANHA: 'CRM', HEADER_TITULO: source.HEADER_TITULO, HEADER_SUBTITULO: source.HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO: source.HEADER_IMAGEM_CARTAO, HEADER_LOGO: '' });
    expect(source.TP_CAMPANHA).toBe('Topo de Funil');
  });
  it('bloqueia título ou cartão ausente sem inventar conteúdo; permite logo opcional', () => {
    for (const field of ['HEADER_TITULO', 'HEADER_IMAGEM_CARTAO'] as const) {
      const source = row(); source[field] = '';
      expect(() => buildSfmcExport([source], { campaignType: 'CRM', requireDynamicHeader: true })).toThrow('Header V13 incompleto');
    }
    expect(() => buildSfmcExport([row()], { campaignType: 'CRM', requireDynamicHeader: true })).not.toThrow();
  });
  it('mantém export legado e campanha original quando não há escolha de override', () => {
    const source = row(); source.HEADER_TITULO = ''; source.HEADER_IMAGEM_CARTAO = '';
    expect(prepareSfmcExport([source], { campaignType: '', requireDynamicHeader: false })[0]).toMatchObject(source);
  });
  it('bloqueia colisão criada ao converter duas campanhas para CRM', () => {
    expect(() => prepareSfmcExport([row(), { ...row(), TP_CAMPANHA: 'CRM' }], { campaignType: 'CRM', requireDynamicHeader: true })).toThrow('Chave SFMC duplicada');
  });
});
