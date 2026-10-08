import {PGlite} from '@electric-sql/pglite';
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const out='artifacts/scoped-links-qa';mkdirSync(out,{recursive:true});
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema gaas_sfmc_private;grant usage on schema public,auth,gaas_sfmc_private to authenticated;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table communication_templates(template_id text primary key,channel text);insert into communication_templates values('bb_wpp_vibe_ngd_D3','WhatsApp');create table activities(id uuid primary key default gen_random_uuid(),jornada text,"Activity name / Taxonomia" text,"Canal" text,"Data de Disparo" timestamptz,template_id text,updated_at timestamptz default now(),"BU" text,"Parceiro" text,"Segmento" text);insert into activities(jornada,"Activity name / Taxonomia","Canal","Data de Disparo","BU","Parceiro","Segmento") values('JOR_ANC_SET26','afz_car_bbt_aqs_wpp_anc_menordispvibe4_pontual','WhatsApp','2026-10-05T03:00:00Z','B2B2C','Bem Barato','Aprovados_nao_convertidos'),('OTHER','afz_car_bbt_aqs_wpp_anc_menordispvibe4_pontual','WhatsApp','2026-10-05T03:00:00Z','B2B2C','Bem Barato','Aprovados_nao_convertidos');`);
await db.exec(readFileSync('supabase/migrations/20261008135702_scoped_communication_links.sql','utf8'));
await db.query("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)");
const snapshots=(await db.query('select to_jsonb(a) s from activities a order by jornada')).rows.map(r=>r.s);
writeFileSync(out+'/index.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import '/src/App.css';import {ReconciliationQueue} from '/src/components/communications/ReconciliationQueue.tsx';import {parseActivity} from '/src/utils/taxonomy.ts';
const records=${JSON.stringify(snapshots)};
const content={schema_version:1,channel:'WhatsApp',body_text:'Seu cartão está pré-aprovado. Conclua seu pedido para aproveitar os benefícios Vibe.',body_params:[],footer:'Sujeito à análise de crédito',buttons:[{title:'Concluir pedido',type:'url'}],banner_url:null,sms_from:null};
const tpl={id:'bb_wpp_vibe_ngd_D3',channel:'WhatsApp',hasAsset:true,inCurrentFilter:true,dims:{publico:'bb',canal:'wpp',segmento:'negados',campanha:'vibe',seq:'D3'},raw:{template_id:'bb_wpp_vibe_ngd_D3',channel:'WhatsApp',metadata:{}}};
const rows=records.map((r,i)=>({uid:r.id,name:r['Activity name / Taxonomia'],jornada:r.jornada,channel:'wpp',canalLabel:'WhatsApp',segmentoLabel:'Aprovados não convertidos',subgrupoLabel:i?'D-7':'Diário',base:i?12:66,exec:1,latestDate:r['Data de Disparo'],executionRecords:[r],period:{start:'2026-10-01',end:'2026-10-31'},parsed:parseActivity(r['Activity name / Taxonomia']),match:{tpl,score:100,reasons:[{dim:'evidence',label:'Evidência',val:'ID no pack',ok:true}]},confidence:'forte',momentSuggestion:{label:'Disparo 4',dispatch:4,week:null,source:'parser'},packEvidence:{source:'pack',ids:[tpl.id],observedIds:[tpl.id],conflicts:[],reasons:[],versions:1,proposal:{message:{payload:{content}}}}}));
function Harness(){const [orphans,setOrphans]=useState(rows);return React.createElement('main',{className:'p-5'},React.createElement(ReconciliationQueue,{orphans,catalog:[tpl],onChanged:()=>setOrphans([]),onCreate:()=>{},onClearChannelFilter:()=>{}}));}createRoot(document.getElementById('root')).render(React.createElement(Harness));</script></body></html>`);
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**',async route=>{try{const a=route.request().postDataJSON();assert.ok(route.request().url().endsWith('/rpc/link_communication_executions'));const r=await db.query('select public.link_communication_executions($1,$2::jsonb,$3,$4,$5) n',[a.p_template,JSON.stringify(a.p_snapshots),a.p_start,a.p_end,a.p_evidence]);await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(r.rows[0].n)});}catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:e.message})});}});
await page.route('https://**/*',route=>route.request().url().includes('supabase.co')?route.fallback():route.abort());
try{
 await page.goto('http://127.0.0.1:3017/'+out+'/index.html');await page.getByText('Menor · reuso de Repescagem').first().waitFor({timeout:8000});
 await page.getByRole('button',{name:/^Ampliar prévia/}).first().click();await page.getByRole('dialog',{name:/^Prévia/}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('combobox').nth(2).selectOption('Diário');assert.equal(await page.getByRole('button',{name:'Vincular',exact:true}).count(),1);
 await page.screenshot({path:out+'/01-executions.png'});
 await page.getByRole('button',{name:/Vincular 1 matches fortes/}).click();await page.getByRole('dialog',{name:'Revisar vínculo de execuções'}).waitFor();
 assert.equal((await db.query('select count(*)::int n from communication_execution_links')).rows[0].n,0);
 assert.equal(await page.getByRole('button',{name:'Confirmar vínculos'}).isDisabled(),true);
 await page.getByLabel('Evidência do vínculo').fill('Reuso de Repescagem confirmado para esta execução e período');await page.screenshot({path:out+'/02-confirmation.png'});
 await page.getByRole('button',{name:'Confirmar vínculos'}).click();await page.getByText('Fila zerada.').waitFor();
 assert.equal((await db.query("select count(*)::int n from activities where template_id is not null")).rows[0].n,1);
 assert.equal((await db.query("select template_id from activities where jornada='OTHER'")).rows[0].template_id,null);
 assert.equal(errors.length,0,errors.join('\n'));writeFileSync(out+'/result.json',JSON.stringify({visual_preview:true,filtered_bulk:true,explicit_period_confirmation:true,scoped_atomic_rpc:true,other_journey_preserved:true,errors},null,2));console.log('Scoped execution browser QA passed.');
}catch(e){console.log(errors);console.log((await page.locator('body').innerText()).slice(-3000));await page.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();await db.close();}
