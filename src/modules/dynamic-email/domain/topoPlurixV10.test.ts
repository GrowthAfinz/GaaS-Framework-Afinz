import { describe, expect, it } from 'vitest';
import {
  exportHeaderVariantsCsv,
  exportPartnerAssetsCsv,
  formatLimite,
  parsePoolOffersCsv,
  parsePoolPrice,
  resolveHeader,
  selectPoolOfferOfDay,
  topoV10PreviewVars,
  validateHeaderVariant,
  validatePoolOfferEdit,
  type HeaderVariant,
} from './topoPlurixV10';

// Recorte real do export da DE_POOL_OFERTAS_PLURIX (05/10/2026), com textos legais encurtados.
const POOL_CSV = [
  'OFFER_ID,OFFER_REF,PARTNER_NAME,PARTNER_SEGMENT,PROMOTION_NAME,PROMOTION_DESCRIPTION,DISCOUNT_PERCENT,DISCOUNT_AMOUNT,LEGAL_TEXT,START_DATE,END_DATE,CTA_URL,IMAGE_FILE_NAME,IMAGE_URL,ACTIVE,IMPORT_DATE,FILE_NAME,OLD_PRICE,SALE_PRICE,INSTALLMENTS_TEXT,segmentacao,uf_segmentacao,TYPE,STATUS,cidade_segmentacao',
  '2026101_AMIGAO,amigao_20260928_01,AMIGAO,Supermercados,Coxão Mole Bovino Resfriado Peça/Pedaço - Kg,x,,,Legal PR,01/10/2026 00:00:00,01/10/2026 00:00:00,,a.jpg,https://img/pr-coxao.jpg,True,01/10/2026 12:07:49,XXXX,"42,98","35,98",,S,PR,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_20260928_02,AMIGAO,Supermercados,Coxão Mole Bovino Resfriado Peça/Pedaço - Kg,x,,,Legal SP,01/10/2026 00:00:00,01/10/2026 00:00:00,,b.jpg,https://img/sp-coxao.jpg,True,01/10/2026 12:07:49,XXXX,"43,98","35,98",,S,SP,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_20260928_03,AMIGAO,Supermercados,Filé de Agulha Bovino Resfriado C/Osso - Kg,x,,,Legal PG,01/10/2026 00:00:00,01/10/2026 00:00:00,,c.jpg,https://img/pg-file.jpg,True,01/10/2026 12:07:49,XXXX,"27,97","23,98",,S,PR,preco,PLANEJADO,PONTA GROSSA',
  '2026101_AMIGAO,amigao_20260928_04,AMIGAO,Supermercados,Bisteca Bovina Sem Filé Resfriada - Kg,x,,,Legal MS,01/10/2026 00:00:00,01/10/2026 00:00:00,,d.jpg,https://img/ms-bisteca.jpg,True,01/10/2026 12:07:49,XXXX,"38,98","34,98",,S,MS,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_20260928_09,AMIGAO,Supermercados,Contra Filé Bovino Resfriado Pedaço - Kg,x,,,Legal PR,03/10/2026 00:00:00,03/10/2026 00:00:00,,e.jpg,https://img/pr-contra.jpg,True,01/10/2026 12:07:49,XXXX,,"37,98",,S,PR,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_20260928_10,AMIGAO,Supermercados,Contra Filé Bovino Resfriado Pedaço - Kg,x,,,Legal SP,03/10/2026 00:00:00,03/10/2026 00:00:00,,f.jpg,https://img/sp-contra.jpg,True,01/10/2026 12:07:49,XXXX,,"37,98",,S,SP,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_20260928_11,AMIGAO,Supermercados,Contra Filé Bovino Resfriado C/Osso - Kg,x,,,Legal PG,03/10/2026 00:00:00,03/10/2026 00:00:00,,g.jpg,https://img/pg-contra.jpg,True,01/10/2026 12:07:49,XXXX,"39,98","32,98",,S,PR,preco,PLANEJADO,PONTA GROSSA',
  '2026101_AMIGAO,amigao_20260928_12,AMIGAO,Supermercados,Bisteca Bovina Sem Filé Resfriada - Kg,x,,,Legal MS,03/10/2026 00:00:00,03/10/2026 00:00:00,,h.jpg,https://img/ms-bisteca2.jpg,True,01/10/2026 12:07:49,XXXX,"38,98","34,98",,S,MS,preco,PLANEJADO,',
  '2026101_AMIGAO,amigao_inativa,AMIGAO,Supermercados,Picanha - Kg,x,,,Legal,01/10/2026 00:00:00,01/10/2026 00:00:00,,i.jpg,https://img/picanha.jpg,False,01/10/2026 12:07:49,XXXX,,"9,99",,S,PR,preco,PLANEJADO,',
].join('\n');

