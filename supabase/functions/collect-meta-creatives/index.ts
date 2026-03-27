// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// collect-meta-creatives — Supabase Edge Function
// Meta Marketing API v25 | March 2026
//
// What this function collects per ad:
//   image_url        → url_1080 from /adimages (images, high-res)
//   video_thumbnail_url → picture from /{video_id}?fields=picture (videos)
//   media_type       → 'image' | 'video' (reliable, from API fields)
//   aspect_ratio     → width/height from /adimages or video thumbnail size
//   image_hash       → stable hash for deduplication
//   video_id         → video asset ID
//   body, title, description, call_to_action_type → ad copy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0';
const BATCH_SIZE = 50; // Max hashes per /adimages request

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function metaGet(path: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${GRAPH_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429 || res.status >= 500) {
      // Rate limit or server error — exponential backoff
      const waitMs = attempt * 2000;
      console.warn(`[Meta API] ${res.status} on ${path}, retrying in ${waitMs}ms...`);
      await sleep(waitMs);
      continue;
    }

    const json = await res.json();
    if (json.error) {
      console.error(`[Meta API] Error on ${path}:`, JSON.stringify(json.error));
      return null;
    }
    return json;
  }
  return null;
}

// Chunk array into groups of max size n
function chunks<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  console.log('[collect-meta-creatives] Starting...');

  // ── Env vars ──
  const META_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!META_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Missing META_ACCESS_TOKEN env var' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Auto-discover Ad Account ID if not explicitly set ─────────────────────
  let AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

  if (!AD_ACCOUNT_ID) {
    console.log('[collect-meta-creatives] META_AD_ACCOUNT_ID not set — auto-discovering via /me/adaccounts...');
    const discovery = await metaGet(
      `/me/adaccounts?fields=id,name,currency&access_token=${META_TOKEN}&limit=1`,
      META_TOKEN
    );
    if (!discovery?.data?.length) {
      return new Response(
        JSON.stringify({ error: 'Could not auto-discover ad account. Set META_AD_ACCOUNT_ID manually.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    AD_ACCOUNT_ID = discovery.data[0].id; // e.g. "act_123456789"
    console.log(`[collect-meta-creatives] Auto-discovered account: ${AD_ACCOUNT_ID} (${discovery.data[0].name})`);
  }


  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // ── Step 1: Get all ads with their creative IDs ──────────────────────────
    console.log('[Step 1] Fetching ads list from Meta...');

    const adsFields = 'id,name,adset_id,campaign_id,effective_status,creative{id}';
    let allAds: any[] = [];
    let nextUrl: string | null =
      `${GRAPH_API_BASE}/${AD_ACCOUNT_ID}/ads?fields=${adsFields}&limit=200&access_token=${META_TOKEN}`;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const json = await res.json();
      if (json.error) {
        console.error('[Step 1] Error fetching ads:', json.error);
        break;
      }
      allAds = allAds.concat(json.data || []);
      nextUrl = json.paging?.next || null;
      if (nextUrl) await sleep(300); // gentle pacing
    }

    console.log(`[Step 1] Found ${allAds.length} ads.`);

    // ── Step 2: Get creative details for each ad ─────────────────────────────
    console.log('[Step 2] Fetching creative details...');

    const creativeFields = [
      'id', 'name',
      'thumbnail_url',        // low-res preview (fallback)
      'image_url',            // high-res image URL (Direct, may be missing)
      'image_hash',           // stable hash → use for /adimages lookup
      'video_id',             // video asset ID
      'body', 'title', 'description',
      'call_to_action_type',
      'object_story_spec',    // story spec may contain image/video details
      'asset_feed_spec',      // DPA / DCO feed
      'effective_status',
    ].join(',');

    // Map: creative_id → creative data
    const creativeDetailsMap = new Map<string, any>();

    // Collect unique creative IDs
    const creativeIds = [...new Set(
      allAds
        .map(ad => ad.creative?.id)
        .filter(Boolean)
    )];

    console.log(`[Step 2] Fetching ${creativeIds.length} unique creatives...`);

    // Fetch in batches to respect rate limits
    for (const batch of chunks(creativeIds, 10)) {
      await Promise.all(batch.map(async (cid) => {
        const data = await metaGet(`/${cid}?fields=${creativeFields}&access_token=${META_TOKEN}`, META_TOKEN);
        if (data) creativeDetailsMap.set(cid, data);
      }));
      await sleep(500); // Pace between creative batches
    }

    console.log(`[Step 2] Got ${creativeDetailsMap.size} creative details.`);

    // ── Step 3: Batch-fetch high-res image URLs via /adimages ────────────────
    console.log('[Step 3] Fetching high-res images from /adimages...');

    // Collect all unique image_hashes from creatives
    const allHashes = [...new Set(
      [...creativeDetailsMap.values()]
        .map(c => c.image_hash)
        .filter(Boolean)
    )];

    // Map: hash → { url_1080, width, height }
    const imageDataMap = new Map<string, { url_1080?: string; width?: number; height?: number }>();

    for (const hashBatch of chunks(allHashes, BATCH_SIZE)) {
      const hashParam = encodeURIComponent(JSON.stringify(hashBatch));
      const data = await metaGet(
        `/${AD_ACCOUNT_ID}/adimages?hashes=${hashParam}&fields=hash,url_1080,width,height&access_token=${META_TOKEN}`,
        META_TOKEN
      );
      if (data?.data) {
        for (const img of data.data) {
          if (img.hash) {
            imageDataMap.set(img.hash, {
              url_1080: img.url_1080,
              width: img.width || null,
              height: img.height || null,
            });
          }
        }
      }
      await sleep(300);
    }

    console.log(`[Step 3] Got ${imageDataMap.size} high-res image URLs.`);

    // ── Step 4: Fetch video thumbnails (higher quality than creative thumbnail_url) ──
    console.log('[Step 4] Fetching video thumbnails...');

    const allVideoIds = [...new Set(
      [...creativeDetailsMap.values()]
        .map(c => c.video_id)
        .filter(Boolean)
    )];

    // Map: video_id → { picture: highResThumbnailUrl }
    const videoDataMap = new Map<string, { picture?: string; width?: number; height?: number }>();

    for (const batch of chunks(allVideoIds, 10)) {
      await Promise.all(batch.map(async (vid) => {
        const data = await metaGet(
          `/${vid}?fields=picture,format&access_token=${META_TOKEN}`,
          META_TOKEN
        );
        if (data) {
          // 'format' is an array of {width, height, picture_url, embed_html}  
          // pick the largest resolution
          let bestWidth = 0;
          let bestHeight = 0;
          if (Array.isArray(data.format)) {
            for (const f of data.format) {
              if ((f.width || 0) > bestWidth) {
                bestWidth = f.width;
                bestHeight = f.height;
              }
            }
          }
          videoDataMap.set(vid, {
            picture: data.picture,
            width: bestWidth || undefined,
            height: bestHeight || undefined,
          });
        }
      }));
      await sleep(500);
    }

    console.log(`[Step 4] Got ${videoDataMap.size} video thumbnails.`);

    // ── Step 5: Get adset names for enrichment ───────────────────────────────
    console.log('[Step 5] Fetching adset names...');

    const adsetIds = [...new Set(allAds.map(ad => ad.adset_id).filter(Boolean))];
    const adsetMap = new Map<string, string>();

    for (const batch of chunks(adsetIds, 20)) {
      await Promise.all(batch.map(async (asid) => {
        const data = await metaGet(`/${asid}?fields=id,name&access_token=${META_TOKEN}`, META_TOKEN);
        if (data?.name) adsetMap.set(asid, data.name);
      }));
      await sleep(300);
    }

    // ── Step 6: Build upsert payload ─────────────────────────────────────────
    console.log('[Step 6] Building upsert payload...');

    const upsertRows: any[] = [];

    for (const ad of allAds) {
      const creativeId = ad.creative?.id;
      const creative = creativeId ? creativeDetailsMap.get(creativeId) : null;

      // ── Determine media type reliably ──
      const hasVideo = !!creative?.video_id;
      const hasImage = !!creative?.image_hash;
      const mediaType: 'image' | 'video' | null = hasVideo ? 'video' : hasImage ? 'image' : null;

      // ── Image URL: prefer url_1080 from /adimages, fallback to creative.image_url ──
      const imgHash = creative?.image_hash;
      const imgData = imgHash ? imageDataMap.get(imgHash) : null;
      const imageUrl = imgData?.url_1080 || creative?.image_url || null;

      // ── Aspect ratio: from /adimages dimensions (most reliable) ──
      let aspectRatio: number | null = null;
      if (imgData?.width && imgData?.height && imgData.height > 0) {
        aspectRatio = imgData.width / imgData.height;
      } else if (mediaType === 'video' && creative?.video_id) {
        const vidData = videoDataMap.get(creative.video_id);
        if (vidData?.width && vidData?.height && vidData.height > 0) {
          aspectRatio = vidData.width / vidData.height;
        }
      }

      // ── Video thumbnail (higher res than creative.thumbnail_url) ──
      const videoThumbnailUrl =
        creative?.video_id
          ? videoDataMap.get(creative.video_id)?.picture || creative?.thumbnail_url || null
          : creative?.thumbnail_url || null;

      // ── Parse body/copy from object_story_spec if direct fields are empty ──
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

      upsertRows.push({
        ad_id: ad.id,
        ad_name: ad.name || null,
        adset_name: ad.adset_id ? (adsetMap.get(ad.adset_id) || null) : null,
        creative_id: creativeId || null,

        // ── Media URLs ──
        thumbnail_path: videoThumbnailUrl,       // low-res / video thumb (legacy compat)
        image_url: imageUrl,                      // HIGH-RES image (url_1080 or original)
        video_thumbnail_url: videoThumbnailUrl,  // explicit video thumbnail field

        // ── Meta intelligence ──
        image_hash: imgHash || null,
        video_id: creative?.video_id || null,
        media_type: mediaType,                    // reliable: 'image' | 'video' | null
        aspect_ratio: aspectRatio,                // real dimensions ratio

        // ── Copy ──
        body: body,
        title: title,
        description: description,
        call_to_action_type: creative?.call_to_action_type || null,
        effective_status: ad.effective_status || creative?.effective_status || null,

        // ── Metadata ──
        collected_at: new Date().toISOString(),
      });
    }

    console.log(`[Step 6] Prepared ${upsertRows.length} rows to upsert.`);

    // ── Step 7: Upsert to Supabase in batches ────────────────────────────────
    console.log('[Step 7] Upserting to Supabase...');

    let upserted = 0;
    let errors = 0;

    for (const batch of chunks(upsertRows, 100)) {
      const { error } = await supabase
        .from('ad_creatives')
        .upsert(batch, { onConflict: 'ad_id' });

      if (error) {
        console.error('[Step 7] Upsert error:', error.message);
        errors++;
      } else {
        upserted += batch.length;
      }
    }

    const summary = {
      ads_processed: allAds.length,
      creatives_fetched: creativeDetailsMap.size,
      high_res_images: imageDataMap.size,
      video_thumbnails: videoDataMap.size,
      rows_upserted: upserted,
      upsert_errors: errors,
    };

    console.log('[collect-meta-creatives] Done!', summary);

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[collect-meta-creatives] Fatal error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
