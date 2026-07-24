// Report Live v1.0 runtime
// Supabase (source + manifest) -> Google Sheets (snapshot + tidy views)
// -> Google Slides (one live deck, linked charts + governed narrative).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildReport,
  previousEquivalentPeriod,
  toIsoDay,
  type Row,
  type SlideContract,
  type SourceManifest,
} from "./report-live-engine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const LEGACY_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SECRET_KEYS_RAW = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
const SHEET_ID = Deno.env.get("REPORT_SHEET_ID") ?? "";
const SLIDES_ID = Deno.env.get("REPORT_SLIDES_ID") ?? "";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SA_RAW = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "";
const SNAPSHOT_START = Deno.env.get("REPORT_SNAPSHOT_START") ?? "2026-01-01";

function adminKey(): string {
  if (LEGACY_SERVICE_KEY) return LEGACY_SERVICE_KEY;
  try {
    return JSON.parse(SECRET_KEYS_RAW).default ?? "";
  } catch (_) {
    return "";
  }
}

const SERVICE_KEY = adminKey();
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buffer = new Uint8Array(bin.length);
  for (let index = 0; index < bin.length; index += 1) buffer[index] = bin.charCodeAt(index);
  return buffer.buffer;
}

const b64url = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlBytes = (bytes: Uint8Array) => {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return b64url(value);
};

let tokenCache: { token: string; exp: number } | null = null;

