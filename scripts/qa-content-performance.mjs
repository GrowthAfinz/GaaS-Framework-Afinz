// QA isolado da Performance por conteúdo (três visões). Nada vai para produção:
// toda chamada a mipiwxadnpwtcgfcedym.supabase.co é interceptada; leituras saem de fixtures e
// de um PGlite com a migration real de link_communication_executions (vínculo, snapshot e auditoria).
// Uso: servidor Vite em 127.0.0.1:3017 (raiz do repo) e `node scripts/qa-content-performance.mjs`.
import { PGlite } from '@electric-sql/pglite';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const out = 'artifacts/content-performance-qa'; mkdirSync(out, { recursive: true });
const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:3017';
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema gaas_sfmc_private;grant usage on schema public,auth,gaas_sfmc_private to authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table communication_templates(template_id text primary key,channel text);
create table activities(id uuid primary key default gen_random_uuid(),jornada text,"Activity name / Taxonomia" text,"Canal" text,"Data de Disparo" timestamptz,template_id text,updated_at timestamptz default '2026-10-01T00:00:00Z',
 "BU" text,"Parceiro" text,parceiro_canonico text,"Segmento" text,"Subgrupos" text,"Oferta" text,"Promocional" text,"Base Total" numeric,"Abertura" integer,"Cliques" integer,"Propostas" numeric,"Cartões Gerados" numeric,"Custo Total Campanha" numeric,"Ordem de disparo" integer);`);
await db.exec(readFileSync('supabase/migrations/20261008135702_scoped_communication_links.sql', 'utf8'));
await db.query("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)");

const T = { link: 'b2c_wpp_vibe_aba_D1', pack: 'b2c_wpp_vibe_aba_D2', email: 'b2c_email_copa_bsp_S1D02', draft: 'plx_sms_padrao_ngd_D3', sms: 'b2c_sms_vibe_aba_D1' };
const tpl = (id, channel, status, patch = {}) => ({ template_id: id, title: id, channel, version_label: 'v1', status, source_system: 'gaas', storage_bucket: 'crm-communications', original_path: null, preview_path: null, thumbnail_path: null, mime_type: null, metadata: {}, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', ...patch });
const templates = [
  tpl(T.link, 'WhatsApp', 'active', { original_path: 'crm/wpp/link/original.png', mime_type: 'image/png' }),
  tpl(T.pack, 'WhatsApp', 'draft', { source_system: 'sfmc_package' }),
  tpl(T.email, 'E-mail', 'active', { original_path: 'crm/email/copa/email.html', mime_type: 'text/html', metadata: { subject: 'Assunto QA', preheader: 'Pré QA' } }),
  tpl(T.draft, 'SMS', 'draft', { source_system: 'governanca' }),
  tpl(T.sms, 'SMS', 'active'),
];
for (const t of templates) await db.query('insert into communication_templates values($1,$2)', [t.template_id, t.channel]);
const ctx = { "BU": 'B2C', "Parceiro": 'Serasa', parceiro_canonico: 'Serasa', "Segmento": 'Abandonados', "Subgrupos": 'Abandonados D-7', "Oferta": 'Vibe', "Promocional": 'Padrao' };
const rows = [
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_wpp_aba_disp1_pontual', canal: 'WhatsApp', at: '2026-09-10T12:00:00-03:00', tid: T.link, base: 1000, ab: 600, cl: 40, pr: 6, ca: 3, ...ctx },
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_wpp_aba_disp1_pontual', canal: 'WhatsApp', at: '2026-09-12T12:00:00-03:00', tid: T.link, base: 800, ab: 500, cl: 30, pr: 4, ca: 2, ...ctx },
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_sms_aba_disp1_pontual', canal: 'SMS', at: '2026-09-30T23:30:00-03:00', tid: T.sms, base: 500, ab: null, cl: null, pr: null, ca: null, ...ctx },
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_wpp_aba_disp2_pontual', canal: 'WhatsApp', at: '2026-09-15T12:00:00-03:00', tid: null, base: 700, ab: 400, cl: 20, pr: 3, ca: 1, ...ctx },
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_wpp_aba_disp2_pontual', canal: 'WhatsApp', at: '2026-09-16T12:00:00-03:00', tid: null, base: 650, ab: null, cl: null, pr: null, ca: null, ...ctx },
  { jornada: 'JOR_AQS_B2C_OUTRA', name: 'afz_car_b2c_aqs_wpp_aba_disp2_pontual', canal: 'WhatsApp', at: '2026-09-17T12:00:00-03:00', tid: null, base: 300, ab: 100, cl: 5, pr: 1, ca: 0, ...ctx },
  { jornada: 'JOR_AQS_PLX_NEGADOS', name: 'afz_rep_plx_aqs_sms_ngd_disp3_padrao', canal: 'SMS', at: '2026-09-20T12:00:00-03:00', tid: null, base: 900, ab: null, cl: 12, pr: 2, ca: 1, "BU": 'Plurix', "Parceiro": 'Plurix', parceiro_canonico: 'Plurix', "Segmento": 'Negados', "Subgrupos": 'Diario', "Oferta": 'Padrao', "Promocional": 'Padrao' },
  { jornada: 'JOR_AQS_B2C_CARRINHO', name: 'afz_car_b2c_aqs_wpp_aba_disp2_pontual', canal: 'WhatsApp', at: '2026-10-02T12:00:00-03:00', tid: null, base: 999, ab: 1, cl: 1, pr: 1, ca: 1, ...ctx },
];
for (const r of rows) await db.query(`insert into activities(jornada,"Activity name / Taxonomia","Canal","Data de Disparo",template_id,"BU","Parceiro",parceiro_canonico,"Segmento","Subgrupos","Oferta","Promocional","Base Total","Abertura","Cliques","Propostas","Cartões Gerados") values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
  [r.jornada, r.name, r.canal, r.at, r.tid, r.BU, r.Parceiro, r.parceiro_canonico, r.Segmento, r.Subgrupos, r.Oferta, r.Promocional, r.base, r.ab, r.cl, r.pr, r.ca]);

