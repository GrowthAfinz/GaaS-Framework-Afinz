// report-sync-v4-setup
// Idempotent setup for the Report Live V4 sheet views and slide placeholders.
import "@supabase/functions-js/edge-runtime.d.ts";
import { usableNumericSeries } from "../_shared/report-live-chart-policy.ts";
import {
  accentFor,
  AFINZ_LIGHT,
  archetypeFor,
  layoutGeometryFor,
  minimumBodySize,
  reportLiveReleaseKey,
  REPORT_LIVE_DESIGN_VERSION,
  stableReportLiveObjectId,
} from "../_shared/report-live-design.ts";

const SHEET_ID = Deno.env.get("REPORT_SHEET_ID") ?? "";
const SLIDES_ID = Deno.env.get("REPORT_SLIDES_ID") ?? "";
const SA_RAW = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlBytes = (b: Uint8Array) => {
  let s = "";
  for (const c of b) s += String.fromCharCode(c);
  return b64url(s);
};

let tokenCache: { token: string; exp: number } | null = null;

async function googleToken(): Promise<string> {
  if (tokenCache && Date.now() / 1000 < tokenCache.exp - 60) return tokenCache.token;
  const sa = JSON.parse(SA_RAW);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  const jwt = `${input}.${b64urlBytes(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error(`Google auth failed: ${JSON.stringify(j).slice(0, 300)}`);
  tokenCache = { token: j.access_token, exp: now + 3500 };
  return j.access_token;
}

async function gFetch(url: string, init?: RequestInit): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = await googleToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return body;
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));
      continue;
    }
    throw new Error(`Google API ${res.status} em ${url.split("?")[0]}: ${JSON.stringify(body).slice(0, 500)}`);
  }
  throw new Error("Google API excedeu o número máximo de retentativas.");
}

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const SLIDES = "https://slides.googleapis.com/v1/presentations";
const sheetsGet = (range: string) => gFetch(`${SHEETS}/${SHEET_ID}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`);

type ChartType = "COLUMN" | "BAR" | "LINE";
type ViewDef = {
  order: number;
  block: string;
  tab: string;
  ph: string;
  slideTitle: string;
  grain: string;
  role: string;
  chart: { type: ChartType; domainCol: number; seriesCols: number[]; endRow: number; stacked?: "STACKED" | "PERCENT_STACKED" } | null;
  cells: Array<[string, string | number]>;
};

const formula = (value: string) => value;
// FIX (Claude, 08/07): OFFSET não aceita array — QUERY aninhada com "offset 1"
// remove a linha de cabeçalho automática dos agregados.
const q = (value: string) => {
  const expression = value.trim().startsWith("QUERY(") ? `QUERY(${value},"select * offset 1",0)` : value;
  return formula(`=IFERROR(${expression},"sem dados")`);
};
// Janela temporal única de TODAS as views V4 (controlada em REPORT_PROFILE!B10:B11)
const W = `date '"&TEXT(REPORT_PROFILE!$B$10,"yyyy-MM-dd")&"'`;
const W2 = `date '"&TEXT(REPORT_PROFILE!$B$11,"yyyy-MM-dd")&"'`;

const PROFILE_CELLS: Array<[string, string | number]> = [
  ["A1", "REPORT_PROFILE"],
  ["A2", "output_type"],
  ["B2", "monthly_report"],
  ["A3", "analysis_window"],
  ["B3", "selected_period"],
  ["A4", "comparison_window"],
  ["B4", "previous_equivalent_period"],
  ["A5", "context_window"],
  ["B5", "month_to_date_until_cutoff"],
  ["A6", "data_cutoff_rule"],
  ["B6", "latest_closed_day_available"],
  ["A7", "narrative_mode"],
  ["B7", "acompanhamento_growth"],
  ["A8", "delta_rule"],
  ["B8", "delta e apoio da analise; nao obrigar melhorou/piorou"],
  ["A10", "janela_inicio"],
  ["B10", "=DATE(2026,6,1)"],
  ["A11", "janela_fim"],
  ["B11", "=DATE(2026,6,30)"],
  ["A12", "nota"],
  ["B12", "B10/B11 controlam a janela de TODAS as views V4 — mude aqui para reprocessar outro período"],
];

const VIEWS: ViewDef[] = [
  {
    order: 1,
    block: "Cockpit Growth",
    tab: "VIEW_GROWTH_COCKPIT",
    ph: "v4_growth_cockpit",
    slideTitle: "Cockpit Growth",
    grain: "Resumo executivo por frente",
    role: "Estado da operacao e proxima acao.",
    chart: { type: "BAR", domainCol: 0, seriesCols: [1], endRow: 10 },
    cells: [
      ["A1", "frente"],
      ["B1", "investimento_midia"],
      ["C1", "cliques"],
      ["D1", "conversoes_plataforma"],
      ["E1", "cpc"],
      ["F1", "budget_mes"],
      ["G1", "pacing_vs_budget"],
      ["H1", "status"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, sum(H), sum(J), sum(K) where A >= ${W} and A <= ${W2} and G is not null group by G order by sum(H) desc")`)],
      ["E2", '=ARRAYFORMULA(IF(C2:C10>0,ROUND(B2:B10/C2:C10,2),))'],
      ["F2", '=ARRAYFORMULA(IF(A2:A10="",,IFERROR(VLOOKUP(A2:A10,CONFIG!$A$4:$B$7,2,0),0)))'],
      ["G2", '=ARRAYFORMULA(IF(F2:F10>0,ROUND(B2:B10/F2:F10,2),))'],
      ["H2", '=ARRAYFORMULA(IF(A2:A10="",,IF(G2:G10>1.1,"Acima do budget",IF(G2:G10<0.7,"Abaixo do ritmo","No ritmo"))))'],
      ["A12", "cartoes_crm_janela"],
      ["B12", '=SUMIFS(DB_CRM!K:K,DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A13", "custo_crm_janela"],
      ["B13", '=SUMIFS(DB_CRM!L:L,DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A14", "cac_crm_janela"],
      ["B14", '=IF(B12>0,ROUND(B13/B12,2),"")'],
    ],
  },
  {
    order: 2,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_BU",
    ph: "v4_aqs_bu",
    slideTitle: "Aquisicao CRM - BU",
    grain: "BU/frente",
    role: "Sustentacao de producao e eficiencia por frente.",
    chart: { type: "COLUMN", domainCol: 0, seriesCols: [5], endRow: 20 },
    cells: [
      ["A1", "bu"],
      ["B1", "quantidade_disparos"],
      ["C1", "base_acionada"],
      ["D1", "propostas"],
      ["E1", "aprovados"],
      ["F1", "cartoes_gerados"],
      ["G1", "custo"],
      ["H1", "taxa_conversao_base"],
      ["I1", "cac"],
      ["J1", "participacao_cartoes"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select B, count(G), sum(H), sum(I), sum(J), sum(K), sum(L) where A >= ${W} and A <= ${W2} and B is not null group by B order by sum(K) desc")`)],
      ["H2", '=ARRAYFORMULA(IF(C2:C20>0,F2:F20/C2:C20,))'],
      ["I2", '=ARRAYFORMULA(IF(F2:F20>0,ROUND(G2:G20/F2:F20,2),))'],
      ["J2", '=ARRAYFORMULA(IF(F2:F20>0,F2:F20/MAX(1,SUM($F$2:$F$20)),))'],
    ],
  },
  {
    order: 3,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_PARCEIRO",
    ph: "v4_aqs_parceiro",
    slideTitle: "Aquisicao CRM - Parceiros",
    grain: "Parceiro",
    role: "Importancia por volume, eficiencia, custo e risco.",
    chart: { type: "BAR", domainCol: 0, seriesCols: [4], endRow: 25 },
    cells: [
      ["A1", "parceiro"],
      ["B1", "bu"],
      ["C1", "quantidade_disparos"],
      ["D1", "base_acionada"],
      ["E1", "cartoes_gerados"],
      ["F1", "custo"],
      ["G1", "cac"],
      ["H1", "taxa_conversao_base"],
      ["I1", "mix_cartoes"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select C, B, count(G), sum(H), sum(K), sum(L) where A >= ${W} and A <= ${W2} and C is not null group by C, B order by sum(K) desc")`)],
      ["G2", '=ARRAYFORMULA(IF(E2:E25>0,ROUND(F2:F25/E2:E25,2),))'],
      ["H2", '=ARRAYFORMULA(IF(D2:D25>0,E2:E25/D2:D25,))'],
      ["I2", '=ARRAYFORMULA(IF(E2:E25>0,E2:E25/MAX(1,SUM($E$2:$E$25)),))'],
    ],
  },
  {
    order: 4,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_SEGMENTO__PARCEIRO",
    ph: "v4_aqs_segmento_parceiro",
    slideTitle: "Aquisicao CRM - Segmentos por Parceiro",
    grain: "Segmento dentro de parceiro",
    role: "Explicar resultado do parceiro por publico/funil.",
    chart: { type: "BAR", domainCol: 1, seriesCols: [6], endRow: 30 },
    cells: [
      ["A1", "parceiro"],
      ["B1", "segmento"],
      ["C1", "quantidade_disparos"],
      ["D1", "base_acionada"],
      ["E1", "propostas"],
      ["F1", "aprovados"],
      ["G1", "cartoes_gerados"],
      ["H1", "custo"],
      ["I1", "taxa_conversao_base"],
      ["J1", "cac"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select C, E, count(G), sum(H), sum(I), sum(J), sum(K), sum(L) where A >= ${W} and A <= ${W2} and C is not null and E is not null group by C, E order by sum(K) desc limit 25")`)],
      ["I2", '=ARRAYFORMULA(IF(D2:D30>0,G2:G30/D2:D30,))'],
      ["J2", '=ARRAYFORMULA(IF(G2:G30>0,ROUND(H2:H30/G2:G30,2),))'],
    ],
  },
  {
    order: 5,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_CANAL__PARCEIRO__SEGMENTO",
    ph: "v4_aqs_canal_parceiro_segmento",
    slideTitle: "Aquisicao CRM - Canal por Parceiro e Segmento",
    grain: "Canal dentro de parceiro e segmento",
    role: "Diagnosticar alavanca ou gargalo de canal.",
    chart: { type: "BAR", domainCol: 2, seriesCols: [6], endRow: 30 },
    cells: [
      ["A1", "parceiro"],
      ["B1", "segmento"],
      ["C1", "canal"],
      ["D1", "quantidade_disparos"],
      ["E1", "base_acionada"],
      ["F1", "propostas"],
      ["G1", "cartoes"],
      ["H1", "custo_total"],
      ["I1", "taxa_proposta"],
      ["J1", "cac"],
      ["K1", "alerta"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select C, E, D, count(G), sum(H), sum(I), sum(K), sum(L) where A >= ${W} and A <= ${W2} and C is not null and E is not null and D is not null group by C, E, D order by sum(K) desc limit 30")`)],
      ["I2", '=ARRAYFORMULA(IF(E2:E35>0,F2:F35/E2:E35,))'],
      ["J2", '=ARRAYFORMULA(IF(G2:G35>0,ROUND(H2:H35/G2:G35,2),))'],
    ],
  },
  {
    order: 6,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_FUNIL__PARCEIRO",
    ph: "v4_aqs_funil_parceiro",
    slideTitle: "Aquisicao CRM - Funil por Parceiro",
    grain: "Funil por parceiro",
    role: "Mostrar onde a producao escapa.",
    chart: { type: "COLUMN", domainCol: 0, seriesCols: [1, 2, 3, 4], endRow: 25 },
    cells: [
      ["A1", "parceiro"],
      ["B1", "base"],
      ["C1", "propostas"],
      ["D1", "aprovados"],
      ["E1", "cartoes"],
      ["F1", "taxa_proposta"],
      ["G1", "taxa_aprovacao"],
      ["H1", "taxa_cartao_base"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select C, sum(H), sum(I), sum(J), sum(K) where A >= ${W} and A <= ${W2} and C is not null group by C order by sum(K) desc")`)],
      ["F2", '=ARRAYFORMULA(IF(B2:B25>0,C2:C25/B2:B25,))'],
      ["G2", '=ARRAYFORMULA(IF(C2:C25>0,D2:D25/C2:C25,))'],
      ["H2", '=ARRAYFORMULA(IF(B2:B25>0,E2:E25/B2:B25,))'],
    ],
  },
  {
    order: 7,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_TOP_CAMPANHAS__PARCEIRO",
    ph: "v4_aqs_top_campanhas_parceiro",
    slideTitle: "Aquisicao CRM - Top Campanhas por Parceiro",
    grain: "Campanhas/disparos por parceiro",
    role: "Explicar producao ou risco por disparo.",
    chart: { type: "BAR", domainCol: 2, seriesCols: [6], endRow: 25 },
    cells: [
      ["A1", "parceiro"],
      ["B1", "jornada"],
      ["C1", "activity_name"],
      ["D1", "segmento"],
      ["E1", "canal"],
      ["F1", "base_acionada"],
      ["G1", "cartoes_gerados"],
      ["H1", "custo"],
      ["I1", "conversao"],
      ["J1", "cac"],
      ["K1", "motivo_do_destaque"],
      ["L1", "acao_recomendada"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select C, F, G, E, D, sum(H), sum(K), sum(L) where A >= ${W} and A <= ${W2} and G is not null group by C, F, G, E, D order by sum(K) desc limit 20")`)],
      ["I2", '=ARRAYFORMULA(IF(F2:F25>0,G2:G25/F2:F25,))'],
      ["J2", '=ARRAYFORMULA(IF(G2:G25>0,ROUND(H2:H25/G2:G25,2),))'],
    ],
  },
  {
    order: 8,
    block: "Aquisicao CRM",
    tab: "VIEW_AQS_ACTION_QUEUE__PARCEIRO",
    ph: "v4_aqs_action_queue_parceiro",
    slideTitle: "Aquisicao CRM - Action Queue por Parceiro",
    grain: "Acoes por parceiro",
    role: "Fechar com fila operacional.",
    chart: null,
    cells: [
      ["A1", "prioridade"],
      ["B1", "bucket"],
      ["C1", "parceiro"],
      ["D1", "segmento"],
      ["E1", "problema"],
      ["F1", "evidencia"],
      ["G1", "acao"],
      ["H1", "janela"],
      ["I1", "metrica_de_sucesso"],
      ["J1", "confianca"],
      ["A2", "1"],
      ["B2", "Investigar"],
      ["E2", "preencher pela IA/humano a partir das views"],
    ],
  },
  {
    order: 9,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_PACING__OBJETIVO",
    ph: "v4_media_pacing_objetivo",
    slideTitle: "Midia Paga - Pacing por Objetivo",
    grain: "Objetivo de midia",
    role: "Controlar gasto, ritmo e entrega por objetivo.",
    chart: { type: "BAR", domainCol: 0, seriesCols: [1, 3], endRow: 20 },
    cells: [
      ["A1", "frente"],
      ["B1", "investimento"],
      ["C1", "resultado_plataforma"],
      ["D1", "budget"],
      ["E1", "pct_consumo"],
      ["F1", "custo_por_resultado"],
      ["G1", "status"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, sum(H), sum(K) where A >= ${W} and A <= ${W2} and G is not null group by G order by sum(H) desc")`)],
      ["D2", '=ARRAYFORMULA(IF(A2:A10="",,IFERROR(VLOOKUP(A2:A10,CONFIG!$A$4:$B$7,2,0),0)))'],
      ["E2", '=ARRAYFORMULA(IF(D2:D10>0,B2:B10/D2:D10,))'],
      ["F2", '=ARRAYFORMULA(IF(C2:C10>0,ROUND(B2:B10/C2:C10,2),))'],
      ["G2", '=ARRAYFORMULA(IF(A2:A10="",,IF(E2:E10>1.1,"Acima",IF(E2:E10<0.7,"Abaixo","No ritmo"))))'],
    ],
  },
  {
    order: 10,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_OBJETIVO_PLATAFORMA",
    ph: "v4_media_objetivo_plataforma",
    slideTitle: "Midia Paga - Objetivo x Plataforma",
    grain: "Objetivo x plataforma",
    role: "Entender dependencia e eficiencia por plataforma.",
    chart: { type: "COLUMN", domainCol: 0, seriesCols: [3], endRow: 30 },
    cells: [
      ["A1", "frente"],
      ["B1", "plataforma"],
      ["C1", "objetivo"],
      ["D1", "investimento"],
      ["E1", "impressoes"],
      ["F1", "cliques"],
      ["G1", "conversoes"],
      ["H1", "alcance"],
      ["I1", "cpm"],
      ["J1", "ctr"],
      ["K1", "cpc"],
      ["L1", "cpa_plataforma"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, B, D, sum(H), sum(I), sum(J), sum(K), sum(L) where A >= ${W} and A <= ${W2} and G is not null and B is not null group by G, B, D order by sum(H) desc")`)],
      ["I2", '=ARRAYFORMULA(IF(E2:E40>0,ROUND(D2:D40/E2:E40*1000,2),))'],
      ["J2", '=ARRAYFORMULA(IF(E2:E40>0,F2:F40/E2:E40,))'],
      ["K2", '=ARRAYFORMULA(IF(F2:F40>0,ROUND(D2:D40/F2:F40,2),))'],
      ["L2", '=ARRAYFORMULA(IF(G2:G40>0,ROUND(D2:D40/G2:G40,2),))'],
    ],
  },
  {
    order: 11,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_CAMPANHAS__OBJETIVO",
    ph: "v4_media_campanhas_objetivo",
    slideTitle: "Midia Paga - Campanhas por Objetivo",
    grain: "Campanha por objetivo",
    role: "Explicar producao, desperdicio ou concentracao.",
    chart: { type: "BAR", domainCol: 1, seriesCols: [3], endRow: 30 },
    cells: [
      ["A1", "frente"],
      ["B1", "campanha"],
      ["C1", "plataforma"],
      ["D1", "investimento"],
      ["E1", "impressoes"],
      ["F1", "cliques"],
      ["G1", "conversoes"],
      ["H1", "cpm"],
      ["I1", "ctr"],
      ["J1", "cpc"],
      ["K1", "cpa_plataforma"],
      ["L1", "diagnostico"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, C, B, sum(H), sum(I), sum(J), sum(K) where A >= ${W} and A <= ${W2} and C is not null group by G, C, B order by sum(H) desc limit 25")`)],
      ["H2", '=ARRAYFORMULA(IF(E2:E30>0,ROUND(D2:D30/E2:E30*1000,2),))'],
      ["I2", '=ARRAYFORMULA(IF(E2:E30>0,F2:F30/E2:E30,))'],
      ["J2", '=ARRAYFORMULA(IF(F2:F30>0,ROUND(D2:D30/F2:F30,2),))'],
      ["K2", '=ARRAYFORMULA(IF(G2:G30>0,ROUND(D2:D30/G2:G30,2),))'],
    ],
  },
  {
    order: 12,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_CRIATIVOS__OBJETIVO",
    ph: "v4_media_criativos_objetivo",
    slideTitle: "Midia Paga - Criativos por Objetivo",
    grain: "Criativo/grupo/campanha por objetivo",
    role: "Mostrar tracao, fadiga ou concentracao criativa.",
    chart: { type: "BAR", domainCol: 3, seriesCols: [4], endRow: 30 },
    cells: [
      ["A1", "frente"],
      ["B1", "campanha"],
      ["C1", "grupo_anuncio"],
      ["D1", "criativo"],
      ["E1", "investimento"],
      ["F1", "impressoes"],
      ["G1", "cliques"],
      ["H1", "resultado"],
      ["I1", "ctr"],
      ["J1", "cpc"],
      ["K1", "custo_resultado"],
      ["L1", "sinal_criativo"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, C, F, E, sum(H), sum(I), sum(J), sum(K) where A >= ${W} and A <= ${W2} and E is not null group by G, C, F, E order by sum(H) desc limit 25")`)],
      ["I2", '=ARRAYFORMULA(IF(F2:F30>0,G2:G30/F2:F30,))'],
      ["J2", '=ARRAYFORMULA(IF(G2:G30>0,ROUND(E2:E30/G2:G30,2),))'],
      ["K2", '=ARRAYFORMULA(IF(H2:H30>0,ROUND(E2:E30/H2:H30,2),))'],
    ],
  },
  {
    order: 13,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO",
    ph: "v4_media_tracking_quality_objetivo",
    slideTitle: "Midia Paga - Qualidade de Tracking por Objetivo",
    grain: "Qualidade por objetivo",
    role: "Separar performance real de limite de mensuracao.",
    chart: null,
    cells: [
      ["A1", "frente"],
      ["B1", "campanhas"],
      ["C1", "investimento"],
      ["D1", "cliques"],
      ["E1", "conversoes"],
      ["F1", "conv_por_1k_cliques"],
      ["G1", "alerta"],
      ["A2", q(`QUERY(DB_MIDIA!A2:L,"select G, count(C), sum(H), sum(J), sum(K) where A >= ${W} and A <= ${W2} and G is not null group by G order by sum(H) desc")`)],
      ["F2", '=ARRAYFORMULA(IF(D2:D10>0,ROUND(E2:E10/D2:D10*1000,1),))'],
      ["G2", '=ARRAYFORMULA(IF(A2:A10="",,IF((E2:E10=0)*(D2:D10>200),"ZERAMENTO: auditar tracking",IF(F2:F10<5,"baixa densidade de conversao","ok"))))'],
    ],
  },
  {
    order: 14,
    block: "Midia Paga",
    tab: "VIEW_MEDIA_ACTION_QUEUE__OBJETIVO",
    ph: "v4_media_action_queue_objetivo",
    slideTitle: "Midia Paga - Action Queue por Objetivo",
    grain: "Acoes por objetivo",
    role: "Fechar midia com acompanhamento growth.",
    chart: null,
    cells: [
      ["A1", "prioridade"],
      ["B1", "bucket"],
      ["C1", "objetivo"],
      ["D1", "campanha"],
      ["E1", "problema"],
      ["F1", "evidencia"],
      ["G1", "acao"],
      ["H1", "janela"],
      ["I1", "metrica_de_sucesso"],
      ["J1", "risco_se_nao_agir"],
      ["K1", "confianca"],
      ["A2", "1"],
      ["B2", "Acompanhar"],
      ["E2", "preencher pela IA/humano a partir das views"],
    ],
  },
  {
    order: 15,
    block: "Seguros",
    tab: "VIEW_SEGUROS_SUMMARY",
    ph: "v4_seguros_summary",
    slideTitle: "Seguros - Resumo CRM + Midia",
    grain: "Resumo de seguros",
    role: "Conectar seguros com CRM e midia.",
    chart: null,
    cells: [
      ["A1", "metrica"],
      ["B1", "valor"],
      ["A2", "investimento_midia"],
      ["B2", '=SUMIFS(DB_MIDIA!H:H,DB_MIDIA!G:G,"Seguros",DB_MIDIA!A:A,">="&REPORT_PROFILE!$B$10,DB_MIDIA!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A3", "cliques_midia"],
      ["B3", '=SUMIFS(DB_MIDIA!J:J,DB_MIDIA!G:G,"Seguros",DB_MIDIA!A:A,">="&REPORT_PROFILE!$B$10,DB_MIDIA!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A4", "leads_midia"],
      ["B4", '=SUMIFS(DB_MIDIA!K:K,DB_MIDIA!G:G,"Seguros",DB_MIDIA!A:A,">="&REPORT_PROFILE!$B$10,DB_MIDIA!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A5", "cpl_midia"],
      ["B5", '=IF(B4>0,ROUND(B2/B4,2),"")'],
      ["A6", "disparos_crm"],
      ["B6", '=COUNTIFS(DB_CRM!B:B,"Seguros",DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A7", "base_acionada_crm"],
      ["B7", '=SUMIFS(DB_CRM!H:H,DB_CRM!B:B,"Seguros",DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A8", "cartoes_crm"],
      ["B8", '=SUMIFS(DB_CRM!K:K,DB_CRM!B:B,"Seguros",DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A9", "custo_crm"],
      ["B9", '=SUMIFS(DB_CRM!L:L,DB_CRM!B:B,"Seguros",DB_CRM!A:A,">="&REPORT_PROFILE!$B$10,DB_CRM!A:A,"<="&REPORT_PROFILE!$B$11)'],
      ["A10", "cac_crm"],
      ["B10", '=IF(B8>0,ROUND(B9/B8,2),"")'],
    ],
  },
  {
    order: 16,
    block: "Seguros",
    tab: "VIEW_SEGUROS_ACTIONS",
    ph: "v4_seguros_actions",
    slideTitle: "Seguros - Acoes",
    grain: "Acoes de seguros",
    role: "Acionar pendencias ou oportunidades.",
    chart: null,
    cells: [
      ["A1", "prioridade"],
      ["B1", "produto"],
      ["C1", "sinal"],
      ["D1", "evidencia"],
      ["E1", "acao"],
      ["F1", "dependencia"],
      ["G1", "metrica_de_sucesso"],
    ],
  },
  {
    order: 17,
    block: "Matriz Estrategica",
    tab: "VIEW_GROWTH_MATRIX_FRENTE_PARCEIRO_SEGMENTO",
    ph: "v4_growth_matrix",
    slideTitle: "Matriz Estrategica - Frente x Parceiro x Segmento",
    grain: "Frente x parceiro x segmento",
    role: "Tabela-mae da inteligencia.",
    chart: null,
    cells: [
      ["A1", "bu"],
      ["B1", "parceiro"],
      ["C1", "segmento"],
      ["D1", "cartoes"],
      ["E1", "custo"],
      ["F1", "cac"],
      ["G1", "mix_cartoes"],
      ["H1", "papel_no_funil"],
      ["I1", "kpi_norte"],
      ["J1", "risco"],
      ["K1", "oportunidade"],
      ["A2", q(`QUERY(DB_CRM!A2:L,"select B, C, E, sum(K), sum(L) where A >= ${W} and A <= ${W2} and B is not null group by B, C, E order by sum(K) desc limit 40")`)],
      ["F2", '=ARRAYFORMULA(IF(D2:D45>0,ROUND(E2:E45/D2:D45,2),))'],
      ["G2", '=ARRAYFORMULA(IF(D2:D45>0,D2:D45/MAX(1,SUM($D$2:$D$45)),))'],
    ],
  },
];

function contractRows(): unknown[][] {
  return [
    ["ordem_tecnica", "bloco", "view", "grao", "placeholder", "papel_operacional"],
    ...VIEWS.map((v) => [v.order, v.block, v.tab, v.grain, v.ph, v.role]),
  ];
}

async function ensureTabs(tabs: string[]) {
  const meta = await gFetch(`${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title),charts(chartId))`);
  const byTitle: Record<string, { sheetId: number; chartIds: number[] }> = {};
  for (const s of meta.sheets ?? []) {
    byTitle[s.properties.title] = {
      sheetId: s.properties.sheetId,
      chartIds: (s.charts ?? []).map((c: any) => c.chartId),
    };
  }
  const requests = tabs.filter((title) => !byTitle[title]).map((title) => ({ addSheet: { properties: { title } } }));
  let tabsCreated = 0;
  if (requests.length) {
    const resp = await gFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
    for (const r of resp.replies ?? []) {
      const p = r.addSheet?.properties;
      if (p) {
        byTitle[p.title] = { sheetId: p.sheetId, chartIds: [] };
        tabsCreated += 1;
      }
    }
  }
  return { byTitle, tabsCreated };
}

async function writeValues() {
  // FIX (Claude, 08/07): limpa as views antes de regravar — células órfãs de
  // layouts antigos bloqueiam a expansão de QUERY/ARRAYFORMULA.
  await gFetch(`${SHEETS}/${SHEET_ID}/values:batchClear`, {
    method: "POST",
    body: JSON.stringify({ ranges: VIEWS.map((v) => `${v.tab}!A1:R60`) }),
  });
  const data: Array<{ range: string; values: unknown[][] }> = [];
  for (const [cell, value] of PROFILE_CELLS) data.push({ range: `REPORT_PROFILE!${cell}`, values: [[value]] });
  data.push({ range: "VIEW_CONTRACT!A1", values: contractRows() });
  for (const v of VIEWS) {
    for (const [cell, value] of v.cells) data.push({ range: `${v.tab}!${cell}`, values: [[value]] });
  }
  await gFetch(`${SHEETS}/${SHEET_ID}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
}

async function ensureCharts(byTitle: Record<string, { sheetId: number; chartIds: number[] }>) {
  const chartByView: Record<string, number> = {};
  const requests: any[] = [];
  const chartOrder: string[] = [];
  for (const v of VIEWS) {
    if (!v.chart) continue;
    const info = byTitle[v.tab];
    if (!info) continue;
    if (info.chartIds.length) {
      chartByView[v.tab] = info.chartIds[0];
      continue;
    }
    const axis = v.chart.type === "BAR" ? "BOTTOM_AXIS" : "LEFT_AXIS";
    const src = (col: number) => ({
      sources: [{
        sheetId: info.sheetId,
        startRowIndex: 0,
        endRowIndex: v.chart!.endRow,
        startColumnIndex: col,
        endColumnIndex: col + 1,
      }],
    });
    requests.push({
      addChart: {
        chart: {
          spec: {
            title: v.slideTitle,
            basicChart: {
              chartType: v.chart.type,
              ...(v.chart.stacked ? { stackedType: v.chart.stacked } : {}),
              legendPosition: "BOTTOM_LEGEND",
              headerCount: 1,
              domains: [{ domain: { sourceRange: src(v.chart.domainCol) } }],
              series: v.chart.seriesCols.map((c) => ({
                series: { sourceRange: src(c) },
                targetAxis: axis,
              })),
            },
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId: info.sheetId, rowIndex: 1, columnIndex: 14 },
              widthPixels: 620,
              heightPixels: 360,
            },
          },
        },
      },
    });
    chartOrder.push(v.tab);
  }
  if (requests.length) {
    const resp = await gFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
    (resp.replies ?? []).forEach((r: any, i: number) => {
      if (r.addChart?.chart?.chartId != null) chartByView[chartOrder[i]] = r.addChart.chart.chartId;
    });
  }
  return chartByView;
}

async function ensureSlides(chartByView: Record<string, number>) {
  const pres = await gFetch(`${SLIDES}/${SLIDES_ID}?fields=slides(pageElements(objectId,title))`);
  const existingPh = new Set<string>();
  for (const s of pres.slides ?? []) {
    for (const el of s.pageElements ?? []) {
      if ((el.title ?? "").startsWith("ph:")) existingPh.add(el.title.slice(3));
    }
  }
  const requests: any[] = [];
  let slidesCreated = 0;
  for (const v of VIEWS) {
    if (existingPh.has(v.ph)) continue;
    const sid = `v4sld_${v.ph}`;
    const tid = `v4ttl_${v.ph}`;
    const cid = `v4cmt_${v.ph}`;
    const gid = `v4cht_${v.ph}`;
    requests.push({ createSlide: { objectId: sid, slideLayoutReference: { predefinedLayout: "BLANK" } } });
    requests.push({
      createShape: {
        objectId: tid,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: sid,
          size: { width: { magnitude: 640, unit: "PT" }, height: { magnitude: 42, unit: "PT" } },
          transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 20, unit: "PT" },
        },
      },
    });
    requests.push({ insertText: { objectId: tid, insertionIndex: 0, text: v.slideTitle } });
    requests.push({
      updateTextStyle: {
        objectId: tid,
        textRange: { type: "ALL" },
        style: { bold: true, fontSize: { magnitude: 20, unit: "PT" } },
        fields: "bold,fontSize",
      },
    });
    if (v.chart && chartByView[v.tab] != null) {
      requests.push({
        createSheetsChart: {
          objectId: gid,
          spreadsheetId: SHEET_ID,
          chartId: chartByView[v.tab],
          linkingMode: "LINKED",
          elementProperties: {
            pageObjectId: sid,
            size: { width: { magnitude: 430, unit: "PT" }, height: { magnitude: 290, unit: "PT" } },
            transform: { scaleX: 1, scaleY: 1, translateX: 25, translateY: 75, unit: "PT" },
          },
        },
      });
    }
    requests.push({
      createShape: {
        objectId: cid,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: sid,
          size: { width: { magnitude: 230, unit: "PT" }, height: { magnitude: 290, unit: "PT" } },
          transform: { scaleX: 1, scaleY: 1, translateX: 465, translateY: 75, unit: "PT" },
        },
      },
    });
    requests.push({ insertText: { objectId: cid, insertionIndex: 0, text: `{{${v.ph}}}` } });
    requests.push({
      updateTextStyle: {
        objectId: cid,
        textRange: { type: "ALL" },
        style: { fontSize: { magnitude: 12, unit: "PT" } },
        fields: "fontSize",
      },
    });
    requests.push({ updatePageElementAltText: { objectId: cid, title: `ph:${v.ph}` } });
    slidesCreated += 1;
  }
  if (requests.length) {
    await gFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }
  return { slidesCreated };
}

async function setupViews() {
  if (!SHEET_ID || !SLIDES_ID || !SA_RAW) throw new Error("Secrets REPORT_SHEET_ID, REPORT_SLIDES_ID ou GOOGLE_SERVICE_ACCOUNT_JSON ausentes.");
  const wantedTabs = ["REPORT_PROFILE", "VIEW_CONTRACT", ...VIEWS.map((v) => v.tab)];
  const { byTitle, tabsCreated } = await ensureTabs(wantedTabs);
  await writeValues();
  const chartByView = await ensureCharts(byTitle);
  const { slidesCreated } = await ensureSlides(chartByView);
  return {
    tabs_created: tabsCreated,
    views: VIEWS.length,
    charts_available: Object.keys(chartByView).length,
    slides_created: slidesCreated,
    placeholders: VIEWS.map((v) => v.ph),
  };
}

async function inspectViews() {
  const inspected: Array<{ view: string; rows: number; columns: number; has_error: boolean; sample: unknown[][] }> = [];
  for (const v of VIEWS) {
    const response = await sheetsGet(`${v.tab}!A1:N8`);
    const values: unknown[][] = response.values ?? [];
    const flat = values.flat().map((value) => String(value ?? ""));
    inspected.push({
      view: v.tab,
      rows: values.length,
      columns: values.reduce((max, row) => Math.max(max, row.length), 0),
      has_error: flat.some((value) => value.startsWith("#") || /erro|error|sem dados/i.test(value)) || values.length < 2,
      sample: values.slice(0, 4),
    });
  }
  return inspected;
}

// FIX (Claude): "Data de Disparo" é timestamptz no Postgres — o ISO com "T"
// não é reconhecido pelo Sheets e a coluna A do DB_CRM vira texto, matando as
// QUERYs com filtro de data. Este modo trunca para yyyy-MM-dd e regrava.
async function fixCrmDates() {
  const r = await gFetch(`${SHEETS}/${SHEET_ID}/values/${encodeURIComponent("DB_CRM!A2:A")}`);
  const rows: string[][] = r.values ?? [];
  if (!rows.length) return { rows_fixed: 0 };
  const fixed = rows.map((row) => [String(row[0] ?? "").slice(0, 10)]);
  await gFetch(`${SHEETS}/${SHEET_ID}/values/${encodeURIComponent(`DB_CRM!A2:A${rows.length + 1}`)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: fixed }),
  });
  return { rows_fixed: fixed.length };
}

type V1RegistryRow = {
  slide_instance_id: string;
  slide_code: string;
  section: string;
  title: string;
  audience: string;
  source_view: string;
  partner: string;
  eligibility: "render" | "render_com_limites" | "omitir_bloqueado";
  confidence: string;
  display_order: number;
};

type V1ChartConfig = {
  type: "COLUMN" | "BAR" | "LINE" | "SCATTER";
  domain: string;
  series: string[];
};

type EditorialChartSeries = {
  column_index: number;
  label: string;
  color: string;
  axis: "LEFT_AXIS" | "RIGHT_AXIS";
  line_width: number;
  point_size: number;
  number_format_type: "NUMBER" | "CURRENCY" | "PERCENT";
  number_format_pattern: string;
};

type EditorialChartPlan = {
  slide_instance_id: string;
  slide_code: string;
  chart_key: string;
  family_view: string;
  chart_type: "LINE";
  title: string;
  start_row_index: number;
  end_row_index: number;
  domain_column_index: number;
  domain_title: string;
  left_axis_title: string;
  right_axis_title: string;
  series: EditorialChartSeries[];
  expected_chart_count: number;
};

type EditorialRulerRow = {
  slide_instance_id: string;
  metric_order: number;
  metric_label: string;
  value_text: string;
  delta_text: string;
  range_text: string;
  verdict_text: string;
  limitation: string;
};

type EditorialLayoutRow = {
  slide_instance_id: string;
  layout: string;
  support_text: string;
  expected_chart: boolean;
};

type ChartManifestItem = {
  slide_instance_id: string;
  chart_id: number;
  family_view: string;
  physical_sheet_title: string;
  expected_chart_count: number;
};

const V1_COLORS = {
  background: AFINZ_LIGHT.canvas,
  panel: AFINZ_LIGHT.surface,
  panelLight: AFINZ_LIGHT.surfaceMuted,
  white: AFINZ_LIGHT.text,
  muted: AFINZ_LIGHT.textMuted,
  cyan: AFINZ_LIGHT.cyan,
  lime: AFINZ_LIGHT.lime,
  blue: AFINZ_LIGHT.blue,
  green: AFINZ_LIGHT.green,
  purple: AFINZ_LIGHT.purple,
  red: AFINZ_LIGHT.red,
};

function rgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    red: parseInt(value.slice(0, 2), 16) / 255,
    green: parseInt(value.slice(2, 4), 16) / 255,
    blue: parseInt(value.slice(4, 6), 16) / 255,
  };
}

async function readV1Table(range: string): Promise<Record<string, string>[]> {
  const response = await sheetsGet(range);
  const values: string[][] = response.values ?? [];
  if (values.length < 2) return [];
  const headers = values[0].map((value) => String(value ?? ""));
  return values.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "")]))
  );
}

async function readEditorialData(sheetTitleMap: Record<string, string>) {
  const read = async (logicalView: string) => {
    const physical = sheetTitleMap[logicalView];
    return physical ? await readV1Table(`${physical}!A:AZ`) : [];
  };
  const [rawPlans, rawRulers, rawLayouts] = await Promise.all([
    read("VIEW_EDITORIAL_CHART_REGISTRY"),
    read("VIEW_EDITORIAL_RULERS"),
    read("VIEW_EDITORIAL_LAYOUTS"),
  ]);
  const plans: EditorialChartPlan[] = rawPlans.map((row) => {
    let series: EditorialChartSeries[] = [];
    try {
      const parsed = JSON.parse(String(row.series_json ?? "[]"));
      if (Array.isArray(parsed)) series = parsed as EditorialChartSeries[];
    } catch (_) {
      series = [];
    }
    return {
      slide_instance_id: String(row.slide_instance_id ?? ""),
      slide_code: String(row.slide_code ?? ""),
      chart_key: String(row.chart_key ?? ""),
      family_view: String(row.family_view ?? ""),
      chart_type: "LINE" as const,
      title: String(row.title ?? ""),
      start_row_index: Number(row.start_row_index ?? 0),
      end_row_index: Number(row.end_row_index ?? 0),
      domain_column_index: Number(row.domain_column_index ?? 0),
      domain_title: String(row.domain_title ?? "Período"),
      left_axis_title: String(row.left_axis_title ?? ""),
      right_axis_title: String(row.right_axis_title ?? ""),
      series,
      expected_chart_count: Number(row.expected_chart_count ?? 1),
    };
  }).filter((plan) =>
    plan.slide_instance_id && plan.family_view && plan.series.length &&
    plan.end_row_index > plan.start_row_index + 1
  );
  const rulers: EditorialRulerRow[] = rawRulers.map((row) => ({
    slide_instance_id: String(row.slide_instance_id ?? ""),
    metric_order: Number(row.metric_order ?? 0),
    metric_label: String(row.metric_label ?? ""),
    value_text: String(row.value_text ?? ""),
    delta_text: String(row.delta_text ?? ""),
    range_text: String(row.range_text ?? ""),
    verdict_text: String(row.verdict_text ?? ""),
    limitation: String(row.limitation ?? ""),
  })).filter((row) => row.slide_instance_id && row.metric_label);
  const layouts: EditorialLayoutRow[] = rawLayouts.map((row) => ({
    slide_instance_id: String(row.slide_instance_id ?? ""),
    layout: String(row.layout ?? ""),
    support_text: String(row.support_text ?? ""),
    expected_chart: String(row.expected_chart ?? "").toLowerCase() === "true",
  })).filter((row) => row.slide_instance_id);
  return { plans, rulers, layouts };
}

function normalizeV1Registry(rows: Record<string, unknown>[]): V1RegistryRow[] {
  return rows.map((row) => ({
    slide_instance_id: String(row.slide_instance_id ?? ""),
    slide_code: String(row.slide_code ?? ""),
    section: String(row.section ?? ""),
    title: String(row.title ?? ""),
    audience: String(row.audience ?? ""),
    source_view: String(row.source_view ?? ""),
    partner: String(row.partner ?? ""),
    eligibility: String(row.eligibility ?? "") as V1RegistryRow["eligibility"],
    confidence: String(row.confidence ?? ""),
    display_order: Number(row.display_order ?? 999),
  }))
    .filter((row) =>
      row.slide_instance_id &&
      row.slide_code &&
      ["render", "render_com_limites", "omitir_bloqueado"].includes(row.eligibility)
    )
    .sort((a, b) => a.display_order - b.display_order);
}

async function readV1Registry(): Promise<V1RegistryRow[]> {
  // Compatibilidade explícita para recuperação legada. A publicação normal passa
  // o registry do artefato certificado e não depende desta leitura do Sheets.
  const rows = await readV1Table("VIEW_REGISTRY!A:J");
  return normalizeV1Registry(rows);
}

function chartConfigFor(code: string): V1ChartConfig | null {
  const configs: Record<string, V1ChartConfig> = {
    C5: { type: "BAR", domain: "partner", series: ["cards"] },
    C6: { type: "SCATTER", domain: "conversion", series: ["cac"] },
    P2: { type: "BAR", domain: "segment", series: ["cards"] },
    P3: { type: "BAR", domain: "channel", series: ["cards"] },
    P4: { type: "COLUMN", domain: "stage", series: ["value"] },
    P5: { type: "BAR", domain: "activity_name", series: ["cards"] },
    P6: { type: "BAR", domain: "segment", series: ["dispatches_per_100k_base"] },
    M1: { type: "BAR", domain: "objective", series: ["spend", "budget"] },
    M2: { type: "COLUMN", domain: "channel", series: ["spend"] },
    M3: { type: "BAR", domain: "display_name", series: ["spend"] },
    M4: { type: "COLUMN", domain: "campaign", series: ["clicks", "installs", "start_trials"] },
    M5: { type: "BAR", domain: "ad_name", series: ["clicks"] },
    B1: { type: "BAR", domain: "source_type", series: ["emissions"] },
    B2: { type: "LINE", domain: "date", series: ["emissions"] },
    "K-TPL": { type: "BAR", domain: "scope", series: ["coverage"] },
    A1: { type: "BAR", domain: "partner", series: ["cards"] },
  };
  return configs[code] ?? null;
}

async function ensureV1Charts(
  registry: V1RegistryRow[],
  sheetTitleMap: Record<string, string> = {},
  editorialPlans: EditorialChartPlan[] = [],
) {
  const metadata = await gFetch(
    `${SHEETS}/${SHEET_ID}?fields=sheets(properties(sheetId,title,gridProperties(rowCount)),charts(chartId,position(overlayPosition(anchorCell(sheetId,rowIndex,columnIndex)))))`,
  );
  const sheetByTitle = new Map<string, {
    sheetId: number;
    rowCount: number;
    charts: Array<{ chartId: number; anchorRow: number }>;
  }>();
  for (const sheet of metadata.sheets ?? []) {
    sheetByTitle.set(sheet.properties.title, {
      sheetId: sheet.properties.sheetId,
      rowCount: Number(sheet.properties.gridProperties?.rowCount ?? 0),
      charts: (sheet.charts ?? []).map((chart: any) => ({
        chartId: Number(chart.chartId),
        anchorRow: Number(chart.position?.overlayPosition?.anchorCell?.rowIndex ?? -1),
      })),
    });
  }
  const chartBySlide: Record<string, number> = {};
  const chartManifest: ChartManifestItem[] = [];
  const requests: any[] = [];
  const pendingAdds: Array<{ slide: V1RegistryRow; familyView: string; physicalTitle: string }> = [];
  const styledSheets = new Set<number>();
  const editorialBySlide = new Map(editorialPlans.map((plan) => [plan.slide_instance_id, plan]));
  const expectedEditorialAnchors = new Map<number, Set<number>>();

  const styleSheet = (info: { sheetId: number; rowCount: number }) => {
    if (styledSheets.has(info.sheetId)) return;
    requests.push({
      repeatCell: {
        range: { sheetId: info.sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: rgb(AFINZ_LIGHT.surfaceMuted),
            textFormat: { foregroundColor: rgb(AFINZ_LIGHT.text), bold: true },
            horizontalAlignment: "CENTER",
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    });
    if (info.rowCount > 1) requests.push({
      updateSheetProperties: {
        properties: { sheetId: info.sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    });
    styledSheets.add(info.sheetId);
  };

  for (const item of registry) {
    if (item.eligibility === "omitir_bloqueado" || !item.source_view) continue;
    const editorial = editorialBySlide.get(item.slide_instance_id);
    if (editorial) {
      const physicalTitle = sheetTitleMap[editorial.family_view] ?? editorial.family_view;
      const info = sheetByTitle.get(physicalTitle);
      if (!info) throw new Error(`Família editorial ausente no Sheets: ${physicalTitle}.`);
      styleSheet(info);
      const anchors = expectedEditorialAnchors.get(info.sheetId) ?? new Set<number>();
      anchors.add(editorial.start_row_index);
      expectedEditorialAnchors.set(info.sheetId, anchors);
      const sourceRange = (columnIndex: number) => ({
        sources: [{
          sheetId: info.sheetId,
          startRowIndex: editorial.start_row_index,
          endRowIndex: editorial.end_row_index,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        }],
      });
      for (const series of editorial.series) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: info.sheetId,
              startRowIndex: editorial.start_row_index + 1,
              endRowIndex: editorial.end_row_index,
              startColumnIndex: series.column_index,
              endColumnIndex: series.column_index + 1,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: series.number_format_type,
                  pattern: series.number_format_pattern,
                },
              },
            },
            fields: "userEnteredFormat.numberFormat",
          },
        });
      }
      const existing = info.charts.find((chart) => chart.anchorRow === editorial.start_row_index);
      const chartSpec = {
        title: editorial.title,
        backgroundColor: rgb(AFINZ_LIGHT.surface),
        titleTextFormat: { foregroundColor: rgb(AFINZ_LIGHT.text), fontSize: 13, bold: true },
        basicChart: {
          chartType: "LINE",
          legendPosition: "BOTTOM_LEGEND",
          headerCount: 1,
          interpolateNulls: false,
          domains: [{ domain: { sourceRange: sourceRange(editorial.domain_column_index) } }],
          series: editorial.series.map((series) => ({
            series: { sourceRange: sourceRange(series.column_index) },
            targetAxis: series.axis,
            colorStyle: { rgbColor: rgb(series.color) },
            lineStyle: { width: series.line_width },
            pointStyle: { size: series.point_size, shape: "CIRCLE" },
          })),
          axis: [
            { position: "BOTTOM_AXIS", title: editorial.domain_title },
            { position: "LEFT_AXIS", title: editorial.left_axis_title, viewWindowOptions: { viewWindowMode: "PRETTY" } },
            ...(editorial.series.some((series) => series.axis === "RIGHT_AXIS")
              ? [{ position: "RIGHT_AXIS", title: editorial.right_axis_title, viewWindowOptions: { viewWindowMode: "PRETTY" } }]
              : []),
          ],
        },
      };
      if (existing) {
        chartBySlide[item.slide_instance_id] = existing.chartId;
        chartManifest.push({
          slide_instance_id: item.slide_instance_id,
          chart_id: existing.chartId,
          family_view: editorial.family_view,
          physical_sheet_title: physicalTitle,
          expected_chart_count: editorial.expected_chart_count,
        });
        requests.push({ updateChartSpec: { chartId: existing.chartId, spec: chartSpec } });
      } else {
        requests.push({
          addChart: {
            chart: {
              spec: chartSpec,
              position: { overlayPosition: {
                anchorCell: { sheetId: info.sheetId, rowIndex: editorial.start_row_index, columnIndex: 0 },
                widthPixels: 720,
                heightPixels: 360,
              } },
            },
          },
        });
        pendingAdds.push({ slide: item, familyView: editorial.family_view, physicalTitle });
      }
      continue;
    }

    const physicalTitle = sheetTitleMap[item.source_view] ?? item.source_view;
    const info = sheetByTitle.get(physicalTitle);
    if (!info) continue;
    styleSheet(info);
    const config = chartConfigFor(item.slide_code);
    if (!config) continue;
    const valuesResponse = await sheetsGet(`${physicalTitle}!A1:AZ500`);
    const values: string[][] = valuesResponse.values ?? [];
    if (values.length < 2) continue;
    const headers = values[0].map((value) => String(value ?? ""));
    const domainIndex = headers.indexOf(config.domain);
    const seriesIndexes = usableNumericSeries(
      values,
      config.series.map((field) => headers.indexOf(field)).filter((index) => index >= 0),
    );
    if (domainIndex < 0 || !seriesIndexes.length) continue;
    const sourceRange = (columnIndex: number) => ({
      sources: [{
        sheetId: info.sheetId,
        startRowIndex: 0,
        endRowIndex: values.length,
        startColumnIndex: columnIndex,
        endColumnIndex: columnIndex + 1,
      }],
    });
    const axis = config.type === "BAR" ? "BOTTOM_AXIS" : "LEFT_AXIS";
    const chartSpec = {
      title: item.title,
      backgroundColor: rgb(AFINZ_LIGHT.surface),
      titleTextFormat: {
        foregroundColor: rgb(AFINZ_LIGHT.text),
        fontSize: 14,
        bold: true,
      },
      basicChart: {
        chartType: config.type,
        legendPosition: seriesIndexes.length > 1 ? "BOTTOM_LEGEND" : "NO_LEGEND",
        headerCount: 1,
        domains: [{ domain: { sourceRange: sourceRange(domainIndex) } }],
        series: seriesIndexes.map((columnIndex, seriesIndex) => ({
          series: { sourceRange: sourceRange(columnIndex) },
          targetAxis: axis,
          colorStyle: {
            rgbColor: rgb(
              [AFINZ_LIGHT.cyan, AFINZ_LIGHT.blue, AFINZ_LIGHT.green, AFINZ_LIGHT.purple][seriesIndex % 4],
            ),
          },
        })),
      },
    };
    if (info.charts.length) {
      chartBySlide[item.slide_instance_id] = info.charts[0].chartId;
      chartManifest.push({
        slide_instance_id: item.slide_instance_id,
        chart_id: info.charts[0].chartId,
        family_view: item.source_view,
        physical_sheet_title: physicalTitle,
        expected_chart_count: 1,
      });
      requests.push({
        updateChartSpec: {
          chartId: info.charts[0].chartId,
          spec: chartSpec,
        },
      });
    } else {
      requests.push({
        addChart: {
          chart: {
            spec: chartSpec,
          position: {
            overlayPosition: {
              // Generation tabs use exact grid sizes; the linked chart is only
              // a source object for Slides, so keep its overlay anchor inside
              // every valid grid instead of reserving 29 empty columns.
              anchorCell: { sheetId: info.sheetId, rowIndex: 0, columnIndex: 0 },
              widthPixels: 720,
              heightPixels: 420,
            },
          },
        },
        },
      });
      pendingAdds.push({ slide: item, familyView: item.source_view, physicalTitle });
    }
  }

  for (const [sheetId, anchors] of expectedEditorialAnchors) {
    const sheet = [...sheetByTitle.values()].find((candidate) => candidate.sheetId === sheetId);
    for (const chart of sheet?.charts ?? []) {
      if (!anchors.has(chart.anchorRow)) requests.push({ deleteEmbeddedObject: { objectId: chart.chartId } });
    }
  }

  if (requests.length) {
    const response = await gFetch(`${SHEETS}/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
    let chartReply = 0;
    for (const reply of response.replies ?? []) {
      if (reply.addChart?.chart?.chartId != null) {
        const pending = pendingAdds[chartReply];
        const chartId = Number(reply.addChart.chart.chartId);
        chartBySlide[pending.slide.slide_instance_id] = chartId;
        chartManifest.push({
          slide_instance_id: pending.slide.slide_instance_id,
          chart_id: chartId,
          family_view: pending.familyView,
          physical_sheet_title: pending.physicalTitle,
          expected_chart_count: 1,
        });
        chartReply += 1;
      }
    }
  }
  const missingEditorialCharts = editorialPlans.filter((plan) =>
    registry.some((item) => item.slide_instance_id === plan.slide_instance_id && item.eligibility !== "omitir_bloqueado") &&
    chartBySlide[plan.slide_instance_id] == null
  );
  if (missingEditorialCharts.length) {
    throw new Error(`Gráficos editoriais não materializados: ${missingEditorialCharts.map((plan) => plan.slide_instance_id).join(", ")}.`);
  }
  return { chartBySlide, chartManifest };
}

function addTextBox(
  requests: any[],
  pageId: string,
  objectId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: {
    fontSize?: number;
    color?: string;
    bold?: boolean;
    fontFamily?: string;
    alignment?: "START" | "CENTER" | "END";
    fill?: string;
    radius?: boolean;
  } = {},
) {
  requests.push({
    createShape: {
      objectId,
      shapeType: style.radius ? "ROUND_RECTANGLE" : "TEXT_BOX",
      elementProperties: {
        pageObjectId: pageId,
        size: {
          width: { magnitude: width, unit: "PT" },
          height: { magnitude: height, unit: "PT" },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: x,
          translateY: y,
          unit: "PT",
        },
      },
    },
  });
  if (style.fill) {
    requests.push({
      updateShapeProperties: {
        objectId,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: { color: { rgbColor: rgb(style.fill) } },
          },
          outline: { propertyState: "NOT_RENDERED" },
        },
        fields: "shapeBackgroundFill.solidFill.color,outline.propertyState",
      },
    });
  }
  if (text) {
    requests.push({ insertText: { objectId, insertionIndex: 0, text } });
    requests.push({
      updateTextStyle: {
        objectId,
        textRange: { type: "ALL" },
        style: {
          fontSize: { magnitude: style.fontSize ?? 11, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgb(style.color ?? V1_COLORS.white) } },
          bold: style.bold ?? false,
          fontFamily: style.fontFamily ?? "Arial",
        },
        fields: "fontSize,foregroundColor,bold,fontFamily",
      },
    });
    if (style.alignment) {
      requests.push({
        updateParagraphStyle: {
          objectId,
          textRange: { type: "ALL" },
          style: { alignment: style.alignment },
          fields: "alignment",
        },
      });
    }
  }
}

async function v1PreviewText(view: string, sheetTitleMap: Record<string, string> = {}): Promise<string> {
  if (!view) return "Fonte indisponível para esta execução.";
  try {
    const response = await sheetsGet(`${sheetTitleMap[view] ?? view}!A1:H8`);
    const values: string[][] = response.values ?? [];
    if (!values.length) return "Sem linhas observadas nesta execução.";
    return values.slice(0, 7).map((row, index) =>
      row.slice(0, 5).map((value) => String(value ?? "").replace(/\s+/g, " ").slice(0, 22))
        .join(index === 0 ? "  |  " : "   ")
    ).join("\n");
  } catch (_) {
    return "Não foi possível carregar a prévia da view.";
  }
}

function renderPreviewText(preview: string, missingExpectedChart: boolean): string {
  return missingExpectedChart
    ? `DADO INDISPONÍVEL PARA ESTA VISUALIZAÇÃO\n\n${preview}\n\nMotivo provável: nenhuma série numérica válida foi observada no período.`
    : preview;
}

async function ensureV1Slides(
  registry: V1RegistryRow[],
  chartBySlide: Record<string, number>,
  runId: string,
  sheetTitleMap: Record<string, string> = {},
  artifactPreviews: Record<string, string> = {},
  editorialRulers: EditorialRulerRow[] = [],
  editorialLayouts: EditorialLayoutRow[] = [],
) {
  const releaseKey = await reportLiveReleaseKey(runId);
  const generationPrefix = `rlv2s_${releaseKey}_`;
  const rendered = registry.filter((item) => item.eligibility !== "omitir_bloqueado");
  const identities = await Promise.all(rendered.map(async (item) => {
    const rulerRows = editorialRulers.filter((row) => row.slide_instance_id === item.slide_instance_id)
      .sort((a, b) => a.metric_order - b.metric_order);
    const layout = editorialLayouts.find((row) => row.slide_instance_id === item.slide_instance_id) ?? null;
    return {
      item,
      rulerRows,
      layout,
      rulerIds: await Promise.all(rulerRows.map((row) =>
        stableReportLiveObjectId("rlv2r", releaseKey, `${item.slide_instance_id}:${row.metric_order}`)
      )),
      supportId: layout
        ? await stableReportLiveObjectId("rlv2u", releaseKey, item.slide_instance_id)
        : "",
      pageId: await stableReportLiveObjectId("rlv2s", releaseKey, item.slide_instance_id),
      titleId: await stableReportLiveObjectId("rlv2t", releaseKey, item.slide_instance_id),
      eyebrowId: await stableReportLiveObjectId("rlv2e", releaseKey, item.slide_instance_id),
      accentId: await stableReportLiveObjectId("rlv2a", releaseKey, item.slide_instance_id),
      confidenceId: await stableReportLiveObjectId("rlv2q", releaseKey, item.slide_instance_id),
      narrativeId: await stableReportLiveObjectId("rlv2n", releaseKey, item.slide_instance_id),
      previewId: await stableReportLiveObjectId("rlv2p", releaseKey, item.slide_instance_id),
      footerId: await stableReportLiveObjectId("rlv2f", releaseKey, item.slide_instance_id),
      chartId: await stableReportLiveObjectId("rlv2c", releaseKey, item.slide_instance_id),
    };
  }));
  const expectedPageIds = new Set(identities.map(({ pageId }) => pageId));
  const expectedElementIds = identities.map((identity) => ({
    slide_instance_id: identity.item.slide_instance_id,
    page_id: identity.pageId,
    element_ids: [
      identity.titleId,
      identity.eyebrowId,
      identity.accentId,
      identity.confidenceId,
      identity.narrativeId,
      identity.footerId,
      chartBySlide[identity.item.slide_instance_id] != null ? identity.chartId : identity.previewId,
      ...identity.rulerIds,
      ...(identity.supportId ? [identity.supportId] : []),
    ],
  }));
  const presentation = await gFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(objectId,slideProperties(isSkipped),pageElements(objectId,title,shape(text(textElements(textRun(content))))))`,
  );
  const managedSlides = (presentation.slides ?? [])
    .map((slide: any) => String(slide.objectId ?? ""))
    .filter((objectId: string) =>
      objectId.startsWith("rlv1s_") || objectId.startsWith("rlv2s_") || objectId.startsWith("v4sld_")
    );
  const currentGeneration = managedSlides.filter((objectId: string) =>
    objectId.startsWith(generationPrefix)
  );
  const oldManagedSlides = managedSlides.filter((objectId: string) =>
    !objectId.startsWith(generationPrefix)
  );

  const sendBatches = async (batchRequests: any[]) => {
    const chunkSize = 450;
    for (let index = 0; index < batchRequests.length; index += chunkSize) {
      await gFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({ requests: batchRequests.slice(index, index + chunkSize) }),
      });
    }
  };
  const deletePages = async (objectIds: string[]) => {
    if (!objectIds.length) return;
    await sendBatches(objectIds.map((objectId) => ({ deleteObject: { objectId } })));
  };

  const completeCurrentGeneration = currentGeneration.length === expectedPageIds.size &&
    currentGeneration.every((objectId: string) => expectedPageIds.has(objectId)) &&
    identities.every(identity => {
      const page = (presentation.slides ?? []).find((slide: any) => slide.objectId === identity.pageId);
      const elements = new Set<string>((page?.pageElements ?? []).map((element: any) => String(element.objectId)));
      const hasChart = chartBySlide[identity.item.slide_instance_id] != null;
      const missingExpectedChart = (identity.layout
        ? identity.layout.expected_chart
        : Boolean(chartConfigFor(identity.item.slide_code))) && !hasChart;
      const expectedPreview = artifactPreviews[identity.item.source_view];
      const previewElement = (page?.pageElements ?? []).find((element: any) => element.objectId === identity.previewId);
      const currentPreview = (previewElement?.shape?.text?.textElements ?? [])
        .map((part: any) => String(part.textRun?.content ?? "")).join("").replace(/\n$/, "");
      const plannedPreview = expectedPreview === undefined ? null : renderPreviewText(expectedPreview, missingExpectedChart);
      return page?.slideProperties?.isSkipped === true &&
        [identity.titleId, identity.eyebrowId, identity.accentId, identity.confidenceId,
        identity.narrativeId, identity.footerId, hasChart ? identity.chartId : identity.previewId,
        ...identity.rulerIds, ...(identity.supportId ? [identity.supportId] : [])]
        .every(id => elements.has(id)) && (hasChart || (plannedPreview !== null && currentPreview === plannedPreview));
    });
  if (completeCurrentGeneration) {
    return {
      release_key: releaseKey,
      previous_managed_slides: oldManagedSlides,
      staged_slide_ids: [...expectedPageIds],
      managed_deleted: 0,
      slides_created: 0,
      slides_reused: rendered.length,
      slides_omitted: registry.length - rendered.length,
      staged_skipped: true,
      expected_element_ids: expectedElementIds,
    };
  }

  // A geração anterior continua íntegra enquanto uma tentativa parcial desta
  // mesma release é limpa e reconstruída.
  await deletePages(currentGeneration);

  const requests: any[] = [];
  for (const identity of identities) {
    const {
      item,
      pageId,
      titleId,
      eyebrowId,
      accentId,
      confidenceId,
      narrativeId,
      previewId,
      footerId,
      chartId,
      rulerRows,
      rulerIds,
      supportId,
      layout,
    } = identity;
    const hasChart = chartBySlide[item.slide_instance_id] != null;
    const missingExpectedChart = (layout ? layout.expected_chart : Boolean(chartConfigFor(item.slide_code))) && !hasChart;
    const preview = hasChart
      ? ""
      : artifactPreviews[item.source_view] ?? await v1PreviewText(item.source_view, sheetTitleMap);
    const accentColor = accentFor(item.section);
    const archetype = archetypeFor(item.slide_code);
    const bodySize = minimumBodySize(item.section);
    const geometry = layoutGeometryFor(archetype, rulerRows.length > 0);
    const confidenceColor = item.confidence === "Alta"
      ? V1_COLORS.green
      : item.confidence === "Média"
      ? "#F59E0B"
      : item.confidence === "Baixa"
      ? V1_COLORS.red
      : V1_COLORS.muted;

    requests.push({
      createSlide: {
        objectId: pageId,
        slideLayoutReference: { predefinedLayout: "BLANK" },
      },
    });
    requests.push({
      updateSlideProperties: {
        objectId: pageId,
        slideProperties: { isSkipped: true },
        fields: "isSkipped",
      },
    });
    requests.push({
      updatePageProperties: {
        objectId: pageId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: rgb(V1_COLORS.background) } },
          },
        },
        fields: "pageBackgroundFill",
      },
    });
    addTextBox(
      requests,
      pageId,
      eyebrowId,
      `${item.section.toUpperCase()}  ·  ${item.slide_code}${item.partner ? `  ·  ${item.partner}` : ""}  ·  ${archetype.replaceAll("_", " ")}`,
      28,
      18,
      500,
      18,
      { fontSize: 9, color: accentColor, bold: true },
    );
    addTextBox(
      requests,
      pageId,
      titleId,
      item.title,
      28,
      38,
      570,
      40,
      { fontSize: 24, color: AFINZ_LIGHT.text, bold: true },
    );
    addTextBox(
      requests,
      pageId,
      accentId,
      "",
      28,
      82,
      664,
      3,
      { fill: accentColor },
    );
    addTextBox(
      requests,
      pageId,
      confidenceId,
      `${item.confidence}${item.eligibility === "render_com_limites" ? " · COM LIMITES" : ""}`,
      590,
      28,
      102,
      24,
      { fontSize: 9, color: AFINZ_LIGHT.text, bold: true, fill: confidenceColor, radius: true, alignment: "CENTER" },
    );

    if (rulerRows.length) {
      const cardGap = 8;
      const cardWidth = (438 - cardGap * (rulerRows.length - 1)) / rulerRows.length;
      rulerRows.forEach((ruler, index) => {
        const limitation = ruler.limitation ? `\n${ruler.limitation}` : "";
        addTextBox(
          requests,
          pageId,
          rulerIds[index],
          `${ruler.metric_label.toUpperCase()}\n${ruler.value_text}${ruler.delta_text ? `  ${ruler.delta_text}` : ""}\n${ruler.range_text} · ${ruler.verdict_text}${limitation}`,
          28 + index * (cardWidth + cardGap),
          98,
          cardWidth,
          78,
          { fontSize: rulerRows.length > 2 ? 8 : 9, color: AFINZ_LIGHT.text, fill: V1_COLORS.panel, radius: true },
        );
      });
    }

    if (hasChart) {
      requests.push({
        createSheetsChart: {
          objectId: chartId,
          spreadsheetId: SHEET_ID,
          chartId: chartBySlide[item.slide_instance_id],
          linkingMode: "LINKED",
          elementProperties: {
            pageObjectId: pageId,
            size: {
              width: { magnitude: geometry.visual.width, unit: "PT" },
              height: { magnitude: geometry.visual.height, unit: "PT" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: geometry.visual.x,
              translateY: geometry.visual.y,
              unit: "PT",
            },
          },
        },
      });
    } else {
      addTextBox(
        requests,
        pageId,
        previewId,
        renderPreviewText(preview, missingExpectedChart),
        geometry.visual.x,
        geometry.visual.y,
        geometry.visual.width,
        geometry.visual.height,
        missingExpectedChart
          ? { fontSize: Math.max(bodySize, 12), color: "#991B1B", fontFamily: "Arial", fill: "#FDECEC", bold: true }
          : { fontSize: bodySize, color: AFINZ_LIGHT.text, fontFamily: "Arial", fill: V1_COLORS.panel },
      );
    }
    if (layout && supportId) {
      addTextBox(
        requests,
        pageId,
        supportId,
        layout.support_text,
        28,
        346,
        438,
        18,
        { fontSize: 8, color: V1_COLORS.muted },
      );
    }
    addTextBox(
      requests,
      pageId,
      narrativeId,
      `LEITURA DA DECISÃO\n\n{{${item.slide_instance_id}}}`,
      geometry.narrative.x,
      geometry.narrative.y,
      geometry.narrative.width,
      geometry.narrative.height,
      { fontSize: 11, color: AFINZ_LIGHT.text, fill: V1_COLORS.panelLight, radius: true },
    );
    requests.push({
      updatePageElementAltText: {
        objectId: narrativeId,
        title: `ph:${item.slide_instance_id}`,
        description: `Narrativa governada do slide ${item.slide_code}.`,
      },
    });
    addTextBox(
      requests,
      pageId,
      footerId,
      `${item.source_view || "status"} · run ${runId.slice(0, 8)} · ${item.confidence} · ${item.eligibility} · renderer ${REPORT_LIVE_DESIGN_VERSION}`,
      28,
      371,
      664,
      16,
      { fontSize: 8, color: V1_COLORS.muted },
    );
  }

  try {
    await sendBatches(requests);
    const verifyPresentation = await gFetch(
      `${SLIDES}/${SLIDES_ID}?fields=slides(objectId,slideProperties(isSkipped))`,
    );
    const actualSlides = new Map<string, any>(
      (verifyPresentation.slides ?? []).map((slide: any) => [String(slide.objectId ?? ""), slide]),
    );
    const actualIds = new Set(actualSlides.keys());
    const missingNewPages = [...expectedPageIds].filter((objectId) => !actualIds.has(objectId));
    if (missingNewPages.length) {
      throw new Error(
        `Geração ${releaseKey} incompleta: ${missingNewPages.length} slide(s) ausente(s).`,
      );
    }
    const visibleNewPages = [...expectedPageIds].filter((objectId) =>
      actualSlides.get(objectId)?.slideProperties?.isSkipped !== true
    );
    if (visibleNewPages.length) {
      throw new Error(`Geração ${releaseKey} ficou visível antes da ativação.`);
    }
  } catch (error) {
    const failedPresentation = await gFetch(
      `${SLIDES}/${SLIDES_ID}?fields=slides(objectId)`,
    ).catch(() => ({ slides: [] }));
    const partialNewPages = (failedPresentation.slides ?? [])
      .map((slide: any) => String(slide.objectId ?? ""))
      .filter((objectId: string) => objectId.startsWith(generationPrefix));
    await deletePages(partialNewPages).catch((cleanupError) =>
      console.error("Falha ao limpar geração parcial", cleanupError)
    );
    throw error;
  }

  return {
    release_key: releaseKey,
    previous_managed_slides: oldManagedSlides,
    staged_slide_ids: [...expectedPageIds],
    managed_deleted: 0,
    slides_created: rendered.length,
    slides_reused: 0,
    slides_omitted: registry.length - rendered.length,
    staged_skipped: true,
    expected_element_ids: expectedElementIds,
  };
}