async function googleToken(): Promise<string> {
  if (tokenCache && Date.now() / 1000 < tokenCache.exp - 60) return tokenCache.token;
  const serviceAccount = JSON.parse(SA_RAW);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/drive",
    ].join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(input),
  );
  const jwt = `${input}.${b64urlBytes(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const result = await response.json();
  if (!result.access_token) {
    throw new Error(`Google auth falhou: ${JSON.stringify(result).slice(0, 300)}`);
  }
  tokenCache = { token: result.access_token, exp: now + 3500 };
  return result.access_token;
}

async function googleFetch(url: string, init?: RequestInit): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = await googleToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) return result;
    if (response.status === 429 && attempt < 4) {
      const delay = 2_000 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(`Google API ${response.status}: ${JSON.stringify(result).slice(0, 500)}`);
  }
  throw new Error("Google API excedeu o número máximo de retentativas.");
}

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const SLIDES = "https://slides.googleapis.com/v1/presentations";

const PDF_BUCKET = "report-live";
const PDF_SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 dias

/**
 * Exporta o deck vivo como PDF (Drive export) e guarda no Storage.
 *
 * Serve ao QA visual: o contrato analítico é verificável por `report_slide_runs`,
 * mas clipping, série vazia e truncamento só aparecem no render. Sem isto o QA
 * depende de alguém baixar o PDF manualmente a cada execução.
 *
 * Nunca derruba o run: exportar é observabilidade, não publicação. Falha aqui
 * retorna { ok: false } e o run permanece válido.
 */
async function exportDeckPdf(runId: string): Promise<Row> {
  try {
    const token = await googleToken();
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${SLIDES_ID}/export?mimeType=application/pdf`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      throw new Error(`Drive export ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) throw new Error("Drive export retornou 0 bytes.");

    const path = `report-live/${runId}.pdf`;
    const { error: uploadError } = await admin.storage
      .from(PDF_BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`storage upload: ${uploadError.message}`);

    const { data: signed } = await admin.storage
      .from(PDF_BUCKET)
      .createSignedUrl(path, PDF_SIGNED_URL_TTL);

    await admin.from("report_runs").update({ pdf_path: path }).eq("id", runId);
    return { ok: true, path, bytes: bytes.byteLength, signed_url: signed?.signedUrl ?? null };
  } catch (error) {
    console.error("exportDeckPdf falhou", error);
    return { ok: false, error: String((error as Error).message).slice(0, 400) };
  }
}

async function setStatus(runId: string, status: string, patch: Row = {}) {
  const { error } = await admin.from("report_runs").update({ status, ...patch }).eq("id", runId);
  if (error) throw new Error(`report_runs: ${error.message}`);
}

async function pagedSelect(
  table: string,
  select: string,
  options: {
    dateColumn?: string;
    from?: string;
    to?: string;
    orderColumn?: string;
    limit?: number;
  } = {},
): Promise<Row[]> {
  const output: Row[] = [];
  const pageSize = 1000;
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  for (let offset = 0; offset < limit; offset += pageSize) {
    let query = admin.from(table).select(select);
    if (options.dateColumn && options.from) query = query.gte(options.dateColumn, options.from);
    if (options.dateColumn && options.to) query = query.lte(options.dateColumn, options.to);
    if (options.orderColumn) query = query.order(options.orderColumn, { ascending: true });
    query = query.range(offset, Math.min(offset + pageSize - 1, limit - 1));
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    output.push(...((data ?? []) as Row[]));
    if (!data || data.length < pageSize) break;
  }
  return output;
}

async function loadConfig(): Promise<Record<string, unknown>> {
  const { data, error } = await admin.from("report_live_config").select("key,value");
  if (error) throw new Error(`report_live_config: ${error.message}`);
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
}

async function loadManifest(periodStart: string, periodEnd: string): Promise<SourceManifest> {
  const { data, error } = await admin.rpc("report_live_source_manifest", {
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error) throw new Error(`report_live_source_manifest: ${error.message}`);
  if (!data) throw new Error("Manifesto do Report Live não retornou dados.");
  return data as SourceManifest;
}

async function loadInputs(runId: string, profile: string, periodStart: string, periodEnd: string) {
  const previous = previousEquivalentPeriod(periodStart, periodEnd);
  const queryStart = SNAPSHOT_START < previous.start ? SNAPSHOT_START : previous.start;
  const [
    manifest,
    config,
    crm,
    media,
    mediaActions,
    b2c,
    goals,
    budgets,
    targets,
    collectionRuns,
    collectionLogs,
    experiments,
    insurance,
    communicationSlots,
    communicationTemplates,
    slideContracts,
    aliases,
    actionOutcomes,
    metricCertifications,
  ] = await Promise.all([
    loadManifest(periodStart, periodEnd),
    loadConfig(),
    pagedSelect("activities", "*", {
      dateColumn: "Data de Disparo",
      from: queryStart,
      to: `${periodEnd}T23:59:59`,
      orderColumn: "Data de Disparo",
    }),
    pagedSelect("paid_media_metrics", "*", {
      dateColumn: "date",
      from: queryStart,
      to: periodEnd,
      orderColumn: "date",
    }),
    pagedSelect("paid_media_actions", "*", {
      dateColumn: "business_date",
      from: queryStart,
      to: periodEnd,
      orderColumn: "business_date",
    }),
    pagedSelect("b2c_daily_metrics", "*", {
      dateColumn: "data",
      from: queryStart,
      to: periodEnd,
      orderColumn: "data",
    }),
    pagedSelect("goals", "*", { orderColumn: "ano" }),
    pagedSelect("paid_media_budgets", "*", { orderColumn: "month" }),
    pagedSelect("paid_media_targets", "*", { orderColumn: "month" }),
    pagedSelect("paid_media_collection_runs", "*", { orderColumn: "started_at", limit: 500 }),
    pagedSelect("collection_execution_logs", "*", { orderColumn: "executed_at", limit: 500 }),
    pagedSelect("experiments", "*", { orderColumn: "created_at" }),
    pagedSelect("rentabilizacao_activities", "*", {
      dateColumn: "Data de Disparo",
      from: queryStart,
      to: `${periodEnd}T23:59:59`,
      orderColumn: "Data de Disparo",
    }),
    pagedSelect("communication_slots", "*", { orderColumn: "created_at" }),
    pagedSelect("communication_templates", "*", { orderColumn: "created_at" }),
    pagedSelect("report_slide_contracts", "*", { orderColumn: "display_order" }),
    pagedSelect("paid_media_campaign_aliases", "*", { orderColumn: "platform" }),
    pagedSelect("report_action_outcomes", "*", { orderColumn: "created_at" }),
    pagedSelect("report_metric_certifications", "*", { orderColumn: "period_key" }),
  ]);

  return {
    runId,
    profile,
    periodStart,
    periodEnd,
    manifest,
    config,
    crm,
    media,
    mediaActions,
    b2c,
    goals,
    budgets,
    targets,
    collectionRuns,
    collectionLogs,
    experiments,
    insurance,
    communicationSlots,
    communicationTemplates,
    slideContracts: (slideContracts as unknown as SlideContract[]).map((contract) => ({
      ...contract,
      required_fields: Array.isArray(contract.required_fields) ? contract.required_fields : [],
      optional_fields: Array.isArray(contract.optional_fields) ? contract.optional_fields : [],
    })),
    aliases,
    actionCandidates: [],
    actionOutcomes,
    metricCertifications,
  };
}

const PRIVATE_FIELDS = new Set(["user_id", "owner_id", "created_by", "certified_by", "reviewed_by"]);

function safeCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rawTable(rows: Row[]): unknown[][] {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    .filter((field) => !PRIVATE_FIELDS.has(field))
    .sort();
  return [
    headers,
    ...rows.map((row) => headers.map((header) => safeCell(row[header]))),
  ];
}

async function ensureTabs(titles: string[]) {
  const metadata = await googleFetch(`${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title))`);
  const existing = new Map<string, number>();
  for (const sheet of metadata.sheets ?? []) {
    existing.set(sheet.properties.title, sheet.properties.sheetId);
  }
  const requests = titles
    .filter((title) => !existing.has(title))
    .map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { rowCount: 2000, columnCount: 40, frozenRowCount: 1 },
        },
      },
    }));
  if (requests.length) {
    await googleFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }
}

async function ensureTabCapacity(tables: Record<string, unknown[][]>) {
  const metadata = await googleFetch(
    `${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))`,
  );
  const requests: Row[] = [];
  for (const sheet of metadata.sheets ?? []) {
    const title = String(sheet.properties.title ?? "");
    const values = tables[title];
    if (!values) continue;
    const rowCount = Number(sheet.properties.gridProperties?.rowCount ?? 0);
    const columnCount = Number(sheet.properties.gridProperties?.columnCount ?? 0);
    const requiredRows = Math.max(100, values.length + 10);
    const requiredColumns = Math.max(
      10,
      values.reduce((maximum, row) => Math.max(maximum, row.length), 0) + 2,
    );
    if (requiredRows > rowCount) {
      requests.push({
        appendDimension: {
          sheetId: sheet.properties.sheetId,
          dimension: "ROWS",
          length: requiredRows - rowCount,
        },
      });
    }
    if (requiredColumns > columnCount) {
      requests.push({
        appendDimension: {
          sheetId: sheet.properties.sheetId,
          dimension: "COLUMNS",
          length: requiredColumns - columnCount,
        },
      });
    }
  }
  if (requests.length) {
    await googleFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }
}

async function writeTables(tables: Record<string, unknown[][]>) {
  await googleFetch(`${SHEETS}/${SHEET_ID}/values:batchClear`, {
    method: "POST",
    body: JSON.stringify({ ranges: Object.keys(tables).map((tab) => `${tab}!A:ZZ`) }),
  });
  const entries: Array<{ range: string; majorDimension: "ROWS"; values: unknown[][] }> = [];
  for (const [tab, values] of Object.entries(tables)) {
    const chunkSize = 1000;
    for (let index = 0; index < values.length; index += chunkSize) {
      entries.push({
        range: `${tab}!A${index + 1}`,
        majorDimension: "ROWS",
        values: values.slice(index, index + chunkSize),
      });
    }
  }
  let batch: typeof entries = [];
  let estimatedBytes = 0;
  const flush = async () => {
    if (!batch.length) return;
    await googleFetch(`${SHEETS}/${SHEET_ID}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "RAW", data: batch }),
    });
    batch = [];
    estimatedBytes = 0;
  };
  for (const entry of entries) {
    const entryBytes = JSON.stringify(entry).length;
    if (batch.length && (estimatedBytes + entryBytes > 3_500_000 || batch.length >= 30)) {
      await flush();
    }
    batch.push(entry);
    estimatedBytes += entryBytes;
  }
  await flush();
}

