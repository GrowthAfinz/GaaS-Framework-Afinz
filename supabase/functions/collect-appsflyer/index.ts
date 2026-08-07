// =====================================================================
// Coletor diario governado do AppsFlyer via Pull API (raw + aggregate),
// token V2.0. Espelha o padrao de `collect-meta-events`: run lifecycle,
// allowlist como dado, secret nunca em log/URL, upsert idempotente,
// janela rolante para reprocessar atribuicao tardia.
//
// NAO GRAVA NENHUM IDENTIFICADOR DE USUARIO/DISPOSITIVO. So as colunas em
// ALLOWED_COLUMNS entram no pipeline — tudo que e idfa/gaid/android_id/
// ip/appsflyer_id/customer_user_id/etc fica de fora mesmo que venha no CSV.
//
// ESCOPO (corte pos-incidente WORKER_RESOURCE_LIMIT — ver git blame /
// comentario em enumerateDates para o historico completo):
//   installs_report/v5                     -> appsflyer_acquisition_daily (nao-organico, grao fino c/ template_id)
//   organic_installs_report/v5             -> appsflyer_acquisition_daily (organico)
//   uninstall_events_report/v5             -> appsflyer_lifecycle_daily (metric_type='uninstall')
//   organic_uninstall_events_report/v5     -> appsflyer_lifecycle_daily (organico)
//   reinstalls/v5                          -> appsflyer_lifecycle_daily (metric_type='reinstall')
//   reinstalls_organic/v5                  -> appsflyer_lifecycle_daily (organico)
//   partners_by_date_report/v5 (AGREGADO)  -> appsflyer_campaign_daily (sessao/clique/install por campanha)
//
// `in_app_events_report`/`organic_in_app_events_report` foram DELIBERADAMENTE
// removidos: o unico evento de negocio auto-coletado hoje (af_content_view)
// sozinho gera ~100-125 mil linhas/dia (quase 1 por sessao do app inteiro),
// estourando memoria/CPU do isolate mesmo com pull fatiado por dia e filtro
// de event_name. Sem evento de negocio real implementado no SDK (ver
// ontologia AppsFlyer-Tracking-CRM), esse pull nao entregava sinal
// acionavel — fica pendente ate o mobile emitir eventos reais ou o BI
// decidir Data Locker. appsflyer_events_daily continua no schema, so que
// vazia (ausencia = not_available, nunca zero forjado).
//
// Clique por template e sessao por template NAO existem em nenhum raw
// report (so no agregado, que so quebra por campanha — nao por af_sub3 —
// ou em Data Locker) — ficam metric_status 'not_available' em
// appsflyer_template_daily, nunca inventados.
// =====================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RAW_BASE = "https://hq1.appsflyer.com/api/raw-data/export/app";
const AGG_BASE = "https://hq1.appsflyer.com/api/agg-data/export/app";
const TOKEN = Deno.env.get("APPSFLYER_PULL_API_TOKEN") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENABLED = (Deno.env.get("COLLECT_APPSFLYER_ENABLED") ?? "false") === "true";
// Auth propria (verify_jwt=false no deploy): o segredo do Vault
// 'collect_appsflyer_auth_key' NAO e um JWT do Supabase, entao nao dava
// pra usar verify_jwt=true (a plataforma rejeitaria antes de chegar aqui).
// Comparacao simples de string, sempre em tempo constante.
const DISPATCH_AUTH_KEY = Deno.env.get("COLLECT_APPSFLYER_AUTH_KEY") ?? "";
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const ROLLING_WINDOW_DAYS = Number(Deno.env.get("APPSFLYER_ROLLING_WINDOW_DAYS") ?? "7");
// Cada report RAW e puxado numa unica chamada pra janela inteira (nao mais
// fatiado por dia — ver comentario em collectAppsflyer). Um backfill de ate
// 21 dias vira so 6 chamadas raw + 1 chamada do agregado de campanha,
// dentro da cota diaria do Pull API (quota por report/app/dia). 21 dias
// tambem fica sob o limite de retencao "60 de 90 dias" da AppsFlyer pra
// reports de install. Backfills maiores devem ser feitos em varias
// chamadas manuais de ate 21 dias cada.
const MAX_BACKFILL_DAYS = 21;
const MAX_ROWS_PER_CALL = 1_000_000;

const sb = createClient(SB_URL, SB_KEY);