async function setupV1(
  runId: string,
  artifactRegistry?: Record<string, unknown>[],
  sheetTitleMap: Record<string, string> = {},
  artifactPreviews: Record<string, string> = {},
) {
  if (!SHEET_ID || !SLIDES_ID || !SA_RAW) {
    throw new Error("Secrets REPORT_SHEET_ID, REPORT_SLIDES_ID ou GOOGLE_SERVICE_ACCOUNT_JSON ausentes.");
  }
  const registry = artifactRegistry?.length
    ? normalizeV1Registry(artifactRegistry)
    : await readV1Registry();
  if (!registry.length) {
    throw new Error("VIEW_REGISTRY está vazia. Execute report-sync antes de setup_v1.");
  }
  const editorial = await readEditorialData(sheetTitleMap);
  const { chartBySlide, chartManifest } = await ensureV1Charts(registry, sheetTitleMap, editorial.plans);
  const slides = await ensureV1Slides(
    registry,
    chartBySlide,
    runId,
    sheetTitleMap,
    artifactPreviews,
    editorial.rulers,
    editorial.layouts,
  );
  return {
    registry_rows: registry.length,
    charts_available: Object.keys(chartBySlide).length,
    chart_manifest: chartManifest,
    ...slides,
  };
}

function slideTextPreview(slide: any): string {
  const fragments: string[] = [];
  for (const element of slide.pageElements ?? []) {
    for (const textElement of element.shape?.text?.textElements ?? []) {
      const content = String(textElement.textRun?.content ?? "").replace(/\s+/g, " ").trim();
      if (content) fragments.push(content);
    }
  }
  return fragments.join(" · ").slice(0, 360);
}