async function writeSnapshot(input: Awaited<ReturnType<typeof loadInputs>>, built: ReturnType<typeof buildReport>) {
  const rawTabs: Record<string, unknown[][]> = {
    DB_CRM_V1: rawTable(input.crm),
    DB_MIDIA_V1: rawTable(input.media),
    DB_MEDIA_ACTIONS_V1: rawTable(input.mediaActions),
    DB_B2C_V1: rawTable(input.b2c),
    DB_GOALS_V1: rawTable(input.goals),
    DB_BUDGETS_V1: rawTable(input.budgets),
    DB_TARGETS_V1: rawTable(input.targets),
    DB_COLLECTION_RUNS_V1: rawTable(input.collectionRuns),
    DB_COLLECTION_LOGS_V1: rawTable(input.collectionLogs),
    DB_EXPERIMENTS_V1: rawTable(input.experiments),
    DB_INSURANCE_V1: rawTable(input.insurance),
    DB_COMM_SLOTS_V1: rawTable(input.communicationSlots),
    DB_COMM_TEMPLATES_V1: rawTable(input.communicationTemplates),
    DB_METRIC_CERTIFICATIONS_V1: rawTable(input.metricCertifications),
  };
  const reportProfile: unknown[][] = [
    ["field", "value"],
    ["spec_version", "1.0"],
    ["report_profile", input.profile],
    ["period_start", input.periodStart],
    ["period_end", input.periodEnd],
    ["previous_equivalent_start", built.previousPeriod.start],
    ["previous_equivalent_end", built.previousPeriod.end],
    ["data_reading_integrated", input.manifest.data_reading_integrated ?? ""],
    ["quality_status", input.manifest.quality_status],
  ];
  const allTabs = {
    REPORT_PROFILE_V1: reportProfile,
    ...rawTabs,
    ...built.tabs,
  };
  await ensureTabs(Object.keys(allTabs));
  await ensureTabCapacity(allTabs);
  await writeTables(allTabs);
  return Object.values(allTabs).reduce((total, rows) => total + Math.max(0, rows.length - 1), 0);
}