// ---------------------------------------------------------------------
// Guardrail de privacidade: so estas colunas do CSV raw entram no
// pipeline. Qualquer identificador de usuario/dispositivo/rede fica de
// fora por design — mesmo que a AppsFlyer mande a coluna, ela e ignorada
// no parse. Vale para installs/uninstalls/reinstalls (mesmo dicionario
// base de campos nos 3 reports).
//
// BUG CORRIGIDO (v12): a doc oficial NAO publica os nomes exatos das
// colunas do CSV — só documentei snake_case (install_time, media_source
// etc) por suposição, nunca confirmado contra o CSV real. Confirmado via
// endpoint debug_header (ver historico) que o AppsFlyer devolve headers
// "Title Case" com espaço: "Install Time", "Media Source", "Channel",
// "Sub Param 1".."Sub Param 5", "Country Code", "App ID", "Attributed
// Touch Type", "Is Retargeting". Com match exato case-sensitive contra
// snake_case, TODA linha falhava em extractDimensionKey (business_date
// vinha vazio) — CSV era lido (per_report_rows > 0) mas
// acquisitionWritten/lifecycleWritten ficavam em 0, silenciosamente.
// Corrigido com alias por header normalizado, no mesmo padrão já usado
// em CAMPAIGN_AGG_COLUMN_ALIASES pro relatorio agregado (que era
// tolerante desde o inicio por documentação ainda mais incompleta).
// ---------------------------------------------------------------------
const RAW_COLUMN_ALIASES: Record<string, string> = {
  installtime: "install_time",
  eventtime: "event_time",
  mediasource: "media_source",
  channel: "af_channel",
  campaign: "campaign",
  campaignid: "af_c_id",
  subparam1: "af_sub1",
  subparam2: "af_sub2",
  subparam3: "af_sub3",
  subparam4: "af_sub4",
  subparam5: "af_sub5",
  countrycode: "country_code",
  platform: "platform",
  appid: "app_id",
  attributedtouchtype: "attributed_touch_type",
  isretargeting: "is_retargeting",
};

// idfa/idfv/imei/advertising_id(+type/value)/android_id/oaid/amazon_aid/
// appsflyer_id(+type/value)/customer_user_id/ip(+type/value)/hardware_id
// (+type/value)/platform_user_id(+type/value)/http_referrer/deeplink_url/
// raw_consent_data/custom_data/custom_dimension/click_id_value — NUNCA
// entram em ALLOWED_COLUMNS. Se precisar de auditoria pontual, isso e
// leitura manual no painel AppsFlyer, nao persistencia no Supabase.

type ReportKind = "installs" | "uninstall" | "reinstall";
type ReportSpec = { path: string; kind: ReportKind; isOrganic: boolean };
const REPORTS: ReportSpec[] = [
  { path: "installs_report/v5", kind: "installs", isOrganic: false },
  { path: "organic_installs_report/v5", kind: "installs", isOrganic: true },
  { path: "uninstall_events_report/v5", kind: "uninstall", isOrganic: false },
  { path: "organic_uninstall_events_report/v5", kind: "uninstall", isOrganic: true },
  { path: "reinstalls/v5", kind: "reinstall", isOrganic: false },
  { path: "reinstalls_organic/v5", kind: "reinstall", isOrganic: true },
];

function redact(message: unknown): string {
  const text = String(message);
  return TOKEN ? text.replaceAll(TOKEN, "[REDACTED]") : text;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

function daysBefore(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Fetch com retry (429/5xx) e token SOMENTE no header — nunca na URL,
// nunca em log/mensagem de erro. Usado pelos reports RAW.
// ---------------------------------------------------------------------
async function pullRawReport(
  appId: string,
  report: string,
  from: string,
  to: string,
  attempt = 0,
): Promise<string> {
  const params = new URLSearchParams({
    from: `${from} 00:00`,
    to: `${to} 23:59`,
    maximum_rows: String(MAX_ROWS_PER_CALL),
    // Confirmado via MCP AppsFlyer (get_app_settings): os dois apps Afinz
    // (Android br.com.sorocred.sorocredapp e iOS id1416167782) estao
    // configurados em America/Sao_Paulo. Sem este parametro a Pull API
    // devolve tudo em UTC, e o business_date bateria errado com o corte
    // de "dia fechado" que lastClosedDay() calcula em BRT.
    timezone: "America/Sao_Paulo",
  });
  const url = `${RAW_BASE}/${appId}/${report}?${params.toString()}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "text/csv" },
  });
  if (r.status === 429 || r.status >= 500) {
    if (attempt >= 4) {
      throw new Error(`AppsFlyer ${r.status} apos retries em ${report}`);
    }
    await new Promise((res) => setTimeout(res, Math.min(30000, 1000 * 2 ** attempt)));
    return pullRawReport(appId, report, from, to, attempt + 1);
  }
  if (!r.ok) {
    const body = redact(await r.text()).slice(0, 300);
    throw new Error(`AppsFlyer ${r.status} em ${report}: ${body}`);
  }
  return await r.text();
}

// ---------------------------------------------------------------------
// Pull API AGREGADO (endpoint DIFERENTE do raw — mesma auth V2.0 token).
// partners_by_date_report/v5: grao date x media_source x campanha, dados
// ja pre-agregados pela AppsFlyer (max 200K linhas por chamada — nunca
// chega perto disso pro volume da Afinz). Uma chamada cobre a janela
// inteira (nao precisa fatiar por dia como o raw).
//
// "Data type: LTV" (doc oficial): as metricas de um Date sao atribuidas
// pela data de INSTALL (cohort), nao pela data do evento em si — ou seja,
// "sessions" de um dia D pode incluir atividade posterior de quem
// instalou em D, agregada no momento da chamada. Isso ainda serve como
// denominador clique->install->sessao por campanha (o pedido original),
// so nao e "sessoes que aconteceram no dia D" no sentido estrito. Fica
// registrado em quality_summary pra nao mascarar a semantica.
// ---------------------------------------------------------------------
async function pullAggregateCampaignReport(
  appId: string,
  from: string,
  to: string,
  attempt = 0,
): Promise<string> {
  const params = new URLSearchParams({ from, to, timezone: "America/Sao_Paulo" });
  const url = `${AGG_BASE}/${appId}/partners_by_date_report/v5?${params.toString()}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "text/csv" },
  });
  if (r.status === 429 || r.status >= 500) {
    if (attempt >= 4) {
      throw new Error(`AppsFlyer ${r.status} apos retries em partners_by_date_report`);
    }
    await new Promise((res) => setTimeout(res, Math.min(30000, 1000 * 2 ** attempt)));
    return pullAggregateCampaignReport(appId, from, to, attempt + 1);
  }
  if (!r.ok) {
    const body = redact(await r.text()).slice(0, 300);
    throw new Error(`AppsFlyer ${r.status} em partners_by_date_report: ${body}`);
  }
  return await r.text();
}