const wppContent = (body) => ({ schema_version: 1, channel: 'WhatsApp', meta_template_name: 'carrinho_d2', body_text: body, body_params: [], footer: 'Sujeito à análise de crédito', buttons: [{ title: 'Concluir pedido', type: 'url' }], banner_url: null, sms_from: null });
const fixtures = {
  communication_templates: templates,
  communication_template_contents: [
    { id: 'c1', template_id: T.pack, content_hash: 'a'.repeat(64), is_current: true, first_seen_at: '2026-09-01T12:00:00Z', payload: wppContent('Seu cartão Afinz Vibe está a um passo. Conclua o pedido.') },
    { id: 'c2', template_id: T.pack, content_hash: 'b'.repeat(64), is_current: false, first_seen_at: '2026-08-01T12:00:00Z', payload: wppContent('Versão antiga, não escolhida.') },
  ],
  sfmc_package_messages: [{ id: 'm1', import_id: 'i1', decision: 'applied', payload: { occurrence_key: 'o1', journey_name: 'JOR_AQS_B2C_CARRINHO', journey_name_raw: 'JOR_AQS_B2C_CARRINHO', journey_version: 1, journey_origin_id: 'j', activity_key: 'k', activity_name: 'afz_car_b2c_aqs_wpp_aba_disp2_pontual', entry_de: null, entry_filter: null, paths: [], asset_name: 'WPP_CARRINHO_VIBE_D2', content: wppContent('Seu cartão Afinz Vibe está a um passo. Conclua o pedido.'), link_url: 'https://x', utm: { c: 'carrinho_vibe', af_sub1: 'abandonados', af_sub2: 'd2', af_sub3: T.pack }, is_optout: false, alerts: [] } }],
  communications_reconciliation_proposals: [{ id: 'p1', message_id: 'm1', analysis_id: 'a', revision: 2, observed_template_id: T.pack, proposed_template_id: T.pack, resolved_context: { partner: 'Serasa', segment: 'Abandonados', campaign: 'Vibe' }, reasons: [], conflicts: [], alternatives: [], review: null, status: 'applied', reviewed_by: '11111111-1111-4111-8111-111111111111', updated_at: '2026-09-02T00:00:00Z' }],
  communication_execution_reviews: [], communication_slots: [],
};

