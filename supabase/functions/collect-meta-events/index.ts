// =====================================================================
// Governed Meta funnel collector. Disabled by default through feature flag.
// NO substitui `collect-meta-ads`. Dual-write por feature flag. Legado INTOCADO.
//
// Correes incorporadas nesta v2:
//  (1) Run lifecycle em paid_media_collection_runs (pending -> complete/failed).
//  (2) Eventos AUSENTES viram not_available (loop sobre eventos esperados x janelas).
//  (3) Aliases no somam: canonical vem do event_map; a dedup  na view (is_primary_measure).
//  (4) event_map versionado por vigncia (lista de verses; resolve por business_date).
//  (5) attribution_policy_key no nula na chave.
//  (6) attribution_spec por gro (ad->adset; adset->prprio; campaign->todos os adsets/mixed).
//  (7) Token em header Authorization: Bearer  nunca em URL/log/erro/paging.
//  (8) reconcile() chamada; tolerncia = max(R$0,05; 0,5%); warning vs critical.
//  (9) Paginao atmica por recorte/gro: falha aps retries => run failed => nada nas views.
// (10) Endpoint governado (JWT, body validado, modo daily|backfill, sem fallback histrico).
//
// AVISO legado (NO mexer nesta rodada): `conversions := start_trials` ser depreciado
// depois; o writer de julho ainda precisa ser identificado; NO misturar o dado novo com
// as colunas legadas.
// =====================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v25.0";
const TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? ""; // System User token (ads_read)
const ACCT = Deno.env.get("META_AD_ACCOUNT_ID") ?? ""; // 'act_...'
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENABLED =
  (Deno.env.get("COLLECT_META_EVENTS_ENABLED") ?? "false") === "true";
const GOVERNED_CAMPAIGNS = new Set(
  (Deno.env.get("META_GOVERNED_CAMPAIGN_IDS") ??
    Deno.env.get("META_GOVERNED_CAMPAIGN_ID") ?? "")
    .split(",").map((id) => id.trim()).filter(Boolean),
);

const CERT_WINDOWS = ["1d_view", "1d_click", "7d_click", "28d_click"];
const CHUNK_DAYS = 30;
const PAGE_LIMIT = 500;
const MAX_MANUAL_DAYS = 92; // limite p/ backfill manual
const sb = createClient(SB_URL, SB_KEY);

type Grain = "campaign" | "adset" | "ad";
interface EventMapRow {
  source: string;
  source_event_name: string;
  canonical_event: string;
  alias_group: string;
  is_primary_measure: boolean;
  valid_from: string;
  valid_to: string | null;
}
interface AttribCtx {
  reported: string;
  effective: string | null;
  policyKey: string;
  resolution: string;
  snapshot: unknown;
}

function redact(message: unknown): string {
  const text = String(message);
  return TOKEN ? text.replaceAll(TOKEN, "[REDACTED]") : text;
}