const variant = (patch: Partial<HeaderVariant> = {}): HeaderVariant => ({
  code: 'HDR_PECA_V1', label: 'Peça seu cartão', title: 'Peça seu cartão+amigo', subtitle: 'e aproveite as melhores vantagens!',
  cardImageUrl: 'https://img/cartao.png', backgroundColor: '#4A5BA6', titleColor: '#E7A921', subtitleColor: '#EADFCE',
  status: 'active', version: 1, ...patch,
});

describe('pool de ofertas: leitura do export', () => {
  it('lê o CSV real, converte datas e marca ofertas inativas', () => {
    const { offers, errors } = parsePoolOffersCsv(POOL_CSV);
    expect(errors).toEqual([]);
    expect(offers).toHaveLength(9);
    expect(offers[0]).toMatchObject({ offerRef: 'amigao_20260928_01', startDate: '2026-10-01', endDate: '2026-10-01', salePrice: '35,98', uf: 'PR', active: true });
    expect(offers[2].cidade).toBe('PONTA GROSSA');
    expect(offers[8].active).toBe(false);
  });

  it('recusa um arquivo sem as colunas obrigatórias', () => {
    const { offers, errors } = parsePoolOffersCsv('BATCH_ID,PARTNER_NAME\nx,AMIGAO');
    expect(offers).toEqual([]);
    expect(errors[0]).toContain('Colunas ausentes');
  });

  it('converte preço nos formatos que aparecem no pool', () => {
    expect(parsePoolPrice('35,98')).toBe(35.98);
    expect(parsePoolPrice('1.234,56')).toBe(1234.56);
    expect(parsePoolPrice('R$ 1.679,00')).toBe(1679);
    expect(parsePoolPrice('739')).toBe(739);
    expect(parsePoolPrice('')).toBeNull();
  });
});

describe('pool de ofertas: oferta do dia', () => {
  const { offers } = parsePoolOffersCsv(POOL_CSV);

  it('escolhe o produto presente em mais regiões, a partir do menor preço', () => {
    expect(selectPoolOfferOfDay(offers, 'AMIGAO', '2026-10-01')).toEqual({
      productName: 'Coxão Mole Bovino Resfriado Peça/Pedaço - Kg', priceText: '35,98', price: 35.98,
      imageUrl: 'https://img/pr-coxao.jpg', date: '2026-10-01', regions: 2, offerRef: 'amigao_20260928_01',
    });
  });

  it('ignora oferta inativa mesmo com preço menor', () => {
    expect(selectPoolOfferOfDay(offers, 'AMIGAO', '2026-10-01')?.productName).not.toContain('Picanha');
  });

  it('troca de produto conforme o dia', () => {
    const offer = selectPoolOfferOfDay(offers, 'amigao', '2026-10-03');
    expect(offer).toMatchObject({ productName: 'Contra Filé Bovino Resfriado Pedaço - Kg', priceText: '37,98', regions: 2 });
  });

  it('em empate de regiões, vence o menor preço', () => {
    const single = offers.filter((offer) => offer.offerRef.endsWith('_03') || offer.offerRef.endsWith('_04'));
    expect(selectPoolOfferOfDay(single, 'AMIGAO', '2026-10-01')?.priceText).toBe('23,98');
  });

  it('sem oferta vigente ou de outra rede, não há bloco', () => {
    expect(selectPoolOfferOfDay(offers, 'AMIGAO', '2026-10-05')).toBeNull();
    expect(selectPoolOfferOfDay(offers, 'BOA', '2026-10-01')).toBeNull();
  });
});

