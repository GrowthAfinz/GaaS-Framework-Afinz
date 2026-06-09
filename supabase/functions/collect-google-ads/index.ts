import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://mipiwxadnpwtcgfcedym.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CLIENT_ID = Deno.env.get("GOOGLE_ADS_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET") ?? "";
const REFRESH_TOKEN = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN") ?? "";
const DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") ?? "";

const GADS_API_VERSION = "v20";
const MCC_CUSTOMER_ID = "2777285464";

const ACCOUNTS = [
  { customerId: "9931331870", name: "Institucional" },
  { customerId: "3735275399", name: "Fabrica de Vendas - Cartoes" },
];

type GoogleAdsRow = {
  campaign?: { id?: string; name?: string; status?: string };
  segments?: { date?: string };
  metrics?: {
    costMicros?: string;
    impressions?: string;
    clicks?: string;
    conversions?: string;
    ctr?: string;
    averageCpc?: string;
    averageCpm?: string;
  };
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const toInt = (value: unknown) => Math.round(Number(value ?? 0) || 0);

async function getAccessToken(): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const text = await resp.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    // Keep raw text in the error below.
  }

  if (!resp.ok) {
    const error = String(data.error ?? "");
    const description = String(data.error_description ?? text);
    if (error === "invalid_grant") {
      throw new Error(
        "GOOGLE_ADS_REFRESH_TOKEN_INVALID: o refresh token do Google Ads foi revogado, expirou ou pertence a um consentimento OAuth invalido. Gere um novo refresh token e atualize o secret GOOGLE_ADS_REFRESH_TOKEN no Supabase.",
      );
    }
    throw new Error(`Google OAuth token error (${resp.status}): ${error || description}`);
  }

  if (!data.access_token) {
    throw new Error("Google OAuth token response did not include access_token.");
  }

  return String(data.access_token);
}

async function queryCampaigns(accessToken: string, customerId: string, since: string, until: string) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND metrics.impressions > 0
    ORDER BY segments.date DESC
    LIMIT 10000
  `;

  const resp = await fetch(
    `https://googleads.googleapis.com/${GADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEVELOPER_TOKEN,
        "login-customer-id": MCC_CUSTOMER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const text = await resp.text();
  console.log(`[google-ads] customer=${customerId} HTTP=${resp.status} len=${text.length}`);

  if (!resp.ok) {
    throw new Error(`Google Ads API error customer=${customerId} status=${resp.status}: ${text.slice(0, 800)}`);
  }

  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed.flatMap((chunk: { results?: GoogleAdsRow[] }) => chunk.results ?? []);
  return parsed.results ?? [];
}

function normalizeRow(row: GoogleAdsRow, accountName: string) {
  const metrics = row.metrics ?? {};
  const campaign = row.campaign ?? {};
  const segments = row.segments ?? {};

  const spend = Number(metrics.costMicros ?? 0) / 1_000_000;
  const impressions = toInt(metrics.impressions);
  const clicks = toInt(metrics.clicks);
  const conversions = toInt(metrics.conversions);
  const ctr = Number(metrics.ctr ?? 0) * 100;
  const cpc = Number(metrics.averageCpc ?? 0) / 1_000_000;
  const cpm = Number(metrics.averageCpm ?? 0) / 1_000_000;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const campaignName = campaign.name ?? "";

  return {
    date: segments.date,
    channel: "google",
    campaign: `[${accountName}] ${campaignName}`,
    objective: campaignName.toLowerCase().includes("brand") ? "brand" : "conversion",
    ad_id: campaign.id ?? null,
    ad_name: campaignName,
    adset_id: null,
    adset_name: null,
    spend,
    impressions,
    clicks,
    conversions,
    reach: 0,
    frequency: 0,
    cpm,
    cpc,
    ctr,
    cpa,
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !DEVELOPER_TOKEN || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({
        success: false,
        error: "Missing required secrets",
        missing: {
          GOOGLE_ADS_CLIENT_ID: !CLIENT_ID,
          GOOGLE_ADS_CLIENT_SECRET: !CLIENT_SECRET,
          GOOGLE_ADS_REFRESH_TOKEN: !REFRESH_TOKEN,
          GOOGLE_ADS_DEVELOPER_TOKEN: !DEVELOPER_TOKEN,
          SUPABASE_SERVICE_ROLE_KEY: !SUPABASE_SERVICE_ROLE_KEY,
        },
      }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "daily";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const since = mode === "backfill"
      ? (body.since ?? "2025-01-01")
      : (() => {
        const start = new Date(today);
        start.setDate(start.getDate() - 2);
        return start.toISOString().slice(0, 10);
      })();
    const until = mode === "backfill" ? (body.until ?? yesterdayStr) : yesterdayStr;

    console.log(`[google-ads] mode=${mode} ${since} -> ${until} | MCC=${MCC_CUSTOMER_ID} | API=${GADS_API_VERSION}`);
    const accessToken = await getAccessToken();

    const allRows = [];
    for (const account of ACCOUNTS) {
      const rows = await queryCampaigns(accessToken, account.customerId, since, until);
      console.log(`[google-ads] ${account.name} ${since}->${until}: ${rows.length} rows`);
      allRows.push(...rows.map((row) => normalizeRow(row, account.name)));
    }

    const rows = allRows.filter((row) => row.date);
    console.log(`[google-ads] total=${rows.length}`);

    if (rows.length === 0) {
      return jsonResponse({ success: true, inserted: 0, message: "No data from Google Ads for this period", period: { from: since, to: until }, mode });
    }

    const minDate = rows.reduce((min, row) => row.date < min ? row.date : min, rows[0].date);
    const maxDate = rows.reduce((max, row) => row.date > max ? row.date : max, rows[0].date);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: deleteError } = await supabase
      .from("paid_media_metrics")
      .delete()
      .eq("channel", "google")
      .gte("date", minDate)
      .lte("date", maxDate);

    if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      const { error } = await supabase.from("paid_media_metrics").insert(batch);
      if (error) throw new Error(`Insert error: ${error.message}`);
      inserted += batch.length;
    }

    return jsonResponse({ success: true, inserted, period: { from: minDate, to: maxDate }, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[google-ads] ERROR:", message);
    const status = message.startsWith("GOOGLE_ADS_REFRESH_TOKEN_INVALID") ? 401 : 500;
    return jsonResponse({ success: false, error: message }, status);
  }
});