async function saveGeneratedState(
  runId: string,
  profile: string,
  manifest: SourceManifest,
  built: ReturnType<typeof buildReport>,
) {
  if (built.actionCandidates.length) {
    const rows = built.actionCandidates.map((candidate) => ({
      run_id: runId,
      source_view: candidate.source_view,
      entity_key: candidate.entity_key,
      signal_code: candidate.signal_code,
      domain: candidate.domain,
      partner: candidate.partner ?? null,
      bucket: candidate.bucket,
      signal: candidate.signal,
      impact: candidate.impact ?? null,
      probable_cause: candidate.probable_cause ?? null,
      evidence_refs: candidate.evidence_refs ?? [],
      reading_limit: candidate.reading_limit ?? null,
      action_text: candidate.action_text ?? null,
      owner: candidate.owner ?? null,
      due_date: candidate.due_date ?? null,
      success_metric: candidate.success_metric ?? null,
      confidence_status: candidate.confidence_status,
      generated_by: candidate.generated_by,
      review_status: candidate.review_status,
      status: candidate.status,
    }));
    const { error } = await admin
      .from("report_action_candidates")
      .upsert(rows, { onConflict: "run_id,entity_key,signal_code" });
    if (error) throw new Error(`report_action_candidates: ${error.message}`);
  }

  const { error: deleteError } = await admin.from("report_slide_runs").delete().eq("run_id", runId);
  if (deleteError) throw new Error(`report_slide_runs delete: ${deleteError.message}`);
  if (built.slides.length) {
    const { error } = await admin.from("report_slide_runs").insert(built.slides);
    if (error) throw new Error(`report_slide_runs insert: ${error.message}`);
  }

  const slideCounts = built.slides.reduce<Record<string, number>>((counts, slide) => {
    counts[slide.run_eligibility] = (counts[slide.run_eligibility] ?? 0) + 1;
    return counts;
  }, {});
  await setStatus(runId, "writing_sheets", {
    report_profile: profile,
    spec_version: "1.0",
    data_reading_integrated: manifest.data_reading_integrated,
    source_cutoffs: manifest.source_cutoffs,
    gap_closure_days: manifest.gap_closure_days,
    quality_status: manifest.quality_status,
    run_manifest: manifest,
    slide_counts: slideCounts,
    publication_valid: false,
  });
}

async function setupStructure(runId: string) {
  if (!LEGACY_SERVICE_KEY) {
    return { ok: false, skipped: true, reason: "legacy_service_key_unavailable" };
  }
  const response = await fetch(`${SUPABASE_URL}/functions/v1/report-sync-v4-setup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LEGACY_SERVICE_KEY}`,
      apikey: LEGACY_SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "setup_v1", run_id: runId }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(`report-sync-v4-setup: ${JSON.stringify(result).slice(0, 500)}`);
  }
  return result;
}

async function readBriefing(): Promise<string> {
  try {
    const response = await googleFetch(
      `${SHEETS}/${SHEET_ID}/values/${encodeURIComponent("BRIEFING!A1:B400")}`,
    );
    return (response.values ?? [])
      .map((row: string[]) => row.join(" "))
      .join("\n")
      .slice(0, 24_000);
  } catch (_) {
    return "";
  }
}

async function gemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 8192 },
      }),
    },
  );
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: Row) => part.text ?? "")
    .join("") ?? "";
  if (!text) throw new Error(`Gemini sem resposta: ${JSON.stringify(result).slice(0, 300)}`);
  return text;
}

function parseJsonLoose(value: string): Row {
  const cleaned = value.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("LLM não retornou JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateNarrative(
  runId: string,
  profile: string,
  manifest: SourceManifest,
  built: ReturnType<typeof buildReport>,
): Promise<Record<string, string>> {
  const briefing = await readBriefing();
  const evidence = {
    run_id: runId,
    profile,
    manifest,
    scorecard: built.tabs.VIEW_SCORECARD_INTEGRATED?.slice(0, 12),
    partner_router: built.tabs.VIEW_PARTNER_ROUTER?.slice(0, 15),
    action_queue: built.tabs.VIEW_ACTION_QUEUE?.slice(0, 12),
  };
  const response = await gemini(
    `Você redige o Report Live Afinz/GaaS. Números são imutáveis e vêm apenas da evidência.
BRIEFING:
${briefing}
EVIDÊNCIA:
${JSON.stringify(evidence)}
Retorne JSON no formato {"c1":"...","c2":"...","c3":"...","c4":"...","c5":"...","c6":"...","c7":"...","c8":"..."}.
Use Sinal -> Impacto -> Causa provável -> Evidência -> Ação -> Confiança.
Não chame CPA de CAC. Não invente meta. Explique limites de cutoff e missing. Somente JSON.`,
  );
  const parsed = parseJsonLoose(response);
  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value)]),
  );
}