describe('header dinâmico', () => {
  const assets = [{ signatureKey: 'AVENIDA', headerLogoUrl: 'https://img/logo-avenida.png' }];

  it('link https mantém o modo imagem de hoje', () => {
    expect(resolveHeader('https://img/header.png', 'AVENIDA', [variant()], assets)).toEqual({ mode: 'imagem', logoUrl: 'https://img/logo-avenida.png' });
  });

  it('código de variação monta o header HTML, sem diferenciar maiúsculas', () => {
    const resolved = resolveHeader(' hdr_peca_v1 ', 'avenida', [variant()], assets);
    expect(resolved.mode).toBe('html');
    expect(resolved.variant?.title).toBe('Peça seu cartão+amigo');
    expect(resolved.logoUrl).toBe('https://img/logo-avenida.png');
  });

  it('código arquivado ou inexistente fica sem header e gera aviso', () => {
    expect(resolveHeader('HDR_PECA_V1', 'AMIGAO', [variant({ status: 'archived' })], assets)).toEqual({ mode: '', logoUrl: '', missingCode: 'HDR_PECA_V1' });
    const preview = topoV10PreviewVars({ headerValue: 'HDR_XPTO', signatureKey: 'AMIGAO', limite: '', date: '2026-10-01', variants: [], assets: [], offers: [] });
    expect(preview.diagnostics[0]).toContain('HDR_XPTO');
  });

  it('valida código, tamanho do texto, link e cores', () => {
    expect(validateHeaderVariant(variant())).toEqual([]);
    const errors = validateHeaderVariant(variant({ code: 'peca', title: 'x'.repeat(40), cardImageUrl: 'http://img', backgroundColor: 'azul' }));
    expect(errors).toHaveLength(4);
  });

  it('exporta só variações ativas, nas colunas da DE TB_HEADER_VARIACOES', () => {
    const csv = exportHeaderVariantsCsv([variant(), variant({ code: 'HDR_OLD', status: 'archived' })]);
    expect(csv.split('\r\n')).toEqual([
      'CODIGO,TITULO,SUBTITULO,IMAGEM_CARTAO,COR_FUNDO,COR_TITULO,COR_SUBTITULO',
      'HDR_PECA_V1,Peça seu cartão+amigo,e aproveite as melhores vantagens!,https://img/cartao.png,#4A5BA6,#E7A921,#EADFCE',
    ]);
    expect(exportPartnerAssetsCsv(assets)).toBe('NM_PRODUTO_INTERNO,LOGO_HEADER\r\nAVENIDA,https://img/logo-avenida.png');
  });
});

describe('faixa de limite', () => {
  it('formata como o AMPscript', () => {
    expect(formatLimite('')).toBe('');
    expect(formatLimite('1500')).toBe('1.500,00');
    expect(formatLimite('R$ 3.500,00')).toBe('3.500,00');
    expect(formatLimite('2.000,50')).toBe('2.000,50');
    expect(formatLimite('R$ 3.500')).toBe('3.500');
    expect(formatLimite('3500.5')).toBe('3.500,50');
  });
});

describe('variáveis da prévia do V10', () => {
  it('junta header, limite e oferta do dia', () => {
    const { offers } = parsePoolOffersCsv(POOL_CSV);
    const { vars, offer } = topoV10PreviewVars({
      headerValue: 'HDR_PECA_V1', signatureKey: 'AMIGAO', limite: '1500', date: '2026-10-01',
      variants: [variant()], assets: [], offers,
    });
    expect(offer?.regions).toBe(2);
    expect(vars).toMatchObject({
      HeaderModo: 'html', HdrTitulo: 'Peça seu cartão+amigo', LimiteFmt: '1.500,00',
      OfertaProduto: 'Coxão Mole Bovino Resfriado Peça/Pedaço - Kg', OfertaPrecoTxt: '35,98', OfertaData: '01/10',
    });
  });
});

describe('edição manual de oferta do pool', () => {
  const base = { promotionName: 'Coxão Mole - Kg', salePrice: '35,98', startDate: '2026-10-01', endDate: '2026-10-01', imageUrl: 'https://img/x.jpg' };
  it('aceita uma oferta válida, inclusive mudando a data', () => {
    expect(validatePoolOfferEdit({ ...base, startDate: '2026-10-08', endDate: '2026-10-10' })).toEqual([]);
  });
  it('recusa data invertida, preço inválido, nome vazio e imagem sem https', () => {
    expect(validatePoolOfferEdit({ ...base, startDate: '2026-10-05', endDate: '2026-10-01' })[0]).toContain('início');
    expect(validatePoolOfferEdit({ ...base, salePrice: 'barato' })[0]).toContain('preço');
    expect(validatePoolOfferEdit({ ...base, promotionName: ' ' })[0]).toContain('nome');
    expect(validatePoolOfferEdit({ ...base, imageUrl: 'http://img/x.jpg' })[0]).toContain('https');
  });
});
