import { describe, expect, it } from 'vitest';
import { renderDynamicEmail } from '../ampscript/renderer';
import { emptyBriefingRow } from '../domain/briefing';
import { B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE } from './b2cClassicVibeDynamicTemplate';

const subscriber = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Aquisicao' };

describe('B2C Classic + Vibe dynamic template', () => {
  it('renderiza o mesmo motor com conteúdo e assets vindos do briefing', () => {
    const row = emptyBriefingRow('b2c-e1');
    Object.assign(row, {
      ASSUNTO: 'Oferta Afinz', PRE_CABECALHO: 'Confira', HEADER: 'https://cdn.example.com/e1.png',
      TITULO_COPY_1_AZUL: 'Olá, %%=v(@FirstName)=%%', COR_COPY_1: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_1: '22',
      COPY_1_PRETO: 'Peça seu cartão Afinz Visa.', COR_COPY_PRETO_1: '#111111', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '19',
      TITULO_CTA_1: 'Quero meu cartão', LINK_CTA_1: 'https://example.com/cartao',
    });
    const result = renderDynamicEmail(B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, row, subscriber);
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('https://cdn.example.com/e1.png');
    expect(result.html).toContain('Olá, VANIA');
    expect(result.html).toContain('Quero meu cartão');
  });

  it('não deixa espaços para blocos vazios', () => {
    const row = emptyBriefingRow('b2c-empty');
    const result = renderDynamicEmail(B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, row, subscriber);
    expect(result.diagnostics).toEqual([]);
    expect(result.html).not.toContain('Mais vantagens Afinz');
    expect(result.html).not.toContain('Sujeito à análise de crédito');
  });
});
