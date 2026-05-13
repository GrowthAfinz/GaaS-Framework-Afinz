import type { AdCreative } from '../types';

const SUPABASE_URL = 'https://mipiwxadnpwtcgfcedym.supabase.co';
const CREATIVE_BUCKET = 'ad-creatives';

const isAbsoluteUrl = (value?: string | null) =>
  Boolean(value && /^https?:\/\//i.test(value));

export const resolveCreativeAssetUrl = (
  creative?: AdCreative,
  options?: { width?: number; quality?: number }
): string | null => {
  if (!creative) return null;

  let url: string | null = null;

  // 1. Hosted in Supabase Storage (best quality, stable URL)
  if (isAbsoluteUrl(creative.asset_public_url)) {
    url = creative.asset_public_url!;
  } else if (creative.asset_storage_path) {
    url = `${SUPABASE_URL}/storage/v1/object/public/${CREATIVE_BUCKET}/${creative.asset_storage_path}`;
  }

  // Apply transformations if it's a Supabase URL
  if (url && url.includes(SUPABASE_URL) && options) {
    const { width, quality = 85 } = options;
    if (width) {
      // Switch from /object/public/ to /render/image/public/
      url = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      url += `${url.includes('?') ? '&' : '?'}width=${width}&quality=${quality}&resize=contain`;
    }
  }

  if (url) return url;

  // 2. Meta CDN fallback — return URL unchanged.
  const rawUrl = creative.image_url || creative.video_thumbnail_url || creative.thumbnail_path;
  if (!rawUrl) return null;

  if (isAbsoluteUrl(rawUrl)) return rawUrl;

  return `${SUPABASE_URL}/storage/v1/object/public/ad-thumbnails/${rawUrl}`;
};
