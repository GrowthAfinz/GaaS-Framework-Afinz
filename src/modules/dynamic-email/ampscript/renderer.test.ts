import { describe, expect, it } from 'vitest';
import { renderDynamicEmail } from './renderer';
import { emptyBriefingRow } from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';

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
});
