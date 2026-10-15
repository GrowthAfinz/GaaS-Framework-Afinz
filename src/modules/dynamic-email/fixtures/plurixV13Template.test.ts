import { describe, expect, it } from 'vitest';
import { PLURIX_V12_TEMPLATE } from './plurixV12Template';
import { PLURIX_V13_TEMPLATE, V13_HEADER_BRAND_LOGO, V13_LIMIT_BAND_BEIGE, V13_LIMIT_BAND_YELLOW } from './plurixV13Template';
import { renderDynamicEmail, type SubscriberSample } from '../ampscript/renderer';
import { emptyBriefingRow, templateActiveColumns, type BriefingRow } from '../domain/briefing';
import { plurixEnvelope } from '../domain/sfmcEnvelope';

const row = (patch: Partial<BriefingRow> = {}): BriefingRow => Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000013a1'), {
  NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'Topo de Funil', SEQUENCIA: 'E-mail 3',
  TITULO_COPY_1_AZUL: 'Olá, %%=v(@FirstName)=%%!', COR_COPY_1: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
  COPY_1_PRETO: 'Na hora de fazer as compras, <b>cada desconto conta!</b>', COR_COPY_PRETO_1: '#242424', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
  HEADER_TITULO: 'Até 40 dias para pagar!', HEADER_SUBTITULO: 'Mais flexibilidade e economia para o seu bolso. Aproveite!',
  HEADER_IMAGEM_CARTAO: 'https://img/cartao.png', HEADER_LOGO: 'https://img/logo-amigo.png',
  MENSAGEM_LIMITE: 'Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.',
  ...patch,
});
const sample = (patch: Partial<SubscriberSample> = {}): SubscriberSample => ({
  CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500', PRODUTO: 'AMIGAO', SEQUENCIA: 'E-mail 3', TP_CAMPANHA: 'Topo de Funil', ...patch,
});