const unquote = (k) => k.replace(/^"|"$/g, '');
const splitIn = (v) => (v.match(/"([^"]*)"|[^,]+/g) ?? []).map((x) => x.replace(/^"|"$/g, ''));
const cmp = (a, b) => { const da = Date.parse(a), dbb = Date.parse(b); return Number.isFinite(da) && Number.isFinite(dbb) && /\d{4}-\d{2}-\d{2}/.test(String(a)) ? da - dbb : String(a).localeCompare(String(b)); };
function applyFilters(list, params) {
  let rowsOut = list;
  for (const [rawKey, value] of params) {
    if (['select', 'order', 'offset', 'limit'].includes(rawKey)) continue;
    const key = unquote(rawKey);
    rowsOut = rowsOut.filter((r) => {
      const v = r[key];
      if (value === 'not.is.null') return v != null;
      if (value === 'is.null') return v == null;
      if (value.startsWith('eq.')) return String(v) === value.slice(3);
      if (value.startsWith('in.(')) return splitIn(value.slice(4, -1)).includes(String(v));
      if (value.startsWith('gte.')) return v != null && cmp(v, value.slice(4)) >= 0;
      if (value.startsWith('lte.')) return v != null && cmp(v, value.slice(4)) <= 0;
      if (value.startsWith('lt.')) return v != null && cmp(v, value.slice(3)) < 0;
      throw Error('Filtro não emulado: ' + rawKey + '=' + value);
    });
  }
  const offset = Number(params.get('offset') ?? 0), limit = params.get('limit');
  return limit ? rowsOut.slice(offset, offset + Number(limit)) : rowsOut.slice(offset);
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const EMAIL_HTML = '<!doctype html><html><head><title>QA</title></head><body style="font-family:sans-serif"><h1 style="color:#0a5f63">Copa Afinz Visa</h1><p>Peça seu cartão e participe.</p><script>try{window.parent.__scriptRan=true}catch(e){}document.body.insertAdjacentHTML("beforeend","<p id=ran>SCRIPT EXECUTOU</p>")</script></body></html>';

writeFileSync(out + '/index.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="bg-slate-50"><div id="root"></div><script type="module">
import React,{useEffect} from 'react';import {createRoot} from 'react-dom/client';import '/src/App.css';
import {PeriodProvider,usePeriod} from '/src/contexts/PeriodContext.tsx';import {AuthProvider} from '/src/context/AuthContext.tsx';import {UserRoleProvider} from '/src/context/UserRoleContext.tsx';import {BUProvider} from '/src/contexts/BUContext.tsx';
import {PerformanceView} from '/src/components/communications/performance/PerformanceView.tsx';
function Harness(){const {setPeriod}=usePeriod();useEffect(()=>{window.__setPeriod=(a,b)=>setPeriod(new Date(a+'T12:00:00'),new Date(b+'T12:00:00'));setTimeout(()=>{setPeriod(new Date('2026-09-01T12:00:00'),new Date('2026-09-30T12:00:00'));window.__ready=true;},150);},[]);return React.createElement('main',{className:'p-4'},React.createElement(PerformanceView));}
createRoot(document.getElementById('root')).render(React.createElement(AuthProvider,null,React.createElement(UserRoleProvider,null,React.createElement(PeriodProvider,null,React.createElement(BUProvider,null,React.createElement(Harness))))));</script></body></html>`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; const rpcCalls = []; const reqLog = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**', async (route) => {
  const req = route.request(); const url = new URL(req.url()); reqLog.push(req.method() + ' ' + decodeURIComponent(url.pathname + url.search).slice(0, 220));
  try {
    if (url.pathname.startsWith('/storage/v1/object/sign/')) {
      if (req.method() === 'POST') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedURL: url.pathname.replace('/storage/v1', '') + '?token=qa' }) });
      return route.fulfill({ status: 200, contentType: url.pathname.endsWith('.html') ? 'text/html' : 'image/png', body: url.pathname.endsWith('.html') ? EMAIL_HTML : PNG });
    }
    if (url.pathname === '/rest/v1/rpc/link_communication_executions') {
      const a = req.postDataJSON(); rpcCalls.push(a);
      const r = await db.query('select public.link_communication_executions($1,$2::jsonb,$3,$4,$5) n', [a.p_template, JSON.stringify(a.p_snapshots), a.p_start, a.p_end, a.p_evidence]);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.rows[0].n) });
    }
    if (url.pathname.startsWith('/auth/')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    const table = url.pathname.replace('/rest/v1/', '');
    let list;
    if (table === 'activities') list = (await db.query('select to_jsonb(a) r from activities a order by id')).rows.map((x) => x.r);
    else if (table in fixtures) list = fixtures[table];
    else throw Error('Tabela não emulada: ' + table);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(applyFilters(list, url.searchParams)) });
  } catch (e) { return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: e.message }) }); }
});
await page.route('https://**/*', (route) => (route.request().url().includes('supabase.co') ? route.fallback() : route.abort()));

const tab = (name) => page.getByRole('tab', { name });
const overviewText = async () => (await page.getByText('somente das execuções vinculadas', { exact: false }).locator('..').innerText()) + (await page.locator('main').innerText()).slice(0, 600);
const result = {};
try {
  await page.goto(`${BASE}/${out}/index.html`);
  await page.waitForFunction(() => window.__ready);
  await page.getByRole('tab', { name: /Com template vinculado/ }).waitFor({ timeout: 20000 });
  const waitTab = (re, text) => page.waitForFunction(([r, t]) => [...document.querySelectorAll('[role=tab]')].some((e) => new RegExp(r).test(e.textContent) && e.textContent.includes(t)), [re, text], { timeout: 20000 });
  await waitTab('Com template vinculado', '3 execuções vinculadas');

  // Contagens com unidades explícitas
  assert.match(await tab(/Com template vinculado/).innerText(), /2[\s\S]*templates[\s\S]*3 execuções vinculadas/);
  assert.match(await tab(/Disparos sem template/).innerText(), /3[\s\S]*grupos de execuções[\s\S]*4 execuções/);
  assert.match(await tab(/Comunicações aprovadas/).innerText(), /4[\s\S]*templates/);
  await page.screenshot({ path: out + '/01-galeria-vinculados.png', fullPage: true }); result.counts = true;

  // Prévia: miniatura clicável abre modal central; Escape fecha e devolve o foco
  const zoom = page.getByRole('button', { name: 'Ampliar prévia', exact: true }).first();
  await zoom.click(); const dlg = page.getByRole('dialog', { name: /^Prévia/ }); await dlg.waitFor();
  await page.screenshot({ path: out + '/02-modal-previa.png' });
  await page.keyboard.press('Escape'); await dlg.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Ampliar prévia'); result.preview_modal_focus = true;

  // Visão Geral isolada
  await page.getByRole('button', { name: 'Visão Geral' }).click();
  const before = await overviewText();
  assert.match(before, /2 templates · 3 execuções/);
  await page.screenshot({ path: out + '/03-visao-geral.png', fullPage: true });

  // Tabela: execução sem resultado não ganha score
  await page.getByRole('button', { name: 'Tabela' }).click();
  await page.getByText('Momento: Índice D1 (não comprovado)').first().waitFor();
  await page.screenshot({ path: out + '/04-tabela-vinculados.png', fullPage: true });

  // Visão 2
  await tab(/Disparos sem template/).click();
  await page.getByRole('button', { name: 'Revisar vínculo' }).first().waitFor();
  assert.equal(await page.getByRole('button', { name: 'Revisar vínculo' }).count(), 3);
  assert.equal(await page.getByText('2026-10', { exact: false }).count(), 0, 'execução de outubro não pode aparecer');
  await page.screenshot({ path: out + '/05-sem-template.png', fullPage: true });
  // Filtro limita a seleção do lote
  await page.getByRole('button', { name: 'Selecionar elegíveis' }).click();
  const batchBtn = page.getByRole('button', { name: /Vincular selecionados/ });
  assert.match(await batchBtn.innerText(), /1 grupo\(s\) · 2 exec/);
  await page.getByLabel('Frente / público').selectOption('Plurix');
  assert.match(await batchBtn.innerText(), /0 grupo\(s\) · 0 exec/); assert.equal(await batchBtn.isDisabled(), true);
  await page.getByLabel('Frente / público').selectOption('all');
  assert.match(await batchBtn.innerText(), /0 grupo/, 'seleção fora do filtro foi descartada');
  result.batch_respects_filters = true;
  // Lote: confirmação concreta, aplica só os IDs do grupo
  await page.getByRole('button', { name: 'Selecionar elegíveis' }).click();
  await batchBtn.click(); const batch = page.getByRole('dialog', { name: 'Vincular em lote' }); await batch.waitFor();
  const confirmBatch = batch.getByRole('button', { name: /Vincular 1 grupo/ });
  assert.equal(await confirmBatch.isDisabled(), true);
  await batch.getByRole('checkbox').check(); await batch.getByLabel('Evidência do lote').fill('Pack aprovado; jornada, atividade e canal conferidos em setembro');
  await page.screenshot({ path: out + '/06-lote-confirmacao.png' });
  await confirmBatch.click(); await batch.getByText('1 de 1 grupo(s) vinculados', { exact: false }).waitFor();
  await batch.getByRole('button', { name: 'Fechar', exact: true }).click();
  const linked = (await db.query(`select jornada, to_char("Data de Disparo" at time zone 'America/Sao_Paulo','YYYY-MM-DD') d, template_id from activities where "Activity name / Taxonomia"='afz_car_b2c_aqs_wpp_aba_disp2_pontual' order by d`)).rows;
  assert.deepEqual(linked.map((r) => r.template_id), [T.pack, T.pack, null, null], 'mesmo nome em outra jornada/fora do período permanece sem vínculo');
  assert.equal(rpcCalls.at(-1).p_snapshots.length, 2); assert.equal(rpcCalls.at(-1).p_start, '2026-09-01'); assert.equal(rpcCalls.at(-1).p_end, '2026-09-30');
  await waitTab('Disparos sem template', '2 execuções aguardando');
  assert.match(await tab(/Disparos sem template/).innerText(), /2[\s\S]*2 execuções/);
  assert.match(await tab(/Com template vinculado/).innerText(), /3[\s\S]*5 execuções vinculadas/);
  result.batch_moves_between_views = true;

  // Revisão individual: escolher outro template, exigir confirmação
  const plx = page.locator('tr', { hasText: 'afz_rep_plx_aqs_sms_ngd_disp3_padrao' });
  await plx.getByRole('button', { name: 'Revisar vínculo' }).click();
  const review = page.getByRole('dialog', { name: /afz_rep_plx/ }); await review.waitFor();
  await review.getByLabel('Buscar outro template').fill('plx_sms');
  await review.getByRole('button', { name: new RegExp(T.draft) }).click();
  const apply = review.getByRole('button', { name: /Vincular 1 execução/ });
  assert.equal(await apply.isDisabled(), true);
  await review.getByRole('checkbox').check(); assert.equal(await apply.isDisabled(), true, 'sem evidência não aplica');
  await review.getByLabel('Evidência do vínculo').fill('Conferido no SFMC: SMS D3 da régua Plurix Negados');
  await page.screenshot({ path: out + '/07-revisao-individual.png' });
  await apply.click(); await review.waitFor({ state: 'hidden' });
  assert.equal((await db.query(`select template_id from activities where jornada='JOR_AQS_PLX_NEGADOS'`)).rows[0].template_id, T.draft);
  // Sem sobrescrita: o RPC recusa execução já vinculada
  const snap = (await db.query(`select to_jsonb(a) s from activities a where jornada='JOR_AQS_PLX_NEGADOS'`)).rows[0].s;
  await assert.rejects(db.query('select public.link_communication_executions($1,$2::jsonb,$3,$4,$5)', [T.sms, JSON.stringify([snap]), '2026-09-01', '2026-09-30', 'teste']), /já vinculada|Canal/);
  result.individual_review = true;

  // Visão 3: biblioteca
  await tab(/Comunicações aprovadas/).click();
  await page.getByText('Sem execução vinculada neste período').first().waitFor();
  const libTab = await tab(/Comunicações aprovadas/).innerText();
  assert.match(libTab, /4[\s\S]*templates/);
  const drafts = page.getByText(/Incluir rascunhos \(\d+/);
  assert.match(await drafts.innerText(), /Incluir rascunhos \(1\)/);
  await page.screenshot({ path: out + '/08-biblioteca-tabela.png', fullPage: true });
  await drafts.click(); await page.waitForTimeout(200);
  assert.match(await tab(/Comunicações aprovadas/).innerText(), /5[\s\S]*inclui 1 rascunho/); result.drafts_toggle = true;
  await drafts.click();
  // HTML importado não executa script
  const emailRow = page.locator('tr', { hasText: T.email });
  await emailRow.getByRole('button', { name: 'Detalhes' }).click();
  const detail = page.getByRole('dialog', { name: new RegExp(T.email) }); await detail.waitFor();
  await detail.getByText('Sem execução vinculada neste período. Sem base, taxas, score ou datas atribuídas.').waitFor();
  await page.waitForTimeout(800);
  const frames = await page.locator('iframe').evaluateAll((els) => els.map((e) => e.getAttribute('sandbox')));
  assert.ok(frames.length > 0 && frames.every((s) => s != null && !s.includes('allow-scripts')));
  assert.equal(await page.evaluate(() => window.__scriptRan === true), false);
  for (const f of page.frames()) if (f !== page.mainFrame()) assert.equal(await f.locator('#ran').count().catch(() => 0), 0);
  await page.screenshot({ path: out + '/09-biblioteca-detalhe-email.png' });
  await page.keyboard.press('Escape'); await detail.waitFor({ state: 'hidden' }); result.html_no_scripts = true;

  // Visão Geral inalterada pela biblioteca/rascunhos (só mudou pelo vínculo real)
  await page.getByRole('button', { name: 'Visão Geral' }).click();
  assert.match(await overviewText(), /4 templates · 6 execuções/); result.overview_isolated = true;

  // Período: último dia em São Paulo
  await page.evaluate(() => window.__setPeriod('2026-09-30', '2026-09-30'));
  await page.getByText(/1 templates · 1 execuções/).waitFor({ timeout: 15000 });
  await page.evaluate(() => window.__setPeriod('2026-10-01', '2026-10-01'));
  await page.getByText(/0 templates · 0 execuções/).waitFor({ timeout: 15000 });
  result.period_last_day_sao_paulo = true;

  // Largura menor
  await page.evaluate(() => window.__setPeriod('2026-09-01', '2026-09-30'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Galeria' }).click();
  await tab(/Com template vinculado/).click(); await page.waitForTimeout(500);
  await page.screenshot({ path: out + '/10-mobile-galeria.png', fullPage: true });
  await page.getByRole('button', { name: 'Tabela' }).click(); await tab(/Disparos sem template/).click(); await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/11-mobile-tabela-sem-template.png', fullPage: true });
  await tab(/Com template vinculado/).click(); await page.getByRole('button', { name: /^Ampliar prévia de / }).first().click(); await page.getByRole('dialog', { name: /^Prévia/ }).waitFor();
  await page.screenshot({ path: out + '/12-mobile-modal.png' }); await page.keyboard.press('Escape');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  result.mobile_page_overflow_px = overflow;

  assert.equal(errors.length, 0, errors.join('\n'));
  writeFileSync(out + '/result.json', JSON.stringify({ ...result, rpc_calls: rpcCalls.length, errors }, null, 2));
  console.log('Content performance browser QA passed.', JSON.stringify(result));
} catch (e) {
  console.log(errors, reqLog.slice(-25)); console.log((await page.locator("body").innerText()).slice(0, 700));
  await page.screenshot({ path: out + '/failure.png', fullPage: true }); throw e;
} finally { await browser.close(); await db.close(); }