// ---------------------------------------------------------------------
// (7) fetch com Authorization header  token NUNCA na URL/log
// ---------------------------------------------------------------------
async function graphGet(
  path: string,
  params: Record<string, string>,
  attempt = 0,
): Promise<any> {
  const qs = new URLSearchParams(params).toString(); // SEM access_token aqui
  const url = `${GRAPH}/${path}?${qs}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (r.status === 429 || r.status >= 500) {
    if (attempt >= 4) {
      throw new Error(`Graph ${r.status} aps retries em ${path}`); // sem token no texto
    }
    await new Promise((res) =>
      setTimeout(res, Math.min(60000, 1000 * 2 ** attempt))
    );
    return graphGet(path, params, attempt + 1);
  }
  const body = await r.json();
  if (!r.ok) {
    const msg = redact(body?.error?.message ?? "erro");
    throw new Error(`Graph ${r.status} em ${path}: ${msg.slice(0, 200)}`);
  }
  return body;
}

// (9) paginao por CURSOR (after)  atmica: se estourar retries, lana e o run falha
async function fetchAllPagesCursor(
  path: string,
  params: Record<string, string>,
): Promise<{ rows: any[]; pages: number }> {
  const rows: any[] = [];
  let pages = 0;
  let after: string | undefined;
  let guard = 0;
  while (guard++ < 500) {
    const p = {
      ...params,
      limit: String(PAGE_LIMIT),
      ...(after ? { after } : {}),
    };
    const body = await graphGet(path, p); // token via header; cursor via param
    if (body.data) rows.push(...body.data);
    pages++;
    after = body.paging?.cursors?.after;
    if (!body.paging?.next || !after) break;
  }
  if (after) throw new Error(`Graph pagination guard exceeded for ${path}`);
  return { rows, pages };
}

function dateChunks(since: string, until: string, days = CHUNK_DAYS) {
  const out: Array<{ since: string; until: string }> = [];
  let s = new Date(since + "T00:00:00Z");
  const end = new Date(until + "T00:00:00Z");
  while (s <= end) {
    const e = new Date(s);
    e.setUTCDate(e.getUTCDate() + days - 1);
    if (e > end) e.setTime(end.getTime());
    out.push({
      since: s.toISOString().slice(0, 10),
      until: e.toISOString().slice(0, 10),
    });
    s = new Date(e);
    s.setUTCDate(s.getUTCDate() + 1);
  }
  return out;
}

// ---------------------------------------------------------------------
// (4) event_map versionado: lista de verses por (source|event); resolve por data
// ---------------------------------------------------------------------
async function loadEventMap(): Promise<Map<string, EventMapRow[]>> {
  const { data, error } = await sb.from("event_map")
    .select(
      "source,source_event_name,canonical_event,alias_group,is_primary_measure,valid_from,valid_to",
    );
  if (error) throw new Error(`event_map: ${error.message}`);
  const m = new Map<string, EventMapRow[]>();
  for (const r of (data ?? []) as EventMapRow[]) {
    const k = `${r.source}|${r.source_event_name}`;
    (m.get(k) ?? m.set(k, []).get(k)!).push(r);
  }
  return m;
}
function resolveMap(
  map: Map<string, EventMapRow[]>,
  source: string,
  name: string,
  businessDate: string,
): EventMapRow | null {
  const versions = map.get(`${source}|${name}`) ?? [];
  const hits = versions.filter((v) =>
    businessDate >= v.valid_from && (!v.valid_to || businessDate <= v.valid_to)
  );
  if (hits.length === 0) return null;
  if (hits.length > 1) { // sobreposio no deveria existir (EXCLUDE no DB)
    console.warn(`event_map OVERLAP em ${source}|${name} @ ${businessDate}`);
    hits.sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1)); // determinstico: vigncia mais recente
  }
  return hits[0];
}
// eventos esperados (certificados/vigentes) por source  base p/ gerar not_available
function expectedEvents(
  map: Map<string, EventMapRow[]>,
  source: string,
  businessDate: string,
): string[] {
  const out: string[] = [];
  for (const [k, versions] of map) {
    if (!k.startsWith(source + "|")) continue;
    if (
      versions.some((v) =>
        businessDate >= v.valid_from &&
        (!v.valid_to || businessDate <= v.valid_to)
      )
    ) {
      out.push(k.split("|").slice(1).join("|"));
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// (6) attribution_spec por gro
// ---------------------------------------------------------------------
function specToPolicy(spec: any): string | null {
  if (!Array.isArray(spec) || !spec.length) return null;
  const policies = spec.map((item: any) => {
    if (item.event_type === "CLICK_THROUGH") {
      return `${item.window_days}d_click`;
    }
    if (item.event_type === "VIEW_THROUGH") return `${item.window_days}d_view`;
    return null;
  }).filter(Boolean).sort();
  return policies.length ? policies.join("+") : null;
}
async function attribForAdset(adsetId: string): Promise<AttribCtx> {
  const body = await graphGet(adsetId, { fields: "attribution_spec" });
  const eff = specToPolicy(body?.attribution_spec);
  return {
    reported: "default",
    effective: eff,
    policyKey: eff ?? "unknown",
    resolution: "adset.attribution_spec",
    snapshot: body?.attribution_spec ?? null,
  };
}
async function attribForCampaign(campaignId: string): Promise<AttribCtx> {
  const { rows } = await fetchAllPagesCursor(`${campaignId}/adsets`, {
    fields: "id,attribution_spec",
  });
  const policies = new Set<string | null>();
  const snaps: any[] = [];
  for (const a of rows) {
    policies.add(specToPolicy(a?.attribution_spec));
    snaps.push(a?.attribution_spec ?? null);
  }
  if (policies.size === 1) {
    const only = [...policies][0];
    return {
      reported: "default",
      effective: only,
      policyKey: only ?? "unknown",
      resolution: "campaign.adsets(uniform)",
      snapshot: snaps,
    };
  }
  // (6) polticas divergentes -> 'mixed', effective nula (nunca inventar janela nica)
  return {
    reported: "default",
    effective: null,
    policyKey: "mixed",
    resolution: "campaign.adsets(mixed)",
    snapshot: snaps,
  };
}

// ---------------------------------------------------------------------
// normalizao
// ---------------------------------------------------------------------
function baseCols(row: any, grain: Grain, runId: string, dataAsOf: string) {
  const entity_id = grain === "campaign"
    ? row.campaign_id
    : grain === "adset"
    ? row.adset_id
    : row.ad_id;
  return {
    collector_run_id: runId,
    business_date: row.date_start,
    data_as_of: dataAsOf,
    channel: "meta",
    account_id: ACCT.replace("act_", ""),
    grain_level: grain,
    grain_role: grain === "ad" ? "fact" : "reconciliation",
    entity_id,
    campaign_id: row.campaign_id ?? null,
    campaign_name: row.campaign_name ?? null,
    adset_id: row.adset_id ?? null,
    adset_name: row.adset_name ?? null,
    ad_id: row.ad_id ?? null,
    ad_name: row.ad_name ?? null,
    entity_spend: row.spend == null ? null : Number(row.spend),
  };
}

// (2) actions[]: eventos esperados x janelas -> ausncia = not_available; + desconhecidos brutos
function normalizeActions(
  row: any,
  grain: Grain,
  map: Map<string, EventMapRow[]>,
  runId: string,
  dataAsOf: string,
): any[] {
  const rows: any[] = [];
  const bd = row.date_start;
  const base = baseCols(row, grain, runId, dataAsOf);
  const present = new Map<string, any>();
  for (const a of (row.actions ?? [])) present.set(a.action_type, a);
  const expected = expectedEvents(map, "meta_attributed", bd);
  const names = new Set<string>([...expected, ...present.keys()]); // unio: esperados + desconhecidos observados
  for (const name of names) {
    const a = present.get(name);
    const em = resolveMap(map, "meta_attributed", name, bd);
    for (const win of CERT_WINDOWS) {
      const raw = a ? a[win] : undefined;
      let status: string;
      let value: number | null;
      if (a == null) {
        status = "not_available";
        value = null;
      } // esperado, ausente na entrega
      else if (raw == null) {
        status = "not_available";
        value = null;
      } // presente o evento, ausente a janela
      else {
        value = Number(raw);
        status = value === 0 ? "explicit_zero" : "available";
      }
      rows.push({
        ...base,
        source: "meta_attributed",
        metric_kind: "action",
        source_event_name: name,
        raw_indicator: null,
        canonical_event: em?.canonical_event ?? null, // desconhecido -> null (bruto)
        reported_attribution_window: win,
        effective_attribution_window: win,
        attribution_policy_key: win,
        attribution_resolution_source: "actions_attribution_window",
        attribution_spec_snapshot: null,
        value,
        cost_per_result: null,
        observation_status: status,
      });
    }
  }
  return rows;
}

// (2)+(3) results: expected meta_results + indicators observados; nunca assume StartTrial
function normalizeResults(
  row: any,
  grain: Grain,
  map: Map<string, EventMapRow[]>,
  runId: string,
  dataAsOf: string,
  attr: AttribCtx,
): any[] {
  const rows: any[] = [];
  const bd = row.date_start;
  const base = baseCols(row, grain, runId, dataAsOf);
  const cpr = new Map<string, number>();
  for (const c of (row.cost_per_result ?? [])) {
    const v = c?.values?.[0]?.value;
    if (c?.indicator && v != null) cpr.set(c.indicator, Number(v));
  }
  const present = new Map<string, any>();
  for (const res of (row.results ?? [])) present.set(res.indicator, res);
  const expected = expectedEvents(map, "meta_results", bd);
  const names = new Set<string>([...expected, ...present.keys()]);
  for (const ind of names) {
    const res = present.get(ind);
    const v = res?.values?.[0]?.value;
    const reported = res?.values?.[0]?.attribution_windows?.[0] ?? "default";
    const em = resolveMap(map, "meta_results", ind, bd);
    let status: string;
    let value: number | null;
    if (res == null) {
      status = "not_available";
      value = null;
    } else if (v == null || Number.isNaN(Number(v))) {
      status = "not_available";
      value = null;
    } else {
      value = Number(v);
      status = value === 0 ? "explicit_zero" : "available";
    }
    rows.push({
      ...base,
      source: "meta_results",
      metric_kind: "result",
      source_event_name: ind,
      raw_indicator: ind,
      canonical_event: em?.canonical_event ?? null, // indicator desconhecido -> null
      reported_attribution_window: reported, // 'default' no payload
      effective_attribution_window: attr.effective, // '7d_click' ou 'mixed'/null
      attribution_policy_key: attr.policyKey, // NO nula (na chave)
      attribution_resolution_source: attr.resolution,
      attribution_spec_snapshot: attr.snapshot,
      value,
      cost_per_result: cpr.get(ind) ?? null,
      observation_status: status,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------
// (8) reconciliao: tolerncia = max(R$0,05 ; 0,5%). warning vs critical.
// ---------------------------------------------------------------------
function tol(ref: number) {
  return Math.max(0.05, Math.abs(ref) * 0.005);
}
function reconcile(
  allRows: any[],
  map: Map<string, EventMapRow[]>,
): { warnings: string[]; critical: string[] } {
  const warnings: string[] = [];
  const critical: string[] = [];
  const key = (r: any) =>
    `${r.business_date}|${r.campaign_id}|${r.source}|${r.source_event_name}|${r.reported_attribution_window}|${r.attribution_policy_key}`;
  const agg: Record<string, { ad: number; adset: number; camp: number }> = {};
  for (const r of allRows) {
    if (r.value == null) continue;
    const mapped = resolveMap(
      map,
      r.source,
      r.source_event_name,
      r.business_date,
    );
    if (!mapped?.is_primary_measure) continue;
    const k = key(r);
    agg[k] ??= { ad: 0, adset: 0, camp: 0 };
    if (r.grain_level === "ad") agg[k].ad += r.value;
    else if (r.grain_level === "adset") agg[k].adset += r.value;
    else agg[k].camp += r.value;
  }
  for (const [k, a] of Object.entries(agg)) {
    if (Math.abs(a.ad - a.camp) > tol(a.camp)) {
      critical.push(`ad_sum(${a.ad}) != campaign(${a.camp}) @ ${k}`);
    }
    if (Math.abs(a.adset - a.camp) > tol(a.camp)) {
      warnings.push(`adset(${a.adset}) != campaign(${a.camp}) @ ${k}`);
    }
  }
  for (const r of allRows) {
    if (
      r.metric_kind !== "result" || r.value == null || r.value <= 0 ||
      r.entity_spend == null || r.cost_per_result == null
    ) continue;
    const calculated = r.entity_spend / r.value;
    if (Math.abs(calculated - r.cost_per_result) > tol(r.cost_per_result)) {
      warnings.push(
        `cost_per_result(${r.cost_per_result}) != spend/result(${
          calculated.toFixed(4)
        }) @ ${key(r)}`,
      );
    }
  }
  return { warnings, critical };
}

// ---------------------------------------------------------------------
// upsert idempotente pela chave natural (inclui attribution_policy_key)
// ---------------------------------------------------------------------
async function upsert(rows: any[]) {
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await sb.from("paid_media_actions").upsert(batch, {
      onConflict:
        "collector_run_id,channel,account_id,source,grain_level,entity_id,source_event_name,reported_attribution_window,attribution_policy_key,business_date,data_as_of",
    });
    if (error) throw new Error(`paid_media_actions upsert: ${error.message}`);
    else written += batch.length;
  }
  return { written };
}

function fieldsFor(grain: Grain): string {
  const base =
    "date_start,date_stop,results,cost_per_result,spend,impressions,inline_link_clicks,mobile_app_install,actions,objective";
  if (grain === "campaign") return "campaign_id,campaign_name," + base; // NO usar result_values (erro #100)
  if (grain === "adset") {
    return "campaign_id,campaign_name,adset_id,adset_name," + base;
  }
  return "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name," + base;
}

// ---------------------------------------------------------------------
// (1) run lifecycle + orquestrao
// ---------------------------------------------------------------------
export async function collectMetaEvents(
  opts: {
    mode: "daily" | "backfill";
    since: string;
    until: string;
    campaignId: string;
  },
) {
  if (!ENABLED) {
    console.log("COLLECT_META_EVENTS_ENABLED=false -> no-op");
    return { skipped: true };
  }
  if (!TOKEN || !ACCT) {
    throw new Error("META_ACCESS_TOKEN/META_AD_ACCOUNT_ID ausentes");
  }
  const dataAsOf = new Date().toISOString().slice(0, 10);

  // cria run pending (source engloba os dois writers meta; registramos 'meta_attributed' como principal)
  const { data: run, error: runErr } = await sb.from(
    "paid_media_collection_runs",
  ).insert({
    source: "meta",
    mode: opts.mode,
    status: "pending",
    campaign_id: opts.campaignId,
    since_date: opts.since,
    until_date: opts.until,
    data_as_of: dataAsOf,
  }).select().single();
  if (runErr || !run) throw new Error(`no criou run: ${runErr?.message}`);
  const runId = run.id as string;

  try {
    const map = await loadEventMap();
    let received = 0, written = 0, pages = 0;
    const collected: any[] = [];

    for (const ch of dateChunks(opts.since, opts.until)) {
      for (const grain of ["campaign", "adset", "ad"] as Grain[]) {
        // (9) atmico por recorte/gro: qualquer falha de pgina aps retries lana e cai no catch
        const { rows: raw, pages: pg } = await fetchAllPagesCursor(
          `${ACCT}/insights`,
          {
            level: grain,
            fields: fieldsFor(grain),
            time_range: JSON.stringify({ since: ch.since, until: ch.until }),
            time_increment: "1",
            action_attribution_windows: CERT_WINDOWS.join(","),
            filtering: JSON.stringify([{
              field: "campaign.id",
              operator: "IN",
              value: [opts.campaignId],
            }]),
          },
        );
        received += raw.length;
        pages += pg;

        const attrCache = new Map<string, AttribCtx>();
        const rows: any[] = [];
        for (const row of raw) {
          rows.push(...normalizeActions(row, grain, map, runId, dataAsOf));
          // (6) attribution por gro
          let ck: string;
          let getter: () => Promise<AttribCtx>;
          if (grain === "ad" || grain === "adset") {
            ck = row.adset_id;
            getter = () => attribForAdset(row.adset_id);
          } else {
            ck = `camp:${row.campaign_id}`;
            getter = () => attribForCampaign(row.campaign_id);
          }
          if (!attrCache.has(ck)) attrCache.set(ck, await getter());
          rows.push(
            ...normalizeResults(
              row,
              grain,
              map,
              runId,
              dataAsOf,
              attrCache.get(ck)!,
            ),
          );
        }
        const res = await upsert(rows);
        written += res.written;
        collected.push(...rows);
      }
    }

    // (8) reconciliao
    const rc = reconcile(collected, map);
    if (rc.critical.length) {
      throw new Error(
        `reconciliao crtica: ${rc.critical.slice(0, 3).join(" | ")}`,
      );
    }

    const { error: completeErr } = await sb.from("paid_media_collection_runs")
      .update({
        status: "complete",
        finished_at: new Date().toISOString(),
        rows_received: received,
        rows_written: written,
        rows_rejected: 0,
        pages_received: pages,
        metadata: { reconc_warnings: rc.warnings.slice(0, 50) },
      }).eq("id", runId);
    if (completeErr) throw new Error(`run completion: ${completeErr.message}`);
    return {
      runId,
      status: "complete",
      received,
      written,
      rejected: 0,
      pages,
      warnings: rc.warnings.length,
    };
  } catch (e) {
    // (1)+(9) falha no recuperada -> run failed -> suas linhas NO aparecem nas views
    const message = redact((e as Error).message).slice(0, 500);
    const { error: failedErr } = await sb.from("paid_media_collection_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_summary: message,
      }).eq("id", runId);
    if (failedErr) console.error("failed to finalize collection run");
    throw e;
  }
}

// ---------------------------------------------------------------------
// (10) endpoint governado  sem fallback histrico; JWT em produo (verify_jwt=true)
// ---------------------------------------------------------------------
function lastClosedDay(): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const b = await req.json().catch(() => ({}));
  const mode = b.mode;
  if (mode !== "daily" && mode !== "backfill") {
    return json({ error: "mode deve ser 'daily' ou 'backfill'" }, 400);
  }

  let since: string, until: string, campaignId: string = b.campaign_id;
  if (mode === "daily") {
    until = lastClosedDay();
    since = new Date(new Date(until + "T00:00:00Z").getTime() - 27 * 864e5)
      .toISOString().slice(0, 10); // reprocessa 28d fechados
    if (!campaignId && GOVERNED_CAMPAIGNS.size === 1) {
      campaignId = [...GOVERNED_CAMPAIGNS][0];
    }
    if (!campaignId) {
      return json({
        error: "campaign_id obrigatrio (sem rotina diria governada)",
      }, 400);
    }
  } else {
    if (!b.since || !b.until || !campaignId) {
      return json({ error: "backfill exige since, until e campaign_id" }, 400);
    }
    since = b.since;
    until = b.until;
    if (until > lastClosedDay()) {
      return json({ error: "perodo futuro/aberto no permitido" }, 400);
    }
    if (since > until) return json({ error: "perodo invertido" }, 400);
    const days = (Date.parse(until) - Date.parse(since)) / 864e5 + 1;
    if (days > MAX_MANUAL_DAYS) {
      return json(
        { error: `perodo > ${MAX_MANUAL_DAYS} dias no permitido` },
        400,
      );
    }
  }
  if (GOVERNED_CAMPAIGNS.size === 0 || !GOVERNED_CAMPAIGNS.has(campaignId)) {
    return json({ error: "campaign_id fora da allowlist governada" }, 403);
  }
  try {
    return json(await collectMetaEvents({ mode, since, until, campaignId }));
  } catch (e) {
    const message = redact((e as Error).message);
    return json({ error: message }, 500);
  }
});
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });
}
