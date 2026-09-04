import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BEM_BARATO_CRM_DYNAMIC_TEMPLATE,
  BEM_BARATO_CRM_DYNAMIC_TEMPLATE_ID,
  BEM_BARATO_CRM_DYNAMIC_TEMPLATE_NAME,
} from './bemBaratoCrmDynamicTemplate';
import { renderDynamicEmail } from '../ampscript/renderer';
import { emptyBriefingRow, type BriefingRow } from '../domain/briefing';

const SEQUENCES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const row = (sequence: number): BriefingRow => {
  const briefing = emptyBriefingRow(`bb-${sequence}`);
  Object.assign(briefing, {
    NM_PRODUTO_INTERNO: 'BEM BARATO', TP_CAMPANHA: 'CRM', SEQUENCIA: `E-mail ${sequence}`,
    CARTAO_NM_COMERCIAL: 'Bem Mais Afinz Visa',
    ASSUNTO: `Assunto ${sequence}`, PRE_CABECALHO: `Pré-cabeçalho ${sequence}`,
    HEADER: 'https://image.relacionamento.afinz.com.br/lib/x/m/1/header.png',
    TITULO_COPY_1_AZUL: 'Todos os benefícios em um cartão!', COR_COPY_1: '#00C6CC',
    TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
    COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%<br><br>Com o <b>cartão Bem Mais Afinz Visa</b> você faz mais.',
    COR_COPY_PRETO_1: '#000000', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '19',
    TITULO_CTA_1: 'Pedir meu cartão', LINK_CTA_1: 'https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh',
    TITULO_COPY_2: 'E não para por aí!', COR_TITULO_COPY_2: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_2: '22',
    COPY_2_PRETO: 'Você ganha Créditos Vibe.', COR_COPY_2: '#000000', TAMANHO_DA_FONTE_COPY_2: '19',
    TITULO_CTA_2: 'Quero meu cartão', LINK_CTA_2: 'https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh',
    NOTA_LEGAL: '*Sujeito à aprovação de crédito. Consulte termos em: grupobemmais.com.br/cartao.',
    COR_NOTA_LEGAL: '#999999', TAMANHO_DA_FONTE_NOTA_LEGAL: '9',
  });
  return briefing;
};

const render = (sequence: number) => renderDynamicEmail(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, row(sequence), {
  CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500',
  PRODUTO: 'BEM BARATO', SEQUENCIA: `E-mail ${sequence}`, TP_CAMPANHA: 'CRM',
});

