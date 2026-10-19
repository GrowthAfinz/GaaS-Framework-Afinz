import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const out = "artifacts/content-performance-qa";
mkdirSync(out, { recursive: true });
const rows = [
  {
    id: "oct5",
    jornada: "JOR_AQS_B2C_NA_BP_AQUISICAO_PAD_VIBE_SEM1",
    "Activity name / Taxonomia":
      "afz_car_vis_aqs_email_bsp_disp1s1vibe_pontual",
    Canal: "E-mail",
    BU: "B2C",
    Parceiro: "Proprietaria",
    Segmento: "CRM",
    "Data de Disparo": "2026-10-05T03:00:00Z",
    "Base Total": 57186,
    "Base Acionável": 56641,
    Abertura: 15150,
    Cliques: 91,
    Propostas: 57,
    Aprovados: 11,
    "Cartões Gerados": 5,
    "Custo Total Campanha": 58.000384,
    template_id: null,
  },
  {
    id: "oct6",
    jornada: "JOR_AQS_B2C_NA_BP_AQUISICAO_PAD_VIBE_SEM1",
    "Activity name / Taxonomia":
      "afz_car_vis_aqs_email_bsp_disp1s1vibe_pontual",
    Canal: "E-mail",
    BU: "B2C",
    Parceiro: "Proprietaria",
    Segmento: "CRM",
    "Data de Disparo": "2026-10-06T03:00:00Z",
    "Base Total": 82097,
    "Base Acionável": 81392,
    Abertura: 15588,
    Cliques: 96,
    Propostas: 55,
    Aprovados: 10,
    "Cartões Gerados": 2,
    "Custo Total Campanha": 83.345408,
    template_id: null,
  },
];
const mocks = {
  useContentPerformance: `export const useContentPerformance=()=>({executions:${JSON.stringify(rows)},linked:[],orphans:[],library:[],catalog:[],catalogRaw:[],contents:new Map(),initialLoading:false,refreshing:false,error:null,refetch:()=>{}});`,
  PeriodContext: `export const usePeriod=()=>({startDate:new Date('2026-10-01T12:00:00'),endDate:new Date('2026-10-31T12:00:00')});`,
  sfmcIngestionService: `export const readSfmcHistory=async()=>({imports:[],alerts:[],automatic_links:0});`,
  useAppStore: `import React from 'react';const state={viewSettings:{filtrosGlobais:{}},perfDeepLink:null,setPerfDeepLink:()=>{},performanceUiState:null,setPerformanceUiState:v=>{state.performanceUiState=v;},setCommunicationLinkTarget:v=>{window.linkTarget=v;},setTab:v=>{window.navigation=v;}};export const useAppStore=fn=>fn(state);useAppStore.getState=()=>state;`,
};
await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{PerformanceView}from'./src/components/communications/performance/PerformanceView';createRoot(document.getElementById('root')).render(<PerformanceView/>);`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  outfile: out + "/app.js",
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "fixtures",
      setup(b) {
        b.onResolve(
          {
            filter:
              /useContentPerformance$|PeriodContext$|sfmcIngestionService$|useAppStore$/,
          },
          (a) => ({ path: a.path.split("/").pop(), namespace: "fixture" }),
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: mocks[a.path],
          loader: "js",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const css = readdirSync("dist/assets").find((n) => n.endsWith(".css"));
const server = createServer((req, res) => {
  const js = req.url === "/app.js",
    style = req.url === "/style.css";
  res.setHeader(
    "Content-Type",
    js
      ? "text/javascript; charset=utf-8"
      : style
        ? "text/css"
        : "text/html; charset=utf-8",
  );
  res.end(
    js
      ? readFileSync(out + "/app.js")
      : style
        ? readFileSync("dist/assets/" + css)
        : '<link rel="stylesheet" href="/style.css"><div id="root" style="padding:24px;font-family:Arial,sans-serif"></div><script src="/app.js"></script>',
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Sao_Paulo",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.getByRole("tab", { name: /Todos/ }).waitFor();
  assert.equal(await page.getByRole("tab", { selected: true }).count(), 1);
  await page
    .getByText("Sem template vinculado", { exact: false })
    .first()
    .waitFor();
  await page.screenshot({ path: out + "/01-gallery.png", fullPage: true });
  await page.getByRole("button", { name: "Ver resultados →" }).click();
  const modal = page.getByRole("dialog", { name: "Performance da atividade" });
  await modal.getByText("139.283", { exact: true }).first().waitFor();
  await modal.getByText("30.738", { exact: true }).first().waitFor();
  await modal.getByText("187", { exact: true }).first().waitFor();
  assert.ok((await modal.textContent()).includes("20,19"));
  await page.screenshot({
    path: out + "/02-activity-results.png",
    fullPage: true,
  });
  await modal.getByRole("button", { name: "Fechar resultados" }).click();
  await page.getByRole("button", { name: "Visão Geral", exact: true }).click();
  await page.getByRole("heading", { name: "Evolução no período" }).waitFor();
  await page.screenshot({ path: out + "/03-overview.png", fullPage: true });
  await page.getByRole("button", { name: "Tabela", exact: true }).click();
  await page
    .getByRole("columnheader", { name: "Atividade / jornada", exact: true })
    .waitFor();
  await page
    .getByRole("button", {
      name: "Vincular no Cadastro de templates",
      exact: true,
    })
    .click();
  assert.deepEqual(await page.evaluate(() => window.linkTarget.ids), [
    "oct5",
    "oct6",
  ]);
  assert.equal(
    await page.evaluate(() => window.navigation),
    "comunicacoes-cadastro",
  );
  assert.equal(
    await page.evaluate(() => window.linkTarget.activity),
    rows[0]["Activity name / Taxonomia"],
  );
  await page.screenshot({ path: out + "/04-table.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Galeria", exact: true }).click();
  await page.screenshot({ path: out + "/05-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "Performance UI: Todos default, gallery, activity KPIs/chart, overview, table, mobile and exact registration navigation passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