// ---------------------------------------------------------------------
// Parser CSV linha-a-linha, streaming (sem materializar array 2D nem
// array de records inteiro).
//
// HISTORICO: a primeira versao fazia parse char-a-char do texto inteiro,
// construindo um array 2D (`string[][]`) e depois um array de records —
// duas copias completas do CSV na memoria antes de agregar. Isso so foi
// exposto pela dor com in_app_events_report (100k+ linhas/dia); pros
// reports que sobraram (installs/uninstalls/reinstalls, poucos milhares
// de linhas/dia) o streaming e so boa pratica de baixo custo, nao uma
// necessidade critica — mas nao ha razao pra regredir.
//
// Fast-path (`String.split(',')`) para linhas sem aspas — o caso de TODAS
// as colunas em ALLOWED_COLUMNS (identificadores tecnicos, nunca texto
// livre com virgula). So cai no parser com aspas linha-a-linha se a linha
// realmente contiver `"`.
// ---------------------------------------------------------------------
function splitCsvLine(line: string): string[] {
  if (!line.includes('"')) return line.split(",");
  const fields: string[] = [];
  let field = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { fields.push(field); field = ""; }
    else field += c;
  }
  fields.push(field);
  return fields;
}

function forEachCsvRow(
  text: string,
  columnAliases: Record<string, string>,
  onRow: (record: Record<string, string>) => void,
): number {
  const len = text.length;
  let start = 0;
  let lineNo = 0;
  let mappedHeader: (string | null)[] = [];
  let count = 0;
  while (start < len) {
    let end = text.indexOf("\n", start);
    if (end === -1) end = len;
    let line = text.slice(start, end);
    if (line.endsWith("\r")) line = line.slice(0, -1);
    start = end + 1;
    if (lineNo === 0) {
      const header = splitCsvLine(line).map((h) => h.trim());
      // Alias por header normalizado (lowercase, sem espaço/pontuação) —
      // mesma robustez do parser do agregado. Ver comentario em
      // RAW_COLUMN_ALIASES pro bug que isso corrige.
      mappedHeader = header.map((h) => RAW_COLUMN_ALIASES[normalizeHeader(h)] ?? null);
      lineNo++;
      continue;
    }
    lineNo++;
    if (line.length === 0) continue;
    const cols = splitCsvLine(line);
    const record: Record<string, string> = {};
    for (let i = 0; i < mappedHeader.length; i++) {
      const key = mappedHeader[i];
      if (key) record[key] = (cols[i] ?? "").trim();
    }
    onRow(record);
    count++;
  }
  return count;
}

function norm(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}
// Sentinela e '' (empty string), nunca NULL — o grao das tabelas usa
// colunas NOT NULL DEFAULT '' para permitir upsert onConflict de
// plain-column (ON CONFLICT nao casa com indice baseado em coalesce()).
function normOrEmpty(value: string | undefined): string {
  return norm(value);
}
// O CSV do agregado usa o literal "None"/"N/A" (nao vazio) pra ausencia de
// valor em Campaign/Media Source — ex: installs organicos vem com
// Campaign="None". Sem isso, "none" virava um valor de dimensao valido
// (campaign="none"), quebrando a convencao de "" usada em toda a base pra
// ausencia. Achado revisando os dados apos o fix de header (ver historico).
function cleanAggToken(value: string | undefined): string {
  const n = norm(value);
  return n === "none" || n === "n/a" || n === "na" ? "" : n;
}

