import Papa from 'papaparse';

/**
 * Regras do template PLURIX V10 que dependem de dados fora do briefing:
 * header dinâmico (TB_HEADER_VARIACOES + TB_REDE_ASSETS), faixa de limite
 * pré-aprovado e bloco 3 com a oferta do dia do pool (DE_POOL_OFERTAS_PLURIX).
 *
 * O AMPscript do V10 faz exatamente as mesmas escolhas dentro do SFMC. Este
 * módulo é o espelho em TypeScript usado pela prévia da Fábrica: qualquer
 * mudança de regra precisa ser feita nos dois lugares.
 */

// ------------------------------------------------------------------ header

export interface HeaderVariant {
  code: string;
  label: string;
  title: string;
  subtitle: string;
  cardImageUrl: string;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  status: 'active' | 'archived';
  version: number;
  updatedAt?: string;
}

export interface PartnerHeaderAsset {
  signatureKey: string;
  headerLogoUrl: string;
}

export const HEADER_CODE_PATTERN = /^HDR_[A-Z0-9_]{2,40}$/;
export const HEADER_TITLE_MAX = 34;
export const HEADER_SUBTITLE_MAX = 60;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_HEADER_COLORS = { backgroundColor: '#4A5BA6', titleColor: '#E7A921', subtitleColor: '#EADFCE' } as const;

