// collect-meta-creatives - Supabase Edge Function
// Meta Marketing API v25 | March 2026
//
// Strategy:
// 1. Fetch ads with creative fields INLINE (single API call).
//    Fields: id, image_hash, image_url, video_id, thumbnail_url
//    - image_url  = direct URL to the full-resolution creative image (image ads)
//    - image_hash = used to fetch url_1080 from /adimages (highest res, if available)
//    - thumbnail_url = low-res preview thumbnail (signed, stp-restricted) — fallback only
// 2. For IMAGE ads:
//    a. Best:  url_1080 via /adimages?hashes= (1080px, server-accessible)
//    b. Good:  creative.image_url (full-res direct URL, server-accessible)
//    c. Fallback: source-only — browser loads thumbnail_url directly from Meta CDN
// 3. For VIDEO ads: always source-only — Meta CDN requires browser session for thumbnails.
// 4. thumbnail_url: signed CDN URL with stp=p64x64 — DO NOT modify (stp is in the signature).
//    Used only as browser-side fallback for video/source-only ads.
//
// Safety:
// - Guard: abort upsert if no creative data returned.
// - COALESCE: never null-out good existing values, except storage fields for video/source-only.
// - Min size check: reject downloads < 5KB (Meta returns ~2KB placeholder when blocked).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0';
const CREATIVE_BUCKET = 'ad-creatives';
const META_BATCH_SIZE = 50;
const ASSET_UPLOAD_CONCURRENCY = 8;
const MIN_VALID_IMAGE_BYTES = 5000;

type MediaType = 'image' | 'video' | null;

type HostedAssetResult = {
  bucket: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  sourceUrl: string | null;
  width: number | null;
  height: number | null;
  contentType: string | null;
  origin: 'supabase-storage' | 'meta-cdn' | 'legacy';
  syncStatus: 'hosted' | 'source-only' | 'sync-failed';
  syncError: string | null;
  forceResetStorage: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunks<T>(arr: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let i = 0; i < arr.length; i += size) output.push(arr.slice(i, i + size));
  return output;
}

function sanitizeSegment(value: string | null | undefined, fallback = 'unknown') {
  const normalized = (value || fallback)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function buildPublicUrl(supabaseUrl: string, bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

function inferExtension(contentType: string | null, sourceUrl: string | null) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/gif': 'gif',
  };
  if (contentType && map[contentType.toLowerCase()]) return map[contentType.toLowerCase()];
  if (sourceUrl) {
    try {
      const seg = new URL(sourceUrl).pathname.split('/').pop() || '';
      const m = seg.match(/\.([a-zA-Z0-9]+)$/);
      if (m) return m[1].toLowerCase();
    } catch { /* ignore */ }
  }
  return 'jpg';
}

async function metaGet(path: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${GRAPH_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 429 || res.status >= 500) { await sleep(attempt * 2000); continue; }
    const json = await res.json();
    if (json.error) {
      console.error(`[Meta API] Error on ${path}:`, JSON.stringify(json.error));
      return null;
    }
    return json;
  }
  return null;
}