// ---------------------------------------------------------------------
// Agregacao em memoria (Maps persistentes durante toda a coleta) — a
// Edge Function nunca escreve linha crua de install/uninstall/reinstall
// no Postgres, so os totais por combinacao de dimensoes que de fato
// ocorreu nos dados (sem produto cartesiano artificial).
// ---------------------------------------------------------------------
interface DimensionKey {
  business_date: string; app_id: string; platform: string;
  media_source: string; af_channel: string; campaign: string;
  geo: string; sub1: string; sub2: string;
  sub3: string; sub4: string; sub5: string;
  touch: string; retarget: boolean;
}
function keyOf(k: DimensionKey): string {
  return JSON.stringify(k);
}
function extractDimensionKey(
  record: Record<string, string>,
  isOrganic: boolean,
  platformFallback: string,
  appId: string,
  dateColumn: "install_time" | "event_time",
): DimensionKey | null {
  const businessDate = (record[dateColumn] ?? record.install_time ?? record.event_time ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) return null;
  return {
    business_date: businessDate,
    app_id: appId,
    platform: norm(record.platform) || platformFallback,
    media_source: isOrganic ? "organic" : (norm(record.media_source) || "unknown"),
    af_channel: normOrEmpty(record.af_channel),
    campaign: normOrEmpty(record.campaign),
    geo: normOrEmpty(record.country_code),
    sub1: normOrEmpty(record.af_sub1),
    sub2: normOrEmpty(record.af_sub2),
    sub3: String(record.af_sub3 ?? "").trim(),
    sub4: normOrEmpty(record.af_sub4),
    sub5: normOrEmpty(record.af_sub5),
    touch: normOrEmpty(record.attributed_touch_type),
    retarget: norm(record.is_retargeting) === "true",
  };
}

function addAcquisitionRow(
  map: Map<string, { key: DimensionKey; installs: number; sub3Present: number }>,
  record: Record<string, string>,
  isOrganic: boolean,
  platformFallback: string,
  appId: string,
) {
  const key = extractDimensionKey(record, isOrganic, platformFallback, appId, "install_time");
  if (!key) return;
  const k = keyOf(key);
  const existing = map.get(k) ?? { key, installs: 0, sub3Present: 0 };
  existing.installs += 1;
  if (key.sub3) existing.sub3Present += 1;
  map.set(k, existing);
}

function addLifecycleRow(
  map: Map<string, { key: DimensionKey; metricType: "uninstall" | "reinstall"; count: number }>,
  record: Record<string, string>,
  isOrganic: boolean,
  platformFallback: string,
  appId: string,
  metricType: "uninstall" | "reinstall",
) {
  const key = extractDimensionKey(record, isOrganic, platformFallback, appId, "event_time");
  if (!key) return;
  const k = keyOf(key) + "|" + metricType;
  const existing = map.get(k) ?? { key, metricType, count: 0 };
  existing.count += 1;
  map.set(k, existing);
}