async function inspectV1Deck() {
  const presentation = await gFetch(
    `${SLIDES}/${SLIDES_ID}?fields=title,slides(objectId,pageElements(objectId,title,shape(text(textElements(textRun(content))))))`,
  );
  const slides = (presentation.slides ?? []).map((slide: any, index: number) => ({
    position: index + 1,
    object_id: String(slide.objectId ?? ""),
    managed_v1: ["rlv1s_", "rlv2s_"].some((prefix) =>
      String(slide.objectId ?? "").startsWith(prefix)
    ),
    text_preview: slideTextPreview(slide),
  }));
  return {
    title: presentation.title,
    total_slides: slides.length,
    managed_v1: slides.filter((slide: any) => slide.managed_v1).length,
    legacy: slides.filter((slide: any) => !slide.managed_v1).length,
    slides,
  };
}

async function cleanupLegacyV1(confirm: boolean) {
  const inspected = await inspectV1Deck();
  const managed = inspected.slides.filter((slide: any) => slide.managed_v1);
  const legacy = inspected.slides.filter((slide: any) => !slide.managed_v1);
  if (!confirm) {
    return {
      dry_run: true,
      managed_count: managed.length,
      legacy_count: legacy.length,
      legacy,
    };
  }
  if (managed.length < 20) {
    throw new Error(
      `Limpeza recusada: apenas ${managed.length} slides v1 gerenciados foram encontrados.`,
    );
  }
  if (legacy.length) {
    await gFetch(`${SLIDES}/${SLIDES_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: legacy.map((slide: any) => ({
          deleteObject: { objectId: slide.object_id },
        })),
      }),
    });
  }
  const after = await inspectV1Deck();
  return {
    dry_run: false,
    deleted_legacy_slides: legacy.length,
    remaining_slides: after.total_slides,
    remaining_legacy_slides: after.legacy,
  };
}

async function v1Thumbnails(ids: string[]) {
  const presentation = await gFetch(
    `${SLIDES}/${SLIDES_ID}?fields=slides(objectId)`,
  );
  const available = new Set(
    (presentation.slides ?? []).map((slide: any) => String(slide.objectId ?? "")),
  );
  const requested = ids.length
    ? ids
    : ["rlv1s_c0", "rlv1s_c3", "rlv1s_c5", "rlv1s_m2", "rlv1s_b1"];
  const output: Array<Record<string, unknown>> = [];
  for (const objectId of requested.filter((id) => available.has(id)).slice(0, 10)) {
    const thumbnail = await gFetch(
      `${SLIDES}/${SLIDES_ID}/pages/${objectId}/thumbnail?thumbnailProperties.thumbnailSize=LARGE`,
    );
    output.push({
      object_id: objectId,
      width: thumbnail.width,
      height: thumbnail.height,
      content_url: thumbnail.contentUrl,
    });
  }
  return output;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "OPTIONS") {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!SERVICE_KEY || token !== SERVICE_KEY) return json({ error: "Renderer restrito ao serviço de publicação." }, 403);
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") {
    const checks: Record<string, unknown> = {
      sheet_id: !!SHEET_ID,
      slides_id: !!SLIDES_ID,
      service_account: !!SA_RAW,
      views: VIEWS.length,
    };
    try {
      await googleToken();
      checks.google_auth = true;
    } catch (error) {
      checks.google_auth = `ERRO: ${(error as Error).message.slice(0, 200)}`;
    }
    return json({ ok: true, checks });
  }
  if (req.method !== "POST") return json({ error: "metodo nao suportado" }, 405);
  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    body = {};
  }
  if (body.mode === "fix_crm_dates") {
    try {
      const result = await fixCrmDates();
      return json({ ok: true, ...result });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "inspect_views") {
    try {
      const inspected = await inspectViews();
      return json({
        ok: true,
        views: inspected.length,
        errors: inspected.filter((view) => view.has_error).map((view) => view.view),
        inspected,
      });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "setup_v1") {
    try {
      const artifactRegistry = Array.isArray(body.registry)
        ? body.registry as Record<string, unknown>[]
        : undefined;
      if (!artifactRegistry?.length && body.allow_legacy_sheet_registry !== true) {
        return json({
          ok: false,
          error: "registry certificado é obrigatório; fallback para Sheets exige allow_legacy_sheet_registry:true.",
        }, 400);
      }
      const sheetTitleMap = body.sheet_title_map && typeof body.sheet_title_map === "object"
        ? Object.fromEntries(Object.entries(body.sheet_title_map as Record<string, unknown>)
          .map(([key, value]) => [key, String(value)]))
        : {};
      const artifactPreviews = body.previews && typeof body.previews === "object"
        ? Object.fromEntries(Object.entries(body.previews as Record<string, unknown>)
          .map(([key, value]) => [key, String(value)]))
        : {};
      const result = await setupV1(
        String(body.run_id ?? "sem-run"),
        artifactRegistry,
        sheetTitleMap,
        artifactPreviews,
      );
      return json({ ok: true, spec_version: "1.0", ...result });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "inspect_deck_v1") {
    try {
      return json({ ok: true, ...(await inspectV1Deck()) });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "cleanup_legacy_v1") {
    try {
      return json({
        ok: true,
        ...(await cleanupLegacyV1(body.confirm === true)),
      });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode === "thumbnails_v1") {
    try {
      const ids = Array.isArray(body.object_ids)
        ? body.object_ids.map((value: unknown) => String(value))
        : [];
      return json({ ok: true, thumbnails: await v1Thumbnails(ids) });
    } catch (error) {
      return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
    }
  }
  if (body.mode !== "setup_views") return json({ error: "use POST { mode: 'setup_views' }" }, 400);
  try {
    const summary = await setupViews();
    return json({ ok: true, ...summary });
  } catch (error) {
    return json({ ok: false, error: String((error as Error).message).slice(0, 900) }, 500);
  }
});