export function validateHeaderVariant(variant: Pick<HeaderVariant, 'code' | 'title' | 'subtitle' | 'cardImageUrl' | 'backgroundColor' | 'titleColor' | 'subtitleColor'>): string[] {
  const errors: string[] = [];
  if (!HEADER_CODE_PATTERN.test(variant.code)) errors.push('O código precisa começar com HDR_ e ter só letras maiúsculas, números e _ (ex.: HDR_PECA_V1).');
  if (!variant.title.trim()) errors.push('O título é obrigatório.');
  if (variant.title.length > HEADER_TITLE_MAX) errors.push(`O título passa de ${HEADER_TITLE_MAX} caracteres e vai quebrar o layout no celular.`);
  if (variant.subtitle.length > HEADER_SUBTITLE_MAX) errors.push(`O subtítulo passa de ${HEADER_SUBTITLE_MAX} caracteres.`);
  if (variant.cardImageUrl && !/^https:\/\//i.test(variant.cardImageUrl)) errors.push('A imagem do cartão precisa de um link https://.');
  for (const [label, value] of [['fundo', variant.backgroundColor], ['título', variant.titleColor], ['subtítulo', variant.subtitleColor]] as const) {
    if (!HEX_COLOR.test(value)) errors.push(`A cor de ${label} precisa estar no formato #RRGGBB.`);
  }
  return errors;
}

export type HeaderMode = '' | 'imagem' | 'html';

export interface ResolvedHeader {
  mode: HeaderMode;
  variant?: HeaderVariant;
  logoUrl: string;
  /** Código informado no briefing que não existe entre as variações ativas. */
  missingCode?: string;
}

const upper = (value: string | undefined) => (value ?? '').trim().toLocaleUpperCase('pt-BR');

/** Mesmo critério do AMPscript: link começando por "http" = imagem; senão, código de variação. */
export function resolveHeader(headerValue: string, signatureKey: string, variants: HeaderVariant[], assets: PartnerHeaderAsset[]): ResolvedHeader {
  const value = (headerValue ?? '').trim();
  const logoUrl = assets.find((asset) => upper(asset.signatureKey) === upper(signatureKey))?.headerLogoUrl ?? '';
  if (!value) return { mode: '', logoUrl };
  if (value.startsWith('http')) return { mode: 'imagem', logoUrl };
  const variant = variants.find((candidate) => candidate.status === 'active' && upper(candidate.code) === upper(value));
  return variant ? { mode: 'html', variant, logoUrl } : { mode: '', logoUrl, missingCode: value };
}

export function exportHeaderVariantsCsv(variants: HeaderVariant[]): string {
  const columns = ['CODIGO', 'TITULO', 'SUBTITULO', 'IMAGEM_CARTAO', 'COR_FUNDO', 'COR_TITULO', 'COR_SUBTITULO'];
  const data = variants.filter((variant) => variant.status === 'active').map((variant) => ({
    CODIGO: variant.code, TITULO: variant.title, SUBTITULO: variant.subtitle, IMAGEM_CARTAO: variant.cardImageUrl,
    COR_FUNDO: variant.backgroundColor, COR_TITULO: variant.titleColor, COR_SUBTITULO: variant.subtitleColor,
  }));
  return Papa.unparse(data, { columns, delimiter: ',', newline: '\r\n', quotes: false, escapeFormulae: false });
}

export function exportPartnerAssetsCsv(assets: PartnerHeaderAsset[]): string {
  const data = assets.map((asset) => ({ NM_PRODUTO_INTERNO: asset.signatureKey, LOGO_HEADER: asset.headerLogoUrl }));
  return Papa.unparse(data, { columns: ['NM_PRODUTO_INTERNO', 'LOGO_HEADER'], delimiter: ',', newline: '\r\n', quotes: false, escapeFormulae: false });
}

// ------------------------------------------------------------------ limite

/** Mesma expressão usada no RegExMatch do AMPscript para só formatar valores numéricos. */
const PLAIN_NUMBER = /^[0-9]+(\.[0-9]{1,2})?$/;

/** Espelho do AMPscript: remove "R$", mantém o que não for número puro e formata números puros em pt-BR. */
export function formatLimite(raw: string): string {
  const value = (raw ?? '').replace(/R\$/g, '').trim();
  if (!value || !PLAIN_NUMBER.test(value)) return value;
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ------------------------------------------------------------------ pool de ofertas

export interface PoolOffer {
  offerRef: string;
  partnerName: string;
  promotionName: string;
  salePrice: string;
  oldPrice: string;
  startDate: string; // AAAA-MM-DD
  endDate: string;   // AAAA-MM-DD
  imageUrl: string;
  active: boolean;
  segmentacao: string;
  uf: string;
  cidade: string;
  legalText: string;
  offerType: string;
  /** Preenchido quando a oferta foi alterada na Fábrica (vale só para a prévia). */
  editedAt?: string;
}

/** Validação da edição manual de uma oferta na Fábrica. */
export function validatePoolOfferEdit(offer: Pick<PoolOffer, 'promotionName' | 'salePrice' | 'startDate' | 'endDate' | 'imageUrl'>): string[] {
  const errors: string[] = [];
  if (!offer.promotionName.trim()) errors.push('O nome do produto é obrigatório.');
  if (parsePoolPrice(offer.salePrice) === null) errors.push('O preço precisa ser um número, no formato 35,98.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(offer.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(offer.endDate)) errors.push('Início e fim precisam ser datas válidas.');
  else if (offer.startDate > offer.endDate) errors.push('O início não pode ser depois do fim.');
  if (offer.imageUrl && !/^https:\/\//i.test(offer.imageUrl)) errors.push('A imagem precisa de um link https://.');
  return errors;
}

export interface PoolOfferOfDay {
  productName: string;
  priceText: string;
  price: number;
  imageUrl: string;
  date: string;
  regions: number;
  offerRef: string;
}

/** "35,98" → 35.98 · "1.234,56" → 1234.56 · "R$ 739" → 739. Igual ao Replace(...) do AMPscript. */
export function parsePoolPrice(raw: string): number | null {
  const cleaned = (raw ?? '').replace(/R\$/gi, '').trim().replace(/\./g, '').replace(',', '.');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const toIsoDate = (raw: string): string => {
  const value = (raw ?? '').trim();
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : '';
};

/** Lê o CSV exportado da DE_POOL_OFERTAS_PLURIX (cabeçalho em inglês, datas DD/MM/AAAA). */
export function parsePoolOffersCsv(csv: string): { offers: PoolOffer[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ''), { header: true, skipEmptyLines: true });
  const errors = parsed.errors.map((error) => `Linha ${(error.row ?? 0) + 2}: ${error.message}`);
  const required = ['OFFER_REF', 'PARTNER_NAME', 'PROMOTION_NAME', 'SALE_PRICE', 'START_DATE', 'END_DATE', 'IMAGE_URL', 'ACTIVE'];
  const header = parsed.meta.fields ?? [];
  const missing = required.filter((column) => !header.includes(column));
  if (missing.length) return { offers: [], errors: [...errors, `Colunas ausentes no arquivo: ${missing.join(', ')}. Exporte a DE_POOL_OFERTAS_PLURIX completa.`] };
  const offers: PoolOffer[] = [];
  parsed.data.forEach((row, index) => {
    const offerRef = (row.OFFER_REF ?? '').trim();
    const startDate = toIsoDate(row.START_DATE);
    const endDate = toIsoDate(row.END_DATE);
    if (!offerRef) { errors.push(`Linha ${index + 2}: OFFER_REF vazio.`); return; }
    if (!startDate || !endDate) { errors.push(`Linha ${index + 2} (${offerRef}): data de início ou fim inválida.`); return; }
    offers.push({
      offerRef,
      partnerName: (row.PARTNER_NAME ?? '').trim(),
      promotionName: (row.PROMOTION_NAME ?? '').trim(),
      salePrice: (row.SALE_PRICE ?? '').trim(),
      oldPrice: (row.OLD_PRICE ?? '').trim(),
      startDate,
      endDate,
      imageUrl: (row.IMAGE_URL ?? '').trim(),
      active: /^(true|1|sim)$/i.test((row.ACTIVE ?? '').trim()),
      segmentacao: (row.segmentacao ?? '').trim(),
      uf: (row.uf_segmentacao ?? '').trim(),
      cidade: (row.cidade_segmentacao ?? '').trim(),
      legalText: (row.LEGAL_TEXT ?? '').trim(),
      offerType: (row.TYPE ?? '').trim(),
    });
  });
  return { offers, errors };
}

/**
 * Oferta do dia para a rede, na regra do MVP (régua de topo sem UF/cidade):
 * 1. ofertas ativas da rede, vigentes na data e com preço;
 * 2. agrupadas pelo nome do produto (ordem alfabética, como o ORDER BY do AMPscript);
 * 3. vence o produto presente em mais linhas (regiões); empate, o de menor preço;
 *    persistindo o empate, o primeiro na ordem alfabética;
 * 4. o preço exibido é o menor do produto ("a partir de"), com a imagem dessa linha.
 */
export function selectPoolOfferOfDay(offers: PoolOffer[], partnerName: string, date: string): PoolOfferOfDay | null {
  const partner = upper(partnerName);
  const valid = offers
    .filter((offer) => offer.active && upper(offer.partnerName) === partner && offer.startDate <= date && offer.endDate >= date)
    .map((offer) => ({ offer, price: parsePoolPrice(offer.salePrice) }))
    .filter((item): item is { offer: PoolOffer; price: number } => item.price !== null)
    .sort((a, b) => a.offer.promotionName.localeCompare(b.offer.promotionName, 'pt-BR', { sensitivity: 'base' }));

  let best: PoolOfferOfDay | null = null;
  let group: PoolOfferOfDay | null = null;
  let groupKey = '';
  const close = () => {
    if (group && (!best || group.regions > best.regions || (group.regions === best.regions && group.price < best.price))) best = group;
  };
  for (const { offer, price } of valid) {
    const key = upper(offer.promotionName);
    if (key !== groupKey) {
      close();
      groupKey = key;
      group = { productName: offer.promotionName, priceText: offer.salePrice, price, imageUrl: offer.imageUrl, date, regions: 0, offerRef: offer.offerRef };
    }
    group!.regions += 1;
    if (price < group!.price) Object.assign(group!, { priceText: offer.salePrice, price, imageUrl: offer.imageUrl, offerRef: offer.offerRef });
  }
  close();
  return best;
}

// ------------------------------------------------------------------ variáveis da prévia

export interface TopoV10PreviewInput {
  headerValue: string;
  signatureKey: string;
  limite: string;
  date: string; // AAAA-MM-DD, data de envio simulada
  variants: HeaderVariant[];
  assets: PartnerHeaderAsset[];
  offers: PoolOffer[];
}

export interface TopoV10PreviewResult {
  vars: Record<string, string>;
  header: ResolvedHeader;
  offer: PoolOfferOfDay | null;
  diagnostics: string[];
}

const toBrDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}`; };

/** Variáveis que o AMPscript do V10 calcula no SFMC e que a prévia injeta no renderer. */
export function topoV10PreviewVars(input: TopoV10PreviewInput): TopoV10PreviewResult {
  const header = resolveHeader(input.headerValue, input.signatureKey, input.variants, input.assets);
  const offer = selectPoolOfferOfDay(input.offers, input.signatureKey, input.date);
  const diagnostics: string[] = [];
  if (header.missingCode) diagnostics.push(`O header “${header.missingCode}” não existe entre as variações ativas. No SFMC, o e-mail sai sem header.`);
  const vars: Record<string, string> = {
    HeaderModo: header.mode,
    HdrTitulo: header.variant?.title ?? '',
    HdrSubtitulo: header.variant?.subtitle ?? '',
    HdrCartao: header.variant?.cardImageUrl ?? '',
    HdrFundo: header.variant?.backgroundColor ?? DEFAULT_HEADER_COLORS.backgroundColor,
    HdrCorTitulo: header.variant?.titleColor ?? DEFAULT_HEADER_COLORS.titleColor,
    HdrCorSubtitulo: header.variant?.subtitleColor ?? DEFAULT_HEADER_COLORS.subtitleColor,
    HdrLogoRede: header.logoUrl,
    LimiteFmt: formatLimite(input.limite),
    OfertaProduto: offer?.productName ?? '',
    OfertaPrecoTxt: offer?.priceText ?? '',
    OfertaImagem: offer?.imageUrl ?? '',
    OfertaData: offer ? toBrDate(offer.date) : '',
  };
  return { vars, header, offer, diagnostics };
}
