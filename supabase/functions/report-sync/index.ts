// Report Live v1.0 runtime
// Supabase (source + manifest) -> Google Sheets (snapshot + tidy views)
// -> Google Slides (one live deck, linked charts + governed narrative).
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import {
  parseReportRequest,
  reportRoleAllows,
  selectReportWorkerCredential,
  verifyReportWorkerCredential,
  type ReportLiveRole,
} from "./report-live-policy.ts";
import { getOrCreateImmutableFile } from "./report-live-immutable-file.ts";
import { compileRecoveryManifest, type RecoveryEvidence } from "./report-live-recovery.ts";
import {
  advancePublication,
  compareSheetValues,
  quoteSheetTitle,
  publicationSlides,
  type PublicationJob,
  type PublicationPhase,
  type PublicationReceipt,
} from "./report-live-publication.ts";
import {
  buildGenerationRetentionPlan,
  buildSheetGeneration,
  buildIsolatedExportPlan,
  buildSlideActivationRequests,
  buildSlideVisibilityRestoreRequests,
  isManagedGeneratedSlide,
  releaseSlidePrefix,
  verifySlideActivation,
} from "./report-live-generation.ts";
import { reportLiveReleaseKey } from "../_shared/report-live-design.ts";
import {
  buildReport,
  normalizeSnapshotManifest,
  previousEquivalentPeriod,
  toIsoDay,
  type Row,
  type SlideContract,
  type SourceManifest,
} from "./report-live-engine.ts";
import {
  buildArtifact,
  certificationPassed,
  diffBlueprints,
  RELEASE_VERSIONS,
  reportSourceRows,
  sha256,
  validateArtifact,
  validateArtifactIntegrity,
  validateRegression,
  type ReportBuildArtifact,
  type ValidationResult,
} from "./report-live-versioning.ts";

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

async function googleBinaryFetch(url: string, init?: RequestInit): Promise<Uint8Array> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = await googleToken();
    const response = await fetch(url, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
    });
    if (response.ok) return new Uint8Array(await response.arrayBuffer());
    const detail = (await response.text()).slice(0, 500);
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 2_000 * 2 ** attempt));
      continue;
    }
    throw new Error(`Google binary API ${response.status}: ${detail}`);
  }
  throw new Error("Google binary API excedeu o número máximo de retentativas.");
}

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const SLIDES = "https://slides.googleapis.com/v1/presentations";
const DRIVE = "https://www.googleapis.com/drive/v3/files";

const PDF_BUCKET = "report-live";
const PDF_SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 dias

/**
 * Exporta uma cópia isolada da geração como PDF e guarda no Storage.
 *
 * Serve ao QA visual: o contrato analítico é verificável por `report_slide_runs`,
 * mas clipping, série vazia e truncamento só aparecem no render. Sem isto o QA
 * depende de alguém baixar o PDF manualmente a cada execução.
 *
 * Falha retorna { ok: false }; o chamador deve bloquear o commit da publicação.
 * Cada publicação reutiliza o arquivo imutável já confirmado no Storage.
 */
