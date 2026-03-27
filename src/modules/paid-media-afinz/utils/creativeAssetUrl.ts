import type { AdCreative } from '../types';

const SUPABASE_URL = 'https://mipiwxadnpwtcgfcedym.supabase.co';
const CREATIVE_BUCKET = 'ad-creatives';

const isAbsoluteUrl = (value?: string | null) =>
  Boolean(value && /^https?:\/\//i.test(value));

export const resolveCreativeAssetUrl = (creative?: AdCreative): string | null => {
  if (!creative) return null;

  if (isAbsoluteUrl(creative.asset_public_url)) return creative.asset_public_url!;

  if (creative.asset_storage_path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${CREATIVE_BUCKET}/${creative.asset_storage_path}`;
  }

  const rawUrl = creative.image_url || creative.video_thumbnail_url || creative.thumbnail_path;
  if (!rawUrl) return null;

  if (isAbsoluteUrl(rawUrl)) return rawUrl;

  return `${SUPABASE_URL}/storage/v1/object/public/ad-thumbnails/${rawUrl}`;
};
