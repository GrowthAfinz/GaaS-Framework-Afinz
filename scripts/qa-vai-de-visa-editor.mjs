import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync } from "node:fs";
import { createServer } from "vite";
writeFileSync(
  ".vdv-qa.html",
  '<html><head><meta charset="utf-8"/></head><body><div id="root"></div><script type="module" src="/.vdv-qa.tsx"></script></body></html>\n',
);
writeFileSync(
  ".vdv-qa.tsx",
  "import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{VaiDeVisaWorkspace}from'./src/modules/dynamic-email/components/VaiDeVisaWorkspace';import{parseVdvBriefingCsv,parseVdvMovimentoCsv}from'./src/modules/dynamic-email/domain/vaiDeVisa';import{VDV_BRIEFING_CSV,VDV_MOVIMENTO_CSV}from'./src/modules/dynamic-email/fixtures/vdvBF26V1.csv';import './src/App.css';\nfunction Harness(){const[data,setData]=useState({briefing:parseVdvBriefingCsv(VDV_BRIEFING_CSV),movimento:parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV)});const[date,setDate]=useState('2026-11-05');return <VaiDeVisaWorkspace data={data} onChange={setData} today={date} onDateChange={setDate}/>;}createRoot(document.getElementById('root')!).render(<Harness/>);\n\n",
);
const server = await createServer({
  server: { port: 3199, strictPort: true, open: false },
});
await server.listen();
try {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.route("https://*.supabase.co/**", (r) => r.abort());
  await p.goto("http://localhost:3199/.vdv-qa.html");
  await p
    .getByRole("heading", { name: "Pool Vai de Visa", exact: true })
    .waitFor();
  await p.getByText("0 erros ·", { exact: false }).waitFor();
  await p
    .frameLocator("iframe")
    .getByText("Olá, Ana!", { exact: true })
    .waitFor();
  await p.screenshot({
    path: "artifacts/vai-de-visa/screenshots/editor-desktop.png",
    fullPage: true,
  });
  await p.getByLabel("Amostra VDV", { exact: true }).selectOption("2");
  await p.getByText("Hero: parceiro SIPOLATTI", { exact: false }).waitFor();
  await p
    .getByRole("button", { name: "E-mail 2 · cartão", exact: true })
    .click();
  await p.getByText("Hero: parceiro SIPOLATTI", { exact: false }).waitFor();
  await p.getByLabel("Amostra VDV", { exact: true }).selectOption("5");
  await p
    .getByRole("alert")
    .filter({ hasText: "nenhuma oferta vigente" })
    .waitFor();
  assert.equal(
    await p.getByTitle("Prévia Vai de Visa", { exact: true }).count(),
    0,
  );
  await p.screenshot({
    path: "artifacts/vai-de-visa/screenshots/editor-skip.png",
    fullPage: true,
  });
  await p.getByLabel("Amostra VDV", { exact: true }).selectOption("0");
  await p.getByLabel("Nova versão", { exact: true }).fill("NATAL26_V1");
  await p.getByRole("button", { name: "Duplicar versão", exact: true }).click();
  await p.getByText("TEMA · Black Afinz", { exact: true }).waitFor();
  assert.equal(await p.locator("select").first().inputValue(), "NATAL26_V1");
  await p
    .getByRole("button", { name: "Exportar movimento", exact: true })
    .click();
  assert.deepEqual(errors, []);
  await b.close();
  console.log(
    "Editor: montagem, 6 amostras, troca V1/V2, hero, skip e duplicação OK",
  );
} finally {
  await server.close();
  unlinkSync(".vdv-qa.html");
  unlinkSync(".vdv-qa.tsx");
}
