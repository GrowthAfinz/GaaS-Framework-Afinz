import { supabase } from '../../../services/supabaseClient';
import type { HeaderVariant, PartnerHeaderAsset, PoolOffer } from '../domain/topoPlurixV10';

type HeaderVariantRow = {
  code: string; label: string; title: string; subtitle: string; card_image_url: string;
  background_color: string; title_color: string; subtitle_color: string;
  status: 'active' | 'archived'; version: number; updated_at: string;
};

const toVariant = (row: HeaderVariantRow): HeaderVariant => ({
  code: row.code, label: row.label, title: row.title, subtitle: row.subtitle, cardImageUrl: row.card_image_url,
  backgroundColor: row.background_color, titleColor: row.title_color, subtitleColor: row.subtitle_color,
  status: row.status, version: row.version, updatedAt: row.updated_at,
});

async function requireUser(action: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error(`Sessão autenticada necessária para ${action}.`);
  return data.user.id;
}

export async function loadHeaderVariants(): Promise<HeaderVariant[]> {
  const { data, error } = await supabase.from('dynamic_email_header_variants').select('*').order('code');
  if (error) throw error;
  return (data as HeaderVariantRow[] ?? []).map(toVariant);
}

export async function saveHeaderVariant(variant: HeaderVariant): Promise<HeaderVariant> {
  const userId = await requireUser('salvar variações de header');
  const { data, error } = await supabase.from('dynamic_email_header_variants').upsert({
    code: variant.code, label: variant.label, title: variant.title, subtitle: variant.subtitle,
    card_image_url: variant.cardImageUrl, background_color: variant.backgroundColor, title_color: variant.titleColor,
    subtitle_color: variant.subtitleColor, status: variant.status, version: variant.version,
    updated_by: userId, updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return toVariant(data as HeaderVariantRow);
}

export async function loadPartnerHeaderAssets(): Promise<PartnerHeaderAsset[]> {
  const { data, error } = await supabase.from('dynamic_email_signature_settings').select('signature_key, header_logo_url').order('signature_key');
  if (error) throw error;
  return (data ?? []).map((row: { signature_key: string; header_logo_url: string | null }) => ({ signatureKey: row.signature_key, headerLogoUrl: row.header_logo_url ?? '' }));
}

export async function savePartnerHeaderLogo(signatureKey: string, headerLogoUrl: string): Promise<void> {
  const userId = await requireUser('salvar o logo da rede');
  const { error } = await supabase.from('dynamic_email_signature_settings')
    .update({ header_logo_url: headerLogoUrl.trim(), updated_by: userId, updated_at: new Date().toISOString() })
    .eq('signature_key', signatureKey);
  if (error) throw error;
}

type PoolOfferRow = {
  offer_ref: string; partner_name: string; promotion_name: string; sale_price: string; old_price: string;
  start_date: string; end_date: string; image_url: string; active: boolean; segmentacao: string; uf: string;
  cidade: string; legal_text: string; offer_type: string; edited_in_gaas_at: string | null;
};

const toOffer = (row: PoolOfferRow): PoolOffer => ({
  offerRef: row.offer_ref, partnerName: row.partner_name, promotionName: row.promotion_name, salePrice: row.sale_price,
  oldPrice: row.old_price, startDate: row.start_date, endDate: row.end_date, imageUrl: row.image_url, active: row.active,
  segmentacao: row.segmentacao, uf: row.uf, cidade: row.cidade, legalText: row.legal_text, offerType: row.offer_type,
  editedAt: row.edited_in_gaas_at ?? undefined,
});

export async function loadPoolOffers(): Promise<PoolOffer[]> {
  const { data, error } = await supabase.from('dynamic_email_pool_offers').select('*').order('start_date', { ascending: false }).limit(2000);
  if (error) throw error;
  return (data as PoolOfferRow[] ?? []).map(toOffer);
}

/** Grava (ou atualiza pelo OFFER_REF) as ofertas lidas do export da DE_POOL_OFERTAS_PLURIX. */
export async function importPoolOffers(offers: PoolOffer[], sourceFile: string): Promise<number> {
  const userId = await requireUser('importar ofertas do pool');
  if (!offers.length) return 0;
  const { error } = await supabase.from('dynamic_email_pool_offers').upsert(offers.map((offer) => ({
    offer_ref: offer.offerRef, partner_name: offer.partnerName, promotion_name: offer.promotionName,
    sale_price: offer.salePrice, old_price: offer.oldPrice, start_date: offer.startDate, end_date: offer.endDate,
    image_url: offer.imageUrl, active: offer.active, segmentacao: offer.segmentacao, uf: offer.uf, cidade: offer.cidade,
    legal_text: offer.legalText, offer_type: offer.offerType, source_file: sourceFile,
    imported_by: userId, imported_at: new Date().toISOString(), edited_in_gaas_at: null, edited_by: null,
  })));
  if (error) throw error;
  return offers.length;
}

/** Altera uma oferta na cópia do GaaS. Não muda a DE do SFMC; a próxima importação sobrescreve. */
export async function updatePoolOffer(offer: PoolOffer): Promise<PoolOffer> {
  const userId = await requireUser('editar ofertas do pool');
  const { data, error } = await supabase.from('dynamic_email_pool_offers').update({
    promotion_name: offer.promotionName.trim(), sale_price: offer.salePrice.trim(), old_price: offer.oldPrice.trim(),
    start_date: offer.startDate, end_date: offer.endDate, image_url: offer.imageUrl.trim(), active: offer.active,
    edited_in_gaas_at: new Date().toISOString(), edited_by: userId,
  }).eq('offer_ref', offer.offerRef).select().single();
  if (error) throw error;
  return toOffer(data as PoolOfferRow);
}