// ---------------------------------------------------------------------
// Parser + mapeamento tolerante do CSV do agregado (partners_by_date_report).
// A doc oficial nao publica a lista formal de colunas de resposta (so os
// query params) — o mapeamento por alias normalizado (lowercase, sem
// espacos/pontuacao) evita depender de acertar a capitalizacao exata na
// primeira tentativa. Colunas nao reconhecidas sao ignoradas.
// ---------------------------------------------------------------------
// BUG CORRIGIDO (v15): headers reais do partners_by_date_report vem com o
// nome do parametro AppsFlyer colado entre parenteses — "Media Source
// (pid)", "Campaign (c)" — que normalizeHeader() vira "mediasourcepid" e
// "campaignc", nao batendo com os aliases sem parenteses ("mediasource",
// "campaign"). Resultado: todas as linhas ficavam com media_source="unknown"
// e campaign="" silenciosamente (installs/clicks/sessions continuavam
// batendo, entao passava despercebido ate inspecionar os dados). Header
// real confirmado via debug_campaign_header: "Date,Agency/PMD (af_prt),
// Media Source (pid),Campaign (c),Impressions,Clicks,CTR,Installs,
// Conversion Rate,Sessions,...,Total Cost,...". Mantidas as variantes sem
// parenteses como fallback (doc nao garante formato estavel entre contas).
const CAMPAIGN_AGG_COLUMN_ALIASES: Record<string, string> = {
  date: "date",
  mediasource: "media_source",
  mediasourcepid: "media_source",
  partner: "media_source",
  campaign: "campaign",
  campaignc: "campaign",
  campaignname: "campaign",
  clicks: "clicks",
  impressions: "impressions",
  installs: "installs",
  sessions: "sessions",
  cost: "cost",
  totalcost: "cost",
};
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function parseAggregateCampaignCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const rawHeader = splitCsvLine(lines[0]).map((h) => h.trim());
  const mapped = rawHeader.map((h) => CAMPAIGN_AGG_COLUMN_ALIASES[normalizeHeader(h)] ?? null);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const record: Record<string, string> = {};
    mapped.forEach((key, idx) => {
      if (key) record[key] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function buildCampaignRows(
  rows: Array<Record<string, string>>,
  appId: string,
  platform: string,
  mappings: Map<string, { canonical: string; origin: string }>,
  rawInstallsByKey: Map<string, number>,
): Record<string, unknown>[] {
  type Acc = {
    business_date: string; media_source: string; campaign: string;
    installs: number; clicks: number; impressions: number; sessions: number; cost: number;
    hasInstalls: boolean; hasClicks: boolean; hasImpressions: boolean; hasSessions: boolean; hasCost: boolean;
  };
  const map = new Map<string, Acc>();
  const toNum = (v?: string): number | null => {
    if (v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  for (const r of rows) {
    const businessDate = (r.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) continue;
    const mediaSource = cleanAggToken(r.media_source) || "unknown";
    const campaign = cleanAggToken(r.campaign);
    const k = `${businessDate}|${mediaSource}|${campaign}`;
    const existing = map.get(k) ?? {
      business_date: businessDate, media_source: mediaSource, campaign,
      installs: 0, clicks: 0, impressions: 0, sessions: 0, cost: 0,
      hasInstalls: false, hasClicks: false, hasImpressions: false, hasSessions: false, hasCost: false,
    };
    const installs = toNum(r.installs);
    if (installs !== null) { existing.installs += installs; existing.hasInstalls = true; }
    const clicks = toNum(r.clicks);
    if (clicks !== null) { existing.clicks += clicks; existing.hasClicks = true; }
    const impressions = toNum(r.impressions);
    if (impressions !== null) { existing.impressions += impressions; existing.hasImpressions = true; }
    const sessions = toNum(r.sessions);
    if (sessions !== null) { existing.sessions += sessions; existing.hasSessions = true; }
    const cost = toNum(r.cost);
    if (cost !== null) { existing.cost += cost; existing.hasCost = true; }
    map.set(k, existing);
  }
  return [...map.values()].map((v) => {
    const { canonical, origin } = resolveOrigin(mappings, v.media_source);
    // Reconciliacao com o raw (fonte de verdade): quando existe install raw
    // pra mesma business_date x media_source x campaign, ele SUBSTITUI o
    // valor do agregado e o metric_status vira "confirmed_via_raw_reconciled"
    // — o agregado so fica como valor final (metric_status
    // "confirmed_aggregate_ltv_cohort") quando nao ha raw correspondente
    // pra essa chave (ex: dias fora da janela raw, ou quota raw estourada
    // naquele dia). Ver achado do revisor: sem isso, um install "197" podia
    // ser raw confirmado ou so cohort do agregado sem diferenciacao nenhuma
    // pro consumidor do dado.
    const rawKey = `${v.business_date}|${v.media_source}|${v.campaign}`;
    const rawInstalls = rawInstallsByKey.get(rawKey);
    const hasRawMatch = rawInstalls !== undefined;
    const installsValue = hasRawMatch ? rawInstalls! : (v.hasInstalls ? v.installs : null);
    return {
      business_date: v.business_date,
      app_scope: "afinz_b2c",
      app_id: appId,
      platform,
      media_source: v.media_source,
      media_source_canonical: canonical,
      origin_group: origin,
      campaign: v.campaign,
      installs: installsValue,
      clicks: v.hasClicks ? v.clicks : null,
      impressions: v.hasImpressions ? v.impressions : null,
      sessions: v.hasSessions ? v.sessions : null,
      // Confirmado via MCP AppsFlyer (fetch_aggregated_data, metadata.currency)
      // pra este app: USD. Nao assumir BRL so porque a operacao e Brasil.
      cost: v.hasCost ? v.cost : null,
      currency: "USD",
      metric_status: {
        installs: hasRawMatch
          ? "confirmed_via_raw_reconciled"
          : (v.hasInstalls ? "confirmed_aggregate_ltv_cohort" : "not_available"),
        clicks: v.hasClicks ? "confirmed_aggregate_ltv_cohort" : "not_available",
        impressions: v.hasImpressions ? "confirmed_aggregate_ltv_cohort" : "not_available",
        // Sessions sao contagem repetivel por usuario (engajamento), NAO um
        // estagio de funil que decresce — nunca desenhar clique->install->
        // sessao como funil monotonico decrescente no consumidor deste dado.
        sessions: v.hasSessions ? "confirmed_aggregate_ltv_cohort" : "not_available",
        cost: v.hasCost ? "confirmed_aggregate_ltv_cohort" : "not_available",
      },
      quality_status: "complete",
      source_type: "appsflyer_agg_pull_api",
      source_updated_at: new Date().toISOString(),
    };
  });
}

// ---------------------------------------------------------------------
// media_source -> origin_group / canonical, reaproveitando
// appsflyer_source_mappings (fonte unica de verdade; nao duplicar aqui).
// ---------------------------------------------------------------------
async function loadSourceMappings(): Promise<Map<string, { canonical: string; origin: string }>> {
  const { data, error } = await sb.from("appsflyer_source_mappings")
    .select("media_source_raw, media_source_canonical, origin_group");
  if (error) throw new Error(`appsflyer_source_mappings: ${error.message}`);
  const map = new Map<string, { canonical: string; origin: string }>();
  for (const row of data ?? []) {
    map.set(String(row.media_source_raw).toLowerCase(), {
      canonical: row.media_source_canonical,
      origin: row.origin_group,
    });
  }
  return map;
}
function resolveOrigin(
  mappings: Map<string, { canonical: string; origin: string }>,
  mediaSource: string,
): { canonical: string; origin: string } {
  return mappings.get(mediaSource) ?? { canonical: mediaSource, origin: "parceiro" };
}

async function upsertChunked(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await sb.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
    written += batch.length;
  }
  return written;
}

// ---------------------------------------------------------------------
// Substituicao atomica do recorte diario ANTES de gravar. Achado do
// revisor: upsert sozinho nunca remove linha antiga cuja CHAVE mudou (ex:
// bug de parsing anterior gravava media_source="unknown"/campaign="" —
// depois do fix, as linhas certas entram como registros NOVOS, e as
// erradas ficam de residuo pra sempre, duplicando totais em qualquer
// sum() feito no consumidor). Delete por (app_id, platform, janela de
// datas) antes do insert garante que o recorte re-coletado reflete
// exatamente o que a AppsFlyer devolveu agora, sem grao/versao anterior
// sobrevivendo por baixo.
// ---------------------------------------------------------------------
async function deleteWindow(
  table: string,
  appId: string,
  platform: string,
  since: string,
  until: string,
) {
  const { error } = await sb.from(table)
    .delete()
    .eq("app_id", appId)
    .eq("platform", norm(platform))
    .gte("business_date", since)
    .lte("business_date", until);
  if (error) throw new Error(`${table} delete janela: ${error.message}`);
}

async function deleteTemplateWindow(since: string, until: string) {
  const { error } = await sb.from("appsflyer_template_daily")
    .delete()
    .gte("business_date", since)
    .lte("business_date", until);
  if (error) throw new Error(`appsflyer_template_daily delete janela: ${error.message}`);
}

// ---------------------------------------------------------------------
// Orquestracao de uma coleta (um app_id por chamada, espelhando o
// desenho de collect-meta-events).
// ---------------------------------------------------------------------
async function collectAppsflyer(opts: {
  mode: "daily" | "backfill";
  appId: string;
  platform: string;
  since: string;
  until: string;
}) {
  if (!ENABLED) {
    console.log("COLLECT_APPSFLYER_ENABLED=false -> no-op");
    return { skipped: true };
  }
  if (!TOKEN) throw new Error("APPSFLYER_PULL_API_TOKEN ausente");

  const { data: run, error: runErr } = await sb.from("appsflyer_collection_runs").insert({
    source_type: "appsflyer_pull_api_raw",
    status: "pending",
    date_from: opts.since,
    date_to: opts.until,
  }).select().single();
  if (runErr || !run) throw new Error(`nao criou run: ${runErr?.message}`);
  const runId = run.id as number;

  try {
    const mappings = await loadSourceMappings();
    const acquisitionMap = new Map<string, { key: DimensionKey; installs: number; sub3Present: number }>();
    const lifecycleMap = new Map<string, { key: DimensionKey; metricType: "uninstall" | "reinstall"; count: number }>();
    const perReportCounts: Record<string, number> = {};

    // Erro por report NAO derruba a run inteira. Motivo real observado:
    // a conta AppsFlyer da Afinz devolveu 400 "Your current subscription
    // package doesn't include raw data reports" para `reinstalls/v5`
    // especificamente — restricao de PLANO, nao bug de codigo. Sem
    // tolerancia por report, um unico report fora do plano derrubava
    // installs/uninstalls que ja tinham funcionado. Aqui cada report tenta
    // uma vez; se falhar (qualquer erro), registra em reportErrors e segue
    // pro proximo report — a run so falha de vez se TODOS os reports
    // falharem (nesse caso nao ha nada pra gravar mesmo).
    //
    // UMA CHAMADA POR REPORT PRA JANELA INTEIRA (nao mais 1/dia). O
    // fatiamento por dia existia pra in_app_events_report (100k+
    // linhas/dia, risco de OOM) — cortado do escopo (ver header do
    // arquivo). installs/uninstalls/reinstalls sao pequenos (centenas a
    // poucos milhares/dia); fatiar por dia so multiplicava chamadas contra
    // a cota diaria do Pull API (quota por report/app/dia, nao publicada,
    // ver support.appsflyer.com/hc/en-us/articles/207034366) sem ganho de
    // memoria. Um backfill de 21 dias agora e 6 chamadas raw, nao 126.
    const reportErrors: Record<string, string> = {};
    for (const report of REPORTS) {
      perReportCounts[report.path] = 0;
      try {
        const csvText = await pullRawReport(opts.appId, report.path, opts.since, opts.until);
        const rowCount = forEachCsvRow(csvText, RAW_COLUMN_ALIASES, (record) => {
          if (report.kind === "installs") {
            addAcquisitionRow(acquisitionMap, record, report.isOrganic, opts.platform, opts.appId);
          } else {
            addLifecycleRow(lifecycleMap, record, report.isOrganic, opts.platform, opts.appId, report.kind);
          }
        });
        perReportCounts[report.path] = rowCount;
      } catch (e) {
        reportErrors[report.path] = redact((e as Error).message).slice(0, 300);
        console.error(`report ${report.path} falhou (nao aborta a run):`, reportErrors[report.path]);
      }
    }
    const allReportsFailed = Object.keys(reportErrors).length === REPORTS.length;
    if (allReportsFailed) {
      throw new Error(`todos os reports raw falharam: ${JSON.stringify(reportErrors)}`);
    }

    // Passo 0 (contrato da skill, ver ontologia): mede cobertura de af_sub3
    // nos installs. Nunca aborta sozinho — grava a run como 'partial' e
    // deixa visivel.
    let sub3Total = 0, sub3Present = 0;
    const acquisitionRows: Record<string, unknown>[] = [];
    for (const { key, installs, sub3Present: p } of acquisitionMap.values()) {
      sub3Total += installs;
      sub3Present += p;
      const { canonical, origin } = resolveOrigin(mappings, key.media_source);
      acquisitionRows.push({
        business_date: key.business_date,
        app_scope: "afinz_b2c",
        app_id: key.app_id,
        platform: key.platform,
        media_source: key.media_source,
        media_source_canonical: canonical,
        origin_group: origin,
        af_channel: key.af_channel,
        campaign: key.campaign,
        geo: key.geo,
        sub_param_1: key.sub1,
        sub_param_2: key.sub2,
        sub_param_3: key.sub3,
        sub_param_4: key.sub4,
        sub_param_5: key.sub5,
        attributed_touch_type: key.touch,
        is_retargeting: key.retarget,
        installs,
        // sessions/clicks ficam DE FORA do payload de proposito: o raw
        // nao tem esses numeros neste grao (so appsflyer_campaign_daily,
        // grao mais grosso, tem). Coluna ausente no payload = ON CONFLICT
        // preserva o valor atual se ja existir de outra fonte.
        metric_status: {
          installs: "confirmed",
          sessions: "not_available_via_raw",
          clicks: "not_available_via_raw",
          impressions: "not_available",
          cost: "not_available",
        },
        quality_status: key.sub3 ? "complete" : "directional",
        source_type: "appsflyer_pull_api_raw",
        source_updated_at: new Date().toISOString(),
      });
    }
    const sub3CoveragePct = sub3Total > 0 ? Math.round((sub3Present / sub3Total) * 1000) / 10 : null;

    const lifecycleRows: Record<string, unknown>[] = [];
    for (const { key, metricType, count } of lifecycleMap.values()) {
      const { canonical, origin } = resolveOrigin(mappings, key.media_source);
      lifecycleRows.push({
        business_date: key.business_date,
        app_scope: "afinz_b2c",
        app_id: key.app_id,
        platform: key.platform,
        media_source: key.media_source,
        media_source_canonical: canonical,
        origin_group: origin,
        af_channel: key.af_channel,
        campaign: key.campaign,
        geo: key.geo,
        sub_param_1: key.sub1,
        sub_param_2: key.sub2,
        sub_param_3: key.sub3,
        sub_param_4: key.sub4,
        sub_param_5: key.sub5,
        attributed_touch_type: key.touch,
        is_retargeting: key.retarget,
        metric_type: metricType,
        event_count: count,
        quality_status: key.sub3 ? "complete" : "directional",
        source_type: "appsflyer_pull_api_raw",
        source_updated_at: new Date().toISOString(),
      });
    }

    // Delete-antes-de-insert por janela: so pros reports que de fato
    // tentaram rodar (nao apaga acquisition se TODOS os reports de
    // installs falharam, por exemplo — nesse caso acquisitionRows fica
    // vazio e apagar sem substituir deixaria o consumidor sem dado nenhum
    // por um erro transitorio de API).
    const installsReportsOk = REPORTS.some((r) => r.kind === "installs" && !reportErrors[r.path]);
    const lifecycleReportsOk = REPORTS.some((r) => r.kind !== "installs" && !reportErrors[r.path]);
    if (installsReportsOk) await deleteWindow("appsflyer_acquisition_daily", opts.appId, opts.platform, opts.since, opts.until);
    if (lifecycleReportsOk) await deleteWindow("appsflyer_lifecycle_daily", opts.appId, opts.platform, opts.since, opts.until);

    const acquisitionWritten = await upsertChunked(
      "appsflyer_acquisition_daily",
      acquisitionRows,
      "business_date,app_scope,app_id,platform,media_source,af_channel,campaign,geo,sub_param_1,sub_param_2,sub_param_3,sub_param_4,sub_param_5,attributed_touch_type,is_retargeting",
    );
    const lifecycleWritten = await upsertChunked(
      "appsflyer_lifecycle_daily",
      lifecycleRows,
      "business_date,app_scope,app_id,platform,media_source,af_channel,campaign,geo,sub_param_1,sub_param_2,sub_param_3,sub_param_4,sub_param_5,attributed_touch_type,is_retargeting,metric_type",
    );

    // Mapa de installs RAW por (data, media_source, campanha) — usado pra
    // reconciliar appsflyer_campaign_daily contra o raw (fonte de verdade)
    // em vez de deixar tudo como "agregado/cohort" mesmo quando o raw ja
    // confirma o mesmo numero. Ver comentario em buildCampaignRows.
    const rawInstallsByKey = new Map<string, number>();
    for (const row of acquisitionRows) {
      const k = `${row.business_date}|${row.media_source}|${row.campaign}`;
      rawInstallsByKey.set(k, (rawInstallsByKey.get(k) ?? 0) + (row.installs as number));
    }

    // Rollup por template_id (so installs, so onde sub3 existe).
    const templateMap = new Map<string, number>();
    for (const row of acquisitionRows) {
      const sub3 = row.sub_param_3 as string;
      if (!sub3) continue;
      const k = `${row.business_date}|${sub3}`;
      templateMap.set(k, (templateMap.get(k) ?? 0) + (row.installs as number));
    }
    const templateRows = [...templateMap.entries()].map(([k, installs]) => {
      const [business_date, template_id] = k.split("|");
      return {
        business_date, template_id, af_installs: installs,
        af_clicks: null, af_sessions: null,
        metric_status: { af_installs: "confirmed", af_clicks: "not_available", af_sessions: "not_available" },
        quality_status: "complete",
        source_type: "appsflyer_pull_api_raw",
      };
    });
    if (installsReportsOk) await deleteTemplateWindow(opts.since, opts.until);
    const templateWritten = await upsertChunked(
      "appsflyer_template_daily",
      templateRows,
      "business_date,template_id",
    );

    // Agregado de campanha (sessao/clique) — endpoint separado, uma
    // chamada so pra janela inteira. Falha aqui NAO derruba a run: raw
    // (installs/uninstalls/reinstalls) e a prioridade e ja fica gravado.
    let campaignWritten = 0;
    let campaignRawReconciled = 0;
    let campaignError: string | null = null;
    try {
      const campaignCsv = await pullAggregateCampaignReport(opts.appId, opts.since, opts.until);
      const campaignParsed = parseAggregateCampaignCsv(campaignCsv);
      const campaignRows = buildCampaignRows(campaignParsed, opts.appId, opts.platform, mappings, rawInstallsByKey);
      campaignRawReconciled = campaignRows.filter(
        (r) => (r.metric_status as Record<string, string>)?.installs === "confirmed_via_raw_reconciled",
      ).length;
      await deleteWindow("appsflyer_campaign_daily", opts.appId, opts.platform, opts.since, opts.until);
      campaignWritten = await upsertChunked(
        "appsflyer_campaign_daily",
        campaignRows,
        "business_date,app_scope,app_id,platform,media_source,campaign",
      );
    } catch (e) {
      campaignError = redact((e as Error).message).slice(0, 300);
      console.error("partners_by_date_report falhou (nao aborta a run):", campaignError);
    }

    const totalRows = Object.values(perReportCounts).reduce((a, b) => a + b, 0);
    const hasReportErrors = Object.keys(reportErrors).length > 0;
    const status = (sub3CoveragePct !== null && sub3CoveragePct < 20) || hasReportErrors
      ? "partial"
      : "complete";

    await sb.from("appsflyer_collection_runs").update({
      status,
      completed_at: new Date().toISOString(),
      max_business_date: opts.until,
      row_count: totalRows,
      quality_summary: {
        app_id: opts.appId,
        platform: opts.platform,
        per_report_rows: perReportCounts,
        report_errors: reportErrors,
        acquisition_rows_written: acquisitionWritten,
        lifecycle_rows_written: lifecycleWritten,
        template_rows_written: templateWritten,
        campaign_rows_written: campaignWritten,
        campaign_installs_raw_reconciled: campaignRawReconciled,
        campaign_report_error: campaignError,
        campaign_report_note: "partners_by_date_report e LTV/cohort por data de install, nao 'sessoes que aconteceram no dia' em sentido estrito",
        sub_param_3_coverage_pct: sub3CoveragePct,
      },
    }).eq("id", runId);

    return {
      runId, status, totalRows, acquisitionWritten, lifecycleWritten, templateWritten,
      campaignWritten, campaignRawReconciled, campaignError, reportErrors, sub3CoveragePct,
    };
  } catch (e) {
    const message = redact((e as Error).message).slice(0, 500);
    await sb.from("appsflyer_collection_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: message,
    }).eq("id", runId);
    throw e;
  }
}

// ---------------------------------------------------------------------
// Endpoint governado. verify_jwt=false no deploy (o segredo do Vault nao
// e um JWT) — a autenticacao e feita aqui dentro, comparando o header
// Authorization com COLLECT_APPSFLYER_AUTH_KEY. Sem os dois secrets
// batendo, a chamada nunca chega no corpo da funcao.
// ---------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const authHeader = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${DISPATCH_AUTH_KEY}`;
  if (!DISPATCH_AUTH_KEY || !timingSafeEqual(authHeader, expected)) {
    return json({ error: "unauthorized" }, 401);
  }
  const b = await req.json().catch(() => ({}));
  const mode = b.mode;
  if (mode !== "daily" && mode !== "backfill") {
    return json({ error: "mode deve ser 'daily' ou 'backfill'" }, 400);
  }
  if (!b.app_id || !b.platform) {
    return json({ error: "app_id e platform sao obrigatorios" }, 400);
  }

  let since: string, until: string;
  if (mode === "daily") {
    until = lastClosedDay();
    since = daysBefore(until, ROLLING_WINDOW_DAYS - 1); // reprocessa N dias fechados
  } else {
    if (!b.since || !b.until) return json({ error: "backfill exige since e until" }, 400);
    since = b.since; until = b.until;
    if (until > lastClosedDay()) return json({ error: "periodo futuro/aberto nao permitido" }, 400);
    if (since > until) return json({ error: "periodo invertido" }, 400);
    const days = (Date.parse(until) - Date.parse(since)) / 86_400_000 + 1;
    if (days > MAX_BACKFILL_DAYS) {
      return json({ error: `periodo > ${MAX_BACKFILL_DAYS} dias nao permitido por chamada` }, 400);
    }
  }

  try {
    const result = await collectAppsflyer({ mode, appId: b.app_id, platform: b.platform, since, until });
    return json(result);
  } catch (e) {
    return json({ error: redact((e as Error).message) }, 500);
  }
});
