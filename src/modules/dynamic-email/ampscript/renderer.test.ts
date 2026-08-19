import { describe, expect, it } from 'vitest';
import { renderDynamicEmail } from './renderer';
import { emptyBriefingRow } from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';
import { PLURIX_UX_V2_TEMPLATE } from '../fixtures/plurixUxV2Template';

const subscriber = { CPF: '1', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };

describe('AMPscript-lite', () => {
  it('renderiza o caso real Visa com TreatAsContent recursivo', () => {
    const row = emptyBriefingRow('visa');
    Object.assign(row, { NM_PRODUTO_INTERNO: 'INSTITUCIONAL', TITULO_COPY_1_AZUL: 'Sua aprovação chegou!', COR_COPY_1: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_1: '24', COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%! Limite de %%=v(@LimiteNovo)=%%.', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16' });
    const result = renderDynamicEmail(DEFAULT_DYNAMIC_EMAIL_TEMPLATE, row, subscriber);
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('Olá, VANIA! Limite de R$ 3.500.');
    expect(result.html).toContain('color:#00C6CC');
  });

  it('omite H1 vazio e renderiza o caso Plurix', () => {
    const row = emptyBriefingRow('plurix');
    Object.assign(row, { NM_PRODUTO_INTERNO: 'PLURIX', COPY_1_PRETO: '%%=v(@FirstName)=%%, o Clube Amigão agora é +amigo!', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16', TITULO_COPY_2: 'E as novidades <br>não param por aí!', COR_TITULO_COPY_2: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_2: '22' });
    const result = renderDynamicEmail(DEFAULT_DYNAMIC_EMAIL_TEMPLATE, row, { ...subscriber, PRI_NOME: 'PABLO' });
    expect(result.html).not.toContain('<h1');
    expect(result.html).toContain('PABLO, o Clube Amigão agora é +amigo!');
    expect(result.html).toContain('E as novidades <br>não param por aí!');
    expect(result.html).toContain('color:#2C3490');
  });

  it('falha visivelmente para sintaxe fora do escopo', () => {
    const result = renderDynamicEmail('%%[ FOR @i = 1 TO 3 DO ]%%x%%[ NEXT @i ]%%', emptyBriefingRow(), subscriber);
    expect(result.diagnostics[0]).toContain('FOR');
    expect(result.html).toBe('');
  });

  it('renderiza o layout do E-mail 1 sem repetir título e CTA da arte', () => {
    const row = emptyBriefingRow('plurix-v2-email-1');
    Object.assign(row, {
      NM_PRODUTO_INTERNO: 'AMIGAO',
      TITULO_COPY_1_AZUL: 'Conheça os benefícios do cartão +amigo',
      COR_COPY_1: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
      COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%!',
      COR_COPY_PRETO_1: '#242424',
      TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
      BANNER_1_CORPO: 'https://example.com/beneficios.png',
      TITULO_CTA_1: 'QUERO MEU CARTÃO +AMIGO',
      LINK_CTA_1: 'https://example.com/cartao',
      TITULO_COPY_2: 'Saiba como solicitar seu cartão +amigo',
      COR_TITULO_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_2: '26',
      COPY_2_PRETO: 'Viu como é fácil?',
      COR_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_COPY_2: '16',
      BANNER_2_CORPO: 'https://example.com/passos.png',
      TITULO_CTA_2: 'PEDIR CARTÃO +AMIGO',
      LINK_CTA_2: 'https://example.com/pedir',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, PRI_NOME: 'VANIA' });
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('logo-mais-amigo.png');
    expect(result.html).toContain('Olá, VANIA!');
    expect(result.html).not.toContain('Conheça os benefícios do cartão +amigo');
    expect(result.html).not.toContain('QUERO MEU CARTÃO +AMIGO');
    expect(result.html.indexOf('passos.png')).toBeLessThan(result.html.indexOf('Viu como é fácil?'));
    expect(result.html.indexOf('Viu como é fácil?')).toBeLessThan(result.html.indexOf('PEDIR CARTÃO +AMIGO'));
    expect(result.html).toContain('background-color:#2C3490');
    expect(result.html).toContain('text-align:center');
    expect(result.html).toContain('<!-- Bloco SFMC omitido no preview local -->');
    expect(PLURIX_UX_V2_TEMPLATE).toContain('<custom name="opencounter" type="tracking"/>');
  });

  it('renderiza o layout do E-mail 2 com benefícios e painel de conversão', () => {
    const row = emptyBriefingRow('plurix-v2-email-2');
    Object.assign(row, {
      NM_PRODUTO_INTERNO: 'BOA',
      TITULO_COPY_2: 'Só quem tem o cartão +amigo aproveita mais',
      COR_TITULO_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_2: '26',
      COPY_2_PRETO: '<b>+5% de desconto</b> em produtos selecionados',
      COR_COPY_2: '#242424',
      TAMANHO_DA_FONTE_COPY_2: '17',
      BANNER_2_CORPO: 'https://example.com/cartoes.png',
      TITULO_CTA_2: 'PEDIR AGORA MEU CARTÃO +AMIGO',
      LINK_CTA_2: 'https://example.com/pedir',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, SEQUENCIA: 'E-mail 2' });
    expect(result.diagnostics).toEqual([]);
    expect(result.html).not.toContain('Benefícios do cartão +amigo');
    expect(result.html).toContain('+5% de desconto');
    expect(result.html).toContain('background-color:#F6F6FB');
    expect(result.html).toContain('text-align:left');
    expect(result.html).toContain('Peça agora seu cartão +amigo');
    expect(result.html).toContain('max-width:220px');
    expect(result.html).toContain('PEDIR AGORA MEU CARTÃO +AMIGO');
    expect(result.html).not.toContain('Saiba como solicitar');
  });
});
