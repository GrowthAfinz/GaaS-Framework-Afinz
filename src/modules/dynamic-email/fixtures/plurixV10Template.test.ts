import { describe, expect, it } from 'vitest';
import { PLURIX_V9_TEMPLATE } from './plurixV9Template';
import { PLURIX_V10_TEMPLATE, POOL_ANCHOR_COMMENT } from './plurixV10Template';
import { renderDynamicEmail, type SubscriberSample } from '../ampscript/renderer';
import { emptyBriefingRow, type BriefingRow } from '../domain/briefing';
import { parsePoolOffersCsv, topoV10PreviewVars, type HeaderVariant } from '../domain/topoPlurixV10';

const row = (patch: Partial<BriefingRow> = {}): BriefingRow => Object.assign(emptyBriefingRow('00000000-0000-4000-8000-000000000010'), {
  NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'Topo de Funil', SEQUENCIA: 'E-mail 3',
  TITULO_COPY_1_AZUL: 'Economia de verdade no açougue', COR_COPY_1: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
  COPY_1_PRETO: '%%=v(@FirstName)=%%, carne pesa no carrinho.', COR_COPY_PRETO_1: '#242424', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
  TITULO_CTA_1: 'PEDIR MEU CARTÃO +AMIGO', LINK_CTA_1: 'https://mais-amigo.onelink.me/YU3C/t6v9cyos?af_sub2=s2',
  BANNER_3_CORPO: 'https://img/footer-amigao.png', NOTA_LEGAL: 'Sujeito a análise de crédito.',
  ...patch,
});

const subscriber = (patch: Partial<SubscriberSample> = {}): SubscriberSample => ({
  CPF: '1', PRI_NOME: 'VANIA', LIMITE: '', PRODUTO: 'AMIGAO', SEQUENCIA: 'E-mail 3', TP_CAMPANHA: 'Topo de Funil', ...patch,
});

const variant: HeaderVariant = {
  code: 'HDR_PECA_V1', label: 'Peça seu cartão', title: 'Peça seu cartão+amigo', subtitle: 'e aproveite as melhores vantagens!',
  cardImageUrl: 'https://img/cartao.png', backgroundColor: '#4A5BA6', titleColor: '#E7A921', subtitleColor: '#EADFCE',
  status: 'active', version: 1,
};

const POOL = parsePoolOffersCsv([
  'OFFER_REF,PARTNER_NAME,PROMOTION_NAME,SALE_PRICE,START_DATE,END_DATE,IMAGE_URL,ACTIVE,uf_segmentacao',
  'a1,AMIGAO,Coxão Mole Bovino - Kg,"35,98",01/10/2026 00:00:00,01/10/2026 00:00:00,https://img/coxao.jpg,True,PR',
  'a2,AMIGAO,Coxão Mole Bovino - Kg,"35,98",01/10/2026 00:00:00,01/10/2026 00:00:00,https://img/coxao-sp.jpg,True,SP',
].join('\n')).offers;

function render(headerValue: string, limite: string, date: string, briefing = row({ HEADER: headerValue })) {
  const preview = topoV10PreviewVars({ headerValue, signatureKey: 'AMIGAO', limite, date, variants: [variant], assets: [{ signatureKey: 'AMIGAO', headerLogoUrl: 'https://img/logo-amigao.png' }], offers: POOL });
  return renderDynamicEmail(PLURIX_V10_TEMPLATE, briefing, subscriber({ LIMITE: limite }), { vars: preview.vars });
}

