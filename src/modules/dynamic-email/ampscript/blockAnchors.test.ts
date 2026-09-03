import { describe, expect, it } from 'vitest';
import { injectBlockAnchors, type AnchorBlockSpec } from './blockAnchors';
import { renderDynamicEmail } from './renderer';
import { DIA_CRM_DYNAMIC_TEMPLATE } from '../fixtures/diaCrmDynamicTemplate';
import { emptyBriefingRow, type BriefingRow } from '../domain/briefing';

const SPECS: AnchorBlockSpec[] = [
  { id: 'header', signatureColumns: ['HEADER'] },
  { id: 'primary', signatureColumns: ['TITULO_COPY_1_AZUL', 'COPY_1_PRETO', 'TITULO_CTA_1', 'BANNER_1_CORPO'] },
  { id: 'secondary', signatureColumns: ['TITULO_COPY_2', 'COPY_2_PRETO', 'TITULO_CTA_2', 'BANNER_2_CORPO'] },
  { id: 'closing', signatureColumns: ['BANNER_3_CORPO'] },
  { id: 'legal', signatureColumns: ['NOTA_LEGAL', 'RODAPE'] },
];

const SUBSCRIBER = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '1000', PRODUTO: 'DIA', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Aquisição' };

// Reproduz o caso real do DIA: o TÍTULO começa com as MESMAS palavras do
// pré-cabeçalho — a colisão que fazia a âncora do bloco 2 cair no <div
// display:none do pré-cabeçalho, no topo do <body>, invertendo os pinos.
function diaRow(): BriefingRow {
  const row = emptyBriefingRow('dia-1');
  Object.assign(row, {
    NM_PRODUTO_INTERNO: 'DIA',
    SEQUENCIA: 'E-mail 1',
    TP_CAMPANHA: 'Aquisição',
    ASSUNTO: 'Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!',
    PRE_CABECALHO: 'Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!',
    HEADER: 'https://image.relacionamento.afinz.com.br/lib/x/m/1/header-dia.png',
    TITULO_COPY_1_AZUL: 'Peça seu cartão Dia Afinz Visa e ganhe até R$100 em Créditos Vibe',
    COR_COPY_1: '#00C6CC',
    TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
    COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%! Peça seu <b>cartão Dia Afinz Visa</b>.',
    COR_COPY_PRETO_1: '#222222',
    TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16',
    TITULO_CTA_1: 'PEÇA JÁ O SEU',
    LINK_CTA_1: 'https://cartao-afinz.onelink.me/I1Ur/zr4jy3g1',
    BANNER_1_CORPO: 'https://image.relacionamento.afinz.com.br/lib/x/m/1/banner1-dia.png',
    TITULO_COPY_2: 'E não para por aí!',
    COR_TITULO_COPY_2: '#2C3490',
    TAMANHO_DA_FONTE_TITULO_COPY_2: '22',
    COPY_2_PRETO: 'Com o cartão Dia Afinz Visa você tem benefícios exclusivos.',
    BANNER_3_CORPO: 'https://image.relacionamento.afinz.com.br/lib/x/m/1/banner3-dia.png',
    NOTA_LEGAL: 'Sujeito à análise de crédito. Consulte o regulamento.',
    RODAPE: 'Afinz S.A. CNPJ 00.000.000/0001-00',
  });
  return row;
}

const positions = (html: string, ids: string[]) => ids.map((id) => html.indexOf(`data-eb-block="${id}"`));

describe('injectBlockAnchors', () => {
  it('injeta um marcador por bloco preenchido e sobrevive ao render', () => {
    const row = diaRow();
    const source = injectBlockAnchors(DIA_CRM_DYNAMIC_TEMPLATE, row, SPECS);
    const { html, diagnostics } = renderDynamicEmail(source, row, SUBSCRIBER);
    expect(diagnostics).toEqual([]);
    for (const spec of SPECS) {
      expect(html, `bloco ${spec.id} sem marcador`).toContain(`data-eb-block="${spec.id}"`);
    }
  });

  it('os marcadores aparecem na ORDEM declarada dos blocos', () => {
    const row = diaRow();
    const source = injectBlockAnchors(DIA_CRM_DYNAMIC_TEMPLATE, row, SPECS);
    const { html } = renderDynamicEmail(source, row, SUBSCRIBER);
    const found = positions(html, SPECS.map((spec) => spec.id));
    expect(found.every((value) => value >= 0)).toBe(true);
    expect([...found].sort((a, b) => a - b)).toEqual(found);
  });

  it('o marcador do bloco 2 fica DEPOIS do pré-cabeçalho, mesmo repetindo o texto dele', () => {
    const row = diaRow();
    const source = injectBlockAnchors(DIA_CRM_DYNAMIC_TEMPLATE, row, SPECS);
    const { html } = renderDynamicEmail(source, row, SUBSCRIBER);
    // o pré-cabeçalho oculto é o primeiro nó do body e repete o início do título
    const preheader = html.indexOf('display:none;max-height:0');
    const [header, primary] = positions(html, ['header', 'primary']);
    expect(preheader).toBeGreaterThan(-1);
    expect(header).toBeGreaterThan(preheader);
    expect(primary).toBeGreaterThan(header);
  });

  it('não injeta marcador para bloco sem conteúdo', () => {
    const row = diaRow();
    Object.assign(row, { BANNER_3_CORPO: '' });
    const source = injectBlockAnchors(DIA_CRM_DYNAMIC_TEMPLATE, row, SPECS);
    const { html } = renderDynamicEmail(source, row, SUBSCRIBER);
    expect(html).not.toContain('data-eb-block="closing"');
    expect(html).toContain('data-eb-block="legal"');
  });

  it('é idempotente — não duplica marcadores', () => {
    const row = diaRow();
    const once = injectBlockAnchors(DIA_CRM_DYNAMIC_TEMPLATE, row, SPECS);
    expect(injectBlockAnchors(once, row, SPECS)).toBe(once);
  });
});
