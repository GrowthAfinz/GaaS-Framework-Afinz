import { describe, expect, it } from 'vitest';
import { emptyBriefingRow, validateRows } from './briefing';
import { applyWorkspaceField, sharedFields, signatureFields, withMeta } from './workspace';

const base = (id: `${string}-${string}-${string}-${string}-${string}`, network: string) => withMeta(Object.assign(emptyBriefingRow(id), {
  DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: network, TP_CAMPANHA: 'Topo de Funil', SEQUENCIA: 'E-mail 1',
  HEADER_TITULO: 'Seu mercado rende mais!',
}), { segment: 'Topo de Funil Dinâmico', campaignGroupId: 'g1' });

describe('header dinâmico por assinatura', () => {
  it('textos e cartão são do e-mail; o logo é de cada assinatura', () => {
    expect(sharedFields).toEqual(expect.arrayContaining(['HEADER_TITULO', 'HEADER_SUBTITULO', 'HEADER_IMAGEM_CARTAO']));
    expect(sharedFields).not.toContain('HEADER_LOGO');
    expect(signatureFields).toContain('HEADER_LOGO');
    const rows = [base('0-0-0-0-a', 'AMIGAO'), base('0-0-0-0-b', 'BOA')];
    const logo = applyWorkspaceField(rows, '0-0-0-0-a', 'HEADER_LOGO', 'https://img/amigao.png');
    expect(logo.map((row) => row.HEADER_LOGO)).toEqual(['https://img/amigao.png', '']);
    const title = applyWorkspaceField(rows, '0-0-0-0-a', 'HEADER_TITULO', 'Novo título');
    expect(title.map((row) => row.HEADER_TITULO)).toEqual(['Novo título', 'Novo título']);
  });

  it('avisa a assinatura sem logo quando o header dinâmico está ligado', () => {
    const row = base('0-0-0-0-c', 'PARANA');
    expect(validateRows([row]).get('0-0-0-0-c')?.find((issue) => issue.code === 'header-logo-missing')?.message).toContain('PARANA');
    row.HEADER_LOGO = 'https://img/parana.png';
    expect(validateRows([row]).get('0-0-0-0-c')?.some((issue) => issue.code === 'header-logo-missing')).toBe(false);
    row.HEADER_TITULO = ''; row.HEADER_LOGO = '';
    expect(validateRows([row]).get('0-0-0-0-c')?.some((issue) => issue.code === 'header-logo-missing')).toBe(false);
  });
});