async function updateSlides(texts: Record<string, string>) {
  const presentation = await googleFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(pageElements(objectId,title,sheetsChart,shape(text(textElements(textRun(content))))))`,
  );
  const chartIds: string[] = [];
  const shapeByPlaceholder: Record<string, string> = {};
  for (const slide of presentation.slides ?? []) {
    for (const element of slide.pageElements ?? []) {
      if (element.sheetsChart) {
        chartIds.push(element.objectId);
        continue;
      }
      const title = String(element.title ?? "");
      if (title.startsWith("ph:")) shapeByPlaceholder[title.slice(3)] = element.objectId;
    }
  }
  const requests: Row[] = [];
  for (const [placeholder, text] of Object.entries(texts)) {
    const objectId = shapeByPlaceholder[placeholder];
    if (!objectId) continue;
    requests.push({ deleteText: { objectId, textRange: { type: "ALL" } } });
    requests.push({ insertText: { objectId, insertionIndex: 0, text } });
  }
  for (const objectId of chartIds) {
    requests.push({ refreshSheetsChart: { objectId } });
  }
  if (requests.length) {
    await googleFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }
  return {
    placeholders_found: Object.keys(shapeByPlaceholder).length,
    placeholders_updated: Object.keys(texts).filter((key) => shapeByPlaceholder[key]).length,
    charts_refreshed: chartIds.length,
  };
}

function tableRows(table: unknown[][] | undefined): Row[] {
  if (!table?.length) return [];
  const headers = table[0].map((value) => String(value ?? ""));
  return table.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null]))
  );
}

function fmtNumber(value: unknown, digits = 0): string {
  const parsed = value === null || value === undefined || value === ""
    ? null
    : Number(value);
  if (parsed === null || !Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(parsed);
}

function fmtPercent(value: unknown): string {
  const parsed = value === null || value === undefined || value === ""
    ? null
    : Number(value);
  if (parsed === null || !Number.isFinite(parsed)) return "—";
  return `${fmtNumber(parsed * 100, 1)}%`;
}

function fmtCurrency(value: unknown): string {
  const parsed = value === null || value === undefined || value === ""
    ? null
    : Number(value);
  if (parsed === null || !Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(parsed);
}

function metricValue(rows: Row[], metric: string, field = "current"): unknown {
  return rows.find((row) => String(row.metric ?? "") === metric)?.[field] ?? null;
}

function deterministicNarrative(
  input: Awaited<ReturnType<typeof loadInputs>>,
  built: ReturnType<typeof buildReport>,
): Record<string, string> {
  const scorecard = tableRows(built.tabs.VIEW_SCORECARD_INTEGRATED);
  const coverage = tableRows(built.tabs.VIEW_COVERAGE_COMPARABILITY);
  const templates = tableRows(built.tabs.VIEW_TEMPLATE_COVERAGE);
  const router = tableRows(built.tabs.VIEW_PARTNER_ROUTER);
  const actionQueue = tableRows(built.tabs.VIEW_ACTION_QUEUE);
  const outcomes = tableRows(built.tabs.VIEW_ACTION_OUTCOMES);
  const mediaMix = tableRows(built.tabs.VIEW_MEDIA_MIX);
  const b2c = tableRows(built.tabs.VIEW_B2C_PARALLEL_FUNNELS);
  const fieldCoverage = tableRows(built.tabs.VIEW_FIELD_COVERAGE);
  const integratedCutoff = input.manifest.data_reading_integrated ?? "indisponível";
  const sourceCutoffs = input.manifest.source_cutoffs;
  const period = `${input.periodStart.split("-").reverse().join("/")}–${
    input.periodEnd.split("-").reverse().join("/")
  }`;
  const commonLimit = input.manifest.quality_status === "confirmed"
    ? "Leitura certificada para o recorte."
    : "Leitura direcional: respeitar os limites e cutoffs exibidos.";
  const narratives: Record<string, string> = {};

  for (const slide of built.slides) {
    if (slide.run_eligibility === "omitir_bloqueado") continue;
    const sourceRows = slide.source_view ? tableRows(built.tabs[slide.source_view]) : [];
    const prefix = "LEITURA DA DECISÃO\n\n";
    let body = "";

    switch (slide.slide_code) {
      case "C0":
        body = `Snapshot ${period}.\nCutoff integrado: ${integratedCutoff}.\n` +
          `CRM ${sourceCutoffs.crm ?? "—"} · mídia ${sourceCutoffs.media ?? "—"} · ` +
          `B2C ${sourceCutoffs.b2c ?? "—"}.\nRun ${input.runId.slice(0, 8)} · spec v1.0.\n\n${commonLimit}`;
        break;
      case "C1":
        body = `Investimento em mídia: ${fmtCurrency(metricValue(scorecard, "investimento_midia"))}.\n` +
          `Cartões CRM: ${fmtNumber(metricValue(scorecard, "cartoes_crm"))}.\n` +
          `Conversão CRM/base: ${fmtPercent(metricValue(scorecard, "conversao_crm_base"))}.\n` +
          `Ações candidatas: ${actionQueue.length}; aprovação humana obrigatória.\n\n${commonLimit}`;
        break;
      case "C2": {
        const crmCoverage = coverage.find((row) => row.source === "CRM")?.coverage;
        const mediaCoverage = coverage.find((row) => row.source === "Mídia")?.coverage;
        body = `Cutoff integrado: ${integratedCutoff}; gap máximo: ${
          fmtNumber(input.manifest.gap_closure_days)
        } dia(s).\n` +
          `Template CRM: ${fmtPercent(crmCoverage)} · evento nomeado de mídia: ${fmtPercent(mediaCoverage)}.\n` +
          `CRM e B2C/Serasa permanecem em funis paralelos; nenhuma origem é somada sem certificação.`;
        break;
      }
      case "C3": {
        const cac = metricValue(scorecard, "cac_crm");
        body = `Cartões CRM: ${fmtNumber(metricValue(scorecard, "cartoes_crm"))}.\n` +
          `CAC CRM: ${fmtCurrency(cac)}${
            cac === null ? " (custo ausente; não convertido em zero)" : ""
          }.\n` +
          `Investimento de mídia: ${fmtCurrency(metricValue(scorecard, "investimento_midia"))}.\n` +
          `Conversão CRM/base: ${fmtPercent(metricValue(scorecard, "conversao_crm_base"))}.`;
        break;
      }
      case "C4":
        body = `Comparação primária: ${built.previousPeriod.start.split("-").reverse().join("/")}–${
          built.previousPeriod.end.split("-").reverse().join("/")
        }, com a mesma quantidade de dias do recorte atual.\n` +
          `Meta e projeção só aparecem quando a meta estiver certificada; sem certificação, o slide mantém apenas o realizado.`;
        break;
      case "C5": {
        const full = router.filter((row) => row.mode === "full").map((row) => row.partner).join(", ") || "nenhum";
        const compact = router.filter((row) => row.mode === "compact").map((row) => row.partner).join(", ") || "nenhum";
        const flags = router.filter((row) => row.mode === "quality_flag").map((row) => row.partner).join(", ") || "nenhuma";
        body = `Capítulo cheio: ${full}.\nCapítulo compacto: ${compact}.\nFlags de qualidade: ${flags}.\n\n` +
          `A profundidade é decidida por materialidade E (variedade OU sinal), com prioridade para parceiro estratégico.`;
        break;
      }
      case "C7":
        body = outcomes.length
          ? `${outcomes.length} outcome(s) registrado(s). Comparar resultado observado com a métrica e janela definidas na ação original.`
          : "Ainda não há janela de outcome encerrada nesta primeira execução. O slide permanece como baseline, sem inventar efeito realizado.";
        break;
      case "C8": {
        const buckets = ["Agir hoje", "Acompanhar", "Investigar"].map((bucket) =>
          `${bucket}: ${actionQueue.filter((row) => row.bucket === bucket).length}`
        ).join(" · ");
        body = `${buckets}.\n\nCada item foi emitido por regra determinística, deduplicado por domínio × parceiro × sinal e aguarda owner/prazo humanos.`;
        break;
      }
      case "P1": {
        const cards = metricValue(sourceRows, "cards");
        const cac = metricValue(sourceRows, "cac");
        const conversion = metricValue(sourceRows, "conversion");
        body = `${slide.partner}: ${fmtNumber(cards)} cartões; CAC ${fmtCurrency(cac)}; ` +
          `conversão ${fmtPercent(conversion)}.\n` +
          `${cac === null ? "CAC indisponível porque o custo CRM está missing. " : ""}` +
          `${commonLimit}`;
        break;
      }
      case "P4": {
        const stages = sourceRows.map((row) =>
          `${row.stage}: ${fmtNumber(row.value)}`
        ).join(" · ");
        body = `${stages || "Funil indisponível"}.\n\nA etapa sem observação permanece como quebra visível; zero real e missing não são equivalentes.`;
        break;
      }
      case "P7":
      case "M7":
        body = sourceRows.length
          ? `${sourceRows[0].signal ?? "Sinal observado"}\n\nAção candidata: ${
            sourceRows[0].action_text ?? "revisar evidência"
          }.\nMétrica: ${sourceRows[0].success_metric ?? "a definir"}.\nAprovação humana obrigatória.`
          : "Nenhuma ação candidata certificada para este recorte. Manter curso e monitorar o próximo cutoff.";
        break;
      case "M2": {
        const top = [...mediaMix]
          .sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))
          .slice(0, 3)
          .map((row) => `${row.channel}/${row.objective}: ${fmtCurrency(row.spend)}`)
          .join("\n");
        body = `${top || "Sem investimento observado."}\n\nCPA sempre nomeia o evento de plataforma e nunca é apresentado como CAC/cartão.`;
        break;
      }
      case "B1":
        body = `${b2c.map((row) =>
          `${row.source_type}: ${fmtNumber(row.emissions)} emissões`
        ).join("\n") || "Sem funis observados."}\n\nCRM, total e Serasa são exibidos em paralelo; não são somados.`;
        break;
      case "K-TPL": {
        const activity = templates.find((row) => row.scope === "activities.template_id");
        const slots = templates.find((row) => row.scope === "communication_slots.current_template_id");
        body = `Activities com template: ${fmtNumber(activity?.mapped)}/${fmtNumber(activity?.total)} ` +
          `(${fmtPercent(activity?.coverage)}).\nSlots mapeados: ${fmtNumber(slots?.mapped)}/${fmtNumber(slots?.total)} ` +
          `(${fmtPercent(slots?.coverage)}).\n\nBacklog permanece visível até a certificação operacional.`;
        break;
      }
      case "A4": {
        const consumed = fieldCoverage.filter((row) => row.status === "consumed").length;
        const privacy = fieldCoverage.filter((row) => row.status === "excluded_privacy").length;
        body = `${fieldCoverage.length} campos auditados: ${consumed} consumidos e ${privacy} excluídos por privacidade.\n\n` +
          `Todo campo sem consumidor possui justificativa explícita; cobertura não significa que dados pessoais devam ir ao deck.`;
        break;
      }
      default:
        body = sourceRows.length
          ? `${sourceRows.length} linha(s) observada(s) em ${slide.source_view}.\n` +
            `Prontidão: ${slide.implementation_readiness}; confiança: ${slide.confidence_label}.\n\n${commonLimit}`
          : `Sem linha utilizável em ${slide.source_view ?? "fonte não aplicável"}.\n` +
            `Prontidão: ${slide.implementation_readiness}. O conteúdo não é preenchido com zero nem estimativa.`;
    }
    narratives[slide.slide_instance_id] = `${prefix}${body}`.slice(0, 1_250);
  }
  return narratives;
}

async function processRun(
  runId: string,
  profile: string,
  periodStart: string,
  periodEnd: string,
  options: {
    texts?: Record<string, string>;
    skipLlm: boolean;
    skipStructure: boolean;
  },
) {
  const input = await loadInputs(runId, profile, periodStart, periodEnd);
  const built = buildReport(input);
  await saveGeneratedState(runId, profile, input.manifest, built);
  const rowsWritten = await writeSnapshot(input, built);
  await setStatus(runId, "writing_sheets", { rows_inserted: rowsWritten });

  let structure: Row = { skipped: true };
  if (!options.skipStructure) structure = await setupStructure(runId);

  await setStatus(runId, "generating_narrative");
  const texts = options.texts ??
    (options.skipLlm
      ? deterministicNarrative(input, built)
      : await generateNarrative(runId, profile, input.manifest, built));

  await setStatus(runId, "refreshing_slides");
  const slidesInfo = await updateSlides(texts);
  const cycle = periodStart.slice(0, 7);
  await admin.from("report_memory").upsert(
    {
      run_id: runId,
      report_type: "midia_paga_crm_mensal",
      ciclo: cycle,
      narrativa: texts.c1 ?? "",
      recomendacoes: built.actionCandidates,
    },
    { onConflict: "report_type,ciclo" },
  );
  // Snapshot em PDF do deck publicado, para QA visual do run sem download manual.
  const pdfExport = await exportDeckPdf(runId);
  const publicationValid = input.manifest.quality_status !== "blocked";
  await setStatus(runId, "done", {
    sheet_url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
    slides_url: `https://docs.google.com/presentation/d/${SLIDES_ID}/edit`,
    llm_provider: options.skipLlm ? "manual_or_numeric_only" : "gemini-2.5-flash",
    publication_valid: publicationValid,
    error_detail: publicationValid ? null : "Run concluído tecnicamente, mas bloqueado pelo manifesto de qualidade.",
  });
  console.log("report-live run completed", JSON.stringify({
    runId,
    profile,
    rowsWritten,
    structure,
    slidesInfo,
    pdfExport,
    quality: input.manifest.quality_status,
  }));
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method === "GET") {
    const checks: Record<string, unknown> = {
      spec_version: "1.0",
      sheet_id: Boolean(SHEET_ID),
      slides_id: Boolean(SLIDES_ID),
      service_key: Boolean(SERVICE_KEY),
      service_account: Boolean(SA_RAW),
      gemini_key: Boolean(GEMINI_KEY),
    };
    try {
      await googleToken();
      checks.google_auth = true;
    } catch (error) {
      checks.google_auth = `ERRO: ${(error as Error).message.slice(0, 200)}`;
    }
    try {
      const { error } = await admin.from("report_slide_contracts").select("slide_code").limit(1);
      checks.foundation = error ? `ERRO: ${error.message}` : true;
    } catch (error) {
      checks.foundation = `ERRO: ${(error as Error).message.slice(0, 200)}`;
    }
    return json({ ok: true, checks });
  }
  if (request.method !== "POST") return json({ error: "método não suportado" }, 405);

  let body: Row = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }
  const now = new Date();
  const defaultStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const periodStart = String(body.period_start ?? defaultStart);
  const periodEnd = String(body.period_end ?? toIsoDay(now));
  const profile = String(body.report_profile ?? "monthly_report");

  if (!SHEET_ID || !SLIDES_ID || !SA_RAW || !SERVICE_KEY) {
    return json({ error: "Secrets obrigatórios ausentes." }, 500);
  }

  // Reexporta o PDF do deck atual sem reprocessar o run. Sem run_id, usa o último
  // run concluído — é o snapshot que corresponde ao que está publicado no Slides.
  if (body.mode === "export_pdf") {
    let runId = String(body.run_id ?? "");
    if (!runId) {
      const { data: lastRun } = await admin
        .from("report_runs")
        .select("id")
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lastRun) return json({ error: "Nenhum run concluído para exportar." }, 404);
      runId = String(lastRun.id);
    }
    const result = await exportDeckPdf(runId);
    return json({ run_id: runId, ...result }, result.ok ? 200 : 500);
  }

  if (body.mode === "inspect_contract") {
    try {
      const input = await loadInputs("00000000-0000-0000-0000-000000000000", profile, periodStart, periodEnd);
      const built = buildReport(input);
      const narrative = deterministicNarrative(input, built);
      return json({
        ok: true,
        spec_version: "1.0",
        manifest: input.manifest,
        rows: {
          crm: input.crm.length,
          media: input.media.length,
          media_actions: input.mediaActions.length,
          b2c: input.b2c.length,
          insurance: input.insurance.length,
        },
        tabs: Object.keys(built.tabs).length,
        slides: built.slides.reduce<Record<string, number>>((counts, slide) => {
          counts[slide.run_eligibility] = (counts[slide.run_eligibility] ?? 0) + 1;
          return counts;
        }, {}),
        partner_modes: built.partnerModes,
        action_candidates: built.actionCandidates.length,
        narrative_preview: Object.fromEntries(
          ["c0", "c1", "c2", "c3", "c5", "m2", "b1"]
            .map((key) => [key, narrative[key] ?? null]),
        ),
      });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "resume_structure") {
    const runId = String(body.run_id ?? "");
    if (!runId) return json({ error: "run_id é obrigatório para resume_structure." }, 400);
    try {
      const { data: existingRun, error: runError } = await admin
        .from("report_runs")
        .select("id,quality_status,period_start,period_end,report_profile")
        .eq("id", runId)
        .single();
      if (runError || !existingRun) throw new Error(runError?.message ?? "Run não encontrado.");
      await setStatus(runId, "refreshing_slides", { error_detail: null });
      const structure = await setupStructure(runId);
      let texts: Record<string, string>;
      if (body.texts && typeof body.texts === "object") {
        texts = body.texts as Record<string, string>;
      } else {
        const resumeInput = await loadInputs(
          runId,
          String(existingRun.report_profile ?? "monthly_report"),
          String(existingRun.period_start),
          String(existingRun.period_end),
        );
        texts = deterministicNarrative(resumeInput, buildReport(resumeInput));
      }
      const slidesInfo = await updateSlides(texts);
      const { data: candidates } = await admin
        .from("report_action_candidates")
        .select("*")
        .eq("run_id", runId);
      await admin.from("report_memory").upsert(
        {
          run_id: runId,
          report_type: "midia_paga_crm_mensal",
          ciclo: String(existingRun.period_start).slice(0, 7),
          narrativa: texts.c1 ?? "",
          recomendacoes: candidates ?? [],
        },
        { onConflict: "report_type,ciclo" },
      );
      const publicationValid = existingRun.quality_status !== "blocked";
      await setStatus(runId, "done", {
        sheet_url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
        slides_url: `https://docs.google.com/presentation/d/${SLIDES_ID}/edit`,
        llm_provider: "manual_or_numeric_only",
        publication_valid: publicationValid,
        error_detail: publicationValid ? null : "Run bloqueado pelo manifesto de qualidade.",
      });
      return json({ ok: true, run_id: runId, structure, slides: slidesInfo });
    } catch (error) {
      await setStatus(runId, "error", {
        publication_valid: false,
        error_detail: String((error as Error).message).slice(0, 900),
      });
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }

  const skipLlm = body.skip_llm !== false;
  const texts = body.texts && typeof body.texts === "object"
    ? body.texts as Record<string, string>
    : undefined;
  if (!skipLlm && !GEMINI_KEY) {
    return json({ error: "GEMINI_API_KEY ausente; use skip_llm:true." }, 500);
  }
  const { data: run, error } = await admin.from("report_runs").insert({
    report_type: "midia_paga_crm_mensal",
    report_profile: profile,
    spec_version: "1.0",
    period_start: periodStart,
    period_end: periodEnd,
    status: "queued",
  }).select().single();
  if (error || !run) return json({ error: `Não criou run: ${error?.message}` }, 500);

  const job = processRun(run.id, profile, periodStart, periodEnd, {
    texts,
    skipLlm,
    skipStructure: body.skip_structure === true,
  }).catch(async (error) => {
    console.error("report-sync erro", error);
    await setStatus(run.id, "error", {
      publication_valid: false,
      error_detail: String((error as Error).message).slice(0, 900),
    });
  });
  // @ts-ignore Supabase Edge Runtime global.
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    // @ts-ignore Supabase Edge Runtime global.
    EdgeRuntime.waitUntil(job);
  } else {
    await job;
  }
  return json({ run_id: run.id, spec_version: "1.0" });
});
