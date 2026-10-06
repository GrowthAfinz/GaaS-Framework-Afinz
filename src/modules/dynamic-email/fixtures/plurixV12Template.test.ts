import { describe, expect, it } from 'vitest';
import { PLURIX_V11_TEMPLATE } from './plurixV11Template';
import { PLURIX_V12_TEMPLATE } from './plurixV12Template';
import { renderDynamicEmail, type SubscriberSample } from '../ampscript/renderer';
import { emptyBriefingRow, templateActiveColumns, type BriefingRow } from '../domain/briefing';
import { plurixEnvelope } from '../domain/sfmcEnvelope';

const E1_MSG = 'Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.';
const E2_MSG = 'Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo.';

const row = (patch: Partial<BriefingRow> = {}): BriefingRow => Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000000c3'), {
  NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'CRM', SEQUENCIA: 'E-mail 1',
  HEADER: 'https://example.com/header.png', TITULO_COPY_1_AZUL: 'Conheça os benefícios do cartão +amigo', COR_COPY_1: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
  COPY_1_PRETO: 'O cartão +amigo já está disponível. Conheça os benefícios:', COR_COPY_PRETO_1: '#242424', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
  MENSAGEM_LIMITE: E1_MSG,
  ...patch,
});

const subscriber = (patch: Partial<SubscriberSample> = {}): SubscriberSample => ({
  CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500', PRODUTO: 'AMIGAO', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'CRM', ...patch,
});

const render = (briefing: BriefingRow, sample: SubscriberSample) => renderDynamicEmail(PLURIX_V12_TEMPLATE, briefing, sample);
const band = (html: string) => html.match(/<!-- V12: faixa[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';

describe('PLURIX V12 (candidata)', () => {
  it('é a V11 testada com a faixa trocada, e só isso', () => {
    expect(PLURIX_V12_TEMPLATE).not.toContain('Boa notícia%%[');
    expect(PLURIX_V12_TEMPLATE).toContain('SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")');
    expect(PLURIX_V12_TEMPLATE).toContain('%%=v(@FaixaLimite)=%%');
    expect(PLURIX_V12_TEMPLATE).not.toMatch(/TreatAsContent\(@(?:MensagemLimite|FaixaLimite)\)/);
    expect(PLURIX_V12_TEMPLATE).toContain('SET @TpCampanha = "CRM"');
    expect(PLURIX_V12_TEMPLATE).toContain('SET @DE_ESTADO = "ESTADO_SEQUENCIA_CRM"');
    expect(PLURIX_V12_TEMPLATE).not.toMatch(/\b(?:UpdateDE|InsertDE|UpsertDE|DeleteDE)\s*\(/);
    expect(PLURIX_V12_TEMPLATE).not.toContain('DE_POOL_OFERTAS_PLURIX');
    expect(PLURIX_V12_TEMPLATE.match(/%%\[/g)?.length).toBe(PLURIX_V12_TEMPLATE.match(/\]%%/g)?.length);
    // Fora a faixa, o corpo HTML é o mesmo da V11.
    const strip = (source: string) => source.slice(source.indexOf(']%%') + 3).replace(/%%\[ IF NOT EMPTY\(@(?:LimiteFmt|FaixaLimite)\) THEN \]%%[\s\S]*?<\/tr>\s*%%\[ ENDIF \]%%/, '');
    expect(strip(PLURIX_V12_TEMPLATE)).toBe(strip(PLURIX_V11_TEMPLATE));
  });

  it('E-mail 1 e E-mail 2 usam mensagens diferentes do próprio briefing', () => {
    const e1 = render(row(), subscriber());
    const e2 = render(row({ SEQUENCIA: 'E-mail 2', MENSAGEM_LIMITE: E2_MSG }), subscriber({ SEQUENCIA: 'E-mail 2' }));
    expect(e1.diagnostics).toEqual([]);
    expect(e2.diagnostics).toEqual([]);
    expect(band(e1.html)).toBe('Parabéns, Vania! Você tem R$ 3.500,00 de limite pré-aprovado no cartão +amigo.');
    expect(band(e2.html)).toBe('Boa notícia, Vania: você tem R$ 3.500,00 de limite pré-aprovado para pedir seu cartão +amigo.');
  });

  it('a faixa fica logo abaixo do header e antes do corpo', () => {
    const html = render(row(), subscriber()).html;
    expect(html.indexOf('header.png')).toBeLessThan(html.indexOf('Parabéns, Vania'));
    expect(html.indexOf('Parabéns, Vania')).toBeLessThan(html.indexOf('Conheça os benefícios do cartão'));
  });

  it('nome ausente usa "cliente"', () => {
    expect(band(render(row(), subscriber({ PRI_NOME: '' })).html)).toBe('Parabéns, cliente! Você tem R$ 3.500,00 de limite pré-aprovado no cartão +amigo.');
  });

  it.each(['', '0', 'R$ 3.500'])('limite "%s" não mostra faixa', (limit) => {
    const html = render(row(), subscriber({ LIMITE: limit })).html;
    expect(html).not.toContain('V12: faixa');
    expect(html).not.toContain('pré-aprovado');
  });

  it('mensagem vazia não mostra faixa, mesmo com limite', () => {
    expect(render(row({ MENSAGEM_LIMITE: '' }), subscriber()).html).not.toContain('V12: faixa');
  });

  it('marcador desconhecido não vaza para o e-mail', () => {
    const html = render(row({ MENSAGEM_LIMITE: 'Oi {{cpf}}, R$ {{limite}}' }), subscriber()).html;
    expect(html).not.toContain('{{');
    expect(html).not.toContain('V12: faixa');
  });

  it('corpo sem nome repetido depois da faixa', () => {
    const html = render(row(), subscriber()).html;
    expect(html.match(/Vania/g)).toHaveLength(1);
  });

  it('o editor libera MENSAGEM_LIMITE para este template', () => {
    expect(templateActiveColumns(PLURIX_V12_TEMPLATE).has('MENSAGEM_LIMITE')).toBe(true);
    expect(templateActiveColumns(PLURIX_V11_TEMPLATE).has('MENSAGEM_LIMITE')).toBe(false);
  });

  it('assunto e pré-cabeçalho copiados saem da mesma fonte da V12', () => {
    const envelope = plurixEnvelope(PLURIX_V12_TEMPLATE)!;
    expect(envelope.version).toBe('V12');
    expect(envelope.preheader).toContain('IF EMPTY(@PLXV12Inicializado) THEN');
    expect(envelope.preheader).toContain('SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")');
    expect(envelope.preheader.endsWith('%%=TreatAsContent(@PreCabecalho)=%%')).toBe(true);
  });
});