async function downloadBinary(sourceUrl: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(sourceUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'image/*,*/*;q=0.8',
          'User-Agent': 'supabase-edge-fn-meta-creatives/1.0',
        },
      });
      if (res.status === 429 || res.status >= 500) { await sleep(attempt * 1500); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type');
      const bytes = await res.arrayBuffer();
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Bad content-type: ${contentType}`);
      }
      if (bytes.byteLength === 0) throw new Error('Empty payload');
      // Meta CDN returns ~2KB placeholder JPEG when blocking server-side requests.
      if (bytes.byteLength < MIN_VALID_IMAGE_BYTES) {
        throw new Error(`Payload too small (${bytes.byteLength}b) — CDN blocked server-side`);
      }
      return { bytes, contentType };
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 1500);
    }
  }
  throw new Error('Unreachable');
}

async function hostCreativeAsset(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  assetCache: Map<string, Promise<HostedAssetResult>>,
  params: {
    sourceUrl: string | null;
    mediaType: MediaType;
    creativeId: string | null;
    assetKey: string | null;
    width: number | null;
    height: number | null;
  },
): Promise<HostedAssetResult> {
  const { sourceUrl, mediaType, creativeId, assetKey, width, height } = params;

  // VIDEO: Meta CDN thumbnail URLs require browser session — never host server-side.
  // forceResetStorage clears any previously broken hosted files.
  if (mediaType === 'video') {
    return {
      bucket: null, storagePath: null, publicUrl: null, sourceUrl, width, height, contentType: null,
      origin: 'meta-cdn',
      syncStatus: 'source-only',
      syncError: null,
      forceResetStorage: true,
    };
  }

  // NULL mediaType or missing data: serve source-only from Meta CDN.
  // Do NOT attempt to download thumbnail_url — it is always low-res.
  if (!sourceUrl || !mediaType || !creativeId) {
    return {
      bucket: null, storagePath: null, publicUrl: null, sourceUrl, width, height, contentType: null,
      origin: sourceUrl ? 'meta-cdn' : 'legacy',
      syncStatus: sourceUrl ? 'source-only' : 'sync-failed',
      syncError: sourceUrl ? null : 'Missing source asset URL',
      forceResetStorage: true, // clear any previously hosted low-res thumbnail
    };
  }

  // IMAGE with a real high-res source URL: download and host in Storage.
  const base = `${mediaType}/${sanitizeSegment(creativeId)}/${sanitizeSegment(assetKey || creativeId)}`;
  const cacheKey = `${base}::${sourceUrl}`;
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!;

  const promise = (async (): Promise<HostedAssetResult> => {
    try {
      const { bytes, contentType } = await downloadBinary(sourceUrl);
      const ext = inferExtension(contentType, sourceUrl);
      const storagePath = `${base}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from(CREATIVE_BUCKET)
        .upload(storagePath, bytes, { contentType, cacheControl: '31536000', upsert: true });
      if (uploadErr) throw uploadErr;
      return {
        bucket: CREATIVE_BUCKET, storagePath,
        publicUrl: buildPublicUrl(supabaseUrl, CREATIVE_BUCKET, storagePath),
        sourceUrl, width, height, contentType,
        origin: 'supabase-storage', syncStatus: 'hosted', syncError: null, forceResetStorage: false,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Asset Host Fallback]', msg, { creativeId, sourceUrl: sourceUrl?.slice(0, 80) });
      // Download failed (CDN blocked or error) — serve source-only from Meta CDN.
      return {
        bucket: null, storagePath: null, publicUrl: null, sourceUrl, width, height, contentType: null,
        origin: 'meta-cdn', syncStatus: 'source-only', syncError: null, forceResetStorage: true,
      };
    }
  })();

  assetCache.set(cacheKey, promise);
  return promise;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  console.log('[collect-meta-creatives] v17 starting');
  const META_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!META_TOKEN) return new Response(JSON.stringify({ error: 'Missing META_ACCESS_TOKEN' }), { status: 500 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const assetCache = new Map<string, Promise<HostedAssetResult>>();
  let AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

  if (!AD_ACCOUNT_ID) {
    const { data: sampleAd } = await supabase.from('ad_creatives').select('ad_id').limit(1).maybeSingle();
    if (sampleAd?.ad_id) {
      const info = await metaGet(`/${sampleAd.ad_id}?fields=account_id&access_token=${META_TOKEN}`, META_TOKEN);
      if (info?.account_id) AD_ACCOUNT_ID = `act_${info.account_id}`;
    }
    if (!AD_ACCOUNT_ID) {
      const disc = await metaGet(`/me/adaccounts?fields=id,name&access_token=${META_TOKEN}&limit=1`, META_TOKEN);
      if (disc?.data?.length) AD_ACCOUNT_ID = disc.data[0].id;
    }
    if (!AD_ACCOUNT_ID) return new Response(JSON.stringify({ error: 'Ad account not found' }), { status: 500 });
  }

  try {
    // image_url = direct URL to the full-resolution image used in the creative.
    // This is the key addition vs previous versions — avoids /adimages lookup for most image ads.
    const adsFields = 'id,name,adset_id,campaign_id,effective_status,creative{id,image_hash,image_url,video_id,thumbnail_url}';
    let allAds: any[] = [];
    let adsApiError: string | null = null;
    let nextUrl: string | null =
      `${GRAPH_API_BASE}/${AD_ACCOUNT_ID}/ads?fields=${encodeURIComponent(adsFields)}&limit=200&access_token=${META_TOKEN}`;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const json = await res.json();
      if (json.error) { adsApiError = JSON.stringify(json.error); break; }
      allAds = allAds.concat(json.data || []);
      nextUrl = json.paging?.next || null;
      if (nextUrl) await sleep(300);
    }

    if (allAds.length === 0 && adsApiError) {
      return new Response(JSON.stringify({ error: 'Meta API ads fetch failed', detail: adsApiError }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    console.log(`[v17] Ads: ${allAds.length}`);

    const creativeDetailsMap = new Map<string, any>();
    for (const ad of allAds) {
      if (ad.creative?.id) creativeDetailsMap.set(ad.creative.id, ad.creative);
    }
    console.log(`[v17] Unique creatives: ${creativeDetailsMap.size}`);

    if (creativeDetailsMap.size === 0) {
      return new Response(JSON.stringify({ ok: false, warning: 'No creative data — upsert skipped', ads_found: allAds.length, upserted: 0 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Fetch url_1080 from /adimages for ads that have image_hash.
    // url_1080 is the highest quality (1080px) and is server-accessible.
    const imageHashes = [...new Set([...creativeDetailsMap.values()].map((c) => c.image_hash).filter(Boolean))];
    const imageDataMap = new Map<string, { url_1080: string | null; width: number | null; height: number | null }>();
    console.log(`[v17] Hashes to resolve: ${imageHashes.length}`);

    for (const batch of chunks(imageHashes, META_BATCH_SIZE)) {
      const hp = encodeURIComponent(JSON.stringify(batch));
      const data = await metaGet(
        `/${AD_ACCOUNT_ID}/adimages?hashes=${hp}&fields=hash,url_1080,width,height&access_token=${META_TOKEN}`,
        META_TOKEN,
      );
      if (data?.data) {
        for (const img of data.data) {
          if (img.hash) imageDataMap.set(img.hash, { url_1080: img.url_1080 || null, width: img.width || null, height: img.height || null });
        }
      }
      await sleep(200);
    }
    console.log(`[v17] url_1080 resolved: ${imageDataMap.size}`);

    // Fetch video dimensions AND high-res thumbnails (server-accessible via /thumbnails edge).
    const videoIds = [...new Set([...creativeDetailsMap.values()].map((c) => c.video_id).filter(Boolean))];
    const videoDataMap = new Map<string, { width: number | null; height: number | null; highResThumb: string | null }>();
    for (const batch of chunks(videoIds, 10)) {
      await Promise.all(batch.map(async (vid) => {
        const d = await metaGet(`/${vid}?fields=format,thumbnails{uri,width,height}&access_token=${META_TOKEN}`, META_TOKEN);
        if (!d) return;
        let bw: number | null = null, bh: number | null = null;
        if (Array.isArray(d.format)) {
          for (const v of d.format) {
            if (!bw || (v.width || 0) > bw) { bw = v.width || null; bh = v.height || null; }
          }
        }
        let bestThumb = null;
        let maxW = 0;
        if (d.thumbnails?.data) {
          for (const t of d.thumbnails.data) {
            if (t.width > maxW) { maxW = t.width; bestThumb = t.uri; }
          }
        }
        videoDataMap.set(vid, { width: bw, height: bh, highResThumb: bestThumb });
      }));
      await sleep(300);
    }

    // Fetch adset names.
    const adsetIds = [...new Set(allAds.map((ad) => ad.adset_id).filter(Boolean))];
    const adsetMap = new Map<string, string>();
    for (const batch of chunks(adsetIds, 20)) {
      await Promise.all(batch.map(async (id) => {
        const d = await metaGet(`/${id}?fields=id,name&access_token=${META_TOKEN}`, META_TOKEN);
        if (d?.name) adsetMap.set(id, d.name);
      }));
      await sleep(200);
    }

    // COALESCE: fetch existing rows to protect non-null values.
    const adIds = allAds.map((ad) => ad.id);
    const { data: existingRows } = await supabase
      .from('ad_creatives')
      .select('ad_id,image_url,image_hash,video_id,media_type,thumbnail_path,creative_id,video_thumbnail_url,aspect_ratio,call_to_action_type,effective_status,adset_name,asset_public_url,asset_storage_path,asset_storage_bucket,asset_source_url,asset_width,asset_height,asset_content_type,asset_origin,asset_sync_status,asset_sync_error')
      .in('ad_id', adIds);
    const existingMap = new Map<string, any>((existingRows || []).map((r: any) => [r.ad_id, r]));

    const upsertRows: any[] = [];

    for (const batch of chunks(allAds, ASSET_UPLOAD_CONCURRENCY)) {
      const rows = await Promise.all(batch.map(async (ad) => {
        const ex = existingMap.get(ad.id) || {};
        const creative = creativeDetailsMap.get(ad.creative?.id);

        // Determine media type.
        // video_id → video; image_hash or image_url → image; else null.
        const mediaType: MediaType =
          creative?.video_id ? 'video'
          : (creative?.image_hash || creative?.image_url) ? 'image'
          : null;

        const imageData = creative?.image_hash ? imageDataMap.get(creative.image_hash) : null;

        // Image source priority:
        // 1. url_1080 from /adimages (1080px, best quality, server-accessible)
        // 2. creative.image_url (full-res direct URL, server-accessible for most image ads)
        // 3. If both null → source-only (browser loads thumbnail_url directly)
        const imageUrl = imageData?.url_1080 || creative?.image_url || null;

        const videoData = creative?.video_id ? videoDataMap.get(creative.video_id) : null;
        // thumbnail_url is kept only for browser-side fallback (never hosted in Storage).
        const videoThumbnailUrl = creative?.thumbnail_url || null;

        let ar = null;
        if (imageData?.width && imageData?.height) ar = imageData.width / imageData.height;
        else if (videoData?.width && videoData?.height) ar = videoData.width / videoData.height;

        // sourceUrl for hosting:
        // - image: use imageUrl (url_1080 or image_url) — high-res, server-accessible
        // - video: highResThumb from /thumbnails edge — highest res, server-accessible
        // - null mediaType: no sourceUrl for hosting (source-only via thumbnail_url)
        const sourceUrlForHosting = mediaType === 'image' ? imageUrl : mediaType === 'video' ? videoData?.highResThumb : null;

        const ha = await hostCreativeAsset(supabase, SUPABASE_URL, assetCache, {
          sourceUrl: sourceUrlForHosting,
          mediaType,
          creativeId: creative?.id || null,
          assetKey: mediaType === 'image' ? (creative?.image_hash || creative?.id || null) : creative?.video_id || null,
          width: mediaType === 'image' ? (imageData?.width || null) : videoData?.width || null,
          height: mediaType === 'image' ? (imageData?.height || null) : videoData?.height || null,
        });

        // forceResetStorage: clear any previously hosted broken/low-res files.
        const cs = ha.forceResetStorage;

        // For source-only fallback display in browser: use thumbnail_url.
        // This is what resolveCreativeAssetUrl uses when asset_public_url is null.
        const browserFallbackUrl = videoThumbnailUrl || imageUrl || null;

        return {
          ad_id: ad.id,
          ad_name: ad.name,
          adset_name: adsetMap.get(ad.adset_id) || ex.adset_name || null,
          creative_id: creative?.id || ex.creative_id || null,
          thumbnail_path: browserFallbackUrl ?? ex.thumbnail_path ?? null,
          image_url: imageUrl ?? ex.image_url ?? null,
          video_thumbnail_url: browserFallbackUrl ?? ex.video_thumbnail_url ?? null,
          image_hash: creative?.image_hash || ex.image_hash || null,
          video_id: creative?.video_id || ex.video_id || null,
          media_type: mediaType ?? ex.media_type ?? null,
          aspect_ratio: ar ?? ex.aspect_ratio ?? null,
          call_to_action_type: creative?.call_to_action_type || ex.call_to_action_type || null,
          effective_status: ad.effective_status || ex.effective_status || null,
          // Storage: clear if forceResetStorage, otherwise COALESCE.
          asset_storage_bucket: cs ? null : (ha.bucket ?? ex.asset_storage_bucket ?? null),
          asset_storage_path: cs ? null : (ha.storagePath ?? ex.asset_storage_path ?? null),
          asset_public_url: cs ? null : (ha.publicUrl ?? ex.asset_public_url ?? null),
          asset_source_url: ha.sourceUrl ?? ex.asset_source_url ?? null,
          asset_width: ha.width ?? ex.asset_width ?? null,
          asset_height: ha.height ?? ex.asset_height ?? null,
          asset_content_type: cs ? null : (ha.contentType ?? ex.asset_content_type ?? null),
          asset_origin: ha.origin,
          asset_last_synced_at: new Date().toISOString(),
          asset_sync_status: ha.syncStatus,
          asset_sync_error: ha.syncError,
          collected_at: new Date().toISOString(),
        };
      }));

      upsertRows.push(...rows);
    }

    let upserted = 0;
    for (const batch of chunks(upsertRows, 100)) {
      const { error } = await supabase.from('ad_creatives').upsert(batch, { onConflict: 'ad_id' });
      if (error) console.error('[Upsert Error]', error.message);
      else upserted += batch.length;
    }

    const hostedCount = upsertRows.filter((r) => r.asset_sync_status === 'hosted').length;
    const sourceOnlyCount = upsertRows.filter((r) => r.asset_sync_status === 'source-only').length;
    const failedCount = upsertRows.filter((r) => r.asset_sync_status === 'sync-failed').length;

    // Breakdown for debugging
    const imageAds = upsertRows.filter((r) => r.media_type === 'image');
    const videoAds = upsertRows.filter((r) => r.media_type === 'video');
    const nullTypeAds = upsertRows.filter((r) => !r.media_type);
    const withImageUrl = upsertRows.filter((r) => r.image_url).length;

    return new Response(JSON.stringify({
      ok: true,
      ads_found: allAds.length,
      creatives_fetched: creativeDetailsMap.size,
      url_1080_resolved: imageDataMap.size,
      image_url_from_inline: upsertRows.filter((r) => r.image_url && !imageDataMap.has(r.image_hash)).length,
      upserted,
      hosted_assets: hostedCount,
      source_only: sourceOnlyCount,
      failed_assets: failedCount,
      breakdown: {
        image_ads: imageAds.length,
        video_ads: videoAds.length,
        unknown_type: nullTypeAds.length,
        with_any_image_url: withImageUrl,
      },
      bucket: CREATIVE_BUCKET,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('[collect-meta-creatives] Fatal error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
});