describe('PLURIX V10', () => {
  it('é montado sobre o V9 e mantém a busca do briefing', () => {
    expect(PLURIX_V10_TEMPLATE).toContain('LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO"');
    expect(PLURIX_V10_TEMPLATE.length).toBeGreaterThan(PLURIX_V9_TEMPLATE.length);
    expect(PLURIX_V10_TEMPLATE).toContain('LookupRows("TB_HEADER_VARIACOES"');
    expect(PLURIX_V10_TEMPLATE).toContain('LookupOrderedRows("DE_POOL_OFERTAS_PLURIX"');
    expect(PLURIX_V10_TEMPLATE.match(/%%\[/g)?.length).toBe(PLURIX_V10_TEMPLATE.match(/\]%%/g)?.length);
  });

  it('tem um único ponto de âncora para o pino do bloco 3, dentro do bloco de oferta', () => {
    expect(PLURIX_V10_TEMPLATE.split(POOL_ANCHOR_COMMENT)).toHaveLength(2);
    const anchor = PLURIX_V10_TEMPLATE.indexOf(POOL_ANCHOR_COMMENT);
    expect(anchor).toBeGreaterThan(PLURIX_V10_TEMPLATE.indexOf('IF NOT EMPTY(@OfertaProduto) THEN ]%%'));
    expect(anchor).toBeLessThan(PLURIX_V10_TEMPLATE.indexOf('E tem mais: toda semana'));
  });

  it('o lookup do pool nunca derruba o envio', () => {
    const setup = PLURIX_V10_TEMPLATE.slice(PLURIX_V10_TEMPLATE.indexOf('V10 · oferta do dia'), PLURIX_V10_TEMPLATE.indexOf(']%%'));
    expect(setup).not.toContain('RaiseError');
  });

  it('header com link continua como imagem, sem faixa nem oferta fora do dia', () => {
    const result = render('https://img/header.png', '', '2026-10-05');
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('src="https://img/header.png"');
    expect(result.html).not.toContain('class="hdr-title"');
    expect(result.html).not.toContain('limite pré-aprovado');
    expect(result.html).not.toContain('E tem mais');
  });

  it('header por código monta o HTML com textos e logo da rede', () => {
    const result = render('HDR_PECA_V1', '', '2026-10-05');
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('Peça seu cartão+amigo');
    expect(result.html).toContain('e aproveite as melhores vantagens!');
    expect(result.html).toContain('src="https://img/cartao.png"');
    expect(result.html).toContain('src="https://img/logo-amigao.png"');
    expect(result.html).toContain('background-color:#4A5BA6');
    expect(result.html).not.toContain('src="HDR_PECA_V1"');
  });

  it('mostra a faixa de limite formatada para quem tem limite', () => {
    const result = render('HDR_PECA_V1', '1500', '2026-10-05');
    expect(result.html).toContain('Boa notícia, VANIA: você tem R$ 1.500,00 de limite pré-aprovado no cartão +amigo.');
    expect(result.html.indexOf('Peça seu cartão+amigo')).toBeLessThan(result.html.indexOf('limite pré-aprovado'));
  });

  it('mostra o bloco 3 no dia da oferta, antes da assinatura da rede', () => {
    const result = render('HDR_PECA_V1', '', '2026-10-01');
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('E tem mais: toda semana tem oferta exclusiva para quem tem o cartão +amigo');
    expect(result.html).toContain('Oferta de 01/10: <b>Coxão Mole Bovino - Kg</b>');
    expect(result.html).toContain('a partir de</span> R$ 35,98');
    expect(result.html).toContain('src="https://img/coxao.jpg"');
    expect(result.html).toContain('href="https://mais-amigo.onelink.me/YU3C/t6v9cyos?af_sub2=s2"');
    expect(result.html.indexOf('E tem mais')).toBeLessThan(result.html.indexOf('footer-amigao.png'));
  });

  it('não deixa AMPscript sem resolver em nenhum cenário', () => {
    for (const [header, limite, date] of [['', '', '2026-10-05'], ['HDR_PECA_V1', '2.000,00', '2026-10-01'], ['https://img/h.png', '900', '2026-10-01']]) {
      const result = render(header, limite, date);
      expect(result.html).not.toMatch(/%%(?:\[|=)/);
    }
  });
});