describe('Bem Barato CRM dynamic template', () => {
  it('mantém a identificação governada do template', () => {
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE_ID).toBe('bem-barato-crm-dynamic-v1');
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE_NAME).toBe('Bem Barato CRM - Régua dinâmica v1');
  });

  it('preserva o contrato de lookup da DE com a chave composta completa', () => {
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).toContain('LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO"');
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).toContain('"NM_PRODUTO_INTERNO",@Produto');
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).toContain('"TP_CAMPANHA",@TpCampanha');
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).toContain('"SEQUENCIA",@Sequencia');
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).toContain('RaiseError("Dados de briefing da campanha não encontrados.", true)');
  });

  it('lê os 36 campos do briefing', () => {
    const columns = [
      'ASSUNTO', 'PRE_CABECALHO', 'HEADER', 'CARTAO_NM_COMERCIAL', 'TITULO_COPY_1_AZUL', 'COR_COPY_1',
      'TAMANHO_DA_FONTE_TITULO_COPY_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1', 'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1',
      'TITULO_CTA_1', 'LINK_CTA_1', 'TITULO_COPY_2', 'COR_TITULO_COPY_2', 'TAMANHO_DA_FONTE_TITULO_COPY_2',
      'COPY_2_PRETO', 'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2', 'TITULO_CTA_2', 'LINK_CTA_2',
      'BANNER_1_CORPO', 'LINK_BANNER_1_CORPO', 'BANNER_2_CORPO', 'LINK_BANNER_2_CORPO',
      'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO', 'NOTA_LEGAL', 'COR_NOTA_LEGAL',
      'TAMANHO_DA_FONTE_NOTA_LEGAL', 'RODAPE',
    ];
    for (const column of columns) {
      expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, `campo ${column} não é lido`).toContain(`Field(@Row, "${column}")`);
    }
  });

  it('mantém as artes fixas da régua Bem Barato e da Vibe', () => {
    for (const asset of [
      '160b947b-93b3-49f8-9537-84245584e143.png', // logo Afinz
      'dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png', // benefício Bem Barato
      '3f2ff739-5b6d-4484-ba6a-d552390794ba.png',
      '63c27266-d881-4e29-b256-fb6c3a2348ed.png',
      '87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png',
      'ba613caa-444d-4954-acd0-1b151dada6ec.png', // benefício Vibe
      'c392c8ff-b97f-4a86-8c56-df49ea5b2374.png',
      '82ec3fce-c040-4f7a-b450-e96b9f062489.png',
      'b3063d8e-942f-497d-bd51-ad7754b5abe7.png',
      '2f1fef6e-62d6-491a-8df1-fbea4eac2046.png',
      '787eb5c7-39ee-4b30-987a-0a81a38241a3.png', // logo do rodapé
    ]) expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, `asset ausente: ${asset}`).toContain(asset);
  });

  it('mantém o rodapé institucional completo', () => {
    for (const text of [
      'Afinz, juntos fazemos mais!',
      'Curta a Afinz',
      'Por favor, não responda esse e-mail.',
      'Canal de atendimento:',
      'Ouvidoria',
      '0800 772 0602',
      'CNPJ: 04.814.563/0001-74',
      'CNPJ: 60.114.865/0001-00',
      'Rua XV de novembro, 45 - Sorocaba, SP',
    ]) expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, `rodapé sem: ${text}`).toContain(text);
  });

  it('não carrega identidade, oferta ou asset de outro parceiro', () => {
    for (const foreign of [
      'Dia Afinz Visa', 'dia_topo_de_funil', 'dia-crm-dynamic',
      '+amigo', 'Amigão', 'AMIGAO', 'Plurix', 'plurix',
      'Cartão Afinz, vantagens de ponta a ponta!',
      'd6162872-070f-4e72-af53-93b632946d98', // oferta DIA
      'a17e95ff-52e3-4e39-8bf6-f71754fa38f0',
      'cfbad429-af19-4397-8062-c9df57d5e97c',
    ]) expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, `referência indevida: ${foreign}`).not.toContain(foreign);
  });

  it('renderiza as 8 sequências sem diagnóstico e sem AMPscript residual', () => {
    for (const sequence of SEQUENCES) {
      const { html, diagnostics } = render(sequence);
      expect(diagnostics, `E-mail ${sequence}`).toEqual([]);
      expect(html).not.toMatch(/%%\[|%%=/);
      expect(html).toContain('Olá, VANIA');
      expect(html).toContain('Sujeito à análise de crédito');
    }
  });

  it('aplica a grade de benefícios condicional por sequência', () => {
    const count = (html: string, asset: string) => html.split(asset).length - 1;
    // E1–E4 e E7 usam as quatro artes; E6 e E8 usam duas; E5 usa três.
    expect(count(render(1).html, 'dd5bd72f')).toBe(1);
    expect(count(render(1).html, '87c5c98f')).toBe(1);
    expect(count(render(6).html, '3f2ff739')).toBe(0);
    expect(count(render(8).html, '87c5c98f')).toBe(0);
    expect(count(render(5).html, '87c5c98f')).toBe(0);
    // grade Vibe: E3/E4 trocam as artes 1 e 2 pelas 4 e 5.
    expect(count(render(3).html, 'b3063d8e')).toBe(1);
    expect(count(render(1).html, 'b3063d8e')).toBe(0);
    expect(count(render(4).html, '82ec3fce')).toBe(0);
  });

  it('posiciona o CTA principal conforme a sequência', () => {
    const html6 = render(6).html;
    // Em E6 e E8 o CTA vem antes do título ciano; nas demais, depois da grade.
    expect(html6.indexOf('Pedir meu cartão')).toBeLessThan(html6.indexOf('Todos os benefícios em um cartão!'));
    const html1 = render(1).html;
    expect(html1.indexOf('Todos os benefícios em um cartão!')).toBeLessThan(html1.indexOf('Pedir meu cartão'));
  });

  it('esconde bloco vazio e não deixa link sem destino', () => {
    const briefing = row(1);
    Object.assign(briefing, { TITULO_COPY_2: '', COPY_2_PRETO: '', TITULO_CTA_2: '', LINK_CTA_2: '' });
    const { html } = renderDynamicEmail(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, briefing, {
      CPF: '0', PRI_NOME: 'VANIA', LIMITE: '1', PRODUTO: 'BEM BARATO', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'CRM',
    });
    expect(html).not.toContain('E não para por aí!');
    expect(html).not.toContain('Quero meu cartão');
    expect(html).not.toMatch(/href="(\s*)"/);
  });

  it('mantém a migration byte-a-byte alinhada com a fonte do frontend', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260904150000_bem_barato_crm_dynamic_ruler_v1.sql'),
      'utf8',
    );
    expect(migration).toContain(`$bembarato$${BEM_BARATO_CRM_DYNAMIC_TEMPLATE}$bembarato$`);
    // a migration não pode tornar o slot principal global nem tocar em outro parceiro
    expect(migration).toContain(`values ('${BEM_BARATO_CRM_DYNAMIC_TEMPLATE_ID}'`);
    expect(migration).toMatch(/'active', 1\)/);
    expect(migration).toContain('raise exception');
    for (const foreign of ['Dia Afinz', 'Plurix', 'AMIGAO', 'dia-crm-dynamic']) {
      expect(migration, `migration cita outro parceiro: ${foreign}`).not.toContain(foreign);
    }
  });

  it('não usa merge field de Journey nem JavaScript', () => {
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).not.toMatch(/%%FIRST_NAME%%|%%first_name%%|%%PRI_NOME%%/);
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).not.toMatch(/<script\b/i);
    expect(BEM_BARATO_CRM_DYNAMIC_TEMPLATE).not.toMatch(/javascript:/i);
  });
});