describe('PLURIX V13 (candidata)', () => {
  it('mantém o motor da V12 e muda só tipo, sequência, header e pool', () => {
    expect(PLURIX_V13_TEMPLATE).toContain('SET @DE_ESTADO = "ESTADO_SEQUENCIA_CRM"');
    expect(PLURIX_V13_TEMPLATE).toContain('SET @TpCampanha = "Topo de Funil"');
    expect(PLURIX_V13_TEMPLATE).toContain('RegExMatch(@Sequencia, "^E-mail [1-8]$", 0)');
    expect(PLURIX_V13_TEMPLATE).toContain('SET @HdrTitulo = Field(@Row, "HEADER_TITULO")');
    expect(PLURIX_V13_TEMPLATE).toContain('LookupOrderedRows("DE_POOL_OFERTAS_PLURIX"');
    expect(PLURIX_V13_TEMPLATE).not.toContain('TB_HEADER_VARIACOES');
    expect(PLURIX_V13_TEMPLATE).not.toContain('TB_REDE_ASSETS');
    expect(PLURIX_V13_TEMPLATE).not.toMatch(/\b(?:UpdateDE|InsertDE|UpsertDE|DeleteDE)\s*\(/);
    expect(PLURIX_V13_TEMPLATE.match(/%%\[/g)?.length).toBe(PLURIX_V13_TEMPLATE.match(/\]%%/g)?.length);
    expect(PLURIX_V12_TEMPLATE).toContain('SET @TpCampanha = "CRM"');
  });

  it('o lookup do pool nunca derruba o envio', () => {
    const setup = PLURIX_V13_TEMPLATE.slice(PLURIX_V13_TEMPLATE.indexOf('V13 · oferta do dia'), PLURIX_V13_TEMPLATE.indexOf(']%%'));
    expect(setup).not.toContain('RaiseError');
  });

  it('com linha principal, monta o header dinâmico com textos e imagens do briefing', () => {
    const { html, diagnostics } = renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample());
    expect(diagnostics).toEqual([]);
    expect(html).toContain('class="hdr-title"');
    expect(html).toContain('Até 40 dias para pagar!');
    expect(html).toContain('Mais flexibilidade e economia para o seu bolso. Aproveite!');
    expect(html).toContain('src="https://img/cartao.png"');
    expect(html).toContain('src="https://img/logo-amigo.png"');
    expect(html).toContain('background-color:#4A5BA6');
    expect(html.indexOf('Até 40 dias')).toBeLessThan(html.indexOf('Boa notícia, Vania'));
  });

  it('segue a peça do marketing: +amigo branco fixo, logo da rede ao lado, Tahoma e cartão de 300px', () => {
    const { html } = renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample());
    expect(html).toContain(`src="${V13_HEADER_BRAND_LOGO}"`);
    expect(html.indexOf(V13_HEADER_BRAND_LOGO)).toBeLessThan(html.indexOf('src="https://img/logo-amigo.png"'));
    expect(html).toMatch(/class="hdr-title"[^>]*font-family:Tahoma, Geneva, sans-serif;[^>]*font-size:28px/);
    expect(html).toContain('width="300"');
    const semLogo = renderDynamicEmail(PLURIX_V13_TEMPLATE, row({ HEADER_LOGO: '' }), sample()).html;
    expect(semLogo).toContain(V13_HEADER_BRAND_LOGO);
    expect(semLogo).not.toContain('class="hdr-partner"');
  });

  it('sem linha principal, HEADER volta a ser imagem como na V12', () => {
    const { html } = renderDynamicEmail(PLURIX_V13_TEMPLATE, row({ HEADER_TITULO: '', HEADER: 'https://img/header.png' }), sample());
    expect(html).not.toContain('class="hdr-title"');
    expect(html).toContain('src="https://img/header.png"');
  });

  it('faixa de limite continua vindo de MENSAGEM_LIMITE e some sem limite', () => {
    expect(renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample()).html).toContain('Boa notícia, Vania: você tem R$ 3.500,00 de limite pré-aprovado no cartão +amigo.');
    expect(renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample({ LIMITE: '' })).html).not.toContain('pré-aprovado');
  });

  it('mostra o bloco 3 só quando a prévia recebe oferta do dia', () => {
    const vars = { OfertaProduto: 'Coxão Mole Bovino - Kg', OfertaPrecoTxt: '35,98', OfertaImagem: 'https://img/coxao.jpg', OfertaData: '01/10' };
    expect(renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample(), { vars }).html).toContain('Oferta de 01/10: <b>Coxão Mole Bovino - Kg</b>');
    expect(renderDynamicEmail(PLURIX_V13_TEMPLATE, row(), sample()).html).not.toContain('E tem mais');
  });

  it('libera os campos do header no editor e o envelope é da V13', () => {
    const active = templateActiveColumns(PLURIX_V13_TEMPLATE);
    for (const column of ['HEADER_TITULO', 'HEADER_SUBTITULO', 'HEADER_IMAGEM_CARTAO', 'HEADER_LOGO', 'MENSAGEM_LIMITE'] as const) expect(active.has(column)).toBe(true);
    expect(plurixEnvelope(PLURIX_V13_TEMPLATE)?.version).toBe('V13');
  });

  it('faixa de limite amarela nos e-mails ímpares e bege nos pares', () => {
    for (const [sequencia, cor, outra] of [['E-mail 1', V13_LIMIT_BAND_YELLOW, V13_LIMIT_BAND_BEIGE], ['E-mail 2', V13_LIMIT_BAND_BEIGE, V13_LIMIT_BAND_YELLOW],
      ['E-mail 3', V13_LIMIT_BAND_YELLOW, V13_LIMIT_BAND_BEIGE], ['E-mail 4', V13_LIMIT_BAND_BEIGE, V13_LIMIT_BAND_YELLOW]]) {
      const { html } = renderDynamicEmail(PLURIX_V13_TEMPLATE, row({ SEQUENCIA: sequencia }), sample({ SEQUENCIA: sequencia }));
      expect(html).toContain(`bgcolor="${cor}"`);
      expect(html).not.toContain(`bgcolor="${outra}"`);
    }
    expect(PLURIX_V13_TEMPLATE).not.toContain('#FFF4D6');
  });

  it('do E-mail 3 em diante, segundo bloco sem imagem ocupa a largura total; com imagem, duas colunas', () => {
    const bloco2 = { TITULO_COPY_2: 'Mais motivos para aproveitar as compras', COPY_2_PRETO: '<p>grade</p>', TITULO_CTA_2: 'QUERO MEU CARTÃO +AMIGO', LINK_CTA_2: 'https://app' };
    const semImagem = renderDynamicEmail(PLURIX_V13_TEMPLATE, row(bloco2), sample()).html;
    expect(semImagem).toContain('segundo bloco sem imagem, largura total');
    expect(semImagem).not.toContain('class="stack-column stack-copy" style="width:55%');
    expect(semImagem).toContain('<p>grade</p>');
    const comImagem = renderDynamicEmail(PLURIX_V13_TEMPLATE, row({ ...bloco2, BANNER_2_CORPO: 'https://img/cartoes.png' }), sample()).html;
    expect(comImagem).not.toContain('segundo bloco sem imagem, largura total');
    expect(comImagem).toContain('class="stack-column stack-copy" style="width:55%');
    expect(comImagem).toContain('src="https://img/cartoes.png"');
  });

  it('não deixa AMPscript sem resolver', () => {
    for (const patch of [{}, { HEADER_TITULO: '' }, { SEQUENCIA: 'E-mail 1' }]) {
      expect(renderDynamicEmail(PLURIX_V13_TEMPLATE, row(patch), sample()).html).not.toMatch(/%%(?:\[|=)/);
    }
  });
});
