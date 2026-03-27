// collect-meta-creatives - Supabase Edge Function
// Meta Marketing API v25 | March 2026
//
// Strategy:
// 1. Read high-resolution creative metadata from Meta.
// 2. Download the best available image/video thumbnail binary.
// 3. Persist the asset in Supabase Storage with deterministic paths.
// 4. Upsert ad_creatives with hosted URLs first, Meta URLs only as fallback/debug.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0';
const CREATIVE_BUCKET = 'ad-creatives';
const META_BATCH_SIZE = 50;
const ASSET_UPLOAD_CONCURRENCY = 8;

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
  const contentTypeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  if (contentType && contentTypeMap[contentType.toLowerCase()]) {
    return contentTypeMap[contentType.toLowerCase()];
  }

  if (sourceUrl) {
    try {
      const pathname = new URL(sourceUrl).pathname;
      const lastSegment = pathname.split('/').pop() || '';
      const match = lastSegment.match(/\.([a-zA-Z0-9]+)$/);
      if (match) return match[1].toLowerCase();
    } catch {
      // Ignore malformed URLs and fallback to jpg.
    }
  }

  return 'jpg';
}

async function metaGet(path: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(`${GRAPH_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429 || response.status >= 500) {
      const waitMs = attempt * 2000;
      console.warn(`[Meta API] ${response.status} on ${path}, retrying in ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    const json = await response.json();
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
      const response = await fetch(sourceUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'supabase-edge-function-collect-meta-creatives',
        },
      });

      if (response.status === 429 || response.status >= 500) {
        const waitMs = attempt * 1500;
        console.warn(`[Asset Download] ${response.status} on ${sourceUrl}, retrying in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      const bytes = await response.arrayBuffer();

      if (!contentType?.startsWith('image/')) {
        throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
      }

      if (bytes.byteLength === 0) {
        throw new Error('Empty payload');
      }

      return { bytes, contentType };
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(attempt * 1500);
    }
  }

  throw new Error('Unreachable download state');
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

  if (!sourceUrl || !mediaType || !creativeId) {
    return {
      bucket: null,
      storagePath: null,
      publicUrl: null,
      sourceUrl,
      width,
      height,
      contentType: null,
      origin: sourceUrl ? 'meta-cdn' : 'legacy',
      syncStatus: sourceUrl ? 'source-only' : 'sync-failed',
      syncError: sourceUrl ? null : 'Missing source asset URL',
    };
  }

  const deterministicBase = `${mediaType}/${sanitizeSegment(creativeId)}/${sanitizeSegment(assetKey || creativeId)}`;
  const cacheKey = `${deterministicBase}::${sourceUrl}`;

  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey)!;
  }

  const promise = (async (): Promise<HostedAssetResult> => {
    try {
      const { bytes, contentType } = await downloadBinary(sourceUrl);
      const extension = inferExtension(contentType, sourceUrl);
      const storagePath = `${deterministicBase}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(CREATIVE_BUCKET)
        .upload(storagePath, bytes, {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      return {
        bucket: CREATIVE_BUCKET,
        storagePath,
        publicUrl: buildPublicUrl(supabaseUrl, CREATIVE_BUCKET, storagePath),
        sourceUrl,
        width,
        height,
        contentType,
        origin: 'supabase-storage',
        syncStatus: 'hosted',
        syncError: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Asset Host Error]', message, { creativeId, sourceUrl });

      return {
        bucket: null,
        storagePath: null,
        publicUrl: null,
        sourceUrl,
        width,
        height,
        contentType: null,
        origin: 'meta-cdn',
        syncStatus: 'sync-failed',
        syncError: message,
      };
    }
  })();

  assetCache.set(cacheKey, promise);
  return promise;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  console.log('[collect-meta-creatives] Starting');

  const META_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!META_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing META_ACCESS_TOKEN' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const assetCache = new Map<string, Promise<HostedAssetResult>>();

  let AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

  if (!AD_ACCOUNT_ID) {
    console.log('[collect-meta-creatives] META_AD_ACCOUNT_ID missing, trying auto-discovery');

    const { data: sampleAd } = await supabase
      .from('ad_creatives')
      .select('ad_id')
      .limit(1)
      .maybeSingle();

    if (sampleAd?.ad_id) {
      const adInfo = await metaGet(`/${sampleAd.ad_id}?fields=account_id&access_token=${META_TOKEN}`, META_TOKEN);
      if (adInfo?.account_id) {
        AD_ACCOUNT_ID = `act_${adInfo.account_id}`;
      }
    }

    if (!AD_ACCOUNT_ID) {
      const discovery = await metaGet(`/me/adaccounts?fields=id,name&access_token=${META_TOKEN}&limit=1`, META_TOKEN);
      if (discovery?.data?.length) {
        AD_ACCOUNT_ID = discovery.data[0].id;
      }
    }

    if (!AD_ACCOUNT_ID) {
      return new Response(JSON.stringify({ error: 'Ad account not found' }), { status: 500 });
    }
  }

  try {
    const adsFields = 'id,name,adset_id,campaign_id,effective_status,creative{id}';
    let allAds: any[] = [];
    let nextUrl: string | null = `${GRAPH_API_BASE}/${AD_ACCOUNT_ID}/ads?fields=${adsFields}&limit=200&access_token=${META_TOKEN}`;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const json = await response.json();
      if (json.error) break;
      allAds = allAds.concat(json.data || []);
      nextUrl = json.paging?.next || null;
      if (nextUrl) await sleep(300);
    }

    console.log(`[collect-meta-creatives] Ads found: ${allAds.length}`);

    const creativeFields = 'id,name,thumbnail_url,image_url,image_hash,video_id,body,title,description,call_to_action_type,object_story_spec,effective_status';
    const creativeDetailsMap = new Map<string, any>();
    const creativeIds = [...new Set(allAds.map((ad) => ad.creative?.id).filter(Boolean))];

    for (const batch of chunks(creativeIds, 15)) {
      await Promise.all(batch.map(async (creativeId) => {
        const data = await metaGet(`/${creativeId}?fields=${creativeFields}&access_token=${META_TOKEN}`, META_TOKEN);
        if (data) creativeDetailsMap.set(creativeId, data);
      }));
      await sleep(300);
    }

    const imageHashes = [...new Set([...creativeDetailsMap.values()].map((creative) => creative.image_hash).filter(Boolean))];
    const imageDataMap = new Map<string, { url_1080: string | null; width: number | null; height: number | null }>();

    for (const hashBatch of chunks(imageHashes, META_BATCH_SIZE)) {
      const hashParam = encodeURIComponent(JSON.stringify(hashBatch));
      const data = await metaGet(
        `/${AD_ACCOUNT_ID}/adimages?hashes=${hashParam}&fields=hash,url_1080,width,height&access_token=${META_TOKEN}`,
        META_TOKEN,
      );

      if (data?.data) {
        for (const image of data.data) {
          if (image.hash) {
            imageDataMap.set(image.hash, {
              url_1080: image.url_1080 || null,
              width: image.width || null,
              height: image.height || null,
            });
          }
        }
      }

      await sleep(200);
    }

    const videoIds = [...new Set([...creativeDetailsMap.values()].map((creative) => creative.video_id).filter(Boolean))];
    const videoDataMap = new Map<string, { picture: string | null; width: number | null; height: number | null }>();

    for (const batch of chunks(videoIds, 10)) {
      await Promise.all(batch.map(async (videoId) => {
        const data = await metaGet(`/${videoId}?fields=picture,format&access_token=${META_TOKEN}`, META_TOKEN);
        if (!data) return;

        let bestWidth: number | null = null;
        let bestHeight: number | null = null;
        if (Array.isArray(data.format)) {
          for (const variant of data.format) {
            const width = variant.width || 0;
            if (!bestWidth || width > bestWidth) {
              bestWidth = variant.width || null;
              bestHeight = variant.height || null;
            }
          }
        }

        videoDataMap.set(videoId, {
          picture: data.picture || null,
          width: bestWidth,
          height: bestHeight,
        });
      }));
      await sleep(300);
    }

    const adsetIds = [...new Set(allAds.map((ad) => ad.adset_id).filter(Boolean))];
    const adsetMap = new Map<string, string>();

    for (const batch of chunks(adsetIds, 20)) {
      await Promise.all(batch.map(async (adsetId) => {
        const data = await metaGet(`/${adsetId}?fields=id,name&access_token=${META_TOKEN}`, META_TOKEN);
        if (data?.name) adsetMap.set(adsetId, data.name);
      }));
      await sleep(200);
    }

    const upsertRows: any[] = [];

    for (const batch of chunks(allAds, ASSET_UPLOAD_CONCURRENCY)) {
      const resolvedRows = await Promise.all(batch.map(async (ad) => {
        const creative = creativeDetailsMap.get(ad.creative?.id);
        const mediaType: MediaType = creative?.video_id ? 'video' : creative?.image_hash ? 'image' : null;

        const imageData = creative?.image_hash ? imageDataMap.get(creative.image_hash) : null;
        const imageUrl = imageData?.url_1080 || creative?.image_url || null;
        const videoData = creative?.video_id ? videoDataMap.get(creative.video_id) : null;
        const videoThumbnailUrl = videoData?.picture || creative?.thumbnail_url || null;

        let aspectRatio = null;
        if (imageData?.width && imageData?.height) aspectRatio = imageData.width / imageData.height;
        else if (videoData?.width && videoData?.height) aspectRatio = videoData.width / videoData.height;

        let body = creative?.body || null;
        let title = creative?.title || null;
        let description = creative?.description || null;

        if (!body && creative?.object_story_spec) {
          const spec = creative.object_story_spec;
          const linkData = spec.link_data || spec.video_data?.call_to_action?.value || {};
          body = linkData.message || body;
          title = linkData.name || title;
          description = linkData.description || description;
        }

        const hostedAsset = await hostCreativeAsset(supabase, SUPABASE_URL, assetCache, {
          sourceUrl: mediaType === 'image' ? imageUrl : videoThumbnailUrl,
          mediaType,
          creativeId: creative?.id || null,
          assetKey: mediaType === 'image' ? creative?.image_hash || null : creative?.video_id || null,
          width: mediaType === 'image' ? imageData?.width || null : videoData?.width || null,
          height: mediaType === 'image' ? imageData?.height || null : videoData?.height || null,
        });

        return {
          ad_id: ad.id,
          ad_name: ad.name,
          adset_name: adsetMap.get(ad.adset_id) || null,
          creative_id: creative?.id || null,
          thumbnail_path: videoThumbnailUrl,
          image_url: imageUrl,
          video_thumbnail_url: videoThumbnailUrl,
          image_hash: creative?.image_hash || null,
          video_id: creative?.video_id || null,
          media_type: mediaType,
          aspect_ratio: aspectRatio,
          body,
          title,
          description,
          call_to_action_type: creative?.call_to_action_type || null,
          effective_status: ad.effective_status || creative?.effective_status || null,
          asset_storage_bucket: hostedAsset.bucket,
          asset_storage_path: hostedAsset.storagePath,
          asset_public_url: hostedAsset.publicUrl,
          asset_source_url: hostedAsset.sourceUrl,
          asset_width: hostedAsset.width,
          asset_height: hostedAsset.height,
          asset_content_type: hostedAsset.contentType,
          asset_origin: hostedAsset.origin,
          asset_last_synced_at: new Date().toISOString(),
          asset_sync_status: hostedAsset.syncStatus,
          asset_sync_error: hostedAsset.syncError,
          collected_at: new Date().toISOString(),
        };
      }));

      upsertRows.push(...resolvedRows);
    }

    let upserted = 0;
    for (const batch of chunks(upsertRows, 100)) {
      const { error } = await supabase.from('ad_creatives').upsert(batch, { onConflict: 'ad_id' });
      if (error) {
        console.error('[Upsert Error]', error.message);
      } else {
        upserted += batch.length;
      }
    }

    const hostedCount = upsertRows.filter((row) => row.asset_sync_status === 'hosted').length;
    const failedCount = upsertRows.filter((row) => row.asset_sync_status === 'sync-failed').length;

    return new Response(JSON.stringify({
      ok: true,
      ads_found: allAds.length,
      upserted,
      hosted_assets: hostedCount,
      failed_assets: failedCount,
      bucket: CREATIVE_BUCKET,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[collect-meta-creatives] Fatal error', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