async function exportDeckPdf(
  runId: string,
  publicationKey: string = crypto.randomUUID(),
  expectedPageCount?: number,
): Promise<Row> {
  try {
    // The strategy identifier is part of the immutable artifact identity. It
    // prevents an invalid full-deck export from being accepted after changing
    // the page-selection strategy.
    const path = `runs/${runId}/publications/${publicationKey}-generation-selected-v6.pdf`;
    const bytes = await getOrCreateImmutableFile({
      read: async () => {
        const { data, error } = await admin.storage.from(PDF_BUCKET).download(path);
        if (error) {
          const status = String((error as unknown as Row).statusCode ?? '');
          if (status === '404' || /^(Object not found|The resource was not found)$/i.test(error.message)) return null;
          throw new Error(`storage download: ${error.message}`);
        }
        if (!data) throw new Error('Storage sem resposta de leitura.');
        return new Uint8Array(await data.arrayBuffer());
      },
      create: async () => {
        const releaseKey = await reportLiveReleaseKey(runId);
        const presentation = await readDeckGenerationState();
        const plan = buildIsolatedExportPlan(presentation.slides ?? [], releaseKey);
        if (expectedPageCount !== undefined && plan.targetIds.length !== expectedPageCount) {
          throw new Error(`Deck possui ${plan.targetIds.length} página(s) da geração; esperado: ${expectedPageCount}.`);
        }
        const target = new Set(plan.targetIds);
        const sourcePageIndices = (presentation.slides ?? []).flatMap((slide: Row, index: number) =>
          target.has(String(slide.objectId ?? "")) ? [index] : []
        );
        const fullDeck = await googleBinaryFetch(
          `${DRIVE}/${SLIDES_ID}/export?mimeType=application/pdf&supportsAllDrives=true`,
        );
        if (new TextDecoder().decode(fullDeck.slice(0, 5)) !== '%PDF-') {
          throw new Error('Drive não retornou um PDF.');
        }
        const sourcePdf = await PDFDocument.load(fullDeck);
        if (sourcePdf.getPageCount() !== (presentation.slides ?? []).length) {
          throw new Error(
            `Ordem do PDF não é verificável: ${sourcePdf.getPageCount()} páginas para ${(presentation.slides ?? []).length} slides.`,
          );
        }
        const selectedPdf = await PDFDocument.create();
        const selectedPages = await selectedPdf.copyPages(sourcePdf, sourcePageIndices);
        selectedPages.forEach((page) => selectedPdf.addPage(page));
        return new Uint8Array(await selectedPdf.save());
      },
      write: async (value) => {
        const { error } = await admin.storage.from(PDF_BUCKET).upload(path, value, { contentType: 'application/pdf', upsert: false });
        if (error) throw new Error(`storage upload: ${error.message}`);
      },
    });
    if (bytes.byteLength === 0) throw new Error("Drive export retornou 0 bytes.");
    const pageCount = (await PDFDocument.load(bytes)).getPageCount();
    if (pageCount === 0) throw new Error("PDF exportado sem páginas detectáveis.");
    if (expectedPageCount !== undefined && pageCount !== expectedPageCount) {
      throw new Error(
        `PDF possui ${pageCount} página(s), mas ${expectedPageCount} slide(s) eram esperados.`,
      );
    }
    const pdfDigest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
    const pdfHash = [...new Uint8Array(pdfDigest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const { data: signed, error: signedError } = await admin.storage
      .from(PDF_BUCKET)
      .createSignedUrl(path, PDF_SIGNED_URL_TTL);

    if (signedError) throw new Error(`PDF signed URL: ${signedError.message}`);
    const { error: pathError } = await admin.from("report_runs").update({ pdf_path: path }).eq("id", runId);
    if (pathError) throw new Error(`PDF path: ${pathError.message}`);
    return {
      ok: true,
      path,
      bytes: bytes.byteLength,
      page_count: pageCount,
      sha256: pdfHash,
      signed_url: signed?.signedUrl ?? null,
    };
  } catch (error) {
    console.error("exportDeckPdf falhou", error);
    return { ok: false, error: String((error as Error).message).slice(0, 400) };
  }
}

async function setStatus(runId: string, status: string, patch: Row = {}) {
  const terminalStatuses = new Set(["done", "error", "rejected", "superseded", "stale"]);
  const activePatch = patch.active_run === undefined && terminalStatuses.has(status)
    ? { active_run: false }
    : {};
  const { error } = await admin.from("report_runs").update({
    status,
    ...activePatch,
    ...patch,
  }).eq("id", runId);
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
    output.push(...((data ?? []) as unknown as Row[]));
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

/**
 * Atualiza a deduplicação de mídia imediatamente antes de ler.
 *
 * Sob demanda em vez de agendado: a coleta de mídia roda ~2x por dia e o Report
 * Live roda algumas vezes por mês, então um cron de hora em hora gastaria ~5,5 h
 * de banco por mês reconstruindo 50 mil linhas idênticas — e ainda assim leria
 * dado de até uma hora atrás. Aqui custa ~28 s por execução e garante que o run
 * enxerga exatamente o que existe no instante em que roda.
 *
 * Falha aqui não derruba o run: a materializada anterior continua válida, só
 * mais velha. O manifesto registra o ocorrido para a leitura não ser tratada
 * como certificada sem ressalva.
 */
async function refreshMediaActionsView(): Promise<string | null> {
  try {
    const { error } = await admin.rpc("report_live_refresh_media_actions");
    if (error) throw new Error(error.message);
    return null;
  } catch (error) {
    const detail = String((error as Error).message).slice(0, 300);
    console.warn("report-live refresh mv_paid_media_actions_latest falhou", detail);
    return detail;
  }
}

async function loadInputs(runId: string, profile: string, periodStart: string, periodEnd: string) {
  const previous = previousEquivalentPeriod(periodStart, periodEnd);
  const queryStart = SNAPSHOT_START < previous.start ? SNAPSHOT_START : previous.start;
  const monthlyStartDate = new Date(`${periodEnd.slice(0, 7)}-01T00:00:00Z`);
  monthlyStartDate.setUTCMonth(monthlyStartDate.getUTCMonth() - 6);
  const monthlyQueryStart = monthlyStartDate.toISOString().slice(0, 10);
  await refreshMediaActionsView();
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
    actionCandidates,
    actionOutcomes,
    metricCertifications,
    eventMap,
    monthlyAcquisition,
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
    // Deduplicada: o coletor regrava dias já fechados a cada execução, sob um
    // novo data_as_of. Em jul/2026 isso levou paid_media_actions de ~10 mil
    // para 242 mil linhas/mês (fator ~44x) e o build passou a morrer antes de
    // terminar de carregar. A materializada expõe a observação mais recente por
    // chave natural — 422.960 → 44.594 linhas na janela de agosto — e é
    // atualizada de hora em hora por pg_cron. A tabela bruta permanece intacta
    // como histórico de maturação.
    pagedSelect("mv_paid_media_actions_latest", "*", {
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
    pagedSelect("report_action_candidates", "*", { orderColumn: "created_at" }),
    pagedSelect("report_action_outcomes", "*", { orderColumn: "created_at" }),
    pagedSelect("report_metric_certifications", "*", { orderColumn: "period_key" }),
    pagedSelect("event_map", "*", { orderColumn: "id" }),
    pagedSelect("v_aquisicao_mensal_canonico", "*", {
      dateColumn: "mes",
      from: monthlyQueryStart,
      to: periodEnd,
      orderColumn: "mes",
    }),
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
    actionCandidates,
    actionOutcomes,
    metricCertifications,
    eventMap,
    monthlyAcquisition,
  };
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

async function ensureGenerationTabs(entries: Array<{
  physical_title: string;
  row_count: number;
  column_count: number;
}>) {
  const metadata = await googleFetch(
    `${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title,hidden,gridProperties(rowCount,columnCount)))`,
  );
  const existing = new Map<string, Row>();
  for (const sheet of metadata.sheets ?? []) {
    existing.set(String(sheet.properties.title), sheet.properties as Row);
  }
  const requests: Row[] = [];
  for (const entry of entries) {
    const properties = existing.get(entry.physical_title);
    if (!properties) {
      requests.push({ addSheet: { properties: {
        title: entry.physical_title,
        hidden: true,
        gridProperties: {
          rowCount: entry.row_count,
          columnCount: entry.column_count,
          frozenRowCount: entry.row_count > 1 ? 1 : 0,
        },
      } } });
      continue;
    }
    const grid = (properties.gridProperties ?? {}) as Row;
    const sheetId = Number(properties.sheetId);
    const rows = Number(grid.rowCount ?? 0);
    const columns = Number(grid.columnCount ?? 0);
    if (rows < entry.row_count) requests.push({ appendDimension: {
      sheetId, dimension: "ROWS", length: entry.row_count - rows,
    } });
    if (columns < entry.column_count) requests.push({ appendDimension: {
      sheetId, dimension: "COLUMNS", length: entry.column_count - columns,
    } });
    if (properties.hidden !== true) requests.push({ updateSheetProperties: {
      properties: { sheetId, hidden: true }, fields: "hidden",
    } });
  }
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
    body: JSON.stringify({ ranges: Object.keys(tables).map((tab) => `${quoteSheetTitle(tab)}!A:ZZ`) }),
  });
  const entries: Array<{ range: string; majorDimension: "ROWS"; values: unknown[][] }> = [];
  for (const [tab, values] of Object.entries(tables)) {
    const chunkSize = 1000;
    for (let index = 0; index < values.length; index += chunkSize) {
      entries.push({
        range: `${quoteSheetTitle(tab)}!A${index + 1}`,
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
      expected_value: candidate.expected_value ?? null,
      expected_unit: candidate.expected_unit ?? null,
      expected_direction: candidate.expected_direction ?? null,
      outcome_window_end: candidate.outcome_window_end ?? null,
      verification_view: candidate.verification_view ?? null,
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

  if (built.evaluatedOutcomes.length) {
    const { error } = await admin
      .from("report_action_outcomes")
      .upsert(built.evaluatedOutcomes, { onConflict: "action_candidate_id" });
    if (error) throw new Error(`report_action_outcomes: ${error.message}`);
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
  await setStatus(runId, "building", {
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

/**
 * Aba única de overview/auditoria de gestão.
 *
 * Substitui a cópia das origens cruas: em vez de duplicar linha, aponta para o
 * snapshot imutável no Storage e presta contas do que foi lido, de qual corte
 * veio e em que estado cada slide saiu. Auditoria por referência, não por cópia.
 */
function auditTable(artifact: ReportBuildArtifact): unknown[][] {
  const rows: unknown[][] = [["bloco", "item", "valor"]];
  const add = (bloco: string, item: string, valor: unknown) =>
    rows.push([bloco, item, valor === null || valor === undefined || valor === "" ? "—" : valor]);

  add("Recorte", "Período", `${artifact.period_start} a ${artifact.period_end}`);
  add(
    "Recorte",
    "Período equivalente anterior",
    `${artifact.previous_period.start} a ${artifact.previous_period.end}`,
  );
  add("Recorte", "Perfil do relatório", artifact.report_profile);
  add("Recorte", "Run", artifact.run_id);
  add("Recorte", "Gerado em", artifact.built_at);

  add("Qualidade", "Leitura integrada (cutoff)", artifact.manifest.data_reading_integrated);
  add("Qualidade", "Gap de fechamento (dias)", artifact.manifest.gap_closure_days);
  add("Qualidade", "Status", artifact.manifest.quality_status);
  for (const [fonte, cutoff] of Object.entries(artifact.manifest.source_cutoffs ?? {})) {
    add("Qualidade", `Cutoff nativo · ${fonte}`, cutoff);
  }

  const snapshots = artifact.source_snapshots ?? {};
  for (const [sourceKey, snapshot] of Object.entries(snapshots)) {
    add("Fontes lidas", sourceKey, `${snapshot.row_count} linhas`);
  }
  add(
    "Fontes lidas",
    "Total de linhas lidas",
    Object.values(snapshots).reduce((total, snapshot) => total + snapshot.row_count, 0),
  );
  add("Fontes lidas", "Snapshot bruto imutável", `Storage · runs/${artifact.run_id}/sources/`);
  add(
    "Fontes lidas",
    "Mídia (paid_media_actions)",
    "deduplicada por chave natural e atualizada no início deste run",
  );

  const eligibility = artifact.slides.reduce<Record<string, number>>((acc, slide) => {
    const key = String(slide.run_eligibility ?? "desconhecido");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  for (const [estado, total] of Object.entries(eligibility)) {
    add("Deck", `Slides · ${estado}`, total);
  }

  add("Versões", "Dados (source)", artifact.versions.source);
  add("Versões", "Semântica", artifact.versions.semantic);
  add("Versões", "Contrato editorial (spec)", artifact.versions.spec);
  add("Versões", "Narrativa", artifact.versions.narrative);
  add("Versões", "Renderizador", artifact.versions.renderer);
  add("Versões", "Hash das fontes", artifact.source_hash);
  add("Versões", "Hash do blueprint", artifact.blueprint_hash);

  return rows;
}

/**
 * A planilha recebe APENAS o que o deck lê: as views derivadas mais a aba de
 * auditoria.
 *
 * Até 08/09/2026 esta função também copiava as 18 tabelas de origem cruas para
 * abas `DB_*_V1`. Na publicação v1 isso somou 47.178 linhas brutas contra 988
 * de views derivadas — 98% da escrita no Sheets, que é a operação mais cara do
 * pipeline, para um dado que nenhum slide e nenhum gráfico consultam: todo
 * `source_view` de contrato aponta para uma `VIEW_*`. As origens continuam
 * preservadas de forma imutável no Storage, em `runs/<run_id>/sources/`.
 */
function artifactSheetTables(artifact: ReportBuildArtifact): Record<string, unknown[][]> {
  return {
    REPORT_AUDITORIA_V1: auditTable(artifact),
    ...artifact.tabs,
  };
}

function artifactTablePreviews(artifact: ReportBuildArtifact): Record<string, string> {
  return Object.fromEntries(Object.entries(artifact.tabs).map(([view, rows]) => [
    view,
    rows.slice(0, 7).map((row, index) =>
      row.slice(0, 5).map((value) => String(value ?? "").replace(/\s+/g, " ").slice(0, 22))
        .join(index === 0 ? "  |  " : "   ")
    ).join("\n") || "Sem linhas observadas nesta execução.",
  ]));
}

async function writeArtifactSnapshot(artifact: ReportBuildArtifact): Promise<number> {
  const tables = artifactSheetTables(artifact);
  await ensureTabs(Object.keys(tables));
  await ensureTabCapacity(tables);
  await writeTables(tables);
  return Object.values(tables).reduce(
    (total, rows) => total + Math.max(0, rows.length - 1),
    0,
  );
}

async function artifactGeneration(artifact: ReportBuildArtifact) {
  const releaseKey = await reportLiveReleaseKey(artifact.run_id);
  return {
    releaseKey,
    ...(await buildSheetGeneration(releaseKey, artifactSheetTables(artifact))),
  };
}

async function writeArtifactGeneration(artifact: ReportBuildArtifact) {
  const generation = await artifactGeneration(artifact);
  await ensureGenerationTabs(generation.entries);
  await writeTables(generation.physicalTables);
  return {
    ...generation,
    rowsWritten: artifactRowCount(artifact),
  };
}

async function readSheetTables(titles: string[], render: 'FORMULA' | 'UNFORMATTED_VALUE') {
  const tables: Record<string, unknown[][]> = {};
  for (let offset = 0; offset < titles.length; offset += 10) {
    const batch = titles.slice(offset, offset + 10);
    const query = new URLSearchParams({ valueRenderOption: render, dateTimeRenderOption: 'SERIAL_NUMBER' });
    for (const title of batch) query.append('ranges', quoteSheetTitle(title));
    const response = await googleFetch(`${SHEETS}/${SHEET_ID}/values:batchGet?${query}`);
    if (!Array.isArray(response.valueRanges) || response.valueRanges.length !== batch.length) {
      throw new Error('Leitura Google incompleta: quantidade de abas divergente.');
    }
    batch.forEach((title, index) => { tables[title] = response.valueRanges[index].values ?? []; });
  }
  return tables;
}

/** Preserve exact pre-write values/formulas and deck JSON as recovery evidence.
 * This is not a promise that deck JSON can be reapplied as a Slides request. */
async function preserveRecoveryManifest(path: string, evidence: RecoveryEvidence) {
  let manifest;
  try { manifest = compileRecoveryManifest(evidence); }
  catch (error) { return { recovery_compiled: false, recovery_error: String((error as Error).message), recovery_path: null }; }
  const recoveryPath = path.replace(/before-write\.json$/, `recovery-manifest-v${manifest.schema_version}.json`);
  await uploadJsonChunks(recoveryPath, singleJsonChunk(manifest));
  const { data, error } = await admin.storage.from(PDF_BUCKET).download(recoveryPath);
  if (error || !data) throw new Error('Manifesto de recuperação não pôde ser relido.');
  const hash = await sha256(manifest);
  if (await sha256(JSON.parse(await data.text())) !== hash) throw new Error('Manifesto de recuperação divergente.');
  return { recovery_compiled: true, recovery_error: null, recovery_path: recoveryPath, recovery_sha256: hash,
    recovery_slides: manifest.slide_steps.length, recovery_sheets: manifest.sheet_steps.length,
    live_restore_verified: false };
}

async function capturePublicationEvidence(publicationId: string, artifact: ReportBuildArtifact) {
  const path = `runs/${artifact.run_id}/publications/${publicationId}/before-write.json`;
  const previous = await admin.storage.from(PDF_BUCKET).download(path);
  if (previous.data) {
    const evidence = JSON.parse(await previous.data.text());
    if (evidence.publication_id !== publicationId || evidence.run_id !== artifact.run_id ||
        evidence.sheet_id !== SHEET_ID || evidence.slides_id !== SLIDES_ID) throw new Error('Backup pertence a outro destino.');
    return { path, sha256: await sha256(evidence), verified: true, ...await preserveRecoveryManifest(path, evidence) };
  }
  if (previous.error && !/not found|does not exist/i.test(previous.error.message)) {
    throw new Error(`Não foi possível verificar backup existente: ${previous.error.message}`);
  }
  const metadata = await googleFetch(`${SHEETS}/${SHEET_ID}`);
  const existing = new Set<string>((metadata.sheets ?? []).map((sheet: any) => String(sheet.properties.title)));
  const titles = Object.keys(artifactSheetTables(artifact));
  const values = await readSheetTables(titles.filter(title => existing.has(title)), 'FORMULA');
  // FORMULA-rendered values alone cannot distinguish a formula from literal
  // text beginning with '='. Preserve the typed input and rich text as well.
  const gridSheets: Row[] = [];
  const existingTitles = titles.filter(title => existing.has(title));
  for (let offset = 0; offset < existingTitles.length; offset += 8) {
    const query = new URLSearchParams({ fields: 'sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue,userEnteredFormat,textFormatRuns,note,dataValidation))))' });
    for (const title of existingTitles.slice(offset, offset + 8)) query.append('ranges', quoteSheetTitle(title));
    const grid = await googleFetch(`${SHEETS}/${SHEET_ID}?${query}`);
    if (!Array.isArray(grid.sheets) || grid.sheets.length !== existingTitles.slice(offset, offset + 8).length) throw new Error('Snapshot tipado incompleto.');
    gridSheets.push(...grid.sheets);
  }
  const deck = await googleFetch(`${SLIDES}/${SLIDES_ID}`);
  const evidence = { publication_id: publicationId, run_id: artifact.run_id, sheet_id: SHEET_ID,
    slides_id: SLIDES_ID, captured_at: new Date().toISOString(), metadata, values, grid_sheets: gridSheets, deck,
    new_tabs: titles.filter(title => !existing.has(title)),
    recovery_scope: 'Original values/formulas and Google structures; not a certified automatic restore artifact.' };
  await uploadJsonChunks(path, singleJsonChunk(evidence));
  // Verify persistence before any target mutation, rather than trusting upload acknowledgement.
  const stored = await admin.storage.from(PDF_BUCKET).download(path);
  if (stored.error || !stored.data) throw new Error('Backup anterior à escrita não pôde ser relido.');
  const expectedHash = await sha256(evidence);
  if (await sha256(JSON.parse(await stored.data.text())) !== expectedHash) throw new Error('Backup anterior à escrita diverge.');
  return { path, sha256: expectedHash, verified: true, ...await preserveRecoveryManifest(path, evidence) };
}

async function verifyArtifactSheet(
  artifact: ReportBuildArtifact,
  titleMap: Record<string, string> = {},
) {
  const logical = artifactSheetTables(artifact);
  const expected = Object.fromEntries(Object.entries(logical).map(([title, rows]) => [titleMap[title] ?? title, rows]));
  const actual = await readSheetTables(Object.keys(expected), 'UNFORMATTED_VALUE');
  const failures = Object.entries(expected).flatMap(([title, rows]) => {
    const result = compareSheetValues(rows, actual[title] ?? []);
    return result.verified ? [] : [{ title, ...result }];
  });
  if (failures.length) throw new Error(`Planilha diverge do artefato: ${JSON.stringify(failures).slice(0, 800)}`);
  return { verified: true, tables: Object.keys(expected).length, title_map: titleMap };
}

/**
 * Inventário — e, com `confirm`, limpeza — das abas da planilha.
 *
 * Depois que as origens cruas deixaram de ser copiadas, as 18 abas `DB_*_V1` e
 * a antiga `REPORT_PROFILE_V1` ficaram órfãs: ninguém mais escreve nelas e
 * nenhum slide as lê, mas continuam ocupando a planilha com um retrato
 * congelado de julho — que é pior que não ter nada, porque parece dado atual.
 *
 * A classificação é conservadora de propósito:
 *  - `escrita_neste_run` e `entrada_humana` nunca são tocadas;
 *  - `orfa` são as criadas pelo código que acabou de sair, seguras de apagar;
 *  - `legado_v3` são as do modo `setup_views` do v4-setup, que hoje ninguém
 *    chama — só somem com `include_legacy: true`, decisão explícita;
 *  - `desconhecida` nunca é apagada automaticamente, só reportada.
 */
async function inspectSheetTabs(
  artifact: ReportBuildArtifact,
  options: { confirm?: boolean; includeLegacy?: boolean } = {},
) {
  // BRIEFING é preenchida por gente. VIEW_CONTRACT e VIEW_REGISTRY são lidas
  // pelo v4-setup no caminho vivo — não entram em nenhuma lista de exclusão.
  const ENTRADA_HUMANA = new Set(["BRIEFING", "VIEW_CONTRACT", "VIEW_REGISTRY"]);
  const LEGADO_V3 = new Set(["DB_CRM", "DB_MIDIA", "REPORT_PROFILE", "REPORT_FRENTES"]);

  const metadata = await googleFetch(
    `${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title))`,
  );
  const escritas = new Set(Object.keys(artifactSheetTables(artifact)));

  const classificar = (titulo: string) => {
    if (escritas.has(titulo)) return "escrita_neste_run";
    if (ENTRADA_HUMANA.has(titulo)) return "entrada_humana";
    if (titulo.startsWith("DB_") && titulo.endsWith("_V1")) return "orfa";
    if (titulo === "REPORT_PROFILE_V1") return "orfa";
    if (LEGADO_V3.has(titulo)) return "legado_v3";
    return "desconhecida";
  };

  const abas = ((metadata.sheets ?? []) as Row[]).map((sheet) => {
    const props = (sheet.properties ?? {}) as Row;
    const titulo = String(props.title ?? "");
    return { sheet_id: Number(props.sheetId), titulo, classe: classificar(titulo) };
  });

  const apagaveis = abas.filter((aba) =>
    aba.classe === "orfa" || (options.includeLegacy && aba.classe === "legado_v3")
  );

  if (!options.confirm) {
    return { dry_run: true, total: abas.length, abas, apagariam: apagaveis.map((a) => a.titulo) };
  }

  // Guarda: se o run atual não escreveu view nenhuma, o artefato está errado e
  // apagar seria destruir a planilha com base em premissa falsa.
  if (escritas.size < 5) {
    throw new Error(
      `Limpeza recusada: o artefato declara apenas ${escritas.size} abas escritas.`,
    );
  }
  if (apagaveis.length) {
    await googleFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: apagaveis.map((aba) => ({ deleteSheet: { sheetId: aba.sheet_id } })),
      }),
    });
  }
  return {
    dry_run: false,
    apagadas: apagaveis.map((a) => a.titulo),
    mantidas: abas.filter((a) => !apagaveis.includes(a)).map((a) => a.titulo),
  };
}

/** Linhas efetivamente escritas na planilha (só derivadas + auditoria). */
function artifactRowCount(artifact: ReportBuildArtifact): number {
  return Object.values(artifactSheetTables(artifact)).reduce(
    (total, rows) => total + Math.max(0, rows.length - 1),
    0,
  );
}

const buildArtifactPath = (runId: string) =>
  `runs/${runId}/blueprints/report-build.json`;

const sourceArtifactPath = (runId: string, sourceKey: string) =>
  `runs/${runId}/sources/${sourceKey}/manifest.json`;

const sourceChunkArtifactPath = (runId: string, sourceKey: string, index: number) =>
  `runs/${runId}/sources/${sourceKey}/${String(index).padStart(5, "0")}.json`;

function* jsonArrayChunks(values: unknown[]): Generator<string> {
  yield "[";
  for (let index = 0; index < values.length; index += 1) {
    if (index > 0) yield ",";
    yield JSON.stringify(values[index]);
  }
  yield "]";
}

function* artifactJsonChunks(artifact: ReportBuildArtifact): Generator<string> {
  yield "{";
  const entries = Object.entries(artifact);
  for (let index = 0; index < entries.length; index += 1) {
    const [key, value] = entries[index];
    if (index > 0) yield ",";
    yield `${JSON.stringify(key)}:`;
    if ((key === "sources" || key === "tabs") && value && typeof value === "object") {
      yield "{";
      const nestedEntries = Object.entries(value as Record<string, unknown>);
      for (let nestedIndex = 0; nestedIndex < nestedEntries.length; nestedIndex += 1) {
        const [nestedKey, nestedValue] = nestedEntries[nestedIndex];
        if (nestedIndex > 0) yield ",";
        yield `${JSON.stringify(nestedKey)}:`;
        if (Array.isArray(nestedValue)) yield* jsonArrayChunks(nestedValue);
        else yield JSON.stringify(nestedValue);
      }
      yield "}";
    } else if (Array.isArray(value)) {
      yield* jsonArrayChunks(value);
    } else {
      yield JSON.stringify(value);
    }
  }
  yield "}";
}

async function uploadJsonChunks(
  path: string,
  chunks: Generator<string>,
): Promise<string> {
  const body = [...chunks].join("");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${PDF_BUCKET}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
        "x-upsert": "false",
      },
      body,
    },
  );
  if (!response.ok) {
    // A lost response after a successful upload must be safe to retry. Never
    // overwrite an immutable object; accept it only when its bytes match.
    if (response.status === 400 || response.status === 409) {
      const existing = await admin.storage.from(PDF_BUCKET).download(path);
      if (!existing.error && existing.data && await existing.data.text() === body) return path;
    }
    throw new Error(`artifact upload ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return path;
}

async function uploadBuildArtifact(artifact: ReportBuildArtifact): Promise<string> {
  const path = buildArtifactPath(artifact.run_id);
  return uploadJsonChunks(path, artifactJsonChunks(artifact));
}

async function uploadSourceSnapshot(
  runId: string,
  sourceKey: string,
  index: number,
  rows: Row[],
): Promise<string> {
  const path = sourceChunkArtifactPath(runId, sourceKey, index);
  return uploadJsonChunks(path, jsonArrayChunks(rows));
}

function* singleJsonChunk(value: unknown): Generator<string> {
  yield JSON.stringify(value);
}

async function downloadBuildArtifact(path: string): Promise<ReportBuildArtifact> {
  const { data, error } = await admin.storage.from(PDF_BUCKET).download(path);
  if (error || !data) throw new Error(`artifact download: ${error?.message ?? "sem dados"}`);
  return JSON.parse(await data.text()) as ReportBuildArtifact;
}

async function hydrateArtifactSources(
  artifact: ReportBuildArtifact,
): Promise<ReportBuildArtifact> {
  if (Object.keys(artifact.sources ?? {}).length > 0) return artifact;
  const snapshots = artifact.source_snapshots ?? {};
  const sources: Record<string, Row[]> = {};
  // Download one source at a time so hydration never multiplies peak memory.
  for (const [sourceKey, snapshot] of Object.entries(snapshots)) {
    const rows: Row[] = [];
    const paths = snapshot.artifact_paths?.length
      ? snapshot.artifact_paths
      : [snapshot.artifact_path];
    for (const path of paths) {
      const { data, error } = await admin.storage.from(PDF_BUCKET).download(path);
      if (error || !data) {
        throw new Error(
          `source snapshot ${sourceKey}: ${error?.message ?? "sem dados"}`,
        );
      }
      rows.push(...(JSON.parse(await data.text()) as Row[]));
    }
    sources[sourceKey] = rows;
  }
  artifact.sources = sources;
  return artifact;
}

/**
 * Confere que a planilha recebeu exatamente as abas que o deck vai ler.
 *
 * Antes de 08/09/2026 esta função conferia a contagem das 18 abas de origem
 * cruas contra o snapshot. Elas deixaram de ser escritas (ver
 * `artifactSheetTables`), então o que precisa ser garantido agora é o que de
 * fato sustenta os slides: toda aba publicada existe com a contagem esperada.
 */
async function validateStagedSourceTabs(artifact: ReportBuildArtifact) {
  const mismatches: Array<{ source_key: string; expected: number; actual: number }> = [];
  for (const [tab, rows] of Object.entries(artifactSheetTables(artifact))) {
    const expected = Math.max(0, rows.length - 1);
    const response = await googleFetch(
      `${SHEETS}/${SHEET_ID}/values/${encodeURIComponent(`${tab}!A:A`)}`,
    );
    const actual = Math.max(0, Number(response.values?.length ?? 0) - 1);
    if (actual !== expected) {
      mismatches.push({ source_key: tab, expected, actual });
    }
  }
  return mismatches;
}

async function persistValidations(runId: string, validations: ValidationResult[]) {
  const { error: deleteError } = await admin
    .from("report_validations")
    .delete()
    .eq("run_id", runId);
  if (deleteError) throw new Error(`report_validations delete: ${deleteError.message}`);
  if (!validations.length) return;
  const { error } = await admin.from("report_validations").insert(
    validations.map((item) => ({ run_id: runId, ...item })),
  );
  if (error) throw new Error(`report_validations insert: ${error.message}`);
}

async function persistBuild(
  input: Awaited<ReturnType<typeof loadInputs>>,
  artifact: ReportBuildArtifact,
  validations: ValidationResult[],
) {
  const sources = reportSourceRows(input);
  const sourceVersions = Object.entries(artifact.source_snapshots ?? {}).map(
    ([source_key, snapshot]) => ({
      run_id: input.runId,
      source_key,
      source_version: RELEASE_VERSIONS.source,
      native_cutoff: input.manifest.source_cutoffs[source_key] ?? null,
      row_count: snapshot.row_count,
      field_coverage: {},
      source_hash: snapshot.source_hash,
      artifact_path: null as string | null,
    }),
  );
  const sourceSnapshots: NonNullable<ReportBuildArtifact["source_snapshots"]> = {};
  for (const sourceVersion of sourceVersions) {
    const sourceKey = sourceVersion.source_key;
    const rows = sources[sourceKey] ?? [];
    const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
    const artifactPaths: string[] = [];
    for (let index = 0; index < Math.max(1, Math.ceil(rows.length / 500)); index += 1) {
      artifactPaths.push(await uploadSourceSnapshot(
        input.runId,
        sourceKey,
        index,
        rows.slice(index * 500, (index + 1) * 500),
      ));
    }
    const manifestPath = sourceArtifactPath(input.runId, sourceKey);
    await uploadJsonChunks(manifestPath, singleJsonChunk({
      source_key: sourceKey,
      row_count: sourceVersion.row_count,
      source_hash: sourceVersion.source_hash,
      fields,
      artifact_paths: artifactPaths,
    }));
    sourceVersion.artifact_path = manifestPath;
    sourceSnapshots[sourceKey] = {
      artifact_path: manifestPath,
      artifact_paths: artifactPaths,
      row_count: sourceVersion.row_count,
      source_hash: sourceVersion.source_hash,
      fields,
    };
  }
  const storedArtifact: ReportBuildArtifact = {
    ...artifact,
    sources: {},
    source_snapshots: sourceSnapshots,
  };
  const artifactPath = await uploadBuildArtifact(storedArtifact);
  const { error: sourceDeleteError } = await admin
    .from("report_run_sources")
    .delete()
    .eq("run_id", input.runId);
  if (sourceDeleteError) throw new Error(`report_run_sources delete: ${sourceDeleteError.message}`);
  if (sourceVersions.length) {
    const { error } = await admin.from("report_run_sources").insert(sourceVersions);
    if (error) throw new Error(`report_run_sources insert: ${error.message}`);
  }

  const { error: blueprintDeleteError } = await admin
    .from("report_slide_blueprints")
    .delete()
    .eq("run_id", input.runId);
  if (blueprintDeleteError) {
    throw new Error(`report_slide_blueprints delete: ${blueprintDeleteError.message}`);
  }
  if (artifact.slide_blueprints.length) {
    const { error } = await admin.from("report_slide_blueprints").insert(
      artifact.slide_blueprints.map((item) => ({
        run_id: input.runId,
        slide_instance_id: item.slide_instance_id,
        slide_code: item.slide_code,
        renderer_version: item.renderer_version,
        archetype: item.archetype,
        density: item.density,
        data_hash: item.data_hash,
        narrative_hash: item.narrative_hash,
        visual_hash: item.visual_hash,
        blueprint_hash: item.blueprint_hash,
        blueprint: item.blueprint,
      })),
    );
    if (error) throw new Error(`report_slide_blueprints insert: ${error.message}`);
  }
  await persistValidations(input.runId, validations);
  await setStatus(input.runId, "built", {
    source_version: artifact.versions.source,
    semantic_version: artifact.versions.semantic,
    spec_version: artifact.versions.spec,
    narrative_version: artifact.versions.narrative,
    renderer_version: artifact.versions.renderer,
    source_hash: artifact.source_hash,
    narrative_hash: artifact.narrative_hash,
    blueprint_hash: artifact.blueprint_hash,
    input_fingerprint: artifact.input_fingerprint,
    content_hash: artifact.content_hash,
    idempotency_key: artifact.idempotency_key,
    artifact_path: artifactPath,
    build_status: "built",
    certification_status: "pending",
    publication_status: "pending",
    built_at: artifact.built_at,
    publication_valid: false,
  });
  return artifactPath;
}

async function certifyStoredArtifact(runId: string, artifact: ReportBuildArtifact) {
  await hydrateArtifactSources(artifact);
  const validations = [...validateArtifact(artifact), ...await validateArtifactIntegrity(artifact)];
  await persistValidations(runId, validations);
  const certified = certificationPassed(validations);
  await setStatus(runId, certified ? "certified" : "rejected", {
    certification_status: certified ? "certified" : "rejected",
    certified_at: certified ? new Date().toISOString() : null,
    publication_valid: false,
    error_detail: certified
      ? null
      : "Build reprovado pelas validações de publicação.",
  });
  return { certified, validations };
}

async function publishStoredArtifact(
  runId: string,
  artifact: ReportBuildArtifact,
  kind: "release" | "rollback" = "release",
  rollbackOfPublicationId: string | null = null,
  reason: string | null = null,
  skipSheetWrite = false,
) {
  // All callers, including rollback and resume, must cross this boundary before
  // acquiring a publication lock or making any Google mutation.
  if (artifact.run_id !== runId) throw new Error("Artefato pertence a outro run.");
  await hydrateArtifactSources(artifact);
  const releaseChecks = [
    ...await validateArtifactIntegrity(artifact),
    ...validateArtifact(artifact),
  ];
  await persistValidations(runId, releaseChecks);
  if (!certificationPassed(releaseChecks)) {
    throw new Error("Publicação recusada: integridade ou contrato do artefato inválido.");
  }
  const lockKey = `report-live:${SLIDES_ID}`;
  const ownerToken = crypto.randomUUID();
  const { data: acquired, error: lockError } = await admin.rpc(
    "report_live_acquire_publication_lock",
    {
      p_lock_key: lockKey,
      p_run_id: runId,
      p_owner_token: ownerToken,
      p_ttl_seconds: 900,
    },
  );
  if (lockError || acquired !== true) {
    throw new Error(`Publicação concorrente em andamento: ${lockError?.message ?? "lock ocupado"}`);
  }
  const renewLock = async () => {
    const { data: renewed, error } = await admin.rpc(
      "report_live_renew_publication_lock",
      {
        p_lock_key: lockKey,
        p_owner_token: ownerToken,
        p_ttl_seconds: 900,
      },
    );
    if (error || renewed !== true) {
      throw new Error(`Lock de publicação expirou: ${error?.message ?? "renovação recusada"}`);
    }
    await setStatus(runId, "publishing", {
      publication_status: "publishing",
      publication_valid: false,
    });
  };

  let publicationId: string | null = null;
  let previousArtifact: ReportBuildArtifact | null = null;
  let targetsMutated = false;
  try {
    const { data: previous } = await admin
      .from("report_publications")
      .select("id,run_id,artifact_path,deck_structure_hash,slide_count")
      .eq("deck_id", SLIDES_ID)
      .eq("status", "published")
      .order("publication_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    previousArtifact = previous?.artifact_path
      ? await downloadBuildArtifact(String(previous.artifact_path)).catch(() => null)
      : null;
    const regressionValidations = validateRegression(artifact, previousArtifact);
    const regressionFailures = regressionValidations.filter((item) =>
      item.status === "failed" &&
      (item.severity === "blocking" || item.severity === "error")
    );
    const { data: regressionApproval } = regressionFailures.length
      ? await admin
        .from("report_approvals")
        .select("id,decision,reason")
        .eq("run_id", runId)
        .eq("approval_type", "regression_override")
        .eq("decision", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      : { data: null };
    let manualEditValidation: ValidationResult[] = [];
    let manualEditBlocked = false;
    if (previous?.deck_structure_hash) {
      const liveDeck = await inspectManagedDeckFingerprint();
      const fingerprintMismatch =
        liveDeck.deck_structure_hash !== String(previous.deck_structure_hash) ||
        (previous.slide_count != null &&
          liveDeck.managed_slide_count !== Number(previous.slide_count));
      const { data: manualEditApproval } = fingerprintMismatch
        ? await admin
          .from("report_approvals")
          .select("id,reason")
          .eq("run_id", runId)
          .eq("approval_type", "manual_edit_override")
          .eq("decision", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        : { data: null };
      manualEditBlocked = fingerprintMismatch && !manualEditApproval;
      manualEditValidation = [{
        validation_key: "deck.manual_edit_fingerprint",
        scope: "run",
        slide_instance_id: null,
        severity: fingerprintMismatch ? "blocking" : "info",
        status: manualEditBlocked ? "failed" : "passed",
        message: fingerprintMismatch
          ? manualEditApproval
            ? "Mudança manual no deck vivo aprovada explicitamente."
            : "O deck vivo diverge da última publicação certificada."
          : "O deck vivo corresponde à última publicação certificada.",
        evidence: {
          expected_hash: previous.deck_structure_hash,
          observed_hash: liveDeck.deck_structure_hash,
          expected_slide_count: previous.slide_count,
          observed_slide_count: liveDeck.managed_slide_count,
          approval_id: manualEditApproval?.id ?? null,
        },
        validator_version: RELEASE_VERSIONS.validator,
      }];
    }
    const publicationValidations = [
      ...validateArtifact(artifact),
      ...regressionValidations,
      ...manualEditValidation,
      ...(regressionApproval
        ? [{
          validation_key: "regression.override_approved",
          scope: "run" as const,
          slide_instance_id: null,
          severity: "warning" as const,
          status: "passed" as const,
          message: "Regressão material aprovada explicitamente por humano.",
          evidence: {
            approval_id: regressionApproval.id,
            reason: regressionApproval.reason,
          },
          validator_version: RELEASE_VERSIONS.validator,
        }]
        : []),
    ];
    await persistValidations(runId, publicationValidations);
    if (regressionFailures.length && !regressionApproval) {
      throw new Error(
        `Regressão material requer aprovação regression_override: ${
          regressionFailures.map((item) => item.validation_key).join(", ")
        }`,
      );
    }
    if (manualEditBlocked) {
      throw new Error("Deck vivo alterado manualmente; aprovação manual_edit_override é obrigatória.");
    }
    const diffSummary = diffBlueprints(
      artifact.slide_blueprints,
      previousArtifact?.slide_blueprints ?? [],
    );
    const { data: publication, error: publicationError } = await admin
      .from("report_publications")
      .insert({
        run_id: runId,
        deck_id: SLIDES_ID,
        sheet_id: SHEET_ID,
        kind,
        status: "publishing",
        previous_publication_id: previous?.id ?? null,
        rollback_of_publication_id: rollbackOfPublicationId,
        artifact_path: buildArtifactPath(runId),
        blueprint_hash: artifact.blueprint_hash,
        content_hash: artifact.content_hash,
        diff_summary: diffSummary,
        reason,
      })
      .select("id,publication_version")
      .single();
    if (publicationError || !publication) {
      throw new Error(`report_publications insert: ${publicationError?.message ?? "sem retorno"}`);
    }
    publicationId = String(publication.id);
    await setStatus(runId, "publishing", {
      publication_status: "publishing",
      publication_valid: false,
    });

    const backup = await capturePublicationEvidence(publicationId, artifact);
    if (!backup.recovery_compiled) throw new Error(`Publicação bloqueada: ${backup.recovery_error}`);
    const { error: backupRecordError } = await admin.from('report_publications')
      .update({ diff_summary: { ...diffSummary, before_write: backup } }).eq('id', publicationId);
    if (backupRecordError) throw new Error(`Registro do backup: ${backupRecordError.message}`);
    targetsMutated = true;
    const rowsWritten = skipSheetWrite
      ? artifactRowCount(artifact)
      : await writeArtifactSnapshot(artifact);
    await renewLock();
    await verifyArtifactSheet(artifact);
    const structure = await setupStructure(
      runId,
      tableRows(artifact.tabs.VIEW_REGISTRY),
    );
    await renewLock();
    const slidesInfo = await updateSlides(artifact.narratives, runId);
    const publishedDeck = await inspectManagedDeckFingerprint();
    const memoryPayload = {
      run_id: runId,
      report_type: "midia_paga_crm_mensal",
      ciclo: artifact.period_start.slice(0, 7),
      narrativa: artifact.narratives.c1 ?? "",
      recomendacoes: artifact.action_candidates,
    };
    const { error: historyError } = await admin.from("report_run_memory").upsert(
      memoryPayload,
      { onConflict: "run_id", ignoreDuplicates: true },
    );
    if (historyError) throw new Error(`report_run_memory: ${historyError.message}`);
    await admin.from("report_memory").upsert(
      memoryPayload,
      { onConflict: "report_type,ciclo" },
    );
    const expectedSlideCount = artifact.slides.filter((slide) =>
      slide.run_eligibility !== "omitir_bloqueado"
    ).length;
    if (publishedDeck.managed_slide_count !== expectedSlideCount) {
      throw new Error(
        `Deck possui ${publishedDeck.managed_slide_count} slide(s) gerenciado(s), ` +
          `mas ${expectedSlideCount} eram esperados.`,
      );
    }
    await renewLock();
    const pdfExport = await exportDeckPdf(runId, publicationId, expectedSlideCount);
    if ((pdfExport as Row).ok !== true) {
      throw new Error(`PDF de QA não foi exportado: ${String((pdfExport as Row).error ?? "erro desconhecido")}`);
    }
    const { data: committed, error: commitError } = await admin.rpc(
      "report_live_commit_publication",
      {
        p_publication_id: publicationId,
        p_run_id: runId,
        p_kind: kind,
        p_pdf_path: (pdfExport as Row).path ?? null,
        p_slide_count: expectedSlideCount,
        p_pdf_page_count: (pdfExport as Row).page_count ?? null,
        p_deck_structure_hash: publishedDeck.deck_structure_hash,
        p_rows_inserted: rowsWritten,
        p_sheet_url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
        p_slides_url: `https://docs.google.com/presentation/d/${SLIDES_ID}/edit`,
      },
    );
    let commitConfirmed = committed === true;
    if (!commitConfirmed) {
      const { data: pointer } = await admin
        .from("report_live_pointer")
        .select("current_publication_id")
        .eq("id", "live")
        .maybeSingle();
      commitConfirmed = String(pointer?.current_publication_id ?? "") === publicationId;
    }
    if (!commitConfirmed) {
      throw new Error(`commit de publicação: ${commitError?.message ?? "não confirmado"}`);
    }
    return { publication, diffSummary, rowsWritten, structure, slidesInfo, pdfExport };
  } catch (error) {
    if (targetsMutated && previousArtifact) {
      try {
        await writeArtifactSnapshot(previousArtifact);
        await setupStructure(
          previousArtifact.run_id,
          tableRows(previousArtifact.tabs.VIEW_REGISTRY),
        );
        await updateSlides(previousArtifact.narratives, previousArtifact.run_id);
      } catch (restoreError) {
        console.error("Falha ao restaurar o target anterior", restoreError);
      }
    }
    if (publicationId) {
      await admin.from("report_publications").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        reason: String((error as Error).message).slice(0, 900),
      }).eq("id", publicationId);
    }
    await setStatus(runId, "error", {
      publication_status: "failed",
      publication_valid: false,
      error_detail: String((error as Error).message).slice(0, 900),
    });
    throw error;
  } finally {
    await admin.rpc("report_live_release_publication_lock", {
      p_lock_key: lockKey,
      p_owner_token: ownerToken,
    });
  }
}

async function setupStructure(
  runId: string,
  registry?: Row[],
  allowLegacySheetRegistry = false,
  sheetTitleMap: Record<string, string> = {},
  previews: Record<string, string> = {},
) {
  if (!SERVICE_KEY) {
    return { ok: false, skipped: true, reason: "service_key_unavailable" };
  }
  const response = await fetch(`${SUPABASE_URL}/functions/v1/report-sync-v4-setup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "setup_v1",
      run_id: runId,
      registry,
      allow_legacy_sheet_registry: allowLegacySheetRegistry,
      sheet_title_map: sheetTitleMap,
      previews,
    }),
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

async function updateSlides(texts: Record<string, string>, runId: string) {
  const presentation = await googleFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(objectId,pageElements(objectId,title,sheetsChart,shape(text(textElements(textRun(content))))))`,
  );
  const chartIds: string[] = [];
  const shapeByPlaceholder: Record<string, string> = {};
  for (const slide of publicationSlides(presentation.slides ?? [], await reportLiveReleaseKey(runId)) as Row[]) {
    for (const element of (slide.pageElements ?? []) as Row[]) {
      if (element.sheetsChart) {
        chartIds.push(String(element.objectId));
        continue;
      }
      const title = String(element.title ?? "");
      if (title.startsWith("ph:")) shapeByPlaceholder[title.slice(3)] = String(element.objectId);
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

async function readDeckGenerationState() {
  return await googleFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(objectId,slideProperties(isSkipped),pageElements(objectId,title,sheetsChart(chartId,spreadsheetId),shape(text(textElements(textRun(content))))))`,
  );
}

async function verifyStagedGeneration(
  runId: string,
  expectedSlideCount: number,
  generationManifest: Row = {},
) {
  const releaseKey = await reportLiveReleaseKey(runId);
  const presentation = await readDeckGenerationState();
  const target = publicationSlides(presentation.slides ?? [], releaseKey) as Row[];
  const visible = target.filter((slide) => (slide.slideProperties as Row)?.isSkipped !== true);
  if (target.length !== expectedSlideCount) {
    throw new Error(`Geração contém ${target.length} slide(s); esperado: ${expectedSlideCount}.`);
  }
  if (visible.length) throw new Error("Geração de staging ficou visível antes da ativação.");
  const missingNarrative = target.filter((slide) =>
    !((slide.pageElements ?? []) as Row[]).some((element) =>
      String(element.title ?? "").startsWith("ph:") &&
      ((((element.shape as Row)?.text as Row)?.textElements ?? []) as Row[])
        .some((part) => String((part.textRun as Row)?.content ?? "").trim().length > 0)
    )
  );
  if (missingNarrative.length) throw new Error(`Narrativa ausente em ${missingNarrative.length} slide(s).`);
  const chartManifest = Array.isArray(generationManifest.chart_manifest)
    ? generationManifest.chart_manifest as Row[]
    : [];
  const expectedElements = Array.isArray(generationManifest.expected_element_ids)
    ? generationManifest.expected_element_ids as Row[]
    : [];
  const targetById = new Map(target.map((slide) => [String(slide.objectId), slide]));
  for (const expected of expectedElements) {
    const slide = targetById.get(String(expected.page_id ?? ""));
    const actualIds = new Set(((slide?.pageElements ?? []) as Row[]).map((element) => String(element.objectId ?? "")));
    const missing = (Array.isArray(expected.element_ids) ? expected.element_ids : [])
      .map(String).filter((elementId) => !actualIds.has(elementId));
    if (missing.length) {
      throw new Error(`Elementos editoriais ausentes em ${String(expected.slide_instance_id)}: ${missing.join(", ")}.`);
    }
  }
  const chartBySlide = new Map(chartManifest.map((item) => [String(item.slide_instance_id), item]));
  let linkedChartCount = 0;
  for (const expected of expectedElements) {
    const slide = targetById.get(String(expected.page_id ?? ""));
    const linked = ((slide?.pageElements ?? []) as Row[]).filter((element) => Boolean(element.sheetsChart));
    linkedChartCount += linked.length;
    if (linked.length > 1) {
      throw new Error(`Teto editorial violado: ${String(expected.slide_instance_id)} tem ${linked.length} gráficos vinculados.`);
    }
    const planned = chartBySlide.get(String(expected.slide_instance_id));
    if (planned && linked.length !== Number(planned.expected_chart_count ?? 1)) {
      throw new Error(`Gráfico obrigatório ausente em ${String(expected.slide_instance_id)}.`);
    }
    if (linked.length && !planned) {
      throw new Error(`Gráfico sem manifesto de verificação em ${String(expected.slide_instance_id)}.`);
    }
    if (planned && linked.length === 1) {
      const chart = linked[0].sheetsChart as Row;
      if (Number(chart.chartId) !== Number(planned.chart_id) || String(chart.spreadsheetId) !== SHEET_ID) {
        throw new Error(`Vínculo do gráfico diverge do manifesto em ${String(expected.slide_instance_id)}.`);
      }
    }
  }
  if (chartManifest.length) {
    const sheetMetadata = await googleFetch(`${SHEETS}/${SHEET_ID}?fields=sheets(properties(title),charts(chartId))`);
    const chartsBySheet = new Map<string, Set<number>>((sheetMetadata.sheets ?? []).map((sheet: Row) => [
      String((sheet.properties as Row)?.title ?? ""),
      new Set<number>(((sheet.charts ?? []) as Row[]).map((chart) => Number(chart.chartId))),
    ]));
    const orphaned = chartManifest.filter((item) =>
      !chartsBySheet.get(String(item.physical_sheet_title ?? ""))?.has(Number(item.chart_id))
    );
    if (orphaned.length) throw new Error(`Fonte de ${orphaned.length} gráfico(s) não existe mais no Sheets.`);
  }
  return {
    verified: true,
    release_key: releaseKey,
    staged_slide_ids: target.map((slide) => String(slide.objectId)),
    slide_count: target.length,
    linked_chart_count: linkedChartCount,
    verified_chart_count: chartManifest.length,
  };
}

async function activateGeneration(runId: string) {
  const releaseKey = await reportLiveReleaseKey(runId);
  const before = await readDeckGenerationState();
  const previousVisibleIds = (before.slides ?? [])
    .filter((slide: Row) => isManagedGeneratedSlide(String(slide.objectId ?? "")) &&
      (slide.slideProperties as Row)?.isSkipped !== true)
    .map((slide: Row) => String(slide.objectId));
  const activation = buildSlideActivationRequests(before.slides ?? [], releaseKey);
  if (activation.requests.length) {
    await googleFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests: activation.requests }),
    });
  }
  const after = await readDeckGenerationState();
  const verification = verifySlideActivation(after.slides ?? [], releaseKey);
  if (!verification.verified) {
    throw new Error(`Ativação da geração não foi confirmada: ${JSON.stringify(verification)}`);
  }
  return {
    ...verification,
    verified: true,
    release_key: releaseKey,
    activated_slide_ids: activation.targetIds,
    previous_visible_ids: previousVisibleIds,
    visibility_requests: activation.requests.length,
  };
}

async function restoreGeneratedVisibility(visibleIds: string[]) {
  const before = await readDeckGenerationState();
  const requests = buildSlideVisibilityRestoreRequests(before.slides ?? [], visibleIds);
  if (requests.length) {
    await googleFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }
  const after = await readDeckGenerationState();
  const actualVisible = (after.slides ?? [])
    .filter((slide: Row) => isManagedGeneratedSlide(String(slide.objectId ?? "")) &&
      (slide.slideProperties as Row)?.isSkipped !== true)
    .map((slide: Row) => String(slide.objectId)).sort();
  const expected = [...visibleIds].sort();
  if (JSON.stringify(actualVisible) !== JSON.stringify(expected)) {
    throw new Error("Restauração da visibilidade anterior não foi confirmada.");
  }
  return { verified: true, visible_ids: actualVisible };
}

async function inspectGenerationDeckFingerprint(runId: string) {
  const releaseKey = await reportLiveReleaseKey(runId);
  const presentation = await readDeckGenerationState();
  const target = publicationSlides(presentation.slides ?? [], releaseKey) as Row[];
  const normalized = target.map((slide) => ({
    object_id: String(slide.objectId ?? ""),
    skipped: (slide.slideProperties as Row)?.isSkipped === true,
    elements: ((slide.pageElements ?? []) as Row[]).map((element) => ({
      object_id: String(element.objectId ?? ""),
      title: String(element.title ?? ""),
      chart_id: (element.sheetsChart as Row)?.chartId ?? null,
      spreadsheet_id: (element.sheetsChart as Row)?.spreadsheetId ?? null,
      text: ((((element.shape as Row)?.text as Row)?.textElements ?? []) as Row[])
        .map((part) => String((part.textRun as Row)?.content ?? "")).join(""),
    })),
  }));
  return {
    managed_slide_count: normalized.length,
    deck_structure_hash: await sha256(normalized),
    visible: normalized.filter((slide) => !slide.skipped).length,
  };
}

async function inspectManagedDeckFingerprint() {
  const presentation = await googleFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(objectId,pageElements(objectId,title,sheetsChart(chartId,spreadsheetId),shape(text(textElements(textRun(content))))))`,
  );
  const managedSlides = (presentation.slides ?? [])
    .filter((slide: any) => {
      const objectId = String(slide.objectId ?? "");
      return objectId.startsWith("rlv1s_") || objectId.startsWith("rlv2s_");
    })
    .map((slide: any) => ({
      object_id: String(slide.objectId ?? ""),
      elements: (slide.pageElements ?? []).map((element: any) => ({
        object_id: String(element.objectId ?? ""),
        title: String(element.title ?? ""),
        chart_id: element.sheetsChart?.chartId ?? null,
        spreadsheet_id: element.sheetsChart?.spreadsheetId ?? null,
        text: (element.shape?.text?.textElements ?? [])
          .map((part: any) => String(part.textRun?.content ?? ""))
          .join(""),
      })),
    }));
  return {
    managed_slide_count: managedSlides.length,
    deck_structure_hash: await sha256(managedSlides),
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
  const percentage = parsed * 100;
  const digits = Math.abs(percentage) > 0 && Math.abs(percentage) < 0.1 ? 3 : 1;
  return `${fmtNumber(percentage, digits)}%`;
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
  const scorecard = tableRows(built.tabs.VIEW_SCORECARD_NATIVE ?? built.tabs.VIEW_SCORECARD_INTEGRATED);
  const coverage = tableRows(built.tabs.VIEW_COVERAGE_COMPARABILITY);
  const templates = tableRows(built.tabs.VIEW_TEMPLATE_COVERAGE);
  const router = tableRows(built.tabs.VIEW_PARTNER_ROUTER);
  const actionQueue = tableRows(built.tabs.VIEW_ACTION_QUEUE);
  const outcomes = tableRows(built.tabs.VIEW_ACTION_OUTCOMES);
  const mediaMix = tableRows(built.tabs.VIEW_MEDIA_MIX);
  const b2c = tableRows(built.tabs.VIEW_B2C_PARALLEL_FUNNELS);
  const fieldCoverage = tableRows(built.tabs.VIEW_FIELD_COVERAGE);
  const editorialRulers = tableRows(built.tabs.VIEW_EDITORIAL_RULERS);
  const editorialLayouts = tableRows(built.tabs.VIEW_EDITORIAL_LAYOUTS);
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
          `B2C ${sourceCutoffs.b2c ?? "indisponível"}.\n\n${commonLimit}`;
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
        const cac = metricValue(sourceRows, "cac_crm");
        body = `${slide.fallback_applied ? "Resultados por janela nativa; comparação integrada indisponível.\n" : ""}` +
          `Cartões CRM: ${fmtNumber(metricValue(sourceRows, "cartoes_crm"))}.\n` +
          `CAC CRM: ${fmtCurrency(cac)}${
            cac === null ? " (custo ausente; não convertido em zero)" : ""
          }.\n` +
          `Investimento de mídia: ${fmtCurrency(metricValue(sourceRows, "investimento_midia"))}.\n` +
          `Conversão CRM/base: ${fmtPercent(metricValue(sourceRows, "conversao_crm_base"))}.`;
        break;
      }
      case "C4": {
        const pacing = tableRows(built.tabs.VIEW_PACING_ISODAYS);
        const pacingStart = String(pacing[0]?.previous_equivalent_date ?? "");
        const pacingEnd = String(pacing.at(-1)?.previous_equivalent_date ?? "");
        body = `Comparação primária: ${pacingStart.split("-").reverse().join("/")}–${
          pacingEnd.split("-").reverse().join("/")
        }, nos mesmos dias corridos do mês anterior.\n` +
          `A linha sobrepõe realizado e período equivalente por dia corrido. ` +
          `Meta só aparece quando certificada; sem certificação, não há terceira série.`;
        break;
      }
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
        const rulers = editorialRulers.filter((row) => row.slide_instance_id === slide.slide_instance_id);
        body = rulers.length
          ? `${slide.partner}: ${rulers.map((row) =>
            `${row.metric_label} ${row.value_text}${row.delta_text ? ` (${row.delta_text})` : ""} · ${row.verdict_text}`
          ).join("; ")}.\n\nValores, faixas e vereditos vêm do snapshot mensal canônico.`
          : `${slide.partner}: régua mensal indisponível neste snapshot. ${commonLimit}`;
        break;
      }
      case "P4": {
        const rulers = editorialRulers.filter((row) => row.slide_instance_id === slide.slide_instance_id);
        const layout = editorialLayouts.find((row) => row.slide_instance_id === slide.slide_instance_id);
        body = rulers.length
          ? `${layout?.layout === "volume_conversao_final" ? "Leitura de volume e conversão final" : "Funil por taxas"}:\n` +
            `${rulers.map((row) => `${row.metric_label} ${row.value_text} · ${row.verdict_text}`).join("\n")}\n\n` +
            `${layout?.support_text ?? "Ausência permanece explícita; zero observado não é missing."}`
          : "Régua mensal indisponível neste snapshot; o slide não inventa uma conversão substituta.";
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
      case "M3": {
        const pending = sourceRows.filter((row) => row.identity_status === "alias_pending").length;
        const certified = sourceRows.length - pending;
        body = `${sourceRows.length} campanhas ranqueadas: ${certified} com ID de origem e ${pending} com alias exato pendente.\n\n` +
          `Aliases pendentes permanecem sinalizados e nunca são fundidos por similaridade textual.`;
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
        const unmapped = fieldCoverage.filter((row) => row.status === "unmapped").length;
        body = `${fieldCoverage.length} campos auditados: ${consumed} consumidos, ${privacy} excluídos por privacidade e ${unmapped} ainda sem consumidor ou exclusão certificada.\n\n` +
          `A cobertura só é completa quando cada campo tem consumidor explícito ou exclusão justificada.`;
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
    phase: "build" | "full";
  },
) {
  const input = normalizeSnapshotManifest(
    await loadInputs(runId, profile, periodStart, periodEnd),
  ) as Awaited<ReturnType<typeof loadInputs>>;
  const built = buildReport(input);
  await setStatus(runId, "building", {
    build_status: "building",
    publication_valid: false,
  });
  const texts = options.texts ??
    (options.skipLlm
      ? deterministicNarrative(input, built)
      : await generateNarrative(runId, profile, input.manifest, built));
  const artifact = await buildArtifact(input, built, texts);
  const { data: duplicate } = await admin
    .from("report_runs")
    .select("id,status,artifact_path")
    .eq("idempotency_key", artifact.idempotency_key)
    .neq("id", runId)
    .limit(1)
    .maybeSingle();
  if (duplicate) {
    await setStatus(runId, "superseded", {
      build_status: "superseded",
      certification_status: "superseded",
      publication_status: "superseded",
      publication_valid: false,
      error_detail: `Build idempotente já existe no run ${duplicate.id}.`,
    });
    console.log("report-live duplicate build", JSON.stringify({
      runId,
      canonicalRunId: duplicate.id,
      idempotencyKey: artifact.idempotency_key,
    }));
    return;
  }

  const validations = validateArtifact(artifact);
  await saveGeneratedState(runId, profile, input.manifest, built);
  await persistBuild(input, artifact, validations);
  if (options.phase === "build") {
    await setStatus(runId, "built", { active_run: false });
    console.log("report-live build completed", JSON.stringify({
      runId,
      profile,
      blueprintHash: artifact.blueprint_hash,
      validations: validations.length,
    }));
    return;
  }

  const certification = await certifyStoredArtifact(runId, artifact);
  if (!certification.certified) {
    console.log("report-live certification rejected", JSON.stringify({
      runId,
      failures: certification.validations
        .filter((item) => item.status === "failed")
        .map((item) => item.validation_key),
    }));
    return;
  }
  const publication = await publishStoredArtifact(runId, artifact);
  console.log("report-live release completed", JSON.stringify({
    runId,
    profile,
    publicationVersion: publication.publication.publication_version,
    blueprintHash: artifact.blueprint_hash,
    quality: input.manifest.quality_status,
  }));
}

async function processBuildStep(requestedRunId?: string) {
  const claimed = await admin.rpc("report_live_claim_build", { p_run_id: requestedRunId ?? null });
  if (claimed.error) throw new Error(claimed.error.message);
  const job = claimed.data as Row | null;
  if (!job) return { idle: true };
  const runId = String(job.run_id);
  const finish = async (next: string, checkpoint?: Row) => {
    const result = await admin.rpc("report_live_finish_build_step", {
      p_run_id: runId, p_token: job.lease_token, p_next: next, p_checkpoint: checkpoint ?? null,
    });
    if (result.error) throw new Error(result.error.message);
  };
  try {
    if (job.phase === "refresh") {
      await setStatus(runId, "building", { build_status: "refreshing_sources" });
      const refreshError = await refreshMediaActionsView();
      if (refreshError) throw new Error(`Snapshot não capturado: refresh falhou: ${refreshError}`);
      await finish("capture");
    } else if (job.phase === "capture") {
      const captured = await admin.rpc("report_live_capture_inputs", { p_run_id: runId });
      if (captured.error) throw new Error(captured.error.message);
      await finish("calculate");
    } else {
      const frozen = await admin.from("report_frozen_inputs").select("inputs").eq("run_id", runId).single();
      if (frozen.error || !frozen.data) throw new Error("Snapshot imutável indisponível.");
      const input = normalizeSnapshotManifest(frozen.data.inputs as Awaited<ReturnType<typeof loadInputs>>) as Awaited<ReturnType<typeof loadInputs>>;
      const options = (job.options ?? {}) as Row;
      if (job.phase === "calculate") {
        const built = buildReport(input);
        const texts = options.texts as Record<string, string> | undefined;
        const narratives = texts ?? deterministicNarrative(input, built);
        const artifact = await buildArtifact(input, built, narratives);
        await finish("persist", { artifact: { ...artifact, sources: {} } });
      } else {
        const saved = await admin.from("report_build_jobs").select("checkpoint").eq("run_id", runId).single();
        if (saved.error) throw new Error(saved.error.message);
        const artifact = saved.data?.checkpoint?.artifact as ReportBuildArtifact;
        if (!artifact || artifact.run_id !== runId) throw new Error("Checkpoint incompatível.");
        if (job.phase === "persist") {
          const duplicate = await admin.from("report_runs").select("id").eq("idempotency_key", artifact.idempotency_key).neq("id", runId).maybeSingle();
          if (duplicate.error) throw new Error(duplicate.error.message);
          if (duplicate.data) {
            await setStatus(runId, "superseded", { superseded_by: duplicate.data.id, build_status: "superseded" });
            await finish("done");
          } else {
            const built = { tabs: artifact.tabs, slides: artifact.slides, actionCandidates: artifact.action_candidates,
              evaluatedOutcomes: [], partnerModes: artifact.partner_modes,
              previousPeriod: artifact.previous_period, fieldCoverage: artifact.field_coverage };
            await saveGeneratedState(runId, input.profile, input.manifest, built);
            await persistBuild(input, artifact, validateArtifact(artifact));
            await finish("certify");
          }
        } else if (job.phase === "certify") {
          const stored = await downloadBuildArtifact(buildArtifactPath(runId));
          await hydrateArtifactSources(stored);
          const certification = await certifyStoredArtifact(runId, stored);
          await setStatus(runId, certification.certified ? "certified" : "rejected", { active_run: false });
          if (certification.certified && options.auto_publish === true) {
            await enqueuePublication(
              runId,
              stored,
              options.requester_id ? String(options.requester_id) : null,
            );
          }
          await finish("done");
        } else throw new Error(`Etapa desconhecida: ${job.phase}`);
      }
    }
    return { run_id: runId, completed_phase: job.phase };
  } catch (error) {
    // The database lease/checkpoint survives termination of this invocation.
    const detail = String((error as Error).message).slice(0, 900);
    await admin.from("report_build_jobs").update({ last_error: detail, lease_until: new Date().toISOString() })
      .eq("run_id", runId).eq("lease_token", job.lease_token);
    throw error;
  }
}

async function enqueuePublication(
  runId: string,
  artifact: ReportBuildArtifact,
  publishedBy: string | null,
  kind: "release" | "rollback" = "release",
  rollbackOfPublicationId: string | null = null,
  reason: string | null = null,
) {
  if (artifact.run_id !== runId) throw new Error("Artefato pertence a outro run.");
  await hydrateArtifactSources(artifact);
  const checks = [...await validateArtifactIntegrity(artifact), ...validateArtifact(artifact)];
  await persistValidations(runId, checks);
  if (!certificationPassed(checks)) throw new Error("Publicação recusada: artefato inválido.");

  const { data: run, error: runError } = await admin.from("report_runs")
    .select("id,artifact_path,certification_status").eq("id", runId).single();
  if (runError || !run?.artifact_path || run.certification_status !== "certified") {
    throw new Error(runError?.message ?? "Run não certificado.");
  }
  const { data: previous, error: previousError } = await admin.from("report_publications")
    .select("id,run_id,artifact_path,deck_structure_hash,slide_count,slide_generation")
    .eq("deck_id", SLIDES_ID).eq("status", "published")
    .order("publication_version", { ascending: false }).limit(1).maybeSingle();
  if (previousError) throw new Error(previousError.message);
  const previousArtifact = previous?.artifact_path
    ? await downloadBuildArtifact(String(previous.artifact_path)).catch(() => null)
    : null;
  const regression = validateRegression(artifact, previousArtifact);
  const regressionFailures = regression.filter((item) =>
    item.status === "failed" && (item.severity === "blocking" || item.severity === "error")
  );
  let regressionApproval: Row | null = null;
  if (regressionFailures.length) {
    const approval = await admin.from("report_approvals").select("id,reason")
      .eq("run_id", runId).eq("approval_type", "regression_override")
      .eq("decision", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (approval.error) throw new Error(approval.error.message);
    regressionApproval = approval.data as Row | null;
    if (!regressionApproval) {
      throw new Error(`Regressão material requer aprovação: ${regressionFailures.map((item) => item.validation_key).join(", ")}`);
    }
  }

  if (previous?.deck_structure_hash && previous?.slide_generation) {
    const observed = await inspectGenerationDeckFingerprint(String(previous.run_id));
    const differs = observed.deck_structure_hash !== String(previous.deck_structure_hash) ||
      observed.managed_slide_count !== Number(previous.slide_count);
    if (differs) {
      const approval = await admin.from("report_approvals").select("id")
        .eq("run_id", runId).eq("approval_type", "manual_edit_override")
        .eq("decision", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (approval.error) throw new Error(approval.error.message);
      if (!approval.data) throw new Error("Deck vivo diverge da publicação ativa; aprovação manual_edit_override é obrigatória.");
    }
  }

  const diffSummary = {
    ...diffBlueprints(artifact.slide_blueprints, previousArtifact?.slide_blueprints ?? []),
    regression_override_id: regressionApproval?.id ?? null,
  };
  const releaseKey = await reportLiveReleaseKey(runId);
  const queued = await admin.rpc("report_live_enqueue_publication", {
    p_run_id: runId,
    p_deck_id: SLIDES_ID,
    p_sheet_id: SHEET_ID,
    p_artifact_path: String(run.artifact_path),
    p_blueprint_hash: artifact.blueprint_hash,
    p_content_hash: artifact.content_hash,
    p_sheet_namespace: `g_${releaseKey}`,
    p_slide_generation: releaseKey,
    p_diff_summary: diffSummary,
    p_kind: kind,
    p_rollback_of_publication_id: rollbackOfPublicationId,
    p_reason: reason,
    p_published_by: publishedBy,
  });
  if (queued.error || !queued.data) throw new Error(queued.error?.message ?? "Publicação não enfileirada.");
  return queued.data as Row;
}

async function processPublicationStep(publicationId: string) {
  const claimed = await admin.rpc("report_live_claim_publication_step", { p_id: publicationId });
  if (claimed.error) throw new Error(claimed.error.message);
  const claimedJob = claimed.data as Row | null;
  if (!claimedJob) return { idle: true, publication_id: publicationId };
  const runId = String(claimedJob.run_id);
  const leaseToken = String(claimedJob.lease_token);
  const { data: publication, error: publicationError } = await admin.from("report_publications")
    .select("*").eq("id", publicationId).single();
  if (publicationError || !publication) throw new Error(publicationError?.message ?? "Publicação ausente.");
  const artifact = await downloadBuildArtifact(String(publication.artifact_path));
  // Publication consumes the immutable derived artifact. Raw snapshots were
  // already checked during build certification and are not needed for Sheets,
  // Slides, activation, PDF, or commit. Rehydrating them here made every small
  // replay depend on all source chunks and could exhaust the worker lease.
  const generation = await artifactGeneration(artifact);
  const expectedSlideCount = artifact.slides.filter((slide) =>
    slide.run_eligibility !== "omitir_bloqueado"
  ).length;
  const job: PublicationJob = {
    id: publicationId,
    phase: String(claimedJob.phase) as PublicationPhase,
    receipts: (claimedJob.receipts ?? {}) as PublicationJob["receipts"],
  };
  const activationState: { receipt?: PublicationReceipt } = {};

  const updateManifest = async (patch: Row) => {
    const next = { ...((publication.generation_manifest ?? {}) as Row), ...patch };
    const updated = await admin.from("report_publications")
      .update({ generation_manifest: next }).eq("id", publicationId);
    if (updated.error) throw new Error(updated.error.message);
    publication.generation_manifest = next;
  };
  const assertOwnership = async () => {
    const ownership = await admin.rpc("report_live_assert_publication_owner", {
      p_id: publicationId, p_token: leaseToken,
    });
    if (ownership.error || ownership.data !== true) throw new Error("Lease de publicação perdido.");
  };

  try {
    const result = await advancePublication(job, {
      assertOwnership: async () => await assertOwnership(),
      effect: async (phase) => {
        if (phase === "backup") {
          const backup = await capturePublicationEvidence(publicationId, artifact);
          if (!backup.recovery_compiled) throw new Error(`Publicação bloqueada: ${backup.recovery_error}`);
          const diff = { ...((publication.diff_summary ?? {}) as Row), before_write: backup };
          const saved = await admin.from("report_publications").update({ diff_summary: diff }).eq("id", publicationId);
          if (saved.error) throw new Error(saved.error.message);
          return { ...backup, verified: true };
        }
        if (phase === "sheets") {
          const written = await writeArtifactGeneration(artifact);
          await updateManifest({ sheet_title_map: written.titleMap, sheet_entries: written.entries });
          return { verified: true, rows_written: written.rowsWritten, tables: written.entries.length,
            sheet_title_map: written.titleMap };
        }
        if (phase === "verify_sheets") {
          return await verifyArtifactSheet(artifact, generation.titleMap);
        }
        if (phase === "slides") {
          const structure = await setupStructure(
            runId,
            tableRows(artifact.tabs.VIEW_REGISTRY),
            false,
            generation.titleMap,
            artifactTablePreviews(artifact),
          );
          if (structure.staged_skipped !== true) throw new Error("Renderer não confirmou staging invisível.");
          await updateManifest({ staged_slide_ids: structure.staged_slide_ids ?? [],
            previous_managed_slides: structure.previous_managed_slides ?? [],
            chart_manifest: structure.chart_manifest ?? [],
            expected_element_ids: structure.expected_element_ids ?? [] });
          return { verified: true, ...structure };
        }
        if (phase === "narrative") {
          return { verified: true, ...(await updateSlides(artifact.narratives, runId)) };
        }
        if (phase === "verify_slides") {
          return await verifyStagedGeneration(
            runId,
            expectedSlideCount,
            (publication.generation_manifest ?? {}) as Row,
          );
        }
        if (phase === "activate") {
          activationState.receipt = await activateGeneration(runId);
          const activated = await admin.from("report_publications").update({
            google_state: "active", activated_at: new Date().toISOString(),
          }).eq("id", publicationId);
          if (activated.error) throw new Error(activated.error.message);
          return activationState.receipt;
        }
        if (phase === "pdf") {
          const exported = await exportDeckPdf(runId, publicationId, expectedSlideCount);
          if ((exported as Row).ok !== true) throw new Error(String((exported as Row).error ?? "PDF não exportado."));
          return { verified: true, ...(exported as Row) };
        }
        if (phase === "commit") {
          const deck = await inspectGenerationDeckFingerprint(runId);
          if (deck.visible !== expectedSlideCount) throw new Error("Geração ativa não corresponde ao artefato.");
          const pdf = job.receipts.pdf ?? {};
          const sheets = job.receipts.sheets ?? {};
          const committed = await admin.rpc("report_live_commit_publication", {
            p_publication_id: publicationId,
            p_run_id: runId,
            p_kind: publication.kind,
            p_pdf_path: pdf.path ?? null,
            p_slide_count: expectedSlideCount,
            p_pdf_page_count: pdf.page_count ?? null,
            p_deck_structure_hash: deck.deck_structure_hash,
            p_rows_inserted: sheets.rows_written ?? artifactRowCount(artifact),
            p_sheet_url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
            p_slides_url: `https://docs.google.com/presentation/d/${SLIDES_ID}/edit`,
          });
          if (committed.error || committed.data !== true) throw new Error(committed.error?.message ?? "Commit não confirmado.");
          const memoryPayload = { run_id: runId, report_type: "midia_paga_crm_mensal",
            ciclo: artifact.period_start.slice(0, 7), narrativa: artifact.narratives.c1 ?? "",
            recomendacoes: artifact.action_candidates };
          const history = await admin.from("report_run_memory").upsert(memoryPayload, { onConflict: "run_id", ignoreDuplicates: true });
          if (history.error) throw new Error(history.error.message);
          const latest = await admin.from("report_memory").upsert(memoryPayload, { onConflict: "report_type,ciclo" });
          if (latest.error) throw new Error(latest.error.message);
          return { verified: true, publication_id: publicationId, ...deck };
        }
        throw new Error(`Etapa de publicação desconhecida: ${phase}`);
      },
      checkpoint: async (_current, next, receipt) => {
        const finished = await admin.rpc("report_live_finish_publication_step", {
          p_id: publicationId, p_token: leaseToken, p_phase: job.phase, p_receipt: receipt,
        });
        if (finished.error || finished.data !== true) throw new Error(finished.error?.message ?? "Checkpoint não confirmado.");
        job.phase = next;
      },
    });
    return { publication_id: publicationId, run_id: runId, ...result };
  } catch (error) {
    const detail = String((error as Error).message).slice(0, 900);
    const priorVisible = (activationState.receipt?.previous_visible_ids ??
      (job.receipts.activate as Row | undefined)?.previous_visible_ids) as string[] | undefined;
    const shouldRewind = ["activate", "commit"].includes(String(claimedJob.phase)) && Array.isArray(priorVisible);
    if (shouldRewind) {
      try {
        const pointer = await admin.from("report_live_pointer").select("current_publication_id").eq("id", "live").maybeSingle();
        if (String(pointer.data?.current_publication_id ?? "") !== publicationId) {
          await restoreGeneratedVisibility(priorVisible);
          const rewind = await admin.rpc("report_live_rewind_publication_activation", {
            p_id: publicationId, p_token: leaseToken, p_error: detail,
          });
          if (rewind.error || rewind.data !== true) throw new Error(rewind.error?.message ?? "Rewind recusado.");
        }
      } catch (restoreError) {
        await admin.from("report_publication_jobs").update({ paused: true,
          last_error: `Falha da recuperação: ${String((restoreError as Error).message).slice(0, 700)}` })
          .eq("id", publicationId);
      }
    } else {
      await admin.from("report_publication_jobs").update({ last_error: detail,
        lease_until: new Date().toISOString() }).eq("id", publicationId).eq("lease_token", leaseToken);
    }
    throw error;
  }
}

async function findAuthUserByEmail(email: string) {
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Não foi possível consultar usuários: ${error.message}`);
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) break;
  }
  return null;
}

export async function handleReportRequest(request: Request): Promise<Response> {
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
    body = parseReportRequest(await request.json());
  } catch (error) {
    return json({ error: String((error as Error).message) }, 400);
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const workerToken = selectReportWorkerCredential(
    request.headers.get("x-report-worker-token"),
    bearer,
  );
  let internal = Boolean(SERVICE_KEY && bearer === SERVICE_KEY);
  let requesterId: string | null = null;
  let requesterRole: ReportLiveRole | null = null;
  if (!internal && workerToken) {
    const verification = await verifyReportWorkerCredential(
      workerToken,
      async (credential) => {
        const result = await admin.rpc("report_live_verify_worker", { p_token: credential });
        return { data: result.data as boolean | null, error: result.error };
      },
    );
    if (verification === "unavailable") {
      console.error("Report Live worker credential verification unavailable after retries.");
      return json({ error: "Autenticação interna temporariamente indisponível." }, 503);
    }
    internal = verification === "valid";
  }
  if (!internal && !bearer) return json({ error: "Autenticação obrigatória." }, 401);
  if (!internal) {
    const { data, error } = await admin.auth.getUser(bearer);
    if (error || !data.user) return json({ error: "Sessão inválida." }, 401);
    requesterId = data.user.id;
    const membership = await admin.from("report_live_memberships")
      .select("role,active").eq("user_id", requesterId).maybeSingle();
    if (membership.error) {
      return json({ error: "Não foi possível verificar o acesso ao Report Live." }, 503);
    }
    requesterRole = membership.data
      ? membership.data.active === true ? membership.data.role as ReportLiveRole : null
      : "viewer";
    if (body.mode !== "access" && !reportRoleAllows(requesterRole, body.mode)) {
      return json({ error: "Seu papel não permite esta operação no Report Live." }, 403);
    }
  }
  if (!internal && ["full", "publish", "rollback", "resume_structure", "export_pdf",
    "stage_sheets", "stage_sheet_core", "stage_sheet_source", "stage_sheets_commit"].includes(String(body.mode))) {
    const setting = await admin.from("report_live_runtime_settings")
      .select("maintenance,message").eq("id", "live").maybeSingle();
    if (setting.error) return json({ error: "Não foi possível verificar a janela operacional." }, 503);
    if (setting.data?.maintenance === true) {
      return json({ error: setting.data.message ?? "Report Live em manutenção controlada." }, 503);
    }
  }
  if (body.mode === "access") {
    if (internal) return json({ role: "admin", internal: true });
    return json({
      role: requesterRole,
      active: requesterRole !== null,
      capabilities: {
        download: reportRoleAllows(requesterRole, "export_pdf"),
        generate: reportRoleAllows(requesterRole, "build"),
        publish: reportRoleAllows(requesterRole, "publish"),
        manage_members: reportRoleAllows(requesterRole, "members"),
      },
    });
  }
  if (body.mode === "members") {
    const members = await admin.from("report_live_memberships")
      .select("user_id,email,role,active,created_at,updated_at")
      .order("email", { ascending: true });
    if (members.error) return json({ error: members.error.message }, 500);
    return json({ members: members.data ?? [] });
  }
  if (body.mode === "set_member") {
    const email = String(body.member_email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "") as ReportLiveRole;
    const active = body.active !== false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail inválido." }, 400);
    if (!["viewer", "analyst", "publisher", "admin"].includes(role)) return json({ error: "Papel inválido." }, 400);
    try {
      const target = await findAuthUserByEmail(email);
      if (!target) return json({ error: "Usuário ainda não possui conta no GaaS." }, 404);
      const changed = await admin.rpc("report_live_set_member", {
        p_actor_id: requesterId,
        p_user_id: target.id,
        p_email: target.email?.toLowerCase() ?? email,
        p_role: role,
        p_active: active,
      });
      if (changed.error) {
        const status = /próprio acesso/i.test(changed.error.message) ? 409 : 500;
        return json({ error: changed.error.message }, status);
      }
      return json({ ok: true, member: changed.data });
    } catch (error) {
      return json({ error: String((error as Error).message).slice(0, 500) }, 500);
    }
  }
  if (body.mode === "worker") {
    if (!internal) return json({ error: "Worker restrito ao serviço." }, 403);
    try {
      const build = await processBuildStep(body.run_id ? String(body.run_id) : undefined);
      if (build.idle !== true) return json({ worker: "build", ...build });
      const queued = await admin.from("report_publication_jobs").select("id")
        .neq("phase", "done").eq("paused", false).order("updated_at", { ascending: true })
        .limit(1).maybeSingle();
      if (queued.error) throw new Error(queued.error.message);
      if (!queued.data?.id) return json({ idle: true });
      return json({ worker: "publication", ...(await processPublicationStep(String(queued.data.id))) });
    }
    catch (error) { return json({ error: String((error as Error).message).slice(0, 900) }, 500); }
  }
  if (body.mode === "publication_worker") {
    if (!internal) return json({ error: "Worker de publicação restrito ao serviço." }, 403);
    const publicationId = String(body.publication_id ?? "");
    if (!/^[0-9a-f-]{36}$/.test(publicationId)) return json({ error: "publication_id inválido." }, 400);
    try { return json(await processPublicationStep(publicationId)); }
    catch (error) { return json({ error: String((error as Error).message).slice(0, 900) }, 500); }
  }
  if (body.mode === "inspect_publication") {
    if (!internal) return json({ error: "Inspeção restrita ao serviço." }, 403);
    if (!body.run_id) return json({ error: "run_id obrigatório." }, 400);
    try {
      const runId = String(body.run_id);
      const artifact = await downloadBuildArtifact(buildArtifactPath(runId));
      await hydrateArtifactSources(artifact);
      const checks = [...await validateArtifactIntegrity(artifact), ...validateArtifact(artifact)];
      if (artifact.run_id !== runId || !certificationPassed(checks)) return json({ error: "Artefato inválido.", checks }, 422);
      const metadata = await googleFetch(`${SHEETS}/${SHEET_ID}?fields=sheets(properties(title))`);
      const available = new Set<string>((metadata.sheets ?? []).map((sheet: any) => String(sheet.properties.title)));
      const expected = artifactSheetTables(artifact);
      const actual = await readSheetTables(Object.keys(expected).filter(title => available.has(title)), 'UNFORMATTED_VALUE');
      const comparison = Object.entries(expected).map(([title, rows]) => ({ title, exists: available.has(title),
        ...compareSheetValues(rows, actual[title] ?? [], 3) }));
      const backup = await capturePublicationEvidence(`audit-${crypto.randomUUID()}`, artifact);
      return json({ run_id: runId, google_mutated: false, backup, tables: comparison.length,
        matching: comparison.filter(item => item.verified).length, differences: comparison.filter(item => !item.verified) });
    } catch (error) { return json({ error: String((error as Error).message).slice(0, 900) }, 500); }
  }
  if (body.mode === 'inspect_recovery') {
    if (!internal) return json({ error: 'Inspeção restrita ao serviço.' }, 403);
    const runId = String(body.run_id ?? '');
    const backupId = String(body.backup_id ?? '');
    if (!/^[0-9a-f-]{36}$/.test(runId) || !/^(audit-)?[0-9a-f-]{36}$/.test(backupId)) return json({ error: 'Identificadores inválidos.' }, 400);
    try {
      const { data, error } = await admin.storage.from(PDF_BUCKET).download(`runs/${runId}/publications/${backupId}/before-write.json`);
      if (error || !data) throw new Error('Backup indisponível.');
      const evidence = JSON.parse(await data.text());
      if (evidence.run_id !== runId || evidence.publication_id !== backupId || evidence.sheet_id !== SHEET_ID || evidence.slides_id !== SLIDES_ID) throw new Error('Identidade do backup divergente.');
      const slides = evidence.deck.slides ?? [];
      const managed = slides.filter((slide: Row) => /^rlv[12]s_/.test(String(slide.objectId)));
      const types: Record<string, number> = {};
      const examples: Record<string, unknown> = {};
      const inventory = managed.map((slide: Row) => ({ id: slide.objectId,
        properties: slide.pageProperties, slideProperties: slide.slideProperties,
        elements: ((slide.pageElements ?? []) as Row[]).map(element => {
          const kind = ['shape','sheetsChart','image','table','line','video','elementGroup','wordArt'].find(key => element[key] != null) ?? 'unknown';
          types[kind] = (types[kind] ?? 0) + 1;
          examples[kind] ??= element;
          return { id: element.objectId, kind, keys: Object.keys(element) };
        }) }));
      return json({ google_mutated: false, run_id: runId, backup_id: backupId,
        sha256: await sha256(evidence), total_slides: slides.length, managed_slides: managed.length,
        unmanaged: slides.filter((slide: Row) => !/^rlv[12]s_/.test(String(slide.objectId))).map((slide: Row) => ({
          id: slide.objectId, skipped: (slide.slideProperties as Row)?.isSkipped ?? false,
          text: ((slide.pageElements ?? []) as Row[]).flatMap(element =>
            ((((element.shape as Row)?.text as Row)?.textElements ?? []) as Row[])
              .map(part => String((part.textRun as Row)?.content ?? ''))).join('').slice(0, 800),
        })),
        element_types: types, examples, slides: inventory,
        sheets: (evidence.metadata.sheets ?? []).map((sheet: Row) => ({ properties: sheet.properties,
          chart_count: ((sheet.charts ?? []) as Row[]).length, charts: sheet.charts ?? [],
          keys: Object.keys(sheet) })), new_tabs: evidence.new_tabs });
    } catch (error) { return json({ error: String((error as Error).message).slice(0, 900) }, 500); }
  }
  if (body.mode === "inspect_generation") {
    if (!internal) return json({ error: "Inspeção restrita ao serviço." }, 403);
    const runId = String(body.run_id ?? "");
    if (!/^[0-9a-f-]{36}$/.test(runId)) return json({ error: "run_id inválido." }, 400);
    try {
      const artifact = await downloadBuildArtifact(buildArtifactPath(runId));
      const generation = await artifactGeneration(artifact);
      const metadata = await googleFetch(
        `${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title,hidden,gridProperties(rowCount,columnCount)))`,
      );
      const byTitle = new Map<string, Row>((metadata.sheets ?? []).map((sheet: Row) => {
        const properties = sheet.properties as Row;
        return [String(properties.title), properties];
      }));
      const sheets = generation.entries.map((entry) => {
        const properties = byTitle.get(entry.physical_title);
        const grid = (properties?.gridProperties ?? {}) as Row;
        return { logical_title: entry.logical_title, physical_title: entry.physical_title,
          exists: Boolean(properties), hidden: properties?.hidden === true,
          row_count: Number(grid.rowCount ?? 0), column_count: Number(grid.columnCount ?? 0),
          required_rows: entry.row_count, required_columns: entry.column_count };
      });
      const deck = await readDeckGenerationState();
      const target = publicationSlides(deck.slides ?? [], generation.releaseKey) as Row[];
      const managed = (deck.slides ?? []).filter((slide: Row) => isManagedGeneratedSlide(String(slide.objectId ?? "")));
      const visibleManaged = managed.filter((slide: Row) => (slide.slideProperties as Row)?.isSkipped !== true);
      return json({ google_mutated: false, run_id: runId, release_key: generation.releaseKey,
        sheets_verified: sheets.every((sheet) => sheet.exists && sheet.hidden &&
          sheet.row_count >= sheet.required_rows && sheet.column_count >= sheet.required_columns),
        sheets, target_slides: target.length,
        target_skipped: target.filter((slide) => (slide.slideProperties as Row)?.isSkipped === true).length,
        managed_slides: managed.length, visible_managed_ids: visibleManaged.map((slide: Row) => slide.objectId),
        unowned_slides: (deck.slides ?? []).filter((slide: Row) => !isManagedGeneratedSlide(String(slide.objectId ?? ""))).length });
    } catch (error) { return json({ error: String((error as Error).message).slice(0, 900) }, 500); }
  }
  const now = new Date();
  const defaultStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const periodStart = String(body.period_start ?? defaultStart);
  const periodEnd = String(body.period_end ?? toIsoDay(now));
  const profile = String(body.report_profile ?? "monthly_report");

  if (!SHEET_ID || !SLIDES_ID || !SA_RAW || !SERVICE_KEY) {
    return json({ error: "Secrets obrigatórios ausentes." }, 500);
  }

  // Retenção remove apenas objetos Google de gerações publicadas conhecidas.
  // Artefatos/PDFs imutáveis e registros do banco permanecem preservados.
  if (body.mode === "cleanup_sheet_tabs") {
    if (!internal) return json({ error: "Retenção restrita ao serviço." }, 403);
    const keepGenerations = Math.max(2, Math.min(12, Number(body.keep_generations ?? 2)));
    const [{ data: pointer, error: pointerError }, { data: publications, error: publicationsError }] = await Promise.all([
      admin.from("report_live_pointer").select("current_publication_id").eq("id", "live").maybeSingle(),
      admin.from("report_publications")
        .select("id,run_id,slide_generation,status,publication_version")
        .in("status", ["published", "superseded", "rolled_back"])
        .order("publication_version", { ascending: false }),
    ]);
    if (pointerError) return json({ error: pointerError.message }, 500);
    if (publicationsError) return json({ error: publicationsError.message }, 500);
    if (!pointer?.current_publication_id) return json({ error: "Ponteiro vivo ausente; retenção recusada." }, 409);
    const plan = buildGenerationRetentionPlan(
      (publications ?? []).map((item) => ({
        publication_id: String(item.id),
        run_id: String(item.run_id),
        release_key: String(item.slide_generation ?? ""),
        status: String(item.status),
        publication_version: Number(item.publication_version),
      })),
      String(pointer.current_publication_id),
      keepGenerations,
    );
    const generations: Array<{ publication_id: string; run_id: string; release_key: string; sheet_titles: string[] }> = [];
    for (const publication of plan.deletable) {
      try {
        const artifact = await downloadBuildArtifact(buildArtifactPath(publication.run_id));
        const generation = await artifactGeneration(artifact);
        if (generation.releaseKey !== publication.release_key) {
          return json({ error: `Release divergente no run ${publication.run_id}; retenção recusada.` }, 409);
        }
        generations.push({
          publication_id: publication.publication_id,
          run_id: publication.run_id,
          release_key: publication.release_key,
          sheet_titles: generation.entries.map((entry) => entry.physical_title),
        });
      } catch (error) {
        return json({ error: `Artefato de retenção indisponível para ${publication.run_id}: ${String((error as Error).message)}` }, 409);
      }
    }
    const [sheetMetadata, deck] = await Promise.all([
      googleFetch(`${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title))`),
      googleFetch(`${SLIDES}/${SLIDES_ID}?fields=slides(objectId,slideProperties(isSkipped))`),
    ]);
    const deletableSheetTitles = new Set(generations.flatMap((item) => item.sheet_titles));
    const deletableSheets: Array<{ sheet_id: number; title: string }> =
      (sheetMetadata.sheets ?? []).flatMap((sheet: Row) => {
      const properties = sheet.properties as Row;
      return deletableSheetTitles.has(String(properties.title ?? ""))
        ? [{ sheet_id: Number(properties.sheetId), title: String(properties.title) }]
        : [];
      });
    const prefixes = generations.map((item) => releaseSlidePrefix(item.release_key));
    const deletableSlides: string[] = (deck.slides ?? []).flatMap((slide: Row) => {
      const objectId = String(slide.objectId ?? "");
      const skipped = (slide.slideProperties as Row)?.isSkipped === true;
      return skipped && prefixes.some((prefix) => objectId.startsWith(prefix)) ? [objectId] : [];
    });
    const dryRun = body.confirm !== "DELETE_SUPERSEDED_GENERATIONS";
    if (!dryRun) {
      if (deletableSheets.length) {
        await googleFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
          method: "POST",
          body: JSON.stringify({ requests: deletableSheets.map((sheet) => ({ deleteSheet: { sheetId: sheet.sheet_id } })) }),
        });
      }
      if (deletableSlides.length) {
        await googleFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
          method: "POST",
          body: JSON.stringify({ requests: deletableSlides.map((objectId) => ({ deleteObject: { objectId } })) }),
        });
      }
    }
    return json({ ok: true, dry_run: dryRun, keep_generations: keepGenerations,
      retained_release_keys: plan.retained_release_keys, generations,
      sheets: deletableSheets, slides: deletableSlides,
      deleted: dryRun ? { sheets: 0, slides: 0 } : { sheets: deletableSheets.length, slides: deletableSlides.length },
      immutable_artifacts_preserved: true });
  }

  // Download the immutable PDF of a confirmed publication. Never relabel the
  // current live deck as a historical run by exporting it again.
  if (body.mode === "export_pdf") {
    let publicationQuery = admin.from('report_publications')
      .select('id,run_id,pdf_path,publication_version,pdf_page_count')
      .in('status', ['published', 'superseded', 'rolled_back']);
    if (body.run_id) publicationQuery = publicationQuery.eq('run_id', String(body.run_id));
    else {
      const { data: pointer, error } = await admin.from('report_live_pointer')
        .select('current_publication_id').eq('id', 'live').maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!pointer?.current_publication_id) return json({ error: 'Nenhuma publicação confirmada.' }, 404);
      publicationQuery = publicationQuery.eq('id', pointer.current_publication_id);
    }
    const { data: publication, error } = await publicationQuery.order('publication_version', { ascending: false }).limit(1).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!publication?.pdf_path) return json({ error: 'Esta publicação não possui PDF preservado.' }, 404);
    const { data: file, error: readError } = await admin.storage.from(PDF_BUCKET).download(publication.pdf_path);
    if (readError || !file) return json({ error: 'PDF preservado indisponível; nova exportação histórica não é permitida.' }, 409);
    const { data: signed, error: signedError } = await admin.storage.from(PDF_BUCKET)
      .createSignedUrl(publication.pdf_path, PDF_SIGNED_URL_TTL);
    if (signedError || !signed) return json({ error: 'Não foi possível disponibilizar o PDF.' }, 500);
    return json({ ok: true, run_id: publication.run_id, publication_id: publication.id,
      publication_version: publication.publication_version, path: publication.pdf_path,
      page_count: publication.pdf_page_count, signed_url: signed.signedUrl });
  }

  if (body.mode === "watchdog") {
    const timeoutMinutes = Math.max(5, Math.min(120, Number(body.timeout_minutes ?? 15)));
    const { data, error } = await admin.rpc("report_live_mark_stale_runs", {
      p_timeout_minutes: timeoutMinutes,
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, timeout_minutes: timeoutMinutes, stale_runs: data ?? 0 });
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
  if (
    body.mode === "stage_sheets" ||
    body.mode === "stage_sheet_core" ||
    body.mode === "stage_sheet_source" ||
    body.mode === "stage_sheets_commit"
  ) {
    return json({ error: "Preparação direta desativada; use publish para o fluxo durável por geração." }, 409);
  }
  if (body.mode === "certify" || body.mode === "publish") {
    const runId = String(body.run_id ?? "");
    if (!runId) return json({ error: "run_id é obrigatório." }, 400);
    try {
      const { data: run, error: runError } = await admin
        .from("report_runs")
        .select("id,artifact_path,certification_status,publication_status")
        .eq("id", runId)
        .single();
      if (runError || !run?.artifact_path) {
        throw new Error(runError?.message ?? "Run sem artefato de build.");
      }
      const artifact = await downloadBuildArtifact(String(run.artifact_path));
      const certification = await certifyStoredArtifact(runId, artifact);
      if (body.mode === "certify" || !certification.certified) {
        return json({
          ok: certification.certified,
          run_id: runId,
          certification_status: certification.certified ? "certified" : "rejected",
          validations: certification.validations,
        }, certification.certified ? 200 : 422);
      }
      const publication = await enqueuePublication(runId, artifact, requesterId);
      return json({ ok: true, run_id: runId, publication_id: publication.id,
        publication_version: publication.publication_version, status: "queued" }, 202);
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "diff") {
    const runId = String(body.run_id ?? "");
    if (!runId) return json({ error: "run_id é obrigatório." }, 400);
    try {
      const { data: run, error: runError } = await admin
        .from("report_runs")
        .select("artifact_path")
        .eq("id", runId)
        .single();
      if (runError || !run?.artifact_path) {
        throw new Error(runError?.message ?? "Run sem artefato.");
      }
      const current = await downloadBuildArtifact(String(run.artifact_path));
      const { data: previous } = await admin
        .from("report_publications")
        .select("artifact_path")
        .eq("deck_id", SLIDES_ID)
        .in("status", ["published", "superseded"])
        .neq("run_id", runId)
        .order("publication_version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const previousArtifact = previous?.artifact_path
        ? await downloadBuildArtifact(String(previous.artifact_path))
        : null;
      return json({
        ok: true,
        run_id: runId,
        diff: diffBlueprints(current.slide_blueprints, previousArtifact?.slide_blueprints ?? []),
      });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "rollback") {
    const publicationId = String(body.publication_id ?? "");
    if (!publicationId) return json({ error: "publication_id é obrigatório para rollback." }, 400);
    try {
      const { data: target, error: targetError } = await admin
        .from("report_publications")
        .select("id,run_id,artifact_path,status")
        .eq("id", publicationId)
        .single();
      if (targetError || !target) throw new Error(targetError?.message ?? "Publicação não encontrada.");
      if (!["published", "superseded", "rolled_back"].includes(String(target.status))) {
        throw new Error("A publicação alvo ainda não é uma versão histórica recuperável.");
      }
      const artifact = await downloadBuildArtifact(String(target.artifact_path));
      const validations = validateArtifact(artifact);
      if (!certificationPassed(validations)) {
        return json({
          ok: false,
          error: "Rollback recusado: o artefato histórico não passa nas validações atuais.",
          validations,
        }, 422);
      }
      const publication = await enqueuePublication(String(target.run_id), artifact, requesterId,
        "rollback", publicationId, String(body.reason ?? "Rollback solicitado"));
      return json({ ok: true, rollback_of: publicationId, publication_id: publication.id,
        publication_version: publication.publication_version, status: "queued" }, 202);
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
        .select("id,quality_status,period_start,period_end,report_profile,artifact_path,certification_status")
        .eq("id", runId)
        .single();
      if (runError || !existingRun) throw new Error(runError?.message ?? "Run não encontrado.");
      if (existingRun.artifact_path) {
        const artifact = await downloadBuildArtifact(String(existingRun.artifact_path));
        const certification = await certifyStoredArtifact(runId, artifact);
        if (!certification.certified) {
          return json({
            ok: false,
            run_id: runId,
            error: "resume_structure bloqueado: o build não foi certificado.",
            validations: certification.validations,
          }, 422);
        }
        const publication = await enqueuePublication(runId, artifact, requesterId);
        return json({ ok: true, run_id: runId, migrated_to_versioned_publish: true,
          publication_id: publication.id, publication_version: publication.publication_version,
          status: "queued" }, 202);
      }
      if (body.allow_legacy_resume !== true) {
        return json({
          ok: false,
          run_id: runId,
          error: "Run legado sem artefato imutável. Use allow_legacy_resume:true apenas para recuperação excepcional.",
        }, 409);
      }
      return json({ ok: false, error: "Retomada legada desativada; o run precisa de artefato imutável certificado." }, 409);
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
    run_mode: body.mode === "build" ? "build" : "full",
    active_run: true,
    source_version: RELEASE_VERSIONS.source,
    semantic_version: RELEASE_VERSIONS.semantic,
    spec_version: RELEASE_VERSIONS.spec,
    narrative_version: RELEASE_VERSIONS.narrative,
    renderer_version: RELEASE_VERSIONS.renderer,
    build_status: "pending",
    certification_status: "pending",
    publication_status: "pending",
    period_start: periodStart,
    period_end: periodEnd,
    status: "queued",
    requested_by: requesterId,
  }).select().single();
  if (error || !run) {
    if (error?.code === "23505") {
      const { data: activeRun } = await admin
        .from("report_runs")
        .select("id,status,report_profile,period_start,period_end,updated_at")
        .eq("active_run", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return json({
        error: "Já existe uma execução ativa do Report Live.",
        active_run: activeRun ?? null,
      }, 409);
    }
    return json({ error: `Não criou run: ${error?.message}` }, 500);
  }

  const requestedMode = body.mode === "build" ? "build" : "full";
  const queued = await admin.from("report_build_jobs").insert({
    run_id: run.id,
    options: {
      texts,
      skipLlm,
      phase: requestedMode,
      auto_publish: requestedMode === "full",
      requester_id: requesterId,
    },
  });
  if (queued.error) {
    await setStatus(run.id, "error", { active_run: false, error_detail: queued.error.message });
    return json({ error: queued.error.message }, 500);
  }
  return json({ run_id: run.id, spec_version: RELEASE_VERSIONS.spec,
    mode: requestedMode, status: "queued" }, 202);
}

if (import.meta.main) Deno.serve(handleReportRequest);
