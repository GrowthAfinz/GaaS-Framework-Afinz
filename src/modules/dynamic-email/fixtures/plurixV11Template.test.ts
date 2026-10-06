import { describe, expect, it } from 'vitest';
import { PLURIX_V11_TEMPLATE } from './plurixV11Template';
import { renderDynamicEmail } from '../ampscript/renderer';
import { emptyBriefingRow } from '../domain/briefing';

describe('V11 factory simulation', () => {
  for (const sequence of ['E-mail 1', 'E-mail 2']) {
    it(`renders ${sequence} with COMUNICACAO_PLX aliases, image and limit`, () => {
      const row = emptyBriefingRow();
      Object.assign(row, { SEQUENCIA: sequence, TP_CAMPANHA: 'CRM', NM_PRODUTO_INTERNO: 'AMIGAO',
        HEADER: 'https://example.com/header.png', COPY_1_PRETO: 'Olá %%=v(@FirstName)=%%',
        TITULO_COPY_1_AZUL: 'Título', COR_COPY_1: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_1: '24' });
      const rendered = renderDynamicEmail(PLURIX_V11_TEMPLATE, row, {
        CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '1500', PRODUTO: 'AMIGAO', SEQUENCIA: sequence, TP_CAMPANHA: 'CRM',
      });
      expect(rendered.diagnostics).toEqual([]);
      expect(rendered.html).toContain('Olá Vania');
      expect(rendered.html).toContain('https://example.com/header.png');
      expect(rendered.html).toContain('R$ 1.500,00');
      expect(rendered.html).not.toContain('Oferta de');
    });
  }
  it.each(['', '0'])('hides unavailable limit %s', (limit) => {
    const row = emptyBriefingRow();
    const result = renderDynamicEmail(PLURIX_V11_TEMPLATE, row, { CPF: '00000000000', PRI_NOME: '', LIMITE: limit,
      PRODUTO: 'AMIGAO', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'CRM' });
    expect(result.html).not.toContain('limite pré-aprovado');
  });
});
